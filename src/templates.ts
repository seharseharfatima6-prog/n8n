import { Workflow, NodeType } from "./types";

export const TEMPLATES: Workflow[] = [
  {
    id: "ai-auto-responder",
    name: "AI-Powered Customer Feedback Moderation",
    description: "Accepts incoming feedback via Webhook, uses Gemini to analyze sentiment and draft a reply, routes different responses depending on sentiment score.",
    nodes: [
      {
        id: "node-1",
        type: NodeType.WEBHOOK_TRIGGER,
        position: { x: 50, y: 150 },
        data: {
          name: "Webhook Trigger",
          type: NodeType.WEBHOOK_TRIGGER,
          description: "Listen for incoming feedback JSON payloads",
          mockPayload: JSON.stringify({
            customer: "Amelia Earhart",
            email: "amelia@flyhigh.org",
            comment: "The new navigation system is phenomenal! It makes flying at night so much easier.",
            category: "feature_request"
          }, null, 2)
        }
      },
      {
        id: "node-2",
        type: NodeType.GEMINI_AI,
        position: { x: 300, y: 150 },
        data: {
          name: "Verify & Score Sentiment",
          type: NodeType.GEMINI_AI,
          description: "Analyze sentiment from the feedback.",
          systemInstruction: "You are an automated lead classifier. Evaluate the sentiment of feedback. Always respond with a strictly formatted JSON object with keys 'rating' (1 to 5) and 'urgency' ('LOW', 'MED', 'HIGH').",
          prompt: "Analyze user feedback: {{customer}} ({{email}}) said: '{{comment}}'. Respond in raw JSON.",
          temperature: 0.2
        }
      },
      {
        id: "node-3",
        type: NodeType.CONDITIONAL,
        position: { x: 550, y: 150 },
        data: {
          name: "Sentiment Threshold Check",
          type: NodeType.CONDITIONAL,
          description: "Route workflow based on sentiment score rating.",
          propertyName: "rating",
          operator: "greater_than",
          comparisonValue: "3"
        }
      },
      {
        id: "node-4",
        type: NodeType.SLACK_SIMULATOR,
        position: { x: 800, y: 50 },
        data: {
          name: "Alert Slack (Positive)",
          type: NodeType.SLACK_SIMULATOR,
          description: "Celebrate premium feature praise on team Slack channel",
          channel: "product-success",
          messageTemplate: "🎉 Amazing Feedback! Rating: {{rating}}/5 from {{customer}} ({{email}}). System generated draft response completed."
        }
      },
      {
        id: "node-5",
        type: NodeType.GEMINI_AI,
        position: { x: 800, y: 250 },
        data: {
          name: "Draft Apology Reply",
          type: NodeType.GEMINI_AI,
          description: "Formulate custom reply addressing frustrations helper.",
          systemInstruction: "You are a customer loyalty representative. Write a detailed, deeply polite apologetic reply to a frustrated user.",
          prompt: "Write a short reply email to: {{customer}} ({{email}}) who is upset about our platform. Acknowledge frustration.",
          temperature: 0.7
        }
      },
      {
        id: "node-6",
        type: NodeType.CONSOLE_LOG,
        position: { x: 1050, y: 250 },
        data: {
          name: "Log Critical Draft",
          type: NodeType.CONSOLE_LOG,
          description: "Save remediation work item to operations log details",
          logTemplate: "Urgent issue logged. Ready to dispatch draft reply:\n{{text}}"
        }
      }
    ],
    connections: [
      { id: "conn-1", fromNodeId: "node-1", fromOutputHandle: "default", toNodeId: "node-2" },
      { id: "conn-2", fromNodeId: "node-2", fromOutputHandle: "default", toNodeId: "node-3" },
      { id: "conn-3", fromNodeId: "node-3", fromOutputHandle: "true", toNodeId: "node-4" },
      { id: "conn-4", fromNodeId: "node-3", fromOutputHandle: "false", toNodeId: "node-5" },
      { id: "conn-5", fromNodeId: "node-5", fromOutputHandle: "default", toNodeId: "node-6" }
    ]
  },
  {
    id: "lead-fetcher",
    name: "Hourly Smart Lead Qualification Sync",
    description: "Simulates a recurring Cron timer. Fetches high-value leads from database, qualifiers them using the Gemini model, and flags them.",
    nodes: [
      {
        id: "l-1",
        type: NodeType.INTERVAL_TRIGGER,
        position: { x: 100, y: 180 },
        data: {
          name: "Hourly Core Schedule",
          type: NodeType.INTERVAL_TRIGGER,
          description: "Interval scheduled run (ticks simulated timer)",
          seconds: 15
        }
      },
      {
        id: "l-2",
        type: NodeType.HTTP_REQUEST,
        position: { x: 350, y: 180 },
        data: {
          name: "Fetch Target Database",
          type: NodeType.HTTP_REQUEST,
          description: "Query lead pipeline CRM dataset from the Express mock server",
          url: "https://your-server/api/mock-db",
          method: "GET"
        }
      },
      {
        id: "l-3",
        type: NodeType.GEMINI_AI,
        position: { x: 600, y: 180 },
        data: {
          name: "Qualify with AI",
          type: NodeType.GEMINI_AI,
          description: "Rank pipeline leads and output strategic summary reports",
          systemInstruction: "Analyze corporate leads. Decide if value is a Tier-1 high value focus. Always write a summary of qualification status.",
          prompt: "Determine if this budget is hot lead: {{[0].name}} (Email: {{[0].email}}) has value: {{[0].value}}. Provide custom qualification reasons.",
          temperature: 0.1
        }
      },
      {
        id: "l-4",
        type: NodeType.CONSOLE_LOG,
        position: { x: 880, y: 180 },
        data: {
          name: "Write Sync Summary",
          type: NodeType.CONSOLE_LOG,
          description: "Log audit entries to analytics portal",
          logTemplate: "AI Qualified Sync Result Report:\n{{text}}"
        }
      }
    ],
    connections: [
      { id: "lc-1", fromNodeId: "l-1", fromOutputHandle: "default", toNodeId: "l-2" },
      { id: "lc-2", fromNodeId: "l-2", fromOutputHandle: "default", toNodeId: "l-3" },
      { id: "lc-3", fromNodeId: "l-3", fromOutputHandle: "default", toNodeId: "l-4" }
    ]
  }
];
