// Course progress, saved in this browser (localStorage): which decks you
// learn, which cards you've learned, and the lessons you've done. No account:
// a sync code can share it between devices (see sync.svelte.ts). The format
// is in save.ts.
//
// The course is a list of units of 3 lessons (see UNITS in course.ts); the
// path is the lessons of the decks you tick, in that order.
//
// Pages call loadProgress() once they're in the browser (in an $effect):
// the static build has no browser storage, so the pages are built as
// "nothing done yet, every deck on" and fill in after loading.
import { DECKS, LESSONS, UNITS, type Lesson } from './course';
import { cleanSave, type SaveData } from './save';

// Older formats only held test runs: not kept
const KEY = 'geosquid:brazil:v4';

export const progress = $state<SaveData & { loaded: boolean }>({
	v: 4,
	updatedAt: 0,
	decks: {},
	cards: {},
	lessons: {},
	loaded: false
});

export function loadProgress() {
	if (progress.loaded) return;
	try {
		const saved = cleanSave(JSON.parse(localStorage.getItem(KEY) ?? 'null'));
		if (saved) setAll(saved);
	} catch {
		// Private mode or blocked storage: start empty
	}
	progress.loaded = true;
}

function setAll(data: SaveData) {
	progress.updatedAt = data.updatedAt;
	progress.decks = data.decks;
	progress.cards = data.cards;
	progress.lessons = data.lessons;
}

/** A plain copy of the progress, as saved (for syncing) */
export function currentSave(): SaveData {
	loadProgress();
	return $state.snapshot({
		v: 4,
		updatedAt: progress.updatedAt,
		decks: progress.decks,
		cards: progress.cards,
		lessons: progress.lessons
	});
}

function writeLocal() {
	try {
		localStorage.setItem(KEY, JSON.stringify(currentSave()));
	} catch {
		// Storage full or blocked: progress just won't survive a refresh
	}
}

// Sync (sync.svelte.ts) listens to every change made on this device
let listener: (() => void) | null = null;
export const onChange = (fn: () => void) => (listener = fn);

function save() {
	progress.updatedAt = Date.now();
	writeLocal();
	listener?.();
}

/** Replaces the progress with a copy from the sync server (not sent back) */
export function applySave(data: SaveData) {
	setAll(data);
	progress.loaded = true;
	writeLocal();
}

// ---- Decks ------------------------------------------------------------------

export const isDeckOn = (deck: string) => progress.decks[deck] !== false;

export function setDeckOn(deck: string, on: boolean) {
	loadProgress();
	progress.decks[deck] = on;
	save();
}

export const enabledDecks = () => DECKS.filter((d) => isDeckOn(d.id)).map((d) => d.id);

// ---- Cards --------------------------------------------------------------------

export const isLearned = (card: string) => card in progress.cards;

/** Cards learned in a deck */
export const deckLearned = (deck: string) =>
	DECKS.find((d) => d.id === deck)!.cardIds.filter(isLearned).length;

/** Learned cards of the enabled decks: where reviews are picked from */
export const reviewPool = () =>
	DECKS.filter((d) => isDeckOn(d.id)).flatMap((d) => d.cardIds.filter(isLearned));

// ---- Lessons ------------------------------------------------------------------

export const isDone = (lesson: string) => lesson in progress.lessons;

/** The path: lessons of the decks you learn, in order */
export const path = (): Lesson[] => LESSONS.filter((l) => isDeckOn(l.deck));

/** The units of the decks you learn */
export const pathUnits = () => UNITS.filter((u) => isDeckOn(u.deck));

/** What Continue opens: the first lesson of the path not done yet */
export const nextLesson = (): Lesson | null => path().find((l) => !isDone(l.id)) ?? null;

/** "Lesson 5": its number along the path (null if its deck is off) */
export function lessonNumber(lesson: string): number | null {
	const i = path().findIndex((l) => l.id === lesson);
	return i < 0 ? null : i + 1;
}

/** Called when a lesson ends: its cards are learned, best score kept */
export function recordLesson(lesson: Lesson, score: number, total: number) {
	loadProgress();
	const now = Date.now();
	for (const id of lesson.cardIds) progress.cards[id] ??= { learnedAt: now };
	const before = progress.lessons[lesson.id];
	progress.lessons[lesson.id] = {
		best: Math.max(score, before?.best ?? 0),
		total: before && before.best > score ? before.total : total,
		doneAt: before?.doneAt ?? now,
		at: now
	};
	save();
}
