// The Brazil course: clues grouped by theme (all poles, all lamps…), and
// the questions a lesson asks about them. Everything is generated from
// clues.json: adding a clue to a theme below is enough to quiz it.
import { REGION_NAMES, type Clue, type Strength } from './brazil';

export interface Theme {
	id: string;
	name: string;
	blurb: string;
	clueIds: string[];
}

// Clue ids come from clues.json. Only clues with a photo and at least one
// state or region tag can be quizzed; the others are left out.
export const THEMES: Theme[] = [
	{
		id: 'poles',
		name: 'Poles',
		blurb: 'Pole shapes, tops and supports',
		clueIds: [
			'brazil-round-poles-2',
			'brazil-pole-wooden',
			'brazil-single-support',
			'br-saopaulopoletop',
			'br-cearapoletop',
			'br-ceararoraimapole',
			'br-riopencilpole',
			'br-gammabox',
			'br-counteronpole',
			'mtacpole',
			'para-pole',
			'florianopolis',
			'joao'
		]
	},
	{
		id: 'pole-ids',
		name: 'Pole IDs',
		blurb: 'Paint, plates and codes on poles',
		clueIds: [
			'saopauloyellow',
			'parana-pole-paint-id',
			'parana-streets',
			'ba-and-pe-code',
			'go-code',
			'rn-code',
			'ma-pole-code-2',
			'pole-wrapped'
		]
	},
	{
		id: 'insulators',
		name: 'Insulators',
		blurb: 'Mushrooms, lollipops, spools and more',
		clueIds: [
			'brown-mushroom',
			'ba-insulators',
			'transparent1',
			'thread',
			'skinny',
			'longinsulators',
			'mainsulators',
			'lollipop',
			'dark'
		]
	},
	{
		id: 'lamps',
		name: 'Street lamps',
		blurb: 'Lamp arms and colours, city by city',
		clueIds: [
			'br-twopartlamp',
			'prlamps2',
			'br-mtmslamps',
			'roraima-lamps',
			'ceara-lamps',
			'teresina',
			'belemorange',
			'cuiaba',
			'belouber',
			'caxiaslamps',
			'riocurved'
		]
	},
	{
		id: 'roads',
		name: 'Roads & streets',
		blurb: 'Pavements, famous highways, street details',
		clueIds: [
			'brazil-highways',
			'spphone',
			'neroads',
			'scroads',
			'acreroad',
			'anarchy',
			'unevensquare',
			'rgds-pavement',
			'piauiroad',
			'concrete-bins',
			'acre364',
			'amazon319',
			'para163'
		]
	},
	{
		id: 'plants',
		name: 'Plants & crops',
		blurb: 'Palms, trees, grasses and plantations',
		clueIds: [
			'coconut',
			'carnauba-2',
			'babassu',
			'acai',
			'moriche-2',
			'macaw-palm2',
			'longstems',
			'tocantins-grass',
			'paranapine',
			'brazil-sugarcane2',
			'soybeanas',
			'coffee',
			'trees2'
		]
	},
	{
		id: 'landscapes',
		name: 'Landscapes',
		blurb: 'Biomes, hills and coastlines',
		clueIds: [
			'caatinga',
			'amazon',
			'acre',
			'roraima',
			'rgds',
			'hills',
			'exposed-rock-mountains',
			'roraimafolded',
			'coastalrgds',
			'maranhaopark'
		]
	},
	{
		id: 'coverage',
		name: 'Coverage & buildings',
		blurb: 'Camera quirks, trekkers and houses',
		clueIds: ['amapasmudge', 'alagoas', 'boat', 'ilha', 'european', 'houses']
	}
];

// ---------------------------------------------------------------------------
// Questions
// ---------------------------------------------------------------------------

/** States or regions: which map layer / which list of names a question uses */
export type Scope = 'states' | 'regions';

export type Question =
	/** A photo, pick where it's from among 4 names */
	| { kind: 'where'; clue: Clue; scope: Scope; options: string[]; answers: string[] }
	/** A photo, tap where it's from on the map */
	| { kind: 'map'; clue: Clue; scope: Scope; answers: string[] }
	/** A place, pick which of 4 photos is from there */
	| { kind: 'spot'; place: string; scope: Scope; clues: Clue[]; answer: string };

