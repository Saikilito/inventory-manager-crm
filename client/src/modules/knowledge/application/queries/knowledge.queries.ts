import { gql } from '@apollo/client';

export const KNOWLEDGE_LIST_QUERY = gql`
  query KnowledgeList($page: Int, $limit: Int, $category: KnowledgeCategory, $isActive: Boolean, $status: KnowledgeStatus) {
    knowledgeList(page: $page, limit: $limit, category: $category, isActive: $isActive, status: $status) {
      items {
        _id
        category
        title
        content
        wikiLinks {
          title
          url
        }
        metadata {
          hierarchyLevel
          tags
          createdBy
          updatedBy
          lastVerified
          productId
        }
        status
        isActive
        createdAt
        updatedAt
      }
      total
      page
      limit
      pages
    }
  }
`;

export const KNOWLEDGE_DETAIL_QUERY = gql`
  query KnowledgeDetail($_id: ID!) {
    knowledge(_id: $_id) {
      _id
      category
      title
      content
      wikiLinks {
        title
        url
      }
      metadata {
        hierarchyLevel
        tags
        createdBy
        updatedBy
        lastVerified
        productId
      }
      status
      isActive
      createdAt
      updatedAt
    }
  }
`;

export const CREATE_KNOWLEDGE = gql`
  mutation CreateKnowledge($input: CreateKnowledgeInput!) {
    createKnowledge(input: $input) {
      _id
      category
      title
      content
      metadata {
        hierarchyLevel
        tags
      }
    }
  }
`;

export const UPDATE_KNOWLEDGE = gql`
  mutation UpdateKnowledge($input: UpdateKnowledgeInput!) {
    updateKnowledge(input: $input)
  }
`;

export const DELETE_KNOWLEDGE = gql`
  mutation DeleteKnowledge($_id: ID!) {
    deleteKnowledge(_id: $_id)
  }
`;

export const KNOWLEDGE_PENDING_QUERY = gql`
  query KnowledgePending($status: KnowledgeStatus) {
    knowledgePending(status: $status) {
      _id
      category
      title
      content
      wikiLinks {
        title
        url
      }
      metadata {
        hierarchyLevel
        tags
        createdBy
        updatedBy
        productId
      }
      status
      isActive
      createdAt
      updatedAt
    }
  }
`;

export const KNOWLEDGE_GRAPH_QUERY_NAME = 'KnowledgeGraph';

export const KNOWLEDGE_GRAPH_QUERY = gql`
  query ${KNOWLEDGE_GRAPH_QUERY_NAME}($status: KnowledgeStatus, $includeDrafts: Boolean) {
    knowledgeGraph(status: $status, includeDrafts: $includeDrafts) {
      nodes {
        id
        title
        category
        status
        hierarchyLevel
        content
        tags
      }
      edges {
        sourceId
        targetTitle
        targetId
        resolved
      }
    }
  }
`;

export const KNOWLEDGE_APPROVE = gql`
  mutation KnowledgeApprove($_id: ID!) {
    knowledgeApprove(_id: $_id) {
      _id
      status
      isActive
    }
  }
`;

export const KNOWLEDGE_REJECT = gql`
  mutation KnowledgeReject($_id: ID!) {
    knowledgeReject(_id: $_id) {
      _id
      status
      isActive
    }
  }
`;

export const KNOWLEDGE_ENRICH = gql`
  mutation KnowledgeEnrich($_id: ID!) {
    knowledgeEnrich(_id: $_id) {
      _id
      content
      wikiLinks {
        title
        url
      }
    }
  }
`;
