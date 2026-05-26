import React, { useState } from "react";
import { 
  X, 
  HelpCircle, 
  Plus, 
  Trash2, 
  Cpu, 
  Globe, 
  Webhook, 
  Terminal, 
  GitBranch, 
  Clipboard, 
  Info 
} from "lucide-react";
import { WorkflowNode, NodeType } from "../types";

interface NodeParameterFormProps {
  node: WorkflowNode | null;
  onUpdateNode: (nodeId: string, updatedData: any) => void;
  onDeleteNode: (nodeId: string) => void;
  webhookBaseUrl: string;
}

export default function NodeParameterForm({
  node,
  onUpdateNode,
  onDeleteNode,
  webhookBaseUrl,
}: NodeParameterFormProps) {
  const [activeTab, setActiveTab] = useState<"settings" | "docs">("settings");
  const [copied, setCopied] = useState(false);

  if (!node) {
    return (
      <div className="w-80 border-l border-[#2D2F36] bg-[#0F1115] flex items-center justify-center p-6 text-center select-none h-full">
        <div className="flex flex-col items-center gap-3">
          <HelpCircle className="h-8 w-8 text-[#4B5563]" />
          <h4 className="text-xs font-semibold text-[#D1D5DB]">No Node Selected</h4>
          <p className="text-[11px] text-[#6B7280] max-w-[180px]">
            Click any node on the visual canvas to configure its settings.
          </p>
        </div>
      </div>
    );
  }

  // Handle simple input modifications
  const handleFieldChange = (key: string, value: any) => {
    onUpdateNode(node.id, {
      ...node.data,
      [key]: value,
    });
  };

  // Webhook detailed URL formulation
  const webhookUrl = `${webhookBaseUrl}/api/webhooks/hook-${node.id}`;

  const copyToClipboard = () => {
    navigator.clipboard.writeText(webhookUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Helper arrays for lists (headers, set variables)
  const headers = node.data.headers || [];
  const variables = node.data.variables || [];

  const addHeaderField = () => {
    const updated = [...headers, { key: "", value: "" }];
    handleFieldChange("headers", updated);
  };

  const removeHeaderField = (idx: number) => {
    const updated = headers.filter((_, i) => i !== idx);
    handleFieldChange("headers", updated);
  };

  const updateHeaderField = (idx: number, keyOrValue: "key" | "value", val: string) => {
    const updated = headers.map((h, i) => {
      if (i === idx) {
        return { ...h, [keyOrValue]: val };
      }
      return h;
    });
    handleFieldChange("headers", updated);
  };

  const addVariableField = () => {
    const updated = [...variables, { name: "", value: "" }];
    handleFieldChange("variables", updated);
  };

  const removeVariableField = (idx: number) => {
    const updated = variables.filter((_, i) => i !== idx);
    handleFieldChange("variables", updated);
  };

  const updateVariableField = (idx: number, nameOrValue: "name" | "value", val: string) => {
    const updated = variables.map((v, i) => {
      if (i === idx) {
        return { ...v, [nameOrValue]: val };
      }
      return v;
    });
    handleFieldChange("variables", updated);
  };

  return (
    <div className="w-80 border-l border-[#2D2F36] bg-[#16181D] flex flex-col h-full overflow-hidden select-none text-[#D1D5DB]">
      {/* Node Header Info */}
      <div className="p-4 border-b border-[#2D2F36] bg-[#111317]">
        <div className="flex items-center justify-between">
          <span className="text-[10px] font-bold text-[#6B7280] uppercase tracking-wider">
            Configuration Panel
          </span>
          <button
            onClick={() => onDeleteNode(node.id)}
            className="text-[10px] font-semibold text-[#6B7280] hover:text-rose-400 transition-colors uppercase tracking-wider bg-transparent border border-[#374151] rounded px-2.5 py-1 hover:bg-rose-500/10 hover:border-rose-500/30 flex items-center gap-1 cursor-pointer"
          >
            <Trash2 className="h-3 w-3" />
            Delete
          </button>
        </div>
        <div className="flex items-center gap-2.5 mt-2.5">
          <div className="bg-[#0F1115] border border-[#2D2F36] text-[#FF6C37] p-2 rounded-lg shrink-0">
            {node.type === NodeType.GEMINI_AI && <Cpu className="h-4 w-4" />}
            {node.type === NodeType.HTTP_REQUEST && <Globe className="h-4 w-4 text-blue-400" />}
            {node.type === NodeType.WEBHOOK_TRIGGER && <Webhook className="h-4 w-4 text-amber-400" />}
            {![NodeType.GEMINI_AI, NodeType.HTTP_REQUEST, NodeType.WEBHOOK_TRIGGER].includes(node.type) && (
              <Terminal className="h-4 w-4 text-[#FF6C37]" />
            )}
          </div>
          <div className="flex-1 min-w-0">
            <input
              type="text"
              value={node.data.name}
              onChange={(e) => handleFieldChange("name", e.target.value)}
              className="font-semibold text-xs text-white bg-transparent border-b border-transparent hover:border-[#374151] focus:border-[#FF6C37] focus:outline-none w-full"
            />
            <p className="text-[10px] text-[#6B7280] line-clamp-1 mt-1">{node.data.description}</p>
          </div>
        </div>
      </div>

      {/* Tabs Menu */}
      <div className="flex border-b border-[#2D2F36] bg-[#111317] h-10 shrink-0">
        <button
          onClick={() => setActiveTab("settings")}
          className={`flex-1 text-center py-2 text-[10px] font-bold uppercase tracking-wider border-b-2 leading-none cursor-pointer transition-colors ${
            activeTab === "settings"
              ? "border-[#FF6C37] text-white"
              : "border-transparent text-[#6B7280] hover:text-white hover:bg-[#1F2937]/20"
          }`}
        >
          Parameters
        </button>
        <button
          onClick={() => setActiveTab("docs")}
          className={`flex-1 text-center py-2 text-[10px] font-bold uppercase tracking-wider border-b-2 leading-none cursor-pointer transition-colors ${
            activeTab === "docs"
              ? "border-[#FF6C37] text-white"
              : "border-transparent text-[#6B7280] hover:text-white hover:bg-[#1F2937]/20"
          }`}
        >
          Instructions
        </button>
      </div>

      {/* Configuration Inputs */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-[#16181D]">
        {activeTab === "settings" ? (
          <>
            {/* MANUAL TRIGGER CONFIG */}
            {node.type === NodeType.MANUAL_TRIGGER && (
              <div className="space-y-3">
                <div className="bg-[#0F1115] border border-[#2D2F36] p-3 rounded-lg text-xs leading-normal text-emerald-400">
                  <span className="font-semibold block mb-1">Manual Trigger Node</span>
                  This is the standard sandbox starting point. Press <strong>Execute Workflow</strong> on the header to let data cycle down automatically.
                </div>
                <div>
                  <label className="block text-[10px] font-bold uppercase text-[#6B7280] mb-1.5 tracking-wider">Initial Payload Dataset (JSON)</label>
                  <textarea
                    value={node.data.mockPayload || ""}
                    onChange={(e) => handleFieldChange("mockPayload", e.target.value)}
                    placeholder='{"key": "value"}'
                    className="w-full h-36 border border-[#374151] rounded-lg p-2.5 font-mono text-xs focus:border-[#FF6C37] focus:outline-none bg-[#0F1115] text-white"
                  />
                  <span className="text-[10px] text-[#6B7280] block mt-1">Passed down as trigger constants to action blocks.</span>
                </div>
              </div>
            )}

            {/* WEBHOOK TRIGGER CONFIG */}
            {node.type === NodeType.WEBHOOK_TRIGGER && (
              <div className="space-y-4">
                <div className="bg-[#111317] border border-[#2D2F36] rounded-xl p-3 space-y-2 text-xs text-[#D1D5DB]">
                  <span className="font-semibold text-white block">External Webhook Endpoint</span>
                  <div className="flex items-center gap-1.5 bg-[#0F1115] border border-[#374151] p-1.5 rounded-lg">
                    <span className="font-mono text-[10px] text-[#6B7280] truncate flex-1">{webhookUrl}</span>
                    <button
                      onClick={copyToClipboard}
                      className="px-2 py-1 bg-[#FF6C37] text-white rounded text-[10px] uppercase font-bold hover:bg-[#e65b2a] transition-colors cursor-pointer"
                    >
                      {copied ? "Copied" : "Copy"}
                    </button>
                  </div>
                  <p className="text-[10px] leading-relaxed text-[#6B7280] mt-1">
                    Fire a secure <strong>POST</strong> to feed dynamic live payload datasets to your visual workflow!
                  </p>
                </div>

                <div>
                  <label className="block text-[10px] font-bold uppercase text-[#6B7280] mb-1.5 tracking-wider">Simulate Local Payload JSON</label>
                  <textarea
                    value={node.data.mockPayload || ""}
                    onChange={(e) => handleFieldChange("mockPayload", e.target.value)}
                    placeholder='{ "customer": "John Connor", "comment": "Excellent responder!" }'
                    className="w-full h-32 border border-[#374151] rounded-lg p-2.5 font-mono text-xs focus:border-[#FF6C37] focus:outline-none bg-[#0F1115] text-white"
                  />
                  <p className="text-[10px] text-[#6B7280] mt-1 leading-normal">
                    Format keys locally to quickly mock and test payload execution.
                  </p>
                </div>
              </div>
            )}

            {/* INTERVAL TRIGGER CONFIG */}
            {node.type === NodeType.INTERVAL_TRIGGER && (
              <div className="space-y-3">
                <div>
                  <label className="block text-[10px] font-bold uppercase text-[#6B7280] mb-1 tracking-wider">Trigger Execution Interval</label>
                  <div className="flex items-center gap-2 mt-1.5">
                    <input
                      type="range"
                      min="5"
                      max="60"
                      step="5"
                      value={node.data.seconds || 15}
                      onChange={(e) => handleFieldChange("seconds", parseInt(e.target.value))}
                      className="flex-1 accent-[#FF6C37]"
                    />
                    <span className="text-xs font-mono font-bold bg-[#0F1115] border border-[#2D2F36] px-2 py-1 rounded text-white min-w-[40px] text-center">
                      {node.data.seconds || 15}s
                    </span>
                  </div>
                  <p className="text-[10px] text-[#6B7280] mt-2.5 leading-relaxed">
                    Triggers a high-speed sandbox scheduler iteration ticking every N seconds.
                  </p>
                </div>
              </div>
            )}

            {/* GEMINI AI CONFIG */}
            {node.type === NodeType.GEMINI_AI && (
              <div className="space-y-3">
                <div>
                  <label className="block text-[10px] font-bold uppercase text-[#6B7280] mb-1 tracking-wider">AI LLM Model</label>
                  <select
                    value="gemini-3.5-flash"
                    className="w-full border border-[#374151] rounded-lg p-2 text-xs bg-[#0F1115] text-white focus:outline-none"
                    disabled
                  >
                    <option value="gemini-3.5-flash">Gemini 3.5 Flash (Default)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[10px] font-bold uppercase text-[#6B7280] mb-1 tracking-wider">System Instruction</label>
                  <textarea
                    value={node.data.systemInstruction || ""}
                    onChange={(e) => handleFieldChange("systemInstruction", e.target.value)}
                    placeholder="E.g., You are a friendly sentiment classifier. Always format response as clean JSON."
                    className="w-full h-20 border border-[#374151] rounded-lg p-2 text-xs bg-[#0F1115] text-white focus:border-[#FF6C37] focus:outline-none"
                  />
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="block text-[10px] font-bold uppercase text-[#6B7280] tracking-wider">Expression Input Prompt</label>
                    <span className="text-[8px] text-[#FF6C37] bg-[#FF6C37]/10 px-1 py-0.5 rounded font-mono font-bold border border-[#FF6C37]/30 uppercase">Expression Ok</span>
                  </div>
                  <textarea
                    value={node.data.prompt || ""}
                    onChange={(e) => handleFieldChange("prompt", e.target.value)}
                    placeholder="Analyze sentiment from: {{comments}} or {{customer}}"
                    className="w-full h-32 border border-[#374151] rounded-lg p-2 text-xs bg-[#0F1115] text-white focus:border-[#FF6C37] focus:outline-none font-mono"
                  />
                  <p className="text-[10px] text-[#6B7280] mt-1">
                    Inject variables using double curly braces: <code>{"{{variable_name}}"}</code>.
                  </p>
                </div>

                <div>
                  <div className="flex justify-between text-[10px] font-bold uppercase text-[#6B7280] tracking-wider mb-1">
                    <span>Model Creativity Temperature</span>
                    <span className="font-mono text-[#FF6C37]">{node.data.temperature !== undefined ? node.data.temperature : 0.2}</span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="1"
                    step="0.1"
                    value={node.data.temperature !== undefined ? node.data.temperature : 0.2}
                    onChange={(e) => handleFieldChange("temperature", parseFloat(e.target.value))}
                    className="w-full accent-[#FF6C37]"
                  />
                </div>
              </div>
            )}

            {/* HTTP REQUEST CONFIG */}
            {node.type === NodeType.HTTP_REQUEST && (
              <div className="space-y-3">
                <div className="grid grid-cols-3 gap-2">
                  <div className="col-span-1">
                    <label className="block text-[9px] font-bold uppercase text-[#6B7280] mb-1.5 tracking-wider">Method</label>
                    <select
                      value={node.data.method || "GET"}
                      onChange={(e) => handleFieldChange("method", e.target.value)}
                      className="w-full border border-[#374151] rounded-lg p-1.5 text-xs bg-[#0F1115] text-white focus:border-[#FF6C37] focus:outline-none"
                    >
                      <option value="GET">GET</option>
                      <option value="POST">POST</option>
                      <option value="PUT">PUT</option>
                      <option value="DELETE">DELETE</option>
                    </select>
                  </div>
                  <div className="col-span-2">
                    <label className="block text-[9px] font-bold uppercase text-[#6B7280] mb-1.5 tracking-wider">Request Path</label>
                    <input
                      type="text"
                      value={node.data.url || ""}
                      onChange={(e) => handleFieldChange("url", e.target.value)}
                      placeholder="/api/mock-db or external"
                      className="w-full border border-[#374151] rounded-lg p-1.5 text-xs bg-[#0F1115] text-white focus:border-[#FF6C37] focus:outline-none font-mono"
                    />
                  </div>
                </div>
                <div className="bg-[#111827] border border-[#1F2937] p-2.5 rounded-lg text-[9.5px] text-[#9CA3AF] leading-normal font-mono">
                  ⚡ <strong className="text-[#FF6C37]">Express CRM available:</strong> Choose <code>/api/mock-db</code> to list pipeline rows or execute inserts locally on your node list!
                </div>

                {/* HTTP HEADER FIELDS */}
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="block text-[10px] font-bold uppercase text-[#6B7280] tracking-wider">Query Headers</label>
                    <button
                      onClick={addHeaderField}
                      className="text-[9px] text-[#FF6C37] font-bold bg-[#FF6C37]/10 hover:bg-[#FF6C37]/20 border border-[#FF6C37]/30 py-1 px-2 rounded flex items-center gap-0.5 cursor-pointer uppercase"
                    >
                      <Plus className="h-3 w-3" /> Header
                    </button>
                  </div>
                  
                  {headers.length === 0 ? (
                    <span className="text-[10px] text-[#6B7280] italic block">No Headers defined.</span>
                  ) : (
                    <div className="space-y-1.5 max-h-36 overflow-y-auto pr-1">
                      {headers.map((h, index) => (
                        <div key={index} className="flex gap-1 items-center">
                          <input
                            type="text"
                            value={h.key}
                            onChange={(e) => updateHeaderField(index, "key", e.target.value)}
                            placeholder="Key"
                            className="flex-1 bg-[#0F1115] border border-[#374151] p-1.5 rounded text-[10px] text-white min-w-0 font-mono"
                          />
                          <input
                            type="text"
                            value={h.value}
                            onChange={(e) => updateHeaderField(index, "value", e.target.value)}
                            placeholder="Value"
                            className="flex-1 bg-[#0F1115] border border-[#374151] p-1.5 rounded text-[10px] text-white min-w-0 font-mono"
                          />
                          <button
                            onClick={() => removeHeaderField(index)}
                            className="text-[#6B7280] hover:text-rose-400 p-1 shrink-0 cursor-pointer"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* HTTP BODY (for methods !== GET) */}
                {node.data.method !== "GET" && (
                  <div>
                    <label className="block text-[10px] font-bold uppercase text-[#6B7280] mb-1.5 tracking-wider">Body Payload JSON</label>
                    <textarea
                      value={node.data.body || ""}
                      onChange={(e) => handleFieldChange("body", e.target.value)}
                      placeholder='{ "name": "Bruce", "value": 75000 }'
                      className="w-full h-24 border border-[#374151] rounded-lg p-2 font-mono text-xs focus:border-[#FF6C37] focus:outline-none bg-[#0F1115] text-white"
                    />
                  </div>
                )}
              </div>
            )}

            {/* SET / DATA VARIABLE TRANSFORM CONFIG */}
            {node.type === NodeType.SET_VARIABLE && (
              <div className="space-y-3">
                <div className="flex items-center justify-between mb-1.5">
                  <label className="block text-[10px] font-bold uppercase text-[#6B7280] tracking-wider">Modify Elements</label>
                  <button
                    onClick={addVariableField}
                    className="text-[9px] text-[#FF6C37] font-bold bg-[#FF6C37]/10 hover:bg-[#FF6C37]/20 border border-[#FF6C37]/30 py-1 px-2 rounded flex items-center gap-0.5 cursor-pointer uppercase"
                  >
                    <Plus className="h-3 w-3" /> Variable
                  </button>
                </div>

                {variables.length === 0 ? (
                  <div className="text-center py-5 border border-dashed border-[#2D2F36] rounded-lg text-[10px] text-[#6B7280]">
                    No variables mutations defined. Use button above to register.
                  </div>
                ) : (
                  <div className="space-y-2">
                    {variables.map((v, index) => (
                      <div key={index} className="flex gap-1.5 items-center bg-[#111317] p-2 rounded border border-[#2D2F36]">
                        <div className="flex-1 space-y-1 min-w-0">
                          <input
                            type="text"
                            value={v.name}
                            onChange={(e) => updateVariableField(index, "name", e.target.value)}
                            placeholder="Variable Output Key"
                            className="w-full bg-[#0F1115] border border-[#374151] p-1.5 rounded text-[10px] text-white font-sans focus:outline-none focus:border-[#FF6C37]"
                          />
                          <input
                            type="text"
                            value={v.value}
                            onChange={(e) => updateVariableField(index, "value", e.target.value)}
                            placeholder="E.g., High Dynamic or {{comment}}"
                            className="w-full bg-[#0F1115] border border-[#374151] p-1.5 rounded text-[10px] text-white font-mono focus:outline-none focus:border-[#FF6C37]"
                          />
                        </div>
                        <button
                          onClick={() => removeVariableField(index)}
                          className="text-[#6B7280] hover:text-rose-400 p-1 shrink-0 cursor-pointer"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* IF / CONDITIONAL NODE CONFIG */}
            {node.type === NodeType.CONDITIONAL && (
              <div className="space-y-3">
                <div>
                  <label className="block text-[10px] font-bold uppercase text-[#6B7280] mb-1 tracking-wider">Evaluation Attribute Path</label>
                  <input
                    type="text"
                    value={node.data.propertyName || ""}
                    onChange={(e) => handleFieldChange("propertyName", e.target.value)}
                    placeholder="E.g., rating, country or comments"
                    className="w-full bg-[#0F1115] text-white border border-[#374151] rounded-lg p-2 text-xs focus:border-[#FF6C37] focus:outline-none font-mono"
                  />
                  <p className="text-[9.5px] text-[#6B7280] mt-1">Loads node outputs automatically during sandbox flow cycles.</p>
                </div>

                <div>
                  <label className="block text-[10px] font-bold uppercase text-[#6B7280] mb-1 tracking-wider">Operator</label>
                  <select
                    value={node.data.operator || "equals"}
                    onChange={(e) => handleFieldChange("operator", e.target.value)}
                    className="w-full border border-[#374151] rounded-lg p-2 text-xs bg-[#0F1115] text-white focus:border-[#FF6C37] focus:outline-none"
                  >
                    <option value="equals">Equals</option>
                    <option value="not_equals">Does Not Equal</option>
                    <option value="contains">Contains String</option>
                    <option value="greater_than">Is Greater Than &gt;</option>
                    <option value="less_than">Is Less Than &lt;</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[10px] font-bold uppercase text-[#6B7280] mb-1 tracking-wider">Target Comparison Constant</label>
                  <input
                    type="text"
                    value={node.data.comparisonValue || ""}
                    onChange={(e) => handleFieldChange("comparisonValue", e.target.value)}
                    placeholder="E.g., 3, US or spam"
                    className="w-full bg-[#0F1115] text-white border border-[#374151] rounded-lg p-2 text-xs focus:border-[#FF6C37] focus:outline-none"
                  />
                </div>

                <div className="bg-[#111827] border border-[#1F2937] p-3 rounded-xl text-[10.5px] text-[#9CA3AF] space-y-1 leading-normal">
                  <span className="font-semibold text-white flex items-center gap-1"><GitBranch className="h-3.5 w-3.5 text-[#FF6C37]" /> Dynamic Port Routing</span>
                  Yields top true <span className="text-[#10B981] font-bold">T</span> branch routing or bottom false <span className="text-rose-400 font-bold">F</span> branch actions based on evaluation logic.
                </div>
              </div>
            )}

            {/* SLACK ALERTS SIM CONFIG */}
            {node.type === NodeType.SLACK_SIMULATOR && (
              <div className="space-y-3">
                <div>
                  <label className="block text-[10px] font-bold uppercase text-[#6B7280] mb-1 tracking-wider">Destination Channel</label>
                  <div className="relative mt-1">
                    <span className="absolute left-2.5 top-2 text-[#6B7280] text-xs font-mono">#</span>
                    <input
                      type="text"
                      value={node.data.channel || ""}
                      onChange={(e) => handleFieldChange("channel", e.target.value)}
                      placeholder="general"
                      className="w-full border border-[#374151] bg-[#0F1115] text-white rounded-lg p-2 pl-6 text-xs focus:border-[#FF6C37] focus:outline-none"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[10px] font-bold uppercase text-[#6B7280] mb-1 tracking-wider">Message Markup Template</label>
                  <textarea
                    value={node.data.messageTemplate || ""}
                    onChange={(e) => handleFieldChange("messageTemplate", e.target.value)}
                    placeholder="E.g., We parsed comments from {{[0].name}}: {{text}}!"
                    className="w-full h-28 border border-[#374151] bg-[#0F1115] text-white rounded-lg p-2.5 text-xs focus:border-[#FF6C37] focus:outline-none"
                  />
                  <p className="text-[10px] text-[#6B7280] mt-1 leading-normal">
                    Insert variables like <code>{"{{text}}"}</code> to bind values dynamically.
                  </p>
                </div>
              </div>
            )}

            {/* DELAY CONFIG */}
            {node.type === NodeType.DELAY && (
              <div className="space-y-3">
                <div>
                  <label className="block text-[10px] font-bold uppercase text-[#6B7280] mb-1 tracking-wider">Pause Timer Standby</label>
                  <div className="flex items-center gap-2 mt-1.5">
                    <input
                      type="range"
                      min="1"
                      max="10"
                      step="1"
                      value={node.data.seconds || 3}
                      onChange={(e) => handleFieldChange("seconds", parseInt(e.target.value))}
                      className="flex-1 accent-[#FF6C37]"
                    />
                    <span className="text-xs font-mono font-bold bg-[#0F1115] border border-[#2D2F36] px-2 py-1 rounded text-white min-w-[32px] text-center">
                      {node.data.seconds || 3}s
                    </span>
                  </div>
                  <p className="text-[10px] text-[#6B7280] mt-2.5 leading-normal">
                    Momentarily sleeps nodes workflow cycles so you can audit step executions comfortably.
                  </p>
                </div>
              </div>
            )}

            {/* CONSOLE LOGGER CONFIG */}
            {node.type === NodeType.CONSOLE_LOG && (
              <div className="space-y-3">
                <div>
                  <label className="block text-[10px] font-bold uppercase text-[#6B7280] mb-1 tracking-wider">Console Dump Template</label>
                  <textarea
                    value={node.data.logTemplate || ""}
                    onChange={(e) => handleFieldChange("logTemplate", e.target.value)}
                    placeholder="Sync result parsed successfully: {{text}}"
                    className="w-full h-32 border border-[#374151] rounded-lg p-2 px-2.5 font-mono text-xs bg-[#0F1115] text-white focus:border-[#FF6C37] focus:outline-none"
                  />
                  <p className="text-[10px] text-[#6B7280] mt-1.5 leading-normal">
                    Outputs high contrast formatted logs directly down inside the running logger panel.
                  </p>
                </div>
              </div>
            )}
          </>
        ) : (
          <div className="space-y-4 text-xs leading-relaxed text-[#9CA3AF]">
            <h4 className="font-semibold text-white text-sm">Automations Syntax Guide</h4>
            <p>Our visual engine supports n8n style string interpolation expressions. You can type any preceding variable inside double brackets to substitute payload keys dynamically:</p>
            
            <div className="bg-[#0F1115] p-2.5 rounded-lg border border-[#2D2F36] space-y-2 font-mono text-[10.5px] text-[#FF6C37]">
              <div>{"{{"}name<span className="text-white">{"}}"}</span></div>
              <div className="text-[9px] text-[#6B7280] font-sans pl-2">Outputs a direct property from the previous node (e.g. "Amelia Earhart").</div>
              
              <div className="pt-1">{"{{"}[0].value<span className="text-white">{"}}"}</span></div>
              <div className="text-[9px] text-[#6B7280] font-sans pl-2">Outputs a value nested inside array index 0. Perfect for DB list node queries.</div>

              <div className="pt-1">{"{{"}text<span className="text-white">{"}}"}</span></div>
              <div className="text-[9px] text-[#6B7280] font-sans pl-2">Reference generated summary text directly from a Gemini AI node.</div>
            </div>

            <div className="bg-[#111827] border border-[#1F2937] p-3 rounded-lg flex gap-2 items-start text-xs text-[#9CA3AF] leading-normal">
              <Info className="h-4 w-4 text-[#FF6C37] shrink-0 mt-0.5" />
              <p className="text-[10px]">
                When a workflow executes, every success state creates output schema models. This forms the payload structure consumed by downstream connector handlers automatically!
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
