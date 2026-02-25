import { execSync } from "child_process";
import { NextResponse } from "next/server";

const KB_CLI = "/Users/anago/.openclaw/workspace/projects/knowledge-base/cli.py";

export async function POST(req: Request) {
  try {
    const { topic, priority, method } = await req.json();
    
    const cmd = `python3 ${KB_CLI} research queue --topic "${topic.replace(/"/g, '\\"')}" --priority ${priority || 3} --method "${method || "deep_research"}"`;
    
    const output = execSync(cmd, { encoding: "utf8", timeout: 30000 });
    return NextResponse.json({ ok: true, output });
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: e.message }, { status: 500 });
  }
}
