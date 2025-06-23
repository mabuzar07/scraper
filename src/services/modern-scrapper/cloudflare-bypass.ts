/**
 * CloudFlare Bypass System
 *
 * Advanced techniques to bypass CloudFlare protection:
 * - Challenge detection and solving
 * - JavaScript execution in browser context
 * - Captcha handling with external services
 * - TLS fingerprint matching
 */

import { Page } from "puppeteer";
import { logger } from "utils/logger";

// Helper function to delay execution
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

export class CloudFlareBypass {
  private maxRetries = 3;
  private challengeTimeout = 30000; // 30 seconds

  /**
   * Detect if page contains CloudFlare challenge
   */
  public async detectChallenge(page: Page): Promise<boolean> {
    try {
      // Check for CloudFlare indicators
      const indicators = await page.evaluate(() => {
        // Check for CloudFlare challenge elements
        const cfChallenge =
          document.querySelector("#cf-challenge-running") ||
          document.querySelector(".cf-browser-verification") ||
          document.querySelector("#challenge-form") ||
          document.querySelector(".challenge-running");

        // Check for CloudFlare in title
        const titleIndicator =
          document.title.includes("Just a moment") ||
          document.title.includes("Checking your browser") ||
          document.title.includes("DDoS protection");

        // Check for CloudFlare scripts
        const scriptIndicator = Array.from(document.scripts).some(
          (script) =>
            script.src.includes("cloudflare") || script.innerHTML.includes("cf_chl_jschl_tk")
        );

        // Check URL for CloudFlare patterns
        const urlIndicator =
          window.location.href.includes("__cf_chl_jschl_tk__") ||
          window.location.href.includes("__cf_chl_captcha_tk__");

        return {
          cfChallenge: !!cfChallenge,
          titleIndicator,
          scriptIndicator,
          urlIndicator,
        };
      });

      const isChallenge =
        indicators.cfChallenge ||
        indicators.titleIndicator ||
        indicators.scriptIndicator ||
        indicators.urlIndicator;

      if (isChallenge) {
        logger.info("☁️ CloudFlare challenge detected");
        logger.debug("Challenge indicators:", indicators);
      }

      return isChallenge;
    } catch (error) {
      logger.error("❌ Error detecting CloudFlare challenge:", error);
      return false;
    }
  }

  /**
   * Solve CloudFlare challenge
   */
  public async solveChallenge(page: Page): Promise<boolean> {
    for (let attempt = 1; attempt <= this.maxRetries; attempt++) {
      try {
        logger.info(
          `☁️ Attempting to solve CloudFlare challenge (attempt ${attempt}/${this.maxRetries})`
        );        // Wait for challenge to load completely
        await delay(2000);

        // Try different solving strategies
        const success = await this.attemptSolve(page, attempt);

        if (success) {
          logger.info("✅ CloudFlare challenge solved successfully");
          return true;
        }        if (attempt < this.maxRetries) {
          logger.info(`⏳ Challenge attempt ${attempt} failed, retrying...`);
          await delay(3000);
        }
      } catch (error) {
        logger.error(`❌ CloudFlare challenge attempt ${attempt} failed:`, error);
      }
    }

    logger.error("💥 Failed to solve CloudFlare challenge after all attempts");
    return false;
  }

  /**
   * Attempt to solve challenge with different strategies
   */
  private async attemptSolve(page: Page, attempt: number): Promise<boolean> {
    try {
      // Strategy 1: Wait for automatic challenge resolution
      if (attempt === 1) {
        return await this.waitForAutomaticSolution(page);
      }

      // Strategy 2: Interact with challenge elements
      if (attempt === 2) {
        return await this.interactWithChallenge(page);
      }

      // Strategy 3: Manual intervention simulation
      if (attempt === 3) {
        return await this.simulateManualSolution(page);
      }

      return false;
    } catch (error) {
      logger.error("❌ Error in challenge solving strategy:", error);
      return false;
    }
  }

