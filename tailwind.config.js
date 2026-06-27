import defaultTheme from 'tailwindcss/defaultTheme';
import forms from '@tailwindcss/forms';

/** @type {import('tailwindcss').Config} */
export default {
    content: [
        './vendor/laravel/framework/src/Illuminate/Pagination/resources/views/*.blade.php',
        './storage/framework/views/*.php',
        './resources/views/**/*.blade.php',
        './resources/js/**/*.tsx',
    ],

    theme: {
        extend: {
            fontFamily: {
                sans: ['Inter', ...defaultTheme.fontFamily.sans],
                mono: ['JetBrains Mono', ...defaultTheme.fontFamily.mono],
            },
            colors: {
                primary: {
                    50: '#EFF3F8',
                    100: '#DDE6EF',
                    200: '#C2D1E0',
                    300: '#A6BBD0',
                    400: '#809CB8',
                    500: '#5C7DA0',
                    600: '#4B6A8C',
                    700: '#3F5A78',
                    800: '#2C4360',
                    900: '#233649',
                },
                ink: {
                    50: '#F8FAFC',
                    100: '#F1F5F9',
                    200: '#E2E8F0',
                    300: '#CBD5E1',
                    400: '#94A3B8',
                    500: '#64748B',
                    600: '#475569',
                    700: '#334155',
                    800: '#1E293B',
                    900: '#0F172A',
                },
                success: {
                    bg: '#ECFDF5',
                    DEFAULT: '#047857',
                    text: '#065F46',
                },
                warning: {
                    bg: '#FFFBEB',
                    DEFAULT: '#B45309',
                    text: '#92400E',
                },
                danger: {
                    bg: '#FEF2F2',
                    DEFAULT: '#B91C1C',
                    text: '#991B1B',
                },
                info: {
                    bg: '#EFF3F8',
                    DEFAULT: '#3F5A78',
                    text: '#2C4360',
                },
            },
            borderRadius: {
                sm: '6px',
                DEFAULT: '8px',
                md: '8px',
                lg: '12px',
                pill: '999px',
            },
            spacing: {
                1: '4px',
                2: '8px',
                3: '12px',
                4: '16px',
                6: '24px',
                8: '32px',
                12: '48px',
            },
            fontSize: {
                xs: ['11px', { lineHeight: '1.5' }],
                sm: ['12px', { lineHeight: '1.5' }],
                base: ['14px', { lineHeight: '1.6' }],
                md: ['16px', { lineHeight: '1.5' }],
                lg: ['18px', { lineHeight: '1.4' }],
                xl: ['22px', { lineHeight: '1.3' }],
                display: ['30px', { lineHeight: '1.2' }],
            },
            boxShadow: {
                none: 'none',
                focus: '0 0 0 2px #3F5A78',
            },
        },
    },

    plugins: [forms],
};
