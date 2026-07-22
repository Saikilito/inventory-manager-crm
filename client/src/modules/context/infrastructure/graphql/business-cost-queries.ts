import { gql } from '@apollo/client';

export const GET_BUSINESS_COST_METRICS = gql`
  query getBusinessCostMetrics($contextId: ID, $referenceDate: String) {
    getBusinessCostMetrics(contextId: $contextId, referenceDate: $referenceDate) {
      daily {
        period
        totalExpenses
        daysInPeriod
        costPerDay
        newClients
        customerAcquisitionCost
      }
      weekly {
        period
        totalExpenses
        daysInPeriod
        costPerDay
        newClients
        customerAcquisitionCost
      }
      monthly {
        period
        totalExpenses
        daysInPeriod
        costPerDay
        newClients
        customerAcquisitionCost
      }
      averageCostPerDay
      overallCac
    }
  }
`;
