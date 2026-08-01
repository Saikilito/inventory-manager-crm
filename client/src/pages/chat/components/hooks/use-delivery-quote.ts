import { useEffect, useMemo, useState } from "react";
import { calculateDeliveryFee, DEFAULT_ORIGIN_LAT, DEFAULT_ORIGIN_LNG } from "@shared-domain/delivery/delivery-calculator";
import { DeliveryMethod } from "@shared-domain/delivery/delivery.entity";
import { resolveZoneCoordinates } from "../../action-panel/delivery-zones";

const INITIAL_ZONE_INDEX = 0;

export interface DeliveryQuote {
  deliveryType: DeliveryMethod;
  setDeliveryType: (type: DeliveryMethod) => void;
  selectedZoneIndex: number;
  setSelectedZoneIndex: (index: number) => void;
  customLat: number;
  setCustomLat: (lat: number) => void;
  customLng: number;
  setCustomLng: (lng: number) => void;
  deliveryAddress: string;
  setDeliveryAddress: (address: string) => void;
  deliveryCost: number;
  resolvedDeliveryAddress: string | undefined;
}

export const useDeliveryQuote = (seedAddress: string): DeliveryQuote => {
  const [deliveryType, setDeliveryType] = useState<DeliveryMethod>(DeliveryMethod.PICKUP);
  const [selectedZoneIndex, setSelectedZoneIndex] = useState(INITIAL_ZONE_INDEX);
  const [customLat, setCustomLat] = useState(DEFAULT_ORIGIN_LAT);
  const [customLng, setCustomLng] = useState(DEFAULT_ORIGIN_LNG);
  const [deliveryAddress, setDeliveryAddress] = useState("");

  useEffect(() => {
    if (deliveryAddress === "" && seedAddress) {
      setDeliveryAddress(seedAddress);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [seedAddress]);

  const deliveryCost = useMemo(() => {
    if (deliveryType !== DeliveryMethod.DELIVERY) return 0;
    const { lat, lng } = resolveZoneCoordinates(selectedZoneIndex, customLat, customLng);
    return calculateDeliveryFee(lat, lng);
  }, [deliveryType, selectedZoneIndex, customLat, customLng]);

  const resolvedDeliveryAddress = deliveryType === DeliveryMethod.DELIVERY ? deliveryAddress : undefined;

  return useMemo(
    () => ({
      deliveryType,
      setDeliveryType,
      selectedZoneIndex,
      setSelectedZoneIndex,
      customLat,
      setCustomLat,
      customLng,
      setCustomLng,
      deliveryAddress,
      setDeliveryAddress,
      deliveryCost,
      resolvedDeliveryAddress,
    }),
    [deliveryType, selectedZoneIndex, customLat, customLng, deliveryAddress, deliveryCost, resolvedDeliveryAddress]
  );
};
