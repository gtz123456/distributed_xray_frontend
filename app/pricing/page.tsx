import { CheckIcon } from "@/components/icons";

export default function PricingPage() {
  return (
    <section className="flex flex-col items-center justify-center gap-6 py-10 md:py-12 w-full">
      <div className="inline-block max-w-xl text-center justify-center animate-fade-in">
        <h1 className="text-4xl font-extrabold">Pricing</h1>
        <p className="mt-4 text-lg text-gray-400">Choose the plan that fits your needs</p>
      </div>
      
      <div className="flex flex-wrap justify-center gap-4 mt-4">
        <div className="p-6 border rounded-3xl shadow-xl bg-gradient-to-r from-gray-800 via-gray-700 to-gray-600 text-white flex flex-col items-center min-w-80">
          <h2 className="text-2xl font-semibold">Basic Plan</h2>
          <p className="text-xl font-bold mt-2">Free Forever</p>
          <ul className="mt-4 space-y-2 text-gray-300 text-left">
            <li className="flex items-center flex-row"><CheckIcon/> <div> Connect to basic nodes for reliable access </div></li>
            <li className="flex items-center"><CheckIcon/> Encrypted transmission to bypass firewalls</li>
            <li className="flex items-center"><CheckIcon/> Multi-platform login support</li>
          </ul>
        </div>
        
        <div className="p-6 border rounded-3xl shadow-xl bg-gradient-to-r from-purple-500 via-blue-500 to-teal-400 text-white flex flex-col items-center min-w-80">
          <h2 className="text-2xl font-semibold">Premium Plan</h2>
          <p className="text-xl font-bold mt-2">$2.99 / month</p>
          <ul className="mt-4 space-y-2 text-gray-100 text-left">
            <li className="flex items-center"><CheckIcon/> Includes all Basic Plan features</li>
            <li className="flex items-center"><CheckIcon/> Access to a larger selection of global nodes</li>
            <li className="flex items-center"><CheckIcon/> Improved speed and reduced latency</li>
          </ul>
        </div>
      </div>
    </section>
  );
}