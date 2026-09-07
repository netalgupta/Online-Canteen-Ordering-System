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
    <div className="flex min-h-screen flex-col bg-white md:flex-row">
      {/* Left Panel */}
      <div className="login-hero flex h-[310px] w-full flex-col relative overflow-hidden bg-[#8B1020] md:h-auto md:min-h-screen md:w-[55%]">
        <img
          className="login-hero-image"
          src="https://images.unsplash.com/photo-1555396273-367ea4eb4db5?auto=format&fit=crop&w=1500&q=85"
          alt="Warmly lit canteen dining area"
        />
        <div className="login-hero-wash"></div>
        <div className="login-hero-grid"></div>
        <div className="relative z-10 flex flex-col items-center justify-center w-full p-12 text-center text-white">
          <div className="login-hero-copy">
            <span className="login-hero-kicker">SOMAIYA VIDYAVIHAR UNIVERSITY</span>
            <h1 className="text-4xl font-bold mb-2">Siddhi Services Canteen</h1>
            <p className="text-xl text-white/80 mb-12">Good food, ready when you are.</p>
          </div>

          <div className="login-hero-note login-hero-note-one">
            <span className="login-hero-dot"></span>
            <span>Fresh from the counter</span>
          </div>
          <div className="login-hero-note login-hero-note-two">
            <span className="login-hero-dot login-hero-dot-gold"></span>
            <span>Made for campus days</span>
          </div>
          
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
      <div className="w-full flex-1 px-5 py-9 sm:px-16 md:w-[45%] md:flex-none md:flex md:flex-col md:justify-center md:py-10">
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
