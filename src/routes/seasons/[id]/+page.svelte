<script lang="ts">
    import { invalidateAll } from "$app/navigation";
    import {
        Card,
        CardContent,
        CardHeader,
        CardTitle,
    } from "$lib/components/ui/card";
    import { Button } from "$lib/components/ui/button";
    import { Badge } from "$lib/components/ui/badge";
    import { Avatar } from "$lib/components/ui/avatar";
    import { Separator } from "$lib/components/ui/separator";
    import {
        Tooltip,
        TooltipTrigger,
        TooltipContent,
    } from "$lib/components/ui/tooltip";
    import LineChart from "$lib/components/charts/line-chart.svelte";
    import { countryToFlag } from "$lib/utils";
    import {
        ArrowLeft,
        Plus,
        Flag,
        Trash2,
        ChevronLeft,
        ChevronRight,
        Users,
        UserPlus,
        Trophy,
        TrendingUp,
    } from "lucide-svelte";

    let { data } = $props();

    // Driver colors for charts - F1-inspired palette
    const DRIVER_COLORS = [
        "#E10600",
        "#1E90FF",
        "#F5C518",
        "#27F4D2",
        "#FF8700",
        "#229971",
        "#FF87BC",
        "#6692FF",
        "#DC143C",
        "#B5C0C8",
        "#7CDB8A",
        "#FFA07A",
    ];

    // Build cumulative points chart data
    function buildCumulativeData() {
        if (!data.pointsPerRace.length) return { labels: [], datasets: [] };

        const labels = data.pointsPerRace.map((r: any) => `R${r.round}`);

        const driverMap = new Map<
            string,
            { username: string; points: number[] }
        >();

        for (let i = 0; i < data.pointsPerRace.length; i++) {
            const race = data.pointsPerRace[i];
            for (const result of race.results) {
                if (!driverMap.has(result.userId)) {
                    driverMap.set(result.userId, {
                        username: result.username,
                        points: new Array(data.pointsPerRace.length).fill(0),
                    });
                }
                const driver = driverMap.get(result.userId)!;
                driver.points[i] = result.points;
            }
        }

        const datasets = Array.from(driverMap.entries()).map(
            ([userId, driver], idx) => {
                const cumulative: number[] = [];
                let sum = 0;
                for (const pts of driver.points) {
                    sum += pts;
                    cumulative.push(sum);
                }
                return {
                    label: driver.username,
                    data: cumulative,
                    borderColor: DRIVER_COLORS[idx % DRIVER_COLORS.length],
                    backgroundColor:
                        DRIVER_COLORS[idx % DRIVER_COLORS.length] + "20",
                };
            },
        );

        datasets.sort((a, b) => (b.data.at(-1) || 0) - (a.data.at(-1) || 0));

        return { labels, datasets };
    }

    const cumulativeData = $derived(buildCumulativeData());

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

    async function deleteRace(raceId: number) {
        if (!confirm("Delete this race and all its results?")) return;
        await fetch(`/api/races/${raceId}`, { method: "DELETE" });
        await invalidateAll();
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
</script>

<div class="p-6 space-y-6">
    <!-- Header -->
    <div class="flex items-center gap-4">
        <a href="/seasons">
            <Button variant="ghost" size="icon">
                <ArrowLeft class="h-5 w-5" />
            </Button>
        </a>
        <div>
            <h1
                class="font-display text-3xl font-bold tracking-tight leading-none text-foreground"
            >
                {data.season.name}
            </h1>
            <p
                class="text-xs text-muted-foreground mt-2 uppercase tracking-widest font-medium"
            >
                {data.season.year} Season
            </p>
        </div>
    </div>

    <div class="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <!-- Races List -->
        <div class="lg:col-span-2 space-y-4">
            <Card>
                <CardHeader>
                    <div class="flex items-center justify-between">
                        <CardTitle>Races ({data.totalRaces})</CardTitle>
                        <Button
                            size="sm"
                            onclick={() => (showAddRace = !showAddRace)}
                        >
                            <Plus class="h-4 w-4 mr-1" />
                            Add Race
                        </Button>
                    </div>
                </CardHeader>
                <CardContent>
                    {#if showAddRace}
                        <div
                            class="mb-4 rounded-lg border border-border p-4 space-y-3"
                        >
                            <div class="grid grid-cols-1 gap-3 sm:grid-cols-3">
                                <div>
                                    <label
                                        for="race-track"
                                        class="block text-sm font-medium mb-1"
                                        >Track</label
                                    >
                                    <select
                                        id="race-track"
                                        bind:value={selectedTrack}
                                        class="w-full rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground"
                                    >
                                        <option value="">Select track...</option
                                        >
                                        {#each data.tracks as track}
                                            <option value={track.id}
                                                >{countryToFlag(track.country)}
                                                {track.name}</option
                                            >
                                        {/each}
                                    </select>
                                </div>
                                <div>
                                    <label
                                        for="race-round"
                                        class="block text-sm font-medium mb-1"
                                        >Round</label
                                    >
                                    <input
                                        id="race-round"
                                        type="number"
                                        bind:value={roundNumber}
                                        min="1"
                                        class="w-full rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground"
                                    />
                                </div>
                                <div>
                                    <label
                                        for="race-date"
                                        class="block text-sm font-medium mb-1"
                                        >Date</label
                                    >
                                    <input
                                        id="race-date"
                                        type="date"
                                        bind:value={scheduledDate}
                                        class="w-full rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground"
                                    />
                                </div>
                            </div>
                            <div class="flex gap-2">
                                <Button
                                    size="sm"
                                    onclick={addRace}
                                    disabled={addingRace || !selectedTrack}
                                >
                                    {addingRace ? "Adding..." : "Add Race"}
                                </Button>
                                <Button
                                    size="sm"
                                    variant="ghost"
                                    onclick={() => (showAddRace = false)}
                                >
                                    Cancel
                                </Button>
                            </div>
                        </div>
                    {/if}

                    <div class="space-y-2">
                        {#each data.races as race}
                            <div
                                class="flex items-center justify-between rounded-lg border p-3 hover:bg-accent transition-colors {race.isCompleted
                                    ? 'border-success/20 bg-success/5 hover:bg-success/10'
                                    : 'border-border'}"
                            >
                                <a
                                    href="/seasons/{data.season
                                        .id}/races/{race.id}"
                                    class="flex-1 flex items-center gap-3"
                                >
                                    <span
                                        class="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-xs font-bold {race.isCompleted
                                            ? 'bg-success/15 text-success'
                                            : 'bg-muted text-muted-foreground'}"
                                    >
                                        R{race.roundNumber}
                                    </span>
                                    <div class="flex-1 min-w-0">
                                        <p class="font-medium text-sm truncate">
                                            {countryToFlag(race.trackCountry)}
                                            {race.trackName}
                                        </p>
                                        <p
                                            class="text-xs text-muted-foreground"
                                        >
                                            {race.trackCountry}
                                        </p>
                                    </div>
                                    {#if race.scheduledDate}
                                        <span
                                            class="text-xs text-muted-foreground mr-2 shrink-0"
                                        >
                                            {race.scheduledDate}
                                        </span>
                                    {/if}
                                    {#if race.isCompleted}
                                        <Badge
                                            variant="success"
                                            class="text-xs shrink-0"
                                            >Completed</Badge
                                        >
                                    {:else}
                                        <Badge
                                            variant="outline"
                                            class="text-xs shrink-0"
                                            >Upcoming</Badge
                                        >
                                    {/if}
                                </a>
                                <button
                                    onclick={() => deleteRace(race.id)}
                                    class="ml-2 shrink-0 rounded p-1 text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"
                                >
                                    <Trash2 class="h-4 w-4" />
                                </button>
                            </div>
                        {/each}

                        {#if data.races.length === 0}
                            <div class="text-center py-8">
                                <Flag
                                    class="h-8 w-8 text-primary/40 mx-auto mb-2"
                                />
                                <p class="text-sm text-muted-foreground">
                                    No races added yet
                                </p>
                            </div>
                        {/if}
                    </div>

                    <!-- Pagination -->
                    {#if data.totalPages > 1}
                        <div
                            class="flex items-center justify-center gap-2 mt-4"
                        >
                            <a
                                href="/seasons/{data.season.id}?page={Math.max(
                                    1,
                                    data.page - 1,
                                )}"
                            >
                                <Button
                                    variant="outline"
                                    size="sm"
                                    disabled={data.page === 1}
                                >
                                    <ChevronLeft class="h-4 w-4" />
                                </Button>
                            </a>
                            <span class="text-sm text-muted-foreground">
                                Page {data.page} of {data.totalPages}
                            </span>
                            <a
                                href="/seasons/{data.season.id}?page={Math.min(
                                    data.totalPages,
                                    data.page + 1,
                                )}"
                            >
                                <Button
                                    variant="outline"
                                    size="sm"
                                    disabled={data.page === data.totalPages}
                                >
                                    <ChevronRight class="h-4 w-4" />
                                </Button>
                            </a>
                        </div>
                    {/if}
                </CardContent>
            </Card>

            <!-- Championship Chart -->
            {#if data.pointsPerRace.length > 0}
                <Card>
                    <CardHeader>
                        <div class="flex items-center gap-2">
                            <TrendingUp class="h-5 w-5 text-blue" />
                            <CardTitle>Championship Battle</CardTitle>
                        </div>
                    </CardHeader>
                    <CardContent>
                        <LineChart
                            labels={cumulativeData.labels}
                            datasets={cumulativeData.datasets}
                        />
                    </CardContent>
                </Card>
            {/if}
        </div>

        <!-- Teams & Standings Sidebar -->
        <div class="space-y-4">
            <!-- Standings -->
            <Card>
                <CardHeader>
                    <div class="flex items-center gap-2">
                        <Trophy class="h-5 w-5 text-gold" />
                        <CardTitle class="text-base">Standings</CardTitle>
                    </div>
                </CardHeader>
                <CardContent>
                    {#if data.driverStandings.length > 0}
                        <div class="space-y-1">
                            {#each data.driverStandings as driver, i}
                                <a
                                    href="/profile/{driver.userId}"
                                    class="flex items-center gap-2 rounded-lg p-2 hover:bg-accent transition-colors {i ===
                                    0
                                        ? 'bg-gold/5'
                                        : ''}"
                                >
                                    <span
                                        class="flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-xs font-bold {i ===
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
                                    {#if driver.teamColor}
                                        <Tooltip>
                                            <TooltipTrigger>
                                                <div
                                                    class="h-3 w-3 rounded-full shrink-0"
                                                    style="background-color: {driver.teamColor}"
                                                ></div>
                                            </TooltipTrigger>
                                            <TooltipContent>
                                                {driver.teamName}
                                            </TooltipContent>
                                        </Tooltip>
                                    {/if}
                                    <div class="flex-1 min-w-0">
                                        <p class="text-sm font-medium truncate">
                                            {driver.username}
                                        </p>
                                    </div>
                                    <span
                                        class="font-display text-sm font-bold tabular-nums"
                                        >{driver.totalPoints}</span
                                    >
                                </a>
                            {/each}
                        </div>
                    {:else}
                        <div class="text-center py-4">
                            <Trophy class="h-6 w-6 text-gold/40 mx-auto mb-1" />
                            <p class="text-xs text-muted-foreground">
                                No results yet
                            </p>
                        </div>
                    {/if}
                </CardContent>
            </Card>

            <!-- Teams -->
            <Card>
                <CardHeader>
                    <div class="flex items-center justify-between">
                        <CardTitle class="text-base">Teams</CardTitle>
                        <Button
                            size="sm"
                            variant="ghost"
                            onclick={() =>
                                (showAddTeamMember = !showAddTeamMember)}
                        >
                            <UserPlus class="h-4 w-4" />
                        </Button>
                    </div>
                </CardHeader>
                <CardContent>
                    {#if showAddTeamMember}
                        <div
                            class="mb-4 space-y-3 rounded-lg border border-border p-3"
                        >
                            <div>
                                <label
                                    for="team-user"
                                    class="block text-xs font-medium mb-1"
                                    >User</label
                                >
                                <select
                                    id="team-user"
                                    bind:value={selectedUser}
                                    class="w-full rounded-md border border-input bg-background px-2 py-1.5 text-sm text-foreground"
                                >
                                    <option value="">Select user...</option>
                                    {#each data.allUsers as user}
                                        <option value={user.id}
                                            >{user.username}</option
                                        >
                                    {/each}
                                </select>
                            </div>
                            <div>
                                <label
                                    for="team-select"
                                    class="block text-xs font-medium mb-1"
                                    >Team</label
                                >
                                <select
                                    id="team-select"
                                    bind:value={selectedTeam}
                                    class="w-full rounded-md border border-input bg-background px-2 py-1.5 text-sm text-foreground"
                                >
                                    <option value="">Select team...</option>
                                    {#each data.allTeams as team}
                                        <option value={team.id}
                                            >{team.name}</option
                                        >
                                    {/each}
                                </select>
                            </div>
                            <Button
                                size="sm"
                                onclick={addTeamMember}
                                disabled={addingMember}
                            >
                                {addingMember ? "Adding..." : "Assign"}
                            </Button>
                        </div>
                    {/if}

                    {@const teamGroups = data.teamMembers.reduce(
                        (
                            acc: Record<string, typeof data.teamMembers>,
                            m: any,
                        ) => {
                            const key = m.teamName;
                            if (!acc[key]) acc[key] = [];
                            acc[key].push(m);
                            return acc;
                        },
                        {},
                    )}

                    <div class="space-y-3">
                        {#each Object.entries(teamGroups) as [teamName, members]}
                            {@const membersList = members as any[]}
                            <div>
                                <div class="flex items-center gap-2 mb-1">
                                    <Tooltip>
                                        <TooltipTrigger>
                                            <div
                                                class="h-3 w-3 rounded-full"
                                                style="background-color: {membersList[0]
                                                    .teamColor}"
                                            ></div>
                                        </TooltipTrigger>
                                        <TooltipContent>
                                            {teamName}
                                        </TooltipContent>
                                    </Tooltip>
                                    <span class="text-sm font-medium"
                                        >{teamName}</span
                                    >
                                </div>
                                <div class="ml-5 space-y-1">
                                    {#each membersList as member}
                                        <div class="flex items-center gap-2">
                                            <Avatar
                                                src={member.avatarUrl}
                                                fallback={member.username}
                                                class="h-6 w-6"
                                            />
                                            <span
                                                class="text-xs text-muted-foreground"
                                                >{member.username}</span
                                            >
                                        </div>
                                    {/each}
                                </div>
                            </div>
                        {/each}

                        {#if data.teamMembers.length === 0}
                            <div class="text-center py-4">
                                <Users
                                    class="h-6 w-6 text-muted-foreground mx-auto mb-1"
                                />
                                <p class="text-xs text-muted-foreground">
                                    No teams assigned
                                </p>
                            </div>
                        {/if}
                    </div>
                </CardContent>
            </Card>
        </div>
    </div>
</div>
