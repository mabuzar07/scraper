import got from "got";
import { HTTPMethods } from "./types";
import { proxyManager, fingerprintManager } from "utils/proxy";
import { logger } from "utils/logger";
import Bottleneck from "bottleneck";

// Advanced rate limiting with different tiers
const limiter = new Bottleneck({
  reservoir: 100, // Start with 100 requests
  reservoirRefreshAmount: 50, // Add 50 requests
  reservoirRefreshInterval: 60 * 1000, // Every minute
  maxConcurrent: 2, // Max 2 concurrent requests
  minTime: 2000, // Minimum 2 seconds between requests
});

// Global cookie jar and session management
const { CookieJar } = require("tough-cookie");
const cookieJar = new CookieJar();

// Session state management
let sessionInitialized = false;
let requestCount = 0;
let lastRequestTime = 0;
let currentFingerprint = fingerprintManager.getRandomFingerprint();
let fingerprintChangeInterval = 10; // Change fingerprint every 10 requests

export default async function gotProxy<T>(
  method: HTTPMethods,
  url: URL | string,
  opts?: any,
  retries: number = 0
): Promise<T> {
  if (typeof url === "string") {
    url = new URL(url);
  }

  // Wrap in rate limiter
  return await limiter.schedule(async () => {
    return await makeRequest<T>(method, url, opts, retries);
  });
}

async function makeRequest<T>(
  method: HTTPMethods,
  url: URL,
  opts?: any,
  retries: number = 0
): Promise<T> {
  // Initialize session on first request
  if (!sessionInitialized) {
    await initializeSession();
  }

  try {
    // Increment request count and manage fingerprint rotation
    requestCount++;

    // Change browser fingerprint periodically to avoid detection
    if (requestCount % fingerprintChangeInterval === 0) {
      currentFingerprint = fingerprintManager.getRandomFingerprint();
      logger.info(
        `🎭 Switched to new browser fingerprint: ${currentFingerprint.userAgent.substring(
          0,
          50
        )}...`
      );
    }

    // Progressive delay system with jitter
    const timeSinceLastRequest = Date.now() - lastRequestTime;
    const baseDelay = Math.floor(Math.random() * 3000) + 2000; // 2-5s base delay
    const progressiveDelay = Math.min(requestCount * 150, 8000); // Up to 8s additional delay
    const adaptiveDelay = retries > 0 ? Math.pow(2, retries) * 5000 : 0; // Exponential backoff on retries

    const totalDelay = Math.max(
      baseDelay + progressiveDelay + adaptiveDelay - timeSinceLastRequest,
      1000
    );

    if (totalDelay > 1000) {
      logger.info(
        `⏳ Intelligent delay: ${Math.round(totalDelay / 1000)}s (base: ${Math.round(
          baseDelay / 1000
        )}s, progressive: ${Math.round(progressiveDelay / 1000)}s, adaptive: ${Math.round(
          adaptiveDelay / 1000
        )}s)`
      );
      await new Promise((resolve) => setTimeout(resolve, totalDelay));
    }

    // Get current proxy and create agent (temporarily disabled due to free proxy issues)
    const currentProxy = null; // proxyManager.getCurrentProxy();
    let requestAgent = undefined;

    // Temporarily using direct connections with enhanced headers
    logger.info(`🔗 Request #${requestCount} via direct connection with enhanced headers`);

    // Build realistic headers based on current fingerprint
    const headers = buildRealisticHeaders(currentFingerprint, url.href, method);

    const requestOptions = {
      headers: {
        ...headers,
        ...(opts?.headers || {}),
      },
      agent: requestAgent
        ? {
            http: requestAgent,
            https: requestAgent,
          }
        : undefined,
      timeout: {
        request: 90000, // 90s total timeout
        response: 60000, // 60s response timeout
        connect: 30000, // 30s connection timeout
      },
      retry: {
        limit: 0, // We handle retries manually
      },
      http2: false, // Disable HTTP/2 for better compatibility
      followRedirect: true,
      maxRedirects: 3,
      cookieJar,
      decompress: true,
      dnsCache: false, // Disable DNS cache to avoid IP-based blocking
      ...opts,
    };

    // Make the request
    lastRequestTime = Date.now();
    const response = await got[method](url.href, requestOptions).json<T>();

    // Mark successful request
    if (currentProxy) {
      proxyManager.markProxyAsSuccessful(currentProxy);
    }

    logger.info(`✅ Request #${requestCount} successful: ${method.toUpperCase()} ${url.href}`);
    return response;
  } catch (err: any) {
    const statusCode = err.response?.statusCode;
    const errorName = err.name;

    logger.warn(
      `❌ Request #${requestCount} failed: ${method.toUpperCase()} ${
        url.href
      } - Status: ${statusCode}, Error: ${errorName}, Retry: ${retries}`
    );

    // Handle proxy-related errors
    const currentProxy = proxyManager.getCurrentProxy();
    if (
      currentProxy &&
      (errorName === "RequestError" ||
        errorName === "TimeoutError" ||
        statusCode === 407 || // Proxy authentication required
        err.message?.includes("proxy") ||
        err.message?.includes("ECONNREFUSED") ||
        err.message?.includes("ENOTFOUND"))
    ) {
      proxyManager.markProxyAsFailed(currentProxy, `${errorName}: ${err.message}`);
      logger.info(`🔄 Proxy marked as failed due to: ${errorName}`);
    }

    // Sophisticated error handling with different strategies
    if (statusCode === 403) {
      return await handle403Error(method, url, opts, retries);
    } else if (statusCode === 429) {
      return await handle429Error(method, url, opts, retries);
    } else if (statusCode === 502 || statusCode === 503 || statusCode === 504) {
      return await handle5xxError(method, url, opts, retries, statusCode);
    } else if (statusCode === 404) {
      logger.error(`🚫 Resource not found: ${url.href}`);
      throw new Error(`Resource not found: ${url.href}`);
    } else if (errorName === "TimeoutError" && retries < 2) {
      const waitTime = (retries + 1) * 10000; // 10s, 20s
      logger.info(`⏱️ Timeout - waiting ${waitTime / 1000}s before retry...`);
      await delay(waitTime);
      return await gotProxy(method, url, opts, retries + 1);
    } else if (retries < 2) {
      // Generic retry for other errors
      const waitTime = (retries + 1) * 5000; // 5s, 10s
      logger.info(`🔄 Generic error retry - waiting ${waitTime / 1000}s...`);
      await delay(waitTime);
      return await gotProxy(method, url, opts, retries + 1);
    }

    logger.error(
      `💥 Request failed permanently: ${method.toUpperCase()} ${url.href} after ${retries} retries`
    );
    throw err;
  }
}

