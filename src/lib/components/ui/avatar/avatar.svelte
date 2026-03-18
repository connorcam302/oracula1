<script lang="ts">
	import { cn } from '$lib/utils';

	interface Props {
		src?: string | null;
		alt?: string;
		fallback?: string;
		class?: string;
	}

	let { src, alt = '', fallback = '?', class: className }: Props = $props();

	let imgError = $state(false);

	function getInitials(name: string): string {
		return name.charAt(0).toUpperCase();
	}
</script>

<div
	class={cn(
		'relative flex h-10 w-10 shrink-0 overflow-hidden rounded-full bg-muted',
		className
	)}
>
	{#if src && !imgError}
		<img {src} {alt} class="aspect-square h-full w-full object-cover" onerror={() => (imgError = true)} />
	{:else}
		<span class="flex h-full w-full items-center justify-center text-sm font-medium text-muted-foreground">
			{fallback ? getInitials(fallback) : '?'}
		</span>
	{/if}
</div>
