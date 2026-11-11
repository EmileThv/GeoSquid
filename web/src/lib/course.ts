// The Brazil course: decks of cards, units of 3 lessons, and the questions
// a lesson asks.
//
// - A card is one thing to remember: a clue photo ("brown mushroom
//   insulators → Pernambuco"), a capital ("Pernambuco → Recife") or an
//   area-code decade ("4x → Paraná, Santa Catarina").
// - A deck groups cards on one subject (Poles, Capitals…). You choose which
//   decks you learn on the Learn page.
// - A unit covers one deck (Capitals has two units: south, then north), in
//   3 lessons, like Duolingo: lessons 1 and 2 each teach half of its cards
//   (plus 2 cards from other units to review, so topics still mix), and
//   lesson 3 reviews the whole unit with harder questions.
// - Units can be done in any order; the path suggests the UNITS order.
import { REGION_NAMES, type BrazilIndex, type Clue, type Strength } from './brazil';

// ---------------------------------------------------------------------------
// Decks
// ---------------------------------------------------------------------------

export interface Deck {
	id: string;
	name: string;
	blurb: string;
	group: 'clues' | 'facts';
	cardIds: string[]; // in the order they're taught
}

function clueDeck(id: string, name: string, blurb: string, cardIds: string[]): Deck {
	return { id, name, blurb, group: 'clues', cardIds };
}

// Which region each state is in (static, for the Capitals lessons)
export const STATE_REGION: Record<string, string> = {
	AC: 'N',
	AP: 'N',
	AM: 'N',
	PA: 'N',
	RO: 'N',
	RR: 'N',
	TO: 'N',
	AL: 'NE',
	BA: 'NE',
	CE: 'NE',
	MA: 'NE',
	PB: 'NE',
	PE: 'NE',
	PI: 'NE',
	RN: 'NE',
	SE: 'NE',
	DF: 'CO',
	GO: 'CO',
	MT: 'CO',
	MS: 'CO',
	ES: 'SE',
	MG: 'SE',
	RJ: 'SE',
	SP: 'SE',
	PR: 'S',
	RS: 'S',
	SC: 'S'
};

const statesIn = (...regions: string[]) =>
	Object.keys(STATE_REGION).filter((uf) => regions.includes(STATE_REGION[uf]));

// Clue ids come from clues.json. Only clues with a usable photo (see
// PHOTO_SIZE) and at least one state or region are listed.
export const DECKS: Deck[] = [
	{
		id: 'capitals',
		name: 'Capitals',
		blurb: 'The capital of each state',
		group: 'facts',
		// Region by region, so each bite of 3 stays in one part of the map
		cardIds: statesIn('SE', 'S')
			.concat(statesIn('CO'), statesIn('NE'), statesIn('N'))
			.map((uf) => `capital-${uf}`)
	},
	{
		id: 'ddd',
		name: 'Area codes',
		blurb: 'Which states each first digit (1x, 2x…) covers',
		group: 'facts',
		cardIds: [1, 2, 3, 4, 5, 6, 7, 8, 9].map((d) => `ddd-${d}`)
	},
	clueDeck('poles', 'Poles', 'Pole shapes, tops and supports', [
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
	]),
	clueDeck('pole-ids', 'Pole IDs', 'Paint, plates and codes on poles', [
		'saopauloyellow',
		'parana-pole-paint-id',
		'parana-streets',
		'ba-and-pe-code',
		'go-code',
		'rn-code',
		'ma-pole-code-2',
		'pole-wrapped'
	]),
	clueDeck('insulators', 'Insulators', 'Mushrooms, lollipops, spools and more', [
		'brown-mushroom',
		'ba-insulators',
		'transparent1',
		'thread',
		'skinny',
		'longinsulators',
		'mainsulators',
		'lollipop',
		'dark'
	]),
	clueDeck('lamps', 'Street lamps', 'Lamp arms and colours, city by city', [
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
	]),
	clueDeck('roads', 'Roads & streets', 'Pavements, famous highways, street details', [
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
	]),
	clueDeck('plants', 'Plants & crops', 'Palms, trees, grasses and plantations', [
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
	]),
	clueDeck('landscapes', 'Landscapes', 'Biomes, hills and coastlines', [
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
	]),
	clueDeck('coverage', 'Coverage & buildings', 'Camera quirks, trekkers and houses', [
		'amapasmudge',
		'alagoas',
		'boat',
		'ilha',
		'european',
		'houses'
	])
];

