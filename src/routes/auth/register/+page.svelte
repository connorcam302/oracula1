<script lang="ts">
	import { signIn } from '@auth/sveltekit/client';
	import { goto } from '$app/navigation';

	let username = $state('');
	let email = $state('');
	let password = $state('');
	let confirmPassword = $state('');
	let error = $state('');
	let loading = $state(false);

	async function handleRegister(e: Event) {
		e.preventDefault();
		loading = true;
		error = '';

		if (password !== confirmPassword) {
			error = 'Passwords do not match';
			loading = false;
			return;
		}

		if (password.length < 6) {
			error = 'Password must be at least 6 characters';
			loading = false;
			return;
		}

		try {
			const res = await fetch('/api/auth/register', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ username, email, password })
			});

			const data = await res.json();

			if (!res.ok) {
				error = data.error || 'Registration failed';
				loading = false;
				return;
			}

			// Auto sign in after registration
			const result = await signIn('credentials', {
				email,
				password,
				redirect: false,
				callbackUrl: '/'
			});

			if (result?.error) {
				error = 'Account created but sign-in failed. Try signing in manually.';
				loading = false;
				return;
			}

			if (result?.url) {
				window.location.href = result.url;
			} else {
				window.location.href = '/';
			}
		} catch (err) {
			error = 'An error occurred during registration';
		} finally {
			loading = false;
		}
	}
</script>

<div class="flex min-h-screen items-center justify-center bg-background">
	<div class="w-full max-w-md space-y-8 rounded-xl border border-border bg-card p-8 shadow-lg">
		<div class="text-center">
			<h1 class="text-3xl font-bold text-foreground">Register</h1>
			<p class="mt-2 text-muted-foreground">Create your Oracula account</p>
		</div>

		{#if error}
			<div class="rounded-lg bg-destructive/10 p-3 text-sm text-destructive">
				{error}
			</div>
		{/if}

		<form onsubmit={handleRegister} class="space-y-4">
			<div>
				<label for="username" class="block text-sm font-medium text-foreground">Username</label>
				<input
					id="username"
					type="text"
					bind:value={username}
					required
					class="mt-1 block w-full rounded-md border border-input bg-background px-3 py-2 text-foreground shadow-sm focus:border-ring focus:outline-none focus:ring-1 focus:ring-ring"
					placeholder="YourUsername"
				/>
			</div>

			<div>
				<label for="email" class="block text-sm font-medium text-foreground">Email</label>
				<input
					id="email"
					type="email"
					bind:value={email}
					required
					class="mt-1 block w-full rounded-md border border-input bg-background px-3 py-2 text-foreground shadow-sm focus:border-ring focus:outline-none focus:ring-1 focus:ring-ring"
					placeholder="you@example.com"
				/>
			</div>

			<div>
				<label for="password" class="block text-sm font-medium text-foreground">Password</label>
				<input
					id="password"
					type="password"
					bind:value={password}
					required
					minlength="6"
					class="mt-1 block w-full rounded-md border border-input bg-background px-3 py-2 text-foreground shadow-sm focus:border-ring focus:outline-none focus:ring-1 focus:ring-ring"
					placeholder="••••••••"
				/>
			</div>

			<div>
				<label for="confirmPassword" class="block text-sm font-medium text-foreground"
					>Confirm Password</label
				>
				<input
					id="confirmPassword"
					type="password"
					bind:value={confirmPassword}
					required
					class="mt-1 block w-full rounded-md border border-input bg-background px-3 py-2 text-foreground shadow-sm focus:border-ring focus:outline-none focus:ring-1 focus:ring-ring"
					placeholder="••••••••"
				/>
			</div>

			<button
				type="submit"
				disabled={loading}
				class="w-full rounded-md bg-primary px-4 py-2 text-primary-foreground shadow-sm hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-ring disabled:opacity-50"
			>
				{loading ? 'Creating account...' : 'Create Account'}
			</button>
		</form>

		<p class="text-center text-sm text-muted-foreground">
			Already have an account?
			<a href="/auth/signin" class="font-medium text-primary hover:underline">Sign in</a>
		</p>
	</div>
</div>
