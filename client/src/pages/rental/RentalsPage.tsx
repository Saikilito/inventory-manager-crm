import React, { useState, useEffect } from "react";
import { useQuery, useMutation } from "@apollo/client";
import { GET_ALL_RENTALS } from "../../modules/rental/infrastructure/graphql/queries";
import { RETURN_RENTAL } from "../../modules/rental/infrastructure/graphql/mutations";
import { CLIENTS_QUERY } from "../../modules/client/infrastructure/graphql/queries";
import { GET_ALL_ORDERS } from "../../modules/order/infrastructure/graphql/queries";
import { PRODUCTS_QUERY } from "../../modules/product/infrastructure/graphql/queries";
import {
  Clock,
  AlertTriangle,
  RotateCcw,
  Wrench,
  User,
  Activity,
  ArrowRight,
} from "lucide-react";
import { getErrorMessage } from "@utils/error";
import { getFullName } from "@utils/formatters";
import { formatDate } from "@utils/formatters";
import { POLLING_INTERVAL_MS, TOAST_DURATION_MS } from "../../utils/constants";
import { RentalStatus } from "@shared-domain/rental/rental.entity";
import Spinkit from "../../components/Spinkit";
import Alert from "../../components/Alert";



interface ClientShape {
  _id: string;
  firstName: string;
  lastName: string;
}

interface OrderShape {
  _id: string;
  clientId: string;
}

interface ProductShape {
  _id: string;
  name: string;
}

interface RentalShape {
  _id: string;
  productId: string;
  orderId: string;
  startDateTime: string;
  endDateTime: string;
  quantity: number;
  status: string;
}

