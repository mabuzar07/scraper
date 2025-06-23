import "source-map-support";

import { StubHubScrapper } from "./src/services/stubhub-scrapper";
import { logger } from "./src/utils/logger";

async function testDirectConnection() {
  try {
    console.log("🎫 Testing StubHub Scraper with Direct Connection");
    console.log("=================================================\n");

    const eventId = "158248339";

    logger.info(`🚀 Starting StubHub scraping for event: ${eventId}`);
    logger.info(`📊 Configuration: Proxy=false, Stealth=true, MaxRetries=2`);

    const scraper = new StubHubScrapper({
      eventId,
      useProxy: false,      // Direct connection only
      enableStealth: true,  // Still use stealth for anti-detection
      maxRetries: 2,        // Lower retries for direct connection
      outputDir: "stubhub-data"
    });

    const startTime = Date.now();
    const result = await scraper.scrapeEvent();
    const endTime = Date.now();

    logger.info(`✅ Direct connection scraping completed successfully!`);
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

    console.log("\n🎉 Direct connection test completed successfully!");
    console.log("⚠️ Note: For production use, enable proxy rotation to avoid rate limits");

  } catch (error) {
    logger.error("❌ Direct connection test failed:", error instanceof Error ? error.message : String(error));
    console.error("\nError details:", {
      name: error instanceof Error ? error.name : "Unknown",
      message: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined
    });
    process.exit(1);
  }
}

// Run the test
testDirectConnection().catch(console.error);
