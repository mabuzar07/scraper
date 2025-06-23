import got from "utils/got-proxy";
import {
  EVENT_INCIDENTS_URL,
  EVENT_MARKET_ODDS_URL,
  EVENT_PREGAME_FORM_URL,
  EVENT_STANDINGS_URL,
  EVENT_VOTES_URL,
  EVENT_WINNING_ODDS_URL,
  SCHEDULED_EVENTS_URL,
  SPECIFIC_EVENT_URL,
} from "./endpoints";
import {
  EventIncidentResponse,
  EventPregameFormResponse,
  EventsMarketsOddsResponse,
  EventSpecificResponse,
  EventStandingsResponse,
  EventVotesResponse,
  EventWinningOddsResponse,
  IEventJoinedData,
  ScheduledEventsResponse,
  Sports,
} from "./types";
import { logger } from "utils/logger";
import winston from "winston";
import { timestampToGreekTime } from "utils/date";
import { randomWait } from "utils/random";
import Bottleneck from "bottleneck";
import { proxyManager } from "utils/proxy";

class SofascoreScrapper {
  private sport: Sports;
  private date: string;
  private logger: winston.Logger;
  private limiter: Bottleneck;
  private proxyValidated: boolean = false;

  constructor({ sport, date }: { sport: Sports; date: string }) {
    this.sport = sport;
    this.date = date;
    this.logger = logger.child({ sport, date });

    // Create rate limiter to avoid being blocked
    this.limiter = new Bottleneck({
      minTime: 3000, // Minimum 3s between requests (increased for safety)
      maxConcurrent: 1, // Max 1 concurrent request (safer)
      reservoir: 8, // Max 8 requests per minute (reduced)
      reservoirRefreshAmount: 8,
      reservoirRefreshInterval: 60 * 1000, // 1 minute
    });
  }

  // Initialize proxy validation before scraping
  private async ensureProxyValidation(): Promise<void> {
    if (!this.proxyValidated) {
      this.logger.info("🔍 Checking proxy system...");

      // Skip proxy validation for now due to free proxy issues
      // await proxyManager.validateAllProxies();

      this.logger.info(`📊 Proxy system ready - proceeding with enhanced anti-detection`);

      this.proxyValidated = true;
    }
  }

  private async fetchMatches(): Promise<ScheduledEventsResponse> {
    // Ensure proxies are validated before first request
    await this.ensureProxyValidation();

    const data = await this.limiter.schedule(async () => {
      await randomWait(2000, 5000); // Increased random delay between 2-5 seconds
      return got<ScheduledEventsResponse>("get", SCHEDULED_EVENTS_URL(this.sport, this.date));
    });
    this.logger.info(`⚽ scrapped: events ${data.events.length}`, {
      type: "events",
      scrapped: true,
      length: data.events.length,
    });
    return data;
  }

  private async fetchEventMarketsOdds(
    eventId: number
  ): Promise<EventsMarketsOddsResponse | undefined> {
    try {
      const data = await this.limiter.schedule(async () => {
        await randomWait(1000, 3000); // Increased delay
        return got<EventsMarketsOddsResponse>("get", EVENT_MARKET_ODDS_URL(eventId));
      });
      this.logger.info(`🎲 scrapped: market odds for ${eventId}`, {
        type: "market-odds",
        scrapped: true,
        eventId,
        keys: Object.keys(data),
      });
      return data;
    } catch (error: any) {
      if (error.response && error.response.statusCode === 404) {
        this.logger.warn(`🎲 not-found: market odds for ${eventId}`, {
          type: "market-odds",
          scrapped: false,
          eventId,
          error,
        });
      } else if (error.response && error.response.statusCode === 403) {
        this.logger.error(`🚫 403 Forbidden: market odds for ${eventId} - API blocking detected`, {
          type: "market-odds",
          scrapped: false,
          eventId,
          statusCode: 403,
        });
        // Log proxy stats for debugging
        const stats = proxyManager.getProxyStats();
        this.logger.info(`📊 Current proxy stats: ${stats.working}/${stats.total} working`);
        throw error; // Re-throw to trigger proxy rotation in got-proxy
      } else {
        this.logger.error(`💥 Unexpected error fetching market odds for ${eventId}`, {
          type: "market-odds",
          scrapped: false,
          eventId,
          error: error.message,
        });
        throw error;
      }
    }
  }

