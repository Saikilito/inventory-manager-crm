import { gql } from '@apollo/client';

export const CREATE_EXPENSE = gql`
  mutation createExpense($input: CreateExpenseInput!) {
    createExpense(input: $input) {
      id
      _id
      amount
      description
      category
      contextId
      referenceId
      referenceType
      createdAt
      updatedAt
    }
  }
`;

export const UPDATE_EXPENSE = gql`
  mutation updateExpense($input: UpdateExpenseInput!) {
    updateExpense(input: $input) {
      id
      _id
      amount
      description
      category
      contextId
      referenceId
      referenceType
      createdAt
      updatedAt
    }
  }
`;

export const DELETE_EXPENSE = gql`
  mutation deleteExpense($id: ID!) {
    deleteExpense(_id: $id)
  }
`;
