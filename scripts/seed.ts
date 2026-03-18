/**
 * Seed script: reads the Bornana CSV files and populates the database.
 *
 * Usage:
 *   npx tsx scripts/seed.ts
 *
 * Requires DATABASE_URL env var (defaults to local Docker postgres).
 */

import fs from 'node:fs';
import path from 'node:path';
import postgres from 'postgres';

// ── Config ─────────────────────────────────────────────
const DATABASE_URL = process.env.DATABASE_URL ?? 'postgres://postgres:postgres@localhost:5432/oracula';
const sql = postgres(DATABASE_URL);

// ── Points map ─────────────────────────────────────────
const POINTS: Record<number, number> = {
	1: 25, 2: 18, 3: 15, 4: 12, 5: 10,
	6: 8, 7: 6, 8: 4, 9: 2, 10: 1
};
function getPoints(position: number | null): number {
	if (position === null) return 0;
	return POINTS[position] ?? 0;
}

// ── Track name normalization ───────────────────────────
// Maps header names from the CSVs to canonical track names + countries.
const TRACK_MAP: Record<string, { name: string; country: string }> = {
	'bahrain':      { name: 'Bahrain International Circuit', country: 'Bahrain' },
	'imola':        { name: 'Imola Circuit', country: 'Italy' },
	'portugal':     { name: 'Autodromo Internacional do Algarve', country: 'Portugal' },
	'spain':        { name: 'Circuit de Barcelona-Catalunya', country: 'Spain' },
	'azerbaijan':   { name: 'Baku City Circuit', country: 'Azerbaijan' },
	'canada':       { name: 'Circuit Gilles Villeneuve', country: 'Canada' },
	'france':       { name: 'Circuit Paul Ricard', country: 'France' },
	'austrain':     { name: 'Red Bull Ring', country: 'Austria' },     // typo in CSV
	'austria':      { name: 'Red Bull Ring', country: 'Austria' },
	'britain':      { name: 'Silverstone Circuit', country: 'United Kingdom' },
	'hungary':      { name: 'Hungaroring', country: 'Hungary' },
	'belgium':      { name: 'Circuit de Spa-Francorchamps', country: 'Belgium' },
	'netherlands':  { name: 'Circuit Zandvoort', country: 'Netherlands' },
	'italy':        { name: 'Autodromo Nazionale Monza', country: 'Italy' },
	'russia':       { name: 'Sochi Autodrom', country: 'Russia' },
	'singapore':    { name: 'Marina Bay Street Circuit', country: 'Singapore' },
	'japan':        { name: 'Suzuka International Racing Course', country: 'Japan' },
	'usa':          { name: 'Circuit of the Americas', country: 'United States' },
	'mexico':       { name: 'Autodromo Hermanos Rodriguez', country: 'Mexico' },
	'brazil':       { name: 'Interlagos Circuit', country: 'Brazil' },
	'australia':    { name: 'Albert Park Circuit', country: 'Australia' },
	'china':        { name: 'Shanghai International Circuit', country: 'China' },
	'saudi arabia': { name: 'Jeddah Corniche Circuit', country: 'Saudi Arabia' },
};

// ── Team name normalization ────────────────────────────
const TEAM_MAP: Record<string, { name: string; color: string }> = {
	'alphatauri':    { name: 'AlphaTauri',    color: '#6692FF' },
	'aston martin':  { name: 'Aston Martin',  color: '#229971' },
	'haas/mercedes': { name: 'Haas',          color: '#B6BABD' },
	'mclaren':       { name: 'McLaren',       color: '#FF8700' },
	'ferrari':       { name: 'Ferrari',       color: '#DC0000' },
	'mercedes':      { name: 'Mercedes',      color: '#27F4D2' },
	'red bull':      { name: 'Red Bull',      color: '#3671C6' },
	'williams':      { name: 'Williams',      color: '#64C4FF' },
	'alpine':        { name: 'Alpine',        color: '#FF87BC' },
};

// ── CSV seasons ────────────────────────────────────────
interface CsvSeason {
	file: string;
	seasonName: string;
	year: number;
}

const CSV_SEASONS: CsvSeason[] = [
	{ file: 'data/Bornana 4 - Sheet1.csv', seasonName: 'Bornana Season 4', year: 2022 },
	{ file: 'data/Bornana 5 - Sheet1.csv', seasonName: 'Bornana Season 5', year: 2023 },
	{ file: 'data/Bornana 6 - Sheet1.csv', seasonName: 'Bornana Season 6', year: 2024 },
];

