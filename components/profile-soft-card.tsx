"use client";

import { Card } from "./ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "./ui/avatar";
import { User } from "@/lib/api";
import { Skeleton } from "./ui/skeleton";

interface ProfileSoftCardProps {
  user: User | null;
  loading: boolean;
  className?: string;
}

export function ProfileSoftCard({ user, loading, className = "" }: ProfileSoftCardProps) {
  if (loading) {
    return (
      <Card className={`p-6 ${className}`}>
        <div className="space-y-4">
          <Skeleton className="h-20 w-20 rounded-full" />
          <Skeleton className="h-6 w-32" />
          <Skeleton className="h-4 w-48" />
        </div>
      </Card>
    );
  }

  return (
    <Card className={`bg-gradient-to-br from-primary/10 to-primary/5 border-primary/20 p-6 shadow-soft-xl ${className}`}>
      <div className="flex items-center gap-4">
        <Avatar className="h-20 w-20 ring-4 ring-white shadow-lg">
          <AvatarImage src={user?.profilePicture || "/placeholder-user.jpg"} />
          <AvatarFallback>{user?.name?.charAt(0) || "U"}</AvatarFallback>
        </Avatar>
        <div>
          <h2 className="text-2xl font-bold text-gray-800">{user?.name || "Loading..."}</h2>
          <p className="text-gray-600">{user?.employeeId || ""}</p>
          <p className="text-sm text-gray-500">{user?.email || ""}</p>
          <p className="text-sm text-gray-500">{user?.department?.name || ""}</p>
        </div>
      </div>
    </Card>
  );
}