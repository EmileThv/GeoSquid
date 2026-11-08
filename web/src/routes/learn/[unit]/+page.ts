// A lesson: the map data (for map questions and state names) + the clues.
import { error } from '@sveltejs/kit';
import type { Topology } from 'topojson-specification';
import type { Capital, ClueFile } from '#lib/brazil.js';
import { THEMES } from '#lib/course.js';
import type { EntryGenerator, PageLoad } from './$types';

// Questions are random, so they're only made in the browser: the build
// writes an empty page (ssr = false) instead of a frozen set of questions.
export const ssr = false;

// Which lesson pages the static build must create: one per theme
export const entries: EntryGenerator = () => THEMES.map((t) => ({ unit: t.id }));

export const load: PageLoad = async ({ fetch, params }) => {
	const theme = THEMES.find((t) => t.id === params.unit);
	if (!theme) error(404, 'No such unit');
	const [topo, capitals, clues] = await Promise.all([
		fetch('/data/brazil/brazil.topojson').then((r) => r.json() as Promise<Topology>),
		fetch('/data/brazil/capitals.json').then((r) => r.json() as Promise<Capital[]>),
		fetch('/data/brazil/clues.json').then((r) => r.json() as Promise<ClueFile>)
	]);
	return { theme, topo, capitals, clues };
};