export const RentalsPage: React.FC = () => {
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [now, setNow] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), POLLING_INTERVAL_MS);
    return () => clearInterval(timer);
  }, []);

  const {
    data: rentData,
    loading: loadingRent,
    refetch: refetchRent,
  } = useQuery(GET_ALL_RENTALS, {
    fetchPolicy: "no-cache",
  });
  const rentals: RentalShape[] = rentData?.getAllRentals || [];

  const { data: ordersData } = useQuery(GET_ALL_ORDERS, {
    variables: { limit: 1000 },
  });
  const orders: OrderShape[] = ordersData?.getAllOrders || [];

  const { data: clientsData } = useQuery(CLIENTS_QUERY, {
    variables: { limit: 1000 },
  });
  const clients: ClientShape[] = clientsData?.getAllClients || [];

  const { data: productsData } = useQuery(PRODUCTS_QUERY, {
    variables: { limit: 1000 },
  });
  const products: ProductShape[] = productsData?.getAllProducts || [];

  const orderMap = React.useMemo(() => {
    return new Map<string, OrderShape>(orders.map((o: OrderShape) => [o._id, o]));
  }, [orders]);

  const clientMap = React.useMemo(() => {
    return new Map<string, ClientShape>(clients.map((c: ClientShape) => [c._id, c]));
  }, [clients]);

  const productMap = React.useMemo(() => {
    return new Map<string, ProductShape>(products.map((p: ProductShape) => [p._id, p]));
  }, [products]);

  const [returnRental] = useMutation(RETURN_RENTAL);

  const handleReturn = async (id: string) => {
    if (
      window.confirm(
        "Confirm physical return of this equipment? This will release the reserved stock immediately.",
      )
    ) {
      try {
        await returnRental({ variables: { rentalId: id } });
        setSuccessMessage(
          "Equipment returned and successfully added back to stock.",
        );
        refetchRent();
        setTimeout(() => setSuccessMessage(null), TOAST_DURATION_MS);
      } catch (err) {
        alert(getErrorMessage(err, "Error registering return"));
      }
    }
  };

  const getClientNameByOrder = (orderId: string) => {
    const order = orderMap.get(orderId);
    if (!order) return "General Client";
    const client = clientMap.get(order.clientId);
    return getFullName(client, "General Client");
  };

  const getProductName = (productId: string) => {
    const product = productMap.get(productId);
    return product ? product.name : `Equipment (${productId.substring(18)})`;
  };

  const getRemainingTime = (endIso: string, status: string) => {
    if (status === RentalStatus.RETURNED)
      return (
        <span className="text-stone-400 dark:text-stone-500 font-semibold">
          Returned
        </span>
      );
    if (status === RentalStatus.CANCELLED)
      return (
        <span className="text-stone-400 dark:text-stone-500 font-semibold">
          -
        </span>
      );

    const endDate = new Date(endIso);
    const diffMs = endDate.getTime() - now.getTime();

    if (diffMs <= 0) {
      return (
        <span className="text-red-600 dark:text-red-400 font-bold flex items-center gap-1">
          <AlertTriangle className="w-3.5 h-3.5" />
          Overdue / Delayed
        </span>
      );
    }

    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffMinutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));

    return (
      <span className="text-amber-600 dark:text-amber-400 font-semibold flex items-center gap-1 font-mono text-xs">
        <Clock className="w-3.5 h-3.5 animate-pulse" />
        {diffHours}h {diffMinutes}m remaining
      </span>
    );
  };

  const getStatusBadge = (status: string) => {
    const styles: Record<string, string> = {
      [RentalStatus.RESERVED]:
        "bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950/20 dark:text-blue-400 dark:border-blue-900/30",
      [RentalStatus.ACTIVE]:
        "bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/20 dark:text-amber-400 dark:border-amber-900/30",
      [RentalStatus.RETURNED]:
        "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/20 dark:text-emerald-400 dark:border-emerald-900/30",
      [RentalStatus.OVERDUE]:
        "bg-red-50 text-red-700 border-red-200 dark:bg-red-950/20 dark:text-red-400 dark:border-red-900/30",
      [RentalStatus.CANCELLED]:
        "bg-stone-50 text-stone-600 border-stone-200 dark:bg-stone-900/30 dark:text-stone-400 dark:border-stone-800/60",
    };
    const labels: Record<string, string> = {
      [RentalStatus.RESERVED]: "Reserved",
      [RentalStatus.ACTIVE]: "Active Rental",
      [RentalStatus.RETURNED]: "Returned",
      [RentalStatus.OVERDUE]: "Overdue",
      [RentalStatus.CANCELLED]: "Cancelled",
    };
    return (
      <span
        className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold border ${styles[status] || styles.RESERVED}`}
      >
        {labels[status] || status}
      </span>
    );
  };

  return (
    <div className="w-full max-w-7xl mx-auto space-y-8">
      
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-stone-200 dark:border-stone-800 pb-5">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-stone-900 dark:text-stone-100 flex items-center gap-2">
            <Wrench className="w-6 h-6 text-emerald-600" />
            Equipment Rentals Console
          </h1>
          <p className="text-sm text-stone-500 dark:text-stone-400 mt-1">
            Visualization and control of temporary reservations, delivery deadlines,
            asset usage status, and hour rollover.
          </p>
        </div>
      </div>

      {successMessage && <Alert message={successMessage} type="success" />}

      {loadingRent ? (
        <div className="flex justify-center py-12">
          <Spinkit />
        </div>
      ) : rentals.length === 0 ? (
        <div className="text-center py-12 bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-xl">
          <p className="text-stone-500 dark:text-stone-400">
            No rental reservations registered at the moment.
          </p>
        </div>
      ) : (
        <div className="overflow-x-auto bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800/80 rounded-xl shadow-sm">
          <table className="w-full border-collapse">
            <thead>
              <tr className="border-b border-stone-200 dark:border-stone-800 bg-stone-50/50 dark:bg-stone-900/50">
                <th
                  scope="col"
                  className="text-stone-500 dark:text-stone-400 font-semibold px-6 py-4 text-left text-sm border-b border-stone-200 dark:border-stone-800"
                >
                  Rental ID
                </th>
                <th
                  scope="col"
                  className="text-stone-500 dark:text-stone-400 font-semibold px-6 py-4 text-left text-sm border-b border-stone-200 dark:border-stone-800"
                >
                  Equipment / Machinery
                </th>
                <th
                  scope="col"
                  className="text-stone-500 dark:text-stone-400 font-semibold px-6 py-4 text-left text-sm border-b border-stone-200 dark:border-stone-800"
                >
                  Client
                </th>
                <th
                  scope="col"
                  className="text-stone-500 dark:text-stone-400 font-semibold px-6 py-4 text-left text-sm border-b border-stone-200 dark:border-stone-800"
                >
                  Reservation Range (Caracas)
                </th>
                <th
                  scope="col"
                  className="text-stone-500 dark:text-stone-400 font-semibold px-6 py-4 text-left text-sm border-b border-stone-200 dark:border-stone-800"
                >
                  Remaining Time
                </th>
                <th
                  scope="col"
                  className="text-stone-500 dark:text-stone-400 font-semibold px-6 py-4 text-left text-sm border-b border-stone-200 dark:border-stone-800"
                >
                  Status
                </th>
                <th
                  scope="col"
                  className="text-stone-500 dark:text-stone-400 font-semibold px-6 py-4 text-left text-sm border-b border-stone-200 dark:border-stone-800"
                >
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-100 dark:divide-stone-800/60">
              {rentals.map((rental: RentalShape) => {
                const id = rental._id;
                const shortId = id.substring(18).toUpperCase();
                const clientName = getClientNameByOrder(rental.orderId);
                const productName = getProductName(rental.productId);

                return (
                  <tr
                    key={id}
                    className="hover:bg-stone-50/50 dark:hover:bg-stone-800/20 transition-colors border-b border-stone-100 dark:border-stone-800/60 last:border-b-0"
                  >
                    <td className="px-6 py-4 text-sm font-semibold text-stone-900 dark:text-stone-100 font-mono">
                      #{shortId}
                    </td>
                    <td className="px-6 py-4 text-sm font-medium text-stone-900 dark:text-stone-100">
                      <div className="flex items-center gap-2">
                        <Wrench className="w-4 h-4 text-stone-400 shrink-0" />
                        <span>
                          {productName} (x{rental.quantity})
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm text-stone-700 dark:text-stone-300">
                      <div className="flex items-center gap-2">
                        <User className="w-4 h-4 text-stone-400 shrink-0" />
                        <span>{clientName}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-xs text-stone-600 dark:text-stone-400">
                      <div className="flex flex-col gap-1">
                        <span className="flex items-center gap-1">
                          <Activity className="w-3 h-3 text-blue-500" />
                          <b>Start:</b> {formatDate(rental.startDateTime) || "-"}
                        </span>
                        <span className="flex items-center gap-1">
                          <ArrowRight className="w-3 h-3 text-emerald-500" />
                          <b>Due:</b> {formatDate(rental.endDateTime) || "-"}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm">
                      {getRemainingTime(rental.endDateTime, rental.status)}
                    </td>
                    <td className="px-6 py-4 text-sm">
                      {getStatusBadge(rental.status)}
                    </td>
                    <td className="px-6 py-4 text-sm">
                      {rental.status !== RentalStatus.RETURNED &&
                        rental.status !== RentalStatus.CANCELLED && (
                          <button
                            onClick={() => handleReturn(rental._id)}
                            className="inline-flex items-center justify-center h-9 px-3 rounded-lg text-sm font-medium text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/20 hover:bg-emerald-100 dark:hover:bg-emerald-900/30 border border-emerald-200 dark:border-emerald-800/40 transition-colors cursor-pointer"
                          >
                            <RotateCcw className="w-3.5 h-3.5 mr-1.5" />
                            Return
                          </button>
                        )}
                      {(rental.status === RentalStatus.RETURNED ||
                        rental.status === RentalStatus.CANCELLED) && (
                        <span className="text-stone-400 dark:text-stone-500 font-semibold text-xs">
                          -
                        </span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default RentalsPage;
