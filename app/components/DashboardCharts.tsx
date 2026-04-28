'use client'

import { Bar, Doughnut, Line } from 'react-chartjs-2'
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  LineElement,
  PointElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
  Filler,
} from 'chart.js'

ChartJS.register(CategoryScale, LinearScale, BarElement, LineElement, PointElement, ArcElement, Title, Tooltip, Legend, Filler)

type TicketBase = { categoria: string; zona: string; creadoEn: string; cerradoEn?: string | null }

const MONTHS_ES = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic']
const CAT_COLORS = ['#D4A017', '#22c55e', '#3b82f6', '#ef4444', '#8b5cf6', '#f97316', '#06b6d4']

function getLastMonths(n: number): string[] {
  const months: string[] = []
  const now = new Date()
  for (let i = n - 1; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1)
    months.push(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`)
  }
  return months
}

function monthLabel(m: string) {
  return MONTHS_ES[parseInt(m.split('-')[1]) - 1]
}

function NoData() {
  return <div className="h-full flex items-center justify-center text-sm text-gray-400">Sin datos suficientes</div>
}

export function BarMonthChart({ tickets }: { tickets: TicketBase[] }) {
  const months = getLastMonths(6)
  const labels = months.map(monthLabel)
  const created = months.map((m) => tickets.filter((t) => t.creadoEn.slice(0, 7) === m).length)
  const closed = months.map((m) => tickets.filter((t) => t.cerradoEn?.slice(0, 7) === m).length)
  if (!created.some(Boolean) && !closed.some(Boolean)) return <NoData />
  return (
    <Bar
      data={{
        labels,
        datasets: [
          { label: 'Abiertas', data: created, backgroundColor: 'rgba(212,160,23,0.82)', borderRadius: 5, borderSkipped: false },
          { label: 'Cerradas', data: closed, backgroundColor: 'rgba(34,197,94,0.82)', borderRadius: 5, borderSkipped: false },
        ],
      }}
      options={{
        responsive: true, maintainAspectRatio: false,
        plugins: { legend: { position: 'bottom', labels: { font: { size: 11 }, boxWidth: 12, padding: 12 } } },
        scales: {
          y: { beginAtZero: true, ticks: { stepSize: 1, font: { size: 10 } }, grid: { color: 'rgba(0,0,0,0.05)' } },
          x: { ticks: { font: { size: 10 } }, grid: { display: false } },
        },
      }}
    />
  )
}

export function DonutCategoryChart({ tickets }: { tickets: TicketBase[] }) {
  const cats: Record<string, number> = {}
  tickets.forEach((t) => { cats[t.categoria] = (cats[t.categoria] || 0) + 1 })
  const labels = Object.keys(cats)
  const values = Object.values(cats)
  if (!labels.length) return <NoData />
  return (
    <Doughnut
      data={{
        labels,
        datasets: [{ data: values, backgroundColor: CAT_COLORS.slice(0, labels.length), borderWidth: 2, borderColor: '#fff', hoverBorderWidth: 3 }],
      }}
      options={{
        responsive: true, maintainAspectRatio: false, cutout: '62%',
        plugins: { legend: { position: 'right', labels: { font: { size: 10 }, boxWidth: 12, padding: 8 } } },
      }}
    />
  )
}

export function LineResolutionChart({ tickets }: { tickets: TicketBase[] }) {
  const months = getLastMonths(6)
  const labels = months.map(monthLabel)
  const avgDays = months.map((m) => {
    const closed = tickets.filter((t) => t.cerradoEn?.slice(0, 7) === m)
    if (!closed.length) return null
    const total = closed.reduce((acc, t) => acc + (new Date(t.cerradoEn!).getTime() - new Date(t.creadoEn).getTime()) / 86400000, 0)
    return Math.round(total / closed.length)
  })
  if (!avgDays.some((d) => d !== null)) return <NoData />
  return (
    <Line
      data={{
        labels,
        datasets: [{
          label: 'Días medio resolución',
          data: avgDays,
          borderColor: '#D4A017',
          backgroundColor: 'rgba(212,160,23,0.12)',
          borderWidth: 2.5,
          pointRadius: 5,
          pointBackgroundColor: '#D4A017',
          pointBorderColor: '#fff',
          pointBorderWidth: 2,
          fill: true,
          tension: 0.35,
          spanGaps: true,
        }],
      }}
      options={{
        responsive: true, maintainAspectRatio: false,
        plugins: { legend: { display: false } },
        scales: {
          y: { beginAtZero: true, ticks: { font: { size: 10 } }, grid: { color: 'rgba(0,0,0,0.05)' } },
          x: { ticks: { font: { size: 10 } }, grid: { display: false } },
        },
      }}
    />
  )
}

export function HBarZoneChart({ tickets }: { tickets: TicketBase[] }) {
  const zones: Record<string, number> = {}
  tickets.forEach((t) => { zones[t.zona] = (zones[t.zona] || 0) + 1 })
  const sorted = Object.entries(zones).sort((a, b) => b[1] - a[1]).slice(0, 8)
  if (!sorted.length) return <NoData />
  return (
    <Bar
      data={{
        labels: sorted.map((z) => z[0]),
        datasets: [{ label: 'Incidencias', data: sorted.map((z) => z[1]), backgroundColor: 'rgba(212,160,23,0.82)', borderRadius: 4, borderSkipped: false }],
      }}
      options={{
        indexAxis: 'y',
        responsive: true, maintainAspectRatio: false,
        plugins: { legend: { display: false } },
        scales: {
          x: { beginAtZero: true, ticks: { stepSize: 1, font: { size: 10 } }, grid: { color: 'rgba(0,0,0,0.05)' } },
          y: { ticks: { font: { size: 10 } }, grid: { display: false } },
        },
      }}
    />
  )
}
