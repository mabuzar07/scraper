/**
 * Modern SofaScore Scraper - Next Generation Anti-Detection System
 *
 * This scraper implements cutting-edge techniques to bypass modern anti-bot detection:
 * - Real browser automation with Puppeteer Stealth
 * - Advanced proxy rotation with residential proxies
 * - Machine learning-based behavioral patterns
 * - Advanced fingerprinting evasion
 * - CloudFlare bypass capabilities
 * - Request pattern analysis and adaptation
 */

import puppeteer, { Browser, Page } from "puppeteer";
import { logger } from "utils/logger";
import { Sports, IEventJoinedData, ScheduledEventsResponse } from "services/scrapper/types";
import { timestampToGreekTime } from "utils/date";
import { randomWait } from "utils/random";
import { ProxyManager } from "./proxy-manager";
import { FingerprintManager } from "./fingerprint-manager";
import { CloudFlareBypass } from "./cloudflare-bypass";
import { BehaviorEngine } from "./behavior-engine";
import winston from "winston";

interface ModernScrapperConfig {
  sport: Sports;
  date: string;
  maxRetries?: number;
  useProxy?: boolean;
  enableStealth?: boolean;
  behaviorProfile?: "human" | "casual" | "aggressive";
}

export class ModernSofaScoreScraper {
  private sport: Sports;
  private date: string;
  private logger: winston.Logger;
  private browser?: Browser;
  private page?: Page;
  private config: ModernScrapperConfig;

  // Advanced components
  private proxyManager: ProxyManager;
  private fingerprintManager: FingerprintManager;
  private cloudflareBypass: CloudFlareBypass;
  private behaviorEngine: BehaviorEngine; // State management
  private requestCount = 0;
  private adaptiveDelay = 2000;
  private sessionHealth = 100;
  private lastBlockedTime = 0;

  constructor(config: ModernScrapperConfig) {
    this.sport = config.sport;
    this.date = config.date;
    this.config = {
      maxRetries: 5,
      useProxy: true,
      enableStealth: true,
      behaviorProfile: "human",
      ...config,
    };

    this.logger = logger.child({
      scraper: "modern",
      sport: this.sport,
      date: this.date,
    });

    // Initialize advanced components
    this.proxyManager = new ProxyManager();
    this.fingerprintManager = new FingerprintManager();
    this.cloudflareBypass = new CloudFlareBypass();
    this.behaviorEngine = new BehaviorEngine(this.config.behaviorProfile);
  }

  /**
   * Initialize browser with maximum stealth configuration
   */
  private async initializeBrowser(): Promise<void> {
    try {
      this.logger.info("🚀 Initializing stealth browser...");

      const proxyConfig = this.config.useProxy ? await this.proxyManager.getOptimalProxy() : null;
      const fingerprint = this.fingerprintManager.generateAdvancedFingerprint();

      const launchOptions: any = {
        headless: "new", // Use new headless mode
        args: [
          "--no-sandbox",
          "--disable-setuid-sandbox",
          "--disable-dev-shm-usage",
          "--disable-accelerated-2d-canvas",
          "--no-first-run",
          "--no-zygote",
          "--disable-gpu",
          "--disable-features=VizDisplayCompositor",
          "--disable-background-timer-throttling",
          "--disable-backgrounding-occluded-windows",
          "--disable-renderer-backgrounding",
          "--disable-ipc-flooding-protection",
          "--disable-hang-monitor",
          "--disable-histogram-customizer",
          "--disable-logging",
          "--disable-login-animations",
          "--disable-notifications",
          "--disable-permissions-api",
          "--disable-plugins",
          "--disable-print-preview",
          "--disable-sync",
          "--disable-translate",
          "--disable-web-security",
          "--disable-extensions",
          "--no-default-browser-check",
          "--mute-audio",
          "--disable-blink-features=AutomationControlled",
          `--user-agent=${fingerprint.userAgent}`,
          "--disable-client-side-phishing-detection",
          "--disable-component-extensions-with-background-pages",
          "--disable-default-apps",
          "--disable-domain-reliability",
          "--disable-features=TranslateUI",
          "--disable-prompt-on-repost",
          "--disable-sync-preferences",
          "--hide-scrollbars",
          "--metrics-recording-only",
          "--safebrowsing-disable-auto-update",
          "--password-store=basic",
          "--use-mock-keychain",
          "--force-color-profile=srgb",
          "--memory-pressure-off",
          "--max_old_space_size=4096",
        ],
      };

      // Add proxy configuration if enabled
      if (proxyConfig) {
        launchOptions.args.push(
          `--proxy-server=${proxyConfig.protocol}://${proxyConfig.host}:${proxyConfig.port}`
        );
        if (proxyConfig.auth) {
          launchOptions.args.push(
            `--proxy-auth=${proxyConfig.auth.username}:${proxyConfig.auth.password}`
          );
        }
        this.logger.info(`🌐 Using proxy: ${proxyConfig.host}:${proxyConfig.port}`);
      }

      this.browser = await puppeteer.launch(launchOptions);
      this.page = await this.browser.newPage();

      // Apply advanced stealth techniques
      await this.applyStealth();

      // Configure advanced browser behavior
      await this.configureBrowser(fingerprint);

      this.logger.info("✅ Stealth browser initialized successfully");
    } catch (error) {
      this.logger.error("❌ Failed to initialize browser:", error);
      throw error;
    }
  }

