<script lang="ts">
	import { goto } from '$app/navigation';
	import { page } from '$app/stores';
	import { Card, CardContent, CardHeader, CardTitle } from '$lib/components/ui/card';
	import { Badge } from '$lib/components/ui/badge';
	import { Button } from '$lib/components/ui/button';
	import { Flag, ChevronLeft, ChevronRight, X } from 'lucide-svelte';
	import { countryToFlag } from '$lib/utils';

	let { data } = $props();

	type Sort = 'season_desc' | 'date_desc' | 'date_asc' | 'round_desc' | 'round_asc';
	type Status = 'all' | 'completed' | 'upcoming';

	function buildUrl(overrides: Record<string, string | number | null> = {}) {
		const params = new URLSearchParams();
		const season = overrides.season ?? data.filters.seasonId;
		const status = (overrides.status ?? data.filters.status) as Status;
		const sort = (overrides.sort ?? data.filters.sort) as Sort;
		const pageNum = overrides.page ?? data.pagination.page;

		// Explicitly remove season if null/empty — allows clearing the filter
		if (season == null || season === '') {
			params.delete('season');
		} else {
			params.set('season', String(season));
		}
		if (status !== 'all') params.set('status', status);
		if (sort !== 'season_desc') params.set('sort', sort);
		if (Number(pageNum) > 1) params.set('page', String(pageNum));
		return `/races${params.size ? '?' + params.toString() : ''}`;
	}

	function setFilter(key: string, value: string | number | null) {
		goto(buildUrl({ [key]: value, page: 1 }), { keepFocus: true });
	}

	function clearFilters() {
		goto('/races');
	}

	const hasActiveFilters = $derived(
		data.filters.seasonId !== null || data.filters.status !== 'all' || data.filters.sort !== 'date_desc'
	);

	const sortOptions: { value: Sort; label: string }[] = [
		{ value: 'season_desc', label: 'Season' },
		{ value: 'date_desc', label: 'Date (newest)' },
		{ value: 'date_asc', label: 'Date (oldest)' },
		{ value: 'round_desc', label: 'Round (high→low)' },
		{ value: 'round_asc', label: 'Round (low→high)' }
	];

	const statusOptions: { value: Status; label: string }[] = [
		{ value: 'all', label: 'All' },
		{ value: 'completed', label: 'Completed' },
		{ value: 'upcoming', label: 'Upcoming' }
	];
</script>

