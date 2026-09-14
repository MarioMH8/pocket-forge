# Use versioned declarative content

A Game Project’s persistent content is canonical JSON validated by versioned JSON Schemas. This lets designers use the visual editor, keeps content reviewable in version control, enables tooling outside TypeScript, and makes compatibility migrations explicit. TypeScript extensions may add trusted behavior, but executable code is not stored inside Content.
