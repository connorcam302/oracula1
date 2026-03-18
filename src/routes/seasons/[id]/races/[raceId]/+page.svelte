<script lang="ts">
	import { invalidateAll } from '$app/navigation';
	import { Card, CardContent, CardHeader, CardTitle } from '$lib/components/ui/card';
	import { Button } from '$lib/components/ui/button';
	import { Badge } from '$lib/components/ui/badge';
	import { Avatar } from '$lib/components/ui/avatar';
	import { formatPosition, getPoints } from '$lib/points';
	import { ArrowLeft, Plus, Trophy, CheckCircle, XCircle } from 'lucide-svelte';

	let { data } = $props();

	let showAddResult = $state(false);
	let selectedUser = $state('');
	let position = $state(1);
	let isDnf = $state(false);
	let selectedTeam = $state('');
	let addingResult = $state(false);

	// When user changes, auto-fill team from season assignment
	$effect(() => {
		if (selectedUser && data.userTeamMap[selectedUser]) {
			selectedTeam = String(data.userTeamMap[selectedUser]);
		}
	});

	async function addResult() {
		if (!selectedUser) return;
		addingResult = true;
		try {
			const res = await fetch(`/api/races/${data.race.id}/results`, {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({
					userId: selectedUser,
					position: isDnf ? null : position,
					dnf: isDnf,
					teamId: selectedTeam ? parseInt(selectedTeam) : null
				})
			});
			if (res.ok) {
				showAddResult = false;
				selectedUser = '';
				isDnf = false;
				position = data.results.length + 1;
				await invalidateAll();
			}
		} finally {
			addingResult = false;
		}
	}

	async function markCompleted() {
		await fetch(`/api/races/${data.race.id}`, {
			method: 'PATCH',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({ isCompleted: true })
		});
		await invalidateAll();
	}

	async function deleteResult(resultId: number) {
		if (!confirm('Remove this result?')) return;
		await fetch(`/api/races/${data.race.id}/results`, {
			method: 'DELETE',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({ resultId })
		});
		await invalidateAll();
	}

	function getPositionColor(pos: number | null, dnf: boolean): string {
		if (dnf) return 'text-destructive';
		if (pos === 1) return 'text-yellow-500';
		if (pos === 2) return 'text-gray-400';
		if (pos === 3) return 'text-amber-700';
		return 'text-foreground';
	}
</script>

