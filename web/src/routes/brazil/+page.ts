// A `load` function runs before the page is shown and fetches the data it needs.
// Whatever it returns arrives in +page.svelte as the `data` prop.
import type { PageLoad } from './$types';
import type { Topology } from 'topojson-specification';
import type { Capital } from '#lib/brazil.js';

export const load: PageLoad = async ({ fetch }) => {
	// Files in web/static/ are served from the site root.
	// Both files are fetched at the same time (Promise.all).
	const [topo, capitals] = await Promise.all([
		fetch('/data/brazil/brazil.topojson').then((r) => r.json() as Promise<Topology>),
		fetch('/data/brazil/capitals.json').then((r) => r.json() as Promise<Capital[]>)
	]);

	return { topo, capitals };
};
