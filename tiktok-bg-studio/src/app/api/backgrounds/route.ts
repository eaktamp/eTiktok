import { NextRequest, NextResponse } from 'next/server';
import { promises as fs } from 'fs';
import path from 'path';

const DATA_FILE = path.join(process.cwd(), 'public', 'game-backgrounds.json');
const UPLOAD_DIR = path.join(process.cwd(), 'public', 'uploads');

async function readStore(): Promise<Record<string, unknown>> {
  try {
    const raw = await fs.readFile(DATA_FILE, 'utf-8');
    return JSON.parse(raw);
  } catch {
    return {};
  }
}

async function writeStore(data: Record<string, unknown>) {
  await fs.mkdir(path.dirname(DATA_FILE), { recursive: true });
  await fs.writeFile(DATA_FILE, JSON.stringify(data, null, 2), 'utf-8');
}

export async function GET() {
  const store = await readStore();
  return NextResponse.json(store, {
    headers: { 'Cache-Control': 'no-store' },
  });
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { gameId, bgMode, bgSceneId, bgImageUrl, bgBrightness, bgBlur } = body;
    if (!gameId) {
      return NextResponse.json({ error: 'Missing gameId' }, { status: 400 });
    }

    let finalUrl = String(bgImageUrl || '');

    // If data URI is sent, save it as a real file in public/uploads/ so OBS & any browser can load it cleanly
    if (finalUrl.startsWith('data:image/')) {
      const match = finalUrl.match(/^data:image\/([a-zA-Z0-9+.-]+);base64,(.+)$/);
      if (match) {
        const extRaw = match[1].toLowerCase();
        const ext = extRaw === 'jpeg' ? 'jpg' : extRaw === 'svg+xml' ? 'svg' : extRaw;
        const base64Data = match[2];
        await fs.mkdir(UPLOAD_DIR, { recursive: true });
        const filename = `${gameId}-${Date.now()}.${ext}`;
        const filePath = path.join(UPLOAD_DIR, filename);
        await fs.writeFile(filePath, Buffer.from(base64Data, 'base64'));
        finalUrl = `/uploads/${filename}`;
      }
    }

    const store = await readStore();
    store[gameId] = {
      bgMode: bgMode || 'scene',
      bgSceneId: bgSceneId || 'ca-2',
      bgImageUrl: finalUrl,
      bgBrightness: Number(bgBrightness ?? 95),
      bgBlur: Number(bgBlur ?? 0),
    };
    await writeStore(store);

    return NextResponse.json({ ok: true, config: store[gameId] });
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
