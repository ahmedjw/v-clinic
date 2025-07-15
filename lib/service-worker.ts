"use client";

export const registerServiceWorker = async () => {
  if (typeof window === "undefined" || !("serviceWorker" in navigator)) {
    return false;
  }

  try {
    const registration = await navigator.serviceWorker.register("/sw.js", {
      scope: "/",
    });

    registration.addEventListener("updatefound", () => {
      const newWorker = registration.installing;
      if (newWorker) {
        newWorker.addEventListener("statechange", () => {
          if (
            newWorker.state === "installed" &&
            navigator.serviceWorker.controller
          ) {
            // New content is available, prompt user to refresh
            if (confirm("New version available! Refresh to update?")) {
              window.location.reload();
            }
          }
        });
      }
    });

    console.log("Service Worker registered successfully:", registration);
    return true;
  } catch (error) {
    console.error("Service Worker registration failed:", error);
    return false;
  }
};

export const unregisterServiceWorker = async () => {
  if (typeof window === "undefined" || !("serviceWorker" in navigator)) {
    return false;
  }

  try {
    const registration = await navigator.serviceWorker.getRegistration();
    if (registration) {
      await registration.unregister();
      console.log("Service Worker unregistered successfully");
      return true;
    }
  } catch (error) {
    console.error("Service Worker unregistration failed:", error);
  }
  return false;
};
