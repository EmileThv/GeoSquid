<!--
  Explore Brazil: the interactive map, one layer at a time, and a details
  panel for whatever is selected.
-->
<script lang="ts">
	import BrazilMap from '#lib/BrazilMap.svelte';
	import ClueCard from '#lib/ClueCard.svelte';
	import Icon from '#lib/Icon.svelte';
	import PageHeader from '#lib/PageHeader.svelte';
	import Panel from '#lib/Panel.svelte';
	import StateSearch from '#lib/StateSearch.svelte';
	import {
		buildIndex,
		cluesForRegion,
		cluesForState,
		LAYERS,
		REGION_NAMES,
		regionFill,
		type Clue,
		type LayerId,
		type Strength
	} from '#lib/brazil.js';
	import type { PageProps } from './$types';

	// `data` is whatever +page.ts's load function returned
	let { data }: PageProps = $props();

	// Lookup tables: state → area codes, region → states, area code → states…
	const index = $derived(buildIndex(data.topo, data.capitals));

	// Page state. It lives here, not in the map, because both the map and
	// the details panel need it. The map reports clicks through `onselect`.
	let layer = $state<LayerId>('states');
	let selected = $state<string | null>(null);
	let showCapitals = $state(false);

	function select(id: string) {
		// Tapping the selected shape again deselects it
		selected = selected === id ? null : id;
	}

	// Jump to another layer and select something there (used by the links in
	// the details: tap "SP" in an area code's details → go to the states layer).
	function goTo(newLayer: LayerId, id: string | number) {
		layer = newLayer;
		selected = String(id);
	}

	function switchLayer(newLayer: LayerId) {
		layer = newLayer;
		selected = null; // an id from one layer means nothing in another
	}

	// What the details panel shows, depending on the layer
	const stateInfo = $derived(
		layer === 'states' && selected ? index.states.get(selected) : undefined
	);
	const region = $derived(
		layer === 'regions' && selected ? index.regions.get(selected) : undefined
	);
	const ddd = $derived(layer === 'ddd' && selected ? index.ddds.get(Number(selected)) : undefined);

	const layerLabel = $derived(LAYERS.find((l) => l.id === layer)!.label);

	// Plonk It clues for the selection: the state's own clues, then the ones
	// for its whole region. For a region: the region-wide clues.
	const allClues = $derived(data.clues.clues);
	const stateClues = $derived(stateInfo ? cluesForState(allClues, stateInfo.uf) : []);
	const stateRegionClues = $derived(stateInfo ? cluesForRegion(allClues, stateInfo.region) : []);
	const regionClues = $derived(region ? cluesForRegion(allClues, region.code) : []);

	// Other states a clue is *also* exclusive to (for "Only here & RR")
	function alsoExclusive(clue: Clue, uf: string): string[] {
		return Object.entries(clue.states)
			.filter(([other, s]) => other !== uf && s === 'exclusive')
			.map(([other]) => other);
	}
</script>

