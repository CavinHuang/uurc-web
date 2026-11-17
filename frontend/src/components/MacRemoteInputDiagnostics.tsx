import { Info } from "lucide-react";

import type { RemoteControlPageProps } from "../app/remoteControlPageProps.js";
import { getMacRemoteInputGuidance } from "../remote/macRemoteInputGuidance.js";

export function MacRemoteInputDiagnostics({
  controlChannelState,
  debugEvents,
  hasRemoteVideo,
  inputControlActive,
  remoteShortcutPlatform,
}: Pick<
  RemoteControlPageProps,
  "controlChannelState" | "debugEvents" | "hasRemoteVideo" | "inputControlActive" | "remoteShortcutPlatform"
>) {
  const guidance = getMacRemoteInputGuidance({
    targetPlatform: remoteShortcutPlatform,
    hasRemoteVideo,
    controlChannelState,
    inputControlActive,
    debugEvents,
  });
  if (!guidance) return null;

  return (
    <section className="occupancy-callout info" role="status" aria-label="Mac 控制诊断">
      <Info size={17} aria-hidden="true" />
      <div>
        <strong>{guidance.title}</strong>
        <div>{guidance.detail}</div>
      </div>
    </section>
  );
}
