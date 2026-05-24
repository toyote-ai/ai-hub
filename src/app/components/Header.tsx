"use client";

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { supabase } from '@/app/utils/supabase';
import { useRouter, usePathname } from 'next/navigation';

interface HeaderProps {
  title?: string;
}

export default function Header({ title }: HeaderProps) {
  const [user, setUser] = useState<any>(null);
  const [unreadCount, setUnreadCount] = useState(0); // 🌟 追加：未読カウント用
  const router = useRouter();
  const pathname = usePathname(); // 🌟 追加：ページ移動を検知するため

  useEffect(() => {
    const checkUserAndNotifs = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      setUser(session?.user || null);

      // 🌟 追加：ログインしている場合のみ、未読の通知をカウントする
      if (session?.user) {
        const { count } = await supabase
          .from('notifications')
          .select('*', { count: 'exact', head: true })
          .eq('user_id', session.user.id)
          .eq('is_read', false);
        
        setUnreadCount(count || 0);
      }
    };
    checkUserAndNotifs();

    const { data: authListener } = supabase.auth.onAuthStateChange((event, session) => {
      setUser(session?.user || null);
    });

    return () => {
      authListener.subscription.unsubscribe();
    };
  }, [pathname]); // 🌟 ページが変わるたびに通知数を確認する

  const handleLogout = async () => {
    await supabase.auth.signOut();
    alert("ログアウトしました！👋");
    router.refresh();
  };

  return (
    <header className="flex justify-between items-center mb-10 md:mb-20 gap-2 md:gap-6">
      <div className="flex items-center gap-2 md:gap-6">
        <Link href="/">
          <div className="bg-[#FFEF5E] border-4 border-black px-3 py-1 md:px-6 md:py-2 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] rounded-xl cursor-pointer hover:translate-y-1 hover:shadow-none transition-all">
            <h1 className="text-xl md:text-3xl font-black tracking-wider">AI-Hub</h1>
          </div>
        </Link>
        {title && (
          <h2 className="text-sm md:text-xl font-bold border-l-4 border-black pl-3 md:pl-4 hidden md:block">{title}</h2>
        )}
      </div>
      
      <nav className="flex items-center gap-3 md:gap-6">
        {user ? (
          <>
            {/* 🌟 追加：通知（ポスト）ベルアイコン */}
            <Link 
              href="/notifications" 
              className="relative bg-white border-2 md:border-4 border-black p-1.5 md:p-2 rounded-lg md:rounded-xl shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:translate-y-[1px] hover:translate-x-[1px] hover:shadow-none transition-all flex items-center justify-center"
            >
              <span className="text-base md:text-xl leading-none block">🔔</span>
              {unreadCount > 0 && (
                <span className="absolute -top-2 -right-2 bg-red-500 text-white text-[9px] md:text-[10px] font-black px-1.5 py-0.5 rounded-full border-2 border-black animate-bounce">
                  {unreadCount}
                </span>
              )}
            </Link>

            <Link href="/mypage" className="text-sm md:text-lg font-bold border-b-2 border-transparent hover:border-black transition-all">
              マイページ
            </Link>
            <button 
              onClick={handleLogout} 
              className="bg-white text-black border-4 border-black px-3 py-2 md:px-6 md:py-3 rounded-xl text-sm md:text-base font-bold shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:translate-y-[2px] hover:translate-x-[2px] hover:shadow-none transition-all"
            >
              ログアウト
            </button>
          </>
        ) : (
          <>
            <Link href="/login" className="text-sm md:text-lg font-bold border-b-2 border-transparent hover:border-black transition-all">
              ログイン
            </Link>
            <Link href="/login" className="bg-black text-white px-3 py-2 md:px-6 md:py-3 rounded-xl text-sm md:text-base font-bold shadow-[4px_4px_0px_0px_rgba(255,239,94,1)] hover:translate-y-[2px] hover:translate-x-[2px] hover:shadow-none transition-all inline-block">
              新規登録
            </Link>
          </>
        )}
      </nav>
    </header>
  );
}