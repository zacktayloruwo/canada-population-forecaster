<script lang="ts">
	// The Data & methods page is authored as plain Markdown in
	// src/lib/content/*.md — edit those files to change the text. Each file is
	// one card: intro on top and disclaimer at the bottom run full width, the
	// rest flow in a two-column grid.
	import { marked } from 'marked';
	import intro from '$lib/content/intro.md?raw';
	import methods from '$lib/content/methods.md?raw';
	import changes from '$lib/content/changes.md?raw';
	import sources from '$lib/content/sources.md?raw';
	import population from '$lib/content/population.md?raw';
	import fertilityMortality from '$lib/content/fertility-mortality.md?raw';
	import migration from '$lib/content/migration.md?raw';
	import seats from '$lib/content/seats.md?raw';
	import disclaimer from '$lib/content/disclaimer.md?raw';

	// External links open in a new tab, as before the Markdown refactor.
	const md = (src: string) =>
		(marked.parse(src) as string).replaceAll(
			'<a href="http',
			'<a target="_blank" rel="noopener" href="http'
		);

	const middle = [methods, changes, population, fertilityMortality, migration, seats];
</script>

<div class="card prose wide">{@html md(intro)}</div>

<div class="md-grid">
	{#each middle as section, i (i)}
		<div class="card prose">{@html md(section)}</div>
	{/each}
</div>

<!-- Sources is a table, which cannot flow across CSS columns, so it takes the
     full-width slot without the two-column treatment. -->
<div class="card prose">{@html md(sources)}</div>

<div class="card prose wide">{@html md(disclaimer)}</div>

<style>
	.md-grid {
		display: grid;
		grid-template-columns: repeat(2, minmax(0, 1fr));
		gap: 16px;
		margin-bottom: 16px;
	}
	.md-grid .card {
		margin-bottom: 0;
	}
	@media (max-width: 1020px) {
		.md-grid {
			grid-template-columns: minmax(0, 1fr);
		}
	}
</style>
