import { UseCase } from "../../../../../../shared-domain/src/shared/use-case.js";
import { createDomainError, DomainError } from "../../../../../../shared-domain/src/shared/errors.js";
import { Result } from "../../../../../../shared-domain/src/shared/result.js";
import { IWhatsAppGateway } from "../../infrastructure/services/baileys.gateway.js";
import { ProcessIncomingMessage } from "./process-incoming-message.use-case.js";
import { IIncomingMessageCollector } from "../../infrastructure/services/incoming-message-collector.js";

export type InitializeWhatsApp = UseCase<void, void, DomainError>;

export const makeInitializeWhatsApp = (dependencies: {
  whatsAppGateway: IWhatsAppGateway;
  processIncomingMessage: ProcessIncomingMessage;
  incomingMessageCollector?: IIncomingMessageCollector;
}): InitializeWhatsApp => {
  return async () => {
    try {
      const initResult = await dependencies.whatsAppGateway.initialize(
        dependencies.processIncomingMessage,
        dependencies.incomingMessageCollector
      );

      if (initResult.isFailure) {
        return Result.fail(
          createDomainError(
            `Failed to initialize WhatsApp gateway: ${initResult.getError().message}`
          )
        );
      }

      return Result.ok<void, DomainError>();
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : String(err);
      return Result.fail(
        createDomainError(`InitializeWhatsApp failed: ${message}`)
      );
    }
  };
};

export default makeInitializeWhatsApp;
