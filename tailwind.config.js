/** @type {import('tailwindcss').Config} */
module.exports = {
    content: ["./App.{js,jsx,ts,tsx}", "./src/**/*.{js,jsx,ts,tsx}"],
    presets: [require("nativewind/preset")],
    theme: {
        extend: {
            colors: {
                brand: {
                    DEFAULT: '#2563EB',
                    dark: '#1E3A8A',
                    light: '#3B82F6',
                    surface: '#EFF6FF',
                },
                accent: {
                    DEFAULT: '#F59E0B',
                    secondary: '#10B981',
                    tertiary: '#8B5CF6',
                },
                slate: {
                    50: '#F8FAFC',
                    100: '#F1F5F9',
                    200: '#E2E8F0',
                    400: '#94A3B8',
                    500: '#64748B',
                    600: '#475569',
                    900: '#0F172A',
                },
            },
        },
    },
    plugins: [],
}
