import React, { useState } from "react";
import { Terminal, Slack, Database, AlertCircle, RefreshCw, Trash2, ChevronDown, ChevronUp } from "lucide-react";
import { ExecutionLog } from "../types";

interface ConsolePanelProps {
  logs: ExecutionLog[];
  slackMessages: Array<{ timestamp: string; channel: string; message: string }>;
  onClearLogs: () => void;
  webhookUrl?: string;
  triggerWebhookReceived: () => void;
}

export default function ConsolePanel({
  logs,
  slackMessages,
  onClearLogs,
  webhookUrl,
  triggerWebhookReceived,
}: ConsolePanelProps) {
  const [activeTab, setActiveTab] = useState<"logs" | "slack" | "mockdb">("logs");
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [mockDbRows, setMockDbRows] = useState<any[]>([]);
  const [isLoadingDb, setIsLoadingDb] = useState(false);

  // Fetch the mock DB results to inspect
  const refreshMockDb = async () => {
    setIsLoadingDb(true);
    try {
      const res = await fetch("/api/mock-db");
      const data = await res.json();
      setMockDbRows(data);
    } catch (err) {
      console.error("Failed to load mock DB", err);
    } finally {
      setIsLoadingDb(false);
    }
  };

  React.useEffect(() => {
    refreshMockDb();
  }, [logs]); // Refresh database view when workflow completes or changes

  return (
    <div className="border-t border-[#2D2F36] bg-[#16181D] text-[#D1D5DB] flex flex-col h-72 transition-all">
      {/* Console Header Tabs */}
      <div className="flex items-center justify-between px-4 py-2 bg-[#111317] border-b border-[#2D2F36]">
        <div className="flex items-center gap-2">
          <button
            onClick={() => { setActiveTab("logs"); setIsCollapsed(false); }}
            className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors cursor-pointer ${
              activeTab === "logs" && !isCollapsed
                ? "bg-[#1F2937] text-[#FF6C37] border border-[#374151]"
                : "text-[#6B7280] hover:text-[#D1D5DB]"
            }`}
          >
            <Terminal className="h-3.5 w-3.5" />
            Execution Logs ({logs.length})
          </button>
          
          <button
            onClick={() => { setActiveTab("slack"); setIsCollapsed(false); }}
            className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors relative cursor-pointer ${
              activeTab === "slack" && !isCollapsed
                ? "bg-[#1F2937] text-violet-400 border border-[#374151]"
                : "text-[#6B7280] hover:text-[#D1D5DB]"
            }`}
          >
            <Slack className="h-3.5 w-3.5" />
            Slack Monitor
            {slackMessages.length > 0 && (
              <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-[#FF6C37] text-[9px] text-white">
                {slackMessages.length}
              </span>
            )}
          </button>
 
          <button
            onClick={() => { setActiveTab("mockdb"); setIsCollapsed(false); refreshMockDb(); }}
            className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors cursor-pointer ${
              activeTab === "mockdb" && !isCollapsed
                ? "bg-[#1F2937] text-sky-400 border border-[#374151]"
                : "text-[#6B7280] hover:text-[#D1D5DB]"
            }`}
          >
            <Database className="h-3.5 w-3.5" />
            CRM Leads DB
          </button>
        </div>
 
        <div className="flex items-center gap-3">
          {activeTab === "logs" && logs.length > 0 && (
            <button
               onClick={onClearLogs}
               title="Clear execution list"
               className="text-[#6B7280] hover:text-rose-400 transition-colors p-1 cursor-pointer"
            >
              <Trash2 className="h-3.5 w-3.5" />
            </button>
          )}
 
          {activeTab === "mockdb" && (
            <button
               onClick={refreshMockDb}
               disabled={isLoadingDb}
               title="Reload Database"
               className="text-[#6B7280] hover:text-[#FF6C37] transition-colors p-1 cursor-pointer"
            >
              <RefreshCw className={`h-3.5 w-3.5 ${isLoadingDb ? "animate-spin" : ""}`} />
            </button>
          )}
 
          <button
            onClick={() => setIsCollapsed(!isCollapsed)}
            className="text-[#6B7280] hover:text-white transition-colors cursor-pointer"
          >
            {isCollapsed ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
          </button>
        </div>
      </div>
 
      {/* Pane Content */}
      {!isCollapsed && (
        <div className="flex-1 overflow-y-auto p-4 bg-[#0F1115] font-mono text-xs">
          {activeTab === "logs" && (
            <div className="space-y-1.5">
              {logs.length === 0 ? (
                <div className="text-[#6B7280] text-center py-10 flex flex-col items-center gap-2">
                  <Terminal className="h-8 w-8 text-[#2D2F36] mb-1" />
                  <p>Console is inactive. Click "Execute Workflow" above or feed webhook data to start.</p>
                </div>
              ) : (
                logs.map((log) => {
                  let color = "text-[#D1D5DB]";
                  if (log.type === "success") color = "text-[#10B981]";
                  if (log.type === "error") color = "text-rose-400";
                  if (log.type === "warning") color = "text-[#FF6C37] font-bold";
                  if (log.type === "node") color = "text-violet-400";
 
                  return (
                    <div key={log.id} className="border-b border-[#2D2F36]/40 pb-1.5 flex flex-col">
                      <div className="flex items-start gap-4">
                        <span className="text-[#4B5563] shrink-0 select-none">
                          [{new Date(log.timestamp).toLocaleTimeString()}]
                        </span>
                        
                        {log.nodeName && (
                          <span className="text-[#D1D5DB] bg-[#111317] px-1.5 py-0.5 rounded text-[10px] shrink-0 font-sans border border-[#2D2F36]">
                            {log.nodeName}
                          </span>
                        )}
 
                        <span className={`${color} flex-1`}>{log.message}</span>
                      </div>
 
                      {log.details && (
                        <pre className="mt-1 ml-16 p-2 rounded bg-[#111317] border border-[#2D2F36] text-[10.5px] overflow-x-auto text-[#10B981] select-text max-w-full">
                          {typeof log.details === "object"
                            ? JSON.stringify(log.details, null, 2)
                            : log.details}
                        </pre>
                      )}
                    </div>
                  );
                })
              )}
            </div>
          )}
 
          {activeTab === "slack" && (
            <div className="h-full flex flex-col">
              <div className="bg-[#111317] p-2 rounded-lg border border-[#2D2F36] text-xs text-[#9CA3AF] mb-3 flex items-center justify-between">
                <div>
                  <span className="font-bold text-violet-405 text-violet-400">🤖 Team Slack Simulator</span> — Any nodes targeting the Slack channel output here in real-time.
                </div>
              </div>
 
              <div className="flex-1 space-y-3 h-full overflow-y-auto pr-2">
                {slackMessages.length === 0 ? (
                  <div className="text-[#6B7280] text-center py-8">
                    <Slack className="h-8 w-8 text-[#2D2F36] mx-auto mb-2" />
                    No simulation alerts received yet. Configure and trigger a "Slack Alert Sim" node.
                  </div>
                ) : (
                  slackMessages.map((msg, idx) => (
                    <div key={idx} className="flex gap-2 text-sm bg-[#111317] p-3 rounded-lg border border-[#2D2F36]">
                      <div className="h-7 w-7 rounded bg-gradient-to-tr from-[#FF6C37] to-amber-500 flex items-center justify-center text-white text-xs font-bold shrink-0">
                        SB
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-baseline gap-2">
                          <span className="font-semibold text-white text-xs">bot-agent</span>
                          <span className="text-[10px] text-[#6B7280]">#{msg.channel}</span>
                          <span className="text-[9px] text-[#4B5563] font-normal">{msg.timestamp}</span>
                        </div>
                        <p className="text-[#D1D5DB] text-xs font-sans mt-1 whitespace-pre-wrap">{msg.message}</p>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
 
          {activeTab === "mockdb" && (
            <div className="space-y-3 h-full overflow-y-auto">
              <div className="bg-[#111317] p-2 rounded-lg border border-[#2D2F36] flex items-center justify-between">
                <div>
                  <span className="font-bold text-sky-400">📊 Database Table: Leads Pipelines</span> — Simulates a real PostgreSQL/Firestore instance.
                </div>
                <div className="text-[10px] text-[#6B7280]">Endpoint: GET /api/mock-db</div>
              </div>
 
              {mockDbRows.length === 0 ? (
                <div className="text-[#6B7280] text-center py-6">Loading database logs...</div>
              ) : (
                <div className="overflow-x-auto rounded border border-[#2D2F36] bg-[#111317]">
                  <table className="w-full text-left font-sans text-xs">
                    <thead>
                      <tr className="bg-[#0F1115] border-b border-[#2D2F36] text-[#6B7280] text-[9px] uppercase tracking-wider font-bold">
                        <th className="p-2">ID</th>
                        <th className="p-2">Client Name</th>
                        <th className="p-2">Email Address</th>
                        <th className="p-2">Deal Volume</th>
                        <th className="p-2">Territory</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#2D2F36]/50">
                      {mockDbRows.map((row, i) => (
                        <tr key={i} className="hover:bg-[#1F2937]/30">
                          <td className="p-2 font-mono text-[#FF6C37]">{row.id}</td>
                          <td className="p-2 font-medium text-white">{row.name}</td>
                          <td className="p-2 text-[#9CA3AF] text-xs">{row.email}</td>
                          <td className="p-2 text-[#10B981] font-semibold">${row.value?.toLocaleString()}</td>
                          <td className="p-2"><span className="px-1.5 py-0.5 rounded bg-[#0F1115] border border-[#2D2F36] text-[#9CA3AF] text-[10px]">{row.region}</span></td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
