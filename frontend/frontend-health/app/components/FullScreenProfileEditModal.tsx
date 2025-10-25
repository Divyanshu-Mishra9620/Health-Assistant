"use client";

import React, { useState, useEffect } from "react";
import toast from "react-hot-toast";

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL;

interface UserProfile {
  email: string;
  full_name: string;
  age: number;
  gender: string;
  height_cm: number;
  weight_kg: number;
  blood_group: string;
  allergies: string;
}

interface FullScreenProfileEditModalProps {
  isOpen: boolean;
  onClose: () => void;
  user: UserProfile | null;
  onSave: (updatedUser: UserProfile) => void;
}

const FullScreenProfileEditModal: React.FC<FullScreenProfileEditModalProps> = ({
  isOpen,
  onClose,
  user,
  onSave,
}) => {
  const [formData, setFormData] = useState<UserProfile>(
    user || {
      email: "",
      full_name: "",
      age: 0,
      gender: "",
      height_cm: 0,
      weight_kg: 0,
      blood_group: "",
      allergies: "",
    }
  );

  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (user) {
      setFormData(user);
    }
  }, [user, isOpen]);

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.full_name.trim()) {
      newErrors.full_name = "Full name is required";
    }

    if (!formData.age || formData.age <= 0 || formData.age > 150) {
      newErrors.age = "Age is required and must be between 1 and 150";
    }

    if (!formData.gender) {
      newErrors.gender = "Gender is required";
    }

    if (
      !formData.height_cm ||
      formData.height_cm <= 0 ||
      formData.height_cm > 300
    ) {
      newErrors.height_cm =
        "Height is required and must be between 1 and 300 cm";
    }

    if (
      !formData.weight_kg ||
      formData.weight_kg <= 0 ||
      formData.weight_kg > 500
    ) {
      newErrors.weight_kg =
        "Weight is required and must be between 1 and 500 kg";
    }

    if (!formData.blood_group) {
      newErrors.blood_group = "Blood group is required";
    }

    if (!formData.allergies.trim()) {
      newErrors.allergies =
        "Please enter any allergies or write 'None' if not applicable";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement
    >
  ) => {
    const { name, value } = e.target;

    let parsedValue: number | string = value;
    if (name === "age" || name === "height_cm" || name === "weight_kg") {
      parsedValue = value === "" ? 0 : Number.parseFloat(value);
    }

    setFormData((prev) => ({
      ...prev,
      [name]: parsedValue,
    }));

    if (errors[name]) {
      setErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors[name];
        return newErrors;
      });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      const errorCount = Object.keys(errors).length;
      toast.error(
        `Please fix ${errorCount} error${
          errorCount > 1 ? "s" : ""
        } before submitting`,
        {
          duration: 4000,
        }
      );
      return;
    }

    setLoading(true);

    try {
      const backendUrl = BACKEND_URL?.endsWith("/")
        ? BACKEND_URL.slice(0, -1)
        : BACKEND_URL;

      const url = `${backendUrl}/user/profile/`;

      const response = await fetch(url, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("access_token")}`,
        },
        body: JSON.stringify({
          full_name: formData.full_name,
          age: formData.age,
          gender: formData.gender,
          height_cm: formData.height_cm,
          weight_kg: formData.weight_kg,
          blood_group: formData.blood_group,
          allergies: formData.allergies,
        }),
      });

      if (!response.ok) {
        const errorData = await response.text();
        console.error("Error response:", errorData);
        throw new Error("Failed to update profile");
      }

      const responseData = await response.json();

      if (responseData.user) {
        localStorage.setItem("user", JSON.stringify(responseData.user));

        onSave(responseData.user);
      }

      toast.success("Profile updated successfully!");
      onClose();
    } catch (error) {
      console.error("Error updating profile:", error);
      toast.error("Failed to update profile. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 w-screen h-screen overflow-hidden animate-fade-in"
      style={{ backgroundColor: "var(--modalBackground)" }}
    >
      <div className="w-full h-full flex flex-col overflow-hidden">
        <div
          className="w-full h-full overflow-hidden flex flex-col"
          style={{
            backgroundColor: "var(--modalBackground)",
          }}
        >
          <div
            className="p-6 md:p-8 flex-shrink-0 border-b"
            style={{
              background:
                "linear-gradient(135deg, var(--surface), var(--backgroundSecondary))",
              borderColor: "var(--border)",
            }}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <div className="w-14 h-14 rounded-2xl flex items-center justify-center medical-gradient shadow-lg">
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
                      d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                    />
                  </svg>
                </div>
                <div>
                  <h1
                    className="text-2xl md:text-3xl font-bold mb-1"
                    style={{ color: "var(--textPrimary)" }}
                  >
                    Edit Your Profile
                  </h1>
                  <p
                    className="text-sm"
                    style={{ color: "var(--textSecondary)" }}
                  >
                    Update your personal health information
                  </p>
                </div>
              </div>
              <button
                onClick={onClose}
                className="p-3 rounded-xl transition-all duration-200 hover:rotate-90"
                style={{ color: "var(--textSecondary)" }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = "var(--hover)";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = "transparent";
                }}
                aria-label="Close modal"
              >
                <svg
                  className="w-6 h-6"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>
            </div>
          </div>

          <form
            onSubmit={handleSubmit}
            className="overflow-y-auto p-6 md:p-8 scrollbar-thin"
            style={{
              backgroundColor: "var(--background)",
              maxHeight: "calc(90vh - 180px)",
            }}
          >
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
              <div>
                <label
                  htmlFor="full_name"
                  className="block text-sm font-semibold mb-2"
                  style={{ color: "var(--textPrimary)" }}
                >
                  Full Name <span style={{ color: "var(--error)" }}>*</span>
                </label>
                <input
                  type="text"
                  id="full_name"
                  name="full_name"
                  value={formData.full_name}
                  onChange={handleChange}
                  className="w-full px-4 py-3 rounded-xl transition-all duration-200 shadow-sm hover:shadow-md"
                  style={
                    errors.full_name
                      ? {
                          borderWidth: "2px",
                          borderColor: "var(--error)",
                          backgroundColor: "var(--errorLight)",
                          color: "var(--textPrimary)",
                        }
                      : {
                          borderWidth: "2px",
                          borderColor: "var(--chatInputBorder)",
                          backgroundColor: "var(--chatInputBackground)",
                          color: "var(--textPrimary)",
                        }
                  }
                  onFocus={(e) => {
                    if (!errors.full_name) {
                      e.currentTarget.style.borderColor = "var(--primary)";
                      e.currentTarget.style.boxShadow =
                        "0 0 0 3px var(--primaryLight)";
                    }
                  }}
                  onBlur={(e) => {
                    e.currentTarget.style.borderColor =
                      "var(--chatInputBorder)";
                    e.currentTarget.style.boxShadow = "none";
                  }}
                  placeholder="Enter your full name"
                />
                {errors.full_name && (
                  <div
                    className="flex items-start gap-2 mt-2 p-3 rounded-lg"
                    style={{
                      backgroundColor: "rgba(239, 68, 68, 0.1)",
                      borderLeft: "3px solid #ef4444",
                    }}
                  >
                    <svg
                      className="w-5 h-5 flex-shrink-0 mt-0.5"
                      style={{ color: "#ef4444" }}
                      fill="currentColor"
                      viewBox="0 0 20 20"
                    >
                      <path
                        fillRule="evenodd"
                        d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z"
                        clipRule="evenodd"
                      />
                    </svg>
                    <p
                      className="text-sm font-medium"
                      style={{ color: "#dc2626" }}
                    >
                      {errors.full_name}
                    </p>
                  </div>
                )}
              </div>

              <div>
                <label
                  htmlFor="email"
                  className="block text-sm font-semibold mb-2"
                  style={{ color: "var(--textPrimary)" }}
                >
                  Email Address
                </label>
                <input
                  type="email"
                  id="email"
                  value={formData.email}
                  disabled
                  className="w-full px-4 py-3 rounded-xl shadow-sm cursor-not-allowed"
                  style={{
                    borderWidth: "2px",
                    borderColor: "var(--border)",
                    backgroundColor: "var(--backgroundSecondary)",
                    color: "var(--textMuted)",
                  }}
                  placeholder="Email cannot be changed"
                />
                <p
                  className="text-xs mt-1"
                  style={{ color: "var(--textMuted)" }}
                >
                  Email cannot be changed. Contact support if needed.
                </p>
              </div>

              <div>
                <label
                  htmlFor="age"
                  className="block text-sm font-semibold mb-2"
                  style={{ color: "var(--textPrimary)" }}
                >
                  Age <span style={{ color: "var(--error)" }}>*</span>
                </label>
                <input
                  type="number"
                  id="age"
                  name="age"
                  value={formData.age || ""}
                  onChange={handleChange}
                  min="0"
                  max="150"
                  className="w-full px-4 py-3 rounded-xl transition-all duration-200 shadow-sm hover:shadow-md"
                  style={
                    errors.age
                      ? {
                          borderWidth: "2px",
                          borderColor: "var(--error)",
                          backgroundColor: "var(--errorLight)",
                          color: "var(--textPrimary)",
                        }
                      : {
                          borderWidth: "2px",
                          borderColor: "var(--chatInputBorder)",
                          backgroundColor: "var(--chatInputBackground)",
                          color: "var(--textPrimary)",
                        }
                  }
                  onFocus={(e) => {
                    if (!errors.age) {
                      e.currentTarget.style.borderColor = "var(--primary)";
                      e.currentTarget.style.boxShadow =
                        "0 0 0 3px var(--primaryLight)";
                    }
                  }}
                  onBlur={(e) => {
                    e.currentTarget.style.borderColor =
                      "var(--chatInputBorder)";
                    e.currentTarget.style.boxShadow = "none";
                  }}
                  placeholder="Enter your age"
                />
                {errors.age && (
                  <div
                    className="flex items-start gap-2 mt-2 p-3 rounded-lg"
                    style={{
                      backgroundColor: "rgba(239, 68, 68, 0.1)",
                      borderLeft: "3px solid #ef4444",
                    }}
                  >
                    <svg
                      className="w-5 h-5 flex-shrink-0 mt-0.5"
                      style={{ color: "#ef4444" }}
                      fill="currentColor"
                      viewBox="0 0 20 20"
                    >
                      <path
                        fillRule="evenodd"
                        d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z"
                        clipRule="evenodd"
                      />
                    </svg>
                    <p
                      className="text-sm font-medium"
                      style={{ color: "#dc2626" }}
                    >
                      {errors.age}
                    </p>
                  </div>
                )}
              </div>

              <div>
                <label
                  htmlFor="gender"
                  className="block text-sm font-semibold mb-2"
                  style={{ color: "var(--textPrimary)" }}
                >
                  Gender <span style={{ color: "var(--error)" }}>*</span>
                </label>
                <select
                  id="gender"
                  name="gender"
                  value={formData.gender}
                  onChange={handleChange}
                  className="w-full px-4 py-3 rounded-xl transition-all duration-200 shadow-sm hover:shadow-md"
                  style={
                    errors.gender
                      ? {
                          borderWidth: "2px",
                          borderColor: "var(--error)",
                          backgroundColor: "var(--errorLight)",
                          color: "var(--textPrimary)",
                        }
                      : {
                          borderWidth: "2px",
                          borderColor: "var(--chatInputBorder)",
                          backgroundColor: "var(--chatInputBackground)",
                          color: "var(--textPrimary)",
                        }
                  }
                  onFocus={(e) => {
                    if (!errors.gender) {
                      e.currentTarget.style.borderColor = "var(--primary)";
                      e.currentTarget.style.boxShadow =
                        "0 0 0 3px var(--primaryLight)";
                    }
                  }}
                  onBlur={(e) => {
                    e.currentTarget.style.borderColor =
                      "var(--chatInputBorder)";
                    e.currentTarget.style.boxShadow = "none";
                  }}
                >
                  <option value="Male">Male</option>
                  <option value="Female">Female</option>
                  <option value="Other">Other</option>
                  <option value="Prefer not to say">Prefer not to say</option>
                </select>
                {errors.gender && (
                  <div
                    className="flex items-start gap-2 mt-2 p-3 rounded-lg"
                    style={{
                      backgroundColor: "rgba(239, 68, 68, 0.1)",
                      borderLeft: "3px solid #ef4444",
                    }}
                  >
                    <svg
                      className="w-5 h-5 flex-shrink-0 mt-0.5"
                      style={{ color: "#ef4444" }}
                      fill="currentColor"
                      viewBox="0 0 20 20"
                    >
                      <path
                        fillRule="evenodd"
                        d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z"
                        clipRule="evenodd"
                      />
                    </svg>
                    <p
                      className="text-sm font-medium"
                      style={{ color: "#dc2626" }}
                    >
                      {errors.gender}
                    </p>
                  </div>
                )}
              </div>

              <div>
                <label
                  htmlFor="height_cm"
                  className="block text-sm font-semibold mb-2"
                  style={{ color: "var(--textPrimary)" }}
                >
                  Height (cm) <span style={{ color: "var(--error)" }}>*</span>
                </label>
                <input
                  type="number"
                  id="height_cm"
                  name="height_cm"
                  value={formData.height_cm || ""}
                  onChange={handleChange}
                  min="0"
                  max="300"
                  className="w-full px-4 py-3 rounded-xl transition-all duration-200 shadow-sm hover:shadow-md"
                  style={
                    errors.height_cm
                      ? {
                          borderWidth: "2px",
                          borderColor: "var(--error)",
                          backgroundColor: "var(--errorLight)",
                          color: "var(--textPrimary)",
                        }
                      : {
                          borderWidth: "2px",
                          borderColor: "var(--chatInputBorder)",
                          backgroundColor: "var(--chatInputBackground)",
                          color: "var(--textPrimary)",
                        }
                  }
                  onFocus={(e) => {
                    if (!errors.height_cm) {
                      e.currentTarget.style.borderColor = "var(--primary)";
                      e.currentTarget.style.boxShadow =
                        "0 0 0 3px var(--primaryLight)";
                    }
                  }}
                  onBlur={(e) => {
                    e.currentTarget.style.borderColor =
                      "var(--chatInputBorder)";
                    e.currentTarget.style.boxShadow = "none";
                  }}
                  placeholder="Enter height in cm"
                />
                {errors.height_cm && (
                  <div
                    className="flex items-start gap-2 mt-2 p-3 rounded-lg"
                    style={{
                      backgroundColor: "rgba(239, 68, 68, 0.1)",
                      borderLeft: "3px solid #ef4444",
                    }}
                  >
                    <svg
                      className="w-5 h-5 flex-shrink-0 mt-0.5"
                      style={{ color: "#ef4444" }}
                      fill="currentColor"
                      viewBox="0 0 20 20"
                    >
                      <path
                        fillRule="evenodd"
                        d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z"
                        clipRule="evenodd"
                      />
                    </svg>
                    <p
                      className="text-sm font-medium"
                      style={{ color: "#dc2626" }}
                    >
                      {errors.height_cm}
                    </p>
                  </div>
                )}
              </div>

              <div>
                <label
                  htmlFor="weight_kg"
                  className="block text-sm font-semibold mb-2"
                  style={{ color: "var(--textPrimary)" }}
                >
                  Weight (kg) <span style={{ color: "var(--error)" }}>*</span>
                </label>
                <input
                  type="number"
                  id="weight_kg"
                  name="weight_kg"
                  value={formData.weight_kg || ""}
                  onChange={handleChange}
                  min="0"
                  max="500"
                  className="w-full px-4 py-3 rounded-xl transition-all duration-200 shadow-sm hover:shadow-md"
                  style={
                    errors.weight_kg
                      ? {
                          borderWidth: "2px",
                          borderColor: "var(--error)",
                          backgroundColor: "var(--errorLight)",
                          color: "var(--textPrimary)",
                        }
                      : {
                          borderWidth: "2px",
                          borderColor: "var(--chatInputBorder)",
                          backgroundColor: "var(--chatInputBackground)",
                          color: "var(--textPrimary)",
                        }
                  }
                  onFocus={(e) => {
                    if (!errors.weight_kg) {
                      e.currentTarget.style.borderColor = "var(--primary)";
                      e.currentTarget.style.boxShadow =
                        "0 0 0 3px var(--primaryLight)";
                    }
                  }}
                  onBlur={(e) => {
                    e.currentTarget.style.borderColor =
                      "var(--chatInputBorder)";
                    e.currentTarget.style.boxShadow = "none";
                  }}
                  placeholder="Enter weight in kg"
                />
                {errors.weight_kg && (
                  <div
                    className="flex items-start gap-2 mt-2 p-3 rounded-lg"
                    style={{
                      backgroundColor: "rgba(239, 68, 68, 0.1)",
                      borderLeft: "3px solid #ef4444",
                    }}
                  >
                    <svg
                      className="w-5 h-5 flex-shrink-0 mt-0.5"
                      style={{ color: "#ef4444" }}
                      fill="currentColor"
                      viewBox="0 0 20 20"
                    >
                      <path
                        fillRule="evenodd"
                        d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z"
                        clipRule="evenodd"
                      />
                    </svg>
                    <p
                      className="text-sm font-medium"
                      style={{ color: "#dc2626" }}
                    >
                      {errors.weight_kg}
                    </p>
                  </div>
                )}
              </div>

              <div>
                <label
                  htmlFor="blood_group"
                  className="block text-sm font-semibold mb-2"
                  style={{ color: "var(--textPrimary)" }}
                >
                  Blood Group <span style={{ color: "var(--error)" }}>*</span>
                </label>
                <select
                  id="blood_group"
                  name="blood_group"
                  value={formData.blood_group}
                  onChange={handleChange}
                  className="w-full px-4 py-3 rounded-xl transition-all duration-200 shadow-sm hover:shadow-md"
                  style={
                    errors.blood_group
                      ? {
                          borderWidth: "2px",
                          borderColor: "var(--error)",
                          backgroundColor: "var(--errorLight)",
                          color: "var(--textPrimary)",
                        }
                      : {
                          borderWidth: "2px",
                          borderColor: "var(--chatInputBorder)",
                          backgroundColor: "var(--chatInputBackground)",
                          color: "var(--textPrimary)",
                        }
                  }
                  onFocus={(e) => {
                    if (!errors.blood_group) {
                      e.currentTarget.style.borderColor = "var(--primary)";
                      e.currentTarget.style.boxShadow =
                        "0 0 0 3px var(--primaryLight)";
                    }
                  }}
                  onBlur={(e) => {
                    e.currentTarget.style.borderColor =
                      "var(--chatInputBorder)";
                    e.currentTarget.style.boxShadow = "none";
                  }}
                >
                  <option value="">Select blood group</option>
                  <option value="O+">O+</option>
                  <option value="O-">O-</option>
                  <option value="A+">A+</option>
                  <option value="A-">A-</option>
                  <option value="B+">B+</option>
                  <option value="B-">B-</option>
                  <option value="AB+">AB+</option>
                  <option value="AB-">AB-</option>
                </select>
                {errors.blood_group && (
                  <div
                    className="flex items-start gap-2 mt-2 p-3 rounded-lg"
                    style={{
                      backgroundColor: "rgba(239, 68, 68, 0.1)",
                      borderLeft: "3px solid #ef4444",
                    }}
                  >
                    <svg
                      className="w-5 h-5 flex-shrink-0 mt-0.5"
                      style={{ color: "#ef4444" }}
                      fill="currentColor"
                      viewBox="0 0 20 20"
                    >
                      <path
                        fillRule="evenodd"
                        d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z"
                        clipRule="evenodd"
                      />
                    </svg>
                    <p
                      className="text-sm font-medium"
                      style={{ color: "#dc2626" }}
                    >
                      {errors.blood_group}
                    </p>
                  </div>
                )}
              </div>
            </div>

            <div className="mb-8">
              <label
                htmlFor="allergies"
                className="block text-sm font-semibold mb-2"
                style={{ color: "var(--textPrimary)" }}
              >
                Allergies / Medical Conditions{" "}
                <span style={{ color: "var(--error)" }}>*</span>
              </label>
              <textarea
                id="allergies"
                name="allergies"
                value={formData.allergies}
                onChange={handleChange}
                rows={4}
                className="w-full px-4 py-3 rounded-xl transition-all duration-200 resize-none shadow-sm hover:shadow-md"
                style={
                  errors.allergies
                    ? {
                        borderWidth: "2px",
                        borderColor: "var(--error)",
                        backgroundColor: "var(--errorLight)",
                        color: "var(--textPrimary)",
                      }
                    : {
                        borderWidth: "2px",
                        borderColor: "var(--chatInputBorder)",
                        backgroundColor: "var(--chatInputBackground)",
                        color: "var(--textPrimary)",
                      }
                }
                onFocus={(e) => {
                  if (!errors.allergies) {
                    e.currentTarget.style.borderColor = "var(--primary)";
                    e.currentTarget.style.boxShadow =
                      "0 0 0 3px var(--primaryLight)";
                  }
                }}
                onBlur={(e) => {
                  e.currentTarget.style.borderColor = "var(--chatInputBorder)";
                  e.currentTarget.style.boxShadow = "none";
                }}
                placeholder="Enter any allergies or medical conditions, or write 'None' if not applicable"
              />
              {errors.allergies && (
                <div
                  className="flex items-start gap-2 mt-2 p-3 rounded-lg"
                  style={{
                    backgroundColor: "rgba(239, 68, 68, 0.1)",
                    borderLeft: "3px solid #ef4444",
                  }}
                >
                  <svg
                    className="w-5 h-5 flex-shrink-0 mt-0.5"
                    style={{ color: "#ef4444" }}
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path
                      fillRule="evenodd"
                      d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z"
                      clipRule="evenodd"
                    />
                  </svg>
                  <p
                    className="text-sm font-medium"
                    style={{ color: "#dc2626" }}
                  >
                    {errors.allergies}
                  </p>
                </div>
              )}
            </div>

            <div
              className="flex gap-4 pt-6 border-t"
              style={{ borderColor: "var(--border)" }}
            >
              <button
                type="button"
                onClick={onClose}
                className="flex-1 px-6 py-3.5 rounded-xl font-semibold transition-all duration-200 border-2 hover:scale-105"
                style={{
                  color: "var(--textPrimary)",
                  backgroundColor: "transparent",
                  borderColor: "var(--border)",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = "var(--hover)";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = "transparent";
                }}
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading}
                className="flex-1 px-6 py-3.5 rounded-xl font-semibold transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2 shadow-lg hover:shadow-xl hover:scale-105"
                style={{
                  backgroundColor: "var(--success)",
                  color: "white",
                }}
                onMouseEnter={(e) => {
                  if (!loading) {
                    e.currentTarget.style.transform = "translateY(-2px)";
                  }
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = "translateY(0)";
                }}
              >
                {loading ? (
                  <>
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    <span>Saving...</span>
                  </>
                ) : (
                  <>
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
                        d="M5 13l4 4L19 7"
                      />
                    </svg>
                    <span>Save Changes</span>
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default FullScreenProfileEditModal;