export const deckOf = (id: string) => DECKS.find((d) => d.id === id)!;
export const deckOfCard = (cardId: string) => DECKS.find((d) => d.cardIds.includes(cardId))!;

// ---------------------------------------------------------------------------
// Units and lessons
// ---------------------------------------------------------------------------

export interface Lesson {
	id: string; // "poles-1", "poles-2", "poles-review"
	unit: string;
	deck: string;
	title: string; // "Poles 1", "Poles review"
	kind: 'learn' | 'review';
	cardIds: string[]; // learn: its new cards; review: every card of the unit
}

export interface Unit {
	id: string;
	deck: string;
	name: string;
	lessons: Lesson[];
}

export const REVIEWS = 2; // cards from other units reviewed in each learn lesson

/** A unit: 2 lessons with half of the cards each, then a review of all */
function unit(id: string, deck: string, name: string, cardIds: string[]): Unit {
	const half = Math.ceil(cardIds.length / 2);
	const lesson = (n: string, kind: Lesson['kind'], ids: string[], title: string): Lesson => ({
		id: `${id}-${n}`,
		unit: id,
		deck,
		title,
		kind,
		cardIds: ids
	});
	return {
		id,
		deck,
		name,
		lessons: [
			lesson('1', 'learn', cardIds.slice(0, half), `${name} 1`),
			lesson('2', 'learn', cardIds.slice(half), `${name} 2`),
			lesson('review', 'review', cardIds, `${name} review`)
		]
	};
}

const deckUnit = (deck: string) => unit(deck, deck, deckOf(deck).name, deckOf(deck).cardIds);
const capitals = (...regions: string[]) => statesIn(...regions).map((uf) => `capital-${uf}`);

// The suggested order: street clues and facts alternate
export const UNITS: Unit[] = [
	deckUnit('poles'),
	unit('capitals-south', 'capitals', 'Capitals: South & Center', capitals('SE', 'S', 'CO')),
	deckUnit('insulators'),
	deckUnit('ddd'),
	deckUnit('lamps'),
	deckUnit('plants'),
	unit('capitals-north', 'capitals', 'Capitals: North & Northeast', capitals('NE', 'N')),
	deckUnit('pole-ids'),
	deckUnit('roads'),
	deckUnit('landscapes'),
	deckUnit('coverage')
];

export const LESSONS: Lesson[] = UNITS.flatMap((u) => u.lessons);
export const lessonById = (id: string) => LESSONS.find((l) => l.id === id);
export const unitOf = (lesson: Lesson) => UNITS.find((u) => u.id === lesson.unit)!;

// ---------------------------------------------------------------------------
// Cards (built from the data files when a lesson opens)
// ---------------------------------------------------------------------------

export type Card =
	| { type: 'clue'; id: string; deck: string; clue: Clue }
	| { type: 'capital'; id: string; deck: string; uf: string; city: string }
	| { type: 'ddd'; id: string; deck: string; digit: number; states: string[] };

/** What a lesson needs from the data files */
export interface CourseData {
	clues: Map<string, Clue>;
	index: BrazilIndex;
}

export function makeCard(id: string, deck: string, data: CourseData): Card | null {
	if (id.startsWith('capital-')) {
		const uf = id.slice('capital-'.length);
		const city = data.index.states.get(uf)?.capital?.name;
		return city ? { type: 'capital', id, deck, uf, city } : null;
	}
	if (id.startsWith('ddd-')) {
		const digit = Number(id.slice('ddd-'.length));
		const states = [...data.index.states.values()]
			.filter((s) => s.ddds.some((d) => Math.floor(d / 10) === digit))
			.map((s) => s.uf);
		return states.length ? { type: 'ddd', id, deck, digit, states } : null;
	}
	const clue = data.clues.get(id);
	return clue && isQuizPhoto(clue) && placesOf(clue).answers.length
		? { type: 'clue', id, deck, clue }
		: null;
}

