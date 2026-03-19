<script lang="ts">
	import { invalidateAll, goto } from '$app/navigation';
	import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '$lib/components/ui/card';
	import { Button } from '$lib/components/ui/button';
	import { Avatar } from '$lib/components/ui/avatar';
	import { Badge } from '$lib/components/ui/badge';
	import { UserCheck, ArrowLeft, AlertCircle, Sparkles } from 'lucide-svelte';

	let { data } = $props();

	let claiming = $state('');
	let error = $state('');
	let continuing = $state(false);

	async function claimProfile(placeholderUserId: string) {
		if (!confirm('Claim this profile? All race data will be transferred to your account. This cannot be undone.')) {
			return;
		}

		claiming = placeholderUserId;
		error = '';

		try {
			const res = await fetch('/api/claim', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ placeholderUserId })
			});

			const result = await res.json();

			if (!res.ok) {
				error = result.error || 'Failed to claim profile';
				claiming = '';
				return;
			}

			goto(`/profile/${data.currentUserId}`);
		} catch (err) {
			error = 'An error occurred';
			claiming = '';
		}
	}

	async function continueAsNew() {
		continuing = true;
		error = '';

		try {
			const res = await fetch('/api/claim', {
				method: 'PATCH'
			});

			const result = await res.json();

			if (!res.ok) {
				error = result.error || 'Failed to continue';
				continuing = false;
				return;
			}

			await invalidateAll();
			goto(`/profile/${data.currentUserId}`);
		} catch (err) {
			error = 'An error occurred';
			continuing = false;
		}
	}
</script>

<div class="p-6 max-w-3xl mx-auto space-y-6">
	<div class="flex items-center gap-4">
		<div>
			<h1 class="text-3xl font-bold text-foreground">Claim Profile</h1>
			<p class="text-muted-foreground mt-1">
				Choose a profile to inherit or start fresh with your new account
			</p>
		</div>
	</div>

	{#if error}
		<div class="rounded-lg bg-destructive/10 p-3 text-sm text-destructive flex items-center gap-2">
			<AlertCircle class="h-4 w-4" />
			{error}
		</div>
	{/if}

	<Card>
		<CardHeader>
			<CardTitle>Available Profiles</CardTitle>
			<CardDescription>
				Select a placeholder profile to claim. All their race results, team assignments, and
				stats will be transferred to your account.
			</CardDescription>
		</CardHeader>
		<CardContent>
			{#if data.unclaimedUsers.length === 0}
				<div class="text-center py-8">
					<UserCheck class="h-10 w-10 text-muted-foreground mx-auto mb-3" />
					<p class="text-muted-foreground mb-4">All profiles have been claimed</p>
					<p class="text-sm text-muted-foreground">You can still continue with your new account below.</p>
				</div>
			{:else}
				<div class="grid grid-cols-1 gap-3 sm:grid-cols-2">
					{#each data.unclaimedUsers as user}
						<div
							class="flex items-center gap-3 rounded-lg border border-border p-4 hover:bg-accent/50 transition-colors"
						>
							<Avatar src={user.avatarUrl} fallback={user.username} class="h-12 w-12" />
							<div class="flex-1">
								<p class="font-medium">{user.username}</p>
								<Badge variant="secondary" class="mt-1 text-xs">Unclaimed</Badge>
							</div>
							<Button
								size="sm"
								onclick={() => claimProfile(user.id)}
								disabled={claiming === user.id}
							>
								{#if claiming === user.id}
									Claiming...
								{:else}
									<UserCheck class="h-4 w-4 mr-1" />
									Claim
								{/if}
							</Button>
						</div>
					{/each}
				</div>
			{/if}
		</CardContent>
	</Card>

	<Card>
		<CardHeader>
			<CardTitle>Or continue as a new account</CardTitle>
			<CardDescription>
				Start fresh with no race history. You can still view seasons and stats.
			</CardDescription>
		</CardHeader>
		<CardContent>
			<Button
				variant="outline"
				onclick={continueAsNew}
				disabled={continuing}
				class="w-full"
			>
				{#if continuing}
					Setting up...
				{:else}
					<Sparkles class="h-4 w-4 mr-2" />
					Continue as New Account
				{/if}
			</Button>
		</CardContent>
	</Card>
</div>
