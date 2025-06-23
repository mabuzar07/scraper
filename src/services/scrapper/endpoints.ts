const BASE = "https://api.sofascore.com/api/v1";

/** Gets all the events for the given day */
export const SCHEDULED_EVENTS_URL = (sport: string, date: string) =>
  `${BASE}/sport/${sport}/scheduled-events/${date}`;
/** Gets specific event */
export const SPECIFIC_EVENT_URL = (eventId: number) => `${BASE}/event/${eventId}`;
/** Get all the events odds for the given day */
export const EVENTS_ODDS_URL = (sport: string, date: string) =>
  `${BASE}/sport/${sport}/odds/1/${date}`;
/** Get event's winning-odds  */
export const EVENT_WINNING_ODDS_URL = (event: number) =>
  `${BASE}/event/${event}/provider/1/winning-odds`;
/** Get event's markets  */
export const EVENT_MARKET_ODDS_URL = (event: number) => `${BASE}/event/${event}/odds/1/all`;
/** Get event's pregame-form  */
export const EVENT_PREGAME_FORM_URL = (event: number) => `${BASE}/event/${event}/pregame-form`;
/** Get event's votes  */
export const EVENT_VOTES_URL = (event: number) => `${BASE}/event/${event}/votes`;
/** Get tournament event's standings  */
export const EVENT_STANDINGS_URL = (
  seasonId: number,
  tournamentId: number,
  type: "total" | "home" | "away"
) => `${BASE}/tournament/${tournamentId}/season/${seasonId}/standings/${type}`;

/** Get event's incidents */
export const EVENT_INCIDENTS_URL = (event: number) => `${BASE}/event/${event}/incidents`;