export const ALL_STATES =
	'AC AL AP AM BA CE DF ES GO MA MT MS MG PA PB PE PI RJ RN RS RO RR SC SP SE TO'.split(' ');
export const ALL_REGIONS = Object.keys(REGION_NAMES);

const QUESTIONS_PER_LESSON = 8;

function shuffle<T>(items: T[]): T[] {
	const a = [...items];
	for (let i = a.length - 1; i > 0; i--) {
		const j = Math.floor(Math.random() * (i + 1));
		[a[i], a[j]] = [a[j], a[i]];
	}
	return a;
}

const isMain = (s: Strength) => s === 'exclusive' || s === 'common';

/**
 * Where a clue points to. States when it has state tags, else regions.
 * `answers` = where it's exclusive or common (rare places don't count as
 * the answer, but aren't offered as wrong options either).
 */
export function placesOf(clue: Clue): { scope: Scope; answers: string[]; tagged: string[] } {
	const scope: Scope = Object.keys(clue.states).length ? 'states' : 'regions';
	const tags = scope === 'states' ? clue.states : clue.regions;
	return {
		scope,
		answers: Object.keys(tags).filter((k) => isMain(tags[k])),
		tagged: Object.keys(tags)
	};
}

function whereQuestion(clue: Clue): Question | null {
	const { scope, answers, tagged } = placesOf(clue);
	if (!answers.length) return null;
	const pool = scope === 'states' ? ALL_STATES : ALL_REGIONS;
	const wrong = shuffle(pool.filter((p) => !tagged.includes(p))).slice(0, 3);
	if (wrong.length < 3) return null;
	const right = shuffle(answers)[0]; // one correct option among the 4
	return { kind: 'where', clue, scope, options: shuffle([right, ...wrong]), answers };
}

function mapQuestion(clue: Clue): Question | null {
	const { scope, answers } = placesOf(clue);
	return answers.length ? { kind: 'map', clue, scope, answers } : null;
}

/** "Which one is from X?": X from the clue, 3 other photos of the theme not found in X */
function spotQuestion(clue: Clue, theme: Clue[]): Question | null {
	const { scope, answers } = placesOf(clue);
	if (!answers.length) return null;
	const place = shuffle(answers)[0];
	const others = shuffle(
		theme.filter((c) => c.id !== clue.id && !(place in (scope === 'states' ? c.states : c.regions)))
	).slice(0, 3);
	if (others.length < 3) return null;
	return { kind: 'spot', place, scope, clues: shuffle([clue, ...others]), answer: clue.id };
}

// Plonk It's clue photos are 800×393: the street view on the left and a
// small map of Brazil on the right with the answer in red. Lessons show
// only the part left of the map (see QuizPhoto in the lesson page).
// Images in other sizes are charts or maps of the answer: not quizzed.
export const PHOTO_SIZE = [800, 393] as const;
export const ANSWER_MAP_X = 500; // the map always starts at x ≈ 506

function isQuizPhoto(c: Clue): boolean {
	return !!c.image && c.imageSize?.[0] === PHOTO_SIZE[0] && c.imageSize[1] === PHOTO_SIZE[1];
}

/** Clues of a theme that can be quizzed (usable photo + at least one place) */
export function themeClues(theme: Theme, all: Clue[]): Clue[] {
	const byId = new Map(all.map((c) => [c.id, c]));
	return theme.clueIds
		.map((id) => byId.get(id))
		.filter((c): c is Clue => !!c && isQuizPhoto(c) && placesOf(c).answers.length > 0);
}

/** A lesson: up to 8 questions, rotating through the 3 kinds */
export function buildLesson(theme: Theme, all: Clue[]): Question[] {
	const clues = themeClues(theme, all);
	const makers = [
		(c: Clue) => whereQuestion(c),
		(c: Clue) => mapQuestion(c),
		(c: Clue) => spotQuestion(c, clues)
	];
	const picked = shuffle(clues).slice(0, QUESTIONS_PER_LESSON);
	return picked
		.map((clue, i) => {
			// Try this question's kind first, then the others if it can't be made
			for (let k = 0; k < makers.length; k++) {
				const q = makers[(i + k) % makers.length](clue);
				if (q) return q;
			}
			return null;
		})
		.filter((q): q is Question => q !== null);
}
