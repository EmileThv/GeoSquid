<!--
  ClueCard: one Plonk It clue: photo, how strongly it points to the place
  being viewed, category, text and note.
-->
<script lang="ts">
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
</script>

<article class="py-4">
	{#if clue.image}
		<!-- Loaded right away, not lazily: the photos sit in a scrolling panel,
		     where Firefox only starts a lazy image once it's scrolled into view,
		     so each one popped in late. A state's photos weigh ~0.4 MB.
		     width/height reserve the photo's space (shown on bg-reef) until it
		     arrives, so the text below doesn't jump. -->
		<img
			src={`/data/brazil/${clue.image}`}
			alt={clue.text}
			width={clue.imageSize?.[0]}
			height={clue.imageSize?.[1]}
			decoding="async"
			class="h-auto w-full rounded-panel bg-reef"
		/>
	{/if}
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
</article>
