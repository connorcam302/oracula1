<script lang="ts">
	import { goto } from '$app/navigation';
	import { page } from '$app/stores';
	import { Card, CardContent, CardHeader, CardTitle } from '$lib/components/ui/card';
	import { Badge } from '$lib/components/ui/badge';
	import { Avatar } from '$lib/components/ui/avatar';
	import { Button } from '$lib/components/ui/button';
	import LineChart from '$lib/components/charts/line-chart.svelte';
	import BarChart from '$lib/components/charts/bar-chart.svelte';
	import { Trophy, Users } from 'lucide-svelte';

	let { data } = $props();

	function handleSeasonFilter(e: Event) {
		const select = e.target as HTMLSelectElement;
		const val = select.value;
		if (val) {
			goto(`/stats?season=${val}`);
		} else {
			goto('/stats');
		}
	}

	// Prepare chart data — F1-inspired, visually distinct palette
	const DRIVER_COLORS = [
		'#E10600', // F1 Red
		'#1E90FF', // Electric Blue
		'#F5C518', // Championship Gold
		'#27F4D2', // Mercedes Teal
		'#FF8700', // McLaren Orange
		'#229971', // Aston Martin Green
		'#FF87BC', // Alpine Pink
		'#6692FF', // AlphaTauri Blue
		'#DC143C', // Ferrari Crimson
		'#B5C0C8', // Silver
		'#7CDB8A', // Mint
		'#FFA07A'  // Salmon
	];

	function buildCumulativePointsData() {
		if (!data.pointsPerRace.length) return { labels: [], datasets: [] };

		const labels = data.pointsPerRace.map((r: any) => `R${r.round}`);

		// Get unique drivers
		const driverMap = new Map<string, { username: string; points: number[] }>();

		for (let i = 0; i < data.pointsPerRace.length; i++) {
			const race = data.pointsPerRace[i];
			for (const result of race.results) {
				if (!driverMap.has(result.userId)) {
					driverMap.set(result.userId, {
						username: result.username,
						points: new Array(data.pointsPerRace.length).fill(0)
					});
				}
				const driver = driverMap.get(result.userId)!;
				driver.points[i] = result.points;
			}
		}

		// Make cumulative
		const datasets = Array.from(driverMap.entries()).map(([userId, driver], idx) => {
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
				backgroundColor: DRIVER_COLORS[idx % DRIVER_COLORS.length] + '20'
			};
		});

		// Sort by final total
		datasets.sort((a, b) => (b.data.at(-1) || 0) - (a.data.at(-1) || 0));

		return { labels, datasets };
	}

	function buildPositionDistribution() {
		if (!data.pointsPerRace.length) return { labels: [], datasets: [] };

		const labels = data.pointsPerRace.map((r: any) => `R${r.round}`);
		const driverMap = new Map<string, { username: string; positions: (number | null)[] }>();

		for (let i = 0; i < data.pointsPerRace.length; i++) {
			const race = data.pointsPerRace[i];
			for (const result of race.results) {
				if (!driverMap.has(result.userId)) {
					driverMap.set(result.userId, {
						username: result.username,
						positions: new Array(data.pointsPerRace.length).fill(null)
					});
				}
				driverMap.get(result.userId)!.positions[i] = result.dnf ? null : result.position;
			}
		}

		const datasets = Array.from(driverMap.entries()).map(([userId, driver], idx) => ({
			label: driver.username,
			data: driver.positions.map((p) => p ?? 0),
			borderColor: DRIVER_COLORS[idx % DRIVER_COLORS.length],
			backgroundColor: DRIVER_COLORS[idx % DRIVER_COLORS.length] + '20'
		}));

		return { labels, datasets };
	}

	function buildPointsPerRaceBar() {
		if (!data.pointsPerRace.length) return { labels: [], datasets: [] };

		const labels = data.pointsPerRace.map((r: any) => `R${r.round}`);

		// Get top 6 drivers
		const driverTotals = new Map<string, { username: string; total: number }>();
		for (const race of data.pointsPerRace) {
			for (const result of race.results) {
				const existing = driverTotals.get(result.userId) || {
					username: result.username,
					total: 0
				};
				existing.total += result.points;
				driverTotals.set(result.userId, existing);
			}
		}

		const topDrivers = Array.from(driverTotals.entries())
			.sort(([, a], [, b]) => b.total - a.total)
			.slice(0, 6);

		const datasets = topDrivers.map(([userId, info], idx) => ({
			label: info.username,
			data: data.pointsPerRace.map((race: any) => {
				const result = race.results.find((r: any) => r.userId === userId);
				return result ? result.points : 0;
			}),
			backgroundColor: DRIVER_COLORS[idx % DRIVER_COLORS.length],
			borderColor: DRIVER_COLORS[idx % DRIVER_COLORS.length],
			borderWidth: 1
		}));

		return { labels, datasets };
	}

	const cumulativeData = $derived(buildCumulativePointsData());
	const positionChartData = $derived(buildPositionDistribution());
	const pointsPerRaceData = $derived(buildPointsPerRaceBar());
</script>

