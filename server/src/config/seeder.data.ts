import { faker } from "@faker-js/faker";
import { UserRole } from "../../../shared-domain/src/shared/value-objects/role.vo.js";

export const buildProductsData = (contexts: {
  moto: { _id: unknown };
  tech: { _id: unknown };
  water: { _id: unknown };
  rental: { _id: unknown };
}) => [
  {
    name: "Agua Purificada (Suelto/Granel)",
    price: 0.05,
    purchasePrice: 0.02,
    sellingPrice: 0.05,
    stock: 4200.0,
    unitOfMeasure: "LITER",
    contextId: contexts.water._id,
    customAttributes: { purityLevel: "Premium Triple Filtrado" },
    presentation: {
      packagingType: "BULK",
      contentSize: 1,
      contentUom: "LITER",
    },
    isTesting: true,
  },
  {
    name: "Bidón de Agua Cerrado 20L",
    price: 3.5,
    purchasePrice: 1.2,
    sellingPrice: 3.5,
    stock: 12,
    unitOfMeasure: "UNIT",
    contextId: contexts.water._id,
    customAttributes: { purityLevel: "Premium Triple Filtrado" },
    presentation: {
      packagingType: "DRUM",
      contentSize: 20,
      contentUom: "LITER",
    },
    isTesting: true,
  },
  {
    name: "Aceite de Motor Motul 4T 1L",
    price: 14.99,
    purchasePrice: 8.5,
    sellingPrice: 14.99,
    stock: 45,
    unitOfMeasure: "UNIT",
    contextId: contexts.moto._id,
    customAttributes: { motoBrand: "Universal", partBrand: "Motul" },
    presentation: {
      packagingType: "BOTTLE",
      contentSize: 1,
      contentUom: "LITER",
    },
    isTesting: true,
  },
  {
    name: "Guaya de Embrague de Moto (Unidad)",
    price: 6.5,
    purchasePrice: 2.5,
    sellingPrice: 6.5,
    stock: 45,
    unitOfMeasure: "UNIT",
    contextId: contexts.moto._id,
    customAttributes: {
      motoBrand: "Honda / Yamaha",
      partBrand: "Original-OEM",
    },
    presentation: {
      packagingType: "BOX",
      contentSize: 1,
      contentUom: "UNIT",
    },
    isTesting: true,
  },
  {
    name: "Manguera de Frenos Blindada (Metro suelto)",
    price: 12.0,
    purchasePrice: 4.5,
    sellingPrice: 12.0,
    stock: 75.0,
    unitOfMeasure: "METER",
    contextId: contexts.moto._id,
    customAttributes: { motoBrand: "Universal", partBrand: "OEM-Braid" },
    presentation: {
      packagingType: "ROLL",
      contentSize: 100,
      contentUom: "METER",
    },
    isTesting: true,
  },
  {
    name: "Grasa Multipropósito Litio (Kilo)",
    price: 18.5,
    purchasePrice: 9.0,
    sellingPrice: 18.5,
    stock: 5.25,
    unitOfMeasure: "KILOGRAM",
    contextId: contexts.moto._id,
    customAttributes: { motoBrand: "Universal", partBrand: "Castrol" },
    presentation: {
      packagingType: "DRUM",
      contentSize: 1,
      contentUom: "KILOGRAM",
    },
    isTesting: true,
  },
  {
    name: "Cable USB-C Baseus 2M",
    price: 8.99,
    purchasePrice: 3.5,
    sellingPrice: 8.99,
    stock: 110,
    unitOfMeasure: "UNIT",
    contextId: contexts.tech._id,
    customAttributes: { category: "Cables", connectorType: "USB-C" },
    isTesting: true,
  },
  {
    name: "Rotomartillo Demoledor Bosch 1500W",
    price: 45.0,
    purchasePrice: 15.0,
    sellingPrice: 45.0,
    stock: 5,
    unitOfMeasure: "UNIT",
    contextId: contexts.rental._id,
    customAttributes: { powerRating: "1500 Watts", voltage: "110V" },
    isTesting: true,
  },
  {
    name: "Generador Eléctrico Portátil 5KVA",
    price: 75.0,
    purchasePrice: 25.0,
    sellingPrice: 75.0,
    stock: 2,
    unitOfMeasure: "UNIT",
    contextId: contexts.rental._id,
    customAttributes: { powerRating: "5000 Watts", voltage: "110V / 220V" },
    isTesting: true,
  },
];

export const buildSellersData = () => {
  const sellersData = [
    {
      user: "admin",
      email: "kember@example.com",
      name: "Kember Nieves",
      password: "password123",
      role: UserRole.ADMIN,
      isTesting: true,
    },
  ];

  for (let i = 0; i < 3; i++) {
    const firstName = faker.person.firstName();
    const lastName = faker.person.lastName();
    const name = `${firstName} ${lastName}`;
    const username =
      `${firstName.toLowerCase()}${lastName.toLowerCase()}`.replace(
        /[^a-z0-9]/g,
        "",
      );
    const email = faker.internet.email({ firstName, lastName }).toLowerCase();

    sellersData.push({
      user: username,
      email,
      name,
      password: "password123",
      role: UserRole.SELLER,
      isTesting: true,
    });
  }
  return sellersData;
};

export const buildClientsData = (
  sellers: Array<{ _id: unknown }>,
) => {
  const clientsData = [];
  for (let i = 0; i < 5; i++) {
    const firstName = faker.person.firstName();
    const lastName = faker.person.lastName();
    const seller = sellers[i % sellers.length];

    clientsData.push({
      firstName,
      lastName,
      address: faker.location.streetAddress(),
      whatsapp: faker.phone.number().replace(/[^0-9+]/g, ""),
      type: "BASIC",
      orders: [],
      sellerId: seller._id,
      isTesting: true,
    });
  }
  return clientsData;
};

export const targetDates = [
  new Date("2025-01-15T10:00:00Z"),
  new Date("2025-02-20T14:30:00Z"),
  new Date("2025-04-10T11:00:00Z"),
  new Date("2025-05-18T09:15:00Z"),
  new Date("2025-07-22T16:45:00Z"),
  new Date("2025-08-30T13:20:00Z"),
  new Date("2025-10-05T12:00:00Z"),
  new Date("2025-11-12T15:10:00Z"),
  new Date("2026-01-25T14:00:00Z"),
  new Date("2026-02-18T10:30:00Z"),
  new Date("2026-04-05T08:50:00Z"),
  new Date("2026-05-15T11:45:00Z"),
  new Date(),
];
