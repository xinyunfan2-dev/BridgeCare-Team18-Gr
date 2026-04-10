
import BreadcrumbStepper from '@/components/BreadcrumbStepper';
import TerminalConsole from '@/components/TerminalConsole';
import ChatInterface from '@/components/ChatInterface';
import JourneyPanel from '@/components/JourneyPanel';

const Index = () => {
  return (
    <>
      <div className="flex flex-col h-screen bg-muted/30">
        {/* Top: Breadcrumb */}
        <header className="flex items-center justify-between px-6 py-3 bg-background border-b">
          <div className="flex flex-col">
            <span className="text-lg font-bold text-primary tracking-tight leading-tight">BridgeCare</span>
            <span className="text-muted-foreground tracking-widest uppercase leading-tight font-serif text-sm">{"\n"}</span>
          </div>
          <BreadcrumbStepper />
          <div className="w-20" />
        </header>

        {/* Body: 7:3 */}
        <div className="flex flex-1 min-h-0">
          {/* Left 70% */}
          <main className="flex flex-col w-[70%] border-r">
            {/* Terminal */}
            <div className="p-4 pb-2">
              <TerminalConsole />
            </div>
            {/* Chat */}
            <ChatInterface />
          </main>

          {/* Right 30% */}
          <aside className="w-[30%] bg-background">
            <JourneyPanel />
          </aside>
        </div>
      </div>
    </>
  );
};

export default Index;
