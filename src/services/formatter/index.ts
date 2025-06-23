import _ from "lodash";
import { Sports, type IEventJoinedData } from "../scrapper/types";
import { timestampToGreekTime } from "../../utils/date";
import { fractionToRoundedDecimal } from "../../utils/math";
import { fractionalToDecimal } from "../../utils/odds-formatter";
import { type IRow } from "./types";
import Config from "../../utils/config";
import { logger } from "../../utils/logger";

class SofascoreResultsFormatter {
  sport: Sports;
  results: IEventJoinedData[];

  constructor({ sport, results }: { sport: Sports; results: IEventJoinedData[] }) {
    this.sport = sport;
    this.results = results;
  }

  createRows(): IRow[] {
    const rows: IRow[] = [];

    for (const result of this.results) {
      if (Sports.football === this.sport) {
        const { event, markets, pregameForm, standings } = result;

        if (["postponed", "canceled", "abandoned"].includes(event.status.type)) {
          continue;
        }

        const { date, time } = timestampToGreekTime(event.startTimestamp);

        const eventFulltimeOdds: any = {};

        const fullTimeOdds = markets?.markets.find((market) => market.marketName === "Full time");

        if (fullTimeOdds) {
          const home = fullTimeOdds.choices.find((choice) => choice.name === "1");
          const away = fullTimeOdds.choices.find((choice) => choice.name === "2");

          if (home?.fractionalValue) {
            const homeDecimal = fractionToRoundedDecimal(home.fractionalValue);
            if (homeDecimal !== undefined) {
              eventFulltimeOdds.home = homeDecimal + 1;
            }
          }

          if (away?.fractionalValue) {
            const awayDecimal = fractionToRoundedDecimal(away.fractionalValue);
            if (awayDecimal !== undefined) {
              eventFulltimeOdds.away = awayDecimal + 1;
            }
          }
        }

        const homeHandicapOdd: any = {};

        const handicapOdds = markets?.markets.find(
          (market) => market.marketName === "Asian handicap"
        );

        if (handicapOdds) {
          const home = handicapOdds.choices.find(
            (choice) =>
              choice.name.includes(event.homeTeam.name) ||
              choice.name.includes(event.homeTeam.shortName)
          );

          if (home?.name) {
            const handicapMatch = home.name.split(" ")[0].match(/[0-9\.-]+/);
            if (handicapMatch) {
              homeHandicapOdd.handicap = +handicapMatch[0];
            }
          }

          if (home?.fractionalValue) {
            const handicapDecimal = fractionToRoundedDecimal(home.fractionalValue);
            if (handicapDecimal !== undefined) {
              homeHandicapOdd.odd = handicapDecimal + 1;
            }
          }
        }

        let overallHomeTeam: any;
        let overallAwayTeam: any;
        let homeHomeTeam: any;
        let awayAwayTeam: any;

        if (standings) {
          overallHomeTeam = standings.total.standings[0].rows.find(
            (row) => row.team.id === event.homeTeam.id
          );
          overallAwayTeam = standings.total.standings[0].rows.find(
            (row) => row.team.id === event.awayTeam.id
          );

          homeHomeTeam = standings.home?.standings[0].rows.find(
            (row) => row.team.id === event.homeTeam.id
          );
          awayAwayTeam = standings.away?.standings[0].rows.find(
            (row) => row.team.id === event.awayTeam.id
          );
        }

        rows.push({
          date,
          time,
          league: `${event.tournament.category.name} ${event.tournament.name}`,
          round: 0, // Default round for now
          home: event.homeTeam.shortName,
          away: event.awayTeam.shortName,
          homeFullTimeOdd: eventFulltimeOdds.home,
          awayFullTimeOdd: eventFulltimeOdds.away,
          homeHandicap: homeHandicapOdd.handicap,
          homeHandicapOdd: homeHandicapOdd.odd,
          homePregameFormLast5: pregameForm?.homeTeam.form
            ? _.countBy(pregameForm.homeTeam.form)["W"] || 0
            : 0,
          awayPregameFormLast5: pregameForm?.awayTeam.form
            ? _.countBy(pregameForm.awayTeam.form)["W"] || 0
            : 0,
          result:
            event.status.type === "finished" &&
            event.homeScore?.current !== undefined &&
            event.awayScore?.current !== undefined
              ? `${event.homeScore.current}-${event.awayScore.current}`
              : undefined,
          homeTeamPlayedGames: overallHomeTeam?.matches,
          homeTeamPoints: overallHomeTeam?.points,
          awayTeamPlayedGames: overallAwayTeam?.matches,
          awayTeamPoints: overallAwayTeam?.points,
          "HT_Played@H": homeHomeTeam?.matches,
          "HT_Points@H": homeHomeTeam?.points,
          "AT_Played@A": awayAwayTeam?.matches,
          "AT_Points@A": awayAwayTeam?.points,
        });
      } else if (Sports.basketball === this.sport) {
        try {
          const { event, markets, pregameForm } = result;
          if (["postponed", "canceled", "abandoned"].includes(event.status.type)) {
            continue;
          }

          const { date, time } = timestampToGreekTime(event.startTimestamp);

          let homeWins = 0;
          let homeLoses = 0;
          let awayWins = 0;
          let awayLoses = 0;

          if (pregameForm?.homeTeam?.value && typeof pregameForm.homeTeam.value === "string") {
            const homeRecord = pregameForm.homeTeam.value.split("-");
            if (homeRecord.length >= 2) {
              homeWins = parseInt(homeRecord[0]) || 0;
              homeLoses = parseInt(homeRecord[1]) || 0;
            }
          }

          if (pregameForm?.awayTeam?.value && typeof pregameForm.awayTeam.value === "string") {
            const awayRecord = pregameForm.awayTeam.value.split("-");
            if (awayRecord.length >= 2) {
              awayWins = parseInt(awayRecord[0]) || 0;
              awayLoses = parseInt(awayRecord[1]) || 0;
            }
          }

          const eventFulltimeOdds: any = {};

          if (markets?.markets && Array.isArray(markets.markets)) {
            const fullTimeOdds = markets.markets.find(
              (market) => market.marketName === "Full time"
            );

            if (fullTimeOdds && fullTimeOdds.choices && Array.isArray(fullTimeOdds.choices)) {
              const home = fullTimeOdds.choices.find((choice) => choice.name === "1");
              const away = fullTimeOdds.choices.find((choice) => choice.name === "2");

              if (home?.fractionalValue) {
                try {
                  const decimalOdds = fractionalToDecimal(home.fractionalValue);
                  if (decimalOdds !== undefined) {
                    eventFulltimeOdds.home = decimalOdds;
                  }
                } catch (e) {
                  // Silent fail for odds conversion errors
                }
              }

              if (away?.fractionalValue) {
                try {
                  const decimalOdds = fractionalToDecimal(away.fractionalValue);
                  if (decimalOdds !== undefined) {
                    eventFulltimeOdds.away = decimalOdds;
                  }
                } catch (e) {
                  // Silent fail for odds conversion errors
                }
              }
            }
          }

          const homeTeamName =
            event.homeTeam?.shortName ||
            event.homeTeam?.name ||
            event.homeTeam?.slug ||
            "Unknown Home";

          const awayTeamName =
            event.awayTeam?.shortName ||
            event.awayTeam?.name ||
            event.awayTeam?.slug ||
            "Unknown Away";

          const leagueName =
            event.tournament?.category?.name && event.tournament?.name
              ? `${event.tournament.category.name} ${event.tournament.name}`
              : event.tournament?.name || "Unknown League";

          rows.push({
            date,
            time,
            league: leagueName,
            game: `${homeTeamName} - ${awayTeamName}`,
            homeOdd: eventFulltimeOdds.home + 1,
            awayOdd: eventFulltimeOdds.away + 1,
            homePregameFormLast5: pregameForm?.homeTeam?.form
              ? _.countBy(pregameForm.homeTeam.form)["W"] || 0
              : 0,
            homeWins,
            homeLoses,
            awayPregameFormLast5: pregameForm?.awayTeam?.form
              ? _.countBy(pregameForm.awayTeam.form)["W"] || 0
              : 0,
            awayWins,
            awayLoses,
            result:
              event.status.type === "finished" &&
              event.homeScore?.current !== undefined &&
              event.awayScore?.current !== undefined
                ? `${event.homeScore.current}-${event.awayScore.current}`
                : undefined,
          });
        } catch (err) {
          console.error(`Error processing basketball event:`, err);
          console.error(`Event data:`, JSON.stringify(result.event, null, 2));
        }
      } else {
        throw new Error(`Sport ${this.sport} is not supported}!`);
      }
    }

    const sortedByDate = rows.sort((a, b) => {
      // For basketball rows, use the game field; for football, use home-away format
      let sortA: string;
      let sortB: string;

      if ("game" in a && "game" in b) {
        // Basketball rows
        const [home_a, away_a] = a.game.split(" - ");
        const [home_b, away_b] = b.game.split(" - ");
        sortA = `${a.date}:${a.time}:${home_a}:${away_a}`;
        sortB = `${b.date}:${b.time}:${home_b}:${away_b}`;
      } else if ("home" in a && "away" in a && "home" in b && "away" in b) {
        // Football rows
        sortA = `${a.date}:${a.time}:${a.home}:${a.away}`;
        sortB = `${b.date}:${b.time}:${b.home}:${b.away}`;
      } else {
        // Fallback
        sortA = `${a.date}:${a.time}`;
        sortB = `${b.date}:${b.time}`;
      }

      if (sortA < sortB) {
        return -1;
      }
      if (sortA > sortB) {
        return 1;
      }
      return 0;
    });

    return sortedByDate;
  }

  filterRows(rows: IRow[]): IRow[] {
    const newRows = rows.filter((row) => {
      const configKeys = Object.keys(Config.config.outputParams);

      for (const configKey of configKeys) {
        const configValue = (Config.config.outputParams as any)[configKey];

        if (Array.isArray(configValue)) {
          if (configValue.length === 0) {
            continue;
          }

          if (!configValue.includes((row as any)[configKey])) {
            return false;
          }
        } else if (
          configValue &&
          typeof configValue === "object" &&
          "from" in configValue &&
          "to" in configValue
        ) {
          if (configValue.from === -1 && configValue.to === 999) {
            continue;
          }

          const rowValue = (row as any)[configKey];
          if (typeof rowValue === "number") {
            if (!(rowValue >= configValue.from && rowValue <= configValue.to)) {
              return false;
            }
          }
        }
      }

      return true;
    });

    logger.info(`Filtered ${rows.length - newRows.length}, out of ${rows.length}`);

    return newRows;
  }
}

export default SofascoreResultsFormatter;
