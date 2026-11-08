// Course progress, saved in this browser (localStorage): which units are
// finished and their best score. No account: it stays on this device, and
// clearing site data resets it.
//
// Pages call loadProgress() once they're in the browser (in an $effect):
// the static build has no browser storage, so the pages are built as
// "nothing done yet" and fill in after loading.
import { THEMES } from './course';

export interface UnitResult {
	best: number; // best score
	total: number; // questions in that lesson
	finishedAt: number; // when it was last finished (ms since 1970)
}

const KEY = 'geosquid:brazil:progress';

export const progress = $state<{ units: Record<string, UnitResult>; loaded: boolean }>({
	units: {},
	loaded: false
});

export function loadProgress() {
	if (progress.loaded) return;
	try {
		const saved = JSON.parse(localStorage.getItem(KEY) ?? '{}');
		if (saved && typeof saved === 'object') progress.units = saved;
	} catch {
		// Private mode or blocked storage: start empty
	}
	progress.loaded = true;
}

/** Called when a lesson ends: keeps the best score */
export function recordLesson(unit: string, score: number, total: number) {
	loadProgress();
	const before = progress.units[unit];
	progress.units[unit] = {
		best: Math.max(score, before?.best ?? 0),
		total,
		finishedAt: Date.now()
	};
	try {
		localStorage.setItem(KEY, JSON.stringify(progress.units));
	} catch {
		// Storage full or blocked: progress just won't survive a refresh
	}
}

/** The first unit not finished yet (the first one again when all are done) */
export function nextUnit(): string {
	return (THEMES.find((t) => !progress.units[t.id]) ?? THEMES[0]).id;
}

export function finishedCount(): number {
	return THEMES.filter((t) => progress.units[t.id]).length;
}
