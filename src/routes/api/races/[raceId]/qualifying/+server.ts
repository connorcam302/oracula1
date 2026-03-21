import { json } from '@sveltejs/kit';
import { db } from '$lib/server/db';
import { qualifyingResults } from '$lib/server/db/schema';
import { eq, and } from 'drizzle-orm';
import type { RequestHandler } from './$types';

export const POST: RequestHandler = async ({ request, params, locals }) => {
	const session = await locals.auth?.();
	if (!session?.user?.id) {
		return json({ error: 'Unauthorized' }, { status: 401 });
	}

	const raceId = parseInt(params.raceId);
	const { userId, position } = await request.json();

	const targetUserId = userId || session.user.id;

	if (!position || position < 1 || position > 20) {
		return json({ error: 'Position must be between 1 and 20' }, { status: 400 });
	}

	// Upsert: delete existing then insert
	await db
		.delete(qualifyingResults)
		.where(and(eq(qualifyingResults.raceId, raceId), eq(qualifyingResults.userId, targetUserId)));

	const [result] = await db
		.insert(qualifyingResults)
		.values({ raceId, userId: targetUserId, position })
		.returning();

	return json(result);
};

export const DELETE: RequestHandler = async ({ request, locals, params }) => {
	const session = await locals.auth?.();
	if (!session?.user?.id) {
		return json({ error: 'Unauthorized' }, { status: 401 });
	}

	const raceId = parseInt(params.raceId);
	const { userId } = await request.json().catch(() => ({}));
	const targetUserId = userId || session.user.id;

	await db
		.delete(qualifyingResults)
		.where(and(eq(qualifyingResults.raceId, raceId), eq(qualifyingResults.userId, targetUserId)));

	return json({ success: true });
};
