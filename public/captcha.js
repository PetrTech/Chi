const captchaBox = document.getElementById('vxchi');

const captchaCheckbox = document.getElementById('vxchi-cb');
const captchaSpinner = document.getElementById('vxchi-spinner');
const captchaCheck = document.getElementById('vxchi-check');
const captchaFail = document.getElementById('vxchi-fail');

function setCaptchaSuccessState() {
    captchaCheckbox.classList.add('vxhidden');
    captchaCheckbox.classList.remove('vxshown');

    captchaSpinner.classList.add('vxhidden');
    captchaSpinner.classList.remove('vxshown');

    captchaCheck.classList.remove('vxhidden');
    captchaCheck.classList.add('vxshown');

    captchaFail.classList.add('vxhidden');
    captchaFail.classList.remove('vxshown');

    captchaCheckbox.ariaChecked = true;
}

function setCaptchaLoadingState() {
    captchaCheckbox.classList.add('vxhidden');
    captchaCheckbox.classList.remove('vxshown');

    captchaCheck.classList.add('vxhidden');
    captchaCheck.classList.remove('vxshown');

    captchaSpinner.classList.remove('vxhidden');
    captchaSpinner.classList.add('vxshown');

    captchaFail.classList.add('vxhidden');
    captchaFail.classList.remove('vxshown');

    captchaCheckbox.ariaChecked = false;
}

function setCaptchaFailedState() {
    captchaCheckbox.classList.add('vxhidden');
    captchaCheckbox.classList.remove('vxshown');

    captchaCheck.classList.add('vxhidden');
    captchaCheck.classList.remove('vxshown');

    captchaSpinner.classList.add('vxhidden');
    captchaSpinner.classList.remove('vxshown');

    captchaFail.classList.remove('vxhidden');
    captchaFail.classList.add('vxshown');

    captchaCheckbox.ariaChecked = false;

    setTimeout(resetCaptchaState, 2750);
}

function resetCaptchaState() {
    captchaBox.classList.remove("nohover");

    captchaCheckbox.classList.remove('vxhidden');
    captchaCheckbox.classList.add('vxshown');

    captchaCheck.classList.add('vxhidden');
    captchaCheck.classList.remove('vxshown');

    captchaSpinner.classList.add('vxhidden');
    captchaSpinner.classList.remove('vxshown');

    captchaFail.classList.add('vxhidden');
    captchaFail.classList.remove('vxshown');

    captchaCheckbox.ariaChecked = false;

    processingCaptcha = false;
}

async function fetchChallengeData() {
    const challengeRequest = await fetch('/v1/challenge', {
        method: 'GET',
    });
    if (!challengeRequest.ok) {
        throw new Error('Failed to get challenge!');
    }
    return challengeRequest.json();
}

async function calculateNonce(max, targetHash, salt) {
    const encoder = new TextEncoder();
    const saltStr = salt.toString();

    for (let i = 0; i <= max; i++) {
        const data = encoder.encode(saltStr + i);
        const hashBuffer = await crypto.subtle.digest('SHA-256', data);

        const bytes = new Uint8Array(hashBuffer);
        let binary = '';
        for (let j = 0; j < bytes.byteLength; j++) {
            binary += String.fromCharCode(bytes[j]);
        }

        const currentHash = btoa(binary)
            .replace(/\+/g, '-')
            .replace(/\//g, '_')
            .replace(/=+$/, '');

        if (currentHash === targetHash) {
            return i;
        }

        if (i % 5000 === 0) await new Promise((r) => setTimeout(r, 0));
    }
}

// shouldn't be called by client, only done for testing rn
// success state should be shown as soon as the client finds a valid nonce!
async function verifyNonce(nonce, challengeData) {
    const verifyRequest = await fetch('/v1/verify', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            Accepts: 'application/json',
            'x-chi-secret': '20ed00f12d9a38c028d68a1dc55cb5c70bfe969c11ee553e2150f732017154df',
        },
        body: JSON.stringify({
            salt: challengeData.salt,
            nonce,
            signature: challengeData.signature,
            challenge: challengeData.challenge,
            expiresAt: challengeData.expiresAt,
        }),
    });
    if (!verifyRequest.ok) {
        throw new Error('Failed to verify challenge!');
    }
    return verifyRequest.json();
}

let processingCaptcha = false;
captchaBox.addEventListener('click', async (e) => {
    try {
        if (processingCaptcha) return;
        processingCaptcha = true;
        captchaBox.classList.add("nohover");
        setCaptchaLoadingState();

        const challengeData = await fetchChallengeData();
        const nonce = await calculateNonce(
            challengeData.max,
            challengeData.challenge,
            challengeData.salt,
        );
        if (nonce === undefined) {
            throw new Error("No solution found within range");
        }

        setCaptchaSuccessState();
        window.parent.postMessage({
            type: 'CHI_SOLVED',
            payload: {
                nonce,
                salt: challengeData.salt,
                signature: challengeData.signature,
                challenge: challengeData.challenge,
                expiresAt: challengeData.expiresAt
            }
        }, '*')

        const msUntilExpiry = challengeData.expiresAt - Date.now();
        setTimeout(() => {
            setCaptchaFailedState();
            setTimeout(resetCaptchaState, 1250);
        }, Math.max(0, msUntilExpiry));
    } catch (e) {
        setCaptchaFailedState();
    }
});
