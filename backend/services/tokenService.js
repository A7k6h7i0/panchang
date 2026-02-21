/**
 * services/tokenService.js
 * ────────────────────────────────────────────────────────────────
 * Smart Token Manager for Prokerala API (FREE vs PAID keys).
 *
 * Rules:
 *   - Year 2026 → uses FREE_CLIENT_ID + FREE_CLIENT_SECRET
 *   - All other years → uses PAID_CLIENT_ID + PAID_CLIENT_SECRET
 *
 * Token Caching:
 *   - Tokens are stored in memory after first fetch
 *   - Each token expires in ~1 hour (Prokerala standard)
 *   - A 30-second safety buffer is used before actual expiry
 *   - When token expires, it is automatically refreshed
 *   - This avoids calling the auth endpoint on every API call
 *
 * TOKEN ENDPOINT: POST https://api.prokerala.com/token
 * GRANT TYPE: client_credentials
 */

import axios from "axios";
import logger from "../config/logger.js";

// Prokerala OAuth 2.0 token endpoint
const TOKEN_URL = "https://api.prokerala.com/token";

// Safety margin: refresh token 30 seconds before it actually expires
const SAFETY_BUFFER_MS = 30_000;

/**
 * In-memory token cache.
 * Structure:
 * {
 *   free: { token: "abc...", expiresAtMs: 1700000000000, inFlight: null },
 *   paid: { token: "xyz...", expiresAtMs: 1700000000000, inFlight: null }
 * }
 */
const tokenCache = {
    free: { token: null, expiresAtMs: 0, inFlight: null },
    paid: { token: null, expiresAtMs: 0, inFlight: null },
};

/**
 * Determine which API key set to use based on the year.
 * Year 2026 → FREE key (limited credits)
 * Other years → PAID key (full access)
 *
 * @param {number} year
 * @returns {"free" | "paid"}
 */
function getKeyType(year) {
    return year === 2026 ? "free" : "paid";
}

/**
 * Fetch a new token from Prokerala's OAuth server.
 * @param {"free" | "paid"} keyType
 * @returns {Promise<string>} access token
 */
async function fetchNewToken(keyType) {
    // Choose credentials based on key type
    const clientId =
        keyType === "free"
            ? process.env.FREE_CLIENT_ID
            : process.env.PAID_CLIENT_ID;

    const clientSecret =
        keyType === "free"
            ? process.env.FREE_CLIENT_SECRET
            : process.env.PAID_CLIENT_SECRET;

    if (!clientId || !clientSecret) {
        throw new Error(
            `Missing credentials for key type "${keyType}". ` +
            `Check FREE_CLIENT_ID/FREE_CLIENT_SECRET or PAID_CLIENT_ID/PAID_CLIENT_SECRET in .env`
        );
    }

    logger.info(`[TokenService] Fetching new ${keyType.toUpperCase()} token from Prokerala...`);

    try {
        // Use URLSearchParams to send as x-www-form-urlencoded (required by Prokerala)
        const response = await axios.post(
            TOKEN_URL,
            new URLSearchParams({
                grant_type: "client_credentials",
                client_id: clientId,
                client_secret: clientSecret,
            }),
            {
                headers: { "Content-Type": "application/x-www-form-urlencoded" },
                timeout: 15000,
            }
        );

        const { access_token, expires_in } = response.data;

        if (!access_token || !expires_in) {
            throw new Error("Invalid token response from Prokerala auth server.");
        }

        // Store in cache: set expiry as current time + expires_in seconds
        const expiresAtMs = Date.now() + Number(expires_in) * 1000;
        tokenCache[keyType].token = access_token;
        tokenCache[keyType].expiresAtMs = expiresAtMs;

        logger.info(
            `[TokenService] ✅ Got ${keyType.toUpperCase()} token. ` +
            `Expires at: ${new Date(expiresAtMs).toISOString()}`
        );

        return access_token;

    } catch (err) {
        logger.error(`[TokenService] ❌ Failed to get ${keyType.toUpperCase()} token:`, err.message);
        throw err;
    }
}

/**
 * Get a valid access token for the given year.
 * Uses cache if token is still valid, fetches new one if expired.
 *
 * @param {number} year - The year for which data is being fetched
 * @param {boolean} forceRefresh - Force a new token even if cached
 * @returns {Promise<string>} Valid access token
 */
export async function getToken(year, forceRefresh = false) {
    const keyType = getKeyType(year);
    const cache = tokenCache[keyType];
    const now = Date.now();

    // Check if cached token is still valid (has not expired with safety buffer)
    const isValid = cache.token && (cache.expiresAtMs - SAFETY_BUFFER_MS) > now;

    if (!forceRefresh && isValid) {
        // Reuse the cached token — no API call needed
        logger.debug(`[TokenService] Reusing cached ${keyType.toUpperCase()} token.`);
        return cache.token;
    }

    // If a fetch is already in progress (prevents duplicate requests), wait for it
    if (cache.inFlight) {
        logger.debug(`[TokenService] Waiting for in-flight ${keyType.toUpperCase()} token fetch...`);
        return cache.inFlight;
    }

    // Start a new token fetch and store the promise (single-flight pattern)
    cache.inFlight = fetchNewToken(keyType).finally(() => {
        cache.inFlight = null; // Clear in-flight once done
    });

    return cache.inFlight;
}

/**
 * Expose cache status for monitoring/debugging.
 * Call GET /api/prokerala/token-status to see this info.
 */
export function getTokenCacheStatus() {
    const now = Date.now();
    return {
        free: {
            hasToken: !!tokenCache.free.token,
            expiresAt: tokenCache.free.expiresAtMs
                ? new Date(tokenCache.free.expiresAtMs).toISOString()
                : null,
            isValid: !!(tokenCache.free.token && tokenCache.free.expiresAtMs - SAFETY_BUFFER_MS > now),
            secondsRemaining: tokenCache.free.expiresAtMs
                ? Math.round((tokenCache.free.expiresAtMs - now) / 1000)
                : 0,
        },
        paid: {
            hasToken: !!tokenCache.paid.token,
            expiresAt: tokenCache.paid.expiresAtMs
                ? new Date(tokenCache.paid.expiresAtMs).toISOString()
                : null,
            isValid: !!(tokenCache.paid.token && tokenCache.paid.expiresAtMs - SAFETY_BUFFER_MS > now),
            secondsRemaining: tokenCache.paid.expiresAtMs
                ? Math.round((tokenCache.paid.expiresAtMs - now) / 1000)
                : 0,
        },
    };
}
