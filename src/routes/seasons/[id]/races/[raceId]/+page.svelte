<script lang="ts">
	import { invalidateAll } from '$app/navigation';
	import { Card, CardContent, CardHeader, CardTitle } from '$lib/components/ui/card';
	import {
		Dialog,
		DialogContent,
		DialogHeader,
		DialogTitle,
		DialogFooter,
	} from '$lib/components/ui/dialog';
	import { Button } from '$lib/components/ui/button';
	import { Badge } from '$lib/components/ui/badge';
	import { Avatar } from '$lib/components/ui/avatar';
	import { Tooltip, TooltipTrigger, TooltipContent } from '$lib/components/ui/tooltip';
	import { formatPosition, getPoints } from '$lib/points';
	import { countryToFlag } from '$lib/utils';
	import { ArrowLeft, Plus, Trophy, CheckCircle, XCircle, X, Upload, AlertTriangle, Gavel } from 'lucide-svelte';

	let { data } = $props();

	let showAddResult = $state(false);
	let selectedUser = $state('');
	let position = $state(1);
	let qualPos = $state<number | undefined>(undefined);
	let isDnf = $state(false);
	let selectedTeam = $state('');
	let addingResult = $state(false);

	// Inline qualifying edit state
	let editingQualFor = $state<string | null>(null); // userId whose qual is being edited
	let editQualPos = $state<number | undefined>(undefined);
	let savingQual = $state(false);

	// ── CSV Import state ────────────────────────────────
	type ImportStep = 'upload' | 'mapping' | 'preview' | 'importing';

	interface CsvResult {
		position: number | null;
		driver: string;
		team: string;
		grid: number | null;
		stops: number;
		bestLap: string;
		time: string;
		isDnf: boolean;
		driverType: string; // 'Player' | 'AI'
	}

	interface CsvEvent {
		time: string;
		lap: number;
		driver: string;
		team: string;
		incident: string;
		penalty: string;
	}

	interface UniquePlayer {
		key: string;
		displayLabel: string;
		driver: string;
		team: string;
		grid: number | null;
	}

	let showImport = $state(false);
	let importStep = $state<ImportStep>('upload');
	let csvResults = $state<CsvResult[]>([]);
	let csvEvents = $state<CsvEvent[]>([]);
	let uniquePlayers = $state<UniquePlayer[]>([]);
	let playerMapping = $state<Record<string, string>>({}); // key → userId
	let importError = $state('');
	let importing = $state(false);

	function resetImport() {
		importStep = 'upload';
		csvResults = [];
		csvEvents = [];
		uniquePlayers = [];
		playerMapping = {};
		importError = '';
		importing = false;
	}

	function parseCSVLine(line: string): string[] {
		const result: string[] = [];
		let current = '';
		let inQuotes = false;
		for (const char of line) {
			if (char === '"') {
				inQuotes = !inQuotes;
			} else if (char === ',' && !inQuotes) {
				result.push(current.trim());
				current = '';
			} else {
				current += char;
			}
		}
		result.push(current.trim());
		return result;
	}

	function handleCsvFile(e: Event) {
		const input = e.target as HTMLInputElement;
		const file = input.files?.[0];
		if (!file) return;

		const reader = new FileReader();
		reader.onload = (ev) => {
			try {
				const text = ev.target?.result as string;
				const lines = text.split(/\r?\n/);

				// Find blank separator between the two tables
				let sepIdx = lines.findIndex((l, i) => i > 0 && l.trim() === '');
				if (sepIdx === -1) {
					importError = 'Could not find separator between results and events tables.';
					return;
				}

				const resultLines = lines.slice(0, sepIdx).filter((l) => l.trim());
				const eventLines = lines.slice(sepIdx + 1).filter((l) => l.trim());

				// Parse results (skip header row 0)
				const parsedResults: CsvResult[] = resultLines.slice(1).map((line) => {
					const cols = parseCSVLine(line);
					const time = cols[6] ?? '';
					return {
						position: parseInt(cols[0]) || null,
						driver: cols[1] ?? '',
						team: cols[2] ?? '',
						grid: parseInt(cols[3]) || null,
						stops: parseInt(cols[4]) || 0,
						bestLap: cols[5] ?? '',
						time,
						isDnf: time === 'DNF',
						driverType: cols[8] ?? ''
					};
				});

				// Parse events (skip header row 0)
				const parsedEvents: CsvEvent[] = eventLines.slice(1).map((line) => {
					const cols = parseCSVLine(line);
					return {
						time: cols[0] ?? '',
						lap: parseInt(cols[1]) || 0,
						driver: cols[2] ?? '',
						team: cols[3] ?? '',
						incident: cols[4] ?? '',
						penalty: cols[5] ?? ''
					};
				});

				csvResults = parsedResults;
				csvEvents = parsedEvents;

				// Identify unique named player drivers only (anonymous 'Player' entries cannot be identified)
				const seen = new Set<string>();
				const players: UniquePlayer[] = [];
				for (const r of parsedResults) {
					if (r.driverType !== 'Player') continue;
					if (r.driver === 'Player') continue; // skip anonymous — no way to identify them
					const key = `named::${r.driver}`;
					if (!seen.has(key)) {
						seen.add(key);
						players.push({ key, displayLabel: `${r.driver} — ${r.team} (Grid ${r.grid})`, driver: r.driver, team: r.team, grid: r.grid });
					}
				}

				uniquePlayers = players;
				playerMapping = {};
				importError = '';
				importStep = 'mapping';
			} catch (err) {
				importError = 'Failed to parse CSV file. Make sure it matches the expected format.';
			}
		};
		reader.readAsText(file);
		// reset input so same file can be re-uploaded
		input.value = '';
	}

	// Derived: player results with userId filled in
	const mappedResults = $derived(
		csvResults
			.filter((r) => r.driverType === 'Player' && r.driver !== 'Player')
			.map((r) => {
				const key = `named::${r.driver}`;
				const userId = playerMapping[key] ?? null;
				const user = userId ? data.allUsers.find((u: any) => u.id === userId) : null;
				return { ...r, userId, username: user?.username ?? null };
			})
	);

	const aiResults = $derived(csvResults.filter((r) => r.driverType === 'AI'));

	// Derived: events with userId filled in
	const mappedEvents = $derived(
		csvEvents.map((ev) => {
			// Try to find if this event's driver is a known player
			const matchingResult = csvResults.find(
				(r) => r.driverType === 'Player' && r.driver === ev.driver && r.team === ev.team
			);
			let userId: string | null = null;
			let isAi = false;
			if (matchingResult && matchingResult.driver !== 'Player') {
				const key = `named::${matchingResult.driver}`;
				userId = playerMapping[key] ?? null;
			} else {
				// Check if it's an AI driver
				const aiMatch = csvResults.find(
					(r) => r.driverType === 'AI' && r.driver === ev.driver
				);
				if (aiMatch) isAi = true;
			}
			return { ...ev, userId, isAi };
		})
	);

	const allPlayersMapped = $derived(uniquePlayers.every((p) => !!playerMapping[p.key]));

	async function confirmImport() {
		importing = true;
		try {
			const res = await fetch(`/api/races/${data.race.id}/import`, {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({
					results: mappedResults.filter((r) => r.userId),
					events: mappedEvents
				})
			});
			if (!res.ok) {
				const body = await res.json().catch(() => ({}));
				importError = body.message ?? 'Import failed. Please try again.';
				return;
			}
			showImport = false;
			resetImport();
			await invalidateAll();
		} catch {
			importError = 'Network error during import.';
		} finally {
			importing = false;
		}
	}

	// Map userId -> qualifying position
	const qualMap = $derived(
		Object.fromEntries((data.qualifying as any[]).map((q) => [q.userId, q.position]))
	);

	// When user changes, auto-fill team from season assignment
	$effect(() => {
		if (selectedUser && data.userTeamMap[selectedUser]) {
			selectedTeam = String(data.userTeamMap[selectedUser]);
		}
	});

	async function addResult() {
		if (!selectedUser) return;
		addingResult = true;
		try {
			const res = await fetch(`/api/races/${data.race.id}/results`, {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({
					userId: selectedUser,
					position: isDnf ? null : position,
					dnf: isDnf,
					teamId: selectedTeam ? parseInt(selectedTeam) : null
				})
			});
			if (res.ok) {
				// Also save qualifying if provided
				if (qualPos) {
					await fetch(`/api/races/${data.race.id}/qualifying`, {
						method: 'POST',
						headers: { 'Content-Type': 'application/json' },
						body: JSON.stringify({ userId: selectedUser, position: qualPos })
					});
				}
				showAddResult = false;
				selectedUser = '';
				isDnf = false;
				qualPos = undefined;
				position = data.results.length + 1;
				await invalidateAll();
			}
		} finally {
			addingResult = false;
		}
	}

	async function markCompleted() {
		await fetch(`/api/races/${data.race.id}`, {
			method: 'PATCH',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({ isCompleted: true })
		});
		await invalidateAll();
	}

	async function deleteResult(resultId: number) {
		if (!confirm('Delete this result? This cannot be undone.')) return;
		await fetch(`/api/races/${data.race.id}/results`, {
			method: 'DELETE',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({ resultId })
		});
		await invalidateAll();
	}

	function startEditQual(userId: string) {
		editingQualFor = userId;
		editQualPos = qualMap[userId] ?? undefined;
	}

	async function saveQual(userId: string) {
		if (!editQualPos) return;
		savingQual = true;
		try {
			await fetch(`/api/races/${data.race.id}/qualifying`, {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ userId, position: editQualPos })
			});
			editingQualFor = null;
			await invalidateAll();
		} finally {
			savingQual = false;
		}
	}

	async function clearQual(userId: string) {
		await fetch(`/api/races/${data.race.id}/qualifying`, {
			method: 'DELETE',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({ userId })
		});
		editingQualFor = null;
		await invalidateAll();
	}

	const RESULT_COLS = 'grid-cols-[2.5rem_1fr_3rem_4.5rem_8rem_7.5rem_3.5rem_5rem]';
	const EVENT_COLS = 'grid-cols-[4.5rem_10rem_1fr_auto]';
	const allDnf = $derived(data.results.length > 0 && (data.results as any[]).every((r) => r.dnf));
