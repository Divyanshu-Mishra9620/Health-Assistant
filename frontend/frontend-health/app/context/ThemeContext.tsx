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
    // Primary - Softer Medical Green (reduced brightness for comfort)
    primary: "#0ea970",
    primaryHover: "#0d9763",
    primaryActive: "#0a8055",
    primaryLight: "#0ea97033",

    // Secondary - Harmonious teal
    secondary: "#0ea970",
    secondaryHover: "#0d9763",

    // Accent - Balanced green
    accent: "#0ea970",
    accentHover: "#0d9763",

    // Backgrounds - Warmer dark (reduces blue light, easier on eyes)
    background: "#121212", // Warm dark gray (better than pure black)
    backgroundSecondary: "#1c1c1c", // Subtle elevation
    backgroundTertiary: "#252525", // Card backgrounds

    // Surfaces - Natural progression
    surface: "#1e1e1e",
    surfaceHover: "#272727",
    surfaceActive: "#303030",
    surfaceElevated: "#2a2a2a",

    // Text - Softer whites (WCAG AAA compliant, reduced eye strain)
    textPrimary: "#e8e8e8", // Soft white (not harsh)
    textSecondary: "#b8b8b8", // Medium contrast
    textTertiary: "#888888", // Lower contrast
    textMuted: "#6a6a6a", // Subtle text
    textLink: "#5cd3a8",

    // Borders - Visible but not harsh
    border: "#2f2f2f",
    borderHover: "#3f3f3f",
    borderStrong: "#4f4f4f",
    divider: "#282828",

    // Status - Clear but not aggressive
    success: "#0ea970", // Softer green
    successLight: "#0ea97030",
    warning: "#f5a524", // Warmer orange
    warningLight: "#f5a52430",
    error: "#e74c3c", // Softer red
    errorLight: "#e74c3c30",
    info: "#00a884", // Calm teal
    infoLight: "#00a88430",

    // Interactive - Smooth feedback
    hover: "#272727",
    active: "#303030",
    focus: "#0ea97050",

    // Chat - Comfortable messaging
    chatBackground: "#121212",
    chatBubbleOwn: "#0ea970",
    chatBubbleOther: "#1e1e1e",
    chatBubbleOtherHover: "#272727",
    chatInputBackground: "#1c1c1c",
    chatInputBorder: "#2f2f2f",

    // Sidebar - Subtle distinction
    sidebarBackground: "#181818",
    sidebarHover: "#222222",
    sidebarActive: "#2a2a2a",
    sidebarDivider: "#252525",

    // Modal - Natural overlay
    overlay: "rgba(0, 0, 0, 0.85)",
    modalBackground: "#1c1c1c",
    modalBorder: "#2f2f2f",

    // Orb - Soft green glow
    orbHue: 152,
    orbIntensity: 0.28,
    gradientFrom: "#0ea970",
    gradientTo: "#048658",

    // Skeleton - Gentle animation
    skeletonBase: "#1c1c1c",
    skeletonHighlight: "#252525",

    // Mention - Readable highlight
    mentionBackground: "#0ea97025",
    mentionText: "#5cd3a8",

    // Status - Clear indicators
    statusOnline: "#0ea970",
    statusIdle: "#f5a524",
    statusDnd: "#e74c3c",
    statusOffline: "#6a6a6a",
  },

  light: {
    // Primary - Comfortable Medical Green (not too bright)
    primary: "#0ea970",
    primaryHover: "#0d9763",
    primaryActive: "#0a8055",
    primaryLight: "#0ea97018",

    // Secondary - Harmonious teal
    secondary: "#00a884",
    secondaryHover: "#009573",

    // Accent - Balanced emerald
    accent: "#0ea970",
    accentHover: "#0d9763",

    // Backgrounds - Warmer whites (reduced blue light)
    background: "#fafafa", // Soft off-white (easier than pure white)
    backgroundSecondary: "#f5f5f5", // Subtle depth
    backgroundTertiary: "#f0f0f0", // Card backgrounds

    // Surfaces - Clean and soft
    surface: "#ffffff", // Pure white for cards
    surfaceHover: "#f9f9f9",
    surfaceActive: "#f2f2f2",
    surfaceElevated: "#fefefe",

    // Text - Softer blacks (more comfortable than #000)
    textPrimary: "#2d2d2d", // Warm dark gray (not harsh black)
    textSecondary: "#5a5a5a", // Medium contrast
    textTertiary: "#7a7a7a", // Light contrast
    textMuted: "#9a9a9a", // Very subtle
    textLink: "#0a8055", // Readable green

    // Borders - Soft definition
    border: "#e5e5e5",
    borderHover: "#d0d0d0",
    borderStrong: "#a0a0a0",
    divider: "#efefef",

    // Status - Clear and balanced
    success: "#0ea970", // Comfortable green
    successLight: "#0ea97018",
    warning: "#f5a524", // Warm orange
    warningLight: "#f5a52418",
    error: "#e74c3c", // Softer red
    errorLight: "#e74c3c18",
    info: "#00a884", // Calm teal
    infoLight: "#00a88418",

    // Interactive - Gentle feedback
    hover: "#f5f5f5",
    active: "#f0f0f0",
    focus: "#0ea97038",

    // Chat - Comfortable messaging
    chatBackground: "#ffffff",
    chatBubbleOwn: "#d6f5e8",
    chatBubbleOther: "#f5f5f5",
    chatBubbleOtherHover: "#f0f0f0",
    chatInputBackground: "#fafafa",
    chatInputBorder: "#e5e5e5",

    // Sidebar - Subtle distinction
    sidebarBackground: "#f7f7f7",
    sidebarHover: "#f2f2f2",
    sidebarActive: "#ececec",
    sidebarDivider: "#e8e8e8",

    // Modal - Clean overlay
    overlay: "rgba(0, 0, 0, 0.45)",
    modalBackground: "#ffffff",
    modalBorder: "#e5e5e5",

    // Orb - Soft green
    orbHue: 152,
    orbIntensity: 0.16,
    gradientFrom: "#0ea970",
    gradientTo: "#048658",

    // Skeleton - Gentle shimmer
    skeletonBase: "#f2f2f2",
    skeletonHighlight: "#f9f9f9",

    // Mention - Subtle highlight
    mentionBackground: "#0ea97015",
    mentionText: "#0a8055",

    // Status - Clear indicators
    statusOnline: "#0ea970",
    statusIdle: "#f5a524",
    statusDnd: "#e74c3c",
    statusOffline: "#9a9a9a",
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
