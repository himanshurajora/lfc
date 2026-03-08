import { FC } from 'react';
import { Outlet } from 'react-router-dom';
import { LeftSidebar } from './LeftSidebar';
import { RightSidebar } from './RightSidebar';

/**
 * Dashboard layout with left sidebar, main content, and right sidebar.
 */
export const DashboardLayout: FC = () => {
  return (
    <div className="min-w-full mt-2 flex justify-center z-10">
      <LeftSidebar />
      <main className="w-full flex-1 flex flex-col p-5 gap-3 max-h-[90vh] overflow-auto">
        <Outlet />
      </main>
      <RightSidebar />
    </div>
  );
};
