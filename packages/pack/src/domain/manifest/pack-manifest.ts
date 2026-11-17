import Either from '@hexadrop/either';

import type PackExtensionDeclaration from './pack-extension';
import PackManifestError from './pack-manifest.error';

/**
 * One contribution a Pack adds to the project.
 */
interface Contribution {
	/**
	 * Contribution kind, decided by the consuming subsystem.
	 */
	readonly kind: string;
	/**
	 * Content path relative to the Pack root.
	 */
	readonly path: string;
}

/**
 * Serialized shape of a Pack Manifest.
 */
interface PackManifestPrimitives {
	/**
	 * Content contract major declared per contribution kind.
	 */
	readonly contracts: Readonly<Record<string, number>>;
	/**
	 * Content contributions the Pack adds.
	 */
	readonly contributions: readonly Contribution[];
	/**
	 * Extensions the Pack declares.
	 */
	readonly extensions: readonly PackExtensionDeclaration[];
	/**
	 * Stable Pack identity.
	 */
	readonly id: string;
	/**
	 * Pack distribution version.
	 */
	readonly version: string;
}

/**
 * The single validated declaration of a Pack.
 */
class PackManifest {
	/**
	 * Content contract major declared per contribution kind.
	 */
	readonly contracts: Readonly<Record<string, number>>;
	/**
	 * Content contributions the Pack adds.
	 */
	readonly contributions: readonly Contribution[];
	/**
	 * Extensions the Pack declares.
	 */
	readonly extensions: readonly PackExtensionDeclaration[];
	/**
	 * Stable Pack identity.
	 */
	readonly id: string;
	/**
	 * Pack distribution version.
	 */
	readonly version: string;

	private constructor(primitives: PackManifestPrimitives) {
		this.contracts = Object.freeze({ ...primitives.contracts });
		this.contributions = Object.freeze([...primitives.contributions]);
		this.extensions = Object.freeze([...primitives.extensions]);
		this.id = primitives.id;
		this.version = primitives.version;
	}

	/**
	 * Validates every manifest field and aggregates all failures.
	 *
	 * @param primitives - Serialized manifest fields.
	 * @returns The manifest, or every validation failure.
	 */
	static create(primitives: PackManifestPrimitives): Either<PackManifestError[], PackManifest> {
		const errors: PackManifestError[] = [];

		if (!isNonEmpty(primitives.id)) {
			errors.push(new PackManifestError('invalid-id', 'Pack id is required', 'id'));
		}

		if (!isNonEmpty(primitives.version)) {
			errors.push(new PackManifestError('invalid-version', 'Pack version is required', 'version'));
		}

		for (const [index, contribution] of primitives.contributions.entries()) {
			if (!isNonEmpty(contribution.kind)) {
				errors.push(
					new PackManifestError(
						'invalid-contribution',
						`Contribution ${String(index)} kind is required`,
						`contributions.${String(index)}.kind`
					)
				);
			}

			if (!isNonEmpty(contribution.path)) {
				errors.push(
					new PackManifestError(
						'invalid-contribution',
						`Contribution ${String(index)} path is required`,
						`contributions.${String(index)}.path`
					)
				);
			}
		}

		for (const [key, value] of Object.entries(primitives.contracts)) {
			if (!isNonEmpty(key)) {
				errors.push(new PackManifestError('invalid-contract', 'Contract kind is required', `contracts.${key}`));
			}

			if (!Number.isSafeInteger(value) || value < 0) {
				errors.push(
					new PackManifestError(
						'invalid-contract',
						`Contract for '${key}' must be a safe integer greater than or equal to zero`,
						`contracts.${key}`
					)
				);
			}
		}

		for (const [index, extension] of primitives.extensions.entries()) {
			if (!isNonEmpty(extension.point)) {
				errors.push(
					new PackManifestError(
						'invalid-extension',
						`Extension ${String(index)} point is required`,
						`extensions.${String(index)}.point`
					)
				);
			}

			if (!isNonEmpty(extension.id)) {
				errors.push(
					new PackManifestError(
						'invalid-extension',
						`Extension ${String(index)} id is required`,
						`extensions.${String(index)}.id`
					)
				);
			}

			if (!isNonEmpty(extension.contractVersion)) {
				errors.push(
					new PackManifestError(
						'invalid-extension',
						`Extension ${String(index)} contract version is required`,
						`extensions.${String(index)}.contractVersion`
					)
				);
			}

			if (!isNonEmpty(extension.module)) {
				errors.push(
					new PackManifestError(
						'invalid-extension',
						`Extension ${String(index)} module is required`,
						`extensions.${String(index)}.module`
					)
				);
			}
		}

		if (errors.length > 0) {
			return Either.left(errors);
		}

		return Either.right(new PackManifest(primitives));
	}

	/**
	 * Returns the serialized manifest fields.
	 *
	 * @returns A copy of the manifest primitives.
	 */
	toPrimitives(): PackManifestPrimitives {
		return {
			contracts: { ...this.contracts },
			contributions: [...this.contributions],
			extensions: [...this.extensions],
			id: this.id,
			version: this.version,
		};
	}
}

function isNonEmpty(value: string): boolean {
	return typeof value === 'string' && value.trim().length > 0;
}

export type { Contribution, PackManifestPrimitives };
export default PackManifest;
