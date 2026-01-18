import { Program, YearOfStudy } from '../types';

/**
 * Formats program code to user-friendly display name
 */
export const formatProgram = (program: Program): string => {
    const programMap: Record<Program, string> = {
        'G-NURSING': 'General Nursing',
        'MIDWIFERY': 'Midwifery',
        'PUBLIC-HEALTH': 'Public Health Nursing',
        'MENTAL-HEALTH': 'Mental Health Nursing',
    };
    return programMap[program] || program;
};

/**
 * Formats year code to user-friendly display (e.g., "YEAR1" -> "1")
 */
export const formatYear = (year: YearOfStudy): string => {
    return year.replace('YEAR', '');
};

/**
 * Formats year code to full display (e.g., "YEAR1" -> "Year 1")
 */
export const formatYearFull = (year: YearOfStudy): string => {
    return `Year ${year.replace('YEAR', '')}`;
};
