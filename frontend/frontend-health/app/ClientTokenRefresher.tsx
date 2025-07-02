"use client";

import { useEffect } from "react";
import axios from "axios";
import { useRouter } from "next/navigation";

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL;

export default function ClientTokenRefresher() {
  const router = useRouter();

  useEffect(() => {
    const refreshAccessToken = async () => {
      const refresh = localStorage.getItem("refresh_token");
      if (!refresh) {
        router.push("/signin");
        return;
      }

      try {
        const res = await axios.post(`${BACKEND_URL}/api/token/refresh/`, {
          refresh,
        });

        localStorage.setItem("access_token", res.data.access);
      } catch (error) {
        console.error("Token refresh failed:", error);
        localStorage.removeItem("access_token");
        localStorage.removeItem("refresh_token");
        router.push("/signin");
      }
    };

    refreshAccessToken();
  }, [router]);

  return null;
}
