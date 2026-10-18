// Port of calcEQs(), reallocateSeats() and calcSeats() (fct_seats.R): the
// real House of Commons redistribution formula — electoral quotient,
// senatorial clause, the post-2022 grandfather clause (floor = previous
// Parliament), and the representation-rule ratchet.

const SENATE_FLOORS = [6, 4, 10, 10, 24, 24, 6, 6, 6, 6];
const SEATS_2021 = [7, 4, 11, 10, 78, 122, 14, 14, 37, 43]; // + 1 each for NT, NU, YT
export const EQ_2021 = 121891;

const sum = (a: number[]) => a.reduce((x, y) => x + y, 0);
const mean = (a: number[]) => sum(a) / a.length;

/** Province totals (NL..BC, 10 provinces) per redistribution decade. */
function decadePops(provForecasts: number[][][]): number[][] {
	// year indices 0,2,4,6,8,10 = 2021,2031,...,2071; geogs 1..10 = NL..BC
	return [0, 2, 4, 6, 8, 10].map((yi) =>
		provForecasts.slice(1, 11).map((g) => sum(g.map((row) => row[yi])))
	);
}

export function calcEQs(provForecasts: number[][][]): number[] {
	const pops = decadePops(provForecasts);
	const eqs = [EQ_2021];
	for (let d = 1; d < 6; d++) {
		eqs.push(eqs[d - 1] * mean(pops[d].map((v, i) => v / pops[d - 1][i])));
	}
	return eqs;
}

export interface Reallocation {
	init: number[];
	sen: number[];
	gfc: number[];
	final: number[]; // 13 entries: 10 provinces + the 3 one-seat territories
}

export function reallocateSeats(
	newPop: number[],
	oldPop: number[],
	oldSeats: number[],
	eq: number
): Reallocation {
	const oldPct = oldPop.map((v) => v / sum(oldPop));
	const newPct = newPop.map((v) => v / sum(newPop));
	const oldRep = oldSeats.map((v) => v / sum(oldSeats));
	const oldOver = oldRep.map((v, i) => v > oldPct[i]);

	const init = newPop.map((v) => Math.ceil(v / eq));
	const sen = init.map((v, i) => Math.max(v, SENATE_FLOORS[i]));
	const gfc = sen.map((v, i) => Math.max(v, oldSeats[i]));
	const alloc = gfc.slice();
	let newUnder = alloc.map((v, i) => v / sum(alloc) < newPct[i]);
	// Representation rule: top up provinces that were over-represented before
	// but fall under their population share now. Membership is frozen from the
	// pre-loop shares (R's `w <- which(...)`): a province that only becomes
	// under-represented because of earlier top-ups gets nothing, even though
	// the under-representation flags themselves are recomputed after every
	// added seat.
	const eligible = newUnder.map((u, i) => oldOver[i] && u);
	for (let i = 0; i < 10; i++) {
		if (!eligible[i]) continue;
		while (oldOver[i] && newUnder[i]) {
			alloc[i]++;
			newUnder = alloc.map((v, k) => v / sum(alloc) < newPct[k]);
		}
	}
	const withTerr = (v: number[]) => v.concat([1, 1, 1]);
	return { init: withTerr(init), sen: withTerr(sen), gfc: withTerr(gfc), final: withTerr(alloc) };
}

export interface SeatsResult {
	/** [province 0..12][yearIndex 0..10] */
	byYear: number[][];
	/** [province 0..12][decade 0..4] */
	init: number[][];
	sen: number[][];
	gfc: number[][];
	final: number[][];
}

export function calcSeats(provForecasts: number[][][], eqs: number[]): SeatsResult {
	const pops = decadePops(provForecasts);
	const byDecade: number[][] = [SEATS_2021.concat([1, 1, 1])];
	const reallocs: Reallocation[] = [];
	for (let d = 1; d < 6; d++) {
		const r = reallocateSeats(pops[d], pops[d - 1], byDecade[d - 1].slice(0, 10), eqs[d - 1]);
		reallocs.push(r);
		byDecade.push(r.final);
	}
	// Seats apply for a whole decade: year columns map to decades 0,0,1,1,...,5.
	const decadeOfYear = [0, 0, 1, 1, 2, 2, 3, 3, 4, 4, 5];
	const byYear = Array.from({ length: 13 }, (_, p) =>
		decadeOfYear.map((d) => byDecade[d][p])
	);
	const attr = (k: 'init' | 'sen' | 'gfc' | 'final') =>
		Array.from({ length: 13 }, (_, p) => reallocs.map((r) => r[k][p]));
	return { byYear, init: attr('init'), sen: attr('sen'), gfc: attr('gfc'), final: attr('final') };
}
