import { useState, useEffect, useCallback } from "react";
import toast from "react-hot-toast";

export function usePermissions() {
  const [locationStatus, setLocationStatus] = useState("prompt"); // "granted" | "denied" | "prompt" | "unsupported"
  const [cameraStatus, setCameraStatus] = useState("prompt");
  const [loading, setLoading] = useState(false);

  // Query browser permissions safely
  const checkPermissions = useCallback(async () => {
    setLoading(true);

    // 1. Check Geolocation Permission
    if (!navigator.geolocation) {
      setLocationStatus("unsupported");
    } else if (navigator.permissions && navigator.permissions.query) {
      try {
        const geoResult = await navigator.permissions.query({ name: "geolocation" });
        setLocationStatus(geoResult.state); // "granted" | "denied" | "prompt"

        geoResult.onchange = () => {
          setLocationStatus(geoResult.state);
        };
      } catch {
        setLocationStatus("prompt");
      }
    } else {
      setLocationStatus("prompt");
    }

    // 2. Check Camera Permission
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      setCameraStatus("unsupported");
    } else if (navigator.permissions && navigator.permissions.query) {
      try {
        const camResult = await navigator.permissions.query({ name: "camera" });
        setCameraStatus(camResult.state);

        camResult.onchange = () => {
          setCameraStatus(camResult.state);
        };
      } catch {
        setCameraStatus("prompt");
      }
    } else {
      setCameraStatus("prompt");
    }

    setLoading(false);
  }, []);

  useEffect(() => {
    checkPermissions();
  }, [checkPermissions]);

  // Request Location Access
  const requestLocationAccess = useCallback(async (silent = false) => {
    if (!navigator.geolocation) {
      setLocationStatus("unsupported");
      if (!silent) toast.error("Location feature is not supported on this device.");
      return "unsupported";
    }

    return new Promise((resolve) => {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          setLocationStatus("granted");
          if (!silent) toast.success("Location Access Granted");
          resolve("granted");
        },
        (err) => {
          if (err.code === err.PERMISSION_DENIED) {
            setLocationStatus("denied");
            if (!silent) {
              toast.error("Location access was denied. You can enable it from browser settings.");
            }
            resolve("denied");
          } else {
            setLocationStatus("prompt");
            if (!silent) {
              toast.error("Location request timed out. Please try again.");
            }
            resolve("prompt");
          }
        },
        { enableHighAccuracy: true, timeout: 10000 }
      );
    });
  }, []);

  // Request Camera Access
  const requestCameraAccess = useCallback(async (silent = false) => {
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      setCameraStatus("unsupported");
      if (!silent) toast.error("Camera feature is not supported on this browser/device.");
      return "unsupported";
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "environment" },
      });

      // Immediately stop temporary stream tracks to release camera hardware
      stream.getTracks().forEach((track) => track.stop());

      setCameraStatus("granted");
      if (!silent) toast.success("Camera Access Granted");
      return "granted";
    } catch (err) {
      if (err.name === "NotAllowedError" || err.name === "PermissionDeniedError") {
        setCameraStatus("denied");
        if (!silent) {
          toast.error("Camera access was denied. You can enable it from browser settings.");
        }
        return "denied";
      }

      if (err.name === "NotFoundError" || err.name === "DevicesNotFoundError") {
        setCameraStatus("unsupported");
        if (!silent) toast.error("No camera hardware detected on this device.");
        return "unsupported";
      }

      setCameraStatus("prompt");
      if (!silent) toast.error("Camera access could not be initialized.");
      return "prompt";
    }
  }, []);

  // Request All Permissions Sequentially
  const requestAllPermissions = useCallback(async () => {
    setLoading(true);

    const locRes = await requestLocationAccess(true);
    const camRes = await requestCameraAccess(true);

    setLoading(false);

    if (locRes === "granted" && camRes === "granted") {
      toast.success("Location and Camera permissions enabled!");
    } else {
      toast("Permission statuses updated. Check Settings for details.", {
        icon: "ℹ️",
      });
    }

    return { location: locRes, camera: camRes };
  }, [requestLocationAccess, requestCameraAccess]);

  // Run Onboarding Once After Login
  const runLoginOnboarding = useCallback(async () => {
    const onboardingDone = localStorage.getItem("pcms_permission_onboarding_completed");
    if (onboardingDone) return;

    localStorage.setItem("pcms_permission_onboarding_completed", "true");

    // Request permissions naturally in background after login
    setTimeout(async () => {
      const locRes = await requestLocationAccess(true);
      const camRes = await requestCameraAccess(true);

      if (locRes === "denied" || camRes === "denied") {
        toast("Some device permissions are disabled. You can manage them from Settings.", {
          icon: "⚡",
          duration: 5000,
        });
      }
    }, 1200);
  }, [requestLocationAccess, requestCameraAccess]);

  return {
    locationStatus,
    cameraStatus,
    loading,
    checkPermissions,
    requestLocationAccess,
    requestCameraAccess,
    requestAllPermissions,
    runLoginOnboarding,
  };
}

export default usePermissions;
