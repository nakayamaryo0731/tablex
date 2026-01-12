import { describe, it, expect } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { useColumnResize } from "./useColumnResize";

describe("useColumnResize", () => {
  it("should initialize with default widths", () => {
    const { result } = renderHook(() => useColumnResize(3));

    expect(result.current.columnWidths).toEqual([150, 150, 150]);
    expect(result.current.isResizing).toBe(false);
  });

  it("should use custom default width", () => {
    const { result } = renderHook(() =>
      useColumnResize(3, { defaultWidth: 200 })
    );

    expect(result.current.columnWidths).toEqual([200, 200, 200]);
  });

  it("should adjust widths when column count increases", () => {
    const { result, rerender } = renderHook(
      ({ count }) => useColumnResize(count, { defaultWidth: 100 }),
      { initialProps: { count: 2 } }
    );

    expect(result.current.columnWidths).toEqual([100, 100]);

    rerender({ count: 4 });

    expect(result.current.columnWidths).toEqual([100, 100, 100, 100]);
  });

  it("should adjust widths when column count decreases", () => {
    const { result, rerender } = renderHook(
      ({ count }) => useColumnResize(count, { defaultWidth: 100 }),
      { initialProps: { count: 4 } }
    );

    expect(result.current.columnWidths).toEqual([100, 100, 100, 100]);

    rerender({ count: 2 });

    expect(result.current.columnWidths).toEqual([100, 100]);
  });

  it("should allow manual setting of column widths", () => {
    const { result } = renderHook(() => useColumnResize(3));

    act(() => {
      result.current.setColumnWidths([100, 200, 300]);
    });

    expect(result.current.columnWidths).toEqual([100, 200, 300]);
  });

  it("should set isResizing to true when resize starts", () => {
    const { result } = renderHook(() => useColumnResize(3));

    const mockEvent = {
      preventDefault: () => {},
      stopPropagation: () => {},
      clientX: 100,
    } as React.MouseEvent;

    act(() => {
      result.current.handleResizeStart(mockEvent, 1);
    });

    expect(result.current.isResizing).toBe(true);
  });

  it("should handle zero columns", () => {
    const { result } = renderHook(() => useColumnResize(0));

    expect(result.current.columnWidths).toEqual([]);
    expect(result.current.isResizing).toBe(false);
  });
});
