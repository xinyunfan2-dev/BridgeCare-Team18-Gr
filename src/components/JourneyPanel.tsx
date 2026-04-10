import { useWelfare } from '@/context/WelfareContext';
import { Progress } from '@/components/ui/progress';
import { CheckCircle2, Circle, FileText, FolderOpen, ListChecks } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

const statusLabels: Record<string, string> = {
  not_started: '未开始',
  in_progress: '进行中',
  submitted: '已提交',
  approved: '已批准',
};

const statusColors: Record<string, string> = {
  not_started: 'bg-muted text-muted-foreground',
  in_progress: 'bg-accent text-accent-foreground',
  submitted: 'bg-primary/10 text-primary',
  approved: 'bg-primary/20 text-primary',
};

const JourneyPanel = () => {
  const { journeyApplications, updateProgramProgress, userProfile } = useWelfare();

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
