"use client";
import axios from "axios";
import React, { useState } from "react";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import Link from "next/link";
import Cookies from "js-cookie";

export default function SignInForm() {
  const router = useRouter();
  const BACKEND_URL =
    process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:8000";

  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    if (!formData.email || !formData.password) {
      toast.error("Please fill in all fields");
      setIsSubmitting(false);
      return;
    }

    try {
      const response = await axios.post(`${BACKEND_URL}/api/token/`, formData, {
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
      });

      localStorage.setItem("access_token", response.data.access);
      localStorage.setItem("refresh_token", response.data.refresh);
      localStorage.setItem("user", JSON.stringify(response.data.user));
      Cookies.set("access_token", response.data.access, {
        expires: 1,
        path: "/",
      });
      Cookies.set("refresh_token", response.data.refresh, {
        expires: 1,
        path: "/",
      });

      toast.success("Logged in successfully!");
      router.push("/");
    } catch (error) {
      const errorMessage = axios.isAxiosError(error)
        ? error.response?.data?.non_field_errors?.[0] ||
          error.response?.data?.detail ||
          "Invalid credentials. Please try again."
        : "An unexpected error occurred.";
      toast.error(errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div
      className="min-h-screen flex"
      style={{
        background:
          "linear-gradient(135deg, var(--background) 0%, var(--backgroundSecondary) 100%)",
      }}
    >
      <div className="hidden lg:flex lg:w-1/2 p-12 flex-col justify-between relative overflow-hidden">
        <div
          className="absolute inset-0 opacity-10"
          style={{
            background:
              "linear-gradient(135deg, var(--primary), var(--success))",
          }}
        />

        <div className="relative z-10">
          <div className="flex items-center space-x-3 mb-8">
            <div
              className="p-3 rounded-2xl shadow-2xl"
              style={{
                background:
                  "linear-gradient(135deg, var(--primary), var(--success))",
              }}
            >
              <svg
                className="w-8 h-8 text-white"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"
                />
              </svg>
            </div>
            <span
              className="text-2xl font-bold"
              style={{ color: "var(--textPrimary)" }}
            >
              Health Assistant
            </span>
          </div>
        </div>

        <div className="relative z-10 space-y-8">
          <div>
            <h1
              className="text-5xl font-bold mb-6 leading-tight"
              style={{ color: "var(--textPrimary)" }}
            >
              Your Personal
              <br />
              <span
                style={{
                  background:
                    "linear-gradient(135deg, var(--primary), var(--success))",
                  WebkitBackgroundClip: "text",
                  WebkitTextFillColor: "transparent",
                  backgroundClip: "text",
                }}
              >
                Health Companion
              </span>
            </h1>
            <p
              className="text-lg leading-relaxed"
              style={{ color: "var(--textSecondary)" }}
            >
              Get instant AI-powered health insights, track your wellness
              journey, and make informed decisions about your health.
            </p>
          </div>

          <div className="grid grid-cols-2 gap-6">
            {[
              {
                icon: "🩺",
                title: "AI Diagnosis",
                desc: "Smart health analysis",
              },
              {
                icon: "📊",
                title: "Health Records",
                desc: "Track your progress",
              },
              { icon: "💊", title: "Medication", desc: "Never miss a dose" },
              { icon: "🔒", title: "Secure", desc: "Your data is safe" },
            ].map((feature, idx) => (
              <div
                key={idx}
                className="p-4 rounded-xl backdrop-blur-sm"
                style={{
                  backgroundColor: "rgba(255, 255, 255, 0.05)",
                  borderWidth: "1px",
                  borderColor: "var(--border)",
                }}
              >
                <div className="text-3xl mb-2">{feature.icon}</div>
                <h3
                  className="font-semibold mb-1"
                  style={{ color: "var(--textPrimary)" }}
                >
                  {feature.title}
                </h3>
                <p className="text-sm" style={{ color: "var(--textMuted)" }}>
                  {feature.desc}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="w-full lg:w-1/2 flex items-center justify-center p-8">
        <div className="w-full max-w-md">
          <div className="lg:hidden flex justify-center mb-8">
            <div
              className="p-4 rounded-2xl shadow-xl"
              style={{
                background:
                  "linear-gradient(135deg, var(--primary), var(--success))",
              }}
            >
              <svg
                className="w-10 h-10 text-white"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"
                />
              </svg>
            </div>
          </div>

          <div className="mb-8">
            <h2
              className="text-3xl font-bold mb-2"
              style={{ color: "var(--textPrimary)" }}
            >
              Welcome Back
            </h2>
            <p style={{ color: "var(--textSecondary)" }}>
              Sign in to continue to your health dashboard
            </p>
          </div>

          <div
            className="rounded-3xl p-8 shadow-2xl backdrop-blur-xl"
            style={{
              backgroundColor: "var(--surface)",
              borderWidth: "1px",
              borderColor: "var(--border)",
            }}
          >
            <form className="space-y-6" onSubmit={handleSubmit}>
              <div>
                <label
                  htmlFor="email"
                  className="block text-sm font-semibold mb-2"
                  style={{ color: "var(--textPrimary)" }}
                >
                  Email Address
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <svg
                      className="h-5 w-5"
                      style={{ color: "var(--textMuted)" }}
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M16 12a4 4 0 10-8 0 4 4 0 008 0zm0 0v1.5a2.5 2.5 0 005 0V12a9 9 0 10-9 9m4.5-1.206a8.959 8.959 0 01-4.5 1.207"
                      />
                    </svg>
                  </div>
                  <input
                    id="email"
                    name="email"
                    type="email"
                    value={formData.email}
                    onChange={handleChange}
                    required
                    placeholder="you@example.com"
                    disabled={isSubmitting}
                    className="w-full pl-12 pr-4 py-3.5 rounded-xl transition-all duration-200"
                    style={{
                      backgroundColor: "var(--chatInputBackground)",
                      borderWidth: "2px",
                      borderColor: "var(--border)",
                      color: "var(--textPrimary)",
                    }}
                    onFocus={(e) => {
                      e.currentTarget.style.borderColor = "var(--primary)";
                      e.currentTarget.style.boxShadow =
                        "0 0 0 3px var(--primaryLight)";
                    }}
                    onBlur={(e) => {
                      e.currentTarget.style.borderColor = "var(--border)";
                      e.currentTarget.style.boxShadow = "none";
                    }}
                  />
                </div>
              </div>

              <div>
                <label
                  htmlFor="password"
                  className="block text-sm font-semibold mb-2"
                  style={{ color: "var(--textPrimary)" }}
                >
                  Password
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <svg
                      className="h-5 w-5"
                      style={{ color: "var(--textMuted)" }}
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
                      />
                    </svg>
                  </div>
                  <input
                    id="password"
                    name="password"
                    type={showPassword ? "text" : "password"}
                    value={formData.password}
                    onChange={handleChange}
                    required
                    placeholder="Enter your password"
                    disabled={isSubmitting}
                    className="w-full pl-12 pr-12 py-3.5 rounded-xl transition-all duration-200"
                    style={{
                      backgroundColor: "var(--chatInputBackground)",
                      borderWidth: "2px",
                      borderColor: "var(--border)",
                      color: "var(--textPrimary)",
                    }}
                    onFocus={(e) => {
                      e.currentTarget.style.borderColor = "var(--primary)";
                      e.currentTarget.style.boxShadow =
                        "0 0 0 3px var(--primaryLight)";
                    }}
                    onBlur={(e) => {
                      e.currentTarget.style.borderColor = "var(--border)";
                      e.currentTarget.style.boxShadow = "none";
                    }}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-0 pr-4 flex items-center"
                    style={{ color: "var(--textMuted)" }}
                  >
                    {showPassword ? (
                      <svg
                        className="h-5 w-5"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21"
                        />
                      </svg>
                    ) : (
                      <svg
                        className="h-5 w-5"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                        />
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                        />
                      </svg>
                    )}
                  </button>
                </div>
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <input
                    id="remember-me"
                    name="remember-me"
                    type="checkbox"
                    className="h-4 w-4 rounded cursor-pointer"
                    style={{
                      accentColor: "var(--primary)",
                    }}
                  />
                  <label
                    htmlFor="remember-me"
                    className="ml-2 block text-sm cursor-pointer"
                    style={{ color: "var(--textSecondary)" }}
                  >
                    Remember me
                  </label>
                </div>
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full py-4 rounded-xl font-semibold transition-all duration-200 shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed hover:scale-[1.02] active:scale-[0.98]"
                style={{
                  background:
                    "linear-gradient(135deg, var(--primary), var(--success))",
                  color: "white",
                }}
              >
                {isSubmitting ? (
                  <span className="flex items-center justify-center space-x-2">
                    <svg
                      className="animate-spin h-5 w-5"
                      xmlns="http://www.w3.org/2000/svg"
                      fill="none"
                      viewBox="0 0 24 24"
                    >
                      <circle
                        className="opacity-25"
                        cx="12"
                        cy="12"
                        r="10"
                        stroke="currentColor"
                        strokeWidth="4"
                      />
                      <path
                        className="opacity-75"
                        fill="currentColor"
                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                      />
                    </svg>
                    <span>Signing in...</span>
                  </span>
                ) : (
                  <span className="flex items-center justify-center space-x-2">
                    <span>Sign In</span>
                    <svg
                      className="w-5 h-5"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M14 5l7 7m0 0l-7 7m7-7H3"
                      />
                    </svg>
                  </span>
                )}
              </button>
            </form>

            <div className="mt-8">
              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <div
                    className="w-full border-t"
                    style={{ borderColor: "var(--border)" }}
                  />
                </div>
                <div className="relative flex justify-center text-sm">
                  <span
                    className="px-4 rounded-full"
                    style={{
                      backgroundColor: "var(--surface)",
                      color: "var(--textMuted)",
                    }}
                  >
                    New to Health Assistant?
                  </span>
                </div>
              </div>
            </div>

            <div className="mt-6 text-center">
              <Link
                href="/signup"
                className="inline-flex items-center space-x-2 font-semibold transition-all duration-200 hover:scale-105"
                style={{ color: "var(--primary)" }}
              >
                <span>Create an account</span>
                <svg
                  className="w-4 h-4"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 5l7 7-7 7"
                  />
                </svg>
              </Link>
            </div>
          </div>

          <div
            className="mt-6 flex items-center justify-center space-x-2 text-sm"
            style={{ color: "var(--textMuted)" }}
          >
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
              <path
                fillRule="evenodd"
                d="M2.166 4.999A11.954 11.954 0 0010 1.944 11.954 11.954 0 0017.834 5c.11.65.166 1.32.166 2.001 0 5.225-3.34 9.67-8 11.317C5.34 16.67 2 12.225 2 7c0-.682.057-1.35.166-2.001zm11.541 3.708a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                clipRule="evenodd"
              />
            </svg>
            <span>Secured with 256-bit encryption</span>
          </div>
        </div>
      </div>
    </div>
  );
}
