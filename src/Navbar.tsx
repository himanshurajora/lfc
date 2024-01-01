import { Button } from 'primereact/button';
import { InputText } from 'primereact/inputtext';
import { useAuth } from './useAuth';
import { Dispatch, FC, SetStateAction } from 'react';
export interface NavbarProps {
  setGlobalSearch: Dispatch<SetStateAction<string>>;
}
export const Navbar: FC<NavbarProps> = ({ setGlobalSearch }) => {
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
      <div className="flex gap-2">
        <img src="/logo.png" width={50} height="auto" alt="LFC's logo" />
        {/* <span className="text-xl p-2">Looking For Contributors</span> */}
      </div>
      <span className="p-input-icon-left">
        <i className="pi pi-search" />
        <InputText
          placeholder="Search"
          onChange={(event) => {
            setGlobalSearch(event.target.value);
          }}
        />
      </span>

      {renderLoginUI()}
    </div>
  );
};
