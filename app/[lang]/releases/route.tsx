import { NextResponse } from "next/server";
import path from "path";
import fs from "fs/promises";
import fetch from "node-fetch";

const CACHE_DIR = path.join(process.cwd(), "public", "releases");
const META_FILE = path.join(CACHE_DIR, "release_meta.json");
const CACHE_TTL = 10 * 60 * 1000; // 10 minutes

async function refreshCache() {
  const res = await fetch("https://api.github.com/repos/gtz123456/freewayvpn_client/releases/latest", {
    headers: {
      "User-Agent": "FreewayVPN",
    },
  });

  if (!res.ok) {
    throw new Error(`GitHub API error: ${res.status} ${res.statusText}`);
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
        if (!fileRes.ok) throw new Error(`Failed to download ${a.name} (${fileRes.status})`);
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
    JSON.stringify({ lastFetched: Date.now(), assets }, null, 2),
    "utf-8"
  );

  return assets;
}

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

  if (cachedMeta) {
    if (now - cachedMeta.lastFetched > CACHE_TTL) {
      refreshCache().catch((err) => console.error("Background refresh failed:", err));
      return NextResponse.json({
        assets: cachedMeta.assets,
        notice: "A newer version may be publishing. Please refresh later for updates.",
      });
    }

    return NextResponse.json({ assets: cachedMeta.assets });
  }
  
  try {
    const assets = await refreshCache();
    return NextResponse.json({ assets });
  } catch (err) {
    return NextResponse.json(
      { error: "Failed to fetch GitHub releases" },
      { status: 500 }
    );
  }
}
