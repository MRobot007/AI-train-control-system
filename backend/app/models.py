from __future__ import annotations
from pydantic import BaseModel
from typing import List, Optional

class TrainIn(BaseModel):
	train_id: str
	type: str
	priority: int
	max_speed_kmph: int

class SectionIn(BaseModel):
	section_id: str
	track_id: str
	length_km: float
	capacity_per_hour: int
	maintenance_start: Optional[str] = None
	maintenance_end: Optional[str] = None

class StationIn(BaseModel):
	station_id: str
	name: str
	num_platforms: int
	avg_dwell_min: int

class ScheduleIn(BaseModel):
	train_id: str
	departure_time: str
	source: str
	destination: str
	route: str

class OptimizeRequest(BaseModel):
	trains: List[TrainIn]
	schedules: List[ScheduleIn]
	sections: List[SectionIn]
	stations: List[StationIn]
	constraints: Optional[dict] = None

class OptimizeResponse(BaseModel):
	optimized_schedule: List[dict]
	conflicts_resolved: int
	objective_value: Optional[float] = None

class SimulateRequest(BaseModel):
	schedule: List[dict]
	sections: List[dict]
	seed: Optional[int] = None

class SimulateResponse(BaseModel):
	events: List[dict]
	stats: dict

class MetricsResponse(BaseModel):
	throughput_before: float
	throughput_after: float
	avg_delay_before: float
	avg_delay_after: float
	utilization_before: float
	utilization_after: float
