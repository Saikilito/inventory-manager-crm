import { ToolName } from './tool-names.js';

interface ArrayItemsSchema {
  type: string;
  properties?: Record<string, PropertySchema>;
  required?: string[];
}

interface PropertySchema {
  type: string;
  description?: string;
  items?: ArrayItemsSchema;
}

export interface ToolDeclaration {
  name: string;
  description: string;
  parameters: {
    type: 'OBJECT';
    properties: Record<string, PropertySchema>;
    required?: string[];
  };
}

export function buildToolDeclarations(_isFromCrm?: boolean): ToolDeclaration[] {
  const declarations: ToolDeclaration[] = [
    buildSearchStockDeclaration(),
    buildCalculateDeliveryFeeDeclaration(),
    buildCreateClientDeclaration(),
    buildCreateOrderDeclaration(),
    buildWebFetchDeclaration(),
    buildNavigateKnowledgeBrainDeclaration(),
    buildCreateKnowledgeEntryDeclaration(),
    buildQueryMongoDbDeclaration(),
  ];

  return declarations;
}

function buildSearchStockDeclaration(): ToolDeclaration {
  return {
    name: ToolName.SEARCH_STOCK,
    description:
      'Busca productos en el catálogo general. Este buscador hace coincidencia difusa de palabras clave contra el nombre del producto, marca, modelo y otros atributos personalizados. Útil para buscar tanto repuestos de motos como cualquier otro tipo de producto (ropa, víveres, etc.) dependiendo del contexto del negocio.',
    parameters: {
      type: 'OBJECT',
      properties: {
        query: {
          type: 'STRING',
          description:
            "Palabra clave principal del producto (ej. 'aceite', 'bujia', 'franela', 'pantalon'). Puede incluir características descriptivas.",
        },
        contextId: {
          type: 'STRING',
          description:
            "Opcional: ID del contexto de negocio para filtrar la búsqueda (ej. el _id del contexto 'Moto Parts' o 'Clothing'). Puedes consultar los contextos existentes usando queryMongoDB a la colección 'Contexts'.",
        },
        motoBrand: {
          type: 'STRING',
          description: "Opcional (Solo para repuestos): La marca del fabricante de la moto (ej. 'Empire', 'Keeway').",
        },
        motoModel: {
          type: 'STRING',
          description: "Opcional (Solo para repuestos): El modelo de la moto (ej. 'Horse 150', 'TX 200').",
        },
        partBrand: {
          type: 'STRING',
          description: "Opcional (Solo para repuestos): La marca del repuesto (ej. 'Motul', 'TRD').",
        },
      },
      required: ['query'],
    },
  };
}

function buildCalculateDeliveryFeeDeclaration(): ToolDeclaration {
  return {
    name: ToolName.CALCULATE_DELIVERY_FEE,
    description: 'Calculates shipping/delivery fees based on destination GPS latitude and longitude.',
    parameters: {
      type: 'OBJECT',
      properties: {
        lat: { type: 'NUMBER', description: 'Latitude of destination coordinate.' },
        lng: { type: 'NUMBER', description: 'Longitude of destination coordinate.' },
      },
      required: ['lat', 'lng'],
    },
  };
}

function buildCreateClientDeclaration(): ToolDeclaration {
  return {
    name: ToolName.CREATE_CLIENT,
    description:
      'Crea un nuevo cliente en el CRM con su nombre, apellido, dirección, número de WhatsApp y documento de identidad (DNI/Cédula).',
    parameters: {
      type: 'OBJECT',
      properties: {
        firstName: { type: 'STRING', description: 'Primer nombre del cliente.' },
        lastName: { type: 'STRING', description: 'Apellido del cliente.' },
        address: { type: 'STRING', description: 'Dirección de residencia del cliente.' },
        whatsapp: { type: 'STRING', description: 'Número de teléfono/WhatsApp en formato internacional/E.164.' },
        nationalId: { type: 'STRING', description: 'Documento de identidad nacional (DNI o Cédula) del cliente.' },
      },
      required: ['firstName', 'lastName', 'address', 'whatsapp', 'nationalId'],
    },
  };
}

function buildCreateOrderDeclaration(): ToolDeclaration {
  return {
    name: ToolName.CREATE_ORDER,
    description: 'Registra un nuevo pedido/orden de compra en el CRM para el cliente.',
    parameters: {
      type: 'OBJECT',
      properties: {
        items: {
          type: 'ARRAY',
          description: 'Lista de repuestos y cantidades solicitados.',
          items: {
            type: 'OBJECT',
            properties: {
              productId: { type: 'STRING', description: 'ID único del producto en la base de datos.' },
              quantity: { type: 'NUMBER', description: 'Cantidad de unidades del producto.' },
            },
            required: ['productId', 'quantity'],
          },
        },
        clientId: {
          type: 'STRING',
          description:
            'Opcional: ID del cliente en el CRM. Si se omite, se buscará automáticamente usando su número de WhatsApp.',
        },
        deliveryCost: { type: 'NUMBER', description: 'Opcional: Costo del delivery.' },
        customDeliveryAddress: {
          type: 'STRING',
          description: 'Opcional: Dirección de entrega específica si difiere de la dirección del cliente.',
        },
      },
      required: ['items'],
    },
  };
}

