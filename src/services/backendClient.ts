export interface OptimizePayload {
	trains: any[];
	schedules: any[];
	sections: any[];
	stations: any[];
	constraints?: Record<string, any>;
}

const BASE_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:8000';

export async function fetchHealth(): Promise<any> {
	const res = await fetch(`${BASE_URL}/health`);
	return res.json();
}

export async function optimize(payload: OptimizePayload): Promise<any> {
	const res = await fetch(`${BASE_URL}/optimize`, {
		method: 'POST',
		headers: { 'Content-Type': 'application/json' },
		body: JSON.stringify(payload),
	});
	return res.json();
}

export async function simulate(payload: { schedule: any[]; sections: any[]; seed?: number }): Promise<any> {
	const res = await fetch(`${BASE_URL}/simulate`, {
		method: 'POST',
		headers: { 'Content-Type': 'application/json' },
		body: JSON.stringify(payload),
	});
	return res.json();
}

export async function getMetrics(): Promise<any> {
	const res = await fetch(`${BASE_URL}/metrics`);
	return res.json();
}

// Map API types and clients
export type GeoJSONFeatureCollection = {
  type: 'FeatureCollection';
  features: Array<{
    type: 'Feature';
    properties: Record<string, any>;
    geometry: { type: 'LineString'; coordinates: [number, number][] };
  }>;
};

export type StationDTO = { id: string; name: string; lat: number; lng: number; platforms: number };
export type TrainDTO = { id: string; name: string; lat: number; lng: number; speed: number; heading: number; status: string };

export async function getTracks(): Promise<GeoJSONFeatureCollection> {
  const res = await fetch(`${BASE_URL}/tracks`);
  return res.json();
}

export async function getStations(): Promise<StationDTO[]> {
  const res = await fetch(`${BASE_URL}/stations`);
  return res.json();
}

export async function getTrains(): Promise<TrainDTO[]> {
  const res = await fetch(`${BASE_URL}/trains`);
  return res.json();
}

export async function getConflicts(): Promise<{conflicts: any[], total_resolved: number}> {
  const res = await fetch(`${BASE_URL}/conflicts`);
  return res.json();
}
