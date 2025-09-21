from __future__ import annotations
from typing import Optional
from sqlmodel import SQLModel, Field, create_engine, Session
import csv
import os

DB_URL = os.getenv("RAILSYNC_DB_URL", "sqlite:///./railsync.db")
engine = create_engine(DB_URL, echo=False)


class Train(SQLModel, table=True):
	id: Optional[int] = Field(default=None, primary_key=True)
	train_id: str
	type: str
	priority: int
	max_speed_kmph: int


def init_db() -> None:
	SQLModel.metadata.create_all(engine)


def seed_from_csv() -> None:
	init_db()
	with Session(engine) as session:
		trains_path = "data/trains.csv"
		if os.path.exists(trains_path):
			with open(trains_path, newline="") as f:
				reader = csv.DictReader(f)
				for row in reader:
					train = Train(
						train_id=row["train_id"],
						type=row["type"],
						priority=int(row["priority"]),
						max_speed_kmph=int(row["max_speed_kmph"]),
					)
					session.add(train)
			session.commit()
