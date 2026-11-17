import type { Primitives } from '@hexadrop/types/primitives';
import { AttributeDefinition } from '@pocket-forge/attribute/domain';
import { COMBAT_ACTION_PLUGIN } from '@pocket-forge/combat/domain';
import SemverContractVersionValidator from '@pocket-forge/combat/infrastructure';
import type { Binding, ContentIndex } from '@pocket-forge/pack/domain';

import ReferenceCombatPlugin from '../domain/action/reference-combat.plugin';

/**
 * Reads the project attribute catalog from resolved content.
 *
 * Attribute definitions are validated on creation; the composition root owns
 * startup error handling, so invalid content throws.
 *
 * @param content - Content index supplied by the resolver.
 * @returns The project attribute definitions.
 */
function readAttributeDefinitions(content: ContentIndex): AttributeDefinition[] {
	return content
		.get('attributes')
		.map(entry => AttributeDefinition.create(entry.value as unknown as Primitives<AttributeDefinition>));
}

/**
 * Neutral bindings declared by the reference Pack.
 *
 * The Pack never imports a dependency-injection container; it only says how to
 * construct each capability from resolved content.
 */
const bindings: readonly Binding[] = [
	{
		capability: COMBAT_ACTION_PLUGIN,
		create: content =>
			new ReferenceCombatPlugin(new SemverContractVersionValidator(), readAttributeDefinitions(content)),
	},
];

// The Pack entrypoint contract is a named `bindings` export, not a default.
// eslint-disable-next-line import/prefer-default-export
export { bindings };
