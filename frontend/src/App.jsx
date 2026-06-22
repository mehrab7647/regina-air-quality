import { useEffect, useState } from "react"
import AQHICard from "./AQHICard"
import HistoryChart from "./HistoryChart"
import WindMap from "./WindMap"

export default function App() {
  const [current, setCurrent] = useState(null)
  const [history, setHistory] = useState([])
  const [wind, setWind] = useState(null)
  const [error, setError] = useState(null)
  const [theme, setTheme] = useState(() => localStorage.getItem("theme") || "dark")

  useEffect(() => {
    document.documentElement.setAttribute("data-theme", theme)
    localStorage.setItem("theme", theme)
  }, [theme])

  useEffect(() => {
    fetch("http://localhost:8000/api/current")
      .then(r => r.json()).then(setCurrent)
      .catch(() => setError("Could not reach backend. Is it running?"))

    fetch("http://localhost:8000/api/history")
      .then(r => r.json()).then(setHistory)

    fetch("http://localhost:8000/api/wind")
      .then(r => r.json()).then(setWind)
  }, [])

  if (error) return <p style={{padding:"2rem", color:"var(--color-high)"}}>{error}</p>
  if (!current) return <p style={{padding:"2rem"}}>Loading...</p>

  return (
    <div style={{maxWidth: 680, margin: "0 auto", padding: "2.5rem 1.5rem"}}>
      <div style={{
        display: "flex", justifyContent: "space-between",
        alignItems: "flex-start", marginBottom: 28
      }}>
        <div>
          <p style={{
            fontSize: 12, letterSpacing: "0.08em", textTransform: "uppercase",
            color: "var(--color-accent-sky)", margin: "0 0 6px"
          }}>
            Live conditions
          </p>
          <h1 className="display" style={{fontSize: 26, fontWeight: 600, margin: 0}}>
            Regina Air Quality
          </h1>
        </div>

        <button
          onClick={() => setTheme(t => t === "dark" ? "light" : "dark")}
          aria-label="Toggle dark and light theme"
          style={{
            display: "flex", alignItems: "center", gap: 6,
            background: "var(--color-surface)",
            border: "1px solid var(--color-border)",
            color: "var(--color-text-primary)",
            borderRadius: 999, padding: "6px 12px",
            fontSize: 13, cursor: "pointer"
          }}
        >
          <span style={{fontSize: 15}}>{theme === "dark" ? "☀️" : "🌙"}</span>
          {theme === "dark" ? "Light" : "Dark"}
        </button>
      </div>

      <AQHICard data={current} />
      <div style={{height: 20}} />
      <WindMap wind={wind} theme={theme} />
      <div style={{height: 20}} />
      <HistoryChart data={history} />
    </div>
  )
}