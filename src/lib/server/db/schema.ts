import {
	pgTable,
	text,
	integer,
	boolean,
	timestamp,
	serial,
	date,
	primaryKey,
	varchar
} from 'drizzle-orm/pg-core';

// ── Users ──────────────────────────────────────────────
export const users = pgTable('users', {
	id: text('id').primaryKey(),
	username: varchar('username', { length: 100 }).notNull().unique(),
	name: text('name'),
	email: varchar('email', { length: 255 }),
	emailVerified: timestamp('email_verified'),
	image: text('image'),
	passwordHash: text('password_hash'),
	avatarUrl: text('avatar_url'),
	googleId: text('google_id').unique(),
	claimed: boolean('claimed').default(false).notNull(),
	createdAt: timestamp('created_at').defaultNow().notNull()
});

// ── Auth.js tables ─────────────────────────────────────
export const accounts = pgTable(
	'accounts',
	{
		userId: text('user_id')
			.notNull()
			.references(() => users.id, { onDelete: 'cascade' }),
		type: text('type').notNull(),
		provider: text('provider').notNull(),
		providerAccountId: text('provider_account_id').notNull(),
		refresh_token: text('refresh_token'),
		access_token: text('access_token'),
		expires_at: integer('expires_at'),
		token_type: text('token_type'),
		scope: text('scope'),
		id_token: text('id_token'),
		session_state: text('session_state')
	},
	(table) => [primaryKey({ columns: [table.provider, table.providerAccountId] })]
);

export const sessions = pgTable('sessions', {
	sessionToken: text('session_token').primaryKey(),
	userId: text('user_id')
		.notNull()
		.references(() => users.id, { onDelete: 'cascade' }),
	expires: timestamp('expires').notNull()
});

export const verificationTokens = pgTable(
	'verification_tokens',
	{
		identifier: text('identifier').notNull(),
		token: text('token').notNull(),
		expires: timestamp('expires').notNull()
	},
	(table) => [primaryKey({ columns: [table.identifier, table.token] })]
);

// ── Seasons ────────────────────────────────────────────
export const seasons = pgTable('seasons', {
	id: serial('id').primaryKey(),
	name: varchar('name', { length: 200 }).notNull(),
	year: integer('year').notNull(),
	createdBy: text('created_by').references(() => users.id)
});

// ── Tracks ─────────────────────────────────────────────
export const tracks = pgTable('tracks', {
	id: serial('id').primaryKey(),
	name: varchar('name', { length: 200 }).notNull(),
	country: varchar('country', { length: 100 }).notNull()
});

// ── Races ──────────────────────────────────────────────
export const races = pgTable('races', {
	id: serial('id').primaryKey(),
	seasonId: integer('season_id')
		.notNull()
		.references(() => seasons.id, { onDelete: 'cascade' }),
	trackId: integer('track_id')
		.notNull()
		.references(() => tracks.id),
	roundNumber: integer('round_number').notNull(),
	scheduledDate: date('scheduled_date'),
	isCompleted: boolean('is_completed').default(false).notNull()
});

// ── Teams ──────────────────────────────────────────────
export const teams = pgTable('teams', {
	id: serial('id').primaryKey(),
	name: varchar('name', { length: 100 }).notNull(),
	color: varchar('color', { length: 7 }).notNull()
});

// ── Race Results ───────────────────────────────────────
export const raceResults = pgTable('race_results', {
	id: serial('id').primaryKey(),
	raceId: integer('race_id')
		.notNull()
		.references(() => races.id, { onDelete: 'cascade' }),
	userId: text('user_id')
		.notNull()
		.references(() => users.id),
	position: integer('position'),
	points: integer('points').default(0).notNull(),
	dnf: boolean('dnf').default(false).notNull(),
	teamId: integer('team_id').references(() => teams.id),
	gridPosition: integer('grid_position'),
	stops: integer('stops'),
	bestLap: varchar('best_lap', { length: 20 }),
	raceTime: varchar('race_time', { length: 30 })
});

// ── Race Events ────────────────────────────────────────
export const raceEvents = pgTable('race_events', {
	id: serial('id').primaryKey(),
	raceId: integer('race_id')
		.notNull()
		.references(() => races.id, { onDelete: 'cascade' }),
	time: varchar('time', { length: 20 }),
	lap: integer('lap'),
	driver: text('driver').notNull(),
	userId: text('user_id').references(() => users.id),
	team: varchar('team', { length: 100 }),
	incident: text('incident'),
	penalty: varchar('penalty', { length: 100 }),
	isAi: boolean('is_ai').default(false).notNull()
});

// ── Qualifying Results ─────────────────────────────────
export const qualifyingResults = pgTable('qualifying_results', {
	id: serial('id').primaryKey(),
	raceId: integer('race_id')
		.notNull()
		.references(() => races.id, { onDelete: 'cascade' }),
	userId: text('user_id')
		.notNull()
		.references(() => users.id),
	position: integer('position')
});

// ── Season Team Members ────────────────────────────────
export const seasonTeamMembers = pgTable('season_team_members', {
	id: serial('id').primaryKey(),
	seasonId: integer('season_id')
		.notNull()
		.references(() => seasons.id, { onDelete: 'cascade' }),
	userId: text('user_id')
		.notNull()
		.references(() => users.id),
	teamId: integer('team_id')
		.notNull()
		.references(() => teams.id),
	assignedAt: timestamp('assigned_at').defaultNow().notNull()
});

// ── Type Exports ───────────────────────────────────────
export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;
export type Season = typeof seasons.$inferSelect;
export type Track = typeof tracks.$inferSelect;
export type Race = typeof races.$inferSelect;
export type Team = typeof teams.$inferSelect;
export type RaceResult = typeof raceResults.$inferSelect;
export type QualifyingResult = typeof qualifyingResults.$inferSelect;
export type SeasonTeamMember = typeof seasonTeamMembers.$inferSelect;
export type RaceEvent = typeof raceEvents.$inferSelect;
