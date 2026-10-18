// Port of calcDomMigPop() (fct_demography.R): net interprovincial migration
// for one 5-year period, as a 36 x 14 matrix (column 0 = Canada = zeros).

import type { MigScenario } from './types';

export function calcDomMigPop(
	scenario: MigScenario,
	flowMatAve: number[][],
	cmaMat: number[][],
	resMat: number[][],
	immStart: number,
	immEnd: number,
	pop0: number[], // 13 province totals at period 1
	pop1: number[], // 13 province totals at the current period
	outSums: number[][] // calcOut() result: [province][36]
): number[][] {
	const span = immEnd - immStart + 1;
	const net: number[][] = Array.from({ length: 36 }, () => new Array<number>(14).fill(0));
	if (scenario === 'none') return net;

	const sceMat = scenario === 'ave' ? flowMatAve : scenario === 'cma' ? cmaMat : resMat;
	// Out-migrants scaled to a 5-year total and to current population levels.
	// The R original multiplies by 5/span once here and once more on the net
	// flows below; preserved as-is for parity.
	const outM5: number[][] = outSums.map((rows, p) =>
		rows.map((v) => v * (5 / span) * (pop1[p] / pop0[p]))
	);
	for (let i = 0; i < 36; i++) {
		const outRow = outM5.map((rows) => rows[i]); // 13 origins
		for (let d = 0; d < 13; d++) {
			let inflow = 0;
			for (let o = 0; o < 13; o++) inflow += outRow[o] * sceMat[o][d];
			net[i][d + 1] = Math.ceil((inflow - outRow[d]) * (5 / span));
		}
	}
	return net;
}
