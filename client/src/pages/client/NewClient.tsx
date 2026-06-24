import React, { useState, Fragment } from "react";
import { useNavigate } from "react-router-dom";
import { useApolloClient } from "@apollo/client";

import { ClientForm } from "./ClientForm";
import Alert from "../../components/Alert";
import { makeApolloClientRepository } from "@modules/client/infrastructure/repositories/apollo-client.repository";
import { makeCreateClientUseCase } from "@modules/client/application/use-cases/create-client";

interface NewClientProps {
  session: {
    _id: string;
    rol: string;
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
    company: string;
    emails: string[];
    age: number;
    type: string;
  }) => {
    const { makeClient } = await import("@shared-domain/client/client.entity");

    const clientEntity = makeClient({
      firstName: formData.firstName,
      lastName: formData.lastName,
      company: formData.company,
      emails: formData.emails,
      age: formData.age,
      type: formData.type,
      orders: [],
      sellerId: session._id,
    });

    const result = await createClientUseCase.execute(clientEntity);

    if (result.isFailure) {
      setError(result.getError().message || "Error al crear el cliente");
    } else {
      navigate("/clients");
    }
  };

  const alertComponent = error ? <Alert message={error} /> : "";

  return (
    <Fragment>
      <h1 className="text-center mb-5">Nuevo Cliente</h1>
      {alertComponent}
      <div className="row justify-content-center">
        <ClientForm
          onSubmit={handleSubmit}
          submitButtonText="Agregar Cliente"
        />
      </div>
    </Fragment>
  );
};
export default NewClient;
