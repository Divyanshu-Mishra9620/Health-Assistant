"use client";
import axios from "axios";
import React, { useState } from "react";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import Link from "next/link";
import Cookies from "js-cookie";

export default function SignupForm() {
  const router = useRouter();
  const BACKEND_URL =
    process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:8000";

  const [formData, setFormData] = useState({
    full_name: "",
    email: "",
    password: "",
    age: "",
    gender: "",
    height_cm: "",
    weight_kg: "",
    blood_group: "",
    allergies: "",
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const handleChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement
    >
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    if (
      !formData.full_name ||
      !formData.email ||
      !formData.password ||
      !formData.gender
    ) {
      toast.error("Please fill in all required fields");
      setIsSubmitting(false);
      return;
    }

    try {
      const cleanedData = {
        ...formData,
        age: formData.age ? Number(formData.age) : null,
        height_cm: formData.height_cm ? parseFloat(formData.height_cm) : null,
        weight_kg: formData.weight_kg ? parseFloat(formData.weight_kg) : null,
      };

      const response = await axios.post(
        `${BACKEND_URL}/api/register/`,
        cleanedData
      );

      toast.success("Account created successfully!");
      localStorage.setItem("access_token", response.data.access);
      localStorage.setItem("refresh_token", response.data.refresh);
      Cookies.set("access_token", response.data.access, {
        expires: 1,
        path: "/",
      });
      Cookies.set("refresh_token", response.data.refresh, {
        expires: 1,
        path: "/",
      });
      localStorage.setItem("user", JSON.stringify(response.data.user));
      router.push("/");
    } catch (error) {
      const errorMessage = axios.isAxiosError(error)
        ? error.response?.data?.message || "Signup failed. Please try again."
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
      <div className="hidden lg:flex lg:w-2/5 p-12 flex-col justify-start relative overflow-hidden">
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
              Start Your
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
                Wellness Journey
              </span>
            </h1>
            <p
              className="text-lg leading-relaxed"
              style={{ color: "var(--textSecondary)" }}
            >
              Join thousands of users taking control of their health with
              AI-powered insights and personalized recommendations.
            </p>
          </div>

          <div className="space-y-4">
            {[
              {
                icon: "✓",
                text: "Personalized health tracking",
              },
              {
                icon: "✓",
                text: "AI-powered medical insights",
              },
              {
                icon: "✓",
                text: "Secure & private data",
              },
              {
                icon: "✓",
                text: "24/7 health assistance",
              },
            ].map((feature, idx) => (
              <div key={idx} className="flex items-center space-x-3">
                <div
                  className="w-6 h-6 rounded-full flex items-center justify-center text-sm font-bold text-white"
                  style={{
                    background:
                      "linear-gradient(135deg, var(--primary), var(--success))",
                  }}
                >
                  {feature.icon}
                </div>
                <p
                  className="text-base"
                  style={{ color: "var(--textPrimary)" }}
                >
                  {feature.text}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="w-full lg:w-3/5 flex items-center justify-center p-8 overflow-y-auto">
        <div className="w-full max-w-2xl">
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
              Create Your Account
            </h2>
            <p style={{ color: "var(--textSecondary)" }}>
              Fill in your details to get started with personalized health care
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
            <form className="space-y-5" onSubmit={handleSubmit}>
              <div>
                <h3
                  className="text-lg font-semibold mb-4 pb-2"
                  style={{
                    color: "var(--textPrimary)",
                    borderBottom: "2px solid var(--border)",
                  }}
                >
                  Personal Information
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  <div className="md:col-span-2">
                    <label
                      htmlFor="full_name"
                      className="block text-sm font-semibold mb-2"
                      style={{ color: "var(--textPrimary)" }}
                    >
                      Full Name <span style={{ color: "#ef4444" }}>*</span>
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
                            d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                          />
                        </svg>
                      </div>
                      <input
                        id="full_name"
                        name="full_name"
                        type="text"
                        value={formData.full_name}
                        onChange={handleChange}
                        required
                        placeholder="Enter your full name"
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

                  <div className="md:col-span-2">
                    <label
                      htmlFor="email"
                      className="block text-sm font-semibold mb-2"
                      style={{ color: "var(--textPrimary)" }}
                    >
                      Email Address <span style={{ color: "#ef4444" }}>*</span>
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

                  <div className="md:col-span-2">
                    <label
                      htmlFor="password"
                      className="block text-sm font-semibold mb-2"
                      style={{ color: "var(--textPrimary)" }}
                    >
                      Password <span style={{ color: "#ef4444" }}>*</span>
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
                        placeholder="Create a strong password"
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

                  <div>
                    <label
                      htmlFor="age"
                      className="block text-sm font-semibold mb-2"
                      style={{ color: "var(--textPrimary)" }}
                    >
                      Age
                    </label>
                    <input
                      id="age"
                      name="age"
                      type="number"
                      value={formData.age}
                      onChange={handleChange}
                      min={0}
                      max={120}
                      placeholder="Your age"
                      disabled={isSubmitting}
                      className="w-full px-4 py-3.5 rounded-xl transition-all duration-200"
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

                  <div>
                    <label
                      htmlFor="gender"
                      className="block text-sm font-semibold mb-2"
                      style={{ color: "var(--textPrimary)" }}
                    >
                      Gender <span style={{ color: "#ef4444" }}>*</span>
                    </label>
                    <select
                      id="gender"
                      name="gender"
                      value={formData.gender}
                      onChange={handleChange}
                      required
                      disabled={isSubmitting}
                      className="w-full px-4 py-3.5 rounded-xl transition-all duration-200"
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
                    >
                      <option value="">Select Gender</option>
                      <option value="Male">Male</option>
                      <option value="Female">Female</option>
                      <option value="Other">Other</option>
                    </select>
                  </div>
                </div>
              </div>

              <div>
                <h3
                  className="text-lg font-semibold mb-4 pb-2"
                  style={{
                    color: "var(--textPrimary)",
                    borderBottom: "2px solid var(--border)",
                  }}
                >
                  Health Information
                  <span
                    className="text-xs font-normal ml-2"
                    style={{ color: "var(--textMuted)" }}
                  >
                    (Optional but recommended)
                  </span>
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  <div>
                    <label
                      htmlFor="height_cm"
                      className="block text-sm font-semibold mb-2"
                      style={{ color: "var(--textPrimary)" }}
                    >
                      Height (cm)
                    </label>
                    <input
                      id="height_cm"
                      name="height_cm"
                      type="number"
                      value={formData.height_cm}
                      onChange={handleChange}
                      step={0.1}
                      min={0}
                      placeholder="e.g., 170"
                      disabled={isSubmitting}
                      className="w-full px-4 py-3.5 rounded-xl transition-all duration-200"
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

                  <div>
                    <label
                      htmlFor="weight_kg"
                      className="block text-sm font-semibold mb-2"
                      style={{ color: "var(--textPrimary)" }}
                    >
                      Weight (kg)
                    </label>
                    <input
                      id="weight_kg"
                      name="weight_kg"
                      type="number"
                      value={formData.weight_kg}
                      onChange={handleChange}
                      step={0.1}
                      min={0}
                      placeholder="e.g., 70"
                      disabled={isSubmitting}
                      className="w-full px-4 py-3.5 rounded-xl transition-all duration-200"
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

                  <div>
                    <label
                      htmlFor="blood_group"
                      className="block text-sm font-semibold mb-2"
                      style={{ color: "var(--textPrimary)" }}
                    >
                      Blood Group
                    </label>
                    <input
                      id="blood_group"
                      name="blood_group"
                      type="text"
                      value={formData.blood_group}
                      onChange={handleChange}
                      placeholder="e.g., O+"
                      disabled={isSubmitting}
                      className="w-full px-4 py-3.5 rounded-xl transition-all duration-200"
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

                  <div className="md:col-span-2">
                    <label
                      htmlFor="allergies"
                      className="block text-sm font-semibold mb-2"
                      style={{ color: "var(--textPrimary)" }}
                    >
                      Allergies
                    </label>
                    <textarea
                      id="allergies"
                      name="allergies"
                      rows={3}
                      value={formData.allergies}
                      onChange={handleChange}
                      placeholder="List any allergies (e.g., peanuts, penicillin) or type 'none'"
                      disabled={isSubmitting}
                      className="w-full px-4 py-3.5 rounded-xl transition-all duration-200 resize-none"
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
              </div>

              <div className="pt-2">
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
                      <span>Creating your account...</span>
                    </span>
                  ) : (
                    <span className="flex items-center justify-center space-x-2">
                      <span>Create Account</span>
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
              </div>
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
                    Already have an account?
                  </span>
                </div>
              </div>
            </div>

            <div className="mt-6 text-center">
              <Link
                href="/signin"
                className="inline-flex items-center space-x-2 font-semibold transition-all duration-200 hover:scale-105"
                style={{ color: "var(--primary)" }}
              >
                <span>Sign in instead</span>
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
            <span>Your information is encrypted and secure</span>
          </div>
        </div>
      </div>
    </div>
  );
}
