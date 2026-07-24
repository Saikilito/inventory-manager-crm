import { gql } from '@apollo/client';

export const GET_FINANCIAL_DAY_BY_DATE = gql`
  query getFinancialDayByDate($date: String) {
    getFinancialDayByDate(date: $date) {
      financialDay {
        id
        date
        status
        openingBalances {
          accountId
          balance
        }
        closingBalances {
          accountId
          balance
        }
        openedAt
        closedAt
      }
      exchangeRate
    }
  }
`;

export const GET_ACCOUNTS = gql`
  query getAccounts {
    getAccounts {
      id
      name
      currency
      balance
    }
  }
`;

export const GET_TRANSACTIONS = gql`
  query getTransactions($accountId: ID!) {
    getTransactions(accountId: $accountId) {
      id
      accountId
      type
      amount
      currency
      description
      date
      financialDayId
      source
      sourceReferenceId
      createdAt
    }
  }
`;
