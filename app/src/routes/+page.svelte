<script lang="ts">
	import { onMount } from 'svelte';
	import { base } from '$app/paths';
	import { loadData } from '$lib/engine/data';
	import type { PreparedData } from '$lib/engine/forecast';
	import { runScenario } from '$lib/engine/forecast';
	import type { MigScenario, RefPeriod, ScenarioResult } from '$lib/engine/types';
	import {
		indicatorAt, indicatorSeries, pyramidShares, INDICATOR_LABELS, HISTORICAL_COLUMN,
		type Indicator
	} from '$lib/engine/indicators';
	import { fmtItem, fmtN, GEOG_SHORT } from '$lib/ui/format';
	import InfoDot from '$lib/ui/InfoDot.svelte';
	import SeriesChart from '$lib/ui/SeriesChart.svelte';
	import Pyramid from '$lib/ui/Pyramid.svelte';
	import HexMap from '$lib/ui/HexMap.svelte';
	import SeatsChart from '$lib/ui/SeatsChart.svelte';
	import DataMethods from '$lib/ui/DataMethods.svelte';

	type MapMode = 'abs' | 'chg' | 'vsref';

	// ---- static metadata ----
	// hex-cartogram placement (col, row), roughly geographic
	const HEX: { col: number; row: number }[] = [
		{ col: 7, row: 1 }, { col: 6, row: 1 }, { col: 7, row: 2 }, { col: 6, row: 2 }, // NL PE NS NB
		{ col: 5, row: 1 }, { col: 4, row: 1 }, { col: 3, row: 1 }, { col: 2, row: 1 }, // QC ON MB SK
		{ col: 1, row: 1 }, { col: 0, row: 1 }, { col: 2, row: 0 }, { col: 3, row: 0 }, // AB BC NT NU
		{ col: 1, row: 0 } // YT
	];
	const DEFAULTS = { fert: 100, mort: 100, immigPct: 0.945, ipmig: 'ave' as MigScenario, refPeriod: '2016-2021' as RefPeriod };
	const PRESETS: Record<string, { label: string; fert: number; mort: number; immigPct: number; ipmig: MigScenario }> = {
		trends: { label: 'Current trends', fert: 100, mort: 100, immigPct: 0.945, ipmig: 'ave' },
		aging: { label: 'Aging Canada', fert: 75, mort: 85, immigPct: 0.4, ipmig: 'ave' },
		century: { label: 'Century Initiative', fert: 100, mort: 100, immigPct: 1.25, ipmig: 'cma' },
		resource: { label: 'Resource boom', fert: 105, mort: 100, immigPct: 0.945, ipmig: 'res' },
		closed: { label: 'Closed borders', fert: 100, mort: 100, immigPct: 0, ipmig: 'ave' }
	};

	// ---- state ----
	let data = $state<PreparedData | null>(null);
	let loadError = $state('');
	let params = $state({ ...DEFAULTS });
	let view = $state({ item: 'pop' as Indicator, geog: 0, year: 2071, mapMode: 'abs' as MapMode });
	let tab = $state<'explore' | 'data'>('explore');
	let pinned = $state<{ res: ScenarioResult; label: string } | null>(null);
	let playTimer = $state<ReturnType<typeof setInterval> | null>(null);

	onMount(async () => {
		// restore state from a shared link
		try {
			const h = new URLSearchParams(location.hash.slice(1));
			if (h.has('f')) params.fert = +h.get('f')!;
			if (h.has('m')) params.mort = +h.get('m')!;
			if (h.has('i')) params.immigPct = +h.get('i')!;
			if (h.has('s')) params.ipmig = h.get('s') as MigScenario;
			if (h.has('r')) params.refPeriod = h.get('r') as RefPeriod;
			if (h.has('item')) view.item = h.get('item') as Indicator;
			if (h.has('g')) view.geog = +h.get('g')!;
			if (h.has('y')) view.year = +h.get('y')!;
		} catch {
			/* malformed hash: ignore */
		}
		try {
			data = await loadData(base);
		} catch (e) {
			loadError = e instanceof Error ? e.message : String(e);
		}
	});

	// keep the URL shareable
	$effect(() => {
		const h = `f=${params.fert}&m=${params.mort}&i=${params.immigPct}&s=${params.ipmig}&r=${params.refPeriod}&item=${view.item}&g=${view.geog}&y=${view.year}`;
		if (typeof history !== 'undefined') history.replaceState(null, '', '#' + h);
	});

	// ---- model runs (sub-millisecond; no worker or debounce needed) ----
	const refRes = $derived.by(() => {
		if (!data) return null;
		const rp = params.refPeriod;
		return runScenario({ ...DEFAULTS, refPeriod: rp }, data);
	});
	const sceRes = $derived.by(() => (data ? runScenario({ ...params }, data) : null));

	const c = $derived(data?.constants ?? null);
	const years = $derived(c?.forecast_years ?? [2021]);
	const ti = $derived(Math.max(0, years.indexOf(view.year)));
	const geogName = $derived(c ? c.geogs[view.geog] : 'Canada');
	const geogLabel = $derived(view.geog === 0 ? 'Canada' : `${geogName}`);

	const activePreset = $derived.by(() => {
		for (const [k, p] of Object.entries(PRESETS)) {
			if (p.fert === params.fert && p.mort === params.mort && Math.abs(p.immigPct - params.immigPct) < 1e-9 && p.ipmig === params.ipmig) return k;
		}
		return null;
	});

	// ---- series for the chart ----
	const refSeries = $derived(refRes ? indicatorSeries(refRes, view.item, view.geog) : []);
	const sceSeries = $derived(sceRes ? indicatorSeries(sceRes, view.item, view.geog) : []);
	const pinSeries = $derived(pinned ? indicatorSeries(pinned.res, view.item, view.geog) : null);
	const histSeries = $derived.by(() => {
		if (!data || !c) return { years: [], values: [] };
		const col = HISTORICAL_COLUMN[view.item];
		const h = data.historical[c.geogs[view.geog]];
		if (!col || !h) return { years: [], values: [] };
		const scale = view.item === 'pop' ? 1 : 100; // fractions in the data
		const ys: number[] = [];
		const vs: number[] = [];
		(h[col] as number[]).forEach((v, i) => {
			if (!Number.isNaN(v)) {
				ys.push(h.year[i]);
				vs.push(v * scale);
			}
		});
		return { years: ys, values: vs };
	});

	// ---- KPIs ----
	const kpis = $derived.by(() => {
		if (!sceRes) return [];
		const g = view.geog;
		const pop0 = indicatorAt(sceRes, 'pop', g, 0);
		const pop1 = indicatorAt(sceRes, 'pop', g, ti);
		const ch = 100 * (pop1 / pop0 - 1);
		return [
			{ l: `Population ${view.year}`, v: fmtN(pop1), s: `${ch >= 0 ? '+' : ''}${ch.toFixed(1)}% vs 2021`, info: 'kpi-pop' },
			{ l: 'Commons seats', v: String(indicatorAt(sceRes, 'seats', g, ti)), s: `${indicatorAt(sceRes, 'seats', g, 0)} today`, info: 'seatrules' },
			{ l: 'Dependency ratio', v: indicatorAt(sceRes, 'dep', g, ti).toFixed(1), s: `${indicatorAt(sceRes, 'dep', g, 0).toFixed(1)} in 2021`, info: 'dep' },
			{ l: 'Foreign-born', v: indicatorAt(sceRes, 'fb', g, ti).toFixed(1) + '%', s: `${indicatorAt(sceRes, 'fb', g, 0).toFixed(1)}% in 2021`, info: 'fb' }
		];
	});

	// ---- map ----
	const mapProvs = $derived.by(() => {
		if (!sceRes || !refRes || !c) return [];
		return HEX.map((pos, i) => {
			const g = i + 1;
			const now = indicatorAt(sceRes, view.item, g, ti);
			let val = now;
			if (view.mapMode === 'chg') val = 100 * (now / indicatorAt(sceRes, view.item, g, 0) - 1);
			if (view.mapMode === 'vsref') val = 100 * (now / indicatorAt(refRes, view.item, g, ti) - 1);
			return {
				k: GEOG_SHORT[g],
				name: c.geogs[g],
				...pos,
				val,
				pop: indicatorAt(sceRes, 'pop', g, ti),
				seats: indicatorAt(sceRes, 'seats', g, ti),
				itemVal: now
			};
		});
	});

	// ---- pyramid ----
	const pyrBase = $derived(sceRes ? pyramidShares(sceRes, view.geog, 0) : null);
	const pyrNow = $derived(sceRes ? pyramidShares(sceRes, view.geog, ti) : null);

	// ---- seats ----
	const seatsBase = $derived(sceRes ? sceRes.seats.map((p) => p[0]) : []);
	const seatsNow = $derived(sceRes ? sceRes.seats.map((p) => p[ti]) : []);
	const seatsTotalNow = $derived(seatsNow.reduce((a, b) => a + b, 0));
	const seatsTotalBase = $derived(seatsBase.reduce((a, b) => a + b, 0));

	const immigAbs = $derived(c ? Math.round((params.immigPct / 100) * c.base_national_pop) : 0);

	// ---- actions ----
	function applyPreset(k: string) {
		const p = PRESETS[k];
		params.fert = p.fert;
		params.mort = p.mort;
		params.immigPct = p.immigPct;
		params.ipmig = p.ipmig;
	}
	function reset() {
		params = { ...DEFAULTS };
	}
	function togglePin() {
		if (pinned) {
			pinned = null;
			return;
		}
		if (!sceRes) return;
		pinned = {
			res: sceRes,
			label: `F${params.fert} M${params.mort} I${params.immigPct.toFixed(2)} ${params.ipmig}`
		};
	}
	function togglePlay() {
		if (playTimer) {
			clearInterval(playTimer);
			playTimer = null;
			return;
		}
		if (view.year >= years[years.length - 1]) view.year = years[0];
		playTimer = setInterval(() => {
			const i = years.indexOf(view.year);
			if (i >= years.length - 1) {
				if (playTimer) clearInterval(playTimer);
				playTimer = null;
				return;
			}
			view.year = years[i + 1];
		}, 550);
	}
	function downloadCsv() {
		const rows = [['year', 'current_trends', 'your_scenario', ...(pinned ? ['pinned'] : [])]];
		years.forEach((y, i) =>
			rows.push([
				String(y), String(refSeries[i]), String(sceSeries[i]),
				...(pinned && pinSeries ? [String(pinSeries[i])] : [])
			])
		);
		const blob = new Blob([rows.map((r) => r.join(',')).join('\n')], { type: 'text/csv' });
		const a = document.createElement('a');
		a.href = URL.createObjectURL(blob);
		a.download = `forecaster-${view.item}-${GEOG_SHORT[view.geog]}.csv`;
		a.click();
		URL.revokeObjectURL(a.href);
	}
