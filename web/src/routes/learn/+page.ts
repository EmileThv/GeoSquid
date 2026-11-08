// The list of course units only needs the clues (for photos and counts).
import type { PageLoad } from './$types';
import type { ClueFile } from '#lib/brazil.js';

export const load: PageLoad = async ({ fetch }) => {
	const clues = await fetch('/data/brazil/clues.json').then((r) => r.json() as Promise<ClueFile>);
	return { clues };
};
