import { useState } from 'react';
import { WelfareCard } from '@/types/welfare';
import { useWelfare } from '@/context/WelfareContext';
import { ExternalLink, FileText, ChevronRight, ChevronDown, CheckSquare, ArrowRight } from 'lucide-react';
import { Checkbox } from '@/components/ui/checkbox';
import { Button } from '@/components/ui/button';

// Per-program required docs and timeline steps
const PROGRAM_INFO: Record<string, { docs: string[]; timeline: string[] }> = {
  cssa: {
    docs: ['香港身份证', '住址证明（如租约、水电费单）', '银行存折/月结单', '收入证明（如有）', '资产证明（如物业、股票）', '医疗报告（如适用）'],
    timeline: ['前往社会保障办事处提交申请', '社工进行家访及审核', '等待审批结果（约4-6周）', '获批后每月领取援助金'],
  },
  oala: {
    docs: ['香港身份证', '银行存折/月结单', '资产证明文件', '住址证明'],
    timeline: ['前往社会保障办事处或邮寄申请', '提交资产申报表', '等待审批（约2-4周）', '获批后每月自动发放津贴'],
  },
  'health-voucher': {
    docs: ['香港身份证'],
    timeline: ['年满65岁自动符合资格', '到已登记的医疗服务提供者使用', '每年$2,000自动充值，可累积至$8,000'],
  },
  'public-housing': {
    docs: ['香港身份证', '住址证明', '收入及资产证明', '家庭成员关系证明', '申请表格HD274'],
    timeline: ['填写公屋申请表（网上或亲自）', '提交申请至房屋署', '等待配额及审查（轮候约3-5年，长者优先）', '获编配单位后进行家访', '签署租约及入伙'],
  },
  wfa: {
    docs: ['香港身份证', '雇主证明/工作证明', '收入证明（粮单）', '银行存折', '住址证明'],
    timeline: ['网上或邮寄提交申请', '在职家庭津贴办事处审核', '等待审批结果（约6-8周）', '获批后发放津贴'],
  },
};

const DEFAULT_INFO = {
  docs: ['香港身份证', '住址证明', '收入/资产证明'],
  timeline: ['准备所需文件', '前往相关部门提交申请', '等待审批', '获批后领取福利'],
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
    addProgram({
      id: card.id,
      name: card.name,
      status: 'not_started',
      progress: 0,
      checklist: info.docs.map((doc, i) => ({
        id: `doc-${i}`,
        label: `准备: ${doc}`,
        completed: false,
      })),
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
                    所需个人信息及证明文件
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
                    申请步骤
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
                    <p className="text-xs font-semibold text-foreground mb-2">参考链接</p>
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
                      我已了解该福利项目的申请要求，确认添加到我的申请旅程
                    </span>
                  </label>
                  <Button
                    size="sm"
                    className="rounded-full w-full gap-1.5"
                    disabled={!confirmed[card.id]}
                    onClick={() => handleConfirmAdd(card)}
                  >
                    添加到 My Journey
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
