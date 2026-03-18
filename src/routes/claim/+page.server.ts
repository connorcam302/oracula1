import type { PageServerLoad } from './$types';
import { db } from '$lib/server/db';
import { users } from '$lib/server/db/schema';
import { eq, asc } from 'drizzle-orm';
import { redirect } from '@sveltejs/kit';

export const load: PageServerLoad = async ({ locals }) => {
	const session = await locals.auth?.();
	if (!session?.user) {
		throw redirect(302, '/auth/signin');
	}

	// Get unclaimed placeholder users
	const unclaimedUsers = await db
		.select({
			id: users.id,
			username: users.username,
			avatarUrl: users.avatarUrl
		})
		.from(users)
		.where(eq(users.claimed, false))
		.orderBy(asc(users.username));

	return {
		unclaimedUsers,
		currentUserId: session.user.id
	};
};
