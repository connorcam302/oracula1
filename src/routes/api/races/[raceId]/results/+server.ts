import { json } from '@sveltejs/kit';
import { db } from '$lib/server/db';
import { raceResults } from '$lib/server/db/schema';
import { eq } from 'drizzle-orm';
import { getPoints } from '$lib/points';
import type { RequestHandler } from './$types';

export const POST: RequestHandler = async ({ request, params, locals }) => {
	const session = await locals.auth?.();
	if (!session?.user) {
		return json({ error: 'Unauthorized' }, { status: 401 });
	}

	const raceId = parseInt(params.raceId);
	const { userId, position, dnf, teamId } = await request.json();

	if (!userId) {
		return json({ error: 'User is required' }, { status: 400 });
	}

	const points = dnf ? 0 : getPoints(position);

	const [result] = await db
		.insert(raceResults)
		.values({
			raceId,
			userId,
			position: dnf ? null : position,
			points,
			dnf: dnf || false,
			teamId: teamId || null
		})
		.returning();

	return json(result);
};

export const DELETE: RequestHandler = async ({ request, locals }) => {
	const session = await locals.auth?.();
	if (!session?.user) {
		return json({ error: 'Unauthorized' }, { status: 401 });
	}

	const { resultId } = await request.json();
	await db.delete(raceResults).where(eq(raceResults.id, resultId));

	return json({ success: true });
};
