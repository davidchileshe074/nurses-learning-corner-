export const Colors = {
    // DHIS2 Primary Colors
    primary: '#2c6693', // DHIS2 Primary Blue
    primaryDark: '#1d5288',
    primaryLight: '#dcecf5',

    // Status Colors
    success: '#217b44', // DHIS2 Green
    successLight: '#e7f3eb',
    warning: '#f0ad4e', // DHIS2 Yellow/Orange
    warningLight: '#fef7e1',
    error: '#d04437',   // DHIS2 Red
    errorLight: '#fbeae5',
    info: '#2c6693',
    infoLight: '#dcecf5',

    // Grays / Neutrals
    background: '#f3f5f7', // DHIS2 App Background
    surface: '#ffffff',
    text: '#1d2b36',      // Darker Charcoal
    textSecondary: '#4a5768',
    textMuted: '#6c7784',

    border: '#d5dde5',    // DHIS2 Border Blue-Gray
    borderLight: '#e8edf2',

    white: '#ffffff',
    black: '#000000',
    transparent: 'transparent',
    overlay: 'rgba(0,0,0,0.5)',
};

export const Spacing = {
    // 8pt Grid System
    none: 0,
    xs: 4,
    sm: 8,
    md: 16,
    lg: 24,
    xl: 32,
    xxl: 40,
    xxxl: 48,
};

export const BorderRadius = {
    none: 0,
    xs: 2,
    sm: 4,     // DHIS2 Standard
    md: 8,
    lg: 12,
    xl: 16,
    full: 9999,
};

export const Typography = {
    h1: {
        fontSize: 24,
        fontWeight: '700' as const,
        lineHeight: 32,
        color: Colors.text,
    },
    h2: {
        fontSize: 20,
        fontWeight: '700' as const,
        lineHeight: 28,
        color: Colors.text,
    },
    h3: {
        fontSize: 16,
        fontWeight: '600' as const,
        lineHeight: 24,
        color: Colors.text,
    },
    body: {
        fontSize: 14,
        lineHeight: 20,
        color: Colors.text,
    },
    bodySmall: {
        fontSize: 12,
        lineHeight: 18,
        color: Colors.textSecondary,
    },
    caption: {
        fontSize: 11,
        lineHeight: 16,
        color: Colors.textMuted,
    },
    label: {
        fontSize: 12,
        fontWeight: '600' as const,
        color: Colors.textSecondary,
        textTransform: 'uppercase' as const,
        letterSpacing: 0.5,
    }
};

export const Shadow = {
    none: {
        shadowColor: 'transparent',
        elevation: 0,
    },
    small: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.1,
        shadowRadius: 2,
        elevation: 1,
    },
    medium: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.15,
        shadowRadius: 4,
        elevation: 3,
    },
};

