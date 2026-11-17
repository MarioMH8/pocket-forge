import {
	MODIFY_ATTRIBUTE_ACTION_ID,
	REFERENCE_CONFIG_KEYS,
	REFERENCE_PLUGIN_ID,
	REFERENCE_PLUGIN_VERSION,
	ReferenceCombatPlugin,
} from '@pocket-forge/combat-reference/domain';
import { bindings } from '@pocket-forge/combat-reference/pack';
import type { ContentIndex } from '@pocket-forge/pack/domain';
import { capabilityName, ContentIndex as ContentIndexEntity } from '@pocket-forge/pack/domain';
import { describe, expect, it } from 'bun:test';

import { referenceActionSet, referenceCombat } from '../domain/support/reference.fixtures';

function contentIndex(): ContentIndex {
	return ContentIndexEntity.fromEntries([
		{
			id: 'power',
			kind: 'attributes',
			source: 'project',
			value: {
				constraints: { max: 100, min: 0 },
				defaultValue: 10,
				id: 'power',
				key: 'power',
				type: 'number',
			},
		},
	]);
}

function actionPluginBinding() {
	return bindings.find(binding => capabilityName(binding.capability) === 'CombatActionPlugin');
}

function actionPlugin(): ReferenceCombatPlugin {
	const binding = actionPluginBinding();

	if (!binding) {
		throw new Error('Expected the combat action plugin binding');
	}

	return binding.create(contentIndex()) as ReferenceCombatPlugin;
}

describe('combat-reference pack bindings', () => {
	it('binds the combat action plugin capability', () => {
		expect(bindings.map(binding => capabilityName(binding.capability))).toEqual(['CombatActionPlugin']);
	});

	it('creates the reference combat plugin from content', () => {
		const plugin = actionPlugin();

		expect(plugin).toBeInstanceOf(ReferenceCombatPlugin);
		expect(plugin.id).toBe(REFERENCE_PLUGIN_ID);
		expect(plugin.contractVersion).toBe(REFERENCE_PLUGIN_VERSION);
	});

	it('registers the modifyAttribute action descriptor', () => {
		const descriptor = actionPlugin().actions.find(MODIFY_ATTRIBUTE_ACTION_ID);

		expect(descriptor?.id).toBe('modifyAttribute');
		expect(descriptor?.configDefinitions.length).toBeGreaterThan(0);
	});

	it('passes the resolved attribute catalog to the plugin', () => {
		const actionSet = referenceActionSet({
			[REFERENCE_CONFIG_KEYS.amount]: 5,
			[REFERENCE_CONFIG_KEYS.attributeKey]: 'power',
			[REFERENCE_CONFIG_KEYS.operation]: 'add',
			[REFERENCE_CONFIG_KEYS.scope]: 'combatant',
		});
		const result = actionPlugin().resolve({
			actionSet,
			combat: referenceCombat(),
			input: {
				actorId: 'combatant-a',
				moveId: 'move-1',
				target: { id: 'combatant-a', scope: 'combatant' },
			},
		});

		expect(result.isRight()).toBe(true);

		const combatant = result
			.getRight()
			.combat.groups.flatMap(group => group.combatants)
			.find(entry => entry.id === 'combatant-a');

		expect(combatant?.attributes.toPrimitives()['power']).toBe(35);
	});
});
