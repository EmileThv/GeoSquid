<!--
  A lesson (see UNITS in course.ts). A learn lesson has two steps:
  1. Study: one card per new thing to learn (a clue photo, a capital, an
     area-code decade), with the answer. ← / → or Back / Next.
  2. Quiz: the new cards and 2 cards from other units to review, mixed
     together; 2 new cards come back a second time.
  A review lesson (the 3rd of each unit) goes straight to a harder quiz on
  every card of the unit.
  After each answer, the card is explained, then Continue.
  Keyboard: 1–4 pick, Enter continues.
  /learn/lesson?id=poles-2 plays that lesson; without ?id, the next one.
-->
<script lang="ts">
	import { untrack } from 'svelte';
	import { resolve } from '$app/paths';
	import { page } from '$app/state';
	import BrazilMap from '#lib/BrazilMap.svelte';
	import Icon from '#lib/Icon.svelte';
	import PageHeader from '#lib/PageHeader.svelte';
	import Panel from '#lib/Panel.svelte';
	import { buildIndex, REGION_NAMES, type Clue } from '#lib/brazil.js';
	import {
		ANSWER_MAP_X,
		buildQuiz,
		deckOf,
		deckOfCard,
		makeCard,
		PHOTO_SIZE,
		placeList,
		lessonById,
		REVIEWS,
		STATE_REGION,
		unitOf,
		type Card,
		type CourseData,
		type Lesson,
		type Question
	} from '#lib/course.js';
	import {
		lessonNumber,
		loadProgress,
		nextLesson,
		recordLesson,
		reviewPool
	} from '#lib/progress.svelte.js';
	import type { PageProps } from './$types';

	let { data }: PageProps = $props();

	// This page only runs in the browser (ssr = false): progress can load now
	loadProgress();

	const index = $derived(buildIndex(data.topo, data.capitals));
	const courseData = $derived<CourseData>({
		clues: new Map(data.clues.clues.map((c) => [c.id, c])),
		index
	});

	const toCard = (id: string) => makeCard(id, deckOfCard(id).id, courseData);
	const toCards = (ids: string[]) => ids.map(toCard).filter((c): c is Card => c !== null);
	// Every card of a deck, for the wrong options of "Which one is from X?"
	const pool = (deck: string) => toCards(deckOf(deck).cardIds);

	const stateName = (uf: string) => index.states.get(uf)?.name ?? uf;

	const shuffled = <T,>(items: T[]) => [...items].sort(() => Math.random() - 0.5);

	// ---- Which lesson ------------------------------------------------------
	let lesson = $state<Lesson | null>(null);
	let reviewIds = $state<string[]>([]);
	let cards = $state<Card[]>([]); // learn: its new cards; review: the whole unit

	/** Sets up lesson `id`, or the next lesson of the path when id is missing */
	function begin(id: string | null) {
		lesson = (id && lessonById(id)) || nextLesson();
		cards = lesson ? toCards(lesson.cardIds) : [];
		// Learn lessons: 2 cards learned in other units, at random (spaced
		// repetition will choose them later). Review lessons: none.
		const own = lesson ? unitOf(lesson).lessons.flatMap((l) => l.cardIds) : [];
		reviewIds =
			lesson?.kind === 'learn'
				? shuffled(reviewPool().filter((c) => !own.includes(c))).slice(0, REVIEWS)
				: [];
		start();
	}

	const number = $derived(lesson ? lessonNumber(lesson.id) : null);
	const isReviewLesson = $derived(lesson?.kind === 'review');
	const hasClues = $derived(
		!!lesson &&
			[lesson.deck, ...reviewIds.map((c) => deckOfCard(c).id)].some(
				(d) => deckOf(d).group === 'clues'
			)
	);
	// ---- Lesson state ------------------------------------------------------
	let phase = $state<'study' | 'quiz'>('study');
	let card = $state(0); // which study card is shown
	let questions = $state<Question[]>([]);
	let current = $state(0);
	let picked = $state<string | null>(null); // the answer given (null = not yet)
	let score = $state(0);
	let saved = $state(false); // the result was recorded

	const photoUrl = (clue: Clue) => `/data/brazil/${clue.image}`;

	function start() {
		// A local copy, so the photos below are read from it
		const quiz = buildQuiz(cards, toCards(reviewIds), pool, courseData, isReviewLesson);
		questions = quiz;
		// Review lessons have nothing new to study: straight to the quiz
		phase = isReviewLesson ? 'quiz' : 'study';
		card = 0;
		current = 0;
		picked = null;
		score = 0;
		saved = false;
		// Start loading every photo of the lesson now, while you study, so
		// each question's photos are ready when it shows up
		for (const q of quiz) {
			for (const clue of q.kind === 'spot' ? q.clues : q.photo ? [q.photo] : []) {
				new Image().src = photoUrl(clue);
			}
		}
	}

	// Set up when the page opens, and when ?id= changes (declared after the
	// lesson state above, which begin() resets). untrack: progress
	// changes (saving the lesson at the end) must not restart it.
	$effect.pre(() => {
		const id = page.url.searchParams.get('id');
		untrack(() => begin(id));
	});

	const studied = $derived(cards[card] as Card | undefined);

	function startQuiz() {
		phase = 'quiz';
		window.scrollTo({ top: 0 });
	}

	function nextCard() {
		if (card < cards.length - 1) card++;
		else startQuiz();
	}

	const q = $derived(questions[current] as Question | undefined);
	const finished = $derived(questions.length > 0 && current >= questions.length);

	function answer(value: string) {
		if (!q || picked !== null) return;
		picked = value;
		if (q.answers.includes(value)) score++;
	}

	const correct = $derived(q && picked !== null ? q.answers.includes(picked) : false);

	// After answering, bring the feedback into view (on a phone it can sit
	// below the map, under the tab bar)
	let feedback = $state<HTMLElement>();
	$effect(() => {
		feedback?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
	});

	// Map feedback: every right answer green, a wrong tap red
	function mapMarks(answers: string[], tapped: string): Record<string, 'right' | 'wrong'> {
		const marks: Record<string, 'right' | 'wrong'> = {};
		for (const a of answers) marks[a] = 'right';
		if (!answers.includes(tapped)) marks[tapped] = 'wrong';
		return marks;
	}

	function next() {
		picked = null;
		current++;
		if (current === questions.length && !saved && lesson) {
			saved = true;
			recordLesson(lesson, score, questions.length);
		}
	}

	// After a lesson: the next one of the path (computed once it's saved)
	const after = $derived(finished && saved ? nextLesson() : null);

	// ---- How each card is explained (study card and quiz feedback) --------

	// "Found in São Paulo, Paraná · rarely Bahia"
	// ("South, Amapá": regions by name, then the states outside them)
	function foundIn(clue: Clue): string {
		const name = (p: string) =>
			p.startsWith('region:') ? REGION_NAMES[p.slice('region:'.length)] : stateName(p);
		const { main, rare } = placeList(clue);
		const list = main.map(name).join(', ');
		return rare.length ? `${list} · rarely ${rare.map(name).join(', ')}` : list;
	}

	// "41–46" or "61, 64"
	function codesOf(uf: string, digit: number): string {
		const codes = (index.states.get(uf)?.ddds ?? []).filter((d) => Math.floor(d / 10) === digit);
		const consecutive = codes.every((d, i) => i === 0 || d === codes[i - 1] + 1);
		return consecutive && codes.length > 2
			? `${codes[0]}–${codes[codes.length - 1]}`
			: codes.join(', ');
	}

	/** The states a fact card is about, painted green on its map */
	function factMarks(c: Card): Record<string, 'right'> {
		const states = c.type === 'capital' ? [c.uf] : c.type === 'ddd' ? c.states : [];
		return Object.fromEntries(states.map((uf) => [uf, 'right' as const]));
	}

	// ---- Quiz helpers ---------------------------------------------------------

	// The 4 choices of the current question, as values (for keys 1–4)
	const choices = $derived(
		!q
			? []
			: q.kind === 'pick'
				? q.options.map((o) => o.value)
				: q.kind === 'spot'
					? q.clues.map((c) => c.id)
					: []
	);

	function onkeydown(e: KeyboardEvent) {
		if (phase === 'study') {
			if (e.key === 'ArrowRight' || e.key === 'Enter') {
				e.preventDefault();
				nextCard();
			} else if (e.key === 'ArrowLeft' && card > 0) card--;
			return;
		}
		if (finished || !q) return;
		if (picked === null && /^[1-4]$/.test(e.key) && choices[Number(e.key) - 1]) {
			answer(choices[Number(e.key) - 1]);
		} else if (picked !== null && e.key === 'Enter') {
			e.preventDefault();
			next();
		}
	}

	// Colors of an option once answered: right ones green, a wrong pick red
	function optionState(value: string): 'right' | 'wrong' | 'idle' | 'dim' {
		if (!q || picked === null) return 'idle';
		if (q.answers.includes(value)) return 'right';
		if (value === picked) return 'wrong';
		return 'dim';
	}

	// Which cards are reviews (shown as "Review" above the question)
	const isReview = (c: Card) => reviewIds.includes(c.id);

	const primaryButton =
		'flex h-10 items-center justify-center gap-2 rounded-panel bg-squid px-4 font-display font-bold tracking-wide text-on-squid uppercase hover:brightness-105';
	const secondaryButton =
		'flex h-10 items-center gap-1 rounded-panel border border-line px-3 font-display font-semibold tracking-wide text-mist uppercase hover:text-ink';
