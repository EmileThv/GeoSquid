// Pieces shared by the two sync endpoints.
import { error, type RequestEvent } from '@sveltejs/kit';
import { cleanSave, type SaveData } from '#lib/save.js';
import { isConfigured, PREFIX, underLimit } from '#lib/server/redis.js';

/** Where a code's progress is stored */
export const keyOf = (code: string) => `${PREFIX}sync:${code}`;

/** Unused codes are deleted after a year without changes */
export const KEEP_SECONDS = 365 * 24 * 3600;

const MAX_BODY = 200_000; // bytes: a full save is around 20 KB

/** Every request: sync must be set up, and each address gets 60 calls a minute */
export async function guard(event: RequestEvent) {
	if (!isConfigured()) error(503, 'Sync is not set up on this server');
	if (!(await underLimit(`all:${event.getClientAddress()}`, 60, 60))) {
		error(429, 'Too many requests, try again in a minute');
	}
}

/** The progress sent in a request's body, checked */
export async function readSave(request: Request): Promise<SaveData> {
	const text = await request.text();
	if (text.length > MAX_BODY) error(413, 'Too large');
	let json: unknown;
	try {
		json = JSON.parse(text);
	} catch {
		error(400, 'Not JSON');
	}
	const save = cleanSave(json);
	if (!save) error(400, 'Not a GeoSquid save');
	return save;
}
