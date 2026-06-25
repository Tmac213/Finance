import { createRoot } from 'react-dom/client';
import App from './App.tsx';
import './index.css';

createRoot(document.getElementById('root')!).render(<App />);

// Unregister any existing service workers to prevent caching issues
if ('serviceWorker' in navigator) {
    navigator.serviceWorker.getRegistrations().then((registrations) => {
        for (let registration of registrations) {
            registration.unregister().then((success) => {
                if (success) {
                    console.log('SW unregistered successfully');
                }
            });
        }
    });
}
