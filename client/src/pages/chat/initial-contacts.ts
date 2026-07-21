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
    age: 1,
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
    age: 1,
    phone: "+54 11 AI-ANALYST",
    email: "copilot.sales@crm.com",
    avgOrderValue: "$32,000 USD",
    totalAggregated: "$320,000 USD",
    notes:
      "Specialist in sales projection, identifying top clients, and commercial trends.",
    online: true,
    purchases: [],
  },
];

export const INITIAL_MESSAGES: Record<string, Message[]> = {
  "1": [],
  "2": [],
};
