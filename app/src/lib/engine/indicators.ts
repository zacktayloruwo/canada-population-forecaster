// Port of makeSeries()/makeItem()/makeHistorical() (fct_plot_data.R):
// turn a ScenarioResult into the seven displayable indicator series.

import type { ScenarioResult } from './types';

export type Indicator = 'pop' | 'pctnat' | 'fb' | 'dep' | 'seats' | 'pctseats' | 'popseat';

export const INDICATOR_LABELS: Record<Indicator, string> = {
	pop: 'Total population',
	pctnat: '% of national population',
	fb: '% foreign-born',
	dep: 'Dependency ratio',
	seats: 'Seats in House of Commons',
	pctseats: '% of Commons seats',
	popseat: 'Population per seat'
};

const YOUNG = [0, 1, 2, 3]; // 0-4 .. 15-19 (the app counts 0-19 as young)
const OLD = [13, 14, 15, 16, 17]; // 65-69 .. 85+

function geogTotal(res: ScenarioResult, g: number, t: number): number {
	let s = 0;
	for (let r = 0; r < 36; r++) s += res.provForecasts[g][r][t];
	return s;
}

function cohortGroupTotal(res: ScenarioResult, g: number, t: number, cohorts: number[]): number {
	let s = 0;
	for (const c of cohorts) s += res.provForecasts[g][c][t] + res.provForecasts[g][c + 18][t];
	return s;
}

function totalSeats(res: ScenarioResult, t: number): number {
	let s = 0;
	for (let p = 0; p < 13; p++) s += res.seats[p][t];
	return s;
}

/** Indicator value for geography g (0 = Canada) at year index t. */
export function indicatorAt(res: ScenarioResult, item: Indicator, g: number, t: number): number {
	switch (item) {
		case 'pop':
			return geogTotal(res, g, t);
		case 'pctnat':
			return (100 * geogTotal(res, g, t)) / geogTotal(res, 0, t);
		case 'fb': {
			let fbs = 0;
			for (let r = 0; r < 36; r++) fbs += res.fb[t][g][r];
			return (100 * fbs) / geogTotal(res, g, t);
		}
		case 'dep': {
			const young = cohortGroupTotal(res, g, t, YOUNG);
			const old = cohortGroupTotal(res, g, t, OLD);
			const working = geogTotal(res, g, t) - young - old;
			return (100 * (young + old)) / working;
		}
		case 'seats':
			return g === 0 ? totalSeats(res, t) : res.seats[g - 1][t];
		case 'pctseats':
			return (100 * (g === 0 ? totalSeats(res, t) : res.seats[g - 1][t])) / totalSeats(res, t);
		case 'popseat': {
			if (g === 0) {
				// R item 7: the Canada row is the MEAN of provincial pop-per-seat.
				let s = 0;
				for (let p = 0; p < 13; p++) s += geogTotal(res, p + 1, t) / res.seats[p][t];
				return Math.floor(s / 13);
			}
			return Math.floor(geogTotal(res, g, t) / res.seats[g - 1][t]);
		}
	}
}

export function indicatorSeries(res: ScenarioResult, item: Indicator, g: number): number[] {
	return Array.from({ length: 11 }, (_, t) => indicatorAt(res, item, g, t));
}

/** Pyramid data: % of the geography's population per cohort-sex cell. */
export function pyramidShares(res: ScenarioResult, g: number, t: number): { male: number[]; female: number[] } {
	const total = geogTotal(res, g, t);
	const male: number[] = [];
	const female: number[] = [];
	for (let c = 0; c < 18; c++) {
		male.push((100 * res.provForecasts[g][c][t]) / total);
		female.push((100 * res.provForecasts[g][c + 18][t]) / total);
	}
	return { male, female };
}

/** Historical column name per indicator (matches historical.parquet). */
export const HISTORICAL_COLUMN: Partial<Record<Indicator, string>> = {
	pop: 'pop',
	pctnat: 'pctnatpop',
	fb: 'pctforborn',
	dep: 'deprat'
};
