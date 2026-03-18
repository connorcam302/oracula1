<script lang="ts">
	import { Moon, Sun } from 'lucide-svelte';
	import { Button } from '$lib/components/ui/button';

	let dark = $state(false);

	$effect(() => {
		// Check initial preference
		if (typeof window !== 'undefined') {
			dark =
				document.documentElement.classList.contains('dark') ||
				(!document.documentElement.classList.contains('light') &&
					window.matchMedia('(prefers-color-scheme: dark)').matches);

			if (dark) {
				document.documentElement.classList.add('dark');
			}
		}
	});

	function toggle() {
		dark = !dark;
		if (dark) {
			document.documentElement.classList.add('dark');
			localStorage.setItem('theme', 'dark');
		} else {
			document.documentElement.classList.remove('dark');
			localStorage.setItem('theme', 'light');
		}
	}
</script>

<Button variant="ghost" size="icon" onclick={toggle} class="h-8 w-8">
	{#if dark}
		<Sun class="h-4 w-4" />
	{:else}
		<Moon class="h-4 w-4" />
	{/if}
</Button>
