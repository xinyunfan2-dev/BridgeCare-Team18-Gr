import { useWelfare } from '@/context/WelfareContext';
import { STEPS } from '@/types/welfare';
import { Check } from 'lucide-react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { useState } from 'react';

const BreadcrumbStepper = () => {
  const { activeStep, stepCompleted, navigateBack, startNewCycle } = useWelfare();
  const [confirmTarget, setConfirmTarget] = useState<number | null>(null);
  const [isNewCycle, setIsNewCycle] = useState(false);

  const handleClick = (index: number) => {
    if (index === activeStep) return;
    if (index > activeStep) return; // forward locked
    // If on Journey (step 4) and clicking Discovery (step 0), start new cycle
    if (activeStep === 4 && index === 0) {
      setIsNewCycle(true);
      setConfirmTarget(index);
      return;
    }
    setIsNewCycle(false);
    setConfirmTarget(index);
  };

  const confirmNavigation = () => {
    if (confirmTarget !== null) {
      if (isNewCycle) {
        startNewCycle();
      } else {
        navigateBack(confirmTarget);
      }
      setConfirmTarget(null);
      setIsNewCycle(false);
    }
  };

  return (
    <>
      <nav className="flex items-center gap-1 px-2">
        {STEPS.map((step, i) => {
          const isActive = i === activeStep;
          const isDone = stepCompleted[i];
          const isFuture = i > activeStep;

          return (
            <div key={step} className="flex items-center">
              {i > 0 && <div className={`w-8 h-px mx-1 ${isDone || isActive ? 'bg-primary' : 'bg-border'}`} />}
              <button
                onClick={() => handleClick(i)}
                disabled={isFuture}
                className={`
                  flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium transition-all
                  ${isActive ? 'bg-primary text-primary-foreground' : ''}
                  ${isDone && !isActive ? 'text-primary hover:bg-accent cursor-pointer' : ''}
                  ${isFuture ? 'text-muted-foreground opacity-50 cursor-not-allowed' : ''}
                  ${!isActive && !isFuture && !isDone ? 'text-muted-foreground hover:bg-accent cursor-pointer' : ''}
                `}
              >
                {isDone && !isActive ? (
                  <Check className="w-3.5 h-3.5" />
                ) : (
                  <span className={`w-5 h-5 rounded-full text-xs flex items-center justify-center font-semibold
                    ${isActive ? 'bg-primary-foreground text-primary' : 'bg-muted text-muted-foreground'}
                  `}>{i + 1}</span>
                )}
                <span className="hidden sm:inline">{step}</span>
              </button>
            </div>
          );
        })}
      </nav>

      <AlertDialog open={confirmTarget !== null} onOpenChange={() => { setConfirmTarget(null); setIsNewCycle(false); }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {isNewCycle ? 'Start a new inquiry?' : `Go back to "${confirmTarget !== null ? STEPS[confirmTarget] : ''}"?`}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {isNewCycle
                ? 'Your current applications will be archived as past applications. You can start a new inquiry from scratch.'
                : 'Switching back will reset current progress. Continue?'}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmNavigation}>Continue</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};

export default BreadcrumbStepper;
