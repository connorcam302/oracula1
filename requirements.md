# Oracula1 - F1 Race Tracking App

## Overview
F1 tracking web app for tracking race results with friends. Tech stack: SvelteKit, Tailwind, Drizzle, shadcn-svelte, Chart.js, PostgreSQL, Docker.

## Features

### Authentication
- Google OAuth login
- Email/password registration and login
- Username and profile picture
- Session management via Auth.js

### Seasons & Races
- Create seasons with name and year
- Add races to seasons from predefined tracks
- Mark races as completed
- Delete races and results
- Paginated race list (20 per page)

### Race Results
- Input race placements (positions 1-20+)
- Mark DNF (Did Not Finish) - earns 0 points but shows in results
- Points system: 25, 18, 15, 12, 10, 8, 6, 4, 2, 1
- View results per race with user avatars and team colors

### Teams
- 10 F1 teams with colors (McLaren, Ferrari, Red Bull, Mercedes, etc.)
- Assign 2 racers per team per season
- Change team assignments mid-season
- Constructor standings in stats

### Profiles
- User profile page with all race results
- Stats: total races, wins, podiums, points, DNFs
- Public profile pages to view other users
- DNF tracking

### Stats Page
- Driver standings (total points by user)
- Constructor standings (team points)
- Track performance charts (positions per track)
- Position distribution chart
- Points per race chart

### Claim System
- Pre-populated database with dummy race data
- Placeholder users (Bingham, Brock, Callum, Connor, Dan, Evan, Frenchy, Matthew, Potto, Sighboys, Steve, Tom)
- Users can claim existing profiles to inherit race data
- `claimed` boolean on users table

### UI/UX
- shadcn-svelte sidebar (collapsible)
- Navigation: Home, Seasons, Stats, Profile
- Account section in sidebar with sign in/out
- Responsive design
- Dark mode support

## Database Schema

### Tables
- **users**: id, username, email, passwordHash, avatarUrl, googleId, claimed
- **seasons**: id, name, year, createdBy
- **tracks**: id, name, country
- **races**: id, seasonId, trackId, roundNumber, scheduledDate, isCompleted
- **raceResults**: id, raceId, userId, position, points, dnf, teamId
- **teams**: id, name, color
- **seasonTeamMembers**: id, seasonId, userId, teamId, assignedAt

## Seed Data
- 10 F1 teams
- 22 tracks (Bahrain, Jeddah, Melbourne, Suzuka, Shanghai, Miami, Monaco, Barcelona, Montreal, Silverstone, Hungaroring, Spa, Monza, Singapore, Suzuka, Austin, Mexico, Sao Paulo, Las Vegas, Abu Dhabi, plus Portimão, Baku, Paul Ricard, Sochi, COTA)
- 5 seasons with race data (Bornana 4, 5, 6 + more)
- 12 placeholder users with race results

## Docker
- PostgreSQL 16 database
- Node.js app container
- init.sql runs on fresh volume to populate data
- Run `docker compose down -v && docker compose up` to reset DB
