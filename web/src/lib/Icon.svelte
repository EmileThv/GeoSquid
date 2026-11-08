<!--
  Line icons used across the app. Each icon is a list of SVG path strings
  drawn on a 24×24 grid with the current text color.
  Usage: <Icon name="map" class="size-5" />
-->
<script lang="ts" module>
	const ICONS = {
		home: ['M4 11l8-7 8 7', 'M6 9.5V20h12V9.5', 'M10 20v-6h4v6'],
		map: ['M3 6l6-2 6 2 6-2v14l-6 2-6-2-6 2z', 'M9 4v14', 'M15 6v14'],
		learn: ['M3 9l9-5 9 5-9 5z', 'M7 11.5V16c3 2 7 2 10 0v-4.5', 'M21 9v6'],
		clues: [
			'M2.5 12S6 5.5 12 5.5 21.5 12 21.5 12 18 18.5 12 18.5 2.5 12 2.5 12z',
			'M12 9a3 3 0 1 0 0 6 3 3 0 0 0 0-6z'
		],
		stats: ['M4 20V10', 'M10 20V4', 'M16 20v-7', 'M22 20H2'],
		settings: [
			'M12 9a3 3 0 1 0 0 6 3 3 0 0 0 0-6z',
			'M19 12a7 7 0 0 0-.1-1.2l2-1.6-2-3.4-2.4 1a7 7 0 0 0-2-1.2L14 3h-4l-.5 2.6a7 7 0 0 0-2 1.2l-2.4-1-2 3.4 2 1.6a7 7 0 0 0 0 2.4l-2 1.6 2 3.4 2.4-1a7 7 0 0 0 2 1.2L10 21h4l.5-2.6a7 7 0 0 0 2-1.2l2.4 1 2-3.4-2-1.6c.1-.4.1-.8.1-1.2z'
		],
		back: ['M15 5l-7 7 7 7'],
		forward: ['M9 5l7 7-7 7'],
		arrow: ['M4 12h15', 'M13 6l6 6-6 6'],
		lock: ['M6 11h12v9H6z', 'M8.5 11V8a3.5 3.5 0 0 1 7 0v3'],
		flame: [
			'M12 21c-4 0-6.5-2.6-6.5-6 0-4.5 4.5-6 4-11 3 1.5 4.5 4 4.5 6.5 1-1 1.5-2 1.5-3 2 1.5 3 4.5 3 7.5 0 3.4-2.5 6-6.5 6z'
		],
		check: ['M5 12.5l4.5 4.5L19 7'],
		close: ['M6 6l12 12', 'M18 6L6 18']
	} as const;

	export type IconName = keyof typeof ICONS;
</script>

<script lang="ts">
	interface Props {
		name: IconName;
		class?: string;
	}
	let { name, class: className = 'size-5' }: Props = $props();
</script>

<svg
	viewBox="0 0 24 24"
	class={className}
	fill="none"
	stroke="currentColor"
	stroke-width="1.75"
	stroke-linecap="round"
	stroke-linejoin="round"
	aria-hidden="true"
>
	{#each ICONS[name] as d (d)}
		<path {d} />
	{/each}
</svg>
