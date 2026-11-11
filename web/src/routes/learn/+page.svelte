<!--
  Learn: the course dashboard.
  - Your progress: lessons done, cards learned, and the topics you learn
    ("Customize topics" opens the list of decks to tick).
  - Path: the units of those topics, each with its 3 lessons (2 to learn,
    1 review), like Duolingo. Any lesson can be played at any time; the
    next one (what Continue opens) has the big Start button.
  Progress is saved in this browser and can be synced (see Settings).
-->
<script lang="ts">
	import { resolve } from '$app/paths';
	import ContinueButton from '#lib/ContinueButton.svelte';
	import Icon from '#lib/Icon.svelte';
	import PageHeader from '#lib/PageHeader.svelte';
	import Panel from '#lib/Panel.svelte';
	import { DECKS, REVIEWS, type Lesson } from '#lib/course.js';
	import {
		deckLearned,
		isDeckOn,
		isDone,
		lessonNumber,
		loadProgress,
		nextLesson,
		path,
		pathUnits,
		progress,
		setDeckOn
	} from '#lib/progress.svelte.js';

	$effect(loadProgress);

	const GROUPS = [
		{ id: 'clues', label: 'Street clues' },
		{ id: 'facts', label: 'Facts' }
	] as const;

	const units = $derived(pathUnits());
	const next = $derived(nextLesson());
	const lessons = $derived(path());
	const doneCount = $derived(lessons.filter((l) => isDone(l.id)).length);

	const onDecks = $derived(DECKS.filter((d) => isDeckOn(d.id)));
	const totalCards = $derived(onDecks.reduce((n, d) => n + d.cardIds.length, 0));
	const learnedCards = $derived(onDecks.reduce((n, d) => n + deckLearned(d.id), 0));

	/** "6 new · 2 review" or "Review · 11 cards" */
	const detail = (l: Lesson) =>
		l.kind === 'review'
			? `Review · ${l.cardIds.length} cards, harder`
			: `${l.cardIds.length} new · ${REVIEWS} review`;

	const href = (l: Lesson) => resolve(`/learn/lesson?id=${l.id}`);

	let topics = $state<HTMLDialogElement>();

	// Bring the next lesson into view when the path is longer than the panel
	let nextRow = $state<HTMLElement>();
	$effect(() => {
		nextRow?.scrollIntoView({ block: 'center' });
	});
</script>

