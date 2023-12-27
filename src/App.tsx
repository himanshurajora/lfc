import './App.css';
import { AuthContext } from './AuthContext';
import Navbar from './Navbar';
import { useUserState } from './useUserState';

function App() {
  const { user, setUser, loading, setLoading } = useUserState();

  return (
    <>
      <AuthContext.Provider value={{ user, setUser, loading, setLoading }}>
        <Navbar></Navbar>
      </AuthContext.Provider>
    </>
  );
}

export default App;
