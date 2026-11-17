import Either from '@hexadrop/either';

import type { Binding, Capability } from '../binding';
import { capabilityName } from '../binding';
import type { ContentEntryPrimitives, IndexedContentEntry } from '../content';
import { ContentIndex } from '../content';
import type { Contribution } from '../manifest';
import type { GameDefinition, PackSelection, ResolvedPackExtension, ResolveInput } from './game-definition';
import type PackContentReader from './pack-content-reader';
import PackError from './pack-error';
import type { PackWarning } from './pack-warning';
import type { BindingProvenance, ContentProvenance } from './provenance';

interface MergedContentEntry {
	readonly id: string;
	readonly kind: string;
	readonly sources: string[];
	readonly value: Readonly<Record<string, unknown>>;
}

interface ReadContribution {
	readonly contribution: Contribution;
	readonly pack: PackSelection;
	readonly value: unknown;
}

interface BindingCandidate {
	readonly binding: Binding;
	readonly source: string;
}

interface MutableBindingProvenance {
	readonly capability: string;
	readonly shadowed: string[];
	winner: string;
}

/**
 * Turns selected Packs into a neutral Game Definition.
 *
 * The resolver validates manifests, contributions, contracts, overrides, and
 * extensions, then merges content and bindings. It knows no gameplay subsystem
 * and no dependency-injection container.
 */
class PackResolver {
	constructor(private readonly reader: PackContentReader) {}

	/**
	 * Resolves selected Packs, their content, bindings, extensions, and overrides.
	 *
	 * @param input - Packs, accepted contracts, project bindings, and overrides.
	 * @returns The game definition, or every resolution failure.
	 */
	async resolve(input: ResolveInput): Promise<Either<PackError[], GameDefinition>> {
		const errors: PackError[] = [];
		const reads = await this.readContributions(input, errors);

		if (reads === undefined) {
			return Either.left(errors);
		}

		const merged = this.indexContent(input, reads, errors);
		this.applyOverrides(input, merged, errors);
		this.collectCollisions(merged, errors);
		const extensions = this.resolveExtensions(input, errors);

		if (errors.length > 0) {
			return Either.left(errors);
		}

		const bindings = this.resolveBindings(input);
		const entries: IndexedContentEntry[] = Array.from(merged.values(), entry => ({
			id: entry.id,
			kind: entry.kind,
			source: entry.sources[0] ?? 'project',
			value: entry.value,
		}));
		const contentProvenance: ContentProvenance[] = Array.from(merged.values(), entry => ({
			id: entry.id,
			kind: entry.kind,
			sources: [...entry.sources],
		}));

		return Either.right({
			bindings: bindings.bindings,
			content: ContentIndex.fromEntries(entries),
			diagnostics: bindings.diagnostics,
			extensions,
			provenance: {
				bindings: bindings.provenance,
				content: contentProvenance,
			},
		});
	}

	private applyOverrides(input: ResolveInput, merged: Map<string, MergedContentEntry>, errors: PackError[]): void {
		const targets = new Set<string>();
		const overrides = input.overrides ?? [];

		for (const [index, override] of overrides.entries()) {
			const target = contentKey(override.kind, override.id);

			if (targets.has(target)) {
				errors.push(
					new PackError(
						'invalid-override',
						`Override '${override.kind}/${override.id}' is declared more than once`,
						`overrides.${String(index)}`
					)
				);
				continue;
			}

			targets.add(target);
			const existing = merged.get(target);

			if (!existing) {
				errors.push(
					new PackError(
						'invalid-override',
						`Override '${override.kind}/${override.id}' targets content that does not exist`,
						`overrides.${String(index)}`
					)
				);
				continue;
			}

			if (override.operation === 'remove') {
				merged.delete(target);
				continue;
			}

			if (!isPlainRecord(override.value) || override.value['id'] !== override.id) {
				errors.push(
					new PackError(
						'invalid-override',
						`Replace override '${override.kind}/${override.id}' must be a plain object whose id matches the override`,
						`overrides.${String(index)}`
					)
				);
				continue;
			}

			merged.set(target, {
				id: override.id,
				kind: override.kind,
				sources: ['project'],
				value: override.value,
			});
		}
	}

