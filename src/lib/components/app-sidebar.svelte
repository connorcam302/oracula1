<script lang="ts">
	import { page } from '$app/stores';
	import { signIn, signOut } from '@auth/sveltekit/client';
	import { Avatar } from '$lib/components/ui/avatar';
	import { Button } from '$lib/components/ui/button';
	import { Separator } from '$lib/components/ui/separator';
	import ThemeToggle from '$lib/components/theme-toggle.svelte';
	import {
		Home,
		Trophy,
		BarChart3,
		User,
		LogIn,
		LogOut,
		ChevronLeft,
		ChevronRight,
		Flag,
		Users,
		UserCheck
	} from 'lucide-svelte';

	interface Props {
		collapsed?: boolean;
		session?: any;
	}

	let { collapsed = $bindable(false), session }: Props = $props();

	const navItems = [
		{ href: '/', label: 'Home', icon: Home },
		{ href: '/seasons', label: 'Seasons', icon: Trophy },
		{ href: '/stats', label: 'Stats', icon: BarChart3 },
		{ href: '/profile', label: 'Profile', icon: User }
	];

	function isActive(href: string, pathname: string) {
		if (href === '/') return pathname === '/';
		return pathname.startsWith(href);
	}
</script>

<aside
	class="flex h-screen flex-col border-r border-sidebar-border bg-sidebar-background text-sidebar-foreground transition-all duration-300 {collapsed
		? 'w-16'
		: 'w-64'}"
>
	<!-- Header -->
	<div class="flex items-center justify-between p-4">
		{#if !collapsed}
			<a href="/" class="flex items-center gap-2">
				<Flag class="h-6 w-6 text-primary" />
				<span class="text-lg font-bold">Oracula</span>
			</a>
		{:else}
			<a href="/" class="mx-auto">
				<Flag class="h-6 w-6 text-primary" />
			</a>
		{/if}
	</div>

	<Separator />

	<!-- Navigation -->
	<nav class="flex-1 space-y-1 p-2">
		{#each navItems as item}
			{@const Icon = item.icon}
			<a
				href={item.href}
				class="flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors {isActive(
					item.href,
					$page.url.pathname
				)
					? 'bg-sidebar-primary text-sidebar-primary-foreground font-medium'
					: 'text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground'} {collapsed ? 'justify-center' : ''}"
			>
				<Icon class="h-5 w-5 shrink-0" />
				{#if !collapsed}
					<span>{item.label}</span>
				{/if}
			</a>
		{/each}
		<!-- Claim Profile link (only when signed in) -->
		{#if session?.user}
			<a
				href="/claim"
				class="flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors {isActive(
					'/claim',
					$page.url.pathname
				)
					? 'bg-sidebar-primary text-sidebar-primary-foreground font-medium'
					: 'text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground'} {collapsed ? 'justify-center' : ''}"
			>
				<UserCheck class="h-5 w-5 shrink-0" />
				{#if !collapsed}
					<span>Claim Profile</span>
				{/if}
			</a>
		{/if}
	</nav>

	<Separator />

	<!-- Account Section -->
	<div class="p-2">
		{#if session?.user}
			<div
				class="flex items-center gap-3 rounded-lg px-3 py-2 {collapsed ? 'justify-center' : ''}"
			>
				<Avatar
					src={session.user.image}
					fallback={session.user.name || 'U'}
					class="h-8 w-8"
				/>
				{#if !collapsed}
					<div class="flex-1 overflow-hidden">
						<p class="truncate text-sm font-medium">{session.user.name}</p>
						<p class="truncate text-xs text-muted-foreground">{session.user.email || ''}</p>
					</div>
				{/if}
			</div>
			<button
				onclick={() => signOut({ callbackUrl: '/' })}
				class="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground transition-colors {collapsed
					? 'justify-center'
					: ''}"
			>
				<LogOut class="h-5 w-5 shrink-0" />
				{#if !collapsed}
					<span>Sign Out</span>
				{/if}
			</button>
		{:else}
			<a
				href="/auth/signin"
				class="flex items-center gap-3 rounded-lg px-3 py-2 text-sm text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground transition-colors {collapsed
					? 'justify-center'
					: ''}"
			>
				<LogIn class="h-5 w-5 shrink-0" />
				{#if !collapsed}
					<span>Sign In</span>
				{/if}
			</a>
		{/if}
	</div>

	<!-- Theme + Toggle -->
	<div class="border-t border-sidebar-border p-2">
		<div class="flex items-center {collapsed ? 'justify-center' : 'justify-between px-2'}">
			<ThemeToggle />
			<button
				onclick={() => (collapsed = !collapsed)}
				class="flex items-center rounded-lg px-2 py-2 text-sm text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground transition-colors"
			>
				{#if collapsed}
					<ChevronRight class="h-5 w-5" />
				{:else}
					<ChevronLeft class="h-5 w-5" />
					<span class="ml-1">Collapse</span>
				{/if}
			</button>
		</div>
	</div>
</aside>
