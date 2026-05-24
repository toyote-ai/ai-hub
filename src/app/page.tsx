"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/app/utils/supabase";
import Header from "@/app/components/Header";
import Link from "next/link";

export default function Home() {
  const [popularGames, setPopularGames] = useState<any[]>([]);
  const [newGames, setNewGames] = useState<any[]>([]);
  const [announcement, setAnnouncement] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchGames = async () => {
      const { data: annData } = await supabase
        .from("announcements")
        .select("message, is_active")
        .eq("id", 1)
        .single();
      
      if (annData && annData.is_active) {
        setAnnouncement(annData.message);
      } else {
        setAnnouncement(null);
      }

      const { data: popular } = await supabase
        .from("games")
        .select("*")
        .order("likes", { ascending: false })
        .limit(6);
      
      const { data: newG } = await supabase
        .from("games")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(6);

      setPopularGames(popular || []);
      setNewGames(newG || []);
      setLoading(false);
    };

    fetchGames();
  }, []);

  const renderGameCard = (game: any, isAdPlaceholder = false, adIndex = 0) => {
    if (isAdPlaceholder) {
      return (
        <div 
          key={`ad-${adIndex}`} 
          className="w-full md:min-w-[320px] md:max-w-[320px] bg-[#E5E5E5] border-4 border-black p-2.5 md:p-4 rounded-xl md:rounded-2xl flex flex-col relative shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] md:shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]"
        >
          <span className="absolute top-1.5 left-1.5 bg-white px-1.5 py-0.5 text-[10px] md:text-xs font-bold border-2 border-black rounded z-10">広告</span>
          <div className="w-full aspect-video mb-2 md:mb-4 border-2 md:border-4 border-dashed border-gray-400 rounded-lg md:rounded-xl bg-white flex flex-col items-center justify-center text-gray-400 font-bold">
            <span className="text-2xl md:text-4xl mb-1">💰</span>
            <p className="text-[10px] md:text-sm">スポンサーリンク</p>
          </div>
          <h3 className="text-sm md:text-lg font-black text-gray-600 truncate mb-1">おすすめのサービス</h3>
          <button className="w-full bg-[#FFEF5E] text-black border-2 border-black py-1.5 md:py-2 rounded-lg font-bold text-xs md:text-sm mt-auto">
            詳細を見る
          </button>
        </div>
      );
    }

    return (
      <Link 
        href={`/play/${game.id}`} 
        key={game.id} 
        className="w-full md:min-w-[320px] md:max-w-[320px] bg-white border-4 border-black p-2.5 md:p-4 rounded-xl md:rounded-2xl shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] md:shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] hover:-translate-y-2 hover:shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] md:hover:shadow-[12px_12px_0px_0px_rgba(0,0,0,1)] transition-all cursor-pointer group"
      >
        <div className="relative aspect-video mb-2 md:mb-4 border-2 md:border-4 border-black rounded-lg md:rounded-xl overflow-hidden bg-black">
          <div className="absolute w-[200%] h-[200%] origin-top-left scale-50 pointer-events-none">
            <iframe 
              srcDoc={game.code} 
              className="w-full h-full border-none"
              scrolling="no"
              tabIndex={-1}
            />
          </div>
          <div className="absolute inset-0 z-10 bg-transparent group-hover:bg-[#FFEF5E]/20 transition-all"></div>
        </div>
        <h3 className="text-base md:text-xl font-black mb-1 md:mb-2 group-hover:text-[#e5d54a] transition-colors truncate text-black">{game.title}</h3>
        <div className="flex justify-between items-center text-xs md:text-sm font-bold text-gray-600">
          <span className="truncate max-w-[70px] md:max-w-[120px]">👤 {game.creator_name}</span>
          <span className="flex items-center gap-0.5">❤️ {game.likes || 0}</span>
        </div>
      </Link>
    );
  };

  const renderPCList = (games: any[]): React.ReactNode[] => {
    const items: React.ReactNode[] = [];
    games.forEach((game, index) => {
      items.push(renderGameCard(game));
      if ((index + 1) % 2 === 0 && index !== games.length - 1) {
        items.push(renderGameCard(null, true, index));
      }
    });
    return items;
  };

  const renderMobileList = (games: any[]): React.ReactNode[] => {
    const items: React.ReactNode[] = [];
    let displayedCount = 0;

    for (let i = 0; i < games.length; i++) {
      if (displayedCount >= 6) break; 
      
      items.push(renderGameCard(games[i]));
      displayedCount++;

      if ((i + 1) % 2 === 0 && i !== games.length - 1 && displayedCount < 6) {
        items.push(renderGameCard(null, true, i));
        displayedCount++;
      }
    }
    return items;
  };

  return (
    <main className="min-h-screen px-3 md:px-6 py-6 md:py-12 max-w-6xl mx-auto font-sans bg-[#FFFDF0]">
      <Header title="ホーム" />

      {announcement && (
        <div className="bg-[#FFEF5E] border-4 border-black p-3 md:p-5 mb-8 rounded-xl shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] flex items-center gap-3">
          <span className="text-2xl md:text-3xl animate-bounce">📢</span>
          <p className="font-black text-sm md:text-lg text-black leading-snug whitespace-pre-wrap break-words">
            {announcement}
          </p>
        </div>
      )}

      <section className="bg-[#FFEF5E] border-4 md:border-8 border-black p-6 md:p-14 rounded-2xl md:rounded-3xl shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] md:shadow-[12px_12px_0px_0px_rgba(0,0,0,1)] mb-10 text-center">
        <h2 className="text-4xl md:text-6xl font-black mb-3 md:mb-5 tracking-tight text-black leading-tight">
          AIで遊ぼう！！
        </h2>
        <p className="text-sm md:text-xl font-bold mb-8 md:mb-10 text-gray-800">
          〜遊んでAI副業になる最強のAIプラットフォーム〜
        </p>
        
        {/* 🌟 修正：3つのボタンが美しく整列するエリア（収益システムを左端に追加） */}
        <div className="flex flex-col sm:flex-row justify-center items-center gap-3 md:gap-6">
          <Link href="/system" className="bg-white text-black px-8 py-3 md:px-10 md:py-4 rounded-xl font-black text-base md:text-xl border-4 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:translate-y-1 hover:shadow-none transition-all w-full sm:w-auto text-center">
            ⚖️ 収益システム
          </Link>
          <Link href="/guide" className="bg-white text-black px-8 py-3 md:px-10 md:py-4 rounded-xl font-black text-base md:text-xl border-4 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:translate-y-1 hover:shadow-none transition-all w-full sm:w-auto text-center">
            📖 作り方ガイド
          </Link>
          <Link href="/post" className="bg-black text-white px-8 py-3 md:px-10 md:py-4 rounded-xl font-black text-base md:text-xl border-4 border-black shadow-[4px_4px_0px_0px_rgba(255,255,255,1)] hover:translate-y-1 hover:shadow-none transition-all w-full sm:w-auto text-center">
            ゲームを投稿する 🚀
          </Link>
        </div>
      </section>

      {loading ? (
        <p className="text-xl font-bold text-center mt-20">読み込み中...🚀</p>
      ) : (
        <div className="space-y-10 md:space-y-16">
          
          <section>
            <div className="flex items-center justify-between mb-4 md:mb-6">
              <h2 className="text-xl md:text-3xl font-black flex items-center gap-2 border-b-4 border-black pb-1">
                <span>🎮</span> 人気ランキング
              </h2>
            </div>
            
            <div className="grid grid-cols-2 gap-3 md:hidden">
              {renderMobileList(popularGames)}
            </div>

            <div className="hidden md:flex md:overflow-x-auto md:pb-8 md:pt-2 md:gap-6 md:hide-scrollbar">
              {renderPCList(popularGames)}
            </div>
            
            <Link href="/games?sort=popular" className="mt-4 md:mt-0 w-full md:w-auto md:min-w-[200px] bg-white border-4 border-black border-dashed p-4 rounded-xl md:rounded-2xl flex flex-row md:flex-col items-center justify-center text-center hover:bg-[#FFEF5E] hover:border-solid hover:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] md:hover:shadow-[8px_8px_0px_0px_rgba(8px,8px,0px,0px_rgba(0,0,0,1))] hover:-translate-y-1 md:hover:-translate-y-2 transition-all cursor-pointer group gap-2">
              <span className="text-2xl md:text-6xl group-hover:translate-x-2 md:group-hover:translate-x-2 transition-transform">➡️</span>
              <span className="text-sm md:text-xl font-black text-black">もっとみる</span>
            </Link>
          </section>

          <section>
            <div className="flex items-center justify-between mb-4 md:mb-6">
              <h2 className="text-xl md:text-3xl font-black flex items-center gap-2 border-b-4 border-black pb-1">
                <span>✨</span> 新着ゲーム
              </h2>
            </div>
            
            <div className="grid grid-cols-2 gap-3 md:hidden">
              {renderMobileList(newGames)}
            </div>

            <div className="hidden md:flex md:overflow-x-auto md:pb-8 md:pt-2 md:gap-6 md:hide-scrollbar">
              {renderPCList(newGames)}
            </div>
            
            <Link href="/games?sort=new" className="mt-4 md:mt-0 w-full md:w-auto md:min-w-[200px] bg-white border-4 border-black border-dashed p-4 rounded-xl md:rounded-2xl flex flex-row md:flex-col items-center justify-center text-center hover:bg-[#FFEF5E] hover:border-solid hover:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] md:hover:shadow-[8px_8px_0px_0px_rgba(8px,8px,0px,0px_rgba(0,0,0,1))] hover:-translate-y-1 md:hover:-translate-y-2 transition-all cursor-pointer group gap-2">
              <span className="text-2xl md:text-6xl group-hover:translate-x-2 md:group-hover:translate-x-2 transition-transform">➡️</span>
              <span className="text-sm md:text-xl font-black text-black">もっとみる</span>
            </Link>
          </section>

        </div>
      )}

      <style dangerouslySetInnerHTML={{__html: `
        .hide-scrollbar::-webkit-scrollbar { display: none; }
        .hide-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
      `}} />
    </main>
  );
}