<!--
  BrazilMap: draws one layer (states, regions or area codes) as clickable
  SVG shapes, with state borders on top and optional capital dots.

  How it works:
  1. The TopoJSON layer is converted to GeoJSON "features" (one per shape).
  2. A projection turns [longitude, latitude] into [x, y] pixels.
  3. geoPath turns each feature into an SVG path string ("M10,20L30,40...").
  4. Svelte draws one <path> per shape with {#each}.

  The component doesn't decide what happens on click: it calls `onselect`
  and lets the page decide. The page owns `selected` and passes it back in.
-->
<script lang="ts">
	import { geoMercator, geoPath } from 'd3-geo';
	import { select } from 'd3-selection';
	import { zoom, zoomIdentity, type ZoomBehavior, type ZoomTransform } from 'd3-zoom';
	import { mesh } from 'topojson-client';
	import type { GeometryCollection, Topology } from 'topojson-specification';
	import Icon from './Icon.svelte';
	import {
		featureId,
		layerFeatures,
		REGION_NAMES,
		regionFill,
		stateFills,
		type Capital,
		type LayerId,
		type StateProps
	} from './brazil';

	interface Props {
		topo: Topology;
		capitals: Capital[];
		layer: LayerId;
		showCapitals: boolean;
		selected: string | null;
		onselect: (id: string) => void;
		/** Pinch / wheel / drag to zoom and pan, with +/− buttons */
		zoomable?: boolean;
		/** Quiz feedback: shapes painted green (right) or red (wrong), the
		 *  rest fades. Overrides the normal colors. */
		marks?: Record<string, 'right' | 'wrong'>;
	}
	let {
		topo,
		capitals,
		layer,
		showCapitals,
		selected,
		onselect,
		zoomable = true,
		marks = {}
	}: Props = $props();

	// The SVG's internal coordinate system. CSS then scales it to fit the screen.
	const WIDTH = 800;
	const HEIGHT = 800;

	// $derived = recomputed automatically when what it uses changes.
	// Switching `layer` therefore redraws the map with the other shapes.
	const shapes = $derived(
		layerFeatures<Record<string, unknown>>(topo, layer).map((f) => ({
			id: featureId(layer, f.properties),
			feature: f
		}))
	);

	// The projection is fitted on the states (not the current layer), so the
	// map doesn't move or zoom when you switch layers.
	// Mercator, like Google Maps and GeoGuessr.
	const states = $derived(layerFeatures<StateProps>(topo, 'states'));
	const projection = $derived(
		geoMercator().fitSize([WIDTH, HEIGHT], { type: 'FeatureCollection', features: states })
	);
	const path = $derived(geoPath(projection));

	// All borders between two states, as a single line drawing.
	// (a !== b keeps only borders shared by two states, not the coastline.)
	const stateBorders = $derived(
		path(mesh(topo, topo.objects.states as GeometryCollection, (a, b) => a !== b)) ?? ''
	);

	// Which state each capital is in → which region, to select it on click
	const regionOf = $derived(
		new Map<string, string>(states.map((s) => [s.properties.SIGLA_UF, s.properties.SIGLA_RG]))
	);

	function capitalId(c: Capital): string {
		if (layer === 'states') return c.uf;
		if (layer === 'regions') return regionOf.get(c.uf) ?? '';
		return String(c.ddd);
	}

	function label(id: string): string {
		return layer === 'regions' ? REGION_NAMES[id] : id;
	}

	// Colors: computed once per map file (see brazil.ts)
	const fillOfState = $derived(stateFills(topo));

	function fillOf(id: string, props: Record<string, unknown>): string | undefined {
		if (layer === 'regions') return regionFill(id);
		if (layer === 'states') return fillOfState.get(id);
		// Area code → its main state's color. If the data has no main_state
		// (older file), fall back to the first state in its list.
		const uf = props.main_state ?? String(props.states).split(',')[0];
		return fillOfState.get(String(uf));
	}

	// Selected shapes (the selection + any marked ones): everything else fades
	const isSelected = (id: string) => id === selected || id in marks;
	const MARK_FILL = { right: 'var(--color-kelp)', wrong: 'var(--color-coral)' };
	const hasSelection = $derived(shapes.some((s) => isSelected(s.id)));

	// Hover is only used inside this component, so it lives here.
	let hovered = $state<string | null>(null);

	// ---- Zoom & pan ---------------------------------------------------------
	// d3-zoom listens to pinch, drag and wheel events on the <svg> and gives
	// us a transform (scale k + translation x, y). We apply it to one <g>
	// wrapping everything, so the whole map moves together.
	let svgEl = $state<SVGSVGElement>();
	let transform = $state<ZoomTransform>(zoomIdentity);
	let zoomer: ZoomBehavior<SVGSVGElement, unknown> | undefined;

	// $effect runs after the <svg> is on screen (svgEl is set), and its
	// returned function runs when the component goes away: clean up there.
	$effect(() => {
		if (!svgEl || !zoomable) return;
		const svg = select(svgEl);
		zoomer = zoom<SVGSVGElement, unknown>()
			.scaleExtent([1, 8]) // from the whole country to 8× closer
			.translateExtent([
				[0, 0],
				[WIDTH, HEIGHT]
			]) // can't drag the map out of view
			.clickDistance(6) // a tiny wobble still counts as a click
			// The wheel zooms (pages with a map don't scroll on desktop, so it
			// isn't needed for scrolling); dragging only with the main button.
			.filter(
				(e: MouseEvent | WheelEvent | TouchEvent) => e.type === 'wheel' || !(e as MouseEvent).button
			)
			.on('zoom', (e) => (transform = e.transform));
		svg.call(zoomer).on('dblclick.zoom', null); // double-click = 2 clicks, not zoom
		return () => {
			svg.on('.zoom', null);
		};
	});

	function zoomBy(factor: number) {
		if (svgEl && zoomer) zoomer.scaleBy(select(svgEl), factor);
	}

	function resetZoom() {
		if (svgEl && zoomer) zoomer.transform(select(svgEl), zoomIdentity);
	}

	// Labels and dots grow with the zoom, but slower than the map (square
	// root), so area codes become readable without turning huge.
	const textScale = $derived(Math.sqrt(transform.k));
</script>

<div class="relative">
	<!-- has-selection: lets the CSS fade every shape except the selected one -->
	<svg
		bind:this={svgEl}
		viewBox="0 0 {WIDTH} {HEIGHT}"
		class:has-selection={hasSelection}
		class:zoomable
		role="group"
		aria-label="Map of Brazil"
	>
		<g transform={transform.toString()} style:--zs={textScale}>
			<!-- 1. One clickable shape per state / region / area code.
	     The (key) lets Svelte tell items apart when the list changes. -->
			{#each shapes as shape (layer + shape.id)}
				{@const fill = fillOf(shape.id, shape.feature.properties)}
				<!-- style:--x sets a CSS variable on this element only; the CSS uses it -->
				<path
					d={path(shape.feature) ?? ''}
					style:--fill={marks[shape.id] ? MARK_FILL[marks[shape.id]] : fill}
					class="zone"
					class:hovered={hovered === shape.id}
					class:selected={isSelected(shape.id)}
					role="button"
					tabindex="0"
					aria-label={label(shape.id)}
					onmouseenter={() => (hovered = shape.id)}
					onmouseleave={() => (hovered = null)}
					onclick={() => onselect(shape.id)}
					onkeydown={(e) => {
						if (e.key === 'Enter' || e.key === ' ') onselect(shape.id);
					}}
				/>
			{/each}

			<!-- 2. State borders on top of regions and area codes, so you can see
	     which state each zone is in. -->
			{#if layer !== 'states'}
				<path d={stateBorders} class="state-borders" />
			{/if}

			<!-- 3. Labels, drawn after the shapes so they're on top.
	     path.centroid gives the [x, y] center of a shape. -->
			{#each shapes as shape (layer + shape.id)}
				{@const [x, y] = path.centroid(shape.feature)}
				<text {x} {y} class="label" class:region={layer === 'regions'}>
					{label(shape.id)}
				</text>
			{/each}

			<!-- 4. Capitals: projection([lon, lat]) gives the pixel position.
	     <title> shows the name as a tooltip on hover. -->
			{#if showCapitals}
				{#each capitals as capital (capital.name)}
					{@const [cx, cy] = projection([capital.lon, capital.lat]) ?? [0, 0]}
					<g class="capital" role="presentation" onclick={() => onselect(capitalId(capital))}>
						<title>{capital.name} ({capital.uf})</title>
						<circle {cx} {cy} r={4 / textScale} />
					</g>
				{/each}
			{/if}
		</g>
	</svg>

	{#if zoomable}
		<!-- Zoom buttons, bottom-right corner of the map. The group is anchored
		     at the bottom, so the reset button appears ABOVE + and − without
		     moving them (no mis-taps on phone). -->
		<div class="absolute right-2 bottom-2 flex flex-col gap-1">
			{#if transform.k > 1}
				<button
					class="grid size-9 place-items-center rounded-panel border border-line bg-panel-head text-mist hover:text-ink"
					aria-label="Reset zoom"
					onclick={resetZoom}
				>
					<Icon name="close" class="size-4" />
				</button>
			{/if}
			{#each [{ label: 'Zoom in', text: '+', f: 1.6 }, { label: 'Zoom out', text: '−', f: 1 / 1.6 }] as b (b.label)}
				<button
					class="grid size-9 place-items-center rounded-panel border border-line bg-panel-head font-display text-xl text-mist hover:text-ink"
					aria-label={b.label}
					onclick={() => zoomBy(b.f)}>{b.text}</button
				>
			{/each}
		</div>
	{/if}
</div>

<style>
	/* Styles here only apply to this component (Svelte scopes them).
	   Colors come from the theme in src/app.css (var(--color-…)). */
	svg {
		width: 100%;
		height: auto;
		display: block;
	}

	/* Lets d3-zoom handle touch gestures instead of the browser */
	svg.zoomable {
		touch-action: none;
	}

	/* Strokes keep the same on-screen width at any zoom */
	path {
		vector-effect: non-scaling-stroke;
	}

	.zone {
		fill: var(--fill, var(--color-reef));
		stroke: var(--color-abyss); /* thin dark lines between zones */
		stroke-width: 0.8;
		cursor: pointer;
		transition: filter 0.12s;
	}

	/* Hover brightens the existing color instead of replacing it */
	.zone.hovered {
		filter: brightness(1.22);
	}

	/* Selection by contrast: everything else fades, the selected shape
	   keeps its full color. No outline. */
	.has-selection .zone:not(.selected) {
		filter: saturate(0.45) brightness(0.7);
	}

	.has-selection .zone:not(.selected).hovered {
		filter: saturate(0.6) brightness(0.8);
	}

	.zone:focus {
		outline: none;
	}

	.zone:focus-visible {
		stroke: var(--color-squid);
		stroke-width: 2;
	}

	.state-borders {
		fill: none;
		stroke: var(--color-ink);
		stroke-width: 1.1;
		stroke-opacity: 0.45;
		pointer-events: none; /* clicks go through to the zones below */
	}

	.label {
		font-family: var(--font-sans);
		font-size: calc(11px / var(--zs, 1));
		font-weight: 600;
		text-anchor: middle;
		dominant-baseline: central;
		fill: var(--color-ink);
		pointer-events: none;
	}

	/* Region names: bigger, in the title font */
	.label.region {
		font-family: var(--font-display);
		font-size: calc(22px / var(--zs, 1));
		font-weight: 600;
		letter-spacing: 0.02em;
	}

	.capital {
		cursor: pointer;
	}

	/* Light dot with a dark ring: visible on every region color */
	.capital circle {
		fill: var(--color-ink);
		stroke: var(--color-abyss);
		stroke-width: 1.5;
	}

	.capital circle {
		vector-effect: non-scaling-stroke;
	}

	.capital:hover circle {
		r: calc(6px / var(--zs, 1));
	}
</style>
