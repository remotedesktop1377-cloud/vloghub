import { Plus_Jakarta_Sans } from 'next/font/google'

// Load Plus Jakarta Sans with CSS variable for easy theming and fallback handling
export const plusJakartaSans = Plus_Jakarta_Sans({
	weight: ['200', '300', '400', '500', '600', '700', '800'],
	subsets: ['latin'],
	variable: '--font-plus-jakarta-sans',
	display: 'swap',
})

export const fontVariablesClass = [
	plusJakartaSans.variable,
].join(' ')

export const fontStacks = {
	// Preferred default and fallbacks
	plusJakarta: `var(--font-plus-jakarta-sans)`,
}


