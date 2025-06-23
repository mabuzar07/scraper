# StubHub Scraper

A sophisticated web scraper for collecting ticket data from StubHub with advanced anti-detection capabilities using Playwright.

## Features

- 🎫 **Automated Ticket Scraping**: Extract ticket pricing and availability data from StubHub events
- 🤖 **Human-like Behavior**: Realistic mouse movements, scrolling, and interaction patterns
- 🌐 **Proxy Support**: Built-in proxy rotation using the same infrastructure as SofaScore scraper
- 🛡️ **Anti-Detection**: Stealth mode with browser fingerprint randomization
- 💾 **JSON Output**: Automatic saving of scraped data with timestamps
- 🔄 **Smart Retry Logic**: Automatic retry with exponential backoff
- 🎯 **Filter Handling**: Automatically disables "Recommended tickets" for better data access

## Installation

The StubHub scraper is integrated into the existing SofaScore scraper project. Make sure you have all dependencies installed:

```bash
npm install
```

## Usage

### Interactive CLI Mode

Run the interactive StubHub scraper:

```bash
npm run stubhub
```

This will prompt you for:
- StubHub Event ID
- Proxy usage preference
- Stealth mode preference

### API Server Mode

Start the StubHub API server:

```bash
npm run stubhub-api
```

The API will be available at `http://127.0.0.1:8081` with the following endpoints:

- **Health Check**: `GET /health`
- **Scrape Event**: `GET /scrape?eventId=YOUR_EVENT_ID`
- **Event Info**: `GET /info?eventId=YOUR_EVENT_ID`

#### Example API Usage:

```bash
curl "http://127.0.0.1:8081/scrape?eventId=157794939"
```

### Programmatic Usage

```typescript
import StubHubScrapper from "services/stubhub-scrapper";

const scraper = new StubHubScrapper({
  eventId: "157794939",
  useProxy: true,
  enableStealth: true,
  maxRetries: 3,
  outputDir: "stubhub-data"
});

try {
  const result = await scraper.scrapeEvent();
  console.log(`Found ${result.data.length} tickets`);
  console.log(`Data saved to: ${result.filePath}`);
} finally {
  await scraper.cleanup();
}
```

## Configuration Options

```typescript
interface StubHubScrapperOptions {
  eventId: string;           // StubHub event ID (required)
  useProxy?: boolean;        // Enable proxy rotation (default: true)
  maxRetries?: number;       // Maximum retry attempts (default: 3)
  enableStealth?: boolean;   // Enable headless mode (default: true)
  outputDir?: string;        // Output directory for JSON files (default: "stubhub-data")
}
```

## Output Format

The scraper saves data in JSON format with the following structure:

```json
{
  "eventId": "157794939",
  "timestamp": "2025-06-23T10:30:00.000Z",
  "ticketCount": 150,
  "data": [
    {
      "rawPrice": 125.50,
      "section": "Section 101",
      "row": "Row 15",
      "seat": "Seat 5-6",
      "quantity": 2,
      // ... additional ticket data
    }
    // ... more tickets
  ]
}
```

## Anti-Detection Features

- **Human-like Mouse Movements**: Realistic cursor movements with natural hesitation
- **Variable Scrolling Patterns**: Random scrolling behavior with different intensities
- **Browser Fingerprint Randomization**: Randomized viewport, user agents, and browser properties
- **Realistic Timing**: Human-like delays between actions
- **Smart Filter Interaction**: Automatically handles StubHub's filter interface

## Proxy Integration

The StubHub scraper uses the same advanced proxy management system as the SofaScore scraper:

- Automatic proxy rotation
- Health monitoring of proxy endpoints
- Geographic diversity with multiple countries
- Fallback mechanisms for failed proxies

## Error Handling

- **Graceful Failures**: Continues operation even if individual tickets fail to parse
- **Retry Logic**: Automatic retry with exponential backoff for transient failures
- **Detailed Logging**: Comprehensive logging for debugging and monitoring
- **Resource Cleanup**: Automatic browser cleanup on exit

## File Structure

```
src/services/stubhub-scrapper/
├── index.ts              # Main StubHub scraper class
stubhub-scraper.ts        # CLI interface
stubhub-api.ts           # API server
stubhub-data/            # Output directory (created automatically)
```

## Integration with SofaScore Project

The StubHub scraper is designed to coexist with the existing SofaScore functionality:

- ✅ **No Conflicts**: Completely separate service that doesn't interfere with SofaScore scraping
- ✅ **Shared Infrastructure**: Uses existing proxy, logging, and utility systems
- ✅ **Independent Operation**: Can be run separately or alongside SofaScore scraper

## Finding Event IDs

StubHub event IDs can be found in the URL when viewing an event on StubHub:

```
https://www.stubhub.com/event/157794939/
                            ↑
                      Event ID
```

## Output Files

Data is automatically saved to timestamped JSON files:

```
stubhub-data/
├── stubhub_157794939_2025-06-23_10-30-15.json
├── stubhub_157794939_2025-06-23_14-45-22.json
└── ...
```

Each file contains complete ticket data for the scraped event with metadata about the scraping session.

## Troubleshooting

### Common Issues

1. **Browser Launch Fails**: Ensure Playwright is properly installed with `npx playwright install`
2. **Proxy Connection Issues**: Check proxy configuration and network connectivity
3. **Event Not Found**: Verify the StubHub event ID is correct and the event is still active
4. **Rate Limiting**: The scraper includes built-in delays and human-like behavior to avoid detection

### Debug Mode

For debugging, set the stealth mode to `false` to see the browser in action:

```typescript
const scraper = new StubHubScrapper({
  eventId: "157794939",
  enableStealth: false  // Shows browser window
});
```
