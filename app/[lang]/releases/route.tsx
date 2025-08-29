import { NextResponse } from "next/server";
import path from "path";
import fs from "fs/promises";
import fetch from "node-fetch";

const CACHE_DIR = path.join(process.cwd(), "public", "releases");
const META_FILE = path.join(CACHE_DIR, "release_meta.json");
const CACHE_TTL = 10 * 60 * 1000; // 10 minutes

export async function GET() {
  await fs.mkdir(CACHE_DIR, { recursive: true });

  let cachedMeta: { lastFetched: number; assets: { name: string; url: string }[] } | null = null;
  try {
    const metaContent = await fs.readFile(META_FILE, "utf-8");
    cachedMeta = JSON.parse(metaContent);
  } catch {
    cachedMeta = null;
  }

  const now = Date.now();

  if (cachedMeta && now - cachedMeta.lastFetched < CACHE_TTL) {
    return NextResponse.json({ assets: cachedMeta.assets });
  }

  const res = await fetch("https://api.github.com/repos/gtz123456/freewayvpn_client/releases/latest", {
    headers: {
      "User-Agent": "FreewayVPN",
    },
  });
  if (!res.ok) {
    if (cachedMeta) {
      return NextResponse.json({ assets: cachedMeta.assets });
    }
    return NextResponse.json({ error: "Failed to fetch GitHub releases" }, { status: 500 });
  }

  const data = await res.json();
  const releaseData = data as { assets: { name: string; browser_download_url: string }[] };

  const assets = await Promise.all(
    releaseData.assets.map(async (a) => {
      const filePath = path.join(CACHE_DIR, a.name);

      try {
        await fs.access(filePath);
      } catch {
        const fileRes = await fetch(a.browser_download_url);
        if (!fileRes.ok) throw new Error(`Failed to download ${a.name}`);
        const arrayBuffer = await fileRes.arrayBuffer();
        await fs.writeFile(filePath, new Uint8Array(arrayBuffer));
      }

      return {
        name: a.name,
        url: `/releases/${a.name}`,
      };
    })
  );

  await fs.writeFile(
    META_FILE,
    JSON.stringify({ lastFetched: now, assets }, null, 2),
    "utf-8"
  );

  return NextResponse.json({ assets });
}
