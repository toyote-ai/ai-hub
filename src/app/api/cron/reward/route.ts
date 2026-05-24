import { NextResponse } from 'next/server';
import { supabase } from '../../../utils/supabase'; // 迷子にならない絶対確実な相対パス

// Vercel Cron（自動実行システム）から呼び出されるAPI
export async function GET(request: Request) {
  try {
    // 安全チェック：Vercelからの正式な呼び出しかどうかを確認
    const authHeader = request.headers.get('authorization');
    
    // 💡 修正：CRON_SECRETが未設定、またはヘッダーのトークンが一致しない場合は即座にアクセスを拒否
    if (!process.env.CRON_SECRET || authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const now = new Date();
    const isSunday = now.getDay() === 0; // 日曜日判定
    const isEndOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate() === now.getDate(); // 月末判定

    // 全ゲームをデータベースから取得
    const { data: games } = await supabase.from('games').select('id, title');
    if (!games) return NextResponse.json({ message: 'No games found' });

    for (const game of games) {
      // 1. デイリー集計＆配布（毎日実行）
      await distributeRewards(game.id, game.title, 'daily', 30, 0.1);

      // 2. ウィークリー集計＆配布（日曜日のみ実行）
      if (isSunday) {
        await distributeRewards(game.id, game.title, 'weekly', 150, 0.2);
      }

      // 3. マンスリー集計＆配布（月末のみ実行）
      if (isEndOfMonth) {
        await distributeRewards(game.id, game.title, 'monthly', 500, 0.5);
      }
    }

    return NextResponse.json({ success: true, message: 'Rewards distributed successfully!' });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// 順位を集計して1位の人にポイントを配る共通プログラム
async function distributeRewards(gameId: string, gameTitle: string, type: 'daily' | 'weekly' | 'monthly', basePoint: number, multiplier: number) {
  const now = new Date();
  let startTime = new Date();

  if (type === 'daily') startTime = new Date(now.getTime() - 24 * 60 * 60 * 1000);
  else if (type === 'weekly') startTime = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
  else if (type === 'monthly') startTime = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

  // 対象期間のスコアを上から順番に取得
  const { data: logs } = await supabase
    .from('play_logs')
    .select('player_id')
    .eq('game_id', gameId)
    .gte('created_at', startTime.toISOString())
    .order('score', { ascending: false });

  if (!logs || logs.length === 0) return;

  // 重複を排除して、純粋なプレイ人数を数える
  const uniquePlayers = Array.from(new Set(logs.map((log: any) => log.player_id)));
  const totalPlayers = uniquePlayers.length; // プレイユーザー数（N人）

  // ランキング1位のプレイヤーIDを特定
  const winnerId = uniquePlayers[0];
  
  // 計算式：基本ポイント ＋ （人数 × 倍率）
  const rewardPoints = Math.floor(basePoint + (totalPlayers * multiplier));
  let rankName = type === 'daily' ? 'デイリー' : type === 'weekly' ? 'ウィークリー' : 'マンスリー';

  // 1位のプレイヤーの所持ポイント（RP）を増やす
  const { data: currentPoints } = await supabase.from('user_points').select('rank_points').eq('user_id', winnerId).single();
  
  if (currentPoints) {
    await supabase.from('user_points').update({ rank_points: currentPoints.rank_points + rewardPoints }).eq('user_id', winnerId);
  }

  // 対象者のポスト（通知メッセージ）に手紙を insert する
  await supabase.from('notifications').insert([{
    user_id: winnerId,
    title: `🏆 ${rankName}ランキング1位獲得！`,
    message: `おめでとうございます！『${gameTitle}』の${rankName}ランキングで1位を獲得しました！\n\n【報酬】${rewardPoints} RP\n（参加人数: ${totalPlayers}人）\n\n引き続きAI-Hubをお楽しみください！`
  }]);
}