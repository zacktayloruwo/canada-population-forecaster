// Shape raw Parquet row-objects into the engine's PreparedData, and provide
// the browser loader. Tests feed the same shaping function rows read from
// disk, so the Parquet round-trip itself is under test.

import { parquetReadObjects } from 'hyparquet';
import type { BaseFigs, Constants, GeogFigs } from './types';
import type { PreparedData } from './forecast';
import { calcFlowMat, calcOut } from './flows';

type Row = Record<string, unknown>;
const num = (v: unknown) => Number(v);
const str = (v: unknown) => String(v);

export interface RawTables {
	constants: Constants;
	baseFigs: Row[];
	domMove: Row[];
	imFlows: Row[];
	historical: Row[];
	scenarioMats: Row[];
}

export function shapeData(raw: RawTables): PreparedData {
	const c = raw.constants;

	// base figs: ref_period -> 14 geogs -> columns of 36 (file rows are in
	// canonical cohort/sex order within each geog block)
	const baseFigs: Record<string, BaseFigs> = {};
	for (const period of Object.keys(c.ref_periods)) {
		baseFigs[period] = c.geogs.map(() => emptyGeog());
	}
	for (const r of raw.baseFigs) {
		const g = c.geogs.indexOf(str(r.geog));
		const bf = baseFigs[str(r.ref_period)][g];
		bf.pop.push(num(r.pop));
		bf.mort.push(num(r.mort));
		bf.fert.push(num(r.fert));
		bf.intl_immig.push(num(r.intl_immig));
		bf.immig_stock.push(num(r.immig_stock));
	}

	const domMove = raw.domMove.map((r) => ({
		geo: str(r.GEO),
		cohort: str(r.cohort),
		sex: str(r.Sex),
		refStart: num(r.ref_start),
		value: num(r.VALUE)
	}));
	const imFlows = raw.imFlows.map((r) => ({
		refStart: num(r.ref_start),
		origin: str(r.origin),
		destination: str(r.destination),
		value: num(r.VALUE)
	}));

	// The two reference-period aggregations, precomputed for all 3 periods
	// (what bindCache does per-session in the Shiny app).
	const flowMat: Record<string, number[][]> = {};
	const outSums: Record<string, number[][]> = {};
	for (const [period, [start, end]] of Object.entries(c.ref_periods)) {
		flowMat[period] = calcFlowMat(imFlows, start, end);
		outSums[period] = calcOut(domMove, start, end);
	}

	const mats: Record<string, number[][]> = {
		cma: emptyMat(),
		res: emptyMat()
	};
	for (const r of raw.scenarioMats) {
		const o = c.geogs.indexOf(str(r.origin)) - 1;
		const d = c.geogs.indexOf(str(r.destination)) - 1;
		mats[str(r.scenario)][o][d] = num(r.share);
	}

	const historical: PreparedData['historical'] = {};
	for (const r of raw.historical) {
		const g = str(r.geog);
		historical[g] ??= { year: [], pop: [], pctnatpop: [], pctyoung: [], pctold: [], deprat: [], pctforborn: [] };
		for (const k of Object.keys(historical[g])) {
			// preserve R NAs (null in Parquet) as NaN so the UI can filter them
			(historical[g][k] as number[]).push(r[k] == null ? NaN : num(r[k]));
		}
	}

	return {
		constants: c,
		baseFigs,
		flowMat,
		outSums,
		cmaMat: mats.cma,
		resMat: mats.res,
		historical
	};
}

const emptyGeog = (): GeogFigs => ({ pop: [], mort: [], fert: [], intl_immig: [], immig_stock: [] });
const emptyMat = () => Array.from({ length: 13 }, () => new Array<number>(13).fill(0));

/** Browser loader: fetch everything under `${base}/data/`. */
export async function loadData(base: string): Promise<PreparedData> {
	// The files are tiny (~130 KB in total), so fetch each one whole instead of
	// using hyparquet's range-request reader — some static hosts and CDNs
	// (GitHub Pages among them) answer range requests in ways that corrupt the
	// footer check.
	const parquet = async (name: string) => {
		const resp = await fetch(`${base}/data/${name}.parquet`);
		if (!resp.ok) throw new Error(`${name}.parquet: HTTP ${resp.status}`);
		const ab = await resp.arrayBuffer();
		return parquetReadObjects({
			file: { byteLength: ab.byteLength, slice: (s: number, e?: number) => ab.slice(s, e) }
		});
	};
	const [constants, baseFigs, domMove, imFlows, historical, scenarioMats] = await Promise.all([
		fetch(`${base}/data/constants.json`).then((r) => r.json()),
		parquet('base_figs'),
		parquet('dom_move'),
		parquet('im_flows'),
		parquet('historical'),
		parquet('scenario_mats')
	]);
	return shapeData({ constants, baseFigs, domMove, imFlows, historical, scenarioMats });
}
