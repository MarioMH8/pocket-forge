import { existsSync, readdirSync, readFileSync, writeFileSync } from 'node:fs';
import path from 'node:path';

const ROOT_DIR = path.join(import.meta.dirname, '..', '..', '..');
const SOURCE_DIRS = [path.join(ROOT_DIR, 'packages'), path.join(ROOT_DIR, 'plugins')];
const OUTPUT_FILE = path.join(import.meta.dirname, '..', 'src', 'content', 'docs', 'guides', 'glossary.md');

interface GlossaryEntry {
	avoid: string;
	definition: string;
	packageName: string;
	term: string;
}

function extractGlossary(packageName: string, contextPath: string): GlossaryEntry[] {
	const content = readFileSync(contextPath, 'utf8');
	const entries: GlossaryEntry[] = [];

	// Match **Term**: followed by definition and optional _Avoid_ line
	const termRegex = /\*\*(?<term>[^*]+)\*\*:\s*\n(?<body>[\s\S]*?)(?=\n\*\*|$)/g;
	let match: null | RegExpExecArray;

	while ((match = termRegex.exec(content)) !== null) {
		const groups = match.groups;
		if (!groups) {
			continue;
		}
		const term = groups['term']?.trim();
		const body = groups['body']?.trim();
		if (!term || !body) {
			continue;
		}

		// Extract _Avoid_ line if present
		const avoidMatch = /_Avoid_:\s*(?<avoid>.+)/.exec(body);
		const avoid = avoidMatch?.groups?.['avoid']?.trim() ?? '';
		const definition = body.replace(/_Avoid_:\s*.+/, '').trim();

		entries.push({ avoid, definition, packageName, term });
	}

	return entries;
}

function generateGlossary(): void {
	const packages = SOURCE_DIRS.filter(existsSync).flatMap(directory =>
		readdirSync(directory, { withFileTypes: true })
			.filter(d => d.isDirectory())
			.map(d => ({ name: d.name, path: path.join(directory, d.name) }))
	);

	const allEntries: GlossaryEntry[] = [];

	for (const packageEntry of packages) {
		const contextPath = path.join(packageEntry.path, 'CONTEXT.md');
		if (existsSync(contextPath)) {
			const entries = extractGlossary(packageEntry.name, contextPath);
			allEntries.push(...entries);
		}
	}

	// Sort alphabetically by term
	allEntries.sort((a, b) => a.term.localeCompare(b.term));

	let output = `---
title: Glossary
description: Unified domain glossary for Pocket Forge
---

# Glossary

<!-- AUTO-GENERATED: Do not edit manually. Run \`bun run glossary\` to regenerate. -->

This glossary is extracted from the \`CONTEXT.md\` files of each bounded context.

`;

	for (const entry of allEntries) {
		output += `## ${entry.term}\n\n`;
		output += `${entry.definition}\n\n`;
		if (entry.avoid) {
			output += `**Avoid**: ${entry.avoid}\n\n`;
		}
		output += `<sub>Package: \`@pocket-forge/${entry.packageName}\`</sub>\n\n`;
		output += `---\n\n`;
	}

	writeFileSync(OUTPUT_FILE, output);

	if (import.meta.main) {
		console.log(
			`Glossary generated with ${String(allEntries.length)} entries from ${String(packages.length)} packages.`
		);
	}
}

if (import.meta.main) {
	generateGlossary();
}

export default generateGlossary;
