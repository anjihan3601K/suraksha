
import { AppHeader } from "@/components/shared/AppHeader";
import { VoiceSOS } from "@/components/dashboard/VoiceSOS";

export default function VoiceSOSPage() {
  return (
    <div className="flex flex-col min-h-screen bg-background">
      <AppHeader />
      <main className="flex-1 p-4 md:p-6 lg:p-8 flex justify-center">
        <div className="w-full max-w-lg">
          <VoiceSOS />
        </div>
      </main>
    </div>
  );
}
