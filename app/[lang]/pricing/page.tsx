import { CheckIcon } from "@/components/icons";
import { getDictionary } from "@/app/[lang]/dictionaries";
import GlowingCard from "@/components/GlowingCards";


export default async function PricingPage({
  params,
}: {
  params: Promise<{ lang: "en" | "zh" }>;
}) {
  const { lang } = await params;
  const dict: any = await getDictionary(lang);

  return (
    <section className="flex flex-col items-center justify-center gap-6 py-10 md:py-12 w-full">
      <div className="inline-block max-w-xl text-center justify-center animate-fade-in">
        <h1 className="text-4xl font-extrabold">{dict.pricing.title}</h1>
        <p className="mt-4 text-lg text-gray-400">{dict.pricing.subtitle}</p>
      </div>
      
      <div className="flex flex-wrap justify-center gap-4 mt-4">
        <GlowingCard className="">
          <div className="p-4">
            <h2 className="text-2xl font-bold">{dict.pricing.basicPlan.title}</h2>
            <p className="text-lg mt-2">{dict.pricing.basicPlan.price}</p>
            <ul className="mt-4 space-y-2 text-gray-300 text-left">
              <li className="flex items-center flex-row"><CheckIcon/> <div>{dict.pricing.basicPlan.feature1}</div></li>
              <li className="flex items-center"><CheckIcon/> {dict.pricing.basicPlan.feature2}</li>
              <li className="flex items-center"><CheckIcon/> {dict.pricing.basicPlan.feature3}</li>
            </ul>
          </div>
        </GlowingCard>

        <GlowingCard className="">
          <div className="p-4">
            <h2 className="text-2xl font-bold bg-gradient-to-r from-purple-500 via-blue-500 to-teal-400 bg-clip-text text-transparent">
              {dict.pricing.premiumPlan.title}
            </h2>
            <p className="text-lg mt-2">{dict.pricing.premiumPlan.price}</p>
            <ul className="mt-4 space-y-2 text-gray-100 text-left">
              <li className="flex items-center"><CheckIcon/> {dict.pricing.premiumPlan.feature1}</li>
              <li className="flex items-center"><CheckIcon/> {dict.pricing.premiumPlan.feature2}</li>
              <li className="flex items-center"><CheckIcon/> {dict.pricing.premiumPlan.feature3}</li>
            </ul>
          </div>
        </GlowingCard>
      </div>
    </section>
  );
}