export type ConfigInterface = FootballConfigInterface | BasketballConfigInterface;

export interface FootballConfigInterface {
  /** YYYY-MM-DD */
  fromDate?: string;
  /** YYYY-MM-DD */
  toDate?: string;
  configParams: {
    proxy: string;
  };
  outputParams: {
    homeFullTimeOdd: {
      from: number;
      to: number;
    };
    awayFullTimeOdd: {
      from: number;
      to: number;
    };
    homeExpectedWinningPercentage: {
      from: number;
      to: number;
    };
    homeActualWinningPercentage: {
      from: number;
      to: number;
    };
    awayExpectedWinningPercentage: {
      from: number;
      to: number;
    };
    awayActualWinningPercentage: {
      from: number;
      to: number;
    };

    homePregameFormLast5: number[];
    homePregameFormLast4: number[];
    awayPregameFormLast5: number[];
    awayPregameFormLast4: number[];
    homeHandicap: {
      from: number;
      to: number;
    };
    homeHandicapOdd: {
      from: number;
      to: number;
    };
  };
}

export interface BasketballConfigInterface {
  /** YYYY-MM-DD */
  fromDate?: string;
  /** YYYY-MM-DD */
  toDate?: string;
  configParams: {
    proxy: string;
  };
  outputParams: {
    homeOdd: {
      from: number;
      to: number;
    };
    awayOdd: {
      from: number;
      to: number;
    };
    homePregameFormLast5: number[];
    homeWins: number[];
    homeLoses: number[];
    awayPregameFormLast5: number[];
    awayWins: number[];
    awayLoses: number[];
  };
}
