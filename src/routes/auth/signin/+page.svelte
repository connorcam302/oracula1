<script lang="ts">
	import { signIn } from '@auth/sveltekit/client';
	import { page } from '$app/stores';

	let email = $state('');
	let password = $state('');
	let error = $state('');
	let loading = $state(false);

	// Show error from URL params (Auth.js redirects with ?error=...)
	$effect(() => {
		const urlError = $page.url.searchParams.get('error');
		if (urlError) {
			if (urlError === 'CredentialsSignin') {
				error = 'Invalid email or password';
			} else {
				error = 'An error occurred during sign in';
			}
		}
	});

	async function handleCredentialsLogin(e: Event) {
		e.preventDefault();
		loading = true;
		error = '';

		try {
			// redirect: false so we can handle errors client-side
			const result = await signIn('credentials', {
				email,
				password,
				redirect: false,
				callbackUrl: '/'
			});

			if (result?.error) {
				error = 'Invalid email or password';
				loading = false;
				return;
			}

			// Success - redirect manually
			if (result?.url) {
				window.location.href = result.url;
			} else {
				window.location.href = '/';
			}
		} catch (err) {
			error = 'Invalid email or password';
			loading = false;
		}
	}

	function handleGoogleLogin() {
		signIn('google', { callbackUrl: '/' });
	}
</script>

<div class="flex min-h-full flex-1 items-center justify-center p-6">
	<div class="w-full max-w-md space-y-8 rounded-xl border border-border bg-card p-8 shadow-lg">
		<div class="text-center">
			<h1 class="text-3xl font-bold text-foreground">Sign In</h1>
			<p class="mt-2 text-muted-foreground">Welcome back to Oracula</p>
		</div>

		{#if error}
			<div class="rounded-lg bg-destructive/10 p-3 text-sm text-destructive">
				{error}
			</div>
		{/if}

		<form onsubmit={handleCredentialsLogin} class="space-y-4">
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
					class="mt-1 block w-full rounded-md border border-input bg-background px-3 py-2 text-foreground shadow-sm focus:border-ring focus:outline-none focus:ring-1 focus:ring-ring"
					placeholder="••••••••"
				/>
			</div>

			<button
				type="submit"
				disabled={loading}
				class="w-full rounded-md bg-primary px-4 py-2 text-primary-foreground shadow-sm hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-ring disabled:opacity-50"
			>
				{loading ? 'Signing in...' : 'Sign In'}
			</button>
		</form>

		<div class="relative">
			<div class="absolute inset-0 flex items-center">
				<div class="w-full border-t border-border"></div>
			</div>
			<div class="relative flex justify-center text-sm">
				<span class="bg-card px-2 text-muted-foreground">Or continue with</span>
			</div>
		</div>

		<button
			onclick={handleGoogleLogin}
			class="flex w-full items-center justify-center gap-3 rounded-md border border-border bg-background px-4 py-2 text-foreground shadow-sm hover:bg-accent"
		>
			<svg class="h-5 w-5" viewBox="0 0 24 24">
				<path
					d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z"
					fill="#4285F4"
				/>
				<path
					d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
					fill="#34A853"
				/>
				<path
					d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
					fill="#FBBC05"
				/>
				<path
					d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
					fill="#EA4335"
				/>
			</svg>
			Sign in with Google
		</button>

		<p class="text-center text-sm text-muted-foreground">
			Don't have an account?
			<a href="/auth/register" class="font-medium text-primary hover:underline">Register</a>
		</p>
	</div>
</div>
