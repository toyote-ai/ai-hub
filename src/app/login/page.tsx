"use client";

import { useState } from "react";
import { supabase } from "@/app/utils/supabase";
import { useRouter } from "next/navigation";
import Header from "@/app/components/Header";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [username, setUsername] = useState("");
  const [isLogin, setIsLogin] = useState(true);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const router = useRouter();

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg("");

    try {
      if (isLogin) {
        // ログイン処理
        const { error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });
        if (error) throw error;
        router.push("/");
      } else {
        // サインアップ（新規登録）処理
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: {
              // 🌟 致命的バグ修正：メールアドレスからの推測を完全に排除！
              // 入力されたユーザー名を保存。万が一空の場合は安全なランダム文字列を割り当てる。
              username: username || `Player_${Math.floor(Math.random() * 1000000)}`,
            },
          },
        });
        if (error) throw error;
        
        // 新規登録時に初期ポイント(0pt)のレコードを作成する
        if (data.user) {
          await supabase.from('user_points').insert([{ user_id: data.user.id, total_points: 0 }]);
        }
        
        alert("登録完了！AI-Hubへようこそ！🚀\n（※本番環境でメール確認をオンにしている場合は確認メールをご確認ください）");
        router.push("/");
      }
    } catch (error: any) {
      setErrorMsg(error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen px-3 md:px-6 py-6 md:py-12 max-w-6xl mx-auto font-sans bg-[#FFFDF0] flex flex-col">
      <Header title={isLogin ? "ログイン" : "新規登録"} />

      <div className="flex-1 flex items-center justify-center py-10">
        <div className="w-full max-w-md bg-white border-4 md:border-8 border-black p-6 md:p-10 rounded-2xl md:rounded-3xl shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] md:shadow-[12px_12px_0px_0px_rgba(0,0,0,1)]">
          <h1 className="text-2xl md:text-4xl font-black mb-6 md:mb-8 text-black text-center border-b-4 border-black pb-4">
            {isLogin ? "👋 おかえりなさい！" : "✨ 新規プレイヤー登録"}
          </h1>

          {errorMsg && (
            <div className="bg-red-100 border-4 border-red-500 text-red-700 font-bold p-3 rounded-xl mb-6 text-sm md:text-base shadow-[4px_4px_0px_0px_rgba(239,68,68,1)]">
              エラー: {errorMsg}
            </div>
          )}

          <form onSubmit={handleAuth} className="space-y-5 md:space-y-6">
            
            {/* 新規登録時のみユーザー名入力を表示 */}
            {!isLogin && (
              <div className="space-y-2">
                <label className="text-sm md:text-base font-black text-black block ml-1">ユーザー名（プレイヤー名）</label>
                <input
                  type="text"
                  required={!isLogin}
                  placeholder="例：AIゲーマー"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="w-full bg-gray-50 border-4 border-black p-3 md:p-4 rounded-xl text-base font-bold shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] focus:translate-y-0.5 focus:shadow-none outline-none transition-all"
                />
              </div>
            )}

            {/* メールアドレス入力 */}
            <div className="space-y-2">
              <label className="text-sm md:text-base font-black text-black block ml-1">メールアドレス</label>
              <input
                type="email"
                required
                placeholder="player@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full bg-gray-50 border-4 border-black p-3 md:p-4 rounded-xl text-base font-bold shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] focus:translate-y-0.5 focus:shadow-none outline-none transition-all"
              />
            </div>

            {/* パスワード入力 */}
            <div className="space-y-2">
              <label className="text-sm md:text-base font-black text-black block ml-1">パスワード</label>
              <input
                type="password"
                required
                placeholder="6文字以上のパスワード"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-gray-50 border-4 border-black p-3 md:p-4 rounded-xl text-base font-bold shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] focus:translate-y-0.5 focus:shadow-none outline-none transition-all"
              />
            </div>

            {/* 送信ボタン */}
            <div className="pt-4">
              <button
                type="submit"
                disabled={loading}
                className="w-full bg-[#FFEF5E] text-black border-4 border-black py-4 md:py-5 rounded-xl md:rounded-2xl font-black text-lg md:text-xl text-center shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] md:shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-none active:bg-yellow-400 transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? "通信中...⏳" : isLogin ? "ログインして遊ぶ 🎮" : "アカウントを作成 🚀"}
              </button>
            </div>
          </form>

          {/* 切り替えボタン */}
          <div className="mt-6 md:mt-8 text-center pt-4 border-t-4 border-gray-200">
            <p className="text-sm md:text-base font-bold text-gray-600 mb-2">
              {isLogin ? "初めての方はこちら" : "すでにアカウントをお持ちの方"}
            </p>
            <button
              type="button"
              onClick={() => {
                setIsLogin(!isLogin);
                setErrorMsg("");
              }}
              className="text-black font-black underline decoration-4 decoration-[#FFEF5E] hover:bg-[#FFEF5E] transition-colors px-2 py-1 rounded"
            >
              {isLogin ? "新規登録画面へ移動" : "ログイン画面へ移動"}
            </button>
          </div>
        </div>
      </div>
    </main>
  );
}