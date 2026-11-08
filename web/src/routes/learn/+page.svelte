<!--
  Learn: the Brazil course, one unit per theme (all poles, all lamps…).
  Every unit can be started at any time; finished ones show their best
  score (saved in this browser, see progress.svelte.ts).
-->
<script lang="ts">
	import { resolve } from '$app/paths';
	import Icon from '#lib/Icon.svelte';
	import PageHeader from '#lib/PageHeader.svelte';
	import Panel from '#lib/Panel.svelte';
	import { THEMES, themeClues } from '#lib/course.js';
	import { loadProgress, nextUnit, progress } from '#lib/progress.svelte.js';
	import type { PageProps } from './$types';

	let { data }: PageProps = $props();

	$effect(loadProgress);

	const units = $derived(
		THEMES.map((theme) => ({ theme, clues: themeClues(theme, data.clues.clues) }))
	);
</script>

<PageHeader title="Learn" crumbs={[{ label: 'Brazil' }]} />

<main class="mx-auto w-full max-w-3xl p-3">
	<Panel title="Brazil · by theme" flush>
		<ul class="divide-y divide-line">
			{#each units as { theme, clues } (theme.id)}
				{@const result = progress.units[theme.id]}
				<li>
					<a
						href={resolve('/learn/[unit]', { unit: theme.id })}
						class="group flex items-center gap-4 px-4 py-3 hover:bg-reef"
					>
						<!-- Three photos from the unit as a preview -->
						<span class="hidden shrink-0 gap-1 sm:flex">
							{#each clues.slice(0, 3) as clue (clue.id)}
								<img
									src={`/data/brazil/${clue.image}`}
									alt=""
									class="h-12 w-16 rounded-panel bg-reef object-cover"
								/>
							{/each}
						</span>
						<span class="min-w-0 flex-1">
							<span class="block font-display text-lg font-semibold">{theme.name}</span>
							<span class="block truncate text-sm text-mist">{theme.blurb}</span>
						</span>
						{#if result}
							<span class="flex items-center gap-1.5 text-sm text-kelp tabular-nums">
								<Icon name="check" class="size-4" />
								{result.best} / {result.total}
							</span>
						{:else if progress.loaded && theme.id === nextUnit()}
							<span class="text-xs font-bold tracking-wide text-squid uppercase">Next</span>
						{:else}
							<span class="text-sm text-mist tabular-nums">{clues.length} clues</span>
						{/if}
						<Icon name="arrow" class="size-4 text-fog group-hover:text-squid" />
					</a>
				</li>
			{/each}
		</ul>
	</Panel>
	<p class="mt-3 px-1 text-sm text-fog">
		Progress is saved in this browser only: it won't follow you to another device.
	</p>
</main>
