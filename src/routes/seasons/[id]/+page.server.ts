import type { PageServerLoad } from './$types';
import { db } from '$lib/server/db';
import { seasons, races, tracks, raceResults, users, teams, seasonTeamMembers } from '$lib/server/db/schema';
import { eq, asc, desc, sql } from 'drizzle-orm';
import { error } from '@sveltejs/kit';

export const load: PageServerLoad = async ({ params, url, locals }) => {
	const session = await locals.auth?.();
	const currentUserId = session?.user?.id ?? null;
	const seasonId = parseInt(params.id);
	if (isNaN(seasonId)) throw error(404, 'Season not found');

	const [season] = await db.select().from(seasons).where(eq(seasons.id, seasonId)).limit(1);
	if (!season) throw error(404, 'Season not found');

	// Get races with track info
	const page = parseInt(url.searchParams.get('page') || '1');
	const limit = 20;
	const offset = (page - 1) * limit;

	const seasonRaces = await db
		.select({
			id: races.id,
			roundNumber: races.roundNumber,
			scheduledDate: races.scheduledDate,
			isCompleted: races.isCompleted,
			trackName: tracks.name,
			trackCountry: tracks.country,
			trackId: tracks.id
		})
		.from(races)
		.innerJoin(tracks, eq(races.trackId, tracks.id))
		.where(eq(races.seasonId, seasonId))
		.orderBy(asc(races.roundNumber))
		.limit(limit)
		.offset(offset);

	// Get total race count for pagination
	const [{ count: totalRaces }] = await db
		.select({ count: sql<number>`COUNT(*)` })
		.from(races)
		.where(eq(races.seasonId, seasonId));

	// Get all tracks for adding races
	const allTracks = await db.select().from(tracks).orderBy(asc(tracks.name));

	// Get team members for this season
	const teamMembers = await db
		.select({
			userId: seasonTeamMembers.userId,
			username: users.username,
			avatarUrl: users.avatarUrl,
			teamId: teams.id,
			teamName: teams.name,
			teamColor: teams.color
		})
		.from(seasonTeamMembers)
		.innerJoin(users, eq(seasonTeamMembers.userId, users.id))
		.innerJoin(teams, eq(seasonTeamMembers.teamId, teams.id))
		.where(eq(seasonTeamMembers.seasonId, seasonId));

	// Get all teams
	const allTeams = await db.select().from(teams).orderBy(asc(teams.name));

	// Get all users for team assignment
	const allUsers = await db.select({ id: users.id, username: users.username }).from(users).orderBy(asc(users.username));

	// ── Constructor Standings ────────────────────────────────
	// Average points per driver per race (same algorithm as stats page),
	// then sum those averages. This balances teams with 1 vs 2 drivers.
	const constructorStandings = await db.execute(sql`
		SELECT
			t.id as "teamId",
			t.name as "teamName",
			t.color as "teamColor",
			ROUND(SUM(sub.avg_pts)::numeric, 1)::float as "totalPoints",
			COUNT(*)::int as "totalRaces",
			SUM(sub.wins)::int as "wins",
			SUM(sub.podiums)::int as "podiums",
			SUM(sub.dnfs)::int as "dnfs"
		FROM (
			SELECT
				rr.race_id,
				rr.team_id,
				AVG(rr.points) as avg_pts,
				COUNT(CASE WHEN rr.position = 1 THEN 1 END) as wins,
				COUNT(CASE WHEN rr.position <= 3 AND rr.position IS NOT NULL THEN 1 END) as podiums,
				COUNT(CASE WHEN rr.dnf = true THEN 1 END) as dnfs
			FROM race_results rr
			JOIN races r ON rr.race_id = r.id
			WHERE r.season_id = ${seasonId}
			GROUP BY rr.race_id, rr.team_id
		) sub
		JOIN teams t ON sub.team_id = t.id
		GROUP BY t.id, t.name, t.color
		ORDER BY "totalPoints" DESC
	`);

	// ── Driver Standings for this season ───────────────────
	const driverStandings = await db
		.select({
			userId: raceResults.userId,
			username: users.username,
			avatarUrl: users.avatarUrl,
			teamName: teams.name,
			teamColor: teams.color,
			totalPoints: sql<number>`SUM(${raceResults.points})`.as('total_points'),
			totalRaces: sql<number>`COUNT(${raceResults.id})`.as('total_races'),
			wins: sql<number>`COUNT(CASE WHEN ${raceResults.position} = 1 THEN 1 END)`.as('wins'),
			podiums: sql<number>`COUNT(CASE WHEN ${raceResults.position} <= 3 AND ${raceResults.position} IS NOT NULL THEN 1 END)`.as('podiums'),
			dnfs: sql<number>`COUNT(CASE WHEN ${raceResults.dnf} = true THEN 1 END)`.as('dnfs')
		})
		.from(raceResults)
		.innerJoin(users, eq(raceResults.userId, users.id))
		.innerJoin(races, eq(raceResults.raceId, races.id))
		.leftJoin(teams, eq(raceResults.teamId, teams.id))
		.where(eq(races.seasonId, seasonId))
		.groupBy(raceResults.userId, users.username, users.avatarUrl, teams.name, teams.color)
		.orderBy(desc(sql`SUM(${raceResults.points})`));

	// ── Points per race for charts ───────────────────────────
	const pointsPerRace: { round: number; trackName: string; results: { userId: string; username: string; points: number; position: number | null; dnf: boolean }[] }[] = [];

	for (const race of seasonRaces) {
		const raceResultsData = await db
			.select({
				userId: raceResults.userId,
				username: users.username,
				points: raceResults.points,
				position: raceResults.position,
				dnf: raceResults.dnf
			})
			.from(raceResults)
			.innerJoin(users, eq(raceResults.userId, users.id))
			.where(eq(raceResults.raceId, race.id));

		pointsPerRace.push({
			round: race.roundNumber,
			trackName: race.trackName,
			results: raceResultsData
		});
	}

	return {
		season,
		races: seasonRaces,
		totalRaces: Number(totalRaces),
		page,
		totalPages: Math.ceil(Number(totalRaces) / limit),
		tracks: allTracks,
		teamMembers,
		allTeams,
		allUsers,
		driverStandings,
		constructorStandings,
		pointsPerRace,
		currentUserId
	};
};
