import React from "react";
import { IClient } from "@shared-domain/client/client.entity";
import { User } from "lucide-react";

interface ClientSummaryProps {
  client: IClient | null;
}

export const ClientSummary: React.FC<ClientSummaryProps> = ({ client }) => {
  return (
    <div className="bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-xl p-5 shadow-sm flex flex-col items-center">
      <h2 className="text-sm font-bold text-stone-500 dark:text-stone-400 uppercase tracking-wider mb-5 self-start w-full border-b border-stone-100 dark:border-stone-800 pb-2">
        Client Summary
      </h2>
      {client ? (
        <>
          <div className="w-16 h-16 rounded-full bg-stone-100 dark:bg-stone-800/80 flex items-center justify-center mb-4 text-stone-600 dark:text-stone-300">
            <User className="w-8 h-8" />
          </div>

          <div className="w-full divide-y divide-stone-100 dark:divide-stone-800/60 text-sm">
            <div className="py-3 flex justify-between gap-4">
              <span className="font-medium text-stone-500 dark:text-stone-400">Client</span>
              <span className="font-semibold text-stone-900 dark:text-stone-100 text-right">
                {client.firstName} {client.lastName}
              </span>
            </div>
            <div className="py-3 flex justify-between gap-4">
              <span className="font-medium text-stone-500 dark:text-stone-400">National ID</span>
              <span className="font-semibold text-stone-900 dark:text-stone-100 text-right">
                {client.nationalId}
              </span>
            </div>
            {client.address && (
              <div className="py-3 flex justify-between gap-4">
                <span className="font-medium text-stone-500 dark:text-stone-400">Address</span>
                <span className="font-semibold text-stone-900 dark:text-stone-100 text-right text-sm">
                  {client.address}
                </span>
              </div>
            )}
            <div className="py-3 flex justify-between gap-4">
              <span className="font-medium text-stone-500 dark:text-stone-400">Type</span>
              <span className="font-semibold text-stone-900 dark:text-stone-100 capitalize text-right">
                {client.type === "PREMIUM" ? "Premium" : client.type === "CONCURRENT" ? "Concurrent" : "Basic"}
              </span>
            </div>
            {client.whatsapp && (
              <div className="py-3 flex justify-between gap-4">
                <span className="font-medium text-stone-500 dark:text-stone-400">WhatsApp</span>
                <span className="font-semibold text-stone-900 dark:text-stone-100 text-right text-sm">
                  {client.whatsapp}
                </span>
              </div>
            )}
          </div>
        </>
      ) : (
        <div className="w-full text-center py-6 px-4 border-2 border-dashed border-stone-200 dark:border-stone-800 rounded-xl">
          <p className="text-sm font-semibold text-stone-600 dark:text-stone-300">No client selected</p>
          <p className="text-xs text-stone-400 dark:text-stone-500 mt-1">Please choose a client to proceed.</p>
        </div>
      )}
    </div>
  );
};

export default ClientSummary;