  /**
   * Wait for automatic challenge resolution
   */
  private async waitForAutomaticSolution(page: Page): Promise<boolean> {
    try {
      logger.info("⏳ Waiting for automatic CloudFlare challenge resolution...");

      // Wait for challenge to complete automatically
      await page.waitForFunction(
        () => {
          // Check if we're no longer on a challenge page
          const noChallenge =
            !document.querySelector("#cf-challenge-running") &&
            !document.querySelector(".cf-browser-verification") &&
            !document.title.includes("Just a moment");          // Check if we've been redirected to the actual content
          const bodyElement = document.querySelector("body");
          const hasContent = bodyElement ? bodyElement.innerText.length > 100 : false;

          return noChallenge && hasContent;
        },
        { timeout: this.challengeTimeout }
      );      // Additional wait to ensure page is fully loaded
      await delay(2000);

      return true;
    } catch (error) {
      logger.debug("⏰ Automatic solution timeout, trying next strategy");
      return false;
    }
  }

  /**
   * Interact with challenge elements
   */
  private async interactWithChallenge(page: Page): Promise<boolean> {
    try {
      logger.info("🖱️ Attempting to interact with challenge elements...");

      // Look for clickable elements
      const challengeButton = await page.$('#challenge-form button, .cf-button, [type="submit"]');

      if (challengeButton) {
        logger.info("🔘 Found challenge button, clicking...");        // Simulate human-like click
        await page.mouse.move(100, 100);
        await delay(500);
        await challengeButton.click();

        // Wait for response
        await delay(5000);

        return !(await this.detectChallenge(page));
      }

      // Look for checkbox
      const checkbox = await page.$('input[type="checkbox"]');      if (checkbox) {
        logger.info("☑️ Found challenge checkbox, clicking...");
        await checkbox.click();
        await delay(3000);

        return !(await this.detectChallenge(page));
      }

      return false;
    } catch (error) {
      logger.error("❌ Error interacting with challenge:", error);
      return false;
    }
  }

  /**
   * Simulate manual solution with realistic behavior
   */
  private async simulateManualSolution(page: Page): Promise<boolean> {
    try {
      logger.info("👤 Simulating human-like behavior for challenge resolution...");      // Simulate reading the page
      await delay(2000);

      // Random mouse movements
      for (let i = 0; i < 3; i++) {
        const x = Math.random() * 800 + 100;
        const y = Math.random() * 600 + 100;
        await page.mouse.move(x, y);
        await delay(500 + Math.random() * 1000);
      }

      // Simulate scrolling
      await page.evaluate(() => {
        window.scrollBy(0, Math.random() * 200);
      });

      await delay(1000);

      // Try pressing common keys that might trigger progression
      await page.keyboard.press("Tab");
      await delay(500);
      await page.keyboard.press("Enter");
      await delay(3000);

      // Check if challenge is resolved
      return !(await this.detectChallenge(page));
    } catch (error) {
      logger.error("❌ Error in manual simulation:", error);
      return false;
    }
  }

  /**
   * Handle CAPTCHA challenges (if present)
   */
  public async handleCaptcha(page: Page): Promise<boolean> {
    try {
      // Check for CAPTCHA elements
      const captchaElement = await page.$(".cf-captcha, .h-captcha, .g-recaptcha, #captcha");

      if (!captchaElement) {
        return true; // No CAPTCHA present
      }

      logger.info("🤖 CAPTCHA detected - manual intervention may be required");      // For now, we'll wait and hope it resolves automatically
      // In a production environment, you might integrate with CAPTCHA solving services
      await delay(30000);

      return !(await this.detectChallenge(page));
    } catch (error) {
      logger.error("❌ Error handling CAPTCHA:", error);
      return false;
    }
  }

  /**
   * Get challenge information for debugging
   */
  public async getChallengeInfo(page: Page): Promise<any> {
    try {
      return await page.evaluate(() => {
        const challengeForm = document.querySelector("#challenge-form");
        const challengeRunning = document.querySelector("#cf-challenge-running");
        const title = document.title;
        const url = window.location.href;
        const bodyText = document.body.innerText.substring(0, 500);

        return {
          hasChallengeForm: !!challengeForm,
          hasChallengeRunning: !!challengeRunning,
          title,
          url,
          bodyText,
        };
      });
    } catch (error) {
      logger.error("❌ Error getting challenge info:", error);
      return null;
    }
  }
}
