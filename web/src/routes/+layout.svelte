<!--
  The app shell, shared by every page: a sidebar on desktop and a bottom
  tab bar on phone. Each page renders its own PageHeader and content.
-->
<script lang="ts">
	// Global styles + fonts, loaded once for every page
	import '../app.css';
	import '@fontsource/barlow/400.css';
	import '@fontsource/barlow/500.css';
	import '@fontsource/barlow/600.css';
	import '@fontsource/barlow-semi-condensed/500.css';
	import '@fontsource/barlow-semi-condensed/600.css';
	import '@fontsource/barlow-semi-condensed/700.css';
	import { resolve } from '$app/paths';
	import { navigating, page } from '$app/state';
	import type { RouteId } from '$app/types';
	import favicon from '#lib/assets/favicon.svg';
	import Icon, { type IconName } from '#lib/Icon.svelte';
	import Squid from '#lib/Squid.svelte';
	import type { LayoutProps } from './$types';

	let { children }: LayoutProps = $props();

	// Pages without an href don't exist yet: shown greyed out with "Soon"
	const NAV: { label: string; icon: IconName; href?: RouteId }[] = [
		{ label: 'Home', icon: 'home', href: '/' },
		{ label: 'Explore', icon: 'map', href: '/brazil' },
		{ label: 'Learn', icon: 'learn' },
		{ label: 'Clues', icon: 'clues' },
		{ label: 'Progress', icon: 'stats' }
	];

	function isActive(href?: RouteId) {
		if (!href) return false;
		return href === '/' ? page.url.pathname === '/' : page.url.pathname.startsWith(href);
	}
</script>

<svelte:head>
	<link rel="icon" href={favicon} />
	<!-- Colors the phone's status bar / browser UI to match the app -->
	<meta name="theme-color" content="#16131d" />
	<title>GeoSquid</title>
</svelte:head>

<div class="flex min-h-dvh">
	<!-- Desktop sidebar -->
	<aside
		class="sticky top-0 hidden h-dvh w-56 shrink-0 flex-col border-r border-line bg-deep md:flex"
	>
		<a href={resolve('/')} class="flex h-16 items-center gap-2.5 border-b border-line px-4">
			<Squid class="size-8 text-squid" spinning={!!navigating.to} />
			<span class="font-display text-xl font-bold tracking-wide">GeoSquid</span>
		</a>

		<nav class="flex flex-1 flex-col gap-0.5 p-2">
			{#each NAV as item (item.label)}
				{#if item.href}
					<a
						href={resolve(item.href)}
						class={[
							'relative flex items-center gap-3 rounded-panel px-3 py-2.5 font-medium',
							isActive(item.href) ? 'bg-reef text-ink' : 'text-mist hover:bg-panel hover:text-ink'
						]}
					>
						{#if isActive(item.href)}
							<span class="absolute inset-y-1.5 left-0 w-[3px] bg-squid"></span>
						{/if}
						<Icon name={item.icon} />
						{item.label}
					</a>
				{:else}
					<span class="flex items-center gap-3 px-3 py-2.5 font-medium text-fog">
						<Icon name={item.icon} />
						{item.label}
						<span class="ml-auto text-[11px] font-semibold tracking-wide text-fog">SOON</span>
					</span>
				{/if}
			{/each}
		</nav>

		<div class="border-t border-line p-2">
			<span class="flex items-center gap-3 px-3 py-2.5 font-medium text-fog">
				<Icon name="settings" />
				Settings
			</span>
		</div>
	</aside>

	<!-- Page content -->
	<div class="flex min-w-0 flex-1 flex-col pb-16 md:pb-0">
		{@render children()}
	</div>

	<!-- Phone bottom tab bar -->
	<nav
		class="fixed inset-x-0 bottom-0 z-10 flex border-t border-line bg-deep pb-[env(safe-area-inset-bottom)] md:hidden"
	>
		{#each NAV.slice(0, 4) as item (item.label)}
			<a
				href={item.href ? resolve(item.href) : null}
				aria-disabled={!item.href}
				class={[
					'-mt-px flex flex-1 flex-col items-center gap-1 border-t-2 py-2 text-[11px] font-semibold',
					isActive(item.href) ? 'border-squid text-ink' : 'border-transparent',
					!isActive(item.href) && (item.href ? 'text-mist' : 'text-fog')
				]}
			>
				<Icon name={item.icon} class="size-6" />
				{item.label}
			</a>
		{/each}
	</nav>
</div>
