import { HttpProxyAgent, HttpsProxyAgent } from "hpagent";
import { SocksProxyAgent } from "socks-proxy-agent";
import { logger } from "utils/logger";
import { ProxyConfig, ProxyStats, BrowserFingerprint } from "./types";

export class AdvancedProxyManager {
  private proxies: ProxyConfig[] = [];
  private currentIndex = 0;
  private failedProxies = new Map<string, { count: number; lastFailed: Date }>();
  private successfulRequests = new Map<string, number>();
  private rotationHistory: string[] = [];
  private maxRotationHistory = 50;

  constructor() {
    this.initializeProxies();
  }

  private initializeProxies() {
    // Multiple proxy pools for better success rate
    this.proxies = [
      // Free public HTTP proxies (rotating frequently)
      { host: "47.74.152.29", port: 8888, protocol: "http", type: "datacenter", country: "US" },
      { host: "138.68.60.8", port: 8080, protocol: "http", type: "datacenter", country: "US" },
      { host: "103.149.162.194", port: 80, protocol: "http", type: "datacenter", country: "ID" },
      { host: "185.162.231.166", port: 80, protocol: "http", type: "datacenter", country: "NL" },
      { host: "103.117.192.174", port: 80, protocol: "http", type: "datacenter", country: "ID" },
      { host: "202.61.51.204", port: 3128, protocol: "http", type: "datacenter", country: "ID" },
      { host: "103.87.169.204", port: 56642, protocol: "http", type: "datacenter", country: "ID" },
      { host: "194.5.193.183", port: 80, protocol: "http", type: "datacenter", country: "IT" },
      { host: "88.198.50.103", port: 8080, protocol: "http", type: "datacenter", country: "DE" },
      { host: "217.182.170.3", port: 8080, protocol: "http", type: "datacenter", country: "DE" },

      // Additional European proxies for geo-diversity
      { host: "91.134.139.238", port: 3128, protocol: "http", type: "datacenter", country: "FR" },
      { host: "51.158.68.68", port: 8811, protocol: "http", type: "datacenter", country: "FR" },
      { host: "195.154.255.194", port: 8000, protocol: "http", type: "datacenter", country: "FR" },

      // UK proxies
      { host: "178.62.193.19", port: 8080, protocol: "http", type: "datacenter", country: "UK" },
      { host: "46.101.13.77", port: 80, protocol: "http", type: "datacenter", country: "UK" },

      // Premium proxy slots (user can configure)
      // { host: "premium-proxy.com", port: 8080, username: "user", password: "pass", protocol: "http", type: "residential" },
    ];

    logger.info(`🌐 Initialized ${this.proxies.length} proxy servers across multiple countries`);
  }

  public getCurrentProxy(): ProxyConfig | null {
    if (this.proxies.length === 0) return null;

    // Filter out heavily failed proxies
    const workingProxies = this.proxies.filter((proxy) => {
      const key = this.getProxyKey(proxy);
      const failedInfo = this.failedProxies.get(key);

      if (!failedInfo) return true;

      // Reset proxy if it failed more than 5 times but not in last 30 minutes
      const timeDiff = Date.now() - failedInfo.lastFailed.getTime();
      if (failedInfo.count > 5 && timeDiff > 30 * 60 * 1000) {
        this.failedProxies.delete(key);
        return true;
      }

      return failedInfo.count < 3; // Allow up to 3 failures
    });

    if (workingProxies.length === 0) {
      logger.warn("🔄 All proxies heavily failed, resetting failure cache");
      this.failedProxies.clear();
      return this.proxies[0];
    }

    return workingProxies[this.currentIndex % workingProxies.length];
  }

  public rotateProxy(): ProxyConfig | null {
    const totalWorking = this.proxies.filter((proxy) => {
      const key = this.getProxyKey(proxy);
      const failedInfo = this.failedProxies.get(key);
      return !failedInfo || failedInfo.count < 3;
    }).length;

    this.currentIndex = (this.currentIndex + 1) % Math.max(totalWorking, 1);

    const newProxy = this.getCurrentProxy();
    if (newProxy) {
      const proxyKey = this.getProxyKey(newProxy);
      this.rotationHistory.push(proxyKey);

      if (this.rotationHistory.length > this.maxRotationHistory) {
        this.rotationHistory.shift();
      }

      logger.info(`🔄 Rotated to proxy: ${proxyKey} (${newProxy.country})`);
    }

    return newProxy;
  }

