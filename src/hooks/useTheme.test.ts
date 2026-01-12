import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { useTheme } from "./useTheme";

describe("useTheme", () => {
  let listeners: ((e: MediaQueryListEvent) => void)[] = [];

  beforeEach(() => {
    listeners = [];

    Object.defineProperty(window, "matchMedia", {
      writable: true,
      value: vi.fn().mockImplementation((query) => ({
        matches: false,
        media: query,
        onchange: null,
        addListener: vi.fn(),
        removeListener: vi.fn(),
        addEventListener: vi.fn((_, handler) => {
          listeners.push(handler);
        }),
        removeEventListener: vi.fn((_, handler) => {
          listeners = listeners.filter((l) => l !== handler);
        }),
        dispatchEvent: vi.fn(),
      })),
    });
  });

  it("should return isDark as false when system prefers light mode", () => {
    const { result } = renderHook(() => useTheme());

    expect(result.current.isDark).toBe(false);
  });

  it("should return isDark as true when system prefers dark mode", () => {
    Object.defineProperty(window, "matchMedia", {
      writable: true,
      value: vi.fn().mockImplementation((query) => ({
        matches: true,
        media: query,
        onchange: null,
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
      })),
    });

    const { result } = renderHook(() => useTheme());

    expect(result.current.isDark).toBe(true);
  });

  it("should update isDark when system preference changes", () => {
    const { result } = renderHook(() => useTheme());

    expect(result.current.isDark).toBe(false);

    // Simulate system preference change to dark mode
    act(() => {
      listeners.forEach((listener) => {
        listener({ matches: true } as MediaQueryListEvent);
      });
    });

    expect(result.current.isDark).toBe(true);

    // Simulate system preference change back to light mode
    act(() => {
      listeners.forEach((listener) => {
        listener({ matches: false } as MediaQueryListEvent);
      });
    });

    expect(result.current.isDark).toBe(false);
  });

  it("should cleanup event listener on unmount", () => {
    const removeEventListener = vi.fn();
    Object.defineProperty(window, "matchMedia", {
      writable: true,
      value: vi.fn().mockImplementation((query) => ({
        matches: false,
        media: query,
        addEventListener: vi.fn(),
        removeEventListener,
      })),
    });

    const { unmount } = renderHook(() => useTheme());

    unmount();

    expect(removeEventListener).toHaveBeenCalledWith(
      "change",
      expect.any(Function)
    );
  });
});
