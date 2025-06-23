export enum Sports {
  football = "football",
  basketball = "basketball",
}

export interface ScheduledEventsResponse {
  events: {
    id: number;
    coverage: number;
    customId: string;
    finalResultOnly: boolean;
    hasGlobalHighlights: boolean;
    slug: string;
    winnerCode: number;
    startTimestamp: number;
    homeScore: {
      current: number;
      display: number;
      normaltime: number;
      period1: number;
      period2: number;
    };
    awayScore: {
      current: number;
      display: number;
      normaltime: number;
      period1: number;
      period2: number;
    };
    time: {
      currentPeriodStartTimestamp: number;
      injuryTime1: number;
      injuryTime2: number;
    };
    roundInfo: {
      round: number;
    };
    /** in milliseconds */
    status: {
      code: number;
      description: string;
      type: "finished" | "postponed" | "canceled" | "abandoned";
    };
    changes: {
      changeTimestamp: number;
    };
    tournament: {
      id: number;
      priority: number;
      name: string;
      slug: string;
      category: {
        id: number;
        name: string;
        slug: string;
        sport: {
          id: number;
          name: string;
          slug: string;
        };
        flag: string;
      };
      uniqueTournament: {};
    };
    awayTeam: {
      id: number;
      name: string;
      shortName: string;
      slug: string;
      sport: {
        id: string;
        name: string;
        slug: string;
      };
      subTeams: [];
      teamColors: {
        primary: string;
        secondary: string;
        text: string;
      };
      type: number;
      userCount: number;
    };
    homeTeam: {
      id: number;
      name: string;
      shortName: string;
      slug: string;
      sport: {
        id: string;
        name: string;
        slug: string;
      };
      subTeams: [];
      teamColors: {
        primary: string;
        secondary: string;
        text: string;
      };
      type: number;
      userCount: number;
    };
  }[];
}

export interface EventsOddsResponse {
  odds: {
    [eventId: number]: {
      id: number;
      fid: number;
      sourceId: number;
      isLive: boolean;
      marketId: number;
      marketName: string;
      structureType: number;
      suspended: boolean;
      choices: {
        sourceId: number;
        name: string;
        change: number;
        fractionalValue: string;
        initialFractionalValue: string;
      }[];
    };
  };
}

export interface EventsMarketsOddsResponse {
  eventId: number;
  markets: {
    id: number;
    fid: number;
    sourceId: number;
    isLive: boolean;
    marketId: number;
    marketName: string;
    structureType: number;
    suspended: boolean;
    choices: {
      sourceId: number;
      name: string;
      change: number;
      fractionalValue: string;
      initialFractionalValue: string;
    }[];
  }[];
}

export interface EventWinningOddsResponse {
  home?: {
    id: number;
    fractionalValue: string;
    expected: number;
    actual: number;
  };
  away?: {
    id: number;
    fractionalValue: string;
    expected: number;
    actual: number;
  };
}

export interface EventPregameFormResponse {
  homeTeam: {
    avgRating: string;
    form: ("L" | "D" | "W")[];
    position: number;
    /** Pts field from the form */
    value: string;
  };
  awayTeam: {
    avgRating: string;
    form: ("L" | "D" | "W")[];
    position: number;
    /** Pts field from the form */
    value: string;
  };
  label: string;
}

export interface EventVotesResponse {
  vote: {
    vote1: number;
    vote2: number;
    voteX: number;
  };
}

export interface EventStandingsResponse {
  standings: {
    descriptions: unknown[];
    id: number;
    name: string;
    rows: {
      descriptions: unknown[];
      draws: number;
      id: number;
      losses: number;
      matches: number;
      points: number;
      position: number;
      promotion: {
        text: string;
        id: number;
      };
      scoresAgainst: number;
      scoresFor: number;
      team: {
        id: number;
        name: string;
        slug: string;
        shortName: string;
        gender: string;
        nameCode: string;
        national: boolean;
        sport: {
          name: string;
          slug: string;
          id: number;
        };
        teamColors: {
          primary: string;
          secondary: string;
          text: string;
        };
        type: number;
        userCount: number;
        wins: number;
      };
    }[];
    tieBreakingRule: {
      id: number;
      text: string;
    };
    tournament: {
      id: number;
      priority: number;
      name: string;
      slug: string;
      category: {
        id: number;
        name: string;
        slug: string;
        sport: {
          id: number;
          name: string;
          slug: string;
        };
        flag: string;
      };
      uniqueTournament: {};
    };
    type: string;
    updatedAtTimestamp: number;
  }[];
}

export interface EventSpecificResponse {
  event: {
    id: number;
    season: {
      name: string;
      year: string;
      id: number;
    };
  };
}

export interface IEventJoinedData {
  event: ScheduledEventsResponse["events"][0];
  markets?: EventsMarketsOddsResponse;
  winningOdds?: EventWinningOddsResponse;
  pregameForm?: EventPregameFormResponse;
  votes?: EventVotesResponse;
  standings?: {
    total: EventStandingsResponse;
    home: EventStandingsResponse;
    away: EventStandingsResponse;
  };
  goalIncidents?: IEventGoalIncident;
}

export interface EventIncidentResponse {
  incidents: {
    incidentType: string;
  }[];
}

export interface IEventGoalIncident {
  awayScore: number;
  from: "penalty";
  homeScore: number;
  id: number;
  incidentClass: "penalty";
  incidentType: "goal";
  isHome: boolean;
  player: object;
  reversedPeriodTime: string;
  time: 35;
}
