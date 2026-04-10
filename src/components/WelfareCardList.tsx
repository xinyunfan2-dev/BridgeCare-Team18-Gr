import { useState } from 'react';
import { WelfareCard } from '@/types/welfare';
import { useWelfare } from '@/context/WelfareContext';
import { ExternalLink, FileText, ChevronRight, ChevronDown, CheckSquare, ArrowRight } from 'lucide-react';
import { Checkbox } from '@/components/ui/checkbox';
import { Button } from '@/components/ui/button';

// Per-program required docs and timeline steps
const PROGRAM_INFO: Record<string, { docs: string[]; timeline: string[] }> = {
  cssa: {
    docs: ['香港身份證', '住址證明（如租約、水電費單）', '銀行存摺/月結單', '收入證明（如有）', '資產證明（如物業、股票）', '醫療報告（如適用）'],
    timeline: ['前往社會保障辦事處提交申請', '社工進行家訪及審核', '等待審批結果（約4-6週）', '獲批後每月領取援助金'],
  },
  oala: {
    docs: ['香港身份證', '銀行存摺/月結單', '資產證明文件', '住址證明'],
    timeline: ['前往社會保障辦事處或郵寄申請', '提交資產申報表', '等待審批（約2-4週）', '獲批後每月自動發放津貼'],
  },
  'health-voucher': {
    docs: ['香港身份證'],
    timeline: ['年滿65歲自動符合資格', '到已登記的醫療服務提供者使用', '每年$2,000自動充值，可累積至$8,000'],
  },
  'public-housing': {
    docs: ['香港身份證', '住址證明', '收入及資產證明', '家庭成員關係證明', '申請表格HD274'],
    timeline: ['填寫公屋申請表（網上或親自）', '提交申請至房屋署', '等待配額及審查（輪候約3-5年，長者優先）', '獲編配單位後進行家訪', '簽署租約及入伙'],
  },
  wfa: {
    docs: ['香港身份證', '僱主證明/工作證明', '收入證明（糧單）', '銀行存摺', '住址證明'],
    timeline: ['網上或郵寄提交申請', '在職家庭津貼辦事處審核', '等待審批結果（約6-8週）', '獲批後發放津貼'],
  },
};

const DEFAULT_INFO = {
  docs: ['香港身份證', '住址證明', '收入/資產證明'],
  timeline: ['準備所需文件', '前往相關部門提交申請', '等待審批', '獲批後領取福利'],
};

interface WelfareCardListProps {
  cards: WelfareCard[];
}

