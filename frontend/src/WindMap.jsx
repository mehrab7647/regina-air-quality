import { MapContainer, TileLayer, useMap } from "react-leaflet"
import { useEffect, useRef } from "react"
import "leaflet/dist/leaflet.css"

const REGINA_CENTER = [50.4452, -104.6189]
const REGINA_BOUNDS = [
  [50.395, -104.72],
  [50.500, -104.54]
]

const TILE_URLS = {
  dark: "https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png",
  light: "https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png"
}

const MAP_BG = {
  dark: "#11151C",
  light: "#F6F4EE"
}

// RGB components for building rgba() strings — picked so each
// color reads clearly against its matching basemap.
const PARTICLE_RGB = {
  dark: "217, 164, 64",   // gold, pops against the dark basemap
  light: "47, 111, 168"   // blue, pops against the light basemap
}

function degToCompass(deg) {
  const dirs = ["N", "NE", "E", "SE", "S", "SW", "W", "NW"]
  return dirs[Math.round(deg / 45) % 8]
}

function MapSetup() {
  const map = useMap()
  useEffect(() => {
    map.fitBounds(REGINA_BOUNDS)
    const fix = setTimeout(() => map.invalidateSize(), 200)
    return () => clearTimeout(fix)
  }, [map])
  return null
}

function WindParticles({ speedKmh, directionDeg, colorRgb }) {
  const canvasRef = useRef(null)
  const particlesRef = useRef([])
  const animRef = useRef(null)

  useEffect(() => {
    const canvas = canvasRef.current
    const ctx = canvas.getContext("2d")
    const width = canvas.parentElement.clientWidth
    const height = canvas.parentElement.clientHeight
    canvas.width = width
    canvas.height = height

    const travelBearing = (directionDeg + 180) % 360
    const rad = (travelBearing * Math.PI) / 180
    const dx = Math.sin(rad)
    const dy = -Math.cos(rad)

    const pxSpeed = Math.max(0.4, Math.min(speedKmh * 0.12, 3))
    const PARTICLE_COUNT = 70
    const TRAIL_LENGTH = 10

    particlesRef.current = Array.from({ length: PARTICLE_COUNT }, () => ({
      x: Math.random() * width,
      y: Math.random() * height,
      trail: []
    }))

    function draw() {
      ctx.clearRect(0, 0, width, height)

      particlesRef.current.forEach(p => {
        p.trail.push({ x: p.x, y: p.y })
        if (p.trail.length > TRAIL_LENGTH) p.trail.shift()

        p.x += dx * pxSpeed
        p.y += dy * pxSpeed

        let wrapped = false
        if (p.x < 0) { p.x = width; wrapped = true }
        if (p.x > width) { p.x = 0; wrapped = true }
        if (p.y < 0) { p.y = height; wrapped = true }
        if (p.y > height) { p.y = 0; wrapped = true }
        if (wrapped) p.trail = []

        for (let i = 1; i < p.trail.length; i++) {
          const alpha = (i / p.trail.length) * 0.7
          ctx.beginPath()
          ctx.moveTo(p.trail[i - 1].x, p.trail[i - 1].y)
          ctx.lineTo(p.trail[i].x, p.trail[i].y)
          ctx.strokeStyle = `rgba(${colorRgb}, ${alpha})`
          ctx.lineWidth = 1.5
          ctx.stroke()
        }
      })

      animRef.current = requestAnimationFrame(draw)
    }

    draw()
    return () => cancelAnimationFrame(animRef.current)
  }, [speedKmh, directionDeg, colorRgb])

  return (
    <canvas
      ref={canvasRef}
      style={{
        position: "absolute", top: 0, left: 0,
        width: "100%", height: "100%",
        pointerEvents: "none", zIndex: 400
      }}
    />
  )
}

export default function WindMap({ wind, theme }) {
  const travelBearing = wind ? (wind.direction_deg + 180) % 360 : 0
  const particleColor = PARTICLE_RGB[theme]

  return (
    <div style={{
      position: "relative", width: "100%", height: 380,
      borderRadius: 16, overflow: "hidden",
      border: "1px solid var(--color-border)"
    }}>
      <MapContainer
        center={REGINA_CENTER}
        zoom={11}
        zoomControl={false}
        dragging={false}
        scrollWheelZoom={false}
        doubleClickZoom={false}
        style={{ width: "100%", height: "100%", background: MAP_BG[theme] }}
      >
        <MapSetup />
        <TileLayer
          key={theme}
          url={TILE_URLS[theme]}
          attribution='&copy; OpenStreetMap contributors &copy; CARTO'
        />
      </MapContainer>

      {wind && (
        <WindParticles
          speedKmh={wind.speed_kmh}
          directionDeg={wind.direction_deg}
          colorRgb={particleColor}
        />
      )}

      {wind && (
        <div style={{
          position: "absolute", top: 12, left: 12, zIndex: 500,
          background: "var(--color-badge-bg)", backdropFilter: "blur(6px)",
          padding: "8px 12px", borderRadius: 10,
          display: "flex", alignItems: "center", gap: 8,
          fontSize: 13, color: "var(--color-text-primary)"
        }}>
          <span style={{
            display: "inline-block",
            transform: `rotate(${travelBearing}deg)`,
            color: `rgb(${particleColor})`, fontSize: 16
          }}>↑</span>
          {Math.round(wind.speed_kmh)} km/h · {degToCompass(wind.direction_deg)}
        </div>
      )}
    </div>
  )
}