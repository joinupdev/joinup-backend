import catchError from "../utils/catchError";
import { GOOGLE_MAPS_API_KEY } from "../constants/env";
import { OK } from "../constants/http";

export const getPlacesHandler = catchError(async (req, res) => {
  const address = req.query.address as string;

  const response = await fetch(
    `https://maps.googleapis.com/maps/api/place/autocomplete/json?input=${address}&key=${GOOGLE_MAPS_API_KEY}`
  );
  const data = await response.json();
  res.status(OK).json(data);
});
