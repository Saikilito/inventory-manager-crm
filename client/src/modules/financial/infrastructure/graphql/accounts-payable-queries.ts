import { gql } from "@apollo/client";

export const GET_ACCOUNTS_PAYABLES = gql`
  query getAccountsPayables($status: String, $supplierName: String, $contextId: ID) {
    accountsPayables(status: $status, supplierName: $supplierName, contextId: $contextId) {
      id
      stockLotId
      supplier
      totalAmount
      remainingBalance
      payments {
        id
        amount
        accountId
        transactionId
        expenseId
        paidAt
      }
      status
      contextId
      createdAt
      updatedAt
    }
  }
`;

export const GET_ACCOUNTS_PAYABLE = gql`
  query getAccountsPayable($id: ID!) {
    accountsPayable(id: $id) {
      id
      stockLotId
      supplier
      totalAmount
      remainingBalance
      payments {
        id
        amount
        accountId
        transactionId
        expenseId
        paidAt
      }
      status
      contextId
      createdAt
      updatedAt
    }
  }
`;
