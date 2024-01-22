import 'primeicons/primeicons.css';
import { ConfirmDialog } from 'primereact/confirmdialog';
import './App.css';
import { AuthContext } from './AuthContext';
import { Dashboard } from './Dashboard';
import { Navbar } from './Navbar';
import { StoreContext } from './StoreContext';
import { useProjects } from './useProjects';
import { useUserState } from './useUserState';

function App() {
  const {
    user,
    setUser,
    loading: userLoading,
    setLoading: setUserLoading,
  } = useUserState();
  const projectFeatures = useProjects();

  return (
    <>
      <AuthContext.Provider
        value={{
          user,
          setUser,
          loading: userLoading,
          setLoading: setUserLoading,
        }}
      >
        <StoreContext.Provider value={projectFeatures}>
          <Navbar></Navbar>
          <Dashboard></Dashboard>
        </StoreContext.Provider>
        <ConfirmDialog />
      </AuthContext.Provider>
    </>
  );
}

export default App;
