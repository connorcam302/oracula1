<script lang="ts">
    import { page } from "$app/stores";
    import { signIn, signOut } from "@auth/sveltekit/client";
    import { Avatar } from "$lib/components/ui/avatar";
    import { Button } from "$lib/components/ui/button";
    import { Separator } from "$lib/components/ui/separator";
    import ThemeToggle from "$lib/components/theme-toggle.svelte";
    import {
        Home,
        Trophy,
        BarChart3,
        User,
        LogIn,
        LogOut,
        ChevronLeft,
        ChevronRight,
        ChevronDown,
        UserCheck,
        Plus,
        Users,
        TrendingUp,
        Flag,
        CircleDot,
    } from "lucide-svelte";

    interface SidebarSeason {
        id: number;
        name: string;
        year: number;
        completedRaces: number;
        totalRaces: number;
    }

    interface Props {
        collapsed?: boolean;
        session?: any;
        seasons?: SidebarSeason[];
        hasClaimedProfile?: boolean;
    }

    let {
        collapsed = $bindable(false),
        session,
        seasons = [],
        hasClaimedProfile = false,
    }: Props = $props();

    // ── Collapsible section state ──────────────────────────
    let seasonsOpen = $state(true);
    let statsOpen = $state(true);
    const navItems = [
        { href: "/", label: "Home", icon: Home },
        { href: "/seasons", label: "Seasons", icon: Trophy },
        { href: "/races", label: "Races", icon: Flag },
        { href: "/stats", label: "Stats", icon: BarChart3 },
        { href: "/profile", label: "Profile", icon: User },
    ];

    function isActive(href: string, pathname: string) {
        if (href === "/") return pathname === "/";
        return pathname === href;
    }

    function isActivePrefix(href: string, pathname: string) {
        return pathname.startsWith(href);
    }

    // Determine if a season is currently in progress
    function seasonStatus(s: SidebarSeason): "complete" | "active" | "empty" {
        if (s.totalRaces > 0 && s.completedRaces === s.totalRaces)
            return "complete";
        if (s.completedRaces > 0) return "active";
        return "empty";
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
            <a href="/" class="flex items-center gap-2 group">
                <span
                    class="font-display text-xl font-bold tracking-tight uppercase leading-none"
                >
                    Oracula<span class="text-primary">1</span>
                </span>
            </a>
        {:else}
            <a href="/" class="mx-auto relative group">
                <span
                    class="font-display text-base font-bold text-primary leading-none"
                    >O1</span
                >
                <span
                    class="absolute -top-0.5 -right-0.5 h-2 w-2 rounded-full bg-gold ring-2 ring-sidebar-background"
                ></span>
            </a>
        {/if}
    </div>

    <Separator />

    <!-- Navigation -->
    <nav class="flex-1 overflow-y-auto overflow-x-hidden py-2 px-2 space-y-0.5">
        <!-- Home -->
        <a
            href="/"
            class="flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium tracking-wide transition-colors {isActive(
                '/',
                $page.url.pathname,
            )
                ? 'bg-sidebar-primary text-sidebar-primary-foreground'
                : 'text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground'} {collapsed
                ? 'justify-center'
                : ''}"
        >
            <Home class="h-4 w-4 shrink-0" />
            {#if !collapsed}
                <span>Home</span>
            {/if}
        </a>

        <!-- ── Races ────────────────────────────────────────── -->
        <a
            href="/races"
            class="flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium tracking-wide transition-colors {isActivePrefix(
                '/races',
                $page.url.pathname,
            )
                ? 'bg-sidebar-primary text-sidebar-primary-foreground'
                : 'text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground'} {collapsed
                ? 'justify-center'
                : ''}"
        >
            <Flag class="h-4 w-4 shrink-0" />
            {#if !collapsed}
                <span>Races</span>
            {/if}
        </a>

        <!-- ── Seasons section ──────────────────────────────── -->
        {#if collapsed}
            <a
                href="/seasons"
                class="flex items-center justify-center rounded-lg px-3 py-2 text-sm font-medium tracking-wide transition-colors {isActivePrefix(
                    '/seasons',
                    $page.url.pathname,
                )
                    ? 'bg-sidebar-primary text-sidebar-primary-foreground'
                    : 'text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground'}"
            >
                <Trophy class="h-4 w-4 shrink-0" />
            </a>
        {:else}
            <!-- Section header -->
            <button
                onclick={() => (seasonsOpen = !seasonsOpen)}
                class="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium tracking-wide transition-colors {isActivePrefix(
                    '/seasons',
                    $page.url.pathname,
                ) && !seasonsOpen
                    ? 'text-sidebar-primary'
                    : 'text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground'}"
            >
                <Trophy class="h-4 w-4 shrink-0" />
                <span class="flex-1 text-left">Seasons</span>
                <ChevronDown
                    class="h-3.5 w-3.5 shrink-0 transition-transform duration-200 {seasonsOpen
                        ? ''
                        : '-rotate-90'}"
                />
            </button>

            <!-- Season sub-links -->
            {#if seasonsOpen}
                <div
                    class="ml-4 border-l border-sidebar-border pl-2 space-y-0.5"
                >
                    <!-- All Seasons link -->
                    <a
                        href="/seasons"
                        class="flex items-center gap-2.5 rounded-md px-2.5 py-1.5 text-xs font-medium transition-colors {isActive(
                            '/seasons',
                            $page.url.pathname,
                        )
                            ? 'bg-sidebar-accent text-sidebar-accent-foreground'
                            : 'text-muted-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground'}"
                    >
                        <Flag class="h-3 w-3 shrink-0" />
                        <span>All Seasons</span>
                    </a>

                    <!-- Individual seasons -->
                    {#each seasons as season}
                        {@const status = seasonStatus(season)}
                        {@const isSeasonActive = $page.url.pathname.startsWith(
                            `/seasons/${season.id}`,
                        )}
                        <a
                            href="/seasons/{season.id}"
                            class="group flex items-center gap-2.5 rounded-md px-2.5 py-1.5 text-xs font-medium transition-colors {isSeasonActive
                                ? 'bg-sidebar-accent text-sidebar-accent-foreground'
                                : 'text-muted-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground'}"
                        >
                            <CircleDot
                                class="h-3 w-3 shrink-0 {status === 'complete'
                                    ? 'text-gold'
                                    : status === 'active'
                                      ? 'text-blue'
                                      : 'text-muted-foreground/50'}"
                            />
                            <span class="flex-1 truncate">{season.name}</span>
                            <span
                                class="font-display text-[10px] tabular-nums text-muted-foreground/60"
                            >
                                {season.completedRaces}/{season.totalRaces}
                            </span>
                        </a>
                    {/each}

                    <!-- New Season link -->
                    <a
                        href="/seasons/create"
                        class="flex items-center gap-2.5 rounded-md px-2.5 py-1.5 text-xs font-medium transition-colors {isActive(
                            '/seasons/create',
                            $page.url.pathname,
                        )
                            ? 'bg-sidebar-accent text-sidebar-accent-foreground'
                            : 'text-muted-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground'}"
                    >
                        <Plus class="h-3 w-3 shrink-0" />
                        <span>New Season</span>
                    </a>
                </div>
            {/if}
        {/if}

        <!-- ── Stats section ────────────────────────────────── -->
        {#if collapsed}
            <a
                href="/stats"
                class="flex items-center justify-center rounded-lg px-3 py-2 text-sm font-medium tracking-wide transition-colors {isActivePrefix(
                    '/stats',
                    $page.url.pathname,
                )
                    ? 'bg-sidebar-primary text-sidebar-primary-foreground'
                    : 'text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground'}"
            >
                <BarChart3 class="h-4 w-4 shrink-0" />
            </a>
        {:else}
            <button
                onclick={() => (statsOpen = !statsOpen)}
                class="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium tracking-wide transition-colors {isActivePrefix(
                    '/stats',
                    $page.url.pathname,
                ) && !statsOpen
                    ? 'text-sidebar-primary'
                    : 'text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground'}"
            >
                <BarChart3 class="h-4 w-4 shrink-0" />
                <span class="flex-1 text-left">Stats</span>
                <ChevronDown
                    class="h-3.5 w-3.5 shrink-0 transition-transform duration-200 {statsOpen
                        ? ''
                        : '-rotate-90'}"
                />
            </button>

            {#if statsOpen}
                <div
                    class="ml-4 border-l border-sidebar-border pl-2 space-y-0.5"
                >
                    <a
                        href="/stats"
                        class="flex items-center gap-2.5 rounded-md px-2.5 py-1.5 text-xs font-medium transition-colors {isActive(
                            '/stats',
                            $page.url.pathname,
                        ) && !$page.url.searchParams.has('season')
                            ? 'bg-sidebar-accent text-sidebar-accent-foreground'
                            : 'text-muted-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground'}"
                    >
                        <TrendingUp class="h-3 w-3 shrink-0" />
                        <span>Drivers</span>
                    </a>
                    <a
                        href="/stats"
                        class="flex items-center gap-2.5 rounded-md px-2.5 py-1.5 text-xs font-medium transition-colors text-muted-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
                    >
                        <Users class="h-3 w-3 shrink-0" />
                        <span>Constructors</span>
                    </a>
                </div>
            {/if}
        {/if}

        <!-- Profile -->
        <a
            href="/profile"
            class="flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium tracking-wide transition-colors {isActivePrefix(
                '/profile',
                $page.url.pathname,
            )
                ? 'bg-sidebar-primary text-sidebar-primary-foreground'
                : 'text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground'} {collapsed
                ? 'justify-center'
                : ''}"
        >
            <User class="h-4 w-4 shrink-0" />
            {#if !collapsed}
                <span>Profile</span>
            {/if}
        </a>


    </nav>

    <Separator />

    <!-- Account Section -->
    <div class="p-2">
        {#if session?.user}
            <div
                class="flex items-center gap-3 rounded-lg px-3 py-2 {collapsed
                    ? 'justify-center'
                    : ''}"
            >
                <Avatar
                    src={session.user.image}
                    fallback={session.user.name || "U"}
                    class="h-8 w-8"
                />
                {#if !collapsed}
                    <div class="flex-1 overflow-hidden">
                        <p class="truncate text-sm font-medium">
                            {session.user.name}
                        </p>
                        <p class="truncate text-xs text-muted-foreground">
                            {session.user.email || ""}
                        </p>
                    </div>
                {/if}
            </div>
            <button
                onclick={() => signOut({ callbackUrl: "/" })}
                class="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium tracking-wide text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground transition-colors {collapsed
                    ? 'justify-center'
                    : ''}"
            >
                <LogOut class="h-4 w-4 shrink-0" />
                {#if !collapsed}
                    <span>Sign Out</span>
                {/if}
            </button>
        {:else}
            <a
                href="/auth/signin"
                class="flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium tracking-wide text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground transition-colors {collapsed
                    ? 'justify-center'
                    : ''}"
            >
                <LogIn class="h-4 w-4 shrink-0" />
                {#if !collapsed}
                    <span>Sign In</span>
                {/if}
            </a>
        {/if}
    </div>

    <!-- Theme + Toggle -->
    <div class="border-t border-sidebar-border p-2">
        <div
            class="flex items-center {collapsed
                ? 'justify-center'
                : 'justify-between px-2'}"
        >
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
