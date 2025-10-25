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
      router.push("/signin");
    } catch (error) {
      const errorMessage = axios.isAxiosError(error)
        ? error.response?.data?.message || "Signup failed. Please try again."
        : "An unexpected error occurred.";
      toast.error(errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  const inputFields = [
    { label: "Full Name", name: "full_name", type: "text", required: true },
    { label: "Email", name: "email", type: "email", required: true },
    {
      label: "Password",
      name: "password",
      type: "password",
      placeholder: "use @ in between",
      required: true,
    },
    { label: "Age", name: "age", type: "number", min: 0, max: 120 },
    {
      label: "Height (cm)",
      name: "height_cm",
      type: "number",
      step: 0.1,
      min: 0,
    },
    {
      label: "Weight (kg)",
      name: "weight_kg",
      type: "number",
      step: 0.1,
      min: 0,
    },
    { label: "Blood Group", name: "blood_group", type: "text" },
  ];

  const genderOptions = [
    { value: "", label: "-- Select Gender --" },
    { value: "Male", label: "Male" },
    { value: "Female", label: "Female" },
  ];

  return (
    <div
      className="min-h-screen flex flex-col justify-center py-12 sm:px-6 lg:px-8"
      style={{ backgroundColor: "var(--background)" }}
    >
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="flex justify-center">
          <div className="medical-gradient p-4 rounded-2xl shadow-lg">
            <svg
              className="w-12 h-12 text-white"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z"
              />
            </svg>
          </div>
        </div>
        <h2
          className="mt-6 text-center text-3xl font-extrabold"
          style={{ color: "var(--success)" }}
        >
          Join Health Assistant
        </h2>
        <p className="mt-2 text-center text-sm text-gray-600">
          Create your personalized health account
        </p>
        <p className="mt-1 text-center text-sm text-gray-500">
          Already have an account?{" "}
          <Link
            href="/signin"
            className="font-semibold hover:opacity-80 transition-opacity"
            style={{ color: "var(--success)" }}
          >
            Sign in instead
          </Link>
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="glass-effect py-8 px-4 shadow-xl sm:rounded-2xl sm:px-10">
          <form className="space-y-5" onSubmit={handleSubmit}>
            {inputFields.map((field) => (
              <div key={field.name}>
                <label
                  htmlFor={field.name}
                  className="block text-sm font-semibold text-gray-700 mb-2"
                >
                  {field.label}
                  {field.required && (
                    <span className="text-red-500 ml-1">*</span>
                  )}
                </label>
                <div className="mt-1">
                  <input
                    id={field.name}
                    name={field.name}
                    type={field.type}
                    value={formData[field.name as keyof typeof formData]}
                    onChange={handleChange}
                    required={field.required}
                    min={field.min}
                    max={field.max}
                    step={field.step}
                    placeholder={field.placeholder || ""}
                    className="input-field"
                  />
                </div>
              </div>
            ))}

            <div>
              <label
                htmlFor="gender"
                className="block text-sm font-semibold text-gray-700 mb-2"
              >
                Gender <span className="text-red-500 ml-1">*</span>
              </label>
              <select
                id="gender"
                name="gender"
                value={formData.gender}
                onChange={handleChange}
                required
                className="input-field"
              >
                {genderOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label
                htmlFor="allergies"
                className="block text-sm font-semibold text-gray-700 mb-2"
              >
                Allergies
              </label>
              <textarea
                id="allergies"
                name="allergies"
                rows={3}
                value={formData.allergies}
                onChange={handleChange}
                className="input-field resize-none"
                placeholder="List any allergies (e.g., peanuts, penicillin) or type 'none'"
              />
            </div>

            <div className="pt-2">
              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full btn-primary py-3 text-base disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSubmitting ? (
                  <span className="flex items-center justify-center space-x-2">
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
                    <span>Creating account...</span>
                  </span>
                ) : (
                  "Create Account"
                )}
              </button>
            </div>
          </form>

          <div className="mt-6">
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-300"></div>
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-2 bg-white text-gray-500">
                  Secure Registration
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
