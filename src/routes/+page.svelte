<script lang="ts">
	import { Card, CardContent, CardHeader, CardTitle } from '$lib/components/ui/card';
	import { Avatar } from '$lib/components/ui/avatar';
	import { Button } from '$lib/components/ui/button';
	import { Trophy, Flag, Users, TrendingUp } from 'lucide-svelte';

	let { data } = $props();
</script>

<div class="p-6 space-y-6">
	<div>
		<h1 class="text-3xl font-bold text-foreground">Welcome to Oracula</h1>
		<p class="text-muted-foreground mt-1">F1 Race Tracking with Friends</p>
	</div>

	<!-- Stats Overview -->
	<div class="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
		<Card>
			<CardContent class="p-6">
				<div class="flex items-center gap-4">
					<div class="rounded-lg bg-primary/10 p-3">
						<Trophy class="h-6 w-6 text-primary" />
					</div>
					<div>
						<p class="text-sm text-muted-foreground">Total Seasons</p>
						<p class="text-2xl font-bold">{data.totalSeasons}</p>
					</div>
				</div>
			</CardContent>
		</Card>

		<Card>
			<CardContent class="p-6">
				<div class="flex items-center gap-4">
					<div class="rounded-lg bg-green-500/10 p-3">
						<Flag class="h-6 w-6 text-green-500" />
					</div>
					<div>
						<p class="text-sm text-muted-foreground">Races Completed</p>
						<p class="text-2xl font-bold">{data.totalRaces}</p>
					</div>
				</div>
			</CardContent>
		</Card>

		<Card>
			<CardContent class="p-6">
				<div class="flex items-center gap-4">
					<div class="rounded-lg bg-blue-500/10 p-3">
						<Users class="h-6 w-6 text-blue-500" />
					</div>
					<div>
						<p class="text-sm text-muted-foreground">Latest Season</p>
						<p class="text-lg font-bold truncate">{data.latestSeason?.name || 'N/A'}</p>
					</div>
				</div>
			</CardContent>
		</Card>

		<Card>
			<CardContent class="p-6">
				<div class="flex items-center gap-4">
					<div class="rounded-lg bg-orange-500/10 p-3">
						<TrendingUp class="h-6 w-6 text-orange-500" />
					</div>
					<div>
						<p class="text-sm text-muted-foreground">Top Driver</p>
						<p class="text-lg font-bold truncate">
							{data.topDrivers[0]?.username || 'N/A'}
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
				<CardTitle>Top Drivers (All-Time)</CardTitle>
			</CardHeader>
			<CardContent>
				<div class="space-y-3">
					{#each data.topDrivers as driver, i}
						<a
							href="/profile/{driver.userId}"
							class="flex items-center gap-3 rounded-lg p-2 hover:bg-accent transition-colors"
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
								<p class="text-xs text-muted-foreground">{driver.totalRaces} races</p>
							</div>
							<span class="text-sm font-bold">{driver.totalPoints} pts</span>
						</a>
					{/each}
				</div>
			</CardContent>
		</Card>

		<!-- Recent Races -->
		<Card>
			<CardHeader>
				<div class="flex items-center justify-between">
					<CardTitle>Recent Races</CardTitle>
					<a href="/seasons">
						<Button variant="outline" size="sm">View All</Button>
					</a>
				</div>
			</CardHeader>
			<CardContent>
				<div class="space-y-3">
					{#each data.recentRaces as race}
						<a
							href="/seasons/{race.seasonId}/races/{race.id}"
							class="flex items-center justify-between rounded-lg p-2 hover:bg-accent transition-colors"
						>
							<div>
								<p class="text-sm font-medium">Round {race.roundNumber}</p>
								<p class="text-xs text-muted-foreground">{race.seasonName}</p>
							</div>
							<div class="text-right">
								<p class="text-xs text-muted-foreground">{race.scheduledDate || ''}</p>
								{#if race.isCompleted}
									<span
										class="inline-flex items-center rounded-full bg-green-500/10 px-2 py-0.5 text-xs text-green-600"
									>
										Completed
									</span>
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
						<Trophy class="h-4 w-4 mr-2" />
						View Seasons
					</Button>
				</a>
				<a href="/stats">
					<Button variant="outline">
						<TrendingUp class="h-4 w-4 mr-2" />
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
