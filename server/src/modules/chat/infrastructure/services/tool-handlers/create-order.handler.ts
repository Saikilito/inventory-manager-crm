import { NonEmptyStringVO } from '../../../../../../../shared-domain/src/shared/value-objects/non-empty-string.vo.js';
import { PositiveNumberVO } from '../../../../../../../shared-domain/src/shared/value-objects/positive-number.vo.js';
import type { ToolDispatcherDependencies } from '../types.js';
import { IdVO } from '../../../../../../../shared-domain/src/shared/value-objects/id.vo.js';
import { z } from 'zod';

const idSchema = z.string().refine((value) => !IdVO.createResult(value).isFailure, 'Invalid ID');
const createOrderArgsSchema = z.object({
  items: z.array(z.object({
    productId: idSchema,
    quantity: z.number().finite().positive(),
  })).min(1),
  clientId: idSchema.optional(),
  deliveryCost: z.number().finite().nonnegative().optional(),
  customDeliveryAddress: z.string().trim().min(1).optional(),
});

export async function handleCreateOrder(
  args: Record<string, unknown>,
  from: string,
  dependencies: ToolDispatcherDependencies,
): Promise<Record<string, unknown>> {
  const parsedArgs = createOrderArgsSchema.safeParse(args);
  if (!parsedArgs.success) {
    return { error: 'Invalid createOrder arguments', detail: parsedArgs.error.issues };
  }

  const { items, deliveryCost = 0, customDeliveryAddress } = parsedArgs.data;
  let resolvedClientId = parsedArgs.data.clientId;

  if (!resolvedClientId) {
    resolvedClientId = await findClientIdByWhatsApp(from, dependencies);
    if (!resolvedClientId) {
      return { error: 'Client not found in CRM. You must create the client using createClient tool first!' };
    }
  }

  const sellerId = await dependencies.getDefaultSellerId(from);
  let productSubtotal = 0;
  for (const item of items) {
    const productResult = await dependencies.productRepository.getById(IdVO.create(item.productId));
    if (productResult.isFailure) return { error: productResult.getError().message };
    const product = productResult.getValue();
    if (!product) return { error: `Product not found: ${item.productId}` };
    if (Number(product.stock) < item.quantity) {
      return { error: `Insufficient stock for product: ${product.name.toString()}` };
    }
    productSubtotal += Number(product.sellingPrice) * item.quantity;
  }
  const total = Number((productSubtotal + deliveryCost).toFixed(2));

  const orderRes = await dependencies.createOrder({
    items,
    clientId: resolvedClientId,
    sellerId,
    total,
    deliveryCost,
    customDeliveryAddress,
  });

  if (!orderRes.isFailure) {
    const order = orderRes.getValue();
    return { success: true, orderId: order.id?.toString(), total };
  }

  return { error: orderRes.getError().message };
}

async function findClientIdByWhatsApp(
  whatsapp: string,
  dependencies: ToolDispatcherDependencies,
): Promise<string | undefined> {
  const clientResult = await dependencies.clientRepository.getAll({
    where: {
      fields: [{ field: NonEmptyStringVO.create('whatsapp'), value: whatsapp, operator: '=' }],
    },
    limit: PositiveNumberVO.create(1),
  });

  const found = clientResult.getValue().items[0];
  return found?.id?.toString();
}
