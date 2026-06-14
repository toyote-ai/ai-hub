"use client";

import { useEffect, useState, use, useRef } from "react";
import { supabase } from "@/app/utils/supabase";
import Header from "@/app/components/Header";

type ResultState = {
  show: boolean;
  score: number;
  detailsLoaded: boolean;
  isHighScore: boolean;
  isFirstPlay: boolean;
  isOwnGame: boolean;
  rpAwarded: number;
  error?: string;
};

export default function PlayGame({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params);
  const gameId = resolvedParams.id;

  const [game, setGame] = useState<any>(null);
  const [user, setUser] = useState<any>(null);
  const [rankings, setRankings] = useState<any[]>([]);
  const [isPlaying, setIsPlaying] = useState(false);
  const [result, setResult] = useState<ResultState | null>(null);

  const [isLiked, setIsLiked] = useState(false);
  const [likeCount, setLikeCount] = useState(0);
  const [rankingTab, setRankingTab] = useState<"daily" | "weekly" | "monthly" | "all">("all");

  const lastSavedTimeRef = useRef(0);

  const [showInterstitial, setShowInterstitial] = useState(false);
  const [adCountdown, setAdCountdown] = useState(3);

  const normalizeId = (value: any) => {
    return String(value || "").trim().toLowerCase();
  };

  const normalizeName = (value: any) => {
    return String(value || "").trim();
  };

  const fetchRankings = async (tab = rankingTab) => {
    let query = supabase
      .from("play_logs")
      .select("score, created_at, player_id, player_name")
      .eq("game_id", gameId)
      .order("score", { ascending: false })
      .limit(100);

    const now = new Date();

    if (tab === "daily") {
      const yesterday = new Date(now.getTime() - 24 * 60 * 60 * 1000);
      query = query.gte("created_at", yesterday.toISOString());
    } else if (tab === "weekly") {
      const lastWeek = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      query = query.gte("created_at", lastWeek.toISOString());
    } else if (tab === "monthly") {
      const lastMonth = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
      query = query.gte("created_at", lastMonth.toISOString());
    }

    const { data } = await query;

    if (data) {
      const uniqueRankings = [];
      const seenPlayers = new Set();

      for (const log of data) {
        if (!seenPlayers.has(log.player_id)) {
          seenPlayers.add(log.player_id);
          uniqueRankings.push(log);
          if (uniqueRankings.length === 10) break;
        }
      }

      setRankings(uniqueRankings);
    }
  };

  useEffect(() => {
    const fetchGameAndUser = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      const currentUser = session?.user || null;
      setUser(currentUser);

      const { data: gameData } = await supabase
        .from("games")
        .select("*")
        .eq("id", gameId)
        .single();

      setGame(gameData);

      if (gameData) {
        setLikeCount(gameData.likes || 0);
      }

      if (currentUser && gameData) {
        const { data: likeData } = await supabase
          .from("game_likes")
          .select("*")
          .eq("game_id", gameId)
          .eq("user_id", currentUser.id)
          .maybeSingle();

        if (likeData) setIsLiked(true);
      }

      fetchRankings();
    };

    fetchGameAndUser();
  }, [gameId]);

  useEffect(() => {
    fetchRankings(rankingTab);
  }, [rankingTab]);

  const toggleLike = async () => {
    if (!user) {
      alert("「いいね」するにはログインが必要です！");
      return;
    }

    if (isLiked) {
      setIsLiked(false);
      setLikeCount((prev) => Math.max(0, prev - 1));

      await supabase
        .from("game_likes")
        .delete()
        .eq("game_id", gameId)
        .eq("user_id", user.id);

      await supabase
        .from("games")
        .update({ likes: Math.max(0, likeCount - 1) })
        .eq("id", gameId);
    } else {
      setIsLiked(true);
      setLikeCount((prev) => prev + 1);

      await supabase
        .from("game_likes")
        .insert([{ game_id: gameId, user_id: user.id }]);

      await supabase
        .from("games")
        .update({ likes: likeCount + 1 })
        .eq("id", gameId);
    }
  };

  const handlePlayClick = () => {
    setShowInterstitial(true);
    setAdCountdown(3);

    let count = 3;

    const timer = setInterval(() => {
      count -= 1;
      setAdCountdown(count);

      if (count <= 0) {
        clearInterval(timer);
        setShowInterstitial(false);
        setIsPlaying(true);
      }
    }, 1000);
  };

  const awardFirstPlayRp = async () => {
    if (!user) return 0;

    const { data: pointData, error: pointFetchError } = await supabase
      .from("user_points")
      .select("rank_points")
      .eq("user_id", user.id)
      .maybeSingle();

    if (pointFetchError) throw pointFetchError;

    const currentRankPoints = pointData?.rank_points ?? 0;
    const nextRankPoints = currentRankPoints + 5;

    if (pointData) {
      const { error: updateError } = await supabase
        .from("user_points")
        .update({ rank_points: nextRankPoints })
        .eq("user_id", user.id);

      if (updateError) throw updateError;
    } else {
      const { error: insertError } = await supabase
        .from("user_points")
        .insert([
          {
            user_id: user.id,
            total_points: 0,
            rank_points: 5,
            withdrawable_yen: 0,
            wallet_balance: 0,
            is_banned: false,
            creator_rank: "Standard",
          },
        ]);

      if (insertError) throw insertError;
    }

    return 5;
  };

  useEffect(() => {
    const handleMessage = async (event: MessageEvent) => {
      if (!event.data || event.data.type !== "GAME_OVER") return;

      const score = Number(event.data.score || 0);
      const now = Date.now();

      if (now - lastSavedTimeRef.current < 3000) return;
      lastSavedTimeRef.current = now;

      setResult({
        show: true,
        score,
        detailsLoaded: false,
        isHighScore: false,
        isFirstPlay: false,
        isOwnGame: false,
        rpAwarded: 0,
      });

      if (!user) {
        setResult((prev) => (prev ? { ...prev, detailsLoaded: true } : null));
        return;
      }

      try {
        const playerName = user.user_metadata?.username || "名無しプレイヤー";

        const { data: latestGameData, error: latestGameError } = await supabase
          .from("games")
          .select("id, user_id, creator_name")
          .eq("id", gameId)
          .single();

        if (latestGameError) throw latestGameError;

        const currentUserId = normalizeId(user.id);
        const gameOwnerId = normalizeId(latestGameData?.user_id || game?.user_id);
        const currentUserName = normalizeName(user.user_metadata?.username);
        const gameCreatorName = normalizeName(latestGameData?.creator_name || game?.creator_name);

        const isOwnGame =
          (gameOwnerId !== "" && gameOwnerId === currentUserId) ||
          (gameOwnerId === "" && currentUserName !== "" && currentUserName === gameCreatorName);

        const { data: existingLogs, error: logFetchError } = await supabase
          .from("play_logs")
          .select("*")
          .eq("game_id", gameId)
          .eq("player_id", user.id)
          .order("score", { ascending: false })
          .limit(1);

        if (logFetchError) throw logFetchError;

        const existingLog = existingLogs?.[0] || null;

        let isFirstPlay = false;
        let isHighScore = false;
        let rpAwarded = 0;

        if (!existingLog) {
          isFirstPlay = true;
          isHighScore = true;

          const { error: insertLogError } = await supabase
            .from("play_logs")
            .insert([
              {
                game_id: gameId,
                player_id: user.id,
                player_name: playerName,
                score,
              },
            ]);

          if (insertLogError) throw insertLogError;

          if (!isOwnGame) {
            rpAwarded = await awardFirstPlayRp();
          }
        } else if (score > existingLog.score) {
          isHighScore = true;

          const { error: updateLogError } = await supabase
            .from("play_logs")
            .update({
              score,
              player_name: playerName,
              created_at: new Date().toISOString(),
            })
            .eq("id", existingLog.id)
            .eq("player_id", user.id);

          if (updateLogError) throw updateLogError;
        }

        setResult((prev) =>
          prev
            ? {
                ...prev,
                detailsLoaded: true,
                isFirstPlay,
                isHighScore,
                isOwnGame,
                rpAwarded,
              }
            : null
        );

        fetchRankings();
      } catch (error: any) {
        setResult((prev) =>
          prev
            ? {
                ...prev,
                detailsLoaded: true,
                error: error?.message || "保存に失敗しました。",
              }
            : null
        );
      }
    };

    window.addEventListener("message", handleMessage);
    return () => window.removeEventListener("message", handleMessage);
  }, [gameId, user, game, rankingTab]);

  if (!game) {
    return (
      <div className="min-h-screen flex items-center justify-center font-bold text-xl">
        読み込み中...🚀
      </div>
    );
  }

  return (
    <main className="min-h-screen px-3 md:px-6 py-6 md:py-12 max-w-5xl mx-auto font-sans relative">
      <Header title={game.title} />

      <div className="mb-6 p-4 bg-white/70 rounded-2xl md:rounded-3xl border-4 border-black flex flex-col md:flex-row md:items-center md:justify-between gap-3">
        <div className="w-full">
          <h1 className="text-2xl md:text-4xl font-black mb-1">{game.title}</h1>

          <div className="flex items-center justify-between md:justify-start md:gap-6 w-full">
            <p className="text-sm md:text-lg font-bold text-gray-600 flex items-center gap-1">
              <span className="text-base md:text-xl">👤</span>
              <span>クリエイター: </span>
              <span className="text-black font-black">{game.creator_name}</span>
            </p>

            <button
              onClick={toggleLike}
              className="flex md:hidden items-center gap-1.5 px-3 py-1 bg-white border-2 border-black rounded-lg font-black text-sm active:scale-95 transition-all shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]"
            >
              <span className={isLiked ? "text-pink-500" : "grayscale"}>❤️</span>
              <span>{likeCount}</span>
            </button>
          </div>
        </div>

        <button
          onClick={toggleLike}
          className="hidden md:flex items-center justify-center gap-2 px-6 py-3 rounded-2xl border-4 border-black font-black text-xl bg-white text-gray-800 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-none active:scale-95 transition-all"
        >
          <span className={`text-3xl transition-transform ${isLiked ? "scale-110 text-pink-500" : "grayscale"}`}>❤️</span>
          <span>{likeCount}</span>
        </button>
      </div>

      <div className="bg-white border-4 border-black p-2 md:p-6 rounded-2xl shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] mb-8 relative">
        <div className="w-full aspect-[4/3] md:aspect-video border-4 border-black rounded-xl overflow-hidden bg-black relative min-h-[420px] md:min-h-[450px]">
          {isPlaying && (
            <iframe
              srcDoc={game.code}
              className={`w-full h-full border-none absolute inset-0 overflow-hidden transition-opacity ${
                result?.show ? "opacity-10 pointer-events-none" : "opacity-100"
              }`}
              sandbox="allow-scripts allow-same-origin allow-popups"
              scrolling="no"
            />
          )}

          {showInterstitial && (
            <div className="absolute inset-0 bg-[#E5E5E5] z-30 flex flex-col items-center justify-center p-4">
              <span className="absolute top-2 left-2 bg-white px-2 py-0.5 text-xs font-bold border-2 border-black rounded shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
                広告
              </span>
              <div className="w-4/5 h-1/2 border-4 border-dashed border-gray-400 rounded-xl bg-white flex flex-col items-center justify-center text-gray-400 font-bold mb-4">
                <span className="text-4xl md:text-6xl mb-2">📺</span>
                <p className="text-sm md:text-xl">スポンサーリンク</p>
              </div>
              <p className="font-black text-base md:text-xl mb-2 text-gray-800 text-center">
                ゲーム開始まであと <span className="text-2xl md:text-3xl text-black">{adCountdown}</span> 秒...
              </p>
            </div>
          )}

          {!isPlaying && !showInterstitial && (
            <div className="absolute inset-0 bg-[#FFFDF0] flex flex-col items-center justify-center z-10 p-6 overflow-hidden">
              <div className="bg-white px-6 py-3 border-4 md:border-8 border-black rounded-2xl md:rounded-3xl shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] md:shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] transform -rotate-2 mb-8 md:mb-12 text-center max-w-[90%] truncate">
                <h2 className="text-xl md:text-4xl font-black text-black truncate">{game.title}</h2>
              </div>
              <button
                onClick={handlePlayClick}
                className="bg-[#FFEF5E] border-4 md:border-8 border-black px-8 py-4 md:px-12 md:py-6 rounded-2xl md:rounded-3xl font-black text-2xl md:text-4xl text-black shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] md:shadow-[12px_12px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[4px] hover:translate-y-[4px] hover:shadow-none active:bg-yellow-400 transition-all cursor-pointer"
              >
                プレイ！
              </button>
            </div>
          )}

          {result?.show && (
            <div className="absolute inset-0 z-20 flex items-center justify-center p-3 bg-black/60 backdrop-blur-sm transition-all animate-fade-in">
              <div className="bg-white border-6 border-black p-4 md:p-8 rounded-2xl md:rounded-3xl shadow-[8px_8px_0px_0px_rgba(255,239,94,1)] text-center max-w-sm w-full max-h-[95%] overflow-y-auto hide-scrollbar">
                <h2 className="text-xl md:text-2xl font-black mb-3 tracking-widest text-black">GAME OVER</h2>

                <div className="bg-gray-100 border-4 border-black rounded-xl p-3 md:p-5 mb-4">
                  <p className="text-xs font-bold text-gray-600 mb-0.5">今回のスコア</p>
                  <p className="text-3xl md:text-5xl font-black text-black">{result.score.toLocaleString()}</p>
                </div>

                {!result.detailsLoaded && (
                  <p className="text-sm font-bold text-gray-600 mb-4 flex items-center justify-center gap-2">
                    <span className="animate-spin text-lg">⏳</span> 記録を保存中...
                  </p>
                )}

                {result.error && (
                  <p className="text-xs font-bold text-red-500 mb-4 border-2 border-red-500 p-2 rounded-lg">
                    保存エラー: {result.error}
                  </p>
                )}

                {result.detailsLoaded && !result.error && (
                  <div className="space-y-3 mb-5">
                    {result.rpAwarded > 0 && (
                      <div className="bg-[#FFEF5E] border-4 border-black text-black font-black py-2 px-4 rounded-xl shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] transform -rotate-1 text-sm">
                        <p className="text-xs mb-0.5">🎉 初プレイ報酬ゲット！</p>
                        <p className="text-lg tracking-widest">💰 +5 RP</p>
                      </div>
                    )}

                    {result.isHighScore && !result.isFirstPlay && (
                      <div className="bg-orange-100 border-4 border-orange-500 text-orange-600 font-black text-sm py-1.5 px-3 rounded-xl inline-block transform rotate-1 shadow-[3px_3px_0px_0px_rgba(249,115,22,1)]">
                        🔥 自己ベスト更新！
                      </div>
                    )}

                    {user && result.isFirstPlay && result.isOwnGame && (
                      <p className="text-xs font-bold text-gray-700 border-2 border-black p-2 rounded-lg mt-2 bg-gray-100">
                        自分のゲームのため、RP報酬は対象外です。
                      </p>
                    )}

                    {user && !result.isFirstPlay && !result.isHighScore && (
                      <p className="text-xs font-bold text-gray-700 border-2 border-black p-2 rounded-lg mt-2 bg-gray-100">
                        プレイ記録は保存済みです。初回プレイ報酬は1ゲームにつき1回だけです。
                      </p>
                    )}

                    {!user && (
                      <p className="text-xs font-bold text-red-500 border-2 border-red-500 p-2 rounded-lg mt-2">
                        ※ログインしていないため記録されません
                      </p>
                    )}
                  </div>
                )}

                <button
                  onClick={() => {
                    setResult(null);
                    setIsPlaying(false);
                    handlePlayClick();
                  }}
                  className="w-full bg-black text-white border-4 border-black px-4 py-2.5 text-lg font-black rounded-xl shadow-[4px_4px_0px_0px_rgba(255,239,94,1)] hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-none transition-all active:bg-gray-800"
                >
                  もう一度遊ぶ 🔄
                </button>
              </div>
            </div>
          )}
        </div>

        <div className="bg-[#FFFDF0] border-4 border-black p-4 rounded-xl w-full">
          <p className="font-bold text-sm md:text-base whitespace-pre-wrap text-gray-800 leading-relaxed">
            {game.description || "説明はありません。"}
          </p>
        </div>
      </div>

      <div className="max-w-3xl mx-auto w-full">
        <div className="inline-block border-b-4 border-black pb-1 mb-4">
          <h2 className="text-xl md:text-3xl font-black flex items-center gap-2">🏆 スコアランキング</h2>
        </div>

        <div className="flex gap-2 mb-4 overflow-x-auto pb-2 hide-scrollbar">
          <button
            onClick={() => setRankingTab("daily")}
            className={`px-4 py-1.5 rounded-lg border-2 md:border-4 border-black font-black text-xs md:text-sm whitespace-nowrap transition-all shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:translate-y-0.5 hover:shadow-none ${
              rankingTab === "daily" ? "bg-black text-white shadow-none translate-y-0.5" : "bg-white"
            }`}
          >
            🔥 デイリー
          </button>

          <button
            onClick={() => setRankingTab("weekly")}
            className={`px-4 py-1.5 rounded-lg border-2 md:border-4 border-black font-black text-xs md:text-sm whitespace-nowrap transition-all shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:translate-y-0.5 hover:shadow-none ${
              rankingTab === "weekly" ? "bg-black text-white shadow-none translate-y-0.5" : "bg-white"
            }`}
          >
            📅 ウィークリー
          </button>

          <button
            onClick={() => setRankingTab("monthly")}
            className={`px-4 py-1.5 rounded-lg border-2 md:border-4 border-black font-black text-xs md:text-sm whitespace-nowrap transition-all shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:translate-y-0.5 hover:shadow-none ${
              rankingTab === "monthly" ? "bg-black text-white shadow-none translate-y-0.5" : "bg-white"
            }`}
          >
            🌙 マンスリー
          </button>

          <button
            onClick={() => setRankingTab("all")}
            className={`px-4 py-1.5 rounded-lg border-2 md:border-4 border-black font-black text-xs md:text-sm whitespace-nowrap transition-all shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:translate-y-0.5 hover:shadow-none ${
              rankingTab === "all" ? "bg-black text-white shadow-none translate-y-0.5" : "bg-white"
            }`}
          >
            👑 歴代すべて
          </button>
        </div>

        <div className="bg-[#FFEF5E] border-4 border-black p-4 md:p-8 rounded-2xl shadow-[6px_6px_0px_0px_rgba(0,0,0,1)]">
          <div className="space-y-3">
            {rankings.length > 0 ? (
              rankings.map((rank, index) => (
                <div
                  key={index}
                  className={`flex items-center justify-between p-3 md:p-4 border-2 md:border-4 border-black rounded-xl font-bold bg-white shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] ${
                    index === 0 ? "text-lg md:text-xl" : "text-sm md:text-base"
                  }`}
                >
                  <div className="flex items-center gap-2 md:gap-4">
                    <span
                      className={`w-7 h-7 md:w-9 md:h-9 flex items-center justify-center rounded-full border-2 md:border-4 border-black font-black text-xs md:text-sm ${
                        index === 0
                          ? "bg-yellow-400 text-base"
                          : index === 1
                          ? "bg-gray-300"
                          : index === 2
                          ? "bg-orange-300"
                          : "bg-white"
                      }`}
                    >
                      {index + 1}
                    </span>
                    <span className="truncate max-w-[120px] sm:max-w-[250px]">
                      {rank.player_id === user?.id ? "YOU (あなた) 👤" : rank.player_name || "名無しプレイヤー"}
                    </span>
                  </div>

                  <div className="text-lg md:text-2xl font-black">
                    {rank.score.toLocaleString()} <span className="text-xs md:text-sm font-bold">スコア</span>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-8 border-4 border-dashed border-black/20 rounded-xl bg-white/50">
                <p className="font-bold text-gray-600 text-sm md:text-base">
                  この期間の記録はありません。
                  <br />
                  最初の王者は君だ！👑
                </p>
              </div>
            )}
          </div>
        </div>
      </div>

      <style
        dangerouslySetInnerHTML={{
          __html:
            ".hide-scrollbar::-webkit-scrollbar { display: none; } .hide-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }",
        }}
      />
    </main>
  );
}