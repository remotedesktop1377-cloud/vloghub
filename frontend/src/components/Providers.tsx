'use client';

import React from 'react';
import { SessionProvider } from 'next-auth/react';
import ThemeRegistry from '../context/ThemeContext';
import { AuthProvider } from '../context/AuthContext';
import { ToastContainer } from 'react-toastify';
import { Toaster } from 'react-hot-toast';
import 'react-toastify/dist/ReactToastify.css';
import { Provider } from 'react-redux';
import { store } from '@/store';

interface ProvidersProps {
    children: React.ReactNode;
}

export const Providers: React.FC<ProvidersProps> = ({ children }) => {
    return (
        <Provider store={store}>
            <SessionProvider>
                <AuthProvider>
                    <ThemeRegistry>
                        <Toaster
                            toastOptions={{
                                style: {
                                    borderRadius: '10px',
                                    background: '#333',
                                    color: '#fff',
                                },
                            }}
                        />
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
                            toastClassName="custom-toast"
                            bodyClassName="custom-toast-body"
                            progressClassName="custom-toast-progress"
                        />
                        {children}
                    </ThemeRegistry>
                </AuthProvider>
            </SessionProvider>
        </Provider>
    );
};
