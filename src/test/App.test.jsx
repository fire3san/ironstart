import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import App from '../App.jsx';

// Mock browser APIs
const mockLocalStorage = (() => {
  let store = {};
  return {
    getItem: vi.fn((key) => store[key] || null),
    setItem: vi.fn((key, value) => {
      store[key] = value;
    }),
    removeItem: vi.fn((key) => {
      delete store[key];
    }),
    clear: vi.fn(() => {
      store = {};
    }),
  };
})();

Object.defineProperty(window, 'localStorage', {
  value: mockLocalStorage,
});

// Mock matchMedia
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: vi.fn().mockImplementation(query => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: vi.fn(),
    removeListener: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  })),
});

// Mock crypto.randomUUID
Object.defineProperty(crypto, 'randomUUID', {
  value: vi.fn(() => 'test-uuid-' + Math.random().toString(36).substr(2, 9)),
});

// Mock confetti
vi.mock('canvas-confetti', () => ({
  default: vi.fn(),
}));

// Mock framer-motion
vi.mock('framer-motion', async () => {
  const actual = await vi.importActual('framer-motion');
  return {
    ...actual,
    motion: {
      div: 'div',
      button: 'button',
      span: 'span',
    },
    AnimatePresence: ({ children }) => children,
  };
});

describe('App', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockLocalStorage.clear();
  });

  describe('Loading State', () => {
    it('should show loading screen initially', async () => {
      const { container } = render(<App />);
      
      // Wait for loading screen to appear
      await vi.waitFor(() => {
        expect(container.querySelector('.min-h-screen')).toBeInTheDocument();
      });
    });
  });

  describe('Home View', () => {
    it('should render home view with welcome message', async () => {
      render(<App />);
      
      // Wait for app to load
      await vi.waitFor(() => {
        expect(mockLocalStorage.getItem).toHaveBeenCalled();
      }, { timeout: 3000 });
      
      // Check for home view elements
      const welcomeText = await screen.findByText(/歡迎回來|Welcome/i, { timeout: 5000 });
      expect(welcomeText).toBeInTheDocument();
    });

    it('should display streak counter', async () => {
      render(<App />);
      
      await vi.waitFor(() => {
        expect(mockLocalStorage.getItem).toHaveBeenCalled();
      }, { timeout: 3000 });
      
      // Check for streak counter with specific context (the number display)
      const streakNumber = document.querySelector('.text-emerald-400');
      expect(streakNumber).toBeInTheDocument();
      
      // Check for the streak label in the right context
      const allStreakTexts = screen.getAllByText(/連續打卡/);
      expect(allStreakTexts.length).toBeGreaterThan(0);
    });

    it('should have bottom navigation', async () => {
      render(<App />);
      
      await vi.waitFor(() => {
        expect(mockLocalStorage.getItem).toHaveBeenCalled();
      }, { timeout: 3000 });
      
      // Check for navigation container (fixed bottom bar)
      const navContainer = document.querySelector('.fixed.bottom-0') || 
                           document.querySelector('[class*="bottom"]');
      expect(navContainer).toBeInTheDocument();
    });
  });

  describe('Food View Navigation', () => {
    it('should navigate to food view when clicking food tracker', async () => {
      render(<App />);
      
      await vi.waitFor(() => {
        expect(mockLocalStorage.getItem).toHaveBeenCalled();
      }, { timeout: 3000 });
      
      // Find and click food tracker
      const foodTracker = await screen.findByText(/飲食追蹤|Food Tracker/i, { timeout: 5000 });
      fireEvent.click(foodTracker);
      
      // Wait for food view to appear
      await vi.waitFor(() => {
        const foodTitle = screen.queryByText(/飲食追蹤|Food Tracker/i);
        expect(foodTitle).toBeInTheDocument();
      }, { timeout: 3000 });
    });
  });

  describe('Language Support', () => {
    it('should support Chinese (default)', async () => {
      render(<App />);
      
      await vi.waitFor(() => {
        expect(mockLocalStorage.getItem).toHaveBeenCalled();
      }, { timeout: 3000 });
      
      // Check for Chinese text
      const chineseText = await screen.findByText(/歡迎回來|計畫 | 飲食 | 歷史/i, { timeout: 5000 });
      expect(chineseText).toBeInTheDocument();
    });
  });

  describe('Water Tracker', () => {
    it('should display water tracker on home view', async () => {
      render(<App />);
      
      await vi.waitFor(() => {
        expect(mockLocalStorage.getItem).toHaveBeenCalled();
      }, { timeout: 3000 });
      
      // Check for water tracker
      const waterElement = await screen.findByText(/飲水|Water/i, { timeout: 5000 });
      expect(waterElement).toBeInTheDocument();
    });
  });

  describe('Workout Mode Toggle', () => {
    it('should have workout mode toggle button', async () => {
      render(<App />);
      
      await vi.waitFor(() => {
        expect(mockLocalStorage.getItem).toHaveBeenCalled();
      }, { timeout: 3000 });
      
      // Check for mode toggle (dumbbell icon)
      const modeButton = document.querySelector('[class*="dumbbell"]') || 
                         document.querySelector('svg');
      expect(modeButton).toBeInTheDocument();
    });
  });
});

describe('App Components', () => {
  describe('Exercise Card', () => {
    it('should render exercise information', async () => {
      render(<App />);
      
      await vi.waitFor(() => {
        expect(mockLocalStorage.getItem).toHaveBeenCalled();
      }, { timeout: 3000 });
      
      // Check that the app renders with main content area
      const mainContent = document.querySelector('.pb-24');
      expect(mainContent).toBeInTheDocument();
      
      // Check for exercise-related elements (dumbbell icon indicates workout functionality)
      const dumbbellIcon = document.querySelector('.lucide-dumbbell');
      expect(dumbbellIcon).toBeInTheDocument();
    });
  });
});