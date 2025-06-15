import prisma from "../config/db";
import { GOOGLE_MAPS_API_KEY } from "../constants/env";

type GoogleAddressComponent = {
  long_name: string;
  short_name: string;
  types: string[];
};

type GoogleGeocodeResult = {
  address_components: GoogleAddressComponent[];
  geometry: {
    location: {
      lat: number;
      lng: number;
    };
  };
};

const parseGeocodeResponse = (data: {
  status: string;
  results: GoogleGeocodeResult[];
}) => {
  if (data.status !== "OK" || !data.results[0]) {
    return null;
  }
  const result = data.results[0];
  const { address_components } = result;

  const getComponent = (type: string) =>
    address_components.find((c) => c.types.includes(type))?.long_name || null;

  return {
    latitude: result.geometry.location.lat,
    longitude: result.geometry.location.lng,
    name: getComponent("locality"),
    state: getComponent("administrative_area_level_1"),
    country: getComponent("country"),
  };
};

export async function getCityCoordinates(
  location: string
): Promise<{ latitude: number; longitude: number } | null> {
  const isUuid =
    /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/.test(
      location
    );

  if (isUuid) {
    const city = await prisma.city.findUnique({ where: { id: location } });
    return city ? { latitude: city.latitude, longitude: city.longitude } : null;
  }

  const response = await fetch(
    `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(
      location
    )}&key=${GOOGLE_MAPS_API_KEY}`
  );
  const data = await response.json();
  const parsedLocation = parseGeocodeResponse(data);

  if (parsedLocation && parsedLocation.name && parsedLocation.country) {
    let cityInDb = await prisma.city.findFirst({
      where: {
        name: parsedLocation.name,
        country: parsedLocation.country,
        state: parsedLocation.state ?? undefined,
      },
    });

    if (!cityInDb) {
      cityInDb = await prisma.city.create({
        data: {
          name: parsedLocation.name,
          state: parsedLocation.state || "",
          country: parsedLocation.country,
          latitude: parsedLocation.latitude,
          longitude: parsedLocation.longitude,
        },
      });
    }
    return { latitude: cityInDb.latitude, longitude: cityInDb.longitude };
  }

  return null;
}
