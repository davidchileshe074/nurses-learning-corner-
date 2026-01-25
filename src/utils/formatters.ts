import { Program, YearOfStudy } from '../types';

/**
 * Formats program code to user-friendly display name
 */
export const formatProgram = (program: Program): string => {
    const programMap: Record<Program, string> = {
        'REGISTERED-NURSING': 'Registered Nursing',
        'MIDWIFERY': 'Midwifery',
        'PUBLIC-HEALTH': 'Published Health Nursing',
        'MENTAL-HEALTH': 'Mental Health Nursing',
        'ONCOLOGY': 'Oncology Nursing',
        'PAEDIATRIC': 'Paediatric Nursing',
    };
    return programMap[program] || program;
};

/**
 * Formats year code to user-friendly display (e.g., "YEAR1" -> "1")
 */
export const formatYear = (year: YearOfStudy): string => {
    if (!year || typeof year !== 'string') return '';
    return year.replace('YEAR', '');
};

/**
 * Formats year code to full display (e.g., "YEAR1" -> "Year 1")
 */
export const formatYearFull = (year: YearOfStudy): string => {
    if (!year || typeof year !== 'string') return 'Year';
    return `Year ${year.replace('YEAR', '')}`;
};
