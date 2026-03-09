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
 * Fully responsive — hamburger menu + collapsible search on mobile.
 */
export const Navbar: FC = () => {
  const { user, loading, login, logout } = useAuthContext();
  const { setGlobalSearch } = useStoreContext();
  const { unreadCount } = useNotifications(user?.uid ?? null);
  const [showProjectForm, setShowProjectForm] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [mobileSearchOpen, setMobileSearchOpen] = useState(false);
  const notificationRef = useRef<OverlayPanel>(null);
  const navigate = useNavigate();

  const handleNavigate = (path: string) => {
    navigate(path);
    setMobileMenuOpen(false);
  };

  /** Shared action buttons rendered in both desktop header and mobile drawer. */
  const actionButtons = (
    <>
      {!!user && (
        <Button
          label="Add Project"
          icon="pi pi-plus"
          onClick={() => {
            setShowProjectForm(true);
            setMobileMenuOpen(false);
          }}
          size="small"
        />
      )}
      {loading ? (
        <Button loading />
      ) : !user ? (
        <Button onClick={login} severity="success" icon="pi pi-github">
          Login with GitHub
        </Button>
      ) : (
        <div className="flex items-center gap-2 flex-wrap">
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
            onClick={() => handleNavigate(`/profile/${user.uid}`)}
            tooltip="My Profile"
          />
          <Button
            icon="pi pi-bookmark"
            rounded
            text
            severity="secondary"
            onClick={() => handleNavigate('/bookmarks')}
            tooltip="Bookmarks"
          />
          <Button
            onClick={() => {
              logout();
              setMobileMenuOpen(false);
            }}
            severity="warning"
            size="small"
          >
            Logout
          </Button>
        </div>
      )}
    </>
  );

  return (
    <>
        <header id="lfc-navbar" className="font-bold w-full flex shadow-md z-20 border-red-300 justify-between px-3 py-2 bg-white sticky top-0">
        {/* Left — Logo */}
        <div className="flex gap-2 items-center flex-shrink-0">
          <img
            src="/logo.png"
            width={40}
            height="auto"
            alt="LFC's logo"
            className="cursor-pointer"
            onClick={() => handleNavigate('/')}
          />
          <span
            className="text-lg md:text-xl p-1 md:p-2 cursor-pointer whitespace-nowrap"
            onClick={() => handleNavigate('/')}
          >
            LFC
            <Chip label="beta" className="h-6 ml-2" />
          </span>
        </div>

        {/* Center — Search (desktop only) */}
        <div className="hidden md:flex flex-1 justify-center items-center mx-2">
          <span className="p-input-icon-left w-full max-w-md">
            <i className="pi pi-search" />
            <InputText
              placeholder="Search projects..."
              onChange={(e) => setGlobalSearch(e.target.value)}
              className="w-full"
            />
          </span>
        </div>

        {/* Right — Actions (desktop only) */}
        <div className="hidden md:flex items-center gap-2 flex-shrink-0">
          {actionButtons}
        </div>

        {/* Mobile-only controls */}
        <div className="flex md:hidden items-center gap-1 flex-shrink-0">
          <Button
            icon="pi pi-search"
            rounded
            text
            severity="secondary"
            onClick={() => setMobileSearchOpen(!mobileSearchOpen)}
          />
          <Button
            icon="pi pi-bars"
            rounded
            text
            severity="secondary"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          />
        </div>
      </header>

      {/* Mobile search bar — slides below header */}
      {mobileSearchOpen && (
        <div className="md:hidden bg-white border-b shadow-sm px-3 py-2 sticky top-[52px] z-10">
          <span className="p-input-icon-left w-full">
            <i className="pi pi-search" />
            <InputText
              placeholder="Search projects..."
              onChange={(e) => setGlobalSearch(e.target.value)}
              className="w-full"
              autoFocus
            />
          </span>
        </div>
      )}

      {/* Mobile menu drawer */}
      {mobileMenuOpen && (
        <div
          className="md:hidden fixed inset-0 z-50 flex"
          onClick={() => setMobileMenuOpen(false)}
        >
          <div className="absolute inset-0 bg-black/40" />
          <div
            className="relative ml-auto bg-white w-72 max-w-[85vw] h-full shadow-xl overflow-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between p-4 border-b">
              <span className="font-bold text-lg">Menu</span>
              <Button
                icon="pi pi-times"
                rounded
                text
                severity="secondary"
                onClick={() => setMobileMenuOpen(false)}
              />
            </div>
            <div className="flex flex-col gap-3 p-4">{actionButtons}</div>
          </div>
        </div>
      )}

      {/* Overlays */}
      <OverlayPanel ref={notificationRef} className="w-[90vw] max-w-96">
        <NotificationPanel />
      </OverlayPanel>

      <AddProjectDialog
        visible={showProjectForm}
        setVisible={setShowProjectForm}
      />
    </>
  );
};