<!-- A titled list of clues. `strengthOf` says how strongly each clue points
     to the place being viewed; `shared` lists other exclusive places. -->
{#snippet clueList(
	title: string,
	clues: Clue[],
	strengthOf: (c: Clue) => Strength,
	shared: (c: Clue) => string[] = () => []
)}
	{#if clues.length}
		<h3 class="mt-6 flex items-baseline justify-between text-lg font-semibold">
			{title}
			<span class="text-sm font-normal text-mist tabular-nums">{clues.length}</span>
		</h3>
		<div class="divide-y divide-line">
			{#each clues as clue (clue.id)}
				<ClueCard {clue} strength={strengthOf(clue)} sharedWith={shared(clue)} />
			{/each}
		</div>
	{/if}
{/snippet}

<!-- Credit line under the clues (required by Plonk It's license) -->
{#snippet credit()}
	<p class="mt-2 border-t border-line pt-3 text-xs text-fog">
		Clues and photos:
		<!-- External link (Plonk It), so no resolve() -->
		<!-- eslint-disable-next-line svelte/no-navigation-without-resolve -->
		<a href={data.clues.source} class="underline hover:text-mist" target="_blank" rel="noreferrer"
			>Plonk It</a
		>, {data.clues.license}
	</p>
{/snippet}

<!-- A link-like button that jumps somewhere on the map -->
{#snippet jump(text: string, onclick: () => void)}
	<button class="font-medium text-ink hover:text-squid" {onclick}>{text}</button>
{/snippet}

<PageHeader title="Explore" crumbs={[{ label: 'Brazil' }]}>
	{#snippet tabs()}
		<div class="flex" role="group" aria-label="Map layer">
			{#each LAYERS as l (l.id)}
				<button
					class={[
						'-mb-px border-b-2 px-4 py-2.5 font-display font-semibold tracking-wide whitespace-nowrap uppercase transition-colors',
						layer === l.id ? 'border-squid text-ink' : 'border-transparent text-mist hover:text-ink'
					]}
					onclick={() => switchLayer(l.id)}
				>
					{l.label}
				</button>
			{/each}
		</div>
	{/snippet}
</PageHeader>

<main class="grid items-start gap-3 p-3 lg:grid-cols-[minmax(0,1fr)_22rem]">
	<Panel title={layerLabel} flush>
		{#snippet action()}
			<label class="flex cursor-pointer items-center gap-2 text-sm text-mist select-none">
				<input type="checkbox" class="size-3.5 accent-squid" bind:checked={showCapitals} />
				Capitals
			</label>
		{/snippet}

		<!-- Search: picking a state shows it on the states layer -->
		<div class="border-b border-line p-2 sm:px-4">
			<StateSearch states={[...index.states.values()]} onpick={(uf) => goTo('states', uf)} />
		</div>

		<div class="mx-auto max-w-2xl p-2 sm:p-4">
			<BrazilMap
				topo={data.topo}
				capitals={data.capitals}
				{layer}
				{showCapitals}
				{selected}
				onselect={select}
			/>
		</div>

		<!-- Region key: desktop only (on phone, use the Regions tab) -->
		<ul class="hidden flex-wrap gap-x-5 gap-y-1 border-t border-line px-4 py-2.5 md:flex">
			{#each Object.entries(REGION_NAMES) as [code, name] (code)}
				<li>
					<button
						class="flex items-center gap-2 py-0.5 text-sm text-mist hover:text-ink"
						onclick={() => goTo('regions', code)}
					>
						<span class="size-2.5" style:background={regionFill(code)}></span>
						{name}
					</button>
				</li>
			{/each}
		</ul>
	</Panel>

	<!-- Details. Desktop: a sticky column next to the map.
	     Phone/tablet: a sheet over the map, above the tab bar, only while
	     something is selected. -->
	<div
		class={[
			selected
				? 'fixed inset-x-2 bottom-[calc(4.25rem+env(safe-area-inset-bottom))] z-20 md:right-3 md:bottom-3 md:left-[calc(14rem+0.75rem)]'
				: 'hidden',
			'lg:sticky lg:inset-auto lg:top-3 lg:z-auto lg:block'
		]}
	>
		<Panel title="Details" class="max-h-[50dvh] lg:max-h-[calc(100dvh-8.75rem)]">
			{#snippet action()}
				<button
					class="grid size-8 place-items-center text-mist hover:text-ink lg:hidden"
					aria-label="Close"
					onclick={() => (selected = null)}
				>
					<Icon name="close" class="size-4" />
				</button>
			{/snippet}
			{#if stateInfo}
				<p class="font-display text-3xl font-bold">
					{stateInfo.name} <span class="text-mist">{stateInfo.uf}</span>
				</p>
				<dl class="mt-3 divide-y divide-line">
					<div class="flex justify-between gap-4 py-2.5">
						<dt class="text-mist">Region</dt>
						<dd>
							{@render jump(REGION_NAMES[stateInfo.region], () =>
								goTo('regions', stateInfo.region)
							)}
						</dd>
					</div>
					<div class="flex justify-between gap-4 py-2.5">
						<dt class="text-mist">Capital</dt>
						<dd>{stateInfo.capital?.name ?? '—'}</dd>
					</div>
					<div class="flex justify-between gap-4 py-2.5">
						<dt class="shrink-0 text-mist">Area codes</dt>
						<dd class="flex flex-wrap justify-end gap-x-3 tabular-nums">
							{#each stateInfo.ddds as code (code)}
								{@render jump(String(code), () => goTo('ddd', code))}
							{/each}
						</dd>
					</div>
				</dl>

				{@render clueList(
					'Clues',
					stateClues,
					(c) => c.states[stateInfo.uf],
					(c) => alsoExclusive(c, stateInfo.uf)
				)}
				{@render clueList(
					`Across the ${REGION_NAMES[stateInfo.region]}`,
					stateRegionClues,
					(c) => c.regions[stateInfo.region]
				)}
				{#if stateClues.length || stateRegionClues.length}{@render credit()}{/if}
			{:else if region}
				<p class="font-display text-3xl font-bold">{region.name}</p>
				<ul class="mt-3 divide-y divide-line">
					{#each region.states as s (s.uf)}
						<li>
							<button
								class="flex w-full items-center gap-3 py-2.5 text-left hover:text-squid"
								onclick={() => goTo('states', s.uf)}
							>
								<span class="w-7 text-sm text-mist tabular-nums">{s.uf}</span>
								<span class="font-medium">{s.name}</span>
							</button>
						</li>
					{/each}
				</ul>

				{@render clueList('Region-wide clues', regionClues, (c) => c.regions[region.code])}
				{#if regionClues.length}{@render credit()}{/if}
			{:else if ddd}
				<p class="font-display text-5xl font-bold tabular-nums">{ddd.ddd}</p>
				<p class="mt-1 text-mist">
					Written as <span class="text-ink tabular-nums">({ddd.ddd}) 3456-7890</span>
				</p>
				<dl class="mt-3 divide-y divide-line">
					<div class="flex justify-between gap-4 py-2.5">
						<dt class="text-mist">{ddd.states.length > 1 ? 'States' : 'State'}</dt>
						<dd class="flex flex-wrap justify-end gap-x-3">
							{#each ddd.states as s (s.uf)}
								{@render jump(s.name, () => goTo('states', s.uf))}
							{/each}
						</dd>
					</div>
					{#if ddd.capital}
						<div class="flex justify-between gap-4 py-2.5">
							<dt class="text-mist">Capital</dt>
							<dd>{ddd.capital.name}</dd>
						</div>
					{/if}
				</dl>
			{:else}
				<p class="text-mist">Select a shape on the map.</p>
			{/if}
		</Panel>
	</div>
</main>
