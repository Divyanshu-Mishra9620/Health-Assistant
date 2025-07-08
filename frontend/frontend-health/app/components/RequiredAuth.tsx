"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

export default function RequireAuth({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const localToken = localStorage.getItem("access_token");

    if (!localToken) {
      router.push("/signin");
    } else {
      setLoading(false);
    }
  }, [router]);

  if (loading) return <p>Loading...</p>;

  return <>{children}</>;
}