</script>

<svelte:window {onkeydown} />

<!-- A clue photo without the answer: Plonk It draws a map with the answer
     in red on the right of each photo, so only the part left of it is shown
     (object-left + the cropped aspect ratio hide the rest). -->
{#snippet quizPhoto(clue: Clue, size: string)}
	<img
		src={photoUrl(clue)}
		alt="The clue to place"
		style:aspect-ratio="{ANSWER_MAP_X} / {PHOTO_SIZE[1]}"
		class={[
			// text-transparent: while the photo loads, show the grey box, not the alt text
			'mx-auto block max-w-full rounded-panel bg-reef object-cover object-left text-transparent',
			size
		]}
	/>
{/snippet}

<!-- A small map with the states of a fact card in green -->
{#snippet factMap(c: Card, size: string)}
	<div class={['mx-auto', size]}>
		<BrazilMap
			topo={data.topo}
			capitals={data.capitals}
			layer="states"
			showCapitals={false}
			selected={null}
			marks={factMarks(c)}
			onselect={() => {}}
			zoomable={false}
		/>
	</div>
{/snippet}

<!-- What a card teaches: used on study cards (big) and after each answer -->
{#snippet explain(c: Card, big: boolean)}
	{#if c.type === 'clue'}
		{#if big}
			<p class="mt-4 text-xs font-semibold tracking-wide text-mist uppercase">Found in</p>
			<p class="font-display text-2xl leading-tight font-bold">{foundIn(c.clue)}</p>
		{/if}
		<p class={['leading-snug', big ? 'mt-3' : 'mt-2']}>{c.clue.text}</p>
		{#if c.clue.note && big}
			<p class="mt-1.5 text-sm leading-snug text-mist">Note: {c.clue.note}</p>
		{/if}
		{#if !big}
			<p class="mt-2 text-sm text-mist">
				Found in <span class="text-ink">{foundIn(c.clue)}</span>
			</p>
		{/if}
	{:else if c.type === 'capital'}
		<p class={['font-display leading-tight font-bold', big ? 'mt-4 text-3xl' : 'mt-2 text-xl']}>
			{c.city}
		</p>
		<p class="text-mist">
			Capital of <span class="text-ink">{stateName(c.uf)} ({c.uf})</span>
			· {REGION_NAMES[STATE_REGION[c.uf]]}
		</p>
	{:else}
		<p class={['font-display leading-tight font-bold', big ? 'mt-4 text-3xl' : 'mt-2 text-xl']}>
			{c.digit}x area codes
		</p>
		<ul class="mt-1 text-mist">
			{#each c.states as uf (uf)}
				<li>
					<span class="text-ink">{stateName(uf)}</span>
					<span class="tabular-nums">{codesOf(uf, c.digit)}</span>
				</li>
			{/each}
		</ul>
	{/if}
{/snippet}

<PageHeader
	title={lesson ? (number ? `Lesson ${number} · ${lesson.title}` : lesson.title) : 'All done'}
	crumbs={[{ label: 'Learn', href: '/learn' }, { label: lesson ? unitOf(lesson).name : 'Brazil' }]}
>
	{#snippet actions()}
		<a
			href={resolve('/learn')}
			class="grid size-10 place-items-center rounded-panel text-mist hover:bg-reef hover:text-ink"
			aria-label="Quit lesson"
		>
			<Icon name="close" class="size-5" />
		</a>
	{/snippet}
</PageHeader>

<!-- Progress through the quiz (empty while studying) -->
<div class="h-1.5 bg-reef">
	<div
		class="h-full bg-squid transition-[width] duration-150"
		style:width="{(Math.min(current + (picked !== null ? 1 : 0), questions.length) /
			Math.max(questions.length, 1)) *
			100}%"
	></div>
</div>

<main class="mx-auto w-full max-w-3xl p-3">
	{#if phase === 'study' && studied}
		<Panel title="Study">
			{#snippet action()}
				<span class="text-sm text-mist tabular-nums">{card + 1} / {cards.length}</span>
			{/snippet}

			{#if studied.type === 'clue'}
				<!-- The full photo, Plonk It's map included: here it helps -->
				<img
					src={photoUrl(studied.clue)}
					alt={studied.clue.text}
					width={studied.clue.imageSize?.[0]}
					height={studied.clue.imageSize?.[1]}
					class="mx-auto block h-auto max-h-[45dvh] w-auto max-w-full rounded-panel bg-reef text-transparent"
				/>
			{:else}
				{@render factMap(studied, 'max-w-[min(20rem,40dvh)]')}
			{/if}

			{@render explain(studied, true)}

			<div class="mt-5 flex items-center gap-2">
				<button
					class={[secondaryButton, 'disabled:opacity-40']}
					disabled={card === 0}
					onclick={() => card--}
				>
					<Icon name="back" class="size-4" />
					Back
				</button>
				<button class={[primaryButton, 'flex-1 sm:flex-none']} onclick={nextCard}>
					{card < cards.length - 1 ? 'Next' : 'Start quiz'}
					<Icon name="arrow" class="size-4" />
				</button>
				{#if card < cards.length - 1}
					<button class="ml-auto text-sm text-mist hover:text-ink" onclick={startQuiz}>
						Skip to quiz
					</button>
				{/if}
			</div>
		</Panel>
		{#if hasClues}
			<p class="mt-3 px-1 text-xs text-fog">
				Clues and photos: Plonk It, {data.clues.license}
			</p>
		{/if}
	{:else if !lesson}
		<Panel title="Every lesson done">
			<p class="text-mist">
				You've done every lesson of the topics you picked. Pick more topics on the Learn page, or
				replay any lesson there.
			</p>
			<a href={resolve('/learn')} class={[primaryButton, 'mt-4 w-fit']}>Back to Learn</a>
		</Panel>
	{:else if finished}
		<Panel title="Lesson complete">
			<p class="font-display text-5xl font-bold tabular-nums">
				{score}<span class="text-2xl text-fog"> / {questions.length}</span>
			</p>
			<p class="mt-1 text-mist">
				{score === questions.length
					? 'Perfect run.'
					: score >= questions.length / 2
						? 'Good. Run it again to lock it in.'
						: 'Tough one. The answers stick better on a second run.'}
			</p>
			<div class="mt-5 flex flex-wrap gap-2">
				{#if after}
					<a href={resolve(`/learn/lesson?id=${after.id}`)} class={primaryButton}>
						Lesson {lessonNumber(after.id)}: {after.title}
						<Icon name="arrow" class="size-4" />
					</a>
				{/if}
				<button class={after ? secondaryButton : primaryButton} onclick={start}>Again</button>
				<a href={resolve('/learn')} class={secondaryButton}>Back to Learn</a>
			</div>
		</Panel>
	{:else if q}
		<Panel title={q.prompt}>
			{#snippet action()}
				<span class="flex shrink-0 items-center gap-3 text-sm text-mist">
					{#if isReview(q.card)}
						<span class="text-xs font-bold tracking-wide text-lilac uppercase">Review</span>
					{/if}
					<span class="tabular-nums">{current + 1} / {questions.length}</span>
				</span>
			{/snippet}

			{#if q.photo}
				{@render quizPhoto(
					q.photo,
					q.kind === 'map' ? 'h-[min(30dvh,16rem)]' : 'h-[min(45dvh,26rem)]'
				)}
			{/if}

			{#if q.kind === 'pick'}
				<div class={['grid grid-cols-2 gap-2', q.photo && 'mt-4']}>
					{#each q.options as option, i (option.value)}
						{@const st = optionState(option.value)}
						<button
							class={[
								'flex items-center gap-3 rounded-panel border px-3 py-3 text-left font-medium transition-colors',
								st === 'idle' && 'border-line bg-panel-head hover:bg-reef',
								st === 'right' && 'border-kelp bg-kelp/15',
								st === 'wrong' && 'border-coral bg-coral/15',
								st === 'dim' && 'border-line text-fog'
							]}
							disabled={picked !== null}
							onclick={() => answer(option.value)}
						>
							<span class="text-sm text-fog tabular-nums">{i + 1}</span>
							{option.label}
						</button>
					{/each}
				</div>
			{:else if q.kind === 'map'}
				<div class={['mx-auto', q.photo ? 'mt-3 max-w-md' : 'max-w-lg']}>
					<BrazilMap
						topo={data.topo}
						capitals={data.capitals}
						layer={q.scope}
						showCapitals={false}
						selected={null}
						marks={picked !== null ? mapMarks(q.answers, picked) : {}}
						onselect={answer}
						zoomable={false}
					/>
				</div>
			{:else}
				<div class="grid grid-cols-2 gap-2">
					{#each q.clues as clue, i (clue.id)}
						{@const st = optionState(clue.id)}
						<button
							class={[
								'relative overflow-hidden rounded-panel border-2 transition-opacity',
								st === 'idle' && 'border-transparent hover:border-line',
								st === 'right' && 'border-kelp',
								st === 'wrong' && 'border-coral',
								st === 'dim' && 'border-transparent opacity-40'
							]}
							disabled={picked !== null}
							aria-label="Photo {i + 1}"
							onclick={() => answer(clue.id)}
						>
							{@render quizPhoto(clue, 'w-full')}
							<span
								class="absolute top-1.5 left-1.5 grid size-6 place-items-center rounded-panel bg-abyss/80 text-sm tabular-nums"
								>{i + 1}</span
							>
						</button>
					{/each}
				</div>
			{/if}
		</Panel>

		<!-- Feedback: right or wrong, then what the card teaches -->
		{#if picked !== null}
			<section
				bind:this={feedback}
				class={[
					'mt-3 scroll-mb-20 rounded-panel border bg-panel p-4 md:scroll-mb-3',
					correct ? 'border-kelp/60' : 'border-coral/60'
				]}
			>
				<p
					class={[
						'flex items-center gap-2 font-display text-xl font-bold',
						correct ? 'text-kelp' : 'text-coral'
					]}
				>
					<Icon name={correct ? 'check' : 'close'} class="size-5" />
					{correct ? 'Correct' : 'Not quite'}
				</p>
				{@render explain(q.card, false)}
				<button class={[primaryButton, 'mt-4 w-full sm:w-auto']} onclick={next}>
					Continue
					<Icon name="arrow" class="size-4" />
				</button>
			</section>
		{/if}

		{#if hasClues}
			<p class="mt-3 px-1 text-xs text-fog">
				Clues and photos: Plonk It, {data.clues.license}
			</p>
		{/if}
	{/if}
</main>
