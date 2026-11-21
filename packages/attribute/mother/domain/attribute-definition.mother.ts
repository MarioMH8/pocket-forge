import { faker } from '@faker-js/faker';
import type { Primitives } from '@hexadrop/types/primitives';
import type { AttributeType } from '@pocket-forge/attribute/domain';
import { AttributeDefinition } from '@pocket-forge/attribute/domain';

export default class AttributeDefinitionMother {
	static array(overrides?: Partial<Primitives<AttributeDefinition>>): AttributeDefinition {
		return AttributeDefinition.create({
			constraints: overrides?.constraints ?? { itemType: 'string', maxLength: 10, minLength: 0 },
			defaultValue: overrides?.defaultValue ?? [],
			key: overrides?.key ?? 'tags',
			required: overrides?.required,
			type: 'array',
		});
	}

	static boolean(overrides?: Partial<Primitives<AttributeDefinition>>): AttributeDefinition {
		return AttributeDefinition.create({
			constraints: overrides?.constraints ?? {},
			defaultValue: overrides?.defaultValue ?? false,
			key: overrides?.key ?? 'isActive',
			required: overrides?.required,
			type: 'boolean',
		});
	}

	static create(overrides?: Partial<Primitives<AttributeDefinition>>): AttributeDefinition {
		const constraints = overrides?.constraints;
		const primitives: Primitives<AttributeDefinition> = {
			constraints: constraints ?? {},
			defaultValue: overrides?.defaultValue ?? faker.string.alpha(10),
			key: overrides?.key ?? faker.string.alpha({ length: { max: 20, min: 3 } }),
			required: overrides?.required,
			type: overrides?.type ?? 'string',
		};

		return AttributeDefinition.create(primitives);
	}

	static enum(overrides?: Partial<Primitives<AttributeDefinition>>): AttributeDefinition {
		return AttributeDefinition.create({
			constraints: overrides?.constraints ?? { validValues: ['fire', 'water', 'earth', 'air'] },
			defaultValue: overrides?.defaultValue ?? 'fire',
			key: overrides?.key ?? 'element',
			required: overrides?.required,
			type: 'enum',
		});
	}

	static fromPrimitives(overrides?: Partial<Primitives<AttributeDefinition>>): AttributeDefinition {
		const constraints = overrides?.constraints;
		const primitives: Primitives<AttributeDefinition> = {
			constraints: constraints ?? {},
			defaultValue: overrides?.defaultValue ?? faker.string.alpha(10),
			key: overrides?.key ?? faker.string.alpha({ length: { max: 20, min: 3 } }),
			required: overrides?.required,
			type: overrides?.type ?? 'string',
		};

		return AttributeDefinition.fromPrimitives(primitives);
	}

	static number(overrides?: Partial<Primitives<AttributeDefinition>>): AttributeDefinition {
		return AttributeDefinition.create({
			constraints: overrides?.constraints ?? { max: 999, min: 0 },
			defaultValue: overrides?.defaultValue ?? 0,
			key: overrides?.key ?? 'power',
			required: overrides?.required,
			type: 'number',
		});
	}

	static string(overrides?: Partial<Primitives<AttributeDefinition>>): AttributeDefinition {
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
			case 'string': {
				return this.string();
			}
		}
	}
}
