import { execSync } from "child_process";
import { NextResponse } from "next/server";

const KB_CLI = "/Users/anago/.openclaw/workspace/projects/knowledge-base/cli.py";

export async function POST(req: Request) {
  try {
    const { url, text, title, intent, project } = await req.json();
    
    let cmd = `python3 ${KB_CLI} add`;
    if (url) cmd += ` "${url}"`;
    if (text) cmd += ` --text "${text.replace(/"/g, '\\"')}"`;
    if (title) cmd += ` --title "${title}"`;
    if (intent) cmd += ` --intent "${intent}"`;
    if (project) cmd += ` --project "${project}"`;
    
    const output = execSync(cmd, { encoding: "utf8", timeout: 30000 });
    return NextResponse.json({ ok: true, output });
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: e.message }, { status: 500 });
  }
}
