// 📁 test/mocks/index.js
import React from "react";
import { vi } from "vitest";
import { createLocalStorageMock } from "./testUtils.jsx";
import mockConfig from "./mocks/config.json";

// ---------------------
// ✅ Framer Motion Mock
// ---------------------
vi.mock("framer-motion", () => ({
  motion: new Proxy(
    {},
    {
      get:
        (_, tag) =>
        ({ children, ...props }) =>
          React.createElement(tag, props, children),
    }
  ),
  AnimatePresence: ({ children }) => <>{children}</>,
}));

// ---------------------
// ✅ React Markdown Mock
// ---------------------
vi.mock("react-markdown", () => ({
  default: ({ children }) => <div className="markdown-content">{children}</div>,
}));

// ---------------------
// ✅ UUID Mock
// ---------------------
vi.mock("uuid", () => ({
  v4: () => "test-uuid-1234",
}));

// ---------------------
// ✅ Vercel Analytics
// ---------------------
vi.mock("@vercel/analytics", () => ({
  inject: vi.fn(),
}));

// ---------------------
// ✅ scrollIntoView Mock
// ---------------------
if (typeof Element !== "undefined" && !Element.prototype.scrollIntoView) {
  Element.prototype.scrollIntoView = vi.fn();
}

// ---------------------
// ✅ localStorage Mock
// ---------------------
export const localStorageMock = createLocalStorageMock();
Object.defineProperty(globalThis, "localStorage", {
  value: localStorageMock,
  writable: true,
});

// ---------------------
// ✅ Global Fetch Mock
// ---------------------
globalThis.fetch = vi.fn();

// ---------------------
// ✅ Console Suppression
// ---------------------
const originalConsoleError = console.error;
const originalConsoleWarn = console.warn;

export const suppressConsoleMethods = () => {
  console.error = vi.fn();
  console.warn = vi.fn();
};

export const restoreConsoleMethods = () => {
  console.error = originalConsoleError;
  console.warn = originalConsoleWarn;
};

// ---------------------
// ✅ Custom Hook Mocks
// ---------------------
export const createHookMocks = () => ({
  useStreamingChat: vi.fn(() => ({
    isLoading: false,
    error: null,
    sendMessage: vi.fn(async () => ({ success: true })),
    startNewChat: vi.fn(),
    stopAnswering: vi.fn(),
    messages: [{ role: "assistant", content: "Hello! How can I help you today?" }],
    sessionId: "test-session-id",
  })),
  useMessages: vi.fn(() => ({
    messages: [],
    addMessage: vi.fn(),
    updateLastMessage: vi.fn(),
    resetMessages: vi.fn(),
  })),
  useSession: vi.fn(() => ({
    sessionId: "test-session-id",
    startNewSession: vi.fn(() => "new-test-session-id"),
  })),
  useGithubRepos: vi.fn(() => ({
    repos: [],
    loading: false,
    error: null,
  })),
  useTypingEffect: vi.fn((content) => ({
    displayedContent: content,
    setIsTyping: vi.fn(),
    setDisplayedContent: vi.fn(),
  })),
});
