// Port of calcPopMortFert() / calcPopMortFertFB() (fct_demography.R).
//
// The R original builds a 36x36 transition matrix: off-diagonal survival
// probabilities move each cohort up one age group (rows 2:18 male, 20:36
// female), and rows 1 and 19 hold fertility so births land in the two 0-4
// cohorts. The 85+ cohorts have no self-loop: everyone there is gone after
// one 5-year step, replaced by survivors from 80-84. With foreignBorn, the
// [1,1] and [19,19] entries become 1 so the initial stock's 0-4 cohorts carry
// forward instead of taking births (immigrants' Canadian-born children are
// not foreign born).

/**
 * @param mort34 survival probabilities with the two 85+ entries dropped
 *   (R's `mymort[-c(18, 36)]`): indices 0..16 male 0-4..80-84, 17..33 female
 * @param fert36 fertility contribution of each cohort to births
 * @param stock36 population stock (migrants already added by the caller)
 */
export function calcPopMortFert(
	mort34: number[],
	fert36: number[],
	stock36: number[],
	foreignBorn = false
): number[] {
	const out = new Array<number>(36);
	// Births: rows 1 and 19 are the fertility row; summed in ascending column
	// order to match R's %*% exactly.
	let maleBirths = 0;
	let femaleBirths = 0;
	for (let j = 0; j < 36; j++) {
		const f0 = foreignBorn && j === 0 ? 1 : fert36[j];
		const f18 = foreignBorn && j === 18 ? 1 : fert36[j];
		maleBirths += f0 * stock36[j];
		femaleBirths += f18 * stock36[j];
	}
	out[0] = maleBirths;
	out[18] = femaleBirths;
	for (let i = 1; i <= 17; i++) out[i] = mort34[i - 1] * stock36[i - 1];
	for (let i = 19; i <= 35; i++) out[i] = mort34[i - 2] * stock36[i - 1];
	return out;
}

/**
 * The mortality-slider adjustment applied before every transition (identical
 * code in stepNaturalIncrease and stepIntlMig): death probabilities are scaled
 * by slider/100 (capped at 1) but the result replaces survival only for the
 * 55+ cohorts (indices 11..17 and 29..35).
 */
export function adjustMortality(mort36: number[], mortSlider: number): number[] {
	const out = mort36.slice();
	for (const i of [11, 12, 13, 14, 15, 16, 17, 29, 30, 31, 32, 33, 34, 35]) {
		let deathProb = (1 - mort36[i]) * (mortSlider / 100);
		if (deathProb > 1) deathProb = 1;
		out[i] = 1 - deathProb;
	}
	return out;
}

/** R's `mymort[-c(18, 36)]`: drop the two 85+ survival entries. */
export function dropTerminal(mort36: number[]): number[] {
	const out: number[] = [];
	for (let i = 0; i < 36; i++) if (i !== 17 && i !== 35) out.push(mort36[i]);
	return out;
}