// Plonk It's clue photos are 800×393: the street view on the left and a
// small map of Brazil on the right with the answer in red. Quizzes show
// only the part left of the map (see quizPhoto in the lesson page).
export const PHOTO_SIZE = [800, 393] as const;
export const ANSWER_MAP_X = 500; // the map always starts at x ≈ 506

function isQuizPhoto(c: Clue): boolean {
	return !!c.image && c.imageSize?.[0] === PHOTO_SIZE[0] && c.imageSize[1] === PHOTO_SIZE[1];
}

/** States or regions: which map layer / which names a question uses */
export type Scope = 'states' | 'regions';

const isMain = (s: Strength) => s === 'exclusive' || s === 'common';

/**
 * Where a clue points to, as states, or as regions when it only has region
 * tags. A clue can have both ("all over the South, and in Amapá"): then a
 * region counts as all of its states, so every place the clue names is an
 * answer.
 * `answers` = where it's exclusive or common (rare places don't count as
 * the answer, but aren't offered as wrong options either).
 */
export function placesOf(clue: Clue): { scope: Scope; answers: string[]; tagged: string[] } {
	if (!Object.keys(clue.states).length) {
		const r = clue.regions;
		return {
			scope: 'regions',
			answers: Object.keys(r).filter((k) => isMain(r[k])),
			tagged: Object.keys(r)
		};
	}
	const answers = new Set(Object.keys(clue.states).filter((uf) => isMain(clue.states[uf])));
	const tagged = new Set(Object.keys(clue.states));
	for (const [region, strength] of Object.entries(clue.regions)) {
		for (const uf of statesIn(region)) {
			tagged.add(uf);
			if (isMain(strength)) answers.add(uf);
		}
	}
	return { scope: 'states', answers: [...answers], tagged: [...tagged] };
}

/** Whether a clue is found (even rarely) in a state or region */
function foundAt(clue: Clue, scope: Scope, place: string): boolean {
	const { scope: own, tagged } = placesOf(clue);
	if (own === scope) return tagged.includes(place);
	// A region-only clue and a state: is the state in one of its regions?
	if (scope === 'states') return tagged.includes(STATE_REGION[place]);
	// A state clue and a region: is one of its states in that region?
	return tagged.some((uf) => STATE_REGION[uf] === place);
}

/**
 * How a clue's places read: regions by name, then the states outside them
 * ("South · Amapá"). Rare places apart.
 */
export function placeList(clue: Clue): { main: string[]; rare: string[] } {
	const regions = Object.entries(clue.regions);
	const mainRegions = regions.filter(([, s]) => isMain(s)).map(([r]) => r);
	const inMain = (uf: string) => mainRegions.includes(STATE_REGION[uf]);
	const states = Object.entries(clue.states).filter(([uf]) => !inMain(uf));
	return {
		main: [
			...mainRegions.map((r) => `region:${r}`),
			...states.filter(([, s]) => isMain(s)).map(([uf]) => uf)
		],
		rare: [
			...regions.filter(([, s]) => !isMain(s)).map(([r]) => `region:${r}`),
			...states.filter(([, s]) => !isMain(s)).map(([uf]) => uf)
		]
	};
}

// ---------------------------------------------------------------------------
// Questions
// ---------------------------------------------------------------------------

export interface Option {
	value: string;
	label: string;
}

/** Every question: what it asks, about which card, and what's accepted */
export type Question = { card: Card; prompt: string; answers: string[]; photo?: Clue } & (
	| { kind: 'pick'; options: Option[] } // 4 buttons
	| { kind: 'map'; scope: Scope } // tap the map
	| { kind: 'spot'; clues: Clue[] } // 4 photos (value = clue id)
);

export const ALL_STATES = Object.keys(STATE_REGION);
export const ALL_REGIONS = Object.keys(REGION_NAMES);

