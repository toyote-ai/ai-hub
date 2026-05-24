import "./globals.css";
import Footer from "./components/Footer";

export const metadata = {
  title: "AI-Hub - AIゲームプラットフォーム",
  description: "AIで作ったゲームを遊んでポイントを稼ぐ、次世代のゲームプラットフォーム",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ja">
      {/* 🌟 pb-14を追加し、最下部の固定広告でフッターが隠れないように余白を確保 */}
      <body className="bg-[#FFFDF0] text-black antialiased min-h-screen flex flex-col pb-14 md:pb-16">
        <div className="flex-grow">
          {children}
        </div>
        
        {/* 共通フッター */}
        <Footer />

        {/* 🌟 復活：グローバル固定バナー広告枠（スクショのデザインを完全再現） */}
        <div className="fixed bottom-0 left-0 w-full bg-[#f8f9fa] border-t-2 md:border-t-4 border-dashed border-gray-400 p-2 md:p-3 z-50 flex items-center justify-center gap-2 md:gap-3 shadow-[0px_-4px_10px_rgba(0,0,0,0.1)]">
          <div className="w-6 h-6 md:w-8 md:h-8 bg-[#4b4b4b] text-white rounded-full flex items-center justify-center font-bold text-xs md:text-sm shadow-[1px_1px_0px_0px_rgba(0,0,0,1)]">
            N
          </div>
          <span className="bg-white border-2 border-gray-300 text-gray-500 text-[10px] md:text-xs font-bold px-1.5 py-0.5 rounded shadow-[1px_1px_0px_0px_rgba(0,0,0,0.2)]">
            広告
          </span>
          <span className="text-gray-500 font-bold text-xs md:text-sm tracking-wide">
            Google AdSense等のバナー広告枠
          </span>
        </div>
      </body>
    </html>
  );
}