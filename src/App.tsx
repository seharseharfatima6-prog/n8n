import React, { useState, useEffect, useRef } from "react";
import { 
  Play, 
  Plus, 
  Trash2, 
  HelpCircle, 
  Compass, 
  Terminal, 
  CheckCircle2, 
  AlertCircle,
  Activity,
  Workflow as WorkflowIcon,
  RotateCw,
  Eye,
  Settings2,
  GitMerge,
  Maximize2,
  RefreshCcw,
  Zap,
  Webhook
} from "lucide-react";

import { 
  Workflow, 
  WorkflowNode, 
  NodeConnection, 
  NodeType, 
  ExecutionLog, 
  NodePosition 
} from "./types";
import { TEMPLATES } from "./templates";
import NodeSidebar, { NODE_DEFINITIONS } from "./components/NodeSidebar";
import VisualNode from "./components/VisualNode";
import NodeParameterForm from "./components/NodeParameterForm";
import ConsolePanel from "./components/ConsolePanel";

export default function App() {
  const [workflow, setWorkflow] = useState<Workflow>(TEMPLATES[0]);
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
  const [logs, setLogs] = useState<ExecutionLog[]>([]);
  const [slackMessages, setSlackMessages] = useState<Array<{ timestamp: string; channel: string; message: string }>>([]);
  const [isExecuting, setIsExecuting] = useState(false);

  // Connection Line Drafting States
  const [activeLine, setActiveLine] = useState<{
    fromNodeId: string;
    fromOutputHandle: "default" | "true" | "false";
    startX: number;
    startY: number;
    currentX: number;
    currentY: number;
  } | null>(null);

  // Canvas View Translation / Pan Panning
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [isPanning, setIsPanning] = useState(false);
  const [panStart, setPanStart] = useState({ x: 0, y: 0 });

  // Node Dragging States
  const [dragNodeId, setDragNodeId] = useState<string | null>(null);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });

  // Webhook integration polling tracker
  const [lastWebhookCheck, setLastWebhookCheck] = useState<string>(new Date().toISOString());

  const canvasRef = useRef<HTMLDivElement>(null);

  // App Metadata Configuration Base URL identification
  const webhookBaseUrl = window.location.origin;

  // 1. Webhook payload polling loop
  // This automatically queries the server for new incoming payload datasets
  useEffect(() => {
    const webhookNode = workflow.nodes.find(n => n.type === NodeType.WEBHOOK_TRIGGER);
    if (!webhookNode) return;

    const interval = setInterval(async () => {
      try {
        const url = `/api/webhooks/poll/hook-${webhookNode.id}?since=${lastWebhookCheck}`;
        const res = await fetch(url);
        const newPayloads = await res.json();
        
        if (newPayloads && newPayloads.length > 0) {
          const newest = newPayloads[newPayloads.length - 1];
          // Update last check timestamp
          setLastWebhookCheck(new Date().toISOString());

          addLog("info", `[Webhook Event Received] Incoming fetch caught on hook-${webhookNode.id}!`, newest.body, webhookNode.id, webhookNode.data.name);
          
          // Inject output data into webhook triggers node and trigger workflow run cycle automatically
          setWorkflow(prev => ({
            ...prev,
            nodes: prev.nodes.map(n => 
              n.id === webhookNode.id 
                ? { ...n, outputData: newest.body, state: "success" } 
                : n
            )
          }));

          // Automatically kickstart sequence run
          executeNodeSequence(webhookNode.id, newest.body);
        }
      } catch (err) {
        console.warn("Poll trigger failed", err);
      }
    }, 3000);

    return () => clearInterval(interval);
  }, [workflow.nodes, lastWebhookCheck]);

  // Log append helper
  const addLog = (
    type: "info" | "success" | "warning" | "error" | "node",
    message: string,
    details?: any,
    nodeId?: string,
    nodeName?: string
  ) => {
    setLogs(prev => [
      {
        id: `log-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
        timestamp: new Date().toISOString(),
        type,
        nodeId,
        nodeName,
        message,
        details
      },
      ...prev
    ]);
  };

  const clearCanvasData = () => {
    setWorkflow({
      id: "empty-flow",
      name: "Construct New Workspace Flow",
      description: "Grid workspace reset complete. Add triggers to start configuring automation routes.",
      nodes: [],
      connections: []
    });
    setSelectedNodeId(null);
    setLogs([]);
    addLog("info", "Canvas environment cleared. Define triggers to begin.");
  };

  const loadWorkflowTemplate = (tpl: Workflow) => {
    // Generate fresh ids to dodge caching issues, or load directly matching settings
    setWorkflow(tpl);
    setSelectedNodeId(null);
    setLogs([]);
    addLog("info", `Template successfully loaded: "${tpl.name}"`);
  };

  // 2. Add New Visual Node to canvas
  const handleAddNewNode = (type: NodeType) => {
    const def = NODE_DEFINITIONS.find(d => d.type === type);
    if (!def) return;

    // Place node at center of visible pan canvas
    const nodeWidth = 256;
    const nodeHeight = 110;
    const canvasWidth = canvasRef.current?.clientWidth || 900;
    const canvasHeight = canvasRef.current?.clientHeight || 550;

    const x = Math.round((canvasWidth / 2 - nodeWidth / 2) - pan.x);
    const y = Math.round((canvasHeight / 2 - nodeHeight / 2) - pan.y);

    const newNode: WorkflowNode = {
      id: `node-${Date.now()}`,
      type,
      position: { x, y },
      state: "idle",
      data: {
        name: `${def.name} #${workflow.nodes.filter(n => n.type === type).length + 1}`,
        type,
        description: def.description,
        temperature: 0.2,
        url: type === NodeType.HTTP_REQUEST ? "/api/mock-db" : undefined,
        method: type === NodeType.HTTP_REQUEST ? "GET" : undefined,
        seconds: type === NodeType.INTERVAL_TRIGGER ? 10 : type === NodeType.DELAY ? 3 : undefined,
        mockPayload: type === NodeType.WEBHOOK_TRIGGER ? '{\n  "status": "active",\n  "customer": "Sarah Connor",\n  "comment": "The system response is impeccable!"\n}' : undefined
      }
    };

    setWorkflow(prev => ({
      ...prev,
      nodes: [...prev.nodes, newNode]
    }));
    setSelectedNodeId(newNode.id);
    addLog("info", `Node created on canvas workspace: "${newNode.data.name}"`);
  };

  const handleUpdateNode = (nodeId: string, updatedData: any) => {
    setWorkflow(prev => ({
      ...prev,
      nodes: prev.nodes.map(n => n.id === nodeId ? { ...n, data: updatedData } : n)
    }));
  };

  const handleDeleteNode = (nodeId: string) => {
    setWorkflow(prev => ({
      ...prev,
      nodes: prev.nodes.filter(n => n.id !== nodeId),
      connections: prev.connections.filter(c => c.fromNodeId !== nodeId && c.toNodeId !== nodeId)
    }));
    if (selectedNodeId === nodeId) {
      setSelectedNodeId(null);
    }
    addLog("warning", `Removed node ID: ${nodeId}`);
  };

  // 3. Coordinate Drag Math
  const handleNodeMouseDown = (e: React.MouseEvent, nodeId: string) => {
    if (e.button !== 0) return; // Only process left click
    const targetNode = workflow.nodes.find(n => n.id === nodeId);
    if (!targetNode) return;

    setDragNodeId(nodeId);
    // Track click offset inside the custom card boundary
    setDragOffset({
      x: e.clientX - targetNode.position.x,
      y: e.clientY - targetNode.position.y
    });
    e.preventDefault();
  };

  const handleCanvasMouseDown = (e: React.MouseEvent) => {
    // If click touches node cards or elements, abort panning
    if (e.button !== 0) return;
    setIsPanning(true);
    setPanStart({
      x: e.clientX - pan.x,
      y: e.clientY - pan.y
    });
    e.preventDefault();
  };

  const handleCanvasMouseMove = (e: React.MouseEvent) => {
    if (dragNodeId) {
      const computedX = e.clientX - dragOffset.x;
      const computedY = e.clientY - dragOffset.y;
      
      setWorkflow(prev => ({
        ...prev,
        nodes: prev.nodes.map(n => 
          n.id === dragNodeId 
            ? { ...n, position: { x: computedX, y: computedY } } 
            : n
        )
      }));
    } else if (isPanning) {
      setPan({
        x: e.clientX - panStart.x,
        y: e.clientY - panStart.y
      });
    } else if (activeLine) {
      // Offset screen move to canvas container metrics
      const rect = canvasRef.current?.getBoundingClientRect();
      if (rect) {
        setActiveLine(prev => prev ? {
          ...prev,
          currentX: e.clientX - rect.left - pan.x,
          currentY: e.clientY - rect.top - pan.y
        } : null);
      }
    }
  };

  const handleCanvasMouseUp = () => {
    if (dragNodeId) setDragNodeId(null);
    if (isPanning) setIsPanning(null as any);
    if (activeLine) setActiveLine(null);
  };

  // 4. Connect Dragging handlers
  const handleConnectStart = (e: React.MouseEvent, nodeId: string, handleId: any) => {
    const originNode = workflow.nodes.find(n => n.id === nodeId);
    if (!originNode) return;

    const rect = canvasRef.current?.getBoundingClientRect();
    if (!rect) return;

    // Standard output socket offsets:
    let outputX = originNode.position.x + 256;
    let outputY = originNode.position.y + 45;

    if (originNode.type === NodeType.CONDITIONAL) {
      outputY = handleId === "true" ? originNode.position.y + 30 : originNode.position.y + 70;
    }

    setActiveLine({
      fromNodeId: nodeId,
      fromOutputHandle: handleId,
      startX: outputX,
      startY: outputY,
      currentX: outputX,
      currentY: outputY
    });
    e.stopPropagation();
    e.preventDefault();
  };

  const handleConnectEnd = (e: React.MouseEvent, targetNodeId: string) => {
    if (!activeLine) return;
    if (activeLine.fromNodeId === targetNodeId) return; // Refuse linking to self

    // Abort duplicate connections
    const duplicate = workflow.connections.find(
      c => c.fromNodeId === activeLine.fromNodeId &&
           c.fromOutputHandle === activeLine.fromOutputHandle &&
           c.toNodeId === targetNodeId
    );
    if (duplicate) return;

    const newConnection: NodeConnection = {
      id: `conn-${Date.now()}`,
      fromNodeId: activeLine.fromNodeId,
      fromOutputHandle: activeLine.fromOutputHandle,
      toNodeId: targetNodeId
    };

    setWorkflow(prev => ({
      ...prev,
      connections: [...prev.connections, newConnection]
    }));
    setActiveLine(null);
    addLog("info", `Successfully connected link!`);
  };

  const deleteConnection = (connId: string) => {
    setWorkflow(prev => ({
      ...prev,
      connections: prev.connections.filter(c => c.id !== connId)
    }));
    addLog("warning", `Removed workflow connection link.`);
  };

  // Helper evaluating n8n double bracket expressions
  const evaluateExpressions = (template: string, inputData: any): string => {
    if (!template) return "";
    if (!inputData) return template;
    
    return template.replace(/\{\{([^}]+)\}\}/g, (match, expression) => {
      const cleanExpr = expression.trim();
      try {
        // Direct text output check from Gemini
        if (cleanExpr === "text" && typeof inputData === "object" && "text" in inputData) {
          return inputData.text;
        }

        // Test nesting paths: e.g. customer or [0].name
        const segments = cleanExpr.split(".");
        let cursor: any = inputData;

        for (const seg of segments) {
          if (seg.startsWith("[") && seg.endsWith("]")) {
            const idx = parseInt(seg.slice(1, -1));
            cursor = cursor[idx];
          } else if (cursor && typeof cursor === "object" && seg in cursor) {
            cursor = cursor[seg];
          } else {
            return match; // Keep original if fails expression matching
          }
        }
        return cursor !== undefined ? (typeof cursor === "object" ? JSON.stringify(cursor) : String(cursor)) : match;
      } catch (_) {
        return match;
      }
    });
  };

  // 5. Execution Engine Run sequence
  const executeWorkflow = async () => {
    if (isExecuting) return;
    setIsExecuting(true);
    setLogs([]);
    addLog("info", "🚀 Kicking off workflow simulation thread...");

    // Find trigger starting points
    const triggerNodes = workflow.nodes.filter(
      n => n.type === NodeType.MANUAL_TRIGGER || n.type === NodeType.WEBHOOK_TRIGGER || n.type === NodeType.INTERVAL_TRIGGER
    );

    if (triggerNodes.length === 0) {
      addLog("error", "Execution aborted: No visual trigger nodes detected in workspace!");
      setIsExecuting(false);
      return;
    }

    // Set all workflow node execution states to idle
    setWorkflow(prev => ({
      ...prev,
      nodes: prev.nodes.map(n => ({ ...n, state: "idle", inputData: undefined, outputData: undefined }))
    }));

    // Trigger sequential runs for each initiator detected
    for (const node of triggerNodes) {
      let runPayload: any = {};
      
      // Parse manual initial mocks if present
      if (node.type === NodeType.MANUAL_TRIGGER || node.type === NodeType.WEBHOOK_TRIGGER) {
        try {
          if (node.data.mockPayload) {
            runPayload = JSON.parse(node.data.mockPayload);
          }
        } catch (_) {
          runPayload = { raw: node.data.mockPayload || "No payload configured" };
        }
      }

      addLog("node", `Initializing automation on starting trigger node: "${node.data.name}"`, runPayload, node.id, node.data.name);
      
      // Set trigger node to active success visual state
      setWorkflow(prev => ({
        ...prev,
        nodes: prev.nodes.map(n => n.id === node.id ? { ...n, state: "success", outputData: runPayload } : n)
      }));

      // Initiate recursive cascading queue executions
      await executeNodeSequence(node.id, runPayload);
    }

    setIsExecuting(false);
    addLog("success", "🏁 Automation run simulation session complete!");
  };

  // Cascading breadth execution solver
  const executeNodeSequence = async (originNodeId: string, outputPayload: any) => {
    // Locate connected downstream nodes
    const originatingConnections = workflow.connections.filter(c => c.fromNodeId === originNodeId);
    if (originatingConnections.length === 0) return;

    for (const conn of originatingConnections) {
      const nextNode = workflow.nodes.find(n => n.id === conn.toNodeId);
      if (!nextNode) continue;

      // Clean execution state indicators
      setWorkflow(prev => ({
        ...prev,
        nodes: prev.nodes.map(n => n.id === nextNode.id ? { ...n, state: "running" } : n)
      }));

      addLog("info", `Routing variables from "${originNodeId}" to "${nextNode.data.name}"`);
      await new Promise(resolve => setTimeout(resolve, 800)); // Sleep small ticks to visualize visual path flow smoothly

      try {
        const result = await processSingleNodeAction(nextNode, outputPayload, conn.fromOutputHandle);
        
        if (result.success) {
          // Cascade down successfully
          setWorkflow(prev => ({
            ...prev,
            nodes: prev.nodes.map(n => 
              n.id === nextNode.id 
                ? { ...n, state: "success", inputData: outputPayload, outputData: result.data } 
                : n
            )
          }));

          // Multi branching check for Conditional logics
          if (nextNode.type === NodeType.CONDITIONAL) {
            const nextBranch = result.data.branchResult ? "true" : "false";
            addLog("info", `IF Node decided path outcome: ${nextBranch.toUpperCase()}`, result.data, nextNode.id, nextNode.data.name);
            
            // Recurse strictly into conditional branches matches
            const branchMatches = workflow.connections.filter(c => c.fromNodeId === nextNode.id && c.fromOutputHandle === nextBranch);
            for (const bConn of branchMatches) {
              await executeNodeSequence(nextNode.id, result.data);
            }
          } else {
            // Recurse downstream standard action output handlers
            await executeNodeSequence(nextNode.id, result.data);
          }
        } else {
          // Log errors
          setWorkflow(prev => ({
            ...prev,
            nodes: prev.nodes.map(n => 
              n.id === nextNode.id 
                ? { ...n, state: "error", errorMessage: result.error } 
                : n
            )
          }));
          addLog("error", `[Action Failed] Node "${nextNode.data.name}" failed: ${result.error}`, null, nextNode.id, nextNode.data.name);
        }
      } catch (err: any) {
        setWorkflow(prev => ({
          ...prev,
          nodes: prev.nodes.map(n => 
            n.id === nextNode.id 
              ? { ...n, state: "error", errorMessage: err.message } 
              : n
          )
        }));
        addLog("error", `Fatal executor failure inside action: ${err.message}`, null, nextNode.id, nextNode.data.name);
      }
    }
  };

  // Unified Node behavior executor
  const processSingleNodeAction = async (
    node: WorkflowNode, 
    inputData: any,
    handleType: "default" | "true" | "false"
  ): Promise<{ success: boolean; data?: any; error?: string }> => {
    
    addLog("node", `Running action node: "${node.data.name}"`, inputData, node.id, node.data.name);

    switch (node.type) {
      case NodeType.GEMINI_AI: {
        const expandedPrompt = evaluateExpressions(node.data.prompt || "", inputData);
        addLog("info", `Gemini Query prompt prepared: "${expandedPrompt}"`, null, node.id, node.data.name);

        try {
          const res = await fetch("/api/execute-ai", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              prompt: expandedPrompt,
              systemInstruction: node.data.systemInstruction,
              model: "gemini-3.5-flash"
            })
          });

          if (!res.ok) {
            const errDetails = await res.json();
            throw new Error(errDetails.error || "Gemini execution block failed.");
          }

          const responseData = await res.json();
          let parsedJson: any = null;
          try {
            parsedJson = JSON.parse(responseData.text);
          } catch (_) {}

          const dataPayload = parsedJson ? parsedJson : { text: responseData.text };
          addLog("success", `Gemini returned AI reply summary:`, dataPayload, node.id, node.data.name);
          return { success: true, data: dataPayload };
        } catch (err: any) {
          return { success: false, error: err.message };
        }
      }

      case NodeType.HTTP_REQUEST: {
        const rawUrl = node.data.url || "";
        const expandedUrl = evaluateExpressions(rawUrl, inputData);
        const resolvedUrl = expandedUrl.startsWith("/") ? `${window.location.origin}${expandedUrl}` : expandedUrl;

        addLog("info", `Request mapping: ${node.data.method || "GET"} -> ${resolvedUrl}`, null, node.id, node.data.name);

        try {
          // Call Express server-side CORS safe proxy
          const res = await fetch("/api/proxy", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              url: resolvedUrl,
              method: node.data.method || "GET",
              headers: node.data.headers || [],
              body: node.data.body ? JSON.parse(evaluateExpressions(node.data.body, inputData)) : undefined
            })
          });

          if (!res.ok) {
            const err = await res.json();
            throw new Error(err.error || "HTTP target endpoint failed.");
          }

          const payload = await res.json();
          addLog("success", `HTTP Response parsed: Status ${payload.status}`, payload.data, node.id, node.data.name);
          return { success: true, data: payload.data };
        } catch (err: any) {
          return { success: false, error: err.message };
        }
      }

      case NodeType.SET_VARIABLE: {
        if (!node.data.variables || node.data.variables.length === 0) {
          addLog("warning", "Skipping variables: No keys mapped in parameters panel.", null, node.id, node.data.name);
          return { success: true, data: inputData };
        }

        const mutatedObject: Record<string, any> = { ...inputData };
        node.data.variables.forEach(v => {
          if (v.name) {
            mutatedObject[v.name] = evaluateExpressions(v.value, inputData);
          }
        });

        addLog("success", "Mutated variables map completed.", mutatedObject, node.id, node.data.name);
        return { success: true, data: mutatedObject };
      }

      case NodeType.CONDITIONAL: {
        const propPath = node.data.propertyName || "";
        const operator = node.data.operator || "equals";
        const compareValue = node.data.comparisonValue || "";

        // Resolve path within inputData
        let sourceValue: any = undefined;
        try {
          const segments = propPath.split(".");
          let cursor = inputData;
          for (const s of segments) {
            if (s.startsWith("[") && s.endsWith("]")) {
              const idx = parseInt(s.slice(1, -1));
              cursor = cursor[idx];
            } else if (cursor && typeof cursor === "object" && s in cursor) {
              cursor = cursor[s];
            } else {
              cursor = undefined;
              break;
            }
          }
          sourceValue = cursor !== undefined ? cursor : inputData[propPath];
        } catch (_) {}

        if (sourceValue === undefined) {
          sourceValue = "";
        }

        let isTrue = false;
        const strSource = String(sourceValue).toLowerCase().trim();
        const strCompare = String(compareValue).toLowerCase().trim();

        if (operator === "equals") isTrue = strSource === strCompare;
        else if (operator === "not_equals") isTrue = strSource !== strCompare;
        else if (operator === "contains") isTrue = strSource.includes(strCompare);
        else if (operator === "greater_than") isTrue = parseFloat(strSource) > parseFloat(strCompare);
        else if (operator === "less_than") isTrue = parseFloat(strSource) < parseFloat(strCompare);

        addLog("info", `Checking IF evaluation: "${sourceValue}" ${operator} "${compareValue}" -> ${isTrue.toString().toUpperCase()}`, null, node.id, node.data.name);
        return { 
          success: true, 
          data: { 
            ...inputData, 
            branchResult: isTrue,
            checkedProperty: propPath,
            checkedValue: sourceValue
          } 
        };
      }

      case NodeType.SLACK_SIMULATOR: {
        const channelName = node.data.channel || "general";
        const formattedTemplate = evaluateExpressions(node.data.messageTemplate || "", inputData);

        // Append to in-memory slack messages database
        const newSlackMsg = {
          timestamp: new Date().toLocaleTimeString(),
          channel: channelName,
          message: formattedTemplate
        };

        setSlackMessages(prev => [...prev, newSlackMsg]);
        addLog("success", `[Slack Simulated Success] Posted content to channel #${channelName}: "${formattedTemplate}"`, null, node.id, node.data.name);
        return { success: true, data: { status: "dispatched", ...inputData } };
      }

      case NodeType.DELAY: {
        const waitMs = (node.data.seconds || 3) * 1000;
        addLog("warning", `Pausing stream trace standbys cycle for ${node.data.seconds || 3} seconds...`, null, node.id, node.data.name);
        await new Promise(resolve => setTimeout(resolve, waitMs));
        addLog("success", "Pause interval complete, resuming workflow cascade.", null, node.id, node.data.name);
        return { success: true, data: inputData };
      }

      case NodeType.CONSOLE_LOG: {
        const content = evaluateExpressions(node.data.logTemplate || "", inputData);
        addLog("warning", `[CONSOLE LOG OUTPUT]: ${content}`, null, node.id, node.data.name);
        return { success: true, data: inputData };
      }

      default:
        return { success: true, data: inputData };
    }
  };

  // Click on background canvas to reset focus
  const handleBgClick = () => {
    setSelectedNodeId(null);
  };

  // Trigger simulated Webhook trigger locally
  const triggerLocalWebhookRun = async () => {
    const webhookNode = workflow.nodes.find(n => n.type === NodeType.WEBHOOK_TRIGGER);
    if (!webhookNode) {
      alert("Please add a Webhook Trigger node to the canvas first to execute webhooks!");
      return;
    }

    let bodyData = {};
    try {
      if (webhookNode.data.mockPayload) {
        bodyData = JSON.parse(webhookNode.data.mockPayload);
      }
    } catch (_) {
      alert("Invalid JSON format in Webhook mock payload. Please correct it in the panel.");
      return;
    }

    addLog("info", "Fired Simulated Webhook payload trigger manually.");
    
    // Make actual fetch to our Express server webhook endpoint so the polling loop grabs it!
    try {
      const res = await fetch(`/api/webhooks/hook-${webhookNode.id}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(bodyData)
      });
      const resData = await res.ok ? await res.json() : null;
      if (resData) {
        addLog("success", `[Simulated Handshake Success] Endpoint successfully accepted POST requests. Poller in motion.`);
      }
    } catch (err: any) {
      addLog("error", `Local Sim Webhook pipeline dispatch failed: ${err.message}`);
    }
  };

  return (
    <div className="flex flex-col h-screen overflow-hidden bg-[#0F1115] font-sans antialiased text-[#D1D5DB]">
      
      {/* 1. Header Toolbar Controls */}
      <header className="h-16 px-6 bg-[#111317] border-b border-[#2D2F36] shrink-0 flex items-center justify-between relative z-20">
        <div className="flex items-center gap-3">
          <div className="bg-gradient-to-tr from-[#FF6C37] to-amber-500 text-white p-2 rounded-xl flex items-center justify-center shadow-lg shadow-orange-500/10">
            <Zap className="h-5 w-5 fill-white" />
          </div>
          <div>
            <h1 className="font-display font-extrabold text-sm tracking-tight text-white leading-none">
              n8n Workflow Studio
            </h1>
            <p className="text-[10px] text-[#6B7280] mt-1 flex items-center gap-1.5 font-medium">
              <span className="inline-flex h-1.5 w-1.5 rounded-full bg-[#10B981] animate-pulse"></span>
              Full Stack Automation sandbox with secure Gemini Nodes
            </p>
          </div>
        </div>

        {/* Templates selector Dropdown controls */}
        <div className="flex items-center gap-3.5">
          <div className="flex items-center gap-1.5 bg-[#0F1115] p-1 rounded-xl border border-[#2D2F36]">
            {TEMPLATES.map((tpl, idx) => (
              <button
                key={tpl.id}
                onClick={() => loadWorkflowTemplate(tpl)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold cursor-pointer transition-all ${
                  workflow.name === tpl.name
                    ? "bg-[#1F2937] text-white border border-[#374151]"
                    : "text-[#6B7280] hover:text-[#D1D5DB]"
                }`}
              >
                Template #{idx + 1}: {tpl.name.split(" ")[0]}
              </button>
            ))}
          </div>

          <div className="h-5 w-[1px] bg-[#2D2F36]"></div>

          <button
            onClick={clearCanvasData}
            title="Wipe canvas clear"
            className="px-3.5 py-2 hover:bg-rose-500/10 border border-[#374151] hover:border-rose-500/30 rounded-xl text-xs text-[#6B7280] hover:text-rose-400 font-bold transition-all cursor-pointer flex items-center gap-1.5"
          >
            <RefreshCcw className="h-3.5 w-3.5" />
            Clear
          </button>

          <button
            onClick={triggerLocalWebhookRun}
            title="Simulate Webhook Trigger"
            className="px-4 py-2 bg-[#FF6C37]/10 border border-[#FF6C37]/20 hover:bg-[#FF6C37]/20 rounded-xl text-xs font-bold text-[#FF6C37] transition-all cursor-pointer flex items-center gap-1.5"
          >
            <Webhook className="h-3.5 w-3.5 shrink-0" />
            Fire Webhook Sim
          </button>

          <button
            onClick={executeWorkflow}
            disabled={isExecuting}
            className={`px-5 py-2.5 rounded-xl text-xs font-bold shadow-sm transition-all flex items-center gap-1.5 cursor-pointer ${
              isExecuting
                ? "bg-[#1F2937] text-[#6B7280] cursor-not-allowed"
                : "bg-[#FF6C37] text-white hover:bg-[#e65b2a] hover:shadow-orange-500/10 ring-2 ring-transparent active:scale-95"
            }`}
          >
            <Play className={`h-4 w-4 fill-white ${isExecuting ? "animate-spin" : ""}`} />
            {isExecuting ? "Executing..." : "Execute Workflow"}
          </button>
        </div>
      </header>

      {/* 2. Visual Canvas Core Workspace Area */}
      <div className="flex-1 flex overflow-hidden relative">
        
        {/* Left Hand: Workflow nodes Sidebar addition drawer */}
        <NodeSidebar onAddNode={handleAddNewNode} />

        {/* Center: Interactive Pan Canvas board */}
        <div
          ref={canvasRef}
          onMouseDown={handleCanvasMouseDown}
          onMouseMove={handleCanvasMouseMove}
          onMouseUp={handleCanvasMouseUp}
          onClick={handleBgClick}
          className="flex-1 relative overflow-hidden bg-[#0F1115] grid-pattern cursor-grab active:cursor-grabbing outline-none"
        >
          {/* SVG Connection links layer */}
          <svg className="absolute inset-0 w-full h-full pointer-events-none z-10 select-none">
            <g transform={`translate(${pan.x}, ${pan.y})`}>
              {/* Draft connection drawing link */}
              {activeLine && (
                <path
                  d={`M ${activeLine.startX} ${activeLine.startY} C ${
                    activeLine.startX + Math.max(80, Math.abs(activeLine.currentX - activeLine.startX) * 0.4)
                  } ${activeLine.startY}, ${
                    activeLine.currentX - Math.max(80, Math.abs(activeLine.currentX - activeLine.startX) * 0.4)
                  } ${activeLine.currentY}, ${activeLine.currentX} ${activeLine.currentY}`}
                  stroke="#FF6C37"
                  strokeWidth="3.5"
                  fill="none"
                  strokeLinecap="round"
                  className="running-line"
                />
              )}

              {/* Saved connectors visual linkages */}
              {workflow.connections.map((conn) => {
                const fromNode = workflow.nodes.find(n => n.id === conn.fromNodeId);
                const toNode = workflow.nodes.find(n => n.id === conn.toNodeId);
                if (!fromNode || !toNode) return null;

                // Anchor starting coordinate relative to offset handle positions
                let startX = fromNode.position.x + 256;
                let startY = fromNode.position.y + 45;

                if (fromNode.type === NodeType.CONDITIONAL) {
                  startY = conn.fromOutputHandle === "true" ? fromNode.position.y + 30 : fromNode.position.y + 70;
                }

                const endX = toNode.position.x;
                const endY = toNode.position.y + 45;

                const dx = Math.max(80, Math.abs(endX - startX) * 0.45);
                const isLineActive = isExecuting && (fromNode.state === "running" || fromNode.state === "success");

                return (
                  <g key={conn.id} className="pointer-events-auto">
                    {/* Hover clickable border wrapper to remove links */}
                    <path
                      d={`M ${startX} ${startY} C ${startX + dx} ${startY}, ${endX - dx} ${endY}, ${endX} ${endY}`}
                      stroke="transparent"
                      strokeWidth="11"
                      fill="none"
                      className="cursor-pointer hover:stroke-rose-400/30"
                      title="Double-click link to delete connection connection"
                      onDoubleClick={() => deleteConnection(conn.id)}
                    />
                    
                    {/* Core visual link rendering lines */}
                    <path
                      d={`M ${startX} ${startY} C ${startX + dx} ${startY}, ${endX - dx} ${endY}, ${endX} ${endY}`}
                      stroke={
                        isLineActive 
                          ? "#FF6C37" 
                          : conn.fromOutputHandle === "true" 
                            ? "#10b981" 
                            : conn.fromOutputHandle === "false" 
                              ? "#f43f5e" 
                              : "#374151"
                      }
                      strokeWidth={isLineActive ? "3" : "2.2"}
                      fill="none"
                      strokeLinecap="round"
                      className={fromNode.state === "running" ? "running-line" : ""}
                    />

                    {/* Cute hoverable deleting badge circle */}
                    <circle
                      cx={(startX + endX) / 2}
                      cy={(startY + endY) / 2}
                      r="7.5"
                      fill="#111317"
                      stroke="#374151"
                      strokeWidth="1"
                      className="opacity-0 hover:opacity-100 cursor-pointer fill-rose-500 hover:fill-rose-600 transition-all hover:scale-125 stroke-[#2D2F36]"
                      onClick={() => deleteConnection(conn.id)}
                      title="Delete connection link"
                    />
                  </g>
                );
              })}
            </g>
          </svg>

          {/* Interactive Drag Node Canvas containers */}
          <div
            style={{
              transform: `translate(${pan.x}px, ${pan.y}px)`,
              transformOrigin: "top left",
            }}
            className="absolute inset-0 pointer-events-none"
          >
            <div className="pointer-events-auto w-full h-full relative">
              {workflow.nodes.map((node) => (
                <VisualNode
                  key={node.id}
                  node={node}
                  isSelected={selectedNodeId === node.id}
                  onSelect={() => setSelectedNodeId(node.id)}
                  onMouseDown={handleNodeMouseDown}
                  onConnectStart={handleConnectStart}
                  onConnectEnd={handleConnectEnd}
                />
              ))}

              {workflow.nodes.length === 0 && (
                <div className="absolute inset-0 flex items-center justify-center p-6 text-center select-none text-[#6B7280]">
                  <div className="flex flex-col items-center gap-3 max-w-[325px] bg-[#111317] p-8 rounded-3xl border border-dashed border-[#2D2F36] hover:border-[#374151] transition-transform pointer-events-auto">
                    <WorkflowIcon className="h-12 w-12 text-[#2D2F36]" />
                    <h3 className="font-display font-semibold text-white text-xs">Automation Board is Empty</h3>
                    <p className="text-[11px] text-[#6B7280] leading-relaxed">
                      Add starting triggers like <strong>Manual Trigger</strong> or <strong>Webhook Trigger</strong> on the side catalog to construct your dynamic graph automatically!
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Right Hand Parameter configurations dock panel */}
        <NodeParameterForm
          node={workflow.nodes.find(n => n.id === selectedNodeId) || null}
          onUpdateNode={handleUpdateNode}
          onDeleteNode={handleDeleteNode}
          webhookBaseUrl={webhookBaseUrl}
        />
      </div>

      {/* 3. Bottom Simulator logger / terminal panel drawers */}
      <ConsolePanel
        logs={logs}
        slackMessages={slackMessages}
        onClearLogs={() => setLogs([])}
        webhookUrl=""
        triggerWebhookReceived={() => {}}
      />
    </div>
  );
}
