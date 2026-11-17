import { token } from '@pocket-forge/pack/domain';

import type CombatCompletionRule from './combat-completion-rule';

/**
 * Capability token for the {@link CombatCompletionRule} port.
 *
 * The port is a pure interface and cannot key a binding map at runtime, so
 * Packs satisfy this token when they provide a completion rule.
 */
const COMBAT_COMPLETION_RULE = token<CombatCompletionRule>('CombatCompletionRule');

export default COMBAT_COMPLETION_RULE;
