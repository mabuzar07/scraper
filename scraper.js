const express = require("express");
const { chromium } = require("playwright");
const cors = require("cors");

const app = express();
const port = process.env.PORT || 8888;

// Enable CORS for all routes
app.use(cors());
app.use(express.json());

// OxyLabs Web Unblocker Configuration
const OXYLABS_CONFIG = {
  endpoint: "unblock.oxylabs.io:60000", // OxyLabs Web Unblocker endpoint
  username: "wasay_W6ZA1", // Replace with your actual username
  password: "f16_88UQwasey_048", // Replace with your actual password
  enabled: true, // Set to false to disable OxyLabs and use direct connection
};

// Multiple Web Unblocker endpoints for rotation (all use same credentials)
const webUnblockerEndpoints = [
  "unblock.oxylabs.io:60000",
  "unblock.oxylabs.io:60001",
  "unblock.oxylabs.io:60002",
  "unblock.oxylabs.io:60003",
  "unblock.oxylabs.io:60004",
  "unblock.oxylabs.io:60005",
  "unblock.oxylabs.io:60006",
  "unblock.oxylabs.io:60007",
  "unblock.oxylabs.io:60008",
  "unblock.oxylabs.io:60009",
];

// User agents array for rotation
const userAgents = [
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36",
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Safari/537.36",
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:132.0) Gecko/20100101 Firefox/132.0",
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36 Edg/131.0.0.0",
  "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.6 Safari/605.1.15",
  "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36",
  "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36",
];

// Screen resolutions for variety
const screenResolutions = [
  { width: 1920, height: 1080 },
  { width: 1366, height: 768 },
  { width: 1536, height: 864 },
  { width: 1440, height: 900 },
  { width: 1600, height: 900 },
  { width: 1280, height: 720 },
];

// Global browser instance and proxy tracking
let browser = null;
let webUnblockerIndex = 0;
let requestCount = 0;

// Initialize browser on startup
async function initBrowser() {
  try {
    browser = await chromium.launch({
      headless: false, // Set to true for production
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
        "--disable-ipc-flooding-protection",
        "--disable-renderer-backgrounding",
        "--disable-backgrounding-occluded-windows",
        "--disable-field-trial-config",
        "--disable-back-forward-cache",
        "--disable-hang-monitor",
        "--disable-prompt-on-repost",
        "--disable-sync",
        "--metrics-recording-only",
        "--no-report-upload",
        "--allow-running-insecure-content",
        "--disable-component-update",
        "--disable-default-apps",
        "--mute-audio",
        "--no-default-browser-check",
        "--autoplay-policy=user-gesture-required",
        "--disable-background-timer-throttling",
        "--disable-renderer-backgrounding",
        "--disable-features=TranslateUI",
        "--disable-extensions",
        // SSL/Certificate bypass options - ENHANCED
        "--ignore-certificate-errors",
        "--ignore-ssl-errors",
        "--ignore-certificate-errors-spki-list",
        "--allow-running-insecure-content",
        "--disable-web-security",
        "--allow-invalid-ssl-certs",
        "--ignore-urlfetcher-cert-requests",
        "--disable-features=VizDisplayCompositor",
        "--ignore-certificate-errors-skip-list",
        "--disable-certificate-transparency",
        "--allow-insecure-localhost",
        "--disable-extensions-file-access-check",
        "--disable-mixed-content-autoupgrade",
        "--allow-cross-origin-auth-prompt",
      ],
    });
    console.log("Browser initialized successfully");
  } catch (error) {
    console.error("Failed to initialize browser:", error);
  }
}

// Get proxy configuration for the current request (Web Unblocker rotation)
function getProxyConfig() {
  requestCount++;

  if (
    OXYLABS_CONFIG.enabled &&
    OXYLABS_CONFIG.username &&
    OXYLABS_CONFIG.password
  ) {
    // Rotate through Web Unblocker endpoints
    const endpoint = webUnblockerEndpoints[webUnblockerIndex];
    webUnblockerIndex = (webUnblockerIndex + 1) % webUnblockerEndpoints.length;

    console.log(
      `Request #${requestCount}: Using OxyLabs Web Unblocker: ${endpoint}`
    );
    return {
      type: "oxylabs",
      server: endpoint,
      username: OXYLABS_CONFIG.username,
      password: OXYLABS_CONFIG.password,
      displayName: `OxyLabs Web Unblocker (${endpoint})`,
    };
  } else {
    console.log(
      `Request #${requestCount}: Using direct connection (Web Unblocker disabled)`
    );
    return {
      type: "direct",
      displayName: "Direct Connection",
    };
  }
}

