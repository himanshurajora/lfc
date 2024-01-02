import 'primeicons/primeicons.css';
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
  const {
    loading: projectsLoading,
    projects,
    setProjects,
    setLoading: setProjectsLoading,
    filters,
    setFilters,
    globalSearch,
    setGlobalSearch,
    addProject,
  } = useProjects();

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
        <StoreContext.Provider
          value={{
            filters,
            loading: projectsLoading,
            projects,
            setProjects,
            setFilters,
            setLoading: setProjectsLoading,
            globalSearch,
            setGlobalSearch,
            addProject,
          }}
        >
          <Navbar></Navbar>
          <Dashboard></Dashboard>
        </StoreContext.Provider>
      </AuthContext.Provider>
    </>
  );
}

export default App;
