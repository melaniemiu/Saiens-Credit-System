import { useEffect, useState } from "react";
import { apiClient } from "@/lib/api-client";

export interface User {
  id: string;
  name: string;
  email: string;
  employeeId: string;
  role: 'user' | 'admin';
  department?: any;
  job?: any;
  profilePicture?: string;
  creditsSent: number;
  creditsReceived: number;
  remainingDailyCredits: number;
  dailyCreditsLimit: number;
}

export function useUser() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const response = await apiClient.getCurrentUser();
        if (response.data?.user) {
          setUser(response.data.user);
        } else {
          setUser(null);
        }
      } catch (error) {
        setUser(null);
      } finally {
        setLoading(false);
      }
    };

    fetchUser();
  }, []);

  return { user, loading };
}