// Helper function to get random user agent
function getRandomUserAgent() {
  return userAgents[Math.floor(Math.random() * userAgents.length)];
}

// Helper function to get random screen resolution
function getRandomResolution() {
  return screenResolutions[
    Math.floor(Math.random() * screenResolutions.length)
  ];
}

// Helper function for random delay
function randomDelay(min = 1000, max = 3000) {
  return new Promise((resolve) => {
    const delay = Math.floor(Math.random() * (max - min + 1)) + min;
    setTimeout(resolve, delay);
  });
}

// Simulate human-like mouse movements
async function humanizeMouseMovement(page) {
  const resolution = await page.viewportSize();
  const steps = Math.floor(Math.random() * 3) + 2; // 2-4 steps

  for (let i = 0; i < steps; i++) {
    const x = Math.floor(Math.random() * resolution.width);
    const y = Math.floor(Math.random() * resolution.height);

    await page.mouse.move(x, y, { steps: Math.floor(Math.random() * 10) + 5 });
    await randomDelay(100, 500);
  }
}

// Simulate human typing with random delays
async function humanType(page, selector, text) {
  await page.focus(selector);
  await randomDelay(100, 300);

  for (const char of text) {
    await page.keyboard.type(char);
    await randomDelay(50, 150);
  }
}

// Add random scroll behavior
async function randomScroll(page) {
  const scrolls = Math.floor(Math.random() * 3) + 1; // 1-3 scrolls

  for (let i = 0; i < scrolls; i++) {
    const scrollDistance = Math.floor(Math.random() * 500) + 100;
    await page.mouse.wheel(0, scrollDistance);
    await randomDelay(500, 1500);
  }
}

// Enhanced stealth measures for the page
async function setupStealthPage(page) {
  // Override webdriver property
  await page.addInitScript(() => {
    Object.defineProperty(navigator, "webdriver", {
      get: () => undefined,
    });
  });

  // Override plugins
  await page.addInitScript(() => {
    Object.defineProperty(navigator, "plugins", {
      get: () => [1, 2, 3, 4, 5],
    });
  });

  // Override languages
  await page.addInitScript(() => {
    Object.defineProperty(navigator, "languages", {
      get: () => ["en-US", "en"],
    });
  });

  // Override permissions
  await page.addInitScript(() => {
    const originalQuery = window.navigator.permissions.query;
    return (window.navigator.permissions.query = (parameters) =>
      parameters.name === "notifications"
        ? Promise.resolve({ state: Notification.permission })
        : originalQuery(parameters));
  });

  // Override Chrome runtime
  await page.addInitScript(() => {
    if (window.chrome && window.chrome.runtime) {
      Object.defineProperty(window.chrome.runtime, "onConnect", {
        value: undefined,
      });
    }
  });

  // Add additional headers to look more human
  await page.setExtraHTTPHeaders({
    Accept:
      "text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.9",
    "Accept-Encoding": "gzip, deflate, br",
    "Accept-Language": "en-US,en;q=0.9",
    "Cache-Control": "no-cache",
    Pragma: "no-cache",
    "Sec-Fetch-Dest": "document",
    "Sec-Fetch-Mode": "navigate",
    "Sec-Fetch-Site": "none",
    "Sec-Fetch-User": "?1",
    "Upgrade-Insecure-Requests": "1",
  });
}

