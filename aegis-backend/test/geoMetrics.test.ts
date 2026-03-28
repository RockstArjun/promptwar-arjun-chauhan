import { GeoMetrics } from "../src/utils/geoMetrics.js";

describe("GeoMetrics Mathematical Utilities", () => {
  test("EFFICIENCY: Haversine distance between New York and London should be roughly accurate", () => {
    // New York: 40.7128N, 74.0060W
    // London: 51.5074N, 0.1278W
    const distance = GeoMetrics.calculateHaversineDistance(
      40.7128, -74.0060, 
      51.5074, -0.1278
    );
    // Rough great-circle distance is ~5570 km
    expect(distance).toBeGreaterThan(5500);
    expect(distance).toBeLessThan(5650);
  });

  test("EFFICIENCY: Distance between identical points should be exactly 0", () => {
    const distance = GeoMetrics.calculateHaversineDistance(
      34.0522, -118.2437, 
      34.0522, -118.2437
    );
    expect(distance).toBe(0);
  });

  test("EFFICIENCY: Transit ETA calculation logic scales properly", () => {
    // 60 km at 60kmh should be 60 mins
    expect(GeoMetrics.estimateTransitTimeMinutes(60, 60)).toBe(60);
    // 10 km at 120kmh should be 5 mins
    expect(GeoMetrics.estimateTransitTimeMinutes(10, 120)).toBe(5);
    // 0 km should be 0 mins
    expect(GeoMetrics.estimateTransitTimeMinutes(0, 60)).toBe(0);
  });

  test("CODE QUALITY: Geolocation coordinate bounds validation", () => {
    expect(GeoMetrics.validateCoordinates(90, 180)).toBe(true);
    expect(GeoMetrics.validateCoordinates(-90, -180)).toBe(true);
    // Invalid overlaps
    expect(GeoMetrics.validateCoordinates(91, 0)).toBe(false);
    expect(GeoMetrics.validateCoordinates(0, 181)).toBe(false);
    expect(GeoMetrics.validateCoordinates(-91, -181)).toBe(false);
  });
});
