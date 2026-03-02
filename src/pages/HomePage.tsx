import { Link } from 'react-router-dom';
import { Layout } from '../components/Layout';
import { CreateSession } from '../components/CreateSession';
import { JoinSession } from '../components/JoinSession';

interface HomePageProps {
  userName: string;
  onNameChange?: (name: string) => void;
}

export function HomePage({ userName, onNameChange }: HomePageProps) {
  return (
    <Layout title="Poko" userName={userName} onNameChange={onNameChange}>
      <div className="home">
        <p className="home__intro">
          Planning poker pour vos raffinements. Démarrer une session ou rejoindre avec un ID.
        </p>
        <div className="home__actions">
          <CreateSession userName={userName} />
          <div className="home__divider">ou</div>
          <JoinSession userName={userName} />
        </div>
        <p className="home__demo">
          <Link to="/session/demo">Voir un aperçu avec 11 joueurs</Link>
        </p>
      </div>
    </Layout>
  );
}
