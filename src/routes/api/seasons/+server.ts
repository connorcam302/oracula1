import { json } from '@sveltejs/kit';
import { db } from '$lib/server/db';
import { seasons } from '$lib/server/db/schema';
import type { RequestHandler } from './$types';

export const POST: RequestHandler = async ({ request, locals }) => {
	const session = await locals.auth?.();
	if (!session?.user) {
		return json({ error: 'Unauthorized' }, { status: 401 });
	}

	const { name } = await request.json();

	if (!name) {
		return json({ error: 'Name is required' }, { status: 400 });
	}

	if (!session.user.id) {
		return json({ error: 'Could not determine user ID from session' }, { status: 401 });
	}

	const [season] = await db
		.insert(seasons)
		.values({
			name,
			year: new Date().getFullYear(),
			createdBy: session.user.id
		})
		.returning();

	return json(season);
};
