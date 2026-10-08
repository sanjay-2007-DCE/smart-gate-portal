'use client'

import { useEffect, useRef, useState } from 'react'
import {
  ArrowDownLeft,
  ArrowUpRight,
  Bell,
  Car,
  CircleHelp,
  Download,
  FileBarChart,
  FileSearch,
  Gauge,
  LogOut,
  Menu,
  Moon,
  MoreVertical,
  Phone,
  Search as SearchIcon,
  Settings,
  ShieldCheck,
  Sun,
  UserRound,
  X,
} from 'lucide-react'

type Vehicle = {
  id: string
  number: string
  type: string
  owner: string
  department?: string
  company?: string
  inTime: string
  outTime?: string
  savedDate: string
  purpose?: string
  remark?: string
  visitorName?: string
}

const menu = [
  ['Dashboard', Gauge],
  ['Vehicle Entry', ArrowDownLeft],
  ['Vehicle Exit', ArrowUpRight],
  ['Visitor Entry', UserRound],
  ['Search', FileSearch],
  ['Reports', FileBarChart],
  ['Settings', Settings],
] as const

const formatTime = (date = new Date()) =>
  date.toLocaleTimeString('en-IN', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  })

const formatTimeWithSeconds = (date = new Date()) =>
  date.toLocaleTimeString('en-IN', {
    hour: 'numeric',
    minute: '2-digit',
    second: '2-digit',
    hour12: true,
  })

const formatSavedDate = (date = new Date()) =>
  date.toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  })

const minutesBetween = (start: string) => {
  try {
    const [time, period] = start.split(' ')
    const [hour, min] = time.split(':').map(Number)

    const adjHour =
      period === 'PM' && hour !== 12
        ? hour + 12
        : period === 'AM' && hour === 12
          ? 0
          : hour

    const startDate = new Date(
      new Date().toDateString() + ` ${adjHour}:${min}:00`,
    )

    const diff = Math.max(0, Date.now() - startDate.getTime())

    return `${Math.floor(diff / 3600000)}h ${Math.floor(
      (diff % 3600000) / 60000,
    )}m`
  } catch {
    return '—'
  }
}

function MovementCanvas({ count }: { count: number }) {
  const ref = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const canvas = ref.current

    if (!canvas) return

    const context = canvas.getContext('2d')

    if (!context) return

    const width = (canvas.width = canvas.clientWidth * 2)
    const height = (canvas.height = canvas.clientHeight * 2)

    context.scale(2, 2)

    const w = canvas.clientWidth
    const h = canvas.clientHeight

    context.clearRect(0, 0, w, h)

    context.strokeStyle = 'rgba(59, 130, 246, .1)'
    context.lineWidth = 1

    for (let x = 0; x < w; x += 32) {
      context.beginPath()
      context.moveTo(x, 0)
      context.lineTo(x, h)
      context.stroke()
    }

    for (let y = 0; y < h; y += 32) {
      context.beginPath()
      context.moveTo(0, y)
      context.lineTo(w, y)
      context.stroke()
    }

    context.strokeStyle = '#3b82f6'
    context.lineWidth = 2.5

    context.beginPath()

    for (let x = 0; x < w; x += 4) {
      const y =
        h / 2 +
        Math.sin(x / 22 + count) * 15 +
        Math.sin(x / 9) * 4

      if (x === 0) {
        context.moveTo(x, y)
      } else {
        context.lineTo(x, y)
      }
    }

    context.stroke()
  }, [count])

  return (
    <div className="chart-wrap">
      <canvas
        ref={ref}
        className="movement-canvas"
        aria-label="Live vehicle movement chart"
      />

      <div className="chart-legend">
        <span>
          <i className="legend-line" /> Live movement trend
        </span>

        <b>{count} records</b>
      </div>
    </div>
  )
}