  public markProxyAsFailed(proxy: ProxyConfig, error?: string): void {
    const key = this.getProxyKey(proxy);
    const currentFailed = this.failedProxies.get(key) || { count: 0, lastFailed: new Date() };

    this.failedProxies.set(key, {
      count: currentFailed.count + 1,
      lastFailed: new Date(),
    });

    logger.warn(
      `❌ Proxy failure #${currentFailed.count + 1}: ${key} ${error ? `(${error})` : ""}`
    );

    // Auto-rotate to next proxy
    this.rotateProxy();
  }

  public markProxyAsSuccessful(proxy: ProxyConfig): void {
    const key = this.getProxyKey(proxy);
    const currentCount = this.successfulRequests.get(key) || 0;
    this.successfulRequests.set(key, currentCount + 1);

    // Reduce failure count on success
    const failedInfo = this.failedProxies.get(key);
    if (failedInfo && failedInfo.count > 0) {
      this.failedProxies.set(key, {
        count: Math.max(0, failedInfo.count - 1),
        lastFailed: failedInfo.lastFailed,
      });
    }
  }
  public createProxyAgent(proxy: ProxyConfig): HttpProxyAgent | HttpsProxyAgent | SocksProxyAgent {
    const proxyUrl = this.buildProxyUrl(proxy);

    const commonOptions = {
      timeout: 30000,
      keepAlive: true,
      keepAliveMsecs: 1000,
      maxSockets: 10,
      maxFreeSockets: 5,
    };

    switch (proxy.protocol) {
      case "socks5":
        return new SocksProxyAgent(proxyUrl, commonOptions);
      case "https":
        return new HttpsProxyAgent({ proxy: proxyUrl, ...commonOptions });
      default:
        // For HTTP proxies, use HttpsProxyAgent for HTTPS requests and HttpProxyAgent for HTTP requests
        return new HttpsProxyAgent({ proxy: proxyUrl, ...commonOptions });
    }
  }

  private buildProxyUrl(proxy: ProxyConfig): string {
    let url = `${proxy.protocol}://`;

    if (proxy.username && proxy.password) {
      url += `${encodeURIComponent(proxy.username)}:${encodeURIComponent(proxy.password)}@`;
    }

    url += `${proxy.host}:${proxy.port}`;
    return url;
  }

  private getProxyKey(proxy: ProxyConfig): string {
    return `${proxy.protocol}://${proxy.host}:${proxy.port}`;
  }

  public getProxyStats(): ProxyStats {
    const failed = this.failedProxies.size;
    const total = this.proxies.length;
    const working = total - failed;
    const totalSuccessful = Array.from(this.successfulRequests.values()).reduce(
      (sum, count) => sum + count,
      0
    );
    const totalFailed = Array.from(this.failedProxies.values()).reduce(
      (sum, info) => sum + info.count,
      0
    );

    return {
      total,
      failed,
      working,
      success_rate:
        totalSuccessful + totalFailed > 0
          ? (totalSuccessful / (totalSuccessful + totalFailed)) * 100
          : 0,
      last_rotation: new Date(),
    };
  }

  public async testProxy(proxy: ProxyConfig): Promise<boolean> {
    try {
      const got = require("got");
      const agent = this.createProxyAgent(proxy);

      const response = await got.get("https://httpbin.org/ip", {
        agent:
          proxy.protocol === "socks5"
            ? { http: agent, https: agent }
            : {
                http: agent,
                https: agent,
              },
        timeout: { request: 10000 },
        retry: { limit: 0 },
        headers: {
          "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
        },
      });

      const result = JSON.parse(response.body);
      logger.info(`✅ Proxy test successful: ${this.getProxyKey(proxy)} -> IP: ${result.origin}`);
      return true;
    } catch (error: any) {
      logger.warn(`❌ Proxy test failed: ${this.getProxyKey(proxy)} - ${error.message}`);
      return false;
    }
  }

