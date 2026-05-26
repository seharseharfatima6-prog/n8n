import React from "react";
import { 
  Play, 
  Webhook, 
  Cpu, 
  Globe, 
  Variable, 
  GitBranch, 
  Slack, 
  Hourglass, 
  Terminal, 
  Timer, 
  Settings, 
  PlayCircle, 
  CheckCircle, 
  XCircle,
  Loader2 
} from "lucide-react";
import { WorkflowNode, NodeType } from "../types";

interface VisualNodeProps {
  key?: string;
  node: WorkflowNode;
  isSelected: boolean;
  onSelect: () => void;
  onMouseDown: (e: React.MouseEvent, nodeId: string) => void;
  onConnectStart: (e: React.MouseEvent, nodeId: string, handleId: string) => void;
  onConnectEnd: (e: React.MouseEvent, nodeId: string) => void;
}

export default function VisualNode({
  node,
  isSelected,
  onSelect,
  onMouseDown,
  onConnectStart,
  onConnectEnd,
}: VisualNodeProps) {
  const getIcon = () => {
    switch (node.type) {
      case NodeType.MANUAL_TRIGGER:
        return <Play className="h-4 w-4 text-emerald-500" />;
      case NodeType.WEBHOOK_TRIGGER:
        return <Webhook className="h-4 w-4 text-amber-500" />;
      case NodeType.INTERVAL_TRIGGER:
        return <Timer className="h-4 w-4 text-teal-500" />;
      case NodeType.GEMINI_AI:
        return <Cpu className="h-4 w-4 text-violet-500" />;
      case NodeType.HTTP_REQUEST:
        return <Globe className="h-4 w-4 text-blue-500" />;
      case NodeType.SET_VARIABLE:
        return <Variable className="h-4 w-4 text-pink-500" />;
      case NodeType.CONDITIONAL:
        return <GitBranch className="h-4 w-4 text-cyan-500" />;
      case NodeType.SLACK_SIMULATOR:
        return <Slack className="h-4 w-4 text-purple-500" />;
      case NodeType.DELAY:
        return <Hourglass className="h-4 w-4 text-sky-500" />;
      case NodeType.CONSOLE_LOG:
        return <Terminal className="h-4 w-4 text-slate-500" />;
      default:
        return <Terminal className="h-4 w-4 text-slate-500" />;
    }
  };

  const isTrigger = [
    NodeType.MANUAL_TRIGGER, 
    NodeType.WEBHOOK_TRIGGER, 
    NodeType.INTERVAL_TRIGGER
  ].includes(node.type);

  // Styling based on state
  let stateBorder = "border-[#2D2F36] hover:border-[#4B5563]";
  let glowEffect = "";
  if (isSelected) {
    stateBorder = "border-2 border-[#FF6C37] ring-4 ring-[#FF6C37]/15";
  } else if (node.state === "running") {
    stateBorder = "border-2 border-[#FF6C37] ring-4 ring-[#FF6C37]/10";
    glowEffect = "animate-pulse";
  } else if (node.state === "success") {
    stateBorder = "border border-[#10B981] ring-2 ring-[#10B981]/15";
  } else if (node.state === "error") {
    stateBorder = "border border-rose-500 ring-2 ring-rose-500/15";
  }

  return (
    <div
      onClick={(e) => {
        e.stopPropagation();
        onSelect();
      }}
      style={{
        transform: `translate(${node.position.x}px, ${node.position.y}px)`,
        position: "absolute",
      }}
      className={`w-64 bg-[#16181D] rounded-xl shadow-2xl border select-none transition-shadow ${stateBorder} ${glowEffect} cursor-grab active:cursor-grabbing text-white`}
    >
      {/* Target Connection Socket (Inputs) */}
      {!isTrigger && (
        <div
          onMouseUp={(e) => onConnectEnd(e, node.id)}
          className="absolute -left-2.5 top-1/2 -translate-y-1/2 h-5 w-5 rounded-full border border-[#374151] bg-[#0F1115] flex items-center justify-center hover:bg-[#FF6C37] hover:border-[#FF6C37] cursor-crosshair group hover:scale-110 transition-transform active:bg-[#e65b2a]"
          title="Drop connector target here"
        >
          <div className="h-1.5 w-1.5 rounded-full bg-[#6B7280] group-hover:bg-white" />
        </div>
      )}

      {/* Node Grabbable Handle Bar */}
      <div
        onMouseDown={(e) => {
          // Prevent handle drag if hitting outputs
          onMouseDown(e, node.id);
        }}
        className="px-3.5 py-2.5 bg-[#111317] border-b border-[#2D2F36] rounded-t-xl shrink-0 flex items-center justify-between gap-2 text-xs"
      >
        <div className="flex items-center gap-2 font-medium text-slate-200 truncate">
          {getIcon()}
          <span className="truncate text-white font-semibold text-xs">{node.data.name}</span>
        </div>
        <div className="flex items-center shrink-0">
          {/* State Badges / Loaders */}
          {node.state === "running" && <Loader2 className="h-3.5 w-3.5 text-[#FF6C37] animate-spin" />}
          {node.state === "success" && <span className="h-2 w-2 rounded-full bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.6)]" />}
          {node.state === "error" && <XCircle className="h-3.5 w-3.5 text-rose-500" />}
        </div>
      </div>

      {/* Node Details / Preview Area */}
      <div className="p-3.5 text-[11px] leading-relaxed text-[#9CA3AF] space-y-1">
        {node.data.description && <p className="text-[#6B7280] text-[10.5px] leading-normal">{node.data.description}</p>}
        {node.type === NodeType.GEMINI_AI && node.data.prompt && (
          <div className="bg-[#0F1115] p-2 rounded border border-[#2D2F36] mt-2 font-mono text-[9px] line-clamp-3 text-white">
            <span className="text-[#FF6C37] font-semibold text-[8px] uppercase block mb-0.5">Prompt:</span>
            "{node.data.prompt}"
          </div>
        )}
        {node.type === NodeType.HTTP_REQUEST && (
          <div className="flex items-center gap-1.5 mt-2 p-1.5 bg-[#0F1115] rounded border border-[#2D2F36]">
            <span className="px-1.5 py-0.5 rounded bg-[#FF6C37]/10 text-[#FF6C37] font-bold text-[9px] font-mono leading-none">
              {node.data.method || "GET"}
            </span>
            <span className="font-mono text-[10px] text-[#9CA3AF] truncate font-medium">
              {node.data.url || "Setup endpoint"}
            </span>
          </div>
        )}
        {node.type === NodeType.CONDITIONAL && (
          <div className="flex items-center gap-1 mt-2 text-[#9CA3AF] bg-[#0F1115] border border-[#2D2F36] rounded p-1.5 font-mono text-[10px]">
            <span className="text-[#FF6C37] font-bold">IF:</span>
            <span className="font-semibold text-white truncate max-w-[80px]">{node.data.propertyName || "?"}</span>
            <span className="text-[9px] text-slate-500">{node.data.operator}</span>
            <span className="font-semibold text-white truncate max-w-[50px]">{node.data.comparisonValue || "?"}</span>
          </div>
        )}

        {/* Display JSON Data Output Preview if runs successfully */}
        {node.outputData && (
          <div className="mt-2 text-[9.5px]">
            <span className="text-[9px] font-bold text-[#10B981] block mb-1 uppercase tracking-wider">Output Preview:</span>
            <pre className="p-2.5 bg-[#0F1115] text-[#10B981] rounded font-mono border border-[#2D2F36] overflow-x-auto select-all max-h-24 line-clamp-4 leading-normal text-[10px]">
              {typeof node.outputData === "object"
                ? JSON.stringify(node.outputData, null, 2)
                : String(node.outputData)}
            </pre>
          </div>
        )}
      </div>

      {/* Source Sockets (Outputs) */}
      {node.type === NodeType.CONDITIONAL ? (
        // IF/ELSE requires Dual output handlers
        <div className="absolute -right-2.5 top-0 bottom-0 flex flex-col justify-around py-4 shrink-0 transition-transform select-none">
          {/* True Port Handle (top alignment) */}
          <div
            onMouseDown={(e) => {
              e.stopPropagation();
              onConnectStart(e, node.id, "true");
            }}
            className="h-5.5 w-5.5 rounded-full border border-emerald-500/30 bg-[#0F1115] flex items-center justify-center hover:bg-emerald-500 hover:border-emerald-600 cursor-crosshair group hover:scale-110 active:bg-emerald-600 select-none cursor-pointer"
            title="True branch link out"
          >
            <span className="text-[7.5px] font-extrabold text-[#10B981] group-hover:text-white uppercase select-none">T</span>
          </div>

          {/* False Port Handle (bottom alignment) */}
          <div
            onMouseDown={(e) => {
              e.stopPropagation();
              onConnectStart(e, node.id, "false");
            }}
            className="h-5.5 w-5.5 rounded-full border border-rose-500/30 bg-[#0F1115] flex items-center justify-center hover:bg-rose-500 hover:border-rose-600 cursor-crosshair group hover:scale-110 active:bg-rose-600 select-none cursor-pointer"
            title="False branch link out"
          >
            <span className="text-[7.5px] font-extrabold text-rose-400 group-hover:text-white uppercase select-none">F</span>
          </div>
        </div>
      ) : (
        // Standard Actions: Single Default Output handler
        <div
          onMouseDown={(e) => {
            e.stopPropagation();
            onConnectStart(e, node.id, "default");
          }}
          className="absolute -right-2.5 top-1/2 -translate-y-1/2 h-5 w-5 rounded-full border border-[#374151] bg-[#0F1115] flex items-center justify-center hover:bg-[#FF6C37] hover:border-[#FF6C37] cursor-crosshair group hover:scale-110 hover:shadow-md transition-transform active:bg-[#e65b2a]"
          title="Drag connector line from here"
        >
          <div className="h-1.5 w-1.5 rounded-full bg-[#6B7280] group-hover:bg-white" />
        </div>
      )}
    </div>
  );
}
