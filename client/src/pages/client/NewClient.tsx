import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useApolloClient } from "@apollo/client";
import { ArrowLeft } from "lucide-react";

import { ClientForm } from "./ClientForm";
import Alert from "../../components/Alert";
import { makeApolloClientRepository } from "@modules/client/infrastructure/repositories/apollo-client.repository";
import { makeCreateClientUseCase } from "@modules/client/application/use-cases/create-client";

interface NewClientProps {
  session: {
    _id: string;
    role: string;
    name: string;
  };
}

export const NewClient: React.FC<NewClientProps> = ({ session }) => {
  const navigate = useNavigate();
  const apolloClient = useApolloClient();
  const [error, setError] = useState<string | null>(null);

  const [createClientUseCase] = useState(() => {
    const repository = makeApolloClientRepository(apolloClient as any);
    return makeCreateClientUseCase(repository);
  });

  const handleSubmit = async (formData: {
    firstName: string;
    lastName: string;
    address: string;
    whatsapp: string;
    nationalId: string;
  }) => {
    const { makeClient, ClientRatingTier } = await import("@shared-domain/client/client.entity");

    const clientEntity = makeClient({
      firstName: formData.firstName,
      lastName: formData.lastName,
      address: formData.address,
      whatsapp: formData.whatsapp,
      nationalId: formData.nationalId,
      type: ClientRatingTier.BASIC,
      orders: [],
      sellerId: session._id,
    });

    const result = await createClientUseCase.execute(clientEntity);

    if (result.isFailure) {
      setError(result.getError().message || "Error creating client");
    } else {
      navigate("/clients");
    }
  };

  const alertComponent = error ? <Alert message={error} type="error" /> : null;

  return (
    <div className="max-w-3xl mx-auto py-6 px-4">
      <div className="mb-6">
        <button
          onClick={() => navigate("/clients")}
          className="inline-flex items-center gap-2 text-sm font-semibold text-stone-600 dark:text-stone-400 hover:text-stone-900 dark:hover:text-stone-100 transition-colors focus:outline-none focus:ring-2 focus:ring-stone-500 rounded-lg px-2 py-1 -ml-2"
        >
          <ArrowLeft className="w-4 h-4 shrink-0" />
          Back to list
        </button>
      </div>

      <div className="mb-8">
        <h1 className="text-3xl font-extrabold tracking-tight text-stone-900 dark:text-stone-100">
          New Client
        </h1>
        <p className="text-sm text-stone-500 dark:text-stone-400 mt-1">
          Register a new client profile in the system to start associating orders with them.
        </p>
      </div>

      {alertComponent && <div className="mb-6">{alertComponent}</div>}

      <div className="flex justify-center">
        <ClientForm
          onSubmit={handleSubmit}
          submitButtonText="Add Client"
        />
      </div>
    </div>
  );
};

export default NewClient;