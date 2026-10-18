<script lang="ts">
	import type { Indicator } from '$lib/engine/indicators';
	import { fmtItem, fmtN } from './format';
	import { showTip, hideTip } from './tipState.svelte';

	type MapMode = 'abs' | 'chg' | 'vsref';

	interface ProvRow {
		k: string;
		name: string;
		col: number;
		row: number;
		val: number; // value under the current mode
		pop: number;
		seats: number;
		itemVal: number; // absolute indicator value for the tooltip
	}
	interface Props {
		item: Indicator;
		mode: MapMode;
		provs: ProvRow[];
		year: number;
		onSelect: (index: number) => void;
	}
	let { item, mode, provs, year, onSelect }: Props = $props();

	// Pointy-top hexes, odd rows offset half a cell, roughly geographic.
	const HR = 42;
	const HW = (Math.sqrt(3) / 2) * HR;
	const W = 4 + 2 * HW * 7.5;
	const H = 4 + 2 * HR + 3 * HR;
	function hexPts(cx: number, cy: number): string {
		const p: string[] = [];
		for (let a = 0; a < 6; a++) {
			const t = (Math.PI / 180) * (60 * a - 30);
			p.push((cx + HR * 0.97 * Math.cos(t)).toFixed(1) + ',' + (cy + HR * 0.97 * Math.sin(t)).toFixed(1));
		}
		return p.join(' ');
	}
	const cxOf = (p: ProvRow) => 2 + HW + 2 * HW * (p.col + (p.row % 2 ? 0.5 : 0));
	const cyOf = (p: ProvRow) => 2 + HR + 1.5 * HR * p.row;

	const SEQ = ['var(--seq1)', 'var(--seq2)', 'var(--seq3)', 'var(--seq4)', 'var(--seq5)', 'var(--seq6)', 'var(--seq7)'];
	// Diverging scale for the signed modes: blue = positive, red = negative,
	// grey midpoint at 0, darker = larger magnitude, symmetric about zero.
	const NEG = ['#f2d4d1', '#e89f98', '#d96b62', '#c04038', '#9e2b26'];
	const POS = ['#b7d3f6', '#86b6ef', '#5598e7', '#2a78d6', '#184f95'];
	const MID = '#e8e7e2';

	const lo = $derived(Math.min(...provs.map((p) => p.val)));
	const hi = $derived(Math.max(...provs.map((p) => p.val)));
	const diverging = $derived(mode !== 'abs');
	const m = $derived(Math.max(Math.abs(lo), Math.abs(hi), 1e-9));
	const norm = $derived((v: number) => (hi > lo ? (v - lo) / (hi - lo) : 0.5));
	const colOf = $derived((v: number) => {
		if (!diverging) return SEQ[Math.min(6, Math.floor(norm(v) * 7))]; // higher → darker
		const t = v / m;
		if (Math.abs(t) <= 0.08) return MID;
		const arm = t > 0 ? POS : NEG;
		return arm[Math.min(4, Math.floor(((Math.abs(t) - 0.08) / 0.92) * 5))];
	});
	const inkOf = $derived((v: number) =>
		(diverging ? Math.abs(v / m) > 0.63 : norm(v) > 0.5) ? 'var(--surface)' : 'var(--ink)'
	);
	const vtxt = $derived((v: number) =>
		mode === 'abs' ? fmtItem(item, v) : (v >= 0 ? '+' : '') + v.toFixed(1) + '%'
	);

	function hover(ev: PointerEvent, p: ProvRow) {
		showTip(ev, p.name, [
			{ label: `Population ${year}`, value: fmtN(p.pop) },
			{ label: 'Commons seats', value: String(Math.round(p.seats)) },
			{ label: 'Shown value', value: vtxt(p.val) }
		]);
	}
</script>

<svg viewBox="0 0 {W} {H}" role="img" aria-label="Map of provinces and territories">
	{#each provs as p, i (p.k)}
		<g
			class="map-tile"
			tabindex="0"
			role="button"
			aria-label="{p.name}: {vtxt(p.val)}"
			onpointermove={(ev) => hover(ev, p)}
			onpointerleave={hideTip}
			onclick={() => onSelect(i)}
			onkeydown={(ev) => { if (ev.key === 'Enter' || ev.key === ' ') { ev.preventDefault(); onSelect(i); } }}
		>
			<polygon points={hexPts(cxOf(p), cyOf(p))} fill={colOf(p.val)} />
			<text class="map-abbr" x={cxOf(p)} y={cyOf(p) - 3} text-anchor="middle" fill={inkOf(p.val)}>{p.k}</text>
			<text class="map-val" x={cxOf(p)} y={cyOf(p) + 13} text-anchor="middle" fill={inkOf(p.val)}>{vtxt(p.val)}</text>
		</g>
	{/each}
</svg>
<div class="mapbar">
	<span>{diverging ? '−' + m.toFixed(1) + '%' : fmtItem(item, lo)}</span>
	<span
		class="ramp"
		style="background: {diverging
			? 'linear-gradient(90deg,#9e2b26,#e8e7e2,#184f95)'
			: 'linear-gradient(90deg,var(--seq1),var(--seq4),var(--seq7))'}"
	>
		{#if diverging}<span class="mid">0</span>{/if}
	</span>
	<span>{diverging ? '+' + m.toFixed(1) + '%' : fmtItem(item, hi)}</span>
	<span style="margin-left:auto">tap a province for detail</span>
</div>

<style>
	.map-tile {
		cursor: pointer;
	}
	.map-tile polygon {
		stroke: var(--surface);
		stroke-width: 2;
	}
	.map-abbr {
		font-size: 12px;
		font-weight: 600;
		pointer-events: none;
	}
	.map-val {
		font-size: 10px;
		pointer-events: none;
	}
	.mapbar {
		display: flex;
		align-items: center;
		gap: 8px;
		font-size: 0.76rem;
		color: var(--muted);
		margin-top: 6px;
	}
	.ramp {
		flex: 0 0 140px;
		block-size: 10px;
		border-radius: 5px;
		position: relative;
	}
	.mid {
		position: absolute;
		left: 50%;
		top: calc(100% + 1px);
		transform: translateX(-50%);
		font-size: 0.7rem;
		color: var(--muted);
		line-height: 1;
	}
</style>
