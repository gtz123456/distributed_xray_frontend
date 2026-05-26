import { getDictionary } from "@/app/[lang]/dictionaries";
import AdminPanel from "@/components/admin/AdminPanel";

export default async function AdminPage({
  params,
}: {
  params: Promise<{ lang: "en" | "zh" }>;
}) {
  const { lang } = await params;
  const dict: any = await getDictionary(lang);

  return <AdminPanel dict={dict.admin} lang={lang} />;
}
