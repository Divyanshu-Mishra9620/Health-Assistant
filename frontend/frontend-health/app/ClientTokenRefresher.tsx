"use client";

import { useEffect } from "react";
import axios from "axios";
import { useRouter } from "next/navigation";

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL;

export default function ClientTokenRefresher() {
  const router = useRouter();

  useEffect(() => {
    const isTokenExpired = (token: string): boolean => {
      try {
        const payload = JSON.parse(atob(token.split(".")[1]));
        if (!payload.exp) return true;

        const now = Date.now() / 1000;
        return payload.exp < now + 300;
      } catch (e) {
        console.error("Invalid token:", e);
        return true;
      }
    };

    const refreshAccessToken = async (refreshToken: string) => {
      try {
        const res = await axios.post(`${BACKEND_URL}/api/token/refresh/`, {
          refresh: refreshToken,
        });

        localStorage.setItem("access_token", res.data.access);

        if (res.data.refresh) {
          localStorage.setItem("refresh_token", res.data.refresh);
        }
      } catch (error) {
        console.error("Refresh failed:", error);
        localStorage.removeItem("access_token");
        localStorage.removeItem("refresh_token");
        router.push("/signin");
      }
    };

    const checkTokenAndRefresh = async () => {
      const accessToken = localStorage.getItem("access_token");
      const refreshToken = localStorage.getItem("refresh_token");

      if (!refreshToken) {
        router.push("/signin");
        return;
      }

      if (!accessToken || isTokenExpired(accessToken)) {
        await refreshAccessToken(refreshToken);
      }
    };

    checkTokenAndRefresh();

    const interval = setInterval(checkTokenAndRefresh, 5 * 60 * 1000);

    return () => clearInterval(interval);
  }, [router]);

  return null;
}
