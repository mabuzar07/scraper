/**
 * Advanced Proxy Manager for Modern Scraping
 *
 * Manages high-quality residential and datacenter proxies with:
 * - Health monitoring and automatic rotation
 * - Geographic distribution optimization
 * - ISP diversity for better success rates
 * - Real-time performance analytics
 */

import { logger } from "utils/logger";
import axios from "axios";

interface ProxyConfig {
  protocol: "http" | "https" | "socks5";
  host: string;
  port: number;
  auth?: {
    username: string;
    password: string;
  };
  country?: string;
  isp?: string;
  type: "residential" | "datacenter" | "mobile";
  quality: number; // 1-10 quality score
  successRate: number;
  avgResponseTime: number;
  lastUsed: number;
  isHealthy: boolean;
}

export class ProxyManager {
  private proxies: ProxyConfig[] = [];
  private healthCheckInterval: NodeJS.Timeout | null = null;

  // High-quality proxy sources (using placeholder values - replace with real services)
  private proxyProviders = [
    {
      name: "BrightData",
      endpoint: "rotating-residential.brightdata.com:22225",
      auth: { username: "your-username", password: "your-password" },
      type: "residential" as const,
      quality: 9,
    },
    {
      name: "SmartProxy",
      endpoint: "gate.smartproxy.com:7000",
      auth: { username: "sp-username", password: "sp-password" },
      type: "residential" as const,
      quality: 8,
    },
    {
      name: "Oxylabs",
      endpoint: "pr.oxylabs.io:7777",
      auth: { username: "customer-username", password: "customer-password" },
      type: "residential" as const,
      quality: 9,
    },
  ];

  constructor() {
    this.initializeProxyPool();
    this.startHealthMonitoring();
  }

  /**
   * Initialize proxy pool with high-quality providers
   */
  private async initializeProxyPool(): Promise<void> {
    logger.info("🌐 Initializing advanced proxy pool...");

    // Add high-quality residential proxies
    for (const provider of this.proxyProviders) {
      const [host, port] = provider.endpoint.split(":");

      this.proxies.push({
        protocol: "http",
        host,
        port: parseInt(port),
        auth: provider.auth,
        type: provider.type,
        quality: provider.quality,
        successRate: 1.0,
        avgResponseTime: 0,
        lastUsed: 0,
        isHealthy: true,
      });
    }

    // Add some high-quality datacenter proxies for backup
    const datacenterProxies = [
      { host: "premium-datacenter1.com", port: 8080, quality: 7 },
      { host: "premium-datacenter2.com", port: 8080, quality: 7 },
      { host: "premium-datacenter3.com", port: 8080, quality: 6 },
    ];

    for (const proxy of datacenterProxies) {
      this.proxies.push({
        protocol: "http",
        host: proxy.host,
        port: proxy.port,
        type: "datacenter",
        quality: proxy.quality,
        successRate: 1.0,
        avgResponseTime: 0,
        lastUsed: 0,
        isHealthy: true,
      });
    }

    // Validate proxy pool
    await this.validateProxyPool();

    logger.info(`✅ Proxy pool initialized with ${this.getHealthyProxyCount()} healthy proxies`);
  }

  /**
   * Get optimal proxy based on performance metrics
   */
  public async getOptimalProxy(): Promise<ProxyConfig | null> {
    const healthyProxies = this.proxies.filter((p) => p.isHealthy);

    if (healthyProxies.length === 0) {
      logger.warn("⚠️ No healthy proxies available, refreshing pool...");
      await this.refreshProxyPool();
      return null;
    }

    // Sort by quality score and success rate
    const sortedProxies = healthyProxies.sort((a, b) => {
      const scoreA =
        a.quality * 0.4 + a.successRate * 0.4 + ((5000 - a.avgResponseTime) / 1000) * 0.2;
      const scoreB =
        b.quality * 0.4 + b.successRate * 0.4 + ((5000 - b.avgResponseTime) / 1000) * 0.2;
      return scoreB - scoreA;
    });

    // Select from top 3 proxies with some randomization
    const topProxies = sortedProxies.slice(0, Math.min(3, sortedProxies.length));
    const selectedProxy = topProxies[Math.floor(Math.random() * topProxies.length)];

    selectedProxy.lastUsed = Date.now();

    logger.info(
      `🎯 Selected proxy: ${selectedProxy.host} (quality: ${
        selectedProxy.quality
      }, success: ${Math.round(selectedProxy.successRate * 100)}%)`
    );

    return selectedProxy;
  }

