import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useApolloClient } from "@apollo/client";
import { ArrowLeft } from "lucide-react";
import { makeApolloProductRepository } from "@modules/product/infrastructure/repositories/apollo-product.repository";
import { makeCreateProductUseCase } from "@modules/product/application/use-cases/create-product";
import { ProductForm } from "./ProductForm";

// @ts-ignore
import Alert from "../../components/Alert";

export const NewProduct: React.FC = () => {
  const navigate = useNavigate();
  const apolloClient = useApolloClient();
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const [createProductUseCase] = useState(() => {
    const repository = makeApolloProductRepository(apolloClient as any);
    return makeCreateProductUseCase(repository);
  });

  const handleSubmit = async (formData: {
    name: string;
    price: number;
    stock: number;
  }) => {
    setSubmitting(true);
    setError(null);

    try {
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
    } catch (err: any) {
      setError(err.message || "Error al crear el producto");
    } finally {
      setSubmitting(false);
    }
  };

  const alertComponent = error ? (
    <div className="mb-6">
      <Alert message={error} type="error" />
    </div>
  ) : null;

  return (
    <div className="max-w-3xl mx-auto py-6 px-4">
      <div className="mb-6">
        <button
          onClick={() => navigate("/products")}
          className="inline-flex items-center gap-2 text-sm font-semibold text-stone-600 dark:text-stone-400 hover:text-stone-900 dark:hover:text-stone-100 transition-colors focus:outline-none focus:ring-2 focus:ring-stone-500 rounded-lg px-2 py-1 -ml-2"
        >
          <ArrowLeft className="w-4 h-4 shrink-0" />
          Volver al listado
        </button>
      </div>

      <div className="mb-8">
        <h1 className="text-3xl font-extrabold tracking-tight text-stone-900 dark:text-stone-100">
          Nuevo Producto
        </h1>
        <p className="text-sm text-stone-500 dark:text-stone-400 mt-1">
          Añade un nuevo producto al catálogo especificando su nombre, precio y stock inicial.
        </p>
      </div>

      {alertComponent}

      <div className="flex justify-center">
        <ProductForm
          onSubmit={handleSubmit}
          submitButtonText="Crear Producto"
          isLoading={submitting}
        />
      </div>
    </div>
  );
};

export default NewProduct;
