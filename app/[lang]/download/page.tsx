import { title } from "@/components/primitives";
import { Download } from "@/components/download";

import { getDictionary } from "@/app/[lang]/dictionaries";

export default async function DownloadPage({
  params,
}: {
  params: Promise<{ lang: "en" | "zh" }>;
}) {
  const { lang } = await params;
  const dict: any = await getDictionary(lang);

  return (
    <div className="flex flex-col items-center text-center py-10 px-4 max-w-2xl mx-auto">
      <h1 className="text-4xl font-extrabold">{dict.routes.download}</h1>
      <Download dict={dict.download} />
    </div>
  );
}
