

// This file contains utility functions for case conversion and date/time manipulation.

const camelCase = (str: string) => str.replace(/_([a-z])/g, (_, letter) => letter.toUpperCase());
const snakeCase = (str: string) => str.replace(/[A-Z]/g, letter => `_${letter.toLowerCase()}`);


/**
 * Recursively converts the keys of an object using a provided converter function.
 * Handles nested objects and arrays.
 * @param converter - The function to convert a single key.
 * @param obj - The object or array to convert.
 * @returns The new object or array with converted keys.
 */
const convertCase = (converter: (key: string) => string, obj: any): any => {
  if (obj === null || typeof obj !== 'object' || obj instanceof Date || obj instanceof File) {
    return obj;
  }

  if (Array.isArray(obj)) {
    return obj.map(item => convertCase(converter, item));
  }

  return Object.keys(obj).reduce((acc, key) => {
    const newKey = converter(key);
    acc[newKey] = convertCase(converter, obj[key]);
    return acc;
  }, {} as { [key: string]: any });
};

/**
 * Converts all keys of an object from snake_case to camelCase.
 * @param obj - The object to convert.
 */
export const toCamelCase = (obj: any) => convertCase(camelCase, obj);

/**
 * Converts all keys of an object from camelCase to snake_case.
 * @param obj - The object to convert.
 */
export const toSnakeCase = (obj: any) => convertCase(snakeCase, obj);


/**
 * Formats a duration in minutes into a human-readable string like "Xh XXmin".
 * @param minutes - The total duration in minutes.
 * @returns The formatted string.
 */
export const formatDuration = (minutes: number): string => {
  if (isNaN(minutes) || minutes <= 0) {
    return '0min';
  }
  const hours = Math.floor(minutes / 60);
  const remainingMinutes = minutes % 60;
  
  let formatted = '';
  if (hours > 0) {
    formatted += `${hours}h`;
  }
  if (remainingMinutes > 0) {
    if (hours > 0) formatted += ' ';
    formatted += `${remainingMinutes}min`;
  }
  
  return formatted || '0min';
};

/**
 * Safely parses a string or number into an integer.
 * Returns 0 if the input is null, undefined, NaN, or an empty string.
 * @param value - The value to parse.
 * @returns The parsed integer or 0.
 */
export const parseSafeInt = (value: string | number | undefined | null): number => {
  if (value === null || value === undefined || value === '') {
    return 0;
  }
  const num = parseInt(String(value), 10);
  return isNaN(num) ? 0 : num;
};

/**
 * Parses duration strings like '30m', '4h', '2d', '12w' into milliseconds.
 * @param durationStr The string to parse.
 * @returns The duration in milliseconds.
 */
const parseDuration = (durationStr: string): number => {
    if (!durationStr || typeof durationStr !== 'string') return 0;
    const value = parseInt(durationStr.slice(0, -1), 10);
    const unit = durationStr.slice(-1);
    if (isNaN(value)) return 0;

    switch (unit) {
        case 'm': return value * 60 * 1000;
        case 'h': return value * 60 * 60 * 1000;
        case 'd': return value * 24 * 60 * 60 * 1000;
        case 'w': return value * 7 * 24 * 60 * 60 * 1000;
        default: return 0;
    }
}

/**
 * Formats a JavaScript Date object into a 'YYYY-MM-DD' string, ignoring timezones.
 * This is crucial for working with date columns in databases.
 * @param date - The Date object to format.
 * @returns The formatted 'YYYY-MM-DD' string.
 */
export const toYYYYMMDD = (date: Date): string => {
  const year = date.getFullYear();
  const month = (date.getMonth() + 1).toString().padStart(2, '0');
  const day = date.getDate().toString().padStart(2, '0');
  return `${year}-${month}-${day}`;
};

/**
 * Calculates the minimum and maximum bookable dates based on shop policies.
 * @param minNoticeStr - Minimum notice period (e.g., '4h', '1d').
 * @param maxHorizonStr - Maximum booking horizon (e.g., '12w', '52w').
 * @returns An object with minDate and maxDate as Date objects.
 */
export const getBookingBoundaries = (minNoticeStr: string, maxHorizonStr: string): { minDate: Date, maxDate: Date } => {
    const now = new Date();
    
    // The first bookable moment is now + notice period. This is the correct minDate.
    const minNoticeMs = parseDuration(minNoticeStr);
    const minDate = new Date(now.getTime() + minNoticeMs);

    const maxHorizonMs = parseDuration(maxHorizonStr);
    const maxDate = new Date(now.getTime() + maxHorizonMs);
    maxDate.setHours(23, 59, 59, 999); // Set maxDate to the end of the last bookable day

    return { minDate, maxDate };
};