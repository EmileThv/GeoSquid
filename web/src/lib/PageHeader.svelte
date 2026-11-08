<!--
  PageHeader: the top bar of every page, Football Manager style.
  Back/forward arrows, a breadcrumb trail above the page title, and room on
  the right for the page's main action (e.g. the big Continue button).
  `tabs` is an optional snippet rendered as a second row (sub-sections).

  Phone: no logo, breadcrumbs or title (the bottom tab bar already says
  where you are). Only the page's action and tabs show; a page with neither
  has no header at all. The title stays in the page for screen readers.
-->
<script lang="ts">
	import type { Snippet } from 'svelte';
	import { resolve } from '$app/paths';
	import type { StaticRoute } from './index';
	import Icon from './Icon.svelte';

	interface Props {
		title: string;
		crumbs?: { label: string; href?: StaticRoute }[];
		actions?: Snippet;
		tabs?: Snippet;
	}
	let { title, crumbs = [], actions, tabs }: Props = $props();
</script>

<header class={['bg-deep md:border-b md:border-line', (actions || tabs) && 'border-b border-line']}>
	<div class={['flex items-center gap-3 px-4 md:min-h-16', actions && 'py-2 md:py-0']}>
		<!-- Desktop only: history arrows -->
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

		<!-- sr-only on phone: hidden from view, still read by screen readers -->
		<div class="sr-only md:not-sr-only md:min-w-0 md:flex-1 md:py-2">
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

		{#if actions}
			<div class="ml-auto">{@render actions()}</div>
		{/if}
	</div>

	{#if tabs}
		<div class="overflow-x-auto px-4">{@render tabs()}</div>
	{/if}
</header>
