export enum NodeType {
  // Triggers
  MANUAL_TRIGGER = "manual_trigger",
  WEBHOOK_TRIGGER = "webhook_trigger",
  INTERVAL_TRIGGER = "interval_trigger",

  // Actions
  GEMINI_AI = "gemini_ai",
  HTTP_REQUEST = "http_request",
  SET_VARIABLE = "set_variable",
  CONDITIONAL = "conditional",
  SLACK_SIMULATOR = "slack_simulator",
  DELAY = "delay",
  CONSOLE_LOG = "console_log",
}

export interface NodePosition {
  x: number;
  y: number;
}

export interface NodeData {
  // Common visual data
  name: string;
  type: NodeType;
  description: string;

  // Gemini AI details
  prompt?: string;
  temperature?: number;
  systemInstruction?: string;

  // HTTP Request details
  url?: string;
  method?: "GET" | "POST" | "PUT" | "DELETE";
  headers?: Array<{ key: string; value: string }>;
  body?: string; // string representation of JSON

  // Set / Transform details
  variables?: Array<{ name: string; value: string }>; // Can use expressions like {{$json.field}}

  // Conditional details
  propertyName?: string; // Variable to match (e.g., $json.status or status)
  operator?: "equals" | "not_equals" | "contains" | "greater_than" | "less_than";
  comparisonValue?: string;

  // Slack Simulator details
  channel?: string;
  messageTemplate?: string;

  // Delay details
  seconds?: number;

  // Console Log details
  logTemplate?: string;

  // Raw static inputs or test trigger values
  mockPayload?: string; // Formatted JSON string
}

export interface WorkflowNode {
  id: string;
  type: NodeType;
  position: NodePosition;
  data: NodeData;
  state?: "idle" | "running" | "success" | "error";
  errorMessage?: string;
  inputData?: any;
  outputData?: any;
}

export interface NodeConnection {
  id: string;
  fromNodeId: string;
  fromOutputHandle: "default" | "true" | "false";
  toNodeId: string;
}

export interface Workflow {
  id: string;
  name: string;
  description: string;
  nodes: WorkflowNode[];
  connections: NodeConnection[];
}

export interface ExecutionLog {
  id: string;
  timestamp: string;
  type: "info" | "success" | "warning" | "error" | "node";
  nodeId?: string;
  nodeName?: string;
  message: string;
  details?: any;
}

export interface WebhookPayload {
  id: string;
  receivedAt: string;
  method: string;
  body: any;
  headers: any;
  query: any;
}
