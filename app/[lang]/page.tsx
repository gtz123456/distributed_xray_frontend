import { Link } from "@nextui-org/link";
import NextLink from "next/link";
import { button as buttonStyles } from "@nextui-org/theme";

import { getDictionary } from "@/app/[lang]/dictionaries";
import { siteConfig } from "@/config/site";
import { GithubIcon } from "@/components/icons";

import HexMap from "@/components/hexmap";

export default async function Home({
  params,
}: {
  params: Promise<{ lang: "en" | "zh" }>;
}) {
  const { lang } = await params;
  const dict: any = await getDictionary(lang);

  return (
    <section className="flex flex-col items-center justify-center gap-6 py-10 md:py-12 overflow-hidden">
      <div className="inline-block max-w-xl text-center justify-center animate-fade-in">
        <h1 className="text-4xl font-extrabold">
          {dict.defaultpage.welcome1}{" "}
          <span className="bg-gradient-to-r from-purple-500 via-blue-500 to-teal-400 text-transparent bg-clip-text">
            {dict.defaultpage.welcome2}
          </span>
        </h1>
        <p className="mt-4 text-lg text-gray-400">
          {dict.defaultpage.welcome3}{" "}
          <span className="font-semibold text-white">FreeWayVPN.</span>
        </p>
      </div>

      <HexMap />

      <div className="flex gap-4 mt-4">
        <NextLink
          className={buttonStyles({
            color: "primary",
            radius: "full",
            variant: "shadow",
          })}
          href={`/${lang}${siteConfig.links.download}`}
        >
          {dict.routes.download}
        </NextLink>
        <Link
          isExternal
          className={buttonStyles({ variant: "bordered", radius: "full" })}
          href={siteConfig.links.github}
        >
          <GithubIcon size={20} />
          GitHub
        </Link>
      </div>
    </section>
  );
}
