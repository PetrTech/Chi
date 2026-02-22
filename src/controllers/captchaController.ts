import { Request, Response } from 'express';
import { generateSalt } from '../helpers/salt';
import { generateSecret } from '../helpers/secret';
import config from '../config';
import { createHash, createHmac, sign, timingSafeEqual } from 'node:crypto';
import { verifySchema } from '../schemas/captchaSchema';
import z from 'zod';
import captcha from '../config/captcha';

const usedSalts = new Map<string, number>();

/**
 * Generates and returns a valid short-lived Captcha challenge
 * @param req Express Request
 * @param res Express Response
 */
export const generateChallenge = (req: Request, res: Response) => {
    const salt = generateSalt(24);
    const secret = generateSecret(captcha.cost);

    const combined = salt + secret.toString(10);

    const hash = createHash('sha256').update(combined).digest('base64url');

    const expiry = Date.now() + captcha.ttl * 1000;

    const signature = createHmac('sha256', config.secret)
        .update(`${hash}.${expiry}`)
        .digest('hex');

    const d = Math.min(14, captcha.cost);
    res.status(201).json({
        challenge: hash,
        max: Math.pow(10, d),
        salt,
        signature,
        ttl: captcha.ttl,
        expiresAt: expiry,
    });
};

export const verifyChallenge = (req: Request, res: Response) => {
    const result = verifySchema.safeParse(req.body);

    if (!result.success) {
        return res.status(400).json({
            error: 'Invalid payload format',
            details: z.treeifyError(result.error),
        });
    }
    
    const { nonce, salt, challenge, signature, expiresAt } = result.data;

    if (Date.now() > expiresAt) {
        return res.status(400).json({ error: 'Challenge expired' });
    }

    if (usedSalts.has(salt)) {
        return res
            .status(400)
            .json({ error: 'Challenge already solved (replay)' });
    }

    const expectedSignature = createHmac('sha256', config.secret)
        .update(`${challenge}.${expiresAt}`)
        .digest('hex');

    const isSignatureValid = timingSafeEqual(
        Buffer.from(signature),
        Buffer.from(expectedSignature),
    );

    if (!isSignatureValid) {
        return res.status(400).json({ error: 'Invalid challenge submission' });
    }

    const computedHash = createHash('sha256')
        .update(salt + nonce.toString())
        .digest('base64url');

    if (computedHash !== challenge) {
        return res.status(400).json({ error: 'Invalid challenge submission' });
    }

    usedSalts.set(salt, expiresAt);

    const delay = Math.max(0, expiresAt - Date.now());
    setTimeout(() => {
        usedSalts.delete(salt);
    }, delay);

    res.status(200).json({ status: 'OK', message: 'Valid captcha submission' });

    return true;
};
