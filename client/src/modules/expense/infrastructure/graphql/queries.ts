import { gql } from '@apollo/client';

export const GET_ALL_EXPENSES = gql`
  query getAllExpenses($limit: Int, $offset: Int, $contextId: ID, $category: ExpenseCategory) {
    getAllExpenses(limit: $limit, offset: $offset, contextId: $contextId, category: $category) {
      items {
        id
        _id
        amount
        description
        category
        contextId
        referenceId
        referenceType
        accountId
        account {
          id
          name
          currency
        }
        createdAt
        updatedAt
      }
      total
    }
  }
`;

export const GET_SINGLE_EXPENSE = gql`
  query getExpense($id: ID!) {
    getExpense(_id: $id) {
      id
      _id
      amount
      description
      category
      contextId
      referenceId
      referenceType
      accountId
      account {
        id
        _id
        name
        currency
      }
      createdAt
      updatedAt
    }
  }
`;
