"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/app/utils/supabase";
import Header from "@/app/components/Header";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function PostPage() {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [code, setCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [user, setUser] = useState<any>(null);
  const router = useRouter();

  useEffect(() => {
    const checkUser = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        alert("ゲームを投稿するにはログインが必要です！");
        router.push("/login");
        return;
      }
      setUser(session.user);
    };
    checkUser();
  }, [router]);

  const handlePost = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !code) {
      alert("タイトルとゲームコードは必須です！");
      return;
    }
    setLoading(true);

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error("セッションが切れました。再度ログインしてください。");

      const creatorId = session.user.id;
      const creatorName = session.user.user_metadata?.username || "名無しクリエイター";

      // 🌟 修正：creator_id ではなく user_id に保存する！
      const { error } = await supabase
        .from("games")
        .insert([
          {
            title,
            description,
            code,
            user_id: creatorId,
            creator_name: creatorName,
          }
        ]);

      if (error) throw error;

      alert("🎉 ゲームの投稿が完了しました！");
      router.push("/mypage");
    } catch (error: any) {
      console.error(error);
      alert("投稿に失敗しました: " + error.message);
    } finally {
      setLoading(false);
    }
  };

  if (!user) return <div className="min-h-screen bg-[#FFFDF0]"></div>;

  return (
    <main className="min-h-screen px-3 md:px-6 py-6 md:py-12 max-w-4xl mx-auto font-sans bg-[#FFFDF0]">
      <Header title="ゲーム投稿" />

      <div className="bg-white border-4 border-black p-6 md:p-10 rounded-2xl md:rounded-3xl shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] md:shadow-[10px_10px_0px_0px_rgba(0,0,0,1)] mt-4 md:mt-8">
        <h1 className="text-2xl md:text-4xl font-black mb-6 md:mb-8 text-black border-b-4 border-black pb-3 flex items-center gap-2">
          <span>🚀</span> 新規ゲームを投稿する
        </h1>

        <form onSubmit={handlePost} className="space-y-6 md:space-y-8">
          <div className="space-y-2">
            <label className="block text-base md:text-lg font-black text-black flex items-center gap-2">
              <span className="bg-[#FFEF5E] px-2 py-1 rounded border-2 border-black text-sm">必須</span>
              ゲームのタイトル
            </label>
            <input 
              type="text" 
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="例：激ムズ！ブロック崩し"
              className="w-full bg-gray-50 border-4 border-black p-3 md:p-4 rounded-xl font-bold text-black focus:outline-none focus:bg-white focus:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] transition-all"
              required
            />
          </div>

          <div className="space-y-2">
            <label className="block text-base md:text-lg font-black text-black flex items-center gap-2">
              <span className="bg-gray-200 px-2 py-1 rounded border-2 border-black text-sm text-gray-600">任意</span>
              ゲームの説明・遊び方
            </label>
            <textarea 
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="遊び方やアピールポイントを書いてね！"
              rows={3}
              className="w-full bg-gray-50 border-4 border-black p-3 md:p-4 rounded-xl font-bold text-black focus:outline-none focus:bg-white focus:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] transition-all"
            />
          </div>

          <div className="space-y-2">
            <label className="block text-base md:text-lg font-black text-black flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="bg-[#FFEF5E] px-2 py-1 rounded border-2 border-black text-sm">必須</span>
                AIが作ったゲームコード
              </div>
              <Link href="/guide" target="_blank" className="text-xs md:text-sm bg-black text-white px-3 py-1 rounded-lg border-2 border-black hover:bg-gray-800 transition-colors">
                作り方を見る👀
              </Link>
            </label>
            <textarea 
              value={code}
              onChange={(e) => setCode(e.target.value)}
              placeholder="<!DOCTYPE html> から始まるコードをここに丸ごとペーストしてください"
              rows={10}
              className="w-full bg-gray-50 border-4 border-black p-3 md:p-4 rounded-xl font-mono text-sm text-black focus:outline-none focus:bg-white focus:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] transition-all whitespace-pre-wrap"
              required
            />
          </div>

          <div className="pt-4">
            <button 
              type="submit" 
              disabled={loading}
              className={`w-full py-4 md:py-5 rounded-xl md:rounded-2xl font-black text-lg md:text-2xl border-4 border-black transition-all shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] ${
                loading 
                  ? "bg-gray-300 text-gray-500 cursor-not-allowed shadow-none translate-y-[4px] translate-x-[4px]" 
                  : "bg-black text-white hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-none active:bg-gray-800"
              }`}
            >
              {loading ? "投稿中...🚀" : "✨ このゲームを世界に公開する！"}
            </button>
          </div>
        </form>
      </div>
      
      <div className="mt-8 text-center">
        <Link href="/mypage" className="inline-block font-bold text-gray-500 hover:text-black hover:underline transition-all">
          マイページへ戻る
        </Link>
      </div>
    </main>
  );
}