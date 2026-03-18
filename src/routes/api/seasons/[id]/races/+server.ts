import { json } from '@sveltejs/kit';
import { db } from '$lib/server/db';
import { races, seasonTeamMembers } from '$lib/server/db/schema';
import type { RequestHandler } from './$types';

export const POST: RequestHandler = async ({ request, params, locals }) => {
	const session = await locals.auth?.();
	if (!session?.user) {
		return json({ error: 'Unauthorized' }, { status: 401 });
	}

	const seasonId = parseInt(params.id);
	const { trackId, roundNumber, scheduledDate } = await request.json();

	if (!trackId || !roundNumber) {
		return json({ error: 'Track and round number are required' }, { status: 400 });
	}

	const [race] = await db
		.insert(races)
		.values({
			seasonId,
			trackId,
			roundNumber,
			scheduledDate: scheduledDate || null,
			isCompleted: false
		})
		.returning();

	return json(race);
};

export const PUT: RequestHandler = async ({ request, params, locals }) => {
	const session = await locals.auth?.();
	if (!session?.user) {
		return json({ error: 'Unauthorized' }, { status: 401 });
	}

	const seasonId = parseInt(params.id);
	const { action, userId, teamId } = await request.json();

	if (action === 'addTeamMember') {
		if (!userId || !teamId) {
			return json({ error: 'User and team are required' }, { status: 400 });
		}

		const [member] = await db
			.insert(seasonTeamMembers)
			.values({
				seasonId,
				userId,
				teamId
			})
			.returning();

		return json(member);
	}

	return json({ error: 'Invalid action' }, { status: 400 });
};
