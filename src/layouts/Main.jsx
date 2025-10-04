import React from 'react';

import { Link, Outlet } from "react-router";
import Navbar from './../pages/Common/Navbar/Navbar';
import Footer from './../pages/Common/Footer/Footer';

export default function MainLayout() {
  return (
    <div>
      <nav>
        <Navbar/>
      </nav>
      <hr />
      <Outlet />
      <Footer/>
    </div>
  );
}