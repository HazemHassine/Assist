"use client";
import React, { useState, useEffect } from 'react';
import { ChevronLeft, User, LogOut, Mail, Calendar } from 'lucide-react';
import { getClientSession, logout } from '../../lib/auth';

export default function SettingsPanel({ collapsed }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchUserData = async () => {
      try {
        const clientSession = getClientSession();
        
        if (clientSession) {
          // Fetch complete user data from server
          const response = await fetch('/api/auth/me');
          const data = await response.json();
          
          if (data.authenticated && data.user) {
            setUser(data.user);
          } else {
            // Fallback to client session if server data not available
            setUser(clientSession);
          }
        } else {
          setUser(null);
        }
      } catch (error) {
        console.error('Error fetching user data:', error);
        // Fallback to client session
        const clientSession = getClientSession();
        setUser(clientSession);
      } finally {
        setLoading(false);
      }
    };

    fetchUserData();
  }, []); // Empty dependency array - only run once on mount

  const handleSignOut = () => {
    logout();
    // You might want to redirect to landing page or sign in page
    window.location.href = '/';
  };

  const handleCollapse = () => {
    if (typeof collapsed === 'function') {
      collapsed();
    }
  };

  if (loading) {
    return (
      <aside className="flex flex-col h-full bg-zinc-900/95 backdrop-blur-xl border-r border-zinc-700/50 transition-all duration-300 w-72">
        <div className="flex items-center justify-between px-4 py-4 border-b border-zinc-700/50">
          <span className="text-sm font-semibold text-zinc-100">Settings</span>
          <button
            onClick={handleCollapse}
            className="p-2 text-zinc-400 hover:text-white hover:bg-zinc-700/50 rounded-lg transition-colors"
          >
            <ChevronLeft size={20} />
          </button>
        </div>
        <div className="flex-1 flex items-center justify-center">
          <div className="w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
        </div>
      </aside>
    );
  }

  return (
    <aside className="flex flex-col h-full bg-zinc-900/95 backdrop-blur-xl border-r border-zinc-700/50 transition-all duration-300 w-72">
      <div className="flex items-center justify-between px-4 py-4 border-b border-zinc-700/50">
        <span className="text-sm font-semibold text-zinc-100">Settings</span>
        <button
          onClick={handleCollapse}
          className="p-2 text-zinc-400 hover:text-white hover:bg-zinc-700/50 rounded-lg transition-colors"
        >
          <ChevronLeft size={20} />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto">
        {/* Account Section */}
        <div className="p-4 border-b border-zinc-700/50">
          <h3 className="text-sm font-semibold text-zinc-100 mb-4 flex items-center">
            <User size={16} className="mr-2" />
            Account
          </h3>
          
          {user ? (
            <div className="space-y-3">
              <div className="flex items-center space-x-3 p-3 bg-zinc-800/50 rounded-lg">
                <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white font-semibold">
                  {user.email?.charAt(0).toUpperCase() || 'U'}
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium text-zinc-100">{user.email || 'User'}</p>
                  <p className="text-xs text-zinc-400">Active Account</p>
                </div>
              </div>
              
              <div className="space-y-2">
                <div className="flex items-center space-x-2 text-sm text-zinc-400">
                  <Mail size={14} />
                  <span>{user.email || 'No email available'}</span>
                </div>
                <div className="flex items-center space-x-2 text-sm text-zinc-400">
                  <Calendar size={14} />
                  <span>Member since {user.createdAt ? new Date(user.createdAt).toLocaleDateString() : 'Unknown'}</span>
                </div>
              </div>
            </div>
          ) : (
            <div className="text-sm text-zinc-400">
              No account information available
            </div>
          )}
        </div>

        {/* Google Drive Section */}
        <div className="p-4 border-b border-zinc-700/50">
          <h3 className="text-sm font-semibold text-zinc-100 mb-4">Google Drive</h3>
          <div className="space-y-3">
            <div className="flex items-center space-x-2">
              <span className="text-sm text-green-400">● Connected</span>
              <button
                className="text-sm text-red-400 hover:text-red-200 cursor-not-allowed"
                disabled
              >
                Disconnect
              </button>
            </div>

            <button
              disabled
              className="px-3 py-2 bg-blue-600/50 text-sm text-white/70 rounded cursor-not-allowed"
            >
              Connect Google Drive
            </button>
          </div>
        </div>

        {/* Sign Out Section */}
        <div className="p-4">
          <button
            onClick={handleSignOut}
            className="w-full flex items-center justify-center space-x-2 px-4 py-3 bg-red-500/20 hover:bg-red-500/30 text-red-400 hover:text-red-300 rounded-lg transition-all duration-300"
          >
            <LogOut size={16} />
            <span className="text-sm font-medium">Sign Out</span>
          </button>
        </div>
      </div>
    </aside>
  );
}
