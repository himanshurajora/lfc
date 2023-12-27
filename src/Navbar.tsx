import { Button } from 'primereact/button';
import { useAuth } from './useAuth';
export default function Navbar() {
  const { login, logout, user } = useAuth();

  const renderLoginUI = () => {
    if (!user) return <Button onClick={login}>Login</Button>;

    return <Button onClick={logout}>Logout</Button>;
  };

  return (
    <div className="font-bold min-w-full flex shadow-md border-red-300 justify-between">
      <span className="text-xl p-2">LFC</span>
      {renderLoginUI()}
    </div>
  );
}
