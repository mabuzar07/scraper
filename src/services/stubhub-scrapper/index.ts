import { chromium, Browser, Page } from "playwright";
import { proxyManager } from "utils/proxy";
import { logger } from "utils/logger";
import fs from "fs";
import path from "path";
import { format } from "date-fns";

export interface StubHubScrapperOptions {
  eventId: string;
  useProxy?: boolean;
  maxRetries?: number;
  enableStealth?: boolean;
  outputDir?: string;
}

export interface StubHubTicketData {
  rawPrice?: number;
  section?: string;
  row?: string;
  seat?: string;
  quantity?: number;
  [key: string]: any;
}

export class StubHubScrapper {
  private browser: Browser | null = null;
  private options: StubHubScrapperOptions;
  private userAgents = [
    "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.6 Safari/605.1.1",
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.3",
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36 Edg/131.0.0",
  ];
  constructor(options: StubHubScrapperOptions) {
    this.options = {
      useProxy: true, // Proxy is essential for avoiding rate limits
      maxRetries: 5, // Increased retries for better proxy fallback
      enableStealth: true, // Stealth mode helps with detection
      outputDir: "stubhub-data",
      ...options,
    };
  }

  private getRandomUserAgent(): string {
    return this.userAgents[Math.floor(Math.random() * this.userAgents.length)];
  }

  private async randomDelay(min = 1000, max = 3000): Promise<void> {
    const delay = Math.floor(Math.random() * (max - min + 1)) + min;
    await new Promise((resolve) => setTimeout(resolve, delay));
  }

  private async simulateRealisticBrowsing(
    page: Page,
    options: {
      includeScrolling?: boolean;
      includeCursorMovement?: boolean;
      duration?: { min: number; max: number };
      intensity?: "light" | "medium" | "heavy";
    } = {}
  ): Promise<void> {
    const {
      includeScrolling = true,
      includeCursorMovement = true,
      duration = { min: 2000, max: 5000 },
      intensity = "medium",
    } = options;

    const patterns = {
      light: { movements: 2, scrolls: 1, pauses: 2 },
      medium: { movements: 4, scrolls: 2, pauses: 3 },
      heavy: { movements: 6, scrolls: 3, pauses: 4 },
    };

    const pattern = patterns[intensity];
    const totalDuration = Math.random() * (duration.max - duration.min) + duration.min;
    const actionInterval = totalDuration / (pattern.movements + pattern.scrolls + pattern.pauses);

    logger.info(`Simulating ${intensity} browsing behavior for ${Math.round(totalDuration)}ms...`);

    for (let i = 0; i < pattern.movements; i++) {
      if (includeCursorMovement) {
        await this.humanMouseMove(
          page,
          Math.random() * 1920,
          Math.random() * 1080,
          Math.random() * 1920,
          Math.random() * 1080
        );
        await this.randomDelay(actionInterval * 0.3, actionInterval * 0.7);
      }
    }

    for (let i = 0; i < pattern.scrolls; i++) {
      if (includeScrolling) {
        const direction = Math.random() > 0.5 ? "down" : "up";
        const distance = Math.random() * 400 + 100;
        await this.humanScroll(page, direction, distance);
        await this.randomDelay(actionInterval * 0.5, actionInterval * 1.0);
      }
    }

    for (let i = 0; i < pattern.pauses; i++) {
      await this.randomDelay(actionInterval * 0.8, actionInterval * 1.2);
    }
  }

  private async humanMouseMove(
    page: Page,
    fromX: number,
    fromY: number,
    toX: number,
    toY: number,
    steps = 20
  ): Promise<void> {
    const deltaX = (toX - fromX) / steps;
    const deltaY = (toY - fromY) / steps;

    for (let i = 0; i <= steps; i++) {
      const x = fromX + deltaX * i + (Math.random() - 0.5) * 2;
      const y = fromY + deltaY * i + (Math.random() - 0.5) * 2;

      await page.mouse.move(x, y);
      await this.randomDelay(20, 50);
    }
  }

  private async humanScroll(page: Page, direction = "down", distance = 500): Promise<void> {
    const startX = 960;
    const startY = 540;

    await page.mouse.move(startX, startY);
    await this.randomDelay(100, 300);

    const scrollDelta = direction === "down" ? distance : -distance;
    await page.mouse.wheel(0, scrollDelta);
    await this.randomDelay(500, 1000);
  }

