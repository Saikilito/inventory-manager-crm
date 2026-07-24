import { NonEmptyStringVO } from '../../../../../../../shared-domain/src/shared/value-objects/non-empty-string.vo.js';
import { PositiveNumberVO } from '../../../../../../../shared-domain/src/shared/value-objects/positive-number.vo.js';
import type { ToolDispatcherDependencies } from '../types.js';

export async function handleCreateOrder(
  args: Record<string, unknown>,
  from: string,
  dependencies: ToolDispatcherDependencies,
): Promise<Record<string, unknown>> {
  let resolvedClientId = args.clientId as string | undefined;

  if (!resolvedClientId) {
    resolvedClientId = await findClientIdByWhatsApp(from, dependencies);
    if (!resolvedClientId) {
      return { error: 'Client not found in CRM. You must create the client using createClient tool first!' };
    }
  }

  const sellerId = await dependencies.getDefaultSellerId(from);

  const orderRes = await dependencies.createOrder({
    items: args.items as Array<{ productId: string; quantity: number }>,
    clientId: resolvedClientId,
    sellerId,
    total: 0,
    customDeliveryAddress: args.customDeliveryAddress as string | undefined,
  });

  if (!orderRes.isFailure) {
    const order = orderRes.getValue();
    return { success: true, orderId: order.id?.toString(), total: order.total };
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
