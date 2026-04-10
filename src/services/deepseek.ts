import { UserProfile } from '@/types/welfare';
import { supabase } from '@/integrations/supabase/client';

export interface DeepSeekResponse {
  category: string;
  thought_process: string;
  reply_text: string;
  missing_fields: string[];
}

const FIELD_LABELS: Record<string, string> = {
  age: 'Age',
  income: 'Monthly Income (HKD)',
  rent: 'Monthly Rent (HKD)',
  household_size: 'Household Size',
  name: 'Full Name',
  district: 'District of Residence',
  employment_status: 'Employment Status',
  disability_type: 'Type of Disability',
  working_hours: 'Monthly Working Hours',
  transport_expense: 'Monthly Transport Expense (HKD)',
  assets: 'Total Assets (HKD)',
  residency_years: 'Years of HK Residency',
  date_of_birth: 'Date of Birth',
  marital_status: 'Marital Status',
};

export function buildFieldsFromMissing(missingFields: string[]) {
  return missingFields.map(fieldName => ({
    name: fieldName,
    type: (['income', 'rent', 'household_size', 'age', 'working_hours', 'transport_expense', 'assets', 'residency_years'].includes(fieldName) ? 'number' : 'text') as 'text' | 'number',
    label: FIELD_LABELS[fieldName] || fieldName.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase()),
    required: true,
    placeholder: `Enter your ${fieldName.replace(/_/g, ' ')}`,
  }));
}

export async function callDeepSeek(
  userMessage: string,
  profile: UserProfile,
  conversationHistory: { role: string; content: string }[] = []
): Promise<DeepSeekResponse> {
  const { data, error } = await supabase.functions.invoke('deepseek-proxy', {
    body: { userMessage, profile, conversationHistory },
  });

  if (error) {
    throw new Error(`Edge Function error: ${error.message}`);
  }

  if (data.error) {
    throw new Error(data.error);
  }

  return data as DeepSeekResponse;
}