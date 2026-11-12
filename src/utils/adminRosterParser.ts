/**
 * Admin-only helper to parse a pasted list of player names (e.g. from a message)
 * into up to 10 clean player names for the manual 10-player registration form.
 */
export function parseAdminPlayerList(rawText: string): string[] {
  const lines = rawText
    .split(/\r?\n|,|;/)
    .map((line) =>
      line
        .replace(/^\s*\d+[\.\)\-\s:]*/, '') // strip leading numbering e.g. "1. ", "2) "
        .replace(/\(.*?\)/g, '') // strip parenthetical notes
        .trim()
    )
    .filter((line) => line.length >= 2);

  return lines.slice(0, 10);
}
