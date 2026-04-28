// Firebase Cloud Messaging Service Worker
// This handles push notifications when the app is in background or closed
// NOTE: Firebase config values must be hardcoded here as service workers
// cannot access Next.js environment variables

importScripts('https://www.gstatic.com/firebasejs/10.7.1/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.7.1/firebase-messaging-compat.js');

// Firebase config - using public values from Firebase Console
// These are safe to expose as they are client-side keys
firebase.initializeApp({
    apiKey: "AIzaSyB-u1cW5hPNPKJW9zFZ-X4hHJE3X8bXHbk",
    authDomain: "gallery-live-gla.firebaseapp.com",
    projectId: "gallery-live-gla",
    storageBucket: "gallery-live-gla.firebasestorage.app",
    messagingSenderId: "1069407998888",
    appId: "1:1069407998888:web:a35cdaaf4eb59df07d50e9"
});

const messaging = firebase.messaging();

// Handle background messages
messaging.onBackgroundMessage((payload) => {
    console.log('[SW] Background message received:', payload);

    const notificationTitle = payload.notification?.title || 'CampusHub';
    const notificationOptions = {
        body: payload.notification?.body || 'You have a new notification',
        icon: '/icons/icon-192x192.png',
        badge: '/icons/badge-72x72.png',
        tag: payload.data?.type || 'gla-gallery-notification',
        data: {
            url: payload.data?.link || '/',
            ...payload.data
        },
        actions: [
            { action: 'open', title: 'View' },
            { action: 'dismiss', title: 'Dismiss' }
        ],
        requireInteraction: false,
        vibrate: [200, 100, 200]
    };

    self.registration.showNotification(notificationTitle, notificationOptions);
});

// Handle notification click
self.addEventListener('notificationclick', (event) => {
    console.log('[SW] Notification clicked:', event);

    event.notification.close();

    if (event.action === 'dismiss') {
        return;
    }

    // Navigate to the link specified in the notification
    const urlToOpen = event.notification.data?.url || '/';

    event.waitUntil(
        clients.matchAll({ type: 'window', includeUncontrolled: true }).then((windowClients) => {
            // Check if there's already a window open
            for (const client of windowClients) {
                if (client.url.includes(self.location.origin) && 'focus' in client) {
                    client.focus();
                    client.navigate(urlToOpen);
                    return;
                }
            }
            // If no window is open, open a new one
            if (clients.openWindow) {
                return clients.openWindow(urlToOpen);
            }
        })
    );
});

// Handle push event directly (fallback)
self.addEventListener('push', (event) => {
    console.log('[SW] Push event received');

    if (event.data) {
        try {
            const data = event.data.json();
            console.log('[SW] Push data:', data);
        } catch (e) {
            console.log('[SW] Push text:', event.data.text());
        }
    }
});

console.log('[SW] Firebase Messaging Service Worker loaded');
