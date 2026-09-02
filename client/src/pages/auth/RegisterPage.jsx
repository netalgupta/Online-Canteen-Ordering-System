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
    <div className="min-h-screen flex flex-col bg-gray-50">
      <div className="h-2 w-full bg-primary-600"></div>
      
      <div className="flex-1 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
        <div className="sm:mx-auto sm:w-full sm:max-w-md">
          <h2 className="text-center text-3xl font-extrabold text-gray-900">
            Create an account
          </h2>
        </div>

        <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
          <div className="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10 border border-gray-100">
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

              <div className="pt-2">
                <Button type="submit" fullWidth loading={loading} size="lg">
                  Register
                </Button>
              </div>
            </form>

            <div className="mt-6 text-center">
              <Link to="/login" className="font-medium text-primary-600 hover:text-primary-700">
                Already have an account? Sign in
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RegisterPage;
