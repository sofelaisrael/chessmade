import React from "react";
import KnightBoard from "../components/KnightBoard";
import { AiOutlineSearch } from "react-icons/ai";


const Login = ({ username, setUsername, handleSubmit, error }) => {
  return (
    <div className="flex flex-col items-center px-10 max-md:px-5 space-y-6 h-[100svh] justify-center quicksand">
      {/* <KnightBoard /> */}
      <h2 className="text-2xl font-semibold text-white text-center">
        Enter your Chess.com username
      </h2>
      <form onSubmit={handleSubmit} className="w-full max-w-md">
        <div className="relative">
          <input
            type="text"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            className="w-full px-4 py-2 outline-none focus:border-[#5ED3F3] border border-transparent rounded-lg bg-[#1e1e1e] text-white placeholder:text-[#a0a0a0]"
            placeholder="Username"
          />
          <button
            type="submit"
            className="absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
          >
            <AiOutlineSearch size={20} />
          </button>
        </div>
        {error && <div className="mt-2 text-red-500 text-center">{error}</div>}
      </form>
    </div>
  );
};
export default Login;