import { WifiOff } from "lucide-react";

function OfflinePage() {
  return (
    <div className="offline-page">
      <WifiOff size={54} />
      <h2>You are offline</h2>
      <p>Internet connection नाही. Connection परत आलं की app automatically चालू होईल.</p>
    </div>
  );
}

export default OfflinePage;