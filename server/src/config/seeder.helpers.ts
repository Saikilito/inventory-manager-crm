import { faker } from "@faker-js/faker";
import UserModel from "../modules/user/infrastructure/user.model.js";
import ClientModel from "../modules/client/infrastructure/client.model.js";
import ProductModel from "../modules/product/infrastructure/product.model.js";
import OrderModel from "../modules/order/infrastructure/order.model.js";
import ContextModel from "../modules/context/infrastructure/context.model.js";
import DeliveryModel, {
  DeliveryCapacityModel,
} from "../modules/delivery/infrastructure/delivery.model.js";
import RentalModel from "../modules/rental/infrastructure/rental.model.js";
import {
  calculateClientRatingTier,
  ClientRatingTier,
  ClientRatingTierVO,
} from "../../../shared-domain/src/client/client.entity.js";
import { UserRole } from "../../../shared-domain/src/shared/value-objects/role.vo.js";
import { DateTimeVO } from "../../../shared-domain/src/shared/value-objects/date-time.vo.js";
import { IdVO } from "../../../shared-domain/src/shared/value-objects/id.vo.js";
import { OrderStatus, PaymentStatus } from "../../../shared-domain/src/order/order-status.js";
import { DeliveryStatus } from "../../../shared-domain/src/delivery/delivery-status.js";
import {
  buildProductsData,
  buildSellersData,
  buildClientsData,
  targetDates,
} from "./seeder.data.js";

export const cleanDatabase = async () => {
  await UserModel.deleteMany({
    $or: [{ role: UserRole.SELLER }, { user: "admin" }],
  });
  await ClientModel.deleteMany({});
  await ProductModel.deleteMany({});
  await OrderModel.deleteMany({});
  await ContextModel.deleteMany({});
  await DeliveryModel.deleteMany({});
  await DeliveryCapacityModel.deleteMany({});
  await RentalModel.deleteMany({});
};

export const seedContexts = async () => {
  console.warn("🌱 [Seeder] Seeding inventory contexts...");
  const motoContext = new ContextModel({
    name: "Repuesto de motos",
    attributes: [
      { name: "motoBrand", type: "STRING", required: true },
      { name: "partBrand", type: "STRING", required: false },
    ],
  });
  const techContext = new ContextModel({
    name: "Tecnología y accesorios",
    attributes: [
      { name: "category", type: "STRING", required: true },
      { name: "connectorType", type: "STRING", required: false },
    ],
  });
  const waterContext = new ContextModel({
    name: "Distribución de Agua",
    attributes: [{ name: "purityLevel", type: "STRING", required: true }],
  });
  const rentalContext = new ContextModel({
    name: "Alquiler de Equipos",
    attributes: [
      { name: "powerRating", type: "STRING", required: true },
      { name: "voltage", type: "STRING", required: false },
    ],
  });

  await Promise.all([
    motoContext.save(),
    techContext.save(),
    waterContext.save(),
    rentalContext.save(),
  ]);

  return { motoContext, techContext, waterContext, rentalContext };
};

export const seedProducts = async (contexts: {
  motoContext: { _id: unknown };
  techContext: { _id: unknown };
  waterContext: { _id: unknown };
  rentalContext: { _id: unknown };
}) => {
  console.warn("🌱 [Seeder] Seeding advanced products...");
  const productsToCreate = buildProductsData({
    moto: contexts.motoContext,
    tech: contexts.techContext,
    water: contexts.waterContext,
    rental: contexts.rentalContext,
  });
  const products = await ProductModel.insertMany(productsToCreate);
  console.warn(
    `🌱 [Seeder] Seeded ${products.length} products successfully.`,
  );
  return products;
};

export const seedUsers = async () => {
  console.warn("🌱 [Seeder] Seeding 1 Admin and 3 sellers...");
  const sellersData = buildSellersData();
  const sellers = await UserModel.create(sellersData);
  console.warn(
    `🌱 [Seeder] Seeded ${sellers.length} users successfully (1 Admin, 3 Sellers).`,
  );
  return sellers;
};

export const seedClients = async (
  sellers: Array<{ _id: unknown }>,
) => {
  console.warn("🌱 [Seeder] Seeding 5 clients...");
  const clientsData = buildClientsData(sellers);
  const clients = await ClientModel.insertMany(clientsData);
  console.warn(`🌱 [Seeder] Seeded ${clients.length} clients successfully.`);
  return clients;
};