</script>

<div class="p-6 space-y-6">

	<!-- ── Header ─────────────────────────────────────────── -->
	<div class="flex items-start gap-3">
		<a href="/seasons/{data.season.id}" class="shrink-0 mt-0.5">
			<Button variant="ghost" size="icon" class="h-8 w-8">
				<ArrowLeft class="h-4 w-4" />
			</Button>
		</a>
		<div class="flex-1 min-w-0">
			<p class="text-xs font-medium uppercase tracking-widest text-muted-foreground mb-1.5">
				{data.season.name} · Round {data.race.roundNumber}{#if data.race.scheduledDate} · {data.race.scheduledDate}{/if}
			</p>
			<div class="flex items-center gap-3 flex-wrap">
				<h1 class="font-display text-3xl font-bold tracking-tight leading-none">
					{countryToFlag(data.race.trackCountry)} {data.race.trackName}
				</h1>
				{#if data.race.isCompleted}
					<Badge variant="success" class="mt-0.5">
						<CheckCircle class="h-3 w-3 mr-1" />Completed
					</Badge>
				{/if}
			</div>
		</div>
		<div class="flex items-center gap-2 shrink-0">
			{#if !data.race.isCompleted}
				<Button size="sm" variant="ghost" onclick={markCompleted}>
					<CheckCircle class="h-4 w-4 mr-1.5" />Mark Completed
				</Button>
			{/if}
			<Button size="sm" variant="outline" onclick={() => { resetImport(); showImport = true; }}>
				<Upload class="h-4 w-4 mr-1.5" />Import CSV
			</Button>
			<Button size="sm" onclick={() => (showAddResult = true)}>
				<Plus class="h-4 w-4 mr-1.5" />Add Result
			</Button>
		</div>
	</div>

	<!-- ── Results table ───────────────────────────────────── -->
	<div class="rounded-xl border border-border overflow-hidden">

		<!-- Column headers -->
		<div class="grid {RESULT_COLS} items-center gap-x-4 px-4 py-2.5 bg-muted/40 border-b border-border">
			<div class="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/60 text-center">P</div>
			<div class="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/60">Driver</div>
			<div class="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/60 text-center">Grid</div>
			<div class="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/60 text-center">Q</div>
			<div class="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/60">Time</div>
			<div class="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/60">FL</div>
			<div class="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/60 text-center">Stops</div>
			<div class="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/60 text-right">Pts</div>
		</div>

		{#if data.results.length === 0}
			<div class="py-16 flex flex-col items-center gap-3 text-center px-6">
				<Trophy class="h-10 w-10 text-gold/30" />
				<div>
					<p class="font-medium">No results yet</p>
					<p class="text-sm text-muted-foreground mt-0.5">Import a session CSV or add results manually</p>
				</div>
			</div>
		{:else}
			{#if allDnf && data.race.isCompleted}
				<div class="flex items-center gap-2.5 px-4 py-3 bg-destructive/5 border-b border-border/50">
					<XCircle class="h-4 w-4 text-destructive shrink-0" />
					<p class="text-sm text-destructive font-medium">Everyone retired — no finishers this race</p>
				</div>
			{/if}

			{#each data.results.sort((a: any, b: any) => {
				if (a.dnf && !b.dnf) return 1;
				if (!a.dnf && b.dnf) return -1;
				if (a.position === null) return 1;
				if (b.position === null) return -1;
				return a.position - b.position;
			}) as result}
				{@const isUser = result.userId === data.currentUserId}
				{@const isP1 = !result.dnf && result.position === 1}
				<div class="group grid {RESULT_COLS} items-center gap-x-4 px-4 py-3.5 border-b border-border/50 last:border-0 transition-colors
					{isP1 ? 'bg-gold/5' : ''}
					{result.dnf ? 'bg-destructive/5' : ''}
					{isUser && !isP1 && !result.dnf ? 'bg-blue/5' : ''}
					hover:bg-accent/40">

					<!-- P -->
					<div class="flex justify-center">
						{#if result.dnf}
							<span class="h-8 w-8 flex items-center justify-center rounded-full bg-destructive/15 text-[9px] font-bold leading-none text-destructive">DNF</span>
						{:else if result.position === 1}
							<span class="h-9 w-9 flex items-center justify-center rounded-full bg-gold text-gold-foreground text-sm font-extrabold tabular-nums shadow-sm">1</span>
						{:else if result.position === 2}
							<span class="h-8 w-8 flex items-center justify-center rounded-full bg-[#B5C0C8] text-[#1a1a1a] text-sm font-bold tabular-nums">2</span>
						{:else if result.position === 3}
							<span class="h-8 w-8 flex items-center justify-center rounded-full bg-amber-700 text-white text-sm font-bold tabular-nums">3</span>
						{:else}
							<span class="h-7 w-7 flex items-center justify-center rounded-full bg-muted text-muted-foreground text-xs font-semibold tabular-nums">{result.position}</span>
						{/if}
					</div>

					<!-- Driver -->
					<div class="flex items-center gap-2.5 min-w-0">
						{#if result.teamColor}
							<div class="w-0.5 h-9 rounded-full shrink-0" style="background-color: {result.teamColor}"></div>
						{:else}
							<div class="w-0.5 shrink-0"></div>
						{/if}
						<Avatar src={result.avatarUrl} fallback={result.username} class="h-7 w-7 shrink-0" />
						<div class="min-w-0">
							<a href="/profile/{result.userId}"
								class="font-semibold text-sm leading-tight truncate block hover:underline {result.dnf ? 'text-muted-foreground line-through' : ''}">
								{result.username}
							</a>
							{#if result.teamName}
								<p class="text-xs text-muted-foreground/70 leading-tight truncate">{result.teamName}</p>
							{/if}
						</div>
					</div>

					<!-- Grid -->
					<div class="text-center">
						{#if result.gridPosition}
							<span class="text-sm tabular-nums text-foreground/70 font-medium">{result.gridPosition}</span>
						{:else}
							<span class="text-muted-foreground/25">—</span>
						{/if}
					</div>

					<!-- Q -->
					<div class="flex justify-center">
						{#if editingQualFor === result.userId}
							<div class="flex items-center gap-1">
								<input
									type="number"
									bind:value={editQualPos}
									min="1" max="20"
									placeholder="1–20"
									class="w-12 rounded border border-blue/40 bg-blue/5 px-1.5 py-1 text-xs text-center text-blue font-medium focus:outline-none focus:ring-1 focus:ring-blue/40"
									onkeydown={(e) => e.key === 'Enter' && saveQual(result.userId)}
								/>
								<button onclick={() => saveQual(result.userId)} disabled={savingQual} class="rounded p-1 text-xs text-blue/70 hover:text-blue">✓</button>
								<button onclick={() => (editingQualFor = null)} class="rounded p-1 text-xs text-muted-foreground hover:text-foreground">✕</button>
							</div>
						{:else if qualMap[result.userId]}
							<Tooltip>
								<TooltipTrigger>
									<button onclick={() => startEditQual(result.userId)}
										class="flex items-center gap-1 rounded bg-blue/10 border border-blue/20 px-2 py-0.5 hover:bg-blue/15 transition-colors">
										<span class="text-[9px] font-bold uppercase tracking-wider text-blue/50">Q</span>
										<span class="text-sm font-bold tabular-nums text-blue leading-none">{qualMap[result.userId]}</span>
									</button>
								</TooltipTrigger>
								<TooltipContent>Qualifying position · click to edit</TooltipContent>
							</Tooltip>
						{:else if isUser}
							<button onclick={() => startEditQual(result.userId)}
								class="flex items-center gap-0.5 rounded border border-dashed border-blue/20 px-2 py-0.5 text-blue/25 hover:text-blue/50 hover:border-blue/35 transition-colors">
								<span class="text-[9px] font-bold uppercase tracking-wider">Q</span>
								<span class="text-xs">+</span>
							</button>
						{:else}
							<span class="text-muted-foreground/25">—</span>
						{/if}
					</div>

					<!-- Time -->
					<div>
						{#if result.dnf}
							<span class="text-xs text-destructive/50 font-semibold uppercase tracking-widest">DNF</span>
						{:else if result.raceTime}
							<span class="text-sm font-mono tabular-nums text-foreground/80">{result.raceTime}</span>
						{:else}
							<span class="text-muted-foreground/25">—</span>
						{/if}
					</div>

					<!-- FL -->
					<div>
						{#if result.bestLap}
							<span class="text-sm font-mono tabular-nums text-foreground/80">{result.bestLap}</span>
						{:else}
							<span class="text-muted-foreground/25">—</span>
						{/if}
					</div>

					<!-- Stops -->
					<div class="text-center">
						{#if result.stops != null}
							<span class="text-sm tabular-nums text-foreground/70 font-medium">{result.stops}</span>
						{:else}
							<span class="text-muted-foreground/25">—</span>
						{/if}
					</div>

					<!-- Pts + delete -->
					<div class="flex items-center justify-end gap-1.5">
						{#if isUser}
							<button
								onclick={() => deleteResult(result.id)}
								class="opacity-0 group-hover:opacity-100 rounded p-1 text-muted-foreground/40 hover:text-destructive hover:bg-destructive/10 transition-all"
							>
								<X class="h-3.5 w-3.5" />
							</button>
						{/if}
						{#if result.dnf}
							<span class="text-sm tabular-nums text-muted-foreground/40 font-medium w-8 text-right">0</span>
						{:else}
							<span class="font-display font-bold tabular-nums w-8 text-right {result.position === 1 ? 'text-gold text-xl' : 'text-foreground'}">{result.points}</span>
						{/if}
					</div>

				</div>
			{/each}
		{/if}
	</div>

	<!-- ── Race Events ─────────────────────────────────────── -->
	{#if data.events.length > 0}
		<div class="rounded-xl border border-border overflow-hidden">

			<div class="px-4 py-3 border-b border-border bg-muted/40 flex items-center justify-between">
				<span class="text-sm font-semibold">Race Events</span>
				<span class="text-xs text-muted-foreground tabular-nums">{data.events.length} incident{data.events.length !== 1 ? 's' : ''}</span>
			</div>

			<div class="grid {EVENT_COLS} items-center gap-x-4 px-4 py-2 bg-muted/20 border-b border-border/50">
				<div class="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/60">Lap · Time</div>
				<div class="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/60">Driver</div>
				<div class="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/60">Incident</div>
				<div class="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/60">Penalty</div>
			</div>

			{#each data.events as event}
				{@const hasPlayer = !!event.userId}
				{@const hasPenalty = !!event.penalty && event.penalty.trim() !== '' && event.penalty.toLowerCase() !== 'none'}
				<div class="grid {EVENT_COLS} items-center gap-x-4 px-4 py-3 border-b border-border/50 last:border-0 transition-colors hover:bg-accent/30 {hasPenalty ? 'bg-destructive/5' : ''}">

					<!-- Lap + time -->
					<div>
						<p class="text-sm font-semibold tabular-nums">Lap {event.lap ?? '—'}</p>
						{#if event.time}
							<p class="text-[11px] font-mono text-muted-foreground/55 mt-0.5">{event.time}</p>
						{/if}
					</div>

					<!-- Driver -->
					<div class="min-w-0">
						{#if hasPlayer}
							<a href="/profile/{event.userId}" class="font-semibold text-sm hover:underline truncate block">{event.username}</a>
						{:else if event.isAi}
							<span class="text-sm text-muted-foreground/60 italic truncate block">{event.driver}</span>
						{:else}
							<span class="text-sm font-medium truncate block">{event.driver}</span>
						{/if}
						<div class="flex items-center gap-1.5 mt-0.5">
							{#if event.team}
								<p class="text-xs text-muted-foreground/60 truncate">{event.team}</p>
							{/if}
							{#if event.isAi}
								<span class="text-[10px] bg-muted rounded px-1.5 py-0.5 text-muted-foreground font-medium shrink-0">AI</span>
							{/if}
						</div>
					</div>

					<!-- Incident -->
					<div class="min-w-0">
						{#if event.incident}
							<p class="text-sm text-foreground/80">{event.incident}</p>
						{:else}
							<span class="text-muted-foreground/25">—</span>
						{/if}
					</div>

					<!-- Penalty -->
					<div>
						{#if hasPenalty}
							<span class="inline-flex items-center gap-1 rounded-full bg-destructive/15 border border-destructive/25 px-2.5 py-0.5 text-xs font-semibold text-destructive whitespace-nowrap">
								<Gavel class="h-3 w-3 shrink-0" />{event.penalty}
							</span>
						{:else}
							<span class="text-muted-foreground/25">—</span>
						{/if}
					</div>

				</div>
			{/each}
		</div>
	{/if}

	<!-- ── Import CSV Dialog ───────────────────────────────── -->
	<Dialog bind:open={showImport} onOpenChange={(open) => { if (!open) resetImport(); }}>
		<DialogContent class="sm:max-w-2xl max-h-[85vh] overflow-y-auto">
			<DialogHeader>
				<DialogTitle>
					{#if importStep === 'upload'}Upload Session CSV{/if}
					{#if importStep === 'mapping'}Match Drivers to Members{/if}
					{#if importStep === 'preview'}Preview Import{/if}
					{#if importStep === 'importing'}Importing…{/if}
				</DialogTitle>
			</DialogHeader>

			{#if importError}
				<div class="rounded-md bg-destructive/10 border border-destructive/30 px-4 py-3 text-sm text-destructive">
					{importError}
				</div>
			{/if}

			{#if importStep === 'upload'}
				<div class="py-6 text-center space-y-4">
					<Upload class="h-10 w-10 mx-auto text-muted-foreground/40" />
					<div>
						<p class="text-sm text-muted-foreground mb-1">Select the session results CSV exported from the game.</p>
						<p class="text-xs text-muted-foreground">Expected columns: Pos., Driver, Team, Grid, Stops, Best, Time, Pts., driver type</p>
					</div>
					<label class="inline-flex cursor-pointer items-center gap-2 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors">
						<Upload class="h-4 w-4" />
						Choose File
						<input type="file" accept=".csv,text/csv" class="hidden" onchange={handleCsvFile} />
					</label>
				</div>
			{/if}

			{#if importStep === 'mapping'}
				<div class="py-2 space-y-4">
					<p class="text-sm text-muted-foreground">
						{uniquePlayers.length} human driver{uniquePlayers.length !== 1 ? 's' : ''} detected. Match each to a league member.
					</p>
					<div class="space-y-3">
						{#each uniquePlayers as player}
							<div class="flex items-center gap-3">
								<div class="flex-1 min-w-0">
									<p class="text-sm font-medium truncate">{player.displayLabel}</p>
								</div>
								<select
									value={playerMapping[player.key] ?? ''}
									onchange={(e) => {
										const val = (e.target as HTMLSelectElement).value;
										playerMapping = { ...playerMapping, [player.key]: val };
									}}
									class="w-48 rounded-md border border-input bg-background px-3 py-1.5 text-sm text-foreground"
								>
									<option value="">Choose member…</option>
									{#each data.allUsers as user}
										<option value={user.id}>{user.username}</option>
									{/each}
								</select>
							</div>
						{/each}
					</div>
					{#if uniquePlayers.length === 0}
						<p class="text-sm text-muted-foreground italic">No human drivers detected in this session.</p>
					{/if}
				</div>
				<DialogFooter>
					<Button variant="ghost" onclick={() => (importStep = 'upload')}>Back</Button>
					<Button onclick={() => (importStep = 'preview')} disabled={!allPlayersMapped && uniquePlayers.length > 0}>
						Preview →
					</Button>
				</DialogFooter>
			{/if}

			{#if importStep === 'preview'}
				<div class="py-2 space-y-5">
					<div>
						<h3 class="text-sm font-semibold mb-2">Race Results ({mappedResults.length} players + {aiResults.length} AI)</h3>
						<div class="rounded-md border border-border overflow-hidden">
							<table class="w-full text-xs">
								<thead>
									<tr class="bg-muted/50 border-b border-border">
										<th class="px-3 py-2 text-left font-medium">Pos</th>
										<th class="px-3 py-2 text-left font-medium">Driver</th>
										<th class="px-3 py-2 text-left font-medium">Team</th>
										<th class="px-3 py-2 text-left font-medium">Grid</th>
										<th class="px-3 py-2 text-left font-medium">Time</th>
										<th class="px-3 py-2 text-left font-medium">Pts</th>
									</tr>
								</thead>
								<tbody class="divide-y divide-border/50">
									{#each mappedResults as r}
										<tr class="{r.isDnf ? 'text-destructive/70' : ''}">
											<td class="px-3 py-2 font-mono">{r.isDnf ? 'DNF' : r.position}</td>
											<td class="px-3 py-2 font-medium">{r.username ?? r.driver}</td>
											<td class="px-3 py-2 text-muted-foreground">{r.team}</td>
											<td class="px-3 py-2 text-muted-foreground">{r.grid ?? '—'}</td>
											<td class="px-3 py-2 font-mono text-muted-foreground">{r.time}</td>
											<td class="px-3 py-2 font-semibold">{r.isDnf ? '0' : getPoints(r.position)}</td>
										</tr>
									{/each}
									{#each aiResults as r}
										<tr class="text-muted-foreground/50">
											<td class="px-3 py-2 font-mono">{r.isDnf ? 'DNF' : r.position}</td>
											<td class="px-3 py-2 italic">{r.driver} <span class="text-[10px] bg-muted rounded px-1">AI</span></td>
											<td class="px-3 py-2">{r.team}</td>
											<td class="px-3 py-2">{r.grid ?? '—'}</td>
											<td class="px-3 py-2 font-mono">{r.time}</td>
											<td class="px-3 py-2">—</td>
										</tr>
									{/each}
								</tbody>
							</table>
						</div>
						<p class="text-xs text-muted-foreground mt-1">AI drivers are shown for reference only and will not be stored.</p>
					</div>
					<div>
						<h3 class="text-sm font-semibold mb-2">Race Events ({csvEvents.length})</h3>
						<div class="rounded-md border border-border overflow-hidden max-h-52 overflow-y-auto">
							<table class="w-full text-xs">
								<thead class="sticky top-0 bg-muted/80">
									<tr class="border-b border-border">
										<th class="px-3 py-2 text-left font-medium">Time</th>
										<th class="px-3 py-2 text-left font-medium">Lap</th>
										<th class="px-3 py-2 text-left font-medium">Driver</th>
										<th class="px-3 py-2 text-left font-medium">Incident</th>
										<th class="px-3 py-2 text-left font-medium">Penalty</th>
									</tr>
								</thead>
								<tbody class="divide-y divide-border/50">
									{#each mappedEvents as ev}
										<tr>
											<td class="px-3 py-2 font-mono text-muted-foreground">{ev.time}</td>
											<td class="px-3 py-2 text-muted-foreground">{ev.lap}</td>
											<td class="px-3 py-2 font-medium">
												{#if ev.userId}
													{data.allUsers.find((u: any) => u.id === ev.userId)?.username ?? ev.driver}
												{:else if ev.isAi}
													<span class="text-muted-foreground/60 italic">{ev.driver} <span class="text-[10px] bg-muted rounded px-1">AI</span></span>
												{:else}
													{ev.driver}
												{/if}
											</td>
											<td class="px-3 py-2">{ev.incident}</td>
											<td class="px-3 py-2">{ev.penalty}</td>
										</tr>
									{/each}
								</tbody>
							</table>
						</div>
					</div>
				</div>
				<DialogFooter>
					<Button variant="ghost" onclick={() => (importStep = 'mapping')}>Back</Button>
					<Button onclick={confirmImport} disabled={importing}>
						{importing ? 'Importing…' : 'Confirm Import'}
					</Button>
				</DialogFooter>
			{/if}
		</DialogContent>
	</Dialog>

	<!-- ── Add Result Dialog ───────────────────────────────── -->
	<Dialog bind:open={showAddResult}>
		<DialogContent class="sm:max-w-lg">
			<DialogHeader>
				<DialogTitle>Add Result</DialogTitle>
			</DialogHeader>
			<div class="space-y-4 py-2">
				<div>
					<label for="result-driver" class="block text-sm font-medium mb-1.5">Driver</label>
					<select
						id="result-driver"
						bind:value={selectedUser}
						class="w-full rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground"
					>
						<option value="">Select driver...</option>
						{#each data.allUsers as user}
							<option value={user.id}>{user.username}</option>
						{/each}
					</select>
				</div>
				<div class="grid grid-cols-2 gap-4">
					<div>
						<label for="result-position" class="block text-sm font-medium mb-1.5">Race position</label>
						<input
							id="result-position"
							type="number"
							bind:value={position}
							min="1" max="20"
							disabled={isDnf}
							class="w-full rounded-md border border-input bg-background px-3 py-2 text-sm disabled:opacity-50"
						/>
					</div>
					<div>
						<label for="result-qual" class="block text-sm font-medium mb-1.5">Qualifying position</label>
						<input
							id="result-qual"
							type="number"
							bind:value={qualPos}
							min="1" max="20"
							placeholder="—"
							class="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
						/>
					</div>
				</div>
				<div>
					<label for="result-team" class="block text-sm font-medium mb-1.5">Team</label>
					<select
						id="result-team"
						bind:value={selectedTeam}
						class="w-full rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground"
					>
						<option value="">No team</option>
						{#each data.allTeams as team}
							<option value={team.id}>{team.name}</option>
						{/each}
					</select>
				</div>
				<label class="flex items-center gap-2 cursor-pointer">
					<input type="checkbox" bind:checked={isDnf} class="rounded" />
					<span class="text-sm font-medium">DNF</span>
				</label>
			</div>
			<DialogFooter>
				<Button variant="ghost" onclick={() => (showAddResult = false)}>Cancel</Button>
				<Button onclick={addResult} disabled={addingResult || !selectedUser}>
					{addingResult ? 'Adding...' : 'Add Result'}
				</Button>
			</DialogFooter>
		</DialogContent>
	</Dialog>

</div>
