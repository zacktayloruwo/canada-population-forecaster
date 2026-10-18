<script lang="ts">
	import { showTip, hideTip } from './tipState.svelte';

	interface Props {
		abbrs: string[]; // 13 province abbreviations
		names: string[];
		base: number[]; // seats in the base year
		now: number[]; // seats in the target year
		baseYear: number;
		year: number;
	}
	let { abbrs, names, base, now, baseYear, year }: Props = $props();

	const W = 640, rowH = 26, L = 46, R = 120;
	const order = $derived([...base.keys()].sort((a, b) => now[b] - now[a]));
	const H = $derived(order.length * rowH + 8);
	const maxs = $derived(Math.max(...now));
	const bw = $derived((v: number) => ((W - L - R) * v) / maxs);

	function hover(ev: PointerEvent, p: number) {
		showTip(ev, names[p], [
			{ label: String(baseYear), value: `${base[p]} seats` },
			{ label: String(year), value: `${now[p]} seats` }
		]);
	}
</script>

<svg viewBox="0 0 {W} {H}" role="img" aria-label="Commons seats by province, {baseYear} vs {year}">
	{#each order as p, r (p)}
		{@const y = 4 + r * rowH}
		{@const d = now[p] - base[p]}
		<text class="axis-t" x={L - 8} y={y + 14} text-anchor="end" font-weight="600">{abbrs[p]}</text>
		<rect x={L} y={y + 3} width={Math.max(bw(base[p]), 1.5)} height="7" fill="var(--baseline)" rx="2" />
		<rect
			x={L}
			y={y + 11}
			width={Math.max(bw(now[p]), 1.5)}
			height="7"
			fill="var(--sce)"
			rx="2"
			role="presentation"
			onpointermove={(ev) => hover(ev, p)}
			onpointerleave={hideTip}
		/>
		<text class="axis-t" x={L + Math.max(bw(base[p]), bw(now[p])) + 8} y={y + 14} style="font-variant-numeric: tabular-nums">
			{now[p]}{d !== 0 ? ` (${d > 0 ? '+' : ''}${d})` : ''}
		</text>
	{/each}
</svg>