<div class="p-6 space-y-6">
	<div class="flex items-center justify-between">
		<div>
			<h1 class="font-display text-3xl font-bold tracking-tight leading-none text-foreground">Stats</h1>
			<p class="text-xs text-muted-foreground mt-2 uppercase tracking-widest font-medium">Driver and constructor standings</p>
		</div>
		<div>
			<select
				onchange={handleSeasonFilter}
				class="rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground"
				value={data.selectedSeason || ''}
			>
				<option value="">All Seasons</option>
				{#each data.allSeasons as season}
					<option value={season.id}>{season.name} ({season.year})</option>
				{/each}
			</select>
		</div>
	</div>

	<div class="grid grid-cols-1 gap-6 lg:grid-cols-2">
		<!-- Driver Standings -->
		<Card>
			<CardHeader>
				<div class="flex items-center gap-2">
					<Trophy class="h-5 w-5 text-gold" />
					<CardTitle>Driver Standings</CardTitle>
				</div>
			</CardHeader>
			<CardContent>
				<div class="space-y-1">
					{#each data.driverStandings as driver, i}
						<a
							href="/profile/{driver.userId}"
							class="flex items-center gap-3 rounded-lg p-2 hover:bg-accent transition-colors {i === 0 ? 'bg-gold/5' : ''}"
						>
							<span
								class="flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-bold {i === 0
									? 'bg-gold text-gold-foreground'
									: i === 1
										? 'bg-[#B5C0C8] text-[#1a1a1a]'
										: i === 2
											? 'bg-amber-700 text-white'
											: 'bg-muted text-muted-foreground'}"
							>
								{i + 1}
							</span>
							<Avatar src={driver.avatarUrl} fallback={driver.username} class="h-8 w-8" />
							<div class="flex-1 min-w-0">
								<p class="text-sm font-semibold truncate">{driver.username}</p>
								<p class="text-xs text-muted-foreground tracking-wide">
									<span class="text-gold font-semibold">{driver.wins}W</span>
									<span class="mx-0.5 text-muted-foreground/40">·</span>
									<span class="text-amber-500 font-semibold">{driver.podiums}P</span>
									<span class="mx-0.5 text-muted-foreground/40">·</span>
									<span class="text-destructive font-semibold">{driver.dnfs}D</span>
									<span class="mx-0.5 text-muted-foreground/40">·</span>
									{driver.totalRaces} races
								</p>
							</div>
							<span class="font-display text-sm font-bold tabular-nums">{driver.totalPoints} <span class="text-xs font-medium text-muted-foreground">pts</span></span>
						</a>
					{/each}
				</div>
			</CardContent>
		</Card>

		<!-- Constructor Standings -->
		<Card>
			<CardHeader>
				<div class="flex items-center gap-2">
					<Users class="h-5 w-5 text-blue" />
					<CardTitle>Constructor Standings</CardTitle>
				</div>
			</CardHeader>
			<CardContent>
				<div class="space-y-1">
					{#each data.constructorStandings as team, i}
						<div class="flex items-center gap-3 rounded-lg p-2 {i === 0 ? 'bg-gold/5' : ''}">
							<span
								class="flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-bold {i === 0
									? 'bg-gold text-gold-foreground'
									: i === 1
										? 'bg-[#B5C0C8] text-[#1a1a1a]'
										: i === 2
											? 'bg-amber-700 text-white'
											: 'bg-muted text-muted-foreground'}"
							>
								{i + 1}
							</span>
							<div
								class="h-7 w-7 rounded-full shrink-0 ring-2 ring-border"
								style="background-color: {team.teamColor}"
							></div>
							<div class="flex-1 min-w-0">
								<p class="text-sm font-medium truncate">{team.teamName}</p>
								<p class="text-xs text-muted-foreground">{team.totalRaces} entries</p>
							</div>
							<span class="text-sm font-bold tabular-nums">{team.totalPoints} pts</span>
						</div>
					{/each}
				</div>
			</CardContent>
		</Card>
	</div>

	<!-- Charts -->
	{#if data.pointsPerRace.length > 0}
		<div class="grid grid-cols-1 gap-6">
			<!-- Cumulative Points Chart -->
			<Card>
				<CardHeader>
					<CardTitle>Cumulative Points</CardTitle>
				</CardHeader>
				<CardContent>
					{#key data.chartSeasonId}
						<LineChart
							labels={cumulativeData.labels}
							datasets={cumulativeData.datasets}
						/>
					{/key}
				</CardContent>
			</Card>

			<div class="grid grid-cols-1 gap-6 lg:grid-cols-2">
				<!-- Position Tracker -->
				<Card>
					<CardHeader>
						<CardTitle>Track Positions</CardTitle>
					</CardHeader>
					<CardContent>
						{#key data.chartSeasonId}
							<LineChart
								labels={positionChartData.labels}
								datasets={positionChartData.datasets}
							/>
						{/key}
					</CardContent>
				</Card>

				<!-- Points Per Race -->
				<Card>
					<CardHeader>
						<CardTitle>Points Per Race (Top 6)</CardTitle>
					</CardHeader>
					<CardContent>
						{#key data.chartSeasonId}
							<BarChart
								labels={pointsPerRaceData.labels}
								datasets={pointsPerRaceData.datasets}
							/>
						{/key}
					</CardContent>
				</Card>
			</div>
		</div>
	{/if}
</div>
