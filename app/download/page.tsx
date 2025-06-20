import { title } from "@/components/primitives";
import { Download } from "@/components/download";

export default function DownloadPage() {
  return (
    <div className="flex flex-col items-center text-center py-10 px-4 max-w-2xl mx-auto">
      <h1 className={title()}>Download</h1>
      <Download />
    </div>
  );
}
