import React, { createContext, useContext, useState, useCallback, type ReactNode } from 'react';
import { ChatMessage, UserProfile, WelfareProgram, DocPrepSession, PreparedDocument, STEPS } from '@/types/welfare';
import { initialMessages, samplePrograms, initialTerminalLogs } from '@/data/mockData';

interface WelfareState {
  activeStep: number;
  stepCompleted: boolean[];
  userProfile: UserProfile;
  chatMessages: ChatMessage[];
  journeyApplications: WelfareProgram[];
  terminalLogs: string[];
  docPrepSession: DocPrepSession | null;
  setActiveStep: (step: number) => void;
  completeStep: (step: number) => void;
  navigateBack: (step: number) => void;
  updateProfile: (data: Partial<UserProfile>) => void;
  addChatMessage: (msg: ChatMessage) => void;
  markFormSubmitted: (messageId: string) => void;
  addProgram: (program: WelfareProgram) => void;
  updateProgramProgress: (programId: string, checklistItemId: string) => void;
  addTerminalLog: (log: string) => void;
  startDocPrep: (programId: string, programName: string, docs: string[]) => void;
  setDocPrepUserInfo: (info: import('@/types/welfare').UserInfo) => void;
  addPreparedDoc: (doc: PreparedDocument) => void;
  advanceDocPrep: () => void;
  completeDocPrep: () => void;
  clearDocPrep: () => void;
}

const WelfareContext = createContext<WelfareState | null>(null);

export const useWelfare = () => {
  const ctx = useContext(WelfareContext);
  if (!ctx) throw new Error('useWelfare must be used within WelfareProvider');
  return ctx;
};

export const WelfareProvider = ({ children }: { children: ReactNode }) => {
  const [activeStep, setActiveStepRaw] = useState(0);
  const [stepCompleted, setStepCompleted] = useState<boolean[]>([false, false, false, false, false]);
  const [userProfile, setUserProfile] = useState<UserProfile>({});
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>(initialMessages);
  const [journeyApplications, setJourneyApplications] = useState<WelfareProgram[]>(samplePrograms);
  const [terminalLogs, setTerminalLogs] = useState<string[]>(initialTerminalLogs);
  const [docPrepSession, setDocPrepSession] = useState<DocPrepSession | null>(null);

  const addTerminalLog = useCallback((log: string) => {
    const ts = new Date().toLocaleTimeString();
    setTerminalLogs(prev => [...prev, `[${ts}] ${log}`]);
  }, []);

  const setActiveStep = useCallback((step: number) => {
    if (step >= 0 && step < STEPS.length) setActiveStepRaw(step);
  }, []);

  const completeStep = useCallback((step: number) => {
    setStepCompleted(prev => {
      const next = [...prev];
      next[step] = true;
      return next;
    });
    addTerminalLog(`[Step] "${STEPS[step]}" completed.`);
    if (step < STEPS.length - 1) setActiveStepRaw(step + 1);
  }, [addTerminalLog]);

  const navigateBack = useCallback((step: number) => {
    setStepCompleted(prev => {
      const next = [...prev];
      for (let i = step + 1; i < next.length; i++) next[i] = false;
      return next;
    });
    setActiveStepRaw(step);
    addTerminalLog(`[Nav] Returned to "${STEPS[step]}". Subsequent progress reset.`);
  }, [addTerminalLog]);

  const updateProfile = useCallback((data: Partial<UserProfile>) => {
    setUserProfile(prev => ({ ...prev, ...data }));
    addTerminalLog('[Data Sync] Updating user profile...');
  }, [addTerminalLog]);

  const addChatMessage = useCallback((msg: ChatMessage) => {
    setChatMessages(prev => [...prev, msg]);
  }, []);

  const markFormSubmitted = useCallback((messageId: string) => {
    setChatMessages(prev =>
      prev.map(m => m.id === messageId ? { ...m, formSubmitted: true } : m)
    );
  }, []);

  const addProgram = useCallback((program: WelfareProgram) => {
    setJourneyApplications(prev => {
      if (prev.find(p => p.id === program.id)) return prev;
      return [...prev, program];
    });
    addTerminalLog(`[Journey] Added "${program.name}" to applications.`);
  }, [addTerminalLog]);

  const updateProgramProgress = useCallback((programId: string, checklistItemId: string) => {
    setJourneyApplications(prev =>
      prev.map(p => {
        if (p.id !== programId) return p;
        const now = new Date();
        const dateStr = `${now.getMonth() + 1}/${now.getDate()}`;
        const checklist = p.checklist.map(c =>
          c.id === checklistItemId
            ? { ...c, completed: !c.completed, completedAt: !c.completed ? dateStr : undefined }
            : c
        );
        const completed = checklist.filter(c => c.completed).length;
        const progress = Math.round((completed / checklist.length) * 100);
        const status = progress === 100 ? 'submitted' as const : progress > 0 ? 'in_progress' as const : 'not_started' as const;
        return { ...p, checklist, progress, status };
      })
    );
  }, []);

  const startDocPrep = useCallback((programId: string, programName: string, docs: string[]) => {
    setDocPrepSession({
      programId,
      programName,
      userName: '',
      docs,
      currentDocIndex: 0,
      preparedDocs: [],
      status: 'asking_name',
    });
    addTerminalLog(`[DocPrep] 开始为 "${programName}" 准备申请文件。`);
  }, [addTerminalLog]);

  const setDocPrepUserName = useCallback((name: string) => {
    setDocPrepSession(prev => prev ? { ...prev, userName: name, status: 'collecting_docs' } : prev);
  }, []);

  const addPreparedDoc = useCallback((doc: PreparedDocument) => {
    setDocPrepSession(prev => prev ? { ...prev, preparedDocs: [...prev.preparedDocs, doc] } : prev);
  }, []);

  const advanceDocPrep = useCallback(() => {
    setDocPrepSession(prev => {
      if (!prev) return prev;
      const nextIndex = prev.currentDocIndex + 1;
      if (nextIndex >= prev.docs.length) {
        return { ...prev, currentDocIndex: nextIndex, status: 'completed' };
      }
      return { ...prev, currentDocIndex: nextIndex };
    });
  }, []);

  const completeDocPrep = useCallback(() => {
    setDocPrepSession(prev => prev ? { ...prev, status: 'completed' } : prev);
  }, []);

  const clearDocPrep = useCallback(() => {
    setDocPrepSession(null);
  }, []);

  return (
    <WelfareContext.Provider value={{
      activeStep, stepCompleted, userProfile, chatMessages, journeyApplications, terminalLogs, docPrepSession,
      setActiveStep, completeStep, navigateBack, updateProfile, addChatMessage, markFormSubmitted,
      addProgram, updateProgramProgress, addTerminalLog, startDocPrep, setDocPrepUserName,
      addPreparedDoc, advanceDocPrep, completeDocPrep, clearDocPrep,
    }}>
      {children}
    </WelfareContext.Provider>
  );
};
