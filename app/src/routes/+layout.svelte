<script lang="ts">
	import '$lib/ui/theme.css';
	import Tooltip from '$lib/ui/Tooltip.svelte';

	let { children } = $props();
</script>

<svelte:head>
	<title>Canada Population Forecaster 2021–2071</title>
	<meta
		name="description"
		content="Explore 50-year population scenarios for Canada and its provinces: fertility, mortality, immigration, internal migration, and House of Commons seats."
	/>
</svelte:head>

{@render children()}
<Tooltip />
