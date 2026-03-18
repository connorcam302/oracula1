-- Oracula1 - F1 Race Tracking App - Initial Database Setup
-- Run: docker compose down -v && docker compose up

-- ── Create Tables ──────────────────────────────────────

CREATE TABLE IF NOT EXISTS users (
    id TEXT PRIMARY KEY,
    username VARCHAR(100) NOT NULL UNIQUE,
    name TEXT,
    email VARCHAR(255),
    email_verified TIMESTAMP,
    image TEXT,
    password_hash TEXT,
    avatar_url TEXT,
    google_id TEXT UNIQUE,
    claimed BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS accounts (
    user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    type TEXT NOT NULL,
    provider TEXT NOT NULL,
    provider_account_id TEXT NOT NULL,
    refresh_token TEXT,
    access_token TEXT,
    expires_at INTEGER,
    token_type TEXT,
    scope TEXT,
    id_token TEXT,
    session_state TEXT,
    PRIMARY KEY (provider, provider_account_id)
);

CREATE TABLE IF NOT EXISTS sessions (
    session_token TEXT PRIMARY KEY,
    user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    expires TIMESTAMP NOT NULL
);

CREATE TABLE IF NOT EXISTS verification_tokens (
    identifier TEXT NOT NULL,
    token TEXT NOT NULL,
    expires TIMESTAMP NOT NULL,
    PRIMARY KEY (identifier, token)
);

CREATE TABLE IF NOT EXISTS seasons (
    id SERIAL PRIMARY KEY,
    name VARCHAR(200) NOT NULL,
    year INTEGER NOT NULL,
    created_by TEXT REFERENCES users(id)
);

CREATE TABLE IF NOT EXISTS tracks (
    id SERIAL PRIMARY KEY,
    name VARCHAR(200) NOT NULL,
    country VARCHAR(100) NOT NULL
);

CREATE TABLE IF NOT EXISTS teams (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    color VARCHAR(7) NOT NULL
);

CREATE TABLE IF NOT EXISTS races (
    id SERIAL PRIMARY KEY,
    season_id INTEGER NOT NULL REFERENCES seasons(id) ON DELETE CASCADE,
    track_id INTEGER NOT NULL REFERENCES tracks(id),
    round_number INTEGER NOT NULL,
    scheduled_date DATE,
    is_completed BOOLEAN NOT NULL DEFAULT FALSE
);

CREATE TABLE IF NOT EXISTS race_results (
    id SERIAL PRIMARY KEY,
    race_id INTEGER NOT NULL REFERENCES races(id) ON DELETE CASCADE,
    user_id TEXT NOT NULL REFERENCES users(id),
    position INTEGER,
    points INTEGER NOT NULL DEFAULT 0,
    dnf BOOLEAN NOT NULL DEFAULT FALSE,
    team_id INTEGER REFERENCES teams(id)
);

CREATE TABLE IF NOT EXISTS season_team_members (
    id SERIAL PRIMARY KEY,
    season_id INTEGER NOT NULL REFERENCES seasons(id) ON DELETE CASCADE,
    user_id TEXT NOT NULL REFERENCES users(id),
    team_id INTEGER NOT NULL REFERENCES teams(id),
    assigned_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- ── Seed Teams ─────────────────────────────────────────

INSERT INTO teams (id, name, color) VALUES
(1,  'McLaren',       '#FF8700'),
(2,  'Ferrari',       '#DC0000'),
(3,  'Red Bull',      '#3671C6'),
(4,  'Mercedes',      '#27F4D2'),
(5,  'Aston Martin',  '#229971'),
(6,  'Alpine',        '#FF87BC'),
(7,  'Williams',      '#64C4FF'),
(8,  'Haas',          '#B6BABD'),
(9,  'RB (AlphaTauri)','#6692FF'),
(10, 'Kick Sauber',   '#52E252');

SELECT setval('teams_id_seq', 10);

-- ── Seed Tracks ────────────────────────────────────────

INSERT INTO tracks (id, name, country) VALUES
(1,  'Bahrain International Circuit',    'Bahrain'),
(2,  'Jeddah Corniche Circuit',          'Saudi Arabia'),
(3,  'Albert Park Circuit',              'Australia'),
(4,  'Suzuka International Racing Course','Japan'),
(5,  'Shanghai International Circuit',   'China'),
(6,  'Miami International Autodrome',    'United States'),
(7,  'Circuit de Monaco',                'Monaco'),
(8,  'Circuit de Barcelona-Catalunya',   'Spain'),
(9,  'Circuit Gilles Villeneuve',        'Canada'),
(10, 'Silverstone Circuit',              'United Kingdom'),
(11, 'Hungaroring',                      'Hungary'),
(12, 'Circuit de Spa-Francorchamps',     'Belgium'),
(13, 'Autodromo Nazionale Monza',        'Italy'),
(14, 'Marina Bay Street Circuit',        'Singapore'),
(15, 'Circuit of the Americas',          'United States'),
(16, 'Autodromo Hermanos Rodriguez',     'Mexico'),
(17, 'Interlagos Circuit',               'Brazil'),
(18, 'Las Vegas Strip Circuit',          'United States'),
(19, 'Yas Marina Circuit',               'Abu Dhabi'),
(20, 'Autodromo Internacional do Algarve','Portugal'),
(21, 'Baku City Circuit',                'Azerbaijan'),
(22, 'Circuit Paul Ricard',              'France'),
(23, 'Sochi Autodrom',                   'Russia'),
(24, 'Red Bull Ring',                    'Austria'),
(25, 'Imola Circuit',                    'Italy');

SELECT setval('tracks_id_seq', 25);

-- ── Seed Placeholder Users ─────────────────────────────

INSERT INTO users (id, username, claimed) VALUES
('user_bingham',  'Bingham',  false),
('user_brock',    'Brock',    false),
('user_callum',   'Callum',   false),
('user_connor',   'Connor',   false),
('user_dan',      'Dan',      false),
('user_evan',     'Evan',     false),
('user_frenchy',  'Frenchy',  false),
('user_matthew',  'Matthew',  false),
('user_potto',    'Potto',    false),
('user_sighboys', 'Sighboys', false),
('user_steve',    'Steve',    false),
('user_tom',      'Tom',      false);

-- ── Seed Seasons ───────────────────────────────────────

INSERT INTO seasons (id, name, year) VALUES
(1, 'Bornana Season 4', 2022),
(2, 'Bornana Season 5', 2023),
(3, 'Bornana Season 6', 2024),
(4, 'Bornana Season 7', 2025),
(5, 'Summer Cup 2024',  2024);

SELECT setval('seasons_id_seq', 5);

-- ── Season Team Members ────────────────────────────────

-- Season 4 team assignments (2 per team)
INSERT INTO season_team_members (season_id, user_id, team_id) VALUES
(1, 'user_connor',   1), (1, 'user_dan',      1),
(1, 'user_brock',    2), (1, 'user_callum',   2),
(1, 'user_evan',     3), (1, 'user_frenchy',  3),
(1, 'user_matthew',  4), (1, 'user_potto',    4),
(1, 'user_sighboys', 5), (1, 'user_steve',    5),
(1, 'user_bingham',  6), (1, 'user_tom',      6);

-- Season 5 team assignments
INSERT INTO season_team_members (season_id, user_id, team_id) VALUES
(2, 'user_connor',   2), (2, 'user_brock',    2),
(2, 'user_callum',   1), (2, 'user_dan',      1),
(2, 'user_evan',     4), (2, 'user_frenchy',  4),
(2, 'user_matthew',  3), (2, 'user_potto',    3),
(2, 'user_sighboys', 6), (2, 'user_steve',    6),
(2, 'user_bingham',  5), (2, 'user_tom',      5);

-- Season 6 team assignments
INSERT INTO season_team_members (season_id, user_id, team_id) VALUES
(3, 'user_connor',   3), (3, 'user_evan',     3),
(3, 'user_brock',    1), (3, 'user_dan',      1),
(3, 'user_callum',   4), (3, 'user_frenchy',  4),
(3, 'user_matthew',  2), (3, 'user_potto',    2),
(3, 'user_sighboys', 5), (3, 'user_steve',    5),
(3, 'user_bingham',  7), (3, 'user_tom',      7);

-- ── Seed Races for Season 4 (10 races) ────────────────

INSERT INTO races (id, season_id, track_id, round_number, scheduled_date, is_completed) VALUES
(1,  1, 1,  1, '2022-03-20', true),
(2,  1, 2,  2, '2022-03-27', true),
(3,  1, 3,  3, '2022-04-10', true),
(4,  1, 4,  4, '2022-04-24', true),
(5,  1, 7,  5, '2022-05-29', true),
(6,  1, 8,  6, '2022-06-05', true),
(7,  1, 10, 7, '2022-07-03', true),
(8,  1, 12, 8, '2022-07-31', true),
(9,  1, 13, 9, '2022-09-11', true),
(10, 1, 19, 10,'2022-11-20', true);

-- ── Seed Races for Season 5 (10 races) ────────────────

INSERT INTO races (id, season_id, track_id, round_number, scheduled_date, is_completed) VALUES
(11, 2, 1,  1, '2023-03-05', true),
(12, 2, 2,  2, '2023-03-19', true),
(13, 2, 3,  3, '2023-04-02', true),
(14, 2, 6,  4, '2023-05-07', true),
(15, 2, 7,  5, '2023-05-28', true),
(16, 2, 9,  6, '2023-06-18', true),
(17, 2, 10, 7, '2023-07-09', true),
(18, 2, 11, 8, '2023-07-23', true),
(19, 2, 13, 9, '2023-09-03', true),
(20, 2, 19, 10,'2023-11-26', true);

-- ── Seed Races for Season 6 (12 races) ────────────────

INSERT INTO races (id, season_id, track_id, round_number, scheduled_date, is_completed) VALUES
(21, 3, 1,  1, '2024-03-02', true),
(22, 3, 2,  2, '2024-03-09', true),
(23, 3, 3,  3, '2024-03-24', true),
(24, 3, 4,  4, '2024-04-07', true),
(25, 3, 5,  5, '2024-04-21', true),
(26, 3, 6,  6, '2024-05-05', true),
(27, 3, 7,  7, '2024-05-26', true),
(28, 3, 8,  8, '2024-06-23', true),
(29, 3, 10, 9, '2024-07-07', true),
(30, 3, 11, 10,'2024-07-21', true),
(31, 3, 13, 11,'2024-09-01', true),
(32, 3, 19, 12,'2024-12-08', true);

SELECT setval('races_id_seq', 32);

-- ── Points mapping: P1=25, P2=18, P3=15, P4=12, P5=10, P6=8, P7=6, P8=4, P9=2, P10=1, P11+=0 ──

-- ── Race Results for Season 4 ─────────────────────────

-- Race 1 (Bahrain)
INSERT INTO race_results (race_id, user_id, position, points, dnf, team_id) VALUES
(1, 'user_connor',   1, 25, false, 1),
(1, 'user_evan',     2, 18, false, 3),
(1, 'user_brock',    3, 15, false, 2),
(1, 'user_callum',   4, 12, false, 2),
(1, 'user_dan',      5, 10, false, 1),
(1, 'user_matthew',  6,  8, false, 4),
(1, 'user_frenchy',  7,  6, false, 3),
(1, 'user_potto',    8,  4, false, 4),
(1, 'user_sighboys', 9,  2, false, 5),
(1, 'user_steve',   10,  1, false, 5),
(1, 'user_bingham', 11,  0, false, 6),
(1, 'user_tom',     12,  0, false, 6);

-- Race 2 (Jeddah)
INSERT INTO race_results (race_id, user_id, position, points, dnf, team_id) VALUES
(2, 'user_evan',     1, 25, false, 3),
(2, 'user_connor',   2, 18, false, 1),
(2, 'user_dan',      3, 15, false, 1),
(2, 'user_brock',    4, 12, false, 2),
(2, 'user_callum',   5, 10, false, 2),
(2, 'user_frenchy',  6,  8, false, 3),
(2, 'user_matthew',  7,  6, false, 4),
(2, 'user_potto',    8,  4, false, 4),
(2, 'user_steve',    9,  2, false, 5),
(2, 'user_sighboys',10,  1, false, 5),
(2, 'user_tom',     11,  0, false, 6),
(2, 'user_bingham', 12,  0, false, 6);

-- Race 3 (Melbourne)
INSERT INTO race_results (race_id, user_id, position, points, dnf, team_id) VALUES
(3, 'user_connor',   1, 25, false, 1),
(3, 'user_brock',    2, 18, false, 2),
(3, 'user_evan',     3, 15, false, 3),
(3, 'user_matthew',  4, 12, false, 4),
(3, 'user_callum',   5, 10, false, 2),
(3, 'user_dan',      6,  8, false, 1),
(3, 'user_frenchy',  7,  6, false, 3),
(3, 'user_potto',    8,  4, false, 4),
(3, 'user_sighboys', 9,  2, false, 5),
(3, 'user_steve',   10,  1, false, 5),
(3, 'user_tom',     NULL, 0, true, 6),
(3, 'user_bingham', NULL, 0, true, 6);

-- Race 4 (Suzuka)
INSERT INTO race_results (race_id, user_id, position, points, dnf, team_id) VALUES
(4, 'user_evan',     1, 25, false, 3),
(4, 'user_connor',   2, 18, false, 1),
(4, 'user_callum',   3, 15, false, 2),
(4, 'user_brock',    4, 12, false, 2),
(4, 'user_frenchy',  5, 10, false, 3),
(4, 'user_dan',      6,  8, false, 1),
(4, 'user_matthew',  7,  6, false, 4),
(4, 'user_potto',    8,  4, false, 4),
(4, 'user_steve',    9,  2, false, 5),
(4, 'user_sighboys',10,  1, false, 5),
(4, 'user_bingham', 11,  0, false, 6),
(4, 'user_tom',     12,  0, false, 6);

-- Race 5 (Monaco)
INSERT INTO race_results (race_id, user_id, position, points, dnf, team_id) VALUES
(5, 'user_connor',   1, 25, false, 1),
(5, 'user_evan',     2, 18, false, 3),
(5, 'user_dan',      3, 15, false, 1),
(5, 'user_brock',    4, 12, false, 2),
(5, 'user_matthew',  5, 10, false, 4),
(5, 'user_callum',   6,  8, false, 2),
(5, 'user_frenchy',  7,  6, false, 3),
(5, 'user_potto',    8,  4, false, 4),
(5, 'user_steve',    9,  2, false, 5),
(5, 'user_sighboys',10,  1, false, 5),
(5, 'user_tom',     11,  0, false, 6),
(5, 'user_bingham', NULL, 0, true, 6);

-- Race 6 (Barcelona)
INSERT INTO race_results (race_id, user_id, position, points, dnf, team_id) VALUES
(6, 'user_brock',    1, 25, false, 2),
(6, 'user_connor',   2, 18, false, 1),
(6, 'user_evan',     3, 15, false, 3),
(6, 'user_callum',   4, 12, false, 2),
(6, 'user_dan',      5, 10, false, 1),
(6, 'user_frenchy',  6,  8, false, 3),
(6, 'user_matthew',  7,  6, false, 4),
(6, 'user_potto',    8,  4, false, 4),
(6, 'user_sighboys', 9,  2, false, 5),
(6, 'user_steve',   10,  1, false, 5),
(6, 'user_tom',     11,  0, false, 6),
(6, 'user_bingham', 12,  0, false, 6);

-- Race 7 (Silverstone)
INSERT INTO race_results (race_id, user_id, position, points, dnf, team_id) VALUES
(7, 'user_connor',   1, 25, false, 1),
(7, 'user_evan',     2, 18, false, 3),
(7, 'user_brock',    3, 15, false, 2),
(7, 'user_dan',      4, 12, false, 1),
(7, 'user_callum',   5, 10, false, 2),
(7, 'user_matthew',  6,  8, false, 4),
(7, 'user_frenchy',  7,  6, false, 3),
(7, 'user_potto',    8,  4, false, 4),
(7, 'user_sighboys', 9,  2, false, 5),
(7, 'user_steve',   10,  1, false, 5),
(7, 'user_bingham', 11,  0, false, 6),
(7, 'user_tom',     NULL, 0, true, 6);

-- Race 8 (Spa)
INSERT INTO race_results (race_id, user_id, position, points, dnf, team_id) VALUES
(8, 'user_evan',     1, 25, false, 3),
(8, 'user_connor',   2, 18, false, 1),
(8, 'user_dan',      3, 15, false, 1),
(8, 'user_brock',    4, 12, false, 2),
(8, 'user_callum',   5, 10, false, 2),
(8, 'user_matthew',  6,  8, false, 4),
(8, 'user_frenchy',  7,  6, false, 3),
(8, 'user_steve',    8,  4, false, 5),
(8, 'user_potto',    9,  2, false, 4),
(8, 'user_sighboys',10,  1, false, 5),
(8, 'user_tom',     11,  0, false, 6),
(8, 'user_bingham', 12,  0, false, 6);

-- Race 9 (Monza)
INSERT INTO race_results (race_id, user_id, position, points, dnf, team_id) VALUES
(9, 'user_connor',   1, 25, false, 1),
(9, 'user_brock',    2, 18, false, 2),
(9, 'user_evan',     3, 15, false, 3),
(9, 'user_dan',      4, 12, false, 1),
(9, 'user_callum',   5, 10, false, 2),
(9, 'user_matthew',  6,  8, false, 4),
(9, 'user_frenchy',  7,  6, false, 3),
(9, 'user_potto',    8,  4, false, 4),
(9, 'user_sighboys', 9,  2, false, 5),
(9, 'user_steve',   10,  1, false, 5),
(9, 'user_tom',     11,  0, false, 6),
(9, 'user_bingham', NULL, 0, true, 6);

-- Race 10 (Abu Dhabi)
INSERT INTO race_results (race_id, user_id, position, points, dnf, team_id) VALUES
(10, 'user_connor',   1, 25, false, 1),
(10, 'user_evan',     2, 18, false, 3),
(10, 'user_brock',    3, 15, false, 2),
(10, 'user_dan',      4, 12, false, 1),
(10, 'user_callum',   5, 10, false, 2),
(10, 'user_matthew',  6,  8, false, 4),
(10, 'user_frenchy',  7,  6, false, 3),
(10, 'user_potto',    8,  4, false, 4),
(10, 'user_sighboys', 9,  2, false, 5),
(10, 'user_steve',   10,  1, false, 5),
(10, 'user_bingham', 11,  0, false, 6),
(10, 'user_tom',     12,  0, false, 6);

-- ── Race Results for Season 5 ─────────────────────────

-- Race 11 (Bahrain)
INSERT INTO race_results (race_id, user_id, position, points, dnf, team_id) VALUES
(11, 'user_connor',   1, 25, false, 2),
(11, 'user_callum',   2, 18, false, 1),
(11, 'user_evan',     3, 15, false, 4),
(11, 'user_brock',    4, 12, false, 2),
(11, 'user_matthew',  5, 10, false, 3),
(11, 'user_dan',      6,  8, false, 1),
(11, 'user_frenchy',  7,  6, false, 4),
(11, 'user_potto',    8,  4, false, 3),
(11, 'user_steve',    9,  2, false, 6),
(11, 'user_sighboys',10,  1, false, 6),
(11, 'user_bingham', 11,  0, false, 5),
(11, 'user_tom',     12,  0, false, 5);

-- Race 12 (Jeddah)
INSERT INTO race_results (race_id, user_id, position, points, dnf, team_id) VALUES
(12, 'user_callum',   1, 25, false, 1),
(12, 'user_connor',   2, 18, false, 2),
(12, 'user_brock',    3, 15, false, 2),
(12, 'user_evan',     4, 12, false, 4),
(12, 'user_dan',      5, 10, false, 1),
(12, 'user_matthew',  6,  8, false, 3),
(12, 'user_frenchy',  7,  6, false, 4),
(12, 'user_potto',    8,  4, false, 3),
(12, 'user_sighboys', 9,  2, false, 6),
(12, 'user_steve',   10,  1, false, 6),
(12, 'user_tom',     11,  0, false, 5),
(12, 'user_bingham', 12,  0, false, 5);

-- Race 13 (Melbourne)
INSERT INTO race_results (race_id, user_id, position, points, dnf, team_id) VALUES
(13, 'user_connor',   1, 25, false, 2),
(13, 'user_evan',     2, 18, false, 4),
(13, 'user_callum',   3, 15, false, 1),
(13, 'user_brock',    4, 12, false, 2),
(13, 'user_dan',      5, 10, false, 1),
(13, 'user_matthew',  6,  8, false, 3),
(13, 'user_frenchy',  7,  6, false, 4),
(13, 'user_potto',    8,  4, false, 3),
(13, 'user_steve',    9,  2, false, 6),
(13, 'user_sighboys',10,  1, false, 6),
(13, 'user_bingham', NULL, 0, true, 5),
(13, 'user_tom',     NULL, 0, true, 5);

-- Race 14 (Miami)
INSERT INTO race_results (race_id, user_id, position, points, dnf, team_id) VALUES
(14, 'user_evan',     1, 25, false, 4),
(14, 'user_connor',   2, 18, false, 2),
(14, 'user_callum',   3, 15, false, 1),
(14, 'user_brock',    4, 12, false, 2),
(14, 'user_dan',      5, 10, false, 1),
(14, 'user_frenchy',  6,  8, false, 4),
(14, 'user_matthew',  7,  6, false, 3),
(14, 'user_potto',    8,  4, false, 3),
(14, 'user_sighboys', 9,  2, false, 6),
(14, 'user_steve',   10,  1, false, 6),
(14, 'user_tom',     11,  0, false, 5),
(14, 'user_bingham', 12,  0, false, 5);

-- Race 15 (Monaco)
INSERT INTO race_results (race_id, user_id, position, points, dnf, team_id) VALUES
(15, 'user_connor',   1, 25, false, 2),
(15, 'user_callum',   2, 18, false, 1),
(15, 'user_evan',     3, 15, false, 4),
(15, 'user_brock',    4, 12, false, 2),
(15, 'user_dan',      5, 10, false, 1),
(15, 'user_matthew',  6,  8, false, 3),
(15, 'user_frenchy',  7,  6, false, 4),
(15, 'user_potto',    8,  4, false, 3),
(15, 'user_steve',    9,  2, false, 6),
(15, 'user_sighboys',10,  1, false, 6),
(15, 'user_tom',     11,  0, false, 5),
(15, 'user_bingham', 12,  0, false, 5);

-- Race 16 (Montreal)
INSERT INTO race_results (race_id, user_id, position, points, dnf, team_id) VALUES
(16, 'user_callum',   1, 25, false, 1),
(16, 'user_connor',   2, 18, false, 2),
(16, 'user_evan',     3, 15, false, 4),
(16, 'user_dan',      4, 12, false, 1),
(16, 'user_brock',    5, 10, false, 2),
(16, 'user_frenchy',  6,  8, false, 4),
(16, 'user_matthew',  7,  6, false, 3),
(16, 'user_potto',    8,  4, false, 3),
(16, 'user_sighboys', 9,  2, false, 6),
(16, 'user_steve',   10,  1, false, 6),
(16, 'user_bingham', 11,  0, false, 5),
(16, 'user_tom',     12,  0, false, 5);

-- Race 17 (Silverstone)
INSERT INTO race_results (race_id, user_id, position, points, dnf, team_id) VALUES
(17, 'user_connor',   1, 25, false, 2),
(17, 'user_evan',     2, 18, false, 4),
(17, 'user_callum',   3, 15, false, 1),
(17, 'user_brock',    4, 12, false, 2),
(17, 'user_dan',      5, 10, false, 1),
(17, 'user_matthew',  6,  8, false, 3),
(17, 'user_frenchy',  7,  6, false, 4),
(17, 'user_potto',    8,  4, false, 3),
(17, 'user_steve',    9,  2, false, 6),
(17, 'user_sighboys',10,  1, false, 6),
(17, 'user_bingham', 11,  0, false, 5),
(17, 'user_tom',     NULL, 0, true, 5);

-- Race 18 (Hungaroring)
INSERT INTO race_results (race_id, user_id, position, points, dnf, team_id) VALUES
(18, 'user_evan',     1, 25, false, 4),
(18, 'user_connor',   2, 18, false, 2),
(18, 'user_brock',    3, 15, false, 2),
(18, 'user_callum',   4, 12, false, 1),
(18, 'user_dan',      5, 10, false, 1),
(18, 'user_matthew',  6,  8, false, 3),
(18, 'user_frenchy',  7,  6, false, 4),
(18, 'user_potto',    8,  4, false, 3),
(18, 'user_sighboys', 9,  2, false, 6),
(18, 'user_steve',   10,  1, false, 6),
(18, 'user_tom',     11,  0, false, 5),
(18, 'user_bingham', 12,  0, false, 5);

-- Race 19 (Monza)
INSERT INTO race_results (race_id, user_id, position, points, dnf, team_id) VALUES
(19, 'user_connor',   1, 25, false, 2),
(19, 'user_callum',   2, 18, false, 1),
(19, 'user_evan',     3, 15, false, 4),
(19, 'user_brock',    4, 12, false, 2),
(19, 'user_dan',      5, 10, false, 1),
(19, 'user_matthew',  6,  8, false, 3),
(19, 'user_frenchy',  7,  6, false, 4),
(19, 'user_potto',    8,  4, false, 3),
(19, 'user_sighboys', 9,  2, false, 6),
(19, 'user_steve',   10,  1, false, 6),
(19, 'user_tom',     11,  0, false, 5),
(19, 'user_bingham', 12,  0, false, 5);

-- Race 20 (Abu Dhabi)
INSERT INTO race_results (race_id, user_id, position, points, dnf, team_id) VALUES
(20, 'user_connor',   1, 25, false, 2),
(20, 'user_evan',     2, 18, false, 4),
(20, 'user_callum',   3, 15, false, 1),
(20, 'user_brock',    4, 12, false, 2),
(20, 'user_dan',      5, 10, false, 1),
(20, 'user_matthew',  6,  8, false, 3),
(20, 'user_frenchy',  7,  6, false, 4),
(20, 'user_potto',    8,  4, false, 3),
(20, 'user_sighboys', 9,  2, false, 6),
(20, 'user_steve',   10,  1, false, 6),
(20, 'user_tom',     11,  0, false, 5),
(20, 'user_bingham', 12,  0, false, 5);

-- ── Race Results for Season 6 ─────────────────────────

-- Race 21 (Bahrain)
INSERT INTO race_results (race_id, user_id, position, points, dnf, team_id) VALUES
(21, 'user_connor',   1, 25, false, 3),
(21, 'user_brock',    2, 18, false, 1),
(21, 'user_evan',     3, 15, false, 3),
(21, 'user_callum',   4, 12, false, 4),
(21, 'user_dan',      5, 10, false, 1),
(21, 'user_matthew',  6,  8, false, 2),
(21, 'user_frenchy',  7,  6, false, 4),
(21, 'user_potto',    8,  4, false, 2),
(21, 'user_sighboys', 9,  2, false, 5),
(21, 'user_steve',   10,  1, false, 5),
(21, 'user_bingham', 11,  0, false, 7),
(21, 'user_tom',     12,  0, false, 7);

-- Race 22 (Jeddah)
INSERT INTO race_results (race_id, user_id, position, points, dnf, team_id) VALUES
(22, 'user_evan',     1, 25, false, 3),
(22, 'user_connor',   2, 18, false, 3),
(22, 'user_brock',    3, 15, false, 1),
(22, 'user_dan',      4, 12, false, 1),
(22, 'user_callum',   5, 10, false, 4),
(22, 'user_matthew',  6,  8, false, 2),
(22, 'user_frenchy',  7,  6, false, 4),
(22, 'user_potto',    8,  4, false, 2),
(22, 'user_sighboys', 9,  2, false, 5),
(22, 'user_steve',   10,  1, false, 5),
(22, 'user_tom',     11,  0, false, 7),
(22, 'user_bingham', 12,  0, false, 7);

-- Race 23 (Melbourne)
INSERT INTO race_results (race_id, user_id, position, points, dnf, team_id) VALUES
(23, 'user_connor',   1, 25, false, 3),
(23, 'user_evan',     2, 18, false, 3),
(23, 'user_brock',    3, 15, false, 1),
(23, 'user_callum',   4, 12, false, 4),
(23, 'user_dan',      5, 10, false, 1),
(23, 'user_matthew',  6,  8, false, 2),
(23, 'user_frenchy',  7,  6, false, 4),
(23, 'user_potto',    8,  4, false, 2),
(23, 'user_steve',    9,  2, false, 5),
(23, 'user_sighboys',10,  1, false, 5),
(23, 'user_tom',     NULL, 0, true, 7),
(23, 'user_bingham', NULL, 0, true, 7);

-- Race 24 (Suzuka)
INSERT INTO race_results (race_id, user_id, position, points, dnf, team_id) VALUES
(24, 'user_connor',   1, 25, false, 3),
(24, 'user_callum',   2, 18, false, 4),
(24, 'user_evan',     3, 15, false, 3),
(24, 'user_brock',    4, 12, false, 1),
(24, 'user_dan',      5, 10, false, 1),
(24, 'user_frenchy',  6,  8, false, 4),
(24, 'user_matthew',  7,  6, false, 2),
(24, 'user_potto',    8,  4, false, 2),
(24, 'user_sighboys', 9,  2, false, 5),
(24, 'user_steve',   10,  1, false, 5),
(24, 'user_bingham', 11,  0, false, 7),
(24, 'user_tom',     12,  0, false, 7);

-- Race 25 (Shanghai)
INSERT INTO race_results (race_id, user_id, position, points, dnf, team_id) VALUES
(25, 'user_evan',     1, 25, false, 3),
(25, 'user_connor',   2, 18, false, 3),
(25, 'user_brock',    3, 15, false, 1),
(25, 'user_dan',      4, 12, false, 1),
(25, 'user_callum',   5, 10, false, 4),
(25, 'user_matthew',  6,  8, false, 2),
(25, 'user_frenchy',  7,  6, false, 4),
(25, 'user_potto',    8,  4, false, 2),
(25, 'user_sighboys', 9,  2, false, 5),
(25, 'user_steve',   10,  1, false, 5),
(25, 'user_tom',     11,  0, false, 7),
(25, 'user_bingham', 12,  0, false, 7);

-- Race 26 (Miami)
INSERT INTO race_results (race_id, user_id, position, points, dnf, team_id) VALUES
(26, 'user_connor',   1, 25, false, 3),
(26, 'user_evan',     2, 18, false, 3),
(26, 'user_callum',   3, 15, false, 4),
(26, 'user_brock',    4, 12, false, 1),
(26, 'user_dan',      5, 10, false, 1),
(26, 'user_frenchy',  6,  8, false, 4),
(26, 'user_matthew',  7,  6, false, 2),
(26, 'user_potto',    8,  4, false, 2),
(26, 'user_sighboys', 9,  2, false, 5),
(26, 'user_steve',   10,  1, false, 5),
(26, 'user_tom',     11,  0, false, 7),
(26, 'user_bingham', NULL, 0, true, 7);

-- Race 27 (Monaco)
INSERT INTO race_results (race_id, user_id, position, points, dnf, team_id) VALUES
(27, 'user_connor',   1, 25, false, 3),
(27, 'user_brock',    2, 18, false, 1),
(27, 'user_evan',     3, 15, false, 3),
(27, 'user_dan',      4, 12, false, 1),
(27, 'user_callum',   5, 10, false, 4),
(27, 'user_matthew',  6,  8, false, 2),
(27, 'user_frenchy',  7,  6, false, 4),
(27, 'user_potto',    8,  4, false, 2),
(27, 'user_sighboys', 9,  2, false, 5),
(27, 'user_steve',   10,  1, false, 5),
(27, 'user_tom',     11,  0, false, 7),
(27, 'user_bingham', 12,  0, false, 7);

-- Race 28 (Barcelona)
INSERT INTO race_results (race_id, user_id, position, points, dnf, team_id) VALUES
(28, 'user_evan',     1, 25, false, 3),
(28, 'user_connor',   2, 18, false, 3),
(28, 'user_callum',   3, 15, false, 4),
(28, 'user_brock',    4, 12, false, 1),
(28, 'user_dan',      5, 10, false, 1),
(28, 'user_matthew',  6,  8, false, 2),
(28, 'user_frenchy',  7,  6, false, 4),
(28, 'user_potto',    8,  4, false, 2),
(28, 'user_steve',    9,  2, false, 5),
(28, 'user_sighboys',10,  1, false, 5),
(28, 'user_tom',     11,  0, false, 7),
(28, 'user_bingham', 12,  0, false, 7);

-- Race 29 (Silverstone)
INSERT INTO race_results (race_id, user_id, position, points, dnf, team_id) VALUES
(29, 'user_connor',   1, 25, false, 3),
(29, 'user_evan',     2, 18, false, 3),
(29, 'user_brock',    3, 15, false, 1),
(29, 'user_callum',   4, 12, false, 4),
(29, 'user_dan',      5, 10, false, 1),
(29, 'user_matthew',  6,  8, false, 2),
(29, 'user_frenchy',  7,  6, false, 4),
(29, 'user_potto',    8,  4, false, 2),
(29, 'user_sighboys', 9,  2, false, 5),
(29, 'user_steve',   10,  1, false, 5),
(29, 'user_tom',     NULL, 0, true, 7),
(29, 'user_bingham', NULL, 0, true, 7);

-- Race 30 (Hungaroring)
INSERT INTO race_results (race_id, user_id, position, points, dnf, team_id) VALUES
(30, 'user_evan',     1, 25, false, 3),
(30, 'user_connor',   2, 18, false, 3),
(30, 'user_brock',    3, 15, false, 1),
(30, 'user_callum',   4, 12, false, 4),
(30, 'user_dan',      5, 10, false, 1),
(30, 'user_frenchy',  6,  8, false, 4),
(30, 'user_matthew',  7,  6, false, 2),
(30, 'user_potto',    8,  4, false, 2),
(30, 'user_sighboys', 9,  2, false, 5),
(30, 'user_steve',   10,  1, false, 5),
(30, 'user_tom',     11,  0, false, 7),
(30, 'user_bingham', 12,  0, false, 7);

-- Race 31 (Monza)
INSERT INTO race_results (race_id, user_id, position, points, dnf, team_id) VALUES
(31, 'user_connor',   1, 25, false, 3),
(31, 'user_evan',     2, 18, false, 3),
(31, 'user_callum',   3, 15, false, 4),
(31, 'user_brock',    4, 12, false, 1),
(31, 'user_dan',      5, 10, false, 1),
(31, 'user_matthew',  6,  8, false, 2),
(31, 'user_frenchy',  7,  6, false, 4),
(31, 'user_potto',    8,  4, false, 2),
(31, 'user_sighboys', 9,  2, false, 5),
(31, 'user_steve',   10,  1, false, 5),
(31, 'user_tom',     11,  0, false, 7),
(31, 'user_bingham', NULL, 0, true, 7);

-- Race 32 (Abu Dhabi)
INSERT INTO race_results (race_id, user_id, position, points, dnf, team_id) VALUES
(32, 'user_connor',   1, 25, false, 3),
(32, 'user_evan',     2, 18, false, 3),
(32, 'user_brock',    3, 15, false, 1),
(32, 'user_dan',      4, 12, false, 1),
(32, 'user_callum',   5, 10, false, 4),
(32, 'user_matthew',  6,  8, false, 2),
(32, 'user_frenchy',  7,  6, false, 4),
(32, 'user_potto',    8,  4, false, 2),
(32, 'user_sighboys', 9,  2, false, 5),
(32, 'user_steve',   10,  1, false, 5),
(32, 'user_tom',     11,  0, false, 7),
(32, 'user_bingham', 12,  0, false, 7);