function Table({ rows }: { rows: Vehicle[] }) {
  return (
    <div className="table-scroll">
      <table>
        <thead>
          <tr>
            <th>S.No</th>
            <th>Vehicle No</th>
            <th>Type</th>
            <th>Owner / Visitor</th>
            <th>Saved Date</th>
            <th>In Time</th>
            <th>Out Time</th>
            <th>Status</th>
          </tr>
        </thead>

        <tbody>
          {rows.map((row, idx) => (
            <tr
              key={row.id}
              className={row.outTime ? 'row-out' : 'row-in'}
            >
              <td className="serial">{idx + 1}</td>

              <td className="vehicle-number">
                {row.number}
              </td>

              <td>{row.type}</td>

              <td>
                {row.visitorName || row.owner}
              </td>

              <td className="saved-date">
                {row.savedDate}
              </td>

              <td>{row.inTime}</td>

              <td>{row.outTime || '—'}</td>

              <td>
                <span
                  className={`status ${
                    row.outTime ? 'status-out' : 'status-in'
                  }`}
                >
                  <span className="status-dot" />

                  {row.outTime ? 'OUT' : 'IN'}
                </span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

function Entry({
  visitor,
  save,
}: {
  visitor?: boolean
  save: (row: Vehicle) => Promise<void>
}) {
  const [number, setNumber] = useState('')
  const [owner, setOwner] = useState('')
  const [department, setDepartment] = useState('')
  const [company, setCompany] = useState('')
  const [purpose, setPurpose] = useState('')
  const [type, setType] = useState('Car')
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [isSaving, setIsSaving] = useState(false)

  const resetForm = () => {
    setNumber('')
    setOwner('')
    setDepartment('')
    setCompany('')
    setPurpose('')
    setType('Car')
    setErrors({})
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (isSaving) return

    const nextErrors: Record<string, string> = {}

    const cleanNumber = number.trim().toUpperCase()
    const cleanOwner = owner.trim()

    if (!cleanNumber) {
      nextErrors.number = 'Vehicle number is required.'
    } else if (
      !/^[A-Z]{2}\d{1,2}[A-Z]{1,3}\d{3,4}$/.test(
        cleanNumber,
      )
    ) {
      nextErrors.number =
        'Enter a valid number, e.g. TN20AB1234.'
    }

    if (!cleanOwner) {
      nextErrors.owner = visitor
        ? 'Visitor name is required.'
        : 'Employee name is required.'
    }

    if (visitor && !company.trim()) {
      nextErrors.company = 'Company name is required.'
    }

    if (!type) {
      nextErrors.type = 'Select a vehicle type.'
    }

    setErrors(nextErrors)

    if (Object.keys(nextErrors).length > 0) return

    setIsSaving(true)

    try {
      const now = new Date()

      await save({
        id: Date.now().toString(),
        number: cleanNumber,
        type,
        owner: cleanOwner,
        department: !visitor
          ? department
          : undefined,
        company: visitor
          ? company.trim()
          : undefined,
        purpose: purpose.trim(),
        inTime: formatTimeWithSeconds(now),
        savedDate: formatSavedDate(now),
        visitorName: visitor
          ? cleanOwner
          : undefined,
      })

      resetForm()
    } catch (error) {
      setErrors({
        form:
          error instanceof Error
            ? error.message
            : 'Unable to save this record.',
      })
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <section className="form-page">
      <div className="page-header">
        <div>
          <span className="eyebrow">
            GATE OPERATIONS
          </span>

          <h2>
            {visitor
              ? 'Visitor Entry'
              : 'Vehicle Entry'}
          </h2>

          <p>
            {visitor
              ? 'Record visitor details and vehicle information for secure campus access.'
              : 'Record employee vehicle entry with automatic timestamp capture.'}
          </p>
        </div>
      </div>

      <form
        className="panel entry-form"
        onSubmit={handleSubmit}
      >
        <div className="form-grid">
          <label>
            Vehicle number *

            <input
              aria-invalid={Boolean(errors.number)}
              value={number}
              onChange={(e) =>
                setNumber(e.target.value)
              }
              placeholder="TN20AB1234"
            />

            {errors.number && (
              <span
                className="field-error"
                role="alert"
              >
                {errors.number}
              </span>
            )}
          </label>

          <fieldset>
            <legend>Vehicle type *</legend>

            <div className="radio-row">
              {[
                'Car',
                'Bike',
                'Bus',
                'Lorry',
              ].map((option) => (
                <label
                  key={option}
                  className="radio-option"
                >
                  <input
                    type="radio"
                    name="vehicle-type"
                    checked={type === option}
                    onChange={() =>
                      setType(option)
                    }
                  />

                  {option}
                </label>
              ))}
            </div>

            {errors.type && (
              <span
                className="field-error"
                role="alert"
              >
                {errors.type}
              </span>
            )}
          </fieldset>

          <label>
            {visitor
              ? 'Visitor name *'
              : 'Employee name *'}

            <input
              aria-invalid={Boolean(errors.owner)}
              value={owner}
              onChange={(e) =>
                setOwner(e.target.value)
              }
              placeholder="Full name"
            />

            {errors.owner && (
              <span
                className="field-error"
                role="alert"
              >
                {errors.owner}
              </span>
            )}
          </label>

          {visitor ? (
            <label>
              Company name

              <input
                aria-invalid={Boolean(
                  errors.company,
                )}
                value={company}
                onChange={(e) =>
                  setCompany(e.target.value)
                }
                placeholder="Company or organization"
              />

              {errors.company && (
                <span
                  className="field-error"
                  role="alert"
                >
                  {errors.company}
                </span>
              )}
            </label>
          ) : (
            <label>
              Department

              <select
                value={department}
                onChange={(e) =>
                  setDepartment(e.target.value)
                }
              >
                <option value="">
                  Select department
                </option>

                <option value="HR">HR</option>
                <option value="Admin">
                  Admin
                </option>
                <option value="Operations">
                  Operations
                </option>
                <option value="IT">IT</option>
                <option value="Finance">
                  Finance
                </option>
              </select>
            </label>
          )}

          <label className="wide">
            Purpose / Remarks

            <textarea
              value={purpose}
              onChange={(e) =>
                setPurpose(e.target.value)
              }
              placeholder={
                visitor
                  ? 'Reason for visit'
                  : 'Optional note'
              }
              rows={3}
            />
          </label>
        </div>

        {errors.form && (
          <div
            className="field-error form-error"
            role="alert"
          >
            {errors.form}
          </div>
        )}

        <div className="form-actions">
          <button
            type="button"
            className="btn-secondary"
            onClick={resetForm}
          >
            Clear
          </button>

          <button
            type="submit"
            className="btn-primary"
            disabled={isSaving}
            aria-busy={isSaving}
          >
            {isSaving
              ? 'Saving…'
              : `Save ${
                  visitor
                    ? 'Visitor'
                    : 'Entry'
                }`}
          </button>
        </div>
      </form>
    </section>
  )
}

function ExitPage({
  rows,
  leave,
}: {
  rows: Vehicle[]
  leave: (id: string, remark: string) => void
}) {
  const [query, setQuery] = useState('')
  const [remark, setRemark] = useState('')

  const inVehicles = rows.filter(
    (r) => !r.outTime,
  )

  const match = inVehicles.find((row) =>
    row.number
      .toLowerCase()
      .includes(query.toLowerCase()),
  )

  const handleExit = () => {
    if (match) {
      leave(match.id, remark)

      setQuery('')
      setRemark('')
    }
  }

  return (
    <section className="form-page">
      <div className="page-header">
        <div>
          <span className="eyebrow">
            GATE OPERATIONS
          </span>

          <h2>Vehicle Exit</h2>

          <p>
            Search vehicle by number, verify details,
            then mark vehicle as exited with timestamp.
          </p>
        </div>
      </div>

      <div className="panel exit-panel">
        <div className="search-section">
          <label>
            <span className="label-text">
              Search Vehicle Number
            </span>

            <div className="input-with-icon">
              <SearchIcon size={18} />

              <input
                autoFocus
                value={query}
                onChange={(e) =>
                  setQuery(
                    e.target.value.toUpperCase(),
                  )
                }
                placeholder="Enter vehicle number"
              />
            </div>
          </label>

          {match ? (
            <div className="exit-details">
              <div className="details-header">
                <div>
                  <span className="eyebrow">
                    MATCH FOUND
                  </span>

                  <h3>{match.number}</h3>
                </div>

                <span className="status status-in">
                  <span className="status-dot" />
                  IN CAMPUS
                </span>
              </div>

              <div className="details-grid">
                <div className="detail-item">
                  <small>
                    Owner / Visitor
                  </small>

                  <b>
                    {match.visitorName ||
                      match.owner}
                  </b>
                </div>

                <div className="detail-item">
                  <small>
                    Vehicle Type
                  </small>

                  <b>{match.type}</b>
                </div>

                <div className="detail-item">
                  <small>In Time</small>

                  <b>{match.inTime}</b>
                </div>

                <div className="detail-item">
                  <small>
                    Duration Inside
                  </small>

                  <b>
                    {minutesBetween(
                      match.inTime,
                    )}
                  </b>
                </div>
              </div>

              <label>
                Remarks

                <textarea
                  value={remark}
                  onChange={(e) =>
                    setRemark(e.target.value)
                  }
                  placeholder="Optional exit note"
                  rows={2}
                />
              </label>

              <div className="form-actions">
                <button
                  className="btn-secondary"
                  onClick={() => {
                    setQuery('')
                    setRemark('')
                  }}
                >
                  Clear
                </button>

                <button
                  className="btn-primary"
                  onClick={handleExit}
                >
                  Mark Vehicle OUT
                </button>
              </div>
            </div>
          ) : (
            <div className="empty-state">
              <div className="empty-icon">
                <Car size={28} />
              </div>

              <b>
                {query
                  ? 'No vehicle found'
                  : 'Start searching'}
              </b>

              <span>
                {query
                  ? 'Only vehicles currently inside can be exited.'
                  : `${inVehicles.length} vehicles currently inside campus`}
              </span>
            </div>
          )}
        </div>
      </div>
    </section>
  )
}

function PageContent({
  page,
  rows,
  save,
  leave,
  theme,
  setTheme,
}: {
  page: string
  rows: Vehicle[]
  save: (row: Vehicle) => Promise<void>
  leave: (id: string, remark: string) => void
  theme: 'light' | 'dark'
  setTheme: (theme: 'light' | 'dark') => void
}) {
  const [searchQuery, setSearchQuery] =
    useState('')

  const [fromDate, setFromDate] =
    useState('')

  const [toDate, setToDate] =
    useState('')

  if (page === 'Vehicle Entry') {
    return <Entry save={save} />
  }

  if (page === 'Visitor Entry') {
    return <Entry visitor save={save} />
  }

  if (page === 'Vehicle Exit') {
    return (
      <ExitPage
        rows={rows}
        leave={leave}
      />
    )
  }

  if (page === 'Search') {
    const filtered = rows.filter((row) =>
      `${row.number} ${row.owner}`
        .toLowerCase()
        .includes(searchQuery.toLowerCase()),
    )

    return (
      <section className="form-page">
        <div className="page-header">
          <span className="eyebrow">
            OPERATIONS
          </span>

          <h2>Search Vehicles</h2>

          <p>
            Find vehicle records by number or owner
            name.
          </p>
        </div>

        <div className="panel">
          <div className="search-box-main">
            <SearchIcon size={20} />

            <input
              placeholder="Search vehicle number or owner name"
              value={searchQuery}
              onChange={(e) =>
                setSearchQuery(e.target.value)
              }
            />
          </div>

          {filtered.length > 0 ? (
            <Table rows={filtered} />
          ) : (
            <div
              className="empty-state"
              style={{ marginTop: '2rem' }}
            >
              <SearchIcon size={28} />

              <b>
                {searchQuery
                  ? 'No results found'
                  : 'Start searching'}
              </b>

              <span>
                Enter vehicle number or owner name
              </span>
            </div>
          )}
        </div>
      </section>
    )
  }

  if (page === 'Reports') {
    return (
      <section className="form-page">
        <div className="page-header">
          <span className="eyebrow">
            ANALYTICS
          </span>

          <h2>Reports & Export</h2>

          <p>
            Generate and download vehicle movement
            reports in multiple formats.
          </p>
        </div>

        <div className="panel">
          <div className="report-toolbar">
            <div className="date-filters">
              <label>
                From

                <input
                  type="date"
                  value={fromDate}
                  onChange={(e) =>
                    setFromDate(e.target.value)
                  }
                />
              </label>

              <label>
                To

                <input
                  type="date"
                  value={toDate}
                  onChange={(e) =>
                    setToDate(e.target.value)
                  }
                />
              </label>
            </div>

            <div className="export-buttons">
              <button
                className="btn-secondary"
                onClick={() =>
                  alert(
                    'Excel export prepared. Download starting...',
                  )
                }
              >
                <Download size={16} />
                Excel
              </button>

              <button
                className="btn-secondary"
                onClick={() =>
                  alert(
                    'CSV export prepared. Download starting...',
                  )
                }
              >
                <Download size={16} />
                CSV
              </button>

              <button
                className="btn-primary"
                onClick={() =>
                  alert(
                    'PDF export prepared. Download starting...',
                  )
                }
              >
                <Download size={16} />
                PDF
              </button>
            </div>
          </div>

          <Table rows={rows} />
        </div>
      </section>
    )
  }

  if (page === 'Settings') {
    const toggleTheme = (
      t: 'light' | 'dark',
    ) => {
      setTheme(t)
    }

    return (
      <section className="form-page">
        <div className="page-header">
          <span className="eyebrow">
            PREFERENCES
          </span>

          <h2>Settings</h2>

          <p>
            Choose the display style that feels
            comfortable at the gate desk.
          </p>
        </div>

        <div className="settings-grid settings-grid-single">
          <div className="panel setting-card theme-setting-card">
            <div className="setting-heading">
              <div className="setting-icon">
                <Sun size={20} />
              </div>

              <div>
                <h3>Theme preference</h3>

                <p>
                  Switch between a bright daytime
                  workspace and a softer dark workspace.
                </p>
              </div>
            </div>

            <div
              className="theme-toggle"
              role="group"
              aria-label="Theme preference"
            >
              <button
                aria-pressed={
                  theme === 'light'
                }
                className={`theme-btn ${
                  theme === 'light'
                    ? 'active'
                    : ''
                }`}
                onClick={() =>
                  toggleTheme('light')
                }
              >
                <Sun size={18} />
                Light mode
              </button>

              <button
                aria-pressed={
                  theme === 'dark'
                }
                className={`theme-btn ${
                  theme === 'dark'
                    ? 'active'
                    : ''
                }`}
                onClick={() =>
                  toggleTheme('dark')
                }
              >
                <Moon size={18} />
                Dark mode
              </button>
            </div>

            <div className="theme-status">
              <span className="status-dot" />

              {theme === 'dark'
                ? 'Dark theme is active'
                : 'Light theme is active'}
            </div>
          </div>
        </div>
      </section>
    )
  }

  return (
    <section className="dashboard">
      <div className="dashboard-header">
        <div className="greeting-section">
          <h1>
            Welcome to Smart Gate Portal
          </h1>

          <p className="greeting-subtext">
            Wheels India Limited - Vehicle
            Management System
          </p>
        </div>
      </div>

      <div className="stats-grid">
        <div className="stat-card total">
          <div className="stat-icon">
            <Car size={24} />
          </div>

          <div className="stat-content">
            <div className="stat-label">
              Total Vehicles Today
            </div>

            <div className="stat-value">
              {rows.length}
            </div>
          </div>
        </div>

        <div className="stat-card inside">
          <div className="stat-icon">
            <ArrowDownLeft size={24} />
          </div>

          <div className="stat-content">
            <div className="stat-label">
              Currently Inside
            </div>

            <div className="stat-value">
              {
                rows.filter(
                  (r) => !r.outTime,
                ).length
              }
            </div>
          </div>
        </div>

        <div className="stat-card outside">
          <div className="stat-icon">
            <ArrowUpRight size={24} />
          </div>

          <div className="stat-content">
            <div className="stat-label">
              Exited Today
            </div>

            <div className="stat-value">
              {
                rows.filter(
                  (r) => r.outTime,
                ).length
              }
            </div>
          </div>
        </div>

        <div className="stat-card visitors">
          <div className="stat-icon">
            <UserRound size={24} />
          </div>

          <div className="stat-content">
            <div className="stat-label">
              Visitors Today
            </div>

            <div className="stat-value">
              {
                rows.filter(
                  (r) => r.company,
                ).length
              }
            </div>
          </div>
        </div>
      </div>

      <div className="dashboard-grid">
        <div className="panel chart-panel">
          <div className="panel-header">
            <h3>
              Live Vehicle Movement
            </h3>

            <MoreVertical size={18} />
          </div>

          <MovementCanvas
            count={rows.length}
          />
        </div>

        <div className="panel category-panel">
          <div className="panel-header">
            <h3>
              Vehicle Categories
            </h3>

            <MoreVertical size={18} />
          </div>

          <div className="category-list">
            {[
              'Car',
              'Bike',
              'Bus',
              'Lorry',
            ].map((type) => {
              const count =
                rows.filter(
                  (r) => r.type === type,
                ).length

              const percent =
                rows.length > 0
                  ? Math.round(
                      (count /
                        rows.length) *
                        100,
                    )
                  : 0

              return (
                <div
                  key={type}
                  className="category-item"
                >
                  <div className="category-info">
                    <span
                      className={`category-dot cat-${type.toLowerCase()}`}
                    />

                    <span className="category-name">
                      {type}
                    </span>
                  </div>

                  <div className="category-stats">
                    <span className="percent">
                      {percent}%
                    </span>

                    <span className="count">
                      {count}
                    </span>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </div>

      <div className="panel recent-panel">
        <div className="panel-header">
          <h3>
            Recent Vehicle Activities
          </h3>

          <MoreVertical size={18} />
        </div>

        <Table rows={rows.slice(0, 5)} />
      </div>
    </section>
  )
}

function AdminLogin({
  onLogin,
}: {
  onLogin: () => void
}) {
  const [username, setUsername] =
    useState('')

  const [password, setPassword] =
    useState('')

  const [error, setError] =
    useState('')

  const [isSubmitting, setIsSubmitting] =
    useState(false)

  const handleSubmit = (
    event: React.FormEvent,
  ) => {
    event.preventDefault()

    if (isSubmitting) return

    setIsSubmitting(true)

    window.setTimeout(() => {
      if (
        username.trim().toLowerCase() ===
          'admin' &&
        password === 'wil2026'
      ) {
        onLogin()
      } else {
        setError(
          'Invalid admin username or password.',
        )

        setIsSubmitting(false)
      }
    }, 650)
  }

  return (
    <main className="login-screen">
      <div className="login-orbit orbit-one" />
      <div className="login-orbit orbit-two" />

      <section
        className="login-card"
        aria-labelledby="login-title"
      >
        <div className="login-brand">
          <span className="brand-mark">
            <ShieldCheck size={22} />
          </span>

          <div>
            <strong>
              SMART GATE
            </strong>

            <small>
              WHEELS INDIA LIMITED
            </small>
          </div>
        </div>

        <span className="login-eyebrow">
          SECURE ADMIN ACCESS
        </span>

        <h1 id="login-title">
          Welcome back
        </h1>

        <p className="login-copy">
          Sign in to manage vehicle movement
          and gate operations.
        </p>

        <form
          onSubmit={handleSubmit}
          className="login-form"
        >
          <label>
            Admin username

            <input
              autoComplete="username"
              value={username}
              onChange={(event) => {
                setUsername(
                  event.target.value,
                )
                setError('')
              }}
              placeholder="Enter username"
            />
          </label>

          <label>
            Password

            <input
              type="password"
              autoComplete="current-password"
              value={password}
              onChange={(event) => {
                setPassword(
                  event.target.value,
                )
                setError('')
              }}
              placeholder="Enter password"
            />
          </label>

          {error && (
            <p
              className="login-error"
              role="alert"
            >
              {error}
            </p>
          )}

          <button
            type="submit"
            className="login-submit"
            disabled={isSubmitting}
          >
            {isSubmitting
              ? 'Verifying access…'
              : 'Enter dashboard'}

            <span>→</span>
          </button>
        </form>

        <p className="login-footer">
          <ShieldCheck size={14} />
          Admin-only portal · Protected
          workspace
        </p>
      </section>
    </main>
  )
}

function DashboardApp({
  onLogout,
}: {
  onLogout: () => void
}) {
  const [page, setPage] =
    useState('Dashboard')

  const [toast, setToast] =
    useState('')

  const [open, setOpen] =
    useState(false)

  const [rows, setRows] =
    useState<Vehicle[]>([])

  const [isLoadingRows, setIsLoadingRows] =
    useState(true)

  const [currentTime, setCurrentTime] =
    useState('—')

  const [currentDate, setCurrentDate] =
    useState('—')

  const [greeting, setGreeting] =
    useState('GOOD MORNING')

  const [theme, setTheme] =
    useState<'light' | 'dark'>('dark')

  const showToast = (
    message: string,
  ) => {
    setToast(message)

    window.setTimeout(
      () => setToast(''),
      3200,
    )
  }

  useEffect(() => {
    let cancelled = false

    fetch('/api/vehicles')
      .then((response) => {
        if (!response.ok) {
          throw new Error(
            'Unable to load vehicle records',
          )
        }

        return response.json()
      })
      .then((records: Vehicle[]) => {
        if (!cancelled) {
          setRows(records)
        }
      })
      .catch(() => {
        if (!cancelled) {
          showToast(
            'Unable to load saved vehicle records',
          )
        }
      })
      .finally(() => {
        if (!cancelled) {
          setIsLoadingRows(false)
        }
      })

    const updateClock = () => {
      const now = new Date()

      setCurrentTime(
        formatTime(now),
      )

      setCurrentDate(
        now.toLocaleDateString(
          'en-IN',
          {
            dateStyle: 'full',
          },
        ),
      )

      const hour = now.getHours()

      setGreeting(
        hour < 12
          ? 'GOOD MORNING'
          : hour < 17
            ? 'GOOD AFTERNOON'
            : 'GOOD EVENING',
      )
    }

    updateClock()

    const interval =
      window.setInterval(
        updateClock,
        30000,
      )

    return () =>
      window.clearInterval(interval)
  }, [])

  const save = async (
    row: Vehicle,
  ) => {
    const response =
      await fetch('/api/vehicles', {
        method: 'POST',
        headers: {
          'Content-Type':
            'application/json',
        },
        body: JSON.stringify(row),
      })

    if (!response.ok) {
      const result =
        await response
          .json()
          .catch(() => null)

      throw new Error(
        result?.error ||
          'Unable to save vehicle record',
      )
    }

    const saved =
      (await response.json()) as Vehicle

    setRows((current) => [
      saved,
      ...current,
    ])

    showToast(
      `${
        row.visitorName
          ? 'Visitor'
          : 'Vehicle'
      } entry saved successfully`,
    )
  }

  const leave = async (
    id: string,
    remark: string,
  ) => {
    const response =
      await fetch('/api/vehicles', {
        method: 'PATCH',
        headers: {
          'Content-Type':
            'application/json',
        },
        body: JSON.stringify({
          id,
          remark,
        }),
      })

    if (!response.ok) {
      const result =
        await response
          .json()
          .catch(() => null)

      showToast(
        result?.error ||
          'Unable to save vehicle exit',
      )

      return
    }

    const exited =
      (await response.json()) as Vehicle

    setRows((current) =>
      current.map((row) =>
        row.id === id
          ? exited
          : row,
      ),
    )

    showToast(
      'Vehicle exit saved successfully',
    )
  }

  return (
    <div
      className="app-shell"
      data-theme={theme}
    >
      <aside
        className={`sidebar ${
          open ? 'open' : ''
        }`}
      >
        <div className="brand">
          <span className="brand-mark">
            <ShieldCheck size={22} />
          </span>

          <div>
            <strong>
              SMART GATE
            </strong>

            <small>
              WHEELS INDIA LIMITED
            </small>
          </div>

          <button
            className="mobile-close"
            onClick={() =>
              setOpen(false)
            }
          >
            <X size={19} />
          </button>
        </div>

        <div className="sidebar-label">
          MAIN MENU
        </div>

        <nav>
          {menu.map(
            ([label, Icon]) => (
              <button
                key={label}
                className={`nav-btn ${
                  page === label
                    ? 'active'
                    : ''
                }`}
                onClick={() => {
                  setPage(label)
                  setOpen(false)
                }}
              >
                <Icon size={18} />

                <span>
                  {label}
                </span>
              </button>
            ),
          )}
        </nav>

        <div className="sidebar-bottom">
          <div className="help-card">
            <CircleHelp size={20} />

            <div>
              <b>Need help?</b>

              <span>
                Contact support
              </span>
            </div>

            <div className="help-contact">
              <a href="tel:+919876543210">
                <Phone size={16} />
              </a>

              <a href="mailto:support@smartgate.com">
                <span>✉️</span>
              </a>
            </div>
          </div>

          <button
            className="logout"
            onClick={onLogout}
          >
            <LogOut size={18} />
            Logout
          </button>
        </div>
      </aside>

      {toast && (
        <div
          className="save-toast"
          role="status"
        >
          <span className="toast-check">
            ✓
          </span>

          <div>
            <strong>
              {toast}
            </strong>

            <small>
              Saved on{' '}
              {formatSavedDate()}
            </small>
          </div>
        </div>
      )}

      <main className="main-area">
        <header className="topbar">
          <button
            className="menu-button"
            onClick={() =>
              setOpen(true)
            }
          >
            <Menu size={21} />
          </button>

          <div className="breadcrumb">
            <span>
              Smart Gate
            </span>

            <span>/</span>

            <b>{page}</b>
          </div>

          <div className="topbar-right">
            <div className="time-display">
              <span className="time-value">
                {currentTime}
              </span>

              <span className="date-value">
                {currentDate}
              </span>
            </div>

            <button className="icon-button">
              <Bell size={20} />
            </button>

            <div className="user-profile">
              <div className="user-avatar">
                SJ
              </div>

              <div className="user-info">
                <div className="user-name">
                  Sanjay V
                </div>

                <div className="user-dept">
                  HR Department
                </div>
              </div>
            </div>
          </div>
        </header>

        <div className="banner">
          <div className="banner-content">
            <span className="banner-greeting">
              {greeting}
            </span>

            <span className="banner-text">
              Gate Team
            </span>
          </div>
        </div>

        <div className="page-container">
          <PageContent
            page={page}
            rows={rows}
            save={save}
            leave={leave}
            theme={theme}
            setTheme={setTheme}
          />
        </div>
      </main>
    </div>
  )
}

export default function Page() {
  const [
    isAuthenticated,
    setIsAuthenticated,
  ] = useState(false)

  return isAuthenticated ? (
    <DashboardApp
      onLogout={() =>
        setIsAuthenticated(false)
      }
    />
  ) : (
    <AdminLogin
      onLogin={() =>
        setIsAuthenticated(true)
      }
    />
  )
}