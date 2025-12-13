import React from "react";
import { Link } from "react-router-dom";
import Logo from "../Pictures/Sucol Logo.png";
import usePageTitle from "./usePageTitle";

export default function LandingPage() {
  usePageTitle("Sucol Water System - Landing Page");
  return (
    <div className="min-h-screen bg-white flex flex-col text-black relative">
      
      {/* --- MAIN CONTENT --- */}
      <div className="flex flex-col lg:flex-row items-center lg:items-start justify-between px-8 lg:px-28 py-15 flex-grow">

        {/* Left side */}
        <div className="max-w-xl text-center lg:text-left">
          <h1 className="text-6xl lg:text-7xl font-extrabold tracking-wide drop-shadow-lg text-blue-600">
            Welcome.
          </h1>

          <p className="text-black text-xl mt-4 max-w-md">
            Sucol Water System — Efficient water management for your community.
          </p>

          <div className="mt-5">
            <h3 className="text-2xl font-bold mb-4 text-blue-600">About Us</h3>
            <p className="text-black/80 leading-relaxed">
              Sucol Water System is committed to providing clean, reliable, and sustainable water services. 
              Our modern monitoring and management tools ensure efficiency and transparency in every household.
            </p>
          </div>

          <h2 className="text-3xl font-bold text-black mt-10">
            Get Started: 
          </h2>

          {/* Button */}
          <div className="mt-10 flex flex-col gap-4 w-60 mx-auto lg:mx-0">
            <Link
              to="/resident-login"
              className="bg-blue-600 hover:bg-blue-700 py-3 rounded-xl 
              text-white font-semibold text-center shadow-[0_0_15px_#007bff] 
              transition-transform hover:scale-105"
            >
              Login As Resident
            </Link>
          </div>
        </div>

        {/* Right side - Logo */}
        <div className="w-full lg:w-auto mt-16 lg:mt-11 lg:mr-50 flex justify-center lg:justify-end">
          <div className="w-90 h-90 bg-white rounded-3xl shadow-[0_0_40px_#3b82f6] flex items-center justify-center p-6 border border-blue-700/40">
            <img
              src={Logo}
              alt="Sucol Water System Logo"
              className="w-full h-full object-contain drop-shadow-[0_0_25px_#60a5fa] transition-transform duration-300 hover:scale-110"
            />
          </div>
        </div>
      </div>

      {/* Features */}
      <div className="px-12 text-center grid grid-cols-2 lg:grid-cols-4 gap-6 text-black mb-4 text-blue-600">
        <div>✔ Reliable Water Service</div>
        <div>✔ Modern Monitoring System</div>
        <div>✔ Community Focused</div>
        <div>✔ Fast & Secure</div>
      </div>

      {/* Footer */}
      <footer className="bg-gray-50 p-5 border-t border-gray-200">
        
        <p className=" text-center text-sm text-black/70">
          &copy; {new Date().getFullYear()} Sucol Water System. All rights reserved.
        </p>
      </footer>

    </div>
  );
}
