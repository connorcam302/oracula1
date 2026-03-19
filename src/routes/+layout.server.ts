import type { LayoutServerLoad } from './$types';
import { redirect } from '@sveltejs/kit';
import { db } from '$lib/server/db';
import { seasons, races, users } from '$lib/server/db/schema';
import { desc, eq, sql } from 'drizzle-orm';

export const load: LayoutServerLoad = async (event) => {
	const session = await event.locals.auth?.();

	const sidebarSeasons = await db
		.select({
			id: seasons.id,
			name: seasons.name,
			year: seasons.year,
			completedRaces: sql<number>`COUNT(CASE WHEN ${races.isCompleted} = true THEN 1 END)`,
			totalRaces: sql<number>`COUNT(${races.id})`
		})
		.from(seasons)
		.leftJoin(races, eq(seasons.id, races.seasonId))
		.groupBy(seasons.id, seasons.name, seasons.year)
		.orderBy(desc(seasons.year), desc(seasons.id));

	let hasClaimedProfile = false;
	if (session?.user?.id) {
		const [user] = await db
			.select({ claimed: users.claimed })
			.from(users)
			.where(eq(users.id, session.user.id))
			.limit(1);
		hasClaimedProfile = user?.claimed ?? false;
	}

	if (session?.user && !hasClaimedProfile && !event.url.pathname.startsWith('/claim') && !event.url.pathname.startsWith('/auth/')) {
		throw redirect(302, '/claim');
	}

	return {
		session,
		sidebarSeasons,
		hasClaimedProfile
	};
};
