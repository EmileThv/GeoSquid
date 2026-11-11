<!--
  Settings. For now: syncing progress between devices with a two-word code
  (see sync.svelte.ts). Course topics are chosen on the Learn page.
-->
<script lang="ts">
	import PageHeader from '#lib/PageHeader.svelte';
	import Panel from '#lib/Panel.svelte';
	import { createCode, joinCode, stopSync, sync } from '#lib/sync.svelte.js';

	let typed = $state(''); // the code typed to link this device
	let copied = $state(false);

	async function link(e: SubmitEvent) {
		e.preventDefault();
		if (await joinCode(typed)) typed = '';
	}

	async function copy() {
		if (!sync.code) return;
		await navigator.clipboard.writeText(sync.code);
		copied = true;
		setTimeout(() => (copied = false), 1500);
	}
</script>

<PageHeader title="Settings" crumbs={[{ label: 'GeoSquid' }]} />

<main class="mx-auto w-full max-w-2xl p-3">
	<Panel title="Sync between devices">
		{#snippet action()}
			<span
				class={[
					'text-sm',
					sync.status === 'synced'
						? 'text-kelp'
						: sync.status === 'error'
							? 'text-coral'
							: 'text-mist'
				]}
			>
				{sync.status === 'off'
					? 'Off'
					: sync.status === 'syncing'
						? 'Syncing…'
						: sync.status === 'synced'
							? 'On'
							: sync.status === 'offline'
								? 'Offline'
								: 'Error'}
			</span>
		{/snippet}
		{#if sync.code}
			<p class="text-sm text-mist">Your sync code</p>
			<p class="mt-1 font-display text-3xl font-bold break-all">{sync.code}</p>
			<p class="mt-2 text-sm text-mist">
				On your other device, open Settings and type this code. Keep it to yourself: anyone with it
				can see and change this progress.
			</p>
			<p
				class={[
					'mt-3 text-sm',
					sync.status === 'synced' && 'text-kelp',
					sync.status === 'error' && 'text-coral',
					(sync.status === 'syncing' || sync.status === 'offline') && 'text-mist'
				]}
			>
				{#if sync.status === 'synced'}
					Synced.
				{:else if sync.status === 'syncing'}
					Syncing…
				{:else}
					{sync.message}
				{/if}
			</p>
			<div class="mt-4 flex flex-wrap gap-2">
				<button
					class="flex h-10 items-center rounded-panel bg-squid px-4 font-display font-bold tracking-wide text-on-squid uppercase hover:brightness-105"
					onclick={copy}
				>
					{copied ? 'Copied' : 'Copy code'}
				</button>
				<button
					class="flex h-10 items-center rounded-panel border border-line px-3 font-display font-semibold tracking-wide text-mist uppercase hover:text-ink"
					onclick={stopSync}
				>
					Stop syncing here
				</button>
			</div>
		{:else}
			<p class="text-mist">
				Keep the same progress on your phone and computer. No account: a two-word code links your
				devices.
			</p>
			<button
				class="mt-4 flex h-10 w-full items-center justify-center rounded-panel bg-squid px-4 font-display font-bold tracking-wide text-on-squid uppercase hover:brightness-105 disabled:opacity-60"
				disabled={sync.status === 'syncing'}
				onclick={createCode}
			>
				Create a sync code
			</button>

			<form class="mt-5 border-t border-line pt-4" onsubmit={link}>
				<label for="sync-code" class="text-sm text-mist">Already have a code?</label>
				<div class="mt-1.5 flex gap-2">
					<input
						id="sync-code"
						bind:value={typed}
						placeholder="boussole-cerisier"
						autocomplete="off"
						autocapitalize="none"
						spellcheck="false"
						class="min-w-0 flex-1 rounded-panel border border-line bg-reef px-3 py-2 text-ink placeholder:text-fog focus:border-squid focus:outline-none"
					/>
					<button
						type="submit"
						class="h-10 shrink-0 rounded-panel border border-line bg-reef px-3 text-sm font-medium hover:border-mist disabled:opacity-60"
						disabled={!typed.trim() || sync.status === 'syncing'}
					>
						Link this device
					</button>
				</div>
				<p class="mt-2 text-xs text-fog">
					The progress on this device and on the code are merged: nothing is lost.
				</p>
			</form>
			{#if sync.message}
				<p class={['mt-3 text-sm', sync.status === 'offline' ? 'text-mist' : 'text-coral']}>
					{sync.message}
				</p>
			{/if}
		{/if}
	</Panel>
</main>
