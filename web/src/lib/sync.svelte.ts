// Syncing progress between devices with a two-word code ("boussole-cerisier").
// No account: the code links devices. Anyone with the code can see and change
// that progress, so it's shown to its owner only.
//
// How it works:
// - Progress is always saved in the browser first (progress.svelte.ts), so
//   the app works offline.
// - With a code, the device sends its progress to /api/sync/<code> when the
//   app opens and shortly after each change. The server merges it with what
//   it has (nothing is lost, see mergeSaves) and sends the result back.
// - Offline or server errors: the device just keeps its own copy and tries
//   again at the next change or the next visit.
import { applySave, currentSave, loadProgress, onChange } from './progress.svelte';
import { cleanSave, mergeSaves, type SaveData } from './save';

const CODE_KEY = 'geosquid:sync-code';
const DELAY = 1500; // ms after a change before sending it

export const sync = $state<{
	code: string | null; // as shown, with accents
	status: 'off' | 'syncing' | 'synced' | 'offline' | 'error';
	message: string; // what went wrong, for the user
	lastSync: number;
}>({ code: null, status: 'off', message: '', lastSync: 0 });

/** The server's answer: { code, save } or an error message */
async function call(
	method: 'GET' | 'PUT' | 'POST',
	path: string,
	body?: SaveData
): Promise<{ code: string; save?: SaveData }> {
	let res: Response;
	try {
		res = await fetch(`/api/sync${path}`, {
			method,
			headers: body ? { 'Content-Type': 'application/json' } : undefined,
			body: body ? JSON.stringify(body) : undefined
		});
	} catch {
		throw new SyncError('offline', 'No connection: progress is saved on this device for now.');
	}
	const json = await res.json().catch(() => ({}));
	if (!res.ok) throw new SyncError('error', json.message ?? `Sync failed (HTTP ${res.status})`);
	return json;
}

class SyncError extends Error {
	constructor(
		public kind: 'offline' | 'error',
		message: string
	) {
		super(message);
	}
}

function fail(e: unknown): 'offline' | 'error' {
	const err = e instanceof SyncError ? e : new SyncError('error', String(e));
	sync.status = err.kind;
	sync.message = err.message;
	return err.kind;
}

function done(code: string, save: SaveData | undefined) {
	const clean = cleanSave(save);
	if (clean) applySave(clean);
	sync.code = code;
	sync.status = 'synced';
	sync.message = '';
	sync.lastSync = Date.now();
	try {
		localStorage.setItem(CODE_KEY, code);
	} catch {
		// Blocked storage: the code lasts until the page is closed
	}
}

/** Sends this device's progress, gets the merged result back */
export async function syncNow() {
	if (!sync.code) return;
	sync.status = 'syncing';
	try {
		const res = await call('PUT', `/${encodeURIComponent(sync.code)}`, currentSave());
		done(res.code, res.save);
	} catch (e) {
		fail(e);
	}
}

/** Creates a new code holding this device's progress */
export async function createCode() {
	sync.status = 'syncing';
	try {
		const res = await call('POST', '', currentSave());
		done(res.code, undefined);
	} catch (e) {
		fail(e);
	}
}

/** Links this device to an existing code: both progresses are merged */
export async function joinCode(input: string): Promise<boolean> {
	sync.status = 'syncing';
	try {
		const path = `/${encodeURIComponent(input.trim())}`;
		const res = await call('GET', path);
		const remote = cleanSave(res.save);
		const merged = remote ? mergeSaves(remote, currentSave()) : currentSave();
		const after = await call('PUT', `/${encodeURIComponent(res.code)}`, merged);
		done(after.code, after.save);
		return true;
	} catch (e) {
		// Not linked: back to "off", keeping the message (wrong code…)
		if (fail(e) === 'error' && !sync.code) sync.status = 'off';
		return false;
	}
}

/** Stops syncing this device (its progress stays here, and on the server) */
export function stopSync() {
	sync.code = null;
	sync.status = 'off';
	sync.message = '';
	try {
		localStorage.removeItem(CODE_KEY);
	} catch {
		// nothing to clean
	}
}

let started = false;
let timer: ReturnType<typeof setTimeout> | undefined;

/** Called once when the app opens (root layout) */
export function startSync() {
	if (started) return;
	started = true;
	loadProgress();
	onChange(() => {
		if (!sync.code) return;
		clearTimeout(timer);
		timer = setTimeout(syncNow, DELAY);
	});
	try {
		sync.code = localStorage.getItem(CODE_KEY);
	} catch {
		sync.code = null;
	}
	if (sync.code) syncNow();
}
