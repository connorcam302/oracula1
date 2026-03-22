import type { PageServerLoad } from './$types';
import { db } from '$lib/server/db';
import { seasons, races, tracks, raceResults, users, teams } from '$lib/server/db/schema';
import { desc, eq, sql, count, asc, and } from 'drizzle-orm';

export const load: PageServerLoad = async () => {
	// Get latest season
	const [latestSeason] = await db.select().from(seasons).orderBy(desc(seasons.id)).limit(1);

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

	// ── Current season data ──────────────────────────────────
	let currentSeason = null;

	if (latestSeason) {
		const seasonId = latestSeason.id;

		// Driver standings for current season
		const standings = await db
			.select({
				userId: raceResults.userId,
				username: users.username,
				avatarUrl: users.avatarUrl,
				teamColor: teams.color,
				totalPoints: sql<number>`SUM(${raceResults.points})`.as('total_points'),
				wins: sql<number>`COUNT(CASE WHEN ${raceResults.position} = 1 THEN 1 END)`.as('wins')
			})
			.from(raceResults)
			.innerJoin(users, eq(raceResults.userId, users.id))
			.innerJoin(races, eq(raceResults.raceId, races.id))
			.leftJoin(teams, eq(raceResults.teamId, teams.id))
			.where(eq(races.seasonId, seasonId))
			.groupBy(raceResults.userId, users.username, users.avatarUrl, teams.color)
			.orderBy(desc(sql`SUM(${raceResults.points})`))
			.limit(8);

		// Latest completed race with track info
		const [lastRace] = await db
			.select({
				id: races.id,
				roundNumber: races.roundNumber,
				scheduledDate: races.scheduledDate,
				trackName: tracks.name,
				trackCountry: tracks.country
			})
			.from(races)
			.innerJoin(tracks, eq(races.trackId, tracks.id))
			.where(and(eq(races.seasonId, seasonId), eq(races.isCompleted, true)))
			.orderBy(desc(races.roundNumber))
			.limit(1);

		// Top results from last race
		const lastRaceResults = lastRace
			? await db
					.select({
						userId: raceResults.userId,
						username: users.username,
						position: raceResults.position,
						points: raceResults.points,
						dnf: raceResults.dnf
					})
					.from(raceResults)
					.innerJoin(users, eq(raceResults.userId, users.id))
					.where(eq(raceResults.raceId, lastRace.id))
					.orderBy(asc(raceResults.position))
			: [];

		// Next upcoming race
		const [nextRace] = await db
			.select({
				id: races.id,
				roundNumber: races.roundNumber,
				scheduledDate: races.scheduledDate,
				trackName: tracks.name,
				trackCountry: tracks.country
			})
			.from(races)
			.innerJoin(tracks, eq(races.trackId, tracks.id))
			.where(and(eq(races.seasonId, seasonId), eq(races.isCompleted, false)))
			.orderBy(asc(races.roundNumber))
			.limit(1);

		// Race counts for current season
		const [{ count: totalRaces }] = await db
			.select({ count: sql<number>`COUNT(*)` })
			.from(races)
			.where(eq(races.seasonId, seasonId));

		const [{ count: completedRaces }] = await db
			.select({ count: sql<number>`COUNT(*)` })
			.from(races)
			.where(and(eq(races.seasonId, seasonId), eq(races.isCompleted, true)));

		currentSeason = {
			season: latestSeason,
			standings,
			lastRace: lastRace ?? null,
			lastRaceResults,
			nextRace: nextRace ?? null,
			totalRaces: Number(totalRaces),
			completedRaces: Number(completedRaces)
		};
	}

	return {
		latestSeason: latestSeason || null,
		recentRaces,
		topDrivers,
		totalSeasons: seasonCount[0]?.count || 0,
		totalRaces: raceCount[0]?.count || 0,
		currentSeason
	};
};
