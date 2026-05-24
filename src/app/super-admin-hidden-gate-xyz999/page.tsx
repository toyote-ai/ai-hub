"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/app/utils/supabase";
import Header from "@/app/components/Header";
import { useRouter } from "next/navigation";

// 🚨 プロデューサーの本物のUIDを設定してください
const ADMIN_USER_ID = "bfd907a2-dcf0-43d8-a096-ba0a056305f2"; 

export default function AdminDashboard() {
  const [isAdmin, setIsAdmin] = useState<boolean | null>(null);
  
  // データステート
  const [games, setGames] = useState<any[]>([]);
  const [users, setUsers] = useState<any[]>([]);
  const [announcement, setAnnouncement] = useState({ id: 1, message: "", is_active: false });
  
  // 検索・フィルター用ステート
  const [searchGame, setSearchGame] = useState("");
  const [searchUser, setSearchUser] = useState("");

  // 編集モーダル用ステート
  const [editingGame, setEditingGame] = useState<any | null>(null);
  
  const [stats, setStats] = useState({ totalGames: 0, totalPlays: 0, totalPoints: 0 });
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const checkAdminAndFetchData = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session || session.user.id !== ADMIN_USER_ID) {
        setIsAdmin(false); setLoading(false); return;
      }
      setIsAdmin(true);

      // ゲームデータ取得
      const { data: gamesData } = await supabase.from("games").select("*").order("created_at", { ascending: false });
      setGames(gamesData || []);

      // プレイ回数取得
      const { data: logsData } = await supabase.from("play_logs").select("id");
      
      // ユーザー（ポイント＆BAN状態）取得
      const { data: pointsData } = await supabase.from("user_points").select("*").order("total_points", { ascending: false });
      setUsers(pointsData || []);

      // アナウンス取得
      const { data: annData } = await supabase.from("announcements").select("*").eq("id", 1).single();
      if (annData) setAnnouncement(annData);

      setStats({
        totalGames: (gamesData || []).length,
        totalPlays: logsData?.length || 0,
        totalPoints: (pointsData || []).reduce((sum, u) => sum + (u.total_points || 0), 0),
      });

      setLoading(false);
    };
    checkAdminAndFetchData();
  }, [router]);

  // 📢 アナウンスの更新
  const updateAnnouncement = async () => {
    const { error } = await supabase.from("announcements").update({ 
      message: announcement.message, 
      is_active: announcement.is_active 
    }).eq("id", 1);
    
    if (error) alert("更新エラー: " + error.message);
    else alert("全体アナウンスを更新しました！📢");
  };

  // 🚨 ゲームの完全削除
  const deleteGameForce = async (gameId: string, gameTitle: string) => {
    if (!confirm(`【警告】ゲーム「${gameTitle}」を【永久削除】します。よろしいですか？`)) return;
    await supabase.from("play_logs").delete().eq("game_id", gameId);
    await supabase.from("games").delete().eq("id", gameId);
    setGames(prev => prev.filter(g => g.id !== gameId));
    setStats(prev => ({ ...prev, totalGames: prev.totalGames - 1 }));
  };

  // ✏️ ゲームの直接編集保存
  const saveGameEdit = async () => {
    if (!editingGame) return;
    const { error } = await supabase.from("games").update({ 
      title: editingGame.title, 
      description: editingGame.description 
    }).eq("id", editingGame.id);

    if (error) {
      alert("エラー: " + error.message);
    } else {
      setGames(prev => prev.map(g => g.id === editingGame.id ? editingGame : g));
      setEditingGame(null);
      alert("ゲーム情報を上書き修正しました。✏️");
    }
  };

  // 🧹 ポイント没収
  const resetUserPoints = async (userId: string) => {
    if (!confirm("所持ポイントを【0 pt】に強制リセットします。よろしいですか？")) return;
    await supabase.from("user_points").update({ total_points: 0 }).eq("user_id", userId);
    setUsers(prev => prev.map(u => u.user_id === userId ? { ...u, total_points: 0 } : u));
  };

  // 🚫 アカウントBAN（凍結）トグル
  const toggleBanUser = async (userId: string, currentStatus: boolean) => {
    const action = currentStatus ? "解除" : "BAN（凍結）";
    if (!confirm(`このユーザーを【${action}】します。よろしいですか？`)) return;
    await supabase.from("user_points").update({ is_banned: !currentStatus }).eq("user_id", userId);
    setUsers(prev => prev.map(u => u.user_id === userId ? { ...u, is_banned: !currentStatus } : u));
  };

  // 検索フィルター処理
  const filteredGames = games.filter(g => g.title.includes(searchGame) || g.creator_name.includes(searchGame));
  const filteredUsers = users.filter(u => u.user_id.includes(searchUser));

  if (loading) return <div className="min-h-screen flex items-center justify-center font-bold text-xl bg-[#FFFDF0]">セキュリティ認証中...🔐</div>;
  if (isAdmin === false) return <div className="min-h-screen flex items-center justify-center bg-white"><h1 className="text-6xl font-black">404</h1></div>;

  return (
    <main className="min-h-screen px-3 md:px-6 py-6 md:py-12 max-w-7xl mx-auto font-sans bg-[#FFFDF0]">
      <Header title="管理者ダッシュボード" />
      <div className="bg-red-500 text-white border-4 border-black p-4 rounded-xl font-black text-center text-sm md:text-lg shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] mb-8 tracking-widest">
        🛡️ SECURITY LEVEL MAX : SYSTEM ADMINISTRATION KERNEL
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-8">
        {/* 📊 統計 */}
        <section className="lg:col-span-2 grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="bg-white border-4 border-black p-4 rounded-xl shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] text-center">
            <p className="text-xs font-bold text-gray-500 mb-1">総ゲーム数</p>
            <p className="text-3xl font-black">{stats.totalGames}</p>
          </div>
          <div className="bg-white border-4 border-black p-4 rounded-xl shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] text-center">
            <p className="text-xs font-bold text-gray-500 mb-1">総プレイ回数</p>
            <p className="text-3xl font-black">{stats.totalPlays.toLocaleString()}</p>
          </div>
          <div className="bg-white border-4 border-black p-4 rounded-xl shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] text-center">
            <p className="text-xs font-bold text-gray-500 mb-1">流通ポイント</p>
            <p className="text-3xl font-black text-amber-500">{stats.totalPoints.toLocaleString()}</p>
          </div>
        </section>

        {/* 📢 全体アナウンス */}
        <section className="bg-white border-4 border-black p-4 rounded-xl shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] flex flex-col gap-2">
          <h2 className="font-black border-b-4 border-black pb-1">📢 トップページお知らせ</h2>
          <textarea 
            value={announcement.message} 
            onChange={(e) => setAnnouncement({...announcement, message: e.target.value})}
            className="w-full border-2 border-black rounded p-2 text-sm font-bold resize-none h-16" 
            placeholder="イベント情報などを入力"
          />
          <div className="flex items-center justify-between mt-auto">
            <label className="flex items-center gap-2 font-bold text-sm cursor-pointer">
              <input type="checkbox" checked={announcement.is_active} onChange={(e) => setAnnouncement({...announcement, is_active: e.target.checked})} className="w-4 h-4" />
              公開する
            </label>
            <button onClick={updateAnnouncement} className="bg-[#FFEF5E] border-2 border-black px-4 py-1 rounded font-black text-sm shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:translate-y-0.5 hover:shadow-none">更新</button>
          </div>
        </section>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* 🕹️ ゲーム管理 */}
        <section className="bg-white border-4 border-black p-4 md:p-6 rounded-2xl shadow-[6px_6px_0px_0px_rgba(0,0,0,1)]">
          <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-2 mb-4 border-b-4 border-black pb-2">
            <h2 className="text-lg md:text-xl font-black">🕹️ ゲーム管理 ({filteredGames.length})</h2>
            <input type="text" placeholder="🔍 タイトル・作者名で検索" value={searchGame} onChange={(e) => setSearchGame(e.target.value)} className="border-2 border-black rounded-lg p-1.5 text-sm font-bold w-full sm:w-1/2" />
          </div>
          <div className="space-y-3 max-h-[500px] overflow-y-auto pr-1">
            {filteredGames.map((game) => (
              <div key={game.id} className="border-2 border-black p-3 rounded-xl bg-gray-50 flex flex-col sm:flex-row justify-between sm:items-center gap-3">
                <div className="truncate">
                  <p className="font-black text-sm truncate">{game.title}</p>
                  <p className="text-xs text-gray-500 font-bold">作者: {game.creator_name} | ❤️ {game.likes}</p>
                </div>
                <div className="flex gap-2 shrink-0">
                  <button onClick={() => setEditingGame(game)} className="bg-blue-100 text-blue-600 border-2 border-blue-500 hover:bg-blue-500 hover:text-white px-3 py-1.5 rounded-lg font-black text-xs transition-colors">✏️ 編集</button>
                  <button onClick={() => deleteGameForce(game.id, game.title)} className="bg-red-100 text-red-600 border-2 border-red-500 hover:bg-red-500 hover:text-white px-3 py-1.5 rounded-lg font-black text-xs transition-colors">🚨 抹消</button>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* 👤 ユーザー管理 */}
        <section className="bg-white border-4 border-black p-4 md:p-6 rounded-2xl shadow-[6px_6px_0px_0px_rgba(0,0,0,1)]">
          <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-2 mb-4 border-b-4 border-black pb-2">
            <h2 className="text-lg md:text-xl font-black">👤 ユーザー管理 ({filteredUsers.length})</h2>
            <input type="text" placeholder="🔍 UIDで検索" value={searchUser} onChange={(e) => setSearchUser(e.target.value)} className="border-2 border-black rounded-lg p-1.5 text-sm font-bold w-full sm:w-1/2" />
          </div>
          <div className="space-y-3 max-h-[500px] overflow-y-auto pr-1">
            {filteredUsers.map((u) => (
              <div key={u.user_id} className={`border-2 border-black p-3 rounded-xl flex flex-col sm:flex-row justify-between sm:items-center gap-3 ${u.is_banned ? 'bg-red-50' : 'bg-gray-50'}`}>
                <div className="truncate">
                  <p className={`font-mono text-xs font-bold truncate ${u.is_banned ? 'text-red-500' : 'text-gray-500'}`}>UID: {u.user_id}</p>
                  <p className="text-sm font-black mt-0.5">Pt: <span className="text-amber-500">{u.total_points.toLocaleString()}</span> {u.is_banned && <span className="text-red-600 ml-2">🚫 凍結中</span>}</p>
                </div>
                <div className="flex gap-2 shrink-0">
                  <button onClick={() => resetUserPoints(u.user_id)} className="bg-orange-50 text-orange-600 border-2 border-orange-400 hover:bg-orange-500 hover:text-white px-3 py-1.5 rounded-lg font-black text-xs transition-colors">🧹 没収</button>
                  <button onClick={() => toggleBanUser(u.user_id, u.is_banned)} className={`border-2 px-3 py-1.5 rounded-lg font-black text-xs transition-colors ${u.is_banned ? 'bg-green-100 text-green-700 border-green-500 hover:bg-green-500 hover:text-white' : 'bg-gray-800 text-white border-black hover:bg-black'}`}>
                    {u.is_banned ? "♻️ 復帰" : "🚫 BAN"}
                  </button>
                </div>
              </div>
            ))}
          </div>
        </section>
      </div>

      {/* ✏️ ゲーム編集モーダル */}
      {editingGame && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
          <div className="bg-white border-4 border-black p-6 rounded-2xl w-full max-w-lg shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]">
            <h2 className="text-xl font-black mb-4 border-b-4 border-black pb-2">✏️ ゲーム情報の上書き編集</h2>
            <div className="space-y-4">
              <div>
                <label className="font-bold text-sm block mb-1">タイトル</label>
                <input type="text" value={editingGame.title} onChange={(e) => setEditingGame({...editingGame, title: e.target.value})} className="w-full border-2 border-black rounded p-2 font-bold" />
              </div>
              <div>
                <label className="font-bold text-sm block mb-1">説明文</label>
                <textarea value={editingGame.description} onChange={(e) => setEditingGame({...editingGame, description: e.target.value})} className="w-full border-2 border-black rounded p-2 font-bold h-24 resize-none" />
              </div>
            </div>
            <div className="flex justify-end gap-3 mt-6">
              <button onClick={() => setEditingGame(null)} className="px-4 py-2 border-2 border-gray-400 text-gray-500 font-bold rounded-lg hover:bg-gray-100">キャンセル</button>
              <button onClick={saveGameEdit} className="px-4 py-2 bg-[#FFEF5E] border-2 border-black font-black rounded-lg shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:translate-y-0.5 hover:shadow-none">保存する</button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}