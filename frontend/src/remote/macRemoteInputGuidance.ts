import type { BrowserRemoteDebugEvent } from "./browserRemoteSession.js";

export interface MacRemoteInputGuidance {
  title: string;
  detail: string;
  stage: "channel" | "view_only" | "await_input" | "unmapped_key" | "sent";
}

/**
 * Diagnoses only the browser-observable portions of the control path.
 * Sending a DataChannel message does not prove the remote Mac executed it.
 */
export function getMacRemoteInputGuidance(input: {
  targetPlatform: string;
  hasRemoteVideo: boolean;
  controlChannelState: RTCDataChannelState;
  inputControlActive: boolean;
  debugEvents: readonly BrowserRemoteDebugEvent[];
}): MacRemoteInputGuidance | null {
  if (input.targetPlatform !== "Mac" || !input.hasRemoteVideo) return null;

  if (input.controlChannelState !== "open") {
    return {
      stage: "channel",
      title: "Mac 画面可见，但控制通道未就绪",
      detail: "视频接收不代表键鼠通道已连接。请查看「调试信息 → 控制通道」；若持续未打开，先尝试重新连接。",
    };
  }

  if (!input.inputControlActive) {
    return {
      stage: "view_only",
      title: "Mac 当前处于仅查看模式",
      detail: "点击画面上方「控制中」启用输入，然后再点击远端画面测试。",
    };
  }

  // The ring buffer contains send attempts, not remote acceptance/acknowledgments.
  const latestInputEvent = [...input.debugEvents].reverse().find(
    (event) =>
      event.kind === "data_send" &&
      (event.summary === "发送控制输入" || event.summary === "跳过空控制输入"),
  );

  if (latestInputEvent?.summary === "跳过空控制输入") {
    return {
      stage: "unmapped_key",
      title: "最近有控制按键无法编码",
      detail: "部分按键缺少 macOS 键码映射。请先测试鼠标点击，并在「调试信息 → 远控调试日志」查看「跳过空控制输入」事件。",
    };
  }

  if (latestInputEvent?.summary === "发送控制输入") {
    return {
      stage: "sent",
      title: "浏览器已向控制通道提交输入",
      detail: "这只证明网页调用了数据通道发送，不代表 Mac 已执行。若画面仍无响应，请在被控 Mac 的「系统设置 → 隐私与安全性 → 辅助功能」中检查 UU 远程的权限；授权后按客户端提示重启 UU。",
    };
  }

  return {
    stage: "await_input",
    title: "控制通道已打开，等待输入测试",
    detail: "请在画面内点击一次，然后查看「调试信息 → 远控调试日志」是否出现「发送控制输入」。",
  };
}
