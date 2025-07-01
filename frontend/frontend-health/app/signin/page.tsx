"use client";
import axios from "axios";
import React, { useState } from "react";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import Link from "next/link";

export default function SignupForestTheme() {
  const router = useRouter();
  const BACKEND_URL =
    process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:8000";
  const [data, setData] = useState({
    email: "",
    password: "",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement
    >
  ) => {
    setData({ ...data, [e.target.name]: e.target.value });
  };

  const resetForm = () => {
    setData({
      email: "",
      password: "",
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    if (!data.email) {
      toast.error("Please enter your email");
      setIsSubmitting(false);
      return;
    }
    if (!data.password) {
      toast.error("Please create a password");
      setIsSubmitting(false);
      return;
    }

    try {
      const res = await axios.post(`${BACKEND_URL}/api/token/`, data, {
        headers: {
          "Content-Type": "application/json",
        },
      });
      console.log(res);
      localStorage.setItem("access", res.data.access);
      localStorage.setItem("refresh", res.data.refresh);

      toast.success("Logged in successfully!");
      resetForm();
      router.push("/");
    } catch (error: unknown) {
      if (axios.isAxiosError(error)) {
        const errorMessage =
          error.response?.data?.non_field_errors?.[0] ||
          error.response?.data?.detail ||
          "Signin failed. Please try again.";

        toast.error(errorMessage);
      } else {
        toast.error("An unexpected error occurred.");
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div
      className="flex flex-col justify-center items-center p-6 min-h-screen bg-gradient-to-b from-green-900 to-green-800"
      style={{
        backgroundImage: `url("https://www.transparenttextures.com/patterns/wood-pattern.png")`,
      }}
    >
      <div className="text-3xl font-extrabold text-amber-400 mb-6 text-center drop-shadow-md">
        🌿 Sign-in to Your Health-Assistant 🌲
      </div>

      <div className="text-xl font-semibold  text-black mb-6 text-center drop-shadow-md">
        Don&#96;t have an account?{" "}
        <Link href={"/signup"} className="hover:text-teal-950 hover:underline">
          Sign up
        </Link>
      </div>

      <form
        onSubmit={handleSubmit}
        className="w-full max-w-md bg-green-800 bg-opacity-90 p-6 rounded-xl shadow-lg border border-amber-200"
      >
        {[
          {
            label: "Email",
            name: "email",
            type: "email",
            placeholder: "Enter your email",
          },
          {
            label: "Password",
            name: "password",
            type: "password",
            placeholder: "Create a password",
          },
        ].map((input, index) => (
          <div key={index} className="mb-4">
            <label className="block text-amber-100 text-sm font-medium mb-1">
              {input.label}
            </label>
            <input
              type={input.type}
              name={input.name}
              value={data[input.name as keyof typeof data]}
              placeholder={input.placeholder}
              onChange={handleChange}
              className="bg-green-700 border border-amber-300 text-amber-50 text-sm rounded-lg focus:ring-2 focus:ring-amber-400 focus:border-amber-500 block w-full p-2.5 placeholder-amber-300"
              disabled={isSubmitting}
            />
          </div>
        ))}

        <button
          type="submit"
          disabled={isSubmitting}
          className={`w-full ${
            isSubmitting ? "bg-amber-700" : "bg-amber-600 hover:bg-amber-700"
          } text-white font-semibold rounded-lg px-4 py-3 mt-2 shadow-md transition duration-300 ease-in-out ${
            !isSubmitting && "hover:scale-[1.01]"
          } flex items-center justify-center gap-2`}
        >
          {isSubmitting ? (
            <>
              <svg
                className="animate-spin h-5 w-5 text-white"
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
                ></circle>
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                ></path>
              </svg>
              Processing...
            </>
          ) : (
            <>🌲 Signin</>
          )}
        </button>
      </form>
    </div>
  );
}
