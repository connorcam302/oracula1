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

	// Verify current user exists in DB (Google sign-in may not have persisted them yet)
	const [currentUser] = await db.select().from(users).where(eq(users.id, currentUserId)).limit(1);
	if (!currentUser) {
		return json({ error: `Your account (${currentUserId}) does not exist in the database. Try signing out and back in.` }, { status: 400 });
	}

	try {
		await db.transaction(async (tx) => {
			// Transfer all race results from placeholder to current user
			await tx
				.update(raceResults)
				.set({ userId: currentUserId })
				.where(eq(raceResults.userId, placeholderUserId));

			// Transfer team memberships
			await tx
				.update(seasonTeamMembers)
				.set({ userId: currentUserId })
				.where(eq(seasonTeamMembers.userId, placeholderUserId));

			// Delete the placeholder user now that all data has been transferred
			await tx.delete(users).where(eq(users.id, placeholderUserId));

			// Update the current user's username to the placeholder's if they have an auto-generated one
			if (!currentUser.username || currentUser.username === currentUser.email) {
				await tx
					.update(users)
					.set({ username: placeholder.username })
					.where(eq(users.id, currentUserId));
			}
		});
	} catch (err) {
		console.error('Claim failed:', err);
		return json({ error: 'Failed to claim profile: ' + (err instanceof Error ? err.message : String(err)) }, { status: 500 });
	}

	return json({ success: true });
};
