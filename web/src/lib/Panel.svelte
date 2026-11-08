<!--
  Panel: the basic building block of every screen, like the boxes on
  Football Manager's home screen. A title strip on top, content below.
  `action` is an optional snippet shown on the right of the title strip
  (a link, a toggle…).
-->
<script lang="ts">
	import type { Snippet } from 'svelte';

	interface Props {
		title: string;
		action?: Snippet;
		children: Snippet;
		class?: string;
		/** Remove the body padding (for maps, tables, lists that go edge to edge) */
		flush?: boolean;
	}
	let { title, action, children, class: className = '', flush = false }: Props = $props();
</script>

<section
	class={['flex flex-col overflow-hidden rounded-panel border border-line bg-panel', className]}
>
	<header
		class="flex min-h-10 items-center justify-between gap-3 border-b border-line bg-panel-head px-4"
	>
		<h2 class="text-[15px] font-semibold">{title}</h2>
		{@render action?.()}
	</header>
	<div class={['min-h-0 flex-1 overflow-y-auto', !flush && 'p-4']}>
		{@render children()}
	</div>
</section>
