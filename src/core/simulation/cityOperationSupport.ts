import type { CityRole } from "../model/city.js";
import type { NationStrategicStatKey } from "../model/nationStrategicStats.js";

export function getStrategicStatForCityRole(
  role: CityRole,
): NationStrategicStatKey {
  switch (role) {
    case "capital":
      return "stability";
    case "media-hub":
      return "publicSupport";
    case "security-hub":
      return "internalSecurity";
  }
}