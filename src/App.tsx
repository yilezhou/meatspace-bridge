import { BrowserRouter as Router, Routes, Route, Navigate, useParams } from 'react-router-dom';
import Dashboard from './pages/Dashboard';
import { CreateTaskForm } from './components/features/tasks/CreateTaskForm';
import { EvidenceUploader } from './components/features/evidence/EvidenceUploader';

const TaskSubmitPage = () => {
  const { id } = useParams<{ id: string }>();
  return (
    <div className="p-8 max-w-2xl mx-auto">
      <h1 className="text-2xl font-bold mb-6 text-slate-900">Task Submission</h1>
      <EvidenceUploader taskId={id || ''} />
    </div>
  );
};

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/tasks/new" element={<div className="p-8 bg-slate-50 min-h-screen"><CreateTaskForm /></div>} />
        <Route path="/tasks/:id/submit" element={<TaskSubmitPage />} />
        <Route path="/" element={<Navigate to="/dashboard" replace />} />
      </Routes>
    </Router>
  );
}

export default App;
