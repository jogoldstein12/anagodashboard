import { readFileSync } from "fs";
import { NextResponse } from "next/server";

const CSV_PATH =
  "/Users/anago/.openclaw/workspace/projects/elo-predictor/sports/tennis/data/elo_current.csv";

interface EloPlayer {
  player_name: string;
  overall_elo: number;
  grass_elo: number;
  hard_elo: number;
  clay_elo: number;
  total_matches: number;
  grass_matches: number;
  last_updated: string;
}

export async function GET() {
  try {
    const raw = readFileSync(CSV_PATH, "utf8");
    const lines = raw.trim().split("\n");
    const headers = lines[0].split(",");

    const idx = (name: string) => headers.indexOf(name);

    const players: EloPlayer[] = lines.slice(1).map((line) => {
      const cols = line.split(",");
      return {
        player_name: cols[idx("player_name")],
        overall_elo: parseFloat(cols[idx("overall_elo")]),
        grass_elo: parseFloat(cols[idx("grass_elo")]),
        hard_elo: parseFloat(cols[idx("hard_elo")]),
        clay_elo: parseFloat(cols[idx("clay_elo")]),
        total_matches: parseInt(cols[idx("total_matches")]),
        grass_matches: parseInt(cols[idx("grass_matches")]),
        last_updated: cols[idx("last_updated")],
      };
    });

    players.sort((a, b) => b.grass_elo - a.grass_elo);

    return NextResponse.json({ players });
  } catch (e: unknown) {
    const message = e instanceof Error ? e.message : "Unknown error";
    return NextResponse.json(
      { players: [], error: `Could not load ELO data: ${message}` },
      { status: 200 }
    );
  }
}
