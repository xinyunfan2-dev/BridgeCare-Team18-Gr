import { WelfareCard } from '@/types/welfare';
import { useWelfare } from '@/context/WelfareContext';
import { ExternalLink, FileText, ChevronRight } from 'lucide-react';

interface WelfareCardListProps {
  cards: WelfareCard[];
}

const WelfareCardList = ({ cards }: WelfareCardListProps) => {
  const { addProgram, addTerminalLog, setActiveStep } = useWelfare();

  const handleCardClick = (card: WelfareCard) => {
    addProgram({
      id: card.id,
      name: card.name,
      status: 'not_started',
      progress: 0,
      checklist: [
        { id: '1', label: '准备身份证明文件', completed: false },
        { id: '2', label: '准备资产/收入证明', completed: false },
        { id: '3', label: '前往社会福利署办事处', completed: false },
        { id: '4', label: '提交申请表', completed: false },
      ],
    });
    addTerminalLog(`[Journey] 用户选择申请 "${card.name}"，已添加到 Journey。`);
    setActiveStep(3); // Move to Action step
  };

  return (
    <div className="space-y-3 max-w-lg">
      {cards.map(card => (
        <div key={card.id} className="rounded-2xl border bg-background shadow-[0_1px_4px_0_rgba(0,0,0,0.04)] overflow-hidden">
          {/* Card Header - clickable */}
          <button
            onClick={() => handleCardClick(card)}
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
            <ChevronRight className="w-4 h-4 text-muted-foreground group-hover:text-primary transition-colors flex-shrink-0" />
          </button>

          {/* Resources */}
          {card.resources.length > 0 && (
            <div className="border-t px-4 py-2 space-y-1">
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
          )}
        </div>
      ))}
    </div>
  );
};

export default WelfareCardList;