export const seedOrders = async (
  clients: Array<{
    _id: unknown;
    sellerId: unknown;
    orders: unknown[];
    type: unknown;
    save: () => Promise<void>;
  }>,
  products: Array<{
    _id: unknown;
    contextId?: { toString(): string };
    unitOfMeasure: string;
    purchasePrice?: number;
    price: number;
    sellingPrice?: number;
  }>,
  rentalContextId: { toString(): string },
) => {
  console.warn(
    "🌱 [Seeder] Seeding chronological order history over 18 months...",
  );
  const seededOrders = [];

  for (const client of clients) {
    const clientOrdersIds: string[] = [];
    let completedOrdersCount = 0;

    const numOrders = faker.number.int({ min: 4, max: 7 });
    const clientDates = [...targetDates]
      .sort(() => 0.5 - Math.random())
      .slice(0, numOrders);

    for (let o = 0; o < clientDates.length; o++) {
      const orderDate = clientDates[o];

      const saleableProducts = products.filter(
        (p) => p.contextId?.toString() !== rentalContextId.toString(),
      );
      const numItems = faker.number.int({ min: 1, max: 3 });
      const orderItems = [];
      let orderTotal = 0;

      const shuffledProducts = [...saleableProducts].sort(
        () => 0.5 - Math.random(),
      );
      const selectedProducts = shuffledProducts.slice(0, numItems);

      for (const product of selectedProducts) {
        const isFractional =
          product.unitOfMeasure === "LITER" ||
          product.unitOfMeasure === "KILOGRAM" ||
          product.unitOfMeasure === "METER";
        const quantity = isFractional
          ? parseFloat(
              faker.number
                .float({ min: 0.5, max: 2.5, fractionDigits: 2 })
                .toFixed(2),
            )
          : faker.number.int({ min: 1, max: 2 });

        const purchasePriceAtSale =
          product.purchasePrice || product.price * 0.6;
        const sellingPriceAtSale = product.sellingPrice || product.price;

        orderItems.push({
          productId: product._id,
          quantity,
          purchasePriceAtSale,
          sellingPriceAtSale,
        });
        orderTotal += sellingPriceAtSale * quantity;
      }

      const statuses = [OrderStatus.PENDING, OrderStatus.COMPLETED, OrderStatus.ACTIVE, OrderStatus.CANCELLED];
      const status = o === 0 ? OrderStatus.COMPLETED : faker.helpers.arrayElement(statuses);
      const paymentStatus = status === OrderStatus.COMPLETED ? PaymentStatus.PAID : PaymentStatus.PENDING;

      if (status === OrderStatus.COMPLETED) {
        completedOrdersCount++;
      }

      const localCaracasDate = DateTimeVO.create(orderDate);

      const newOrder = new OrderModel({
        items: orderItems,
        total: parseFloat(orderTotal.toFixed(2)),
        clientId: client._id,
        status,
        paymentStatus,
        sellerId: client.sellerId,
        createdAt: new Date(localCaracasDate as string),
        isTesting: true,
      });

      await newOrder.save();
      seededOrders.push(newOrder);
      clientOrdersIds.push(newOrder._id.toString());
    }

    client.orders = clientOrdersIds.map((id) => IdVO.create(id));
    client.type = ClientRatingTierVO.create(
      calculateClientRatingTier(completedOrdersCount),
    );
    await client.save();
  }
  console.warn(
    `🌱 [Seeder] Seeded ${seededOrders.length} chronological orders successfully.`,
  );
  return seededOrders;
};

export const seedDeliveries = async (
  seededOrders: Array<{ _id: unknown; status: string }>,
) => {
  console.warn("🌱 [Seeder] Seeding scheduled bookings...");

  const pendingOrders = seededOrders.filter((o) => o.status === OrderStatus.PENDING);
  const deliveryPromises = [];

  for (let i = 0; i < Math.min(pendingOrders.length, 4); i++) {
    const order = pendingOrders[i];
    const targetDate = new Date();
    targetDate.setDate(targetDate.getDate() + (i + 1));
    const localCaracasDate = DateTimeVO.create(targetDate);

    deliveryPromises.push(
      new DeliveryModel({
        orderId: order._id,
        scheduledDate: localCaracasDate,
        deliveryTime: i % 2 === 0 ? "10:00 AM" : "03:30 PM",
        address: faker.location.streetAddress(),
        status: DeliveryStatus.PENDING,
        notes: "Dejar en caseta de seguridad. Recibir bidones vacíos.",
        isTesting: true,
      }).save(),
    );
  }
  await Promise.all(deliveryPromises);
  console.warn(
    `🌱 [Seeder] Pre-scheduled ${Math.min(pendingOrders.length, 4)} deliveries linked to orders.`,
  );
};

export const seedRentals = async (
  products: Array<{ _id: unknown; name: string }>,
  seededOrders: Array<{ _id: unknown }>,
) => {
  console.warn(
    "🌱 [Seeder] Seeding active time-based Rental reservations...",
  );
  const rotomartillo = products.find((p) => p.name.includes("Rotomartillo"));
  const generador = products.find((p) => p.name.includes("Generador"));

  if (!rotomartillo || !generador) return;

  const rental1StartDate = new Date();
  rental1StartDate.setHours(9, 0, 0, 0);
  const rental1EndDate = new Date();
  rental1EndDate.setHours(15, 0, 0, 0);

  const rental2StartDate = new Date();
  rental2StartDate.setDate(rental2StartDate.getDate() + 1);
  rental2StartDate.setHours(8, 0, 0, 0);
  const rental2EndDate = new Date();
  rental2EndDate.setDate(rental2EndDate.getDate() + 1);
  rental2EndDate.setHours(12, 0, 0, 0);

  const rentalReservations = [
    {
      productId: rotomartillo._id,
      orderId: seededOrders[0]._id,
      startDateTime: DateTimeVO.create(rental1StartDate),
      endDateTime: DateTimeVO.create(rental1EndDate),
      quantity: 1,
      status: "ACTIVE",
      isTesting: true,
    },
    {
      productId: generador._id,
      orderId: seededOrders[1]._id,
      startDateTime: DateTimeVO.create(rental2StartDate),
      endDateTime: DateTimeVO.create(rental2EndDate),
      quantity: 1,
      status: "RESERVED",
      isTesting: true,
    },
  ];

  await RentalModel.insertMany(rentalReservations);
  console.warn("🌱 [Seeder] Seeded active tool rental reservations.");
};
