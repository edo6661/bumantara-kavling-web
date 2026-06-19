import { useAuth } from '../context/AuthContext';
import Profile from './Profile';
import AgentProfile from './Agent/AgentProfile';

const ProfilePage = () => {
  const { user } = useAuth();
  if (user?.role === 'AGENT') return <AgentProfile />;
  return <Profile />;
};

export default ProfilePage;
