import catchError from "../utils/catchError";
import { GOOGLE_MAPS_API_KEY } from "../constants/env";
import { OK } from "../constants/http";
import prisma from "../config/db";

export const getPlacesHandler = catchError(async (req, res) => {
  const address = req.query.address as string;

  const response = await fetch(
    `https://maps.googleapis.com/maps/api/place/autocomplete/json?input=${address}&key=${GOOGLE_MAPS_API_KEY}`
  );
  const data = await response.json();
  res.status(OK).json(data);
});

export const getCitiesHandler = catchError(async (req, res) => {
  const address = req.query.address as string;
  const cities = await prisma.city.findMany({
    take: 5,
    where: {
      name: address
        ? {
            contains: address,
            mode: "insensitive",
          }
        : {
            in: ["Bengaluru", "Delhi", "Pune", "Mumbai", "Hyderabad"],
          },
    },
    select: {
      id: true,
      name: true,
      state: true,
      country: true,
    },
  });
  res.status(OK).json(cities);
});
