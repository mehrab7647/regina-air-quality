const colors = {
  low: "var(--color-low)",
  moderate: "var(--color-moderate)",
  high: "var(--color-high)",
  very_high: "var(--color-very-high)"
}

const labels = {
  low: "LOW RISK",
  moderate: "MODERATE RISK",
  high: "HIGH RISK",
  very_high: "VERY HIGH RISK"
}

export default function AQHICard({ data }) {
  const color = colors[data.risk_level]
  const label = labels[data.risk_level]

  return (
    <div style={{
      background: "var(--color-surface)",
      border: "1px solid var(--color-border)",
      borderRadius: 16, padding: "1.5rem"
    }}>
      <p style={{fontSize: 13, color: "var(--color-text-secondary)", margin: "0 0 8px"}}>
        Last updated: {new Date(data.timestamp).toLocaleString()}
      </p>
      <div style={{display:"flex", alignItems:"center", gap:16, marginBottom:16}}>
        <span className="display" style={{fontSize:64, fontWeight:600, color, lineHeight:1}}>
          {data.aqhi}
        </span>
        <div>
          <span style={{
            display:"inline-block", fontSize:12,
            padding:"4px 10px", background: color + "22",
            color, borderRadius:6, fontWeight:600, marginBottom:6
          }}>
            {label}
          </span>
          <p style={{fontSize:14, color:"var(--color-text-primary)", margin:0}}>
            {data.advice}
          </p>
        </div>
      </div>
      <p style={{fontSize:12, color:"var(--color-text-secondary)", margin:0}}>
        Scale: 1–3 Low · 4–6 Moderate · 7–10 High · 10+ Very High
      </p>
    </div>
  )
}