// Main scraping endpoint
app.get("/", async (req, res) => {
  const { eventId } = req.query;

  if (!eventId) {
    return res.status(400).json({
      error: "Missing eventId parameter. Usage: /?eventId=YOUR_EVENT_ID",
    });
  }

  let page = null;
  let currentProxy = null;

  try {
    console.log(`Processing request for eventId: ${eventId}`);

    // Get proxy configuration for this request
    currentProxy = getProxyConfig();
    console.log(`Using proxy: ${currentProxy.displayName}`);

    // Create browser context with proxy configuration and SSL bypass
    const contextOptions = {
      userAgent: getRandomUserAgent(),
      viewport: getRandomResolution(),
      locale: "en-US",
      timezoneId: "America/New_York",
      geolocation: { longitude: -74.006, latitude: 40.7128 },
      permissions: ["geolocation"],
      // CRITICAL: Ignore SSL certificate errors
      ignoreHTTPSErrors: true,
    };

    // Configure proxy based on type
    if (currentProxy.type !== "direct") {
      contextOptions.proxy = {
        server: `http://${currentProxy.server}`,
        // Add bypass for localhost and other common bypasses
        bypass: "localhost,127.0.0.1,*.local",
      };

      if (currentProxy.username && currentProxy.password) {
        contextOptions.httpCredentials = {
          username: currentProxy.username,
          password: currentProxy.password,
        };
      }
    }

    const context = await browser.newContext(contextOptions);
    page = await context.newPage();

    // Additional SSL bypass at page level
    page.on("response", (response) => {
      if (response.status() >= 400) {
        console.log(`Response ${response.status()}: ${response.url()}`);
      }
    });

    // Set up stealth measures
    await setupStealthPage(page);

    const resolution = getRandomResolution();
    await page.setViewportSize(resolution);

    console.log(`Using resolution: ${resolution.width}x${resolution.height}`);

    // Add some initial human-like behavior
    await randomDelay(1000, 2000);
    await humanizeMouseMovement(page);

    // Test proxy connection first (optional debugging)
    if (currentProxy.type !== "direct") {
      console.log(`Testing proxy connection to: ${currentProxy.server}`);
      try {
        // Test with a simple page first
        await page.goto("http://httpbin.org/ip", { timeout: 10000 });
        const content = await page.textContent("body");
        console.log("Proxy test successful, IP info:", content);
      } catch (testError) {
        console.log("Proxy test failed, but continuing:", testError.message);
      }
    }

    // Navigate to the StubHub event page with enhanced retry mechanism
    const normalUrl = `https://www.stubhub.com/event/${eventId}/?quantity=0`;
    console.log(`First navigating to: ${normalUrl}`);

    let navigationSuccess = false;
    const navigationAttempts = [
      { waitUntil: "networkidle", timeout: 25000 },
      { waitUntil: "domcontentloaded", timeout: 30000 },
      { waitUntil: "load", timeout: 35000 },
      { waitUntil: "commit", timeout: 20000 }, // Just wait for navigation to start
    ];

    for (let i = 0; i < navigationAttempts.length; i++) {
      try {
        console.log(
          `Navigation attempt ${i + 1} with ${
            navigationAttempts[i].waitUntil
          }...`
        );

        await page.goto(normalUrl, {
          waitUntil: navigationAttempts[i].waitUntil,
          timeout: navigationAttempts[i].timeout,
        });

        navigationSuccess = true;
        console.log(
          `Navigation successful with ${navigationAttempts[i].waitUntil}`
        );
        break;
      } catch (navError) {
        console.log(`Navigation attempt ${i + 1} failed: ${navError.message}`);

        if (i === navigationAttempts.length - 1) {
          console.log(
            "All navigation attempts failed, trying direct approach..."
          );

          // Last resort: try without waiting for specific events
          try {
            await page.goto(normalUrl, { timeout: 40000 });
            navigationSuccess = true;
            console.log("Direct navigation successful");
          } catch (directError) {
            throw new Error(
              `All navigation attempts failed. Last error: ${directError.message}`
            );
          }
        } else {
          // Wait a bit before next attempt
          await randomDelay(2000, 4000);
        }
      }
    }

    if (!navigationSuccess) {
      throw new Error("Failed to navigate to the page after all attempts");
    }

    console.log("Page loaded successfully");

    // Add human-like behavior after page load
    await randomDelay(2000, 4000);
    await randomScroll(page);
    await humanizeMouseMovement(page);

    console.log("Page loaded, looking for filter button...");

    // Wait for page to be interactive before looking for elements
    await page.waitForLoadState("domcontentloaded");
    await randomDelay(1000, 2000);

    // Wait for and click the filter button using the exact selector from HTML
    try {
      // From the HTML, I can see the exact filter button structure
      const filterButton = page
        .locator(
          '#event-detail-filter-container-mobile [role="combobox"][aria-label="Filters"]'
        )
        .first();

      await filterButton.waitFor({
        state: "visible",
        timeout: 15000,
      });

      // Human-like click with slight delay
      await randomDelay(500, 1000);
      await filterButton.click();
      console.log("Filter button clicked successfully");

      // Wait for the filter panel to appear
      await randomDelay(2000, 3000);
    } catch (filterError) {
      console.log(
        "Could not find or click main filter button, trying alternative selectors..."
      );

      // Try alternative selectors based on the HTML structure
      const alternativeSelectors = [
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

      let filterFound = false;
      for (const selector of alternativeSelectors) {
        try {
          const element = page.locator(selector).first();
          await element.waitFor({
            state: "visible",
            timeout: 3000,
          });

          await randomDelay(300, 800);
          await element.click();
          console.log(
            `Filter button found and clicked using selector: ${selector}`
          );
          filterFound = true;
          await randomDelay(2000, 3000);
          break;
        } catch (e) {
          // Continue to next selector
          continue;
        }
      }

      if (!filterFound) {
        console.log(
          "Could not find filter button, proceeding without filtering..."
        );
      }
    }

    // Look for and toggle off the "Recommended tickets" option
    try {
      console.log("Looking for recommended tickets toggle...");

      // Add some human behavior before interacting with toggles
      await humanizeMouseMovement(page);
      await randomDelay(500, 1500);

      // Based on the HTML structure, look for the recommended tickets checkbox
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
          await toggle.waitFor({
            state: "visible",
            timeout: 5000,
          });

          const isChecked = await toggle.isChecked();
          console.log(
            `Found toggle with selector ${selector}, checked: ${isChecked}`
          );

          if (isChecked) {
            await randomDelay(300, 700);
            await toggle.click();
            console.log("Recommended tickets toggle turned OFF");
            await randomDelay(1000, 2000);
          } else {
            console.log("Recommended tickets toggle is already OFF");
          }
          toggleFound = true;
          break;
        } catch (e) {
          // Continue to next selector
          continue;
        }
      }

      if (!toggleFound) {
        console.log(
          "Could not find recommended tickets toggle, trying to find any toggle in filter panel..."
        );

        // Try to find any checkbox/toggle in the filter panel
        try {
          const anyToggle = page
            .locator('.sc-cc0fdab1-0 input[type="checkbox"]')
            .first();
          if (await anyToggle.isVisible({ timeout: 2000 })) {
            console.log(
              "Found a checkbox in filter panel, checking if it's the recommended one..."
            );

            const isChecked = await anyToggle.isChecked();
            if (isChecked) {
              await randomDelay(200, 600);
              await anyToggle.click();
              console.log("Found and toggled OFF recommended option");
            }
          }
        } catch (e) {
          console.log("Could not find any toggles, continuing...");
        }
      }

      // Close the filter panel by looking for the "View" button or close button
      try {
        await randomDelay(1000, 2000);
        await humanizeMouseMovement(page);

        const closeSelectors = [
          ".sc-eqUAAy.cLbXVP", // "View 1 pass" button from HTML
          'button:has-text("View")',
          ".sc-cc0fdab1-5", // Close X button
          'button[class*="View"]',
          '[aria-label="Close"]',
          'button:has-text("×")',
          ".sc-cc0fdab1-1 button", // Any button in the filter footer
          'button:has-text("Close")',
          '[data-testid="close-button"]',
          ".close-button",
        ];

        let panelClosed = false;
        for (const selector of closeSelectors) {
          try {
            const closeButton = page.locator(selector).first();
            if (await closeButton.isVisible({ timeout: 2000 })) {
              await randomDelay(200, 500);
              await closeButton.click();
              console.log(`Filter panel closed using: ${selector}`);
              panelClosed = true;
              break;
            }
          } catch (e) {
            continue;
          }
        }

        if (!panelClosed) {
          // Click outside the panel with human-like movement
          const resolution = await page.viewportSize();
          const x = Math.floor(Math.random() * 200) + 100;
          const y = Math.floor(Math.random() * 200) + 100;
          await page.mouse.move(x, y, { steps: 5 });
          await page.click("body", { position: { x, y } });
          console.log("Clicked outside to close filter panel");
        }

        await randomDelay(1000, 2000);
      } catch (e) {
        console.log("Could not close filter panel, continuing...");
      }
    } catch (toggleError) {
      console.log("Error handling recommended toggle:", toggleError.message);
    }

    // Wait for page to update after filter changes
    await randomDelay(2000, 3000);
    await randomScroll(page);

    // Now navigate to the view-source page to get the data
    const url = `view-source:https://www.stubhub.com/event/${eventId}/?quantity=0`;
    console.log(`Now fetching data from: ${url}`);

    try {
      await page.goto(url, {
        waitUntil: "domcontentloaded",
        timeout: 25000,
      });
    } catch (viewSourceError) {
      console.log("Error loading view-source, trying with longer timeout...");
      await page.goto(url, {
        waitUntil: "load",
        timeout: 35000,
      });
    }

    await randomDelay(1000, 3000);
    console.log("Page source loaded, searching for data...");

    // Find tbody elements and extract data
    const tbodyElements = await page.locator("tbody").all();

    if (tbodyElements.length === 0) {
      return res.status(404).json({
        error: "No tbody elements found on the page",
        eventId: eventId,
        proxy: currentProxy.displayName,
      });
    }

    console.log(`Found ${tbodyElements.length} tbody elements`);
    const rows = await tbodyElements[0].locator("tr").all();
    console.log(`Found ${rows.length} rows`);

    if (rows.length === 0) {
      return res.status(404).json({
        error: "No rows found in the table",
        eventId: eventId,
        proxy: currentProxy.displayName,
      });
    }

    let gotPrice = false;
    const startRow = Math.min(225, Math.max(0, rows.length - 25));
    const endRow = Math.min(250, rows.length);
    console.log(`Searching rows ${startRow} to ${endRow}`);

    // Search for rawPrice data
    for (let x = startRow; x < endRow; x++) {
      try {
        if (x >= rows.length) break;
        const rowText = await rows[x].textContent();

        if (rowText && rowText.includes("rawPrice")) {
          gotPrice = true;
          console.log(`Found rawPrice data in row ${x}`);

          try {
            const wholeJson = JSON.parse(rowText.trim());
            if (wholeJson.grid && wholeJson.grid.items) {
              const itemJson = wholeJson.grid.items;
              console.log("Successfully found price data");
              console.log(
                `Request completed using: ${currentProxy.displayName}`
              );

              return res.status(200).json({
                data: itemJson,
                meta: {
                  eventId: eventId,
                  proxy: currentProxy.displayName,
                  proxyType: currentProxy.type,
                  requestNumber: requestCount,
                  timestamp: new Date().toISOString(),
                },
              });
            }
          } catch (jsonError) {
            console.log(
              `Failed to parse JSON from row ${x}:`,
              jsonError.message
            );
            continue;
          }
        }
      } catch (error) {
        console.log(`Error processing row ${x}:`, error.message);
        continue;
      }
    }

    // If not found in expected range, search all rows
    if (!gotPrice) {
      console.log("Searching all rows for rawPrice data...");
      for (let x = 0; x < rows.length; x++) {
        try {
          const rowText = await rows[x].textContent();
          if (rowText && rowText.includes("rawPrice")) {
            gotPrice = true;
            console.log(`Found rawPrice data in row ${x}`);

            try {
              const wholeJson = JSON.parse(rowText.trim());
              if (wholeJson.grid && wholeJson.grid.items) {
                const itemJson = wholeJson.grid.items;
                console.log("Successfully found price data");
                console.log(
                  `Request completed using: ${currentProxy.displayName}`
                );

                return res.status(200).json({
                  data: itemJson,
                  meta: {
                    eventId: eventId,
                    proxy: currentProxy.displayName,
                    proxyType: currentProxy.type,
                    requestNumber: requestCount,
                    timestamp: new Date().toISOString(),
                  },
                });
              }
            } catch (jsonError) {
              console.log(
                `Failed to parse JSON from row ${x}:`,
                jsonError.message
              );
              continue;
            }
          }
        } catch (error) {
          console.log(`Error processing row ${x}:`, error.message);
          continue;
        }
      }
    }

    if (!gotPrice) {
      return res.status(404).json({
        error: "Unable to find rawPrice data on the page",
        eventId: eventId,
        proxy: currentProxy.displayName,
      });
    }
  } catch (error) {
    console.error("Error in scraping:", error);
    console.error(
      `Error occurred with proxy: ${
        currentProxy ? currentProxy.displayName : "unknown"
      }`
    );

    return res.status(500).json({
      error: `Internal server error: ${error.message}`,
      eventId: eventId,
      proxy: currentProxy ? currentProxy.displayName : "unknown",
    });
  } finally {
    if (page) {
      try {
        const context = page.context();
        await page.close();
        await context.close();
        console.log("Page and context closed successfully");
      } catch (closeError) {
        console.error("Error closing page/context:", closeError);
      }
    }
  }
});

