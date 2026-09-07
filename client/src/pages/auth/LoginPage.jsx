import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import toast from 'react-hot-toast';

const LoginPage = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const user = await login(email, password);
      toast.success('Logged in successfully!');
      if (user.role === 'admin') navigate('/admin/dashboard');
      else if (user.role === 'staff') navigate('/staff/dashboard');
      else navigate('/');
    } catch (error) {
      toast.error(error.response?.data?.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen bg-white">
      {/* Left Panel */}
      <div className="hidden md:flex w-[55%] relative overflow-hidden bg-gradient-to-br from-[#8B1020] via-[#C41230] to-[#1E2433]">
        <div className="absolute inset-0 bg-black/30"></div>
        <div className="relative z-10 flex flex-col items-center justify-center w-full p-12 text-center text-white">
          <h1 className="text-4xl font-bold mb-2">Siddhi Services Canteen</h1>
          <p className="text-xl text-white/80 mb-12">Somaiya Vidyavihar University</p>
          
          <div className="mt-auto pt-12 border-t border-white/20 w-full flex justify-around text-center">
            <div>
              <div className="text-3xl font-bold">60+</div>
              <div className="text-sm text-white/70">Menu Items</div>
            </div>
            <div>
              <div className="text-3xl font-bold">500+</div>
              <div className="text-sm text-white/70">Orders Daily</div>
            </div>
          </div>
        </div>
      </div>

      {/* Right Panel */}
      <div className="w-full md:w-[45%] flex flex-col justify-center px-8 sm:px-16 py-10">
        <div className="w-full max-w-md mx-auto">
          {/* Logos Row */}
          <div className="flex flex-wrap items-center gap-2 mb-8 text-[10px] font-bold text-gray-700 tracking-wider">
            <span className="flex items-center gap-1"><span className="text-primary-600">🔴</span> SOMAIYA VIDYAVIHAR</span>
            <span className="text-gray-300">|</span>
            <span className="flex items-center gap-1"><span className="text-primary-600">🔴</span> SOMAIYA VIDYAVIHAR UNIVERSITY</span>
            <span className="text-gray-300">|</span>
            <span className="flex items-center gap-1"><span className="text-green-600">🟢</span> SOMAIYA AYURVIHAR</span>
          </div>

          <h2 className="text-[22px] font-bold text-gray-800 mb-1">
            Welcome to Siddhi Canteen Portal
          </h2>
          <p className="text-sm text-gray-500 mb-8">
            Please enter your credentials to login.
          </p>

          <form onSubmit={handleSubmit} className="space-y-5">
            <Input
              label="Email"
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Enter your email"
            />
            
            <div className="relative">
              <Input
                label="Password"
                type={showPassword ? "text" : "password"}
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter your password"
              />
              <button 
                type="button" 
                className="absolute right-3 top-[32px] text-gray-500 text-xs font-medium hover:text-gray-700 focus:outline-none"
                onClick={() => setShowPassword(!showPassword)}
              >
                {showPassword ? "HIDE" : "SHOW"}
              </button>
            </div>

            <Button type="submit" variant="dark" fullWidth loading={loading} className="mt-2 py-2.5">
              Login
            </Button>
          </form>

          <div className="mt-8 relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-200" />
            </div>
            <div className="relative flex justify-center text-xs">
              <span className="px-4 bg-white text-gray-400 font-medium">OR</span>
            </div>
          </div>

          <div className="mt-8">
            <Link to="/register">
              <Button variant="outline" fullWidth className="py-2.5">
                Create Account
              </Button>
            </Link>
          </div>

          <p className="mt-8 text-xs text-center text-gray-400">
            For support, please contact helpdesk@somaiya.edu
          </p>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
