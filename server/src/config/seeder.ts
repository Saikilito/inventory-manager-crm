import {
  cleanDatabase,
  seedContexts,
  seedProducts,
  seedUsers,
  seedClients,
  seedOrders,
  seedDeliveries,
  seedRentals,
} from "./seeder.helpers.js";

/**
 * Seed database with initial mock data for local testing.
 * Runs only if there are no clients or sellers in the database.
 */
export const seedDatabase = async (): Promise<void> => {
  try {
    console.warn(
      "🌱 [Seeder] Starting force-seeding. Cleaning up old test data first...",
    );

    await cleanDatabase();

    console.warn(
      "🌱 [Seeder] Database cleaned successfully. Starting seeding...",
    );

    const contexts = await seedContexts();
    const products = await seedProducts(contexts);
    const sellers = await seedUsers();
    const clients = await seedClients(sellers);
    const seededOrders = await seedOrders(
      clients,
      products,
      contexts.rentalContext._id,
    );
    await seedDeliveries(seededOrders);
    await seedRentals(products, seededOrders);

    console.warn(
      "🌱 [Seeder] Seeding finished! All test data generated successfully.",
    );
  } catch (error) {
    console.error("❌ [Seeder] Seeding failed with error:", error);
  }
};
