#!/usr/bin/env python3
import datetime
import json
import os
import sys
from csv import DictReader
from dataclasses import asdict, dataclass


@dataclass
class Day:
    year: int
    month: int
    day: int
    date: str
    avg: float
    high: float
    low: float


@dataclass
class StationData:
    name: str
    temps: list[dict[str | int | float]]


def transform_row(row: dict[str, str]) -> Day:
    year = int(row["Y"])
    month = int(row["M"])
    day = int(row["D"])
    date = datetime.date(year, month, day)
    return Day(
        year=year,
        month=month,
        day=day,
        date=str(date),
        avg=float(row["TAVG"]),
        low=float(row["TMIN"]),
        high=float(row["TMAX"]),
    )


if __name__ == "__main__":
    station_ids = sys.argv[1:]
    if not station_ids:
        print(f"Usage: {sys.argv[0]} <station id> ...")
        sys.exit(1)

    script_directory = os.path.dirname(os.path.realpath(__file__))

    with open(os.path.join(script_directory, "station-ids.txt")) as stations_file:
        station_name_mapping = {}
        for line in stations_file.readlines():
            station_name, station_id = line.strip().split("\t", maxsplit=1)
            if station_id == "-":
                continue
            station_name_mapping[station_id] = station_name

    dataset: dict[str, StationData] = {}
    for station_id in station_ids:
        with open(
            os.path.join(script_directory, "envidata", f"{station_id}.csv")
        ) as csv_file:
            reader = DictReader(csv_file)
            temps: list[dict[str, str | int | float]] = []
            for row in reader:
                transformed = transform_row(row)
                temps.append(asdict(transformed))

            station_data = {
                "name": station_name_mapping[station_id],
                "temps": temps,
            }
            dataset[station_id] = station_data

    json.dump(dataset, sys.stdout, separators=(",", ":"))
