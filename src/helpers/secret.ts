import { randomInt } from "node:crypto";

/**
 * Generates a secret for use in a captcha hash
 * @param digits Amount of digits the maximum secret can have
 * @returns The generated secret
 */
export const generateSecret = (digits: number): number => {
    const d = Math.min(14, digits);
    return randomInt(Math.pow(10, d));
};