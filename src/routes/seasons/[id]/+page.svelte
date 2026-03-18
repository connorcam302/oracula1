<script lang="ts">
	import { invalidateAll } from '$app/navigation';
	import { Card, CardContent, CardHeader, CardTitle } from '$lib/components/ui/card';
	import { Button } from '$lib/components/ui/button';
	import { Badge } from '$lib/components/ui/badge';
	import { Avatar } from '$lib/components/ui/avatar';
	import { Separator } from '$lib/components/ui/separator';
	import {
		ArrowLeft,
		Plus,
		Flag,
		Trash2,
		ChevronLeft,
		ChevronRight,
		Users,
		UserPlus
	} from 'lucide-svelte';

	let { data } = $props();

	let showAddRace = $state(false);
	let showAddTeamMember = $state(false);
	let selectedTrack = $state('');
	let roundNumber = $derived(data.races.length + 1);
	let scheduledDate = $state('');
	let addingRace = $state(false);

	let selectedUser = $state('');
	let selectedTeam = $state('');
	let addingMember = $state(false);

	async function addRace() {
		if (!selectedTrack) return;
		addingRace = true;
		try {
			const res = await fetch(`/api/seasons/${data.season.id}/races`, {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({
					trackId: parseInt(selectedTrack),
					roundNumber,
					scheduledDate: scheduledDate || null
				})
			});
			if (res.ok) {
				showAddRace = false;
				selectedTrack = '';
				scheduledDate = '';
				await invalidateAll();
				roundNumber = data.races.length + 1;
			}
		} finally {
			addingRace = false;
		}
	}

	async function deleteRace(raceId: number) {
		if (!confirm('Delete this race and all its results?')) return;
		await fetch(`/api/races/${raceId}`, { method: 'DELETE' });
		await invalidateAll();
	}

	async function addTeamMember() {
		if (!selectedUser || !selectedTeam) return;
		addingMember = true;
		try {
			const res = await fetch(`/api/seasons/${data.season.id}/races`, {
				method: 'PUT',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({
					action: 'addTeamMember',
					userId: selectedUser,
					teamId: parseInt(selectedTeam)
				})
			});
			if (res.ok) {
				showAddTeamMember = false;
				selectedUser = '';
				selectedTeam = '';
				await invalidateAll();
			}
		} finally {
			addingMember = false;
		}
	}
</script>

