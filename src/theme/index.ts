export const Colors = {
    primary: '#0984E3',
    secondary: '#E17055',
    success: '#00B894',
    warning: '#FDCB6E',
    error: '#D63031',
    background: '#F8FAFC',
    surface: '#FFFFFF',
    text: '#1E293B',
    textLight: '#64748B',
    textLighter: '#94A3B8',
    border: '#E2E8F0',
    borderLight: '#F1F5F9',
    white: '#FFFFFF',
    black: '#000000',
    transparent: 'transparent',
    overlay: 'rgba(0,0,0,0.5)',
};

export const Spacing = {
    xs: 4,
    sm: 8,
    md: 12,
    lg: 16,
    xl: 24,
    xxl: 32,
};

export const Typography = {
    h1: {
        fontSize: 28,
        fontWeight: 'bold' as const,
        lineHeight: 34,
    },
    h2: {
        fontSize: 22,
        fontWeight: 'bold' as const,
        lineHeight: 28,
    },
    h3: {
        fontSize: 18,
        fontWeight: 'bold' as const,
        lineHeight: 24,
    },
    body: {
        fontSize: 15,
        lineHeight: 20,
    },
    bodySmall: {
        fontSize: 13,
        lineHeight: 18,
    },
    caption: {
        fontSize: 11,
        lineHeight: 14,
    },
};

export const Shadow = {
    small: {
        shadowColor: '#64748B',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 4,
        elevation: 2,
    },
    medium: {
        shadowColor: '#64748B',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
        elevation: 4,
    },
};
