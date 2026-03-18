import { json } from '@sveltejs/kit';
import { db } from '$lib/server/db';
import { users } from '$lib/server/db/schema';
import { eq } from 'drizzle-orm';
import type { RequestHandler } from './$types';

export const PATCH: RequestHandler = async ({ request, locals }) => {
	const session = await locals.auth?.();
	if (!session?.user?.id) {
		return json({ error: 'Unauthorized' }, { status: 401 });
	}

	const { username } = await request.json();

	if (!username || typeof username !== 'string') {
		return json({ error: 'Username is required' }, { status: 400 });
	}

	const trimmed = username.trim();

	if (trimmed.length < 2 || trimmed.length > 30) {
		return json({ error: 'Username must be between 2 and 30 characters' }, { status: 400 });
	}

	if (!/^[a-zA-Z0-9_]+$/.test(trimmed)) {
		return json({ error: 'Username can only contain letters, numbers, and underscores' }, { status: 400 });
	}

	// Check uniqueness
	const [existing] = await db
		.select({ id: users.id })
		.from(users)
		.where(eq(users.username, trimmed))
		.limit(1);

	if (existing && existing.id !== session.user.id) {
		return json({ error: 'Username already taken' }, { status: 409 });
	}

	const [updated] = await db
		.update(users)
		.set({ username: trimmed })
		.where(eq(users.id, session.user.id))
		.returning({ username: users.username });

	return json({ username: updated.username });
};
