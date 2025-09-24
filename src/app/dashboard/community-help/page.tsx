
import { AppHeader } from "@/components/shared/AppHeader";
import { CommunityHelp } from "@/components/dashboard/CommunityHelp";
import { Card, CardContent } from "@/components/ui/card";

export default function CommunityHelpPage() {
  return (
    <div className="flex flex-col min-h-screen bg-background">
      <AppHeader />
      <main className="flex-1 p-4 md:p-6 lg:p-8 flex justify-center">
        <div className="w-full max-w-4xl">
          <CommunityHelp />
        </div>
      </main>
    </div>
  );
}