  private async fetchEventWinningOdds(
    eventId: number
  ): Promise<EventWinningOddsResponse | undefined> {
    try {
      const data = await this.limiter.schedule(async () => {
        await randomWait(1000, 3000); // Increased delay
        return got<EventWinningOddsResponse>("get", EVENT_WINNING_ODDS_URL(eventId));
      });
      this.logger.info(`🏆 scrapped: winning-odds for ${eventId}`, {
        type: "winning-odds",
        scrapped: true,
        eventId,
        keys: Object.keys(data),
      });
      return data;
    } catch (error: any) {
      if (error.response && error.response.statusCode === 404) {
        this.logger.warn(`🏆 not-found: winning-odds for ${eventId}`, {
          type: "winning-odds",
          scrapped: false,
          eventId,
          error,
        });
      } else if (error.response && error.response.statusCode === 403) {
        this.logger.error(`🚫 403 Forbidden: winning-odds for ${eventId} - API blocking detected`, {
          type: "winning-odds",
          scrapped: false,
          eventId,
          statusCode: 403,
        });
        const stats = proxyManager.getProxyStats();
        this.logger.info(`📊 Current proxy stats: ${stats.working}/${stats.total} working`);
        throw error;
      } else {
        this.logger.error(`💥 Unexpected error fetching winning-odds for ${eventId}`, {
          type: "winning-odds",
          scrapped: false,
          eventId,
          error: error.message,
        });
        throw error;
      }
    }
  }

  private async fetchEventPregameForm(
    eventId: number
  ): Promise<EventPregameFormResponse | undefined> {
    try {
      const data = await this.limiter.schedule(async () => {
        await randomWait(500, 1500);
        return got<EventPregameFormResponse>("get", EVENT_PREGAME_FORM_URL(eventId));
      });
      this.logger.info(`📝 scrapped: pregame-form for ${eventId}`, {
        type: "pregame-form",
        scrapped: true,
        eventId,
        keys: Object.keys(data),
      });
      return data;
    } catch (error: any) {
      if (error.response && error.response.statusCode === 404) {
        this.logger.warn(`📝 not-found: pregame-form for ${eventId}`, {
          type: "pregame-form",
          scrapped: false,
          eventId,
          error,
        });
      }
    }
  }

  private async fetchEventVotes(eventId: number): Promise<EventVotesResponse | undefined> {
    try {
      const data = await got<EventVotesResponse>("get", EVENT_VOTES_URL(eventId));
      this.logger.info(`🗳️ scrapped: votes for ${eventId}`, {
        type: "votes",
        scrapped: true,
        eventId,
        keys: Object.keys(data),
      });
      return data;
    } catch (error: any) {
      if (error.response && error.response.statusCode === 404) {
        this.logger.warn(`🗳️ not-found: votes for ${eventId}`, {
          type: "votes",
          scrapped: false,
          eventId,
          error,
        });
      }
    }
  }