<div class="p-6 space-y-6">
	<div>
		<h1 class="font-display text-3xl font-bold tracking-tight leading-none text-foreground">Races</h1>
		<p class="text-xs text-muted-foreground mt-2 uppercase tracking-widest font-medium">
			{data.pagination.total} race{data.pagination.total === 1 ? '' : 's'} across all seasons
		</p>
	</div>

	<Card>
		<CardContent class="p-4">
			<div class="flex flex-wrap items-center gap-3">
				<!-- Season filter -->
				<div class="flex items-center gap-2">
					<label for="season-filter" class="text-xs text-muted-foreground uppercase tracking-widest font-medium whitespace-nowrap">Season</label>
					<select
						id="season-filter"
						onchange={(e) => setFilter('season', (e.target as HTMLSelectElement).value || null)}
						value={data.filters.seasonId ?? ''}
						class="rounded-md border border-input bg-background px-3 py-1.5 text-sm text-foreground"
					>
						<option value="">All Seasons</option>
						{#each data.seasons as season}
							<option value={season.id}>{season.name} ({season.year})</option>
						{/each}
					</select>
				</div>

				<!-- Status filter — tab-style buttons -->
				<div class="flex items-center gap-1">
					{#each statusOptions as opt}
						<button
							onclick={() => setFilter('status', opt.value)}
							class="rounded-md border px-3 py-1.5 text-xs font-medium transition-colors {data.filters.status === opt.value
								? 'bg-primary text-primary-foreground border-primary'
								: 'bg-background text-foreground border-input hover:bg-accent'}"
						>
							{opt.label}
						</button>
					{/each}
				</div>

				<!-- Sort -->
				<div class="flex items-center gap-2 ml-auto">
					<label for="sort-filter" class="text-xs text-muted-foreground uppercase tracking-widest font-medium whitespace-nowrap">Sort</label>
					<select
						id="sort-filter"
						onchange={(e) => setFilter('sort', (e.target as HTMLSelectElement).value)}
						value={data.filters.sort}
						class="rounded-md border border-input bg-background px-3 py-1.5 text-sm text-foreground"
					>
						{#each sortOptions as opt}
							<option value={opt.value}>{opt.label}</option>
						{/each}
					</select>
				</div>

				<!-- Clear filters -->
				{#if hasActiveFilters}
					<button
						onclick={clearFilters}
						class="flex items-center gap-1 rounded-md border border-input px-2 py-1.5 text-xs text-muted-foreground hover:text-foreground hover:bg-accent transition-colors"
					>
						<X class="h-3 w-3" />
						Clear
					</button>
				{/if}
			</div>
		</CardContent>
	</Card>

	<!-- Race list -->
	{#if data.races.length > 0}
		<div class="space-y-1">
			{#each data.races as race}
				<a
					href="/seasons/{race.seasonId}/races/{race.id}"
					class="flex items-center gap-4 rounded-lg p-3 transition-colors hover:bg-accent {race.isCompleted ? 'border border-transparent' : 'border border-blue/20 bg-blue/5 hover:bg-blue/10'}"
				>
					<!-- Round badge -->
					<div class="w-14 shrink-0 text-center">
						<p class="font-display text-xs font-bold text-muted-foreground uppercase tracking-wider">Rnd</p>
						<p class="font-display text-lg font-bold leading-tight {race.isCompleted ? 'text-foreground' : 'text-blue'}">{race.roundNumber}</p>
					</div>

					<!-- Track & Season -->
					<div class="flex-1 min-w-0">
						<p class="text-sm font-semibold truncate">{countryToFlag(race.trackCountry)} {race.trackName}</p>
						<p class="text-xs text-muted-foreground truncate">{race.seasonName}</p>
					</div>

					<!-- Date -->
					<div class="shrink-0 text-right">
						<p class="text-xs text-muted-foreground">
							{race.scheduledDate ?? 'TBD'}
						</p>
					</div>

					<!-- Status badge -->
					<div class="shrink-0">
						{#if race.isCompleted}
							<Badge variant="success" class="text-xs">Completed</Badge>
						{:else}
							<Badge variant="blue" class="text-xs">Upcoming</Badge>
						{/if}
					</div>
				</a>
			{/each}
		</div>
	{:else}
		<Card>
			<CardContent class="flex flex-col items-center justify-center py-12">
				<Flag class="h-10 w-10 text-primary/30 mb-3" />
				<p class="text-muted-foreground">No races match your filters</p>
				{#if hasActiveFilters}
					<Button variant="ghost" size="sm" onclick={clearFilters} class="mt-2">
						Clear filters
					</Button>
				{/if}
			</CardContent>
		</Card>
	{/if}

	<!-- Pagination -->
	{#if data.pagination.totalPages > 1}
		<div class="flex items-center justify-center gap-2">
			<a
				href={buildUrl({ page: data.pagination.page - 1 })}
				class="flex items-center gap-1 rounded-md border border-input px-3 py-1.5 text-sm text-muted-foreground hover:bg-accent hover:text-foreground transition-colors {data.pagination.page <= 1 ? 'pointer-events-none opacity-40' : ''}"
			>
				<ChevronLeft class="h-4 w-4" />
				Prev
			</a>

			<span class="text-xs text-muted-foreground px-2">
				Page {data.pagination.page} of {data.pagination.totalPages}
			</span>

			<a
				href={buildUrl({ page: data.pagination.page + 1 })}
				class="flex items-center gap-1 rounded-md border border-input px-3 py-1.5 text-sm text-muted-foreground hover:bg-accent hover:text-foreground transition-colors {data.pagination.page >= data.pagination.totalPages ? 'pointer-events-none opacity-40' : ''}"
			>
				Next
				<ChevronRight class="h-4 w-4" />
			</a>
		</div>
	{/if}
</div>