function buildWebFetchDeclaration(): ToolDeclaration {
  return {
    name: ToolName.WEB_FETCH,
    description:
      'Navega, investiga y busca información en internet/Google. Puedes usar el parámetro "query" para realizar búsquedas generales en la web (ej. preguntas sobre compatibilidad de repuestos, marcas de motos, especificaciones, etc.) o el parámetro "url" para descargar el contenido directo de una página web específica.',
    parameters: {
      type: 'OBJECT',
      properties: {
        url: {
          type: 'STRING',
          description:
            'Opcional: La URL completa (comenzando con http:// o https://) que se desea investigar.',
        },
        query: {
          type: 'STRING',
          description:
            'Opcional: Términos o pregunta para buscar en internet (ej. "para que motos sirven las bujias CR8E", "compatibilidad Keeway Horse 150"). Usar preferiblemente para cualquier pregunta abierta que requiera investigar en internet.',
        },
      },
    },
  };
}

function buildNavigateKnowledgeBrainDeclaration(): ToolDeclaration {
  return {
    name: ToolName.NAVIGATE_KNOWLEDGE_BRAIN,
    description:
      'Navega jerárquicamente por el Grafo del Cerebro de Conocimiento. Si lo usas sin parámetros, obtendrás el Directorio Raíz. Si pasas un nombre de índice, entrarás en él para leer su contenido y ver qué otros sub-índices o ficheros de información contiene.',
    parameters: {
      type: 'OBJECT',
      properties: {
        nodeTitle: {
          type: 'STRING',
          description:
            'Opcional. El título exacto del índice al que deseas entrar. Déjalo completamente vacío u omítelo para leer el Directorio Raíz.',
        },
      },
    },
  };
}

function buildCreateKnowledgeEntryDeclaration(): ToolDeclaration {
  return {
    name: ToolName.CREATE_KNOWLEDGE_ENTRY,
    description:
      'Crea una nueva entrada en el Cerebro de Conocimiento (Knowledge Brain). Útil para almacenar reglas, políticas, resúmenes de productos o guías descubiertas durante la investigación.',
    parameters: {
      type: 'OBJECT',
      properties: {
        category: {
          type: 'STRING',
          description: 'Categoría del conocimiento. Valores permitidos: SALES, PRODUCTS, COMPANY, CUSTOMER_SERVICE.',
        },
        title: { type: 'STRING', description: 'Título corto y descriptivo de la entrada.' },
        content: { type: 'STRING', description: 'El contenido completo de la entrada. Puedes incluir formato Markdown.' },
        hierarchyLevel: {
          type: 'STRING',
          description: 'Nivel jerárquico. Valores permitidos: ROOT, DOMAIN, TOPIC, DATA. Si dudas, usa DATA o TOPIC.',
        },
        tags: {
          type: 'ARRAY',
          items: { type: 'STRING' },
          description: 'Opcional: Arreglo de palabras clave para facilitar la búsqueda.',
        },
      },
      required: ['category', 'title', 'content', 'hierarchyLevel'],
    },
  };
}

function buildQueryMongoDbDeclaration(): ToolDeclaration {
  return {
    name: ToolName.QUERY_MONGODB,
    description:
      'Exclusivo para uso interno del CRM. Ejecuta consultas agregadas o de lectura simple en las colecciones de MongoDB (Product, Client, Order, Expense, FinancialDay, ChatSession, UnsatisfiedDemand) para responder preguntas analíticas, métricas de venta, mejores clientes, etc. NOTA: En la colección "products", el campo para el nombre del producto es "name".',
    parameters: {
      type: 'OBJECT',
      properties: {
        collection: {
          type: 'STRING',
          description:
            'Nombre de la colección a consultar (products, clients, orders, expenses, financialdays, chatsessions, unsatisfieddemands).',
        },
        query: {
          type: 'STRING',
          description: 'La consulta de MongoDB serializada como JSON (e.g. \'{}\' o \'{"status": "ACTIVE"}\').',
        },
        aggregate: {
          type: 'STRING',
          description:
            'Opcional: La canalización (pipeline) de agregación serializada como JSON array (e.g. \'[{"$group": {"_id": null, "total": {"$sum": "$total"}}}]\').',
        },
      },
      required: ['collection'],
    },
  };
}
