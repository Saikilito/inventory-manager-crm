import React from 'react';
import { IOrder, OrderStatus } from '@shared-domain/order/order.entity';

interface OrderItemCardProps {
  order: IOrder;
  productMap: Map<string, string>;
  onStatusChange: (order: IOrder, newStatus: OrderStatus) => void;
}

export const OrderItemCard: React.FC<OrderItemCardProps> = ({
  order,
  productMap,
  onStatusChange,
}) => {
  const status = order.status;

  let borderClass = 'border-light';
  if (status === 'PENDING') {
    borderClass = 'border-light';
  } else if (status === 'CANCELLED') {
    borderClass = 'border-danger';
  } else if (status === 'COMPLETED') {
    borderClass = 'border-success';
  }

  return (
    <div className="col-md-4">
      <div className={`card mb-3 ${borderClass}`}>
        <div className="card-body">
          <div className="card-text font-weight-bold">
            Estado:
            <select
              className="form-control my-3"
              value={status}
              onChange={(e) => onStatusChange(order, e.target.value as OrderStatus)}
            >
              <option value="PENDING">PENDIENTE</option>
              <option value="COMPLETED">COMPLETADO</option>
              <option value="CANCELLED">CANCELADO</option>
            </select>
          </div>

          <p className="card-text font-weight-bold">
            Pedido ID:
            <span className="font-weight-normal">
              {` `}
              {String(order.id)}
            </span>
          </p>
          <p className="card-text font-weight-bold">
            Fecha Pedido:
            <span className="font-weight-normal">
              {` `}
              {new Date(String(order.createdAt)).toLocaleDateString()}
            </span>
          </p>

          <h3 className="card-text text-center mb-3 resaltar-texto" style={{ fontSize: '1.25rem', color: '#1a56db' }}>
            Artículos del pedido
          </h3>

          <ul className="list-group list-group-flush mb-3">
            {order.items.map((item, i) => {
              const prodId = String(item.productId);
              const productName = productMap.get(prodId) || 'Cargando producto...';

              return (
                <li key={i} className="list-group-item d-flex justify-content-between align-items-center px-0">
                  <div>
                    <span className="font-weight-bold">{productName}</span>
                  </div>
                  <span className="badge badge-primary badge-pill">Cant: {Number(item.quantity)}</span>
                </li>
              );
            })}
          </ul>

          <p className="card-text font-weight-bold justify-content-end resaltar-texto p-2 bg-warning rounded text-center">
            Total:
            <span className="font-weight-normal">
              {` $`}
              {Number(order.total)}
            </span>
          </p>
        </div>
      </div>
    </div>
  );
};
export default OrderItemCard;
