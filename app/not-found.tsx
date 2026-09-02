import { App } from "@/src/ui/App";

// Every room has its own URL (/{room-name}-{roomId}), but this is a fully
// static export with no server-side dynamic routes to render those paths —
// so any URL Next.js doesn't otherwise recognize falls back to the same
// client app, which reads the room id out of the URL itself.
export default function NotFound() {
  return <App />;
}
