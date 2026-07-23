import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useApolloClient } from "@apollo/client";
import { ArrowLeft } from "lucide-react";
import { makeApolloProductRepository } from "@modules/product/infrastructure/repositories/apollo-product.repository";
import { makeCreateProductUseCase } from "@modules/product/application/use-cases/create-product";
import { ProductForm } from "./ProductForm";
import { PRODUCT_MESSAGES } from "@modules/product/domain/product.constants";

import Alert from "../../components/Alert";

export const NewProduct: React.FC = () => {
  const navigate = useNavigate();
  const apolloClient = useApolloClient();
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const [createProductUseCase] = useState(() => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any -- ApolloClient type mismatch in legacy code
    const repository = makeApolloProductRepository(apolloClient as any);
    return makeCreateProductUseCase(repository);
  });

  const handleSubmit = async (formData: {
    name: string;
    purchasePrice: number;
    sellingPrice: number;
    stock: number;
  }) => {
    setSubmitting(true);
    setError(null);

    try {
      const { makeProduct } =
        await import("@shared-domain/product/product.entity");
      const productEntity = makeProduct({
        name: formData.name,
        purchasePrice: formData.purchasePrice,
        sellingPrice: formData.sellingPrice,
        stock: formData.stock,
      });

      const result = await createProductUseCase.execute(productEntity);

      if (result.isFailure) {
        setError(result.getError().message || PRODUCT_MESSAGES.ERROR_CREATING);
      } else {
        navigate("/products");
      }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : PRODUCT_MESSAGES.ERROR_CREATING;
      setError(message);
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
          Back to list
        </button>
      </div>

      <div className="mb-8">
        <h1 className="text-3xl font-extrabold tracking-tight text-stone-900 dark:text-stone-100">
          New Product
        </h1>
        <p className="text-sm text-stone-500 dark:text-stone-400 mt-1">
          Add a new product with purchase price, selling price, and profit tracking.
        </p>
      </div>

      {alertComponent}

      <div className="flex justify-center">
        <ProductForm
          onSubmit={handleSubmit}
          submitButtonText="Create Product"
          isLoading={submitting}
        />
      </div>
    </div>
  );
};

export default NewProduct;
