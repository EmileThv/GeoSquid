// GET /api/sync/<code>: the progress saved under that code.
// PUT /api/sync/<code>: merges the progress in the body with the saved one
// (nothing is lost, see mergeSaves), saves it and answers the result.
// Unknown codes answer 404. Each address may only miss 10 codes an hour, so
// codes can't be found by trying many.
import { error, json, type RequestEvent } from '@sveltejs/kit';
import { cleanSave, mergeSaves } from '#lib/save.js';
import { redis, underLimit } from '#lib/server/redis.js';
import { shownCode } from '#lib/server/sync-words.js';
import { normalizeCode } from '#lib/sync-code.js';
import { guard, KEEP_SECONDS, keyOf, readSave } from '../shared';
import type { RequestHandler } from './$types';

export const prerender = false;

/** The saved progress for the URL's code (or a 404, counted as a miss) */
async function load(event: RequestEvent<{ code: string }>) {
	await guard(event);
	const code = normalizeCode(event.params.code);
	const shown = shownCode(code);
	const [raw] = shown ? await redis(['GET', keyOf(code)]) : [null];
	const save = typeof raw === 'string' ? cleanSave(JSON.parse(raw)) : null;
	if (!save) {
		if (!(await underLimit(`miss:${event.getClientAddress()}`, 10, 3600))) {
			error(429, 'Too many wrong codes, try again in an hour');
		}
		error(404, 'No progress with this code');
	}
	return { code, shown: shown!, save };
}

export const GET: RequestHandler = async (event) => {
	const { shown, save } = await load(event);
	return json({ code: shown, save });
};

export const PUT: RequestHandler = async (event) => {
	const { code, shown, save } = await load(event);
	const merged = mergeSaves(save, await readSave(event.request));
	await redis(['SET', keyOf(code), JSON.stringify(merged), 'EX', KEEP_SECONDS]);
	return json({ code: shown, save: merged });
};
