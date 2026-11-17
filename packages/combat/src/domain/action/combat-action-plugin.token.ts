import { token } from '@pocket-forge/pack/domain';

import type { CombatActionPlugin } from './combat-action-plugin';

/**
 * Capability token for the {@link CombatActionPlugin} port.
 *
 * The port is a pure interface and cannot key a binding map at runtime, so
 * Packs satisfy this token when they provide an action plugin.
 */
const COMBAT_ACTION_PLUGIN = token<CombatActionPlugin>('CombatActionPlugin');

export default COMBAT_ACTION_PLUGIN;
