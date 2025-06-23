export type IRow = IBasketballRow | IFootballRow;

export interface IFootballRow {
  /** DD-MM-YYYY */
  date: string;
  /** 24h format */
  time: string;
  league: string;
  round: number;
  /** Home team name */
  home: string;
  homeFullTimeOdd?: number;
  homeExpectedWinningPercentage?: number;
  homeActualWinningPercentage?: number;
  homePregameFormLast5?: number;
  homePregameFormLast4?: number;
  homeVoteWinPercentage?: number;
  homePregameFormPoints?: number;
  /** Away team name */
  away: string;
  awayFullTimeOdd?: number;
  awayExpectedWinningPercentage?: number;
  awayActualWinningPercentage?: number;
  awayPregameFormLast5?: number;
  awayPregameFormLast4?: number;
  homeHandicap?: number;
  homeHandicapOdd?: number;
  result?: string;
  homeTeamPlayedGames?: number;
  homeTeamPoints?: number;
  awayTeamPlayedGames?: number;
  awayTeamPoints?: number;
  "HT_Played@H"?: number;
  "HT_Points@H"?: number;
  "AT_Played@A"?: number;
  "AT_Points@A"?: number;
  goalIncidents?: object;
}

export interface IBasketballRow {
  /** DD-MM-YYYY */
  date: string;
  /** 24h format */
  time: string;
  league: string;
  game: string;
  homeOdd?: number;
  awayOdd?: number;
  homePregameFormLast5?: number;
  homeWins: number;
  homeLoses: number;
  awayPregameFormLast5?: number;
  awayWins: number;
  awayLoses: number;
  result?: string;
}

export enum MatchResultScore {
  "W" = 20,
  "D" = 7,
  "L" = 0,
}
