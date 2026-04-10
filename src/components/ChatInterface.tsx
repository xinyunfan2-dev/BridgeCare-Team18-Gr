import { useRef, useEffect, useState } from 'react';
import { useWelfare } from '@/context/WelfareContext';
import DynamicForm from './DynamicForm';
import WelfareCardList from './WelfareCardList';
import DocPrepChat from './DocPrepChat';
import { ChatMessage } from '@/types/welfare';
import { Plus, ArrowUp, Bot, Loader2 } from 'lucide-react';
import { callDeepSeek, buildFieldsFromMissing } from '@/services/deepseek';

const ChatInterface = () => {
  const { chatMessages, addChatMessage, addTerminalLog, userProfile, setActiveStep } = useWelfare();
  const [input, setInput] = useState('');
  const [isThinking, setIsThinking] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [chatMessages, isThinking]);

  const conversationHistory = chatMessages
    .filter(m => m.type === 'text' && m.content)
    .map(m => ({ role: m.role === 'user' ? 'user' : 'assistant', content: m.content! }));

  const processWithAI = async (messageText: string) => {
    setIsThinking(true);
    addTerminalLog('[Agent] 正在分析用户意图...');

    try {
      const result = await callDeepSeek(messageText, userProfile, conversationHistory);

      addTerminalLog(`[Agent] 分类: ${result.category}`);
      addTerminalLog(`[Agent] 思考: ${result.thought_process.slice(0, 120)}...`);

      // Always show a brief reply text first
      const replyMsg: ChatMessage = {
        id: Date.now().toString(),
        role: 'agent',
        type: 'text',
        content: result.reply_text,
        timestamp: new Date(),
      };
      addChatMessage(replyMsg);

      if (result.missing_fields && result.missing_fields.length > 0) {
        // Show form to collect missing info
        const formFields = buildFieldsFromMissing(result.missing_fields);
        const formMsg: ChatMessage = {
          id: (Date.now() + 1).toString(),
          role: 'agent',
          type: 'form_request',
          formTitle: `请填写以下信息`,
          fields: formFields,
          timestamp: new Date(),
        };
        addChatMessage(formMsg);
        addTerminalLog(`[Agent] 需要补充: ${result.missing_fields.join(', ')}。表单已生成。`);
        setActiveStep(1); // Profile step
      } else {
        addTerminalLog('[Agent] 信息充足，可直接推荐。');
        setActiveStep(2);
      }
    } catch (error) {
      const errMsg = error instanceof Error ? error.message : 'Unknown error';
      addTerminalLog(`[Error] DeepSeek 调用失败: ${errMsg}`);

      const fallback: ChatMessage = {
        id: Date.now().toString(),
        role: 'agent',
        type: 'text',
        content: `抱歉，处理您的请求时出现问题，请重试。(${errMsg})`,
        timestamp: new Date(),
      };
      addChatMessage(fallback);
    } finally {
      setIsThinking(false);
    }
  };

  const send = () => {
    if (!input.trim() || isThinking) return;
    const userMsg: ChatMessage = {
      id: Date.now().toString(),
      role: 'user',
      type: 'text',
      content: input.trim(),
      timestamp: new Date(),
    };
    addChatMessage(userMsg);
    addTerminalLog(`[Chat] 用户: "${input.trim().slice(0, 60)}"`);

    const messageText = input.trim();
    setInput('');
    processWithAI(messageText);
  };

  const handleNewInquiry = () => {
    setInput('');
    addTerminalLog('[System] 新查询已开始。');
  };

  return (
    <div className="flex flex-col flex-1 min-h-0">
      {/* Messages */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto px-6 py-6 space-y-5">
        {chatMessages.map(msg => (
          <div key={msg.id} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div className={`max-w-[85%] ${msg.role === 'user' ? 'text-right' : ''}`}>
              {msg.role === 'agent' && (
                <div className="flex items-center gap-1.5 mb-1.5">
                  <Bot className="w-3.5 h-3.5 text-primary" />
                  <span className="text-xs font-semibold text-primary tracking-wide">Agent</span>
                </div>
              )}
              {msg.type === 'form_request' && msg.fields && !msg.formSubmitted ? (
                <DynamicForm messageId={msg.id} title={msg.formTitle} fields={msg.fields} />
              ) : msg.type === 'form_request' && msg.formSubmitted ? (
                <p className="text-sm text-muted-foreground italic">✓ 表单已提交</p>
              ) : msg.type === 'welfare_cards' && msg.welfareCards ? (
                <WelfareCardList cards={msg.welfareCards} />
              ) : (
                <p className={`text-sm leading-[1.8] text-left font-thin font-serif ${msg.role === 'user' ? 'text-foreground' : 'text-foreground/90'}`}>
                  {msg.content}
                </p>
              )}
            </div>
          </div>
        ))}

        {isThinking && (
          <div className="flex justify-start">
            <div className="flex items-center gap-2">
              <Bot className="w-3.5 h-3.5 text-primary" />
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Loader2 className="w-3.5 h-3.5 animate-spin text-primary" />
                <span>思考中...</span>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Doc Prep Chat */}
      <DocPrepChat />

      {/* Input */}
      <div className="px-6 pb-5 pt-2">
        <div className="flex items-center gap-2 rounded-full border bg-muted/20 px-3 py-2 focus-within:ring-2 focus-within:ring-primary/20 focus-within:border-primary/40 transition-all shadow-sm">
          <button
            onClick={handleNewInquiry}
            className="flex-shrink-0 w-9 h-9 rounded-full flex items-center justify-center hover:bg-accent transition-colors text-muted-foreground"
            title="新查询"
          >
            <Plus className="w-4.5 h-4.5" />
          </button>
          <input
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && send()}
            placeholder="描述您的情况，例如：我是65岁退休老人..."
            disabled={isThinking}
            className="flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground/50 disabled:opacity-50"
          />
          <button
            onClick={send}
            disabled={!input.trim() || isThinking}
            className="flex-shrink-0 w-9 h-9 rounded-full bg-primary text-primary-foreground flex items-center justify-center hover:bg-primary/90 disabled:opacity-30 transition-all"
          >
            <ArrowUp className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};

export default ChatInterface;