<script lang="ts">
	import { INFO } from './info';

	let { topic, label = 'More information' }: { topic: string; label?: string } = $props();
	let open = $state(false);
	let wrap: HTMLSpanElement | undefined = $state();
	const entry = $derived(INFO[topic]);

	function onWindowClick(ev: MouseEvent) {
		if (open && wrap && !wrap.contains(ev.target as Node)) open = false;
	}
	function onKey(ev: KeyboardEvent) {
		if (ev.key === 'Escape') open = false;
	}
</script>

<svelte:window onclick={onWindowClick} onkeydown={onKey} />

{#if entry}
	<span class="wrap" bind:this={wrap}>
		<button
			type="button"
			class="ibtn"
			aria-label={label}
			aria-expanded={open}
			onclick={() => (open = !open)}>i</button
		>
		{#if open}
			<div class="pop" role="dialog" aria-label={entry.h}>
				<button type="button" class="close" aria-label="Close" onclick={() => (open = false)}>×</button>
				<h3>{entry.h}</h3>
				{#each entry.b as p (p)}<p>{p}</p>{/each}
				{#if entry.s}<p class="src"><b>Source:</b> {entry.s}</p>{/if}
			</div>
		{/if}
	</span>
{/if}

<style>
	.wrap {
		position: relative;
		display: inline-flex;
	}
	.ibtn {
		inline-size: 17px;
		block-size: 17px;
		flex: none;
		padding: 0;
		cursor: pointer;
		border: 1.4px solid var(--muted);
		border-radius: 50%;
		background: none;
		color: var(--muted);
		font: 700 0.68rem/1 var(--font-ui);
		display: inline-grid;
		place-items: center;
	}
	.ibtn:hover {
		color: var(--ref);
		border-color: var(--ref);
	}
	.pop {
		position: absolute;
		z-index: 40;
		top: calc(100% + 8px);
		left: -8px;
		width: min(320px, calc(100vw - 48px));
		background: var(--surface);
		color: var(--ink);
		border: 1px solid var(--baseline);
		border-radius: 10px;
		padding: 12px 14px;
		box-shadow: 0 6px 24px rgba(0, 0, 0, 0.18);
		font-size: 0.86rem;
		font-weight: 400;
		text-transform: none;
		letter-spacing: normal;
	}
	.pop h3 {
		margin: 0 0 6px;
		font-size: 0.9rem;
	}
	.pop p {
		margin: 0 0 8px;
		color: var(--ink-2);
	}
	.pop p:last-child {
		margin-bottom: 0;
	}
	.pop .src {
		font-size: 0.78rem;
		color: var(--muted);
		border-top: 1px solid var(--grid);
		padding-top: 7px;
		margin-top: 8px;
	}
	.pop .src b {
		color: var(--ink-2);
		font-weight: 600;
	}
	.pop .close {
		position: absolute;
		top: 6px;
		right: 8px;
		border: none;
		background: none;
		color: var(--muted);
		font-size: 1rem;
		cursor: pointer;
		padding: 2px 4px;
	}
</style>
