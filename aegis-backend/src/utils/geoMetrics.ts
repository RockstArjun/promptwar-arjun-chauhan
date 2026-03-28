/**
 * Core Geolocation Mathematics Module
 * Computes great-circle distances between points on a sphere.
 * Does not rely on external cloud APIs; executes purely in memory for extreme efficiency.
 */
export class GeoMetrics {
  private static readonly EARTH_RADIUS_KM = 6371;

  /**
   * Calculates the distance between two GPS coordinates using the Haversine formula.
   * O(1) Time Complexity, O(1) Space Complexity. Highly efficient memory execution.
   */
  public static calculateHaversineDistance(
    lat1: number, lon1: number, 
    lat2: number, lon2: number
  ): number {
    const toRadians = (degrees: number) => degrees * (Math.PI / 180);

    const dLat = toRadians(lat2 - lat1);
    const dLon = toRadians(lon2 - lon1);

    const a = 
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(toRadians(lat1)) * Math.cos(toRadians(lat2)) * 
      Math.sin(dLon / 2) * Math.sin(dLon / 2); 

    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a)); 
    return this.EARTH_RADIUS_KM * c;
  }

  /**
   * Generates a deterministic estimated time of arrival (ETA) based on physics parameters.
   */
  public static estimateTransitTimeMinutes(distanceKm: number, averageSpeedKmh: number = 60): number {
    if (distanceKm <= 0) return 0;
    return Math.ceil((distanceKm / averageSpeedKmh) * 60);
  }

  /**
   * Sanitizes coordinate inputs to prevent floating point overflows or invalid ranges.
   */
  public static validateCoordinates(lat: number, lon: number): boolean {
    return (lat >= -90 && lat <= 90) && (lon >= -180 && lon <= 180);
  }
}
