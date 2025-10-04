import { useEffect } from 'react';
import React from 'react';
import './App.css'
import Aos from 'aos';
import router from './routes/router';
import { RouterProvider } from 'react-router';
import { ToastContainer } from 'react-toastify';

function App() {
  useEffect(() => {
    Aos.init();
    Aos.refresh();
  }, [])
  return (
    <div className='relative'>
      <ToastContainer
        position="top-right"
        autoClose={5000}
        hideProgressBar={false}
        newestOnTop={false}
        closeOnClick
        rtl={false}
        pauseOnFocusLoss
        draggable
        pauseOnHover
        theme="colored"
      />
      <RouterProvider router={router}>
      </RouterProvider>
    </div>
  );
}

export default App
