
import "./App.css";

function App() {
  return (
    <div className="app">
      <header className="header">
        <div className="header-left">
          <div className="logo">🚗</div>
          <div>
            <h1>SMART GATE</h1>
            <p>VEHICLE ENTRY & EXIT MANAGEMENT SYSTEM</p>
          </div>
        </div>

        <div className="company">
          <h2>WHEELS INDIA LIMITED</h2>
          <p>WIL</p>
        </div>
      </header>

      <nav className="navbar">
        <a href="#dashboard" className="active">Dashboard</a>
        <a href="#vehicle-entry">Vehicle Entry</a>
        <a href="#vehicle-exit">Vehicle Exit</a>
        <a href="#visitor-entry">Visitor Entry</a>
        <a href="#search">Search</a>
        <a href="#reports">Reports</a>
        <a href="#employee-vehicles">Employee Vehicles</a>
        <a href="#settings">Settings</a>
        <a href="#logout">Logout</a>
      </nav>

      <main className="main-content">
        <h2>Welcome to SMART GATE</h2>
        <p>Digital Vehicle Entry & Exit Management System</p>
        <div className="phase">
          Phase 1 – Digital Vehicle Entry Portal (No Camera / OCR Required)
        </div>
      </main>
    </div>
  );
}

export default App;