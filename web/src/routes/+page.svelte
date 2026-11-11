<!--
  Home: an overview of the whole app, as a few panels.
  The Brazil course shows the decks you learn and the progress saved in
  this browser; Continue opens the next lesson (see ContinueButton).
  The daily goal and the other countries are placeholders for now.
-->
<script lang="ts">
	import { goto } from '$app/navigation';
	import { resolve } from '$app/paths';
	import BrazilMap from '#lib/BrazilMap.svelte';
	import ContinueButton from '#lib/ContinueButton.svelte';
	import Icon from '#lib/Icon.svelte';
	import PageHeader from '#lib/PageHeader.svelte';
	import Panel from '#lib/Panel.svelte';
	import { DECKS } from '#lib/course.js';
	import {
		deckLearned,
		isDeckOn,
		lessonNumber,
		loadProgress,
		nextLesson,
		path
	} from '#lib/progress.svelte.js';
	import type { PageProps } from './$types';

	let { data }: PageProps = $props();

	// Progress lives in the browser: read it once the page is there
	$effect(loadProgress);

	// The Brazil course: the topics you learn and the cards learned in each
	const onDecks = $derived(DECKS.filter((d) => isDeckOn(d.id)));
	const next = $derived(nextLesson());
	const totalLessons = $derived(path().length);
	const totalCards = $derived(onDecks.reduce((n, d) => n + d.cardIds.length, 0));
	const learnedCards = $derived(onDecks.reduce((n, d) => n + deckLearned(d.id), 0));
	const percent = $derived(totalCards ? Math.round((learnedCards / totalCards) * 100) : 0);

	const courses = [
		{ name: 'Brazil', status: 'In progress' },
		{ name: 'United States', status: 'Soon' },
		{ name: 'Germany', status: 'Soon' },
		{ name: 'Indonesia', status: 'Soon' }
	];

	// Clue of the day (from Plonk It's Brazil guide, CC BY-NC-SA 4.0)
	let revealed = $state(false);
</script>

