export default {
  Query: {
    topClients: async (parents, args, { models: { Order } }) => {
      try {
        const totalOrder = await Order.aggregate([
          {
            $match: { estado: "COMPLETADO" },
          },
          {
            $group: {
              _id: "$cliente",
              total: { $sum: "$total" },
            },
          },
          {
            $lookup: {
              from: "clients",
              localField: "_id",
              foreignField: "_id",
              as: "client",
            },
          },
          {
            $sort: { total: -1 },
          },
          {
            $limit: 10,
          },
        ]);
        return totalOrder;
      } catch (err) {
        console.error("topClients error:", err);
        return [];
      }
    },
    topSellers: async (parents, args, { models: { Order } }) => {
      try {
        const totalOrder = await Order.aggregate([
          {
            $match: { estado: "COMPLETADO" },
          },
          {
            $group: {
              _id: "$sellerID",
              total: { $sum: "$total" },
            },
          },
          {
            $lookup: {
              from: "users",
              localField: "_id",
              foreignField: "_id",
              as: "seller",
            },
          },
          {
            $sort: { total: -1 },
          },
          {
            $limit: 10,
          },
        ]);

        return totalOrder;
      } catch (err) {
        console.error("topSellers error:", err);
        return [];
      }
    },
  },
};