  private async humanClick(page: Page, selector: string): Promise<boolean> {
    try {
      const element = page.locator(selector);
      await element.waitFor({ state: "visible", timeout: 10000 });

      const boundingBox = await element.boundingBox();
      if (!boundingBox) {
        throw new Error("Element not found or not visible");
      }

      const currentPos = { x: Math.random() * 1920, y: Math.random() * 1080 };
      const targetX =
        boundingBox.x + boundingBox.width / 2 + (Math.random() - 0.5) * boundingBox.width * 0.3;
      const targetY =
        boundingBox.y + boundingBox.height / 2 + (Math.random() - 0.5) * boundingBox.height * 0.3;

      await this.humanMouseMove(page, currentPos.x, currentPos.y, targetX, targetY);
      await this.randomDelay(100, 300);

      await page.mouse.move(
        targetX + (Math.random() - 0.5) * 5,
        targetY + (Math.random() - 0.5) * 5
      );

      await this.randomDelay(50, 150);
      await page.mouse.down();
      await this.randomDelay(50, 150);
      await page.mouse.up();

      logger.info(`Human-like click performed on ${selector}`);
      return true;
    } catch (error) {
      logger.warn(
        `Failed to perform human click on ${selector}: ${
          error instanceof Error ? error.message : String(error)
        }`
      );
      return false;
    }
  }

  private async initBrowser(): Promise<void> {
    try {
      const launchOptions: any = {
        headless: this.options.enableStealth,
        args: [
          "--no-sandbox",
          "--disable-setuid-sandbox",
          "--disable-dev-shm-usage",
          "--disable-accelerated-2d-canvas",
          "--no-first-run",
          "--no-zygote",
          "--disable-gpu",
          "--disable-blink-features=AutomationControlled",
          "--disable-features=VizDisplayCompositor",
          "--disable-web-security",
          "--disable-features=TranslateUI",
          "--disable-ipc-flooding-protection",
          "--incognito",
          "--disable-background-timer-throttling",
          "--disable-backgrounding-occluded-windows",
          "--disable-renderer-backgrounding",
          "--disable-field-trial-config",
          "--disable-back-forward-cache",
          "--disable-features=ImprovedCookieControls,LazyFrameLoading,GlobalMediaControls,DestroyProfileOnBrowserClose,MediaRouter,DialMediaRouteProvider,AcceptCHFrame,AutoExpandDetailsElement,CertificateTransparencyComponentUpdater,AvoidUnnecessaryBeforeUnloadCheckSync,Translate",
          "--aggressive-cache-discard",
          "--enable-features=NetworkService,NetworkServiceLogging",
          "--force-color-profile=srgb",
          "--disable-background-networking",
          "--disable-default-apps",
          "--disable-extensions",
          "--disable-sync",
          "--metrics-recording-only",
          "--no-report-upload",
          "--use-mock-keychain",
        ],
      }; // Add proxy if available
      if (this.options.useProxy && proxyManager) {
        const proxy = proxyManager.getCurrentProxy();
        if (proxy) {
          launchOptions.proxy = {
            server: `${proxy.protocol}://${proxy.host}:${proxy.port}`,
            username: proxy.username,
            password: proxy.password,
          };
          logger.info(`Using proxy: ${proxy.host}:${proxy.port}`);
        }
      }

      this.browser = await chromium.launch(launchOptions);
      logger.info("Browser initialized successfully with enhanced human-like settings");
    } catch (error) {
      logger.error("Failed to initialize browser:", error);
      throw error;
    }
  }

