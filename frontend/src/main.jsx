import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import App from './App.jsx'
import './index.css'
import { ToastContainer } from 'react-toastify'
import 'react-toastify/dist/ReactToastify.css'
import './theme.css'
import { LanguageProvider } from './i18n/LanguageContext.jsx'
import PageTranslator from './i18n/PageTranslator.jsx'

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <BrowserRouter>
      <LanguageProvider>
        <App />
        <PageTranslator />
        <ToastContainer position="top-right" autoClose={3500} newestOnTop closeOnClick pauseOnHover theme="dark" />
      </LanguageProvider>
    </BrowserRouter>
  </React.StrictMode>,
)
