import { tv, type VariantProps } from 'tailwind-variants';
import Root from './badge.svelte';

const badgeVariants = tv({
	base: 'inline-flex items-center rounded-md border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2',
	variants: {
		variant: {
			default: 'border-transparent bg-primary text-primary-foreground shadow',
			secondary: 'border-transparent bg-secondary text-secondary-foreground',
			destructive: 'border-transparent bg-destructive text-destructive-foreground shadow',
			outline: 'text-foreground border-border',
			/** Championship Gold — P1, completed, champion moments */
			gold: 'border-transparent bg-gold text-gold-foreground shadow',
			/** Data Blue — in-progress, info states */
			blue: 'border-transparent bg-blue text-blue-foreground shadow',
			/** Success green — confirmed, active, verified */
			success: 'border-transparent bg-success text-success-foreground shadow'
		}
	},
	defaultVariants: {
		variant: 'default'
	}
});

type Variant = VariantProps<typeof badgeVariants>['variant'];

export { Root, Root as Badge, badgeVariants, type Variant as BadgeVariant };
