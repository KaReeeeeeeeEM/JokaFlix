import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import App from './App';


// Import the Service Worker
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('../service-worker.js')
      .then(registration => {
        console.log('ServiceWorker registration successful with scope: ', registration.scope);
      })
      .catch(error => {
        console.log('ServiceWorker registration failed: ', error);
      });
  });
}

if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('../service-worker.js').then(registration => {
      console.log('Service Worker registered: ', registration);

      registration.onupdatefound = () => {
        const installingWorker = registration.installing;
        installingWorker.onstatechange = () => {
          if (installingWorker.state === 'installed') {
            if (navigator.serviceWorker.controller) {
              // New update available
              showUpdateNotification();
            } else {
              // Content cached for offline use
              console.log('Content cached for offline use');
            }
          }
        };
      };
    }).catch(registrationError => {
      console.log('Service Worker registration failed: ', registrationError);
    });
  });
}

function showUpdateNotification() {
  const notification = document.createElement('div');
  notification.style.position = 'fixed';
  notification.style.bottom = '0';
  notification.style.left = '0';
  notification.style.width = '100%';
  notification.style.backgroundColor = '#000';
  notification.style.color = '#fff';
  notification.style.textAlign = 'center';
  notification.style.padding = '1em';
  notification.innerText = 'New update available! Refresh the page to get the latest version.';
  document.body.appendChild(notification);

  notification.addEventListener('click', () => {
    window.location.reload();
  });
}


const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
