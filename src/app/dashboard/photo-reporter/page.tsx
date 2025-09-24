
import { AppHeader } from "@/components/shared/AppHeader";
import { PhotoReporter } from "@/components/dashboard/PhotoReporter";

export default function PhotoReporterPage() {
  return (
    <div className="flex flex-col min-h-screen bg-background">
      <AppHeader />
      <main className="flex-1 p-4 md:p-6 lg:p-8 flex justify-center">
        <div className="w-full max-w-lg">
          <PhotoReporter />
        </div>
      </main>
    </div>
  );
}
