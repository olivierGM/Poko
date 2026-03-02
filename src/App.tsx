import { BrowserRouter, Routes, Route, Navigate, useParams } from 'react-router-dom';
import { useUserName } from './hooks/useUserName';
import { NamePrompt } from './components/NamePrompt';
import { HomePage } from './pages/HomePage';
import { SessionPage } from './pages/SessionPage';
import './index.css';

function RedirectSessionToId() {
  const { id } = useParams<{ id: string }>();
  return <Navigate to={id ? `/${id}` : '/'} replace />;
}

function App() {
  const [userName, setUserName, hasChecked] = useUserName();

  if (!hasChecked) {
    return <div className="app-loading">Chargement…</div>;
  }

  if (!userName.trim()) {
    return <NamePrompt onSubmit={setUserName} />;
  }

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<HomePage userName={userName} onNameChange={setUserName} />} />
        <Route path="session" element={<Navigate to="/" replace />} />
        <Route path="session/:id" element={<RedirectSessionToId />} />
        <Route path=":id" element={<SessionPage userName={userName} onNameChange={setUserName} />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
