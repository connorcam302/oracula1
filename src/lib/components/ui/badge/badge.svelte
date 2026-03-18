<script lang="ts">
	import { cn } from '$lib/utils';
	import { badgeVariants, type BadgeVariant } from './index';
	import type { Snippet } from 'svelte';

	interface Props {
		variant?: BadgeVariant;
		class?: string;
		children?: Snippet;
	}

	let { variant = 'default', class: className, children, ...restProps }: Props = $props();
</script>

<div class={cn(badgeVariants({ variant }), className)} {...restProps}>
	{#if children}{@render children()}{/if}
</div>
