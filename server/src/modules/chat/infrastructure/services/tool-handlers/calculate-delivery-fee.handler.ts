import type { ToolDispatcherDependencies } from '../types.js';

export async function handleCalculateDeliveryFee(
  args: Record<string, unknown>,
  _from: string,
  dependencies: ToolDispatcherDependencies,
): Promise<Record<string, unknown>> {
  const lat = typeof args.lat === 'number' ? args.lat : parseFloat(args.lat as string);
  const lng = typeof args.lng === 'number' ? args.lng : parseFloat(args.lng as string);

  const feeResult = await dependencies.calculateDeliveryFee({ lat, lng });

  if (!feeResult.isFailure) {
    return { fee: feeResult.getValue() };
  }

  return { error: feeResult.getError().message };
}
