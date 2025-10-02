'use client';

import LanguageToggle from './LanguageToggle';
import UserProfile from './UserProfile';

const DashboardHeader = ({ tasks }) => (
  <div className="fixed top-0 left-0 right-0 z-10 p-4" style={{ backgroundColor: 'var(--bg-primary)' }}>
    <div className="flex justify-between items-center w-full">
      <LanguageToggle />
      <UserProfile tasks={tasks} />
    </div>
  </div>
);

export default DashboardHeader;
