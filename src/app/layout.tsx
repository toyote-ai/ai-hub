import "./globals.css";
import Footer from "./components/Footer";
import Script from "next/script"; // 💡 追加：Google AdSenseスクリプトを安全に全ページへ非同期読み込みするコンポーネント

export const metadata = {
  title: "AI-Hub - AIゲームプラットフォーム",
  description: "AIで作ったゲームを遊んでポイントを稼ぐ、次世代のゲームプラットフォーム",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // 💡 Vercelの環境変数（現在プロデューサーが設定してくれたテスト用ID ca-pub-3940256099942544）を自動で読み込みます
  const publisherId = process.env.NEXT_PUBLIC_ADSENSE_PUBLISHER_ID || "ca-pub-3940256099942544";
  const bannerSlotId = process.env.NEXT_PUBLIC_ADSENSE_INTERSTITIAL_SLOT_ID || "6304540263";

  return (
    <html lang="ja">
      <head>
        {/* 💡 追加：Google AdSenseのクローラー審査および広告表示に必須となるメインスクリプトの全共通読み込み */}
        <Script
          async
          src={`https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${publisherId}`}
          crossOrigin="anonymous"
          strategy="afterInteractive"
        />
      </head>
      {/* 🌟 pb-14を追加し、最下部の固定広告でフッターが隠れないように余白を確保（既存維持） */}
      <body className="bg-[#FFFDF0] text-black antialiased min-h-screen flex flex-col pb-14 md:pb-16">
        <div className="flex-grow">
          {children}
        </div>
        
        {/* 共通フッター（既存維持） */}
        <Footer />

        {/* 🌟 既存のグローバル固定バナー広告枠のデザイン・パーツを100%完全無傷で維持 */}
        <div className="fixed bottom-0 left-0 w-full bg-[#f8f9fa] border-t-2 md:border-t-4 border-dashed border-gray-400 p-2 md:p-3 z-50 flex flex-col items-center justify-center gap-1 shadow-[0px_-4px_10px_rgba(0,0,0,0.1)]">
          <div className="flex items-center justify-center gap-2 md:gap-3">
            <div className="w-6 h-6 md:w-8 md:h-8 bg-[#4b4b4b] text-white rounded-full flex items-center justify-center font-bold text-xs md:text-sm shadow-[1px_1px_0px_0px_rgba(0,0,0,1)]">
              N
            </div>
            <span className="bg-white border-2 border-gray-300 text-gray-500 text-[10px] md:text-xs font-bold px-1.5 py-0.5 rounded shadow-[1px_1px_0px_0px_rgba(0,0,0,0.2)]">
              広告
            </span>
            <span className="text-gray-500 font-bold text-xs md:text-sm tracking-wide">
              Google AdSense 広告配信枠
            </span>
          </div>

          {/* 💡 追加：プロデューサーが作られた美しい枠のすぐ下に、本物のテスト広告バナーをレンダリングするユニットを結合 */}
          <div className="w-full max-w-[728px] h-[60px] md:h-[90px] overflow-hidden bg-white/50 border border-gray-200 rounded flex items-center justify-center">
            <ins className="adsbygoogle"
                 style={{ display: "inline-block", width: "100%", height: "100%" }}
                 data-ad-client={publisherId}
                 data-ad-slot={bannerSlotId}
                 data-ad-format="horizontal"
                 data-full-width-responsive="false"></ins>
            {/* ハイドレーションエラーを起こさずに、ブラウザ上で安全に広告描画を強制実行するインラインスクリプト */}
            <script dangerouslySetInnerHTML={{__html: `try { (adsbygoogle = window.adsbygoogle || []).push({}); } catch(e) { console.error(e); }`}} />
          </div>
        </div>
      </body>
    </html>
  );
}