import type { PageServerLoad } from './$types';
import { db } from '$lib/server/db';
import { seasons, races } from '$lib/server/db/schema';
import { desc, eq, count, sql } from 'drizzle-orm';

export const load: PageServerLoad = async () => {
	const allSeasons = await db
		.select({
			id: seasons.id,
			name: seasons.name,
			year: seasons.year,
			raceCount: count(races.id),
			completedRaces: sql<number>`COUNT(CASE WHEN ${races.isCompleted} = true THEN 1 END)`
		})
		.from(seasons)
		.leftJoin(races, eq(seasons.id, races.seasonId))
		.groupBy(seasons.id, seasons.name, seasons.year)
		.orderBy(desc(seasons.year), desc(seasons.id));

	return { seasons: allSeasons };
};
