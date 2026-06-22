from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
import httpx
import sqlite3
from datetime import datetime, timedelta

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],
    allow_methods=["*"],
    allow_headers=["*"],
)

GOV_API = "https://api.weather.gc.ca/collections"
REGINA_BBOX = "-104.75,50.35,-104.50,50.55"
REGINA_LAT = 50.4452
REGINA_LON = -104.6189
DB_PATH = "history.db"


# ---------- Local history logging (SQLite) ----------

def init_db():
    conn = sqlite3.connect(DB_PATH)
    conn.execute("""
        CREATE TABLE IF NOT EXISTS readings (
            timestamp TEXT PRIMARY KEY,
            aqhi REAL
        )
    """)
    conn.commit()
    conn.close()

init_db()

def log_reading(timestamp: str, aqhi: float):
    conn = sqlite3.connect(DB_PATH)
    conn.execute(
        "INSERT OR IGNORE INTO readings (timestamp, aqhi) VALUES (?, ?)",
        (timestamp, aqhi)
    )
    conn.commit()
    conn.close()

def get_logged_readings():
    conn = sqlite3.connect(DB_PATH)
    cur = conn.execute("SELECT timestamp, aqhi FROM readings ORDER BY timestamp ASC")
    rows = cur.fetchall()
    conn.close()
    return [{"time": r[0], "aqhi": r[1]} for r in rows]


# ---------- AQHI endpoints ----------

@app.get("/api/current")
async def get_current():
    async with httpx.AsyncClient() as client:
        r = await client.get(
            f"{GOV_API}/aqhi-observations-realtime/items",
            params={
                "f": "json", "lang": "en",
                "bbox": REGINA_BBOX,
                "sortby": "-observation_datetime",
                "limit": 1
            }
        )
    data = r.json()
    feature = data["features"][0]["properties"]
    aqhi = feature["aqhi"]
    timestamp = feature["observation_datetime"]

    log_reading(timestamp, aqhi)

    return {
        "aqhi": aqhi,
        "advice": get_advice(aqhi),
        "risk_level": get_risk(aqhi),
        "timestamp": timestamp
    }


@app.get("/api/history")
async def get_history():
    cutoff = (datetime.utcnow() - timedelta(days=7)).strftime("%Y-%m-%dT%H:%M:%SZ")

    async with httpx.AsyncClient() as client:
        r = await client.get(
            f"{GOV_API}/aqhi-observations-realtime/items",
            params={
                "f": "json", "lang": "en",
                "bbox": REGINA_BBOX,
                "datetime": f"{cutoff}/..",
                "sortby": "observation_datetime",
                "limit": 500
            }
        )
    data = r.json()
    remote_points = [
        {"time": f["properties"]["observation_datetime"], "aqhi": f["properties"]["aqhi"]}
        for f in data.get("features", [])
    ]

    merged = {p["time"]: p["aqhi"] for p in remote_points}
    for p in get_logged_readings():
        merged.setdefault(p["time"], p["aqhi"])

    sorted_times = sorted(merged.keys())
    return [{"time": t, "aqhi": merged[t]} for t in sorted_times[-168:]]


def get_risk(aqhi):
    if aqhi <= 3: return "low"
    elif aqhi <= 6: return "moderate"
    elif aqhi <= 10: return "high"
    else: return "very_high"


def get_advice(aqhi):
    if aqhi <= 3:
        return "Air quality is good. Enjoy your time outside."
    elif aqhi <= 6:
        return "Moderate risk. Sensitive groups should reduce prolonged outdoor exertion."
    elif aqhi <= 10:
        return "High risk. Everyone should reduce outdoor activity. Keep windows closed."
    else:
        return "Very high risk. Stay indoors. Avoid all outdoor physical activity."


# ---------- Wind endpoint ----------

@app.get("/api/wind")
async def get_wind():
    async with httpx.AsyncClient() as client:
        r = await client.get(
            "https://api.open-meteo.com/v1/forecast",
            params={
                "latitude": REGINA_LAT,
                "longitude": REGINA_LON,
                "current_weather": "true",
                "wind_speed_unit": "kmh"
            }
        )
    data = r.json()["current_weather"]
    return {
        "speed_kmh": data["windspeed"],
        "direction_deg": data["winddirection"],
        "timestamp": data["time"]
    }