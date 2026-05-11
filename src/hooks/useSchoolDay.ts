/**
 * useSchoolDay Hook — Calculates the current school day number (1–180)
 * 
 * The school day is based on a configurable start date stored in localStorage.
 * Only weekdays (Mon–Fri) are counted. Weekends and holidays are automatically skipped.
 * 
 * If no start date is configured, it defaults to TODAY so new users begin at Day 1.
 * The Principal can change the start date via the Enrollment panel.
 * 
 * Usage:
 *   const { schoolDay, schoolDayLabel, setStartDate, startDate } = useSchoolDay();
 */

import { useState, useMemo } from 'react';

const TOTAL_SCHOOL_DAYS = 180;
const STORAGE_KEY = 'jaxon-academy-school-year-start';

/**
 * Computes the default start date for a brand-new installation.
 * Uses TODAY so users immediately start at Day 1.
 * The Principal can override this at any time.
 */
function getDefaultStartDate(): string {
    const today = new Date();
    const yyyy = today.getFullYear();
    const mm = String(today.getMonth() + 1).padStart(2, '0');
    const dd = String(today.getDate()).padStart(2, '0');
    return `${yyyy}-${mm}-${dd}`;
}

/**
 * Checks if a given date is a weekday (Monday=1 through Friday=5).
 */
function isWeekday(date: Date): boolean {
    const day = date.getDay();
    return day >= 1 && day <= 5;
}

/**
 * Formats a Date to 'YYYY-MM-DD' for holiday comparison.
 */
function toDateString(date: Date): string {
    return date.toISOString().split('T')[0];
}

/**
 * Generates the standard holiday calendar for the academic year 
 * starting in the given year.
 */
function getHolidays(startYear: number): Set<string> {
    const y = startYear;
    const ny = startYear + 1;
    return new Set([
        // Labor Day (first Monday of September — approximate)
        `${y}-09-01`,
        // Thanksgiving break
        `${y}-11-24`, `${y}-11-25`, `${y}-11-26`, `${y}-11-27`, `${y}-11-28`,
        // Christmas break (2 weeks)
        `${y}-12-22`, `${y}-12-23`, `${y}-12-24`, `${y}-12-25`, `${y}-12-26`,
        `${y}-12-29`, `${y}-12-30`, `${y}-12-31`, `${ny}-01-01`, `${ny}-01-02`,
        // MLK Day
        `${ny}-01-19`,
        // Presidents' Day
        `${ny}-02-16`,
        // Spring Break (1 week)
        `${ny}-03-16`, `${ny}-03-17`, `${ny}-03-18`, `${ny}-03-19`, `${ny}-03-20`,
        // Memorial Day
        `${ny}-05-25`,
    ]);
}

/**
 * Calculates how many school days have elapsed between the start date and today.
 * Skips weekends and holidays. Returns 1-indexed (first day = 1).
 */
function calculateSchoolDay(startDateStr: string): number {
    const start = new Date(startDateStr + 'T00:00:00');
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const holidaySet = getHolidays(start.getFullYear());
    let schoolDayCount = 0;
    const cursor = new Date(start);

    while (cursor <= today && schoolDayCount < TOTAL_SCHOOL_DAYS) {
        if (isWeekday(cursor) && !holidaySet.has(toDateString(cursor))) {
            schoolDayCount++;
        }
        cursor.setDate(cursor.getDate() + 1);
    }

    // Clamp to valid range
    return Math.max(1, Math.min(schoolDayCount, TOTAL_SCHOOL_DAYS));
}

export function useSchoolDay() {
    const [startDate, setStartDateState] = useState<string>(() => {
        return localStorage.getItem(STORAGE_KEY) || getDefaultStartDate();
    });

    const setStartDate = (newDate: string) => {
        localStorage.setItem(STORAGE_KEY, newDate);
        setStartDateState(newDate);
    };

    const schoolDay = useMemo(() => calculateSchoolDay(startDate), [startDate]);

    const schoolDayLabel = `School Day ${schoolDay} of ${TOTAL_SCHOOL_DAYS}`;

    const progressPercent = Math.round((schoolDay / TOTAL_SCHOOL_DAYS) * 100);

    return {
        /** Current school day number (1–180) */
        schoolDay,
        /** Human-readable label like "School Day 1 of 180" */
        schoolDayLabel,
        /** Percentage through the school year (0–100) */
        progressPercent,
        /** The configured school year start date (YYYY-MM-DD) */
        startDate,
        /** Update the school year start date */
        setStartDate,
        /** Total school days in the year */
        totalDays: TOTAL_SCHOOL_DAYS,
    };
}
