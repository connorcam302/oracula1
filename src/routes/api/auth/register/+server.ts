import { json } from '@sveltejs/kit';
import { db } from '$lib/server/db';
import { users } from '$lib/server/db/schema';
import { eq } from 'drizzle-orm';
import bcrypt from 'bcryptjs';
import { randomUUID } from 'node:crypto';
import type { RequestHandler } from './$types';

export const POST: RequestHandler = async ({ request }) => {
	const { username, email, password } = await request.json();

	if (!username || !email || !password) {
		return json({ error: 'All fields are required' }, { status: 400 });
	}

	if (password.length < 6) {
		return json({ error: 'Password must be at least 6 characters' }, { status: 400 });
	}

	// Check if email already exists
	const existingEmail = await db.select().from(users).where(eq(users.email, email)).limit(1);
	if (existingEmail.length > 0) {
		return json({ error: 'Email already in use' }, { status: 400 });
	}

	// Check if username already exists
	const existingUsername = await db
		.select()
		.from(users)
		.where(eq(users.username, username))
		.limit(1);
	if (existingUsername.length > 0) {
		return json({ error: 'Username already taken' }, { status: 400 });
	}

	const passwordHash = await bcrypt.hash(password, 12);
	const id = randomUUID();

	await db.insert(users).values({
		id,
		username,
		email,
		passwordHash,
		claimed: false
	});

	return json({ success: true, id });
};