  /**
   * Apply advanced stealth techniques to avoid detection
   */
  private async applyStealth(): Promise<void> {
    if (!this.page) throw new Error("Page not initialized");

    // Remove webdriver property
    await this.page.evaluateOnNewDocument(() => {
      Object.defineProperty(navigator, "webdriver", {
        get: () => undefined,
      });

      // Override the plugins property to use a custom getter
      Object.defineProperty(navigator, "plugins", {
        get: () => [1, 2, 3, 4, 5],
      });

      // Override the languages property to remove automation indicators
      Object.defineProperty(navigator, "languages", {
        get: () => ["en-US", "en"],
      });

      // Pass the chrome test
      (window as any).chrome = {
        runtime: {},
        loadTimes: function () {},
        csi: function () {},
        app: {},
      };

      // Pass the notification test
      const originalNotification = window.Notification;
      Object.defineProperty(window, "Notification", {
        value: originalNotification,
        configurable: true,
        writable: true,
      }); // Pass the permissions test
      const originalQuery = window.navigator.permissions.query;
      window.navigator.permissions.query = (parameters) =>
        parameters.name === "notifications"
          ? Promise.resolve({
              state: Notification.permission,
              name: parameters.name,
              onchange: null,
              addEventListener: () => {},
              removeEventListener: () => {},
              dispatchEvent: () => false,
            } as PermissionStatus)
          : originalQuery(parameters);

      // Overwrite the `plugins` property to use a custom getter.
      Object.defineProperty(navigator, "plugins", {
        get: () => [
          {
            0: {
              type: "application/x-google-chrome-pdf",
              suffixes: "pdf",
              description: "Portable Document Format",
              enabledPlugin: {},
            },
            description: "Portable Document Format",
            filename: "internal-pdf-viewer",
            length: 1,
            name: "Chrome PDF Plugin",
          },
        ],
      });
    });

    // Advanced request interception
    await this.page.setRequestInterception(true);

    this.page.on("request", async (request) => {
      const url = request.url();
      const resourceType = request.resourceType();

      // Block unnecessary resources to improve speed and reduce detection
      if (["image", "stylesheet", "font", "media"].includes(resourceType)) {
        await request.abort();
        return;
      }

      // Add realistic headers to all requests
      const headers = this.addRealisticHeaders(request.headers(), url);

      await request.continue({ headers });
    });

    // Monitor for detection attempts
    this.page.on("response", (response) => {
      const status = response.status();
      const url = response.url();

      if (status === 403 || status === 429) {
        this.logger.warn(`🚫 Potential blocking detected: ${status} for ${url}`);
        this.handleDetection(status);
      }
    });
  }

