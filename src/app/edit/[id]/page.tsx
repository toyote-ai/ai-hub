"use client";

import { useEffect, useState, use } from "react";
import { supabase } from "@/app/utils/supabase";
import { useRouter } from "next/navigation";
import Header from "@/app/components/Header";

export default function EditGame({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params);
  const gameId = resolvedParams.id;
  
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [code, setCode] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false); // 🌟 追加：削除中ステート
  const router = useRouter();

  useEffect(() => {
    const fetchGame = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        alert("ログインが必要です");
        router.push("/login");
        return;
      }

      const { data, error } = await supabase.from("games").select("*").eq("id", gameId).single();
      
      if (error || !data) {
        alert("ゲームが見つかりません");
        router.push("/mypage");
        return;
      }

      if (data.user_id !== session.user.id) {
        alert("他の人のゲームは編集できません！");
        router.push("/mypage");
        return;
      }

      setTitle(data.title);
      setDescription(data.description || "");
      setCode(data.code);
      setLoading(false);
    };

    fetchGame();
  }, [gameId, router]);

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    const { error } = await supabase
      .from("games")
      .update({ title, description, code })
      .eq("id", gameId);

    if (error) {
      alert("更新エラー: " + error.message);
      setSaving(false);
    } else {
      alert("ゲームをアップデートしました！✨");
      router.push(`/play/${gameId}`);
    }
  };

  // 🌟 追加：ゲーム削除処理
  const handleDelete = async () => {
    const confirmed = window.confirm("本当にこのゲームを削除してもよろしいですか？\nこの操作は取り消せません！");
    if (!confirmed) return;

    setIsDeleting(true);

    const { error } = await supabase
      .from("games")
      .delete()
      .eq("id", gameId);

    if (error) {
      alert("削除エラー: " + error.message);
      setIsDeleting(false);
    } else {
      alert("ゲームを抹消しました🗑️");
      router.push("/mypage");
    }
  };

  return (
    <main className="min-h-screen px-6 py-12 max-w-4xl mx-auto font-sans">
      <Header title="ゲームをアップデート" />
      
      {loading ? (
        <p className="text-xl font-bold text-center mt-20">読み込み中...🚀</p>
      ) : (
        <div className="bg-white border-4 border-black p-8 md:p-12 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] rounded-2xl mt-8">
          <h1 className="text-3xl font-black mb-8 border-b-4 border-black pb-4 flex items-center gap-3">
            <span>✏️</span> ゲームのコードを修正
          </h1>

          <form onSubmit={handleUpdate} className="space-y-8">
            <div>
              <label className="block text-xl font-black mb-3">ゲームのタイトル</label>
              <input 
                type="text" value={title} onChange={(e) => setTitle(e.target.value)} required
                className="w-full border-4 border-black p-4 text-lg font-bold rounded-xl focus:outline-none focus:bg-[#FFEF5E] transition-colors"
              />
            </div>
            <div>
              <label className="block text-xl font-black mb-3">ゲームの説明・遊び方</label>
              <textarea 
                value={description} onChange={(e) => setDescription(e.target.value)} rows={3}
                className="w-full border-4 border-black p-4 text-lg font-bold rounded-xl focus:outline-none focus:bg-[#FFEF5E] transition-colors"
              />
            </div>
            <div>
              <label className="block text-xl font-black mb-3">修正したHTMLコード</label>
              <textarea 
                value={code} onChange={(e) => setCode(e.target.value)} required rows={15}
                className="w-full border-4 border-black p-4 font-mono text-sm bg-gray-50 rounded-xl focus:outline-none focus:bg-[#FFFDF0] transition-colors"
              />
            </div>
            <button 
              type="submit" disabled={saving || isDeleting}
              className="w-full bg-[#FFEF5E] text-black px-6 py-5 rounded-xl font-black text-2xl border-4 border-black shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] hover:shadow-none hover:translate-y-[6px] hover:translate-x-[6px] transition-all disabled:opacity-50"
            >
              {saving ? "保存中..." : "アップデートを実行！ 🚀"}
            </button>
          </form>

          {/* 🌟 追加：削除エリア */}
          <hr className="my-8 border-t-4 border-black border-dashed opacity-50" />
          
          <div className="text-center">
            <button 
              onClick={handleDelete}
              disabled={saving || isDeleting}
              className="w-full md:w-auto bg-red-500 text-white px-8 py-4 rounded-xl font-black text-xl border-4 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:shadow-none hover:translate-y-[4px] hover:translate-x-[4px] transition-all disabled:opacity-50"
            >
              {isDeleting ? "削除中..." : "🗑️ このゲームを抹消する"}
            </button>
          </div>

        </div>
      )}
    </main>
  );
}