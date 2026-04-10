import { ChatMessage, WelfareProgram } from '@/types/welfare';

export const initialMessages: ChatMessage[] = [
  {
    id: '1',
    role: 'agent',
    type: 'text',
    content: "Welcome! I'm your AI Welfare Agent for Hong Kong. I can help you discover benefits you may qualify for — such as OALA, CSSA, public housing, and more. Simply describe your situation, and I'll analyze what you may be eligible for.",
    timestamp: new Date(),
  },
];

export const samplePrograms: WelfareProgram[] = [
  {
    id: 'oala',
    name: 'Old Age Living Allowance (OALA)',
    status: 'not_started',
    progress: 0,
    checklist: [
      { id: '1', label: 'Age verification (65+)', completed: false },
      { id: '2', label: 'Asset declaration', completed: false },
      { id: '3', label: 'Application submitted', completed: false },
    ],
  },
  {
    id: 'cssa',
    name: 'CSSA',
    status: 'not_started',
    progress: 0,
    checklist: [
      { id: '1', label: 'Income assessment', completed: false },
      { id: '2', label: 'Residency verification', completed: false },
      { id: '3', label: 'Application submitted', completed: false },
    ],
  },
];

export const initialTerminalLogs: string[] = [
  `[${new Date().toLocaleTimeString()}] [System] HK Welfare AI Agent initialized.`,
  `[${new Date().toLocaleTimeString()}] [System] DeepSeek integration ready.`,
];
