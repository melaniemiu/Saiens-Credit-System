import confetti from 'canvas-confetti';

export const triggerCreditGivenConfetti = () => {
  confetti({
    particleCount: 100,
    spread: 70,
    origin: { y: 0.75 }, // 1/3 from top
    colors: ['#10b981', '#3b82f6', '#f59e0b', '#ef4444', '#8b5cf6']
  });
};

export const triggerCreditReceivedConfetti = () => {
  confetti({
    particleCount: 150,
    spread: 100,
    origin: { y: 0.75 }, // 1/3 from top
    colors: ['#10b981', '#34d399', '#6ee7b7', '#a7f3d0'],
    shapes: ['circle', 'square'],
    scalar: 1.2
  });
};

export const triggerSuccessConfetti = () => {
  confetti({
    particleCount: 80,
    spread: 60,
    origin: { y: 0.75 }, // 1/3 from top
    colors: ['#10b981', '#059669']
  });
};

// Confetti deduplication management
export const markConfettiAsShown = (creditId: string) => {
  try {
    const confettiShown = JSON.parse(localStorage.getItem('confetti-shown') || '[]');
    if (!confettiShown.includes(creditId)) {
      const updatedConfettiShown = [...confettiShown, creditId];
      localStorage.setItem('confetti-shown', JSON.stringify(updatedConfettiShown));
    }
  } catch (error) {
    console.error('Error marking confetti as shown:', error);
  }
};

export const hasConfettiBeenShown = (creditId: string): boolean => {
  try {
    const confettiShown = JSON.parse(localStorage.getItem('confetti-shown') || '[]');
    return confettiShown.includes(creditId);
  } catch (error) {
    console.error('Error checking confetti status:', error);
    return false;
  }
};

export const triggerConfettiIfNotShown = (creditId: string) => {
  if (!hasConfettiBeenShown(creditId)) {
    triggerCreditReceivedConfetti();
    markConfettiAsShown(creditId);
    return true; // Confetti was triggered
  }
  return false; // Confetti was not triggered (already shown)
};

// Clean up old confetti records (keep only last 100 to prevent localStorage bloat)
export const cleanupConfettiRecords = () => {
  try {
    const confettiShown = JSON.parse(localStorage.getItem('confetti-shown') || '[]');
    if (confettiShown.length > 100) {
      const recentConfetti = confettiShown.slice(-100);
      localStorage.setItem('confetti-shown', JSON.stringify(recentConfetti));
    }
  } catch (error) {
    console.error('Error cleaning up confetti records:', error);
  }
};
