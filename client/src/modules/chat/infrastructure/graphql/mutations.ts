import { gql } from "@apollo/client";

export const CREATE_AGENT = gql`
  mutation CreateAgent($input: CreateAgentInput!) {
    createAgent(input: $input) {
      id
      name
      systemPrompt
      status
      role
      enabledTools
    }
  }
`;

export const UPDATE_AGENT = gql`
  mutation UpdateAgent($input: UpdateAgentInput!) {
    updateAgent(input: $input) {
      id
      name
      systemPrompt
      status
      role
      enabledTools
    }
  }
`;

export const DELETE_AGENT = gql`
  mutation DeleteAgent($id: ID!) {
    deleteAgent(id: $id)
  }
`;

export const ASK_AGENT = gql`
  mutation AskAgent($agentId: ID!, $text: String!) {
    askAgent(agentId: $agentId, text: $text)
  }
`;

export const ASSIGN_AGENT_TO_SESSION_MODAL = gql`
  mutation AssignAgentToSessionModal($whatsappId: String!, $agentId: ID) {
    assignAgentToSession(whatsappId: $whatsappId, agentId: $agentId) {
      id
      whatsappId
      assignedAgentId
    }
  }
`;