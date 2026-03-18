<script lang="ts">
	import { cn } from '$lib/utils';
	import { buttonVariants, type ButtonVariant, type ButtonSize } from './index';
	import type { Snippet } from 'svelte';
	import type { HTMLButtonAttributes } from 'svelte/elements';

	interface Props extends HTMLButtonAttributes {
		variant?: ButtonVariant;
		size?: ButtonSize;
		class?: string;
		children?: Snippet;
	}

	let { variant = 'default', size = 'default', class: className, children, ...restProps }: Props =
		$props();
</script>

<button class={cn(buttonVariants({ variant, size }), className)} {...restProps}>
	{#if children}
		{@render children()}
	{/if}
</button>
