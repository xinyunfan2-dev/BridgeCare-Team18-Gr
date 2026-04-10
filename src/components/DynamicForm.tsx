import { useState } from 'react';
import { useWelfare } from '@/context/WelfareContext';
import { FormField, ChatMessage } from '@/types/welfare';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Check, Loader2 } from 'lucide-react';
import { callDeepSeek, buildFieldsFromMissing } from '@/services/deepseek';

interface DynamicFormProps {
  messageId: string;
  title?: string;
  fields: FormField[];
}

const DynamicForm = ({ messageId, title, fields }: DynamicFormProps) => {
  const { updateProfile, markFormSubmitted, completeStep, activeStep, addTerminalLog, addChatMessage, userProfile, chatMessages, setActiveStep } = useWelfare();
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
    addTerminalLog('[Data] User profile updated. Recalculating eligibility...');

    // Build updated profile for follow-up call
    const updatedProfile = { ...userProfile, ...parsed };
    const profileSummary = Object.entries(updatedProfile)
      .filter(([, v]) => v !== undefined && v !== '')
      .map(([k, v]) => `${k}: ${v}`)
      .join(', ');

    try {
      addTerminalLog('[Agent] Re-analyzing with updated profile...');

      const conversationHistory = chatMessages
        .filter(m => m.type === 'text' && m.content)
        .map(m => ({ role: m.role === 'user' ? 'user' : 'assistant', content: m.content! }));

      const result = await callDeepSeek(
        `User has provided additional information: ${profileSummary}. Please re-evaluate eligibility.`,
        updatedProfile,
        conversationHistory
      );

      addTerminalLog(`[Agent] Follow-up category: ${result.category}`);
      addTerminalLog(`[Agent] Thought: ${result.thought_process.slice(0, 120)}...`);

      if (result.missing_fields && result.missing_fields.length > 0) {
        const replyMsg: ChatMessage = {
          id: Date.now().toString(),
          role: 'agent',
          type: 'text',
          content: result.reply_text,
          timestamp: new Date(),
        };
        addChatMessage(replyMsg);

        const formFields = buildFieldsFromMissing(result.missing_fields);
        const formMsg: ChatMessage = {
          id: (Date.now() + 1).toString(),
          role: 'agent',
          type: 'form_request',
          formTitle: `Additional info needed (${result.category})`,
          fields: formFields,
          timestamp: new Date(),
        };
        addChatMessage(formMsg);
        addTerminalLog(`[Agent] Still missing: ${result.missing_fields.join(', ')}`);
      } else {
        const replyMsg: ChatMessage = {
          id: Date.now().toString(),
          role: 'agent',
          type: 'text',
          content: result.reply_text,
          timestamp: new Date(),
        };
        addChatMessage(replyMsg);
        addTerminalLog('[Agent] Eligibility assessment complete.');
        setActiveStep(2);
      }
    } catch (error) {
      const errMsg = error instanceof Error ? error.message : 'Unknown error';
      addTerminalLog(`[Error] Follow-up call failed: ${errMsg}`);
      const fallback: ChatMessage = {
        id: Date.now().toString(),
        role: 'agent',
        type: 'text',
        content: 'Thank you for providing this information. I\'ll process it and get back to you shortly.',
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
            <Loader2 className="w-3.5 h-3.5 animate-spin" /> Processing...
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

export default DynamicForm;
