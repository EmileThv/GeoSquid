// A lesson: the map data (for map questions, state names, capitals and area
// codes) + the clues. Which lesson is decided in the page, from the saved
// progress (?n=3 replays lesson 3, no ?n plays the next one).
import type { Topology } from 'topojson-specification';
import type { Capital, ClueFile } from '#lib/brazil.js';
import type { PageLoad } from './$types';

// Lessons depend on progress saved in the browser and are random, so the
// page only runs in the browser: the build writes an empty page.
export const ssr = false;

export const load: PageLoad = async ({ fetch }) => {
	const [topo, capitals, clues] = await Promise.all([
		fetch('/data/brazil/brazil.topojson').then((r) => r.json() as Promise<Topology>),
		fetch('/data/brazil/capitals.json').then((r) => r.json() as Promise<Capital[]>),
		fetch('/data/brazil/clues.json').then((r) => r.json() as Promise<ClueFile>)
	]);
	return { topo, capitals, clues };
};
