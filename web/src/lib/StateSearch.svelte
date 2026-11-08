<!--
  StateSearch: a search box that finds a state by its name ("sao paulo",
  accents optional), its code ("SP") or its capital ("Recife" → Pernambuco).

  Keyboard: ↑ / ↓ move through the results, Enter picks one, Escape closes.
  Like the map, it doesn't decide what picking does: it calls `onpick`.
-->
<script lang="ts">
	import Icon from './Icon.svelte';
	import type { StateInfo } from './brazil';

	interface Props {
		states: StateInfo[];
		onpick: (uf: string) => void;
	}
	let { states, onpick }: Props = $props();

	const MAX_RESULTS = 6;

	// "São Paulo" → "sao paulo": lets people type without accents
	function plain(text: string): string {
		return text
			.normalize('NFD')
			.replace(/\p{Diacritic}/gu, '')
			.toLowerCase()
			.trim();
	}

	// How well a state matches the query: lower is better, null = no match
	function rank(s: StateInfo, q: string): number | null {
		const name = plain(s.name);
		if (plain(s.uf) === q) return 0; // exact code: "sp"
		if (name.startsWith(q)) return 1; // "sao p"
		if (name.split(/[\s-]+/).some((word) => word.startsWith(q))) return 2; // "paulo"
		if (s.capital && plain(s.capital.name).startsWith(q)) return 3; // "recife"
		if (name.includes(q)) return 4;
		return null;
	}

	let query = $state('');
	let open = $state(false);
	let active = $state(0); // index of the highlighted result

	const results = $derived.by(() => {
		const q = plain(query);
		if (!q) return [];
		return states
			.map((s) => ({ s, r: rank(s, q) }))
			.filter((x) => x.r !== null)
			.sort((a, b) => a.r! - b.r! || a.s.name.localeCompare(b.s.name))
			.slice(0, MAX_RESULTS)
			.map((x) => x.s);
	});

	let input = $state<HTMLInputElement>();

	function pick(s: StateInfo) {
		onpick(s.uf);
		query = '';
		open = false;
		input?.blur(); // closes the phone keyboard so the details are visible
	}

	function onkeydown(e: KeyboardEvent) {
		if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
			e.preventDefault(); // don't move the text cursor
			if (!results.length) return;
			const step = e.key === 'ArrowDown' ? 1 : -1;
			active = (active + step + results.length) % results.length;
			open = true;
		} else if (e.key === 'Enter' && results[active]) {
			pick(results[active]);
		} else if (e.key === 'Escape') {
			query = '';
			open = false;
		}
	}

	// Unique ids, so the screen reader knows the list belongs to the box
	const uid = $props.id();
	const listId = `${uid}-results`;
	const showList = $derived(open && results.length > 0);
	const noMatch = $derived(open && plain(query) !== '' && results.length === 0);
</script>

<div class="relative">
	<Icon
		name="search"
		class="pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-fog"
	/>
	<input
		bind:this={input}
		bind:value={query}
		type="search"
		placeholder="Find a state or capital"
		autocomplete="off"
		spellcheck="false"
		class="w-full rounded-panel border border-line bg-reef py-1.5 pr-3 pl-8 text-sm text-ink placeholder:text-fog focus:border-squid focus:outline-none"
		role="combobox"
		aria-label="Find a state"
		aria-autocomplete="list"
		aria-expanded={showList}
		aria-controls={listId}
		aria-activedescendant={showList ? `${uid}-${active}` : undefined}
		oninput={() => {
			open = true;
			active = 0;
		}}
		onfocus={() => (open = true)}
		onblur={() => (open = false)}
		{onkeydown}
	/>

	{#if showList}
		<!-- onpointerdown + preventDefault: keeps focus in the box, so the
		     list doesn't close (blur) before the click lands -->
		<ul
			id={listId}
			role="listbox"
			class="absolute inset-x-0 top-full z-30 mt-1 divide-y divide-line rounded-panel border border-line bg-panel-head"
			onpointerdown={(e) => e.preventDefault()}
		>
			{#each results as s, i (s.uf)}
				<!-- The keyboard is handled by the search box (↑ ↓ Enter), as
				     usual for a combobox: options never get focus themselves. -->
				<!-- svelte-ignore a11y_click_events_have_key_events -->
				<li
					id="{uid}-{i}"
					role="option"
					aria-selected={i === active}
					class={['flex cursor-pointer items-baseline gap-3 px-3 py-2', i === active && 'bg-reef']}
					onpointerenter={() => (active = i)}
					onclick={() => pick(s)}
				>
					<span class="w-6 text-sm text-mist tabular-nums">{s.uf}</span>
					<span class="font-medium">{s.name}</span>
					{#if s.capital}
						<span class="ml-auto truncate text-sm text-mist">{s.capital.name}</span>
					{/if}
				</li>
			{/each}
		</ul>
	{:else if noMatch}
		<p
			class="absolute inset-x-0 top-full z-30 mt-1 rounded-panel border border-line bg-panel-head px-3 py-2 text-sm text-mist"
		>
			No state matches “{query.trim()}”
		</p>
	{/if}
</div>
