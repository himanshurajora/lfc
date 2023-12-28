import { Button } from 'primereact/button';
import { useAuth } from './useAuth';
export default function Navbar() {
  const { login, logout, user, loading } = useAuth();

  const renderLoginUI = () => {
    if (loading) return <Button loading={loading}></Button>;
    if (!user)
      return (
        <Button onClick={login} severity="success">
          Login
        </Button>
      );

    return (
      <Button onClick={logout} severity="warning">
        Logout
      </Button>
    );
  };

  return (
    <div className="font-bold min-w-full flex shadow-md z-20 border-red-300 justify-between px-3 py-2">
      <span className="text-xl p-2">LFC</span>
      {renderLoginUI()}
    </div>
  );
}
