// Port of stepNaturalIncrease() (fct_demography.R): the non-international
// component — natural increase plus interprovincial migration — advanced
// through all 11 periods.

import type { BaseFigs, MigScenario } from './types';
import { adjustMortality, calcPopMortFert, dropTerminal } from './transition';
import { calcDomMigPop } from './domesticMigration';

export interface NaturalIncreaseResult {
	/** [period][geog] -> pop[36] */
	population: number[][][];
	/** [province 0..12][period 0..10] net interprovincial migrants */
	netMigs: number[][];
}

export function stepNaturalIncrease(
	mortSlider: number,
	fertSlider: number,
	bf: BaseFigs,
	scenario: MigScenario,
	immStart: number,
	immEnd: number,
	flowMatAve: number[][],
	cmaMat: number[][],
	resMat: number[][],
	outSums: number[][]
): NaturalIncreaseResult {
	// Period 1: total population minus the foreign-born stock.
	const start = bf.map((g) => g.pop.map((v, i) => v - g.immig_stock[i]));
	const periods: number[][][] = [start];
	const pop0 = start.slice(1).map((p) => p.reduce((a, b) => a + b, 0));
	const netMigs: number[][] = Array.from({ length: 13 }, () => new Array<number>(11).fill(0));

	for (let t = 1; t < 11; t++) {
		const prev = periods[t - 1];
		const pop1 = prev.slice(1).map((p) => p.reduce((a, b) => a + b, 0));
		const net = calcDomMigPop(
			scenario, flowMatAve, cmaMat, resMat, immStart, immEnd, pop0, pop1, outSums
		);
		for (let p = 0; p < 13; p++) {
			let s = 0;
			for (let i = 0; i < 36; i++) s += net[i][p + 1];
			netMigs[p][t] = s;
		}
		const next: number[][] = new Array(14);
		for (let j = 0; j < 14; j++) {
			const mort = adjustMortality(bf[j].mort, mortSlider);
			const fert = bf[j].fert.map((f) => f * (fertSlider / 200));
			const stock = prev[j].map((v, i) => v + net[i][j]);
			next[j] = calcPopMortFert(dropTerminal(mort), fert, stock).map(Math.floor);
		}
		periods.push(next);
	}
	return { population: periods, netMigs };
}