	private collectCollisions(merged: Map<string, MergedContentEntry>, errors: PackError[]): void {
		for (const entry of merged.values()) {
			if (entry.sources.length > 1) {
				errors.push(
					new PackError(
						'duplicate-content-id',
						`Content '${entry.kind}/${entry.id}' is contributed by multiple packs: ${entry.sources.join(', ')}`,
						`${entry.kind}.${entry.id}`
					)
				);
			}
		}
	}

	private indexContent(
		input: ResolveInput,
		reads: readonly ReadContribution[],
		errors: PackError[]
	): Map<string, MergedContentEntry> {
		const merged = new Map<string, MergedContentEntry>();

		for (const read of reads) {
			const accepted = input.acceptedContracts[read.contribution.kind];

			this.validateContract(read.pack, read.contribution, accepted, errors);

			if (!Array.isArray(read.value)) {
				errors.push(
					new PackError(
						'invalid-content',
						`Contribution '${read.contribution.path}' must contain an array of entries`,
						read.contribution.path,
						read.pack.manifest.id
					)
				);
				continue;
			}

			this.indexEntries(read, read.value, merged, errors);
		}

		return merged;
	}

	private indexEntries(
		read: ReadContribution,
		entries: readonly unknown[],
		merged: Map<string, MergedContentEntry>,
		errors: PackError[]
	): void {
		const ids = new Set<string>();

		for (const [index, entry] of entries.entries()) {
			if (!isContentEntry(entry)) {
				errors.push(
					new PackError(
						'invalid-content',
						`Entry ${String(index)} in '${read.contribution.path}' must be an object with a non-empty string id`,
						`${read.contribution.path}.${String(index)}`,
						read.pack.manifest.id
					)
				);
				continue;
			}

			if (ids.has(entry.id)) {
				errors.push(
					new PackError(
						'invalid-content',
						`Contribution '${read.contribution.path}' declares the content id '${entry.id}' more than once`,
						`${read.contribution.path}.${String(index)}`,
						read.pack.manifest.id
					)
				);
				continue;
			}

			ids.add(entry.id);
			this.mergeEntry(merged, read.contribution.kind, entry, read.pack.manifest.id);
		}
	}

	private mergeEntry(
		merged: Map<string, MergedContentEntry>,
		kind: string,
		entry: ContentEntryPrimitives,
		packId: string
	): void {
		const target = contentKey(kind, entry.id);
		const existing = merged.get(target);

		if (existing) {
			existing.sources.push(packId);

			return;
		}

		merged.set(target, {
			id: entry.id,
			kind,
			sources: [packId],
			value: entry,
		});
	}

	private async readContributions(input: ResolveInput, errors: PackError[]): Promise<ReadContribution[] | undefined> {
		const requests = input.packs.flatMap(pack =>
			pack.manifest.contributions.map(contribution => ({ contribution, pack }))
		);
		const settled = await Promise.all(
			requests.map(async request => ({
				request,
				result: await this.reader.read(request.pack.root, request.contribution),
			}))
		);
		const reads: ReadContribution[] = [];
		let isFailed = false;

		for (const { request, result } of settled) {
			if (result.isLeft()) {
				errors.push(...result.getLeft());
				isFailed = true;
				continue;
			}

			reads.push({ contribution: request.contribution, pack: request.pack, value: result.getRight() });
		}

		return isFailed ? undefined : reads;
	}

