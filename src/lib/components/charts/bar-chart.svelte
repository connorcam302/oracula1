<script lang="ts">
	import { onMount, onDestroy } from 'svelte';
	import {
		Chart,
		BarController,
		BarElement,
		LinearScale,
		CategoryScale,
		Title,
		Tooltip,
		Legend
	} from 'chart.js';

	Chart.register(BarController, BarElement, LinearScale, CategoryScale, Title, Tooltip, Legend);

	interface Props {
		labels: string[];
		datasets: {
			label: string;
			data: number[];
			backgroundColor: string | string[];
			borderColor?: string | string[];
			borderWidth?: number;
		}[];
		title?: string;
		stacked?: boolean;
	}

	let { labels, datasets, title = '', stacked = false }: Props = $props();

	let canvas: HTMLCanvasElement;
	let chart: Chart | null = null;

	onMount(() => {
		chart = new Chart(canvas, {
			type: 'bar',
			data: { labels, datasets },
			options: {
				responsive: true,
				maintainAspectRatio: false,
				plugins: {
					title: {
						display: !!title,
						text: title
					},
					legend: {
						position: 'bottom',
						labels: {
							boxWidth: 12,
							padding: 15,
							font: { size: 11 }
						}
					}
				},
				scales: {
					y: {
						beginAtZero: true,
						stacked,
						grid: { color: 'rgba(128,128,128,0.1)' }
					},
					x: {
						stacked,
						grid: { color: 'rgba(128,128,128,0.1)' }
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
