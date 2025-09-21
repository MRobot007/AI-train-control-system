// Railway Map Service for fetching real railway data
export interface RailwayStation {
  id: string;
  name: string;
  code: string;
  position: { x: number; y: number };
  type: 'junction' | 'terminal' | 'halt';
  platforms: number;
  coordinates: { lat: number; lng: number };
}

export interface RailwayLine {
  id: string;
  name: string;
  type: 'main' | 'branch' | 'electrified';
  stations: string[];
  coordinates: Array<{ lat: number; lng: number }>;
  electrified: boolean;
}

export interface RailwayNetwork {
  stations: RailwayStation[];
  lines: RailwayLine[];
  bounds: {
    north: number;
    south: number;
    east: number;
    west: number;
  };
}

// Convert lat/lng to pixel coordinates for the map
const convertLatLngToPixel = (
  lat: number, 
  lng: number, 
  bounds: { north: number; south: number; east: number; west: number },
  mapSize: { width: number; height: number }
): { x: number; y: number } => {
  const x = ((lng - bounds.west) / (bounds.east - bounds.west)) * mapSize.width;
  const y = ((bounds.north - lat) / (bounds.north - bounds.south)) * mapSize.height;
  return { x, y };
};

// Simplified Railway Network Data - Mehsana to Ahmedabad to Vadodara
const gujaratRailwayData: RailwayNetwork = {
  stations: [
    // Main Route Stations
    { id: 'ST001', name: 'Ahmedabad Junction', code: 'ADI', position: { x: 400, y: 300 }, type: 'junction', platforms: 8, coordinates: { lat: 23.0225, lng: 72.5714 } },
    { id: 'ST002', name: 'Mehsana', code: 'MSH', position: { x: 350, y: 250 }, type: 'halt', platforms: 2, coordinates: { lat: 23.5880, lng: 72.3693 } },
    { id: 'ST003', name: 'Vadodara Junction', code: 'BRC', position: { x: 450, y: 350 }, type: 'junction', platforms: 6, coordinates: { lat: 22.3072, lng: 73.1812 } },
  ],
  lines: [
    {
      id: 'MSH-ADI',
      name: 'Mehsana-Ahmedabad',
      type: 'main',
      stations: ['ST002', 'ST001'],
      coordinates: [
        { lat: 23.5880, lng: 72.3693 }, // Mehsana
        { lat: 23.0225, lng: 72.5714 }  // Ahmedabad
      ],
      electrified: false
    },
    {
      id: 'ADI-BRC',
      name: 'Ahmedabad-Vadodara',
      type: 'main',
      stations: ['ST001', 'ST003'],
      coordinates: [
        { lat: 23.0225, lng: 72.5714 }, // Ahmedabad
        { lat: 22.3072, lng: 73.1812 }  // Vadodara
      ],
      electrified: true
    }
  ],
  bounds: {
    north: 24.5,
    south: 19.0,
    east: 77.5,
    west: 68.5
  }
};

// Service class for railway map operations
export class RailwayMapService {
  private static instance: RailwayMapService;
  private networkData: RailwayNetwork = gujaratRailwayData;

  private constructor() {}

  public static getInstance(): RailwayMapService {
    if (!RailwayMapService.instance) {
      RailwayMapService.instance = new RailwayMapService();
    }
    return RailwayMapService.instance;
  }

  // Get the railway network data
  public getNetworkData(): RailwayNetwork {
    return this.networkData;
  }

  // Get stations with pixel coordinates
  public getStationsWithPixelCoordinates(mapSize: { width: number; height: number }): RailwayStation[] {
    return this.networkData.stations.map(station => ({
      ...station,
      position: convertLatLngToPixel(
        station.coordinates.lat,
        station.coordinates.lng,
        this.networkData.bounds,
        mapSize
      )
    }));
  }

  // Get lines with pixel coordinates
  public getLinesWithPixelCoordinates(mapSize: { width: number; height: number }): RailwayLine[] {
    return this.networkData.lines.map(line => ({
      ...line,
      coordinates: line.coordinates.map(coord => 
        convertLatLngToPixel(
          coord.lat,
          coord.lng,
          this.networkData.bounds,
          mapSize
        )
      )
    }));
  }

  // Search for stations by name or code
  public searchStations(query: string): RailwayStation[] {
    const lowercaseQuery = query.toLowerCase();
    return this.networkData.stations.filter(station =>
      station.name.toLowerCase().includes(lowercaseQuery) ||
      station.code.toLowerCase().includes(lowercaseQuery)
    );
  }

  // Get stations by type
  public getStationsByType(type: 'junction' | 'terminal' | 'halt'): RailwayStation[] {
    return this.networkData.stations.filter(station => station.type === type);
  }

  // Get electrified lines
  public getElectrifiedLines(): RailwayLine[] {
    return this.networkData.lines.filter(line => line.electrified);
  }

  // Get lines by type
  public getLinesByType(type: 'main' | 'branch' | 'electrified'): RailwayLine[] {
    return this.networkData.lines.filter(line => line.type === type);
  }

  // Calculate distance between two stations
  public calculateDistance(station1Id: string, station2Id: string): number {
    const station1 = this.networkData.stations.find(s => s.id === station1Id);
    const station2 = this.networkData.stations.find(s => s.id === station2Id);
    
    if (!station1 || !station2) return 0;

    const R = 6371; // Earth's radius in kilometers
    const dLat = (station2.coordinates.lat - station1.coordinates.lat) * Math.PI / 180;
    const dLng = (station2.coordinates.lng - station1.coordinates.lng) * Math.PI / 180;
    const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
              Math.cos(station1.coordinates.lat * Math.PI / 180) * Math.cos(station2.coordinates.lat * Math.PI / 180) *
              Math.sin(dLng/2) * Math.sin(dLng/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c;
  }

  // Get network statistics
  public getNetworkStats() {
    return {
      totalStations: this.networkData.stations.length,
      totalLines: this.networkData.lines.length,
      electrifiedLines: this.getElectrifiedLines().length,
      junctions: this.getStationsByType('junction').length,
      terminals: this.getStationsByType('terminal').length,
      halts: this.getStationsByType('halt').length,
      totalPlatforms: this.networkData.stations.reduce((sum, station) => sum + station.platforms, 0)
    };
  }
}

// Export singleton instance
export const railwayMapService = RailwayMapService.getInstance();

