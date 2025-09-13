"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";

export default function Page() {
  const supabase = createClientComponentClient();
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [username, setUsername] = useState("");
  const [isLogin, setIsLogin] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (isLogin) {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) setError(error.message);
      else router.push("/home");
    } else {
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: { data: { username } },
      });
      if (error) setError(error.message);
      else router.push("/home");
    }
  };

  return (
    <main className="w-full h-screen flex items-center justify-center font-[Poppins] bg-gray-200 text-gray-700">
            {/* Background shapes */}
      <div className="absolute">
        <div className="absolute h-[200px] w-[200px] rounded-full bg-gradient-to-b from-[#1845ad] to-[#23a2f6] -left-55 -top-75"></div>
        <div className="absolute h-[200px] w-[200px] rounded-full bg-gradient-to-r from-[#ff512f] to-[#f09819] -right-55 -bottom"></div>
      </div>

      {/* Glass Form */}
      <form
        onSubmit={handleSubmit}
        className="relative m-4 z-10 w-full max-w-md h-auto bg-white/10 backdrop-blur-lg border border-white/20 
                  rounded-lg shadow-[0_0_40px_rgba(8,7,16,0.6)] p-8 flex flex-col"
      >

        <h3 className="text-3xl font-medium text-black text-center mb-6">
          {isLogin ? "Login FindMYPaw" : "Register FindMYPaw"}
        </h3>

        {error && <p className="text-red-400 text-sm mb-2">{error}</p>}

        {!isLogin && (
          <>
            <label className="text-black mt-4">Username</label>
            <input
              type="text"
              placeholder="Enter username"
              className="h-[50px] w-full bg-gray-100 rounded px-3 mt-2 text-black placeholder-gray-500 text-sm"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
            />
          </>
        )}

        <label className="text-black mt-4">Email</label>
        <input
          type="email"
          placeholder="Enter your email"
          className="h-[50px] w-full bg-gray-100 rounded px-3 mt-2 text-black placeholder-gray-500 text-sm"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />

        <label className="text-black mt-4">Password</label>
        <input
          type="password"
          placeholder="Enter your password"
          className="h-[50px] w-full bg-gray-100 rounded px-3 mt-2 text-black placeholder-gray-500 text-sm"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
        />

        <button
          type="submit"
          className="mt-10 w-full bg-[#f09819]  text-white py-3 rounded font-semibold text-lg hover:bg-gray-200 transition"
        >
          {isLogin ? "Log In" : "Register"}
        </button>


        {/* Switch Login/Register */}
        <p className="text-center text-black text-sm mt-6">
          {isLogin ? "Don't have an account?" : "Already have an account?"}{" "}
          <button
            type="button"
            onClick={() => setIsLogin(!isLogin)}
            className="text-blue-300 underline"
          >
            {isLogin ? "Register" : "Login"}
          </button>
        </p>
      </form>
    </main>
  );
}
