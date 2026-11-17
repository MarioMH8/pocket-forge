import type { IndexedContentEntry } from '@pocket-forge/pack/domain';
import { ContentIndex } from '@pocket-forge/pack/domain';
import { describe, expect, it } from 'bun:test';

describe('ContentIndex', () => {
	const fire: IndexedContentEntry = {
		id: 'fire',
		kind: 'moves',
		source: 'core',
		value: { id: 'fire', name: 'Fire' },
	};
	const leaf: IndexedContentEntry = {
		id: 'leaf',
		kind: 'moves',
		source: 'core',
		value: { id: 'leaf', name: 'Leaf' },
	};
	const ember: IndexedContentEntry = {
		id: 'ember',
		kind: 'species',
		source: 'extra',
		value: { id: 'ember', name: 'Ember' },
	};
	const entries: readonly IndexedContentEntry[] = [fire, leaf, ember];

	it('gets every entry of a kind', () => {
		const index = ContentIndex.fromEntries(entries);

		expect(index.get('moves')).toEqual([fire, leaf]);
		expect(index.get('unknown')).toEqual([]);
	});

	it('finds an entry by kind and id', () => {
		const index = ContentIndex.fromEntries(entries);

		expect(index.find('moves', 'leaf')).toEqual(leaf);
		expect(index.find('moves', 'missing')).toBeUndefined();
	});

	it('lists kinds once in insertion order', () => {
		const index = ContentIndex.fromEntries(entries);

		expect(index.kinds()).toEqual(['moves', 'species']);
	});

	it('returns its entries as primitives', () => {
		const index = ContentIndex.fromEntries(entries);

		expect(index.toPrimitives()).toEqual(entries);
	});
});
