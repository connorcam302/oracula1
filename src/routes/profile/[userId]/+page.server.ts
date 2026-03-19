import type { PageServerLoad } from './$types';
import { db } from '$lib/server/db';
import { users, raceResults, races, seasons, tracks, teams } from '$lib/server/db/schema';
import { eq, sql, desc, asc, count, and } from 'drizzle-orm';
import { error } from '@sveltejs/kit';

export const load: PageServerLoad = async ({ params, locals }) => {
	const userId = params.userId;
	const session = await locals.auth?.();

	const [user] = await db
		.select()
		.from(users)
		.where(eq(users.id, userId))
		.limit(1);

	if (!user) throw error(404, 'User not found');

	// Get all race results for this user
	const results = await db
		.select({
			raceId: races.id,
			roundNumber: races.roundNumber,
			scheduledDate: races.scheduledDate,
			seasonId: seasons.id,
			seasonName: seasons.name,
			seasonYear: seasons.year,
			trackId: tracks.id,
			trackName: tracks.name,
			trackCountry: tracks.country,
			position: raceResults.position,
			points: raceResults.points,
			dnf: raceResults.dnf,
			teamName: teams.name,
			teamColor: teams.color
		})
		.from(raceResults)
		.innerJoin(races, eq(raceResults.raceId, races.id))
		.innerJoin(seasons, eq(races.seasonId, seasons.id))
		.innerJoin(tracks, eq(races.trackId, tracks.id))
		.leftJoin(teams, eq(raceResults.teamId, teams.id))
		.where(eq(raceResults.userId, userId))
		.orderBy(desc(seasons.year), desc(races.roundNumber));

	// Calculate stats
	const totalRaces = results.length;
	const totalPoints = results.reduce((sum, r) => sum + r.points, 0);
	const wins = results.filter((r) => r.position === 1).length;
	const podiums = results.filter((r) => r.position !== null && r.position <= 3).length;
	const dnfs = results.filter((r) => r.dnf).length;

	// Best finish
	const finishes = results.filter((r) => r.position !== null).map((r) => r.position as number);
	const bestFinish = finishes.length > 0 ? Math.min(...finishes) : null;

	return {
		profile: {
			id: user.id,
			username: user.username,
			avatarUrl: user.avatarUrl,
			claimed: user.claimed,
			createdAt: user.createdAt
		},
		currentUserId: session?.user?.id ?? null,
		results,
		stats: {
			totalRaces,
			totalPoints,
			wins,
			podiums,
			dnfs,
			bestFinish
		}
	};
};
