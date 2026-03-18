import type { PageServerLoad } from './$types';
import { db } from '$lib/server/db';
import { seasons, races, raceResults, users, teams } from '$lib/server/db/schema';
import { desc, eq, sql, count } from 'drizzle-orm';

export const load: PageServerLoad = async () => {
	// Get latest season
	const latestSeason = await db.select().from(seasons).orderBy(desc(seasons.id)).limit(1);

	// Get recent completed races
	const recentRaces = await db
		.select({
			id: races.id,
			roundNumber: races.roundNumber,
			scheduledDate: races.scheduledDate,
			isCompleted: races.isCompleted,
			seasonId: races.seasonId,
			seasonName: seasons.name
		})
		.from(races)
		.innerJoin(seasons, eq(races.seasonId, seasons.id))
		.where(eq(races.isCompleted, true))
		.orderBy(desc(races.id))
		.limit(5);

	// Get top drivers across all seasons
	const topDrivers = await db
		.select({
			userId: raceResults.userId,
			username: users.username,
			avatarUrl: users.avatarUrl,
			totalPoints: sql<number>`SUM(${raceResults.points})`.as('total_points'),
			totalRaces: count(raceResults.id)
		})
		.from(raceResults)
		.innerJoin(users, eq(raceResults.userId, users.id))
		.groupBy(raceResults.userId, users.username, users.avatarUrl)
		.orderBy(desc(sql`SUM(${raceResults.points})`))
		.limit(5);

	// Get season count
	const seasonCount = await db.select({ count: count() }).from(seasons);
	const raceCount = await db.select({ count: count() }).from(races).where(eq(races.isCompleted, true));

	return {
		latestSeason: latestSeason[0] || null,
		recentRaces,
		topDrivers,
		totalSeasons: seasonCount[0]?.count || 0,
		totalRaces: raceCount[0]?.count || 0
	};
};
