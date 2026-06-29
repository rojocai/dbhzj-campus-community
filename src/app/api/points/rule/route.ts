import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

// GET /api/points/rule - Return points rules
export async function GET() {
  const rules = {
    dailySignIn: {
      base: 10,
      description: "每日签到基础积分",
    },
    streakBonuses: [
      { consecutiveDays: 3, bonus: 5, description: "连续签到3天额外奖励" },
      { consecutiveDays: 7, bonus: 15, description: "连续签到7天额外奖励" },
      { consecutiveDays: 30, bonus: 50, description: "连续签到30天额外奖励" },
    ],
    actions: [
      { action: "createPost", points: 20, description: "发布帖子" },
      { action: "postLiked", points: 5, description: "帖子被点赞" },
      { action: "postCommented", points: 3, description: "帖子被评论" },
      { action: "likePost", points: 2, description: "点赞帖子" },
      { action: "postEssenced", points: 50, description: "帖子被加精" },
    ],
    experience: {
      formula: "每消耗 10 积分获得 1 经验值",
      levels: "经验值达到阈值自动升级",
    },
  };

  return NextResponse.json(rules);
}
