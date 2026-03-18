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

	// Prepare chart data
	const DRIVER_COLORS = [
		'#FF6384', '#36A2EB', '#FFCE56', '#4BC0C0', '#9966FF',
		'#FF9F40', '#FF6384', '#C9CBCF', '#7BC8F6', '#0EAD69',
		'#DD3497', '#8856a7'
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
			<h1 class="text-3xl font-bold text-foreground">Stats</h1>
			<p class="text-muted-foreground mt-1">Driver and constructor standings</p>
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
					<Trophy class="h-5 w-5 text-yellow-500" />
					<CardTitle>Driver Standings</CardTitle>
				</div>
			</CardHeader>
			<CardContent>
				<div class="space-y-1">
					{#each data.driverStandings as driver, i}
						<a
							href="/profile/{driver.userId}"
							class="flex items-center gap-3 rounded-lg p-2 hover:bg-accent/50 transition-colors"
						>
							<span
								class="flex h-7 w-7 items-center justify-center rounded-full text-xs font-bold {i === 0
									? 'bg-yellow-500 text-white'
									: i === 1
										? 'bg-gray-400 text-white'
										: i === 2
											? 'bg-amber-700 text-white'
											: 'bg-muted text-muted-foreground'}"
							>
								{i + 1}
							</span>
							<Avatar src={driver.avatarUrl} fallback={driver.username} class="h-8 w-8" />
							<div class="flex-1">
								<p class="text-sm font-medium">{driver.username}</p>
								<p class="text-xs text-muted-foreground">
									{driver.wins}W {driver.podiums}P {driver.dnfs}D &middot; {driver.totalRaces} races
								</p>
							</div>
							<span class="text-sm font-bold">{driver.totalPoints} pts</span>
						</a>
					{/each}
				</div>
			</CardContent>
		</Card>

		<!-- Constructor Standings -->
		<Card>
			<CardHeader>
				<div class="flex items-center gap-2">
					<Users class="h-5 w-5 text-primary" />
					<CardTitle>Constructor Standings</CardTitle>
				</div>
			</CardHeader>
			<CardContent>
				<div class="space-y-2">
					{#each data.constructorStandings as team, i}
						<div class="flex items-center gap-3 rounded-lg p-2">
							<span
								class="flex h-7 w-7 items-center justify-center rounded-full text-xs font-bold {i === 0
									? 'bg-yellow-500 text-white'
									: i === 1
										? 'bg-gray-400 text-white'
										: i === 2
											? 'bg-amber-700 text-white'
											: 'bg-muted text-muted-foreground'}"
							>
								{i + 1}
							</span>
							<div
								class="h-6 w-6 rounded-full"
								style="background-color: {team.teamColor}"
							></div>
							<div class="flex-1">
								<p class="text-sm font-medium">{team.teamName}</p>
								<p class="text-xs text-muted-foreground">{team.totalRaces} entries</p>
							</div>
							<span class="text-sm font-bold">{team.totalPoints} pts</span>
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
