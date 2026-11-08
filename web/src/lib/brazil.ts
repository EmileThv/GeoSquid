// Types and lookup tables for the Brazil data.
// The map files only contain shapes + a few properties; this module builds
// easy-to-use indexes from them (state → its area codes, region → its states…)
// so the UI never has to dig through the raw TopoJSON.
import { feature, neighbors } from 'topojson-client';
import type { GeometryCollection, Topology } from 'topojson-specification';

export type LayerId = 'states' | 'regions' | 'ddd';

export const LAYERS: { id: LayerId; label: string }[] = [
	{ id: 'states', label: 'States' },
	{ id: 'regions', label: 'Regions' },
	{ id: 'ddd', label: 'Area codes' }
];

// IBGE region codes → English names (as used in the GeoGuessr community)
export const REGION_NAMES: Record<string, string> = {
	N: 'North',
	NE: 'Northeast',
	CO: 'Center-West',
	SE: 'Southeast',
	S: 'South'
};

// Properties stored on each layer's shapes (set in data-prep/build.sh)
export type StateProps = { SIGLA_UF: string; NM_UF: string; SIGLA_RG: string };
export type RegionProps = { SIGLA_RG: string };
export type DddProps = { ddd: number; states: string; main_state: string };

// ---------------------------------------------------------------------------
// Colors
//
// Each macro-region has its own hue. Each state gets a shade of its region's
// hue, chosen so that two neighboring states of the same region never share
// a shade. Area codes take the color of their main state.
// Colors are HSL: hsl(hue saturation% lightness%), so a "shade" is just a
// different lightness of the same hue.
// ---------------------------------------------------------------------------

// Muted hues that sit well on GeoSquid's dark purple background
export const REGION_HUES: Record<string, number> = {
	N: 152, // kelp green (Amazon)
	NE: 14, // coral
	CO: 40, // sand
	SE: 196, // sea blue
	S: 282 // lilac
};

// Lightness of each shade. Kept low so the map stays calm on a dark screen.
const SHADES = [30, 38, 24, 45, 34];

export function regionFill(region: string): string {
	return `hsl(${REGION_HUES[region]} 34% 36%)`;
}

function shadeFill(region: string, shade: number): string {
	return `hsl(${REGION_HUES[region]} 30% ${SHADES[shade % SHADES.length]}%)`;
}

// "Map coloring": give each state the lowest shade number that none of its
// same-region neighbors already uses. topojson's neighbors() tells us which
// states share a border (as lists of indexes into the geometries array).
export function stateFills(topo: Topology): Map<string, string> {
	const geoms = (topo.objects.states as GeometryCollection<StateProps>).geometries;
	const adjacent = neighbors(geoms);
	const shade: number[] = geoms.map(() => -1);
	const region = (i: number) => (geoms[i].properties as StateProps).SIGLA_RG;

	// States with the most neighbors pick first: they're the hardest to fit
	const order = geoms.map((_, i) => i).sort((a, b) => adjacent[b].length - adjacent[a].length);
	for (const i of order) {
		const taken = new Set(adjacent[i].filter((j) => region(j) === region(i)).map((j) => shade[j]));
		let s = 0;
		while (taken.has(s)) s++;
		shade[i] = s;
	}

	return new Map(
		geoms.map(
			(g, i) => [(g.properties as StateProps).SIGLA_UF, shadeFill(region(i), shade[i])] as const
		)
	);
}

export interface Capital {
	name: string;
	uf: string;
	lat: number;
	lon: number;
	ddd: number;
}

export interface StateInfo {
	uf: string;
	name: string;
	region: string;
	capital: Capital | undefined;
	ddds: number[];
}

export interface RegionInfo {
	code: string;
	name: string;
	states: StateInfo[];
}

export interface DddInfo {
	ddd: number;
	states: StateInfo[];
	capital: Capital | undefined;
}

export interface BrazilIndex {
	states: Map<string, StateInfo>;
	regions: Map<string, RegionInfo>;
	ddds: Map<number, DddInfo>;
}

// Typed helper: get one layer of the TopoJSON as a list of GeoJSON features
export function layerFeatures<P extends Record<string, unknown>>(topo: Topology, layer: LayerId) {
	return feature(topo, topo.objects[layer] as GeometryCollection<P>).features;
}

// The id used for selection on each layer (always a string)
export function featureId(layer: LayerId, props: Record<string, unknown>): string {
	if (layer === 'states') return String(props.SIGLA_UF);
	if (layer === 'regions') return String(props.SIGLA_RG);
	return String(props.ddd);
}

export function buildIndex(topo: Topology, capitals: Capital[]): BrazilIndex {
	const states = new Map<string, StateInfo>();
	for (const f of layerFeatures<StateProps>(topo, 'states')) {
		const p = f.properties;
		states.set(p.SIGLA_UF, {
			uf: p.SIGLA_UF,
			name: p.NM_UF,
			region: p.SIGLA_RG,
			capital: capitals.find((c) => c.uf === p.SIGLA_UF),
			ddds: []
		});
	}

	const ddds = new Map<number, DddInfo>();
	for (const f of layerFeatures<DddProps>(topo, 'ddd')) {
		const ufs = f.properties.states.split(',');
		const info: DddInfo = {
			ddd: f.properties.ddd,
			states: ufs.map((uf) => states.get(uf)!),
			capital: capitals.find((c) => c.ddd === f.properties.ddd)
		};
		ddds.set(info.ddd, info);
		for (const uf of ufs) states.get(uf)!.ddds.push(info.ddd);
	}
	for (const s of states.values()) s.ddds.sort((a, b) => a - b);

	const regions = new Map<string, RegionInfo>();
	for (const code of Object.keys(REGION_NAMES)) {
		regions.set(code, {
			code,
			name: REGION_NAMES[code],
			states: [...states.values()]
				.filter((s) => s.region === code)
				.sort((a, b) => a.name.localeCompare(b.name))
		});
	}

	return { states, regions, ddds };
}

// ---------------------------------------------------------------------------
// Clues (from Plonk It, built by data-prep/build-clues.py)
// ---------------------------------------------------------------------------

export type Strength = 'exclusive' | 'common' | 'rare';

export interface Clue {
	id: string;
	category: string;
	text: string;
	note: string | null;
	image: string | null; // path relative to /data/brazil/
	imageSize: [number, number] | null; // [width, height] in pixels
	states: Record<string, Strength>; // state code → how strongly it points there
	regions: Record<string, Strength>; // region code → idem
}

export interface ClueFile {
	source: string;
	license: string;
	attribution: string;
	clues: Clue[];
}

const STRENGTH_ORDER: Record<Strength, number> = { exclusive: 0, common: 1, rare: 2 };

// Clues that point to one state, strongest first
export function cluesForState(clues: Clue[], uf: string): Clue[] {
	return clues
		.filter((c) => uf in c.states)
		.sort((a, b) => STRENGTH_ORDER[a.states[uf]] - STRENGTH_ORDER[b.states[uf]]);
}

// Clues that point to a whole macro-region, strongest first
export function cluesForRegion(clues: Clue[], region: string): Clue[] {
	return clues
		.filter((c) => region in c.regions)
		.sort((a, b) => STRENGTH_ORDER[a.regions[region]] - STRENGTH_ORDER[b.regions[region]]);
}
