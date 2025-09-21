from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from typing import Any
from fastapi.responses import JSONResponse
from pydantic import BaseModel
import math

from .models import (
	OptimizeRequest,
	OptimizeResponse,
	SimulateRequest,
	SimulateResponse,
	MetricsResponse,
)
from .algo.optimizer import optimize_schedule
from .algo.conflicts import detect_and_resolve_conflicts
from .algo.simulator import simulate_movements
from .db import init_db, seed_from_csv

app = FastAPI(title="AI Rail Sync Backend", version="0.1.0")

app.add_middleware(
	CORSMiddleware,
    allow_origins=["*"],
	allow_credentials=True,
	allow_methods=["*"],
	allow_headers=["*"],
)


@app.on_event("startup")
async def on_startup() -> None:
	init_db()
	seed_from_csv()


@app.get("/health")
async def health() -> dict:
	return {"status": "ok"}


@app.post("/optimize", response_model=OptimizeResponse)
async def optimize(req: OptimizeRequest) -> Any:
	optimized, conflicts_resolved, objective_value = optimize_schedule(
		[dict(x) for x in req.trains],
		[dict(x) for x in req.schedules],
		[dict(x) for x in req.sections],
		[dict(x) for x in req.stations],
		req.constraints or {},
	)
	optimized, extra_conflicts = detect_and_resolve_conflicts(optimized, [dict(x) for x in req.sections])
	return {
		"optimized_schedule": optimized,
		"conflicts_resolved": conflicts_resolved + extra_conflicts,
		"objective_value": objective_value,
	}


@app.post("/simulate", response_model=SimulateResponse)
async def simulate(req: SimulateRequest) -> Any:
	events, stats = simulate_movements(req.schedule, req.sections, req.seed)
	return {"events": events, "stats": stats}


@app.get("/metrics", response_model=MetricsResponse)
async def metrics() -> Any:
	# placeholder values
	return {
		"throughput_before": 100.0,
		"throughput_after": 115.0,
		"avg_delay_before": 12.0,
		"avg_delay_after": 7.5,
		"utilization_before": 0.62,
		"utilization_after": 0.78,
	}


# ========== Map API: tracks, stations, trains (demo) ==========

class Station(BaseModel):
    id: str
    name: str
    lat: float
    lng: float
    platforms: int

class TrainPosition(BaseModel):
    id: str
    name: str
    lat: float
    lng: float
    speed: float
    heading: float
    status: str

# Static demo data for Gujarat bounds and a few lines
GUJARAT_BOUNDS = {
    "north": 24.5,
    "south": 19.0,
    "east": 77.5,
    "west": 68.5,
}

STATIONS: list[Station] = [
    Station(id="ADI", name="Ahmedabad Junction", lat=23.0225, lng=72.5714, platforms=8),
    Station(id="MSH", name="Mehsana Junction", lat=23.5894, lng=72.3693, platforms=2),
    Station(id="BRC", name="Vadodara Junction", lat=22.3072, lng=73.1812, platforms=6),
]

# Simple linear tracks: Mehsana -> Ahmedabad -> Vadodara
TRACKS = {
    "type": "FeatureCollection",
    "features": [
        {
            "type": "Feature",
            "properties": {"id": "MSH-ADI", "type": "main", "congestion": 0.2},
            "geometry": {
                "type": "LineString",
                "coordinates": [
                    [72.3693, 23.5894],  # Mehsana Junction
                    [72.5714, 23.0225],  # Ahmedabad Junction
                ],
            },
        },
        {
            "type": "Feature",
            "properties": {"id": "ADI-BRC", "type": "electrified", "congestion": 0.3},
            "geometry": {
                "type": "LineString",
                "coordinates": [
                    [72.5714, 23.0225],  # Ahmedabad Junction
                    [73.1812, 22.3072],  # Vadodara Junction
                ],
            },
        },
    ],
}


@app.get("/tracks")
async def get_tracks() -> Any:
    return JSONResponse(TRACKS)


@app.get("/stations")
async def get_stations() -> list[Station]:
    return STATIONS


