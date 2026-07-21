import { gql } from '@apollo/client';

export const PRODUCTS_QUERY = gql`
  query getProducts($limit: Int, $offset: Int, $contextId: ID) {
    getAllProducts(limit: $limit, offset: $offset, contextId: $contextId) {
      _id
      name
      price
      purchasePrice
      sellingPrice
      profit
      profitMargin
      stock
      stockValue
      potentialProfit
      contextId
    }
    totalProducts
  }
`;

export const PRODUCT_STATS_QUERY = gql`
  query getProductStats($contextId: ID) {
    productStats(contextId: $contextId) {
      totalProducts
      totalStock
      totalStockValue
      totalPotentialProfit
      averageMargin
    }
  }
`;

export const SINGLE_PRODUCT_QUERY = gql`
  query getProduct($id: ID!) {
    getProduct(_id: $id) {
      _id
      name
      price
      purchasePrice
      sellingPrice
      profit
      profitMargin
      stock
      stockValue
      potentialProfit
      contextId
    }
  }
`;

export const GET_ALL_CONTEXTS = gql`
  query getAllContexts {
    getAllContexts {
      _id
      name
    }
  }
`;

export const GET_CONTEXT_METRICS = gql`
  query getContextMetrics($contextId: ID, $period: String, $startDate: String, $endDate: String) {
    getContextMetrics(contextId: $contextId, period: $period, startDate: $startDate, endDate: $endDate) {
      totalStock
      investedCapital
      potentialRevenue
      projectedGrossMargin
      totalExpenses
      netProfit
      totalRevenue
      totalCOGS
      revenueTrend
      profitTrend
      expenseTrend
      favoriteAccountName
      topSellers {
        productId
        productName
        quantitySold
        revenue
        profit
      }
      accountDistribution {
        accountId
        accountName
        currency
        totalReceivedUsd
        percentage
      }
      periods {
        daily {
          period
          revenue
          profit
          salesCount
        }
        weekly {
          period
          revenue
          profit
          salesCount
        }
        monthly {
          period
          revenue
          profit
          salesCount
        }
      }
    }
  }
`;

export const GET_CONTEXT_REPORT = gql`
  query getContextReport($contextId: ID, $periodType: String!) {
    getContextReport(contextId: $contextId, periodType: $periodType)
  }
`;
