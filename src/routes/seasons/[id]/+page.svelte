<script lang="ts">
    import { invalidateAll } from "$app/navigation";
    import { createSvelteTable, FlexRender } from "$lib/components/ui/data-table";
    import { getCoreRowModel, getSortedRowModel } from "@tanstack/table-core";
    import type { SortingState } from "@tanstack/table-core";
    import * as Table from "$lib/components/ui/table";
    import {
        Card,
        CardContent,
        CardHeader,
        CardTitle,
    } from "$lib/components/ui/card";
    import {
        Dialog,
        DialogContent,
        DialogHeader,
        DialogTitle,
        DialogFooter,
    } from "$lib/components/ui/dialog";
    import { Button } from "$lib/components/ui/button";
    import { Badge } from "$lib/components/ui/badge";
    import { Avatar } from "$lib/components/ui/avatar";
    import {
        Tooltip,
        TooltipTrigger,
        TooltipContent,
    } from "$lib/components/ui/tooltip";
    import LineChart from "$lib/components/charts/line-chart.svelte";
    import BarChart from "$lib/components/charts/bar-chart.svelte";
    import RacesTable from "./races-table.svelte";
    import { countryToFlag } from "$lib/utils";
    import {
        ArrowLeft,
        Plus,
        ChevronLeft,
        ChevronRight,
        Users,
        UserPlus,
        Trophy,
        TrendingUp,
        X,
        Flag,
        BarChart2,
    } from "lucide-svelte";

    let { data } = $props();

    type Tab = "home" | "standings" | "races" | "stats";
    let activeTab = $state<Tab>("home");

    const DRIVER_COLORS = [
        "#E10600", "#1E90FF", "#F5C518", "#27F4D2", "#FF8700",
        "#229971", "#FF87BC", "#6692FF", "#DC143C", "#B5C0C8",
        "#7CDB8A", "#FFA07A",
    ];

    // ── Derived chart data ──────────────────────────────────
    const cumulativeData = $derived(
        (() => {
            if (!data.pointsPerRace.length) return { labels: [], datasets: [] };
            const labels = data.pointsPerRace.map((r: any) => `R${r.round}`);
            const driverMap = new Map<string, { username: string; points: number[] }>();
            for (let i = 0; i < data.pointsPerRace.length; i++) {
                for (const result of data.pointsPerRace[i].results) {
                    if (!driverMap.has(result.userId)) {
                        driverMap.set(result.userId, {
                            username: result.username,
                            points: new Array(data.pointsPerRace.length).fill(0),
                        });
                    }
                    driverMap.get(result.userId)!.points[i] = result.points;
                }
            }
            const datasets = Array.from(driverMap.values()).map((driver, idx) => {
                let sum = 0;
                return {
                    label: driver.username,
                    data: driver.points.map((p) => (sum += p)),
                    borderColor: DRIVER_COLORS[idx % DRIVER_COLORS.length],
                    backgroundColor: DRIVER_COLORS[idx % DRIVER_COLORS.length] + "20",
                };
            });
            datasets.sort((a, b) => (b.data.at(-1) || 0) - (a.data.at(-1) || 0));
            return { labels, datasets };
        })()
    );

    const pointsBarData = $derived(
        (() => {
            if (!data.pointsPerRace.length) return { labels: [], datasets: [] };
            return {
                labels: data.pointsPerRace.map((r: any) => `R${r.round}`),
                datasets: data.driverStandings.map((driver: any, idx: number) => ({
                    label: driver.username,
                    data: data.pointsPerRace.map((race: any) => {
                        const r = race.results.find((x: any) => x.userId === driver.userId);
                        return r?.points ?? 0;
                    }),
                    backgroundColor: DRIVER_COLORS[idx % DRIVER_COLORS.length] + "cc",
                    borderColor: DRIVER_COLORS[idx % DRIVER_COLORS.length],
                    borderWidth: 1,
                })),
            };
        })()
    );

    // ── Race list with podium data ──────────────────────────
    const raceList = $derived(
        data.races.map((race: any) => {
            const raceData = data.pointsPerRace.find((p: any) => p.round === race.roundNumber);
            const results: any[] = raceData?.results ?? [];
            const finished = results
                .filter((r: any) => !r.dnf && r.position != null)
                .sort((a: any, b: any) => a.position - b.position);
            const podium = finished.slice(0, 3);
            const userResult = results.find((r: any) => r.userId === data.currentUserId);
            return { ...race, podium, userResult, allResults: results };
        })
    );

    const latestRace = $derived(
        (() => {
            const completed = raceList.filter((r: any) => r.isCompleted);
            return completed.at(-1) ?? null;
        })()
    );

    // ── Driver stats (avg position) ─────────────────────────
    const driverStats = $derived(
        data.driverStandings.map((driver: any) => {
            const positions = data.pointsPerRace
                .flatMap((r: any) => r.results)
                .filter((r: any) => r.userId === driver.userId && !r.dnf && r.position != null)
                .map((r: any) => r.position as number);
            const avg = positions.length
                ? (positions.reduce((s: number, p: number) => s + p, 0) / positions.length).toFixed(1)
                : "–";
            return { ...driver, avgPosition: avg };
        })
    );

    // ── Stats derived ───────────────────────────────────────
    const completedCount = $derived(data.races.filter((r: any) => r.isCompleted).length);
    const statsLeader = $derived(driverStats[0] ?? null);
    const winLeader = $derived([...driverStats].sort((a: any, b: any) => b.wins - a.wins)[0] ?? null);
    const podiumLeader = $derived([...driverStats].sort((a: any, b: any) => b.podiums - a.podiums)[0] ?? null);

    // ── Driver stats table ──────────────────────────────────
    let statsSorting = $state<SortingState>([{ id: "pts", desc: true }]);

    const statsColumns = [
        {
            id: "driver",
            header: "Driver",
            accessorFn: (row: any) => row.username,
            enableSorting: false,
        },
        {
            id: "pts",
            header: "Pts",
            accessorFn: (row: any) => row.totalPoints,
            sortDescFirst: true,
        },
        {
            id: "races",
            header: "Races",
            accessorFn: (row: any) => row.totalRaces,
            sortDescFirst: true,
        },
        {
            id: "wins",
            header: "Wins",
            accessorFn: (row: any) => row.wins,
            sortDescFirst: true,
        },
        {
            id: "pod",
            header: "Pod",
            accessorFn: (row: any) => row.podiums,
            sortDescFirst: true,
        },
        {
            id: "dnfs",
            header: "DNFs",
            accessorFn: (row: any) => row.dnfs || 0,
            sortDescFirst: true,
        },
        {
            id: "avg",
            header: "Avg Pos",
            accessorFn: (row: any) => (row.avgPosition === "–" ? Infinity : parseFloat(row.avgPosition)),
            sortDescFirst: false,
        },
    ];

    const statsTable = createSvelteTable({
        get data() { return driverStats; },
        get columns() { return statsColumns as any; },
        state: {
            get sorting() { return statsSorting; },
        },
        onSortingChange: (updater: any) => {
            statsSorting = typeof updater === "function" ? updater(statsSorting) : updater;
        },
        getCoreRowModel: getCoreRowModel(),
        getSortedRowModel: getSortedRowModel(),
    });

    // ── Stats view toggle ───────────────────────────────────
    let statsView = $state<"drivers" | "constructors">("drivers");

    const constructorStats = $derived(
        (data.constructorStandings as any[]).map((t: any) => ({
            ...t,
            totalPoints: Number(t.totalPoints) || 0,
            totalRaces: Number(t.totalRaces) || 0,
            wins: Number(t.wins) || 0,
            podiums: Number(t.podiums) || 0,
            dnfs: Number(t.dnfs) || 0,
        }))
    );

    const constructorLeader = $derived(constructorStats[0] ?? null);
    const constructorWinLeader = $derived([...constructorStats].sort((a, b) => b.wins - a.wins)[0] ?? null);
    const constructorPodiumLeader = $derived([...constructorStats].sort((a, b) => b.podiums - a.podiums)[0] ?? null);

    let constructorSorting = $state<SortingState>([{ id: "pts", desc: true }]);

    const constructorColumns = [
        {
            id: "constructor",
            header: "Constructor",
            accessorFn: (row: any) => row.teamName,
            enableSorting: false,
        },
        {
            id: "pts",
            header: "Pts",
            accessorFn: (row: any) => row.totalPoints,
            sortDescFirst: true,
        },
        {
            id: "races",
            header: "Races",
            accessorFn: (row: any) => row.totalRaces,
            sortDescFirst: true,
        },
        {
            id: "wins",
            header: "Wins",
            accessorFn: (row: any) => row.wins,
            sortDescFirst: true,
        },
        {
            id: "pod",
            header: "Pod",
            accessorFn: (row: any) => row.podiums,
            sortDescFirst: true,
        },
        {
            id: "dnfs",
            header: "DNFs",
            accessorFn: (row: any) => row.dnfs,
            sortDescFirst: true,
        },
    ];

    const constructorTable = createSvelteTable({
        get data() { return constructorStats; },
        get columns() { return constructorColumns as any; },
        state: {
            get sorting() { return constructorSorting; },
        },
        onSortingChange: (updater: any) => {
            constructorSorting = typeof updater === "function" ? updater(constructorSorting) : updater;
        },
        getCoreRowModel: getCoreRowModel(),
        getSortedRowModel: getSortedRowModel(),
    });

    // ── Standings toggle ────────────────────────────────────
    let standingsView = $state<"drivers" | "constructors">("drivers");

    // ── Race management ─────────────────────────────────────
    let showAddRace = $state(false);
    let showAddTeamMember = $state(false);
    let selectedTrack = $state("");
    let roundNumber = $derived(data.races.length + 1);
    let scheduledDate = $state("");
    let addingRace = $state(false);
    let selectedUser = $state("");
    let selectedTeam = $state("");
    let addingMember = $state(false);

    async function addRace() {
        if (!selectedTrack) return;
        addingRace = true;
        try {
            const res = await fetch(`/api/seasons/${data.season.id}/races`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    trackId: parseInt(selectedTrack),
                    roundNumber,
                    scheduledDate: scheduledDate || null,
                }),
            });
            if (res.ok) {
                showAddRace = false;
                selectedTrack = "";
                scheduledDate = "";
                await invalidateAll();
                roundNumber = data.races.length + 1;
            }
        } finally {
            addingRace = false;
        }
    }

    async function addTeamMember() {
        if (!selectedUser || !selectedTeam) return;
        addingMember = true;
        try {
            const res = await fetch(`/api/seasons/${data.season.id}/races`, {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    action: "addTeamMember",
                    userId: selectedUser,
                    teamId: parseInt(selectedTeam),
                }),
            });
            if (res.ok) {
                showAddTeamMember = false;
                selectedUser = "";
                selectedTeam = "";
                await invalidateAll();
            }
        } finally {
            addingMember = false;
        }
    }

    async function removeTeamMember(userId: string) {
        const res = await fetch(`/api/seasons/${data.season.id}/races`, {
            method: "DELETE",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ userId }),
        });
        if (res.ok) await invalidateAll();
    }

    const tabs: { id: Tab; label: string }[] = [
        { id: "home", label: "Home" },
        { id: "standings", label: "Standings" },
        { id: "races", label: "Races" },
        { id: "stats", label: "Stats" },
    ];

    function podiumBg(pos: number) {
        if (pos === 1) return "bg-gold text-gold-foreground";
        if (pos === 2) return "bg-[#B5C0C8] text-[#1a1a1a]";
        if (pos === 3) return "bg-amber-700 text-white";
        return "bg-muted text-muted-foreground";
    }
