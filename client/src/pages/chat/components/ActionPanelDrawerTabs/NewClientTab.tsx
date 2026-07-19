import React, { useState, useEffect } from "react";
import { useMutation } from "@apollo/client";
import { UserPlus, Loader2 } from "lucide-react";
import { CREATE_CLIENT } from "../../../../modules/client/infrastructure/graphql/mutations";

interface NewClientTabProps {
  whatsappId: string;
  onSuccess: (msg: string) => void;
  onError: (msg: string) => void;
  refetchClients: () => void;
}

export const NewClientTab: React.FC<NewClientTabProps> = ({
  whatsappId,
  onSuccess,
  onError,
  refetchClients,
}) => {
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [address, setAddress] = useState("");
  const [clientWhatsapp, setClientWhatsapp] = useState(whatsappId);
  const [nationalId, setNationalId] = useState("");

  const [createClient, { loading: creatingClient }] = useMutation(CREATE_CLIENT);

  useEffect(() => {
    if (whatsappId) {
      setClientWhatsapp(whatsappId);
    }
  }, [whatsappId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await createClient({
        variables: {
          input: {
            firstName,
            lastName,
            address,
            whatsapp: clientWhatsapp,
            nationalId,
            sellerId: "550e8400-e29b-41d4-a716-446655440003", // Default seller ID
          },
        },
      });
      onSuccess("Client registered successfully in CRM!");
      refetchClients();
      setFirstName("");
      setLastName("");
      setAddress("");
      setNationalId("");
    } catch (err: unknown) {
      if (err instanceof Error) {
        onError(err.message || "Failed to register client.");
      } else {
        onError("Failed to register client.");
      }
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="block text-xs font-bold text-stone-600 dark:text-stone-400 uppercase mb-1">
          First Name
        </label>
        <input
          type="text"
          required
          value={firstName}
          onChange={(e) => setFirstName(e.target.value)}
          className="w-full rounded-lg border border-stone-200 dark:border-stone-800 bg-white dark:bg-stone-950 px-3 py-2 text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-emerald-500"
          placeholder="e.g. Juan"
        />
      </div>

      <div>
        <label className="block text-xs font-bold text-stone-600 dark:text-stone-400 uppercase mb-1">
          Last Name
        </label>
        <input
          type="text"
          required
          value={lastName}
          onChange={(e) => setLastName(e.target.value)}
          className="w-full rounded-lg border border-stone-200 dark:border-stone-800 bg-white dark:bg-stone-950 px-3 py-2 text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-emerald-500"
          placeholder="e.g. Pérez"
        />
      </div>

      <div>
        <label className="block text-xs font-bold text-stone-600 dark:text-stone-400 uppercase mb-1">
          WhatsApp / Phone
        </label>
        <input
          type="text"
          required
          value={clientWhatsapp}
          onChange={(e) => setClientWhatsapp(e.target.value)}
          className="w-full rounded-lg border border-stone-200 dark:border-stone-800 bg-stone-50 dark:bg-stone-950 px-3 py-2 text-sm font-semibold text-stone-500 focus:outline-none"
          placeholder="e.g. +584121234567"
        />
      </div>

      <div>
        <label className="block text-xs font-bold text-stone-600 dark:text-stone-400 uppercase mb-1">
          DNI / National ID
        </label>
        <input
          type="text"
          required
          value={nationalId}
          onChange={(e) => setNationalId(e.target.value)}
          className="w-full rounded-lg border border-stone-200 dark:border-stone-800 bg-white dark:bg-stone-950 px-3 py-2 text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-emerald-500"
          placeholder="e.g. V-12345678"
        />
      </div>

      <div>
        <label className="block text-xs font-bold text-stone-600 dark:text-stone-400 uppercase mb-1">
          Address
        </label>
        <textarea
          required
          value={address}
          onChange={(e) => setAddress(e.target.value)}
          rows={3}
          className="w-full rounded-lg border border-stone-200 dark:border-stone-800 bg-white dark:bg-stone-950 p-3 text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-emerald-500"
          placeholder="e.g. Av Francisco de Miranda, Caracas"
        />
      </div>

      <button
        type="submit"
        disabled={creatingClient}
        className="w-full h-11 bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white font-bold rounded-xl text-sm transition-colors flex items-center justify-center gap-2 shadow-xs disabled:opacity-50"
      >
        {creatingClient ? (
          <>
            <Loader2 className="w-4 h-4 animate-spin" />
            Registering...
          </>
        ) : (
          <>
            <UserPlus className="w-4 h-4" />
            Register CRM Client
          </>
        )}
      </button>
    </form>
  );
};
