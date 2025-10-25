"use client";

import {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
  useMemo,
  useCallback,
} from "react";

type Theme = "light" | "dark";

interface ThemeColors {
  // Primary colors
  primary: string;
  primaryHover: string;
  primaryActive: string;
  primaryLight: string;

  // Secondary colors
  secondary: string;
  secondaryHover: string;

  // Accent colors
  accent: string;
  accentHover: string;

  // Background layers
  background: string;
  backgroundSecondary: string;
  backgroundTertiary: string;

  // Surface colors
  surface: string;
  surfaceHover: string;
  surfaceActive: string;
  surfaceElevated: string;

  // Text colors
  textPrimary: string;
  textSecondary: string;
  textTertiary: string;
  textMuted: string;
  textLink: string;

  // Border colors
  border: string;
  borderHover: string;
  borderStrong: string;
  divider: string;

  // Status colors
  success: string;
  successLight: string;
  warning: string;
  warningLight: string;
  error: string;
  errorLight: string;
  info: string;
  infoLight: string;

  // Interactive states
  hover: string;
  active: string;
  focus: string;

  // Chat specific
  chatBackground: string;
  chatBubbleOwn: string;
  chatBubbleOther: string;
  chatBubbleOtherHover: string;
  chatInputBackground: string;
  chatInputBorder: string;

  // Sidebar specific
  sidebarBackground: string;
  sidebarHover: string;
  sidebarActive: string;
  sidebarDivider: string;

  // Modal/Overlay
  overlay: string;
  modalBackground: string;
  modalBorder: string;

  // Orb visual effects
  orbHue: number;
  orbIntensity: number;
  gradientFrom: string;
  gradientTo: string;

  // Skeleton loaders
  skeletonBase: string;
  skeletonHighlight: string;

  // Mention/Highlight
  mentionBackground: string;
  mentionText: string;

  // Online status
  statusOnline: string;
  statusIdle: string;
  statusDnd: string;
  statusOffline: string;
}

const themeConfigs: Record<Theme, ThemeColors> = {
  dark: {
    // Primary - Dark WhatsApp Green
    primary: "#128C7E",
    primaryHover: "#0d6b5e",
    primaryActive: "#0a544a",
    primaryLight: "#128C7E33",

    // Secondary
    secondary: "#128C7E",
    secondaryHover: "#0d6b5e",

    // Accent
    accent: "#128C7E",
    accentHover: "#0d6b5e",

    // Backgrounds - True Dark (easier on eyes than pure black)
    background: "#0F0F0F", // Main background (softer than #000)
    backgroundSecondary: "#1A1A1A", // Cards, containers
    backgroundTertiary: "#242424", // Elevated surfaces

    // Surfaces - Subtle elevation layers
    surface: "#1E1E1E",
    surfaceHover: "#262626",
    surfaceActive: "#2E2E2E",
    surfaceElevated: "#2A2A2A",

    // Text - WCAG AAA compliant contrast ratios
    textPrimary: "#EDEDED", // High contrast white (not harsh pure white)
    textSecondary: "#B4B4B4", // Medium contrast gray
    textTertiary: "#7A7A7A", // Low contrast gray
    textMuted: "#5A5A5A", // Very subtle gray
    textLink: "#25D366",

    // Borders - Subtle but visible
    border: "#2A2A2A",
    borderHover: "#3A3A3A",
    borderStrong: "#4A4A4A",
    divider: "#252525",

    // Status - Clear indicators
    success: "#10B981", // Darker emerald green for better visibility
    successLight: "#10B98133",
    warning: "#F59E0B", // Warm amber
    warningLight: "#F59E0B33",
    error: "#EF4444", // Clear red
    errorLight: "#EF444433",
    info: "#00A884", // Teal
    infoLight: "#00A88433",

    // Interactive - Smooth transitions
    hover: "#262626",
    active: "#2E2E2E",
    focus: "#25D36650",

    // Chat - Modern messaging UI
    chatBackground: "#0F0F0F",
    chatBubbleOwn: "#10B981",
    chatBubbleOther: "#1E1E1E",
    chatBubbleOtherHover: "#262626",
    chatInputBackground: "#1A1A1A",
    chatInputBorder: "#2A2A2A",

    // Sidebar - Distinct but cohesive
    sidebarBackground: "#141414",
    sidebarHover: "#1E1E1E",
    sidebarActive: "#262626",
    sidebarDivider: "#1F1F1F",

    // Modal - Layered overlay
    overlay: "rgba(0, 0, 0, 0.85)",
    modalBackground: "#1A1A1A",
    modalBorder: "#2A2A2A",

    // Orb - Green spectrum
    orbHue: 145,
    orbIntensity: 0.35,
    gradientFrom: "#25D366",
    gradientTo: "#10B981",

    // Skeleton - Subtle shimmer
    skeletonBase: "#1A1A1A",
    skeletonHighlight: "#242424",

    // Mention - Highlighted but readable
    mentionBackground: "#25D36622",
    mentionText: "#7EE8A8",

    // Status - Clear indicators
    statusOnline: "#25D366",
    statusIdle: "#F59E0B",
    statusDnd: "#EF4444",
    statusOffline: "#5A5A5A",
  },

  light: {
    // Primary - WhatsApp Green (Enhanced)
    primary: "#25D366",
    primaryHover: "#1DA851",
    primaryActive: "#128C7E",
    primaryLight: "#25D36615",

    // Secondary - Complementary Teal
    secondary: "#00A884",
    secondaryHover: "#008F6F",

    // Accent - Modern Emerald
    accent: "#10B981",
    accentHover: "#059669",

    // Backgrounds - Warm whites (easier on eyes)
    background: "#FAFAFA", // Soft white background
    backgroundSecondary: "#F5F5F5", // Slightly darker
    backgroundTertiary: "#EEEEEE", // Cards and containers

    // Surfaces - Clean layers
    surface: "#FFFFFF", // Pure white for cards
    surfaceHover: "#F8F8F8",
    surfaceActive: "#F0F0F0",
    surfaceElevated: "#FCFCFC",

    // Text - Softer blacks for comfort
    textPrimary: "#1A1A1A", // Near black (easier than pure black)
    textSecondary: "#525252", // Medium gray
    textTertiary: "#737373", // Light gray
    textMuted: "#A3A3A3", // Very light gray
    textLink: "#128C7E", // Green link color

    // Borders - Subtle definition
    border: "#E5E5E5",
    borderHover: "#D4D4D4",
    borderStrong: "#A3A3A3",
    divider: "#EEEEEE",

    // Status - Clear and vibrant
    success: "#10B981", // Darker emerald green for better contrast
    successLight: "#10B98115",
    warning: "#F59E0B",
    warningLight: "#F59E0B15",
    error: "#EF4444",
    errorLight: "#EF444415",
    info: "#00A884",
    infoLight: "#00A88415",

    // Interactive - Gentle feedback
    hover: "#F5F5F5",
    active: "#EEEEEE",
    focus: "#25D36635",

    // Chat - Light messaging UI
    chatBackground: "#FFFFFF",
    chatBubbleOwn: "#D1FAE5",
    chatBubbleOther: "#F5F5F5",
    chatBubbleOtherHover: "#EEEEEE",
    chatInputBackground: "#FAFAFA",
    chatInputBorder: "#E5E5E5",

    // Sidebar - Subtle distinction
    sidebarBackground: "#F7F7F7",
    sidebarHover: "#F0F0F0",
    sidebarActive: "#E8E8E8",
    sidebarDivider: "#E5E5E5",

    // Modal - Clean overlay
    overlay: "rgba(0, 0, 0, 0.45)",
    modalBackground: "#FFFFFF",
    modalBorder: "#E5E5E5",

    // Orb - Soft green
    orbHue: 145,
    orbIntensity: 0.18,
    gradientFrom: "#25D366",
    gradientTo: "#10B981",

    // Skeleton - Gentle shimmer
    skeletonBase: "#F0F0F0",
    skeletonHighlight: "#F8F8F8",

    // Mention - Subtle highlight
    mentionBackground: "#25D36612",
    mentionText: "#128C7E",

    // Status - Clear indicators
    statusOnline: "#25D366",
    statusIdle: "#F59E0B",
    statusDnd: "#EF4444",
    statusOffline: "#A3A3A3",
  },
};

