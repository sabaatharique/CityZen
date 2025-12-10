import { Home, FileText, Bell, User, LogOut, Building2, Moon, Sun } from 'lucide-react';

export default function Navigation({ onLogout, darkMode, toggleDarkMode, navigation }) {
  const notificationCount = 3;

  return (
    <nav className="bg-white dark:bg-gray-800 shadow-md sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          {navigation?.navigate ? (
            <button onClick={() => navigation.navigate('HomeTab')} className="flex items-center gap-2 text-[#1E88E5]">
              <Building2 className="w-8 h-8" strokeWidth={1.5} />
              <span className="text-xl hidden sm:inline">CityZen</span>
            </button>
          ) : (
            <a href="/" className="flex items-center gap-2 text-[#1E88E5]">
              <Building2 className="w-8 h-8" strokeWidth={1.5} />
              <span className="text-xl hidden sm:inline">CityZen</span>
            </a>
          )}

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center gap-1">
            <button onClick={() => (navigation?.navigate ? navigation.navigate('HomeTab') : (window.location.href = '/'))} className="flex items-center gap-2 px-4 py-2 rounded-lg transition text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700">
              <Home className="w-5 h-5" />
              <span>Home</span>
            </button>

            <button onClick={() => (navigation?.navigate ? navigation.navigate('Submit') : (window.location.href = '/submit'))} className="flex items-center gap-2 px-4 py-2 rounded-lg transition text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700">
              <FileText className="w-5 h-5" />
              <span>Submit</span>
            </button>

            <button onClick={() => (navigation?.navigate ? navigation.navigate('Feed') : (window.location.href = '/feed'))} className="flex items-center gap-2 px-4 py-2 rounded-lg transition text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700">
              <FileText className="w-5 h-5" />
              <span>Feed</span>
            </button>

            <button onClick={() => (navigation?.navigate ? navigation.navigate('Profile') : (window.location.href = '/profile'))} className="flex items-center gap-2 px-4 py-2 rounded-lg transition text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700">
              <User className="w-5 h-5" />
              <span>Profile</span>
            </button>
          </div>

          {/* Right Side Actions */}
          <div className="flex items-center gap-2">
            {/* Notifications */}
            <button className="relative p-2 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition">
              <Bell className="w-6 h-6" />
              {notificationCount > 0 && (
                <span className="absolute top-1 right-1 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                  {notificationCount}
                </span>
              )}
            </button>

            {/* Dark Mode Toggle */}
            <button
              onClick={toggleDarkMode}
              className="p-2 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition"
            >
              {darkMode ? <Sun className="w-6 h-6" /> : <Moon className="w-6 h-6" />}
            </button>

            {/* Logout */}
            <button
              onClick={onLogout}
              className="hidden md:flex items-center gap-2 px-4 py-2 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition"
            >
              <LogOut className="w-5 h-5" />
              <span>Logout</span>
            </button>
          </div>
        </div>
      </div>
    </nav>
  );
}
