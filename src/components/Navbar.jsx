import { CgClose } from "react-icons/cg"; 
import { BiTrash } from "react-icons/bi";
import { RxCaretDown } from "react-icons/rx";
// src/components/Navbar.jsx
import React, { useEffect, useState } from "react";
import defaultimg from "../assets/default.png";

const Navbar = ({ username, setUsername, profile }) => {
  const [accounts, setAccounts] = useState([]);
  const [showSidebar, setShowSidebar] = useState(false);

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

  const handleDeleteAccount = (accToDelete) => {
    const updated = accounts.filter((acc) => acc !== accToDelete);
    setAccounts(updated);
    localStorage.setItem("accounts", JSON.stringify(updated));

    // If you delete the currently logged-in account, log out
    if (accToDelete === username) {
      localStorage.removeItem("username");
      setUsername(null);
    }
  };

  return (
    <nav className="flex justify-between items-center px-6 py-4 bg-[#1e1e1e] text-white">
      {/* App Logo / Title */}
      <h1 className="text-xl font-bold">ChessMore</h1>

      {/* Profile Section */}
      <div className="relative">
        <div
          className="flex items-center space-x-2 h-full cursor-pointer"
          onClick={() => setShowSidebar(true)}
        >
          <img
            src={profile?.avatar || defaultimg}
            alt={profile?.username}
            className="w-10 h-10 rounded-full max-lg:size-10 max-md:size-9"
          />
          <div className="text-xl font-semibold text-[#fff]">
            {profile?.username}
          </div>
          <span className="text-[25px]">
            <RxCaretDown />
          </span>{" "}
          {/* caret down */}
        </div>

        {/* Sidebar */}
        {showSidebar && (
          <div className="fixed inset-0 z-50 flex">
            {/* Overlay */}
            <div
              className="flex-1 bg-black opacity-50"
              onClick={() => setShowSidebar(false)}
            />

            {/* Sidebar content */}
            <div className="w-72 bg-[#1e1e1e] text-white h-full shadow-lg transform transition-transform duration-300 ease-in-out">
              <div className="p-4 border-b flex justify-between items-center">
                <span className="text-lg">Profile</span>
                <button onClick={() => setShowSidebar(false)}><CgClose /></button>
              </div>

              <div className="p-4">
                <div className="flex items-center space-x-4 px-4">
                  <img
                    src={profile?.avatar || defaultimg}
                    alt={profile?.username}
                    className="w-12 h-12 rounded-full"
                  />
                  <div>
                    <div className="font-semibold">{profile?.username}</div>
                  </div>
                </div>

                <button
                  onClick={handleLogout}
                  className="block w-full text-left px-4 py-2 hover:bg-gray-100 hover:text-black transition-colors duration-200 border-t mt-5"
                >
                  Logout
                </button>
                <button
                  onClick={handleLogout}
                  className="block w-full text-left px-4 py-2 hover:bg-red-400 hover:text-white transition-colors duration-200"
                >
                  Remove This Account
                </button>

                {accounts.length > 1 && (
                  <>
                    <div className="px-4 py-2 border-t font-semibold">
                      Switch Account
                    </div>
                    {accounts
                      .filter((acc) => acc !== username)
                      .map((acc) => (
                        <div
                          key={acc}
                          className="flex justify-between items-center px-4 py-2 hover:bg-[#555]"
                        >
                          <button
                            onClick={() => handleSwitchAccount(acc)}
                            className="flex-1 text-left"
                          >
                            {acc}
                          </button>
                          <button
                            onClick={() => handleDeleteAccount(acc)}
                            className="text-red-500 ml-2"
                          >
                            <BiTrash />
                          </button>
                        </div>
                      ))}
                  </>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </nav>
  );
};

export default Navbar;
