<script lang="ts">
	import '../app.css';
	import AppSidebar from '$lib/components/app-sidebar.svelte';
	import { Button } from '$lib/components/ui/button';
	import { Menu, X } from 'lucide-svelte';
	import type { Snippet } from 'svelte';

	let { data, children }: { data: any; children: Snippet } = $props();

	let collapsed = $state(false);
	let mobileOpen = $state(false);
</script>

<svelte:head>
	<title>Oracula - F1 Race Tracker</title>
</svelte:head>

<!-- Mobile Menu Button -->
<div class="fixed top-3 left-3 z-50 md:hidden">
	<Button variant="outline" size="icon" onclick={() => (mobileOpen = !mobileOpen)}>
		{#if mobileOpen}
			<X class="h-5 w-5" />
		{:else}
			<Menu class="h-5 w-5" />
		{/if}
	</Button>
</div>

<!-- Mobile Overlay -->
{#if mobileOpen}
	<button
		class="fixed inset-0 z-30 bg-black/50 md:hidden"
		onclick={() => (mobileOpen = false)}
		aria-label="Close menu"
	></button>
{/if}

<div class="flex h-screen overflow-hidden">
	<!-- Sidebar - hidden on mobile unless open -->
	<div
		class="fixed inset-y-0 left-0 z-40 md:relative md:flex {mobileOpen
			? 'flex'
			: 'hidden md:flex'}"
	>
		<AppSidebar bind:collapsed session={data.session} />
	</div>

	<main class="flex flex-1 flex-col overflow-y-auto bg-background">
		{@render children()}
	</main>
</div>
