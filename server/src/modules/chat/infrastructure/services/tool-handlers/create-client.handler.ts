import { z } from 'zod';
import { WhatsappIdVO } from '../../../../../../../shared-domain/src/shared/value-objects/whatsapp-id.vo.js';
import { CedulaVO } from '../../../../../../../shared-domain/src/shared/value-objects/cedula.vo.js';
import type { ToolDispatcherDependencies } from '../types.js';

const whatsappSchema = z.string().refine((value) => !WhatsappIdVO.createResult(value).isFailure, 'Invalid WhatsApp ID');
const nationalIdSchema = z.string().refine((value) => !CedulaVO.createResult(value).isFailure, 'Invalid Cédula format');
const createClientArgsSchema = z.object({
  firstName: z.string().trim().min(1),
  lastName: z.string().trim().min(1),
  address: z.string().trim().min(1),
  whatsapp: whatsappSchema,
  nationalId: nationalIdSchema,
});

export async function handleCreateClient(
  args: Record<string, unknown>,
  from: string,
  dependencies: ToolDispatcherDependencies,
): Promise<Record<string, unknown>> {
  const parsedArgs = createClientArgsSchema.safeParse(args);
  if (!parsedArgs.success) {
    return { error: 'Invalid createClient arguments', detail: parsedArgs.error.issues };
  }

  const sellerId = await dependencies.getDefaultSellerId(from);

  const clientRes = await dependencies.createClient({
    firstName: parsedArgs.data.firstName,
    lastName: parsedArgs.data.lastName,
    address: parsedArgs.data.address,
    whatsapp: parsedArgs.data.whatsapp,
    nationalId: parsedArgs.data.nationalId,
    sellerId,
  });

  if (!clientRes.isFailure) {
    const client = clientRes.getValue();
    if (!client.id) return { error: 'Client was created without an ID' };
    return {
      success: true,
      clientId: client.id.toString(),
      message: 'Client created successfully in CRM',
    };
  }

  return { error: clientRes.getError().message };
}
