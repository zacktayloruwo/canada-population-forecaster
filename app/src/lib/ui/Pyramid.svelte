<script lang="ts">
	import { showTip, hideTip } from './tipState.svelte';

	interface Shares {
		male: number[];
		female: number[];
	}
	interface Props {
		cohorts: string[];
		base: Shares;
		now: Shares;
		baseYear: number;
		year: number;
	}
	let { cohorts, base, now, baseYear, year }: Props = $props();

	const W = 460, H = 330, T = 8, B = 24;
	const rows = 18;
	const rh = (H - T - B) / rows;
	const half = (W - 2 * 46) / 2 - 30;
	const cx = W / 2;
	const maxv = $derived(
		Math.max(...base.male, ...base.female, ...now.male, ...now.female)
	);
	const sx = $derived((v: number) => (half * v) / maxv);
	const yy = (i: number) => T + (rows - 1 - i) * rh + 10;

	function hover(ev: PointerEvent, i: number) {
		showTip(ev, `Ages ${cohorts[i]}`, [
			{ label: `${baseYear} M / F`, value: `${base.male[i].toFixed(1)}% / ${base.female[i].toFixed(1)}%` },
			{ label: `${year} M / F`, value: `${now.male[i].toFixed(1)}% / ${now.female[i].toFixed(1)}%` }
		]);
	}
</script>

<svg viewBox="0 0 {W} {H}" role="img" aria-label="Population pyramid, {baseYear} vs {year}">
	<text class="axis-t" x={cx - half} y={T + 6} font-weight="600">Men</text>
	<text class="axis-t" x={cx + half} y={T + 6} text-anchor="end" font-weight="600">Women</text>
	{#each cohorts as cohort, i (cohort)}
		<!-- scenario: solid fill underneath; base year: outline on top, so both
		     stay visible however the two overlap -->
		<rect
			x={cx - 30 - sx(now.male[i])}
			y={yy(i)}
			width={sx(now.male[i])}
			height={rh - 3}
			fill="var(--sce)"
			rx="2"
			role="presentation"
			onpointermove={(ev) => hover(ev, i)}
			onpointerleave={hideTip}
		/>
		<rect
			x={cx + 30}
			y={yy(i)}
			width={sx(now.female[i])}
			height={rh - 3}
			fill="var(--sce)"
			rx="2"
			role="presentation"
			onpointermove={(ev) => hover(ev, i)}
			onpointerleave={hideTip}
		/>
		<rect
			x={cx - 30 - sx(base.male[i])}
			y={yy(i)}
			width={sx(base.male[i])}
			height={rh - 3}
			fill="none"
			stroke="var(--ink-2)"
			stroke-width="1.3"
		/>
		<rect
			x={cx + 30}
			y={yy(i)}
			width={sx(base.female[i])}
			height={rh - 3}
			fill="none"
			stroke="var(--ink-2)"
			stroke-width="1.3"
		/>
		<text class="axis-t" x={cx} y={yy(i) + rh / 2 + 2} text-anchor="middle">{cohort}</text>
	{/each}
	<text class="axis-t" x={cx} y={H - 7} text-anchor="middle">% of population per cohort, by sex</text>
</svg>
