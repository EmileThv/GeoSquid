// The saved progress format, shared by the browser (progress.svelte.ts) and
// the sync server (routes/api/sync): what it looks like, how to check data
// received from elsewhere, and how to merge two copies.

/** A lesson you've done, and your best score on it */
export interface LessonResult {
	best: number;
	total: number;
	doneAt: number; // first finished (ms since 1970)
	at: number; // last played
}

/** Everything saved. Versioned, so a future format can upgrade old saves. */
export interface SaveData {
	v: 4;
	updatedAt: number; // last change
	decks: Record<string, boolean>; // deck id → learning it? (missing = yes)
	cards: Record<string, { learnedAt: number }>; // learned cards
	lessons: Record<string, LessonResult>; // lesson id ("poles-2") → result
}

// ---- Checking data from elsewhere ------------------------------------------
// The sync server stores whatever a browser sends, and a browser loads what
// the server returns: both rebuild a clean copy with only the known fields,
// and refuse anything that doesn't fit.

const MAX_CARDS = 5000;
const MAX_LESSONS = 2000;

const isId = (x: unknown): x is string => typeof x === 'string' && x.length > 0 && x.length < 80;
const isNum = (x: unknown): x is number => typeof x === 'number' && Number.isFinite(x) && x >= 0;
const isObject = (x: unknown): x is Record<string, unknown> => !!x && typeof x === 'object';

/** A clean copy of `x` if it's a valid save, else null */
export function cleanSave(x: unknown): SaveData | null {
	if (!isObject(x) || x.v !== 4 || !isNum(x.updatedAt)) return null;
	if (!isObject(x.decks) || !isObject(x.cards) || !isObject(x.lessons)) return null;

	const decks: SaveData['decks'] = {};
	for (const [k, v] of Object.entries(x.decks)) {
		if (!isId(k) || typeof v !== 'boolean') return null;
		decks[k] = v;
	}

	const cards: SaveData['cards'] = {};
	const cardEntries = Object.entries(x.cards);
	if (cardEntries.length > MAX_CARDS) return null;
	for (const [k, v] of cardEntries) {
		const learnedAt = isObject(v) ? v.learnedAt : undefined;
		if (!isId(k) || !isNum(learnedAt)) return null;
		cards[k] = { learnedAt };
	}

	const lessons: SaveData['lessons'] = {};
	const lessonEntries = Object.entries(x.lessons);
	if (lessonEntries.length > MAX_LESSONS) return null;
	for (const [k, l] of lessonEntries) {
		if (!isId(k) || !isObject(l) || !isNum(l.best) || !isNum(l.total) || !isNum(l.at)) return null;
		const doneAt = isNum(l.doneAt) ? l.doneAt : l.at;
		lessons[k] = { best: l.best, total: l.total, doneAt, at: l.at };
	}

	return { v: 4, updatedAt: x.updatedAt, decks, cards, lessons };
}

// ---- Merging two copies --------------------------------------------------------
// Two devices may both have played while offline. Nothing is lost:
// - cards: every card learned on either device stays learned
// - lessons: done on either device counts as done, with the best score
// - decks ticked: the most recently changed copy wins (it's a setting)

export function mergeSaves(a: SaveData, b: SaveData): SaveData {
	const cards: SaveData['cards'] = { ...a.cards };
	for (const [id, c] of Object.entries(b.cards)) {
		cards[id] = { learnedAt: Math.min(c.learnedAt, cards[id]?.learnedAt ?? Infinity) };
	}

	const lessons: SaveData['lessons'] = { ...a.lessons };
	for (const [id, l] of Object.entries(b.lessons)) {
		const seen = lessons[id];
		lessons[id] = seen
			? {
					best: Math.max(seen.best, l.best),
					total: seen.best >= l.best ? seen.total : l.total,
					doneAt: Math.min(seen.doneAt, l.doneAt),
					at: Math.max(seen.at, l.at)
				}
			: { ...l };
	}

	return {
		v: 4,
		updatedAt: Math.max(a.updatedAt, b.updatedAt),
		decks: { ...(a.updatedAt >= b.updatedAt ? a.decks : b.decks) },
		cards,
		lessons
	};
}
