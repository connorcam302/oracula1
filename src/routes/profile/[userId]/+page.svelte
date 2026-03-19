<script lang="ts">
	import { invalidateAll } from '$app/navigation';
	import { Card, CardContent, CardHeader, CardTitle } from '$lib/components/ui/card';
	import { Badge } from '$lib/components/ui/badge';
	import { Avatar } from '$lib/components/ui/avatar';
	import { Button } from '$lib/components/ui/button';
	import { formatPosition } from '$lib/points';
	import { Trophy, Flag, Medal, Skull, TrendingUp, Star, ArrowLeft, Pencil, Check, X } from 'lucide-svelte';

	let { data } = $props();

	// ── Username editing ──────────────────────────────────
	let editingUsername = $state(false);
	let usernameInput = $state(data.profile.username);
	let usernameError = $state('');
	let savingUsername = $state(false);

	async function saveUsername() {
		savingUsername = true;
		usernameError = '';
		try {
			const res = await fetch('/api/user', {
				method: 'PATCH',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ username: usernameInput })
			});
			const result = await res.json();
			if (!res.ok) {
				usernameError = result.error || 'Failed to update username';
				return;
			}
			editingUsername = false;
			await invalidateAll();
		} finally {
			savingUsername = false;
		}
	}

	function cancelEdit() {
		usernameInput = data.profile.username;
		usernameError = '';
		editingUsername = false;
	}

	// ── Filter / sort ─────────────────────────────────────
	let filterSeason = $state('');
	let sortBy = $state<'date' | 'position' | 'points'>('date');
	let sortDir = $state<'asc' | 'desc'>('desc');

	const allSeasons = $derived(
		[...new Map(data.results.map((r: any) => [r.seasonId, r.seasonName])).entries()]
	);

	const filteredResults = $derived(
		(() => {
			let list = [...data.results];

			if (filterSeason) {
				list = list.filter((r: any) => String(r.seasonId) === filterSeason);
			}

			list.sort((a: any, b: any) => {
				let cmp = 0;
				if (sortBy === 'date') {
					const ad = a.scheduledDate ?? '';
					const bd = b.scheduledDate ?? '';
					cmp = ad < bd ? -1 : ad > bd ? 1 : 0;
				} else if (sortBy === 'position') {
					// DNFs go last, nulls go last
					const ap = a.dnf ? 999 : (a.position ?? 998);
					const bp = b.dnf ? 999 : (b.position ?? 998);
					cmp = ap - bp;
				} else if (sortBy === 'points') {
					cmp = a.points - b.points;
				}
				return sortDir === 'desc' ? -cmp : cmp;
			});

			return list;
		})()
	);

	function toggleSort(col: 'date' | 'position' | 'points') {
		if (sortBy === col) {
			sortDir = sortDir === 'asc' ? 'desc' : 'asc';
		} else {
			sortBy = col;
			sortDir = col === 'position' ? 'asc' : 'desc';
		}
	}

	function sortIcon(col: 'date' | 'position' | 'points') {
		if (sortBy !== col) return '↕';
		return sortDir === 'asc' ? '↑' : '↓';
	}

	const isOwner = $derived(data.currentUserId === data.profile.id);
</script>

