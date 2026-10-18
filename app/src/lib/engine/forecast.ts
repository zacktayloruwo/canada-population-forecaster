// Port of calcForecasts() / makeProvForecasts() plus the orchestration that
// mod_scenario.R performs reactively: one call = one complete scenario.

import type { BaseFigs, Constants, MigScenario, ScenarioParams, ScenarioResult } from './types';
import { stepIntlMig, refRateFor } from './intlMigration';
import { stepNaturalIncrease } from './naturalIncrease';
import { calcEQs, calcSeats } from './seats';

export interface PreparedData {
	constants: Constants;
	baseFigs: Record<string, BaseFigs>;
	/** per reference period: calcFlowMat / calcOut results (precomputed) */
	flowMat: Record<string, number[][]>;
	outSums: Record<string, number[][]>;
	cmaMat: number[][];
	resMat: number[][];
	historical: Record<string, { year: number[]; [k: string]: number[] }>;
}

export function runScenario(p: ScenarioParams, data: PreparedData): ScenarioResult {
	const c = data.constants;
	const bf = data.baseFigs[p.refPeriod];
	const [immStart, immEnd] = c.ref_periods[p.refPeriod];
	const immigThousands = (p.immigPct / 100) * c.base_national_pop / 1000;
	const refRate = refRateFor(bf);
	const settle = Math.round(c.settle_cma_pct[p.refPeriod]);

	const ni = stepNaturalIncrease(
		p.mort, p.fert, bf, p.ipmig as MigScenario, immStart, immEnd,
		data.flowMat[p.refPeriod], data.cmaMat, data.resMat, data.outSums[p.refPeriod]
	);
	const intlPop = stepIntlMig(settle, immigThousands, p.mort, p.fert, bf, refRate, false);
	const fb = stepIntlMig(settle, immigThousands, p.mort, p.fert, bf, refRate, true);

	// calcForecasts + makeProvForecasts: total = natural + international, and
	// the Canada column is recomputed as the sum of the 13 provinces.
	const provForecasts: number[][][] = Array.from({ length: 14 }, (_, g) =>
		Array.from({ length: 36 }, (_, r) =>
			Array.from({ length: 11 }, (_, t) => ni.population[t][g][r] + intlPop[t][g][r])
		)
	);
	for (let r = 0; r < 36; r++) {
		for (let t = 0; t < 11; t++) {
			let s = 0;
			for (let g = 1; g < 14; g++) s += provForecasts[g][r][t];
			provForecasts[0][r][t] = s;
		}
	}

	const eqs = calcEQs(provForecasts);
	const seats = calcSeats(provForecasts, eqs);
	return {
		provForecasts,
		fb,
		eqs,
		seats: seats.byYear,
		seatsFinal: seats.final,
		netMigs: ni.netMigs
	};
}
