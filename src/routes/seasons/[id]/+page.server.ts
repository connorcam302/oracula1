import type { PageServerLoad } from './$types';
import { db } from '$lib/server/db';
import { seasons, races, tracks, raceResults, users, teams, seasonTeamMembers } from '$lib/server/db/schema';
import { eq, asc, sql } from 'drizzle-orm';
import { error } from '@sveltejs/kit';

export const load: PageServerLoad = async ({ params, url }) => {
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

	return {
		season,
		races: seasonRaces,
		totalRaces: Number(totalRaces),
		page,
		totalPages: Math.ceil(Number(totalRaces) / limit),
		tracks: allTracks,
		teamMembers,
		allTeams,
		allUsers
	};
};