<div class="p-6 space-y-6">
	<!-- Back -->
	<div class="flex items-center gap-4">
		<a href="/">
			<Button variant="ghost" size="icon">
				<ArrowLeft class="h-5 w-5" />
			</Button>
		</a>
	</div>

	<!-- Profile header -->
	<Card>
		<CardContent class="p-6">
			<div class="flex items-center gap-6">
				<Avatar
					src={data.profile.avatarUrl}
					fallback={data.profile.username}
					class="h-20 w-20 text-2xl"
				/>
				<div class="flex-1 min-w-0">
					{#if editingUsername}
						<div class="space-y-2">
							<div class="flex items-center gap-2">
								<input
									type="text"
									bind:value={usernameInput}
									maxlength="30"
									class="rounded-md border border-input bg-background px-3 py-1.5 text-xl font-bold text-foreground focus:border-ring focus:outline-none focus:ring-1 focus:ring-ring w-48"
								/>
								<Button size="icon" onclick={saveUsername} disabled={savingUsername} class="h-8 w-8">
									<Check class="h-4 w-4" />
								</Button>
								<Button size="icon" variant="ghost" onclick={cancelEdit} class="h-8 w-8">
									<X class="h-4 w-4" />
								</Button>
							</div>
							{#if usernameError}
								<p class="text-xs text-destructive">{usernameError}</p>
							{/if}
							<p class="text-xs text-muted-foreground">Letters, numbers, underscores only</p>
						</div>
					{:else}
						<div class="flex items-center gap-3">
							<h1 class="font-display text-3xl font-bold tracking-tight leading-none text-foreground truncate">{data.profile.username}</h1>
							{#if isOwner}
								<Button
									size="icon"
									variant="ghost"
									onclick={() => { usernameInput = data.profile.username; editingUsername = true; }}
									class="h-8 w-8 shrink-0"
								>
									<Pencil class="h-4 w-4" />
								</Button>
							{/if}
						</div>
					{/if}
				<div class="flex items-center gap-2 mt-1">
					{#if data.profile.claimed}
						<Badge variant="success">Claimed</Badge>
					{:else}
						<Badge variant="outline">Unclaimed</Badge>
					{/if}
				</div>
				</div>
			</div>
		</CardContent>
	</Card>

	<!-- Stats Grid — each card uses its semantic color -->
	<div class="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6">
		<!-- Races: F1 Red -->
		<Card>
			<CardContent class="p-4 text-center">
				<div class="rounded-lg bg-primary/10 p-2 w-fit mx-auto mb-2">
					<Flag class="h-5 w-5 text-primary" />
				</div>
				<p class="font-display text-2xl font-bold tabular-nums leading-tight">{data.stats.totalRaces}</p>
				<p class="text-xs text-muted-foreground uppercase tracking-widest mt-0.5">Races</p>
			</CardContent>
		</Card>
		<!-- Wins: Championship Gold -->
		<Card class={data.stats.wins > 0 ? 'border-gold/30' : ''}>
			<CardContent class="p-4 text-center">
				<div class="rounded-lg bg-gold/10 p-2 w-fit mx-auto mb-2">
					<Trophy class="h-5 w-5 text-gold" />
				</div>
				<p class="font-display text-2xl font-bold tabular-nums leading-tight {data.stats.wins > 0 ? 'text-gold' : ''}">{data.stats.wins}</p>
				<p class="text-xs text-muted-foreground uppercase tracking-widest mt-0.5">Wins</p>
			</CardContent>
		</Card>
		<!-- Podiums: Amber -->
		<Card>
			<CardContent class="p-4 text-center">
				<div class="rounded-lg bg-amber-500/10 p-2 w-fit mx-auto mb-2">
					<Medal class="h-5 w-5 text-amber-500" />
				</div>
				<p class="font-display text-2xl font-bold tabular-nums leading-tight">{data.stats.podiums}</p>
				<p class="text-xs text-muted-foreground uppercase tracking-widest mt-0.5">Podiums</p>
			</CardContent>
		</Card>
		<!-- Points: Data Blue -->
		<Card>
			<CardContent class="p-4 text-center">
				<div class="rounded-lg bg-blue/10 p-2 w-fit mx-auto mb-2">
					<TrendingUp class="h-5 w-5 text-blue" />
				</div>
				<p class="font-display text-2xl font-bold tabular-nums leading-tight">{data.stats.totalPoints}</p>
				<p class="text-xs text-muted-foreground uppercase tracking-widest mt-0.5">Points</p>
			</CardContent>
		</Card>
		<!-- DNFs: Destructive Red -->
		<Card>
			<CardContent class="p-4 text-center">
				<div class="rounded-lg bg-destructive/10 p-2 w-fit mx-auto mb-2">
					<Skull class="h-5 w-5 text-destructive" />
				</div>
				<p class="font-display text-2xl font-bold tabular-nums leading-tight">{data.stats.dnfs}</p>
				<p class="text-xs text-muted-foreground uppercase tracking-widest mt-0.5">DNFs</p>
			</CardContent>
		</Card>
		<!-- Best Finish: Success Green -->
		<Card>
			<CardContent class="p-4 text-center">
				<div class="rounded-lg bg-success/10 p-2 w-fit mx-auto mb-2">
					<Star class="h-5 w-5 text-success" />
				</div>
				<p class="font-display text-2xl font-bold tabular-nums leading-tight">
					{data.stats.bestFinish ? `P${data.stats.bestFinish}` : '—'}
				</p>
				<p class="text-xs text-muted-foreground uppercase tracking-widest mt-0.5">Best Finish</p>
			</CardContent>
		</Card>
	</div>

	<!-- Race History -->
	<Card>
		<CardHeader>
			<div class="flex flex-wrap items-center justify-between gap-3">
				<CardTitle>Race History</CardTitle>
				<div class="flex flex-wrap items-center gap-2">
					<!-- Season filter -->
					<select
						bind:value={filterSeason}
						class="rounded-md border border-input bg-background px-3 py-1.5 text-sm text-foreground"
					>
						<option value="">All Seasons</option>
						{#each allSeasons as [id, name]}
							<option value={String(id)}>{name}</option>
						{/each}
					</select>

					<!-- Sort buttons -->
					<button
						onclick={() => toggleSort('date')}
						class="rounded-md border border-input px-3 py-1.5 text-xs transition-colors {sortBy === 'date' ? 'bg-primary text-primary-foreground border-primary' : 'bg-background text-foreground hover:bg-accent'}"
					>
						Date {sortIcon('date')}
					</button>
					<button
						onclick={() => toggleSort('position')}
						class="rounded-md border border-input px-3 py-1.5 text-xs transition-colors {sortBy === 'position' ? 'bg-primary text-primary-foreground border-primary' : 'bg-background text-foreground hover:bg-accent'}"
					>
						Position {sortIcon('position')}
					</button>
					<button
						onclick={() => toggleSort('points')}
						class="rounded-md border border-input px-3 py-1.5 text-xs transition-colors {sortBy === 'points' ? 'bg-primary text-primary-foreground border-primary' : 'bg-background text-foreground hover:bg-accent'}"
					>
						Points {sortIcon('points')}
					</button>
				</div>
			</div>
		</CardHeader>
		<CardContent>
			<div class="space-y-1">
				{#each filteredResults as result}
					<a
						href="/seasons/{result.seasonId}/races/{result.raceId}"
						class="flex items-center gap-3 rounded-lg p-3 transition-colors hover:bg-accent {result.position === 1 && !result.dnf ? 'bg-gold/5' : result.dnf ? 'bg-destructive/5' : ''}"
					>
						<!-- Position -->
						<div class="w-10 text-center shrink-0">
							{#if !result.dnf && result.position === 1}
								<span class="flex h-7 w-7 mx-auto items-center justify-center rounded-full bg-gold/15 text-xs font-extrabold text-gold">
									{formatPosition(result.position, result.dnf)}
								</span>
							{:else if !result.dnf && result.position === 2}
								<span class="flex h-7 w-7 mx-auto items-center justify-center rounded-full bg-[#B5C0C8]/20 text-xs font-bold text-[#B5C0C8]">
									{formatPosition(result.position, result.dnf)}
								</span>
							{:else if !result.dnf && result.position === 3}
								<span class="flex h-7 w-7 mx-auto items-center justify-center rounded-full bg-amber-700/15 text-xs font-bold text-amber-600">
									{formatPosition(result.position, result.dnf)}
								</span>
							{:else}
								<span class="text-sm font-bold {result.dnf ? 'text-destructive' : 'text-foreground'}">
									{formatPosition(result.position, result.dnf)}
								</span>
							{/if}
						</div>

						<!-- Team color -->
						{#if result.teamColor}
							<div class="w-1 h-8 rounded-full shrink-0" style="background-color: {result.teamColor}"></div>
						{/if}

						<!-- Race info -->
						<div class="flex-1 min-w-0">
							<p class="text-sm font-medium truncate">{result.trackName}</p>
							<p class="text-xs text-muted-foreground">
								{result.seasonName} &middot; Round {result.roundNumber}
							</p>
						</div>

						<!-- Team & Points -->
						<div class="text-right shrink-0">
							{#if result.teamName}
								<p class="text-xs text-muted-foreground">{result.teamName}</p>
							{/if}
							<p class="text-sm font-bold tabular-nums {result.position === 1 && !result.dnf ? 'text-gold' : ''}">{result.points} pts</p>
						</div>
					</a>
				{/each}

				{#if filteredResults.length === 0}
					<div class="text-center py-12">
						<Flag class="h-10 w-10 text-primary/30 mx-auto mb-3" />
						<p class="text-muted-foreground">
							{filterSeason ? 'No results for this season' : 'No race results yet'}
						</p>
					</div>
				{/if}
			</div>
		</CardContent>
	</Card>
</div>
