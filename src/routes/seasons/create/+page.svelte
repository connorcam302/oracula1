<script lang="ts">
	import { goto } from '$app/navigation';
	import { Card, CardContent, CardHeader, CardTitle } from '$lib/components/ui/card';
	import { Button } from '$lib/components/ui/button';
	import { ArrowLeft } from 'lucide-svelte';

	let name = $state('');
	let error = $state('');
	let loading = $state(false);

	async function handleCreate(e: Event) {
		e.preventDefault();
		loading = true;
		error = '';

		try {
			const res = await fetch('/api/seasons', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ name })
			});

			const data = await res.json();

			if (!res.ok) {
				error = data.error || 'Failed to create season';
				loading = false;
				return;
			}

			goto(`/seasons/${data.id}`);
		} catch (err) {
			error = 'An error occurred';
			loading = false;
		}
	}
</script>

<div class="p-6 max-w-2xl mx-auto space-y-6">
	<div class="flex items-center gap-4">
		<a href="/seasons">
			<Button variant="ghost" size="icon">
				<ArrowLeft class="h-5 w-5" />
			</Button>
		</a>
		<h1 class="text-3xl font-bold text-foreground">Create Season</h1>
	</div>

	<Card>
		<CardHeader>
			<CardTitle>Season Details</CardTitle>
		</CardHeader>
		<CardContent>
			{#if error}
				<div class="mb-4 rounded-lg bg-destructive/10 p-3 text-sm text-destructive">
					{error}
				</div>
			{/if}

			<form onsubmit={handleCreate} class="space-y-4">
				<div>
					<label for="name" class="block text-sm font-medium text-foreground">Season Name</label>
					<input
						id="name"
						type="text"
						bind:value={name}
						required
						class="mt-1 block w-full rounded-md border border-input bg-background px-3 py-2 text-foreground shadow-sm focus:border-ring focus:outline-none focus:ring-1 focus:ring-ring"
						placeholder="e.g. Bornana Season 8"
					/>
				</div>

				<div class="flex gap-3">
					<Button type="submit" disabled={loading}>
						{loading ? 'Creating...' : 'Create Season'}
					</Button>
					<a href="/seasons">
						<Button variant="outline" type="button">Cancel</Button>
					</a>
				</div>
			</form>
		</CardContent>
	</Card>
</div>
