import { faker } from "@faker-js/faker";
import UserModel from "../modules/user/infrastructure/user.model.js";
import ClientModel from "../modules/client/infrastructure/client.model.js";
import ProductModel from "../modules/product/infrastructure/product.model.js";
import OrderModel from "../modules/order/infrastructure/order.model.js";
import { calculateClientRatingTier, ClientRatingTier } from "../../../shared-domain/src/client/client.entity.js";
import { UserRole } from "../../../shared-domain/src/shared/value-objects/role.vo.js";

/**
 * Seed database with initial mock data for local testing.
 * Runs only if there are no clients or sellers in the database.
 */
export const seedDatabase = async (): Promise<void> => {
  try {
    // 1. Check if database already has sellers or clients
    const sellerCount = await UserModel.countDocuments({ role: UserRole.SELLER, isTesting: true });
    const clientCount = await ClientModel.countDocuments({ isTesting: true });

    if (sellerCount > 0 || clientCount > 0) {
      console.warn("🌱 [Seeder] Database already seeded. Skipping seeder.");
      return;
    }

    console.warn("🌱 [Seeder] Database is empty. Starting database seeding...");

    // 2. Ensure products exist to make orders
    let products: any[] = await ProductModel.find({ isTesting: true });
    if (products.length === 0) {
      console.warn("🌱 [Seeder] Seeding default products...");
      const productsToCreate = [
        { name: "Laptop Pro 15", price: 1299.99, stock: 50, isTesting: true },
        { name: "Mechanical Keyboard", price: 89.99, stock: 150, isTesting: true },
        { name: "Wireless Mouse", price: 49.99, stock: 200, isTesting: true },
        { name: "UltraWide Monitor 34", price: 449.99, stock: 35, isTesting: true },
        { name: "Noise Cancelling Headphones", price: 199.99, stock: 80, isTesting: true },
        { name: "USB-C Hub Multiport", price: 39.99, stock: 120, isTesting: true },
      ];
      products = await ProductModel.insertMany(productsToCreate);
      console.warn(`🌱 [Seeder] Seeded ${products.length} products.`);
    }

    // 3. Create 3 sellers
    console.warn("🌱 [Seeder] Seeding 3 sellers...");
    const sellersData = [];
    for (let i = 0; i < 3; i++) {
      const firstName = faker.person.firstName();
      const lastName = faker.person.lastName();
      const name = `${firstName} ${lastName}`;
      // Alphanumeric username without spaces
      const username = `${firstName.toLowerCase()}${lastName.toLowerCase()}`.replace(/[^a-z0-9]/g, "");
      const email = faker.internet.email({ firstName, lastName }).toLowerCase();

      sellersData.push({
        user: username,
        email,
        name,
        password: "password123", // Will be automatically hashed by pre-save hook in UserModel
        role: UserRole.SELLER,
        isTesting: true,
      });
    }
    const sellers = await UserModel.insertMany(sellersData);
    console.warn(`🌱 [Seeder] Seeded ${sellers.length} sellers successfully.`);

    // 4. Create 5 clients
    console.warn("🌱 [Seeder] Seeding 5 clients...");
    const clientsData = [];
    for (let i = 0; i < 5; i++) {
      const firstName = faker.person.firstName();
      const lastName = faker.person.lastName();
      // Round-robin assignment of sellers to clients
      const seller = sellers[i % sellers.length];

      clientsData.push({
        firstName,
        lastName,
        address: faker.location.streetAddress(),
        whatsapp: faker.phone.number().replace(/[^0-9+]/g, ""), // Ensure valid phone/whatsapp pattern
        age: faker.number.int({ min: 18, max: 75 }),
        type: ClientRatingTier.BASIC, // Default initial tier; will be recalculated below
        orders: [],
        sellerId: seller._id,
        isTesting: true,
      });
    }
    const clients = await ClientModel.insertMany(clientsData);
    console.warn(`🌱 [Seeder] Seeded ${clients.length} clients successfully.`);

    // 5. Create 3 orders for each client
    console.warn("🌱 [Seeder] Seeding orders for each client...");
    for (const client of clients) {
      const clientOrdersIds: string[] = [];
      let completedOrdersCount = 0;

      for (let o = 0; o < 3; o++) {
        // Pick 1-3 random products for the order
        const numItems = faker.number.int({ min: 1, max: 3 });
        const orderItems = [];
        let orderTotal = 0;

        // Shuffle products to select unique random items
        const shuffledProducts = [...products].sort(() => 0.5 - Math.random());
        const selectedProducts = shuffledProducts.slice(0, numItems);

        for (const product of selectedProducts) {
          const quantity = faker.number.int({ min: 1, max: 3 });
          orderItems.push({
            productId: product._id,
            quantity,
          });
          orderTotal += product.price * quantity;
        }

        // Random status: PENDING, COMPLETED, CANCELLED
        const statuses = ["PENDING", "COMPLETED", "CANCELLED"] as const;
        // Ensure some completed orders for rating calculation
        const status = o === 0 ? "COMPLETED" : faker.helpers.arrayElement(statuses);

        if (status === "COMPLETED") {
          completedOrdersCount++;
        }

        const newOrder = new OrderModel({
          items: orderItems,
          total: parseFloat(orderTotal.toFixed(2)),
          clientId: client._id,
          status,
          sellerId: client.sellerId,
          isTesting: true,
        });

        await newOrder.save();
        clientOrdersIds.push(newOrder._id.toString());
      }

      // 6. Recalculate client's rating tier and update fields
      client.orders = clientOrdersIds as any;
      client.type = calculateClientRatingTier(completedOrdersCount) as any;
      await client.save();
    }

    console.warn("🌱 [Seeder] Seeding finished! All test data generated successfully.");
  } catch (error) {
    console.error("❌ [Seeder] Seeding failed with error:", error);
  }
};
