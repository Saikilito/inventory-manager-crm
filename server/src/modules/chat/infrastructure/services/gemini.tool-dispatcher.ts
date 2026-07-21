import mongoose from "mongoose";
import { IdVO } from "../../../../../../shared-domain/src/shared/value-objects/id.vo.js";
import { NonEmptyStringVO } from "../../../../../../shared-domain/src/shared/value-objects/non-empty-string.vo.js";
import { PositiveNumberVO } from "../../../../../../shared-domain/src/shared/value-objects/positive-number.vo.js";
import { IProductRepository, ProductSearchTokens } from "../../../product/application/repositories/product.repository.js";
import { IClientRepository } from "../../../client/application/repositories/client.repository.js";
import { CalculateDeliveryFee } from "../../application/use-cases/calculate-delivery-fee.use-case.js";
import { CreateClient } from "../../../client/application/use-cases/create-client.js";
import { CreateOrder } from "../../../order/application/use-cases/create-order.js";
import { LogUnsatisfiedDemand } from "../../application/use-cases/log-unsatisfied-demand.use-case.js";
import { getSpanishSingular } from "./gemini.utils.js";
import {
  MongoCollectionNames,
  MongoQueryConstants,
} from "./gemini.constants.js";
import {
  validateAggregateAgainstAllowlist,
  validateQueryAgainstAllowlist,
  resolveAllowedFieldsForCollection,
} from "./mongo-query-allowlist.js";
import { KnowledgeModel } from "../../../knowledge/infrastructure/knowledge.model.js";

export const MAX_PRODUCT_SEARCH_LIMIT = 10;

export interface ToolDispatcherDependencies {
  calculateDeliveryFee: CalculateDeliveryFee;
  createClient: CreateClient;
  createOrder: CreateOrder;
  logUnsatisfiedDemand: LogUnsatisfiedDemand;
  getDefaultSellerId: (whatsappId: string) => Promise<string>;
  productRepository: IProductRepository;
  clientRepository: IClientRepository;
}

