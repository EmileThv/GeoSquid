<!--
  The GeoSquid logo. Drawn in currentColor, so its color comes from the
  surrounding text color (e.g. class="text-squid").

  With `spinning`, it becomes the loading indicator: the squid bobs gently
  and its tentacles sway. Animation stops for people who ask their system
  for reduced motion.
-->
<script lang="ts">
	interface Props {
		spinning?: boolean;
		class?: string;
		label?: string;
	}
	let { spinning = false, class: className = '', label = 'GeoSquid' }: Props = $props();
</script>

<svg
	viewBox="0 0 64 64"
	class={['squid', className]}
	class:spinning
	role="img"
	aria-label={spinning ? 'Loading' : label}
>
	<g class="body">
		<!-- Fins -->
		<path d="M23 15 L12 22 L22 25 Z" fill="currentColor" />
		<path d="M41 15 L52 22 L42 25 Z" fill="currentColor" />
		<!-- Mantle: pointed top, round bottom -->
		<path
			d="M32 4 C41 11 46 20 46 31 C46 38 41 41 32 41 C23 41 18 38 18 31 C18 20 23 11 32 4 Z"
			fill="currentColor"
		/>
		<!-- Eyes, cut out in the background color -->
		<circle cx="26.5" cy="32" r="3.2" fill="var(--color-abyss)" />
		<circle cx="37.5" cy="32" r="3.2" fill="var(--color-abyss)" />
		<circle cx="27.4" cy="31" r="1" fill="currentColor" />
		<circle cx="38.4" cy="31" r="1" fill="currentColor" />
		<!-- Tentacles -->
		<g
			class="tentacles"
			fill="none"
			stroke="currentColor"
			stroke-width="3.4"
			stroke-linecap="round"
		>
			<path d="M21.5 39 C19 46 23 50 19.5 58" />
			<path d="M26.5 40 C25 47 28 51 26 59" />
			<path d="M32 40.5 C32 47 30.5 52 32 60" />
			<path d="M37.5 40 C39 47 36 51 38 59" />
			<path d="M42.5 39 C45 46 41 50 44.5 58" />
		</g>
	</g>
</svg>

<style>
	.squid {
		display: block;
		overflow: visible;
	}

	.tentacles {
		transform-origin: 32px 40px;
	}

	.spinning .body {
		animation: bob 1.4s ease-in-out infinite alternate;
	}

	.spinning .tentacles {
		animation: sway 0.7s ease-in-out infinite alternate;
	}

	@keyframes bob {
		from {
			transform: translateY(2px);
		}
		to {
			transform: translateY(-3px);
		}
	}

	@keyframes sway {
		from {
			transform: skewX(-7deg);
		}
		to {
			transform: skewX(7deg);
		}
	}

	@media (prefers-reduced-motion: reduce) {
		.spinning .body,
		.spinning .tentacles {
			animation: none;
		}
	}
</style>
