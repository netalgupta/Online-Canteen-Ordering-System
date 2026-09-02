import React from 'react';
import Spinner from '../ui/Spinner';

const Button = ({ 
  variant = 'primary', 
  size = 'md', 
  loading = false, 
  fullWidth = false, 
  children, 
  className = '',
  disabled,
  ...rest 
}) => {
  const baseStyles = 'inline-flex justify-center items-center font-medium rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed';
  
  const variants = {
    primary: 'bg-primary-600 hover:bg-primary-700 text-white focus:ring-primary-600',
    secondary: 'border border-primary-600 text-primary-600 hover:bg-primary-50 focus:ring-primary-600',
    danger: 'bg-red-600 hover:bg-red-700 text-white focus:ring-red-600',
    ghost: 'text-gray-600 hover:bg-gray-100 focus:ring-gray-500',
    success: 'bg-green-600 hover:bg-green-700 text-white focus:ring-green-600',
  };
  
  const sizes = {
    sm: 'px-3 py-1.5 text-sm',
    md: 'px-4 py-2 text-base',
    lg: 'px-6 py-3 text-lg',
  };

  const classes = `${baseStyles} ${variants[variant]} ${sizes[size]} ${fullWidth ? 'w-full' : ''} ${className}`;

  return (
    <button className={classes} disabled={loading || disabled} {...rest}>
      {loading && <Spinner size="sm" className="mr-2 text-current" />}
      {children}
    </button>
  );
};

export default Button;
