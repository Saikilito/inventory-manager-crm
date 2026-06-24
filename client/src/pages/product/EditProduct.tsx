import React, { useEffect, useState, Fragment } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useApolloClient } from "@apollo/client";
import { makeApolloProductRepository } from "@modules/product/infrastructure/repositories/apollo-product.repository";
import { makeGetProductUseCase } from "@modules/product/application/use-cases/get-product";
import { makeUpdateProductUseCase } from "@modules/product/application/use-cases/update-product";
import { ProductForm } from "./ProductForm";
import { IProduct } from "@shared-domain/product/product.entity";
import { IdVO } from "@shared-domain/shared/value-objects/id.vo";

// @ts-ignore
import Spinkit from "../../components/Spinkit";
// @ts-ignore
import Alert from "../../components/Alert";

export const EditProduct: React.FC = () => {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const apolloClient = useApolloClient();

  const [loading, setLoading] = useState(true);
  const [product, setProduct] = useState<IProduct | null>(null);
  const [error, setError] = useState<string | null>(null);

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
          setError(result.getError().message || "Error al cargar el producto");
        } else {
          setProduct(result.getValue());
        }
      } catch (err: any) {
        setError(err.message || "Error al cargar el producto");
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
      setError(result.getError().message || "Error al actualizar el producto");
    } else {
      navigate("/products");
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

  if (!product) {
    return (
      <Fragment>
        {alertComponent}
        <div className="alert alert-warning text-center" role="alert">
          No se encontró el producto solicitado.
        </div>
      </Fragment>
    );
  }

  return (
    <Fragment>
      <h1 className="text-center mb-5">Editar Producto</h1>
      {alertComponent}
      <div className="row justify-content-center">
        <ProductForm
          product={product}
          onSubmit={handleSubmit}
          submitButtonText="Guardar Cambios"
        />
      </div>
    </Fragment>
  );
};
export default EditProduct;
