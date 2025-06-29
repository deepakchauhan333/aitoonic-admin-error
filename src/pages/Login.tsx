import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Sparkles, Eye, EyeOff } from 'lucide-react';
import toast, { Toaster } from 'react-hot-toast';

const Login: React.FC = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    // Hardcoded credentials
    const validUsername = 'Deepakchauhan#@!#!';
    const validPassword = 'Deepak@@@qwer1234#!#1';

    if (username === validUsername && password === validPassword) {
      // Store admin session in localStorage
      localStorage.setItem('adminLoggedIn', 'true');
      localStorage.setItem('adminUser', username);
      toast.success('Login successful!');
      navigate('/admin');
    } else {
      toast.error('Invalid username or password');
    }

    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-royal-dark flex items-center justify-center py-20">
      <Toaster position="top-right" />
      
      <div className="container mx-auto px-4">
        <div className="max-w-md mx-auto">
          <div className="bg-royal-dark-card rounded-2xl p-8 border border-royal-dark-lighter">
            {/* Logo */}
            <div className="text-center mb-8">
              <div className="flex items-center justify-center space-x-3 mb-4">
                <Sparkles className="h-10 w-10 text-royal-gold" />
                <span className="text-2xl font-bold gradient-text">Aitoonic</span>
              </div>
              <h1 className="text-2xl font-bold text-white mb-2">Admin Login</h1>
              <p className="text-gray-400">Enter your credentials to access the admin panel</p>
            </div>

            {/* Login Form */}
            <form onSubmit={handleLogin} className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Username
                </label>
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="w-full px-4 py-3 bg-royal-dark border border-royal-dark-lighter rounded-lg text-white focus:outline-none focus:border-royal-gold"
                  placeholder="Enter your username"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Password
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full px-4 py-3 bg-royal-dark border border-royal-dark-lighter rounded-lg text-white focus:outline-none focus:border-royal-gold pr-12"
                    placeholder="Enter your password"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-white"
                  >
                    {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-royal-gold text-royal-dark px-6 py-3 rounded-lg font-bold hover:bg-opacity-90 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? 'Logging in...' : 'Login'}
              </button>
            </form>

            <div className="mt-6 text-center">
              <button
                onClick={() => navigate('/')}
                className="text-gray-400 hover:text-white transition-colors"
              >
                ← Back to Home
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;