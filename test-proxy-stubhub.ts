import "source-map-support";

import { StubHubScrapper } from "./src/services/stubhub-scrapper";
import { logger } from "./src/utils/logger";

async function testStubHubWithProxy() {
  try {
    console.log("🎫 Testing StubHub Scraper with Proxy Rotation");
    console.log("===============================================\n");

    // Test with the working event ID from the troubleshooting
    const eventId = "158248339";

    logger.info(`🚀 Starting StubHub scraping for event: ${eventId}`);
    logger.info(`📊 Configuration: Proxy=true, Stealth=true, MaxRetries=5`);

    const scraper = new StubHubScrapper({
      eventId,
      useProxy: true,       // Essential for rate limit avoidance
      enableStealth: true,  // Helps with detection
      maxRetries: 5,        // Increased retries for proxy fallback
      outputDir: "stubhub-data"
    });

    const startTime = Date.now();
    const result = await scraper.scrapeEvent();
    const endTime = Date.now();

    logger.info(`✅ Scraping completed successfully!`);
    logger.info(`📁 Data saved to: ${result.filePath}`);
    logger.info(`🎫 Found ${result.data.length} tickets`);
    logger.info(`⏱️ Time taken: ${Math.round((endTime - startTime) / 1000)}s`);

    // Show sample of the data
    if (result.data.length > 0) {
      console.log("\n📋 Sample ticket data:");
      console.log("=====================");
      const sample = result.data.slice(0, 3);
      sample.forEach((ticket, index) => {
        console.log(`\nTicket ${index + 1}:`);
        console.log(`  Price: $${ticket.rawPrice || 'N/A'}`);
        console.log(`  Section: ${ticket.section || 'N/A'}`);
        console.log(`  Row: ${ticket.row || 'N/A'}`);
        console.log(`  Quantity: ${ticket.quantity || 'N/A'}`);
      });

      if (result.data.length > 3) {
        console.log(`\n... and ${result.data.length - 3} more tickets`);
      }
    }

    console.log("\n🎉 Test completed successfully!");

  } catch (error) {
    logger.error("❌ Test failed:", error instanceof Error ? error.message : String(error));
    console.error("\nError details:", {
      name: error instanceof Error ? error.name : "Unknown",
      message: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined
    });
    process.exit(1);
  }
}

// Run the test
testStubHubWithProxy().catch(console.error);
