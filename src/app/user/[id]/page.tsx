"use client";

import { useEffect, useState, use } from "react";
import { supabase } from "@/app/utils/supabase";
import Header from "@/app/components/Header";
import Link from "next/link";
import { useRouter } from "next/navigation";

export default function UserProfilePage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params);
  const targetUserId = resolvedParams.id; // URLから対象ユーザーのIDを取得

  const [targetUser, setTargetUser] = useState<any>(null);
  const [userGames, setUserGames] = useState<any[]>([]);
  const [recentPlays, setRecentPlays] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [rankPoints, setRankPoints] = useState(0);
  
  // 🌟 最初から「投稿したゲーム」タブを選択状態にする
  const [activeTab, setActiveTab] = useState<"created" | "history">("created");
  const router = useRouter();

  useEffect(() => {
    const fetchTargetUserData = async () => {
      // 対象ユーザーが投稿したゲームからユーザー名を取得（※現状auth情報が直接引けないための代替案）
      const { data: firstGame } = await supabase
        .from("games")
        .select("creator_name")
        .eq("user_id", targetUserId)
        .limit(1)
        .single();
      
      setTargetUser({
        id: targetUserId,
        username: firstGame?.creator_name || "名無しプレイヤー"
      });

      const { data: pointData } = await supabase
        .from("user_points")
        .select("rank_points")
        .eq("user_id", targetUserId)
        .single();
      
      if (pointData) {
        setRankPoints(pointData.rank_points || 0);
      }

      const { data: games } = await supabase
        .from("games")
        .select("*")
        .eq("user_id", targetUserId)
        .order("created_at", { ascending: false });
      setUserGames(games || []);

      const { data: playLogs } = await supabase
        .from("play_logs")
        .select("score, created_at, games(*)")
        .eq("player_id", targetUserId)
        .order("created_at", { ascending: false });

      const uniquePlayedGames: any[] = [];
      const seenGameIds = new Set();
      
      if (playLogs) {
        for (const log of playLogs) {
          const gameData: any = Array.isArray(log.games) ? log.games[0] : log.games;
          if (gameData && !seenGameIds.has(gameData.id)) {
            seenGameIds.add(gameData.id);
            uniquePlayedGames.push({
              ...gameData,
              bestScore: log.score,
              playedAt: log.created_at
            });
          }
        }
      }
      setRecentPlays(uniquePlayedGames);
      setLoading(false);
    };

    fetchTargetUserData();
  }, [targetUserId]);

  const getRank = (points: number) => {
    if (points >= 10000) return { name: "レジェンド", lv: "MAX", color: "bg-yellow-400" };
    if (points >= 5000) return { name: "マスター", lv: "5", color: "bg-purple-400" };
    if (points >= 1000) return { name: "プラチナ", lv: "4", color: "bg-cyan-300" };
    if (points >= 500) return { name: "ゴールド", lv: "3", color: "bg-yellow-300" };
    if (points >= 100) return { name: "シルバー", lv: "2", color: "bg-gray-300" };
    if (points >= 30) return { name: "ブロンズ", lv: "1", color: "bg-orange-300" };
    return { name: "エッグ", lv: "0", color: "bg-gray-200" };
  };

  const rankInfo = getRank(rankPoints);

  const renderGameCard = (game: any, isHistory = false) => (
    <div key={game.id} className="w-full bg-white border-4 border-black p-2.5 md:p-4 rounded-xl md:rounded-2xl shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] md:shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] flex flex-col group">
      <Link href={`/play/${game.id}`} className="block relative aspect-video mb-2 md:mb-4 border-2 md:border-4 border-black rounded-lg md:rounded-xl overflow-hidden bg-black cursor-pointer">
        <div className="absolute w-[200%] h-[200%] origin-top-left scale-50 pointer-events-none">
          <iframe srcDoc={game.code} className="w-full h-full border-none" scrolling="no" tabIndex={-1} />
        </div>
        <div className="absolute inset-0 z-10 bg-transparent group-hover:bg-[#FFEF5E]/20 transition-all"></div>
      </Link>
      <h3 className="text-base md:text-xl font-black mb-1 md:mb-2 truncate text-black">{game.title}</h3>
      
      <div className="flex justify-between items-center text-xs md:text-sm font-bold text-gray-600 mb-3 md:mb-4">
        {isHistory ? (
          <span className="truncate bg-gray-100 px-2 py-1 rounded-md border-2 border-gray-200">
            ベストスコア: <span className="text-black font-black">{game.bestScore?.toLocaleString()}</span>
          </span>
        ) : (
          <span className="flex items-center gap-0.5 font-black text-black">❤️ {game.likes || 0}</span>
        )}
      </div>

      <div className="mt-auto flex flex-col gap-2">
        <Link href={`/play/${game.id}`} className="w-full bg-black text-white border-2 md:border-4 border-black py-1.5 md:py-2 rounded-lg md:rounded-xl font-black text-xs md:text-sm text-center shadow-[2px_2px_0px_0px_rgba(156,163,175,1)] md:shadow-[4px_4px_0px_0px_rgba(156,163,175,1)] hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-none active:bg-gray-800 transition-all cursor-pointer">
          ▶ 遊ぶ
        </Link>
      </div>
    </div>
  );

  if (loading) return <div className="min-h-screen flex items-center justify-center font-bold text-xl bg-[#FFFDF0]">読み込み中...🚀</div>;

  return (
    <main className="min-h-screen px-3 md:px-6 py-6 md:py-12 max-w-6xl mx-auto font-sans bg-[#FFFDF0]">
      <Header title={`${targetUser?.username}のページ`} />

      <div className="bg-white border-4 border-black p-4 md:p-8 rounded-2xl md:rounded-3xl shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] md:shadow-[10px_10px_0px_0px_rgba(0,0,0,1)] mb-8 md:mb-12 mt-4 md:mt-8">
        
        <div className="flex flex-col md:flex-row md:items-start justify-between gap-6">
          <div className="flex-1">
            <h1 className="text-2xl md:text-4xl font-black mb-2 text-black">
              {targetUser?.username}
            </h1>
            <p className="text-xs md:text-sm font-bold text-gray-500 bg-gray-100 inline-block px-3 py-1 rounded-md border-2 border-gray-200">
              ID: {targetUser?.id}
            </p>
          </div>
        </div>

        <hr className="my-6 md:my-8 border-t-4 border-black" />

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-4">
          <h2 className="text-lg md:text-xl font-black border-b-4 border-black inline-block pb-1">クリエイターステータス</h2>
        </div>
        
        <div className={`border-4 border-black p-4 md:p-6 rounded-xl md:rounded-2xl ${rankInfo.color} shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] md:shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] flex flex-col md:flex-row md:items-center justify-between gap-4`}>
          <div>
            <p className="text-xs md:text-sm font-bold text-gray-800 mb-1">現在のランク</p>
            <div className="flex items-center gap-3">
              <span className="bg-black text-white px-2 py-1 md:px-3 md:py-1.5 rounded-lg font-black text-xs md:text-base border-2 border-white">Lv.{rankInfo.lv}</span>
              <span className="text-2xl md:text-4xl font-black text-black tracking-tight">{rankInfo.name}</span>
            </div>
          </div>

          <div className="bg-white border-4 border-black p-3 md:p-5 rounded-xl text-center md:text-right shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
            <p className="text-xs md:text-sm font-bold text-gray-600 mb-1">ランクポイント (RP)</p>
            <p className="text-3xl md:text-5xl font-black text-black">
              {rankPoints.toLocaleString()} <span className="text-base md:text-xl font-bold">RP</span>
            </p>
          </div>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6 border-b-4 border-black pb-4">
        <div className="flex gap-2 overflow-x-auto hide-scrollbar">
          {/* 🌟 修正：「投稿したゲーム」を左（最初）に配置 */}
          <button onClick={() => setActiveTab("created")} className={`px-4 py-2 md:px-6 md:py-3 rounded-lg md:rounded-xl font-black text-xs md:text-base border-2 md:border-4 border-black transition-all ${activeTab === 'created' ? 'bg-black text-white shadow-[2px_2px_0px_0px_rgba(255,239,94,1)]' : 'bg-white hover:bg-gray-100 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]'}`}>
            🕹️ 投稿したゲーム
          </button>
          <button onClick={() => setActiveTab("history")} className={`px-4 py-2 md:px-6 md:py-3 rounded-lg md:rounded-xl font-black text-xs md:text-base border-2 md:border-4 border-black transition-all ${activeTab === 'history' ? 'bg-black text-white shadow-[2px_2px_0px_0px_rgba(255,239,94,1)]' : 'bg-white hover:bg-gray-100 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]'}`}>
            🕒 遊んだ履歴
          </button>
        </div>
      </div>

      <div>
        {activeTab === "created" ? (
          userGames.length > 0 ? (
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3 md:gap-8">{userGames.map(g => renderGameCard(g, false))}</div>
          ) : (
            <div className="bg-gray-100 border-4 border-dashed border-gray-400 p-8 md:p-12 rounded-xl md:rounded-2xl text-center">
              <p className="text-base md:text-xl font-bold text-gray-500 mb-4">まだゲームを投稿していません。</p>
            </div>
          )
        ) : (
          recentPlays.length > 0 ? (
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3 md:gap-8">{recentPlays.map(g => renderGameCard(g, true))}</div>
          ) : (
            <div className="bg-gray-100 border-4 border-dashed border-gray-400 p-8 md:p-12 rounded-xl md:rounded-2xl text-center">
              <p className="text-base md:text-xl font-bold text-gray-500 mb-4">まだプレイ履歴がありません。</p>
            </div>
          )
        )}
      </div>

      <style dangerouslySetInnerHTML={{__html: `.hide-scrollbar::-webkit-scrollbar { display: none; } .hide-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }`}} />
    </main>
  );
}