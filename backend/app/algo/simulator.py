from typing import List, Dict, Tuple
import simpy

# Minimal simulation: each schedule entry generates depart/arrive events with fixed durations

def simulate_movements(schedule: List[Dict], sections: List[Dict], seed: int | None = None) -> Tuple[List[Dict], Dict]:
	env = simpy.Environment()
	events: List[Dict] = []

	def process_train(item: Dict):
		train_id = item.get("train_id")
		section_id = (item.get("section_id") or "").split("|")[0]
		start_min = 0
		travel_min = 5
		# depart
		events.append({"t": env.now, "type": "depart", "train_id": train_id, "section": section_id})
		yield env.timeout(travel_min)
		# arrive
		events.append({"t": env.now, "type": "arrive", "train_id": train_id, "section": section_id})

	for item in schedule[:5]:
		env.process(process_train(item))

	env.run()
	stats = {"runtime_s": 0.0, "num_events": len(events)}
	return events, stats
