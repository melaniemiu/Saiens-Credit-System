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

export const triggerPromotionConfetti = () => {
  // Create a celebration effect with gold and blue colors
  const colors = ['#ffd700', '#ffed4e', '#3b82f6', '#1d4ed8', '#f59e0b'];
  
  // First burst
  confetti({
    particleCount: 150,
    spread: 120,
    origin: { y: 0.6 },
    colors: colors,
    shapes: ['star', 'circle'],
    scalar: 1.5,
    gravity: 0.8,
  });
  
  // Second burst with delay
  setTimeout(() => {
    confetti({
      particleCount: 100,
      spread: 80,
      origin: { y: 0.7 },
      colors: ['#ffd700', '#ffed4e'],
      shapes: ['star'],
      scalar: 1.2,
      gravity: 0.6,
    });
  }, 200);
  
  // Third burst with stars
  setTimeout(() => {
    confetti({
      particleCount: 50,
      spread: 60,
      origin: { y: 0.8 },
      colors: ['#3b82f6', '#1d4ed8'],
      shapes: ['circle'],
      scalar: 1.0,
      gravity: 0.4,
    });
  }, 400);
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

// Promotion confetti management
export const markPromotionConfettiAsShown = (promotionId: string) => {
  try {
    const confettiShown = JSON.parse(localStorage.getItem('promotion-confetti-shown') || '[]');
    if (!confettiShown.includes(promotionId)) {
      const updatedConfettiShown = [...confettiShown, promotionId];
      localStorage.setItem('promotion-confetti-shown', JSON.stringify(updatedConfettiShown));
    }
  } catch (error) {
    console.error('Error marking promotion confetti as shown:', error);
  }
};

export const hasPromotionConfettiBeenShown = (promotionId: string): boolean => {
  try {
    const confettiShown = JSON.parse(localStorage.getItem('promotion-confetti-shown') || '[]');
    return confettiShown.includes(promotionId);
  } catch (error) {
    console.error('Error checking promotion confetti status:', error);
    return false;
  }
};

export const triggerPromotionConfettiIfNotShown = (promotionId: string) => {
  if (!hasPromotionConfettiBeenShown(promotionId)) {
    triggerPromotionConfetti();
    markPromotionConfettiAsShown(promotionId);
    return true; // Confetti was triggered
  }
  return false; // Confetti was not triggered (already shown)
};

// Clean up old confetti records (keep only last 100 to prevent localStorage bloat)
export const cleanupConfettiRecords = () => {
  try {
    // Clean up credit confetti records
    const confettiShown = JSON.parse(localStorage.getItem('confetti-shown') || '[]');
    if (confettiShown.length > 100) {
      const recentConfetti = confettiShown.slice(-100);
      localStorage.setItem('confetti-shown', JSON.stringify(recentConfetti));
    }
    
    // Clean up promotion confetti records
    const promotionConfettiShown = JSON.parse(localStorage.getItem('promotion-confetti-shown') || '[]');
    if (promotionConfettiShown.length > 50) {
      const recentPromotionConfetti = promotionConfettiShown.slice(-50);
      localStorage.setItem('promotion-confetti-shown', JSON.stringify(recentPromotionConfetti));
    }
  } catch (error) {
    console.error('Error cleaning up confetti records:', error);
  }
};
