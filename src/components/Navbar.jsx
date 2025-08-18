// src/components/Navbar.jsx
import React, { useEffect, useState } from "react";

const Navbar = ({ username, setUsername }) => {
  const [accounts, setAccounts] = useState([]);
  const [showDropdown, setShowDropdown] = useState(false);

  useEffect(() => {
    const stored = JSON.parse(localStorage.getItem("accounts")) || [];
    setAccounts(stored);
  }, [username]);

  const handleLogout = () => {
    localStorage.removeItem("username");
    setUsername(null);
    setShowDropdown(false);
  };

  const handleSwitchAccount = (newUser) => {
    localStorage.setItem("username", newUser);
    setUsername(newUser);
    setShowDropdown(false);
    window.location.reload(); // optional, if you want a hard reset
  };

  return (
    <nav className="flex justify-between items-center px-6 py-4 bg-gray-900 text-white">
      {/* App Logo / Title */}
      <h1 className="text-xl font-bold">Chess Analytics</h1>

      {/* Profile Section */}
      <div className="relative">
        <button
          onClick={() => setShowDropdown((prev) => !prev)}
          className="bg-gray-700 px-4 py-2 rounded hover:bg-gray-600"
        >
          {username || "Guest"}
        </button>

        {showDropdown && (
          <div className="absolute right-0 mt-2 w-48 bg-white text-black rounded shadow-lg">
            <div className="px-4 py-2 border-b">Logged in as: <b>{username}</b></div>

            <button
              onClick={handleLogout}
              className="block w-full text-left px-4 py-2 hover:bg-gray-100"
            >
              Logout
            </button>

            {accounts.length > 1 && (
              <>
                <div className="px-4 py-2 border-t font-semibold">Switch Account</div>
                {accounts
                  .filter((acc) => acc !== username)
                  .map((acc) => (
                    <button
                      key={acc}
                      onClick={() => handleSwitchAccount(acc)}
                      className="block w-full text-left px-4 py-2 hover:bg-gray-100"
                    >
                      {acc}
                    </button>
                  ))}
              </>
            )}
          </div>
        )}
      </div>
    </nav>
  );
};

export default Navbar;
