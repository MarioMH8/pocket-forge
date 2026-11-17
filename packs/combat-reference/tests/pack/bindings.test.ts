import type { CombatActionPlugin } from '@pocket-forge/combat/domain';
import {
	MODIFY_ATTRIBUTE_ACTION_ID,
	REFERENCE_PLUGIN_ID,
	REFERENCE_PLUGIN_VERSION,
} from '@pocket-forge/combat-reference/domain';
import { bindings } from '@pocket-forge/combat-reference/pack';
import type { ContentIndex } from '@pocket-forge/pack/domain';
import { capabilityName, ContentIndex as ContentIndexEntity } from '@pocket-forge/pack/domain';
import { describe, expect, it } from 'bun:test';

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

describe('combat-reference pack bindings', () => {
	it('binds the combat action plugin capability', () => {
		expect(bindings.map(binding => capabilityName(binding.capability))).toEqual(['CombatActionPlugin']);
	});

	it('creates the reference combat plugin from content', () => {
		const binding = actionPluginBinding();

		expect(binding).toBeDefined();
		const plugin = binding?.create(contentIndex()) as CombatActionPlugin;

		expect(plugin.id).toBe(REFERENCE_PLUGIN_ID);
		expect(plugin.contractVersion).toBe(REFERENCE_PLUGIN_VERSION);
	});

	it('registers the modifyAttribute action descriptor', () => {
		const binding = actionPluginBinding();
		const plugin = binding?.create(contentIndex()) as CombatActionPlugin;
		const descriptor = plugin.actions.find(MODIFY_ATTRIBUTE_ACTION_ID);

		expect(descriptor?.id).toBe('modifyAttribute');
		expect(descriptor?.configDefinitions.length).toBeGreaterThan(0);
	});
});