<PageHeader title="Home" crumbs={[{ label: 'GeoSquid' }]}>
	{#snippet actions()}
		<ContinueButton />
	{/snippet}
</PageHeader>

<!-- Tablet and desktop (md+): exactly one screen tall (minus the 4rem
     header and its 1px border), no page scroll. Left: the course with the
     clue of the day under it. Right: the map, taking whatever height the
     courses list leaves. Phone: one column, course then clue (the map is
     in the tab bar). -->
<main
	class="grid gap-3 p-3 md:h-[calc(100dvh-4rem-1px)] md:grid-cols-[minmax(0,2fr)_minmax(15rem,1fr)] md:grid-rows-1"
>
	<!-- Left column: the course, then the clue of the day right under it.
	     The course panel ends where its list ends; on short screens it
	     shrinks and its list scrolls inside (min-h-0). -->
	<div class="flex min-h-0 flex-col gap-3">
		<Panel title="Current course" class="min-h-0">
			<div class="flex items-end justify-between gap-4">
				<div>
					<p class="font-display text-4xl font-bold">Brazil</p>
					<p class="text-mist">
						{learnedCards} / {totalCards} cards · {totalLessons} lessons ·
						<a href={resolve('/learn')} class="underline-offset-2 hover:text-ink hover:underline"
							>change</a
						>
					</p>
				</div>
				<p class="font-display text-3xl font-semibold text-mist tabular-nums">{percent}%</p>
			</div>
			<div class="mt-3 h-1.5 bg-reef">
				<div class="h-full bg-squid" style:width="{percent}%"></div>
			</div>

			<!-- Daily goal: placeholder until reviews exist -->
			<p class="mt-2 flex items-center gap-2 text-sm text-mist">
				<Icon name="flame" class="size-4 text-fog" />
				<span><span class="text-ink tabular-nums">0 / 20</span> reviews today</span>
				<span class="text-fog">·</span>
				No streak yet
			</p>

			<!-- Phone: just the next lesson (the full list is for bigger screens) -->
			{#if next}
				<a
					href={resolve(`/learn/lesson?id=${next.id}`)}
					class="mt-3 flex items-center gap-3 border-t border-line pt-3 md:hidden"
				>
					<span class="min-w-0 truncate font-medium">
						<span class="text-mist tabular-nums">Lesson {lessonNumber(next.id)}</span>
						· {next.title}
					</span>
					<span class="ml-auto shrink-0 text-xs font-bold tracking-wide text-squid uppercase"
						>Next</span
					>
				</a>
			{/if}

			<!-- Every topic you learn: cards learned, Next on the one the next
			     lesson mixes. Two columns so ten topics fit a laptop screen. -->
			<ol class="mt-2 hidden border-t border-line md:grid md:grid-cols-2 md:gap-x-6">
				{#each onDecks as deck (deck.id)}
					{@const learned = deckLearned(deck.id)}
					{@const all = deck.cardIds.length}
					<li class="border-b border-line">
						<a
							href={resolve('/learn')}
							class="-mx-2 flex items-center gap-3 px-2 py-1.5 hover:bg-reef"
						>
							<span class="min-w-0 truncate font-medium">{deck.name}</span>
							<span class="ml-auto flex shrink-0 items-center gap-3">
								{#if next?.deck === deck.id}
									<span class="text-xs font-bold tracking-wide text-squid uppercase">Next</span>
								{/if}
								<span
									class={[
										'flex items-center gap-1.5 text-sm tabular-nums',
										learned === all ? 'text-kelp' : 'text-mist'
									]}
								>
									{#if learned === all}<Icon name="check" class="size-4" />{/if}
									{learned} / {all}
								</span>
							</span>
						</a>
					</li>
				{/each}
			</ol>
		</Panel>
		<!-- Clue of the day -->
		<!-- Question and answer side by side on bigger screens, to keep it short -->
		<Panel title="Clue of the day" class="shrink-0">
			<div class="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
				<p class="leading-snug">Where in Brazil do you find brown, mushroom-shaped insulators?</p>
				{#if revealed}
					<p class="shrink-0 sm:text-right">
						<span class="font-display text-2xl font-bold text-kelp">Pernambuco</span>
						<span class="block text-sm text-mist">Only there · Plonk It</span>
					</p>
				{:else}
					<button
						class="h-9 shrink-0 self-start rounded-panel border border-line bg-reef px-4 font-medium hover:border-mist sm:self-auto"
						onclick={() => (revealed = true)}
					>
						Reveal
					</button>
				{/if}
			</div>
		</Panel>
	</div>

	<div class="flex min-h-0 flex-col gap-3">
		<!-- Explore: the map shrinks to the height left in the column -->
		<Panel title="Explore Brazil" class="hidden min-h-0 flex-1 md:flex" flush>
			{#snippet action()}
				<a
					href={resolve('/brazil')}
					class="flex items-center gap-1 text-sm text-mist hover:text-squid"
				>
					Open map <Icon name="arrow" class="size-4" />
				</a>
			{/snippet}
			<div class="flex h-full items-center justify-center p-3">
				<!-- flex-col: the map takes the full width of this box (in a row it
				     would shrink to its smallest size and sit on the left) -->
				<div class="flex aspect-square h-full max-w-full flex-col justify-center">
					<BrazilMap
						topo={data.topo}
						capitals={data.capitals}
						layer="regions"
						showCapitals={false}
						selected={null}
						onselect={() => goto(resolve('/brazil'))}
						zoomable
					/>
				</div>
			</div>
		</Panel>

		<!-- Courses (bigger screens only for now) -->
		<Panel title="Courses" class="hidden shrink-0 md:flex" flush>
			<ul class="divide-y divide-line">
				{#each courses as course (course.name)}
					<li
						class={[
							'flex items-center justify-between px-4 py-2',
							course.status === 'Soon' && 'text-fog'
						]}
					>
						<span class="font-medium">{course.name}</span>
						<span class="text-sm">{course.status}</span>
					</li>
				{/each}
			</ul>
		</Panel>
	</div>
</main>
