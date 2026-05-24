"use client";

import { useEffect, useState, Suspense } from "react";
import { supabase } from "@/app/utils/supabase";
import Header from "@/app/components/Header";
import Link from "next/link";
import { useSearchParams, useRouter } from "next/navigation";

function GameListContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  
  const sortType = searchParams.get("sort") || "new"; 
  // 🌟 新規：URLから現在のページ番号を取得（デフォルトは1ページ目）
  const currentPage = parseInt(searchParams.get("page") || "1", 10);
  const itemsPerPage = 20; // 🌟 プロデューサー指定：1ページあたり2x10=20件

  const [games, setGames] = useState<any[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchGames = async () => {
      setLoading(true);
      
      // 1. 全体の件数を取得（ページネーションの総ページ数計算用）
      const { count } = await supabase
        .from("games")
        .select("*", { count: "exact", head: true });
      setTotalCount(count || 0);

      // 2. ページに合わせたデータの範囲（Range）を計算
      const from = (currentPage - 1) * itemsPerPage;
      const to = from + itemsPerPage - 1;

      let query = supabase.from("games").select("*").range(from, to);

      if (sortType === "popular") {
        query = query.order("likes", { ascending: false });
      } else if (sortType === "old") {
        query = query.order("created_at", { ascending: true });
      } else {
        query = query.order("created_at", { ascending: false });
      }

      const { data } = await query;
      setGames(data || []);
      setLoading(false);
    };

    fetchGames();
  }, [sortType, currentPage]);

  // クエリパラメータを安全に更新してページ遷移させる関数
  const handlePageChange = (newPage: number) => {
    const params = new URLSearchParams(window.location.search);
    params.set("page", newPage.toString());
    router.push(`/games?${params.toString()}`);
  };

  const handleSortChange = (newSort: string) => {
    const params = new URLSearchParams(window.location.search);
    params.set("sort", newSort);
    params.set("page", "1"); // ソート切り替え時は1ページ目に戻す
    router.push(`/games?${params.toString()}`);
  };

  const renderAdCard = (index: number) => (
    <div key={`ad-${index}`} className="w-full bg-[#E5E5E5] border-4 border-black p-2.5 md:p-6 rounded-xl md:rounded-2xl shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] md:shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] flex flex-col relative">
      <span className="absolute top-2 left-2 bg-white px-2 py-0.5 text-[10px] md:text-xs font-bold border-2 border-black rounded shadow-[1px_1px_0px_0px_rgba(0,0,0,1)] z-10">広告</span>
      <div className="w-full aspect-video mb-2 md:mb-4 border-2 md:border-4 border-dashed border-gray-400 rounded-lg md:rounded-xl bg-white flex flex-col items-center justify-center text-gray-400 font-bold mt-2">
        <span className="text-2xl md:text-4xl mb-1">💰</span>
        <p className="text-[10px] md:text-sm">スポンサーリンク</p>
      </div>
      <h3 className="text-sm md:text-xl font-black text-gray-600 truncate mb-2">おすすめのサービス</h3>
      <button className="w-full bg-[#FFEF5E] text-black border-2 border-black py-1.5 md:py-3 rounded-lg md:rounded-xl font-bold text-xs md:text-base mt-auto hover:bg-yellow-400 transition-colors">
        詳細を見る
      </button>
    </div>
  );

  const renderListWithAds = (gamesList: any[]): React.ReactNode[] => {
    const items: React.ReactNode[] = [];
    gamesList.forEach((game, index) => {
      items.push(
        <Link href={`/play/${game.id}`} key={game.id} className="block bg-white border-4 border-black p-2.5 md:p-6 rounded-xl md:rounded-2xl shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] md:shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] hover:-translate-y-1 md:hover:-translate-y-2 hover:shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] md:hover:shadow-[12px_12px_0px_0px_rgba(0,0,0,1)] transition-all cursor-pointer group">
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
          <h3 className="text-base md:text-2xl font-black mb-1 md:mb-3 group-hover:text-[#e5d54a] transition-colors truncate text-black">{game.title}</h3>
          <div className="flex justify-between items-center text-xs md:text-sm font-bold text-gray-600">
            <span className="truncate max-w-[70px] md:max-w-[150px]">👤 {game.creator_name}</span>
            <span className="flex items-center gap-0.5 font-black text-black">❤️ {game.likes || 0}</span>
          </div>
        </Link>
      );

      // スマホでは5件ごと、PC(3列)でもバランス良く見える位置に広告を挟む
      if ((index + 1) % 5 === 0 && index !== gamesList.length - 1) {
        items.push(renderAdCard(index));
      }
    });
    return items;
  };

  const totalPages = Math.ceil(totalCount / itemsPerPage);

  return (
    <>
      <div className="flex flex-wrap gap-2 md:gap-4 mb-6 md:mb-8 border-b-4 border-black pb-4 md:pb-6">
        <button 
          onClick={() => handleSortChange("new")}
          className={`px-4 py-2 md:px-6 md:py-3 rounded-lg md:upgrade-btn md:rounded-xl font-black text-xs md:text-base border-2 md:border-4 border-black transition-all ${sortType === 'new' ? 'bg-black text-white shadow-[2px_2px_0px_0px_rgba(255,239,94,1)]' : 'bg-white hover:bg-gray-100 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]'}`}
        >
          ✨ 新着順
        </button>
        <button 
          onClick={() => handleSortChange("popular")}
          className={`px-4 py-2 md:px-6 md:py-3 rounded-lg md:rounded-xl font-black text-xs md:text-base border-2 md:border-4 border-black transition-all ${sortType === 'popular' ? 'bg-black text-white shadow-[2px_2px_0px_0px_rgba(255,239,94,1)]' : 'bg-white hover:bg-gray-100 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]'}`}
        >
          🎮 人気順
        </button>
        <button 
          onClick={() => handleSortChange("old")}
          className={`px-4 py-2 md:px-6 md:py-3 rounded-lg md:rounded-xl font-black text-xs md:text-base border-2 md:border-4 border-black transition-all ${sortType === 'old' ? 'bg-black text-white shadow-[2px_2px_0px_0px_rgba(255,239,94,1)]' : 'bg-white hover:bg-gray-100 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]'}`}
        >
          🕰️ 古い順
        </button>
      </div>

      {loading ? (
        <p className="text-xl font-bold text-center mt-20">読み込み中...🚀</p>
      ) : games.length > 0 ? (
        <div className="space-y-12">
          {/* 🌟 改造ポイント：スマホ(grid-cols-2) ↔ PC(md:grid-cols-3) の完全2x10対応グリッド！ */}
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3 md:gap-8">
            {renderListWithAds(games)}
          </div>

          {/* 🌟 新規：ネオブロータリズム流・超カッコいいページネーションUI */}
          {totalPages > 1 && (
            <div className="flex justify-center items-center gap-2 pt-6 border-t-4 border-black select-none">
              <button
                disabled={currentPage === 1}
                onClick={() => handlePageChange(currentPage - 1)}
                className="px-3 py-2 border-2 border-black rounded-lg font-black text-xs md:text-sm bg-white disabled:opacity-40 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] disabled:shadow-none transition-all enabled:cursor-pointer"
              >
                ◀ 前へ
              </button>
              
              {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                <button
                  key={page}
                  onClick={() => handlePageChange(page)}
                  className={`w-8 h-8 md:w-10 md:h-10 border-2 border-black rounded-lg font-black text-xs md:text-sm transition-all cursor-pointer ${currentPage === page ? 'bg-[#FFEF5E] text-black shadow-none translate-y-0.5' : 'bg-white shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]'}`}
                >
                  {page}
                </button>
              ))}

              <button
                disabled={currentPage === totalPages}
                onClick={() => handlePageChange(currentPage + 1)}
                className="px-3 py-2 border-2 border-black rounded-lg font-black text-xs md:text-sm bg-white disabled:opacity-40 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] disabled:shadow-none transition-all enabled:cursor-pointer"
              >
                次へ ▶
              </button>
            </div>
          )}
        </div>
      ) : (
        <div className="bg-gray-100 border-4 border-dashed border-gray-400 p-12 rounded-2xl text-center">
          <p className="text-xl font-bold text-gray-500">ゲームが見つかりませんでした。</p>
        </div>
      )}
    </>
  );
}

export default function GamesPage() {
  return (
    <main className="min-h-screen px-3 md:px-6 py-6 md:py-12 max-w-6xl mx-auto font-sans bg-[#FFFDF0]">
      <Header title="ゲームを探す" />
      <h1 className="text-2xl md:text-4xl font-black mb-6 md:mb-8 mt-2 text-black">すべてのゲーム</h1>
      
      <Suspense fallback={<p className="text-xl font-bold">読み込み中...🚀</p>}>
        <GameListContent />
      </Suspense>
    </main>
  );
}