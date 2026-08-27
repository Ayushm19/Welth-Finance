import { BarLoader } from "react-spinners";

export default function TeamLoading() {
  return (
    <div className="px-5 py-16 space-y-6">
      <div className="space-y-3">
        <div className="h-4 w-40 rounded-full bg-blue-50 animate-pulse" />
        <div className="h-12 w-56 rounded-md bg-slate-100 animate-pulse" />
        <div className="h-4 w-80 max-w-full rounded-md bg-slate-100 animate-pulse" />
      </div>
      <p className="text-sm text-muted-foreground">Opening team page...</p>
      <BarLoader width="100%" color="#2563eb" />
    </div>
  );
}
