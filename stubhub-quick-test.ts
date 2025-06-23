import "source-map-support";

import StubHubScrapper from "services/stubhub-scrapper";
import { logger } from "utils/logger";

async function quickTest() {
  logger.info("🚀 Quick StubHub Test");
  logger.info("====================\n");

  // Test with the exact same configuration that failed
  const scraper = new StubHubScrapper({
    eventId: "158248339",
    useProxy: false, // Start without proxy to isolate network issues
    enableStealth: false, // Visible browser for debugging
    maxRetries: 1,
    outputDir: "stubhub-test-data"
  });

  try {
    logger.info("📋 Configuration:");
    logger.info("- Event ID: 158248339");
    logger.info("- Proxy: Disabled");
    logger.info("- Stealth: Disabled (browser will be visible)");
    logger.info("- Max Retries: 1");
    logger.info("\n🔍 Starting test...");

    const result = await scraper.scrapeEvent();
    
    logger.info("✅ SUCCESS! StubHub scraper is working");
    logger.info(`📁 Data saved to: ${result.filePath}`);
    logger.info(`🎫 Found ${result.data.length} tickets`);

  } catch (error) {
    logger.error("❌ Test failed:", error instanceof Error ? error.message : String(error));
    
    // Provide specific guidance based on error type
    if (error instanceof Error) {
      if (error.message.includes("ERR_TIMED_OUT")) {
        logger.info("\n💡 Timeout error detected. Try these solutions:");
        logger.info("1. Check your internet connection");
        logger.info("2. Try a different network (mobile hotspot)");
        logger.info("3. Check if your firewall is blocking the connection");
        logger.info("4. Try with proxy enabled: useProxy: true");
      } else if (error.message.includes("ERR_NETWORK_CHANGED")) {
        logger.info("\n💡 Network change detected. Solutions:");
        logger.info("1. Restart the script");
        logger.info("2. Check network stability");
      } else if (error.message.includes("ERR_INTERNET_DISCONNECTED")) {
        logger.info("\n💡 Internet disconnected. Solutions:");
        logger.info("1. Check your internet connection");
        logger.info("2. Try again when connection is stable");
      }
    }
  } finally {
    await scraper.cleanup();
  }
}

// Start test
quickTest().catch((error) => {
  logger.error("❌ Fatal error:", error);
  process.exit(1);
});
