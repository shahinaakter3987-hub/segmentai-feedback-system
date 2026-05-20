import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { RoleProvider } from './context/RoleContext'
import Sidebar from './components/Sidebar'
import Topbar from './components/Topbar'
import Dashboard from './pages/Dashboard'
import FeedbackIntake from './pages/FeedbackIntake'
import AnalysisResults from './pages/AnalysisResults'
import IssuePriorityBoard from './pages/IssuePriorityBoard'
import TaskTracker from './pages/TaskTracker'
import WeeklySummary from './pages/WeeklySummary'
import AlertsPage from './pages/AlertsPage'
import ManagementFocus from './pages/ManagementFocus'
import SettingsPage from './pages/SettingsPage'

export default function App() {
  return (
    <RoleProvider>
      <BrowserRouter>
        <div className="app-shell">
          <Sidebar />
          <div className="main-content">
            <Topbar />
            <Routes>
              <Route path="/"         element={<Dashboard />} />
              <Route path="/feedback" element={<FeedbackIntake />} />
              <Route path="/analysis" element={<AnalysisResults />} />
              <Route path="/issues"   element={<IssuePriorityBoard />} />
              <Route path="/tasks"    element={<TaskTracker />} />
              <Route path="/weekly"   element={<WeeklySummary />} />
              <Route path="/alerts"   element={<AlertsPage />} />
              <Route path="/focus"    element={<ManagementFocus />} />
              <Route path="/settings" element={<SettingsPage />} />
            </Routes>
          </div>
        </div>
      </BrowserRouter>
    </RoleProvider>
  )
}
