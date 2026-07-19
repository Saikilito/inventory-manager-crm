import { Message, Contact } from "./types";

export const INITIAL_CONTACTS: Contact[] = [
  {
    id: "1",
    name: "Inventory Assistant",
    company: "Stock & Catalog Module",
    avatar: "AI",
    lastMessage: "Assistant ready to optimize your inventory.",
    time: "14:30",
    unreadCount: 0,
    tier: "Gold",
    phone: "+54 11 AI-COPILOT",
    email: "copilot.inventory@crm.com",
    avgOrderValue: "$18,500 USD",
    totalAggregated: "$148,000 USD",
    notes:
      "Assistant specialized in stock optimization, automatic replenishment, and product analysis.",
    online: true,
    purchases: [],
  },
  {
    id: "2",
    name: "Sales Analyst",
    company: "Business & Billing Module",
    avatar: "AV",
    lastMessage: "Revenue analysis and demand prediction.",
    time: "11:15",
    unreadCount: 0,
    tier: "Gold",
    phone: "+54 11 AI-ANALYST",
    email: "copilot.sales@crm.com",
    avgOrderValue: "$32,000 USD",
    totalAggregated: "$320,000 USD",
    notes:
      "Specialist in sales projection, identifying top clients, and commercial trends.",
    online: true,
    purchases: [],
  },
  {
    id: "3",
    name: "System Auditor",
    company: "Security & Logs Module",
    avatar: "AS",
    lastMessage: "Audit of actions and system integrity.",
    time: "Yesterday",
    unreadCount: 0,
    tier: "Basic",
    phone: "+54 11 AI-AUDITOR",
    email: "copilot.security@crm.com",
    avgOrderValue: "$8,200 USD",
    totalAggregated: "$41,000 USD",
    notes:
      "Proactively monitors unauthorized access, server logs, and database performance.",
    online: false,
    purchases: [],
  },
];

export const INITIAL_MESSAGES: Record<string, Message[]> = {
  "1": [
    {
      id: "1_1",
      text: "Hello! I am your Inventory Copilot. I can analyze stock levels, alert you about stockouts, and suggest replenishment purchases.",
      sender: "client",
      time: "14:30",
    },
    {
      id: "1_2",
      text: "Hello, what is the general state of the inventory?",
      sender: "agent",
      time: "14:31",
    },
    {
      id: "1_3",
      text: "The general inventory is stable, but we have some critical stock alerts for construction materials. Here is a photo of the cement warehouse:",
      sender: "client",
      time: "14:32",
      image:
        "https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?auto=format&fit=crop&w=600&q=80",
    },
    {
      id: "1_4",
      text: "",
      sender: "client",
      time: "14:33",
      sticker: "brain",
    },
    {
      id: "1_5",
      text: "",
      sender: "agent",
      time: "14:35",
      audio: { name: "Cement_Order_Inquiry.mp3", duration: "0:14" },
    },
  ],
  "2": [
    {
      id: "2_1",
      text: "Hello, I am your Sales Analyst. Shall we analyze the monthly revenue or the performance of the sales representatives?",
      sender: "client",
      time: "11:15",
    },
    {
      id: "2_2",
      text: "How are the accumulated sales looking?",
      sender: "agent",
      time: "11:20",
    },
    {
      id: "2_3",
      text: "This month's total is $328,500 USD, led by Construcciones Perez. A 14% increase compared to the previous month!",
      sender: "client",
      time: "11:22",
    },
    {
      id: "2_4",
      text: "Here is the summary report of the monthly growth:",
      sender: "client",
      time: "11:23",
      image:
        "https://images.unsplash.com/photo-1460925895917-afdab827c52f?auto=format&fit=crop&w=600&q=80",
    },
    {
      id: "2_5",
      text: "Excellent performance!",
      sender: "agent",
      time: "11:25",
      sticker: "rocket",
    },
  ],
  "3": [
    {
      id: "3_1",
      text: "Audit Assistant active. Monitoring logs, access, and data integrity in real-time.",
      sender: "client",
      time: "Yesterday",
    },
    {
      id: "3_2",
      text: "Any security issues detected?",
      sender: "agent",
      time: "Yesterday",
    },
    {
      id: "3_3",
      text: "All systems operational. The Node server is responding on port 4555 and the MongoDB connection is secure.",
      sender: "client",
      time: "Yesterday",
    },
    {
      id: "3_4",
      text: "Everything securely verified. I leave you the voice note of the access report:",
      sender: "client",
      time: "Yesterday",
      audio: { name: "Secure_Audit_Report.mp3", duration: "0:42" },
    },
  ],
};
