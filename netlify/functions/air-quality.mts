const WEATHER_API = "https://api.weather.gc.ca/collections"
const WIND_API = "https://api.open-meteo.com/v1/forecast"
const REGINA_BBOX = "-104.75,50.35,-104.50,50.55"
const REGINA_LATITUDE = 50.4452
const REGINA_LONGITUDE = -104.6189

type AqhiProperties = {
  aqhi?: number
  observation_datetime?: string
}

type AqhiResponse = {
  features?: Array<{ properties?: AqhiProperties }>
}

function getRisk(aqhi: number) {
  if (aqhi <= 3) return "low"
  if (aqhi <= 6) return "moderate"
  if (aqhi <= 10) return "high"
  return "very_high"
}

function getAdvice(aqhi: number) {
  if (aqhi <= 3) return "Air quality is good. Enjoy your time outside."
  if (aqhi <= 6) return "Moderate risk. Sensitive groups should reduce prolonged outdoor exertion."
  if (aqhi <= 10) return "High risk. Everyone should reduce outdoor activity. Keep windows closed."
  return "Very high risk. Stay indoors. Avoid all outdoor physical activity."
}

async function fetchJson<T>(url: URL): Promise<T> {
  const response = await fetch(url, {
    headers: { accept: "application/json" },
    signal: AbortSignal.timeout(10_000),
  })

  if (!response.ok) {
    throw new Error(`Upstream request failed with status ${response.status}`)
  }

  return response.json() as Promise<T>
}

async function getCurrent() {
  const url = new URL(`${WEATHER_API}/aqhi-observations-realtime/items`)
  url.search = new URLSearchParams({
    f: "json",
    lang: "en",
    bbox: REGINA_BBOX,
    sortby: "-observation_datetime",
    limit: "1",
  }).toString()

  const data = await fetchJson<AqhiResponse>(url)
  const observation = data.features?.[0]?.properties
  const aqhi = observation?.aqhi
  const timestamp = observation?.observation_datetime

  if (typeof aqhi !== "number" || !timestamp) {
    throw new Error("The AQHI feed returned no current observation")
  }

  return {
    aqhi,
    advice: getAdvice(aqhi),
    risk_level: getRisk(aqhi),
    timestamp,
  }
}

async function getHistory() {
  const cutoff = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()
  const url = new URL(`${WEATHER_API}/aqhi-observations-realtime/items`)
  url.search = new URLSearchParams({
    f: "json",
    lang: "en",
    bbox: REGINA_BBOX,
    datetime: `${cutoff}/..`,
    sortby: "observation_datetime",
    limit: "500",
  }).toString()

  const data = await fetchJson<AqhiResponse>(url)

  return (data.features ?? [])
    .map(({ properties }) => ({
      time: properties?.observation_datetime,
      aqhi: properties?.aqhi,
    }))
    .filter(
      (reading): reading is { time: string; aqhi: number } =>
        Boolean(reading.time) && typeof reading.aqhi === "number",
    )
    .slice(-168)
}

async function getWind() {
  const url = new URL(WIND_API)
  url.search = new URLSearchParams({
    latitude: String(REGINA_LATITUDE),
    longitude: String(REGINA_LONGITUDE),
    current: "wind_speed_10m,wind_direction_10m",
    wind_speed_unit: "kmh",
  }).toString()

  const data = await fetchJson<{
    current?: {
      time?: string
      wind_speed_10m?: number
      wind_direction_10m?: number
    }
  }>(url)
  const current = data.current

  if (
    !current?.time ||
    typeof current.wind_speed_10m !== "number" ||
    typeof current.wind_direction_10m !== "number"
  ) {
    throw new Error("The wind feed returned no current observation")
  }

  return {
    speed_kmh: current.wind_speed_10m,
    direction_deg: current.wind_direction_10m,
    timestamp: current.time,
  }
}

export default async function handler(request: Request) {
  if (request.method !== "GET") {
    return Response.json({ error: "Method not allowed" }, { status: 405 })
  }

  const endpoint = new URL(request.url).pathname.split("/").filter(Boolean).at(-1)

  try {
    let data

    if (endpoint === "current") data = await getCurrent()
    else if (endpoint === "history") data = await getHistory()
    else if (endpoint === "wind") data = await getWind()
    else return Response.json({ error: "Not found" }, { status: 404 })

    return Response.json(data, {
      headers: { "cache-control": "public, max-age=300, s-maxage=900" },
    })
  } catch (error) {
    console.error("Air quality function failed", error)
    return Response.json(
      { error: "Live weather data is temporarily unavailable" },
      { status: 502 },
    )
  }
}

export const config = {
  path: "/api/:endpoint",
}

