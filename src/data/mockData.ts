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

export const samplePrograms: WelfareProgram[] = [];

export const initialTerminalLogs: string[] = [
  `[${new Date().toLocaleTimeString()}] [System] HK Welfare AI Agent 已启动。`,
  `[${new Date().toLocaleTimeString()}] [System] DeepSeek + Exa 集成就绪。`,
];