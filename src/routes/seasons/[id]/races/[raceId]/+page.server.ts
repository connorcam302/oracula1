import type { PageServerLoad } from './$types';
import { db } from '$lib/server/db';
import { races, tracks, raceResults, users, teams, seasons, seasonTeamMembers, qualifyingResults, raceEvents } from '$lib/server/db/schema';
import { eq, asc } from 'drizzle-orm';
import { error } from '@sveltejs/kit';

export const load: PageServerLoad = async ({ params, locals }) => {
	const session = await locals.auth?.();
	const currentUserId = session?.user?.id ?? null;
	const raceId = parseInt(params.raceId);
	const seasonId = parseInt(params.id);

	if (isNaN(raceId) || isNaN(seasonId)) throw error(404, 'Not found');

	// Get race with track info
	const [race] = await db
		.select({
			id: races.id,
			roundNumber: races.roundNumber,
			scheduledDate: races.scheduledDate,
			isCompleted: races.isCompleted,
			seasonId: races.seasonId,
			trackName: tracks.name,
			trackCountry: tracks.country
		})
		.from(races)
		.innerJoin(tracks, eq(races.trackId, tracks.id))
		.where(eq(races.id, raceId))
		.limit(1);

	if (!race) throw error(404, 'Race not found');

	// Get season
	const [season] = await db.select().from(seasons).where(eq(seasons.id, seasonId)).limit(1);
	if (!season) throw error(404, 'Season not found');

	// Get race results with user and team info
	const results = await db
		.select({
			id: raceResults.id,
			position: raceResults.position,
			points: raceResults.points,
			dnf: raceResults.dnf,
			gridPosition: raceResults.gridPosition,
			stops: raceResults.stops,
			bestLap: raceResults.bestLap,
			raceTime: raceResults.raceTime,
			userId: users.id,
			username: users.username,
			avatarUrl: users.avatarUrl,
			teamName: teams.name,
			teamColor: teams.color,
			teamId: teams.id
		})
		.from(raceResults)
		.innerJoin(users, eq(raceResults.userId, users.id))
		.leftJoin(teams, eq(raceResults.teamId, teams.id))
		.where(eq(raceResults.raceId, raceId))
		.orderBy(asc(raceResults.position));

	// Get all users for adding results
	const allUsers = await db
		.select({ id: users.id, username: users.username })
		.from(users)
		.orderBy(asc(users.username));

	// Get all teams
	const allTeams = await db.select().from(teams).orderBy(asc(teams.name));

	// Get season team members to pre-fill team
	const teamMembersForSeason = await db
		.select({
			userId: seasonTeamMembers.userId,
			teamId: seasonTeamMembers.teamId
		})
		.from(seasonTeamMembers)
		.where(eq(seasonTeamMembers.seasonId, seasonId));

	const userTeamMap: Record<string, number> = {};
	for (const m of teamMembersForSeason) {
		userTeamMap[m.userId] = m.teamId;
	}

	// Get qualifying results with user info
	const qualifying = await db
		.select({
			id: qualifyingResults.id,
			position: qualifyingResults.position,
			userId: users.id,
			username: users.username,
			avatarUrl: users.avatarUrl
		})
		.from(qualifyingResults)
		.innerJoin(users, eq(qualifyingResults.userId, users.id))
		.where(eq(qualifyingResults.raceId, raceId))
		.orderBy(asc(qualifyingResults.position));

	// Get race events with user info
	const events = await db
		.select({
			id: raceEvents.id,
			time: raceEvents.time,
			lap: raceEvents.lap,
			driver: raceEvents.driver,
			userId: raceEvents.userId,
			team: raceEvents.team,
			incident: raceEvents.incident,
			penalty: raceEvents.penalty,
			isAi: raceEvents.isAi,
			username: users.username,
			avatarUrl: users.avatarUrl
		})
		.from(raceEvents)
		.leftJoin(users, eq(raceEvents.userId, users.id))
		.where(eq(raceEvents.raceId, raceId))
		.orderBy(asc(raceEvents.lap), asc(raceEvents.time));

	return {
		race,
		season,
		results,
		qualifying,
		events,
		allUsers,
		allTeams,
		userTeamMap,
		currentUserId
	};
};
