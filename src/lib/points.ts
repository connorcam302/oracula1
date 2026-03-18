// F1 Points system: P1=25, P2=18, P3=15, P4=12, P5=10, P6=8, P7=6, P8=4, P9=2, P10=1
export const POINTS_MAP: Record<number, number> = {
	1: 25,
	2: 18,
	3: 15,
	4: 12,
	5: 10,
	6: 8,
	7: 6,
	8: 4,
	9: 2,
	10: 1
};

export function getPoints(position: number | null): number {
	if (position === null) return 0;
	return POINTS_MAP[position] || 0;
}

export function getPositionSuffix(position: number): string {
	if (position >= 11 && position <= 13) return 'th';
	switch (position % 10) {
		case 1:
			return 'st';
		case 2:
			return 'nd';
		case 3:
			return 'rd';
		default:
			return 'th';
	}
}

export function formatPosition(position: number | null, dnf: boolean): string {
	if (dnf) return 'DNF';
	if (position === null) return '-';
	return `P${position}`;
}
