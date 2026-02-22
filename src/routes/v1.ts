import { Router } from "express";
import { generateChallenge, verifyChallenge } from "../controllers/captchaController";
import slowDown from "express-slow-down";
import rateLimit from "express-rate-limit";
import { internal } from "../middleware/internal";
import { challengeRateLimiter, challengeSpeedLimiter } from "../config/challenge";

const router: Router = Router();

router.get('/challenge', challengeSpeedLimiter, challengeRateLimiter, generateChallenge);
router.post('/verify', internal, verifyChallenge);

export default router;