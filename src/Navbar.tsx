import { Button } from 'primereact/button';
import { InputText } from 'primereact/inputtext';
import { Chip } from 'primereact/chip';
import { FC, useContext, useState } from 'react';
import { StoreContext } from './StoreContext';
import { useAuth } from './useAuth';
import { AddProjectForm } from './AddProjectDialog';
export interface NavbarProps {}
export const Navbar: FC<NavbarProps> = () => {
  const { login, logout, user, loading } = useAuth();
  const { setGlobalSearch } = useContext(StoreContext);
  const [showProjectForm, setShowProjectForm] = useState(false);
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
    <>
      <div className="font-bold min-w-full flex shadow-md z-20 border-red-300 justify-between px-3 py-2">
        <div className="flex flex-1 gap-2">
          <img src="/logo.png" width={50} height="auto" alt="LFC's logo" />
          <span className="text-xl p-2">LFC <Chip label='beta' className='h-6' data-pr-tooltip='Currently in development'/> </span>
        </div>
        <div className="flex-1 flex justify-center">
          <span className="p-input-icon-left">
            <i className="pi pi-search" />
            <InputText
              placeholder="Search"
              onChange={(event) => {
                setGlobalSearch(event.target.value);
              }}
            />
          </span>
        </div>

        <div className="flex-1 flex justify-end gap-2">
          {!!user && (
            <Button
              label="Add Project"
              onClick={() => setShowProjectForm(true)}
            ></Button>
          )}
          {renderLoginUI()}
        </div>
      </div>
      <AddProjectForm
        setVisible={setShowProjectForm}
        visible={showProjectForm}
      ></AddProjectForm>
    </>
  );
};
