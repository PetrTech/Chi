# Chi - A simple proof-of-work captcha system

<p align="center">
    <img width="761" height="472" alt="Logo" src="https://github.com/PetrTech/Chi/blob/main/Logo.png" />
</p>

Chi is a simple self-hosted proof-of-work captcha system, built from the ground up with a focus on privacy and user-friendliness.

## What is a proof-of-work captcha and why use it?

A proof-of-work (PoW) captcha requires the user’s device to perform computational work to find a shared secret.

- The difficulty is configurable via a cost parameter.
- At the default cost: 5, this process usually takes ~3 seconds.
- Combined with server-side slow-downs and rate limits, this makes spamming an endpoint costly and demotivating.

Unlike traditional captchas, proof-of-work captchas:

- Are privacy-friendly
- Send minimal information, of which none is personally identifiable

## Getting started

### Prerequisites

Certain software is required:

- NodeJS (v22+)
- NPM (included with NodeJS)
- git

### Clone the repository

```bash
git clone https://github.com/PetrTech/Chi.git Chi
cd Chi
```

### Install PNPM & dependencies

```bash
npm install -g pnpm
pnpm install
```

### Create configuration & project configuration

```bash
cp .env.example .env
```

It is recommended to run the project via `pnpm run dev` to fine-tune your configuration before it is built. This allows hot-reloading.
Edit the newly created .env file to configure ports, secrets, and certificates.
Other configuration can be found in src/config

#### Configure .env

Basic example .env configuration file:

```
PORT=8080
HOST=localhost
SECRET=secret-goes-here
CHI_INTERNAL_KEY=a-different-secret-goes-here
HTTPS_ENABLED=true
HTTPS_PRIVATE_KEY=./cert/pkey.key
HTTPS_CERT=./cert/cert.crt
```

Make sure to change HOST and PORT to expose the server publicly.
HTTPS is very strongly recommended, both the private key and certificate are required.
Generate both the SECRET and CHI_INTERNAL_KEY via `openssl rand -hex 32`. Both should differ from each other.
The CHI_INTERNAL_KEY is used by your backend to communicate with the captcha server's backend for challenge verification.

#### Configure Captcha options :: src/config/captcha.ts

```ts
export default {
    cost: 5, // 5 default & recommended - the maximum amount of digits the secret can have, exponential solve time increase
    ttl: 120, // maximum lifetime (in seconds) of a generated challenge before expiry
};
```

#### Configure Challenge options :: src/config/challenge.ts

This file is used for rate limiting and slow-down configuration. Default values are recommended, but can be changed based on needs.

```ts
import rateLimit from 'express-rate-limit';
import slowDown from 'express-slow-down';

// Limits the challenge submission speed
export const challengeSpeedLimiter = slowDown({
    windowMs: 7.5 * 60 * 1000, // window in milliseconds (default is 7.5 minutes)
    delayAfter: 3, // after how many requests within the window should the user be delayed
    delayMs: (hits) => hits * 750, // how many milliseconds to delay by
});

// Blocks the IP from interacting with the challenge endpoint after multiple attempts
export const challengeRateLimiter = rateLimit({
    windowMs: 10 * 60 * 1000, // window in milliseconds (default is 10 minutes)
    max: 30, // how many requests before challenge starts failing
    message: 'Too many requests, please try again later.', // message to send (isn't shown to user)
});
```

#### Configure CORS :: src/config/cors.ts

This is the MOST IMPORTANT configuration, without this, the CAPTCHA WILL NOT WORK AT ALL

```ts
import { CorsOptions } from 'cors';
import config from '../config';

// Add other domains that require Chi here (usually your main domain)
export const corsWhitelist = [
    `http://localhost:${config.port}`,
    // e.g.: 'https://example.com', 'https://admin.example.com'
];

// Ignore
export const corsOptions: CorsOptions = {
    origin: (origin, callback) => {
        if (!origin || corsWhitelist.indexOf(origin) !== -1) {
            callback(null, true);
        } else {
            callback(new Error('CORS said no'));
        }
    },
    methods: ['GET', 'POST'],
    allowedHeaders: ['Content-Type', 'X-Chi-Secret'],
    credentials: true,
    maxAge: 86400,
};
```

#### Configure the demo :: src/config/demo.ts

The demo page can be optionally hidden.

```ts
export default {
    captchaDemo: true, // Whether the captcha demo at / is available (if false, the homepage will be replaced with a 200 OK)
};
```

### Configuration note:

After every reconfiguration, the project will have to be rebuilt, unless running the project in development mode via `pnpm run dev`

### Build the project & start the server

```bash
pnpm run build
pnpm run start
```

### Post-build

Make sure the server is public for all users, it shouldn't be a localhost-only private service. Using a reverse proxy such as Nginx or Caddy is recommended.

### Website implementation

On your website, import the widget.js script from /static/widget.js. This allows you to use the \<chi-captcha base-url="https://your-captcha-server.tld/" \/> tag
Valid captcha example:

```html
<!DOCTYPE html>
    <html lang="en">
        <head>
        <script src="https://chi.example.com/static/widget.js" defer></script>
    </head>
    <body>
        <form action="/submit" method="POST">
            <chi-captcha base-url="https://chi.example.com/"></chi-captcha>
            <button type="submit">Submit</button>
        </form>
    </body>
</html>
```

> Note: The captcha must be used inside a form element, otherwise it cannot be verified by the backend.

### Backend implementation

#### \<chi-captcha\> inside \<form\>

A chi-response field will automatically be passed from the front-end via form data. This field needs to be forwarded to the captcha server for verification.
chi-response contains:

```json
{
    "salt": "abc123",
    "nonce": 65742,
    "signature": "too-long-to-put-an-example-here",
    "challenge": "original-challenge",
    "expiresAt": 1771756876829
}
```

Example:

```ts
import fetch from 'node-fetch';

app.post('/submit-form', async (req, res) => {
    const chiResponse = req.body['chi-response']; // This is the captcha response automatically forwarded from the front-end

    // Forward it to the captcha server
    const captchaVerification = await fetch(
        'https://chi.example.com/v1/verify',
        {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-Chi-Secret': process.env.CHI_INTERNAL_KEY, // the previously set CHI_INTERNAL_KEY secret in .env
            },
            body: chiResponse, // the JSON is already stringified
        },
    );

    const result = await captchaVerification.json();

    if (result.success) {
        res.status(200).send('Success!');
    } else {
        res.status(400).send('Captcha verification failed.');
    }
});
```

## Production checklist
- [ ] Both `SECRET` and `CHI_INTERNAL_KEY` are changed from defaults and differ from each other.
- [ ] `HTTPS_ENABLED` is set to `true`
- [ ] `corsWhitelist` ONLY includes your TRUSTED domains
- [ ] `captchaDemo` is set to `false` (no need to keep the demo page exposed)

## What's coming in the future?

Currently planned features:

- Other ways of verifying, including background or automatic checks via a library.
- Optional stricter verification - will require the user to submit a JWT which includes basic browser information (e.g. as screen width)


