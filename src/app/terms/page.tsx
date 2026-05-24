"use client";

import Header from "@/app/components/Header";
import Link from "next/link";

export default function TermsOfService() {
  return (
    <main className="min-h-screen px-3 md:px-6 py-6 md:py-12 max-w-4xl mx-auto font-sans bg-[#FFFDF0]">
      <Header title="利用規約" />

      <div className="bg-white border-4 border-black p-4 md:p-8 rounded-2xl md:rounded-3xl shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] md:shadow-[10px_10px_0px_0px_rgba(0,0,0,1)] mt-4 md:mt-8">
        <h1 className="text-2xl md:text-4xl font-black mb-6 md:mb-8 text-black border-b-4 border-black pb-3">
          <span>📜</span> 利用規約
        </h1>

        <div className="space-y-6 md:space-y-8 text-sm md:text-base font-bold text-gray-800 leading-relaxed select-text">
          <p>
            この利用規約（以下、「本規約」といいます。）は、AI-Hub（以下、「当プラットフォーム」といいます。）が提供するサービス（以下、「本サービス」といいます。）の利用条件を定めるものです。ユーザーの皆様（以下、「ユーザー」といいます。）には、本規約に従って本サービスをご利用いただきます。
          </p>

          <section className="space-y-2">
            <h2 className="text-base md:text-xl font-black text-black border-l-4 border-black pl-2">第1条（適用）</h2>
            <p>本規約は、ユーザーと当プラットフォームとの間の本サービスの利用に関わる一切の関係に適用されるものとします。</p>
          </section>

          <section className="space-y-2">
            <h2 className="text-base md:text-xl font-black text-black border-l-4 border-black pl-2">第2条（利用登録とプレイヤー名）</h2>
            <p>1. 本サービスにおいては、登録希望者が本規約に同意の上、当プラットフォームの定める方法によって利用登録を申請し、当プラットフォームがこれを承認することによって利用登録が完了します。</p>
            <p>2. ユーザーは、登録時に第三者に不快感を与えない適切なユーザー名（プレイヤー名）を設定するものとします。メールアドレスの情報を推測できるようなユーザー名の設定は、セキュリティ保護の観点から禁止します。</p>
          </section>

          <section className="space-y-2">
            <h2 className="text-base md:text-xl font-black text-black border-l-4 border-black pl-2">第3条（ゲームの投稿と著作権）</h2>
            <p>1. ユーザーは、AIを用いて生成した健全かつ合法的なHTML/JavaScript形式のミニゲームのみを投稿できるものとします。</p>
            <p>2. 投稿されたゲームのコードに関して、他者の著作権、特許権、商標権、プライバシーその他の権利を侵害していないことをユーザーが保証するものとします。万が一権利侵害が発覚した場合、ユーザーは自己の責任において解決するものとします。</p>
            <p>3. ユーザーが当プラットフォームにゲームを投稿した場合、当プラットフォームに対し、当該ゲームを無償で非独占的に利用（複製、公開、配信、バナー広告等への掲載、改変等）する権利を許諾したものとみなします。</p>
          </section>

          <section className="space-y-2">
            <h2 className="text-base md:text-xl font-black text-black border-l-4 border-black pl-2">第4条（ポイントシステムと不正対策）</h2>
            <p>1. 当プラットフォームは、ユーザーが特定の条件（初回プレイ、動画広告の視聴等）を満たした際に、プラットフォーム独自の「ポイント」を付与する場合があります。</p>
            <p>2. ポイントの付与基準、有効期限、還元率等は、当プラットフォームの独自の判断でいつでも変更または廃止できるものとします。不正なマクロ利用や自動化ツールによるプレイ、スコアデータの改ざん、チート行為によって不当に取得されたポイントは、管理者の判断で事前通告なくいつでも没収・削除できるものとします。</p>
          </section>

          <section className="space-y-2">
            <h2 className="text-base md:text-xl font-black text-black border-l-4 border-black pl-2">第5条（禁止事項）</h2>
            <p>ユーザーは、本サービスの利用にあたり、以下の行為をしてはなりません。</p>
            <ul className="list-disc list-inside space-y-1 pl-2">
              <li>法令または公序良俗に違反する行為</li>
              <li>過度な暴力的表現、過度な残虐表現、性的な表現、または他者を誹謗中傷する内容を含むゲームの投稿</li>
              <li>当プラットフォームのサーバーまたはネットワークの機能を破壊したり、妨害したりする行為（不正アクセス、自動ツールの使用等）</li>
              <li>本サービスの運営を妨害するおそれのあるすべての行為</li>
            </ul>
          </section>

          <section className="space-y-2">
            <h2 className="text-base md:text-xl font-black text-black border-l-4 border-black pl-2">第6条（規約違反ゲームの削除および利用制限）</h2>
            <p>当プラットフォームの管理者は、ユーザーが本規約のいずれかの条項に違反した場合、または公序良俗に反すると当プラットフォームが判断した場合、ユーザーへの事前の通知や理由の開示をすることなく、以下の措置をいつでも講じることができるものとします。</p>
            <ul className="list-disc list-inside space-y-1 pl-2">
              <li>投稿されたゲームデータおよびスコア等の即時削除</li>
              <li>本サービスの全部または一部の利用制限、アカウントの停止または削除</li>
              <li>獲得ポイントの全没収</li>
            </ul>
          </section>

          <section className="space-y-2">
            <h2 className="text-base md:text-xl font-black text-black border-l-4 border-black pl-2">第7条（免責事項）</h2>
            <p>当プラットフォームは、本サービスに事実上または法律上の瑕疵（安全性、信頼性、正確性、完全性、有効性、特定の目的への適合性、セキュリティなどに関する欠陥、エラーやバグ、権利侵害などを含みます。）がないことを明示的にも黙示的にも保証しておりません。本サービスの利用、または投稿されたゲームのプレイによってユーザーまたは第三者に生じた損害について、当プラットフォームは一切の責任を負いません。</p>
          </section>

          <section className="space-y-2">
            <h2 className="text-base md:text-xl font-black text-black border-l-4 border-black pl-2">第8条（利用規約の変更）</h2>
            <p>当プラットフォームは、必要と判断した場合には、ユーザーに通知することなくいつでも本規約を変更することができるものとします。本規約の変更後、ユーザーが本サービスを利用した場合には、ユーザーは変更後の規約に同意したものとみなします。</p>
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