<div class="p-6 space-y-6">
	<!-- Header -->
	<div class="flex items-center gap-4">
		<a href="/seasons">
			<Button variant="ghost" size="icon">
				<ArrowLeft class="h-5 w-5" />
			</Button>
		</a>
		<div>
			<h1 class="text-3xl font-bold text-foreground">{data.season.name}</h1>
			<p class="text-muted-foreground">{data.season.year} Season</p>
		</div>
	</div>

	<div class="grid grid-cols-1 gap-6 lg:grid-cols-3">
		<!-- Races List -->
		<div class="lg:col-span-2 space-y-4">
			<Card>
				<CardHeader>
					<div class="flex items-center justify-between">
						<CardTitle>Races ({data.totalRaces})</CardTitle>
						<Button size="sm" onclick={() => (showAddRace = !showAddRace)}>
							<Plus class="h-4 w-4 mr-1" />
							Add Race
						</Button>
					</div>
				</CardHeader>
				<CardContent>
					{#if showAddRace}
						<div class="mb-4 rounded-lg border border-border p-4 space-y-3">
							<div class="grid grid-cols-1 gap-3 sm:grid-cols-3">
								<div>
									<label for="race-track" class="block text-sm font-medium mb-1">Track</label>
									<select
										id="race-track"
										bind:value={selectedTrack}
										class="w-full rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground"
									>
										<option value="">Select track...</option>
										{#each data.tracks as track}
											<option value={track.id}>{track.name} ({track.country})</option>
										{/each}
									</select>
								</div>
								<div>
									<label for="race-round" class="block text-sm font-medium mb-1">Round</label>
									<input
										id="race-round"
										type="number"
										bind:value={roundNumber}
										min="1"
										class="w-full rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground"
									/>
								</div>
								<div>
									<label for="race-date" class="block text-sm font-medium mb-1">Date</label>
									<input
										id="race-date"
										type="date"
										bind:value={scheduledDate}
										class="w-full rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground"
									/>
								</div>
							</div>
							<div class="flex gap-2">
								<Button size="sm" onclick={addRace} disabled={addingRace || !selectedTrack}>
									{addingRace ? 'Adding...' : 'Add Race'}
								</Button>
								<Button size="sm" variant="ghost" onclick={() => (showAddRace = false)}>
									Cancel
								</Button>
							</div>
						</div>
					{/if}

					<div class="space-y-2">
						{#each data.races as race}
							<div
								class="flex items-center justify-between rounded-lg border border-border p-3 hover:bg-accent/50 transition-colors"
							>
								<a
									href="/seasons/{data.season.id}/races/{race.id}"
									class="flex-1 flex items-center gap-3"
								>
									<span
										class="flex h-8 w-8 items-center justify-center rounded-full bg-muted text-xs font-bold"
									>
										R{race.roundNumber}
									</span>
									<div>
										<p class="font-medium text-sm">{race.trackName}</p>
										<p class="text-xs text-muted-foreground">{race.trackCountry}</p>
									</div>
									{#if race.scheduledDate}
										<span class="text-xs text-muted-foreground ml-auto mr-4">
											{race.scheduledDate}
										</span>
									{/if}
									{#if race.isCompleted}
										<Badge variant="default" class="text-xs">Completed</Badge>
									{:else}
										<Badge variant="outline" class="text-xs">Upcoming</Badge>
									{/if}
								</a>
								<button
									onclick={() => deleteRace(race.id)}
									class="ml-2 rounded p-1 text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"
								>
									<Trash2 class="h-4 w-4" />
								</button>
							</div>
						{/each}

						{#if data.races.length === 0}
							<div class="text-center py-8">
								<Flag class="h-8 w-8 text-muted-foreground mx-auto mb-2" />
								<p class="text-sm text-muted-foreground">No races added yet</p>
							</div>
						{/if}
					</div>

					<!-- Pagination -->
					{#if data.totalPages > 1}
						<div class="flex items-center justify-center gap-2 mt-4">
							<a href="/seasons/{data.season.id}?page={Math.max(1, data.page - 1)}">
								<Button variant="outline" size="sm" disabled={data.page === 1}>
									<ChevronLeft class="h-4 w-4" />
								</Button>
							</a>
							<span class="text-sm text-muted-foreground">
								Page {data.page} of {data.totalPages}
							</span>
							<a href="/seasons/{data.season.id}?page={Math.min(data.totalPages, data.page + 1)}">
								<Button variant="outline" size="sm" disabled={data.page === data.totalPages}>
									<ChevronRight class="h-4 w-4" />
								</Button>
							</a>
						</div>
					{/if}
				</CardContent>
			</Card>
		</div>

		<!-- Teams Sidebar -->
		<div class="space-y-4">
			<Card>
				<CardHeader>
					<div class="flex items-center justify-between">
						<CardTitle class="text-base">Teams</CardTitle>
						<Button
							size="sm"
							variant="ghost"
							onclick={() => (showAddTeamMember = !showAddTeamMember)}
						>
							<UserPlus class="h-4 w-4" />
						</Button>
					</div>
				</CardHeader>
				<CardContent>
					{#if showAddTeamMember}
						<div class="mb-4 space-y-3 rounded-lg border border-border p-3">
							<div>
								<label for="team-user" class="block text-xs font-medium mb-1">User</label>
								<select
									id="team-user"
									bind:value={selectedUser}
									class="w-full rounded-md border border-input bg-background px-2 py-1.5 text-sm text-foreground"
								>
									<option value="">Select user...</option>
									{#each data.allUsers as user}
										<option value={user.id}>{user.username}</option>
									{/each}
								</select>
							</div>
							<div>
								<label for="team-select" class="block text-xs font-medium mb-1">Team</label>
								<select
									id="team-select"
									bind:value={selectedTeam}
									class="w-full rounded-md border border-input bg-background px-2 py-1.5 text-sm text-foreground"
								>
									<option value="">Select team...</option>
									{#each data.allTeams as team}
										<option value={team.id}>{team.name}</option>
									{/each}
								</select>
							</div>
							<Button size="sm" onclick={addTeamMember} disabled={addingMember}>
								{addingMember ? 'Adding...' : 'Assign'}
							</Button>
						</div>
					{/if}

					{@const teamGroups = data.teamMembers.reduce(
						(acc: Record<string, typeof data.teamMembers>, m: any) => {
							const key = m.teamName;
							if (!acc[key]) acc[key] = [];
							acc[key].push(m);
							return acc;
						},
						{}
					)}

					<div class="space-y-3">
					{#each Object.entries(teamGroups) as [teamName, members]}
						{@const membersList = members as any[]}
						<div>
							<div class="flex items-center gap-2 mb-1">
								<div
									class="h-3 w-3 rounded-full"
									style="background-color: {membersList[0].teamColor}"
								></div>
								<span class="text-sm font-medium">{teamName}</span>
							</div>
							<div class="ml-5 space-y-1">
								{#each membersList as member}
									<div class="flex items-center gap-2">
										<Avatar
											src={member.avatarUrl}
											fallback={member.username}
											class="h-6 w-6"
										/>
										<span class="text-xs text-muted-foreground">{member.username}</span>
									</div>
								{/each}
							</div>
						</div>
					{/each}

						{#if data.teamMembers.length === 0}
							<div class="text-center py-4">
								<Users class="h-6 w-6 text-muted-foreground mx-auto mb-1" />
								<p class="text-xs text-muted-foreground">No teams assigned</p>
							</div>
						{/if}
					</div>
				</CardContent>
			</Card>
		</div>
	</div>
</div>
