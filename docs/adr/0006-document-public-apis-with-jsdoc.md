# Document public APIs with JSDoc

Every public API surface in `src/` — classes, methods, properties, and exported functions — must carry JSDoc that
explains intent, contracts, and constraints. Internal helpers and trivial accessors may omit documentation when the
intent is self-evident from the surrounding context.

## What to document

- **Classes**: purpose, invariants, and relationship to the domain model.
- **Public methods**: preconditions, postconditions, side effects, and thrown errors.
- **Public properties**: meaning and constraints (e.g., "must be a non-empty string").
- **Factory functions** (`fromPrimitives`, `create`): expected shape of input and validation guarantees.
- **Command / Query handlers**: what they orchestrate, which events they publish, and error propagation strategy.
- **Repository interfaces**: contract semantics for each method (lookup, upsert, delete).

## Style

- Write for a reader who understands the domain but has never seen this specific module.
- Avoid restating the type signature in prose. Explain *why*, not *what*.
- Use `@throws` for every error the method can raise.
- Use `@param` and `@returns` only when the name or context does not make the intent obvious.
- Include `@example` code blocks for non-trivial factory methods and validation entry points.
- Use `{@link ClassName}` to cross-reference related domain types within the same package.
- Skip JSDoc on trivial getters, barrel files, and internal interfaces.

## Checklist

When reviewing a public API, verify:

1. The class JSDoc explains its role in the domain model.
2. Every public method has `@param` / `@returns` / `@throws` as appropriate.
3. Factory methods (`create`, `fromPrimitives`) include a usage example.
4. Public properties carry a one-line description of their meaning.
5. `@throws` tags use the `{ErrorClass}` syntax for type-safe documentation.