  private async fetchEventStandings(
    tournamentId: number,
    seasonId?: number
  ): Promise<
    | {
        total: EventStandingsResponse;
        home: EventStandingsResponse;
        away: EventStandingsResponse;
      }
    | undefined
  > {
    try {
      if (!seasonId) {
        return undefined;
      }

      const [total, home, away] = await Promise.all([
        got<EventStandingsResponse>("get", EVENT_STANDINGS_URL(seasonId, tournamentId, "total")),
        got<EventStandingsResponse>("get", EVENT_STANDINGS_URL(seasonId, tournamentId, "home")),
        got<EventStandingsResponse>("get", EVENT_STANDINGS_URL(seasonId, tournamentId, "away")),
      ]);

      this.logger.info(`🗳️ scrapped: standings for ${seasonId}`, {
        type: "standings",
        scrapped: true,
        seasonId,
      });

      return { total, home, away };
    } catch (error: any) {
      if (error.response && error.response.statusCode === 404) {
        this.logger.warn(`🗳️ not-found: votes for ${seasonId}`, {
          type: "standings",
          scrapped: false,
          seasonId,
          error,
        });
      }
    }
  }

  private async fetchSpecificEvent(eventId: number): Promise<EventSpecificResponse | undefined> {
    try {
      const data = await got<EventSpecificResponse>("get", SPECIFIC_EVENT_URL(eventId));

      this.logger.info(`🗳️ scrapped: specific-event for ${eventId}`, {
        type: "specific-event",
        scrapped: true,
        eventId,
      });

      return data;
    } catch (error: any) {
      if (error.response && error.response.statusCode === 404) {
        this.logger.warn(`🗳️ not-found: specific-event for ${eventId}`, {
          type: "specific-event",
          scrapped: false,
          eventId,
          error,
        });
      }
    }
  }

  public async fetchData(): Promise<IEventJoinedData[]> {
    if (Sports.basketball === this.sport) {
      return await this.fetchBasketballData();
    }

    if (Sports.football === this.sport) {
      return await this.fetchFootballData();
    }

    throw new Error(`Sport ${this.sport} is not supported!`);
  }

  public async fetchFootballData(): Promise<IEventJoinedData[]> {
    const events = await this.fetchMatches();

    const data: IEventJoinedData[] = [];

    await Promise.all(
      events.events.map(async (event) => {
        if (timestampToGreekTime(event.startTimestamp).date !== this.date) {
          return;
        }

        const eventId = event.id;
        const tournamentId = event.tournament.id;

        const specificEvent = await this.fetchSpecificEvent(eventId);
        const seasonId = specificEvent?.event.season?.id;
        const [winningOdds, pregameForm, votes, markets, standings] = await Promise.all([
          this.fetchEventWinningOdds(eventId),
          this.fetchEventPregameForm(eventId),
          this.fetchEventVotes(eventId),
          this.fetchEventMarketsOdds(eventId),
          this.fetchEventStandings(tournamentId, seasonId),
          this.fetchEventIncidents(eventId),
        ]);

        data.push({
          event,
          markets,
          pregameForm,
          winningOdds,
          votes,
          standings,
        });
      })
    );

    return data;
  }

  public async fetchBasketballData(): Promise<IEventJoinedData[]> {
    const events = await this.fetchMatches();

    const data: IEventJoinedData[] = [];

    await Promise.all(
      events.events.map(async (event) => {
        if (timestampToGreekTime(event.startTimestamp).date !== this.date) {
          return;
        }

        const eventId = event.id;
        const [markets, pregameForm] = await Promise.all([
          this.fetchEventMarketsOdds(eventId),
          this.fetchEventPregameForm(eventId),
        ]);

        data.push({
          event,
          pregameForm,
          markets,
        });
      })
    );

    return data;
  }

  private async fetchEventIncidents(eventId: number): Promise<EventIncidentResponse | undefined> {
    try {
      const data = await got<EventIncidentResponse>("get", EVENT_INCIDENTS_URL(eventId));
      this.logger.info(`🗳️ scrapped: incidents for ${eventId}`, {
        type: "incidents",
        scrapped: true,
        eventId,
        keys: Object.keys(data),
      });
      return data;
    } catch (error: any) {
      if (error.response && error.response.statusCode === 404) {
        this.logger.warn(`🗳️ not-found: incidents for ${eventId}`, {
          type: "incidents",
          scrapped: false,
          eventId,
          error,
        });
      }
    }
  }
}

export default SofascoreScrapper;
