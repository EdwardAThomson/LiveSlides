import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import AudienceView from './components/AudienceView';

ReactDOM.createRoot(document.getElementById('audience-root')).render(
  <React.StrictMode>
    <AudienceView />
  </React.StrictMode>,
);
