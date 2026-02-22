import { Router } from "express";
import { generateChallenge, verifyChallenge } from "../controllers/captchaController";
import slowDown from "express-slow-down";
import rateLimit from "express-rate-limit";
import { internal } from "../middleware/internal";

const router: Router = Router();

const challengeSpeedLimiter = slowDown({
    windowMs: 7.5 * 60 * 1000,
    delayAfter: 2,
    delayMs: (hits) => hits * 750
});

const challengeRateLimiter = rateLimit({
    windowMs: 10 * 60 * 1000,
    max: 25,
    message: 'Too many requests, please try again later.',
});

router.get('/challenge', challengeSpeedLimiter, challengeRateLimiter, generateChallenge);
router.post('/verify', internal, verifyChallenge);

export default router;