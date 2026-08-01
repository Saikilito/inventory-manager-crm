import { DEFAULT_ORIGIN_LAT, DEFAULT_ORIGIN_LNG } from "@shared-domain/delivery/delivery-calculator";

export const CUSTOM_ZONE_NAME = "Custom Coordinates";

export interface DeliveryZone {
  name: string;
  lat: number;
  lng: number;
}

export const CARACAS_ZONES: DeliveryZone[] = [
  { name: CUSTOM_ZONE_NAME, lat: DEFAULT_ORIGIN_LAT, lng: DEFAULT_ORIGIN_LNG },
  { name: "Altamira (Close)", lat: 10.496, lng: -66.848 },
  { name: "Las Mercedes (Medium)", lat: 10.484, lng: -66.862 },
  { name: "El Hatillo (Far)", lat: 10.428, lng: -66.825 },
  { name: "Catia", lat: 10.518, lng: -66.945 },
  { name: "Petare", lat: 10.479, lng: -66.795 },
];

export const resolveZoneCoordinates = (
  zoneIndex: number,
  customLat: number,
  customLng: number
): { lat: number; lng: number } => {
  const zone = CARACAS_ZONES[zoneIndex] ?? CARACAS_ZONES[0];
  return zone.name === CUSTOM_ZONE_NAME ? { lat: customLat, lng: customLng } : { lat: zone.lat, lng: zone.lng };
};
