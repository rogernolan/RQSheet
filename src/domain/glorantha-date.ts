export const GLORANTHAN_DAYS = [
  "Freezeday",
  "Waterday",
  "Clayday",
  "Windsday",
  "Fireday",
  "Wildday",
  "Godsday",
] as const;

export const GLORANTHAN_SEASONS = [
  "Sea Season",
  "Fire Season",
  "Earth Season",
  "Dark Season",
  "Storm Season",
  "Sacred Time",
] as const;

export const GLORANTHAN_WEEKS = [
  "Disorder Week",
  "Harmony Week",
  "Death Week",
  "Fertility Week",
  "Stasis Week",
  "Movement Week",
  "Illusion Week",
  "Truth Week",
] as const;

export const GLORANTHAN_SACRED_TIME_WEEKS = [
  "Luck Week",
  "Fate Week",
] as const;

export type GloranthanDay = (typeof GLORANTHAN_DAYS)[number];
export type GloranthanSeason = (typeof GLORANTHAN_SEASONS)[number];
export type GloranthanWeek =
  | (typeof GLORANTHAN_WEEKS)[number]
  | (typeof GLORANTHAN_SACRED_TIME_WEEKS)[number];

export interface GloranthanDateParts {
  day: string;
  week: string;
  season: string;
  year: string;
}

export function getWeeksForSeason(season: string): readonly string[] {
  return season === "Sacred Time"
    ? GLORANTHAN_SACRED_TIME_WEEKS
    : GLORANTHAN_WEEKS;
}

export function parseGloranthanDate(value: string): GloranthanDateParts | null {
  const trimmed = value.trim();
  if (trimmed.length === 0) {
    return null;
  }

  const parts = trimmed.split(",").map((part) => part.trim());
  if (parts.length < 4) {
    return null;
  }

  const [day, week, season, year] = parts;

  if (
    GLORANTHAN_DAYS.includes(day as GloranthanDay) === false ||
    GLORANTHAN_SEASONS.includes(season as GloranthanSeason) === false ||
    getWeeksForSeason(season).includes(week) === false
  ) {
    return null;
  }

  return { day, week, season, year };
}

export function formatGloranthanDate(parts: GloranthanDateParts): string {
  return `${parts.day}, ${parts.week}, ${parts.season}, ${parts.year}`;
}
