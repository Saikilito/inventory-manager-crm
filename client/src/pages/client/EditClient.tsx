import React, { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useApolloClient } from "@apollo/client";
import { ArrowLeft } from "lucide-react";
import { makeApolloClientRepository } from "@modules/client/infrastructure/repositories/apollo-client.repository";
import { makeGetClientUseCase } from "@modules/client/application/use-cases/get-client";
import { makeUpdateClientUseCase } from "@modules/client/application/use-cases/update-client";
import { ClientForm } from "./ClientForm";
import { IClient } from "@shared-domain/client/client.entity";
import { IdVO } from "@shared-domain/shared/value-objects/id.vo";

import Spinkit from "../../components/Spinkit";
import Alert from "../../components/Alert";

export const EditClient: React.FC = () => {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const apolloClient = useApolloClient();

  const [loading, setLoading] = useState(true);
  const [client, setClient] = useState<IClient | null>(null);
  const [error, setError] = useState<string | null>(null);

  const [useCases] = useState(() => {
    const repository = makeApolloClientRepository(apolloClient as any);
    return {
      getClient: makeGetClientUseCase(repository),
      updateClient: makeUpdateClientUseCase(repository),
    };
  });

  useEffect(() => {
    const fetchClient = async () => {
      if (!id) return;

      try {
        const idVO = IdVO.create(id);
        const result = await useCases.getClient.execute(idVO);

        if (result.isFailure) {
          setError(result.getError().message || "Error loading client");
        } else {
          setClient(result.getValue());
        }
      } catch (err: any) {
        setError(err.message || "Error loading client");
      } finally {
        setLoading(false);
      }
    };

    fetchClient();
  }, [id, useCases]);

  const handleSubmit = async (formData: {
    firstName: string;
    lastName: string;
    address: string;
    whatsapp: string;
    age: number;
  }) => {
    if (!client || !id) return;

    const { makeClient } = await import("@shared-domain/client/client.entity");
    const updatedClientEntity = makeClient({
      id,
      firstName: formData.firstName,
      lastName: formData.lastName,
      address: formData.address,
      whatsapp: formData.whatsapp,
      age: formData.age,
      type: String(client.type),
      orders: client.orders ? client.orders.map((o) => String(o)) : [],
      sellerId: String(client.sellerId),
    });

    const result = await useCases.updateClient.execute(updatedClientEntity);

    if (result.isFailure) {
      setError(result.getError().message || "Error updating client");
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
          Edit Client
        </h1>
        <p className="text-sm text-stone-500 dark:text-stone-400 mt-1">
          Update the profile details of the selected client and save the
          changes in the system.
        </p>
      </div>

      {alertComponent && <div className="mb-6">{alertComponent}</div>}

      {loading ? (
        <div className="flex justify-center py-12">
          <Spinkit />
        </div>
      ) : !client ? (
        <div className="bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800/40 p-4 rounded-xl text-center text-sm font-medium text-amber-800 dark:text-amber-300">
          The requested client was not found.
        </div>
      ) : (
        <div className="flex justify-center">
          <ClientForm
            client={client}
            onSubmit={handleSubmit}
            submitButtonText="Save Changes"
          />
        </div>
      )}
    </div>
  );
};

export default EditClient;
