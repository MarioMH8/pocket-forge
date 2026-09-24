import { execSync } from 'node:child_process';
import { existsSync, readdirSync, readFileSync, writeFileSync } from 'node:fs';
import path from 'node:path';

const ROOT_DIR = path.join(import.meta.dirname, '..', '..', '..');
const DOCS_DIR = path.join(ROOT_DIR, 'apps', 'docs');
const PACKAGES_DIR = path.join(ROOT_DIR, 'packages');
const API_OUTPUT_DIR = path.join(DOCS_DIR, 'src', 'content', 'docs', 'api');
const TYPEDOC_BIN = path.join(DOCS_DIR, 'node_modules', '.bin', 'typedoc');

function addFrontmatter(filePath: string, title: string): void {
	const content = readFileSync(filePath, 'utf8');
	// Remove the first heading (it becomes the frontmatter title)
	const withoutHeading = content.replace(/^# .+\n\n?/, '');
	const frontmatter = `---\ntitle: "${title}"\n---\n\n`;
	writeFileSync(filePath, frontmatter + withoutHeading);
}

function processDirectory(directory: string): void {
	if (!existsSync(directory)) {
		return;
	}

	const entries = readdirSync(directory, { withFileTypes: true });

	for (const entry of entries) {
		const fullPath = path.join(directory, entry.name);
		if (entry.isDirectory()) {
			processDirectory(fullPath);
		} else if (entry.name.endsWith('.md')) {
			// Extract title from the first heading in the file
			const content = readFileSync(fullPath, 'utf8');
			const headingMatch = /^# (?<title>.+)$/m.exec(content);
			const title = headingMatch?.groups?.['title'] ?? path.basename(entry.name, '.md');
			addFrontmatter(fullPath, title);
		}
	}
}

function generateTypedoc(): void {
	const packages = readdirSync(PACKAGES_DIR, { withFileTypes: true })
		.filter(d => d.isDirectory())
		.map(d => d.name);

	for (const packageName of packages) {
		const packageDirectory = path.join(PACKAGES_DIR, packageName);
		const typedocConfig = path.join(packageDirectory, 'typedoc.json');
		const outputDirectory = path.join(API_OUTPUT_DIR, packageName);

		if (!existsSync(typedocConfig)) {
			if (import.meta.main) {
				console.log(`Skipping ${packageName}: no typedoc.json`);
			}
			continue;
		}

		if (import.meta.main) {
			console.log(`Generating API docs for @pocket-forge/${packageName}...`);
		}

		const logLevel = import.meta.main ? 'Info' : 'Warn';

		execSync(
			`${TYPEDOC_BIN} --options ${typedocConfig} --out ${outputDirectory} --tsconfig ${path.join(ROOT_DIR, 'tsconfig.json')} --skipErrorChecking --logLevel ${logLevel}`,
			{ cwd: packageDirectory, stdio: 'inherit' }
		);

		processDirectory(outputDirectory);
	}

	if (import.meta.main) {
		console.log(`API docs generated for ${String(packages.length)} packages.`);
	}
}

if (import.meta.main) {
	generateTypedoc();
}

export default generateTypedoc;
