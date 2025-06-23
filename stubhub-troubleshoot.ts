import "source-map-support";

import StubHubScrapper from "services/stubhub-scrapper";
import { logger } from "utils/logger";
import { objectifyErrorObject } from "utils/error-formatter";

async function testStubHubConnection() {
  logger.info("🔧 StubHub Connection Troubleshooter");
  logger.info("===================================\n");

  const testEventId = "158248339"; // Use the event ID from the error

  // Test configurations
  const testConfigs = [
    {
      name: "Direct Connection (No Proxy, Visible Browser)",
      config: {
        eventId: testEventId,
        useProxy: false,
        enableStealth: false, // Show browser
        maxRetries: 1,
      }
    },
    {
      name: "Direct Connection (No Proxy, Headless)",
      config: {
        eventId: testEventId,
        useProxy: false,
        enableStealth: true,
        maxRetries: 1,
      }
    },
    {
      name: "With Proxy (Visible Browser)",
      config: {
        eventId: testEventId,
        useProxy: true,
        enableStealth: false, // Show browser
        maxRetries: 1,
      }
    },
    {
      name: "With Proxy (Headless)",
      config: {
        eventId: testEventId,
        useProxy: true,
        enableStealth: true,
        maxRetries: 1,
      }
    }
  ];

  for (const test of testConfigs) {
    try {
      logger.info(`\n🧪 Testing: ${test.name}`);
      logger.info("─".repeat(50));

      const scraper = new StubHubScrapper(test.config);

      try {
        const startTime = Date.now();
        const result = await scraper.scrapeEvent();
        const endTime = Date.now();

        logger.info(`✅ ${test.name} - SUCCESS!`);
        logger.info(`📁 Data saved to: ${result.filePath}`);
        logger.info(`🎫 Found ${result.data.length} tickets`);
        logger.info(`⏱️ Time taken: ${Math.round((endTime - startTime) / 1000)}s`);

        // If we get here, this configuration works
        console.log(`\n🎉 WORKING CONFIGURATION FOUND: ${test.name}`);
        console.log("Use this configuration for reliable scraping:");
        console.log(JSON.stringify(test.config, null, 2));
        
        await scraper.cleanup();
        return; // Exit after first successful test

      } catch (scrapingError) {
        logger.error(`❌ ${test.name} - FAILED:`, scrapingError instanceof Error ? scrapingError.message : String(scrapingError));
        
        // Log more details for debugging
        if (scrapingError instanceof Error) {
          const errorDetails = objectifyErrorObject(scrapingError);
          logger.info("Error details:", errorDetails);
        }
      } finally {
        await scraper.cleanup();
      }

    } catch (initError) {
      logger.error(`❌ ${test.name} - INIT FAILED:`, initError instanceof Error ? initError.message : String(initError));
    }

    // Wait between tests
    await new Promise(resolve => setTimeout(resolve, 3000));
  }

  logger.info("\n📋 Troubleshooting Summary:");
  logger.info("==========================");
  logger.info("All test configurations failed. This could indicate:");
  logger.info("1. Network connectivity issues");
  logger.info("2. StubHub blocking your IP/region");
  logger.info("3. Firewall or antivirus blocking browser automation");
  logger.info("4. The specific event ID may be invalid or expired");
  logger.info("\n💡 Suggestions:");
  logger.info("- Try with a different event ID");
  logger.info("- Check your internet connection");
  logger.info("- Try running from a different network");
  logger.info("- Ensure Playwright browsers are installed: npx playwright install");
}

// Handle graceful shutdown
process.on("SIGINT", () => {
  logger.info("\n🛑 Troubleshooter interrupted");
  process.exit(0);
});

process.on("SIGTERM", () => {
  logger.info("\n🛑 Troubleshooter terminated");
  process.exit(0);
});

// Start troubleshooting
testStubHubConnection().catch((error) => {
  logger.error("❌ Troubleshooter fatal error:", error);
  process.exit(1);
});
