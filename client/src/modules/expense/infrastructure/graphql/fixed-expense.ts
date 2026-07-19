import { gql } from '@apollo/client';

export const GET_FIXED_EXPENSE_TEMPLATES = gql`
  query getFixedExpenseTemplates($contextId: ID) {
    getFixedExpenseTemplates(contextId: $contextId) {
      id
      name
      category
      amount
      isActive
      contextId
    }
  }
`;

export const GET_FIXED_EXPENSE_CHECKLIST = gql`
  query getFixedExpenseChecklist($billingMonth: String!, $contextId: ID) {
    getFixedExpenseChecklist(billingMonth: $billingMonth, contextId: $contextId) {
      fixedExpense {
        id
        name
        category
        amount
        isActive
        contextId
      }
      payment {
        id
        fixedExpenseId
        billingMonth
        isPaid
        amountPaid
        paidAt
        generatedExpenseId
      }
    }
  }
`;

export const CREATE_FIXED_EXPENSE_TEMPLATE = gql`
  mutation createFixedExpenseTemplate($input: CreateFixedExpenseTemplateInput!) {
    createFixedExpenseTemplate(input: $input) {
      id
      name
      category
      amount
      isActive
      contextId
    }
  }
`;

export const UPDATE_FIXED_EXPENSE_TEMPLATE = gql`
  mutation updateFixedExpenseTemplate($input: UpdateFixedExpenseTemplateInput!) {
    updateFixedExpenseTemplate(input: $input) {
      id
      name
      category
      amount
      isActive
      contextId
    }
  }
`;

export const DELETE_FIXED_EXPENSE_TEMPLATE = gql`
  mutation deleteFixedExpenseTemplate($id: ID!) {
    deleteFixedExpenseTemplate(id: $id)
  }
`;

export const PAY_FIXED_EXPENSE = gql`
  mutation payFixedExpense($input: PayFixedExpenseInput!) {
    payFixedExpense(input: $input) {
      id
      fixedExpenseId
      billingMonth
      isPaid
      amountPaid
      paidAt
      generatedExpenseId
    }
  }
`;

export const UNPAY_FIXED_EXPENSE = gql`
  mutation unpayFixedExpense($input: UnpayFixedExpenseInput!) {
    unpayFixedExpense(input: $input)
  }
`;
