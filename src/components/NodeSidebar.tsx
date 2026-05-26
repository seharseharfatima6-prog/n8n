import React, { useState } from "react";
import { 
  Play, 
  Webhook, 
  Hourglass, 
  Cpu, 
  Globe, 
  Variable, 
  GitBranch, 
  Slack, 
  Terminal, 
  Timer, 
  Plus,
  Search
} from "lucide-react";
import { NodeType } from "../types";

interface NodeSidebarProps {
  onAddNode: (type: NodeType) => void;
}

interface NodeDefinition {
  type: NodeType;
  name: string;
  category: "trigger" | "action";
  description: string;
  icon: React.ComponentType<any>;
  color: string;
  bgColor: string;
}

export const NODE_DEFINITIONS: NodeDefinition[] = [
  // Triggers
  {
    type: NodeType.MANUAL_TRIGGER,
    name: "Manual Trigger",
    category: "trigger",
    description: "Start workflow execution manually with a single click",
    icon: Play,
    color: "text-emerald-400",
    bgColor: "bg-emerald-500/10 border-emerald-500/20",
  },
  {
    type: NodeType.WEBHOOK_TRIGGER,
    name: "Webhook Trigger",
    category: "trigger",
    description: "Listen for real or mock incoming HTTP POST payloads",
    icon: Webhook,
    color: "text-amber-400",
    bgColor: "bg-amber-500/10 border-amber-500/20",
  },
  {
    type: NodeType.INTERVAL_TRIGGER,
    name: "Interval Trigger",
    category: "trigger",
    description: "Simulate a scheduled timer that triggers every N seconds",
    icon: Timer,
    color: "text-teal-400",
    bgColor: "bg-teal-500/10 border-teal-500/20",
  },
  // Actions
  {
    type: NodeType.GEMINI_AI,
    name: "Gemini AI Node",
    category: "action",
    description: "Connect to Gemini secure server-side models for automated responses, reasoning, or content drafted",
    icon: Cpu,
    color: "text-[#FF6C37]",
    bgColor: "bg-[#FF6C37]/10 border-[#FF6C37]/20",
  },
  {
    type: NodeType.HTTP_REQUEST,
    name: "HTTP Request",
    category: "action",
    description: "Execute real external API queries safely with a CORS server proxy wrapper",
    icon: Globe,
    color: "text-blue-400",
    bgColor: "bg-blue-500/10 border-blue-500/20",
  },
  {
    type: NodeType.SET_VARIABLE,
    name: "Set Variable",
    category: "action",
    description: "Define object schemas or modify payloads",
    icon: Variable,
    color: "text-pink-400",
    bgColor: "bg-pink-500/10 border-pink-500/20",
  },
  {
    type: NodeType.CONDITIONAL,
    name: "IF Condition",
    category: "action",
    description: "Branch your execution flow based on key-value comparisons",
    icon: GitBranch,
    color: "text-cyan-400",
    bgColor: "bg-cyan-500/10 border-cyan-500/20",
  },
  {
    type: NodeType.SLACK_SIMULATOR,
    name: "Slack Alert Sim",
    category: "action",
    description: "Feed details to a simulated channels wall directly",
    icon: Slack,
    color: "text-purple-400",
    bgColor: "bg-purple-500/10 border-purple-500/20",
  },
  {
    type: NodeType.DELAY,
    name: "Delay Pause",
    category: "action",
    description: "Pause execution momentarily for N seconds",
    icon: Hourglass,
    color: "text-sky-400",
    bgColor: "bg-sky-500/10 border-sky-500/20",
  },
  {
    type: NodeType.CONSOLE_LOG,
    name: "Log Writer",
    category: "action",
    description: "Output debug information directly to the run log pane",
    icon: Terminal,
    color: "text-slate-400",
    bgColor: "bg-slate-500/10 border-slate-500/20",
  },
];

