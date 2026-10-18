// Golden-master parity: the TypeScript engine must reproduce the R model
// integer-for-integer on every fixture dumped by data-raw/export_parquet.R.

import { describe, it, expect } from 'vitest';
import { readFileSync, readdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { parquetReadObjects } from 'hyparquet';
import { shapeData } from './data';
import { runScenario } from './forecast';
import type { ScenarioParams } from './types';

const here = dirname(fileURLToPath(import.meta.url));
const dataDir = join(here, '../../../static/data');
const fixDir = join(here, 'fixtures');

function fileBuffer(path: string) {
	const buf = readFileSync(path);
	const ab = buf.buffer.slice(buf.byteOffset, buf.byteOffset + buf.byteLength);
	return { byteLength: ab.byteLength, slice: (s: number, e?: number) => ab.slice(s, e) };
}
const parquet = (name: string) =>
	parquetReadObjects({ file: fileBuffer(join(dataDir, `${name}.parquet`)) });

const data = shapeData({
	constants: JSON.parse(readFileSync(join(dataDir, 'constants.json'), 'utf8')),
	baseFigs: await parquet('base_figs'),
	domMove: await parquet('dom_move'),
	imFlows: await parquet('im_flows'),
	historical: await parquet('historical'),
	scenarioMats: await parquet('scenario_mats')
});

interface Fixture {
	params: { fert: number; mort: number; immig_pct: number; ipmig: string; ref_period: string };
	prov_forecasts: number[][][]; // [geog][cohortRow][year]
	fb: number[][][]; // [year][geog][cohortRow]
	eqs: number[];
	seats: number[][]; // [province][year]
	seats_final: number[][];
	net_migs: number[][];
	flow_mat: number[][];
	out_sum: number[][];
}

const cases = readdirSync(fixDir).filter((f) => f.endsWith('.json')).sort();

describe.each(cases)('fixture %s', (file) => {
	const fx: Fixture = JSON.parse(readFileSync(join(fixDir, file), 'utf8'));
	const params: ScenarioParams = {
		fert: fx.params.fert,
		mort: fx.params.mort,
		immigPct: fx.params.immig_pct,
		ipmig: fx.params.ipmig as ScenarioParams['ipmig'],
		refPeriod: fx.params.ref_period as ScenarioParams['refPeriod']
	};
	const res = runScenario(params, data);

	it('reproduces the reference-period aggregates', () => {
		const period = fx.params.ref_period;
		for (let o = 0; o < 13; o++) {
			for (let d = 0; d < 13; d++) {
				expect(data.flowMat[period][o][d]).toBeCloseTo(fx.flow_mat[o][d], 12);
			}
		}
		expect(data.outSums[period]).toEqual(fx.out_sum);
	});

	it('reproduces provincial forecasts exactly', () => {
		for (let g = 0; g < 14; g++) {
			expect(res.provForecasts[g], `geog ${g}`).toEqual(fx.prov_forecasts[g]);
		}
	});

	it('reproduces the foreign-born stock exactly', () => {
		for (let t = 0; t < 11; t++) {
			// R serializes each year's geography list as a name-keyed object, and
			// from year 2 on each pop is a 36x1 matrix (floor() of %*%), which
			// jsonlite writes as an array of single-element rows — flatten both.
			const fbYear = Object.values(fx.fb[t]) as (number | number[])[][];
			for (let g = 0; g < 14; g++) {
				expect(res.fb[t][g], `year ${t} geog ${g}`).toEqual(fbYear[g].flat());
			}
		}
	});

	it('reproduces electoral quotients and seats', () => {
		fx.eqs.forEach((eq, i) => expect(res.eqs[i]).toBeCloseTo(eq, 6));
		expect(res.seats).toEqual(fx.seats);
		expect(res.seatsFinal).toEqual(fx.seats_final);
	});

	it('reproduces net interprovincial migration', () => {
		expect(res.netMigs).toEqual(fx.net_migs);
	});
});
