import "source-map-support";

import SofascoreResultsFormatter from "services/formatter";
import SofascoreScrapper from "services/scrapper";
import { ModernSofaScoreScraper } from "services/modern-scrapper";
import { exportJSON } from "utils/excel";
import inquirer from "inquirer";
import select from "@inquirer/select";
import { dateRangeToArray, validateInputDate } from "utils/date";
import { logger } from "utils/logger";
import TelegramBot from "services/telegram";
import { objectifyErrorObject } from "utils/error-formatter";
import Config from "utils/config";
import path from "path";
import fs from "fs";
import { IRow } from "services/formatter/types";
import { Sports, IEventJoinedData } from "services/scrapper/types";
import { DEFAULT_CONFIGS } from "utils/config/default";
import { randomWait } from "utils/random";

function validateDate(input: string) {
  // @ts-ignore
  const done = this.async();

  if (validateInputDate(input)) {
    return done(null, true);
  }

  return done(`Wrong input given! format should be: 'yyyy-MM-dd', got: '${input}'`);
}

async function loadConfig(sport: Sports) {
  const fileCandidates = fs
    .readdirSync(process.cwd())
    .filter((filename) => filename.includes(".json"));

  const foundFiles: { [key: string]: string[] } = {};
  for (const file of fileCandidates) {
    const configJson = require(path.join(process.cwd(), `./${file}`));
    // TODO im just lazy here, proper type checking can be added
    if (configJson.outputParams && configJson.outputParams.homeFullTimeOdd) {
      if (!foundFiles[Sports.football]) {
        foundFiles[Sports.football] = [];
      }

      foundFiles[Sports.football].push(file);
    }
    if (configJson.outputParams && !configJson.outputParams.homeFullTimeOdd) {
      if (!foundFiles[Sports.basketball]) {
        foundFiles[Sports.basketball] = [];
      }

      foundFiles[Sports.basketball].push(file);
    }
  }

  const foundConfigFiles = foundFiles[sport];
  if (!foundConfigFiles || foundConfigFiles.length === 0) {
    logger.warn(
      `Parameter file not found for sport ${sport}, loaded the default config\n${JSON.stringify(
        DEFAULT_CONFIGS[sport]
      )}`
    );

    Config.config = DEFAULT_CONFIGS[sport];
  } else {
    const chosenFile = await select({
      message: "Select config file",
      choices: foundConfigFiles.map((file) => {
        return {
          value: file,
          name: file,
        };
      }),
    });

    try {
      const ConfigParams = require(path.join(process.cwd(), `./${chosenFile}`));
      Config.config = ConfigParams;
    } catch (error) {
      logger.error(
        `File ${chosenFile} not found! Please put on same folder as the executable and try again`
      );
      process.exit(1);
    }
  }
}

(async () => {
  let fromDate: string;
  let toDate: string;

  const sport = (await select({
    message: "Choose sport",
    choices: Object.keys(Sports).map((sport) => {
      return {
        value: sport,
        name: sport,
      };
    }),
  })) as Sports;

  const scraperMethod = await select({
    message: "Choose scraper method",
    choices: [
      {
        value: "legacy",
        name: "Legacy Scraper (Original HTTP-based)",
      },
      {
        value: "modern",
        name: "Modern Scraper (Anti-Detection with Puppeteer) - Recommended",
      },
    ],
  });

  await loadConfig(sport);

  if (Config.config.fromDate && Config.config.toDate) {
    fromDate = Config.config.fromDate;
    toDate = Config.config.toDate;
  } else {
    const { fromDatePrompt, toDatePrompt } = await inquirer.prompt([
      { validate: validateDate, message: "Scrape From: (yyyy-MM-dd)", name: "fromDatePrompt" },
      { validate: validateDate, message: "Scrape To: (yyyy-MM-dd)", name: "toDatePrompt" },
    ]);
    fromDate = fromDatePrompt;
    toDate = toDatePrompt;
  }

  if (fromDate > toDate) {
    logger.error("fromDate can't be after toDate", {
      fromDate,
      toDate,
    });
    process.exit(1);
  }

  const dateRange = dateRangeToArray(fromDate, toDate);
  let rows: IRow[] = [];

  logger.info(`🚀 Using ${scraperMethod} scraper for ${sport} data`);

  // Use date-by-date scraping approach
  await fallbackDateByDateScraping();

  async function fallbackDateByDateScraping() {
    for (const date of dateRange) {
      try {
        logger.info(`⛏️ Scrapping ${sport} ${date}`);

        let results: IEventJoinedData[];

        if (scraperMethod === "modern") {
          // Use modern anti-detection scraper
          const modernScraper = new ModernSofaScoreScraper({
            sport,
            date,
            maxRetries: 3,
            useProxy: true,
            enableStealth: true,
            behaviorProfile: "human",
          });

          try {
            results = await modernScraper.scrapeData();

            // Log modern scraper stats
            const stats = modernScraper.getStats();
            logger.info(
              `📊 Modern scraper stats: health=${stats.sessionHealth}%, requests=${stats.requestCount}`
            );

            await modernScraper.cleanup();
          } catch (modernError) {
            logger.warn("Modern scraper failed, falling back to legacy method", { modernError });
            // Fallback to legacy scraper
            const scrapper = new SofascoreScrapper({ sport, date });
            results = await scrapper.fetchData();
          }
        } else {
          // Use legacy scraper
          const scrapper = new SofascoreScrapper({ sport, date });
          results = await scrapper.fetchData();
        }

        const formatter = new SofascoreResultsFormatter({ sport, results });
        const rawRows = formatter.createRows();
        const filteredRows = formatter.filterRows(rawRows);
        rows.push(...filteredRows);

        // Add delay between different dates to avoid rate limiting
        if (dateRange.indexOf(date) < dateRange.length - 1) {
          const delayTime = scraperMethod === "modern" ? [3000, 8000] : [2000, 5000];
          await randomWait(delayTime[0], delayTime[1]);
        }
      } catch (error) {
        logger.error(`⛏️ Error scrapping ${date}`, { error });
        // Don't send to telegram if it's a network timeout or 403 error
        const errorMessage = error instanceof Error ? error.message : String(error);
        if (!errorMessage.includes("ETIMEDOUT") && !errorMessage.includes("403")) {
          try {
            const errorObject = objectifyErrorObject(error as Error);
            await TelegramBot.sendMessage(JSON.stringify(errorObject));
          } catch (telegramError) {
            logger.warn("Failed to send error to Telegram", { telegramError });
          }
        }
      }
    }
  }

  // Export data in both formats
  const outputFilename = `${sport}_${fromDate}_${toDate}`;

  console.log(`\n📊 Exporting ${rows.length} records...`);
  exportJSON.toExcel(rows, outputFilename);
  exportJSON.toCSV(rows, outputFilename);

  console.log(`\n✅ Export completed!`);
  console.log(`📁 Files created:`);
  console.log(`   • ${outputFilename}.xlsx (Excel format)`);
  console.log(`   • ${outputFilename}.csv (CSV format)`);
})();
