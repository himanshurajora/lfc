import { FC } from 'react';
import { LeftSidebar } from './LeftSidebar';
import { Projects } from './Projects';
import { RightSidebar } from './RightSidebar';

export interface DashboardProps {}

export const Dashboard: FC<DashboardProps> = () => {
  return (
    <div className="min-w-full mt-2 flex justify-center z-10">
      <LeftSidebar />
      <Projects />
      <RightSidebar />
    </div>
  );
};
