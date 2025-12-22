'use client';

import React from 'react';
import { SessionProvider } from 'next-auth/react';
import ThemeRegistry from '../context/ThemeContext';
import { AuthProvider } from '../context/AuthContext';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

interface ProvidersProps {
    children: React.ReactNode;
}

export const Providers: React.FC<ProvidersProps> = ({ children }) => {
    return (
        <SessionProvider>
            <AuthProvider>
                <ThemeRegistry>
                    {children}
                    {/* <ToastContainer
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
          toastClassName="custom-toast"
          bodyClassName="custom-toast-body"
          progressClassName="custom-toast-progress"
        /> */}
                </ThemeRegistry>
            </AuthProvider>
        </SessionProvider>
    );
};