</script>

<div class="shell">
	<header class="app">
		<h1>Canada Population Forecaster <span class="years">2021–2071</span></h1>
	</header>

	<div class="tabs" role="tablist">
		<button role="tab" aria-selected={tab === 'explore'} onclick={() => (tab = 'explore')}>Explore scenarios</button>
		<button role="tab" aria-selected={tab === 'data'} onclick={() => (tab = 'data')}>Data &amp; methods</button>
	</div>

	{#if loadError}
		<div class="card">Failed to load model data: {loadError}</div>
	{:else if !data || !sceRes || !refRes || !c || !pyrBase || !pyrNow}
		<div class="card">Loading model data…</div>
	{:else if tab === 'explore'}
		<div class="layout">
			<aside class="rail">
				<div class="panel">
					<h2>Quick scenarios <InfoDot topic="presets" /></h2>
					<div class="presets">
						{#each Object.entries(PRESETS) as [k, p] (k)}
							<button class:active={activePreset === k} onclick={() => applyPreset(k)}>{p.label}</button>
						{/each}
					</div>
					<div class="ctl" style="margin-top:12px; margin-bottom:2px;">
						<div class="ctl-label">
							<label for="ipmig">Internal migration</label>
							<InfoDot topic="ipmig" />
						</div>
						<select id="ipmig" bind:value={params.ipmig}>
							<option value="none">Zero internal migration</option>
							<option value="ave">Current trends</option>
							<option value="cma">Urban agglomeration</option>
							<option value="res">Resource boom</option>
						</select>
					</div>
				</div>

				<div class="panel">
					<h2>Your assumptions</h2>
					<datalist id="pct-ticks">
						{#each [75, 80, 85, 90, 95, 100, 105, 110, 115, 120, 125] as v (v)}<option value={v}></option>{/each}
					</datalist>
					<datalist id="immig-ticks">
						{#each [0, 0.25, 0.5, 0.75, 1, 1.25, 1.5, 1.75, 2] as v (v)}<option value={v}></option>{/each}
					</datalist>
					<div class="ctl">
						<div class="ctl-label">
							<label for="fert">Fertility</label>
							<InfoDot topic="fert" />
							<span class="ctl-val">{params.fert}%</span>
						</div>
						<input type="range" id="fert" min="75" max="125" step="5" list="pct-ticks" bind:value={params.fert} />
						<small>of the reference period’s age-specific rates</small>
					</div>
					<div class="ctl">
						<div class="ctl-label">
							<label for="mort">Mortality</label>
							<InfoDot topic="mort" />
							<span class="ctl-val">{params.mort}%</span>
						</div>
						<input type="range" id="mort" min="75" max="125" step="5" list="pct-ticks" bind:value={params.mort} />
						<small>of the reference period’s death rates by age</small>
					</div>
					<div class="ctl">
						<div class="ctl-label">
							<label for="immig">Immigration</label>
							<InfoDot topic="immig" />
							<span class="ctl-val">{params.immigPct.toFixed(2)}%</span>
						</div>
						<input type="range" id="immig" min="0" max="2" step="0.005" list="immig-ticks" bind:value={params.immigPct} />
						<small>% of resident population ≈ {immigAbs.toLocaleString('en-CA')} people/year in {c.base_year}</small>
					</div>
					<div class="ctl">
						<div class="ctl-label">
							<label for="refper">Reference period</label>
							<InfoDot topic="refper" />
						</div>
						<select id="refper" bind:value={params.refPeriod}>
							<option value="2006-2011">2006–11</option>
							<option value="2011-2016">2011–16</option>
							<option value="2016-2021">2016–21</option>
						</select>
					</div>
					<div class="rail-actions">
						<button onclick={togglePin}>{pinned ? 'Unpin' : 'Pin scenario'}</button>
						<button class="primary" onclick={reset}>Reset</button>
					</div>
				</div>

				<div class="panel">
					<h2>View</h2>
					<div class="ctl">
						<div class="ctl-label">
							<label for="item">Indicator</label>
							<InfoDot topic="item" />
						</div>
						<select id="item" bind:value={view.item}>
							{#each Object.entries(INDICATOR_LABELS) as [k, label] (k)}
								<option value={k}>{label}</option>
							{/each}
						</select>
					</div>
					<div class="ctl">
						<div class="ctl-label"><label for="geog">Geography</label></div>
						<select id="geog" bind:value={view.geog}>
							{#each c.geogs as g, i (g)}
								<option value={i}>{i === 0 ? g : `${GEOG_SHORT[i]} — ${g}`}</option>
							{/each}
						</select>
					</div>
				</div>
			</aside>

			<main style="min-width:0">
				<div class="kpis">
					{#each kpis as k (k.l)}
						<div class="kpi">
							<div class="lbl">{k.l} <InfoDot topic={k.info} /></div>
							<div class="val">{k.v}</div>
							<div class="sub">{k.s}</div>
						</div>
					{/each}
				</div>

				<datalist id="year-ticks">
					{#each years as y (y)}<option value={y}></option>{/each}
				</datalist>
				<div class="scrub">
					<button onclick={togglePlay} aria-label={playTimer ? 'Pause animation' : 'Play forecast animation'}>
						{playTimer ? '❚❚' : '▶'}
					</button>
					<input
						type="range"
						min={years[0]}
						max={years[years.length - 1]}
						step="5"
						list="year-ticks"
						bind:value={view.year}
						aria-label="Target year"
					/>
					<span class="yr">{view.year}</span>
				</div>

				<div class="card">
					<div class="card-head">
						<h2>{INDICATOR_LABELS[view.item]} — {geogLabel}</h2>
						<InfoDot topic="series" />
						<div class="right">
							<button class="csv" onclick={downloadCsv}>CSV</button>
						</div>
					</div>
					<div class="legend">
						{#if histSeries.years.length}
							<span><span class="sw" style="background:var(--hist)"></span>Actual {histSeries.years[0]}–{histSeries.years[histSeries.years.length - 1]}</span>
						{/if}
						<span><span class="sw" style="background:var(--ref)"></span>Current trends</span>
						<span><span class="sw" style="background:var(--sce)"></span>Your scenario</span>
						{#if pinned}<span><span class="sw" style="background:var(--pin)"></span>Pinned: {pinned.label}</span>{/if}
					</div>
					<SeriesChart
						item={view.item}
						{years}
						ref={refSeries}
						sce={sceSeries}
						pinned={pinSeries}
						pinnedLabel={pinned?.label ?? ''}
						hist={histSeries}
						year={view.year}
						onYearClick={(y) => (view.year = y)}
					/>
				</div>

				<div class="card">
					<div class="card-head">
						<h2>{INDICATOR_LABELS[view.item]}, {view.year}</h2>
						<InfoDot topic="map" />
						<div class="right">
							<select aria-label="Map display mode" bind:value={view.mapMode}>
								<option value="abs">Absolute value</option>
								<option value="chg">Change since {c.base_year}</option>
								<option value="vsref">vs. current trends</option>
							</select>
						</div>
					</div>
					<div class="map-wrap">
						<HexMap item={view.item} mode={view.mapMode} provs={mapProvs} year={view.year} onSelect={(i) => (view.geog = i + 1)} />
					</div>
				</div>

				{#if view.item === 'seats' || view.item === 'pctseats'}
					<!-- The Commons card shows only for the two seat-count indicators;
					     the age card covers everything else (incl. population per seat). -->
					<div class="card">
						<div class="card-head">
							<h2>House of Commons, {view.year}</h2>
							<InfoDot topic="seatrules" />
							<div class="right" style="font-size:0.85rem; color:var(--ink-2)">
								{seatsTotalNow} seats ({seatsTotalNow >= seatsTotalBase ? '+' : ''}{seatsTotalNow - seatsTotalBase} vs {c.base_year})
							</div>
						</div>
						<SeatsChart
							abbrs={GEOG_SHORT.slice(1)}
							names={c.geogs.slice(1)}
							base={seatsBase}
							now={seatsNow}
							baseYear={c.base_year}
							year={view.year}
						/>
					</div>
				{:else}
					<div class="card">
						<div class="card-head">
							<h2>Age structure — {geogLabel}</h2>
							<InfoDot topic="pyramid" />
						</div>
						<div class="legend">
							<span><span class="sw outline"></span>{c.base_year} (outline)</span>
							<span><span class="sw" style="background:var(--seq2); block-size:10px"></span>Children 0–19</span>
							<span><span class="sw" style="background:var(--seq4); block-size:10px"></span>Working age 20–64</span>
							<span><span class="sw" style="background:var(--seq7); block-size:10px"></span>Seniors 65+</span>
						</div>
						<div class="pyr-wrap">
							<Pyramid cohorts={c.cohorts} base={pyrBase} now={pyrNow} baseYear={c.base_year} year={view.year} />
						</div>
						<p class="chart-note">
							Filled bars: your scenario in {view.year}. Dark outline: the {c.base_year} population.
							Men left, women right — % of total population per five-year cohort.
						</p>
					</div>
				{/if}
			</main>
		</div>
	{:else}
		<DataMethods />
	{/if}

	<footer class="app">
		© 2026 Zack Taylor and Dave Armstrong, University of Western Ontario. Version 3.0 —
		browser-native edition; the model runs entirely on this page.
	</footer>
</div>

<style>
	/* Full-width cards: keep the drawings at a readable size, centred */
	.map-wrap {
		max-width: 660px;
		margin: 0 auto;
	}
	.pyr-wrap {
		max-width: 540px;
		margin: 0 auto;
	}
	.legend .outline {
		background: none;
		border: 1.5px solid var(--ink);
		block-size: 8px;
	}
	.csv {
		font: inherit;
		font-size: 0.78rem;
		font-weight: 600;
		cursor: pointer;
		color: var(--ink-2);
		background: none;
		border: 1px solid var(--baseline);
		border-radius: 6px;
		padding: 2px 9px;
	}
	.csv:hover {
		border-color: var(--ink-2);
	}
</style>
