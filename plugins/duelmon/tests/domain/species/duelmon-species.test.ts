import { DuelmonCatalog } from '@pocket-forge/duelmon/catalog';
import { DuelmonSpecies } from '@pocket-forge/duelmon/domain';
import { DuelmonDatasetMother } from '@pocket-forge/duelmon-dataset/mother/domain';
import { describe, expect, it } from 'bun:test';

function catalog(): DuelmonCatalog {
	return DuelmonCatalog.fromDataset(DuelmonDatasetMother.create()).getRight();
}

function catalogSpecies(id: string): DuelmonSpecies {
	const found = catalog().findSpecies(id);

	if (!found) {
		throw new Error(`Missing fixture species "${id}"`);
	}

	return DuelmonSpecies.fromSpecies(found);
}

describe('DuelmonSpecies', () => {
	it('exposes types and base stats as typed getters', () => {
		const species = catalogSpecies('emberling');

		expect(species.types).toEqual(['Fire']);
		expect(species.baseHp).toBe(39);
		expect(species.baseAtk).toBe(52);
		expect(species.baseDef).toBe(43);
		expect(species.baseSpecial).toBe(60);
		expect(species.baseSpeed).toBe(65);
	});

	it('exposes the base stats in the shape the Gen 1 formula consumes', () => {
		expect(catalogSpecies('aquafin').baseStats()).toEqual({
			baseAtk: 48,
			baseDef: 65,
			baseHp: 44,
			baseSpecial: 50,
			baseSpeed: 43,
		});
	});

	it('round-trips the wrapped snapshot', () => {
		const species = catalogSpecies('emberling');

		expect(DuelmonSpecies.fromPrimitives(species.toPrimitives()).toPrimitives()).toEqual(species.toPrimitives());
	});

	it('throws when a base stat is missing', () => {
		const species = DuelmonSpecies.fromPrimitives({ attributes: { types: ['Fire'] }, id: 'broken' });

		expect(() => species.baseHp).toThrow();
	});

	it('throws when a type is outside Gen 1', () => {
		const species = DuelmonSpecies.fromPrimitives({
			attributes: {
				baseAtk: 1,
				baseDef: 1,
				baseHp: 1,
				baseSpecial: 1,
				baseSpeed: 1,
				types: ['Cosmic'],
			},
			id: 'broken',
		});

		expect(() => species.types).toThrow();
	});
});
