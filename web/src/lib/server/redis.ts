// Upstash Redis over HTTP (its REST API): one fetch per call, no driver.
// The URL and token come from the Vercel project's environment variables,
// added by the Upstash integration (never written in the code, see src/env.ts).
// Every GeoSquid key starts with "geosquid:" because the database is shared
// with another site.
import { UPSTASH_KV_REST_API_TOKEN, UPSTASH_KV_REST_API_URL } from '$app/env/private';

export const PREFIX = 'geosquid:';

type Command = (string | number)[];

export const isConfigured = () => !!UPSTASH_KV_REST_API_URL && !!UPSTASH_KV_REST_API_TOKEN;

/** Runs several commands in one request, returns their results in order */
export async function redis(...commands: Command[]): Promise<unknown[]> {
	const res = await fetch(`${UPSTASH_KV_REST_API_URL}/pipeline`, {
		method: 'POST',
		headers: { Authorization: `Bearer ${UPSTASH_KV_REST_API_TOKEN}` },
		body: JSON.stringify(commands)
	});
	if (!res.ok) throw new Error(`Redis: HTTP ${res.status}`);
	const replies = (await res.json()) as { result?: unknown; error?: string }[];
	return replies.map((r) => {
		if (r.error) throw new Error(`Redis: ${r.error}`);
		return r.result;
	});
}

/**
 * Counts one more request for `name` in the current time window and says
 * whether it's still under `max`. Used to slow down anyone guessing codes.
 */
export async function underLimit(name: string, max: number, seconds: number): Promise<boolean> {
	const key = `${PREFIX}limit:${name}`;
	const [count] = await redis(['INCR', key], ['EXPIRE', key, seconds, 'NX']);
	return Number(count) <= max;
}