  /**
   * Configure browser with realistic fingerprint
   */
  private async configureBrowser(fingerprint: any): Promise<void> {
    if (!this.page) throw new Error("Page not initialized");

    // Set viewport to match fingerprint
    await this.page.setViewport({
      width: fingerprint.screen.width,
      height: fingerprint.screen.height,
      deviceScaleFactor: fingerprint.screen.devicePixelRatio,
    });

    // Set user agent
    await this.page.setUserAgent(fingerprint.userAgent);

    // Set timezone
    await this.page.emulateTimezone(fingerprint.timezone);

    // Set locale
    await this.page.setExtraHTTPHeaders({
      "Accept-Language": fingerprint.acceptLanguage,
    });

    // Override navigator properties
    await this.page.evaluateOnNewDocument((fp) => {
      Object.defineProperty(navigator, "hardwareConcurrency", {
        get: () => fp.hardwareConcurrency,
      });

      Object.defineProperty(navigator, "deviceMemory", {
        get: () => fp.deviceMemory,
      });

      Object.defineProperty(navigator, "platform", {
        get: () => fp.platform,
      });

      Object.defineProperty(screen, "colorDepth", {
        get: () => fp.screen.colorDepth,
      });

      Object.defineProperty(screen, "pixelDepth", {
        get: () => fp.screen.pixelDepth,
      });
    }, fingerprint);

    this.logger.info("🎭 Browser configured with advanced fingerprint");
  }

  /**
   * Add realistic headers to requests
   */
  private addRealisticHeaders(
    existingHeaders: Record<string, string>,
    url: string
  ): Record<string, string> {
    const headers = { ...existingHeaders };

    // Add common browser headers
    headers["sec-ch-ua"] = '"Chromium";v="119", "Google Chrome";v="119", "Not?A_Brand";v="24"';
    headers["sec-ch-ua-mobile"] = "?0";
    headers["sec-ch-ua-platform"] = '"Windows"';
    headers["sec-fetch-dest"] = "empty";
    headers["sec-fetch-mode"] = "cors";
    headers["sec-fetch-site"] = "same-origin";
    headers["dnt"] = "1";
    headers["cache-control"] = "no-cache";
    headers["pragma"] = "no-cache";

    // Add SofaScore specific headers
    if (url.includes("sofascore.com")) {
      headers["referer"] = "https://www.sofascore.com/";
      headers["origin"] = "https://www.sofascore.com";
      headers["x-requested-with"] = "XMLHttpRequest";
    }

    return headers;
  }

  /**
   * Handle detection and adapt strategy
   */ private handleDetection(statusCode: number): void {
    const severityMultiplier = statusCode === 403 ? 25 : statusCode === 429 ? 15 : 20;
    this.sessionHealth -= severityMultiplier;
    this.lastBlockedTime = Date.now();
    this.adaptiveDelay = Math.min(this.adaptiveDelay * 1.5, 30000);

    this.logger.warn(
      `🔧 Adapting strategy: status=${statusCode}, health=${this.sessionHealth}, delay=${this.adaptiveDelay}`
    );

    if (this.sessionHealth < 30) {
      this.logger.info("🔄 Session health critical, forcing refresh");
      this.refreshSession();
    }
  }

  /**
   * Refresh browser session
   */
  private async refreshSession(): Promise<void> {
    try {
      this.logger.info("🔄 Refreshing browser session...");

      if (this.page) await this.page.close();
      if (this.browser) await this.browser.close(); // Wait before reinitializing - longer if recently blocked
      const timeSinceBlocked = Date.now() - this.lastBlockedTime;
      const baseWait = timeSinceBlocked < 60000 ? 15000 : 5000; // Wait longer if recently blocked
      await randomWait(baseWait, baseWait + 10000);

      await this.initializeBrowser();
      this.sessionHealth = 100;
      this.requestCount = 0;

      this.logger.info("✅ Session refreshed successfully");
    } catch (error) {
      this.logger.error("❌ Failed to refresh session:", error);
      throw error;
    }
  }

  /**
   * Navigate to URL with human-like behavior
   */
  private async navigateWithBehavior(url: string): Promise<void> {
    if (!this.page) throw new Error("Page not initialized");

    const behavior = this.behaviorEngine.getNavigationBehavior();

    // Pre-navigation delay
    await randomWait(behavior.preDelay.min, behavior.preDelay.max);

    try {
      // Navigate with realistic timing
      await this.page.goto(url, {
        waitUntil: "networkidle2",
        timeout: 30000,
      });

      // Simulate human reading time
      await randomWait(behavior.readTime.min, behavior.readTime.max);

      // Random mouse movements to appear human
      if (Math.random() < 0.3) {
        await this.simulateHumanActivity();
      }
    } catch (error) {
      this.logger.error(`❌ Navigation failed for ${url}:`, error);
      throw error;
    }
  }

