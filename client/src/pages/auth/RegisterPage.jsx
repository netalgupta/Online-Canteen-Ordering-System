import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import toast from 'react-hot-toast';
import { isValidEmail, isValidPhone, isValidPassword } from '../../utils/validation';

const RegisterPage = () => {
  const [formData, setFormData] = useState({ name: '', email: '', password: '', confirmPassword: '', phone: '', rollNumber: '' });
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});
  const { register } = useAuth();
  const navigate = useNavigate();

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    if (errors[e.target.name]) {
      setErrors({ ...errors, [e.target.name]: null });
    }
  };

  const validate = () => {
    const newErrors = {};
    if (!isValidEmail(formData.email)) newErrors.email = 'Invalid email format';
    if (!isValidPhone(formData.phone)) newErrors.phone = 'Invalid phone number (10 digits)';
    if (!isValidPassword(formData.password)) newErrors.password = 'Password must be at least 6 characters';
    if (formData.password !== formData.confirmPassword) newErrors.confirmPassword = 'Passwords do not match';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;

    setLoading(true);
    try {
      const { confirmPassword, ...registerData } = formData;
      await register(registerData);
      toast.success('Registered successfully!');
      navigate('/');
    } catch (error) {
      toast.error(error.response?.data?.message || 'Registration failed');
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
      <div className="w-full md:w-[45%] flex flex-col justify-center px-8 sm:px-16 py-10 overflow-y-auto max-h-screen">
        <div className="w-full max-w-md mx-auto py-8">
          {/* Logos Row */}
          <div className="flex flex-wrap items-center gap-2 mb-8 text-[10px] font-bold text-gray-700 tracking-wider">
            <span className="flex items-center gap-1"><span className="text-primary-600">🔴</span> SOMAIYA VIDYAVIHAR</span>
            <span className="text-gray-300">|</span>
            <span className="flex items-center gap-1"><span className="text-primary-600">🔴</span> SOMAIYA VIDYAVIHAR UNIVERSITY</span>
            <span className="text-gray-300">|</span>
            <span className="flex items-center gap-1"><span className="text-green-600">🟢</span> SOMAIYA AYURVIHAR</span>
          </div>

          <h2 className="text-[22px] font-bold text-gray-800 mb-1">
            Create an account
          </h2>
          <p className="text-sm text-gray-500 mb-8">
            Please fill in the details below.
          </p>

          <form className="space-y-4" onSubmit={handleSubmit}>
            <Input label="Full Name" name="name" required onChange={handleChange} />
            
            <Input 
              label="Email address" 
              type="email" 
              name="email" 
              required 
              onChange={handleChange}
              error={errors.email}
            />
            
            <Input 
              label="Phone Number" 
              type="tel" 
              name="phone" 
              required 
              onChange={handleChange}
              error={errors.phone}
            />
            
            <Input label="Roll Number (Optional)" name="rollNumber" onChange={handleChange} />
            
            <Input 
              label="Password" 
              type="password" 
              name="password" 
              required 
              onChange={handleChange}
              error={errors.password}
            />
            
            <Input 
              label="Confirm Password" 
              type="password" 
              name="confirmPassword" 
              required 
              onChange={handleChange}
              error={errors.confirmPassword}
            />

            <div className="pt-4">
              <Button type="submit" variant="dark" fullWidth loading={loading} className="py-2.5">
                Register
              </Button>
            </div>
          </form>

          <div className="mt-8 text-center">
            <Link to="/login" className="text-sm font-medium text-primary-600 hover:text-primary-700">
              Already have an account? Sign in
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RegisterPage;