const REPEATS = 2; // new cards asked a second time, another way

function shuffle<T>(items: T[]): T[] {
	const a = [...items];
	for (let i = a.length - 1; i > 0; i--) {
		const j = Math.floor(Math.random() * (i + 1));
		[a[i], a[j]] = [a[j], a[i]];
	}
	return a;
}

const pickOne = <T>(items: T[]): T => items[Math.floor(Math.random() * items.length)];

type Maker = (card: Card, ctx: Ctx) => Question | null;
interface Ctx {
	data: CourseData;
	pool: (deck: string) => Card[]; // a whole deck: wrong options for "spot" come from here
	hard: boolean; // review lessons: wrong options close to the answer
	stateName: (uf: string) => string;
	placeName: (scope: Scope, code: string) => string;
}

// --- Clue cards --------------------------------------------------------------

const clueWhere: Maker = (card, ctx) => {
	if (card.type !== 'clue') return null;
	const { scope, answers, tagged } = placesOf(card.clue);
	const pool = (scope === 'states' ? ALL_STATES : ALL_REGIONS).filter((p) => !tagged.includes(p));
	// Hard: states from the same regions as the answers first (Paraná or
	// Santa Catarina?), so the photo has to be really known
	const near = (p: string) =>
		scope === 'states' && answers.some((a) => STATE_REGION[a] === STATE_REGION[p]);
	const wrong = (
		ctx.hard
			? [...shuffle(pool.filter(near)), ...shuffle(pool.filter((p) => !near(p)))]
			: shuffle(pool)
	).slice(0, 3);
	if (wrong.length < 3) return null;
	const options = shuffle([pickOne(answers), ...wrong]).map((value) => ({
		value,
		label: ctx.placeName(scope, value)
	}));
	return {
		kind: 'pick',
		card,
		photo: card.clue,
		prompt: scope === 'states' ? 'Which state is this from?' : 'Which region is this from?',
		options,
		answers
	};
};

const clueMap: Maker = (card) => {
	if (card.type !== 'clue') return null;
	const { scope, answers } = placesOf(card.clue);
	return {
		kind: 'map',
		card,
		photo: card.clue,
		scope,
		prompt:
			scope === 'states'
				? 'Tap a state where you’d see this'
				: 'Tap the region where you’d see this',
		answers
	};
};

/** "Which one is from X?": 3 other photos of the deck that aren't found in X */
const clueSpot: Maker = (card, ctx) => {
	if (card.type !== 'clue') return null;
	const { scope, answers } = placesOf(card.clue);
	const place = pickOne(answers);
	const others = shuffle(
		ctx
			.pool(card.deck)
			.filter((c): c is Extract<Card, { type: 'clue' }> => c.type === 'clue' && c.id !== card.id)
			.map((c) => c.clue)
			.filter((c) => !foundAt(c, scope, place))
	).slice(0, 3);
	if (others.length < 3) return null;
	return {
		kind: 'spot',
		card,
		prompt: `Which one is from ${ctx.placeName(scope, place)}?`,
		clues: shuffle([card.clue, ...others]),
		answers: [card.clue.id]
	};
};

// --- Capital cards -------------------------------------------------------------

/** "What's the capital of Pernambuco?": 4 cities, wrong ones from the same region first */
const capitalOf: Maker = (card, ctx) => {
	if (card.type !== 'capital') return null;
	const others = ALL_STATES.filter(
		(uf) => uf !== card.uf && ctx.data.index.states.get(uf)?.capital
	);
	const near = shuffle(others.filter((uf) => STATE_REGION[uf] === STATE_REGION[card.uf]));
	const far = shuffle(others.filter((uf) => STATE_REGION[uf] !== STATE_REGION[card.uf]));
	const options = shuffle([card.uf, ...[...near, ...far].slice(0, 3)]).map((uf) => ({
		value: uf,
		label: ctx.data.index.states.get(uf)!.capital!.name
	}));
	return {
		kind: 'pick',
		card,
		prompt: `What is the capital of ${ctx.stateName(card.uf)}?`,
		options,
		answers: [card.uf]
	};
};

