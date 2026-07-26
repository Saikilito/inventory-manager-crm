import { gql } from "@apollo/client";

export const PAY_ACCOUNTS_PAYABLE = gql`
  mutation payAccountsPayable($accountsPayableId: ID!, $amount: Float!, $accountId: ID!) {
    payAccountsPayable(accountsPayableId: $accountsPayableId, amount: $amount, accountId: $accountId) {
      accountsPayable {
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
      transactionId
      expenseId
    }
  }
`;