export default function NodeSidebar({ onAddNode }: NodeSidebarProps) {
  const [searchQuery, setSearchQuery] = useState("");

  const filteredNodes = NODE_DEFINITIONS.filter(node =>
    node.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    node.description.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const triggers = filteredNodes.filter((n) => n.category === "trigger");
  const actions = filteredNodes.filter((n) => n.category === "action");

  return (
    <aside className="w-80 border-r border-[#2D2F36] bg-[#16181D] flex flex-col h-full overflow-hidden select-none text-[#D1D5DB]">
      <div className="p-4 border-b border-[#2D2F36]">
        <h3 className="font-display text-base font-semibold text-white">Add Workflow Nodes</h3>
        <p className="text-[11px] text-[#6B7280] mt-1">Click a node to deposit it on your dark canvas workspace</p>
      </div>

      <div className="p-3 border-b border-[#2D2F36] bg-[#111317]">
        <div className="relative">
          <span className="absolute left-2.5 top-2.5 text-[#6B7280]">
            <Search className="h-3.5 w-3.5" />
          </span>
          <input
            type="text"
            placeholder="Search nodes..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-[#0F1115] border border-[#374151] rounded-lg pl-8 pr-3 py-2 text-xs text-white focus:outline-none focus:border-[#FF6C37] placeholder-[#4B5563] transition-colors"
          />
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-6">
        {/* Triggers Category */}
        {triggers.length > 0 && (
          <div>
            <h4 className="text-[10px] font-bold text-[#6B7280] uppercase tracking-wider mb-3">1. Triggers (Starts Flow)</h4>
            <div className="space-y-2">
              {triggers.map((node) => {
                const IconComp = node.icon;
                return (
                  <div
                    key={node.type}
                    onClick={() => onAddNode(node.type)}
                    className="group flex items-start gap-3 p-3 rounded-xl border border-[#2D2F36] bg-[#111317] hover:bg-[#1F2937] hover:border-[#374151] transition-all cursor-pointer"
                  >
                    <div className={`p-2 rounded-lg border ${node.bgColor} shrink-0`}>
                      <IconComp className={`h-4 w-4 ${node.color}`} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-semibold text-[#D1D5DB] group-hover:text-white transition-colors">
                          {node.name}
                        </span>
                        <Plus className="h-3.5 w-3.5 text-[#FF6C37] opacity-0 group-hover:opacity-100 transition-opacity" />
                      </div>
                      <p className="text-[10px] text-[#6B7280] leading-normal mt-0.5 line-clamp-2">
                        {node.description}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Actions Category */}
        {actions.length > 0 && (
          <div>
            <h4 className="text-[10px] font-bold text-[#6B7280] uppercase tracking-wider mb-2.5">2. Actions (Process Data)</h4>
            <div className="space-y-2">
              {actions.map((node) => {
                const IconComp = node.icon;
                return (
                  <div
                    key={node.type}
                    onClick={() => onAddNode(node.type)}
                    className="group flex items-start gap-3 p-3 rounded-xl border border-[#2D2F36] bg-[#111317] hover:bg-[#1F2937] hover:border-[#374151] transition-all cursor-pointer"
                  >
                    <div className={`p-2 rounded-lg border ${node.bgColor} shrink-0`}>
                      <IconComp className={`h-4 w-4 ${node.color}`} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-semibold text-[#D1D5DB] group-hover:text-white transition-colors">
                          {node.name}
                        </span>
                        <Plus className="h-3.5 w-3.5 text-[#FF6C37] opacity-0 group-hover:opacity-100 transition-opacity" />
                      </div>
                      <p className="text-[10px] text-[#6B7280] leading-normal mt-0.5 line-clamp-2">
                        {node.description}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {filteredNodes.length === 0 && (
          <div className="text-center py-8 text-xs text-[#6B7280]">
            No matching nodes found.
          </div>
        )}
      </div>
      
      <div className="p-3.5 bg-[#111317] border-t border-[#2D2F36] flex items-center justify-between">
        <div className="text-[9px] text-[#6B7280] font-mono uppercase tracking-wider">
          N8N ENGINE v1.24.1 (Stable)
        </div>
        <div className="h-1.5 w-1.5 rounded-full bg-[#10B981] shadow-[0_0_8px_rgba(16,185,129,0.6)]"></div>
      </div>
    </aside>
  );
}
