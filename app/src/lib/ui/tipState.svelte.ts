// Shared singleton tooltip state (rendered once by Tooltip.svelte).

export interface TipRow {
	label: string;
	value: string;
	color?: string;
}

export const tip = $state({
	show: false,
	x: 0,
	y: 0,
	title: '',
	rows: [] as TipRow[]
});

export function showTip(ev: PointerEvent | MouseEvent, title: string, rows: TipRow[]) {
	tip.show = true;
	tip.x = ev.clientX;
	tip.y = ev.clientY;
	tip.title = title;
	tip.rows = rows;
}

export function hideTip() {
	tip.show = false;
}
