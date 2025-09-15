
// This file contains a utility function for converting object keys from snake_case to camelCase.
// This is crucial for translating data from the backend (PostgreSQL/Supabase) to the frontend (TypeScript/JS).

const camelCase = (str: string) => str.replace(/_([a-z])/g, (_, letter) => letter.toUpperCase());

/**
 * Recursively converts the keys of an object using a provided converter function.
 * Handles nested objects and arrays.
 * @param converter - The function to convert a single key (e.g., camelCase).
 * @param obj - The object or array to convert.
 * @returns The new object or array with converted keys.
 */
const convertCase = (converter: (key: string) => string, obj: any): any => {
  if (obj === null || typeof obj !== 'object' || obj instanceof Date) {
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
