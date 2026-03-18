import { SvelteKitAuth } from '@auth/sveltekit';
import Google from '@auth/sveltekit/providers/google';
import Credentials from '@auth/sveltekit/providers/credentials';
import { DrizzleAdapter } from '@auth/drizzle-adapter';
import { db } from '$lib/server/db';
import { users, accounts, sessions, verificationTokens } from '$lib/server/db/schema';
import bcrypt from 'bcryptjs';
import { eq } from 'drizzle-orm';
import type { Provider } from '@auth/sveltekit/providers';

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
if (process.env.AUTH_GOOGLE_ID && process.env.AUTH_GOOGLE_SECRET) {
	providers.unshift(Google);
}

export const { handle, signIn, signOut } = SvelteKitAuth({
	adapter: DrizzleAdapter(db, {
		usersTable: users,
		accountsTable: accounts,
		sessionsTable: sessions,
		verificationTokensTable: verificationTokens
	}),
	providers,
	session: {
		strategy: 'jwt'
	},
	callbacks: {
		async jwt({ token, user }) {
			if (user) {
				token.id = user.id;
			}
			return token;
		},
		async session({ session, token }) {
			if (session.user && token.id) {
				session.user.id = token.id as string;
			}
			return session;
		}
	},
	pages: {
		signIn: '/auth/signin'
	},
	trustHost: true
});
