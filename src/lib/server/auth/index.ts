import { SvelteKitAuth } from '@auth/sveltekit';
import Google from '@auth/sveltekit/providers/google';
import Credentials from '@auth/sveltekit/providers/credentials';
import { db } from '$lib/server/db';
import { users } from '$lib/server/db/schema';
import bcrypt from 'bcryptjs';
import { eq } from 'drizzle-orm';
import type { Provider } from '@auth/sveltekit/providers';
import { env } from '$env/dynamic/private';

const providers: Provider[] = [
	Credentials({
		name: 'credentials',
		credentials: {
			email: { label: 'Email', type: 'email' },
			password: { label: 'Password', type: 'password' }
		},
		async authorize(credentials) {
			if (!credentials?.email || !credentials?.password) return null;

			const email = credentials.email as string;
			const password = credentials.password as string;

			const [user] = await db.select().from(users).where(eq(users.email, email)).limit(1);

			if (!user || !user.passwordHash) return null;

			const isValid = await bcrypt.compare(password, user.passwordHash);
			if (!isValid) return null;

			return {
				id: user.id,
				name: user.username,
				email: user.email,
				image: user.avatarUrl
			};
		}
	})
];

// Only add Google provider if credentials are configured
if (env.AUTH_GOOGLE_ID && env.AUTH_GOOGLE_SECRET) {
	providers.unshift(Google);
}

export const { handle, signIn, signOut } = SvelteKitAuth({
	// NOTE: No adapter - Credentials provider is incompatible with DB adapters.
	// User creation/lookup is handled manually in authorize() and the register endpoint.
	providers,
	session: {
		strategy: 'jwt'
	},
	callbacks: {
		async jwt({ token, user }) {
			if (user) {
				token.id = user.id;
				token.name = user.name;
				token.email = user.email;
				token.picture = user.image;
			}
			return token;
		},
		async session({ session, token }) {
			if (session.user) {
				session.user.id = token.id as string;
				session.user.name = token.name as string;
				session.user.email = token.email as string;
				session.user.image = token.picture as string;
			}
			return session;
		}
	},
	pages: {
		signIn: '/auth/signin',
		error: '/auth/signin'
	},
	trustHost: true
});
