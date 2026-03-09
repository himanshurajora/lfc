import { FC, useEffect, useRef, useState } from 'react';
import { Outlet } from 'react-router-dom';
import { Button } from 'primereact/button';
import { LeftSidebar } from './LeftSidebar';
import { RightSidebar } from './RightSidebar';

/**
 * Dashboard layout with left sidebar, main content, and right sidebar.
 * On mobile, sidebars become slide-out drawers triggered by toggle buttons.
 */
export const DashboardLayout: FC = () => {
  const [showFilters, setShowFilters] = useState(false);
  const [showDiscover, setShowDiscover] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const [navHeight, setNavHeight] = useState(56);

  useEffect(() => {
    const navbar = document.getElementById('lfc-navbar');
    if (!navbar) return;

    const updateHeight = () => setNavHeight(navbar.offsetHeight);
    updateHeight();

    const observer = new ResizeObserver(updateHeight);
    observer.observe(navbar);
    return () => observer.disconnect();
  }, []);

  return (
    <>
      <div
        ref={containerRef}
        className="flex overflow-hidden"
        style={{ height: `calc(100vh - ${navHeight}px)` }}
      >
        {/* Left sidebar — desktop only */}
        <div className="hidden lg:block flex-shrink-0 w-64 xl:w-72 overflow-y-auto bg-slate-100">
          <LeftSidebar />
        </div>

        <main className="flex-1 flex flex-col p-3 md:p-5 gap-3 overflow-y-auto">
          {/* Mobile toggle bar */}
          <div className="flex lg:hidden gap-2 flex-shrink-0">
            <Button
              icon="pi pi-filter"
              label="Filters"
              size="small"
              outlined
              severity="secondary"
              onClick={() => setShowFilters(true)}
            />
            <Button
              icon="pi pi-compass"
              label="Discover"
              size="small"
              outlined
              severity="secondary"
              onClick={() => setShowDiscover(true)}
            />
          </div>
          <Outlet />
        </main>

        {/* Right sidebar — desktop only */}
        <div className="hidden lg:block flex-shrink-0 w-64 xl:w-72 overflow-y-auto bg-slate-100">
          <RightSidebar />
        </div>
      </div>

      {/* Mobile left sidebar drawer */}
      {showFilters && (
        <div
          className="lg:hidden fixed inset-0 z-40 flex"
          onClick={() => setShowFilters(false)}
        >
          <div className="absolute inset-0 bg-black/40" />
          <div
            className="relative bg-white w-[85vw] max-w-sm h-full shadow-xl overflow-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between p-3 border-b sticky top-0 bg-white z-10">
              <span className="font-bold">Filters</span>
              <Button
                icon="pi pi-times"
                rounded
                text
                severity="secondary"
                onClick={() => setShowFilters(false)}
              />
            </div>
            <LeftSidebar mobile />
          </div>
        </div>
      )}

      {/* Mobile right sidebar drawer */}
      {showDiscover && (
        <div
          className="lg:hidden fixed inset-0 z-40 flex justify-end"
          onClick={() => setShowDiscover(false)}
        >
          <div className="absolute inset-0 bg-black/40" />
          <div
            className="relative bg-white w-[85vw] max-w-sm h-full shadow-xl overflow-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between p-3 border-b sticky top-0 bg-white z-10">
              <span className="font-bold">Discover</span>
              <Button
                icon="pi pi-times"
                rounded
                text
                severity="secondary"
                onClick={() => setShowDiscover(false)}
              />
            </div>
            <RightSidebar mobile />
          </div>
        </div>
      )}
    </>
  );
};
