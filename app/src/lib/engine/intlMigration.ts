// Port of stepIntlMig() / calcIntlMigPop() / calcIntlMigFB() / ref_rate_for()
// (fct_demography.R).

import type { BaseFigs } from './types';
import { adjustMortality, calcPopMortFert, dropTerminal } from './transition';

/**
 * The reference period's own average annual international-migration rate in
 * thousands/year — the num_immig value that reproduces baseFigs unchanged.
 */
export function refRateFor(bf: BaseFigs): number {
	let s = 0;
	for (let g = 1; g < bf.length; g++) {
		for (const v of bf[g].intl_immig) s += v;
	}
	return s / 5 / 1000;
}

/**
 * Advance the international-immigration population (or the foreign-born-only
 * stock) through all 11 periods. Returns [period][geog] -> pop[36].
 */
export function stepIntlMig(
	settleBoq: number,
	numImmig: number,
	mortSlider: number,
	fertSlider: number,
	bf: BaseFigs,
	refRateThousands: number,
	foreignBorn: boolean
): number[][][] {
	const fertScale = foreignBorn ? 0 : fertSlider / 200;
	// Settlement multipliers: provinces 5,6,10 (1-based: QC, ON, BC) share
	// settleBoq% of immigrants, the rest split the remainder, Canada stays 1.
	const totals = bf.map((g) => g.intl_immig.reduce((a, b) => a + b, 0));
	const provTotal = totals.slice(1).reduce((a, b) => a + b, 0);
	const p = totals.slice(1).map((v) => v / provTotal);
	const fac1 = (settleBoq / 100) / (p[4] + p[5] + p[9]);
	const fac2 = (1 - settleBoq / 100) / (1 - (p[4] + p[5] + p[9]));
	const multfac = [1, fac2, fac2, fac2, fac2, fac1, fac1, fac2, fac2, fac2, fac1, fac2, fac2, fac2];
	const scale = (numImmig * 1000) / (refRateThousands * 1000);

	const periods: number[][][] = [bf.map((g) => g.immig_stock.slice())];
	for (let t = 1; t < 11; t++) {
		const prev = periods[t - 1];
		const next: number[][] = new Array(14);
		for (let j = 0; j < 14; j++) {
			const mort = adjustMortality(bf[j].mort, mortSlider);
			const fert = bf[j].fert.map((f) => f * fertScale);
			const stock = prev[j].map((v, i) => v + bf[j].intl_immig[i] * multfac[j] * scale);
			next[j] = calcPopMortFert(dropTerminal(mort), fert, stock, foreignBorn).map(Math.floor);
		}
		// Canada is overwritten with the row-sums of the 13 provinces, exactly
		// as in R (its own computed value above is discarded).
		next[0] = next[0].map((_, i) => {
			let s = 0;
			for (let j = 1; j < 14; j++) s += next[j][i];
			return s;
		});
		periods.push(next);
	}
	return periods;
}

// R exposes the general-population variant with a fac2 denominator written as
// sum(pmigpop[-c(5,6,10)]) — mathematically 1 - (p[QC]+p[ON]+p[BC]), matching
// fac2 above since the shares sum to 1.
