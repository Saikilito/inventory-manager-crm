import React, { useEffect, useState, Fragment } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useApolloClient } from "@apollo/client";
import { makeApolloClientRepository } from "@modules/client/infrastructure/repositories/apollo-client.repository";
import { makeGetClientUseCase } from "@modules/client/application/use-cases/get-client";
import { makeUpdateClientUseCase } from "@modules/client/application/use-cases/update-client";
import { ClientForm } from "./ClientForm";
import { IClient } from "@shared-domain/client/client.entity";
import { IdVO } from "@shared-domain/shared/value-objects/id.vo";

// @ts-ignore
import Spinkit from "../../components/Spinkit";
// @ts-ignore
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
          setError(result.getError().message || "Error al cargar el cliente");
        } else {
          setClient(result.getValue());
        }
      } catch (err: any) {
        setError(err.message || "Error al cargar el cliente");
      } finally {
        setLoading(false);
      }
    };

    fetchClient();
  }, [id, useCases]);

  const handleSubmit = async (formData: {
    firstName: string;
    lastName: string;
    company: string;
    emails: string[];
    age: number;
    type: string;
  }) => {
    if (!client || !id) return;

    const { makeClient } = await import("@shared-domain/client/client.entity");
    const updatedClientEntity = makeClient({
      id,
      firstName: formData.firstName,
      lastName: formData.lastName,
      company: formData.company,
      emails: formData.emails,
      age: formData.age,
      type: formData.type,
      orders: client.orders ? client.orders.map((o) => String(o)) : [],
      sellerId: String(client.sellerId),
    });

    const result = await useCases.updateClient.execute(updatedClientEntity);

    if (result.isFailure) {
      setError(result.getError().message || "Error al actualizar el cliente");
    } else {
      navigate("/clients");
    }
  };

  if (loading) {
    return (
      <div className="d-flex justify-content-center my-5">
        <Spinkit />
      </div>
    );
  }

  const alertComponent = error ? <Alert message={error} /> : "";

  if (!client) {
    return (
      <Fragment>
        {alertComponent}
        <div className="alert alert-warning text-center" role="alert">
          No se encontró el cliente solicitado.
        </div>
      </Fragment>
    );
  }

  return (
    <Fragment>
      <h1 className="text-center mb-5">Editar Cliente</h1>
      {alertComponent}
      <div className="row justify-content-center">
        <ClientForm
          client={client}
          onSubmit={handleSubmit}
          submitButtonText="Guardar Cambios"
        />
      </div>
    </Fragment>
  );
};
export default EditClient;
