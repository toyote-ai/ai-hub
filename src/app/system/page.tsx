"use client";

import Header from "@/app/components/Header";
import Link from "next/link";

export default function SystemPage() {
  return (
    <main className="min-h-screen px-3 md:px-6 py-6 md:py-12 max-w-4xl mx-auto font-sans bg-[#FFFDF0]">
      <Header title="システム解説" />

      {/* 看板 */}
      <div className="bg-black text-white border-4 border-black p-6 md:p-8 rounded-2xl md:rounded-3xl shadow-[6px_6px_0px_0px_rgba(255,239,94,1)] text-center mt-4 md:mt-8 mb-10">
        <h1 className="text-2xl md:text-4xl font-black mb-2 tracking-tight">⚖️ ランクと収益の仕組み</h1>
        <p className="text-xs md:text-base font-bold text-yellow-300">ゲームを遊び尽くして、最強の還元率ランクを目指そう！</p>
      </div>

      <div className="space-y-12">
        {/* 収益システム */}
        <section className="bg-white border-4 border-black p-5 md:p-8 rounded-2xl shadow-[6px_6px_0px_0px_rgba(0,0,0,1)]">
          <h2 className="text-xl md:text-2xl font-black mb-4 border-b-4 border-black pb-2 text-black">💸 ゲームを作って稼ぐ</h2>
          <p className="font-bold text-gray-700 text-sm md:text-base leading-relaxed">
            AI-Hubでは、あなたが投稿したゲームが誰かに遊ばれると、広告収益が発生します。ランクが高いほど、その収益の分配（還元率）がどんどんアップします！
          </p>
        </section>

        {/* ポイント獲得方法（🌟 プロデューサーの仕様通りに修正！） */}
        <section className="bg-white border-4 border-black p-5 md:p-8 rounded-2xl shadow-[6px_6px_0px_0px_rgba(0,0,0,1)]">
          <h2 className="text-xl md:text-2xl font-black mb-4 border-b-4 border-black pb-2 text-black">🏆 ポイント（RP）を稼ぐ方法</h2>
          <p className="font-bold text-gray-700 text-sm md:text-base mb-6">RPはあなたの「収益還元ランク」を決める経験値です。以下の方法で手に入ります。</p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
            <div className="border-4 border-black p-4 rounded-xl bg-orange-50">
              <h3 className="font-black text-base md:text-lg mb-1 text-orange-600">🎮 初回プレイ報酬</h3>
              <p className="text-sm font-bold text-gray-700">各ゲームを初めてプレイすると、即座に <span className="text-black font-black">5 RP</span> を獲得できます！いろんなゲームを遊びましょう。</p>
            </div>
            <div className="border-4 border-black p-4 rounded-xl bg-yellow-50">
              <h3 className="font-black text-base md:text-lg mb-1 text-yellow-600">👑 ランキング報酬</h3>
              <p className="text-sm font-bold text-gray-700">デイリー・ウィークリー・マンスリーの各ランキングで上位に入ると、期間終了後にポストへ大量のRPが届きます！</p>
            </div>
          </div>

          <div className="border-4 border-black bg-[#FFEF5E] p-4 rounded-xl">
            <h3 className="font-black text-sm md:text-base text-black mb-1">💡 ランキング報酬は「盛り上がり」で変動！</h3>
            <p className="text-xs md:text-sm font-bold text-gray-800 leading-relaxed">
              ランキング報酬でもらえるポイントの大きさは、そのゲームを遊んだ「プレイユーザー数」によって変化します。
              人気のあるゲームで上位になれば、一気に数千ポイントを獲得するチャンス！
            </p>
          </div>
        </section>

        {/* ランクテーブル */}
        <section className="bg-white border-4 border-black p-5 md:p-8 rounded-2xl shadow-[6px_6px_0px_0px_rgba(0,0,0,1)]">
          <h3 className="font-black text-sm md:text-base mb-4 text-black">📈 ランクごとの還元倍率</h3>
          <div className="overflow-x-auto border-4 border-black rounded-xl">
            <table className="w-full text-left border-collapse bg-white text-xs md:text-sm font-bold">
              <thead>
                <tr className="bg-black text-white font-black">
                  <th className="p-3 border-r-2 border-b-4 border-black">ランク</th>
                  <th className="p-3 border-r-2 border-b-4 border-black">必要な所持ポイント (RP)</th>
                  <th className="p-3 border-b-4 border-black">あなたの収益還元率</th>
                </tr>
              </thead>
              <tbody className="divide-y-2 divide-black text-black">
                <tr><td className="p-3 border-r-2 border-black bg-gray-200">🥚 エッグ</td><td className="p-3 border-r-2 border-black font-mono">0 RP</td><td className="p-3 text-red-500 font-black">0倍 (収益化ロック)</td></tr>
                <tr><td className="p-3 border-r-2 border-black bg-orange-200">🥉 ブロンズ</td><td className="p-3 border-r-2 border-black font-mono">30 RP</td><td className="p-3 font-black">1.0倍 (基準)</td></tr>
                <tr><td className="p-3 border-r-2 border-black bg-gray-300">🥈 シルバー</td><td className="p-3 border-r-2 border-black font-mono">100 RP</td><td className="p-3 font-black text-blue-600">1.2倍</td></tr>
                <tr><td className="p-3 border-r-2 border-black bg-yellow-200">🥇 ゴールド</td><td className="p-3 border-r-2 border-black font-mono">500 RP</td><td className="p-3 font-black text-blue-700">1.3倍</td></tr>
                <tr><td className="p-3 border-r-2 border-black bg-cyan-200">💎 プラチナ</td><td className="p-3 border-r-2 border-black font-mono">1,000 RP</td><td className="p-3 font-black text-purple-600">1.5倍</td></tr>
                <tr><td className="p-3 border-r-2 border-black bg-purple-200">👑 マスター</td><td className="p-3 border-r-2 border-black font-mono">5,000 RP</td><td className="p-3 font-black text-purple-700">1.7倍</td></tr>
                <tr><td className="p-3 border-r-2 border-black bg-yellow-400">🌟 レジェンド</td><td className="p-3 border-r-2 border-black font-mono">10,000 RP</td><td className="p-3 font-black text-red-600 text-base">2.0倍 (最大！👑🔥)</td></tr>
              </tbody>
            </table>
          </div>
        </section>
      </div>

      <div className="mt-10 text-center">
        <Link href="/" className="inline-block bg-black text-white border-4 border-black px-6 py-3 rounded-xl font-black text-sm md:text-base shadow-[4px_4px_0px_0px_rgba(255,239,94,1)] hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-none transition-all">ホームへ戻る</Link>
      </div>
    </main>
  );
}