interface ThemeContextProps {
  theme: Theme;
  colors: ThemeColors;
  setTheme: (theme: Theme) => void;
  toggleTheme: () => void;
}

const ThemeContext = createContext<ThemeContextProps | undefined>(undefined);

export const ThemeProvider = ({ children }: { children: ReactNode }) => {
  const [theme, setThemeState] = useState<Theme>("light");

  // Memoize colors to prevent unnecessary recalculations
  const colors = useMemo(() => themeConfigs[theme], [theme]);

  // Initialize theme from localStorage or system preference
  useEffect(() => {
    const storedTheme = localStorage.getItem("theme") as Theme | null;
    if (storedTheme && themeConfigs[storedTheme]) {
      setThemeState(storedTheme);
    } else {
      const prefersDark = window.matchMedia(
        "(prefers-color-scheme: dark)"
      ).matches;
      setThemeState(prefersDark ? "dark" : "light");
    }
  }, []);

  // Apply theme changes
  useEffect(() => {
    const root = document.documentElement;

    // Update CSS custom properties
    Object.entries(colors).forEach(([key, value]) => {
      const strVal = String(value);
      root.style.setProperty(`--theme-${key}`, strVal);
      root.style.setProperty(`--${key}`, strVal);
    });

    // Update class-based themes for Tailwind dark: modifier
    document.documentElement.classList.remove("light", "dark");
    document.documentElement.classList.add(theme);

    // Update background color
    document.body.style.backgroundColor = colors.background;

    // Update meta theme-color for mobile browsers
    let metaThemeColor = document.querySelector('meta[name="theme-color"]');
    if (!metaThemeColor) {
      metaThemeColor = document.createElement("meta");
      metaThemeColor.setAttribute("name", "theme-color");
      document.head.appendChild(metaThemeColor);
    }
    metaThemeColor.setAttribute("content", colors.background);

    localStorage.setItem("theme", theme);
  }, [theme, colors]);

  const setTheme = useCallback((newTheme: Theme) => {
    setThemeState(newTheme);
  }, []);

  const toggleTheme = useCallback(() => {
    setThemeState((current) => (current === "light" ? "dark" : "light"));
  }, []);

  const value = useMemo(
    () => ({ theme, colors, setTheme, toggleTheme }),
    [theme, colors, setTheme, toggleTheme]
  );

  return (
    <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>
  );
};

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error("useTheme must be used within a ThemeProvider");
  }
  return context;
};
