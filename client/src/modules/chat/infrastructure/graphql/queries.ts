import { gql } from "@apollo/client";

export const GET_CHAT_SESSIONS = gql`
  query GetChatSessions {
    getChatSessions {
      id
      _id
      whatsappId
      status
      driftCount
      assignedUserId
      assignedAgentId
      contactName
      tags
      createdAt
      updatedAt
      extractedData {
        client {
          firstName
          lastName
          nationalId
          address
        }
        cart {
          productId
          productName
          quantity
          price
        }
      }
    }
  }
`;

export const GET_AGENTS = gql`
  query GetAgents {
    getAgents {
      id
      name
      systemPrompt
      status
      role
      enabledTools
    }
  }
`;