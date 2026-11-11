// POST /api/sync: creates a new sync code for the progress in the body.
// Answers { code: "boussole-cerisier" } (as shown, with accents).
import { error, json } from '@sveltejs/kit';
import { redis } from '#lib/server/redis.js';
import { randomCode } from '#lib/server/sync-words.js';
import { guard, KEEP_SECONDS, keyOf, readSave } from './shared';
import type { RequestHandler } from './$types';

export const prerender = false;

export const POST: RequestHandler = async (event) => {
	await guard(event);
	const save = await readSave(event.request);
	// A code nobody uses yet: SET … NX only writes if the key is free
	for (let attempt = 0; attempt < 5; attempt++) {
		const { key, shown } = randomCode();
		const [ok] = await redis(['SET', keyOf(key), JSON.stringify(save), 'NX', 'EX', KEEP_SECONDS]);
		if (ok === 'OK') return json({ code: shown });
	}
	error(500, 'Could not find a free code');
};
