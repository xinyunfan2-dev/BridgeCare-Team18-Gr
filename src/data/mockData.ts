import { ChatMessage, WelfareProgram } from '@/types/welfare';

export const initialMessages: ChatMessage[] = [
  {
    id: '1',
    role: 'agent',
    type: 'text',
    content: "Hi! I'm your AI Welfare Agent. Tell me a bit about your situation (age, income, or housing), and I'll find the best HK benefits for you.",
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