  /**
   * Simulate human-like activity
   */
  private async simulateHumanActivity(): Promise<void> {
    if (!this.page) return;

    try {
      // Random mouse movements
      const viewport = this.page.viewport();
      if (viewport) {
        const x = Math.random() * viewport.width;
        const y = Math.random() * viewport.height;
        await this.page.mouse.move(x, y);
      }

      // Random scroll
      if (Math.random() < 0.5) {
        await this.page.evaluate(() => {
          window.scrollBy(0, Math.random() * 200 - 100);
        });
      }

      // Random small delay
      await randomWait(100, 500);
    } catch (error) {
      // Ignore simulation errors
    }
  }

  /**
   * Make API request with CloudFlare bypass
   */
  private async makeApiRequest<T>(url: string): Promise<T> {
    if (!this.page) throw new Error("Page not initialized");

    try {
      // Check if CloudFlare challenge is present
      const isCloudFlareChallenge = await this.cloudflareBypass.detectChallenge(this.page);

      if (isCloudFlareChallenge) {
        this.logger.info("☁️ CloudFlare challenge detected, attempting bypass...");
        await this.cloudflareBypass.solveChallenge(this.page);
      }

      // Execute API request in browser context to maintain session
      const response = await this.page.evaluate(async (apiUrl) => {
        const response = await fetch(apiUrl, {
          method: "GET",
          headers: {
            Accept: "application/json, text/plain, */*",
            "Accept-Language": "en-US,en;q=0.9",
            "Cache-Control": "no-cache",
            Pragma: "no-cache",
            "Sec-Fetch-Dest": "empty",
            "Sec-Fetch-Mode": "cors",
            "Sec-Fetch-Site": "same-origin",
            "X-Requested-With": "XMLHttpRequest",
          },
        });

        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }

        return await response.json();
      }, url);

      this.requestCount++;
      this.sessionHealth = Math.min(this.sessionHealth + 1, 100);

      return response as T;
    } catch (error) {
      this.logger.error(`❌ API request failed for ${url}:`, error);
      throw error;
    }
  }
  /**
   * Fetch scheduled events with retry logic and expanded date range
   */
  private async fetchScheduledEvents(): Promise<ScheduledEventsResponse> {
    // Try multiple date variations to catch events in different timezones
    const dateVariations = [
      this.date,
      // Also try previous day (in case of timezone differences)
      new Date(new Date(this.date).getTime() - 24 * 60 * 60 * 1000).toISOString().split("T")[0],
      // Also try next day (in case of timezone differences)
      new Date(new Date(this.date).getTime() + 24 * 60 * 60 * 1000).toISOString().split("T")[0],
    ];

    let allEvents: any[] = [];

    for (const dateVar of dateVariations) {
      const url = `https://api.sofascore.com/api/v1/sport/${this.sport}/scheduled-events/${dateVar}`;

      for (let attempt = 1; attempt <= this.config.maxRetries!; attempt++) {
        try {
          this.logger.info(
            `📅 Fetching events for ${dateVar} (attempt ${attempt}/${this.config.maxRetries})`
          );

          // Navigate to main site first to establish session (only on first date, first attempt)
          if (dateVar === this.date && attempt === 1) {
            await this.navigateWithBehavior("https://www.sofascore.com/");
          }

          const response = await this.makeApiRequest<ScheduledEventsResponse>(url);

          this.logger.info(
            `✅ Successfully fetched ${response.events.length} events for ${dateVar}`
          );

          // Add events, filtering out duplicates by ID
          const newEvents = response.events.filter(
            (event) => !allEvents.some((existing) => existing.id === event.id)
          );
          allEvents.push(...newEvents);

          break; // Success, move to next date
        } catch (error) {
          this.logger.error(`❌ Attempt ${attempt} failed for ${dateVar}:`, error);

          if (attempt < this.config.maxRetries!) {
            // Exponential backoff with jitter
            const delay = Math.pow(2, attempt) * 1000 + Math.random() * 2000;
            this.logger.info(`⏳ Retrying in ${Math.round(delay / 1000)}s...`);
            await new Promise((resolve) => setTimeout(resolve, delay));

            // Refresh session on repeated failures
            if (attempt >= 2) {
              await this.refreshSession();
            }
          } else {
            this.logger.warn(
              `❌ Failed to fetch events for ${dateVar} after ${this.config.maxRetries} attempts`
            );
          }
        }
      }
    }

    return { events: allEvents };
  }

  /**
   * Discover additional events from tournaments found in initial events
   */
  private async discoverTournamentEvents(initialEvents: any[]): Promise<any[]> {
    const tournaments = new Set<number>();
    const allEvents = [...initialEvents];

    // Collect unique tournament IDs
    initialEvents.forEach((event) => {
      if (event.tournament?.id) {
        tournaments.add(event.tournament.id);
      }
    });

    this.logger.info(
      `🏆 Discovered ${tournaments.size} tournaments, checking for additional events...`
    );

    // For each tournament, try to get more events
    for (const tournamentId of tournaments) {
      try {
        // Small delay between tournament requests
        await randomWait(2000, 4000);

        const url = `https://api.sofascore.com/api/v1/tournament/${tournamentId}/events/round/1`;

        this.logger.info(`🔍 Checking tournament ${tournamentId} for additional events...`);

        const tournamentResponse = await this.makeApiRequest<any>(url);

        if (tournamentResponse?.events && Array.isArray(tournamentResponse.events)) {
          // Filter events for target date and sport
          const relevantEvents = tournamentResponse.events.filter((event: any) => {
            const eventDate = timestampToGreekTime(event.startTimestamp).date;
            const isTargetDate = eventDate === this.date;
            const notAlreadyIncluded = !allEvents.some((existing) => existing.id === event.id);

            return isTargetDate && notAlreadyIncluded;
          });

          if (relevantEvents.length > 0) {
            this.logger.info(
              `✅ Found ${relevantEvents.length} additional events from tournament ${tournamentId}`
            );
            allEvents.push(...relevantEvents);
          }
        }
      } catch (error) {
        this.logger.warn(`⚠️ Failed to fetch tournament ${tournamentId} events:`, error);
      }
    }

    this.logger.info(`🎯 Total events after tournament discovery: ${allEvents.length}`);
    return allEvents;
  }
  /**
   * Fetch event details with smart batching and accurate scores
   */
  private async fetchEventDetails(eventId: number): Promise<any> {
    const baseUrl = "https://api.sofascore.com/api/v1";

    try {
      // Add intelligent delay between requests
      await randomWait(this.adaptiveDelay, this.adaptiveDelay + 2000);

      const urls = [
        `${baseUrl}/event/${eventId}/odds/1/all`,
        `${baseUrl}/event/${eventId}/provider/1/winning-odds`,
        `${baseUrl}/event/${eventId}/pregame-form`,
        `${baseUrl}/event/${eventId}/votes`,
        `${baseUrl}/event/${eventId}`, // Add specific event endpoint for accurate scores
      ];

      // Fetch data sequentially with delays to avoid rate limiting
      const results = [];
      for (const url of urls) {
        try {
          const data = await this.makeApiRequest(url);
          results.push(data);

          // Small delay between related requests
          await randomWait(800, 1500);
        } catch (error) {
          this.logger.warn(`⚠️ Failed to fetch ${url}, continuing...`);
          results.push(null);
        }
      }

      return {
        markets: results[0],
        winningOdds: results[1],
        pregameForm: results[2],
        votes: results[3],
        eventDetails: results[4], // Additional event details with potentially more accurate scores
      };
    } catch (error) {
      this.logger.error(`❌ Failed to fetch details for event ${eventId}:`, error);
      return null;
    }
  }

  /**
   * Main scraping method
   */
  public async scrapeData(): Promise<IEventJoinedData[]> {
    try {
      this.logger.info("🚀 Starting modern scraping process...");

      // Initialize browser
      await this.initializeBrowser(); // Fetch main events
      const eventsResponse = await this.fetchScheduledEvents();

      this.logger.info(`📋 API returned ${eventsResponse.events.length} total events from API`);

      // Log some sample events to understand the data structure
      if (eventsResponse.events.length > 0) {
        this.logger.info(`🔍 Sample event structure:`, {
          sampleEvent: {
            id: eventsResponse.events[0].id,
            homeTeam: eventsResponse.events[0].homeTeam,
            awayTeam: eventsResponse.events[0].awayTeam,
            tournament: eventsResponse.events[0].tournament,
            startTimestamp: eventsResponse.events[0].startTimestamp,
            eventDate: timestampToGreekTime(eventsResponse.events[0].startTimestamp).date,
          },
        });
      }

      // Filter events for the target date
      const targetEvents = eventsResponse.events.filter((event) => {
        const eventDate = timestampToGreekTime(event.startTimestamp).date;
        const matches = eventDate === this.date;

        if (!matches) {
          this.logger.debug(
            `🚫 Event ${event.id} filtered out: eventDate=${eventDate}, targetDate=${this.date}`
          );
        }

        return matches;
      });

      this.logger.info(`🎯 Processing ${targetEvents.length} events for ${this.date}`);

      const results: IEventJoinedData[] = [];

      // Process events with intelligent batching
      const batchSize = 3; // Process 3 events at a time
      for (let i = 0; i < targetEvents.length; i += batchSize) {
        const batch = targetEvents.slice(i, i + batchSize);

        this.logger.info(
          `📦 Processing batch ${Math.floor(i / batchSize) + 1}/${Math.ceil(
            targetEvents.length / batchSize
          )}`
        );

        // Process batch sequentially to avoid overwhelming the server
        for (const event of batch) {
          try {
            const details = await this.fetchEventDetails(event.id);

            results.push({
              event,
              markets: details?.markets,
              winningOdds: details?.winningOdds,
              pregameForm: details?.pregameForm,
              votes: details?.votes,
            }); // Create safe team names with defensive checks
            const homeTeamName =
              event.homeTeam?.shortName || event.homeTeam?.name || "Unknown Home";
            const awayTeamName =
              event.awayTeam?.shortName || event.awayTeam?.name || "Unknown Away";

            this.logger.info(`✅ Processed event: ${homeTeamName} vs ${awayTeamName}`);
          } catch (error) {
            this.logger.error(`❌ Failed to process event ${event.id}:`, error);

            // Add event with basic data even if details failed
            results.push({ event });
          }
        }

        // Batch delay to prevent rate limiting
        if (i + batchSize < targetEvents.length) {
          await randomWait(3000, 8000);
        }
      } // Discover additional events from tournaments
      const allEventsWithTournaments = await this.discoverTournamentEvents(
        results.map((r) => r.event)
      );

      // For any new events found via tournament discovery, we need to fetch their details too
      const newEventsFromTournaments = allEventsWithTournaments.filter(
        (event) => !results.some((result) => result.event.id === event.id)
      );

      this.logger.info(
        `🔍 Processing ${newEventsFromTournaments.length} additional events from tournament discovery...`
      );

      // Process new tournament events to get full details
      for (const event of newEventsFromTournaments) {
        try {
          const details = await this.fetchEventDetails(event.id);
          results.push({
            event,
            markets: details?.markets,
            winningOdds: details?.winningOdds,
            pregameForm: details?.pregameForm,
            votes: details?.votes,
          });

          const homeTeamName = event.homeTeam?.shortName || event.homeTeam?.name || "Unknown Home";
          const awayTeamName = event.awayTeam?.shortName || event.awayTeam?.name || "Unknown Away";

          this.logger.info(`✅ Processed additional event: ${homeTeamName} vs ${awayTeamName}`);

          // Small delay between additional event processing
          await randomWait(1000, 3000);
        } catch (error) {
          this.logger.error(`❌ Failed to process additional event ${event.id}:`, error);

          // Add event with basic data even if details failed
          results.push({ event });
        }
      }

      this.logger.info(
        `🎉 Scraping completed! Successfully processed ${results.length} total events`
      );
      return results;
    } catch (error) {
      this.logger.error("💥 Critical scraping error:", error);
      throw error;
    } finally {
      await this.cleanupResources();
    }
  }
  /**
   * Get session statistics
   */
  public getStats(): any {
    return {
      sessionHealth: this.sessionHealth,
      requestCount: this.requestCount,
      adaptiveDelay: this.adaptiveDelay,
      successRate: this.requestCount > 0 ? this.sessionHealth / 100 : 1,
      proxyStats: this.proxyManager.getProxyStats(),
      behaviorStats: this.behaviorEngine.getSessionStats(),
    };
  }

  /**
   * Public cleanup method
   */
  public async cleanup(): Promise<void> {
    try {
      if (this.page) {
        await this.page.close();
      }
      if (this.browser) {
        await this.browser.close();
      }
      this.proxyManager.cleanup();
      this.logger.info("🧹 Resources cleaned up successfully");
    } catch (error) {
      this.logger.error("❌ Cleanup error:", error);
    }
  }

  /**
   * Cleanup resources (private version for internal use)
   */
  private async cleanupResources(): Promise<void> {
    await this.cleanup();
  }
}

export default ModernSofaScoreScraper;
