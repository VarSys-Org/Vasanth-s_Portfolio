import { afterEach, describe, expect, it, vi } from "vitest";
import { handleWordListKey } from "../../src/admin/fieldInputKeys.js";
import { applyDocumentTheme } from "../../src/hooks/useTheme.js";
import { pingSite } from "../../src/hooks/useSiteStatus.js";

describe("modern web guidance fixes", () => {
  afterEach(() => vi.restoreAllMocks());

  it("does not treat Enter as a list delimiter while an IME is composing", () => {
    const add = vi.fn();
    const event = { key: "Enter", isComposing: true, keyCode: 13, preventDefault: vi.fn() };

    handleWordListKey(event, "draft", add, vi.fn());

    expect(add).not.toHaveBeenCalled();
    expect(event.preventDefault).not.toHaveBeenCalled();
  });

  it("blocks the Safari IME confirmation keyCode and retains regular Enter behavior", () => {
    const add = vi.fn();
    const preventDefault = vi.fn();
    handleWordListKey({ key: "Enter", isComposing: false, keyCode: 229, preventDefault }, "draft", add, vi.fn());
    handleWordListKey({ key: "Enter", isComposing: false, keyCode: 13, preventDefault }, "draft", add, vi.fn());

    expect(add).toHaveBeenCalledTimes(1);
    expect(add).toHaveBeenCalledWith("draft");
    expect(preventDefault).toHaveBeenCalledTimes(1);
  });

  it("keeps the document color scheme in sync with theme changes", () => {
    const root = { dataset: {} as Record<string, string> };
    const meta = { setAttribute: vi.fn() };
    vi.stubGlobal("document", {
      documentElement: root,
      querySelector: vi.fn(() => meta),
    });

    applyDocumentTheme("light");

    expect(root.dataset.theme).toBe("light");
    expect(meta.setAttribute).toHaveBeenCalledWith("content", "light");
  });

  it("passes a nine-second timeout signal to site status requests", async () => {
    const signal = AbortSignal.abort();
    const timeout = vi.spyOn(AbortSignal, "timeout").mockReturnValue(signal);
    const fetchMock = vi.fn(async () => new Response(null, { status: 200 }));
    vi.stubGlobal("fetch", fetchMock);
    const url = `https://status-test-${crypto.randomUUID()}.example`;

    await expect(pingSite(url)).resolves.toBe("online");

    expect(timeout).toHaveBeenCalledWith(9000);
    expect(fetchMock).toHaveBeenCalledWith(url, expect.objectContaining({ signal }));
  });
});
