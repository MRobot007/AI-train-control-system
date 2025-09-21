from typing import List, Dict, Tuple

# Very simple stub optimizer that sorts trains by priority and departure time.
# Replace with OR-Tools CP-SAT model later.

def optimize_schedule(
	trains: List[Dict],
	schedules: List[Dict],
	sections: List[Dict],
	stations: List[Dict],
	constraints: Dict | None = None,
) -> Tuple[List[Dict], int, float | None]:
	priority_map = {"goods": 1, "passenger": 3, "express": 4}
	train_priority = {t.get("id") or t.get("train_id"): t.get("priority") or priority_map.get(t.get("type"), 2) for t in trains}

	optimized = sorted(
		schedules,
		key=lambda s: (
			-1 * train_priority.get(s.get("train_id"), 1),
			s.get("departure_time", "")
		),
	)
	conflicts_resolved = 0
	objective_value = None
	return optimized, conflicts_resolved, objective_value
