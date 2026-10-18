import type { Indicator } from '$lib/engine/indicators';

export const fmtN = (v: number): string =>
	v >= 1e6 ? (v / 1e6).toFixed(v >= 1e7 ? 1 : 2) + ' M' : Math.round(v).toLocaleString('en-CA');

export function fmtItem(item: Indicator, v: number): string {
	switch (item) {
		case 'pop':
			return fmtN(v);
		case 'pctnat':
		case 'fb':
		case 'pctseats':
			return v.toFixed(1) + '%';
		case 'dep':
			return v.toFixed(1);
		case 'seats':
			return String(Math.round(v));
		case 'popseat':
			return Math.round(v).toLocaleString('en-CA');
	}
}

export const GEOG_SHORT = [
	'Canada', 'NL', 'PE', 'NS', 'NB', 'QC', 'ON', 'MB', 'SK', 'AB', 'BC', 'NT', 'NU', 'YT'
];
