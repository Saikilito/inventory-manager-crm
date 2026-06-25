import React, { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useApolloClient } from "@apollo/client";
import { ArrowLeft } from "lucide-react";
import { makeApolloProductRepository } from "@modules/product/infrastructure/repositories/apollo-product.repository";
import { makeGetProductUseCase } from "@modules/product/application/use-cases/get-product";
import { makeUpdateProductUseCase } from "@modules/product/application/use-cases/update-product";
import { ProductForm } from "./ProductForm";
import { IProduct } from "@shared-domain/product/product.entity";
import { IdVO } from "@shared-domain/shared/value-objects/id.vo";

import Spinkit from "../../components/Spinkit";
import Alert from "../../components/Alert";

export const EditProduct: React.FC = () => {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const apolloClient = useApolloClient();

  const [loading, setLoading] = useState(true);
  const [product, setProduct] = useState<IProduct | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const [useCases] = useState(() => {
    const repository = makeApolloProductRepository(apolloClient as any);
    return {
      getProduct: makeGetProductUseCase(repository),
      updateProduct: makeUpdateProductUseCase(repository),
    };
  });

  useEffect(() => {
    const fetchProduct = async () => {
      if (!id) return;

      try {
        const idVO = IdVO.create(id);
        const result = await useCases.getProduct.execute(idVO);

        if (result.isFailure) {
          setError(result.getError().message || "Error loading product");
        } else {
          setProduct(result.getValue());
        }
      } catch (err: any) {
        setError(err.message || "Error loading product");
      } finally {
        setLoading(false);
      }
    };

    fetchProduct();
  }, [id, useCases]);

  const handleSubmit = async (formData: {
    name: string;
    price: number;
    stock: number;
  }) => {
    if (!product || !id) return;

    setSubmitting(true);
    setError(null);

    try {
      const { makeProduct } =
        await import("@shared-domain/product/product.entity");
      const updatedProductEntity = makeProduct({
        id,
        name: formData.name,
        price: formData.price,
        stock: formData.stock,
      });

      const result = await useCases.updateProduct.execute(updatedProductEntity);

      if (result.isFailure) {
        setError(result.getError().message || "Error updating product");
      } else {
        navigate("/products");
      }
    } catch (err: any) {
      setError(err.message || "Error updating product");
    } finally {
      setSubmitting(false);
    }
  };

  const alertComponent = error ? (
    <div className="mb-6">
      <Alert message={error} type="error" />
    </div>
  ) : null;

  if (loading) {
    return (
      <div className="flex justify-center items-center py-24">
        <Spinkit />
      </div>
    );
  }

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
          Edit Product
        </h1>
        <p className="text-sm text-stone-500 dark:text-stone-400 mt-1">
          Update the product information, including its price and stock level.
        </p>
      </div>

      {alertComponent}

      {!product ? (
        <div
          className="bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800/40 p-4 rounded-xl text-center text-sm font-medium text-amber-800 dark:text-amber-300"
          role="alert"
        >
          The requested product was not found.
        </div>
      ) : (
        <div className="flex justify-center">
          <ProductForm
            product={product}
            onSubmit={handleSubmit}
            submitButtonText="Save Changes"
            isLoading={submitting}
          />
        </div>
      )}
    </div>
  );
};

export default EditProduct;