# Simple parametric motion along MSH-BRC track
def _interpolate(a: tuple[float, float], b: tuple[float, float], t: float) -> tuple[float, float]:
    return (a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t)


@app.get("/conflicts")
async def get_conflicts() -> Any:
    """Get AI-generated conflict predictions"""
    from .algo.conflicts import detect_and_resolve_conflicts
    
    # Sample schedule data for conflict detection
    sample_schedule = [
        {"train_id": "T001", "departure_time": "06:00", "source": "MSH", "destination": "BRC", "section_id": "MSH_BRC", "max_speed_kmph": 130},
        {"train_id": "T002", "departure_time": "06:15", "source": "MSH", "destination": "BRC", "section_id": "MSH_BRC", "max_speed_kmph": 120},
        {"train_id": "T003", "departure_time": "06:30", "source": "MSH", "destination": "BRC", "section_id": "MSH_BRC", "max_speed_kmph": 100},
        {"train_id": "T004", "departure_time": "06:45", "source": "MSH", "destination": "BRC", "section_id": "MSH_BRC", "max_speed_kmph": 95},
        {"train_id": "T005", "departure_time": "07:00", "source": "MSH", "destination": "BRC", "section_id": "MSH_BRC", "max_speed_kmph": 80},
        {"train_id": "T006", "departure_time": "07:15", "source": "MSH", "destination": "BRC", "section_id": "MSH_BRC", "max_speed_kmph": 75},
    ]
    
    sample_sections = [
        {"section_id": "MSH_BRC", "length_km": 85, "capacity_per_hour": 8}
    ]
    
    optimized_schedule, conflicts_resolved = detect_and_resolve_conflicts(sample_schedule, sample_sections)
    
    # Extract conflicts from the optimized schedule
    all_conflicts = []
    for item in optimized_schedule:
        if "conflicts" in item:
            all_conflicts.extend(item["conflicts"])
    
    return {"conflicts": all_conflicts, "total_resolved": conflicts_resolved}


@app.get("/trains")
async def get_trains(t: float = 0.0) -> list[TrainPosition]:
    # Route from Mehsana to Ahmedabad to Vadodara
    path_msh_adi = [
        (72.3693, 23.5894),  # Mehsana Junction
        (72.5714, 23.0225),  # Ahmedabad Junction
    ]
    path_adi_brc = [
        (72.5714, 23.0225),  # Ahmedabad Junction
        (73.1812, 22.3072),  # Vadodara Junction
    ]
    
    # Basic progress from wall-clock
    import time
    prog = (time.time() * 0.01) % 1.0 if t == 0.0 else (t % 1.0)
    
    # 6 sample trains with different positions and speeds
    trains = []
    train_data = [
        {"id": "T001", "name": "Mehsana Express", "speed": 120, "status": "on-time", "route": "MSH-ADI"},
        {"id": "T002", "name": "Ahmedabad-Vadodara Fast", "speed": 110, "status": "on-time", "route": "ADI-BRC"},
        {"id": "T003", "name": "Mehsana Passenger", "speed": 85, "status": "delayed", "route": "MSH-ADI"},
        {"id": "T004", "name": "Local Service", "speed": 75, "status": "on-time", "route": "ADI-BRC"},
        {"id": "T005", "name": "Freight Train", "speed": 60, "status": "delayed", "route": "ADI-BRC"},
        {"id": "T006", "name": "Goods Express", "speed": 55, "status": "on-time", "route": "MSH-ADI"},
    ]
    
    for i, train in enumerate(train_data):
        # Position trains along their respective tracks
        train_progress = (prog + i * 0.15) % 1.0  # Spread trains along the track
        
        if train["route"] == "MSH-ADI":
            path = path_msh_adi
        else:  # ADI-BRC
            path = path_adi_brc
            
        train_lng, train_lat = _interpolate(path[0], path[1], train_progress)
        heading = math.degrees(math.atan2(path[1][0] - path[0][0], path[1][1] - path[0][1]))
        
        trains.append(TrainPosition(
            id=train["id"],
            name=train["name"],
            lat=train_lat,
            lng=train_lng,
            speed=train["speed"],
            heading=heading,
            status=train["status"]
        ))
    
    return trains
