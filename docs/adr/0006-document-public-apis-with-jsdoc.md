# Document public APIs with JSDoc

Every public API surface in `src/` — classes, methods, properties, and exported functions — must carry JSDoc that
explains intent, contracts, and constraints. Internal helpers and trivial accessors may omit documentation when the
intent is self-evident from the surrounding context.

## What to document

- **Classes**: purpose, invariants, and relationship to the domain model.
- **Public methods**: preconditions, postconditions, side effects, and thrown errors.
- **Public properties**: meaning and constraints (e.g., "must be a non-empty string").
- **Factory functions** (`fromPrimitives`, `create`): expected shape of input and validation guarantees.

## Style

- Write for a reader who understands the domain but has never seen this specific module.
- Avoid restating the type signature in prose. Explain *why*, not *what*.
- Use `@throws` for every error the method can raise.
- Use `@param` and `@returns` only when the name or context does not make the intent obvious.
- Skip JSDoc on trivial getters, barrel files, and internal interfaces.
