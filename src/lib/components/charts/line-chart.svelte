<script lang="ts">
	import { onMount, onDestroy } from 'svelte';
	import {
		Chart,
		LineController,
		LineElement,
		PointElement,
		LinearScale,
		CategoryScale,
		Title,
		Tooltip,
		Legend
	} from 'chart.js';

	Chart.register(
		LineController,
		LineElement,
		PointElement,
		LinearScale,
		CategoryScale,
		Title,
		Tooltip,
		Legend
	);

	interface Props {
		labels: string[];
		datasets: {
			label: string;
			data: number[];
			borderColor: string;
			backgroundColor: string;
		}[];
		title?: string;
	}

	let { labels, datasets, title = '' }: Props = $props();

	let canvas: HTMLCanvasElement;
	let chart: Chart | null = null;

	function getThemeColors() {
		const isDark = document.documentElement.classList.contains('dark');
		return {
			gridColor: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)',
			tickColor: isDark ? 'rgba(255,255,255,0.45)' : 'rgba(0,0,0,0.45)',
			legendColor: isDark ? 'rgba(255,255,255,0.70)' : 'rgba(0,0,0,0.60)',
			tooltipBg: isDark ? '#1c1a19' : '#ffffff',
			tooltipBorder: isDark ? 'rgba(255,255,255,0.10)' : 'rgba(0,0,0,0.10)',
			tooltipText: isDark ? '#f2ede8' : '#171717'
		};
	}

	onMount(() => {
		const t = getThemeColors();
		chart = new Chart(canvas, {
			type: 'line',
			data: { labels, datasets },
			options: {
				responsive: true,
				maintainAspectRatio: false,
				interaction: { mode: 'index', intersect: false },
				plugins: {
					title: {
						display: !!title,
						text: title,
						color: t.legendColor
					},
					legend: {
						position: 'bottom',
						labels: {
							boxWidth: 10,
							borderRadius: 3,
							useBorderRadius: true,
							padding: 16,
							font: { size: 11, weight: 500 },
							color: t.legendColor
						}
					},
					tooltip: {
						backgroundColor: t.tooltipBg,
						borderColor: t.tooltipBorder,
						borderWidth: 1,
						titleColor: t.tooltipText,
						bodyColor: t.tooltipText,
						padding: 10,
						cornerRadius: 6
					}
				},
				scales: {
					y: {
						beginAtZero: true,
						grid: { color: t.gridColor },
						ticks: { color: t.tickColor, font: { size: 11 } },
						border: { color: 'transparent' }
					},
					x: {
						grid: { color: t.gridColor },
						ticks: { color: t.tickColor, font: { size: 11 } },
						border: { color: 'transparent' }
					}
				}
			}
		});
	});

	onDestroy(() => {
		chart?.destroy();
	});
</script>

<div class="relative h-80">
	<canvas bind:this={canvas}></canvas>
</div>
