import { json } from '@sveltejs/kit';
import { db } from '$lib/server/db';
import { users, raceResults, seasonTeamMembers } from '$lib/server/db/schema';
import { eq } from 'drizzle-orm';
import type { RequestHandler } from './$types';

export const POST: RequestHandler = async ({ request, locals }) => {
	const session = await locals.auth?.();
	if (!session?.user?.id) {
		return json({ error: 'Unauthorized' }, { status: 401 });
	}

	const { placeholderUserId } = await request.json();

	if (!placeholderUserId) {
		return json({ error: 'Placeholder user ID is required' }, { status: 400 });
	}

	// Verify the placeholder user exists and is unclaimed
	const [placeholder] = await db
		.select()
		.from(users)
		.where(eq(users.id, placeholderUserId))
		.limit(1);

	if (!placeholder) {
		return json({ error: 'Profile not found' }, { status: 404 });
	}

	if (placeholder.claimed) {
		return json({ error: 'This profile has already been claimed' }, { status: 400 });
	}

	const currentUserId = session.user.id;

	// Transfer all race results from placeholder to current user
	await db
		.update(raceResults)
		.set({ userId: currentUserId })
		.where(eq(raceResults.userId, placeholderUserId));

	// Transfer team memberships
	await db
		.update(seasonTeamMembers)
		.set({ userId: currentUserId })
		.where(eq(seasonTeamMembers.userId, placeholderUserId));

	// Mark the placeholder as claimed
	await db
		.update(users)
		.set({ claimed: true })
		.where(eq(users.id, placeholderUserId));

	// Update the current user's username to the placeholder's if the current user doesn't have a meaningful one
	const [currentUser] = await db
		.select()
		.from(users)
		.where(eq(users.id, currentUserId))
		.limit(1);

	if (currentUser && (!currentUser.username || currentUser.username === currentUser.email)) {
		await db
			.update(users)
			.set({ username: placeholder.username })
			.where(eq(users.id, currentUserId));
	}

	return json({ success: true });
};