const WelfareCardList = ({ cards }: WelfareCardListProps) => {
  const { addProgram, addTerminalLog, setActiveStep } = useWelfare();
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [confirmed, setConfirmed] = useState<Record<string, boolean>>({});

  const toggleExpand = (id: string) => {
    setExpandedId(prev => (prev === id ? null : id));
  };

  const handleConfirmAdd = (card: WelfareCard) => {
    const info = PROGRAM_INFO[card.id] || DEFAULT_INFO;
    const docItems = info.docs.map((doc, i) => ({
      id: `doc-${i}`,
      label: `准备: ${doc}`,
      completed: false,
      category: 'doc' as const,
    }));
    const stepItems = info.timeline.map((step, i) => ({
      id: `step-${i}`,
      label: step,
      completed: false,
      category: 'step' as const,
    }));
    addProgram({
      id: card.id,
      name: card.name,
      status: 'not_started',
      progress: 0,
      checklist: [...docItems, ...stepItems],
    });
    addTerminalLog(`[Journey] 用户确认申请 "${card.name}"，已添加到 Journey。`);
    setActiveStep(3);
    setConfirmed(prev => ({ ...prev, [card.id]: false }));
    setExpandedId(null);
  };

  return (
    <div className="space-y-3 max-w-lg">
      {cards.map(card => {
        const isExpanded = expandedId === card.id;
        const info = PROGRAM_INFO[card.id] || DEFAULT_INFO;

        return (
          <div key={card.id} className="rounded-2xl border bg-background shadow-[0_1px_4px_0_rgba(0,0,0,0.04)] overflow-hidden">
            {/* Card Header - toggle expand */}
            <button
              onClick={() => toggleExpand(card.id)}
              className="w-full text-left p-4 flex items-center justify-between hover:bg-accent/30 transition-colors group"
            >
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-primary/10 flex items-center justify-center">
                  <FileText className="w-4 h-4 text-primary" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-foreground">{card.name}</p>
                  <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">{card.description}</p>
                </div>
              </div>
              {isExpanded ? (
                <ChevronDown className="w-4 h-4 text-muted-foreground flex-shrink-0" />
              ) : (
                <ChevronRight className="w-4 h-4 text-muted-foreground group-hover:text-primary transition-colors flex-shrink-0" />
              )}
            </button>

            {/* Expanded detail */}
            {isExpanded && (
              <div className="border-t px-4 py-4 space-y-4">
                {/* Required Documents */}
                <div>
                  <p className="text-xs font-semibold text-foreground mb-2 flex items-center gap-1.5">
                    <CheckSquare className="w-3.5 h-3.5 text-primary" />
                    所需個人資料及證明文件
                  </p>
                  <ul className="space-y-1.5 pl-1">
                    {info.docs.map((doc, i) => (
                      <li key={i} className="flex items-start gap-2 text-xs text-muted-foreground">
                        <span className="w-1.5 h-1.5 rounded-full bg-primary/40 mt-1.5 flex-shrink-0" />
                        {doc}
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Application Timeline */}
                <div>
                  <p className="text-xs font-semibold text-foreground mb-2 flex items-center gap-1.5">
                    <ArrowRight className="w-3.5 h-3.5 text-primary" />
                    申請步驟
                  </p>
                  <ol className="space-y-2 pl-1">
                    {info.timeline.map((step, i) => (
                      <li key={i} className="flex items-start gap-2.5 text-xs text-muted-foreground">
                        <span className="flex-shrink-0 w-5 h-5 rounded-full bg-primary/10 text-primary text-[10px] font-bold flex items-center justify-center mt-0.5">
                          {i + 1}
                        </span>
                        {step}
                      </li>
                    ))}
                  </ol>
                </div>

                {/* Resources / Links */}
                {card.resources.length > 0 && (
                  <div>
                    <p className="text-xs font-semibold text-foreground mb-2">參考連結</p>
                    <div className="space-y-1">
                      {card.resources.map((res, i) => (
                        <a
                          key={i}
                          href={res.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-2 py-1.5 px-2 rounded-lg hover:bg-accent/40 transition-colors group"
                        >
                          <ExternalLink className="w-3 h-3 text-primary/60 flex-shrink-0" />
                          <span className="text-xs text-primary/80 group-hover:text-primary truncate">{res.title}</span>
                        </a>
                      ))}
                    </div>
                  </div>
                )}

                {/* Confirm checkbox + submit */}
                <div className="border-t pt-3 space-y-3">
                  <label className="flex items-start gap-2 cursor-pointer">
                    <Checkbox
                      checked={confirmed[card.id] || false}
                      onCheckedChange={(checked) =>
                        setConfirmed(prev => ({ ...prev, [card.id]: checked === true }))
                      }
                      className="mt-0.5"
                    />
                    <span className="text-xs text-foreground leading-relaxed">
                      我已了解該福利項目的申請要求，確認添加到我的申請旅程
                    </span>
                  </label>
                  <Button
                    size="sm"
                    className="rounded-full w-full gap-1.5"
                    disabled={!confirmed[card.id]}
                    onClick={() => handleConfirmAdd(card)}
                  >
                    添加到My Journey
                  </Button>
                </div>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
};

export default WelfareCardList;
