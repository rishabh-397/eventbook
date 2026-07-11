import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import './index.css';
import App from './App.jsx';
import { ThemeProvider } from './context/ThemeContext.jsx';
import { Toaster } from 'react-hot-toast';

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <ThemeProvider>
      <App />
      <Toaster position="top-right" toastOptions={{
        style: { background: '#12161F', color: '#EDEAE3', border: '1px solid #232838' },
      }} />
    </ThemeProvider>
  </StrictMode>,
);