import { Button } from 'primereact/button';
import { InputText } from 'primereact/inputtext';
import { Chip } from 'primereact/chip';
import { Badge } from 'primereact/badge';
import { OverlayPanel } from 'primereact/overlaypanel';
import { FC, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthContext, useStoreContext } from '../../contexts';
import { useNotifications } from '../../hooks/useNotifications';
import { AddProjectDialog } from '../projects/AddProjectDialog';
import { NotificationPanel } from '../notifications/NotificationPanel';

/**
 * Top navigation bar with search, authentication, and quick actions.
 */
export const Navbar: FC = () => {
  const { user, loading, login, logout } = useAuthContext();
  const { setGlobalSearch } = useStoreContext();
  const { unreadCount } = useNotifications(user?.uid ?? null);
  const [showProjectForm, setShowProjectForm] = useState(false);
  const notificationRef = useRef<OverlayPanel>(null);
  const navigate = useNavigate();

  const renderAuthButtons = () => {
    if (loading) return <Button loading />;
    if (!user) {
      return (
        <Button onClick={login} severity="success" icon="pi pi-github">
          Login with GitHub
        </Button>
      );
    }

    return (
      <div className="flex items-center gap-2">
        <Button
          icon="pi pi-bell"
          rounded
          text
          severity="secondary"
          className="relative"
          onClick={(e) => notificationRef.current?.toggle(e)}
        >
          {unreadCount > 0 && (
            <Badge
              value={unreadCount > 9 ? '9+' : unreadCount}
              severity="danger"
              className="absolute -top-1 -right-1"
            />
          )}
        </Button>

        <Button
          icon="pi pi-user"
          rounded
          text
          severity="secondary"
          onClick={() => navigate(`/profile/${user.uid}`)}
          tooltip="My Profile"
        />

        <Button
          icon="pi pi-bookmark"
          rounded
          text
          severity="secondary"
          onClick={() => navigate('/bookmarks')}
          tooltip="Bookmarks"
        />

        <Button onClick={logout} severity="warning" size="small">
          Logout
        </Button>
      </div>
    );
  };

  return (
    <>
      <header className="font-bold min-w-full flex shadow-md z-20 border-red-300 justify-between px-3 py-2 bg-white sticky top-0">
        <div className="flex flex-1 gap-2 items-center">
          <img
            src="/logo.png"
            width={50}
            height="auto"
            alt="LFC's logo"
            className="cursor-pointer"
            onClick={() => navigate('/')}
          />
          <span
            className="text-xl p-2 cursor-pointer"
            onClick={() => navigate('/')}
          >
            LFC
            <Chip label="beta" className="h-6 ml-2" />
          </span>
        </div>

        <div className="flex-1 flex justify-center items-center">
          <span className="p-input-icon-left">
            <i className="pi pi-search" />
            <InputText
              placeholder="Search projects..."
              onChange={(e) => setGlobalSearch(e.target.value)}
              className="w-80"
            />
          </span>
        </div>

        <div className="flex-1 flex justify-end gap-2 items-center">
          {!!user && (
            <Button
              label="Add Project"
              icon="pi pi-plus"
              onClick={() => setShowProjectForm(true)}
              size="small"
            />
          )}
          {renderAuthButtons()}
        </div>
      </header>

      {/* Overlays */}
      <OverlayPanel ref={notificationRef} className="w-96">
        <NotificationPanel />
      </OverlayPanel>

      <AddProjectDialog
        visible={showProjectForm}
        setVisible={setShowProjectForm}
      />
    </>
  );
};
