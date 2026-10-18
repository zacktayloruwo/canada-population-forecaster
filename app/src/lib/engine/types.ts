// Shared engine types. Geography index 0 is Canada, 1..13 the provinces and
// territories in the canonical order of constants.json `geogs`.

export interface GeogFigs {
	pop: number[]; // 36: 18 male cohorts then 18 female, canonical age order
	mort: number[]; // survival probabilities
	fert: number[];
	intl_immig: number[];
	immig_stock: number[];
}

export type BaseFigs = GeogFigs[]; // length 14

export interface DomMoveRow {
	geo: string;
	cohort: string;
	sex: string; // "Males" | "Females"
	refStart: number;
	value: number;
}

export interface FlowRow {
	refStart: number;
	origin: string;
	destination: string;
	value: number;
}

export interface Constants {
	base_year: number;
	forecast_years: number[];
	default_immig_pct: number;
	geogs: string[];
	cohorts: string[];
	settle_cma_pct: Record<string, number>;
	base_national_pop: number;
	eq_2021: number;
	seats_2021: number[];
	senate_floors: number[];
	ref_periods: Record<string, number[]>;
}

export type RefPeriod = '2006-2011' | '2011-2016' | '2016-2021';
export type MigScenario = 'none' | 'ave' | 'cma' | 'res';

export interface ScenarioParams {
	fert: number; // % of reference rates, 100 = unchanged
	mort: number; // % of reference rates, 100 = unchanged
	immigPct: number; // annual immigration as % of national population
	ipmig: MigScenario;
	refPeriod: RefPeriod;
}

export interface ScenarioResult {
	/** [geog][cohortRow 0..35][yearIndex 0..10] population */
	provForecasts: number[][][];
	/** [yearIndex][geog][cohortRow] foreign-born stock */
	fb: number[][][];
	/** electoral quotients for the 6 redistribution decades */
	eqs: number[];
	/** [province 0..12][yearIndex 0..10] Commons seats */
	seats: number[][];
	/** [province 0..12][decade 0..4] final allocations per redistribution */
	seatsFinal: number[][];
	/** [province 0..12][yearIndex] net interprovincial migration */
	netMigs: number[][];
}