// ── Parse a single cell value ──────────────────────────
interface CellResult {
	participated: boolean;
	dnf: boolean;
	position: number | null;
}

function parseCell(value: string): CellResult {
	const trimmed = value.trim();

	// Empty or dash = did not participate
	if (trimmed === '' || trimmed === '-') {
		return { participated: false, dnf: false, position: null };
	}

	// DNF followed by a number (e.g. DNF16)
	const dnfMatch = trimmed.match(/^DNF(\d+)$/i);
	if (dnfMatch) {
		return { participated: true, dnf: true, position: null };
	}

	// Plain number = finishing position
	const pos = parseInt(trimmed, 10);
	if (!isNaN(pos)) {
		return { participated: true, dnf: false, position: pos };
	}

	// Fallback: treat as not participated
	console.warn(`  Unknown cell value: "${trimmed}", treating as not participated`);
	return { participated: false, dnf: false, position: null };
}

// ── Parse a CSV string into rows ───────────────────────
function parseCsv(content: string): string[][] {
	const lines = content.trim().split('\n');
	return lines.map(line => {
		// Simple CSV parse (no quoted commas in this data)
		return line.split(',').map(cell => cell.trim());
	});
}

// ── Main seed function ─────────────────────────────────
async function seed() {
	console.log('Starting seed...');
	console.log(`Database: ${DATABASE_URL}\n`);

	// 1. Clear existing data (in dependency order)
	console.log('Clearing existing data...');
	await sql`DELETE FROM race_results`;
	await sql`DELETE FROM season_team_members`;
	await sql`DELETE FROM races`;
	await sql`DELETE FROM seasons`;
	await sql`DELETE FROM accounts`;
	await sql`DELETE FROM sessions`;
	await sql`DELETE FROM verification_tokens`;
	await sql`DELETE FROM users`;
	await sql`DELETE FROM tracks`;
	await sql`DELETE FROM teams`;

	// 2. Collect all unique users, teams, and tracks across all CSVs
	const allUsers = new Set<string>();
	const allTeamKeys = new Set<string>();
	const allTrackKeys = new Set<string>();

	// Pre-parse all CSVs
	interface ParsedSeason {
		config: CsvSeason;
		trackHeaders: string[];
		rows: { teamRaw: string; name: string; cells: string[] }[];
	}
	const parsedSeasons: ParsedSeason[] = [];

	for (const cfg of CSV_SEASONS) {
		const filePath = path.join(process.cwd(), cfg.file);
		if (!fs.existsSync(filePath)) {
			console.error(`CSV file not found: ${filePath}`);
			process.exit(1);
		}

		const content = fs.readFileSync(filePath, 'utf-8');
		const rows = parseCsv(content);
		const header = rows[0]; // Team, Name, Track1, Track2, ...
		const trackHeaders = header.slice(2).map(h => h.toLowerCase());

		const dataRows = rows.slice(1).map(row => ({
			teamRaw: row[0].trim(),
			name: row[1].trim(),
			cells: row.slice(2),
		}));

		// Collect uniques
		for (const r of dataRows) {
			allUsers.add(r.name);
			allTeamKeys.add(r.teamRaw.toLowerCase());
		}
		for (const t of trackHeaders) {
			allTrackKeys.add(t);
		}

		parsedSeasons.push({ config: cfg, trackHeaders, rows: dataRows });
	}

	// 3. Insert teams
	console.log('Inserting teams...');
	const teamIdMap = new Map<string, number>(); // lowercase key -> db id
	for (const key of allTeamKeys) {
		const mapped = TEAM_MAP[key];
		if (!mapped) {
			console.error(`  Unknown team: "${key}"`);
			process.exit(1);
		}
		const [row] = await sql`
			INSERT INTO teams (name, color)
			VALUES (${mapped.name}, ${mapped.color})
			ON CONFLICT DO NOTHING
			RETURNING id
		`;
		// Handle case where team was already inserted (e.g. duplicate key mapping to same name)
		if (row) {
			teamIdMap.set(key, row.id);
		} else {
			const [existing] = await sql`SELECT id FROM teams WHERE name = ${mapped.name}`;
			teamIdMap.set(key, existing.id);
		}
		console.log(`  ${mapped.name} -> id ${teamIdMap.get(key)}`);
	}

	// 4. Insert tracks
	console.log('Inserting tracks...');
	const trackIdMap = new Map<string, number>(); // lowercase header -> db id
	for (const key of allTrackKeys) {
		const mapped = TRACK_MAP[key];
		if (!mapped) {
			console.error(`  Unknown track header: "${key}"`);
			process.exit(1);
		}
		// Avoid duplicates (e.g. "austrain" and "austria" both map to Red Bull Ring)
		if (trackIdMap.has(key)) continue;

		const [existing] = await sql`SELECT id FROM tracks WHERE name = ${mapped.name}`;
		if (existing) {
			trackIdMap.set(key, existing.id);
		} else {
			const [row] = await sql`
				INSERT INTO tracks (name, country)
				VALUES (${mapped.name}, ${mapped.country})
				RETURNING id
			`;
			trackIdMap.set(key, row.id);
		}
		console.log(`  ${key} -> ${mapped.name} (id ${trackIdMap.get(key)})`);
	}

	// 5. Insert placeholder users
	console.log('Inserting users...');
	const userIdMap = new Map<string, string>(); // name -> db id
	for (const name of allUsers) {
		const id = `user_${name.toLowerCase()}`;
		await sql`
			INSERT INTO users (id, username, claimed)
			VALUES (${id}, ${name}, false)
		`;
		userIdMap.set(name, id);
		console.log(`  ${name} -> ${id}`);
	}

	// 6. Process each season
	for (const parsed of parsedSeasons) {
		const { config, trackHeaders, rows } = parsed;
		console.log(`\nProcessing: ${config.seasonName} (${config.year})`);

		// Insert season
		const [season] = await sql`
			INSERT INTO seasons (name, year)
			VALUES (${config.seasonName}, ${config.year})
			RETURNING id
		`;
		const seasonId = season.id;
		console.log(`  Season id: ${seasonId}`);

		// Insert season team members
		const teamAssignments = new Map<string, string>(); // "userId" -> teamKey
		for (const row of rows) {
			const userId = userIdMap.get(row.name)!;
			const teamKey = row.teamRaw.toLowerCase();
			const teamId = teamIdMap.get(teamKey)!;
			teamAssignments.set(userId, teamKey);

			await sql`
				INSERT INTO season_team_members (season_id, user_id, team_id)
				VALUES (${seasonId}, ${userId}, ${teamId})
			`;
		}

		// Insert races and results
		for (let roundIdx = 0; roundIdx < trackHeaders.length; roundIdx++) {
			const trackKey = trackHeaders[roundIdx];
			const trackId = trackIdMap.get(trackKey)!;
			const roundNumber = roundIdx + 1;

			// Check if any racer participated in this round
			let anyParticipated = false;
			for (const row of rows) {
				const cellValue = row.cells[roundIdx] ?? '';
				const parsed = parseCell(cellValue);
				if (parsed.participated) {
					anyParticipated = true;
					break;
				}
			}

			if (!anyParticipated) {
				// Skip rounds where nobody participated
				continue;
			}

			// Insert race
			const [race] = await sql`
				INSERT INTO races (season_id, track_id, round_number, is_completed)
				VALUES (${seasonId}, ${trackId}, ${roundNumber}, true)
				RETURNING id
			`;
			const raceId = race.id;

			// Insert results for each racer
			let resultCount = 0;
			for (const row of rows) {
				const cellValue = row.cells[roundIdx] ?? '';
				const cellResult = parseCell(cellValue);

				if (!cellResult.participated) continue;

				const userId = userIdMap.get(row.name)!;
				const teamKey = row.teamRaw.toLowerCase();
				const teamId = teamIdMap.get(teamKey)!;
				const points = getPoints(cellResult.position);

				await sql`
					INSERT INTO race_results (race_id, user_id, position, points, dnf, team_id)
					VALUES (${raceId}, ${userId}, ${cellResult.position}, ${points}, ${cellResult.dnf}, ${teamId})
				`;
				resultCount++;
			}

			const trackName = TRACK_MAP[trackKey]?.name ?? trackKey;
			console.log(`  R${roundNumber} ${trackName}: ${resultCount} results`);
		}
	}

	console.log('\nSeed complete!');
	await sql.end();
}

seed().catch((err) => {
	console.error('Seed failed:', err);
	process.exit(1);
});
