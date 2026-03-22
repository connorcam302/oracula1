<script lang="ts">
    import {
        createSvelteTable,
        FlexRender,
    } from "$lib/components/ui/data-table";
    import { getCoreRowModel, getSortedRowModel } from "@tanstack/table-core";
    import type { ColumnDef, SortingState } from "@tanstack/table-core";
    import * as Table from "$lib/components/ui/table";
    import {
        Tooltip,
        TooltipTrigger,
        TooltipContent,
    } from "$lib/components/ui/tooltip";
    import { countryToFlag } from "$lib/utils";
    import { Flag } from "lucide-svelte";

    type RaceData = {
        id: number;
        roundNumber: number;
        scheduledDate: string | null;
        isCompleted: boolean;
        trackName: string;
        trackCountry: string;
        trackId: number;
    };

    type PointsRaceEntry = {
        round: number;
        trackName: string;
        results: {
            userId: string;
            username: string;
            points: number;
            position: number | null;
            dnf: boolean;
        }[];
    };

    type DriverInfo = {
        userId: string;
        username: string;
        teamName: string | null;
        teamColor: string | null;
    };

    interface Props {
        races: RaceData[];
        pointsPerRace: PointsRaceEntry[];
        driverStandings: DriverInfo[];
        seasonId: number;
    }

    let { races, pointsPerRace, driverStandings, seasonId }: Props = $props();

    type RaceResult = { points: number; position: number | null; dnf: boolean };
    type DriverRow = {
        userId: string;
        username: string;
        teamName: string | null;
        teamColor: string | null;
        results: Record<number, RaceResult>;
    };

    const raceMap = $derived(new Map(races.map((r) => [r.id, r])));

    const tableData: DriverRow[] = $derived(
        (() => {
            // Build raceId -> userId -> result lookup
            const raceResultMap = new Map<number, Map<string, RaceResult>>();
            for (const entry of pointsPerRace) {
                const race = races.find((r) => r.roundNumber === entry.round);
                if (!race) continue;
                const byUser = new Map<string, RaceResult>();
                for (const r of entry.results) {
                    byUser.set(r.userId, {
                        points: r.points,
                        position: r.position,
                        dnf: r.dnf,
                    });
                }
                raceResultMap.set(race.id, byUser);
            }

            const rows: DriverRow[] = driverStandings.map((driver) => {
                const results: Record<number, RaceResult> = {};
                for (const [raceId, byUser] of raceResultMap) {
                    const result = byUser.get(driver.userId);
                    if (result) results[raceId] = result;
                }
                return {
                    userId: driver.userId,
                    username: driver.username,
                    teamName: driver.teamName,
                    teamColor: driver.teamColor,
                    results,
                };
            });

            rows.sort((a, b) => {
                const ta = a.teamName ?? "";
                const tb = b.teamName ?? "";
                if (ta !== tb) return ta.localeCompare(tb);
                return a.username.localeCompare(b.username);
            });

            return rows;
        })(),
    );

    let viewMode = $state<"points" | "position">("points");
    let sorting = $state<SortingState>([]);

    const columns: ColumnDef<DriverRow>[] = $derived(
        (() => {
            const mode = viewMode;

            const driverCol: ColumnDef<DriverRow> = {
                id: "driver",
                header: "Driver",
                accessorFn: (row) => row.username,
            };

            const raceCols: ColumnDef<DriverRow>[] = races.map((race) => ({
                id: `race_${race.id}`,
                header: `R${race.roundNumber}`,
                accessorFn: (row: DriverRow) => row.results[race.id] ?? null,
                sortingFn: (
                    rowA: { original: DriverRow },
                    rowB: { original: DriverRow },
                ) => {
                    const a = rowA.original.results[race.id];
                    const b = rowB.original.results[race.id];
                    if (mode === "points") {
                        return (a?.points ?? -1) - (b?.points ?? -1);
                    }
                    const posA =
                        !a || a.dnf || a.position == null
                            ? Infinity
                            : a.position;
                    const posB =
                        !b || b.dnf || b.position == null
                            ? Infinity
                            : b.position;
                    return posA - posB;
                },
                cell: ({ row }: { row: { original: DriverRow } }) => {
                    const result = row.original.results[race.id];
                    if (!result) return "–";
                    if (mode === "points") return String(result.points);
                    if (result.dnf) return "DNF";
                    return result.position != null
                        ? String(result.position)
                        : "–";
                },
            }));

            const computeSummary = (row: DriverRow): number => {
                const results = Object.values(row.results);
                if (mode === "points")
                    return results.reduce((sum, r) => sum + r.points, 0);
                const positions = results
                    .filter((r) => !r.dnf && r.position != null)
                    .map((r) => r.position!);
                if (positions.length === 0) return Infinity;
                return (
                    positions.reduce((sum, p) => sum + p, 0) / positions.length
                );
            };

            const summaryCol: ColumnDef<DriverRow> = {
                id: "summary",
                header: mode === "points" ? "Pts" : "Avg",
                accessorFn: (row: DriverRow) => row.results,
                sortDescFirst: mode === "points",
                sortingFn: (
                    rowA: { original: DriverRow },
                    rowB: { original: DriverRow },
                ) =>
                    computeSummary(rowA.original) -
                    computeSummary(rowB.original),
                cell: ({ row }: { row: { original: DriverRow } }) => {
                    const results = Object.values(row.original.results);
                    if (mode === "points") {
                        return String(
                            results.reduce((sum, r) => sum + r.points, 0),
                        );
                    }
                    const positions = results
                        .filter((r) => !r.dnf && r.position != null)
                        .map((r) => r.position!);
                    if (positions.length === 0) return "–";
                    return (
                        positions.reduce((sum, p) => sum + p, 0) /
                        positions.length
                    ).toFixed(1);
                },
            };

            return [driverCol, ...raceCols, summaryCol];
        })(),
    );

    const table = createSvelteTable({
        get data() {
            return tableData;
        },
        get columns() {
            return columns;
        },
        state: {
            get sorting() {
                return sorting;
            },
        },
        onSortingChange: (updater) => {
            sorting =
                typeof updater === "function" ? updater(sorting) : updater;
        },
        getCoreRowModel: getCoreRowModel(),
        getSortedRowModel: getSortedRowModel(),
    });