  private async createPage(): Promise<Page> {
    if (!this.browser) {
      await this.initBrowser();
    }

    const page = await this.browser!.newPage({
      userAgent: this.getRandomUserAgent(),
    });

    // Set viewport with slight randomization
    const viewportWidth = 1920 + Math.floor((Math.random() - 0.5) * 200);
    const viewportHeight = 1080 + Math.floor((Math.random() - 0.5) * 100);
    await page.setViewportSize({ width: viewportWidth, height: viewportHeight });

    // Add human-like properties
    await page.addInitScript(() => {
      Object.defineProperty(navigator, "plugins", {
        get: () => [1, 2, 3, 4, 5],
      });

      Object.defineProperty(navigator, "languages", {
        get: () => ["en-US", "en"],
      });

      Object.defineProperty(navigator, "webdriver", {
        get: () => undefined,
      });

      Object.defineProperty(screen, "availHeight", {
        get: () => 1040,
      });
      Object.defineProperty(screen, "availWidth", {
        get: () => 1920,
      });
    });

    // Set human-like headers
    await page.setExtraHTTPHeaders({
      "Accept-Language": "en-US,en;q=0.9",
      "Accept-Encoding": "gzip, deflate, br",
      Accept:
        "text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,image/apng,*/*;q=0.8",
      "Upgrade-Insecure-Requests": "1",
      "Sec-Fetch-Site": "none",
      "Sec-Fetch-Mode": "navigate",
      "Sec-Fetch-User": "?1",
      "Cache-Control": "max-age=0",
    });

    return page;
  }

  private async saveResponse(data: StubHubTicketData[], eventId: string): Promise<string> {
    const outputDir = path.join(process.cwd(), this.options.outputDir!);

    // Create output directory if it doesn't exist
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }

    const timestamp = format(new Date(), "yyyy-MM-dd_HH-mm-ss");
    const filename = `stubhub_${eventId}_${timestamp}.json`;
    const filepath = path.join(outputDir, filename);

    const responseData = {
      eventId,
      timestamp: new Date().toISOString(),
      ticketCount: data.length,
      data: data,
    };

    fs.writeFileSync(filepath, JSON.stringify(responseData, null, 2));
    logger.info(`StubHub data saved to: ${filepath}`);