	private resolveBindings(input: ResolveInput): {
		readonly bindings: readonly Binding[];
		readonly diagnostics: readonly PackWarning[];
		readonly provenance: readonly BindingProvenance[];
	} {
		const candidates: BindingCandidate[] = [];
		const winners = new Map<Capability<unknown>, BindingCandidate>();
		const provenance = new Map<Capability<unknown>, MutableBindingProvenance>();
		const diagnostics: PackWarning[] = [];

		for (const pack of input.packs) {
			for (const binding of pack.bindings) {
				candidates.push({ binding, source: pack.manifest.id });
			}
		}

		const projectBindings = input.bindings ?? [];

		for (const binding of projectBindings) {
			candidates.push({ binding, source: 'project' });
		}

		for (const candidate of candidates) {
			const capability = candidate.binding.capability;
			const existing = winners.get(capability);

			if (existing) {
				let record = provenance.get(capability);

				if (!record) {
					record = {
						capability: capabilityName(capability),
						shadowed: [],
						winner: existing.source,
					};
					provenance.set(capability, record);
				}

				record.shadowed.push(existing.source);
				record.winner = candidate.source;
				diagnostics.push({
					message: `Binding for '${record.capability}' from '${existing.source}' was shadowed by '${candidate.source}'`,
					path: `bindings.${record.capability}`,
					reason: 'shadowed-binding',
				});
			}

			winners.set(capability, candidate);
		}

		return {
			bindings: Array.from(winners.values(), candidate => candidate.binding),
			diagnostics,
			provenance: Array.from(provenance.values(), record => ({
				capability: record.capability,
				shadowed: [...record.shadowed],
				winner: record.winner,
			})),
		};
	}

	private resolveExtensions(input: ResolveInput, errors: PackError[]): ResolvedPackExtension[] {
		const extensions: ResolvedPackExtension[] = [];
		const seen = new Set<string>();
		const declarations = input.packs.flatMap(pack =>
			pack.manifest.extensions.map(extension => ({ extension, pack }))
		);

		for (const [index, { extension, pack }] of declarations.entries()) {
			const target = contentKey(extension.point, extension.id);

			if (seen.has(target)) {
				errors.push(
					new PackError(
						'duplicate-extension',
						`Extension '${extension.point}/${extension.id}' is declared more than once`,
						`extensions.${String(index)}`,
						pack.manifest.id
					)
				);
				continue;
			}

			seen.add(target);
			extensions.push({ ...extension, source: pack.manifest.id });
		}

		return extensions;
	}

	private validateContract(
		pack: PackSelection,
		contribution: Contribution,
		accepted: readonly number[] | undefined,
		errors: PackError[]
	): void {
		const packId = pack.manifest.id;

		if (accepted === undefined) {
			errors.push(
				new PackError(
					'unknown-kind',
					`Kind '${contribution.kind}' is not accepted by the project`,
					`contracts.${contribution.kind}`,
					packId
				)
			);

			return;
		}

		const declared = pack.manifest.contracts[contribution.kind];

		if (declared === undefined) {
			errors.push(
				new PackError(
					'missing-contract',
					`Pack '${packId}' does not declare a contract for kind '${contribution.kind}'`,
					`contracts.${contribution.kind}`,
					packId
				)
			);

			return;
		}

		if (!accepted.includes(declared)) {
			errors.push(
				new PackError(
					'unsupported-contract',
					`Pack '${packId}' declares contract ${String(declared)} for kind '${contribution.kind}', accepted: ${accepted.join(', ')}`,
					`contracts.${contribution.kind}`,
					packId
				)
			);
		}
	}
}

function contentKey(kind: string, id: string): string {
	return `${kind}\u{0}${id}`;
}

function isContentEntry(value: unknown): value is ContentEntryPrimitives {
	return isRecord(value) && typeof value['id'] === 'string' && value['id'].trim().length > 0;
}

function isPlainRecord(value: unknown): value is Readonly<Record<string, unknown>> {
	if (!isRecord(value)) {
		return false;
	}

	const prototype = Object.getPrototypeOf(value) as null | object;

	return prototype === Object.prototype || prototype === null;
}

function isRecord(value: unknown): value is Readonly<Record<string, unknown>> {
	return typeof value === 'object' && value !== null && !Array.isArray(value);
}

export default PackResolver;
