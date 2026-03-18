import type { PageServerLoad } from './$types';
import { db } from '$lib/server/db';
import { users, raceResults, races, seasons, tracks, teams, seasonTeamMembers } from '$lib/server/db/schema';
import { eq, sql, desc, asc, count } from 'drizzle-orm';

export const load: PageServerLoad = async ({ url }) => {
	const seasonFilter = url.searchParams.get('season');

	// Get all seasons for filter dropdown
	const allSeasons = await db.select().from(seasons).orderBy(desc(seasons.year));

	// ── Driver Standings ───────────────────────────────
	let driverStandingsQuery = db
		.select({
			userId: raceResults.userId,
			username: users.username,
			avatarUrl: users.avatarUrl,
			totalPoints: sql<number>`SUM(${raceResults.points})`.as('total_points'),
			totalRaces: count(raceResults.id),
			wins: sql<number>`COUNT(CASE WHEN ${raceResults.position} = 1 THEN 1 END)`.as('wins'),
			podiums: sql<number>`COUNT(CASE WHEN ${raceResults.position} <= 3 AND ${raceResults.position} IS NOT NULL THEN 1 END)`.as('podiums'),
			dnfs: sql<number>`COUNT(CASE WHEN ${raceResults.dnf} = true THEN 1 END)`.as('dnfs')
		})
		.from(raceResults)
		.innerJoin(users, eq(raceResults.userId, users.id))
		.innerJoin(races, eq(raceResults.raceId, races.id));

	if (seasonFilter) {
		driverStandingsQuery = driverStandingsQuery.where(
			eq(races.seasonId, parseInt(seasonFilter))
		) as any;
	}

	const driverStandings = await (driverStandingsQuery as any)
		.groupBy(raceResults.userId, users.username, users.avatarUrl)
		.orderBy(desc(sql`SUM(${raceResults.points})`));

	// ── Constructor Standings ──────────────────────────
	let constructorQuery = db
		.select({
			teamId: teams.id,
			teamName: teams.name,
			teamColor: teams.color,
			totalPoints: sql<number>`SUM(${raceResults.points})`.as('total_points'),
			totalRaces: count(raceResults.id)
		})
		.from(raceResults)
		.innerJoin(teams, eq(raceResults.teamId, teams.id))
		.innerJoin(races, eq(raceResults.raceId, races.id));

	if (seasonFilter) {
		constructorQuery = constructorQuery.where(
			eq(races.seasonId, parseInt(seasonFilter))
		) as any;
	}

	const constructorStandings = await (constructorQuery as any)
		.groupBy(teams.id, teams.name, teams.color)
		.orderBy(desc(sql`SUM(${raceResults.points})`));

	// ── Points per Race (for charts) ──────────────────
	// Get the selected season's race data for charts
	const chartSeasonId = seasonFilter ? parseInt(seasonFilter) : allSeasons[0]?.id;

	let pointsPerRace: any[] = [];
	let positionData: any[] = [];

	if (chartSeasonId) {
		// Get all races in the season
		const seasonRaces = await db
			.select({
				raceId: races.id,
				roundNumber: races.roundNumber,
				trackName: tracks.name
			})
			.from(races)
			.innerJoin(tracks, eq(races.trackId, tracks.id))
			.where(eq(races.seasonId, chartSeasonId))
			.orderBy(asc(races.roundNumber));

		// Get results for each race
		for (const race of seasonRaces) {
			const raceResultsData = await db
				.select({
					userId: raceResults.userId,
					username: users.username,
					position: raceResults.position,
					points: raceResults.points,
					dnf: raceResults.dnf
				})
				.from(raceResults)
				.innerJoin(users, eq(raceResults.userId, users.id))
				.where(eq(raceResults.raceId, race.raceId));

			pointsPerRace.push({
				round: race.roundNumber,
				trackName: race.trackName,
				results: raceResultsData
			});
		}

		// Position distribution
		const posDistribution = await db
			.select({
				userId: raceResults.userId,
				username: users.username,
				position: raceResults.position,
				count: count()
			})
			.from(raceResults)
			.innerJoin(users, eq(raceResults.userId, users.id))
			.innerJoin(races, eq(raceResults.raceId, races.id))
			.where(eq(races.seasonId, chartSeasonId))
			.groupBy(raceResults.userId, users.username, raceResults.position)
			.orderBy(asc(raceResults.position));

		positionData = posDistribution;
	}

	return {
		driverStandings,
		constructorStandings,
		allSeasons,
		selectedSeason: seasonFilter,
		pointsPerRace,
		positionData,
		chartSeasonId
	};
};
