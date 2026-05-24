"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/app/utils/supabase";
import Header from "@/app/components/Header";
import Link from "next/link";
import { useRouter } from "next/navigation";

// 💡 運営実費コスト：銀行振込時に引かれる手数料（一律220円）
const BANK_TRANSFER_FEE = 220;

export default function MyPage() {
  const [user, setUser] = useState<any>(null);
  const [myGames, setMyGames] = useState<any[]>([]);
  const [recentPlays, setRecentPlays] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [rankPoints, setRankPoints] = useState(0);
  const [withdrawableYen, setWithdrawableYen] = useState(0);
  
  // 🌟 初期表示タブを "created" に変更（既存維持）
  const [activeTab, setActiveTab] = useState<"created" | "history" | "wallet">("created");
  const router = useRouter();

  // 🌟 プロフィール編集用のステート（既存維持）
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [newUsername, setNewUsername] = useState("");
  const [isUpdating, setIsUpdating] = useState(false);

  // 💡 【新設】出金申請フォーム用ステート（プランB画面内展開用）
  const [requestType, setRequestType] = useState<"bank" | "amazon">("amazon"); // 税務リスクが低く手数料無料のアマギフを初期選択に
  const [withdrawAmount, setWithdrawAmount] = useState<string>("");
  const [amazonEmail, setAmazonEmail] = useState<string>("");
  const [bankName, setBankName] = useState<string>("");
  const [branchName, setBranchName] = useState<string>("");
  const [accountType, setAccountType] = useState<string>("普通");
  const [accountNumber, setAccountNumber] = useState<string>("");
  const [accountName, setAccountName] = useState<string>("");
  const [submitting, setSubmitting] = useState<boolean>(false);

  const fetchUserData = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      router.push("/login");
      return;
    }
    setUser(session.user);
    setNewUsername(session.user.user_metadata?.username || "");

    // 💡 修正：画像仕様に完全準拠させるため、total_points と rank_points、および新しいウォレット残高をセレクト
    const { data: pointData } = await supabase
      .from("user_points")
      .select("total_points, rank_points, wallet_balance")
      .eq("user_id", session.user.id)
      .maybeSingle();
    
    if (pointData) {
      // 画像にある「初回プレイ(5RP)なども合算した総経験値」でランクを正確に判定するため合算
      const combinedRp = (pointData.total_points || 0) + (pointData.rank_points || 0);
      setRankPoints(combinedRp);
      setWithdrawableYen(pointData.wallet_balance || 0);
    }

    const { data: games } = await supabase
      .from("games")
      .select("*")
      .eq("user_id", session.user.id)
      .order("created_at", { ascending: false });
    setMyGames(games || []);

    const { data: playLogs } = await supabase
      .from("play_logs")
      .select("score, created_at, games(*)")
      .eq("player_id", session.user.id)
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
            myBestScore: log.score,
            playedAt: log.created_at
          });
        }
      }
    }
    setRecentPlays(uniquePlayedGames);
    setLoading(false);
  };

  useEffect(() => {
    fetchUserData();
  }, [router]);

  // 🌟 プロフィール更新処理（既存維持）
  const handleUpdateProfile = async () => {
    if (!newUsername.trim()) return;
    setIsUpdating(true);
    const { data, error } = await supabase.auth.updateUser({
      data: { username: newUsername }
    });
    
    if (error) {
      alert("プロフィールの更新に失敗しました: " + error.message);
    } else {
      setUser(data.user);
      setIsEditingProfile(false);
      alert("プロフィールを更新しました！✨");
      await fetchUserData(); // ユーザー名変更を再反映
    }
    setIsUpdating(false);
  };

  // 💡 画像仕様・還元倍率に100%完全準拠したクリエイターランク自動計算
  const getRank = (points: number) => {
    if (points >= 10000) return { name: "レジェンド", lv: "MAX", color: "bg-yellow-400", rate: "60%" };
    if (points >= 5000) return { name: "マスター", lv: "5", color: "bg-purple-400", rate: "51%" };
    if (points >= 1000) return { name: "プラチナ", lv: "4", color: "bg-cyan-300", rate: "45%" };
    if (points >= 500) return { name: "ゴールド", lv: "3", color: "bg-yellow-300", rate: "39%" };
    if (points >= 100) return { name: "シルバー", lv: "2", color: "bg-gray-300", rate: "36%" };
    if (points >= 30) return { name: "ブロンズ", lv: "1", color: "bg-orange-300", rate: "30%" };
    return { name: "エッグ", lv: "0", color: "bg-gray-200", rate: "0% (ロック)" };
  };

  const rankInfo = getRank(rankPoints);

  // 💡 【新設】プランB：出金申請のサブミット処理（バリデーション＆運営黒字死守ロジック）
  const handleWithdrawSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    const parsedAmount = parseInt(withdrawAmount, 10);
    if (isNaN(parsedAmount) || parsedAmount <= 0) { alert("正しい出金金額を入力してください。"); return; }
    if (parsedAmount < 5000) { alert("出金は最低 5,000円 から申請可能です。"); return; }
    if (parsedAmount > withdrawableYen) { alert("ウォレットの残高が不足しています。"); return; }

    if (requestType === "amazon" && !amazonEmail.trim()) { alert("ギフト券の送付先メールアドレスを入力してください。"); return; }
    if (requestType === "bank" && (!bankName || !branchName || !accountNumber || !accountName)) { alert("銀行口座情報をすべて正確に入力してください。"); return; }

    setSubmitting(true);
    try {
      // A. 出金申請データを Supabase に安全にインサート
      const { error: insertError } = await supabase.from('withdrawal_requests').insert([{
        user_id: user.id,
        amount: parsedAmount,
        request_type: requestType,
        amazon_email: requestType === "amazon" ? amazonEmail : null,
        bank_name: requestType === "bank" ? bankName : null,
        branch_name: requestType === "bank" ? branchName : null,
        account_type: requestType === "bank" ? accountType : null,
        account_number: requestType === "bank" ? accountNumber : null,
        account_name: requestType === "bank" ? accountName : null,
        status: 'pending'
      }]);

      if (insertError) throw insertError;

      // B. ユーザーのウォレット残高から申請額をマイナス更新
      const { error: updateError } = await supabase
        .from('user_points')
        .update({ wallet_balance: withdrawableYen - parsedAmount })
        .eq('user_id', user.id);

      if (updateError) throw updateError;

      alert(requestType === "amazon" 
        ? `Amazonギフト券での出金申請が完了しました！✨\n審査後、${amazonEmail} 宛てに全額分のコードをお送りします。`
        : `銀行振込での出金申請が完了しました！💸\n振込手数料 ${BANK_TRANSFER_FEE}円 を差し引いた金額が指定口座へ振り込まれます。`
      );

      // フォームの初期化と再読み込み
      setWithdrawAmount("");
      await fetchUserData();
    } catch (err: any) {
      alert(`申請に失敗しました: ${err.message}`);
    } finally {
      setSubmitting(false);
    }
  };

  const renderMyGameCard = (game: any) => (
    <div key={`my-${game.id}`} className="w-full bg-white border-4 border-black p-2.5 md:p-4 rounded-xl md:rounded-2xl shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] md:shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] flex flex-col group">
      <Link href={`/play/${game.id}`} className="block relative aspect-video mb-2 md:mb-4 border-2 md:border-4 border-black rounded-lg md:rounded-xl overflow-hidden bg-black cursor-pointer">
        <div className="absolute w-[200%] h-[200%] origin-top-left scale-50 pointer-events-none">
          <iframe srcDoc={game.code} className="w-full h-full border-none" scrolling="no" tabIndex={-1} />
        </div>
        <div className="absolute inset-0 z-10 bg-transparent group-hover:bg-[#FFEF5E]/20 transition-all"></div>
      </Link>
      <h3 className="text-base md:text-xl font-black mb-1 md:mb-2 truncate text-black">{game.title}</h3>
      <div className="flex justify-between items-center text-xs md:text-sm font-bold text-gray-600 mb-3 md:mb-4">
        <span className="flex items-center gap-0.5 font-black text-black">❤️ {game.likes || 0}</span>
      </div>
      <div className="mt-auto flex flex-col gap-2">
        <Link href={`/edit/${game.id}`} className="w-full bg-[#FFEF5E] text-black border-2 md:border-4 border-black py-1.5 md:py-2 rounded-lg md:rounded-xl font-black text-xs md:text-sm text-center shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] md:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-none active:bg-yellow-400 transition-all cursor-pointer">
          ✏️ 編集する
        </Link>
      </div>
    </div>
  );

  const renderHistoryCard = (game: any) => (
    <div key={`hist-${game.id}`} className="w-full bg-white border-4 border-black p-2.5 md:p-4 rounded-xl md:rounded-2xl shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] md:shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] flex flex-col group">
      <Link href={`/play/${game.id}`} className="block relative aspect-video mb-2 md:mb-4 border-2 md:border-4 border-black rounded-lg md:rounded-xl overflow-hidden bg-black cursor-pointer">
        <div className="absolute w-[200%] h-[200%] origin-top-left scale-50 pointer-events-none">
          <iframe srcDoc={game.code} className="w-full h-full border-none" scrolling="no" tabIndex={-1} />
        </div>
        <div className="absolute inset-0 z-10 bg-transparent group-hover:bg-[#FFEF5E]/20 transition-all"></div>
      </Link>
      <h3 className="text-base md:text-xl font-black mb-1 md:mb-2 truncate text-black">{game.title}</h3>
      <div className="flex justify-between items-center text-xs md:text-sm font-bold text-gray-600 mb-3 md:mb-4 bg-gray-100 px-2 py-1 rounded-md border-2 border-gray-200">
        <span className="truncate">自己ベスト: <span className="text-black font-black">{game.myBestScore.toLocaleString()}</span></span>
      </div>
      <div className="mt-auto flex flex-col gap-2">
        <Link href={`/play/${game.id}`} className="w-full bg-black text-white border-2 md:border-4 border-black py-1.5 md:py-2 rounded-lg md:rounded-xl font-black text-xs md:text-sm text-center shadow-[2px_2px_0px_0px_rgba(156,163,175,1)] md:shadow-[4px_4px_0px_0px_rgba(156,163,175,1)] hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-none active:bg-gray-800 transition-all cursor-pointer">
          ▶ もう一度遊ぶ
        </Link>
      </div>
    </div>
  );

  const renderWallet = () => {
    const minWithdrawal = 5000; 
    const progressPercent = Math.min((withdrawableYen / minWithdrawal) * 100, 100);
    const isUnlocked = rankPoints >= 30; // ブロンズ以上で収益解放
    const canWithdraw = isUnlocked && withdrawableYen >= minWithdrawal;
    
    const nextUpdateDate = () => {
      const now = new Date();
      let year = now.getFullYear();
      let month = now.getMonth() + 1;
      if (now.getDate() >= 10) { month += 1; if (month > 12) { month = 1; year += 1; } }
      return `${year}年${month}月10日`;
    };

    const amtNum = parseInt(withdrawAmount, 10) || 0;
    const realBankPayout = amtNum > BANK_TRANSFER_FEE ? amtNum - BANK_TRANSFER_FEE : 0;

    return (
      <div className="space-y-8 max-w-3xl mx-auto">
        {/* 💡 既存の美しいウォレットメインカードを1ピクセルも崩さず維持 */}
        <div className="bg-white border-4 border-black p-6 md:p-10 rounded-2xl md:rounded-3xl shadow-[6px_6px_0px_0px_rgba(0,0,0,1)]">
          <h2 className="text-xl md:text-3xl font-black mb-6 border-b-4 border-black pb-2 flex items-center gap-2">
            <span>💰</span> 収益ウォレット
          </h2>
          {!isUnlocked ? (
            <div className="bg-red-50 border-4 border-dashed border-red-500 p-6 rounded-xl mb-8 text-center animate-pulse">
              <p className="text-xl font-black text-red-600 mb-2">🔒 収益化ロック中</p>
              <p className="text-sm font-bold text-gray-700 mb-4">
                あなたのゲームが他人に遊ばれて収益を発生させるには、まずあなたがゲームをプレイしてポイント（RP）を稼ぐ必要があります！
              </p>
              <div className="bg-white border-2 border-black inline-block px-4 py-2 rounded-lg font-black text-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
                現在の所持ポイント: {rankPoints} / 30 RP
              </div>
            </div>
          ) : (
            <div className="bg-green-50 border-4 border-black p-6 rounded-xl mb-8 text-center">
              <p className="text-sm md:text-base font-bold text-gray-500 mb-2">現在の確定済み出金可能残高</p>
              <div className="text-4xl md:text-6xl font-black text-black mb-2">
                ¥{withdrawableYen.toLocaleString()}
              </div>
              <p className="text-xs md:text-sm font-bold text-green-700 bg-green-100 inline-block px-3 py-1 rounded-md border-2 border-green-300">
                🎉 収益化解放中！ランクを上げてさらに還元率UP！📈 (現在の分配率: {rankInfo.rate})
              </p>
              <div className="mt-4 pt-4 border-t-2 border-dashed border-gray-300 text-xs font-bold text-gray-500 flex flex-col sm:flex-row items-center justify-center gap-2">
                <span>📅 次回の広告収益確定・残高反映日:</span>
                <span className="bg-black text-white px-2 py-0.5 rounded font-mono text-sm">{nextUpdateDate()}</span>
              </div>
            </div>
          )}
          <div className="mb-8 opacity-65">
            <div className="flex justify-between text-sm font-bold mb-2 text-black">
              <span>出金可能ラインまで</span>
              <span>{withdrawableYen >= minWithdrawal ? "到達！🎉" : `あと ¥${(minWithdrawal - withdrawableYen).toLocaleString()}`}</span>
            </div>
            <div className="w-full h-6 md:h-8 bg-gray-200 border-4 border-black rounded-full overflow-hidden">
              <div className="h-full bg-[#FFEF5E] transition-all duration-1000 ease-out border-r-4 border-black" style={{ width: `${progressPercent}%` }}></div>
            </div>
            <div className="flex justify-between text-xs font-bold text-gray-500 mt-2">
              <span>¥0</span><span>最低出金額 ¥5,000</span>
            </div>
          </div>
          
          {/* 💡 5,000円未満の時は既存デザイン通りの無効化ボタンをそのまま表示 */}
          {!canWithdraw && (
            <div className="text-center">
              <button disabled className="w-full md:w-auto px-10 py-4 rounded-xl font-black text-lg md:text-xl border-4 border-black bg-gray-200 text-gray-400 cursor-not-allowed opacity-70">
                {!isUnlocked ? "🔒 ポイントが足りません" : "金額が足りません"}
              </button>
            </div>
          )}
        </div>

        {/* 💡 【新設・プランB】5,000円以上かつ収益化解放時のみ、下部に美しく展開するネオブル調申請フォーム */}
        {canWithdraw && (
          <div className="bg-white border-4 border-black p-6 md:p-8 rounded-2xl md:rounded-3xl shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] animate-fade-in">
            <h3 className="text-lg md:text-2xl font-black mb-6 flex items-center gap-2 text-black">
              <span>💸</span> 出金申請フォーム（プランB展開）
            </h3>
            
            <form onSubmit={handleWithdrawSubmit} className="space-y-6">
              {/* 受取方法の選択タブ（ネオブルデザイン） */}
              <div>
                <label className="block text-xs md:text-sm font-black mb-2 text-black">🎁 受取方法を選択してください</label>
                <div className="grid grid-cols-2 gap-3">
                  <button type="button" onClick={() => setRequestType("amazon")} className={`p-3 rounded-xl border-4 border-black font-black text-xs md:text-sm shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] active:translate-y-0.5 transition-all ${requestType === 'amazon' ? 'bg-[#FFEF5E] text-black shadow-none translate-y-0.5' : 'bg-white text-gray-700'}`}>
                    ✨ Amazonギフト券 (手数料無料)
                  </button>
                  <button type="button" onClick={() => setRequestType("bank")} className={`p-3 rounded-xl border-4 border-black font-black text-xs md:text-sm shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] active:translate-y-0.5 transition-all ${requestType === 'bank' ? 'bg-[#FFEF5E] text-black shadow-none translate-y-0.5' : 'bg-white text-gray-700'}`}>
                    🏦 銀行振込 (手数料¥220)
                  </button>
                </div>
              </div>

              {/* 金額入力とリアルタイム実質手取り額プレビュー */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs md:text-sm font-black mb-1 text-black">出金希望額 (円)</label>
                  <input type="number" value={withdrawAmount} onChange={(e) => setWithdrawAmount(e.target.value)} placeholder="5000以上の金額" min="5000" max={withdrawableYen} className="w-full p-2.5 border-4 border-black rounded-xl font-black bg-gray-50 focus:bg-white focus:outline-none" required />
                </div>
                <div>
                  <label className="block text-xs md:text-sm font-bold text-gray-500 mb-1">実際の受取金額 (手数料反映済)</label>
                  <div className="w-full p-2.5 border-4 border-dashed border-gray-300 rounded-xl font-black text-gray-700 bg-gray-50 flex items-center">
                    {requestType === "amazon" ? (
                      <span className="text-green-600">¥{amtNum.toLocaleString()} (手数料0円)</span>
                    ) : (
                      <span className="text-black">¥{realBankPayout.toLocaleString()} (手数料¥220差引後)</span>
                    )}
                  </div>
                </div>
              </div>

              {/* 【受取タイプA：Amazonギフト券】メールアドレス入力欄 */}
              {requestType === "amazon" && (
                <div className="bg-yellow-50/50 border-2 border-black p-4 rounded-xl space-y-3">
                  <p className="text-xs font-bold text-gray-600">※ご指定のメールアドレス宛てにAmazonギフト券のデジタルコードが直接配信されます。税務上のマイナンバー提出等は不要です。</p>
                  <div>
                    <label className="block text-xs font-black mb-1 text-black">ギフト券送付先 メールアドレス</label>
                    <input type="email" value={amazonEmail} onChange={(e) => setAmazonEmail(e.target.value)} placeholder="example@mail.com" className="w-full p-2.5 border-4 border-black rounded-xl font-black bg-gray-50 focus:bg-white focus:outline-none" required={requestType === "amazon"} />
                  </div>
                </div>
              )}

              {/* 【受取タイプB：銀行振込】各口座情報フォーム */}
              {requestType === "bank" && (
                <div className="bg-gray-50 border-2 border-black p-4 rounded-xl space-y-4">
                  <p className="text-xs font-bold text-gray-500">※振込に伴う実費手数料220円はユーザー様負担となります。年間20万円を超える収益が発生した場合はご自身での確定申告が必要です。</p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-black mb-1 text-black">お振込先 銀行名</label>
                      <input type="text" value={bankName} onChange={(e) => setBankName(e.target.value)} placeholder="例: 日本中央銀行" className="w-full p-2.5 border-4 border-black rounded-xl font-black bg-white focus:outline-none" required={requestType === "bank"} />
                    </div>
                    <div>
                      <label className="block text-xs font-black mb-1 text-black">支店名 / 支店番号</label>
                      <input type="text" value={branchName} onChange={(e) => setBranchName(e.target.value)} placeholder="例: トウキョウ支店 (101)" className="w-full p-2.5 border-4 border-black rounded-xl font-black bg-white focus:outline-none" required={requestType === "bank"} />
                    </div>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-xs font-black mb-1 text-black">口座種別</label>
                      <select value={accountType} onChange={(e) => setAccountType(e.target.value)} className="w-full p-2.5 border-4 border-black rounded-xl font-black bg-white focus:outline-none">
                        <option value="普通">普通</option>
                        <option value="当座">当座</option>
                      </select>
                    </div>
                    <div className="sm:col-span-2">
                      <label className="block text-xs font-black mb-1 text-black">口座番号</label>
                      <input type="text" value={accountNumber} onChange={(e) => setAccountNumber(e.target.value)} placeholder="7桁の半角数字" className="w-full p-2.5 border-4 border-black rounded-xl font-black bg-white focus:outline-none" required={requestType === "bank"} />
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs font-black mb-1 text-black">口座名義（カタカナ）</label>
                    <input type="text" value={accountName} onChange={(e) => setAccountName(e.target.value)} placeholder="例: トヨタ ユウマ" className="w-full p-2.5 border-4 border-black rounded-xl font-black bg-white focus:outline-none" required={requestType === "bank"} />
                  </div>
                </div>
              )}

              {/* 出金確定ボタン（完全なネオブロータリズム調） */}
              <button type="submit" disabled={submitting} className="w-full bg-black text-white border-4 border-black p-4 rounded-xl font-black text-lg shadow-[4px_4px_0px_0px_rgba(255,239,94,1)] hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-none active:scale-[0.99] transition-all disabled:opacity-50 cursor-pointer">
                {submitting ? "申請データを送信中..." : `💸 この内容で ${requestType === 'amazon' ? 'Amazonギフト券' : '日本円振込'} の出金申請をする`}
              </button>
            </form>
          </div>
        )}
      </div>
    );
  };

  if (loading) return <div className="min-h-screen flex items-center justify-center font-bold text-xl bg-[#FFFDF0]">読み込み中...🚀</div>;

  return (
    <main className="min-h-screen px-3 md:px-6 py-6 md:py-12 max-w-6xl mx-auto font-sans bg-[#FFFDF0]">
      <Header title="マイページ" />

      <div className="bg-white border-4 border-black p-4 md:p-8 rounded-2xl md:rounded-3xl shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] md:shadow-[10px_10px_0px_0px_rgba(0,0,0,1)] mb-8 md:mb-12 mt-4 md:mt-8">
        <div className="flex flex-col md:flex-row md:items-start justify-between gap-6">
          <div className="flex-1">
            {isEditingProfile ? (
              <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 mb-3">
                <input 
                  type="text" 
                  value={newUsername}
                  onChange={(e) => setNewUsername(e.target.value)}
                  placeholder="新しいユーザー名"
                  className="bg-gray-50 border-4 border-black px-3 py-2 rounded-xl font-black text-lg w-full sm:w-auto focus:outline-none focus:bg-white"
                />
                <div className="flex gap-2 w-full sm:w-auto">
                  <button onClick={handleUpdateProfile} disabled={isUpdating} className="flex-1 sm:flex-none bg-[#FFEF5E] text-black border-4 border-black px-4 py-2 rounded-xl font-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-none transition-all">保存</button>
                  <button onClick={() => { setNewUsername(user?.user_metadata?.username || ""); setIsEditingProfile(false); }} className="flex-1 sm:flex-none bg-gray-200 text-black border-4 border-black px-4 py-2 rounded-xl font-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-none transition-all">戻る</button>
                </div>
              </div>
            ) : (
              <h1 className="text-2xl md:text-4xl font-black mb-2 text-black">{user?.user_metadata?.username || "名無しプレイヤー"}</h1>
            )}
            <p className="text-xs md:text-sm font-bold text-gray-500 bg-gray-100 inline-block px-3 py-1 rounded-md border-2 border-gray-200">ID: {user?.id}</p>
          </div>
          
          <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto shrink-0">
            <Link href="/notifications" className="w-full sm:w-auto bg-white text-black border-4 border-black px-5 py-2.5 rounded-xl font-black text-sm md:text-base shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-none transition-all flex items-center justify-center gap-2">📮 ポストを開く</Link>
            {!isEditingProfile && (
              <button onClick={() => setIsEditingProfile(true)} className="w-full sm:w-auto bg-gray-100 text-black border-4 border-black px-5 py-2.5 rounded-xl font-black text-sm md:text-base shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-none transition-all flex items-center justify-center gap-2">✏️ プロフィール編集</button>
            )}
          </div>
        </div>

        <hr className="my-6 md:my-8 border-t-4 border-black" />

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-4">
          <h2 className="text-lg md:text-xl font-black border-b-4 border-black inline-block pb-1">現在のステータス</h2>
          <Link href="/system" className="text-sm font-black text-black bg-white border-2 border-black px-3 py-1 rounded-md shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:bg-gray-50 transition-colors">❓ ランクと収益の仕組みを見る</Link>
        </div>
        
        <div className={`border-4 border-black p-4 md:p-6 rounded-xl md:rounded-2xl ${rankInfo.color} shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] md:shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] flex flex-col md:flex-row md:items-center justify-between gap-4`}>
          <div>
            <p className="text-xs md:text-sm font-bold text-gray-800 mb-1">現在の広告収益ランク</p>
            <div className="flex items-center gap-3">
              <span className="bg-black text-white px-2 py-1 md:px-3 md:py-1.5 rounded-lg font-black text-xs md:text-base border-2 border-white">Lv.{rankInfo.lv}</span>
              <span className="text-2xl md:text-4xl font-black text-black tracking-tight">{rankInfo.name}</span>
            </div>
          </div>
          <div className="bg-white border-4 border-black p-3 md:p-5 rounded-xl text-center md:text-right shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
            <p className="text-xs md:text-sm font-bold text-gray-600 mb-1">現在の広告収益ランクポイント (RP)</p>
            <p className="text-3xl md:text-5xl font-black text-black">{rankPoints.toLocaleString()} <span className="text-base md:text-xl font-bold">RP</span></p>
          </div>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6 border-b-4 border-black pb-4">
        <div className="flex gap-2 overflow-x-auto hide-scrollbar">
          <button onClick={() => setActiveTab("created")} className={`px-4 py-2 md:px-6 md:py-3 rounded-lg md:rounded-xl font-black text-xs md:text-base border-2 md:border-4 border-black transition-all ${activeTab === 'created' ? 'bg-black text-white shadow-[2px_2px_0px_0px_rgba(255,239,94,1)]' : 'bg-white hover:bg-gray-100 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]'}`}>🕹️ 投稿したゲーム</button>
          <button onClick={() => setActiveTab("history")} className={`px-4 py-2 md:px-6 md:py-3 rounded-lg md:rounded-xl font-black text-xs md:text-base border-2 md:border-4 border-black transition-all ${activeTab === 'history' ? 'bg-black text-white shadow-[2px_2px_0px_0px_rgba(255,239,94,1)]' : 'bg-white hover:bg-gray-100 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]'}`}>🕒 遊んだ履歴</button>
          <button onClick={() => setActiveTab("wallet")} className={`px-4 py-2 md:px-6 md:py-3 rounded-lg md:rounded-xl font-black text-xs md:text-base border-2 md:border-4 border-black transition-all ${activeTab === 'wallet' ? 'bg-black text-white shadow-[2px_2px_0px_0px_rgba(255,239,94,1)]' : 'bg-white hover:bg-gray-100 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]'}`}>💰 ウォレット</button>
        </div>
        <Link href="/post" className="self-start sm:self-auto bg-[#FFEF5E] border-2 md:border-4 border-black px-4 py-2 rounded-xl font-black text-xs md:text-base shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] md:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-none transition-all">＋ 新規ゲームを投稿</Link>
      </div>

      <div>
        {activeTab === "wallet" ? renderWallet() : activeTab === "history" ? (
          recentPlays.length > 0 ? (
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3 md:gap-8">{recentPlays.map(renderHistoryCard)}</div>
          ) : (
            <div className="bg-gray-100 border-4 border-dashed border-gray-400 p-8 md:p-12 rounded-xl md:rounded-2xl text-center">
              <p className="text-base md:text-xl font-bold text-gray-500 mb-4">まだプレイ履歴がありません。</p>
              <Link href="/" className="inline-block bg-[#FFEF5E] text-black border-4 border-black px-6 py-3 rounded-xl font-black text-sm md:text-base shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-none transition-all">ゲームを探しに行く 🎮</Link>
            </div>
          )
        ) : (
          myGames.length > 0 ? (
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3 md:gap-8">{myGames.map(renderMyGameCard)}</div>
          ) : (
            <div className="bg-gray-100 border-4 border-dashed border-gray-400 p-8 md:p-12 rounded-xl md:rounded-2xl text-center">
              <p className="text-base md:text-xl font-bold text-gray-500 mb-4">まだゲームを投稿していません。</p>
              <Link href="/post" className="inline-block bg-black text-white border-4 border-black px-6 py-3 rounded-xl font-black text-sm md:text-base shadow-[4px_4px_0px_0px_rgba(255,255,255,1)] hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-none transition-all">最初のゲームを作る 🚀</Link>
            </div>
          )
        )}
      </div>
      <style dangerouslySetInnerHTML={{__html: `.hide-scrollbar::-webkit-scrollbar { display: none; } .hide-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }`}} />
    </main>
  );
}