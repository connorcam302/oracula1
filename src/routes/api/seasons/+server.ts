import { json } from '@sveltejs/kit';
import { db } from '$lib/server/db';
import { seasons } from '$lib/server/db/schema';
import type { RequestHandler } from './$types';

export const POST: RequestHandler = async ({ request, locals }) => {
	const session = await locals.auth?.();
	if (!session?.user) {
		return json({ error: 'Unauthorized' }, { status: 401 });
	}

	const { name, year } = await request.json();

	if (!name || !year) {
		return json({ error: 'Name and year are required' }, { status: 400 });
	}

	const [season] = await db
		.insert(seasons)
		.values({
			name,
			year,
			createdBy: session.user.id
		})
		.returning();

	return json(season);
};
