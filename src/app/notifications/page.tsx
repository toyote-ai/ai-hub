"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/app/utils/supabase";
import Header from "@/app/components/Header";
import Link from "next/link";
import { useRouter } from "next/navigation";

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const fetchNotifs = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        router.push("/login");
        return;
      }

      const { data } = await supabase
        .from("notifications")
        .select("*")
        .eq("user_id", session.user.id)
        .order("created_at", { ascending: false });
      
      if (data) setNotifications(data);
      setLoading(false);
    };
    fetchNotifs();
  }, [router]);

  const markAsRead = async (id: number) => {
    const notif = notifications.find(n => n.id === id);
    if (notif && !notif.is_read) {
      await supabase.from("notifications").update({ is_read: true }).eq("id", id);
      setNotifications(notifications.map(n => n.id === id ? { ...n, is_read: true } : n));
    }
  };

  if (loading) return <div className="min-h-screen bg-[#FFFDF0] flex items-center justify-center font-black">読み込み中...🚀</div>;

  return (
    <main className="min-h-screen px-3 md:px-6 py-6 md:py-12 max-w-4xl mx-auto font-sans bg-[#FFFDF0]">
      <Header title="ポスト" />

      <div className="bg-white border-4 border-black p-6 md:p-10 rounded-2xl md:rounded-3xl shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] mt-4">
        <h1 className="text-2xl md:text-4xl font-black mb-8 border-b-4 border-black pb-3 flex items-center gap-2">
          <span>📮</span> ポスト（受信箱）
        </h1>

        {notifications.length > 0 ? (
          <div className="space-y-4">
            {notifications.map((notif) => (
              <div 
                key={notif.id}
                onClick={() => markAsRead(notif.id)}
                className={`border-4 border-black p-4 md:p-6 rounded-2xl transition-all ${
                  notif.is_read 
                    ? "bg-gray-50 opacity-60" 
                    : "bg-white shadow-[4px_4px_0px_0px_rgba(255,239,94,1)] hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-none cursor-pointer"
                }`}
              >
                <div className="flex justify-between items-start mb-2 gap-2">
                  <div className="flex items-center gap-2">
                    {/* 🌟 追加：未読の時だけ、ネオブロータリズム風の可愛いNEWバッジを出す */}
                    {!notif.is_read && (
                      <span className="bg-red-500 text-white text-xs px-2 py-0.5 border-2 border-black rounded-md font-black shrink-0 animate-pulse">
                        NEW
                      </span>
                    )}
                    <h3 className="text-base md:text-xl font-black text-black">{notif.title}</h3>
                  </div>
                  <span className="text-xs font-bold text-gray-400 whitespace-nowrap">
                    {new Date(notif.created_at).toLocaleDateString('ja-JP')}
                  </span>
                </div>
                <p className="text-sm md:text-base font-bold text-gray-700 whitespace-pre-wrap">{notif.message}</p>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-center text-gray-500 font-bold py-10">ポストは空っぽです 📭</p>
        )}

        <div className="mt-10 text-center">
          <Link href="/mypage" className="font-bold text-gray-500 hover:text-black underline">マイページに戻る</Link>
        </div>
      </div>
    </main>
  );
}