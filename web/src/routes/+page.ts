// Home page data: the Brazil map, for the small preview in the Explore panel.
import type { PageLoad } from './$types';
import type { Topology } from 'topojson-specification';
import type { Capital } from '#lib/brazil.js';

export const load: PageLoad = async ({ fetch }) => {
	const [topo, capitals] = await Promise.all([
		fetch('/data/brazil/brazil.topojson').then((r) => r.json() as Promise<Topology>),
		fetch('/data/brazil/capitals.json').then((r) => r.json() as Promise<Capital[]>)
	]);
	return { topo, capitals };
};
