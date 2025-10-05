import React from "react";
import LandingImage from "../assets/Landing1.png";
import { useNavigate } from "react-router-dom";
export default function Landing() {
  const landingStyle = {
    backgroundImage: `url(${LandingImage})`,
    height: "100vh",
    backgroundSize: "cover",
    backgroundPosition: "center",
    backgroundRepeat: "no-repeat",
  };
  const navigate=useNavigate();

  return (
  <div style={landingStyle}>
    <div style={{
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'flex-end',
    alignItems: 'center',
    height: '80%' // Crucial for 'flex-end' to work and move content to the bottom
}}>
    <div>
        <button onClick={()=>{navigate("/register")}} className="bg-indigo-500 hover:bg-indigo-700 text-white cursor-pointer font-bold py-4 px-12 mx-20 rounded">
        Sign Up
        </button>
        <button onClick={()=>{navigate("/login")}} className="bg-indigo-500 hover:bg-indigo-700 text-white cursor-pointer font-bold py-4 px-12 rounded">
        Sign In
        </button>
    </div>
</div>
  </div>
  );
}
