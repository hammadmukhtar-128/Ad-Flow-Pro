import Link from "next/link";

export default function Home() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[85vh] text-center px-4 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-blue-50 via-white to-white">
      <div className="max-w-4xl mx-auto space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-700">
        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-blue-50 border border-blue-100 text-blue-700 text-sm font-bold tracking-wide uppercase">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-blue-600"></span>
          </span>
          Next-Gen Ad Marketplace
        </div>
        
        <h1 className="text-6xl md:text-8xl font-black tracking-tighter text-gray-900 leading-[0.9]">
          Elevate Your <br />
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-indigo-600">Advertising </span> Flow
        </h1>
        
        <p className="text-xl text-gray-500 max-w-2xl mx-auto font-medium leading-relaxed">
          The high-performance marketplace for sponsored listings. Scalable, secure, and designed for growth.
        </p>
        
        <div className="flex flex-col sm:flex-row gap-5 justify-center pt-4">
          <Link href="/explore" className="bg-blue-600 text-white px-10 py-5 rounded-2xl font-bold hover:bg-blue-700 transition shadow-xl shadow-blue-200 text-lg">
            Explore Marketplace
          </Link>
          <Link href="/login" className="bg-white text-gray-900 border border-gray-100 px-10 py-5 rounded-2xl font-bold hover:bg-gray-50 transition shadow-lg shadow-gray-100 text-lg">
            Join the Network
          </Link>
        </div>
        
        <div className="pt-20 grid grid-cols-3 gap-8 text-left border-t border-gray-50">
          <div>
             <div className="text-2xl font-bold text-gray-900">10k+</div>
             <div className="text-sm text-gray-400 font-bold uppercase tracking-widest">Active Ads</div>
          </div>
          <div>
             <div className="text-2xl font-bold text-gray-900">99.9%</div>
             <div className="text-sm text-gray-400 font-bold uppercase tracking-widest">Uptime</div>
          </div>
          <div>
             <div className="text-2xl font-bold text-gray-900">24/7</div>
             <div className="text-sm text-gray-400 font-bold uppercase tracking-widest">Support</div>
          </div>
        </div>
      </div>
    </div>
  );
}
