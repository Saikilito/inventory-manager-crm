import React from "react";
import {
  Truck,
  Calendar,
  Coins,
  ArrowLeft,
  ArrowRight,
} from "lucide-react";
import { DeliveryStatus } from "@shared-domain/delivery/delivery.entity";
import { DateTimeVO } from "@shared-domain/shared/value-objects/date-time.vo";
import Spinkit from "../../components/Spinkit";
import Alert from "../../components/Alert";
import { useDeliveriesLogic } from "./hooks/useDeliveriesLogic";
import { DeliveriesTable } from "./components/DeliveriesTable";

export const DeliveriesPage: React.FC = () => {
  const {
    deliveries,
    filteredDeliveries,
    loadingDel,
    successMessage,
    timeFilter,
    setTimeFilter,
    statusFilter,
    setStatusFilter,
    selectedDate,
    setSelectedDate,
    totalCollected,
    handleStatusChange,
    getClientNameByOrder,
    adjustDate,
  } = useDeliveriesLogic();

  const formatDayLabel = (dayStr: string) => {
    const parts = dayStr.split("-");
    if (parts.length !== 3) return dayStr;
    const [year, month, day] = parts;
    return `${day}/${month}/${year}`;
  };

  return (
    <div className="w-full max-w-7xl mx-auto space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-stone-200 dark:border-stone-800 pb-5">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-stone-900 dark:text-stone-100 flex items-center gap-2">
            <Truck className="w-6 h-6 text-emerald-600" />
            Central Delivery Console (Logistics)
          </h1>
          <p className="text-sm text-stone-500 dark:text-stone-400 mt-1">
            Centralized management of delivery routes, empty container collections,
            shipment statuses, and slot assignments.
          </p>
        </div>
      </div>

      {successMessage && <Alert message={successMessage} type="success" />}

      {/* Filters Bar */}
      {deliveries.length > 0 && (
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 bg-stone-50/50 dark:bg-stone-900/40 p-4 rounded-xl border border-stone-200 dark:border-stone-800/80">
          {/* Time Interval Filters */}
          <div className="flex flex-wrap gap-1.5 items-center">
            <span className="text-[10px] font-bold text-stone-400 uppercase tracking-wider mr-1">
              Period:
            </span>
            {[
              { label: "All", value: "ALL" },
              { label: "Day", value: "DAY" },
              { label: "This Week", value: "WEEK" },
              { label: "This Month", value: "MONTH" },
            ].map((tab) => (
              <button
                key={tab.value}
                onClick={() => setTimeFilter(tab.value as any)}
                className={`px-3.5 py-1.5 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                  timeFilter === tab.value
                    ? "bg-stone-950 text-white dark:bg-white dark:text-stone-950 shadow-sm"
                    : "bg-white dark:bg-stone-900 text-stone-600 dark:text-stone-400 hover:bg-stone-100 dark:hover:bg-stone-800 border border-stone-200 dark:border-stone-800/60"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Status Filters */}
          <div className="flex flex-wrap gap-1.5 items-center">
            <span className="text-[10px] font-bold text-stone-400 uppercase tracking-wider mr-1">
              Status:
            </span>
            {[
              { label: "All", value: "ALL" },
              { label: "Pending", value: DeliveryStatus.PENDING },
              { label: "Dispatched", value: DeliveryStatus.DISPATCHED },
              { label: "Delivered", value: DeliveryStatus.DELIVERED },
              { label: "Cancelled", value: DeliveryStatus.CANCELLED },
            ].map((tab) => (
              <button
                key={tab.value}
                onClick={() => setStatusFilter(tab.value)}
                className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all cursor-pointer ${
                  statusFilter === tab.value
                    ? "bg-stone-900 text-white dark:bg-stone-100 dark:text-stone-950 shadow-sm"
                    : "bg-white dark:bg-stone-900 text-stone-500 dark:text-stone-400 hover:bg-stone-100 dark:hover:bg-stone-800 border border-stone-200 dark:border-stone-800/60"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Date Navigator and KPI Card Section */}
      {deliveries.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-center bg-stone-50/50 dark:bg-stone-900/40 p-4 rounded-xl border border-stone-200 dark:border-stone-800/80 animate-in fade-in slide-in-from-top-2 duration-200">
          {/* Date Navigator or Period Info */}
          {timeFilter === 'DAY' ? (
            <div className="md:col-span-2 flex flex-col sm:flex-row sm:items-center gap-3">
              <span className="text-[10px] font-bold text-stone-400 uppercase tracking-wider">
                Selected Day:
              </span>
              <div className="flex items-center gap-3 bg-white dark:bg-stone-950 border border-stone-200 dark:border-stone-850 rounded-full shadow-sm px-4 py-1.5 h-10 w-fit">
                <button
                  onClick={() => adjustDate(-1)}
                  className="p-1 text-stone-500 hover:text-stone-800 dark:hover:text-stone-200 transition-colors focus:outline-none cursor-pointer"
                  title="Previous Day"
                >
                  <ArrowLeft className="w-4 h-4" />
                </button>
                <div className="flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
                  <span className="text-sm font-extrabold text-stone-800 dark:text-stone-100 select-none">
                    {formatDayLabel(selectedDate)}
                  </span>
                </div>
                <div className="relative flex items-center cursor-pointer text-stone-500 hover:text-stone-800 dark:hover:text-stone-200 transition-colors">
                  <Calendar className="w-4 h-4" />
                  <input
                    type="date"
                    value={selectedDate}
                    onChange={(e) => {
                      const val = e.target.value;
                      if (val) {
                        const res = DateTimeVO.createResult(val);
                        if (!res.isFailure) {
                          setSelectedDate(val);
                        }
                      }
                    }}
                    className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
                  />
                </div>
                <button
                  onClick={() => adjustDate(1)}
                  className="p-1 text-stone-500 hover:text-stone-800 dark:hover:text-stone-200 transition-colors focus:outline-none cursor-pointer"
                  title="Next Day"
                >
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          ) : (
            <div className="md:col-span-2 flex items-center gap-3 py-1">
              <div className="p-2 bg-stone-100 dark:bg-stone-900 rounded-lg border border-stone-200 dark:border-stone-800/60 shrink-0">
                <Calendar className="w-4 h-4 text-stone-500 dark:text-stone-400" />
              </div>
              <div className="space-y-0.5">
                <span className="text-[10px] font-bold text-stone-400 dark:text-stone-500 uppercase tracking-wider block">
                  Active Period
                </span>
                <span className="text-xs font-semibold text-stone-600 dark:text-stone-300">
                  {timeFilter === 'WEEK' && "Scheduled deliveries for the current week"}
                  {timeFilter === 'MONTH' && "Scheduled deliveries for the current month"}
                  {timeFilter === 'ALL' && "History of all scheduled deliveries"}
                </span>
              </div>
            </div>
          )}

          {/* KPI Card */}
          <div className="bg-white dark:bg-stone-950 border border-stone-200 dark:border-stone-850 p-4 rounded-xl flex items-center justify-between shadow-sm">
            <div className="space-y-1">
              <span className="text-[10px] font-bold text-stone-400 dark:text-stone-500 uppercase tracking-wider block">
                <span>Total Delivery Revenue</span>
                {timeFilter === 'DAY' && <span className="text-stone-400 dark:text-stone-500 font-medium"> (Today)</span>}
                {timeFilter === 'WEEK' && <span className="text-stone-400 dark:text-stone-500 font-medium"> (Weekly)</span>}
                {timeFilter === 'MONTH' && <span className="text-stone-400 dark:text-stone-500 font-medium"> (Monthly)</span>}
                {timeFilter === 'ALL' && <span className="text-stone-400 dark:text-stone-500 font-medium"> (All Time)</span>}
              </span>
              <span className="text-xl font-black text-stone-900 dark:text-stone-50 font-mono">
                ${totalCollected.toFixed(2)}
              </span>
            </div>
            <div className="p-2.5 bg-emerald-50 dark:bg-emerald-950/30 rounded-lg border border-emerald-100 dark:border-emerald-900/20">
              <Coins className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
            </div>
          </div>
        </div>
      )}

      {loadingDel ? (
        <div className="flex justify-center py-12">
          <Spinkit />
        </div>
      ) : deliveries.length === 0 ? (
        <div className="text-center py-12 bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-xl">
          <p className="text-stone-500 dark:text-stone-400">
            There are no scheduled shipments or deliveries at the moment.
          </p>
        </div>
      ) : filteredDeliveries.length === 0 ? (
        <div className="text-center py-12 bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-xl">
          <p className="text-stone-500 dark:text-stone-400">
            No deliveries match your active filter settings. Try resetting them.
          </p>
        </div>
      ) : (
        <DeliveriesTable 
          filteredDeliveries={filteredDeliveries} 
          getClientNameByOrder={getClientNameByOrder} 
          handleStatusChange={handleStatusChange} 
        />
      )}
    </div>
  );
};

export default DeliveriesPage;