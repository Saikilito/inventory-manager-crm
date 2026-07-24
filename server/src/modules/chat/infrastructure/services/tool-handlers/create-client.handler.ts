import type { ToolDispatcherDependencies } from '../types.js';

export async function handleCreateClient(
  args: Record<string, unknown>,
  from: string,
  dependencies: ToolDispatcherDependencies,
): Promise<Record<string, unknown>> {
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
    return { success: true, message: 'Client created successfully in CRM' };
  }

  return { error: clientRes.getError().message };
}