  public async validateAllProxies(): Promise<ProxyConfig[]> {
    logger.info("🔍 Testing all proxy connections...");
    const validProxies: ProxyConfig[] = [];
    const testPromises: Promise<{ proxy: ProxyConfig; isValid: boolean }>[] = [];

    // Test proxies in batches to avoid overwhelming them
    for (let i = 0; i < this.proxies.length; i += 5) {
      const batch = this.proxies.slice(i, i + 5);

      for (const proxy of batch) {
        testPromises.push(this.testProxy(proxy).then((isValid) => ({ proxy, isValid })));
      }

      // Wait between batches
      if (i + 5 < this.proxies.length) {
        await new Promise((resolve) => setTimeout(resolve, 2000));
      }
    }
    const results = await Promise.all(
      testPromises.map((p) => p.catch((error) => ({ proxy: null, isValid: false, error })))
    );

    results.forEach((result: any) => {
      if (result.isValid && result.proxy) {
        validProxies.push(result.proxy);
      } else if (result.proxy) {
        this.markProxyAsFailed(result.proxy, "validation failed");
      }
    });

    logger.info(
      `✅ Validated ${validProxies.length} working proxies out of ${this.proxies.length} total`
    );
    return validProxies;
  }

  public getBestProxy(): ProxyConfig | null {
    // Return proxy with highest success rate
    let bestProxy: ProxyConfig | null = null;
    let bestScore = -1;

    for (const proxy of this.proxies) {
      const key = this.getProxyKey(proxy);
      const successCount = this.successfulRequests.get(key) || 0;
      const failedInfo = this.failedProxies.get(key);
      const failureCount = failedInfo ? failedInfo.count : 0;

      const score = successCount - failureCount * 2; // Penalize failures more

      if (score > bestScore) {
        bestScore = score;
        bestProxy = proxy;
      }
    }

    return bestProxy || this.getCurrentProxy();
  }

  public resetFailureCache(): void {
    this.failedProxies.clear();
    this.successfulRequests.clear();
    this.rotationHistory = [];
    logger.info("🔄 Reset all proxy failure caches");
  }
}

// Browser fingerprint manager for realistic requests
export class BrowserFingerprintManager {
  private fingerprints: BrowserFingerprint[] = [];
  private currentIndex = 0;

  constructor() {
    this.initializeFingerprints();
  }

  private initializeFingerprints() {
    this.fingerprints = [
      // Chrome on Windows
      {
        userAgent:
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        acceptLanguage: "en-US,en;q=0.9",
        acceptEncoding: "gzip, deflate, br",
        secChUa: '"Not_A Brand";v="8", "Chromium";v="120", "Google Chrome";v="120"',
        secChUaPlatform: '"Windows"',
        viewport: { width: 1920, height: 1080 },
        timezone: "America/New_York",
        cookiesEnabled: true,
      },
      // Chrome on Mac
      {
        userAgent:
          "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        acceptLanguage: "en-US,en;q=0.9",
        acceptEncoding: "gzip, deflate, br",
        secChUa: '"Not_A Brand";v="8", "Chromium";v="120", "Google Chrome";v="120"',
        secChUaPlatform: '"macOS"',
        viewport: { width: 1440, height: 900 },
        timezone: "America/Los_Angeles",
        cookiesEnabled: true,
      },
      // Firefox on Windows
      {
        userAgent:
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:121.0) Gecko/20100101 Firefox/121.0",
        acceptLanguage: "en-US,en;q=0.5",
        acceptEncoding: "gzip, deflate, br",
        secChUa: "",
        secChUaPlatform: "",
        viewport: { width: 1920, height: 1080 },
        timezone: "Europe/London",
        cookiesEnabled: true,
      },
      // Edge on Windows
      {
        userAgent:
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36 Edg/120.0.0.0",
        acceptLanguage: "en-US,en;q=0.9",
        acceptEncoding: "gzip, deflate, br",
        secChUa: '"Not_A Brand";v="8", "Chromium";v="120", "Microsoft Edge";v="120"',
        secChUaPlatform: '"Windows"',
        viewport: { width: 1366, height: 768 },
        timezone: "Europe/Berlin",
        cookiesEnabled: true,
      },
    ];
  }

  public getRandomFingerprint(): BrowserFingerprint {
    const randomIndex = Math.floor(Math.random() * this.fingerprints.length);
    return this.fingerprints[randomIndex];
  }

  public getNextFingerprint(): BrowserFingerprint {
    const fingerprint = this.fingerprints[this.currentIndex];
    this.currentIndex = (this.currentIndex + 1) % this.fingerprints.length;
    return fingerprint;
  }
}

// Global instances
export const proxyManager = new AdvancedProxyManager();
export const fingerprintManager = new BrowserFingerprintManager();
