import type { Binding } from '../binding';
import type { ContentIndex, ContentOverride } from '../content';
import type { PackExtensionDeclaration, PackManifest } from '../manifest';
import type { PackWarning } from './pack-warning';
import type { Provenance } from './provenance';

/**
 * One selected Pack: its validated manifest, root directory, and bindings.
 */
interface PackSelection {
	/**
	 * Bindings declared by the Pack.
	 */
	readonly bindings: readonly Binding[];
	/**
	 * Validated Pack manifest.
	 */
	readonly manifest: PackManifest;
	/**
	 * Directory that contribution and extension paths are relative to.
	 */
	readonly root: string;
}

/**
 * Everything the resolver needs to turn selected Packs into a Game Definition.
 */
interface ResolveInput {
	/**
	 * Kinds the app can consume, and the contract majors it accepts for each.
	 */
	readonly acceptedContracts: Readonly<Record<string, readonly number[]>>;
	/**
	 * Project bindings. Applied after every pack, so they win.
	 */
	readonly bindings?: readonly Binding[];
	/**
	 * Project content overrides. Applied after every pack.
	 */
	readonly overrides?: readonly ContentOverride[];
	/**
	 * Selected Packs, in selection order.
	 */
	readonly packs: readonly PackSelection[];
}

/**
 * Extension declaration after resolution, with the Pack that declared it.
 */
interface ResolvedPackExtension extends PackExtensionDeclaration {
	/**
	 * Pack id that declared the extension.
	 */
	readonly source: string;
}

/**
 * Neutral result of resolving selected Packs.
 */
interface GameDefinition {
	/**
	 * Winning bindings by capability.
	 */
	readonly bindings: readonly Binding[];
	/**
	 * Validated content of every selected Pack.
	 */
	readonly content: ContentIndex;
	/**
	 * Non-blocking diagnostics produced by resolution.
	 */
	readonly diagnostics: readonly PackWarning[];
	/**
	 * Extension declarations declared by every Pack.
	 */
	readonly extensions: readonly ResolvedPackExtension[];
	/**
	 * Record of which Pack contributed each piece and which bindings were shadowed.
	 */
	readonly provenance: Provenance;
}

export type { GameDefinition, PackSelection, ResolvedPackExtension, ResolveInput };
