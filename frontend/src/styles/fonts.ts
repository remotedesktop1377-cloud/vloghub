import { Inter, Montserrat, Manrope, Poppins } from 'next/font/google'

// Load Google fonts with CSS variables for easy theming and fallback handling
export const inter = Inter({
	subsets: ['latin'],
	variable: '--font-inter',
	display: 'swap',
})

export const montserrat = Montserrat({
	subsets: ['latin'],
	variable: '--font-montserrat',
	display: 'swap',
})

export const manrope = Manrope({
	subsets: ['latin'],
	variable: '--font-manrope',
	display: 'swap',
})

export const poppins = Poppins({
	weight: ['300', '400', '500', '600', '700'],
	subsets: ['latin'],
	variable: '--font-poppins',
	display: 'swap',
})

export const fontVariablesClass = [
	inter.variable,
	montserrat.variable,
	manrope.variable,
	poppins.variable,
].join(' ')

export const fontStacks = {
	// Preferred defaults and fallbacks
	inter: `var(--font-inter), ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, Noto Sans, Ubuntu, Cantarell, Helvetica Neue, Arial, "Apple Color Emoji", "Segoe UI Emoji"`,
	montserrat: `var(--font-montserrat), ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, Noto Sans, Ubuntu, Cantarell, Helvetica Neue, Arial`,
	manrope: `var(--font-manrope), ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, Noto Sans, Ubuntu, Cantarell, Helvetica Neue, Arial`,
	poppins: `var(--font-poppins), ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, Noto Sans, Ubuntu, Cantarell, Helvetica Neue, Arial`,
}


