import "./globals.css";
import Footer from "./components/Footer";
import Script from "next/script";

export const metadata = {
  title: "AI-Hub - AIゲームプラットフォーム",
  description: "AIで作ったゲームを遊んでポイントを稼ぐ、次世代のゲームプラットフォーム",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // 💡 審査を進めるため、Vercelの環境変数からプロデューサーの本物ID（ca-pub-3920807823182537）を自動で読み込みます
  const publisherId = process.env.NEXT_PUBLIC_ADSENSE_PUBLISHER_ID || "ca-pub-3920807823182537";
  const bannerSlotId = process.env.NEXT_PUBLIC_ADSENSE_INTERSTITIAL_SLOT_ID || "6304540263";

  return (
    <html lang="ja">
      <head>
        {/* Google AdSenseのクローラー審査およびテスト広告表示に必須となるメインスクリプトの全共通読み込み */}
        <Script
          async
          src={`https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${publisherId}`}
          crossOrigin="anonymous"
          strategy="afterInteractive"
        />
      </head>
      {/* 💡 致命的バグ修正：広告が巨大化したため、下部余白を pb-32 (128px) / md:pb-44 (176px) に大幅拡張。利用規約フッターが絶対に隠れません */}
      <body className="bg-[#FFFDF0] text-black antialiased min-h-screen flex flex-col pb-32 md:pb-44">
        <div className="flex-grow">
          {children}
        </div>
        
        {/* 共通フッター（利用規約リンク等が載っている大切なコンポーネントを安全に最下部へ配置） */}
        <Footer />

        {/* 既存のグローバル固定バナー広告枠のデザイン・パーツを100%完全無傷で維持 */}
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

          {/* 本物のテスト広告バナーをレンダリングするユニットを完全に結合 */}
          <div className="w-full max-w-[728px] h-[60px] md:h-[90px] overflow-hidden bg-white/50 border border-gray-200 rounded flex items-center justify-center">
            <ins className="adsbygoogle"
                 style={{ display: "inline-block", width: "100%", height: "100%" }}
                 data-ad-client={publisherId}
                 data-ad-slot={bannerSlotId}
                 data-ad-format="horizontal"
                 data-full-width-responsive="false"></ins>
            <script dangerouslySetInnerHTML={{__html: `try { (adsbygoogle = window.adsbygoogle || []).push({}); } catch(e) { console.error(e); }`}} />
          </div>
        </div>
      </body>
    </html>
  );
}