// Health check endpoint
app.get("/health", (req, res) => {
  res.status(200).json({
    status: "OK",
    message: "StubHub Price Scraper API is running",
    timestamp: new Date().toISOString(),
    proxyConfig: {
      oxyLabsEnabled: OXYLABS_CONFIG.enabled,
      webUnblockerEndpoints: webUnblockerEndpoints.length,
      totalRequests: requestCount,
    },
  });
});

// Proxy status endpoint
app.get("/proxy-status", (req, res) => {
  res.status(200).json({
    currentConfig: {
      oxyLabsEnabled: OXYLABS_CONFIG.enabled,
      webUnblockerEndpoints: webUnblockerEndpoints.length,
      currentEndpointIndex: webUnblockerIndex,
      currentEndpoint: OXYLABS_CONFIG.enabled
        ? webUnblockerEndpoints[webUnblockerIndex]
        : "none",
    },
    stats: {
      totalRequests: requestCount,
      nextProxyType: OXYLABS_CONFIG.enabled
        ? "oxylabs-web-unblocker"
        : "direct",
    },
    availableEndpoints: webUnblockerEndpoints,
  });
});

// OxyLabs configuration endpoint
app.post("/configure-oxylabs", (req, res) => {
  const { username, password, enabled } = req.body;

  if (username) OXYLABS_CONFIG.username = username;
  if (password) OXYLABS_CONFIG.password = password;
  if (typeof enabled === "boolean") OXYLABS_CONFIG.enabled = enabled;

  res.status(200).json({
    message: "OxyLabs configuration updated",
    config: {
      endpoint: OXYLABS_CONFIG.endpoint,
      enabled: OXYLABS_CONFIG.enabled,
      username: OXYLABS_CONFIG.username ? "***configured***" : "not set",
    },
  });
});

