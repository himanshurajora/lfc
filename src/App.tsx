import { Button } from 'primereact';
import { useEffect, useState } from "react";
import "./App.css";
import { client } from "./db";
import { loginWithGithub, logoutUser } from './utils';

function App() {
  const [currentUser, setCurrentUser] = useState(null);

  useEffect(() => {
    setCurrentUser(client.authStore.model);
  }, []);

  const login = async () => {
    await loginWithGithub()
    setCurrentUser(client.authStore.model);
  }

  const logout = () => {
    logoutUser();
    setCurrentUser(null)
  }

  return <>{currentUser ? <>
    <pre>{JSON.stringify(currentUser)}</pre>
    <Button onClick={logout}>Logout</Button>
  </> : <Button onClick={login}>Login</Button>}</>;
}

export default App;