<div class="p-6 space-y-6">
	<!-- Header -->
	<div class="flex items-center gap-4">
		<a href="/seasons/{data.season.id}">
			<Button variant="ghost" size="icon">
				<ArrowLeft class="h-5 w-5" />
			</Button>
		</a>
		<div class="flex-1">
			<h1 class="text-2xl font-bold text-foreground">
				Round {data.race.roundNumber} - {data.race.trackName}
			</h1>
			<p class="text-muted-foreground">
				{data.season.name} &middot; {data.race.trackCountry}
				{#if data.race.scheduledDate}
					&middot; {data.race.scheduledDate}
				{/if}
			</p>
		</div>
		<div class="flex items-center gap-2">
			{#if data.race.isCompleted}
				<Badge variant="default">
					<CheckCircle class="h-3 w-3 mr-1" />
					Completed
				</Badge>
			{:else}
				<Button size="sm" onclick={markCompleted}>
					<CheckCircle class="h-4 w-4 mr-1" />
					Mark Completed
				</Button>
			{/if}
		</div>
	</div>

	<!-- Results -->
	<Card>
		<CardHeader>
			<div class="flex items-center justify-between">
				<CardTitle>Race Results</CardTitle>
				<Button size="sm" onclick={() => (showAddResult = !showAddResult)}>
					<Plus class="h-4 w-4 mr-1" />
					Add Result
				</Button>
			</div>
		</CardHeader>
		<CardContent>
			{#if showAddResult}
				<div class="mb-6 rounded-lg border border-border p-4 space-y-3">
					<div class="grid grid-cols-1 gap-3 sm:grid-cols-4">
						<div>
							<label for="result-driver" class="block text-sm font-medium mb-1">Driver</label>
							<select
								id="result-driver"
								bind:value={selectedUser}
								class="w-full rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground"
							>
								<option value="">Select driver...</option>
								{#each data.allUsers as user}
									<option value={user.id}>{user.username}</option>
								{/each}
							</select>
						</div>
						<div>
							<label for="result-position" class="block text-sm font-medium mb-1">Position</label>
							<input
								id="result-position"
								type="number"
								bind:value={position}
								min="1"
								max="20"
								disabled={isDnf}
								class="w-full rounded-md border border-input bg-background px-3 py-2 text-sm disabled:opacity-50"
							/>
						</div>
						<div>
							<label for="result-team" class="block text-sm font-medium mb-1">Team</label>
							<select
								id="result-team"
								bind:value={selectedTeam}
								class="w-full rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground"
							>
								<option value="">No team</option>
								{#each data.allTeams as team}
									<option value={team.id}>{team.name}</option>
								{/each}
							</select>
						</div>
						<div class="flex items-end">
							<label class="flex items-center gap-2 cursor-pointer">
								<input type="checkbox" bind:checked={isDnf} class="rounded" />
								<span class="text-sm font-medium">DNF</span>
							</label>
						</div>
					</div>
					<div class="flex gap-2">
						<Button size="sm" onclick={addResult} disabled={addingResult || !selectedUser}>
							{addingResult ? 'Adding...' : 'Add Result'}
						</Button>
						<Button size="sm" variant="ghost" onclick={() => (showAddResult = false)}>
							Cancel
						</Button>
					</div>
				</div>
			{/if}

			<!-- Results Table -->
			<div class="space-y-1">
				{#each data.results.sort((a: any, b: any) => {
					if (a.dnf && !b.dnf) return 1;
					if (!a.dnf && b.dnf) return -1;
					if (a.position === null) return 1;
					if (b.position === null) return -1;
					return a.position - b.position;
				}) as result, i}
					<div
						class="flex items-center gap-3 rounded-lg p-3 hover:bg-accent/50 transition-colors"
					>
						<!-- Position -->
						<div class="w-12 text-center">
							<span class="text-lg font-bold {getPositionColor(result.position, result.dnf)}">
								{formatPosition(result.position, result.dnf)}
							</span>
						</div>

						<!-- Team Color Bar -->
						{#if result.teamColor}
							<div class="w-1 h-10 rounded-full" style="background-color: {result.teamColor}"></div>
						{/if}

						<!-- Driver Info -->
						<Avatar src={result.avatarUrl} fallback={result.username} class="h-8 w-8" />
						<div class="flex-1">
							<a href="/profile/{result.userId}" class="font-medium text-sm hover:underline">
								{result.username}
							</a>
							{#if result.teamName}
								<p class="text-xs text-muted-foreground">{result.teamName}</p>
							{/if}
						</div>

						<!-- Points -->
						<div class="text-right">
							{#if result.dnf}
								<Badge variant="destructive" class="text-xs">
									<XCircle class="h-3 w-3 mr-1" />
									DNF
								</Badge>
							{:else}
								<span class="text-sm font-bold">{result.points} pts</span>
							{/if}
						</div>

						<!-- Delete -->
						<button
							onclick={() => deleteResult(result.id)}
							class="rounded p-1 text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"
						>
							<XCircle class="h-4 w-4" />
						</button>
					</div>
				{/each}

				{#if data.results.length === 0}
					<div class="text-center py-12">
						<Trophy class="h-10 w-10 text-muted-foreground mx-auto mb-3" />
						<p class="text-muted-foreground">No results recorded yet</p>
						<p class="text-sm text-muted-foreground mt-1">
							Add driver results to record this race
						</p>
					</div>
				{/if}
			</div>
		</CardContent>
	</Card>
</div>
