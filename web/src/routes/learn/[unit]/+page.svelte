<!--
  A lesson about one theme, in two steps:
  1. Study: one card per clue the quiz will ask about (full photo, where
     it's found, the explanation). ← / → or Back / Next.
  2. Quiz: 8 questions, one at a time. After each answer, the clue is shown
     with where it's found, then Continue. Keyboard: 1–4 pick, Enter continues.
-->
<script lang="ts">
	import { resolve } from '$app/paths';
	import BrazilMap from '#lib/BrazilMap.svelte';
	import Icon from '#lib/Icon.svelte';
	import PageHeader from '#lib/PageHeader.svelte';
	import Panel from '#lib/Panel.svelte';
	import { buildIndex, REGION_NAMES, type Clue } from '#lib/brazil.js';
	import {
		ANSWER_MAP_X,
		buildLesson,
		PHOTO_SIZE,
		placesOf,
		type Question,
		type Scope
	} from '#lib/course.js';
	import { recordLesson } from '#lib/progress.svelte.js';
	import type { PageProps } from './$types';

	let { data }: PageProps = $props();

	const index = $derived(buildIndex(data.topo, data.capitals));

	function placeName(scope: Scope, code: string): string {
		return scope === 'states' ? (index.states.get(code)?.name ?? code) : REGION_NAMES[code];
	}

	// ---- Lesson state ------------------------------------------------------
	let phase = $state<'study' | 'quiz'>('study');
	let card = $state(0); // which study card is shown
	let questions = $state<Question[]>([]);
	let current = $state(0);
	let picked = $state<string | null>(null); // the answer given (null = not yet)
	let score = $state(0);

	const photoUrl = (clue: Clue) => `/data/brazil/${clue.image}`;

	function start() {
		// A local copy: reading `questions` back here would make the effect
		// below that calls start() run again, forever
		const lesson = buildLesson(data.theme, data.clues.clues);
		questions = lesson;
		phase = 'study';
		card = 0;
		current = 0;
		picked = null;
		score = 0;
		// Start loading every photo of the lesson now, while you study, so
		// each question's photos are ready when it shows up
		for (const question of lesson) {
			for (const clue of question.kind === 'spot' ? question.clues : [question.clue]) {
				new Image().src = photoUrl(clue);
			}
		}
	}

	// The study cards: the clue behind each question, in quiz order
	const studyClues = $derived([
		...new Map(
			questions.map((question) => {
				const clue =
					question.kind === 'spot'
						? question.clues.find((c) => c.id === question.answer)!
						: question.clue;
				return [clue.id, clue] as const;
			})
		).values()
	]);
	const studied = $derived(studyClues[card] as Clue | undefined);

	function startQuiz() {
		phase = 'quiz';
		window.scrollTo({ top: 0 });
	}

	function nextCard() {
		if (card < studyClues.length - 1) card++;
		else startQuiz();
	}
	// A new lesson whenever the unit changes (and on first load)
	$effect.pre(() => {
		void data.theme.id;
		start();
	});

	const q = $derived(questions[current] as Question | undefined);
	const finished = $derived(questions.length > 0 && current >= questions.length);

	function isRight(question: Question, answer: string): boolean {
		return question.kind === 'spot'
			? answer === question.answer
			: question.answers.includes(answer);
	}

	function answer(value: string) {
		if (!q || picked !== null) return;
		picked = value;
		if (isRight(q, value)) score++;
	}

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
		// Lesson over: save it (the unit counts as done, best score kept)
		if (current === questions.length) recordLesson(data.theme.id, score, questions.length);
	}

	const correct = $derived(q && picked !== null ? isRight(q, picked) : false);

	// The clue explained after answering (for "spot": the right photo's clue)
	const shownClue = $derived<Clue | undefined>(
		q ? (q.kind === 'spot' ? q.clues.find((c) => c.id === q.answer) : q.clue) : undefined
	);

	// "Found in São Paulo, Paraná · rarely in Bahia"
	function foundIn(clue: Clue): string {
		const { scope, answers, tagged } = placesOf(clue);
		const rare = tagged.filter((t) => !answers.includes(t));
		const main = answers.map((a) => placeName(scope, a)).join(', ');
		return rare.length
			? `${main} · rarely ${rare.map((r) => placeName(scope, r)).join(', ')}`
			: main;
	}

	// The 4 choices of the current question, as [value, label]
	const options = $derived.by((): [string, string][] => {
		if (!q) return [];
		if (q.kind === 'where') return q.options.map((o) => [o, placeName(q.scope, o)]);
		if (q.kind === 'spot') return q.clues.map((c) => [c.id, c.id]);
		return [];
	});

	function onkeydown(e: KeyboardEvent) {
		if (phase === 'study') {
			if (e.key === 'ArrowRight' || e.key === 'Enter') {
				e.preventDefault();
				nextCard();
			} else if (e.key === 'ArrowLeft' && card > 0) card--;
			return;
		}
		if (finished || !q) return;
		if (picked === null && /^[1-4]$/.test(e.key) && options[Number(e.key) - 1]) {
			answer(options[Number(e.key) - 1][0]);
		} else if (picked !== null && e.key === 'Enter') {
			e.preventDefault();
			next();
		}
	}

	const prompt = $derived(
		!q
			? ''
			: q.kind === 'where'
				? q.scope === 'states'
					? 'Which state is this from?'
					: 'Which region is this from?'
				: q.kind === 'map'
					? q.scope === 'states'
						? 'Tap a state where you’d see this'
						: 'Tap the region where you’d see this'
					: `Which one is from ${placeName(q.scope, q.place)}?`
	);

	// Colors of an option once answered: the right one green, a wrong pick red
	function optionState(value: string): 'right' | 'wrong' | 'idle' | 'dim' {
		if (!q || picked === null) return 'idle';
		if (isRight(q, value)) return 'right';
		if (value === picked) return 'wrong';
		return 'dim';
	}
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

