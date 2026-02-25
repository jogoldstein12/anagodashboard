import { execSync } from "child_process";
import { NextResponse } from "next/server";

const KB_CLI = "/Users/anago/.openclaw/workspace/projects/knowledge-base/cli.py";

export async function POST(req: Request) {
  try {
    const { question } = await req.json();
    
    const cmd = `python3 ${KB_CLI} ask --json "${question.replace(/"/g, '\\"')}"`;
    
    const output = execSync(cmd, { encoding: "utf8", timeout: 30000 });
    const result = JSON.parse(output);
    return NextResponse.json({ ok: true, ...result });
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: e.message }, { status: 500 });
  }
}
