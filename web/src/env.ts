// Environment variables the app reads (SvelteKit: defineEnvVars). Both are
// set on Vercel by the Upstash integration; they're optional so the site
// still runs without them (sync then answers "not set up").
// Server-only: read them from '$app/env/private'.
import { defineEnvVars } from '@sveltejs/kit/env';

const optional = (value: string | undefined) => value || undefined;

export const variables = defineEnvVars({
	UPSTASH_KV_REST_API_URL: {
		schema: optional,
		description: 'Upstash Redis REST URL, for syncing progress between devices'
	},
	UPSTASH_KV_REST_API_TOKEN: {
		schema: optional,
		description: 'Upstash Redis REST token (read and write)'
	}
});
