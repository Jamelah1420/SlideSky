// === src/Constants.js ===

// --- Custom Gradient for Hero/Thank You/Section Title Slides ---
export const CUSTOM_GRADIENT_BG = 'linear-gradient(to top right, #000000, #0D0F1F 30%, #152238 60%, #4D3D75 80%, #996E49)';
export const CUSTOM_GRADIENT_TEXT_COLOR = '#FFFFFF';
export const CALIBRI_STACK =
  'Calibri, Carlito, "Segoe UI", Roboto, "Helvetica Neue", Arial, "Noto Sans", sans-serif';

// --- THEMES ---
// Using a simpler, highly legible font family for the entire presentation
export const THEMES = {
    DISPLAY_FONT: 'Inter, sans-serif', 
    TEXT_FONT: 'Inter, sans-serif',
    light: { 
        name: "Bright Professional", 
        pageBg: "#F4F7FC", 
        pageText: "#1F2937", 
        slideBg: "#FFFFFF", 
        slideText: "#1F2937", 
        primary: "#2563EB",  // A strong blue
        secondary: "#10B981", // A vibrant green

        // NEW: Professional Chart Colors for 'light' theme
        chartColors: [
            "#2563EB", // Primary Blue
            "#10B981", // Secondary Green
            "#F59E0B", // Amber
            "#EF4444", // Red
            "#8B5CF6", // Violet
            "#EC4899", // Pink
            "#3B82F6", // Lighter Blue
            "#065F46", // Darker Green
            "#D97706", // Darker Amber
            "#B91C1C", // Darker Red
        ]
    },
    aurora: { 
        name: "Aurora (Dark)", 
        pageBg: "#0B0F14", 
        pageText: "#E5E7EB", 
        slideBg: "#1F2937", 
        slideText: "#F9FAFB", 
        primary: "#6366F1", 
        secondary: "#10B981",
        chartColors: [
            "#6366F1", // Primary Violet
            "#10B981", // Secondary Green
            "#FBBF24", // Yellow
            "#FB7185", // Rose
            "#A78BFA", // Light Violet
            "#38BDF8", // Sky Blue
            "#F472B6", // Pink
            "#EAB308", // Darker Yellow
            "#D946EF", // Magenta
            "#84CC16", // Lime Green
        ] 
    },
    ocean: { 
        name: "Oceanic", 
        pageBg: "#0D253F", 
        pageText: "#A8DADC", 
        slideBg: "#1D3A5F", 
        slideText: "#FFFFFF", 
        primary: "#4CC9F0", 
        secondary: "#F7B801",
        chartColors: [
            "#4CC9F0", // Primary Cyan
            "#F7B801", // Secondary Amber
            "#90EE90", // Light Green
            "#FF7F50", // Coral
            "#ADD8E6", // Light Blue
            "#DA70D6", // Orchid
            "#FFD700", // Gold
            "#5F9EA0", // Cadet Blue
            "#87CEEB", // Sky Blue
            "#BA55D3", // Medium Orchid
        ] 
    },
    solar: { 
        name: "Solaris", 
        pageBg: "#2A2A2A", 
        pageText: "#FFD700", 
        slideBg: "#3A3A3A", 
        slideText: "#FFFFFF", 
        primary: "#FF8C00", 
        secondary: "#3CB371",
        chartColors: [
            "#FF8C00", // Dark Orange
            "#3CB371", // Medium Sea Green
            "#FFD700", // Gold
            "#B0C4DE", // Light Steel Blue
            "#FF4500", // Orange Red
            "#DAA520", // Goldenrod
            "#ADFF2F", // Green Yellow
            "#87CEFA", // Light Sky Blue
            "#9370DB", // Medium Purple
            "#FFE4B5", // Moccasin
        ] 
    },
    minimal: { 
        name: "Minimal", 
        pageBg: "#F0F0F0", 
        pageText: "#333333", 
        slideBg: "#FFFFFF", 
        slideText: "#333333", 
        primary: "#007BFF", 
        secondary: "#AAAAAA",
        chartColors: [
            "#007BFF", // Blue
            "#6C757D", // Gray
            "#28A745", // Green
            "#DC3545", // Red
            "#FFC107", // Yellow
            "#17A2B8", // Cyan
            "#6610F2", // Indigo
            "#FD7E14", // Orange
            "#E83E8C", // Pink
            "#20C997", // Teal
        ] 
    },
};