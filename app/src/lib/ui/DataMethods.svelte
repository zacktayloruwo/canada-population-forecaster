<script lang="ts">
	// Static reference content for the Data & methods tab, adapted from the
	// original Shiny app's Introduction, Data Sources and Assumptions appendix,
	// and Disclaimer (forecaster_golem/inst/app/www/*.md).
</script>

<div class="card prose">
	<h2 style="margin-top:4px">What this tool is</h2>
	<p>
		The Canada Population Forecaster is a <b>teaching tool</b> created by Dr. Zack Taylor and
		Dr. Dave Armstrong (University of Western Ontario) to imagine future policy pressures associated
		with demographic and economic change. It presents a range of possible futures, letting you
		investigate the long-term impacts of hypothetical changes to fertility, mortality, and
		international and interprovincial migration — and how those changes shift the balance of
		provincial and territorial representation in the House of Commons.
	</p>
	<p>
		Its underlying assumptions are deliberately simplified, and some are more realistic than others
		(each is spelled out below). While calculated differently, the "current trends" outputs are
		similar to Statistics Canada's own long-term projections. For forecasts based on more
		sophisticated assumptions, see Statistics Canada's
		<a href="https://www150.statcan.gc.ca/n1/pub/91-520-x/91-520-x2019001-eng.htm" target="_blank" rel="noopener"
			><i>Population Projections for Canada, Provinces and Territories</i></a
		>
		and the
		<a href="https://www150.statcan.gc.ca/n1/en/catalogue/17200003" target="_blank" rel="noopener"
			>current projection tables</a
		>.
	</p>

	<h2>How the forecast works</h2>
	<p>
		The core of the app is a <b>cohort-component model</b>: the national and provincial populations
		broken out into 36 cells — eighteen 5-year age groups by sex — and advanced in five-year steps
		from the 2021 base year to 2071. At the start of each five-year increment:
	</p>
	<ol>
		<li>In each province, population counts by sex and age cohort are aged by five years.</li>
		<li>Counts of net internal (interprovincial) migrants by province, sex, and age cohort are added.</li>
		<li>
			Age- and sex-specific fertility and mortality rates are applied to produce the population
			increment from the Canadian-born population.
		</li>
		<li>
			Age- and sex-specific net international migration counts are added to the previous period's
			foreign-born population, and fertility and mortality rates are applied to calculate each
			province's increment due to international immigration.
		</li>
		<li>Summing steps 3 and 4 gives the total population by sex and age cohort in each province.</li>
		<li>
			Separately, for the % foreign-born indicator, net international migration is added to the
			previous period's foreign-born stock and mortality (but not fertility) is applied — children
			born in Canada to immigrant parents are not themselves foreign born.
		</li>
	</ol>
	<p>
		The <b>current trends</b> scenario holds your selected reference period's age-specific fertility
		and mortality rates constant, admits immigrants at a fixed policy-target rate of 0.945% of the
		national population per year with the reference period's age, sex, and settlement profile, and
		keeps interprovincial flows proportional to each origin's population. Your scenario starts from
		exactly these settings, so the two lines coincide until you move something.
	</p>
	<p>Everything runs in your browser — no server, and nothing you do here is recorded.</p>

	<h2>What you can change</h2>
	<ul>
		<li>
			<b>Fertility</b> — scale age-specific fertility rates from 75% to 125% of the reference
			period's values (the original classroom version ranged from zero, a "Children of Men"
			scenario, to a doubling — a new baby boom). The change applies across all age cohorts.
		</li>
		<li>
			<b>Mortality</b> — scale age-specific death rates from 75% (an extraordinary medical
			breakthrough) to 125% (superbugs amid pervasive antibiotic resistance). In the model the
			adjustment acts on the 55-and-over cohorts, where nearly all deaths occur.
		</li>
		<li>
			<b>Immigration</b> — expressed as a percentage of the resident population per year (0% to 2%)
			rather than an absolute count, so the slider stays meaningful as Canada's population changes;
			the equivalent people-per-year figure is shown beneath it. It does not include non-permanent
			residents such as international students and temporary foreign workers.
		</li>
		<li>
			<b>Internal migration</b> — replay the reference period's flows ("current trends"), turn
			interprovincial migration off entirely, or pick one of two alternative geographies:
			<i>Urban Agglomeration</i> distributes movers in proportion to each province's share of the
			national population living in census metropolitan areas (2021 Census, Table 98-10-0005-01);
			<i>Resource Boom</i> distributes them in proportion to each province's share of primary-industry
			employment — agriculture, forestry, fishing, mining, and oil and gas (Table 14-10-0023-01).
		</li>
		<li>
			<b>Reference period</b> — which historical window (2006–11, 2011–16, or 2016–21) defines
			"current trends" for fertility, mortality, immigration profile, <i>and</i> interprovincial
			flows together. The windows tell different stories: 2016–21 spans the COVID-19 pandemic,
			during which international and interprovincial migration collapsed for roughly two years
			before rebounding and mortality rose, while 2006–11 captures the pre-pandemic,
			post-financial-crisis era.
		</li>
	</ul>

	<h2>Data sources and assumptions</h2>
	<div class="tbl-wrap">
		<table class="data">
			<thead>
				<tr><th>Component</th><th>Source</th><th>Role in the model</th></tr>
			</thead>
			<tbody>
				<tr><td>Base population (2021)</td><td>StatCan Table 17-10-0005-01, population estimates on July 1 by age and gender</td><td>Starting stock for every province × age × sex cohort</td></tr>
				<tr><td>Historical series (1981–2016)</td><td>Table 17-10-0005-01; census files processed by the UNI-CEN project (% foreign-born)</td><td>The "Actual" line on the time-series chart</td></tr>
				<tr><td>Fertility</td><td>Table 13-10-0418-01, age-specific fertility rates by province</td><td>Births added to the 0–4 cohorts each step</td></tr>
				<tr><td>Mortality</td><td>Life tables 13-10-0114-01 (complete) and 13-10-0140-01 (abridged: PE, YT, NT, NU)</td><td>Survival probabilities by age and sex</td></tr>
				<tr><td>Foreign-born stock (2021)</td><td>Table 98-10-0349-01, place of birth by gender and age, 2021 Census</td><td>Baseline for the % foreign-born indicator</td></tr>
				<tr><td>International migration</td><td>Table 17-10-0014-01, components of international migration by age and gender</td><td>Age–sex–province profile of net newcomers</td></tr>
				<tr><td>Interprovincial migration</td><td>Tables 17-10-0015-01 (age/sex of movers) and 17-10-0022-01 (origin–destination flows)</td><td>Flow matrix behind the internal-migration scenarios</td></tr>
				<tr><td>Seat allocation</td><td>Constitution Act, 1867, ss. 51(1) and 51A; Elections Canada</td><td>Decennial redistribution of Commons seats</td></tr>
			</tbody>
		</table>
	</div>

	<h3>Base-year and historical population</h3>
	<p>
		The 2021 starting population is Statistics Canada's annual intercensal estimate (July 1), not a
		raw census count — the estimates program reconciles census counts with vital statistics and
		migration. The historical "Actual" line is drawn at each census year from 1981 to 2016 and is
		deliberately not connected to the 2021 projection, to keep real history visually distinct from
		the forecast. Nunavut split from the Northwest Territories in 1999, so its historical line
		starts in 1991, the earliest year the two are reported separately. Historical % foreign-born
		comes from census files (via the UNI-CEN project) that are not adjusted for net undercoverage,
		so those values sit on a slightly different population base than the other historical series.
	</p>

	<h3>Fertility and mortality</h3>
	<p>
		Fertility rates are averaged over your selected reference period. Each cohort's expected
		five-year birth total is split evenly between male and female newborns — a simplifying 50/50
		assumption; the true sex ratio at birth is closer to 105 boys per 100 girls. Mortality uses the
		three-year life table closest to each reference period: 2006–11 → the 2010/2012 table, 2011–16 →
		2015/2017, and 2016–21 → 2019/2021, which captures the pandemic's mortality effect.
	</p>

	<h3>International migration and the foreign-born population</h3>
	<p>
		Net international migration = immigrants − emigrants + returning emigrants, averaged over the
		reference period, with that period's age, sex, and provincial settlement profile. Both the
		current-trends line and the slider's default use the fixed 0.945%-of-population policy rate
		rather than each period's own observed average, so the two scenarios start identical whichever
		reference period you pick. The 2021 foreign-born stock comes from the census in 10-year age
		bands, which are distributed across the model's 5-year cohorts in proportion to each province's
		general population shape — a simplification. Immigrants are assumed to have the same
		age-specific fertility and mortality as the general population, and non-permanent residents are
		excluded throughout.
	</p>

	<h2>How House of Commons seats are allocated</h2>
	<p>
		Unlike the United States House of Representatives, Canada's House of Commons has no fixed size:
		each province's seat count comes from a legislated readjustment formula, applied after each
		decennial census (years ending in 1, taking effect in years ending in 6), and the national total
		is simply the sum. The model implements the real formula and assumes it remains unchanged for
		fifty years:
	</p>
	<ul>
		<li>
			<b>Electoral quotient:</b> 121,891 following the 2021 census (up from 111,166 after 2011).
			Each subsequent decade it grows by the average of the ten provinces' intercensal population
			growth rates. A province's initial seats = population ÷ quotient, rounded up.
		</li>
		<li><b>Territories:</b> Yukon, the Northwest Territories, and Nunavut get one seat each, regardless of population.</li>
		<li><b>Senatorial clause:</b> no province can have fewer MPs than senators.</li>
		<li>
			<b>Grandfather clause (as amended June 23, 2022):</b> no province can have fewer seats than it
			had in the <i>previous Parliament</i>. The floor now ratchets forward every redistribution —
			before 2022 it was frozen at the 1985 Representation Order, and the amendment raised Quebec
			from 77 to 78 seats.
		</li>
		<li>
			<b>Representation rule:</b> a province that was at-or-above its population share under the
			previous order, and would fall below it, receives extra seats until it is proportionally
			represented again.
		</li>
	</ul>
	<p>
		Because the floors only ratchet upward, slow-growing provinces keep their seats while
		fast-growing ones gain, and the House grows. The starting point is the 343-seat allocation for
		2022–2032, in effect since the 2025 election (BC 43, AB 37, SK 14, MB 14, ON 122, QC 78, NB 10,
		NS 11, PE 4, NL 7, plus one each for YT, NT, and NU). See Elections Canada,
		<a
			href="https://www.elections.ca/content.aspx?section=res&dir=cir/red/allo&document=index&lang=e"
			target="_blank"
			rel="noopener">House of Commons Seat Allocation by Province, 2022–2032</a
		>, and the <i>Fair Representation Act, 2011</i>.
	</p>

	<h2>What the forecast is — and is not</h2>
	<p>
		A forecast like this is a <b>conditional projection</b>: it shows what would happen <i>if</i> the
		rates you chose held for fifty years. It is not a prediction. Small annual differences compound —
		a quarter-point change in the immigration rate moves the 2071 population by millions — which is
		exactly why exploring scenarios side by side is more informative than any single number. The
		tool is intended to illustrate the methods and dilemmas of long-term population forecasting and
		their policy implications, not to supplant official projections.
	</p>
	<p>
		Created by Dr. Zack Taylor and Dr. Dave Armstrong, University of Western Ontario. For more
		information, contact Dr. Zack Taylor at
		<span style="user-select: all">zack.taylor@uwo.ca</span>.
	</p>
</div>

<style>
	h3 {
		font-size: 0.95rem;
		margin: 14px 0 4px;
	}
	a {
		color: var(--ref);
	}
	ol li,
	ul li {
		margin-bottom: 6px;
	}
</style>
