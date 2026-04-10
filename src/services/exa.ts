import { supabase } from '@/integrations/supabase/client';

export interface ExaResource {
  id: string;
  title: string;
  url: string;
  snippet: string;
  category: string;
}

export async function searchWelfareResources(welfareType: string): Promise<ExaResource[]> {
  try {
    const { data, error } = await supabase.functions.invoke('exa-search', {
      body: { query: welfareType, numResults: 3 },
    });

    if (error) {
      console.error('Exa edge function error:', error.message);
      return [];
    }

    if (data.error) {
      console.error('Exa API error:', data.error);
      return [];
    }

    return data.results || [];
  } catch (error) {
    console.error('Exa Search Failed:', error);
    return [];
  }
}