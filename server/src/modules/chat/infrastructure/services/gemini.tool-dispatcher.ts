import mongoose from "mongoose";
import { IdVO } from "../../../../../../shared-domain/src/shared/value-objects/id.vo.js";
import { ProductModel, IProductDocument } from "../../../product/infrastructure/product.model.js";
import { CalculateDeliveryFee } from "../../application/use-cases/calculate-delivery-fee.use-case.js";
import { CreateClient } from "../../../client/application/use-cases/create-client.js";
import { CreateOrder } from "../../../order/application/use-cases/create-order.js";
import { LogUnsatisfiedDemand } from "../../application/use-cases/log-unsatisfied-demand.use-case.js";
import { getSpanishSingular } from "./gemini.utils.js";
import { MongoCollectionNames } from "./gemini.constants.js";

export interface ToolDispatcherDependencies {
  calculateDeliveryFee: CalculateDeliveryFee;
  createClient: CreateClient;
  createOrder: CreateOrder;
  logUnsatisfiedDemand: LogUnsatisfiedDemand;
  getDefaultSellerId: (whatsappId: string) => Promise<string>;
}

export function buildToolDeclarations(isFromCrm?: boolean): Array<Record<string, unknown>> {
  const declarations: Array<Record<string, unknown>> = [
    {
      name: "searchStock",
      description:
        "Search motorcycle spare parts, lubricants, or consumables in the catalog. Deconstructs the request into structured schema fields to verify stock and compatibility.",
      parameters: {
        type: "OBJECT",
        properties: {
          query: {
            type: "STRING",
            description: "Core product noun/category keyword (e.g. 'aceite', 'bujia', 'bateria', 'pastilla', 'caucho'). Avoid including motorcycle brand/model here.",
          },
          motoBrand: {
            type: "STRING",
            description: "Optional: The manufacturer/brand of the motorcycle (e.g., 'Empire', 'Keeway', 'Yamaha').",
          },
          motoModel: {
            type: "STRING",
            description: "Optional: The model or displacement of the motorcycle (e.g., 'RK 150', 'Horse 150', 'TX 200').",
          },
          partBrand: {
            type: "STRING",
            description: "Optional: The manufacturer/brand of the spare part/lubricant (e.g., 'Motul', 'TRD', 'Castrol').",
          },
        },
        required: ["query"],
      },
    },
    {
      name: "calculateDeliveryFee",
      description:
        "Calculates shipping/delivery fees based on destination GPS latitude and longitude.",
      parameters: {
        type: "OBJECT",
        properties: {
          lat: {
            type: "NUMBER",
            description: "Latitude of destination coordinate.",
          },
          lng: {
            type: "NUMBER",
            description: "Longitude of destination coordinate.",
          },
        },
        required: ["lat", "lng"],
      },
    },
    {
      name: "createClient",
      description: "Crea un nuevo cliente en el CRM con su nombre, apellido, dirección, número de WhatsApp y documento de identidad (DNI/Cédula).",
      parameters: {
        type: "OBJECT",
        properties: {
          firstName: { type: "STRING", description: "Primer nombre del cliente." },
          lastName: { type: "STRING", description: "Apellido del cliente." },
          address: { type: "STRING", description: "Dirección de residencia del cliente." },
          whatsapp: { type: "STRING", description: "Número de teléfono/WhatsApp en formato internacional/E.164." },
          nationalId: { type: "STRING", description: "Documento de identidad nacional (DNI o Cédula) del cliente." },
        },
        required: ["firstName", "lastName", "address", "whatsapp", "nationalId"],
      },
    },
    {
      name: "createOrder",
      description: "Registra un nuevo pedido/orden de compra en el CRM para el cliente.",
      parameters: {
        type: "OBJECT",
        properties: {
          items: {
            type: "ARRAY",
            description: "Lista de repuestos y cantidades solicitados.",
            items: {
              type: "OBJECT",
              properties: {
                productId: { type: "STRING", description: "ID único del producto en la base de datos." },
                quantity: { type: "NUMBER", description: "Cantidad de unidades del producto." },
              },
              required: ["productId", "quantity"],
            },
          },
          clientId: {
            type: "STRING",
            description: "Opcional: ID del cliente en el CRM. Si se omite, se buscará automáticamente usando su número de WhatsApp.",
          },
          deliveryCost: {
            type: "NUMBER",
            description: "Opcional: Costo del delivery.",
          },
          customDeliveryAddress: {
            type: "STRING",
            description: "Opcional: Dirección de entrega específica si difiere de la dirección del cliente.",
          },
        },
        required: ["items"],
      },
    },
  ];

  if (isFromCrm) {
    declarations.push({
      name: "queryMongoDB",
      description:
        "Exclusivo para uso interno del CRM. Ejecuta consultas agregadas o de lectura simple en las colecciones de MongoDB (Product, Client, Order, Expense, FinancialDay, ChatSession, UnsatisfiedDemand) para responder preguntas analíticas, métricas de venta, mejores clientes, etc.",
      parameters: {
        type: "OBJECT",
        properties: {
          collection: {
            type: "STRING",
            description:
              "Nombre de la colección a consultar (products, clients, orders, expenses, financialdays, chatsessions, unsatisfieddemands).",
          },
          query: {
            type: "STRING",
            description:
              "La consulta de MongoDB serializada como JSON (e.g. '{}' o '{\"status\": \"ACTIVE\"}').",
          },
          aggregate: {
            type: "STRING",
            description:
              "Opcional: La canalización (pipeline) de agregación serializada como JSON array (e.g. '[{\"$group\": {\"_id\": null, \"total\": {\"$sum\": \"$total\"}}}]').",
          },
        },
        required: ["collection"],
      },
    });
  }

  return declarations;
}

