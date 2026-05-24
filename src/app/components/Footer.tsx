"use client";

import Link from "next/link";

export default function Footer() {
  return (
    <footer className="w-full bg-white border-t-4 border-black py-6 mt-12 select-none">
      <div className="max-w-6xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-4">
        {/* コピーライト */}
        <p className="text-sm font-black text-black">
          © {new Date().getFullYear()} AI-Hub. All Rights Reserved.
        </p>

        {/* リンクボタン群 */}
        <div className="flex flex-wrap gap-3 justify-center">
          <Link 
            href="/system" 
            className="px-4 py-1.5 bg-orange-100 text-orange-800 border-2 border-black rounded-lg font-black text-xs md:text-sm shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-none transition-all cursor-pointer"
          >
            ⚖️ システム解説
          </Link>

          <Link 
            href="/terms" 
            className="px-4 py-1.5 bg-[#FFEF5E] text-black border-2 border-black rounded-lg font-black text-xs md:text-sm shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-none transition-all cursor-pointer"
          >
            📜 利用規約
          </Link>
          
          <Link 
            href="/privacy" 
            className="px-4 py-1.5 bg-white text-black border-2 border-black rounded-lg font-black text-xs md:text-sm shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-none transition-all cursor-pointer"
          >
            🔒 プライバシーポリシー
          </Link>
        </div>
      </div>
    </footer>
  );
}