// Start server
async function startServer() {
  try {
    await initBrowser();

    app.listen(port, () => {
      console.log(
        `StubHub Price Scraper Server started http://127.0.0.1:${port}`
      );
      console.log(`Usage: GET /?eventId=YOUR_EVENT_ID`);
      console.log(`Example: http://127.0.0.1:${port}/?eventId=157794939`);
      console.log(`Health check: http://127.0.0.1:${port}/health`);
      console.log(`Proxy status: http://127.0.0.1:${port}/proxy-status`);
      console.log(`OxyLabs enabled: ${OXYLABS_CONFIG.enabled}`);
      console.log(`Web Unblocker endpoints: ${webUnblockerEndpoints.length}`);

      if (!OXYLABS_CONFIG.enabled) {
        console.log(
          "WARNING: OxyLabs Web Unblocker disabled. Using direct connection."
        );
      }
    });
  } catch (error) {
    console.error("Failed to start server:", error);
    process.exit(1);
  }
}

// Graceful shutdown
process.on("SIGINT", async () => {
  console.log("\nReceived SIGINT. Gracefully shutting down...");

  if (browser) {
    try {
      await browser.close();
      console.log("Browser closed successfully");
    } catch (error) {
      console.error("Error closing browser:", error);
    }
  }

  process.exit(0);
});

process.on("SIGTERM", async () => {
  console.log("\nReceived SIGTERM. Gracefully shutting down...");

  if (browser) {
    try {
      await browser.close();
      console.log("Browser closed successfully");
    } catch (error) {
      console.error("Error closing browser:", error);
    }
  }

  process.exit(0);
});

// Start the server
startServer();
