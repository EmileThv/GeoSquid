<!--
  ContinueButton: the main action of Home and Learn. Opens the next lesson
  of the path not done yet, with its number and title next to it
  ("Lesson 5 of 33 · Poles 2"). When every lesson is done, it says so and
  opens Learn instead.
  Progress must be loaded by the page (loadProgress in an $effect).
-->
<script lang="ts">
	import { resolve } from '$app/paths';
	import Icon from './Icon.svelte';
	import { lessonNumber, nextLesson, path } from './progress.svelte';

	const next = $derived(nextLesson());
	const total = $derived(path().length);
</script>

<div class="flex items-center gap-3">
	<span class="text-right text-sm leading-tight text-mist">
		{#if next}
			<span class="text-ink tabular-nums">Lesson {lessonNumber(next.id)}</span>
			<span class="tabular-nums">of {total}</span>
			<span class="hidden text-xs text-fog sm:block">{next.title}</span>
		{:else if total}
			All {total} lessons done
		{:else}
			No topics picked
		{/if}
	</span>
	<a
		href={next ? resolve(`/learn/lesson?id=${next.id}`) : resolve('/learn')}
		class="flex h-10 items-center gap-2 rounded-panel bg-squid px-4 font-display font-bold tracking-wide text-on-squid uppercase hover:brightness-105"
		aria-label={next ? `Continue: lesson ${lessonNumber(next.id)}, ${next.title}` : 'Learn'}
	>
		Continue
		<Icon name="arrow" class="size-4" />
	</a>
</div>
