import { Layout } from '../components/Layout';
import { CreateSession } from '../components/CreateSession';
import { JoinSession } from '../components/JoinSession';

interface HomePageProps {
  userName: string;
}

export function HomePage({ userName }: HomePageProps) {
  return (
    <Layout title="PokoQC">
      <div className="home">
        <p className="home__intro">
          Planning poker pour vos raffinements. Démarrer une session ou rejoindre avec un ID.
        </p>
        <div className="home__actions">
          <CreateSession userName={userName} />
          <div className="home__divider">ou</div>
          <JoinSession userName={userName} />
        </div>
      </div>
    </Layout>
  );
}
