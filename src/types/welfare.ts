export interface FormField {
  name: string;
  type: 'text' | 'number' | 'select' | 'checkbox' | 'date';
  label: string;
  required?: boolean;
  options?: string[];
  placeholder?: string;
}

export interface WelfareCard {
  id: string;
  name: string;
  description: string;
  resources: { title: string; url: string; snippet: string }[];
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'agent';
  type: 'text' | 'form_request' | 'welfare_cards';
  content?: string;
  fields?: FormField[];
  formTitle?: string;
  timestamp: Date;
  formSubmitted?: boolean;
  welfareCards?: WelfareCard[];
}

export interface ChecklistItem {
  id: string;
  label: string;
  completed: boolean;
  completedAt?: string;
  category: 'doc' | 'step';
}

export interface WelfareProgram {
  id: string;
  name: string;
  status: 'not_started' | 'in_progress' | 'submitted' | 'approved';
  progress: number;
  checklist: ChecklistItem[];
  icon?: string;
}

export interface UserProfile {
  name?: string;
  dateOfBirth?: string;
  income?: number;
  householdSize?: number;
  [key: string]: unknown;
}

export interface PreparedDocument {
  docLabel: string;
  fileName: string;
  pdfBlob: Blob;
  imageDataUrl: string;
}

export interface UserInfo {
  name: string;
  hkid: string;
  phone: string;
  address: string;
  email: string;
}

export interface DocPrepSession {
  programId: string;
  programName: string;
  userName: string;
  userInfo: UserInfo;
  docs: string[];
  currentDocIndex: number;
  preparedDocs: PreparedDocument[];
  status: 'asking_info' | 'collecting_docs' | 'completed';
}

export type StepName = 'Discovery' | 'Profile' | 'Selection' | 'Action' | 'Journey';

export const STEPS: StepName[] = ['Discovery', 'Profile', 'Selection', 'Action', 'Journey'];