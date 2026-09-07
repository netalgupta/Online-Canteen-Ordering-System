import React from 'react';
import { ChevronRight } from 'lucide-react';

const PageLayout = ({ title, breadcrumb, children }) => {
  return (
    <div className="p-6 w-full max-w-7xl mx-auto">
      <div className="mb-6">
        <h1 className="page-title">{title}</h1>
        {breadcrumb && (
          <div className="flex items-center text-sm text-gray-500 mt-1">
            <span>Home</span>
            <ChevronRight className="w-4 h-4 mx-1" />
            <span className="text-gray-800 font-medium">{breadcrumb}</span>
          </div>
        )}
      </div>
      <div className="w-full">
        {children}
      </div>
    </div>
  );
};

export default PageLayout;