</script>

<div class="p-6">
    <!-- Header -->
    <div class="flex items-center gap-4 pb-6">
        <a href="/seasons">
            <Button variant="ghost" size="icon">
                <ArrowLeft class="h-5 w-5" />
            </Button>
        </a>
        <div>
            <h1 class="font-display text-3xl font-bold tracking-tight leading-none text-foreground">
                {data.season.name}
            </h1>
            <p class="text-xs text-muted-foreground mt-2 uppercase tracking-widest font-medium">
                {data.season.year} Season
            </p>
        </div>
    </div>

    <!-- Subnav -->
    <div class="border-b border-border mb-6">
        <nav class="flex -mb-px">
            {#each tabs as tab}
                <button
                    onclick={() => (activeTab = tab.id)}
                    class="px-4 py-2.5 text-sm font-medium border-b-2 transition-colors {activeTab === tab.id
                        ? 'border-primary text-foreground'
                        : 'border-transparent text-muted-foreground hover:text-foreground hover:border-border'}"
                >
                    {tab.label}
                </button>
            {/each}
        </nav>
    </div>

    <!-- ── HOME ───────────────────────────────────────────── -->
    {#if activeTab === "home"}
        <div class="space-y-6">
            <!-- Races grid table -->
            <Card>
                <CardHeader>
                    <CardTitle>Races</CardTitle>
                </CardHeader>
                <CardContent>
                    <RacesTable
                        races={data.races}
                        pointsPerRace={data.pointsPerRace}
                        driverStandings={data.driverStandings}
                        seasonId={data.season.id}
                    />
                </CardContent>
            </Card>

            <div class="grid grid-cols-1 gap-6 lg:grid-cols-3">
                <!-- Latest race -->
                {#if latestRace}
                    <Card>
                        <CardHeader>
                            <CardTitle class="text-base">Latest Race</CardTitle>
                        </CardHeader>
                        <CardContent class="space-y-3">
                            <a
                                href="/seasons/{data.season.id}/races/{latestRace.id}"
                                class="flex items-center gap-2 hover:text-primary transition-colors"
                            >
                                <span class="text-lg">{countryToFlag(latestRace.trackCountry)}</span>
                                <span class="font-medium text-sm">{latestRace.trackName}</span>
                                <span class="text-xs text-muted-foreground ml-auto">R{latestRace.roundNumber}</span>
                            </a>
                            {#if latestRace.podium.length > 0}
                                {@const dnfs = latestRace.allResults.filter((r: any) => r.dnf)}
                                <div class="space-y-1.5">
                                    {#each latestRace.podium as finisher, i}
                                        {@const isUser = finisher.userId === data.currentUserId}
                                        <div class="flex items-center gap-2 rounded-md p-1.5 {isUser ? 'ring-1 ring-blue/30 bg-blue/5' : ''}">
                                            <span class="flex h-5 w-5 shrink-0 items-center justify-center rounded text-xs font-bold {podiumBg(finisher.position)}">
                                                {finisher.position}
                                            </span>
                                            <span class="text-sm truncate {isUser ? 'font-semibold' : ''}">{finisher.username}</span>
                                            <span class="text-xs text-muted-foreground tabular-nums ml-auto">{finisher.points} pts</span>
                                        </div>
                                    {/each}
                                    {#if latestRace.userResult && !latestRace.userResult.dnf && latestRace.userResult.position && latestRace.userResult.position > 3}
                                        <div class="flex items-center gap-2 rounded-md p-1.5 ring-1 ring-blue/30 bg-blue/5">
                                            <span class="flex h-5 w-5 shrink-0 items-center justify-center rounded text-xs font-bold bg-muted text-muted-foreground">
                                                {latestRace.userResult.position}
                                            </span>
                                            <span class="text-sm font-semibold">You</span>
                                            <span class="text-xs text-muted-foreground tabular-nums ml-auto">{latestRace.userResult.points} pts</span>
                                        </div>
                                    {/if}
                                    {#if dnfs.length > 0}
                                        <div class="pt-0.5 space-y-1.5">
                                            {#each dnfs as dnf}
                                                {@const isUser = dnf.userId === data.currentUserId}
                                                <div class="flex items-center gap-2 rounded-md p-1.5 {isUser ? 'ring-1 ring-blue/30 bg-blue/5' : ''}">
                                                    <span class="flex h-5 w-5 shrink-0 items-center justify-center rounded text-[10px] font-bold bg-destructive/15 text-destructive">✕</span>
                                                    <span class="text-sm truncate text-muted-foreground {isUser ? 'font-semibold text-foreground' : ''}">{dnf.username}</span>
                                                    <span class="text-xs text-destructive/70 ml-auto">DNF</span>
                                                </div>
                                            {/each}
                                        </div>
                                    {/if}
                                </div>
                            {:else}
                                <p class="text-xs text-muted-foreground">No results recorded</p>
                            {/if}
                        </CardContent>
                    </Card>
                {/if}

                <!-- Standings -->
                <Card class={latestRace ? "" : "lg:col-span-2"}>
                    <CardHeader>
                        <div class="flex items-center justify-between">
                            <div class="flex items-center gap-2">
                                <Trophy class="h-4 w-4 text-gold" />
                                <CardTitle class="text-base">Standings</CardTitle>
                            </div>
                            <div class="flex rounded-md border border-border overflow-hidden text-xs">
                                <button
                                    onclick={() => (standingsView = "drivers")}
                                    class="px-2 py-1 transition-colors {standingsView === 'drivers' ? 'bg-muted font-medium' : 'text-muted-foreground hover:text-foreground'}"
                                >Drivers</button>
                                <button
                                    onclick={() => (standingsView = "constructors")}
                                    class="px-2 py-1 transition-colors {standingsView === 'constructors' ? 'bg-muted font-medium' : 'text-muted-foreground hover:text-foreground'}"
                                >Constructors</button>
                            </div>
                        </div>
                    </CardHeader>
                    <CardContent>
                        {#if standingsView === "drivers"}
                            {#if data.driverStandings.length > 0}
                                <div class="space-y-1">
                                    {#each data.driverStandings as driver, i}
                                        <a href="/profile/{driver.userId}" class="flex items-center gap-2 rounded-lg p-1.5 hover:bg-accent transition-colors">
                                            <span class="flex h-5 w-5 shrink-0 items-center justify-center rounded text-xs font-bold {podiumBg(i + 1)}">{i + 1}</span>
                                            {#if driver.teamColor}
                                                <div class="h-2.5 w-2.5 rounded-full shrink-0" style="background-color: {driver.teamColor}"></div>
                                            {/if}
                                            <span class="flex-1 text-sm truncate">{driver.username}</span>
                                            <span class="font-display text-sm font-bold tabular-nums">{driver.totalPoints}</span>
                                        </a>
                                    {/each}
                                </div>
                            {:else}
                                <p class="text-xs text-muted-foreground text-center py-4">No races completed yet</p>
                            {/if}
                        {:else}
                            {#if data.constructorStandings.length > 0}
                                <div class="space-y-1">
                                    {#each data.constructorStandings as c, i}
                                        <div class="flex items-center gap-2 rounded-lg p-1.5">
                                            <span class="flex h-5 w-5 shrink-0 items-center justify-center rounded text-xs font-bold {podiumBg(i + 1)}">{i + 1}</span>
                                            <div class="h-2.5 w-2.5 rounded-full shrink-0" style="background-color: {c.teamColor}"></div>
                                            <span class="flex-1 text-sm truncate">{c.teamName}</span>
                                            <span class="font-display text-sm font-bold tabular-nums">{c.totalPoints}</span>
                                        </div>
                                    {/each}
                                </div>
                            {:else}
                                <p class="text-xs text-muted-foreground text-center py-4">No races completed yet</p>
                            {/if}
                        {/if}
                    </CardContent>
                </Card>

                <!-- Teams -->
                <Card>
                    <CardHeader>
                        <div class="flex items-center justify-between">
                            <CardTitle class="text-base">Teams</CardTitle>
                            <Button size="sm" variant="ghost" onclick={() => (showAddTeamMember = true)}>
                                <UserPlus class="h-4 w-4" />
                            </Button>
                        </div>
                    </CardHeader>
                    <CardContent>
                        {@const teamGroups = data.teamMembers.reduce(
                            (acc: Record<string, typeof data.teamMembers>, m: any) => {
                                if (!acc[m.teamName]) acc[m.teamName] = [];
                                acc[m.teamName].push(m);
                                return acc;
                            }, {}
                        )}
                        <div class="space-y-3">
                            {#each Object.entries(teamGroups) as [teamName, members]}
                                {@const membersList = members as any[]}
                                <div>
                                    <div class="flex items-center gap-2 mb-1">
                                        <div class="h-2.5 w-2.5 rounded-full" style="background-color: {membersList[0].teamColor}"></div>
                                        <span class="text-sm font-medium">{teamName}</span>
                                    </div>
                                    <div class="ml-4 space-y-1">
                                        {#each membersList as member}
                                            <div class="flex items-center gap-2">
                                                <Avatar src={member.avatarUrl} fallback={member.username} class="h-5 w-5" />
                                                <span class="text-xs text-muted-foreground flex-1 truncate">{member.username}</span>
                                                {#if data.currentUserId === member.userId}
                                                    <button onclick={() => removeTeamMember(member.userId)} class="text-muted-foreground hover:text-destructive transition-colors">
                                                        <X class="h-3 w-3" />
                                                    </button>
                                                {/if}
                                            </div>
                                        {/each}
                                    </div>
                                </div>
                            {/each}
                            {#if data.teamMembers.length === 0}
                                <div class="text-center py-4">
                                    <Users class="h-5 w-5 text-muted-foreground mx-auto mb-1" />
                                    <p class="text-xs text-muted-foreground">No team assignments yet</p>
                                </div>
                            {/if}
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>

        <!-- Add Team Member Dialog -->
        <Dialog bind:open={showAddTeamMember}>
            <DialogContent class="sm:max-w-sm">
                <DialogHeader>
                    <DialogTitle>Assign to Team</DialogTitle>
                </DialogHeader>
                <div class="space-y-4 py-2">
                    <div>
                        <label for="team-user" class="block text-sm font-medium mb-1.5">User</label>
                        <select id="team-user" bind:value={selectedUser} class="w-full rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground">
                            <option value="">Select user...</option>
                            {#each data.allUsers as user}
                                <option value={user.id}>{user.username}</option>
                            {/each}
                        </select>
                    </div>
                    <div>
                        <label for="team-select" class="block text-sm font-medium mb-1.5">Team</label>
                        <select id="team-select" bind:value={selectedTeam} class="w-full rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground">
                            <option value="">Select team...</option>
                            {#each data.allTeams as team}
                                <option value={team.id}>{team.name}</option>
                            {/each}
                        </select>
                    </div>
                </div>
                <DialogFooter>
                    <Button variant="ghost" onclick={() => (showAddTeamMember = false)}>Cancel</Button>
                    <Button onclick={addTeamMember} disabled={addingMember || !selectedUser || !selectedTeam}>
                        {addingMember ? "Assigning..." : "Assign"}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>

    <!-- ── STANDINGS ──────────────────────────────────────── -->
    {:else if activeTab === "standings"}
        <div class="grid grid-cols-1 gap-6 lg:grid-cols-2">
            <!-- Drivers -->
            <Card>
                <CardHeader>
                    <div class="flex items-center gap-2">
                        <Trophy class="h-5 w-5 text-gold" />
                        <CardTitle>Driver Standings</CardTitle>
                    </div>
                </CardHeader>
                <CardContent>
                    {#if data.driverStandings.length > 0}
                        <div class="space-y-1">
                            {#each driverStats as driver, i}
                                <a
                                    href="/profile/{driver.userId}"
                                    class="flex items-center gap-3 rounded-lg p-2 hover:bg-accent transition-colors {i === 0 ? 'bg-gold/5' : ''}"
                                >
                                    <span class="flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-bold {podiumBg(i + 1)}">{i + 1}</span>
                                    {#if driver.teamColor}
                                        <div class="h-3 w-3 rounded-full shrink-0" style="background-color: {driver.teamColor}"></div>
                                    {/if}
                                    <div class="flex-1 min-w-0">
                                        <p class="font-medium text-sm truncate">{driver.username}</p>
                                        {#if driver.teamName}
                                            <p class="text-xs text-muted-foreground">{driver.teamName}</p>
                                        {/if}
                                    </div>
                                    <div class="text-right shrink-0 space-y-0.5">
                                        <p class="font-display font-bold tabular-nums text-sm">{driver.totalPoints} pts</p>
                                        <p class="text-xs text-muted-foreground tabular-nums">
                                            {driver.wins}W · {driver.podiums} Pod · avg {driver.avgPosition}
                                        </p>
                                    </div>
                                </a>
                            {/each}
                        </div>
                    {:else}
                        <div class="text-center py-8">
                            <Trophy class="h-8 w-8 text-gold/40 mx-auto mb-2" />
                            <p class="text-sm text-muted-foreground">No races completed yet</p>
                        </div>
                    {/if}
                </CardContent>
            </Card>

            <!-- Constructors -->
            <Card>
                <CardHeader>
                    <div class="flex items-center gap-2">
                        <Trophy class="h-5 w-5 text-gold" />
                        <CardTitle>Constructor Standings</CardTitle>
                    </div>
                </CardHeader>
                <CardContent>
                    {#if data.constructorStandings.length > 0}
                        <div class="space-y-1">
                            {#each data.constructorStandings as c, i}
                                <div class="flex items-center gap-3 rounded-lg p-2 {i === 0 ? 'bg-gold/5' : ''}">
                                    <span class="flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-bold {podiumBg(i + 1)}">{i + 1}</span>
                                    <div class="h-3 w-3 rounded-full shrink-0" style="background-color: {c.teamColor}"></div>
                                    <div class="flex-1 min-w-0">
                                        <p class="font-medium text-sm truncate">{c.teamName}</p>
                                    </div>
                                    <span class="font-display font-bold tabular-nums">{c.totalPoints} pts</span>
                                </div>
                            {/each}
                        </div>
                    {:else}
                        <div class="text-center py-8">
                            <Trophy class="h-8 w-8 text-gold/40 mx-auto mb-2" />
                            <p class="text-sm text-muted-foreground">No races completed yet</p>
                        </div>
                    {/if}
                </CardContent>
            </Card>
        </div>

    <!-- ── RACES ───────────────────────────────────────────── -->
    {:else if activeTab === "races"}
        <div class="space-y-6">
            <!-- Data table -->
            <Card>
                <CardHeader>
                    <div class="flex items-center justify-between">
                        <CardTitle>Races ({data.totalRaces})</CardTitle>
                        <Button size="sm" onclick={() => (showAddRace = true)}>
                            <Plus class="h-4 w-4 mr-1" />
                            Add Race
                        </Button>
                    </div>
                </CardHeader>
                <CardContent>
                    <RacesTable
                        races={data.races}
                        pointsPerRace={data.pointsPerRace}
                        driverStandings={data.driverStandings}
                        seasonId={data.season.id}
                    />
                    {#if data.totalPages > 1}
                        <div class="flex items-center justify-center gap-2 mt-4">
                            <a href="/seasons/{data.season.id}?page={Math.max(1, data.page - 1)}">
                                <Button variant="outline" size="sm" disabled={data.page === 1}><ChevronLeft class="h-4 w-4" /></Button>
                            </a>
                            <span class="text-sm text-muted-foreground">Page {data.page} of {data.totalPages}</span>
                            <a href="/seasons/{data.season.id}?page={Math.min(data.totalPages, data.page + 1)}">
                                <Button variant="outline" size="sm" disabled={data.page === data.totalPages}><ChevronRight class="h-4 w-4" /></Button>
                            </a>
                        </div>
                    {/if}
                </CardContent>
            </Card>

            <!-- Race-by-race list -->
            <Card>
                <CardHeader>
                    <CardTitle>Race Results</CardTitle>
                </CardHeader>
                <CardContent class="space-y-2">
                    {#each raceList as race}
                        {@const userOnPodium = race.userResult && race.userResult.position != null && race.userResult.position <= 3}
                        {@const allDnf = race.isCompleted && race.allResults.length > 0 && race.allResults.every((r: any) => r.dnf)}
                        <a
                            href="/seasons/{data.season.id}/races/{race.id}"
                            class="block rounded-lg border p-3 hover:bg-accent transition-colors {race.isCompleted ? 'border-success/20 bg-success/5 hover:bg-success/10' : 'border-border'} {userOnPodium ? 'ring-1 ring-blue/40' : ''}"
                        >
                            <div class="flex items-center gap-3 mb-2">
                                <span class="flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-bold bg-muted text-muted-foreground font-display">
                                    R{race.roundNumber}
                                </span>
                                <span class="text-sm font-medium flex-1">
                                    {countryToFlag(race.trackCountry)} {race.trackName}
                                </span>
                                {#if race.scheduledDate}
                                    <span class="text-xs text-muted-foreground">{race.scheduledDate}</span>
                                {/if}
                                {#if race.isCompleted}
                                    <Badge variant="success" class="text-xs shrink-0">Completed</Badge>
                                {:else}
                                    <Badge variant="outline" class="text-xs shrink-0">Upcoming</Badge>
                                {/if}
                            </div>
                            {#if allDnf}
                                <p class="text-xs text-destructive/80 font-medium">Everyone retired</p>
                            {:else if race.podium.length > 0}
                                <div class="flex items-center gap-2 flex-wrap">
                                    {#each race.podium as finisher, i}
                                        {@const isUser = finisher.userId === data.currentUserId}
                                        <div class="flex items-center gap-1.5 rounded px-2 py-0.5 {isUser ? 'ring-1 ring-blue/50' : ''}"
                                            style="background-color: {i === 0 ? 'rgb(var(--color-gold) / 0.15)' : i === 1 ? 'rgba(181,192,200,0.15)' : 'rgba(180,83,9,0.12)'}">
                                            <span class="flex h-4 w-4 items-center justify-center rounded text-[10px] font-bold {podiumBg(i + 1)}">{i + 1}</span>
                                            <span class="text-xs font-medium {isUser ? 'text-blue' : ''}">{finisher.username}</span>
                                        </div>
                                    {/each}
                                    {#if race.userResult && !userOnPodium}
                                        {#if race.userResult.dnf}
                                            <div class="flex items-center gap-1.5 rounded px-2 py-0.5 ring-1 ring-blue/50 bg-blue/5">
                                                <span class="text-xs font-medium text-destructive">DNF</span>
                                                <span class="text-xs text-muted-foreground">You</span>
                                            </div>
                                        {:else if race.userResult.position != null}
                                            <div class="flex items-center gap-1.5 rounded px-2 py-0.5 ring-1 ring-blue/50 bg-blue/5">
                                                <span class="flex h-4 w-4 items-center justify-center rounded text-[10px] font-bold bg-muted text-muted-foreground">{race.userResult.position}</span>
                                                <span class="text-xs font-medium">You</span>
                                            </div>
                                        {/if}
                                    {/if}
                                </div>
                            {/if}
                        </a>
                    {:else}
                        <div class="text-center py-8">
                            <Flag class="h-8 w-8 text-primary/40 mx-auto mb-2" />
                            <p class="text-sm text-muted-foreground">No races scheduled yet</p>
                        </div>
                    {/each}
                </CardContent>
            </Card>
        </div>

        <!-- Add Race Dialog -->
        <Dialog bind:open={showAddRace}>
            <DialogContent class="sm:max-w-md">
                <DialogHeader>
                    <DialogTitle>Add Race</DialogTitle>
                </DialogHeader>
                <div class="space-y-4 py-2">
                    <div>
                        <label for="race-track" class="block text-sm font-medium mb-1.5">Track</label>
                        <select id="race-track" bind:value={selectedTrack} class="w-full rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground">
                            <option value="">Select track...</option>
                            {#each data.tracks as track}
                                <option value={track.id}>{countryToFlag(track.country)} {track.name}</option>
                            {/each}
                        </select>
                    </div>
                    <div>
                        <label for="race-round" class="block text-sm font-medium mb-1.5">Round</label>
                        <input id="race-round" type="number" bind:value={roundNumber} min="1" class="w-full rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground" />
                    </div>
                    <div>
                        <label for="race-date" class="block text-sm font-medium mb-1.5">Date</label>
                        <input id="race-date" type="date" bind:value={scheduledDate} class="w-full rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground" />
                    </div>
                </div>
                <DialogFooter>
                    <Button variant="ghost" onclick={() => (showAddRace = false)}>Cancel</Button>
                    <Button onclick={addRace} disabled={addingRace || !selectedTrack}>
                        {addingRace ? "Adding..." : "Add Race"}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>

    <!-- ── STATS ───────────────────────────────────────────── -->
    {:else if activeTab === "stats"}
        {#if data.pointsPerRace.length > 0}
            <div class="space-y-6">
                <!-- Driver / Constructor toggle -->
                <div class="flex items-center justify-between">
                    <p class="text-xs uppercase tracking-widest font-medium text-muted-foreground">
                        {statsView === "drivers" ? "Driver" : "Constructor"} Statistics
                    </p>
                    <div class="flex rounded-md border border-border overflow-hidden text-xs">
                        <button
                            onclick={() => (statsView = "drivers")}
                            class="px-3 py-1.5 transition-colors {statsView === 'drivers' ? 'bg-muted font-medium' : 'text-muted-foreground hover:text-foreground'}"
                        >Drivers</button>
                        <button
                            onclick={() => (statsView = "constructors")}
                            class="px-3 py-1.5 transition-colors {statsView === 'constructors' ? 'bg-muted font-medium' : 'text-muted-foreground hover:text-foreground'}"
                        >Constructors</button>
                    </div>
                </div>

                <!-- Stat cards -->
                <div class="grid grid-cols-2 gap-4 sm:grid-cols-4">
                    <Card>
                        <CardContent class="pt-4">
                            <p class="text-xs uppercase tracking-widest text-muted-foreground mb-1">Races Done</p>
                            <p class="font-display text-3xl font-bold tabular-nums">{completedCount}</p>
                            <p class="text-xs text-muted-foreground">of {data.totalRaces}</p>
                        </CardContent>
                    </Card>
                    {#if statsView === "drivers"}
                        {#if statsLeader}
                            <Card>
                                <CardContent class="pt-4">
                                    <p class="text-xs uppercase tracking-widest text-muted-foreground mb-1">Leader</p>
                                    <p class="font-display text-xl font-bold truncate">{statsLeader.username}</p>
                                    <p class="text-xs text-muted-foreground tabular-nums">{statsLeader.totalPoints} pts</p>
                                </CardContent>
                            </Card>
                        {/if}
                        {#if winLeader}
                            <Card>
                                <CardContent class="pt-4">
                                    <p class="text-xs uppercase tracking-widest text-muted-foreground mb-1">Most Wins</p>
                                    <p class="font-display text-xl font-bold truncate">{winLeader.username}</p>
                                    <p class="text-xs text-muted-foreground tabular-nums">{winLeader.wins} wins</p>
                                </CardContent>
                            </Card>
                        {/if}
                        {#if podiumLeader}
                            <Card>
                                <CardContent class="pt-4">
                                    <p class="text-xs uppercase tracking-widest text-muted-foreground mb-1">Most Podiums</p>
                                    <p class="font-display text-xl font-bold truncate">{podiumLeader.username}</p>
                                    <p class="text-xs text-muted-foreground tabular-nums">{podiumLeader.podiums} podiums</p>
                                </CardContent>
                            </Card>
                        {/if}
                    {:else}
                        {#if constructorLeader}
                            <Card>
                                <CardContent class="pt-4">
                                    <p class="text-xs uppercase tracking-widest text-muted-foreground mb-1">Leader</p>
                                    <div class="flex items-center gap-1.5 mb-0.5">
                                        {#if constructorLeader.teamColor}
                                            <div class="h-3 w-0.5 rounded-full shrink-0" style="background-color: {constructorLeader.teamColor}"></div>
                                        {/if}
                                        <p class="font-display text-xl font-bold truncate">{constructorLeader.teamName}</p>
                                    </div>
                                    <p class="text-xs text-muted-foreground tabular-nums">{constructorLeader.totalPoints} pts</p>
                                </CardContent>
                            </Card>
                        {/if}
                        {#if constructorWinLeader}
                            <Card>
                                <CardContent class="pt-4">
                                    <p class="text-xs uppercase tracking-widest text-muted-foreground mb-1">Most Wins</p>
                                    <div class="flex items-center gap-1.5 mb-0.5">
                                        {#if constructorWinLeader.teamColor}
                                            <div class="h-3 w-0.5 rounded-full shrink-0" style="background-color: {constructorWinLeader.teamColor}"></div>
                                        {/if}
                                        <p class="font-display text-xl font-bold truncate">{constructorWinLeader.teamName}</p>
                                    </div>
                                    <p class="text-xs text-muted-foreground tabular-nums">{constructorWinLeader.wins} wins</p>
                                </CardContent>
                            </Card>
                        {/if}
                        {#if constructorPodiumLeader}
                            <Card>
                                <CardContent class="pt-4">
                                    <p class="text-xs uppercase tracking-widest text-muted-foreground mb-1">Most Podiums</p>
                                    <div class="flex items-center gap-1.5 mb-0.5">
                                        {#if constructorPodiumLeader.teamColor}
                                            <div class="h-3 w-0.5 rounded-full shrink-0" style="background-color: {constructorPodiumLeader.teamColor}"></div>
                                        {/if}
                                        <p class="font-display text-xl font-bold truncate">{constructorPodiumLeader.teamName}</p>
                                    </div>
                                    <p class="text-xs text-muted-foreground tabular-nums">{constructorPodiumLeader.podiums} podiums</p>
                                </CardContent>
                            </Card>
                        {/if}
                    {/if}
                </div>

                <!-- Championship Battle -->
                <Card>
                    <CardHeader>
                        <div class="flex items-center gap-2">
                            <TrendingUp class="h-5 w-5 text-blue" />
                            <CardTitle>Championship Battle</CardTitle>
                        </div>
                    </CardHeader>
                    <CardContent>
                        <LineChart labels={cumulativeData.labels} datasets={cumulativeData.datasets} />
                    </CardContent>
                </Card>

                <!-- Points per race -->
                <Card>
                    <CardHeader>
                        <CardTitle>Points per Race</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <BarChart labels={pointsBarData.labels} datasets={pointsBarData.datasets} />
                    </CardContent>
                </Card>

                <!-- Statistics table -->
                <Card>
                    <CardHeader>
                        <CardTitle>{statsView === "drivers" ? "Driver" : "Constructor"} Statistics</CardTitle>
                    </CardHeader>
                    <CardContent class="p-0">
                        <div class="overflow-x-auto">
                            {#if statsView === "drivers"}
                                <Table.Root>
                                    <Table.Header>
                                        {#each statsTable.getHeaderGroups() as headerGroup}
                                            <Table.Row>
                                                {#each headerGroup.headers as header}
                                                    {#if header.column.id === "driver"}
                                                        <Table.Head class="pl-4 pr-4 min-w-[140px]">Driver</Table.Head>
                                                    {:else}
                                                        <Table.Head
                                                            class="text-right px-3 cursor-pointer select-none hover:bg-muted/50 transition-colors tabular-nums"
                                                            onclick={header.column.getToggleSortingHandler()}
                                                        >
                                                            <div class="flex items-center justify-end gap-1">
                                                                {header.column.columnDef.header as string}
                                                                {#if header.column.getIsSorted() === "asc"}
                                                                    <span class="text-xs opacity-60">↑</span>
                                                                {:else if header.column.getIsSorted() === "desc"}
                                                                    <span class="text-xs opacity-60">↓</span>
                                                                {:else}
                                                                    <span class="text-xs opacity-20">↕</span>
                                                                {/if}
                                                            </div>
                                                        </Table.Head>
                                                    {/if}
                                                {/each}
                                            </Table.Row>
                                        {/each}
                                    </Table.Header>
                                    <Table.Body>
                                        {#each statsTable.getRowModel().rows as row}
                                            {@const driver = row.original as any}
                                            <Table.Row class="hover:bg-muted/30 transition-colors">
                                                <Table.Cell class="pl-4 pr-4 py-2.5">
                                                    <a href="/profile/{driver.userId}" class="flex items-center gap-2 hover:text-primary transition-colors">
                                                        {#if driver.teamColor}
                                                            <div class="h-3 w-0.5 rounded-full shrink-0" style="background-color: {driver.teamColor}"></div>
                                                        {/if}
                                                        <span class="font-medium text-sm">{driver.username}</span>
                                                    </a>
                                                </Table.Cell>
                                                <Table.Cell class="text-right px-3 py-2.5 tabular-nums font-bold text-sm">{driver.totalPoints}</Table.Cell>
                                                <Table.Cell class="text-right px-3 py-2.5 tabular-nums text-sm text-muted-foreground">{driver.totalRaces}</Table.Cell>
                                                <Table.Cell class="text-right px-3 py-2.5 tabular-nums text-sm">{driver.wins}</Table.Cell>
                                                <Table.Cell class="text-right px-3 py-2.5 tabular-nums text-sm">{driver.podiums}</Table.Cell>
                                                <Table.Cell class="text-right px-3 py-2.5 tabular-nums text-sm text-destructive">{driver.dnfs || 0}</Table.Cell>
                                                <Table.Cell class="text-right px-3 py-2.5 tabular-nums text-sm text-muted-foreground">{driver.avgPosition}</Table.Cell>
                                            </Table.Row>
                                        {/each}
                                    </Table.Body>
                                </Table.Root>
                            {:else}
                                <Table.Root>
                                    <Table.Header>
                                        {#each constructorTable.getHeaderGroups() as headerGroup}
                                            <Table.Row>
                                                {#each headerGroup.headers as header}
                                                    {#if header.column.id === "constructor"}
                                                        <Table.Head class="pl-4 pr-4 min-w-[140px]">Constructor</Table.Head>
                                                    {:else}
                                                        <Table.Head
                                                            class="text-right px-3 cursor-pointer select-none hover:bg-muted/50 transition-colors tabular-nums"
                                                            onclick={header.column.getToggleSortingHandler()}
                                                        >
                                                            <div class="flex items-center justify-end gap-1">
                                                                {header.column.columnDef.header as string}
                                                                {#if header.column.getIsSorted() === "asc"}
                                                                    <span class="text-xs opacity-60">↑</span>
                                                                {:else if header.column.getIsSorted() === "desc"}
                                                                    <span class="text-xs opacity-60">↓</span>
                                                                {:else}
                                                                    <span class="text-xs opacity-20">↕</span>
                                                                {/if}
                                                            </div>
                                                        </Table.Head>
                                                    {/if}
                                                {/each}
                                            </Table.Row>
                                        {/each}
                                    </Table.Header>
                                    <Table.Body>
                                        {#each constructorTable.getRowModel().rows as row}
                                            {@const team = row.original as any}
                                            <Table.Row class="hover:bg-muted/30 transition-colors">
                                                <Table.Cell class="pl-4 pr-4 py-2.5">
                                                    <div class="flex items-center gap-2">
                                                        {#if team.teamColor}
                                                            <div class="h-3 w-0.5 rounded-full shrink-0" style="background-color: {team.teamColor}"></div>
                                                        {/if}
                                                        <span class="font-medium text-sm">{team.teamName}</span>
                                                    </div>
                                                </Table.Cell>
                                                <Table.Cell class="text-right px-3 py-2.5 tabular-nums font-bold text-sm">{team.totalPoints}</Table.Cell>
                                                <Table.Cell class="text-right px-3 py-2.5 tabular-nums text-sm text-muted-foreground">{team.totalRaces}</Table.Cell>
                                                <Table.Cell class="text-right px-3 py-2.5 tabular-nums text-sm">{team.wins}</Table.Cell>
                                                <Table.Cell class="text-right px-3 py-2.5 tabular-nums text-sm">{team.podiums}</Table.Cell>
                                                <Table.Cell class="text-right px-3 py-2.5 tabular-nums text-sm text-destructive">{team.dnfs}</Table.Cell>
                                            </Table.Row>
                                        {/each}
                                    </Table.Body>
                                </Table.Root>
                            {/if}
                        </div>
                    </CardContent>
                </Card>
            </div>
        {:else}
            <div class="text-center py-16">
                <BarChart2 class="h-10 w-10 text-muted-foreground/40 mx-auto mb-3" />
                <p class="text-sm text-muted-foreground">No race data yet</p>
                <p class="text-xs text-muted-foreground mt-1">Complete a race to see stats here</p>
            </div>
        {/if}
    {/if}
</div>
