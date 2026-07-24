import { gql } from '@apollo/client';

export const CREATE_ACCOUNT = gql`
  mutation createAccount($name: String!, $currency: String!, $balance: Float) {
    createAccount(name: $name, currency: $currency, balance: $balance) {
      id
      name
      currency
      balance
    }
  }
`;

export const CREATE_TRANSACTION = gql`
  mutation createTransaction(
    $accountId: ID!
    $type: String!
    $amount: Float!
    $description: String!
    $date: String
    $source: TransactionSource
    $sourceReferenceId: ID
  ) {
    createTransaction(
      accountId: $accountId
      type: $type
      amount: $amount
      description: $description
      date: $date
      source: $source
      sourceReferenceId: $sourceReferenceId
    ) {
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

export const UPDATE_EXCHANGE_RATE = gql`
  mutation updateExchangeRate($date: String, $rate: Float!) {
    updateExchangeRate(date: $date, rate: $rate) {
      id
      date
      rate
    }
  }
`;

export const OPEN_FINANCIAL_DAY = gql`
  mutation openFinancialDay($date: String) {
    openFinancialDay(date: $date) {
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
  }
`;

export const CLOSE_FINANCIAL_DAY = gql`
  mutation closeFinancialDay($date: String) {
    closeFinancialDay(date: $date) {
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
  }
`;

export const TRANSFER_FUNDS = gql`
  mutation transferFunds(
    $sourceAccountId: ID!
    $targetAccountId: ID!
    $amount: Float!
    $targetAmount: Float
    $exchangeRate: Float
    $description: String
    $date: String
  ) {
    transferFunds(
      sourceAccountId: $sourceAccountId
      targetAccountId: $targetAccountId
      amount: $amount
      targetAmount: $targetAmount
      exchangeRate: $exchangeRate
      description: $description
      date: $date
    )
  }
`;

export const DELETE_TRANSACTION = gql`
  mutation deleteTransaction($id: ID!) {
    deleteTransaction(id: $id)
  }
`;
