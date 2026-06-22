import {
  LineChart, Line, XAxis, YAxis, Tooltip,
  ResponsiveContainer, ReferenceLine
} from "recharts"

export default function HistoryChart({ data }) {
  const formatted = data.map(d => ({
    time: new Date(d.time).toLocaleDateString("en-CA", {
      month: "short", day: "numeric", hour: "2-digit"
    }),
    aqhi: d.aqhi
  }))

  return (
    <div style={{
      background: "var(--color-surface)",
      border: "1px solid var(--color-border)",
      borderRadius: 16, padding: "1.5rem"
    }}>
      <p style={{fontSize:13, color:"var(--color-text-secondary)", margin:"0 0 16px"}}>
        Past 7 days — hourly readings
      </p>
      <ResponsiveContainer width="100%" height={220}>
        <LineChart data={formatted}>
          <XAxis dataKey="time" tick={{fontSize:11, fill:"#8B93A7"}} interval={23} />
          <YAxis domain={[0, 11]} tick={{fontSize:11, fill:"#8B93A7"}} width={24} />
          <Tooltip contentStyle={{background:"var(--color-surface)", border:"1px solid var(--color-border)", color:"var(--color-text-primary)"}} />
          <ReferenceLine y={3} stroke="#3FA796" strokeDasharray="4 4" />
          <ReferenceLine y={6} stroke="#D9A440" strokeDasharray="4 4" />
          <ReferenceLine y={10} stroke="#D9703F" strokeDasharray="4 4" />
          <Line type="monotone" dataKey="aqhi" stroke="#5B9BD5" strokeWidth={2} dot={false} />
        </LineChart>
      </ResponsiveContainer>
    </div>
  )
}