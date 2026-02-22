import rateLimit from "express-rate-limit";
import slowDown from "express-slow-down";

export const challengeSpeedLimiter = slowDown({
    windowMs: 7.5 * 60 * 1000, // window in milliseconds (default is 7.5 minutes)
    delayAfter: 3, // after how many requests within the window should the user be delayed
    delayMs: (hits) => hits * 750 // how many milliseconds to delay by
});

export const challengeRateLimiter = rateLimit({
    windowMs: 10 * 60 * 1000, // window in milliseconds (default is 10 minutes)
    max: 30, // how many requests before challenge starts failing
    message: 'Too many requests, please try again later.', // message to send (isn't shown to user)
});