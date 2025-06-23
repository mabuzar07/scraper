import express from "express";
import cors from "cors";
import StubHubScrapper from "services/stubhub-scrapper";
import { logger } from "utils/logger";
import { objectifyErrorObject } from "utils/error-formatter";

const app = express();
const port = process.env.PORT || 8888;

// Enable CORS for all routes
app.use(cors());
app.use(express.json());

// Health check endpoint
app.get("/health", (req, res) => {
  res.status(200).json({
    status: "OK",
    message: "StubHub Scraper API is running",
    timestamp: new Date().toISOString(),
  });
});

// Main scraping endpoint
app.get("/scrape", async (req, res) => {
  const { eventId } = req.query;

  if (!eventId) {
    return res.status(400).json({
      error: "Missing eventId parameter. Usage: /scrape?eventId=YOUR_EVENT_ID",
      example: "/scrape?eventId=157794939"
    });
  }

  let scraper: StubHubScrapper | null = null;

  try {
    logger.info(`🎫 Processing StubHub API request for eventId: ${eventId}`);

    scraper = new StubHubScrapper({
      eventId: eventId as string,
      useProxy: true,
      enableStealth: true,
      maxRetries: 3,
      outputDir: "stubhub-api-data"
    });

    const startTime = Date.now();
    const result = await scraper.scrapeEvent();
    const endTime = Date.now();

    logger.info(`✅ API scraping completed for eventId: ${eventId}`);
    logger.info(`📁 Data saved to: ${result.filePath}`);
    logger.info(`🎫 Found ${result.data.length} tickets`);
    logger.info(`⏱️ Time taken: ${Math.round((endTime - startTime) / 1000)}s`);

    res.status(200).json({
      success: true,
      eventId: eventId,
      ticketCount: result.data.length,
      timeTaken: Math.round((endTime - startTime) / 1000),
      timestamp: new Date().toISOString(),
      filePath: result.filePath,
      data: result.data
    });

  } catch (error) {
    logger.error(`❌ API scraping failed for eventId: ${eventId}:`, error);

    res.status(500).json({
      success: false,
      error: `Scraping failed: ${error.message}`,
      eventId: eventId,
      timestamp: new Date().toISOString(),
      details: objectifyErrorObject(error)
    });
  } finally {
    if (scraper) {
      try {
        await scraper.cleanup();
      } catch (cleanupError) {
        logger.error("Error during cleanup:", cleanupError);
      }
    }
  }
});

// Get event info endpoint (lighter endpoint that just checks if event exists)
app.get("/info", async (req, res) => {
  const { eventId } = req.query;

  if (!eventId) {
    return res.status(400).json({
      error: "Missing eventId parameter. Usage: /info?eventId=YOUR_EVENT_ID"
    });
  }

  res.status(200).json({
    eventId: eventId,
    message: "Use /scrape endpoint to get full ticket data",
    scrapeUrl: `/scrape?eventId=${eventId}`,
    timestamp: new Date().toISOString()
  });
});

// Start server
app.listen(port, () => {
  logger.info(`🚀 StubHub Scraper API Server started on http://127.0.0.1:${port}`);
  console.log(`
📋 Available Endpoints:
======================
🔍 Health Check:     GET http://127.0.0.1:${port}/health
🎫 Scrape Tickets:   GET http://127.0.0.1:${port}/scrape?eventId=YOUR_EVENT_ID
ℹ️  Event Info:      GET http://127.0.0.1:${port}/info?eventId=YOUR_EVENT_ID

📝 Example Usage:
GET http://127.0.0.1:${port}/scrape?eventId=157794939
  `);
});

// Graceful shutdown
process.on("SIGINT", () => {
  logger.info("\n🛑 Received SIGINT. Shutting down StubHub API server...");
  process.exit(0);
});

process.on("SIGTERM", () => {
  logger.info("\n🛑 Received SIGTERM. Shutting down StubHub API server...");
  process.exit(0);
});
