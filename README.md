# SofaScore Scraper + StubHub Scraper

A comprehensive sports data and ticket scraping suite with anti-detection capabilities.

## 🏀 SofaScore Scraper

A modern web scraper for collecting sports data from SofaScore with anti-detection capabilities.

### Features

- **Modern Scraper**: Anti-detection scraping using Puppeteer with stealth mode
- **Legacy Scraper**: Traditional HTTP-based scraping as fallback
- **Sports Support**: Football and Basketball data collection
- **Export Formats**: CSV, Excel, and JSON output
- **Proxy Support**: Built-in proxy rotation capabilities
- **Smart Retry Logic**: Automatic retry with exponential backoff

## 🎫 StubHub Scraper

A sophisticated ticket data scraper for StubHub events with human-like behavior simulation.

### Features

- **Automated Ticket Scraping**: Extract pricing and availability from StubHub
- **Human-like Behavior**: Realistic interactions to avoid detection
- **Filter Management**: Automatically handles StubHub filters
- **API & CLI Modes**: Both interactive and programmatic interfaces

## Installation

```bash
npm install
npx playwright install  # Required for StubHub scraper
```

## Usage

### SofaScore Scraper (Sports Data)
```bash
npm start
```

### StubHub Scraper (Ticket Data)
```bash
# Interactive CLI mode
npm run stubhub

# API server mode
npm run stubhub-api
```

### Build Project
```bash
npm run build
```

## Quick Examples

### SofaScore API Usage
The main interactive scraper will guide you through:
1. Sport selection (Football/Basketball)
2. Scraper method (Modern/Legacy)
3. Date range specification
4. Data export options

### StubHub API Usage
```bash
# Get tickets for a specific event
curl "http://127.0.0.1:8081/scrape?eventId=157794939"
```

## Configuration

Both scrapers support configuration via JSON files. Place your configuration file in the project root.

### Example Configuration:
```json
{
  "configParams": {
    "proxy": ""
  },
  "outputParams": {
    "homeFullTimeOdd": {
      "from": -1,
      "to": -1
    },
    "awayFullTimeOdd": {
      "from": -1,
      "to": -1
    },
    "result": {
      "from": -1,
      "to": -1
    }
  }
}
```

## Scraper Methods

- **Modern Scraper** (Recommended): Uses Puppeteer with anti-detection features
- **Legacy Scraper**: HTTP-based scraping for fallback scenarios

## Output

Data is exported in multiple formats:
- CSV files for spreadsheet applications
- Excel files with formatting
- JSON files for programmatic use