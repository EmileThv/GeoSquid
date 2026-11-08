<!--
  PageHeader: the top bar of every page, Football Manager style.
  Back/forward arrows, a breadcrumb trail above the page title, and room on
  the right for the page's main action (e.g. the big Continue button).
  `tabs` is an optional snippet rendered as a second row (sub-sections).
-->
<script lang="ts">
	import type { Snippet } from 'svelte';
	import { resolve } from '$app/paths';
	import { navigating } from '$app/state';
	import type { RouteId } from '$app/types';
	import Icon from './Icon.svelte';
	import Squid from './Squid.svelte';

	interface Props {
		title: string;
		crumbs?: { label: string; href?: RouteId }[];
		actions?: Snippet;
		tabs?: Snippet;
	}
	let { title, crumbs = [], actions, tabs }: Props = $props();
</script>

<header class="border-b border-line bg-deep">
	<div class="flex min-h-16 items-center gap-3 px-4">
		<!-- Phone: the logo (the sidebar is hidden there). Desktop: history arrows -->
		<a href={resolve('/')} class="md:hidden" aria-label="Home">
			<Squid class="size-8 text-squid" spinning={!!navigating.to} />
		</a>
		<div class="hidden gap-1 md:flex">
			<button
				class="grid size-8 place-items-center rounded-panel text-mist hover:bg-reef hover:text-ink"
				aria-label="Back"
				onclick={() => history.back()}
			>
				<Icon name="back" class="size-4" />
			</button>
			<button
				class="grid size-8 place-items-center rounded-panel text-mist hover:bg-reef hover:text-ink"
				aria-label="Forward"
				onclick={() => history.forward()}
			>
				<Icon name="forward" class="size-4" />
			</button>
		</div>

		<div class="min-w-0 flex-1 py-2">
			{#if crumbs.length}
				<nav class="flex gap-1.5 text-xs text-mist" aria-label="Breadcrumb">
					{#each crumbs as crumb, i (crumb.label)}
						{#if i > 0}<span class="text-fog">›</span>{/if}
						{#if crumb.href}
							<a href={resolve(crumb.href)} class="hover:text-ink">{crumb.label}</a>
						{:else}
							<span>{crumb.label}</span>
						{/if}
					{/each}
				</nav>
			{/if}
			<h1 class="truncate text-2xl leading-tight font-semibold">{title}</h1>
		</div>

		{@render actions?.()}
	</div>

	{#if tabs}
		<div class="overflow-x-auto px-4">{@render tabs()}</div>
	{/if}
</header>
