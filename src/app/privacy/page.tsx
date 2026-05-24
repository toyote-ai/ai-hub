"use client";

import Header from "@/app/components/Header";
import Link from "next/link";

export default function PrivacyPolicy() {
  return (
    <main className="min-h-screen px-3 md:px-6 py-6 md:py-12 max-w-4xl mx-auto font-sans bg-[#FFFDF0]">
      <Header title="プライバシーポリシー" />

      <div className="bg-white border-4 border-black p-4 md:p-8 rounded-2xl md:rounded-3xl shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] md:shadow-[10px_10px_0px_0px_rgba(0,0,0,1)] mt-4 md:mt-8">
        <h1 className="text-2xl md:text-4xl font-black mb-6 md:mb-8 text-black border-b-4 border-black pb-3">
          <span>🔒</span> プライバシーポリシー
        </h1>

        <div className="space-y-6 md:space-y-8 text-sm md:text-base font-bold text-gray-800 leading-relaxed select-text">
          <p>
            AI-Hub（以下、「当プラットフォーム」といいます。）は、ユーザーの皆様の個人情報の取扱いについて、以下のとおりプライバシーポリシー（以下、「本ポリシー」といいます。）を定めます。
          </p>

          <section className="space-y-2">
            <h2 className="text-base md:text-xl font-black text-black border-l-4 border-black pl-2">第1条（収集する個人情報）</h2>
            <p>当プラットフォームは、ユーザーが本サービスを利用する際に、以下の情報を収集する場合があります。</p>
            <ul className="list-disc list-inside space-y-1 pl-2">
              <li>メールアドレスおよび認証情報（ログイン・新規登録時）</li>
              <li>ユーザー名（プレイヤー名）</li>
              <li>ゲームのプレイ履歴、スコア、獲得ポイント等のサービス利用履歴</li>
              <li>端末情報、ログ情報、Cookieおよび匿名ID等のアクセス情報</li>
            </ul>
          </section>

          <section className="space-y-2">
            <h2 className="text-base md:text-xl font-black text-black border-l-4 border-black pl-2">第2条（利用目的）</h2>
            <p>収集した個人情報は、以下の目的で利用いたします。</p>
            <ul className="list-disc list-inside space-y-1 pl-2">
              <li>本サービスの提供、運営、および維持のため</li>
              <li>ユーザー間のランキング表示やポイント管理のため</li>
              <li>不正行為、チート行為、規約違反の監視および対応のため</li>
              <li>本サービスの改善、新機能の開発、およびマーケティング分析のため</li>
              <li>ユーザーからのお問い合わせへの対応のため</li>
            </ul>
          </section>

          <section className="space-y-2">
            <h2 className="text-base md:text-xl font-black text-black border-l-4 border-black pl-2">第3条（第三者への提供）</h2>
            <p>当プラットフォームは、次に掲げる場合を除き、あらかじめユーザーの同意を得ることなく第三者に個人情報を提供することはありません。</p>
            <ul className="list-disc list-inside space-y-1 pl-2">
              <li>法令に基づく場合</li>
              <li>人の生命、身体または財産の保護のために必要がある場合</li>
              <li>不正アクセスやサイバー攻撃等、当プラットフォームの権利や財産を保護するために必要な場合</li>
            </ul>
          </section>

          <section className="space-y-2">
            <h2 className="text-base md:text-xl font-black text-black border-l-4 border-black pl-2">第4条（アクセス解析と広告について）</h2>
            <p>1. 当プラットフォームでは、利用状況の分析のためにGoogleアナリティクス等のアクセス解析ツールを使用しています。これらはトラフィックデータの収集のためにCookieを使用しており、データは匿名で収集され、個人を特定するものではありません。</p>
            <p>2. 当プラットフォームは、第三者配信の広告サービス（Google AdSense等）を利用する場合があります。広告配信事業者は、ユーザーの興味に応じた広告を表示するためにCookieを使用することがあります。ユーザーはブラウザの設定によりCookieを無効にすることができます。</p>
          </section>

          <section className="space-y-2">
            <h2 className="text-base md:text-xl font-black text-black border-l-4 border-black pl-2">第5条（免責事項）</h2>
            <p>当プラットフォームからリンクやバナーなどによって他のサイトに移動された場合、移動先サイトで提供される情報、サービス等について当プラットフォームは一切の責任を負いません。</p>
          </section>

          <section className="space-y-2">
            <h2 className="text-base md:text-xl font-black text-black border-l-4 border-black pl-2">第6条（プライバシーポリシーの変更）</h2>
            <p>本ポリシーの内容は、ユーザーに通知することなく変更することができるものとします。変更後のプライバシーポリシーは、本ウェブサイトに掲載したときから効力を生じるものとします。</p>
          </section>

          <p className="text-right text-xs md:text-sm text-gray-500 pt-4">
            制定日：2026年5月17日
          </p>
        </div>
      </div>
      
      <div className="mt-8 text-center">
        <Link href="/" className="inline-block bg-black text-white border-4 border-black px-6 py-3 rounded-xl font-black text-sm md:text-base shadow-[4px_4px_0px_0px_rgba(255,239,94,1)] hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-none transition-all">
          🏠 ホームへ戻る
        </Link>
      </div>
    </main>
  );
}