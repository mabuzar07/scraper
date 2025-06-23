import "source-map-support";

import StubHubScrapper from "services/stubhub-scrapper";
import { logger } from "utils/logger";
import inquirer from "inquirer";
import { objectifyErrorObject } from "utils/error-formatter";

async function main() {
  try {
    console.log("🎫 StubHub Ticket Scraper");
    console.log("===========================\n");

    const { eventId } = await inquirer.prompt([
      {
        type: "input",
        name: "eventId",
        message: "Enter StubHub Event ID:",
        validate: (input) => {
          if (!input || input.trim().length === 0) {
            return "Event ID is required";
          }
          if (!/^\d+$/.test(input.trim())) {
            return "Event ID should be a number";
          }
          return true;
        }
      }
    ]);    const { useProxy } = await inquirer.prompt([
      {
        type: "confirm",
        name: "useProxy",
        message: "Use proxy rotation? (Recommended for full data access)",
        default: true  // Proxy is essential for avoiding rate limits
      }
    ]);

    const { enableStealth } = await inquirer.prompt([
      {
        type: "confirm",
        name: "enableStealth",
        message: "Enable stealth mode (headless)?",
        default: true  // Stealth mode helps avoid detection
      }
    ]);

    logger.info(`🚀 Starting StubHub scraping for event: ${eventId}`);
    logger.info(`📊 Configuration: Proxy=${useProxy}, Stealth=${enableStealth}`);

    const scraper = new StubHubScrapper({
      eventId: eventId.trim(),
      useProxy,
      enableStealth,
      maxRetries: 3,
      outputDir: "stubhub-data"
    });

    try {
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

    } catch (scrapingError) {
      logger.error("❌ Scraping failed:", scrapingError);
      console.error("\nError details:", objectifyErrorObject(scrapingError));
    } finally {
      await scraper.cleanup();
    }

  } catch (error) {
    logger.error("❌ Application error:", error);
    console.error(objectifyErrorObject(error));
    process.exit(1);
  }
}

// Handle graceful shutdown
process.on("SIGINT", () => {
  logger.info("\n🛑 Received SIGINT. Shutting down gracefully...");
  process.exit(0);
});

process.on("SIGTERM", () => {
  logger.info("\n🛑 Received SIGTERM. Shutting down gracefully...");
  process.exit(0);
});

// Start the application
main().catch((error) => {
  logger.error("❌ Fatal error:", error);
  process.exit(1);
});
