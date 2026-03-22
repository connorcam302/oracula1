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
    import { Trophy, Flag, Users, TrendingUp, ChevronRight, CheckCircle } from "lucide-svelte";
    import { countryToFlag } from "$lib/utils";

    let { data } = $props();

    const cs = $derived(data.currentSeason);

    function podiumBg(pos: number) {
        if (pos === 1) return "bg-gold text-gold-foreground";
        if (pos === 2) return "bg-[#B5C0C8] text-[#1a1a1a]";
        if (pos === 3) return "bg-amber-700 text-white";
        return "bg-muted text-muted-foreground";
    }

    const podium = $derived(
        cs?.lastRaceResults
            .filter((r: any) => !r.dnf && r.position !== null)
            .sort((a: any, b: any) => a.position - b.position)
            .slice(0, 3) ?? []
    );

    const dnfs = $derived(
        cs?.lastRaceResults.filter((r: any) => r.dnf) ?? []
    );
</script>

<div class="p-6 space-y-6">
    <div>
        <h1 class="font-display text-4xl font-bold tracking-tight leading-none text-foreground">
            Oracula<span class="text-primary">1</span>
        </h1>
    </div>

    <!-- Current Season -->
    {#if cs}
        <div class="space-y-4">
            <div class="flex items-center justify-between">
                <h2 class="text-xs uppercase tracking-widest font-medium text-muted-foreground">Current Season</h2>
                <a href="/seasons/{cs.season.id}" class="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors">
                    View season <ChevronRight class="h-3 w-3" />
                </a>
            </div>

            <div class="grid grid-cols-1 gap-6 lg:grid-cols-3">
                <!-- Standings -->
                <Card class="lg:col-span-1">
                    <CardHeader>
                        <div class="flex items-center gap-2">
                            <Trophy class="h-4 w-4 text-gold" />
                            <CardTitle class="text-base">{cs.season.name}</CardTitle>
                        </div>
                        <!-- Progress -->
                        <div class="space-y-1">
                            <div class="flex justify-between text-xs text-muted-foreground">
                                <span>{cs.completedRaces} of {cs.totalRaces} races</span>
                                <span>{cs.totalRaces > 0 ? Math.round((cs.completedRaces / cs.totalRaces) * 100) : 0}%</span>
                            </div>
                            <div class="h-1.5 rounded-full bg-muted overflow-hidden">
                                <div
                                    class="h-full rounded-full bg-primary transition-all"
                                    style="width: {cs.totalRaces > 0 ? (cs.completedRaces / cs.totalRaces) * 100 : 0}%"
                                ></div>
                            </div>
                        </div>
                    </CardHeader>
                    <CardContent>
                        {#if cs.standings.length > 0}
                            <div class="space-y-1">
                                {#each cs.standings as driver, i}
                                    <a
                                        href="/profile/{driver.userId}"
                                        class="flex items-center gap-2.5 rounded-lg px-2 py-1.5 hover:bg-accent transition-colors {i === 0 ? 'bg-gold/5' : ''}"
                                    >
                                        <span class="flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-xs font-bold {podiumBg(i + 1)}">{i + 1}</span>
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
                    </CardContent>
                </Card>

                <!-- Latest Race -->
                <Card>
                    <CardHeader>
                        <div class="flex items-center justify-between">
                            <CardTitle class="text-base">Latest Race</CardTitle>
                            {#if cs.lastRace}
                                <a href="/seasons/{cs.season.id}/races/{cs.lastRace.id}" class="text-xs text-muted-foreground hover:text-foreground transition-colors">
                                    Details →
                                </a>
                            {/if}
                        </div>
                    </CardHeader>
                    <CardContent>
                        {#if cs.lastRace}
                            <div class="space-y-3">
                                <div class="flex items-center gap-2">
                                    <span class="text-xl">{countryToFlag(cs.lastRace.trackCountry)}</span>
                                    <div>
                                        <p class="text-sm font-semibold">{cs.lastRace.trackName}</p>
                                        <p class="text-xs text-muted-foreground">Round {cs.lastRace.roundNumber}{cs.lastRace.scheduledDate ? ` · ${cs.lastRace.scheduledDate}` : ''}</p>
                                    </div>
                                </div>
                                {#if podium.length > 0}
                                    <div class="space-y-1">
                                        {#each podium as finisher}
                                            <div class="flex items-center gap-2 rounded-md px-2 py-1.5">
                                                <span class="flex h-5 w-5 shrink-0 items-center justify-center rounded text-xs font-bold {podiumBg(finisher.position)}">
                                                    {finisher.position}
                                                </span>
                                                <span class="flex-1 text-sm truncate">{finisher.username}</span>
                                                <span class="text-xs text-muted-foreground tabular-nums">{finisher.points} pts</span>
                                            </div>
                                        {/each}
                                        {#each dnfs as dnf}
                                            <div class="flex items-center gap-2 rounded-md px-2 py-1.5">
                                                <span class="flex h-5 w-5 shrink-0 items-center justify-center rounded text-[10px] font-bold bg-destructive/15 text-destructive">✕</span>
                                                <span class="flex-1 text-sm truncate text-muted-foreground">{dnf.username}</span>
                                                <span class="text-xs text-destructive/70">DNF</span>
                                            </div>
                                        {/each}
                                    </div>
                                {:else}
                                    <p class="text-xs text-muted-foreground">No results recorded</p>
                                {/if}
                            </div>
                        {:else}
                            <div class="text-center py-6">
                                <Flag class="h-8 w-8 text-muted-foreground/30 mx-auto mb-2" />
                                <p class="text-xs text-muted-foreground">No races completed yet</p>
                            </div>
                        {/if}
                    </CardContent>
                </Card>

                <!-- Next Race -->
                <Card>
                    <CardHeader>
                        <CardTitle class="text-base">Next Race</CardTitle>
                    </CardHeader>
                    <CardContent>
                        {#if cs.nextRace}
                            <a href="/seasons/{cs.season.id}/races/{cs.nextRace.id}" class="block space-y-3 hover:opacity-80 transition-opacity">
                                <div class="flex items-center gap-3">
                                    <span class="text-4xl leading-none">{countryToFlag(cs.nextRace.trackCountry)}</span>
                                    <div>
                                        <p class="font-semibold">{cs.nextRace.trackName}</p>
                                        <p class="text-xs text-muted-foreground mt-0.5">Round {cs.nextRace.roundNumber}</p>
                                    </div>
                                </div>
                                {#if cs.nextRace.scheduledDate}
                                    <div class="flex items-center gap-2 rounded-lg bg-muted/50 px-3 py-2">
                                        <CheckCircle class="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                                        <span class="text-sm font-medium">{cs.nextRace.scheduledDate}</span>
                                    </div>
                                {/if}
                            </a>
                        {:else}
                            <div class="text-center py-6">
                                <CheckCircle class="h-8 w-8 text-success/40 mx-auto mb-2" />
                                <p class="text-xs text-muted-foreground">All races completed</p>
                            </div>
                        {/if}
                    </CardContent>
                </Card>
            </div>
        </div>
    {/if}

    <!-- All-time stats -->
    <div class="space-y-4">
        <h2 class="text-xs uppercase tracking-widest font-medium text-muted-foreground">All Time</h2>

        <div class="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <Card>
                <CardContent class="p-6">
                    <div class="flex items-center gap-4">
                        <div class="rounded-lg bg-gold/10 p-3">
                            <Trophy class="h-6 w-6 text-gold" />
                        </div>
                        <div>
                            <p class="text-xs text-muted-foreground uppercase tracking-widest font-medium">Seasons</p>
                            <p class="font-display text-2xl font-bold tabular-nums leading-tight">{data.totalSeasons}</p>
                        </div>
                    </div>
                </CardContent>
            </Card>

            <Card>
                <CardContent class="p-6">
                    <div class="flex items-center gap-4">
                        <div class="rounded-lg bg-primary/10 p-3">
                            <Flag class="h-6 w-6 text-primary" />
                        </div>
                        <div>
                            <p class="text-xs text-muted-foreground uppercase tracking-widest font-medium">Races</p>
                            <p class="font-display text-2xl font-bold tabular-nums leading-tight">{data.totalRaces}</p>
                        </div>
                    </div>
                </CardContent>
            </Card>

            <Card>
                <CardContent class="p-6">
                    <div class="flex items-center gap-4">
                        <div class="rounded-lg bg-success/10 p-3">
                            <TrendingUp class="h-6 w-6 text-success" />
                        </div>
                        <div>
                            <p class="text-xs text-muted-foreground uppercase tracking-widest font-medium">Top Driver</p>
                            <p class="font-display text-lg font-bold truncate leading-tight">
                                {data.topDrivers[0]?.username || "—"}
                            </p>
                        </div>
                    </div>
                </CardContent>
            </Card>

            <Card>
                <CardContent class="p-6">
                    <div class="flex items-center gap-4">
                        <div class="rounded-lg bg-blue/10 p-3">
                            <Users class="h-6 w-6 text-blue" />
                        </div>
                        <div>
                            <p class="text-xs text-muted-foreground uppercase tracking-widest font-medium">Drivers</p>
                            <p class="font-display text-2xl font-bold tabular-nums leading-tight">{data.topDrivers.length}</p>
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
                        <CardTitle>Top Drivers</CardTitle>
                    </div>
                </CardHeader>
                <CardContent>
                    <div class="space-y-1">
                        {#each data.topDrivers as driver, i}
                            <a
                                href="/profile/{driver.userId}"
                                class="flex items-center gap-3 rounded-lg p-2 hover:bg-accent transition-colors {i === 0 ? 'bg-gold/5' : ''}"
                            >
                                <span class="flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-bold {i === 0 ? 'bg-gold text-gold-foreground' : i === 1 ? 'bg-[#B5C0C8] text-[#1a1a1a]' : i === 2 ? 'bg-amber-700 text-white' : 'bg-muted text-muted-foreground'}">
                                    {i + 1}
                                </span>
                                <Avatar src={driver.avatarUrl} fallback={driver.username} class="h-8 w-8" />
                                <div class="flex-1 min-w-0">
                                    <p class="text-sm font-semibold truncate">{driver.username}</p>
                                    <p class="text-xs text-muted-foreground">{driver.totalRaces} races</p>
                                </div>
                                <span class="font-display text-sm font-bold tabular-nums">{driver.totalPoints} <span class="text-xs font-medium text-muted-foreground">pts</span></span>
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
                                    <p class="text-sm font-medium">Round {race.roundNumber}</p>
                                    <p class="text-xs text-muted-foreground">{race.seasonName}</p>
                                </div>
                                <div class="flex flex-col items-end gap-1">
                                    {#if race.scheduledDate}
                                        <p class="text-xs text-muted-foreground">{race.scheduledDate}</p>
                                    {/if}
                                    <Badge variant="success" class="text-xs">Completed</Badge>
                                </div>
                            </a>
                        {/each}
                    </div>
                </CardContent>
            </Card>
        </div>
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
