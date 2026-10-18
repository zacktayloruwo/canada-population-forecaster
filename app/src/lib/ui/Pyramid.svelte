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

	// Age bands follow the dependency-ratio definition: 0-19 children, 20-64
	// working age, 65+ seniors — an ordered variable, so an ordered
	// (sequential) color ramp.
	const grpFill = (i: number) =>
		i < 4 ? 'var(--seq2)' : i < 13 ? 'var(--seq4)' : 'var(--seq7)';

	// Base year drawn as one stepped silhouette per side: the old shape as a
	// single outline over the filled scenario bars.
	const silhouette = $derived((side: -1 | 1) => {
		const vals = side < 0 ? base.male : base.female;
		const x0 = cx + side * 30;
		let d = `M ${x0} ${(yy(0) + rh - 3).toFixed(1)}`;
		for (let i = 0; i < rows; i++) {
			const x = x0 + side * sx(vals[i]);
			d += ` L ${x.toFixed(1)} ${(yy(i) + rh - 3).toFixed(1)} L ${x.toFixed(1)} ${yy(i).toFixed(1)}`;
		}
		return d + ` L ${x0} ${yy(rows - 1).toFixed(1)}`;
	});

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
		<rect
			x={cx - 30 - sx(now.male[i])}
			y={yy(i)}
			width={sx(now.male[i])}
			height={rh - 3}
			fill={grpFill(i)}
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
			fill={grpFill(i)}
			rx="2"
			role="presentation"
			onpointermove={(ev) => hover(ev, i)}
			onpointerleave={hideTip}
		/>
		<text class="axis-t" x={cx} y={yy(i) + rh / 2 + 2} text-anchor="middle">{cohort}</text>
	{/each}
	<path d={silhouette(-1)} fill="none" stroke="var(--ink)" stroke-width="1.6" stroke-linejoin="miter" />
	<path d={silhouette(1)} fill="none" stroke="var(--ink)" stroke-width="1.6" stroke-linejoin="miter" />
	<text class="axis-t" x={cx} y={H - 7} text-anchor="middle">% of population per cohort, by sex</text>
</svg>
