"use client";

import { useEffect, useState, use, useRef } from "react";
import { supabase } from "@/app/utils/supabase";
import Header from "@/app/components/Header";
import Link from "next/link";
import Script from "next/script"; // 💡 新設：Google AdSenseスクリプトを安全に非同期読み込みするためのNext.js公式コンポーネント

type ResultState = {
  show: boolean;
  score: number;
  detailsLoaded: boolean;
  isHighScore: boolean;
  isFirstPlay: boolean;
  error?: string;
}

// 💡 【新設】Google AdSense広告を厳密に初期化・レンダリングするための本番用内部コンポーネント
// SPAの画面切り替えに対応するため、コンポーネントが画面にマウントされた瞬間に一度だけ自動で push({}) を実行します。
function AdSenseUnit({ slotId }: { slotId: string }) {
  useEffect(() => {
    try {
      // 既存の広告との衝突を防ぎ、 adsbygoogle 配列に安全に広告登録をプッシュ
      const adsbygoogle = (window as any).adsbygoogle || [];
      adsbygoogle.push({});
    } catch (e) {
      console.error("Google AdSenseのレンダリングに失敗しました:", e);
    }
  }, [slotId]);

  // プロデューサーのパブリッシャーID（ca-pub-xxx）が環境変数にない場合は、コードを直接書き換えるかVercelで設定可能です
  const publisherId = process.env.NEXT_PUBLIC_ADSENSE_PUBLISHER_ID || "ca-pub-XXXXXXXXXXXXXXXX";

  return (
    <div className="w-full h-full flex items-center justify-center overflow-hidden">
      <ins className="adsbygoogle"
           style={{ display: "block", width: "100%", height: "100%", minWidth: "250px", minHeight: "250px" }}
           data-ad-client={publisherId}
           data-ad-slot={slotId}
           data-ad-format="auto"
           data-full-width-responsive="true"></ins>
    </div>
  );
}

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
  const [rewardStatus, setRewardStatus] = useState<"idle" | "playing" | "claimed">("idle");

  const fetchRankings = async (tab = rankingTab) => {
    let query = supabase
      .from("play_logs")
      .select(`score, created_at, player_id, player_name`)
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

      const { data: gameData } = await supabase.from("games").select("*").eq("id", gameId).single();
      setGame(gameData);
      if (gameData) setLikeCount(gameData.likes || 0);

      if (currentUser && gameData) {
        const { data: likeData } = await supabase.from("game_likes").select("*").eq("game_id", gameId).eq("user_id", currentUser.id).single();
        if (likeData) setIsLiked(true);
      }
      fetchRankings();
    };
    fetchGameAndUser();
  }, [gameId]);

  useEffect(() => { fetchRankings(rankingTab); }, [rankingTab]);

  const toggleLike = async () => {
    if (!user) { alert("「いいね」するにはログインが必要です！"); return; }
    if (isLiked) {
      setIsLiked(false); setLikeCount(prev => prev - 1);
      await supabase.from("game_likes").delete().eq("game_id", gameId).eq("user_id", user.id);
      await supabase.from("games").update({ likes: likeCount - 1 }).eq("id", gameId);
    } else {
      setIsLiked(true); setLikeCount(prev => prev + 1);
      await supabase.from("game_likes").insert([{ game_id: gameId, user_id: user.id }]);
      await supabase.from("games").update({ likes: likeCount + 1 }).eq("id", gameId);
    }
  };

  const handlePlayClick = () => {
    setShowInterstitial(true);
    setAdCountdown(3);
    let count = 3;
    
    const timer = setInterval(async () => {
      count -= 1;
      setAdCountdown(count);
      if (count <= 0) {
        clearInterval(timer);
        setShowInterstitial(false);
        setIsPlaying(true);
        setRewardStatus("idle");

        // 収益検知システム：広告のカウントダウン（表示）が正常に完了したため、プレイ回数を安全に+1（変更なし）
        try {
          const { data: currentPlay } = await supabase.from('games').select('period_play_count').eq('id', gameId).single();
          await supabase.from('games').update({ period_play_count: (currentPlay?.period_play_count || 0) + 1 }).eq('id', gameId);
        } catch (e) {
          console.error("プレイカウントの記録に失敗しました:", e);
        }
      }
    }, 1000);
  };

  const watchRewardAd = () => {
    setRewardStatus("playing");
    setTimeout(async () => {
      if (user) {
        const { data: pointData, error: pointFetchError } = await supabase.from('user_points').select('total_points').eq('user_id', user.id).single();
        if (pointFetchError) {
          alert(`ポイントデータ取得エラー: ${pointFetchError.message}`);
          setRewardStatus("idle");
          return;
        }
        if (pointData) {
          const { error: pointUpdateError } = await supabase.from('user_points').update({ total_points: pointData.total_points + 10 }).eq('user_id', user.id);
          if (pointUpdateError) {
            alert(`ポイント付与エラー: ${pointUpdateError.message}`);
            setRewardStatus("idle");
            return;
          }
        }
      }
      setRewardStatus("claimed");
    }, 3000);
  };

  useEffect(() => {
    const handleMessage = async (event: MessageEvent) => {
      if (event.data && event.data.type === 'GAME_OVER') {
        const score = event.data.score || 0;
        const now = Date.now();
        if (now - lastSavedTimeRef.current < 3000) return;
        lastSavedTimeRef.current = now; 

        setResult({ show: true, score, detailsLoaded: false, isHighScore: false, isFirstPlay: false });

        if (user) {
          try {
            const { data: highestLog, error: selectError } = await supabase
              .from('play_logs')
              .select('score')
              .eq('game_id', gameId)
              .eq('player_id', user.id)
              .order('score', { ascending: false })
              .limit(1)
              .maybeSingle();
            
            if (selectError) throw new Error(`[データ確認失敗] ${selectError.message}`);

            let isFirstPlay = false; 
            let isHighScore = false;

            if (!highestLog) {
              isFirstPlay = true; 
              isHighScore = true;
            } else if (score > highestLog.score) {
              isHighScore = true;
            }

            const playerName = user.user_metadata?.username || "名無しプレイヤー";
            const { error: insertLogError } = await supabase
              .from('play_logs')
              .insert([{ game_id: gameId, player_id: user.id, player_name: playerName, score: score }]);
            
            if (insertLogError) throw new Error(`[ランキング登録失敗] ${insertLogError.message}`);
            
            if (isFirstPlay) {
              const { data: pointData, error: pointSelectError } = await supabase
                .from('user_points')
                .select('total_points')
                .eq('user_id', user.id)
                .maybeSingle();
                
              if (pointSelectError) throw new Error(`[ポイント確認失敗] ${pointSelectError.message}`);
              
              if (pointData) { 
                const { error: pointUpdateError } = await supabase
                  .from('user_points').update({ total_points: pointData.total_points + 5 }).eq('user_id', user.id);
                if (pointUpdateError) throw new Error(`[ポイント更新失敗] ${pointUpdateError.message}`);
              } else { 
                const { error: pointInsertError } = await supabase
                  .from('user_points').insert([{ user_id: user.id, total_points: 5 }]); 
                if (pointInsertError) throw new Error(`[ポイント新規作成失敗] ${pointInsertError.message}`);
              }
            }

            setResult(prev => prev ? { ...prev, detailsLoaded: true, isFirstPlay, isHighScore } : null);
            fetchRankings(); 
          } catch (error: any) { 
            setResult(prev => prev ? { ...prev, detailsLoaded: true, error: error.message } : null); 
          }
        } else {
          setResult(prev => prev ? { ...prev, detailsLoaded: true } : null);
        }
      }
    };
    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, [gameId, user, likeCount, rankingTab]);

  if (!game) return <div className="min-h-screen flex items-center justify-center font-bold text-xl">読み込み中...🚀</div>;

  // 各画面用のGoogle AdSenseスロットID（Vercelの環境変数から安全に読み込みます）
  const interstitialSlot = process.env.NEXT_PUBLIC_ADSENSE_INTERSTITIAL_SLOT_ID || "1234567890";
  const rewardSlot = process.env.NEXT_PUBLIC_ADSENSE_REWARD_SLOT_ID || "0987654321";
  const clientPubId = process.env.NEXT_PUBLIC_ADSENSE_PUBLISHER_ID || "ca-pub-XXXXXXXXXXXXXXXX";

  return (
    <main className="min-h-screen px-3 md:px-6 py-6 md:py-12 max-w-5xl mx-auto font-sans relative">
      {/* 💡 【最重要】Google AdSense の公式メインスクリプトを、ドメイン全体に対して非同期で安全に読み込み起動 */}
      <Script 
        async 
        src={`https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${clientPubId}`}
        crossOrigin="anonymous"
        strategy="afterInteractive"
      />

      <Header title={game.title} />

      <div className="mb-6 p-4 bg-white/70 rounded-2xl md:rounded-3xl border-4 border-black flex flex-col md:flex-row md:items-center md:justify-between gap-3">
        <div className="w-full">
          <h1 className="text-2xl md:text-4xl font-black mb-1">{game.title}</h1>
          <div className="flex items-center justify-between md:justify-start md:gap-6 w-full">
            <p className="text-sm md:text-lg font-bold text-gray-600 flex items-center gap-1">
              <span className="text-base md:text-xl">👤</span> <span>クリエイター: </span>
              <Link href={`/user/${game.user_id}`} className="text-black font-black hover:bg-[#FFEF5E] hover:underline underline-offset-2 px-1 rounded transition-colors">
                {game.creator_name}
              </Link>
            </p>
            <button onClick={toggleLike} className="flex md:hidden items-center gap-1.5 px-3 py-1 bg-white border-2 border-black rounded-lg font-black text-sm active:scale-95 transition-all shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
              <span className={isLiked ? 'text-pink-500' : 'grayscale'}>❤️</span> <span>{likeCount}</span>
            </button>
          </div>
        </div>
        <button onClick={toggleLike} className="hidden md:flex items-center justify-center gap-2 px-6 py-3 rounded-2xl border-4 border-black font-black text-xl bg-white text-gray-800 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-none active:scale-95 transition-all">
          <span className={`text-3xl transition-transform ${isLiked ? 'scale-110 text-pink-500' : 'grayscale'}`}>❤️</span> <span>{likeCount}</span>
        </button>
      </div>

      <div className="bg-white border-4 border-black p-2 md:p-6 rounded-2xl shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] mb-8 relative">
        <div className="w-full aspect-[4/3] md:aspect-video border-4 border-black rounded-xl overflow-hidden bg-black relative min-h-[420px] md:min-h-[450px]">
          {isPlaying && (
            <iframe srcDoc={game.code} className="w-full h-full border-none absolute inset-0 overflow-hidden" sandbox="allow-scripts" scrolling="no" />
          )}

          {/* 💡 プレイ前の3秒カウントダウン画面（本物のGoogle AdSenseユニットを埋め込み） */}
          {showInterstitial && (
            <div className="absolute inset-0 bg-[#E5E5E5] z-30 flex flex-col items-center justify-center p-4">
              <span className="absolute top-2 left-2 bg-white px-2 py-0.5 text-xs font-bold border-2 border-black rounded shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">広告</span>
              
              {/* プロデューサーのデザイン枠（dashed）を完全維持したまま、内部に本物の広告インラインオブジェクトを展開 */}
              <div className="w-4/5 h-1/2 border-4 border-dashed border-gray-400 rounded-xl bg-white overflow-hidden p-2">
                <AdSenseUnit slotId={interstitialSlot} />
              </div>
              
              <p className="font-black text-base md:text-xl mt-4 mb-2 text-gray-800 text-center">ゲーム開始まであと <span className="text-2xl md:text-3xl text-black">{adCountdown}</span> 秒...</p>
            </div>
          )}

          {!isPlaying && !showInterstitial && (
            <div className="absolute inset-0 bg-[#FFFDF0] flex flex-col items-center justify-center z-10 p-6 overflow-hidden">
              <div className="bg-white px-6 py-3 border-4 md:border-8 border-black rounded-2xl md:rounded-3xl shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] md:shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] transform -rotate-2 mb-8 md:mb-12 text-center max-w-[90%] truncate">
                <h2 className="text-xl md:text-4xl font-black text-black truncate">{game.title}</h2>
              </div>
              <button onClick={handlePlayClick} className="bg-[#FFEF5E] border-4 md:border-8 border-black px-8 py-4 md:px-12 md:py-6 rounded-2xl md:rounded-3xl font-black text-2xl md:text-4xl text-black shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] md:shadow-[12px_12px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[4px] hover:translate-y-[4px] hover:shadow-none transition-all cursor-pointer">
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
                {!result.detailsLoaded && <p className="text-sm font-bold text-gray-600 mb-4 flex items-center justify-center gap-2"><span className="animate-spin text-lg">⏳</span> 記録を保存中...</p>}
                {result.error && <p className="text-xs font-bold text-red-500 mb-4 border-2 border-red-500 p-2 rounded-lg break-all">保存エラー: {result.error}</p>}
                {result.detailsLoaded && !result.error && (
                  <div className="space-y-3 mb-5">
                    {result.isFirstPlay && (
                      <div className="bg-[#FFEF5E] border-4 border-black text-black font-black py-2 px-4 rounded-xl shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] transform -rotate-1 text-sm">
                        <p className="text-xs mb-0.5">🎉 初プレイ報酬ゲット！</p> <p className="text-lg tracking-widest">💰 +5 RP</p>
                      </div>
                    )}
                    {result.isHighScore && (
                      <div className="bg-orange-100 border-4 border-orange-500 text-orange-600 font-black text-sm py-1.5 px-3 rounded-xl inline-block transform rotate-1 shadow-[3px_3px_0px_0px_rgba(249,115,22,1)]">
                        🔥 自己ベスト更新！
                      </div>
                    )}
                    
                    {/* 💡 結果画面内の追加ボーナス広告枠（ダミーテキストを本物のAdSense要素へ完全に置換） */}
                    {user && rewardStatus === "idle" && (
                      <div className="space-y-2 mt-2">
                        <div className="w-full h-32 border-2 border-dashed border-gray-300 rounded-lg bg-gray-50 overflow-hidden">
                          <AdSenseUnit slotId={rewardSlot} />
                        </div>
                        <button onClick={watchRewardAd} className="w-full bg-blue-50 border-4 border-blue-500 text-blue-700 p-2.5 rounded-xl font-black text-sm hover:bg-blue-100 shadow-[3px_3px_0px_0px_rgba(59,130,246,1)] animate-bounce">
                          <span className="text-lg mr-1">📺</span>上のバナーを確認して <span className="text-blue-900">さらに +10 RP GET！</span>
                        </button>
                      </div>
                    )}
                    {user && rewardStatus === "playing" && (
                      <div className="w-full bg-gray-800 text-white border-4 border-black p-2.5 rounded-xl font-bold text-sm mt-2">
                        <span className="animate-spin inline-block mr-1">⏳</span> 認証情報を処理中...
                      </div>
                    )}
                    {user && rewardStatus === "claimed" && (
                      <div className="w-full bg-green-100 border-4 border-green-500 text-green-700 p-2.5 rounded-xl font-black text-sm mt-2 shadow-[3px_3px_0px_0px_rgba(34,197,94,1)]">
                        ✨ ボーナス 10 RP 獲得！ ✨
                      </div>
                    )}
                    {!user && <p className="text-xs font-bold text-red-500 border-2 border-red-500 p-2 rounded-lg mt-2">※ログインしていないため記録されません</p>}
                  </div>
                )}
                <button onClick={() => { setResult(null); setIsPlaying(false); handlePlayClick(); }} className="w-full bg-black text-white border-4 border-black px-4 py-2.5 text-lg font-black rounded-xl shadow-[4px_4px_0px_0px_rgba(255,239,94,1)] hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-none transition-all active:bg-gray-800">
                  もう一度遊ぶ 🔄
                </button>
              </div>
            </div>
          )}
        </div>
        <div className="bg-[#FFFDF0] border-4 border-black p-4 rounded-xl w-full">
          <p className="font-bold text-sm md:text-base whitespace-pre-wrap text-gray-800 leading-relaxed">{game.description || "説明はありません。"}</p>
        </div>
      </div>

      <div className="max-w-3xl mx-auto w-full">
        <div className="inline-block border-b-4 border-black pb-1 mb-4">
          <h2 className="text-xl md:text-3xl font-black flex items-center gap-2">🏆 スコアランキング</h2>
        </div>
        <div className="flex gap-2 mb-4 overflow-x-auto pb-2 hide-scrollbar">
          <button onClick={() => setRankingTab("daily")} className={`px-4 py-1.5 rounded-lg border-2 md:border-4 border-black font-black text-xs md:text-sm whitespace-nowrap shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] ${rankingTab === 'daily' ? 'bg-black text-white shadow-none translate-y-0.5' : 'bg-white'}`}>🔥 デイリー</button>
          <button onClick={() => setRankingTab("weekly")} className={`px-4 py-1.5 rounded-lg border-2 md:border-4 border-black font-black text-xs md:text-sm whitespace-nowrap shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] ${rankingTab === 'weekly' ? 'bg-black text-white shadow-none translate-y-0.5' : 'bg-white'}`}>📅 ウィークリー</button>
          <button onClick={() => setRankingTab("monthly")} className={`px-4 py-1.5 rounded-lg border-2 md:border-4 border-black font-black text-xs md:text-sm whitespace-nowrap shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] ${rankingTab === 'monthly' ? 'bg-black text-white shadow-none translate-y-0.5' : 'bg-white'}`}>🌙 マンスリー</button>
          <button onClick={() => setRankingTab("all")} className={`px-4 py-1.5 rounded-lg border-2 md:border-4 border-black font-black text-xs md:text-sm whitespace-nowrap shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] ${rankingTab === 'all' ? 'bg-black text-white shadow-none translate-y-0.5' : 'bg-white'}`}>👑 歴代すべて</button>
        </div>

        <div className="bg-[#FFEF5E] border-4 border-black p-4 md:p-8 rounded-2xl shadow-[6px_6px_0px_0px_rgba(0,0,0,1)]">
          <div className="space-y-3">
            {rankings.length > 0 ? (
              rankings.map((rank, index) => (
                <div key={index} className={`flex items-center justify-between p-3 md:p-4 border-2 md:border-4 border-black rounded-xl font-bold bg-white shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] ${index === 0 ? 'text-lg md:text-xl' : 'text-sm md:text-base'}`}>
                  <div className="flex items-center gap-2 md:gap-4">
                    <span className={`w-7 h-7 md:w-9 md:h-9 flex items-center justify-center rounded-full border-2 md:border-4 border-black font-black text-xs md:text-sm ${index === 0 ? 'bg-yellow-400 text-base' : index === 1 ? 'bg-gray-300' : index === 2 ? 'bg-orange-300' : 'bg-white'}`}>{index + 1}</span>
                    <span className="truncate max-w-[120px] sm:max-w-[250px]">{rank.player_id === user?.id ? "YOU (あなた) 👤" : (rank.player_name || "名無しプレイヤー")}</span>
                  </div>
                  <div className="text-lg md:text-2xl font-black">{rank.score.toLocaleString()} <span className="text-xs md:text-sm font-bold">スコア</span></div>
                </div>
              ))
            ) : (
              <div className="text-center py-8 border-4 border-dashed border-black/20 rounded-xl bg-white/50"><p className="font-bold text-gray-600 text-sm md:text-base">この期間の記録はありません。<br/>最初の王者は君だ！👑</p></div>
            )}
          </div>
        </div>
      </div>
      <style dangerouslySetInnerHTML={{__html: `.hide-scrollbar::-webkit-scrollbar { display: none; } .hide-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }`}} />
    </main>
  );
}