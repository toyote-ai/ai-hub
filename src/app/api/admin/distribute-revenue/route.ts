import { NextResponse } from 'next/server';
import { supabase } from '../../../utils/supabase';

// 画像のポイント閾値・還元倍率に完全準拠した分配率％を導出する関数
function getCreatorDistributionRate(totalRp: number): { rank: string; rate: number } {
  if (totalRp >= 10000) return { rank: "レジェンド", rate: 0.60 }; // 2.0倍 × 30% = 60%
  if (totalRp >= 5000)  return { rank: "マスター", rate: 0.51 };   // 1.7倍 × 30% = 51%
  if (totalRp >= 1000)  return { rank: "プラチナ", rate: 0.45 };   // 1.5倍 × 30% = 45%
  if (totalRp >= 500)   return { rank: "ゴールド", rate: 0.39 };   // 1.3倍 × 30% = 39%
  if (totalRp >= 100)   return { rank: "シルバー", rate: 0.36 };   // 1.2倍 × 30% = 36%
  if (totalRp >= 30)    return { rank: "ブロンズ", rate: 0.30 };   // 1.0倍 × 30% = 30%
  return { rank: "エッグ", rate: 0.00 };                           // 0.0倍 = 0%
}

export async function POST(request: Request) {
  try {
    const authHeader = request.headers.get('authorization');
    if (!process.env.CRON_SECRET || authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const totalAdRevenue = parseInt(body.total_ad_revenue, 10); // AdSense確定手取り収益

    if (isNaN(totalAdRevenue) || totalAdRevenue <= 0) {
      return NextResponse.json({ error: '無効な広告総収益が指定されました。' }, { status: 400 });
    }

    const { data: games } = await supabase.from('games').select('id, title, user_id, period_play_count');
    if (!games || games.length === 0) return NextResponse.json({ message: '対象となるゲームがありません。' });

    // 期間内のサイト全体の全ゲーム総プレイ回数を合算
    const totalSitePlays = games.reduce((sum, g) => sum + (parseInt(g.period_play_count, 10) || 0), 0);
    if (totalSitePlays === 0) return NextResponse.json({ message: '集計期間内のプレイ回数が0回です。' });

    for (const game of games) {
      const playCount = parseInt(game.period_play_count, 10) || 0;
      if (playCount === 0) continue;

      // このゲームが獲得した「広告収益原資（比率配分）」を算出
      const gamePool = (playCount / totalSitePlays) * totalAdRevenue;

      // クリエイターの総RP（total_points + rank_points）を安全に合算取得
      const { data: pointsData } = await supabase
        .from('user_points')
        .select('total_points, rank_points, wallet_balance')
        .eq('user_id', game.user_id)
        .maybeSingle();

      const totalRp = (pointsData?.total_points || 0) + (pointsData?.rank_points || 0);
      const { rank, rate } = getCreatorDistributionRate(totalRp);

      // クリエイターの最終取り分を円単位で計算（端数切り捨てで運営の赤字を完全ブロック）
      const creatorEarnings = Math.floor(gamePool * rate);

      if (creatorEarnings > 0) {
        const currentWallet = pointsData?.wallet_balance || 0;

        if (pointsData) {
          await supabase.from('user_points').update({ wallet_balance: currentWallet + creatorEarnings }).eq('user_id', game.user_id);
        } else {
          await supabase.from('user_points').insert([{ user_id: game.user_id, wallet_balance: creatorEarnings }]);
        }

        // 作者ポストへ詳細な手紙（明細通知）を自動配信
        await supabase.from('notifications').insert([{
          user_id: game.user_id,
          title: `💰 【${nextMonthDateStr()}反映分】広告収益の確定分配手紙`,
          message: `お疲れ様です！あなたが投稿したゲーム『${game.title}』の確定分配が完了しました。\n\n【分配明細】\n・あなたの作品のプレイ回数: ${playCount} 回 (全体比率: ${((playCount / totalSitePlays) * 100).toFixed(2)}%)\n・ゲーム獲得広告原資: ${Math.floor(gamePool)} 円\n・現在の総経験値: ${totalRp} RP (【${rank}】ランク / 分配率: ${(rate * 100).toFixed(0)}%)\n\n上記に基づき、確定した【 ${creatorEarnings} 円 】がウォレット残高へ入金されました。マイページの「ウォレット」タブよりご確認ください。`
        }]);
      }

      // このゲームのプレイ回数を 0 にリセットして次の集計期間へ
      await supabase.from('games').update({ period_play_count: 0 }).eq('id', game.id);
    }

    return NextResponse.json({ success: true, message: `総額 ${totalAdRevenue} 円の収益を安全に分配しました。` });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

function nextMonthDateStr() {
  const now = new Date();
  let m = now.getMonth() + 1;
  return `${m}月10日`;
}