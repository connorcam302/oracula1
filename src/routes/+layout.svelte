<script lang="ts">
	import '../app.css';
	import AppSidebar from '$lib/components/app-sidebar.svelte';
	import type { Snippet } from 'svelte';

	let { data, children }: { data: any; children: Snippet } = $props();

	let collapsed = $state(false);
</script>

<svelte:head>
	<title>Oracula - F1 Race Tracker</title>
</svelte:head>

<div class="flex h-screen overflow-hidden">
	<AppSidebar bind:collapsed session={data.session} />
	<main class="flex-1 overflow-y-auto bg-background">
		{@render children()}
	</main>
</div>
