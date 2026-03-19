import type { PageServerLoad } from './$types';
import { db } from '$lib/server/db';
import { races, seasons, tracks } from '$lib/server/db/schema';
import { desc, asc, eq, and, count } from 'drizzle-orm';

const PAGE_SIZE = 20;

export const load: PageServerLoad = async ({ url }) => {
	const seasonId = url.searchParams.get('season') ? Number(url.searchParams.get('season')) : null;
	const status = (url.searchParams.get('status') ?? 'all') as 'all' | 'completed' | 'upcoming';
	const sort = (url.searchParams.get('sort') ?? 'season_desc') as
		| 'season_desc'
		| 'date_desc'
		| 'date_asc'
		| 'round_desc'
		| 'round_asc';
	const page = Math.max(1, Number(url.searchParams.get('page') ?? 1));

	const conditions = [];
	if (seasonId) conditions.push(eq(races.seasonId, seasonId));
	if (status === 'completed') conditions.push(eq(races.isCompleted, true));
	if (status === 'upcoming') conditions.push(eq(races.isCompleted, false));

	const where = conditions.length > 0 ? and(...conditions) : undefined;
	const offset = (page - 1) * PAGE_SIZE;

	const [totalResult] = await db.select({ count: count() }).from(races).where(where);

		let raceList = await db
			.select({
				id: races.id,
				roundNumber: races.roundNumber,
				scheduledDate: races.scheduledDate,
				isCompleted: races.isCompleted,
				trackName: tracks.name,
				trackCountry: tracks.country,
				seasonId: seasons.id,
				seasonName: seasons.name
			})
			.from(races)
			.innerJoin(tracks, eq(races.trackId, tracks.id))
			.innerJoin(seasons, eq(races.seasonId, seasons.id))
			.where(where)
			.orderBy(
				sort === 'date_desc' ? desc(races.scheduledDate) :
				sort === 'date_asc' ? asc(races.scheduledDate) :
				sort === 'round_desc' ? desc(races.roundNumber) :
				asc(races.roundNumber)
			)
			.limit(PAGE_SIZE)
			.offset(offset);

		// Default: always season desc → round asc as tiebreaker
		raceList = raceList.sort((a, b) =>
			a.seasonId !== b.seasonId
				? b.seasonId - a.seasonId
				: a.roundNumber - b.roundNumber
		);

	const allSeasons = await db
		.select({ id: seasons.id, name: seasons.name, year: seasons.year })
		.from(seasons)
		.orderBy(desc(seasons.year));

	return {
		races: raceList,
		seasons: allSeasons,
		pagination: {
			page,
			pageSize: PAGE_SIZE,
			total: totalResult.count,
			totalPages: Math.ceil(totalResult.count / PAGE_SIZE)
		},
		filters: { seasonId, status, sort }
	};
};