    return filepath;
  }
  public async scrapeEvent(
    eventId?: string
  ): Promise<{ data: StubHubTicketData[]; filePath: string }> {
    const targetEventId = eventId || this.options.eventId;
    let page: Page | null = null;
    let attempts = 0;

    // Test basic connectivity first
    await this.testConnectivity();

    while (attempts < this.options.maxRetries!) {
      try {
        attempts++;
        logger.info(
          `🎫 Processing StubHub request for eventId: ${targetEventId} (attempt ${attempts}/${this.options.maxRetries})`
        );        // Show current proxy status and validate if using proxy
        if (this.options.useProxy && proxyManager) {
          const currentProxy = proxyManager.getCurrentProxy();
          if (currentProxy) {
            logger.info(
              `🌐 Using proxy: ${currentProxy.host}:${currentProxy.port} (${currentProxy.country})`
            );
            
            // Validate proxy before using it
            const isValidProxy = await this.validateProxy();
            if (!isValidProxy) {
              logger.warn("Proxy validation failed, rotating to next proxy...");
              proxyManager.rotateProxy();
              
              // Try the new proxy
              const newProxy = proxyManager.getCurrentProxy();
              if (newProxy) {
                logger.info(`🔄 Rotated to proxy: http://${newProxy.host}:${newProxy.port} (${newProxy.country})`);
                const isNewProxyValid = await this.validateProxy();
                if (!isNewProxyValid) {
                  logger.warn("Second proxy also failed validation, continuing anyway...");
                }
              }
            }
          } else {
            logger.warn("⚠️ Proxy enabled but no proxy available");
          }
        } else {
          logger.info("🔗 Direct connection (no proxy)");
        }

        page = await this.createPage(); // Navigate to the StubHub event page
        const normalUrl = `https://www.stubhub.com/event/${targetEventId}/?quantity=0`;
        logger.info(`Navigating to: ${normalUrl}`); // Multiple fallback strategies for navigation with increased proxy-friendly timeouts
        let navigationSuccess = false;
        const navigationStrategies = [
          { waitUntil: "domcontentloaded", timeout: 90000 }, // 1.5 minutes - proxy needs more time
          { waitUntil: "load", timeout: 120000 }, // 2 minutes - more reliable with proxy
          { waitUntil: "commit", timeout: 60000 }, // 1 minute - basic fallback
          { waitUntil: "networkidle", timeout: 150000 }, // 2.5 minutes - most thorough
        ];

        for (const strategy of navigationStrategies) {
          try {
            logger.info(
              `Trying navigation with ${strategy.waitUntil}, timeout: ${strategy.timeout}ms`
            );

            // Set page timeout
            page.setDefaultTimeout(strategy.timeout);
            page.setDefaultNavigationTimeout(strategy.timeout);

            await page.goto(normalUrl, {
              waitUntil: strategy.waitUntil as any,
              timeout: strategy.timeout,
            });

            navigationSuccess = true;
            logger.info(`Navigation successful with ${strategy.waitUntil}`);
            break;
          } catch (navError) {
            logger.warn(
              `Navigation failed with ${strategy.waitUntil}: ${
                navError instanceof Error ? navError.message : String(navError)
              }`
            );

            // Wait before trying next strategy
            await this.randomDelay(2000, 4000);
            continue;
          }
        }
        if (!navigationSuccess) {
          // Try rotating proxy if using proxy and navigation failed completely
          if (this.options.useProxy && proxyManager) {
            proxyManager.rotateProxy();
            logger.info("Navigation failed, rotated proxy for next retry");
          }
          throw new Error(`Failed to navigate to ${normalUrl} with all strategies`);
        }

        // Additional wait for dynamic content
        await this.randomDelay(3000, 6000);

        logger.info("Page loaded successfully");

        // Simulate initial realistic browsing behavior
        await this.simulateRealisticBrowsing(page, {
          includeScrolling: true,
          includeCursorMovement: true,
          duration: { min: 3000, max: 6000 },
          intensity: "medium",
        });

        await this.handleFilters(page);

        // Wait for page to update after filter changes
        logger.info("Waiting for page to update after filter changes...");
        await this.simulateRealisticBrowsing(page, {
          includeScrolling: true,
          includeCursorMovement: true,
          duration: { min: 2000, max: 4000 },
          intensity: "light",
        }); // Now navigate to the view-source page to get the data
        const url = `view-source:https://www.stubhub.com/event/${targetEventId}/?quantity=0`;
        logger.info(`Fetching data from: ${url}`);

        let sourceNavigationSuccess = false;
        const sourceStrategies = [
          { waitUntil: "domcontentloaded", timeout: 75000 }, // 1.25 minutes for view-source
          { waitUntil: "load", timeout: 90000 }, // 1.5 minutes standard approach
          { waitUntil: "commit", timeout: 45000 }, // 45 seconds basic fallback
          { waitUntil: "networkidle", timeout: 120000 }, // 2 minutes last resort
        ];

        for (const strategy of sourceStrategies) {
          try {
            logger.info(
              `Trying view-source navigation with ${strategy.waitUntil}, timeout: ${strategy.timeout}ms`
            );

            // Set page timeout for this strategy
            page.setDefaultTimeout(strategy.timeout);
            page.setDefaultNavigationTimeout(strategy.timeout);

            await page.goto(url, {
              waitUntil: strategy.waitUntil as any,
              timeout: strategy.timeout,
            });

            sourceNavigationSuccess = true;
            logger.info(`View-source navigation successful with ${strategy.waitUntil}`);
            break;
          } catch (sourceError) {
            logger.warn(
              `View-source navigation failed with ${strategy.waitUntil}: ${
                sourceError instanceof Error ? sourceError.message : String(sourceError)
              }`
            );

            // Wait before trying next strategy
            await this.randomDelay(3000, 5000);
            continue;
          }
        }

        if (!sourceNavigationSuccess) {
          throw new Error(`Failed to navigate to view-source page: ${url}`);
        }

        // Additional delay for source page to load completely
        await this.randomDelay(2000, 4000);

        // Simulate briefly examining the source code
        await this.simulateRealisticBrowsing(page, {
          includeScrolling: true,
          includeCursorMovement: false,
          duration: { min: 1000, max: 2000 },
          intensity: "light",
        });

        logger.info("Page source loaded, searching for data...");

        const data = await this.extractTicketData(page);
        const filePath = await this.saveResponse(data, targetEventId);

        return { data, filePath };
      } catch (error) {
        logger.error(
          `Attempt ${attempts} failed:`,
          error instanceof Error ? error.message : String(error)
        );

        if (page) {
          await page.close();
          page = null;
        }

        // Close browser to reset connection
        if (this.browser) {
          await this.browser.close();
          this.browser = null;
        }
        if (attempts >= this.options.maxRetries!) {
          // Last resort: try direct connection if we were using proxy
          if (this.options.useProxy) {
            logger.warn("All proxy attempts failed, trying direct connection as last resort...");

            try {
              // Temporarily disable proxy for this final attempt
              const originalUseProxy = this.options.useProxy;
              this.options.useProxy = false;

              // Create a new page without proxy
              page = await this.createPage();
              const normalUrl = `https://www.stubhub.com/event/${targetEventId}/?quantity=0`;
              logger.info(`Direct connection attempt to: ${normalUrl}`);

              // Try with shorter timeouts for direct connection
              const directStrategies = [
                { waitUntil: "domcontentloaded", timeout: 45000 },
                { waitUntil: "load", timeout: 60000 },
              ];

              let directSuccess = false;
              for (const strategy of directStrategies) {
                try {
                  logger.info(
                    `Direct navigation with ${strategy.waitUntil}, timeout: ${strategy.timeout}ms`
                  );
                  page.setDefaultTimeout(strategy.timeout);
                  page.setDefaultNavigationTimeout(strategy.timeout);

                  await page.goto(normalUrl, {
                    waitUntil: strategy.waitUntil as any,
                    timeout: strategy.timeout,
                  });

                  directSuccess = true;
                  logger.info(`✅ Direct connection successful with ${strategy.waitUntil}`);
                  break;
                } catch (directError) {
                  logger.warn(
                    `Direct navigation failed with ${strategy.waitUntil}: ${
                      directError instanceof Error ? directError.message : String(directError)
                    }`
                  );
                  continue;
                }
              }

              if (directSuccess) {
                // Continue with the scraping process
                await this.randomDelay(3000, 6000);
                logger.info("Page loaded successfully via direct connection");

                await this.simulateRealisticBrowsing(page, {
                  includeScrolling: true,
                  includeCursorMovement: true,
                  duration: { min: 3000, max: 6000 },
                  intensity: "medium",
                });

                await this.handleFilters(page);

                const sourceUrl = `view-source:https://www.stubhub.com/event/${targetEventId}/?quantity=0`;
                logger.info(`Fetching data from: ${sourceUrl}`);

                let sourceNavigationSuccess = false;
                for (const strategy of directStrategies) {
                  try {
                    logger.info(
                      `Direct view-source navigation with ${strategy.waitUntil}, timeout: ${strategy.timeout}ms`
                    );
                    page.setDefaultTimeout(strategy.timeout);
                    page.setDefaultNavigationTimeout(strategy.timeout);

                    await page.goto(sourceUrl, {
                      waitUntil: strategy.waitUntil as any,
                      timeout: strategy.timeout,
                    });

                    sourceNavigationSuccess = true;
                    logger.info(
                      `Direct view-source navigation successful with ${strategy.waitUntil}`
                    );
                    break;
                  } catch (sourceError) {
                    logger.warn(
                      `Direct view-source navigation failed with ${strategy.waitUntil}: ${
                        sourceError instanceof Error ? sourceError.message : String(sourceError)
                      }`
                    );
                    continue;
                  }
                }

                if (sourceNavigationSuccess) {
                  await this.simulateRealisticBrowsing(page, {
                    includeScrolling: false,
                    includeCursorMovement: false,
                    duration: { min: 1000, max: 2000 },
                    intensity: "light",
                  });

                  logger.info("Page source loaded, searching for data...");
                  const data = await this.extractTicketData(page);
                  const filePath = await this.saveResponse(data, targetEventId);

                  // Restore original proxy setting
                  this.options.useProxy = originalUseProxy;

                  logger.warn(
                    "⚠️ Successfully scraped using direct connection (no proxy). Note: Rate limits may apply for subsequent requests."
                  );
                  return { data, filePath };
                }
              }

              // Restore original proxy setting
              this.options.useProxy = originalUseProxy;
            } catch (directError) {
              logger.error(
                "Direct connection fallback also failed:",
                directError instanceof Error ? directError.message : String(directError)
              );
            }
          }

          throw error;
        }

        // Rotate proxy for next attempt if using proxy
        if (this.options.useProxy && proxyManager) {
          proxyManager.rotateProxy();
          logger.info("Rotated to next proxy for retry");
        }

        // Exponential backoff with jitter
        const backoffDelay =
          Math.min(10000, 2000 * Math.pow(2, attempts - 1)) + Math.random() * 1000;
        logger.info(`Waiting ${Math.round(backoffDelay)}ms before retry...`);
        await new Promise((resolve) => setTimeout(resolve, backoffDelay));
      }
    }

    throw new Error(`Failed to scrape StubHub data after ${this.options.maxRetries} attempts`);
  }

  private async handleFilters(page: Page): Promise<void> {
    logger.info("Page loaded, looking for filter button...");
    await page.waitForLoadState("domcontentloaded");

    try {
      logger.info("Attempting to find and click filter button with human-like behavior...");

      // Simulate looking around for the filter button
      await this.humanMouseMove(page, 400, 200, 600, 300);
      await this.randomDelay(500, 1000);

      const filterSelectors = [
        '#event-detail-filter-container-mobile [role="combobox"][aria-label="Filters"]',
        ".sc-hRJfrW.hdIFjy",
        'div[role="combobox"][aria-label="Filters"]',
        "#event-detail-filter-container-mobile .sc-hRJfrW",
        '.sc-ad2f367c-3 [role="combobox"]',
        'button:has-text("Filters")',
        '[aria-label="Filters"]',
        '.sc-gmPhUn:has-text("Filters")',
        'button:has-text("Filter")',
        '[data-testid="filters-button"]',
        'button[aria-label="Filters"]',
        'button[aria-controls*="filter"]',
        ".filter-button",
        'button:has([class*="filter"])',
        'button[class*="filter"]',
        '[role="button"]:has-text("Filters")',
      ];

      let filterClicked = false;

      for (const selector of filterSelectors) {
        try {
          const element = page.locator(selector).first();
          await element.waitFor({ state: "visible", timeout: 3000 });

          const boundingBox = await element.boundingBox();
          if (boundingBox) {
            await this.humanMouseMove(
              page,
              Math.random() * 1920,
              Math.random() * 1080,
              boundingBox.x - 50,
              boundingBox.y - 20
            );
            await this.randomDelay(300, 800);

            if (await this.humanClick(page, selector)) {
              logger.info(`Filter button clicked successfully with selector: ${selector}`);
              filterClicked = true;
              break;
            }
          }
        } catch (e) {
          continue;
        }
      }

      if (filterClicked) {
        await this.randomDelay(1500, 2500);
        await this.humanMouseMove(page, 200, 300, 400, 600);
        await this.randomDelay(500, 1000);

        await this.handleRecommendedToggle(page);
        await this.closeFilterPanel(page);
      } else {
        logger.info(
          "Could not find filter button with any selector, proceeding without filtering..."
        );
      }
    } catch (filterError) {
      logger.error(
        "Error with filter interaction:",
        filterError instanceof Error ? filterError.message : String(filterError)
      );
    }
  }

  private async handleRecommendedToggle(page: Page): Promise<void> {
    try {
      logger.info("Looking for recommended tickets toggle...");

      await this.humanMouseMove(page, 300, 400, 500, 600);
      await this.randomDelay(800, 1500);

      const recommendedToggleSelectors = [
        '.sc-5e2ce041-0 input[type="checkbox"]',
        ".sc-iHGNWf.fPWDwX",
        'input[aria-label="Recommended passes"]',
        '.sc-koXPp input[type="checkbox"]',
        'input[type="checkbox"][value="true"]',
        'span:has-text("Recommended tickets") + div input[type="checkbox"]',
        'label:has-text("Recommended") input[type="checkbox"]',
        '.sc-5e2ce041-1 input[type="checkbox"]',
        '#stubhub-event-detail-popular-filters input[type="checkbox"]',
        'label:has-text("Recommended tickets") input[type="checkbox"]',
        'input[type="checkbox"] + label:has-text("Recommended tickets")',
        '[data-testid*="recommended"] input[type="checkbox"]',
        'input[aria-label*="Recommended"]',
        'input[aria-label*="recommended"]',
        ".recommended-toggle input",
        'input[type="checkbox"]:near(:text("Recommended"))',
      ];

      let toggleFound = false;
      for (const selector of recommendedToggleSelectors) {
        try {
          const toggle = page.locator(selector).first();
          await toggle.waitFor({ state: "visible", timeout: 5000 });

          const isChecked = await toggle.isChecked();
          logger.info(`Found toggle with selector ${selector}, checked: ${isChecked}`);

          if (isChecked) {
            const boundingBox = await toggle.boundingBox();
            if (boundingBox) {
              await this.humanMouseMove(
                page,
                Math.random() * 1920,
                Math.random() * 1080,
                boundingBox.x - 30,
                boundingBox.y - 10
              );
              await this.randomDelay(400, 800);

              if (await this.humanClick(page, selector)) {
                logger.info("Recommended tickets toggle turned OFF with human-like interaction");
                await this.randomDelay(1000, 2000);
                toggleFound = true;
                break;
              }
            }
          } else {
            logger.info("Recommended tickets toggle is already OFF");
            toggleFound = true;
            break;
          }
        } catch (e) {
          continue;
        }
      }

      if (!toggleFound) {
        logger.info(
          "Could not find recommended tickets toggle, trying to find any toggle in filter panel..."
        );
        try {
          const anyToggle = page.locator('.sc-cc0fdab1-0 input[type="checkbox"]').first();
          if (await anyToggle.isVisible({ timeout: 2000 })) {
            const isChecked = await anyToggle.isChecked();
            if (isChecked) {
              const boundingBox = await anyToggle.boundingBox();
              if (boundingBox) {
                await this.humanMouseMove(
                  page,
                  Math.random() * 1920,
                  Math.random() * 1080,
                  boundingBox.x,
                  boundingBox.y
                );
                await this.randomDelay(300, 600);
                await anyToggle.click();
                logger.info("Found and toggled OFF recommended option with human-like behavior");
              }
            }
          }
        } catch (e) {
          logger.info("Could not find any toggles, continuing...");
        }
      }
    } catch (toggleError) {
      logger.error(
        "Error handling recommended toggle:",
        toggleError instanceof Error ? toggleError.message : String(toggleError)
      );
    }
  }

  private async closeFilterPanel(page: Page): Promise<void> {
    try {
      await this.randomDelay(1500, 2500);

      await this.humanMouseMove(page, 400, 700, 600, 800);
      await this.randomDelay(500, 1000);

      const closeSelectors = [
        ".sc-eqUAAy.cLbXVP",
        'button:has-text("View")',
        ".sc-cc0fdab1-5",
        'button[class*="View"]',
        '[aria-label="Close"]',
        'button:has-text("×")',
        ".sc-cc0fdab1-1 button",
        'button:has-text("Close")',
        '[data-testid="close-button"]',
        ".close-button",
      ];

      let panelClosed = false;
      for (const selector of closeSelectors) {
        try {
          const closeButton = page.locator(selector).first();
          if (await closeButton.isVisible({ timeout: 2000 })) {
            if (await this.humanClick(page, selector)) {
              logger.info(`Filter panel closed using: ${selector}`);
              panelClosed = true;
              break;
            }
          }
        } catch (e) {
          continue;
        }
      }

      if (!panelClosed) {
        logger.info("Attempting to close filter panel by clicking outside...");
        await this.humanMouseMove(page, 400, 400, 100, 100);
        await this.randomDelay(300, 600);
        await page.mouse.click(100, 100);
        logger.info("Clicked outside to close filter panel");
      }

      await this.randomDelay(1500, 2500);
    } catch (e) {
      logger.error("Could not close filter panel:", e);
    }
  }

  private async extractTicketData(page: Page): Promise<StubHubTicketData[]> {
    const tbodyElements = await page.locator("tbody").all();

    if (tbodyElements.length === 0) {
      throw new Error("No tbody elements found on the page");
    }

    logger.info(`Found ${tbodyElements.length} tbody elements`);

    const rows = await tbodyElements[0].locator("tr").all();
    logger.info(`Found ${rows.length} rows`);

    if (rows.length === 0) {
      throw new Error("No rows found in the table");
    }

    // Search through rows for rawPrice data
    const startRow = Math.min(225, Math.max(0, rows.length - 25));
    const endRow = Math.min(250, rows.length);

    logger.info(`Searching rows ${startRow} to ${endRow}`);

    // First search in the expected range
    for (let x = startRow; x < endRow; x++) {
      try {
        if (x >= rows.length) break;

        const rowText = await rows[x].textContent();

        if (rowText && rowText.includes("rawPrice")) {
          logger.info(`Found rawPrice data in row ${x}`);

          try {
            const wholeJson = JSON.parse(rowText.trim());

            if (wholeJson.grid && wholeJson.grid.items) {
              const itemJson = wholeJson.grid.items;
              logger.info("Successfully found price data");
              return itemJson;
            } else {
              logger.info("JSON structure doesn't contain expected grid/items");
              continue;
            }
          } catch (jsonError) {
            logger.warn(
              `Failed to parse JSON from row ${x}:`,
              jsonError instanceof Error ? jsonError.message : String(jsonError)
            );
            continue;
          }
        }
      } catch (error) {
        logger.warn(
          `Error processing row ${x}:`,
          error instanceof Error ? error.message : String(error)
        );
        continue;
      }
    }

    // If no rawPrice found in the expected range, search all rows
    logger.info("Searching all rows for rawPrice data...");

    for (let x = 0; x < rows.length; x++) {
      try {
        const rowText = await rows[x].textContent();

        if (rowText && rowText.includes("rawPrice")) {
          logger.info(`Found rawPrice data in row ${x}`);

          try {
            const wholeJson = JSON.parse(rowText.trim());

            if (wholeJson.grid && wholeJson.grid.items) {
              const itemJson = wholeJson.grid.items;
              logger.info("Successfully found price data");
              return itemJson;
            }
          } catch (jsonError) {
            logger.warn(
              `Failed to parse JSON from row ${x}:`,
              jsonError instanceof Error ? jsonError.message : String(jsonError)
            );
            continue;
          }
        }
      } catch (error) {
        logger.warn(
          `Error processing row ${x}:`,
          error instanceof Error ? error.message : String(error)
        );
        continue;
      }
    }

    throw new Error("Unable to find rawPrice data on the page");
  }

  private async testConnectivity(): Promise<void> {
    try {
      logger.info("🔍 Testing network connectivity...");

      const testPage = await this.createPage();

      try {
        // Test with a simple, fast-loading page
        await testPage.goto("https://httpbin.org/status/200", {
          waitUntil: "domcontentloaded",
          timeout: 15000,
        });
        logger.info("✅ Network connectivity test passed");
      } catch (connectivityError) {
        logger.warn(
          "⚠️ Network connectivity test failed, but continuing...",
          connectivityError instanceof Error ? connectivityError.message : String(connectivityError)
        );
        // Don't throw here, let the main scraping attempt handle the error
      } finally {
        await testPage.close();
      }
    } catch (error) {
      logger.warn(
        "⚠️ Could not run connectivity test:",
        error instanceof Error ? error.message : String(error)
      );
      // Continue anyway
    }
  }

  private async validateProxy(): Promise<boolean> {
    if (!this.options.useProxy || !proxyManager) {
      return true; // No proxy to validate
    }

    const currentProxy = proxyManager.getCurrentProxy();
    if (!currentProxy) {
      logger.warn("No proxy available for validation");
      return false;
    }

    try {
      logger.info(`🔍 Validating proxy: ${currentProxy.host}:${currentProxy.port}`);

      // Quick test with a simple page
      const testBrowser = await chromium.launch({
        headless: true,
        proxy: {
          server: `http://${currentProxy.host}:${currentProxy.port}`,
          ...(currentProxy.username &&
            currentProxy.password && {
              username: currentProxy.username,
              password: currentProxy.password,
            }),
        },
        args: [
          "--no-sandbox",
          "--disable-setuid-sandbox",
          "--disable-dev-shm-usage",
          "--disable-web-security",
          "--disable-features=VizDisplayCompositor",
        ],
      });

      const testPage = await testBrowser.newPage();
      testPage.setDefaultTimeout(15000); // Quick validation timeout

      // Test with a simple, fast-loading page
      await testPage.goto("https://httpbin.org/ip", {
        waitUntil: "domcontentloaded",
        timeout: 15000,
      });

      const response = await testPage.textContent("body");
      await testBrowser.close();

      if (response && response.includes("origin")) {
        logger.info(`✅ Proxy validation successful: ${currentProxy.host}:${currentProxy.port}`);
        return true;
      } else {
        logger.warn(
          `❌ Proxy validation failed: ${currentProxy.host}:${currentProxy.port} - Invalid response`
        );
        return false;
      }
    } catch (error) {
      logger.warn(
        `❌ Proxy validation failed: ${currentProxy.host}:${currentProxy.port} - ${
          error instanceof Error ? error.message : String(error)
        }`
      );
      return false;
    }
  }

  public async cleanup(): Promise<void> {
    if (this.browser) {
      try {
        await this.browser.close();
        logger.info("StubHub browser closed successfully");
      } catch (error) {
        logger.error("Error closing StubHub browser:", error);
      }
    }
  }
}

export default StubHubScrapper;
