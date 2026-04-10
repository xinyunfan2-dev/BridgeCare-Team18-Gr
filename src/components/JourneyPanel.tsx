import { useWelfare } from '@/context/WelfareContext';
import { Progress } from '@/components/ui/progress';
import { CheckCircle2, Circle, FileText, FolderOpen, ListChecks, Play } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';

const PROGRAM_DOCS: Record<string, string[]> = {
  cssa: ['HK ID Card', 'Proof of Address', 'Bank Passbook / Statement', 'Income Proof', 'Asset Proof', 'Medical Report'],
  oala: ['HK ID Card', 'Bank Passbook / Statement', 'Asset Proof', 'Proof of Address'],
  'health-voucher': ['HK ID Card'],
  'public-housing': ['HK ID Card', 'Proof of Address', 'Income & Asset Proof', 'Family Relationship Proof', 'Application Form HD274'],
  wfa: ['HK ID Card', 'Employer Certificate', 'Income Proof (Payslip)', 'Bank Passbook', 'Proof of Address'],
};

const statusLabels: Record<string, string> = {
  not_started: 'Not Started',
  in_progress: 'In Progress',
  submitted: 'Submitted',
  approved: 'Approved',
};

const statusColors: Record<string, string> = {
  not_started: 'bg-muted text-muted-foreground',
  in_progress: 'bg-accent text-accent-foreground',
  submitted: 'bg-primary/10 text-primary',
  approved: 'bg-primary/20 text-primary',
};

const JourneyPanel = () => {
  const { journeyApplications, updateProgramProgress, userProfile, startDocPrep, docPrepSession, addChatMessage, addTerminalLog } = useWelfare();

  const handleStartDocPrep = (programId: string, programName: string) => {
    const docs = PROGRAM_DOCS[programId] || ['HK ID Card', 'Proof of Address', 'Income / Asset Proof'];
    startDocPrep(programId, programName, docs);
    addChatMessage({
      id: Date.now().toString(),
      role: 'agent',
      type: 'text',
      content: `📋 Let's start preparing the application documents for "${programName}". Please follow the document prep assistant below.`,
      timestamp: new Date(),
    });
    addTerminalLog(`[DocPrep] User started document preparation for "${programName}".`);
  };

  return (
    <div className="h-full flex flex-col">
      <div className="px-5 py-4 border-b">
        <h2 className="text-sm font-semibold text-foreground tracking-tight">My Journey</h2>
        {userProfile.name && (
          <p className="text-xs text-muted-foreground mt-0.5">{userProfile.name}</p>
        )}
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {journeyApplications.map(program => {
          const docItems = program.checklist.filter(c => c.category === 'doc');
          const stepItems = program.checklist.filter(c => c.category === 'step');
          const allDocsCompleted = docItems.length > 0 && docItems.every(c => c.completed);
          const isPrepping = docPrepSession?.programId === program.id;

          return (
            <div
              key={program.id}
              className="rounded-2xl border bg-background p-4 space-y-3 shadow-[0_1px_3px_0_rgba(0,0,0,0.04)]"
            >
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-2">
                  <FileText className="w-4 h-4 text-primary" />
                  <span className="text-sm font-medium text-foreground">{program.name}</span>
                </div>
                <Badge
                  variant="secondary"
                  className={`text-[10px] rounded-full px-2 py-0.5 border-0 ${statusColors[program.status] || ''}`}
                >
                  {statusLabels[program.status]}
                </Badge>
              </div>

              <Progress value={program.progress} className="h-1.5 rounded-full" />

              {/* Start doc prep button */}
              {!isPrepping && !docPrepSession && (
                <Button
                  variant="outline"
                  size="sm"
                  className="rounded-full w-full gap-2 text-xs"
                  onClick={() => handleStartDocPrep(program.id, program.name)}
                >
                  <Play className="w-3 h-3" />
                  开始准备申请文件
                </Button>
              )}

              {isPrepping && (
                <div className="rounded-xl bg-primary/5 px-3 py-2 text-xs text-primary font-medium text-center">
                  📝 文件准备中...请在聊天区域操作
                </div>
              )}

              {/* Document preparation section */}
              <div className="space-y-1">
                <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5 px-2 pt-1">
                  <FolderOpen className="w-3 h-3" />
                  准备文件
                </p>
                {docItems.map(item => (
                  <button
                    key={item.id}
                    onClick={() => updateProgramProgress(program.id, item.id)}
                    className="flex items-center gap-2 w-full text-left py-1.5 px-2 rounded-xl hover:bg-accent/40 transition-colors group"
                  >
                    {item.completed ? (
                      <CheckCircle2 className="w-3.5 h-3.5 text-primary flex-shrink-0" />
                    ) : (
                      <Circle className="w-3.5 h-3.5 text-muted-foreground/30 flex-shrink-0 group-hover:text-primary/50" />
                    )}
                    <span className={`text-xs leading-relaxed flex-1 ${item.completed ? 'text-muted-foreground line-through' : 'text-foreground/80'}`}>
                      {item.label}
                    </span>
                    {item.completedAt && (
                      <span className="text-[10px] text-muted-foreground/60 flex-shrink-0">
                        {item.completedAt}
                      </span>
                    )}
                  </button>
                ))}
              </div>

              {/* Application steps section - only shows after all docs done */}
              {allDocsCompleted && stepItems.length > 0 && (
                <div className="space-y-1 border-t pt-2">
                  <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5 px-2 pt-1">
                    <ListChecks className="w-3 h-3" />
                    申请步骤
                  </p>
                  {stepItems.map(item => (
                    <button
                      key={item.id}
                      onClick={() => updateProgramProgress(program.id, item.id)}
                      className="flex items-center gap-2 w-full text-left py-1.5 px-2 rounded-xl hover:bg-accent/40 transition-colors group"
                    >
                      {item.completed ? (
                        <CheckCircle2 className="w-3.5 h-3.5 text-primary flex-shrink-0" />
                      ) : (
                        <Circle className="w-3.5 h-3.5 text-muted-foreground/30 flex-shrink-0 group-hover:text-primary/50" />
                      )}
                      <span className={`text-xs leading-relaxed flex-1 ${item.completed ? 'text-muted-foreground line-through' : 'text-foreground/80'}`}>
                        {item.label}
                      </span>
                      {item.completedAt && (
                        <span className="text-[10px] text-muted-foreground/60 flex-shrink-0">
                          {item.completedAt}
                        </span>
                      )}
                    </button>
                  ))}
                </div>
              )}
            </div>
          );
        })}

        {journeyApplications.length === 0 && (
          <div className="text-center py-12">
            <p className="text-xs text-muted-foreground/60">No applications yet.<br />Start chatting to discover benefits.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default JourneyPanel;
