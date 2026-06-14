"use client";

import Header from "@/app/components/Header";
import Link from "next/link";

export default function Guide() {
  const promptText = `あなたは世界最高峰のゲームクリエイターかつ天才フロントエンドエンジニアです。
今から指定する内容の、HTMLファイル1つ（1ファイル完結型）で動く2Dミニゲームを作成してください。

【必須要件】
1. HTMLファイル1つ（CSS/JS込み）で完全に完結させること。
2. ゲームの世界観やジャンルに合わせて、洗練されたデザイン（CSS）を作り込み、見栄えの良いUIにすること。
3. キャラクター画像が使用したい場合は以下のパスのキャラクター画像などを使用すること。
   - 男の子: /characters/boy.png
   - 青年: /characters/young_man.png
   - おじさん: /characters/middle_man.png
   - おじいさん: /characters/old_man.png
   - 女の子: /characters/girl.png
   - お姉さん: /characters/young_woman.png
   - おばさん: /characters/middle_woman.png
   - おばあさん: /characters/old_woman.png
4. 【重要】ゲームオーバー画面（リザルト画面）や「もう一度遊ぶ」ボタンはプラットフォーム側で簡単なものを用意するため、HTML内には独自に作成しないでください。
5. ゲームクリア時、またはゲームオーバー時に、画面遷移やポップアップを出さず、すぐに以下のJavaScriptを実行して親ウィンドウにスコアを送信し、ゲームの動作（ループ処理など）を停止してください。
   window.parent.postMessage({ type: 'GAME_OVER', score: 獲得スコア }, '*');
   ※時間判定などスコアの概念がない場合には score: 0 として送信してください。

【作りたいゲームの内容】
・ここに内容を記述してください（例：降ってくるおじさんをカゴでキャッチするゲーム）`;

  const copyToClipboard = () => {
    navigator.clipboard.writeText(promptText);
    alert("プロンプトをクリップボードにコピーしました！📋");
  };

  return (
    <main className="min-h-screen px-3 md:px-6 py-6 md:py-12 max-w-4xl mx-auto font-sans bg-[#FFFDF0]">
      <Header title="作り方ガイド" />

      <div className="bg-white border-4 border-black p-4 md:p-8 rounded-2xl md:rounded-3xl shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] md:shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] mb-8 mt-4 md:mt-8">
        <h1 className="text-2xl md:text-4xl font-black mb-6 md:mb-8 flex items-center gap-2 text-black border-b-4 border-black pb-3">
          <span>📖</span> 誰でも簡単！AIゲームの作り方
        </h1>

        {/* STEP 1 */}
        <div className="space-y-4 mb-8">
          <div className="bg-[#FFEF5E] border-4 border-black p-3 md:p-4 rounded-xl shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
            <h2 className="text-base md:text-xl font-black text-black">STEP 1：AIに「プロンプト」をコピペ！</h2>
          </div>
          <p className="text-xs md:text-base font-bold text-gray-700 leading-relaxed px-1">
            ChatGPTやClaudeなどのAIに、以下のプロンプトをコピーして貼り付けてください。<br />
            一番下の <span className="text-black font-black">【作りたいゲームの内容】</span> だけ自分のアイデアに書き換えて送信しよう！
          </p>

          <div className="relative border-4 border-black rounded-xl bg-gray-50 p-3 md:p-6 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] mt-3">
            <button
              onClick={copyToClipboard}
              className="absolute top-3 right-3 bg-black text-white px-3 py-1.5 rounded-lg font-black text-xs border-2 border-black hover:bg-gray-800 active:scale-95 transition-all flex items-center gap-1 shadow-[2px_2px_0px_0px_rgba(255,239,94,1)] cursor-pointer z-10"
            >
              📋 コピーする
            </button>
            
            <pre className="font-mono text-xs md:text-sm text-gray-800 overflow-x-auto whitespace-pre md:whitespace-pre-wrap pt-8 md:pt-0 leading-relaxed max-h-[400px] md:max-h-none hide-scrollbar select-text">
              {promptText}
            </pre>
          </div>
        </div>

        {/* バナー広告枠 */}
        <div className="my-6 bg-[#E5E5E5] border-4 border-black p-3 rounded-xl flex items-center justify-center relative overflow-hidden min-h-[50px]">
          <span className="absolute left-2 bg-white px-1.5 py-0.5 text-[10px] font-bold border-2 border-black rounded shadow-[1px_1px_0px_0px_rgba(0,0,0,1)]">広告</span>
          <p className="text-[10px] md:text-xs font-bold text-gray-500 tracking-wider pl-8">Google AdSense等のバナー広告枠</p>
        </div>

        {/* STEP 2 */}
        <div className="space-y-4 mb-8">
          <div className="bg-[#FFEF5E] border-4 border-black p-3 md:p-4 rounded-xl shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
            <h2 className="text-base md:text-xl font-black text-black">STEP 2：コードを貼り付けて投稿！</h2>
          </div>
          <p className="text-xs md:text-base font-bold text-gray-700 leading-relaxed px-1">
            AIが作った <span className="font-mono text-red-500 font-black">&lt;!DOCTYPE html&gt;</span> から始まるコードをコピーし、投稿画面の「AIが作ったコード」欄に貼り付けます。説明文やタイトルを決めたら公開ボタンを押すだけ！
          </p>
        </div>

        {/* 下部ナビゲーションボタン */}
        <div className="pt-4 border-t-4 border-black mt-8 flex flex-col gap-3">
          <Link href="/post" className="block w-full bg-[#FFEF5E] text-black border-4 border-black py-4 md:py-5 rounded-xl md:rounded-2xl font-black text-lg md:text-2xl text-center shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] md:shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-none active:bg-yellow-400 transition-all cursor-pointer">
            🚀 さっそくゲームを投稿する
          </Link>
          <Link href="/system" className="block w-full bg-white text-black border-4 border-black py-3 md:py-4 rounded-xl md:rounded-2xl font-black text-sm md:text-lg text-center shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] md:shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-none transition-all cursor-pointer">
            💰 収益とランクの仕組みを見る
          </Link>
        </div>
      </div>
    </main>
  );
}