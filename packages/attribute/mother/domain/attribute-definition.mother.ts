import { faker } from '@faker-js/faker';
import type { AttributeDefinitionPrimitives, AttributeType } from '@pocket-forge/attribute/domain';
import { AttributeDefinition } from '@pocket-forge/attribute/domain';

export default class AttributeDefinitionMother {
	static array(overrides?: Partial<AttributeDefinitionPrimitives>): AttributeDefinition {
		return AttributeDefinition.create({
			constraints: overrides?.constraints ?? { itemType: 'string', maxLength: 10, minLength: 0 },
			defaultValue: overrides?.defaultValue ?? [],
			key: overrides?.key ?? 'tags',
			required: overrides?.required,
			type: 'array',
		});
	}

	static boolean(overrides?: Partial<AttributeDefinitionPrimitives>): AttributeDefinition {
		return AttributeDefinition.create({
			constraints: overrides?.constraints ?? {},
			defaultValue: overrides?.defaultValue ?? false,
			key: overrides?.key ?? 'isActive',
			required: overrides?.required,
			type: 'boolean',
		});
	}

	static create(overrides?: Partial<AttributeDefinitionPrimitives>): AttributeDefinition {
		const constraints = overrides?.constraints;
		const primitives: AttributeDefinitionPrimitives = {
			constraints: constraints ?? {},
			defaultValue: overrides?.defaultValue ?? faker.string.alpha(10),
			key: overrides?.key ?? faker.string.alpha({ length: { max: 20, min: 3 } }),
			required: overrides?.required,
			type: overrides?.type ?? 'string',
		};

		return AttributeDefinition.create(primitives);
	}

	static enum(overrides?: Partial<AttributeDefinitionPrimitives>): AttributeDefinition {
		return AttributeDefinition.create({
			constraints: overrides?.constraints ?? { validValues: ['fire', 'water', 'earth', 'air'] },
			defaultValue: overrides?.defaultValue ?? 'fire',
			key: overrides?.key ?? 'element',
			required: overrides?.required,
			type: 'enum',
		});
	}

	static fromPrimitives(overrides?: Partial<AttributeDefinitionPrimitives>): AttributeDefinition {
		const constraints = overrides?.constraints;
		const primitives: AttributeDefinitionPrimitives = {
			constraints: constraints ?? {},
			defaultValue: overrides?.defaultValue ?? faker.string.alpha(10),
			key: overrides?.key ?? faker.string.alpha({ length: { max: 20, min: 3 } }),
			required: overrides?.required,
			type: overrides?.type ?? 'string',
		};

		return AttributeDefinition.fromPrimitives(primitives);
	}

	static number(overrides?: Partial<AttributeDefinitionPrimitives>): AttributeDefinition {
		return AttributeDefinition.create({
			constraints: overrides?.constraints ?? { max: 999, min: 0 },
			defaultValue: overrides?.defaultValue ?? 0,
			key: overrides?.key ?? 'power',
			required: overrides?.required,
			type: 'number',
		});
	}

	static record(overrides?: Partial<AttributeDefinitionPrimitives>): AttributeDefinition {
		return AttributeDefinition.create({
			constraints: overrides?.constraints ?? {
				fields: [this.number({ defaultValue: 0, key: 'stages', required: true })],
			},
			defaultValue: overrides?.defaultValue ?? {},
			key: overrides?.key ?? 'boosts',
			required: overrides?.required,
			type: 'record',
		});
	}

	static string(overrides?: Partial<AttributeDefinitionPrimitives>): AttributeDefinition {
		return AttributeDefinition.create({
			constraints: overrides?.constraints ?? { maxLength: 100, minLength: 1 },
			defaultValue: overrides?.defaultValue ?? 'default',
			key: overrides?.key ?? 'name',
			required: overrides?.required,
			type: 'string',
		});
	}

	static withType(type: AttributeType): AttributeDefinition {
		switch (type) {
			case 'array': {
				return this.array();
			}
			case 'boolean': {
				return this.boolean();
			}
			case 'enum': {
				return this.enum();
			}
			case 'number': {
				return this.number();
			}
			case 'record': {
				return this.record();
			}
			case 'string': {
				return this.string();
			}
		}
	}
}
