import { vars } from 'nativewind';

// Helper to convert hex to RGB values
const hexToRgb = (hex: string): string => {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result
    ? `${parseInt(result[1], 16)} ${parseInt(result[2], 16)} ${parseInt(result[3], 16)}`
    : '0 0 0';
};

// Define raw color values for each theme
export const rawThemes = {
  default: {
    light: {
      primary: '#5eb58c',
      secondary: '#8B95A3',
      background: '#efefef',
      surface: '#f9fafb',
      text: '#111827',
      border: '#e5e7eb',
    },
    dark: {
      primary: '#5eb58c',
      secondary: '#8B95A3',
      background: '#232323',
      surface: '#303030',
      text: '#F3F4F6',
      border: '#374137',
    },
  },
  imperial: {
    light: {
      primary: '#000000',
      secondary: '#8B95A3',
      background: '#efefef',
      surface: '#f9fafb',
      text: '#111827',
      border: '#e5e7eb',
    },
    dark: {
      primary: '#616161',
      secondary: '#8B95A3',
      background: '#232323',
      surface: '#1f1f1f',
      text: '#F3F4F6',
      border: '#374137',
    },
  },
  mossy: {
    light: {
      primary: '#2d5a27',
      secondary: '#4a5c47',
      background: '#f5f7f4',
      surface: '#e8ede7',
      text: '#1a2419',
      border: '#d1ddd0',
    },
    dark: {
      primary: '#7ca677',
      secondary: '#9ab497',
      background: '#1a2419',
      surface: '#243122',
      text: '#e8ede7',
      border: '#384936',
    },
  },
  seaside: {
    light: {
      primary: '#00aaff',
      secondary: '#005f73',
      background: '#e0f7fa',
      surface: '#b2ebf2',
      text: '#004d40',
      border: '#80deea',
    },
    dark: {
      primary: '#30a7e6',
      secondary: '#326eba',
      background: '#03045e',
      surface: '#002776',
      text: '#caf0f8',
      border: '#90e0ef',
    },
  },
  pinkBubbleGum: {
    light: {
      primary: '#ff69b4',
      secondary: '#ff1493',
      background: '#ffe4e1',
      surface: '#ffb6c1',
      text: '#8b008b',
      border: '#ff69b4',
    },
    dark: {
      primary: '#c71585',
      secondary: '#db80a3',
      background: '#2c001e',
      surface: '#4b004b',
      text: '#ffb6c1',
      border: '#ff69b4',
    },
  },
  commodore64: {
    light: {
      primary: '#d8a657', // muted yellow
      secondary: '#a9b665', // soft green
      background: '#fbf1c7', // light beige
      surface: '#ebdbb2', // slightly darker beige
      text: '#3c3836', // dark brown
      border: '#d5c4a1', // light brown
    },
    dark: {
      primary: '#fabd2f', // bright yellow
      secondary: '#b8bb26', // vibrant green
      background: '#282828', // dark gray
      surface: '#3c3836', // dark brown
      text: '#ebdbb2', // light beige
      border: '#504945', // medium brown
    },
  },
  polaris: {
    light: {
      primary: '#0066cc', // Strong blue
      secondary: '#005299', // Darker blue
      background: '#f5f7fa', // Light gray-blue
      surface: '#e9ecf1', // Slightly darker gray-blue
      text: '#1a1f36', // Near black
      border: '#d1d5db', // Medium gray
    },
    dark: {
      primary: '#2684ff', // Bright blue
      secondary: '#1c64f2', // Vivid blue
      background: '#111827', // Very dark blue-gray
      surface: '#1f2937', // Dark blue-gray
      text: '#f3f4f6', // Off white
      border: '#374151', // Medium dark gray
    },
  }
} as const;

export type ThemePresetRaw = keyof typeof rawThemes;
export type ThemeColors = {
  primary: string;
  secondary: string;
  background: string;
  surface: string;
  text: string;
  border: string;
};

// Create vars() objects for NativeWind from theme colors
export const createThemeVars = (colors: ThemeColors) => {
  return vars({
    '--color-primary': hexToRgb(colors.primary),
    '--color-secondary': hexToRgb(colors.secondary),
    '--color-background': hexToRgb(colors.background),
    '--color-surface': hexToRgb(colors.surface),
    '--color-text': hexToRgb(colors.text),
    '--color-border': hexToRgb(colors.border),
  });
};
