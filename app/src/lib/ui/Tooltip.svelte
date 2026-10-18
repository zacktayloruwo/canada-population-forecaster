<script lang="ts">
	import { tip } from './tipState.svelte';

	let el: HTMLDivElement | undefined = $state();
	const pos = $derived.by(() => {
		if (!tip.show || !el) return { x: tip.x + 14, y: tip.y + 14 };
		const r = el.getBoundingClientRect();
		let x = tip.x + 14;
		let y = tip.y + 14;
		if (typeof window !== 'undefined') {
			if (x + r.width > window.innerWidth - 8) x = tip.x - r.width - 14;
			if (y + r.height > window.innerHeight - 8) y = tip.y - r.height - 14;
		}
		return { x, y };
	});
</script>

{#if tip.show}
	<div class="tip" bind:this={el} style="left:{pos.x}px; top:{pos.y}px" role="presentation">
		<b>{tip.title}</b>
		{#each tip.rows as r (r.label)}
			<div class="trow">
				<span>
					{#if r.color}<span class="sw2" style="background:{r.color}"></span>{/if}{r.label}
				</span>
				<span>{r.value}</span>
			</div>
		{/each}
	</div>
{/if}

<style>
	.tip {
		position: fixed;
		z-index: 60;
		pointer-events: none;
		background: var(--ink);
		color: var(--bg);
		border-radius: 7px;
		padding: 7px 10px;
		font-size: 0.8rem;
		line-height: 1.4;
		max-width: 260px;
	}
	.tip b {
		font-weight: 600;
	}
	.trow {
		display: flex;
		gap: 10px;
		justify-content: space-between;
		font-variant-numeric: tabular-nums;
	}
	.sw2 {
		display: inline-block;
		inline-size: 8px;
		block-size: 8px;
		border-radius: 2px;
		margin-right: 5px;
	}
</style>
