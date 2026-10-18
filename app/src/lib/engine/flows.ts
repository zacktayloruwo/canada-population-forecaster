// Port of calcOut() and calcFlowMat() (fct_demography.R): the only two
// "queries" in the model, each run once per reference-period selection.

import type { DomMoveRow, FlowRow } from './types';

export const PROVINCES = [
	'Newfoundland and Labrador',
	'Prince Edward Island',
	'Nova Scotia',
	'New Brunswick',
	'Quebec',
	'Ontario',
	'Manitoba',
	'Saskatchewan',
	'Alberta',
	'British Columbia',
	'Northwest Territories',
	'Nunavut',
	'Yukon'
];

export const COHORT_ORDER = [
	'0-4', '5-9', '10-14', '15-19', '20-24', '25-29', '30-34', '35-39', '40-44',
	'45-49', '50-54', '55-59', '60-64', '65-69', '70-74', '75-79', '80-84', '85+'
];

/**
 * Total out-migrants per province x cohort x sex over the reference period
 * (R's calcOut, keeping the sum.VALUE column the model consumes). Rows per
 * province: 18 male cohorts in canonical age order, then 18 female.
 */
export function calcOut(domMove: DomMoveRow[], immStart: number, immEnd: number): number[][] {
	// sum VALUE by geo|sex|cohort (the intermediate per-ref_start grouping in R
	// only matters for the ave column, which the model never uses).
	const totals = new Map<string, number>();
	for (const r of domMove) {
		if (r.refStart < immStart || r.refStart > immEnd) continue;
		const key = r.geo + '|' + r.sex + '|' + r.cohort;
		totals.set(key, (totals.get(key) ?? 0) + r.value);
	}
	return PROVINCES.map((geo) => {
		const rows: number[] = [];
		for (const sex of ['Males', 'Females']) {
			for (const cohort of COHORT_ORDER) {
				rows.push(Math.floor(totals.get(geo + '|' + sex + '|' + cohort) ?? 0));
			}
		}
		return rows;
	});
}

/**
 * Proportional origin->destination flow matrix for the reference period
 * (R's calcFlowMat): rows are origins, normalized to sum to 1.
 */
export function calcFlowMat(imFlows: FlowRow[], immStart: number, immEnd: number): number[][] {
	const mat: number[][] = Array.from({ length: 13 }, () => new Array<number>(13).fill(0));
	for (const r of imFlows) {
		if (r.refStart < immStart || r.refStart > immEnd) continue;
		const o = PROVINCES.indexOf(r.origin);
		const d = PROVINCES.indexOf(r.destination);
		if (o >= 0 && d >= 0) mat[o][d] += r.value;
	}
	for (let o = 0; o < 13; o++) {
		let s = 0;
		for (let d = 0; d < 13; d++) s += mat[o][d];
		if (s > 0) for (let d = 0; d < 13; d++) mat[o][d] /= s;
	}
	return mat;
}
