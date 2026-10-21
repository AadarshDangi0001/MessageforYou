import './styles/base.css';
import React from 'react'; import { createRoot } from 'react-dom/client'; import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { warmUp } from './lib/api.js';
import Wizard from './wizard/Wizard.jsx'; import Experience from './experience/Experience.jsx';
warmUp();
createRoot(document.getElementById('root')).render(
  <BrowserRouter><Routes>
    <Route path="/" element={<Wizard />} />
    <Route path="/g/:slug" element={<Experience />} />
  </Routes></BrowserRouter>);
