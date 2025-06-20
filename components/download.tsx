"use client";

import { subtitle } from "@/components/primitives";
import {
  AndroidIcon,
  AppleIcon,
  IOSIcon,
  LinuxIcon,
  WindowsIcon,
} from "@/components/icons";
import { useEffect, useState } from "react";

export const Download = () => {
  const [assets, setAssets] = useState<{ name: string; url: string }[]>([]);
  const [selectedAsset, setSelectedAsset] = useState<{ name: string; url: string } | null>(null);
  const [platform, setPlatform] = useState("");
  const [architecture, setArchitecture] = useState("");

  // Detect platform and architecture
  useEffect(() => {
    if (typeof window !== "undefined") {
      const ua = navigator.userAgent.toLowerCase();
      const plat = navigator.platform.toLowerCase();
      let plt = "";
      if (plat.includes("win")) plt = "windows";
      else if (plat.includes("mac")) plt = "macos";
      else if (plat.includes("linux")) plt = "linux";
      else if (ua.includes("iphone") || ua.includes("ipad")) plt = "ios";
      else if (ua.includes("android")) plt = "android";
      setPlatform(plt);

      let arch = "x64";
      if (ua.includes("arm") || plat.includes("arm")) arch = "aarch64";
      setArchitecture(arch);
    }

    // Fetch latest release assets
    fetch(
      "https://api.github.com/repos/gtz123456/freewayvpn_client/releases/latest",
    )
      .then((res) => res.json())
      .then((data) => {
        const allAssets = data.assets.map(
          (a: { name: any; browser_download_url: any }) => ({
            name: a.name,
            url: a.browser_download_url,
          }),
        );

        const normalized = allAssets.map((a: { name: string }) => ({
          ...a,
          lower: a.name.toLowerCase(),
        }));

        // Filter by extension using endsWith for reliability
        const windowsAssets = normalized.filter(
          (a: { lower: string; }) => a.lower.endsWith(".exe") || a.lower.endsWith(".msi"),
        );
        const macAssets = normalized.filter(
          (a: { lower: string; }) => a.lower.endsWith(".dmg") || a.lower.endsWith(".app.tar.gz"),
        );
        const linuxAssets = normalized.filter(
          (a: { lower: string; }) =>
            a.lower.endsWith(".rpm") ||
            a.lower.endsWith(".deb") ||
            a.lower.endsWith(".appimage"),
        );

        // remove .gz files
        macAssets.filter((a: { lower: string; }) => !a.lower.endsWith(".tar.gz"));

        const sortedAssets = [
          ...windowsAssets,
          ...macAssets,
          ...linuxAssets,
        ].map((a) => ({ name: a.name, url: a.url }));

        setAssets(sortedAssets);

        // Choose default: match platform & architecture
        const defaultAsset = sortedAssets.find(
          (a) =>
            a.name.toLowerCase().includes(platform) &&
            a.name.toLowerCase().includes(architecture),
        );
        setSelectedAsset(defaultAsset || sortedAssets[0] || null);
        console.log("Assets:", sortedAssets, data.assets);
      })
      .catch((err) => console.error("Failed to fetch releases:", err));
  }, [platform, architecture]);

  return (
    <div>
      <p className={subtitle({ class: "mt-4 text-lg" })}>
        FreeWayVPN is available on multiple platforms
      </p>

      <ul className="flex flex-row flex-nowrap justify-center mt-6 text-md text-gray-400 list-disc pl-5">
        <li className="flex flex-col items-center gap-2 p-2">
          <AppleIcon size={40} />
          <span>MacOS</span>
        </li>
        <li className="flex flex-col items-center gap-2 p-2">
          <WindowsIcon size={40} />
          <span>Windows</span>
        </li>
        <li className="flex flex-col items-center gap-2 p-2">
          <LinuxIcon size={40} />
          <span>Linux</span>
        </li>
        <li className="flex flex-col items-center gap-2 p-2">
          <IOSIcon size={40} />
          <span>iOS (coming soon)</span>
        </li>
        <li className="flex flex-col items-center gap-2 p-2">
          <AndroidIcon size={40} />
          <span>Android (coming soon)</span>
        </li>
      </ul>

      <div className="mt-4 flex flex-row">
        <label htmlFor="asset-select" className="block text-md text-gray-400">
          Select your version:
        </label>
        <select
          id="asset-select"
          className="mt-2 p-2 border rounded"
          value={selectedAsset?.name || ""}
          onChange={(e) => {
            const asset = assets.find((a) => a.name === e.target.value);
            if (asset) {
              setSelectedAsset(asset);
            }
          }}
        >
          {assets.map((asset) => (
            <option key={asset.url} value={asset.name}>
              {asset.name}
            </option>
          ))}
        </select>
      </div>

      <a
        href={selectedAsset?.url || "#"}
        className="h-12 mt-4 inline-flex items-center justify-center px-6 py-2 bg-blue-700 text-white rounded-full hover:bg-blue-800"
        target="_blank"
        rel="noreferrer"
      >
        Download
      </a>
    </div>
  );
};
