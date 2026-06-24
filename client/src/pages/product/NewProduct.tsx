import React, { useState, Fragment } from "react";
import { useNavigate } from "react-router-dom";
import { useApolloClient } from "@apollo/client";
import { makeApolloProductRepository } from "@modules/product/infrastructure/repositories/apollo-product.repository";
import { makeCreateProductUseCase } from "@modules/product/application/use-cases/create-product";
import { ProductForm } from "./ProductForm";

// @ts-ignore
import Alert from "../../components/Alert";

export const NewProduct: React.FC = () => {
  const navigate = useNavigate();
  const apolloClient = useApolloClient();
  const [error, setError] = useState<string | null>(null);

  const [createProductUseCase] = useState(() => {
    const repository = makeApolloProductRepository(apolloClient as any);
    return makeCreateProductUseCase(repository);
  });

  const handleSubmit = async (formData: {
    name: string;
    price: number;
    stock: number;
  }) => {
    const { makeProduct } =
      await import("@shared-domain/product/product.entity");
    const productEntity = makeProduct({
      name: formData.name,
      price: formData.price,
      stock: formData.stock,
    });

    const result = await createProductUseCase.execute(productEntity);

    if (result.isFailure) {
      setError(result.getError().message || "Error al crear el producto");
    } else {
      navigate("/products");
    }
  };

  const alertComponent = error ? <Alert message={error} /> : "";

  return (
    <Fragment>
      <h1 className="text-center mb-5">Nuevo Producto</h1>
      {alertComponent}
      <div className="row justify-content-center">
        <ProductForm
          onSubmit={handleSubmit}
          submitButtonText="Crear Producto"
        />
      </div>
    </Fragment>
  );
};
export default NewProduct;
