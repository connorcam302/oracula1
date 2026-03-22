<script lang="ts">
	import { invalidateAll } from '$app/navigation';
	import { Card, CardContent, CardHeader, CardTitle } from '$lib/components/ui/card';
	import {
		Dialog,
		DialogContent,
		DialogHeader,
		DialogTitle,
		DialogFooter,
	} from '$lib/components/ui/dialog';
	import { Button } from '$lib/components/ui/button';
	import { Badge } from '$lib/components/ui/badge';
	import { Avatar } from '$lib/components/ui/avatar';
	import { Tooltip, TooltipTrigger, TooltipContent } from '$lib/components/ui/tooltip';
	import { formatPosition, getPoints } from '$lib/points';
	import { countryToFlag } from '$lib/utils';
	import { ArrowLeft, Plus, Trophy, CheckCircle, XCircle, X } from 'lucide-svelte';

	let { data } = $props();

	let showAddResult = $state(false);
	let selectedUser = $state('');
	let position = $state(1);
	let qualPos = $state<number | undefined>(undefined);
	let isDnf = $state(false);
	let selectedTeam = $state('');
	let addingResult = $state(false);

	// Inline qualifying edit state
	let editingQualFor = $state<string | null>(null); // userId whose qual is being edited
	let editQualPos = $state<number | undefined>(undefined);
	let savingQual = $state(false);

	// Map userId -> qualifying position
	const qualMap = $derived(
		Object.fromEntries((data.qualifying as any[]).map((q) => [q.userId, q.position]))
	);

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
				// Also save qualifying if provided
				if (qualPos) {
					await fetch(`/api/races/${data.race.id}/qualifying`, {
						method: 'POST',
						headers: { 'Content-Type': 'application/json' },
						body: JSON.stringify({ userId: selectedUser, position: qualPos })
					});
				}
				showAddResult = false;
				selectedUser = '';
				isDnf = false;
				qualPos = undefined;
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
		if (!confirm('Delete this result? This cannot be undone.')) return;
		await fetch(`/api/races/${data.race.id}/results`, {
			method: 'DELETE',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({ resultId })
		});
		await invalidateAll();
	}

	function startEditQual(userId: string) {
		editingQualFor = userId;
		editQualPos = qualMap[userId] ?? undefined;
	}

	async function saveQual(userId: string) {
		if (!editQualPos) return;
		savingQual = true;
		try {
			await fetch(`/api/races/${data.race.id}/qualifying`, {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ userId, position: editQualPos })
			});
			editingQualFor = null;
			await invalidateAll();
		} finally {
			savingQual = false;
		}
	}

	async function clearQual(userId: string) {
		await fetch(`/api/races/${data.race.id}/qualifying`, {
			method: 'DELETE',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({ userId })
		});
		editingQualFor = null;
		await invalidateAll();
	}

	function getPositionColor(pos: number | null, dnf: boolean): string {
		if (dnf) return 'text-destructive';
		if (pos === 1) return 'text-gold font-extrabold';
		if (pos === 2) return 'text-[#B5C0C8] font-bold';
		if (pos === 3) return 'text-amber-600 font-bold';
		return 'text-foreground';
	}

	function getRowHighlight(pos: number | null, dnf: boolean): string {
		if (dnf) return 'bg-destructive/5';
		if (pos === 1) return 'bg-gold/5';
		return '';
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
			<h1 class="font-display text-2xl font-bold tracking-tight leading-none text-foreground">
				Round {data.race.roundNumber} — {countryToFlag(data.race.trackCountry)} {data.race.trackName}
			</h1>
			<p class="text-xs text-muted-foreground mt-1.5 uppercase tracking-widest font-medium">
				{data.season.name}
				{#if data.race.scheduledDate}
					&middot; {data.race.scheduledDate}
				{/if}
			</p>
		</div>
		<div class="flex items-center gap-2">
			{#if data.race.isCompleted}
				<Badge variant="success">
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
				<Button size="sm" onclick={() => (showAddResult = true)}>
					<Plus class="h-4 w-4 mr-1" />
					Add Result
				</Button>
			</div>
		</CardHeader>
		<CardContent class="p-0">
			{@const allDnf = data.results.length > 0 && data.results.every((r: any) => r.dnf)}
			{#if data.results.length === 0}
				<div class="text-center py-12 px-6">
					<Trophy class="h-10 w-10 text-gold/40 mx-auto mb-3" />
					<p class="text-muted-foreground">No results recorded yet</p>
					<p class="text-sm text-muted-foreground mt-1">
						Use "Add Result" above to log finishing positions
					</p>
				</div>
			{:else}
				{#if allDnf && data.race.isCompleted}
					<div class="flex items-center gap-3 px-4 py-3 border-b border-border/50 bg-destructive/5">
						<XCircle class="h-4 w-4 text-destructive shrink-0" />
						<p class="text-sm text-destructive font-medium">Everyone retired — no finishers this race</p>
					</div>
				{/if}
				<div class="divide-y divide-border/50">
					{#each data.results.sort((a: any, b: any) => {
						if (a.dnf && !b.dnf) return 1;
						if (!a.dnf && b.dnf) return -1;
						if (a.position === null) return 1;
						if (b.position === null) return -1;
						return a.position - b.position;
					}) as result}
						{@const isUser = result.userId === data.currentUserId}
						{@const isP1 = !result.dnf && result.position === 1}
						<div
							class="flex items-center gap-3 px-4 py-3.5 transition-colors
								{isP1 ? 'bg-gold/5' : ''}
								{result.dnf ? 'bg-destructive/5' : ''}
								{isUser && !isP1 && !result.dnf ? 'bg-blue/5' : ''}
								hover:bg-accent/40"
						>
							<!-- Position bubble — consistent for all finishers -->
							<div class="shrink-0 flex justify-center" style="width: 2.25rem">
								{#if result.dnf}
									<span class="h-8 w-8 flex items-center justify-center rounded-full bg-destructive/15 text-[10px] font-bold tracking-tight text-destructive">
										DNF
									</span>
								{:else if result.position === 1}
									<span class="h-9 w-9 flex items-center justify-center rounded-full bg-gold text-gold-foreground text-sm font-extrabold tabular-nums shadow-sm">
										1
									</span>
								{:else if result.position === 2}
									<span class="h-8 w-8 flex items-center justify-center rounded-full bg-[#B5C0C8] text-[#1a1a1a] text-sm font-bold tabular-nums">
										2
									</span>
								{:else if result.position === 3}
									<span class="h-8 w-8 flex items-center justify-center rounded-full bg-amber-700 text-white text-sm font-bold tabular-nums">
										3
									</span>
								{:else}
									<span class="h-7 w-7 flex items-center justify-center rounded-full bg-muted text-muted-foreground text-xs font-semibold tabular-nums">
										{result.position}
									</span>
								{/if}
							</div>

							<!-- Team Color Bar -->
							{#if result.teamColor}
								<Tooltip>
									<TooltipTrigger>
										<div class="w-1 self-stretch rounded-full shrink-0" style="background-color: {result.teamColor}"></div>
									</TooltipTrigger>
									<TooltipContent>{result.teamName}</TooltipContent>
								</Tooltip>
							{:else}
								<div class="w-1 shrink-0"></div>
							{/if}

							<!-- Driver Info -->
							<Avatar src={result.avatarUrl} fallback={result.username} class="h-8 w-8 shrink-0" />
							<div class="flex-1 min-w-0">
								<a
									href="/profile/{result.userId}"
									class="font-semibold text-sm hover:underline truncate block {result.dnf ? 'text-muted-foreground line-through' : ''}"
								>
									{result.username}
								</a>
								{#if result.teamName}
									<p class="text-xs text-muted-foreground truncate">{result.teamName}</p>
								{/if}
							</div>

							<!-- Delete -->
							{#if isUser}
								<button
									onclick={() => deleteResult(result.id)}
									class="shrink-0 rounded p-1.5 text-muted-foreground/30 hover:text-destructive hover:bg-destructive/10 transition-colors"
								>
									<X class="h-3.5 w-3.5" />
								</button>
							{:else}
								<div class="w-7 shrink-0"></div>
							{/if}

							<!-- Qualifying position -->
							<div class="shrink-0">
								{#if editingQualFor === result.userId}
									<div class="flex items-center gap-1">
										<input
											type="number"
											bind:value={editQualPos}
											min="1"
											max="20"
											placeholder="1–20"
											class="w-16 rounded border border-blue/40 bg-blue/5 px-2 py-1 text-xs text-center text-blue font-medium focus:outline-none focus:ring-1 focus:ring-blue/40"
											onkeydown={(e) => e.key === 'Enter' && saveQual(result.userId)}
										/>
										<button
											onclick={() => saveQual(result.userId)}
											disabled={savingQual}
											class="rounded p-1 text-xs text-blue/70 hover:text-blue"
										>✓</button>
										<button
											onclick={() => (editingQualFor = null)}
											class="rounded p-1 text-xs text-muted-foreground hover:text-foreground"
										>✕</button>
									</div>
								{:else if qualMap[result.userId]}
									<Tooltip>
										<TooltipTrigger>
											<button
												onclick={() => startEditQual(result.userId)}
												class="flex items-center gap-1.5 rounded-md bg-blue/10 border border-blue/20 px-2.5 py-1 hover:bg-blue/15 transition-colors"
											>
												<span class="text-[10px] font-bold uppercase tracking-wider text-blue/60">Q</span>
												<span class="text-sm font-bold tabular-nums text-blue">{qualMap[result.userId]}</span>
											</button>
										</TooltipTrigger>
										<TooltipContent>Qualifying position · click to edit</TooltipContent>
									</Tooltip>
								{:else if isUser}
									<button
										onclick={() => startEditQual(result.userId)}
										class="flex items-center gap-1 rounded-md border border-dashed border-blue/25 px-2.5 py-1 text-blue/30 hover:text-blue/60 hover:border-blue/40 transition-colors"
									>
										<span class="text-[10px] font-bold uppercase tracking-wider">Q</span>
										<span class="text-xs">+</span>
									</button>
								{/if}
							</div>

							<!-- Race points -->
							<div class="shrink-0">
								{#if result.dnf}
									<Badge variant="destructive" class="text-xs">
										<XCircle class="h-3 w-3 mr-1" />
										DNF
									</Badge>
								{:else}
									<span class="font-display font-bold tabular-nums {result.position === 1 ? 'text-gold text-base' : 'text-sm'}">{result.points}</span>
									<span class="text-xs text-muted-foreground ml-0.5">pts</span>
								{/if}
							</div>
						</div>
					{/each}
				</div>
			{/if}
		</CardContent>
	</Card>

	<!-- Add Result Dialog -->
	<Dialog bind:open={showAddResult}>
		<DialogContent class="sm:max-w-lg">
			<DialogHeader>
				<DialogTitle>Add Result</DialogTitle>
			</DialogHeader>
			<div class="space-y-4 py-2">
				<div>
					<label for="result-driver" class="block text-sm font-medium mb-1.5">Driver</label>
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
				<div class="grid grid-cols-2 gap-4">
					<div>
						<label for="result-position" class="block text-sm font-medium mb-1.5">Race position</label>
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
						<label for="result-qual" class="block text-sm font-medium mb-1.5">Qualifying position</label>
						<input
							id="result-qual"
							type="number"
							bind:value={qualPos}
							min="1"
							max="20"
							placeholder="—"
							class="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
						/>
					</div>
				</div>
				<div>
					<label for="result-team" class="block text-sm font-medium mb-1.5">Team</label>
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
				<label class="flex items-center gap-2 cursor-pointer">
					<input type="checkbox" bind:checked={isDnf} class="rounded" />
					<span class="text-sm font-medium">DNF</span>
				</label>
			</div>
			<DialogFooter>
				<Button variant="ghost" onclick={() => (showAddResult = false)}>Cancel</Button>
				<Button onclick={addResult} disabled={addingResult || !selectedUser}>
					{addingResult ? 'Adding...' : 'Add Result'}
				</Button>
			</DialogFooter>
		</DialogContent>
	</Dialog>
</div>
