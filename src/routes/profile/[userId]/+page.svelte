<script lang="ts">
	import { Card, CardContent, CardHeader, CardTitle } from '$lib/components/ui/card';
	import { Badge } from '$lib/components/ui/badge';
	import { Avatar } from '$lib/components/ui/avatar';
	import { formatPosition } from '$lib/points';
	import { Trophy, Flag, Medal, Skull, TrendingUp, Star, ArrowLeft } from 'lucide-svelte';
	import { Button } from '$lib/components/ui/button';

	let { data } = $props();
</script>

<div class="p-6 space-y-6">
	<!-- Profile Header -->
	<div class="flex items-center gap-4">
		<a href="/">
			<Button variant="ghost" size="icon">
				<ArrowLeft class="h-5 w-5" />
			</Button>
		</a>
	</div>

	<Card>
		<CardContent class="p-6">
			<div class="flex items-center gap-6">
				<Avatar
					src={data.profile.avatarUrl}
					fallback={data.profile.username}
					class="h-20 w-20 text-2xl"
				/>
				<div>
					<h1 class="text-3xl font-bold text-foreground">{data.profile.username}</h1>
					<div class="flex items-center gap-2 mt-1">
						{#if data.profile.claimed}
							<Badge variant="default">Claimed</Badge>
						{:else}
							<Badge variant="secondary">Unclaimed</Badge>
						{/if}
					</div>
				</div>
			</div>
		</CardContent>
	</Card>

	<!-- Stats Grid -->
	<div class="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6">
		<Card>
			<CardContent class="p-4 text-center">
				<Flag class="h-5 w-5 text-blue-500 mx-auto mb-1" />
				<p class="text-2xl font-bold">{data.stats.totalRaces}</p>
				<p class="text-xs text-muted-foreground">Races</p>
			</CardContent>
		</Card>

		<Card>
			<CardContent class="p-4 text-center">
				<Trophy class="h-5 w-5 text-yellow-500 mx-auto mb-1" />
				<p class="text-2xl font-bold">{data.stats.wins}</p>
				<p class="text-xs text-muted-foreground">Wins</p>
			</CardContent>
		</Card>

		<Card>
			<CardContent class="p-4 text-center">
				<Medal class="h-5 w-5 text-amber-600 mx-auto mb-1" />
				<p class="text-2xl font-bold">{data.stats.podiums}</p>
				<p class="text-xs text-muted-foreground">Podiums</p>
			</CardContent>
		</Card>

		<Card>
			<CardContent class="p-4 text-center">
				<TrendingUp class="h-5 w-5 text-green-500 mx-auto mb-1" />
				<p class="text-2xl font-bold">{data.stats.totalPoints}</p>
				<p class="text-xs text-muted-foreground">Points</p>
			</CardContent>
		</Card>

		<Card>
			<CardContent class="p-4 text-center">
				<Skull class="h-5 w-5 text-red-500 mx-auto mb-1" />
				<p class="text-2xl font-bold">{data.stats.dnfs}</p>
				<p class="text-xs text-muted-foreground">DNFs</p>
			</CardContent>
		</Card>

		<Card>
			<CardContent class="p-4 text-center">
				<Star class="h-5 w-5 text-purple-500 mx-auto mb-1" />
				<p class="text-2xl font-bold">
					{data.stats.bestFinish ? `P${data.stats.bestFinish}` : '-'}
				</p>
				<p class="text-xs text-muted-foreground">Best Finish</p>
			</CardContent>
		</Card>
	</div>

	<!-- Race History -->
	<Card>
		<CardHeader>
			<CardTitle>Race History</CardTitle>
		</CardHeader>
		<CardContent>
			<div class="space-y-1">
				{#each data.results as result}
					<a
						href="/seasons/{result.seasonId}/races/{result.raceId}"
						class="flex items-center gap-3 rounded-lg p-3 hover:bg-accent/50 transition-colors"
					>
						<!-- Position -->
						<div class="w-12 text-center">
							<span
								class="text-sm font-bold {result.dnf
									? 'text-destructive'
									: result.position === 1
										? 'text-yellow-500'
										: result.position && result.position <= 3
											? 'text-amber-600'
											: 'text-foreground'}"
							>
								{formatPosition(result.position, result.dnf)}
							</span>
						</div>

						<!-- Team color -->
						{#if result.teamColor}
							<div
								class="w-1 h-8 rounded-full"
								style="background-color: {result.teamColor}"
							></div>
						{/if}

						<!-- Race info -->
						<div class="flex-1">
							<p class="text-sm font-medium">{result.trackName}</p>
							<p class="text-xs text-muted-foreground">
								{result.seasonName} &middot; Round {result.roundNumber}
							</p>
						</div>

						<!-- Team & Points -->
						<div class="text-right">
							{#if result.teamName}
								<p class="text-xs text-muted-foreground">{result.teamName}</p>
							{/if}
							<p class="text-sm font-bold">{result.points} pts</p>
						</div>
					</a>
				{/each}

				{#if data.results.length === 0}
					<div class="text-center py-12">
						<Flag class="h-10 w-10 text-muted-foreground mx-auto mb-3" />
						<p class="text-muted-foreground">No race results yet</p>
					</div>
				{/if}
			</div>
		</CardContent>
	</Card>
</div>
