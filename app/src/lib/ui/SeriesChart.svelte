<script lang="ts">
	import type { Indicator } from '$lib/engine/indicators';
	import { INDICATOR_LABELS } from '$lib/engine/indicators';
	import { fmtItem } from './format';
	import { showTip, hideTip } from './tipState.svelte';

	interface Props {
		item: Indicator;
		years: number[];
		ref: number[];
		sce: number[];
		pinned: number[] | null;
		pinnedLabel: string;
		hist: { years: number[]; values: number[] };
		year: number;
		onYearClick: (y: number) => void;
	}
	let { item, years, ref, sce, pinned, pinnedLabel, hist, year, onYearClick }: Props = $props();

	const W = 640, H = 300, L = 56, R = 14, T = 14, B = 30;
	const hasHist = $derived(hist.years.length > 0);
	const x0 = $derived(hasHist ? Math.min(...hist.years) : years[0]);
	const x1 = $derived(years[years.length - 1]);

	const domain = $derived.by(() => {
		const all = [...ref, ...sce, ...(pinned ?? []), ...hist.values];
		let lo = Math.min(...all);
		let hi = Math.max(...all);
		const pad = (hi - lo) * 0.08 || 1;
		lo -= pad;
		hi += pad;
		lo = Math.max(lo, 0); // population quantities are never negative
		if (item === 'pctnat' || item === 'fb' || item === 'pctseats') hi = Math.min(hi, 100);
		return { lo, hi };
	});

	const X = $derived((y: number) => L + ((W - L - R) * (y - x0)) / (x1 - x0));
	const Y = $derived((v: number) => T + (H - T - B) * (1 - (v - domain.lo) / (domain.hi - domain.lo)));
	const path = $derived(
		(ys: number[], vals: number[]) =>
			vals.map((v, i) => (i ? 'L' : 'M') + X(ys[i]).toFixed(1) + ',' + Y(v).toFixed(1)).join(' ')
	);
	const yTicks = $derived(
		[0, 1, 2, 3, 4].map((i) => domain.lo + ((domain.hi - domain.lo) * i) / 4)
	);
	const xTicks = $derived.by(() => {
		const t: number[] = [];
		for (let y = Math.ceil(x0 / 10) * 10 + 1; y <= x1; y += 10) t.push(y);
		return t;
	});
	// historical segment joined to the first forecast point, like the R app
	const histPath = $derived(
		hasHist ? path([...hist.years, years[0]], [...hist.values, ref[0]]) : ''
	);
	const ti = $derived(years.indexOf(year));

	let svgEl: SVGSVGElement | undefined = $state();
	function nearestYear(ev: PointerEvent | MouseEvent): number | null {
		if (!svgEl) return null;
		const r = svgEl.getBoundingClientRect();
		const px = ((ev.clientX - r.left) / r.width) * W;
		const y = x0 + ((px - L) / (W - L - R)) * (x1 - x0);
		return years.reduce((a, b) => (Math.abs(b - y) < Math.abs(a - y) ? b : a));
	}
	function onMove(ev: PointerEvent) {
		const y = nearestYear(ev);
		if (y == null) return hideTip();
		const i = years.indexOf(y);
		if (i < 0) return hideTip();
		const rows = [
			{ label: 'Your scenario', value: fmtItem(item, sce[i]), color: 'var(--sce)' },
			{ label: 'Current trends', value: fmtItem(item, ref[i]), color: 'var(--ref)' }
		];
		if (pinned) rows.push({ label: pinnedLabel, value: fmtItem(item, pinned[i]), color: 'var(--pin)' });
		showTip(ev, String(y), rows);
	}
	function onClick(ev: MouseEvent) {
		const y = nearestYear(ev);
		if (y != null) onYearClick(y);
	}
</script>

<svg
	bind:this={svgEl}
	viewBox="0 0 {W} {H}"
	role="img"
	aria-label="Time series of {INDICATOR_LABELS[item]}"
>
	{#each yTicks as v (v)}
		<line x1={L} x2={W - R} y1={Y(v)} y2={Y(v)} stroke="var(--grid)" stroke-width="1" />
		<text class="axis-t" x={L - 6} y={Y(v) + 3.5} text-anchor="end">{fmtItem(item, v)}</text>
	{/each}
	{#each xTicks as y (y)}
		<text class="axis-t" x={X(y)} y={H - 10} text-anchor="middle">{y}</text>
	{/each}
	<line x1={L} x2={W - R} y1={H - B} y2={H - B} stroke="var(--baseline)" />
	{#if hasHist}
		<path d={histPath} fill="none" stroke="var(--hist)" stroke-width="2" stroke-dasharray="5 4" />
	{/if}
	<path d={path(years, ref)} fill="none" stroke="var(--ref)" stroke-width="2" />
	{#if pinned}
		<path d={path(years, pinned)} fill="none" stroke="var(--pin)" stroke-width="2" />
	{/if}
	<path d={path(years, sce)} fill="none" stroke="var(--sce)" stroke-width="2.5" />
	<line x1={X(year)} x2={X(year)} y1={T} y2={H - B} stroke="var(--baseline)" stroke-dasharray="2 3" />
	<circle cx={X(year)} cy={Y(sce[ti])} r="4.5" fill="var(--sce)" stroke="var(--surface)" stroke-width="2" />
	<circle cx={X(year)} cy={Y(ref[ti])} r="4" fill="var(--ref)" stroke="var(--surface)" stroke-width="2" />
	<rect
		x={L}
		y={T}
		width={W - L - R}
		height={H - T - B}
		fill="transparent"
		role="presentation"
		onpointermove={onMove}
		onpointerleave={hideTip}
		onclick={onClick}
	/>
</svg>