export function buildToolDeclarations(isFromCrm?: boolean): Array<Record<string, unknown>> {
  const declarations: Array<Record<string, unknown>> = [
    {
      name: "searchStock",
      description:
        "Busca productos en el catálogo general. Este buscador hace coincidencia difusa de palabras clave contra el nombre del producto, marca, modelo y otros atributos personalizados. Útil para buscar tanto repuestos de motos como cualquier otro tipo de producto (ropa, víveres, etc.) dependiendo del contexto del negocio.",
      parameters: {
        type: "OBJECT",
        properties: {
          query: {
            type: "STRING",
            description: "Palabra clave principal del producto (ej. 'aceite', 'bujia', 'franela', 'pantalon'). Puede incluir características descriptivas.",
          },
          contextId: {
            type: "STRING",
            description: "Opcional: ID del contexto de negocio para filtrar la búsqueda (ej. el _id del contexto 'Moto Parts' o 'Clothing'). Puedes consultar los contextos existentes usando queryMongoDB a la colección 'Contexts'.",
          },
          motoBrand: {
            type: "STRING",
            description: "Opcional (Solo para repuestos): La marca del fabricante de la moto (ej. 'Empire', 'Keeway').",
          },
          motoModel: {
            type: "STRING",
            description: "Opcional (Solo para repuestos): El modelo de la moto (ej. 'Horse 150', 'TX 200').",
          },
          partBrand: {
            type: "STRING",
            description: "Opcional (Solo para repuestos): La marca del repuesto (ej. 'Motul', 'TRD').",
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
    {
      name: "webFetch",
      description: "Navega e investiga en internet. Descarga el contenido de una URL y devuelve su texto.",
      parameters: {
        type: "OBJECT",
        properties: {
          url: {
            type: "STRING",
            description: "La URL completa (comenzando con http:// o https://) que se desea investigar.",
          },
        },
        required: ["url"],
      },
    },
    {
      name: "navigateKnowledgeBrain",
      description: "Navega jerárquicamente por el Grafo del Cerebro de Conocimiento. Si lo usas sin parámetros, obtendrás el Directorio Raíz. Si pasas un nombre de índice, entrarás en él para leer su contenido y ver qué otros sub-índices o ficheros de información contiene.",
      parameters: {
        type: "OBJECT",
        properties: {
          nodeTitle: {
            type: "STRING",
            description: "Opcional. El título exacto del índice al que deseas entrar. Déjalo completamente vacío u omítelo para leer el Directorio Raíz.",
          },
        },
      },
    },
    {
      name: "createKnowledgeEntry",
      description: "Crea una nueva entrada en el Cerebro de Conocimiento (Knowledge Brain). Útil para almacenar reglas, políticas, resúmenes de productos o guías descubiertas durante la investigación.",
      parameters: {
        type: "OBJECT",
        properties: {
          category: {
            type: "STRING",
            description: "Categoría del conocimiento. Valores permitidos: SALES, PRODUCTS, COMPANY, CUSTOMER_SERVICE.",
          },
          title: {
            type: "STRING",
            description: "Título corto y descriptivo de la entrada.",
          },
          content: {
            type: "STRING",
            description: "El contenido completo de la entrada. Puedes incluir formato Markdown.",
          },
          hierarchyLevel: {
            type: "STRING",
            description: "Nivel jerárquico. Valores permitidos: ROOT, DOMAIN, TOPIC, DATA. Si dudas, usa DATA o TOPIC.",
          },
          tags: {
            type: "ARRAY",
            items: { type: "STRING" },
            description: "Opcional: Arreglo de palabras clave para facilitar la búsqueda.",
          },
        },
        required: ["category", "title", "content", "hierarchyLevel"],
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
    const contextId = (args.contextId as string) || undefined;
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

    // When the user provides no meaningful tokens (only digits, empty, etc.)
    // we fall back to a single-token search using the raw query. The
    // repository is responsible for sanitising every token before constructing
    // the MongoDB $regex pattern, neutralising NoSQL / ReDoS injection.
    const searchTokens: ProductSearchTokens = {
      nameTokens: cleanedTokens.length > 0 ? cleanedTokens : query ? [query] : [],
      contextId: contextId,
      motoBrand: motoBrand || undefined,
      motoModel: motoModel || undefined,
      partBrand: partBrand || undefined,
      limit: MAX_PRODUCT_SEARCH_LIMIT,
    };

    const searchResult = await dependencies.productRepository.searchByTokens(searchTokens);
    let matchingProducts = searchResult.items;

    // Repository search returned nothing on a multi-token query → try the
    // primary token alone (relaxed matching). Still goes through the
    // repository, so sanitisation is preserved.
    if (matchingProducts.length === 0 && cleanedTokens.length > 1) {
      const relaxed = await dependencies.productRepository.searchByTokens({
        nameTokens: [cleanedTokens[0]!],
        limit: MAX_PRODUCT_SEARCH_LIMIT,
      });
      matchingProducts = relaxed.items;
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
        // Domain entity exposes stock as a NonNegativeNumber VO → unwrap
        const stockValue =
          typeof p.stock === "object" && p.stock !== null && "value" in p.stock
            ? Number((p.stock as { value: unknown }).value)
            : Number(p.stock);
        if (stockValue === 0) {
          await dependencies.logUnsatisfiedDemand({
            productId: p.id ? p.id.toString() : IdVO.generateNil().toString(),
            clientPhone: from,
            productName: p.name.toString(),
            quantity: 1,
          });
        }
      }
    }

    toolResult = {
      products: matchingProducts.map((p) => ({
        id: p.id ? p.id.toString() : "",
        name: p.name.toString(),
        price: typeof p.price === "object" && p.price !== null && "value" in p.price
          ? Number((p.price as { value: unknown }).value)
          : Number(p.price),
        stock: typeof p.stock === "object" && p.stock !== null && "value" in p.stock
          ? Number((p.stock as { value: unknown }).value)
          : Number(p.stock),
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
      // Look up the client by WhatsApp number through the repository rather
      // than touching Mongoose directly. This keeps the dispatcher in
      // infrastructure-only mode and routes the lookup through the same
      // abstraction the rest of the application uses.
      const clientResult = await dependencies.clientRepository.getAll({
        where: {
          fields: [
            { field: NonEmptyStringVO.create("whatsapp"), value: from, operator: "=" },
          ],
        },
        limit: PositiveNumberVO.create(1),
      });
      const found = clientResult.getValue().items[0];
      if (found) {
        resolvedClientId = found.id ? found.id.toString() : undefined;
      }
      if (!resolvedClientId) {
        toolResult = { error: "Client not found in CRM. You must create the client using createClient tool first!" };
      }
    }
    if (resolvedClientId) {
      const sellerId = await dependencies.getDefaultSellerId(from);
      const orderRes = await dependencies.createOrder({
        items: args.items as Array<{ productId: string; quantity: number }>,
        clientId: resolvedClientId,
        sellerId,
        // deliveryCost: args.deliveryCost !== undefined ? (typeof args.deliveryCost === "number" ? args.deliveryCost : parseFloat(args.deliveryCost as string)) : undefined,
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
      if (norm === "knowledge" || norm === "knowledges")
        return mongoose.model("Knowledge");
      if (norm === "context" || norm === "contexts")
        return mongoose.model(MongoCollectionNames.Contexts);
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
          const aggregateError = validateAggregateAgainstAllowlist(pipeline);
          if (aggregateError) {
            toolResult = { error: `Query rejected: ${aggregateError}` };
          } else {
            const results = await model.aggregate(pipeline).exec();
            toolResult = { results: results.slice(0, MongoQueryConstants.QUERY_TOOL_RESULT_LIMIT) };
          }
        } else {
          const parsedQuery = args.query ? JSON.parse(args.query as string) : {};
          const allowedFields = resolveAllowedFieldsForCollection(collectionName);
          if (!allowedFields) {
            toolResult = {
              error: `No allowlist configured for collection ${collectionName}.`,
            };
          } else {
            const queryError = validateQueryAgainstAllowlist(parsedQuery, allowedFields);
            if (queryError) {
              toolResult = { error: `Query rejected: ${queryError}` };
            } else {
              const results = await model
                .find(parsedQuery)
                .limit(MongoQueryConstants.QUERY_TOOL_RESULT_LIMIT)
                .exec();
              toolResult = { results };
            }
          }
        }
      } catch (err: unknown) {
        const message = err instanceof Error ? err.message : String(err);
        toolResult = {
          error: `Database execution error: ${message}`,
        };
      }
    }
  } else if (name === "webFetch") {
    try {
      const url = args.url as string;
      if (!url) {
        toolResult = { error: "URL is required for webFetch" };
      } else {
        const response = await fetch(url);
        if (!response.ok) {
          toolResult = { error: `Failed to fetch: HTTP ${response.status}` };
        } else {
          // Extraemos texto plano simple, si es HTML intentamos limpiar un poco
          let text = await response.text();
          if (text.includes("<html")) {
            text = text.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, "")
                       .replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, "")
                       .replace(/<[^>]+>/g, " ")
                       .replace(/\s+/g, " ")
                       .trim();
          }
          toolResult = { content: text.slice(0, 15000) }; // Limitar tamaño
        }
      }
    } catch (err: unknown) {
      toolResult = { error: `Fetch failed: ${err instanceof Error ? err.message : String(err)}` };
    }
  } else if (name === "navigateKnowledgeBrain") {
    try {
      const nodeTitle = args.nodeTitle as string | undefined;

      if (!nodeTitle || nodeTitle.trim() === "") {
        // Encontrar nodos raíz (los que no tienen enlaces apuntando a padres, es decir, wikiLinks está vacío)
        const roots = await KnowledgeModel.find({
          $or: [
            { wikiLinks: { $exists: false } },
            { wikiLinks: { $size: 0 } }
          ],
          isActive: true
        }, "title category metadata.hierarchyLevel").lean().exec();

        toolResult = {
          message: "Estás en el Directorio Raíz del Cerebro de Conocimiento. Estos son los ficheros e índices principales:",
          availableIndices: roots.map(r => ({ title: r.title, type: r.metadata?.hierarchyLevel, category: r.category }))
        };
      } else {
        const node = await KnowledgeModel.findOne({ title: nodeTitle, isActive: true }).lean().exec();
        if (!node) {
          toolResult = { error: `No se encontró ningún índice o fichero llamado '${nodeTitle}'. Usa 'queryMongoDB' si necesitas hacer una búsqueda borrosa.` };
        } else {
          // Find children (nodes whose wikiLinks point to this node)
          const children = await KnowledgeModel.find({ "wikiLinks.title": nodeTitle, isActive: true }, "title category metadata.hierarchyLevel").lean().exec();
          toolResult = {
            currentLocation: {
              title: node.title,
              type: node.metadata?.hierarchyLevel,
              category: node.category,
              content: node.content
            },
            subDirectoriesAndFiles: children.map(c => ({ title: c.title, type: c.metadata?.hierarchyLevel, category: c.category }))
          };
        }
      }
    } catch (err: unknown) {
      toolResult = { error: `Knowledge navigation failed: ${err instanceof Error ? err.message : String(err)}` };
    }
  } else if (name === "createKnowledgeEntry") {
    try {
      const sellerId = await dependencies.getDefaultSellerId(from);
      
      const newEntry = await KnowledgeModel.create({
        category: args.category || "COMPANY",
        title: args.title,
        content: args.content,
        wikiLinks: [],
        metadata: {
          hierarchyLevel: args.hierarchyLevel || "DATA",
          tags: Array.isArray(args.tags) ? args.tags : [],
          createdBy: sellerId,
        },
        status: "ACTIVE", // Autoprobado si viene del agente interno
        isActive: true,
        createdBy: sellerId,
      });
      
      toolResult = { success: true, id: newEntry._id.toString(), message: "Knowledge entry created successfully." };
    } catch (err: unknown) {
      toolResult = { error: `Failed to create knowledge entry: ${err instanceof Error ? err.message : String(err)}` };
    }
  }

  return toolResult;
}
