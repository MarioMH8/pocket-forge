import { AttributeDefinitionMother } from '@pocket-forge/attribute/mother/domain';
import { describe, expect, it } from 'bun:test';

import MoveMother from '../../mother/domain/move.mother';
import Move from '../../src/domain/move';

describe('Move', () => {
	describe('create', () => {
		it('creates a move with valid attributes', () => {
			const definition = AttributeDefinitionMother.create();
			const move = Move.create('move-1', 'Tackle', 'A basic charge', [], [definition]);

			expect(move.id).toBe('move-1');
			expect(move.name).toBe('Tackle');
			expect(move.description).toBe('A basic charge');
		});

		it('throws when id is empty', () => {
			const definition = AttributeDefinitionMother.create();
			expect(() => Move.create('', 'Name', 'Desc', [], [definition])).toThrow();
		});

		it('throws when name is empty', () => {
			const definition = AttributeDefinitionMother.create();
			expect(() => Move.create('id', '', 'Desc', [], [definition])).toThrow();
		});
	});

	describe('fromPrimitives / toPrimitives', () => {
		it('round-trips', () => {
			const primitives = MoveMother.primitives();
			const move = Move.fromPrimitives(primitives);

			expect(move.toPrimitives()).toEqual(primitives);
		});
	});

	describe('getAttribute', () => {
		it('returns the attribute value when set', () => {
			const move = MoveMother.create({
				attributes: { power: 80 },
			});

			expect(move.getAttribute('power')).toBe(80);
		});

		it('returns undefined for missing attribute', () => {
			const move = MoveMother.create();

			expect(move.getAttribute('nonexistent')).toBeUndefined();
		});
	});
});
