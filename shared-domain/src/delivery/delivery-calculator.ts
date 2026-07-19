export const toRad = (value: number): number => (value * Math.PI) / 180;

export const calculateDistance = (
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number => {
  const R = 6371; // Earth's radius in km
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) *
      Math.cos(toRad(lat2)) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);

  const c = 2 * Math.asin(Math.sqrt(a));
  return R * c;
};

export const DEFAULT_ORIGIN_LAT = 10.4806;
export const DEFAULT_ORIGIN_LNG = -66.9036;

export const calculateDeliveryFee = (
  lat: number,
  lng: number,
  originLat: number = DEFAULT_ORIGIN_LAT,
  originLng: number = DEFAULT_ORIGIN_LNG
): number => {
  const distance = calculateDistance(originLat, originLng, lat, lng);
  const baseFee = 2.0;
  if (distance <= 3.0) {
    return baseFee;
  }

  const additionalDistance = distance - 3.0;
  const surcharge = Math.ceil(additionalDistance / 1.5) * 1.0;
  return baseFee + surcharge;
};
