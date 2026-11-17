import { describe, expect, it } from "vitest";

import type { BrowserRemoteDebugEvent } from "../src/remote/browserRemoteSession.js";
import { getMacRemoteInputGuidance } from "../src/remote/macRemoteInputGuidance.js";

function diagnose(overrides: Partial<Parameters<typeof getMacRemoteInputGuidance>[0]> = {}) {
  return getMacRemoteInputGuidance({
    targetPlatform: "Mac",
    hasRemoteVideo: true,
    controlChannelState: "open",
    inputControlActive: true,
    debugEvents: [],
    ...overrides,
  });
}

function inputEvent(summary: string, id: number): BrowserRemoteDebugEvent {
  return { id, atMs: 1000 + id, kind: "data_send", summary };
}

describe("getMacRemoteInputGuidance", () => {
  it("is hidden for non-Mac targets or without video", () => {
    expect(diagnose({ targetPlatform: "Windows" })).toBeNull();
    expect(diagnose({ hasRemoteVideo: false })).toBeNull();
  });

  it("distinguishes closed control data channels from view-only mode", () => {
    expect(diagnose({ controlChannelState: "connecting" })?.stage).toBe("channel");
    expect(diagnose({ controlChannelState: "closed" })?.stage).toBe("channel");
    expect(diagnose({ inputControlActive: false })?.stage).toBe("view_only");
  });

  it("shows the next action before an input event is recorded", () => {
    expect(diagnose()?.stage).toBe("await_input");
  });

  it("identifies an unmapped key instead of claiming success", () => {
    expect(diagnose({
      debugEvents: [inputEvent("发送控制输入", 1), inputEvent("跳过空控制输入", 2)],
    })?.stage).toBe("unmapped_key");
  });

  it("reports only browser-side submission after an input send", () => {
    const guidance = diagnose({ debugEvents: [inputEvent("发送控制输入", 1)] });
    expect(guidance?.stage).toBe("sent");
    expect(guidance?.detail).toContain("不代表 Mac 已执行");
    expect(guidance?.detail).toContain("辅助功能");
  });
});
