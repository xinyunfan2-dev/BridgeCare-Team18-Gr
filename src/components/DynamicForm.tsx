import { useState } from 'react';
import { useWelfare } from '@/context/WelfareContext';
import { FormField, ChatMessage, WelfareCard } from '@/types/welfare';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Check, Loader2 } from 'lucide-react';
import { searchWelfareResources } from '@/services/exa';

interface DynamicFormProps {
  messageId: string;
  title?: string;
  fields: FormField[];
}

const DynamicForm = ({ messageId, title, fields }: DynamicFormProps) => {
  const { updateProfile, markFormSubmitted, completeStep, activeStep, addTerminalLog, addChatMessage, userProfile, chatMessages } = useWelfare();
  const [values, setValues] = useState<Record<string, string>>({});
  const [errors, setErrors] = useState<Record<string, boolean>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleChange = (name: string, value: string) => {
    setValues(prev => ({ ...prev, [name]: value }));
    setErrors(prev => ({ ...prev, [name]: false }));
  };

  const handleSubmit = async () => {
    const newErrors: Record<string, boolean> = {};
    fields.forEach(f => {
      if (f.required && !values[f.name]?.trim()) newErrors[f.name] = true;
    });
    if (Object.keys(newErrors).length) {
      setErrors(newErrors);
      return;
    }

    setIsSubmitting(true);

    const parsed: Record<string, unknown> = {};
    fields.forEach(f => {
      parsed[f.name] = f.type === 'number' ? Number(values[f.name]) : values[f.name];
    });

    updateProfile(parsed);
    markFormSubmitted(messageId);
    completeStep(activeStep);
    addTerminalLog('[Data] User profile updated. Searching applicable welfare programs...');

    // Now search for welfare programs using Exa
    try {
      addTerminalLog('[Exa] Searching HK welfare resources...');

      // Determine search queries based on user profile
      const updatedProfile = { ...userProfile, ...parsed };
      const searchQueries = buildSearchQueries(updatedProfile);

      const allCards: WelfareCard[] = [];

      for (const query of searchQueries) {
        addTerminalLog(`[Exa] Searching: "${query.name}"...`);
        const resources = await searchWelfareResources(query.name);
        allCards.push({
          id: query.id,
          name: query.name,
          description: query.description,
          resources: resources.map(r => ({
            title: r.title,
            url: r.url,
            snippet: r.snippet,
          })),
        });
      }

      if (allCards.length > 0) {
        const introMsg: ChatMessage = {
          id: Date.now().toString(),
          role: 'agent',
          type: 'text',
          content: 'Based on your information, here are the welfare programs you may be eligible for. Click on a card to begin the application process:',
          timestamp: new Date(),
        };
        addChatMessage(introMsg);

        const cardsMsg: ChatMessage = {
          id: (Date.now() + 1).toString(),
          role: 'agent',
          type: 'welfare_cards',
          welfareCards: allCards,
          timestamp: new Date(),
        };
        addChatMessage(cardsMsg);
        addTerminalLog(`[Exa] Found ${allCards.length} applicable welfare programs.`);
      } else {
        const fallbackMsg: ChatMessage = {
          id: Date.now().toString(),
          role: 'agent',
          type: 'text',
          content: 'Thank you for your information. I am matching suitable welfare programs for you, please try again later.',
          timestamp: new Date(),
        };
        addChatMessage(fallbackMsg);
      }
    } catch (error) {
      const errMsg = error instanceof Error ? error.message : 'Unknown error';
      addTerminalLog(`[Error] Exa search failed: ${errMsg}`);
      const fallback: ChatMessage = {
        id: Date.now().toString(),
        role: 'agent',
        type: 'text',
        content: 'Thank you for your information. Search encountered an issue, please try again later.',
        timestamp: new Date(),
      };
      addChatMessage(fallback);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="rounded-2xl border border-primary/15 bg-background p-4 space-y-3 max-w-md">
      {title && <p className="text-sm font-semibold text-foreground">{title}</p>}
      {fields.map(field => (
        <div key={field.name} className="space-y-1">
          <label className="text-xs font-medium text-muted-foreground">{field.label}</label>
          <Input
            type={field.type === 'number' ? 'number' : field.type === 'date' ? 'date' : 'text'}
            placeholder={field.placeholder}
            value={values[field.name] || ''}
            onChange={e => handleChange(field.name, e.target.value)}
            disabled={isSubmitting}
            className={`rounded-full border-primary/15 focus-visible:ring-primary/30 ${errors[field.name] ? 'border-destructive' : ''}`}
          />
        </div>
      ))}
      <Button
        onClick={handleSubmit}
        disabled={isSubmitting}
        className="rounded-full gap-1.5 w-full"
        size="sm"
      >
        {isSubmitting ? (
          <>
            <Loader2 className="w-3.5 h-3.5 animate-spin" /> Searching welfare programs...
          </>
        ) : (
          <>
            <Check className="w-3.5 h-3.5" /> Submit
          </>
        )}
      </Button>
    </div>
  );
};

// Determine which welfare programs to search based on user profile
function buildSearchQueries(profile: Record<string, unknown>) {
  const queries: { id: string; name: string; description: string }[] = [];
  const age = Number(profile.age) || 0;
  const income = Number(profile.income) || 0;

  if (age >= 65) {
    queries.push({
      id: 'oala',
      name: '高額長者生活津貼 OALA',
      description: '65歲或以上長者每月可獲發津貼，需通過資產審查。',
    });
    queries.push({
      id: 'health-voucher',
      name: '長者醫療券',
      description: '65歲或以上長者每年$2,000醫療券，可累積至$8,000。',
    });
  }

  if (income === 0 || income < 5000) {
    queries.push({
      id: 'cssa',
      name: '綜合社會保障援助 CSSA',
      description: '為經濟困難人士提供現金援助，包括生活費和租金津貼。',
    });
  }

  if (profile.rent || profile.housing === 'renting' || !profile.housing) {
    queries.push({
      id: 'public-housing',
      name: '公共房屋申請',
      description: '為符合資格的低收入家庭提供租住公屋。',
    });
  }

  if (income > 0 && income < 20000) {
    queries.push({
      id: 'wfa',
      name: '在職家庭津貼',
      description: '為低收入在職家庭提供津貼，需符合工時及入息要求。',
    });
  }

  // Fallback: always include at least CSSA
  if (queries.length === 0) {
    queries.push({
      id: 'cssa',
      name: '綜合社會保障援助 CSSA',
      description: '為經濟困難人士提供現金援助。',
    });
  }

  return queries;
}

export default DynamicForm;