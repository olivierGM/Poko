import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { useUserName } from './hooks/useUserName';
import { NamePrompt } from './components/NamePrompt';
import { HomePage } from './pages/HomePage';
import { SessionPage } from './pages/SessionPage';
import './index.css';

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
        <Route path="/" element={<HomePage userName={userName} />} />
        <Route path="/session/:id" element={<SessionPage userName={userName} />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
