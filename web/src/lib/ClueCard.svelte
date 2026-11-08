<!--
  ClueCard: one Plonk It clue: photo, how strongly it points to the place
  being viewed, category, text and note.

  Tapping the photo opens it big, with the same text under it, in a
  <dialog>. The browser's own dialog handles the hard parts: it sits on top
  of everything, Escape closes it, and focus stays inside while it's open.
-->
<script lang="ts">
	import Icon from './Icon.svelte';
	import type { Clue, Strength } from './brazil';

	interface Props {
		clue: Clue;
		/** How strongly this clue points to the state/region being viewed */
		strength: Strength;
		/** Other places it points to just as exclusively (for "Only in CE · RR") */
		sharedWith?: string[];
	}
	let { clue, strength, sharedWith = [] }: Props = $props();

	const label = $derived(
		strength === 'exclusive'
			? sharedWith.length
				? `Only here & ${sharedWith.join(', ')}`
				: 'Only here'
			: strength === 'common'
				? 'Common'
				: 'Rare'
	);

	const src = $derived(`/data/brazil/${clue.image}`);

	let dialog = $state<HTMLDialogElement>();
</script>

<!-- Strength, category, text and note: shown under the photo in both the
     card and the enlarged view -->
{#snippet details()}
	<p class="mt-2.5 flex items-baseline gap-2 text-xs font-semibold tracking-wide uppercase">
		<span
			class={[
				strength === 'exclusive' && 'text-squid',
				strength === 'common' && 'text-ink',
				strength === 'rare' && 'text-fog'
			]}
		>
			{label}
		</span>
		<span class="text-fog">·</span>
		<span class="text-mist">{clue.category}</span>
	</p>
	<p class="mt-1 leading-snug">{clue.text}</p>
	{#if clue.note}
		<p class="mt-1.5 text-sm leading-snug text-mist">Note: {clue.note}</p>
	{/if}
{/snippet}

<article class="py-4">
	{#if clue.image}
		<button
			class="block w-full cursor-zoom-in rounded-panel"
			aria-label="Enlarge photo"
			onclick={() => dialog?.showModal()}
		>
			<!-- Loaded right away, not lazily: the photos sit in a scrolling panel,
			     where Firefox only starts a lazy image once it's scrolled into view,
			     so each one popped in late. A state's photos weigh ~0.4 MB.
			     width/height reserve the photo's space (shown on bg-reef) until it
			     arrives, so the text below doesn't jump. -->
			<img
				{src}
				alt={clue.text}
				width={clue.imageSize?.[0]}
				height={clue.imageSize?.[1]}
				decoding="async"
				class="h-auto w-full rounded-panel bg-reef"
			/>
		</button>
	{/if}
	{@render details()}
</article>

{#if clue.image}
	<!-- Clicking the dark area around the panel closes it: that click lands
	     on the <dialog> itself, a click inside lands on its children. -->
	<dialog
		bind:this={dialog}
		aria-label={clue.text}
		class="m-auto max-h-[calc(100dvh-1.5rem)] w-[min(56rem,calc(100vw-1.5rem))] rounded-panel border border-line bg-panel p-0 text-ink backdrop:bg-abyss/90"
		onclick={(e) => {
			if (e.target === dialog) dialog.close();
		}}
	>
		<div class="flex items-center justify-between border-b border-line bg-panel-head px-4 py-1.5">
			<span class="font-display text-[15px] font-semibold">{clue.category}</span>
			<button
				class="-mr-2 grid size-8 place-items-center text-mist hover:text-ink"
				aria-label="Close"
				onclick={() => dialog?.close()}
			>
				<Icon name="close" class="size-4" />
			</button>
		</div>
		<div class="p-3 sm:p-4">
			<!-- The photo shrinks to leave room for the text on short screens -->
			<img
				{src}
				alt=""
				width={clue.imageSize?.[0]}
				height={clue.imageSize?.[1]}
				class="mx-auto h-auto max-h-[70dvh] w-auto max-w-full rounded-panel bg-reef"
			/>
			<div class="mx-auto max-w-2xl">
				{@render details()}
			</div>
		</div>
	</dialog>
{/if}
