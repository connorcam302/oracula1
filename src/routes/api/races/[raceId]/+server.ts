import { json } from '@sveltejs/kit';
import { db } from '$lib/server/db';
import { races } from '$lib/server/db/schema';
import { eq } from 'drizzle-orm';
import type { RequestHandler } from './$types';

export const PATCH: RequestHandler = async ({ request, params, locals }) => {
	const session = await locals.auth?.();
	if (!session?.user) {
		return json({ error: 'Unauthorized' }, { status: 401 });
	}

	const raceId = parseInt(params.raceId);
	const { isCompleted } = await request.json();

	const [race] = await db
		.update(races)
		.set({ isCompleted })
		.where(eq(races.id, raceId))
		.returning();

	return json(race);
};
