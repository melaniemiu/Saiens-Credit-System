"use client";

import { Card } from "./ui/card";
import { Progress } from "./ui/progress";
import { User } from "@/lib/api";

interface DailyCreditsCardProps {
  user: User | null;
}

export function DailyCreditsCard({ user }: DailyCreditsCardProps) {
  const remainingCredits = user?.remainingDailyCredits || 0;
  const dailyLimit = user?.dailyCreditsLimit || 5;
  const usedCredits = dailyLimit - remainingCredits;
  const progress = (usedCredits / dailyLimit) * 100;

  return (
    <Card className="p-6 h-full bg-orange-50 border-orange-200">
      <h3 className="font-medium mb-2">今日剩餘 credit</h3>
      <div className="space-y-2">
        <div className="flex justify-between items-center">
          <span className="text-sm text-muted-foreground">已使用</span>
          <span className="text-sm font-medium">{usedCredits}/{dailyLimit}</span>
        </div>
        <Progress value={progress} className="h-2" />
        <div className="text-2xl font-bold text-orange-600 text-center">
          {remainingCredits}
        </div>
      </div>
    </Card>
  );
}