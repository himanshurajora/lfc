import { useState } from 'react';
import './App.css';
import { AuthContext } from './AuthContext';
import { Dashboard } from './Dashboard';
import { Navbar } from './Navbar';
import { useUserState } from './useUserState';
import 'primeicons/primeicons.css';

function App() {
  const { user, setUser, loading, setLoading } = useUserState();
  const [globalSearch, setGlobalSearch] = useState('');

  return (
    <>
      <AuthContext.Provider value={{ user, setUser, loading, setLoading }}>
        <Navbar setGlobalSearch={setGlobalSearch}></Navbar>
        <Dashboard globalSearch={globalSearch}></Dashboard>
      </AuthContext.Provider>
    </>
  );
}

export default App;
