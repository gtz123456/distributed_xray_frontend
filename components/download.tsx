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

export const Download = ({ dict }: any) => {
  const [assets, setAssets] = useState<{ name: string; url: string }[]>([]);
  const [assetGroups, setAssetGroups] = useState<{ label: string; options: { name: string; url: string }[] }[]>([]);
  const [selectedAsset, setSelectedAsset] = useState<{
    name: string;
    url: string;
  } | null>(null);
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
      "/releases",
    )
      .then((res) => res.json())
      .then((data) => {
        const allAssets = data.assets.map(
          (a: { name: string; browser_download_url: string }) => ({
            name: a.name,
            url: a.browser_download_url,
          }),
        );

        const normalized = allAssets.map((a: { name: string }) => ({
          ...a,
          lower: a.name.toLowerCase(),
        }));

        type NormalizedAsset = {
          name: string;
          url: string;
          lower: string;
        };

        const windowsAssets = normalized.filter((a: NormalizedAsset) =>
          a.lower.endsWith(".exe") || a.lower.endsWith(".msi")
        );

        let macAssets = normalized.filter((a: NormalizedAsset) => a.lower.endsWith(".dmg"));
        // FIX: Re-assign the filtered array
        macAssets = macAssets.filter((a: NormalizedAsset) => !a.lower.endsWith(".gz"));

        const linuxAssets = normalized.filter((a: NormalizedAsset) =>
          a.lower.endsWith(".rpm") ||
          a.lower.endsWith(".deb") ||
          a.lower.endsWith(".appimage")
        );

        // 2. Further split Mac assets by architecture
        const macAppleSiliconAssets = macAssets.filter((a: NormalizedAsset) =>
          a.lower.includes("arm64") || a.lower.includes("aarch64")
        );
        const macIntelAssets = macAssets.filter((a: NormalizedAsset) =>
          a.lower.includes("x64") || a.lower.includes("amd64") ||
          (!a.lower.includes("arm64") && !a.lower.includes("aarch64")) // Fallback
        );

        // 3. Create the grouped structure for the <select> element
        const groups = [];
        if (windowsAssets.length > 0) {
          groups.push({
            label: "Windows",
            options: windowsAssets.map((a: NormalizedAsset) => ({ name: a.name, url: a.url })),
          });
        }
        if (macAppleSiliconAssets.length > 0) {
          groups.push({
            label: "macOS - Apple Silicon (M1-M4)",
            options: macAppleSiliconAssets.map((a: NormalizedAsset) => ({ name: a.name, url: a.url })),
          });
        }
        if (macIntelAssets.length > 0) {
          groups.push({
            label: "macOS - Intel Chip",
            options: macIntelAssets.map((a: NormalizedAsset) => ({ name: a.name, url: a.url })),
          });
        }
        if (linuxAssets.length > 0) {
          groups.push({
            label: "Linux",
            options: linuxAssets.map((a: NormalizedAsset) => ({ name: a.name, url: a.url })),
          });
        }
        setAssetGroups(groups);

        // 4. Create a flat list of all assets for finding the default/onChange
        const allSortedAssets = groups.flatMap(g => g.options);
        setAssets(allSortedAssets);

        // 5. Choose default asset
        const defaultAsset = allSortedAssets.find(
          (a) =>
            a.name.toLowerCase().includes(platform) &&
            a.name.toLowerCase().includes(architecture)
        );
        setSelectedAsset(defaultAsset || allSortedAssets[0] || null);
      })
      .catch((err) => console.error("Failed to fetch releases:", err));
  }, [platform, architecture]);

  return (
    <div>
      <p className={subtitle({ class: "mt-4 text-lg" })}>
        {dict.multiPlatform}
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
          <span>{dict.iosComingSoon}</span>
        </li>
        <li className="flex flex-col items-center gap-2 p-2">
          <AndroidIcon size={40} />
          <span>{dict.androidComingSoon}</span>
        </li>
      </ul>

      <div className="mt-4 flex flex-row items-center gap-2">
        <label htmlFor="asset-select" className="block text-md text-gray-400">
          {dict.selectVersion}
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
          {assetGroups.map((group) => (
            <optgroup key={group.label} label={group.label}>
              {/* Map over the options within each group */}
              {group.options.map((asset) => (
                <option key={asset.url} value={asset.name}>
                  {asset.name}
                </option>
              ))}
            </optgroup>
          ))}
        </select>
      </div>

      <a
        href={selectedAsset?.url || "#"}
        className="h-12 mt-4 inline-flex items-center justify-center px-6 py-2 bg-blue-700 text-white rounded-full hover:bg-blue-800"
        target="_blank"
        rel="noreferrer"
      >
        {dict.downloadButton}
      </a>
    </div>
  );
};