</script>

<div class="overflow-x-auto">
    {#if driverStandings.length > 0}
        <div class="flex items-center justify-end mb-2">
            <div
                class="flex rounded-md border border-border overflow-hidden text-xs"
            >
                <button
                    onclick={() => (viewMode = "points")}
                    class="px-3 py-1.5 transition-colors {viewMode === 'points'
                        ? 'bg-muted font-medium'
                        : 'text-muted-foreground hover:text-foreground'}"
                >
                    Points
                </button>
                <button
                    onclick={() => (viewMode = "position")}
                    class="px-3 py-1.5 transition-colors {viewMode ===
                    'position'
                        ? 'bg-muted font-medium'
                        : 'text-muted-foreground hover:text-foreground'}"
                >
                    Position
                </button>
            </div>
        </div>
    {/if}

    <div class="rounded-md border border-border">
        <Table.Root class="w-auto">
            <Table.Header>
                {#each table.getHeaderGroups() as headerGroup}
                    <Table.Row>
                        {#each headerGroup.headers as header}
                            {#if header.column.id === "driver"}
                                <Table.Head
                                    class="min-w-[120px] sticky left-0 bg-card z-10"
                                >
                                    Driver
                                </Table.Head>
                            {:else if header.column.id === "summary"}
                                <Table.Head
                                    class="w-px whitespace-nowrap pl-3 font-semibold cursor-pointer select-none hover:bg-muted/50 transition-colors"
                                    onclick={header.column.getToggleSortingHandler()}
                                >
                                    <div class="flex items-center gap-1">
                                        <FlexRender
                                            content={header.column.columnDef
                                                .header}
                                            context={header.getContext()}
                                        />
                                        {#if header.column.getIsSorted() === "asc"}
                                            <span class="text-xs opacity-60"
                                                >↑</span
                                            >
                                        {:else if header.column.getIsSorted() === "desc"}
                                            <span class="text-xs opacity-60"
                                                >↓</span
                                            >
                                        {/if}
                                    </div>
                                </Table.Head>
                            {:else}
                                {@const raceId = parseInt(
                                    header.column.id.slice(5),
                                )}
                                {@const race = raceMap.get(raceId)}
                                <Table.Head
                                    class="px-2 w-10 cursor-pointer select-none hover:bg-muted/50 transition-colors"
                                    onclick={header.column.getToggleSortingHandler()}
                                >
                                    <div class="flex items-center gap-0.5">
                                        <Tooltip>
                                            <TooltipTrigger>
                                                <span
                                                    class="text-base leading-none"
                                                >
                                                    {countryToFlag(
                                                        race?.trackCountry ??
                                                            "",
                                                    )}
                                                </span>
                                            </TooltipTrigger>
                                            <TooltipContent>
                                                {race?.trackName} · {race?.trackCountry}
                                            </TooltipContent>
                                        </Tooltip>
                                        {#if header.column.getIsSorted() === "asc"}
                                            <span class="text-xs opacity-60"
                                                >↑</span
                                            >
                                        {:else if header.column.getIsSorted() === "desc"}
                                            <span class="text-xs opacity-60"
                                                >↓</span
                                            >
                                        {/if}
                                    </div>
                                </Table.Head>
                            {/if}
                        {/each}
                    </Table.Row>
                {/each}
            </Table.Header>
            <Table.Body>
                {#each table.getRowModel().rows as row}
                    <Table.Row>
                        {#each row.getVisibleCells() as cell}
                            {#if cell.column.id === "driver"}
                                <Table.Cell
                                    class="sticky left-0 bg-card z-10 py-2 pr-4"
                                >
                                    <div class="flex items-center gap-2">
                                        {#if row.original.teamColor}
                                            <div
                                                class="h-3 w-0.5 rounded shrink-0"
                                                style="background-color: {row
                                                    .original.teamColor}"
                                            ></div>
                                        {/if}
                                        <a
                                            href="/profile/{row.original
                                                .userId}"
                                            class="text-sm font-medium truncate max-w-[100px] hover:text-primary transition-colors"
                                            title={row.original.username}
                                        >
                                            {row.original.username}
                                        </a>
                                    </div>
                                </Table.Cell>
                            {:else if cell.column.id === "summary"}
                                <Table.Cell
                                    class="w-px whitespace-nowrap pl-3 py-2 tabular-nums text-sm font-semibold"
                                >
                                    <FlexRender
                                        content={cell.column.columnDef.cell}
                                        context={cell.getContext()}
                                    />
                                </Table.Cell>
                            {:else}
                                {@const raceId = parseInt(
                                    cell.column.id.slice(5),
                                )}
                                {@const result = row.original.results[raceId]}
                                <Table.Cell class="px-2 py-2">
                                    {#if result?.dnf}
                                        <span
                                            class="tabular-nums text-sm text-destructive"
                                            >DNF</span
                                        >
                                    {:else if result?.position === 1}
                                        <span
                                            class="inline-flex items-center justify-center h-5 min-w-5 px-1 rounded text-xs font-bold tabular-nums bg-gold text-gold-foreground"
                                        >
                                            <FlexRender
                                                content={cell.column.columnDef
                                                    .cell}
                                                context={cell.getContext()}
                                            />
                                        </span>
                                    {:else if result?.position === 2}
                                        <span
                                            class="inline-flex items-center justify-center h-5 min-w-5 px-1 rounded text-xs font-bold tabular-nums bg-[#B5C0C8] text-[#1a1a1a]"
                                        >
                                            <FlexRender
                                                content={cell.column.columnDef
                                                    .cell}
                                                context={cell.getContext()}
                                            />
                                        </span>
                                    {:else if result?.position === 3}
                                        <span
                                            class="inline-flex items-center justify-center h-5 min-w-5 px-1 rounded text-xs font-bold tabular-nums bg-amber-700 text-white"
                                        >
                                            <FlexRender
                                                content={cell.column.columnDef
                                                    .cell}
                                                context={cell.getContext()}
                                            />
                                        </span>
                                    {:else}
                                        <span class="tabular-nums text-sm">
                                            <FlexRender
                                                content={cell.column.columnDef
                                                    .cell}
                                                context={cell.getContext()}
                                            />
                                        </span>
                                    {/if}
                                </Table.Cell>
                            {/if}
                        {/each}
                    </Table.Row>
                {:else}
                    <Table.Row>
                        <Table.Cell
                            colspan={1 + races.length}
                            class="text-center py-8"
                        >
                            <Flag
                                class="h-8 w-8 text-primary/40 mx-auto mb-2"
                            />
                            <p class="text-sm text-muted-foreground">
                                No races scheduled yet
                            </p>
                        </Table.Cell>
                    </Table.Row>
                {/each}
            </Table.Body>
        </Table.Root>
    </div>
</div>