export async function dispatchToolCall(
  name: string,
  args: Record<string, unknown>,
  from: string,
  dependencies: ToolDispatcherDependencies,
  options: { isFromCrm?: boolean },
): Promise<Record<string, unknown>> {
  let toolResult: Record<string, unknown> = {};

  if (name === "searchStock") {
    const query = (args.query as string) || "";
    const motoBrand = (args.motoBrand as string) || "";
    const motoModel = (args.motoModel as string) || "";
    const partBrand = (args.partBrand as string) || "";

    const tokens = query
      .trim()
      .split(/\s+/)
      .map((t: string) => getSpanishSingular(t))
      .filter((t: string) => t.length > 0);

    let cleanedTokens = tokens;
    const hasAlphabetical = tokens.some((t: string) => /[a-zA-ZñÑ]/.test(t));
    if (hasAlphabetical) {
      cleanedTokens = tokens.filter((t: string) => !/^\d+$/.test(t));
    }

    const andConditions: Array<Record<string, unknown>> = [];

    if (cleanedTokens.length > 0) {
      const nameConditions = cleanedTokens.map((token: string) => ({
        name: { $regex: token, $options: "i" }
      }));
      andConditions.push({ $and: nameConditions });
    } else if (query) {
      andConditions.push({ name: { $regex: query, $options: "i" } });
    }

    if (motoBrand || motoModel) {
      const compatibilityOrConditions: Array<Record<string, unknown>> = [
        { "customAttributes.motoBrand": { $regex: "Universal", $options: "i" } },
        { "customAttributes.motoBrand": { $exists: false } },
        { contextId: null }
      ];

      if (motoBrand) {
        compatibilityOrConditions.push({
          "customAttributes.motoBrand": { $regex: motoBrand, $options: "i" }
        });
      }
      if (motoModel) {
        compatibilityOrConditions.push({
          "customAttributes.motoBrand": { $regex: motoModel, $options: "i" }
        });
      }

      andConditions.push({ $or: compatibilityOrConditions });
    }

    if (partBrand) {
      andConditions.push({
        "customAttributes.partBrand": { $regex: partBrand, $options: "i" }
      });
    }

    let matchingProducts: IProductDocument[] = [];
    if (andConditions.length > 0) {
      matchingProducts = await ProductModel.find({ $and: andConditions })
        .limit(10)
        .exec();

      if (matchingProducts.length === 0 && cleanedTokens.length > 0) {
        const primaryToken = cleanedTokens[0];
        matchingProducts = await ProductModel.find({
          name: { $regex: primaryToken, $options: "i" }
        })
          .limit(10)
          .exec();
      }
    } else {
      matchingProducts = await ProductModel.find()
        .limit(10)
        .exec();
    }

    if (matchingProducts.length === 0) {
      const nilUuid = IdVO.generateNil().toString();
      await dependencies.logUnsatisfiedDemand({
        productId: nilUuid,
        clientPhone: from,
        productName: query,
        quantity: 1,
      });
    } else {
      for (const p of matchingProducts) {
        if (p.stock === 0) {
          await dependencies.logUnsatisfiedDemand({
            productId: p._id.toString(),
            clientPhone: from,
            productName: p.name,
            quantity: 1,
          });
        }
      }
    }

    toolResult = {
      products: matchingProducts.map((p) => ({
        id: p._id.toString(),
        name: p.name,
        price: p.price,
        stock: p.stock,
      })),
    };
  } else if (name === "calculateDeliveryFee") {
    const lat = typeof args.lat === "number" ? args.lat : parseFloat(args.lat as string);
    const lng = typeof args.lng === "number" ? args.lng : parseFloat(args.lng as string);
    const feeResult = await dependencies.calculateDeliveryFee({
      lat,
      lng,
    });

    if (!feeResult.isFailure) {
      toolResult = { fee: feeResult.getValue() };
    } else {
      toolResult = { error: feeResult.getError().message };
    }
  } else if (name === "createClient") {
    const sellerId = await dependencies.getDefaultSellerId(from);
    const clientRes = await dependencies.createClient({
      firstName: args.firstName as string,
      lastName: args.lastName as string,
      address: args.address as string,
      whatsapp: args.whatsapp as string,
      nationalId: args.nationalId as string,
      sellerId,
    });
    if (!clientRes.isFailure) {
      toolResult = { success: true, message: "Client created successfully in CRM" };
    } else {
      toolResult = { error: clientRes.getError().message };
    }
  } else if (name === "createOrder") {
    let resolvedClientId = args.clientId as string | undefined;
    if (!resolvedClientId) {
      const Client = mongoose.model("Client");
      const clientDoc = await Client.findOne({ whatsapp: from }).exec();
      if (clientDoc) {
        resolvedClientId = clientDoc._id.toString();
      } else {
        toolResult = { error: "Client not found in CRM. You must create the client using createClient tool first!" };
      }
    }
    if (resolvedClientId) {
      const sellerId = await dependencies.getDefaultSellerId(from);
      const orderRes = await dependencies.createOrder({
        items: args.items as Array<{ productId: string; quantity: number }>,
        clientId: resolvedClientId,
        sellerId,
        deliveryCost: args.deliveryCost !== undefined ? (typeof args.deliveryCost === "number" ? args.deliveryCost : parseFloat(args.deliveryCost as string)) : undefined,
        customDeliveryAddress: args.customDeliveryAddress as string | undefined,
      });
      if (!orderRes.isFailure) {
        const order = orderRes.getValue();
        toolResult = { success: true, orderId: order.id?.toString(), total: order.total };
      } else {
        toolResult = { error: orderRes.getError().message };
      }
    }
  } else if (name === "queryMongoDB" && options.isFromCrm) {
    const collectionName = (args.collection as string) || "";
    const getModel = (colName: string) => {
      const norm = colName.toLowerCase().replace(/[-_s]/g, "");
      if (norm === "product" || norm === "products")
        return mongoose.model(MongoCollectionNames.Products);
      if (norm === "client" || norm === "clients")
        return mongoose.model(MongoCollectionNames.Clients);
      if (norm === "order" || norm === "orders")
        return mongoose.model(MongoCollectionNames.Orders);
      if (norm === "expense" || norm === "expenses")
        return mongoose.model(MongoCollectionNames.Expenses);
      if (norm === "financialday" || norm === "financialdays")
        return mongoose.model(MongoCollectionNames.FinancialDays);
      if (norm === "chatsession" || norm === "chatsessions")
        return mongoose.model(MongoCollectionNames.ChatSessions);
      if (norm === "unsatisfieddemand" || norm === "unsatisfieddemands")
        return mongoose.model(MongoCollectionNames.UnsatisfiedDemands);
      return null;
    };

    const model = getModel(collectionName);
    if (!model) {
      toolResult = {
        error: `Model for collection ${collectionName} was not found or is unregistered.`,
      };
    } else {
      try {
        if (args.aggregate) {
          const pipeline = JSON.parse(args.aggregate as string);
          const results = await model.aggregate(pipeline).exec();
          toolResult = { results: results.slice(0, 50) };
        } else {
          const parsedQuery = args.query ? JSON.parse(args.query as string) : {};
          const results = await model
            .find(parsedQuery)
            .limit(50)
            .exec();
          toolResult = { results };
        }
      } catch (err: unknown) {
        const message = err instanceof Error ? err.message : String(err);
        toolResult = {
          error: `Database execution error: ${message}`,
        };
      }
    }
  }

  return toolResult;
}
