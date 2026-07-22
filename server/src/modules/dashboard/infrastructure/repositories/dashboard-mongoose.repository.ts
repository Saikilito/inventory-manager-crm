import { IDashboardRepository, ITopClient, ITopSeller } from '../../application/repositories/dashboard.repository.js';
import { Result } from '../../../../../../shared-domain/src/shared/result.js';
import OrderModel from '../../../order/infrastructure/order.model.js';
import { OrderStatus, PaymentStatus } from '../../../../../../shared-domain/src/order/order.entity.js';

export const makeDashboardMongooseRepository = (): IDashboardRepository => {
  return {
    async getTopClients(): Promise<Result<ITopClient[], Error>> {
      try {
        const totalOrder = await OrderModel.aggregate([
          {
            $match: { 
              status: { $ne: OrderStatus.CANCELLED },
              paymentStatus: PaymentStatus.PAID
            },
          },
          {
            $group: {
              _id: '$clientId',
              total: { $sum: '$total' },
            },
          },
          {
            $lookup: {
              from: 'clients',
              localField: '_id',
              foreignField: '_id',
              as: 'client',
            },
          },
          {
            $sort: { total: -1 },
          },
          {
            $limit: 10,
          },
        ]);
        return Result.ok<ITopClient[], Error>(totalOrder as ITopClient[]);
      } catch (err) {
        return Result.fail<ITopClient[], Error>(err as Error);
      }
    },

    async getTopSellers(): Promise<Result<ITopSeller[], Error>> {
      try {
        const totalOrder = await OrderModel.aggregate([
          {
            $match: { 
              status: { $ne: OrderStatus.CANCELLED },
              paymentStatus: PaymentStatus.PAID
            },
          },
          {
            $group: {
              _id: '$sellerId',
              total: { $sum: '$total' },
            },
          },
          {
            $lookup: {
              from: 'users',
              localField: '_id',
              foreignField: '_id',
              as: 'seller',
            },
          },
          {
            $sort: { total: -1 },
          },
          {
            $limit: 10,
          },
        ]);
        return Result.ok<ITopSeller[], Error>(totalOrder as ITopSeller[]);
      } catch (err) {
        return Result.fail<ITopSeller[], Error>(err as Error);
      }
    }
  };
};
