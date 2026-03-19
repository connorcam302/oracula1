<script lang="ts">
    import {
        Card,
        CardContent,
        CardHeader,
        CardTitle,
    } from "$lib/components/ui/card";
    import { Badge } from "$lib/components/ui/badge";
    import { Avatar } from "$lib/components/ui/avatar";
    import { Button } from "$lib/components/ui/button";
    import { Trophy, Flag, Users, TrendingUp } from "lucide-svelte";

    let { data } = $props();
</script>

<div class="p-6 space-y-6">
    <div>
        <h1 class="text-3xl font-bold text-foreground">
            Oracula<span class="text-primary font-bold text-4xl">1</span>
        </h1>
    </div>

    <!-- Stats Overview — each card has its own semantic color -->
    <div class="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <!-- Seasons: Championship Gold -->
        <Card>
            <CardContent class="p-6">
                <div class="flex items-center gap-4">
                    <div class="rounded-lg bg-gold/10 p-3">
                        <Trophy class="h-6 w-6 text-gold" />
                    </div>
                    <div>
                        <p class="text-sm text-muted-foreground">
                            Total Seasons
                        </p>
                        <p class="text-2xl font-bold">{data.totalSeasons}</p>
                    </div>
                </div>
            </CardContent>
        </Card>

        <!-- Races: F1 Red -->
        <Card>
            <CardContent class="p-6">
                <div class="flex items-center gap-4">
                    <div class="rounded-lg bg-primary/10 p-3">
                        <Flag class="h-6 w-6 text-primary" />
                    </div>
                    <div>
                        <p class="text-sm text-muted-foreground">
                            Races Completed
                        </p>
                        <p class="text-2xl font-bold">{data.totalRaces}</p>
                    </div>
                </div>
            </CardContent>
        </Card>

        <!-- Latest Season: Data Blue -->
        <Card>
            <CardContent class="p-6">
                <div class="flex items-center gap-4">
                    <div class="rounded-lg bg-blue/10 p-3">
                        <Users class="h-6 w-6 text-blue" />
                    </div>
                    <div>
                        <p class="text-sm text-muted-foreground">
                            Latest Season
                        </p>
                        <p class="text-lg font-bold truncate">
                            {data.latestSeason?.name || "N/A"}
                        </p>
                    </div>
                </div>
            </CardContent>
        </Card>

        <!-- Top Driver: Success Green -->
        <Card>
            <CardContent class="p-6">
                <div class="flex items-center gap-4">
                    <div class="rounded-lg bg-success/10 p-3">
                        <TrendingUp class="h-6 w-6 text-success" />
                    </div>
                    <div>
                        <p class="text-sm text-muted-foreground">Top Driver</p>
                        <p class="text-lg font-bold truncate">
                            {data.topDrivers[0]?.username || "N/A"}
                        </p>
                    </div>
                </div>
            </CardContent>
        </Card>
    </div>

    <div class="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <!-- Top Drivers -->
        <Card>
            <CardHeader>
                <div class="flex items-center gap-2">
                    <Trophy class="h-5 w-5 text-gold" />
                    <CardTitle>Top Drivers (All-Time)</CardTitle>
                </div>
            </CardHeader>
            <CardContent>
                <div class="space-y-1">
                    {#each data.topDrivers as driver, i}
                        <a
                            href="/profile/{driver.userId}"
                            class="flex items-center gap-3 rounded-lg p-2 hover:bg-accent transition-colors {i ===
                            0
                                ? 'bg-gold/5'
                                : ''}"
                        >
                            <span
                                class="flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-bold {i ===
                                0
                                    ? 'bg-gold text-gold-foreground'
                                    : i === 1
                                      ? 'bg-[#B5C0C8] text-[#1a1a1a]'
                                      : i === 2
                                        ? 'bg-amber-700 text-white'
                                        : 'bg-muted text-muted-foreground'}"
                            >
                                {i + 1}
                            </span>
                            <Avatar
                                src={driver.avatarUrl}
                                fallback={driver.username}
                                class="h-8 w-8"
                            />
                            <div class="flex-1 min-w-0">
                                <p class="text-sm font-medium truncate">
                                    {driver.username}
                                </p>
                                <p class="text-xs text-muted-foreground">
                                    {driver.totalRaces} races
                                </p>
                            </div>
                            <span class="text-sm font-bold tabular-nums"
                                >{driver.totalPoints} pts</span
                            >
                        </a>
                    {/each}
                </div>
            </CardContent>
        </Card>

        <!-- Recent Races -->
        <Card>
            <CardHeader>
                <div class="flex items-center justify-between">
                    <div class="flex items-center gap-2">
                        <Flag class="h-5 w-5 text-primary" />
                        <CardTitle>Recent Races</CardTitle>
                    </div>
                    <a href="/seasons">
                        <Button variant="outline" size="sm">View All</Button>
                    </a>
                </div>
            </CardHeader>
            <CardContent>
                <div class="space-y-1">
                    {#each data.recentRaces as race}
                        <a
                            href="/seasons/{race.seasonId}/races/{race.id}"
                            class="flex items-center justify-between rounded-lg p-2 hover:bg-accent transition-colors"
                        >
                            <div>
                                <p class="text-sm font-medium">
                                    Round {race.roundNumber}
                                </p>
                                <p class="text-xs text-muted-foreground">
                                    {race.seasonName}
                                </p>
                            </div>
                            <div class="flex flex-col items-end gap-1">
                                {#if race.scheduledDate}
                                    <p class="text-xs text-muted-foreground">
                                        {race.scheduledDate}
                                    </p>
                                {/if}
                                {#if race.isCompleted}
                                    <Badge variant="success" class="text-xs"
                                        >Completed</Badge
                                    >
                                {:else}
                                    <Badge variant="blue" class="text-xs"
                                        >Upcoming</Badge
                                    >
                                {/if}
                            </div>
                        </a>
                    {/each}
                </div>
            </CardContent>
        </Card>
    </div>

    <!-- Quick Actions -->
    <Card>
        <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
        </CardHeader>
        <CardContent>
            <div class="flex flex-wrap gap-3">
                <a href="/seasons">
                    <Button variant="outline">
                        <Trophy class="h-4 w-4 mr-2 text-gold" />
                        View Seasons
                    </Button>
                </a>
                <a href="/stats">
                    <Button variant="outline">
                        <TrendingUp class="h-4 w-4 mr-2 text-blue" />
                        View Stats
                    </Button>
                </a>
                <a href="/seasons/create">
                    <Button>
                        <Flag class="h-4 w-4 mr-2" />
                        New Season
                    </Button>
                </a>
            </div>
        </CardContent>
    </Card>
</div>
