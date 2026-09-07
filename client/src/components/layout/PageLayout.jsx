import React from 'react';
import { ChevronRight } from 'lucide-react';

const PageLayout = ({ title, subtitle, breadcrumb, children }) => {
  return (
    <div className="page-shell w-full max-w-7xl mx-auto">
      <div className="page-heading">
        <h1 className="page-title">{title}</h1>
        {subtitle && <p className="page-subtitle">{subtitle}</p>}
        {breadcrumb && (
          <div className="flex items-center text-sm text-gray-500 mt-2">
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