<PageHeader
	title={data.theme.name}
	crumbs={[{ label: 'Learn', href: '/learn' }, { label: 'Brazil' }]}
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
				<span class="text-sm text-mist tabular-nums">{card + 1} / {studyClues.length}</span>
			{/snippet}

			<!-- The full photo, Plonk It's map included: here it helps -->
			<img
				src={photoUrl(studied)}
				alt={studied.text}
				width={studied.imageSize?.[0]}
				height={studied.imageSize?.[1]}
				class="mx-auto block h-auto max-h-[45dvh] w-auto max-w-full rounded-panel bg-reef text-transparent"
			/>

			<p class="mt-4 text-xs font-semibold tracking-wide text-mist uppercase">Found in</p>
			<p class="font-display text-2xl leading-tight font-bold">{foundIn(studied)}</p>
			<p class="mt-3 leading-snug">{studied.text}</p>
			{#if studied.note}
				<p class="mt-1.5 text-sm leading-snug text-mist">Note: {studied.note}</p>
			{/if}

			<div class="mt-5 flex items-center gap-2">
				<button
					class="flex h-10 items-center gap-1 rounded-panel border border-line px-3 font-display font-semibold tracking-wide text-mist uppercase hover:text-ink disabled:opacity-40"
					disabled={card === 0}
					onclick={() => card--}
				>
					<Icon name="back" class="size-4" />
					Back
				</button>
				<button
					class="flex h-10 flex-1 items-center justify-center gap-2 rounded-panel bg-squid px-4 font-display font-bold tracking-wide text-on-squid uppercase hover:brightness-105 sm:flex-none"
					onclick={nextCard}
				>
					{card < studyClues.length - 1 ? 'Next' : 'Start quiz'}
					<Icon name="arrow" class="size-4" />
				</button>
				{#if card < studyClues.length - 1}
					<button class="ml-auto text-sm text-mist hover:text-ink" onclick={startQuiz}>
						Skip to quiz
					</button>
				{/if}
			</div>
		</Panel>
		<p class="mt-3 px-1 text-xs text-fog">
			Clues and photos: Plonk It, {data.clues.license}
		</p>
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
				<button
					class="flex h-10 items-center gap-2 rounded-panel bg-squid px-4 font-display font-bold tracking-wide text-on-squid uppercase hover:brightness-105"
					onclick={start}
				>
					Again
				</button>
				<a
					href={resolve('/learn')}
					class="flex h-10 items-center rounded-panel border border-line px-4 font-display font-semibold tracking-wide text-mist uppercase hover:text-ink"
				>
					All themes
				</a>
			</div>
		</Panel>
	{:else if q}
		<Panel title={prompt}>
			{#snippet action()}
				<span class="text-sm text-mist tabular-nums">{current + 1} / {questions.length}</span>
			{/snippet}

			{#if q.kind === 'where' || q.kind === 'map'}
				{@render quizPhoto(
					q.clue,
					q.kind === 'map' ? 'h-[min(30dvh,16rem)]' : 'h-[min(45dvh,26rem)]'
				)}
			{/if}

			{#if q.kind === 'where'}
				<div class="mt-4 grid grid-cols-2 gap-2">
					{#each options as [value, label], i (value)}
						{@const st = optionState(value)}
						<button
							class={[
								'flex items-center gap-3 rounded-panel border px-3 py-3 text-left font-medium transition-colors',
								st === 'idle' && 'border-line bg-panel-head hover:bg-reef',
								st === 'right' && 'border-kelp bg-kelp/15',
								st === 'wrong' && 'border-coral bg-coral/15',
								st === 'dim' && 'border-line text-fog'
							]}
							disabled={picked !== null}
							onclick={() => answer(value)}
						>
							<span class="text-sm text-fog tabular-nums">{i + 1}</span>
							{label}
						</button>
					{/each}
				</div>
			{:else if q.kind === 'map'}
				<div class="mx-auto mt-3 max-w-md">
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

		<!-- Feedback: right or wrong, then what the clue is and where it's found -->
		{#if picked !== null && shownClue}
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
				<p class="mt-2 leading-snug">{shownClue.text}</p>
				<p class="mt-2 text-sm text-mist">
					Found in <span class="text-ink">{foundIn(shownClue)}</span>
				</p>
				<button
					class="mt-4 flex h-10 w-full items-center justify-center gap-2 rounded-panel bg-squid px-4 font-display font-bold tracking-wide text-on-squid uppercase hover:brightness-105 sm:w-auto"
					onclick={next}
				>
					Continue
					<Icon name="arrow" class="size-4" />
				</button>
			</section>
		{/if}

		<p class="mt-3 px-1 text-xs text-fog">
			Clues and photos: Plonk It, {data.clues.license}
		</p>
	{/if}
</main>
