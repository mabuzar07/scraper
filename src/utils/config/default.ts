import { Sports } from "services/scrapper/types";
import { BasketballConfigInterface, ConfigInterface, FootballConfigInterface } from "./types";

export const DEFAULT_FOOTBALL_CONFIG: FootballConfigInterface = {
  configParams: {
    proxy: "",
  },
  outputParams: {
    homeFullTimeOdd: {
      from: -1,
      to: 999,
    },
    awayFullTimeOdd: {
      from: -1,
      to: 999,
    },
    homeExpectedWinningPercentage: {
      from: -1,
      to: 999,
    },
    homeActualWinningPercentage: {
      from: -1,
      to: 999,
    },
    awayExpectedWinningPercentage: {
      from: -1,
      to: 999,
    },
    awayActualWinningPercentage: {
      from: -1,
      to: 999,
    },

    homePregameFormLast5: [],
    homePregameFormLast4: [],
    awayPregameFormLast5: [],
    awayPregameFormLast4: [],
    homeHandicap: {
      from: -1,
      to: 999,
    },
    homeHandicapOdd: {
      from: -1,
      to: 999,
    },
  },
};

export const DEFAULT_BASKETBALL_CONFIG: BasketballConfigInterface = {
  configParams: {
    proxy: "",
  },
  outputParams: {
    homeOdd: {
      from: -1,
      to: 999,
    },
    awayOdd: {
      from: -1,
      to: 999,
    },
    homePregameFormLast5: [],
    homeWins: [],
    homeLoses: [],
    awayPregameFormLast5: [],
    awayWins: [],
    awayLoses: [],
  },
};

export const DEFAULT_CONFIGS: Record<Sports, ConfigInterface> = {
  basketball: DEFAULT_BASKETBALL_CONFIG,
  football: DEFAULT_FOOTBALL_CONFIG,
};