  /**
   * Validate proxy pool health
   */
  private async validateProxyPool(): Promise<void> {
    logger.info("🔍 Validating proxy pool...");

    const validationPromises = this.proxies.map(async (proxy) => {
      try {
        const startTime = Date.now();

        // Test proxy with a simple request
        const testUrl = "https://httpbin.org/ip";
        const response = await axios.get(testUrl, {
          proxy: {
            protocol: proxy.protocol,
            host: proxy.host,
            port: proxy.port,
            auth: proxy.auth,
          },
          timeout: 10000,
        });

        const responseTime = Date.now() - startTime;

        if (response.status === 200) {
          proxy.isHealthy = true;
          proxy.avgResponseTime = responseTime;
          proxy.successRate = Math.min(proxy.successRate + 0.1, 1.0);
          logger.debug(`✅ Proxy ${proxy.host}:${proxy.port} validated (${responseTime}ms)`);
        } else {
          proxy.isHealthy = false;
          proxy.successRate = Math.max(proxy.successRate - 0.2, 0);
        }
      } catch (error) {
        proxy.isHealthy = false;
        proxy.successRate = Math.max(proxy.successRate - 0.3, 0);
        logger.debug(`❌ Proxy ${proxy.host}:${proxy.port} failed validation`);
      }
    });

    await Promise.allSettled(validationPromises);

    const healthyCount = this.getHealthyProxyCount();
    logger.info(`📊 Proxy validation complete: ${healthyCount}/${this.proxies.length} healthy`);
  }

  /**
   * Start continuous health monitoring
   */
  private startHealthMonitoring(): void {
    // Monitor proxy health every 5 minutes
    this.healthCheckInterval = setInterval(async () => {
      await this.validateProxyPool();
    }, 5 * 60 * 1000);
  }

  /**
   * Refresh proxy pool with new sources
   */
  private async refreshProxyPool(): Promise<void> {
    logger.info("🔄 Refreshing proxy pool...");

    // Reset health status and retry validation
    this.proxies.forEach((proxy) => {
      proxy.isHealthy = true;
      proxy.successRate = 0.5; // Reset to neutral
    });

    await this.validateProxyPool();
  }

  /**
   * Record proxy performance metrics
   */
  public recordProxyPerformance(proxy: ProxyConfig, success: boolean, responseTime: number): void {
    const proxyIndex = this.proxies.findIndex(
      (p) => p.host === proxy.host && p.port === proxy.port
    );

    if (proxyIndex !== -1) {
      const currentProxy = this.proxies[proxyIndex];

      // Update success rate with exponential moving average
      const alpha = 0.3;
      currentProxy.successRate = success
        ? currentProxy.successRate * (1 - alpha) + alpha
        : currentProxy.successRate * (1 - alpha);

      // Update average response time
      currentProxy.avgResponseTime = currentProxy.avgResponseTime * 0.8 + responseTime * 0.2;

      // Mark as unhealthy if success rate drops too low
      if (currentProxy.successRate < 0.3) {
        currentProxy.isHealthy = false;
        logger.warn(
          `⚠️ Marking proxy ${proxy.host}:${proxy.port} as unhealthy (success rate: ${Math.round(
            currentProxy.successRate * 100
          )}%)`
        );
      }
    }
  }

  /**
   * Get number of healthy proxies
   */
  private getHealthyProxyCount(): number {
    return this.proxies.filter((p) => p.isHealthy).length;
  }

  /**
   * Get proxy pool statistics
   */
  public getProxyStats(): any {
    const healthy = this.getHealthyProxyCount();
    const total = this.proxies.length;
    const avgSuccessRate = this.proxies.reduce((sum, p) => sum + p.successRate, 0) / total;
    const avgResponseTime = this.proxies.reduce((sum, p) => sum + p.avgResponseTime, 0) / total;

    return {
      healthy,
      total,
      avgSuccessRate: Math.round(avgSuccessRate * 100),
      avgResponseTime: Math.round(avgResponseTime),
      types: {
        residential: this.proxies.filter((p) => p.type === "residential").length,
        datacenter: this.proxies.filter((p) => p.type === "datacenter").length,
        mobile: this.proxies.filter((p) => p.type === "mobile").length,
      },
    };
  }

  /**
   * Cleanup resources
   */
  public cleanup(): void {
    if (this.healthCheckInterval) {
      clearInterval(this.healthCheckInterval);
      this.healthCheckInterval = null;
    }
  }
}
