import { getRandomValues } from "node:crypto";

/**
 * Generates salt for use as an identifier and in a captcha hash
 * @param size Size of salt in bytes
 * @returns The generated salt
 */
export const generateSalt = (size: number): string => {
    const array = new Uint8Array(size);
    getRandomValues(array); 
    return Buffer.from(array).toString('hex');
};