<PageHeader title="Learn" crumbs={[{ label: 'Brazil' }]}>
	{#snippet actions()}
		<ContinueButton />
	{/snippet}
</PageHeader>

<!-- md+: one screen tall; the path scrolls inside its panel -->
<main class="mx-auto flex w-full max-w-3xl flex-col gap-3 p-3 md:h-[calc(100dvh-4rem-1px)]">
	<!-- Your progress, in one glance -->
	<Panel title="Your progress" class="shrink-0">
		<div class="flex flex-wrap items-end justify-between gap-x-6 gap-y-1">
			<p>
				<span class="font-display text-3xl font-bold tabular-nums">{doneCount}</span>
				<span class="text-mist tabular-nums">/ {lessons.length} lessons</span>
			</p>
			<p class="text-mist">
				<span class="text-ink tabular-nums">{learnedCards}</span>
				<span class="tabular-nums">/ {totalCards}</span> cards learned
			</p>
		</div>
		<div class="mt-2 h-1.5 bg-reef">
			<div
				class="h-full bg-squid"
				style:width="{lessons.length ? (doneCount / lessons.length) * 100 : 0}%"
			></div>
		</div>
		<div class="mt-3 flex items-center justify-between gap-3 border-t border-line pt-3">
			<p class="min-w-0 truncate text-sm text-mist">
				Topics: <span class="text-ink">{onDecks.length} of {DECKS.length}</span>
			</p>
			<button
				class="flex h-9 shrink-0 items-center rounded-panel border border-line bg-reef px-3 text-sm font-medium hover:border-mist"
				onclick={() => topics?.showModal()}
			>
				Customize topics
			</button>
		</div>
	</Panel>

	<!-- The path: unit after unit, 3 lessons each -->
	<Panel title="Path" class="min-h-0 md:flex-1" flush>
		{#if units.length === 0}
			<p class="p-4 text-mist">Pick at least one topic to get lessons.</p>
		{/if}
		<ol>
			{#each units as unit, u (unit.id)}
				{@const unitDone = unit.lessons.filter((l) => isDone(l.id)).length}
				<li class="border-b border-line">
					<!-- Unit title -->
					<div class="flex items-baseline gap-3 bg-panel-head/60 px-4 py-2">
						<span class="text-xs font-semibold tracking-wide text-mist uppercase">Unit {u + 1}</span
						>
						<span class="min-w-0 flex-1 truncate font-display text-lg font-semibold"
							>{unit.name}</span
						>
						<span
							class={[
								'flex shrink-0 items-center gap-1.5 text-sm tabular-nums',
								unitDone === unit.lessons.length ? 'text-kelp' : 'text-mist'
							]}
						>
							{#if unitDone === unit.lessons.length}<Icon name="check" class="size-4" />{/if}
							{unitDone} / {unit.lessons.length}
						</span>
					</div>

					<!-- Its lessons -->
					<ol>
						{#each unit.lessons as lesson (lesson.id)}
							{@const result = progress.lessons[lesson.id]}
							{@const isNext = lesson.id === next?.id}
							{#if isNext}
								<!-- The next lesson, highlighted, with its big Start button -->
								<li bind:this={nextRow} class="border-t border-line bg-reef/50 px-4 py-3">
									<div class="flex items-center gap-3">
										<span
											class="grid size-8 shrink-0 place-items-center rounded-panel border border-squid font-display font-semibold tabular-nums"
											>{lessonNumber(lesson.id)}</span
										>
										<span class="min-w-0 flex-1">
											<span class="block font-medium">{lesson.title}</span>
											<span class="block text-sm text-mist">{detail(lesson)}</span>
										</span>
									</div>
									<a
										href={href(lesson)}
										class="mt-3 flex h-11 items-center justify-center gap-2 rounded-panel bg-squid px-4 font-display font-bold tracking-wide text-on-squid uppercase hover:brightness-105 sm:ml-11 sm:w-fit"
									>
										Start lesson {lessonNumber(lesson.id)}
										<Icon name="arrow" class="size-4" />
									</a>
								</li>
							{:else}
								<li class="flex items-center gap-3 border-t border-line px-4 py-2.5">
									<span
										class={[
											'grid size-8 shrink-0 place-items-center rounded-panel font-display font-semibold tabular-nums',
											result ? 'bg-kelp/15 text-kelp' : 'border border-line text-mist'
										]}>{lessonNumber(lesson.id)}</span
									>
									<span class="min-w-0 flex-1">
										<span class={['block truncate', !result && 'text-mist']}>{lesson.title}</span>
										<span class="block truncate text-sm text-fog">{detail(lesson)}</span>
									</span>
									{#if result}
										<span class="shrink-0 text-sm text-mist tabular-nums">
											best {result.best}/{result.total}
										</span>
									{/if}
									<a
										href={href(lesson)}
										class="shrink-0 text-sm text-mist hover:text-squid"
										aria-label="{result ? 'Replay' : 'Start'} {lesson.title}"
										>{result ? 'Replay' : 'Start'}</a
									>
								</li>
							{/if}
						{/each}
					</ol>
				</li>
			{/each}
		</ol>
	</Panel>
</main>

<!-- Customize topics: tick the decks you learn. Unticked decks leave the
     path; lessons done and cards learned are kept.
     Clicking the dark area around the panel closes it. -->
<dialog
	bind:this={topics}
	aria-label="Customize topics"
	class="m-auto max-h-[calc(100dvh-1.5rem)] w-[min(32rem,calc(100vw-1.5rem))] rounded-panel border border-line bg-panel p-0 text-ink backdrop:bg-abyss/80"
	onclick={(e) => {
		if (e.target === topics) topics.close();
	}}
>
	<div class="flex items-center justify-between border-b border-line bg-panel-head px-4 py-1.5">
		<span class="font-display text-[15px] font-semibold">Customize topics</span>
		<button
			class="-mr-2 grid size-8 place-items-center text-mist hover:text-ink"
			aria-label="Close"
			onclick={() => topics?.close()}
		>
			<Icon name="close" class="size-4" />
		</button>
	</div>
	<div class="p-4">
		<p class="text-sm text-mist">
			Your path shows the units of the topics you tick. Unticking one keeps what you've done.
		</p>
		{#each GROUPS as group (group.id)}
			<p class="mt-4 mb-1 text-xs font-semibold tracking-wide text-mist uppercase">
				{group.label}
			</p>
			<ul class="divide-y divide-line">
				{#each DECKS.filter((d) => d.group === group.id) as deck (deck.id)}
					<li>
						<label class="flex cursor-pointer items-center gap-3 py-2 select-none">
							<input
								type="checkbox"
								class="size-4 shrink-0 accent-squid"
								checked={isDeckOn(deck.id)}
								onchange={(e) => setDeckOn(deck.id, e.currentTarget.checked)}
							/>
							<span class="min-w-0 flex-1">
								<span class={['block font-medium', !isDeckOn(deck.id) && 'text-fog']}
									>{deck.name}</span
								>
								<span class="block truncate text-sm text-fog">{deck.blurb}</span>
							</span>
							<span class="shrink-0 text-sm text-mist tabular-nums">
								{deckLearned(deck.id)} / {deck.cardIds.length}
							</span>
						</label>
					</li>
				{/each}
			</ul>
		{/each}
		<button
			class="mt-4 flex h-10 w-full items-center justify-center rounded-panel bg-squid font-display font-bold tracking-wide text-on-squid uppercase hover:brightness-105"
			onclick={() => topics?.close()}
		>
			Done
		</button>
	</div>
</dialog>