/** "Recife is the capital of…": tap the state */
const capitalWhere: Maker = (card) => {
	if (card.type !== 'capital') return null;
	return {
		kind: 'map',
		card,
		scope: 'states',
		prompt: `${card.city} is the capital of which state? Tap it`,
		answers: [card.uf]
	};
};

// --- Area-code cards -------------------------------------------------------------

/** "Where are the 4x area codes?": tap any of its states */
const dddWhere: Maker = (card) => {
	if (card.type !== 'ddd') return null;
	return {
		kind: 'map',
		card,
		scope: 'states',
		prompt: `Tap a state with ${card.digit}x area codes`,
		answers: card.states
	};
};

/** "Area codes in Paraná start with…": 4 digits */
const dddDigit: Maker = (card, ctx) => {
	if (card.type !== 'ddd') return null;
	const uf = pickOne(card.states);
	const others = [1, 2, 3, 4, 5, 6, 7, 8, 9].filter((d) => d !== card.digit);
	// Hard: the digits right next to it (3x or 5x for 4x)
	const wrong = (
		ctx.hard
			? [...others].sort((x, y) => Math.abs(x - card.digit) - Math.abs(y - card.digit))
			: shuffle(others)
	).slice(0, 3);
	return {
		kind: 'pick',
		card,
		prompt: `Area codes in ${ctx.stateName(uf)} start with…`,
		options: shuffle([card.digit, ...wrong]).map((d) => ({ value: String(d), label: `${d}x` })),
		answers: [String(card.digit)]
	};
};

const MAKERS: Record<Card['type'], Maker[]> = {
	clue: [clueWhere, clueMap, clueSpot],
	capital: [capitalOf, capitalWhere],
	ddd: [dddWhere, dddDigit]
};

// Question kinds in review lessons, hardest first (they take turns)
const HARD_FIRST: Record<Card['type'], Maker[]> = {
	clue: [clueMap, clueSpot, clueWhere],
	capital: [capitalWhere, capitalOf],
	ddd: [dddWhere, dddDigit]
};

/**
 * A lesson's quiz.
 * - Learn lesson: its new cards and the review cards once each, then 2 new
 *   cards again (asked another way). Shuffled together.
 * - Review lesson (`hard`): every card of the unit once, harder questions.
 * Each time a card comes back it's asked a different way (photo → map →
 * spot…).
 */
export function buildQuiz(
	cards: Card[],
	reviewCards: Card[],
	pool: (deck: string) => Card[],
	data: CourseData,
	hard = false
): Question[] {
	const stateName = (uf: string) => data.index.states.get(uf)?.name ?? uf;
	const ctx: Ctx = {
		data,
		pool,
		hard,
		stateName,
		placeName: (scope, code) => (scope === 'states' ? stateName(code) : REGION_NAMES[code])
	};

	const all = [...cards, ...reviewCards];
	const order = shuffle(all);
	if (!hard) {
		const again = shuffle(cards).slice(0, REPEATS);
		// Don't ask about the same card twice in a row
		if (again[0] && again[0].id === order[order.length - 1]?.id) again.push(again.shift()!);
		order.push(...again);
	}

	const asked = new Map<string, number>(); // card id → times asked so far
	// Which kind each card starts with. Hard: kinds take turns down the quiz
	// (map, spot, photo, map…) so it stays varied; else random per card.
	const start = new Map(order.map((c, i) => [c.id, hard ? i : Math.floor(Math.random() * 3)]));
	return order
		.map((card) => {
			const makers = (hard ? HARD_FIRST : MAKERS)[card.type];
			const n = (asked.get(card.id) ?? 0) + start.get(card.id)!;
			asked.set(card.id, (asked.get(card.id) ?? 0) + 1);
			// This time's kind first, then the others if it can't be made
			for (let k = 0; k < makers.length; k++) {
				const q = makers[(n + k) % makers.length](card, ctx);
				if (q) return q;
			}
			return null;
		})
		.filter((q): q is Question => q !== null);
}
