import type { ContractVersionValidator } from '@pocket-forge/combat/domain';

const EXACT_VERSION = /^\d+\.\d+\.\d+$/;
const VERSION_RANGE = /^(?:\*|\^?\d+\.\d+\.\d+)$/;

/**
 * Minimal semver-like validator used to exercise Combat extension contracts
 * without depending on the infrastructure adapter.
 */
export default class FakeContractVersionValidator implements ContractVersionValidator {
	private static compare(left: readonly number[], right: readonly number[]): number {
		for (let index = 0; index < 3; index += 1) {
			const leftPart = left[index] ?? 0;
			const rightPart = right[index] ?? 0;

			if (leftPart !== rightPart) {
				return leftPart < rightPart ? -1 : 1;
			}
		}

		return 0;
	}

	isValid(version: string): boolean {
		return EXACT_VERSION.test(version);
	}

	isValidRange(range: string): boolean {
		return VERSION_RANGE.test(range);
	}

	satisfies(version: string, range: string): boolean {
		if (!this.isValid(version) || !this.isValidRange(range)) {
			return false;
		}

		if (range === '*') {
			return true;
		}

		const isCaret = range.startsWith('^');
		const rangeParts = (isCaret ? range.slice(1) : range).split('.').map(Number);
		const versionParts = version.split('.').map(Number);
		const comparison = FakeContractVersionValidator.compare(versionParts, rangeParts);

		return isCaret ? versionParts[0] === rangeParts[0] && comparison >= 0 : comparison === 0;
	}
}