async function initializeSession(): Promise<void> {
  try {
    logger.info("🔄 Initializing session with SofaScore...");

    // Temporarily disabled proxy usage for stability
    const fingerprint = fingerprintManager.getRandomFingerprint();

    // Visit homepage to establish session
    await got.get("https://www.sofascore.com/", {
      headers: {
        "User-Agent": fingerprint.userAgent,
        Accept:
          "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8",
        "Accept-Language": fingerprint.acceptLanguage,
        "Accept-Encoding": fingerprint.acceptEncoding,
        "Sec-Ch-Ua": fingerprint.secChUa,
        "Sec-Ch-Ua-Mobile": "?0",
        "Sec-Ch-Ua-Platform": fingerprint.secChUaPlatform,
        "Sec-Fetch-Dest": "document",
        "Sec-Fetch-Mode": "navigate",
        "Sec-Fetch-Site": "none",
        "Sec-Fetch-User": "?1",
        "Upgrade-Insecure-Requests": "1",
        "Cache-Control": "max-age=0",
        DNT: "1",
      },
      // Using direct connection with enhanced headers
      cookieJar,
      timeout: { request: 45000 },
      http2: false,
      followRedirect: true,
      maxRedirects: 5,
    });

    // Wait to simulate human browsing
    await delay(3000 + Math.random() * 4000); // 3-7s delay

    sessionInitialized = true;
    logger.info("✅ Session initialized successfully");
  } catch (error: any) {
    logger.warn(`⚠️ Failed to initialize session: ${error.message}`);

    // Mark proxy as failed if session init fails due to proxy
    const currentProxy = proxyManager.getCurrentProxy();
    if (currentProxy && (error.name === "RequestError" || error.name === "TimeoutError")) {
      proxyManager.markProxyAsFailed(currentProxy, "session init failed");
    }

    sessionInitialized = false; // Will retry on next request
  }
}

