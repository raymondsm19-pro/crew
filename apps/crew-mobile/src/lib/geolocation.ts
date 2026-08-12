import * as Location from "expo-location";

export type Coords = { lat?: number; lng?: number; accuracy?: number };

/** Best-effort GPS: a weak signal or denied permission must never block a punch. */
export async function readCoords(): Promise<Coords> {
  try {
    const { status } = await Location.requestForegroundPermissionsAsync();
    if (status !== "granted") return {};
    const pos = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.High });
    return { lat: pos.coords.latitude, lng: pos.coords.longitude, accuracy: pos.coords.accuracy ?? undefined };
  } catch {
    return {};
  }
}
