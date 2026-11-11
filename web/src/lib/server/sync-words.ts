// The words sync codes are made of: 2048 common French nouns, from
// sync-words.json (built by data-prep/build-sync-words.py from Lexique 3.83,
// http://www.lexique.org, CC BY-SA 4.0).
import { normalizeCode } from '../sync-code';
import list from './sync-words.json';

/** Plain form ("elephant") → the word as shown ("éléphant") */
const WORDS = new Map(list.words.map((w) => [normalizeCode(w), w]));
const PLAIN = [...WORDS.keys()];

/** A new random code, as stored ("boussole-cerisier") and as shown */
export function randomCode(): { key: string; shown: string } {
	const pick = () => PLAIN[crypto.getRandomValues(new Uint32Array(1))[0] % PLAIN.length];
	const [a, b] = [pick(), pick()];
	return { key: `${a}-${b}`, shown: `${WORDS.get(a)}-${WORDS.get(b)}` };
}

/** The code as shown, if `key` is two words of the list, else null */
export function shownCode(key: string): string | null {
	const parts = key.split('-');
	if (parts.length !== 2 || !parts.every((p) => WORDS.has(p))) return null;
	return parts.map((p) => WORDS.get(p)).join('-');
}
