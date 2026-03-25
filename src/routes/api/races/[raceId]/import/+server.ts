import { json, error } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { db } from '$lib/server/db';
import { raceResults, qualifyingResults, raceEvents, teams } from '$lib/server/db/schema';
import { getPoints } from '$lib/points';
import { eq, and, inArray } from 'drizzle-orm';

interface ImportResult {
	position: number | null;
	driver: string;
	team: string;
	teamId: number | null; // pre-resolved on frontend; falls back to team name lookup if absent
	grid: number | null;
	stops: number;
	bestLap: string;
	time: string;
	isDnf: boolean;
	userId: string;
}

interface ImportEvent {
	time: string;
	lap: number;
	driver: string;
	team: string;
	incident: string;
	penalty: string;
	userId: string | null;
	isAi: boolean;
}

export const POST: RequestHandler = async ({ params, request, locals }) => {
	const session = await locals.auth?.();
	if (!session?.user) throw error(401, 'Unauthorized');

	const raceId = parseInt(params.raceId);
	if (isNaN(raceId)) throw error(400, 'Invalid race ID');

	const { results, events }: { results: ImportResult[]; events: ImportEvent[] } =
		await request.json();

	// Delete all existing events
	await db.delete(raceEvents).where(eq(raceEvents.raceId, raceId));

	// Delete existing results and qualifying only for users in this import
	const importedUserIds = results.map((r) => r.userId);
	if (importedUserIds.length > 0) {
		await db.delete(qualifyingResults).where(
			and(eq(qualifyingResults.raceId, raceId), inArray(qualifyingResults.userId, importedUserIds))
		);
		await db.delete(raceResults).where(
			and(eq(raceResults.raceId, raceId), inArray(raceResults.userId, importedUserIds))
		);
	}

	// Build team name → id map
	const allTeams = await db.select().from(teams);
	const teamMap: Record<string, number> = {};
	for (const t of allTeams) {
		teamMap[t.name.toLowerCase()] = t.id;
	}

	// Insert race results + qualifying for each player
	for (const result of results) {
		const teamId = result.teamId ?? teamMap[result.team.toLowerCase()] ?? null;
		const points = result.isDnf ? 0 : getPoints(result.position);

		await db.insert(raceResults).values({
			raceId,
			userId: result.userId,
			position: result.isDnf ? null : result.position,
			points,
			dnf: result.isDnf,
			teamId,
			gridPosition: result.grid,
			stops: result.stops,
			bestLap: result.bestLap,
			raceTime: result.time
		});

		if (result.grid) {
			await db.insert(qualifyingResults).values({
				raceId,
				userId: result.userId,
				position: result.grid
			});
		}
	}

	// Insert events
	for (const event of events) {
		await db.insert(raceEvents).values({
			raceId,
			time: event.time,
			lap: event.lap,
			driver: event.driver,
			userId: event.userId || null,
			team: event.team,
			incident: event.incident,
			penalty: event.penalty,
			isAi: event.isAi
		});
	}

	return json({ success: true });
};
