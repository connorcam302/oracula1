<script lang="ts">
	import { Card, CardContent, CardHeader, CardTitle } from '$lib/components/ui/card';
	import { Button } from '$lib/components/ui/button';
	import { Badge } from '$lib/components/ui/badge';
	import { Trophy, Plus, ChevronRight } from 'lucide-svelte';

	let { data } = $props();
</script>

<div class="p-6 space-y-6">
	<div class="flex items-center justify-between">
		<div>
			<h1 class="font-display text-3xl font-bold tracking-tight leading-none text-foreground">Seasons</h1>
			<p class="text-xs text-muted-foreground mt-2 uppercase tracking-widest font-medium">Manage your F1 race seasons</p>
		</div>
		<a href="/seasons/create">
			<Button>
				<Plus class="h-4 w-4 mr-2" />
				New Season
			</Button>
		</a>
	</div>

	<div class="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
		{#each data.seasons as season}
			{@const isComplete = Number(season.completedRaces) === Number(season.raceCount) && Number(season.raceCount) > 0}
			{@const inProgress = Number(season.completedRaces) > 0 && !isComplete}
			<a href="/seasons/{season.id}" class="group">
				<Card class="transition-all hover:shadow-md {isComplete ? 'border-gold/30' : inProgress ? 'border-blue/20' : ''}">
					<CardHeader>
						<div class="flex items-center justify-between">
							<div class="flex items-center gap-3">
								<div class="rounded-lg p-2 {isComplete ? 'bg-gold/10' : inProgress ? 'bg-blue/10' : 'bg-primary/10'}">
									<Trophy class="h-5 w-5 {isComplete ? 'text-gold' : inProgress ? 'text-blue' : 'text-primary'}" />
								</div>
								<div>
									<CardTitle class="text-lg">{season.name}</CardTitle>
									<p class="text-sm text-muted-foreground">{season.year}</p>
								</div>
							</div>
							<ChevronRight
								class="h-5 w-5 text-muted-foreground group-hover:text-foreground transition-colors"
							/>
						</div>
					</CardHeader>
					<CardContent>
						<div class="flex items-center gap-2">
							<Badge variant="secondary">
								{season.completedRaces}/{season.raceCount} races
							</Badge>
							{#if isComplete}
								<Badge variant="gold">Complete</Badge>
							{:else if inProgress}
								<Badge variant="blue">In Progress</Badge>
							{/if}
						</div>
					</CardContent>
				</Card>
			</a>
		{/each}

		{#if data.seasons.length === 0}
			<div class="col-span-full text-center py-12">
				<Trophy class="h-12 w-12 text-gold/50 mx-auto mb-4" />
				<p class="text-lg font-medium text-muted-foreground">No seasons yet</p>
				<p class="text-sm text-muted-foreground mt-1">Create your first season to get started</p>
				<a href="/seasons/create" class="mt-4 inline-block">
					<Button>Create Season</Button>
				</a>
			</div>
		{/if}
	</div>
</div>
