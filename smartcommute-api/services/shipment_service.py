from pathlib import Path
from datetime import datetime
from uuid import uuid4
import json


BASE_DIR = Path(__file__).resolve().parent.parent
DATA_DIR = BASE_DIR / "data"
SHIPMENTS_FILE = DATA_DIR / "shipments.json"


VALID_STATUSES = {
    "Pending",
    "Planned",
    "In Transit",
    "Delivered",
    "Cancelled",
}


def _ensure_storage():
    DATA_DIR.mkdir(parents=True, exist_ok=True)

    if not SHIPMENTS_FILE.exists():
        SHIPMENTS_FILE.write_text(
            "[]",
            encoding="utf-8",
        )


def _load_shipments():
    _ensure_storage()

    try:
        data = json.loads(
            SHIPMENTS_FILE.read_text(
                encoding="utf-8"
            )
        )

        if isinstance(data, list):
            return data

    except (json.JSONDecodeError, OSError):
        pass

    return []


def _save_shipments(shipments):
    _ensure_storage()

    SHIPMENTS_FILE.write_text(
        json.dumps(
            shipments,
            indent=2,
            ensure_ascii=False,
        ),
        encoding="utf-8",
    )


def list_shipments():
    shipments = _load_shipments()

    return sorted(
        shipments,
        key=lambda shipment: shipment.get(
            "created_at",
            "",
        ),
        reverse=True,
    )


def get_shipment(shipment_id: str):
    shipments = _load_shipments()

    for shipment in shipments:
        if shipment["shipment_id"] == shipment_id:
            return shipment

    return None


def create_shipment(
    *,
    origin_name: str,
    origin_latitude: float,
    origin_longitude: float,
    destination_name: str,
    destination_latitude: float,
    destination_longitude: float,
    cargo_weight_kg: float,
    vehicle_type: str,
    notes: str = "",
):
    shipments = _load_shipments()

    now = datetime.now().isoformat()

    shipment = {
        "shipment_id": f"SC-{uuid4().hex[:8].upper()}",
        "origin": {
            "name": origin_name,
            "latitude": origin_latitude,
            "longitude": origin_longitude,
        },
        "destination": {
            "name": destination_name,
            "latitude": destination_latitude,
            "longitude": destination_longitude,
        },
        "cargo_weight_kg": cargo_weight_kg,
        "vehicle_type": vehicle_type,
        "status": "Pending",
        "notes": notes.strip(),
        "created_at": now,
        "updated_at": now,
    }

    shipments.append(shipment)
    _save_shipments(shipments)

    return shipment


def update_shipment(
    shipment_id: str,
    *,
    status: str | None = None,
    notes: str | None = None,
):
    shipments = _load_shipments()

    for shipment in shipments:
        if shipment["shipment_id"] != shipment_id:
            continue

        if status is not None:
            if status not in VALID_STATUSES:
                raise ValueError(
                    f"Invalid shipment status: {status}"
                )

            shipment["status"] = status

        if notes is not None:
            shipment["notes"] = notes.strip()

        shipment["updated_at"] = datetime.now().isoformat()

        _save_shipments(shipments)

        return shipment

    return None


def delete_shipment(shipment_id: str):
    shipments = _load_shipments()

    original_count = len(shipments)

    shipments = [
        shipment
        for shipment in shipments
        if shipment["shipment_id"] != shipment_id
    ]

    if len(shipments) == original_count:
        return False

    _save_shipments(shipments)

    return True