async function handle403Error<T>(
  method: HTTPMethods,
  url: URL,
  opts: any,
  retries: number
): Promise<T> {
  logger.warn(`🚫 403 Forbidden detected for ${url.href}`);

  if (retries >= 3) {
    logger.error(`🚫 Too many 403 errors, giving up on ${url.href}`);
    const stats = proxyManager.getProxyStats();
    logger.error(
      `📊 Proxy Stats: ${stats.working}/${stats.total} working, ${stats.success_rate.toFixed(
        1
      )}% success rate`
    );

    if (stats.working === 0) {
      logger.error(`💡 All proxies failed. Suggestions:`);
      logger.error(`   - Wait 1-2 hours before trying again`);
      logger.error(`   - Add more proxy servers to the pool`);
      logger.error(`   - Consider using premium residential proxies`);
      logger.error(`   - The API may have enhanced bot detection`);
    }

    throw new Error(`Permanent 403 block detected for ${url.href} - All bypass attempts failed`);
  }

  // Rotate to fresh proxy immediately
  const newProxy = proxyManager.rotateProxy();
  if (newProxy) {
    logger.info(
      `🔄 Rotated to fresh proxy after 403: ${newProxy.protocol}://${newProxy.host}:${newProxy.port} (${newProxy.country})`
    );
  }

  // Reset session to clear any tracking
  sessionInitialized = false;
  requestCount = 0;

  // Change fingerprint immediately
  currentFingerprint = fingerprintManager.getRandomFingerprint();

  // Progressive wait time for 403 errors
  const waitTime = Math.min(15000 + retries * 10000, 60000); // 15s to 45s
  logger.info(`🛑 Waiting ${waitTime / 1000}s to cool down after 403...`);
  await delay(waitTime);

  return await gotProxy(method, url, opts, retries + 1);
}

async function handle429Error<T>(
  method: HTTPMethods,
  url: URL,
  opts: any,
  retries: number
): Promise<T> {
  if (retries >= 2) {
    throw new Error(`Rate limit exceeded permanently for ${url.href}`);
  }

  // Exponential backoff for rate limiting
  const waitTime = Math.pow(2, retries + 3) * 5000; // 40s, 80s
  logger.warn(`⏱️ Rate limited - waiting ${waitTime / 1000}s...`);
  await delay(waitTime);

  return await gotProxy(method, url, opts, retries + 1);
}

async function handle5xxError<T>(
  method: HTTPMethods,
  url: URL,
  opts: any,
  retries: number,
  statusCode: number
): Promise<T> {
  if (retries >= 2) {
    throw new Error(`Server error ${statusCode} persists for ${url.href}`);
  }

  const waitTime = (retries + 1) * 8000; // 8s, 16s
  logger.warn(`🔧 Server error ${statusCode} - waiting ${waitTime / 1000}s...`);
  await delay(waitTime);

  return await gotProxy(method, url, opts, retries + 1);
}

function buildRealisticHeaders(
  fingerprint: any,
  refererUrl: string,
  method: string
): Record<string, string> {
  const baseHeaders: Record<string, string> = {
    "User-Agent": fingerprint.userAgent,
    Accept: method === "GET" ? "application/json, text/plain, */*" : "application/json",
    "Accept-Language": fingerprint.acceptLanguage,
    "Accept-Encoding": fingerprint.acceptEncoding,
    "Cache-Control": "no-cache",
    Pragma: "no-cache",
    DNT: "1",
    Connection: "keep-alive",
  };

  // Add Chrome-specific headers
  if (fingerprint.userAgent.includes("Chrome") && !fingerprint.userAgent.includes("Edg")) {
    baseHeaders["Sec-Ch-Ua"] = fingerprint.secChUa;
    baseHeaders["Sec-Ch-Ua-Mobile"] = "?0";
    baseHeaders["Sec-Ch-Ua-Platform"] = fingerprint.secChUaPlatform;
    baseHeaders["Sec-Fetch-Dest"] = "empty";
    baseHeaders["Sec-Fetch-Mode"] = "cors";
    baseHeaders["Sec-Fetch-Site"] = "same-site";
  }

  // Add realistic referer and origin for API calls
  if (refererUrl && refererUrl.includes("sofascore.com")) {
    baseHeaders["Referer"] = "https://www.sofascore.com/";
    baseHeaders["Origin"] = "https://www.sofascore.com";
  }

  return baseHeaders;
}

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
