<!--
  Home: an overview of the whole app, as a few panels.
  Course progress, daily goal and the courses list are placeholders for
  now (nothing is saved yet): they show what the app will look like.
-->
<script lang="ts">
	import { goto } from '$app/navigation';
	import { resolve } from '$app/paths';
	import BrazilMap from '#lib/BrazilMap.svelte';
	import Icon from '#lib/Icon.svelte';
	import PageHeader from '#lib/PageHeader.svelte';
	import Panel from '#lib/Panel.svelte';
	import { REGION_NAMES, regionFill } from '#lib/brazil.js';
	import type { PageProps } from './$types';

	let { data }: PageProps = $props();

	// The Brazil course: one unit per macro-region (placeholder progress)
	const units = [
		{ code: 'SE', done: 0, total: 12 },
		{ code: 'S', done: 0, total: 10 },
		{ code: 'CO', done: 0, total: 10 },
		{ code: 'NE', done: 0, total: 16 },
		{ code: 'N', done: 0, total: 12 }
	];

	const courses = [
		{ name: 'Brazil', status: 'In progress' },
		{ name: 'United States', status: 'Soon' },
		{ name: 'Germany', status: 'Soon' },
		{ name: 'Indonesia', status: 'Soon' }
	];

	// Clue of the day (from Plonk It's Brazil guide, CC BY-NC-SA 4.0)
	let revealed = $state(false);
</script>

<PageHeader title="Home" crumbs={[{ label: 'GeoSquid' }]}>
	{#snippet actions()}
		<button
			class="flex h-10 items-center gap-2 rounded-panel bg-squid px-4 font-display font-bold tracking-wide text-on-squid uppercase hover:brightness-105"
		>
			Continue
			<Icon name="arrow" class="size-4" />
		</button>
	{/snippet}
</PageHeader>

<main class="grid gap-3 p-3 lg:grid-cols-3">
	<!-- Current course -->
	<Panel title="Current course" class="lg:col-span-2">
		<div class="flex items-end justify-between gap-4">
			<div>
				<p class="font-display text-4xl font-bold">Brazil</p>
				<p class="text-mist">5 units · states, area codes and clues</p>
			</div>
			<p class="font-display text-3xl font-semibold text-mist">0%</p>
		</div>
		<div class="mt-3 h-1.5 bg-reef"><div class="h-full w-0 bg-squid"></div></div>

		<!-- Phone: just the next unit and today's goal (the full list is desktop-only) -->
		<div class="mt-3 divide-y divide-line md:hidden">
			<p class="flex items-center gap-3 py-2.5">
				<span class="size-3 shrink-0" style:background={regionFill(units[0].code)}></span>
				<span class="font-medium">{REGION_NAMES[units[0].code]}</span>
				<span class="ml-auto text-xs font-bold tracking-wide text-squid uppercase">Next</span>
			</p>
			<p class="flex items-center gap-2 py-2.5 text-mist">
				<Icon name="flame" class="size-4 text-fog" />
				<span><span class="text-ink tabular-nums">0 / 20</span> reviews today</span>
			</p>
		</div>

		<ol class="mt-4 hidden divide-y divide-line md:block">
			{#each units as unit, i (unit.code)}
				<li class="flex items-center gap-3 py-2.5">
					<span class="size-3 shrink-0" style:background={regionFill(unit.code)}></span>
					<span class="font-medium">{REGION_NAMES[unit.code]}</span>
					<span class="ml-auto text-sm text-mist tabular-nums">{unit.done} / {unit.total}</span>
					{#if i === 0}
						<span class="w-16 text-right text-xs font-bold tracking-wide text-squid uppercase"
							>Next</span
						>
					{:else}
						<span class="flex w-16 justify-end text-fog"><Icon name="lock" class="size-4" /></span>
					{/if}
				</li>
			{/each}
		</ol>
	</Panel>

	<!-- Daily goal (desktop: on phone it's a line in the course panel) -->
	<div class="hidden md:block">
		<Panel title="Today" class="h-full">
			<div class="flex h-full flex-col justify-between gap-6">
				<div>
					<p class="font-display text-5xl font-bold tabular-nums">
						0<span class="text-2xl text-fog"> / 20</span>
					</p>
					<p class="text-mist">reviews for your daily goal</p>
				</div>
				<div class="flex items-center gap-2 text-mist">
					<Icon name="flame" class="size-5 text-fog" />
					No streak yet
				</div>
			</div>
		</Panel>
	</div>

	<!-- Explore: small map preview (desktop: on phone, Explore is in the tab bar) -->
	<div class="hidden md:block lg:col-span-2 lg:row-span-2">
		<Panel title="Explore Brazil" class="h-full" flush>
			{#snippet action()}
				<a
					href={resolve('/brazil')}
					class="flex items-center gap-1 text-sm text-mist hover:text-squid"
				>
					Open map <Icon name="arrow" class="size-4" />
				</a>
			{/snippet}
			<div class="mx-auto max-w-md p-4">
				<BrazilMap
					topo={data.topo}
					capitals={data.capitals}
					layer="regions"
					showCapitals={false}
					selected={null}
					onselect={() => goto(resolve('/brazil'))}
					zoomable={false}
				/>
			</div>
		</Panel>
	</div>

	<!-- Courses (desktop only for now) -->
	<div class="hidden md:block">
		<Panel title="Courses" class="h-full" flush>
			<ul class="divide-y divide-line">
				{#each courses as course (course.name)}
					<li
						class={[
							'flex items-center justify-between px-4 py-3',
							course.status === 'Soon' && 'text-fog'
						]}
					>
						<span class="font-medium">{course.name}</span>
						<span class="text-sm">{course.status}</span>
					</li>
				{/each}
			</ul>
		</Panel>
	</div>

	<!-- Clue of the day -->
	<Panel title="Clue of the day">
		<p class="text-lg leading-snug">
			Where in Brazil do you find brown, mushroom-shaped insulators?
		</p>
		{#if revealed}
			<p class="mt-3 font-display text-2xl font-bold text-kelp">Pernambuco</p>
			<p class="mt-1 text-sm text-mist">Only there. Source: Plonk It</p>
		{:else}
			<button
				class="mt-4 h-9 rounded-panel border border-line bg-reef px-4 font-medium hover:border-mist"
				onclick={() => (revealed = true)}
			>
				Reveal
			</button>
		{/if}
	</Panel>
</main>
