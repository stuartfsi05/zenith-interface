export const Toast = {
  show: (message: string, type: 'info' | 'error' | 'success' = 'info') => {
    const toast = document.createElement('div');
    // Using vanilla CSS inline for the toast to avoid adding yet another file while refactoring.
    toast.className = `zenith-toast toast-${type}`;
    toast.style.position = 'fixed';
    toast.style.bottom = '20px';
    toast.style.right = '20px';
    toast.style.backgroundColor = type === 'error' ? 'var(--error)' : 'var(--surface-color)';
    toast.style.color = type === 'error' ? 'white' : 'var(--text-primary)';
    toast.style.padding = '12px 24px';
    toast.style.borderRadius = '8px';
    toast.style.boxShadow = '0 4px 12px rgba(0,0,0,0.5)';
    toast.style.border = '1px solid var(--border-color)';
    toast.style.fontFamily = 'var(--font-primary)';
    toast.style.fontSize = '0.9rem';
    toast.style.zIndex = '9999';
    toast.style.opacity = '0';
    toast.style.transform = 'translateY(20px)';
    toast.style.transition = 'all 0.3s ease';
    toast.style.display = 'flex';
    toast.style.alignItems = 'center';
    toast.style.gap = '8px';

    const icon = type === 'error' ? '⚠️' : type === 'success' ? '✅' : 'ℹ️';
    toast.innerHTML = `<span>${icon}</span> <span>${message}</span>`;
    
    document.body.appendChild(toast);
    
    // Trigger animation
    setTimeout(() => {
        toast.style.opacity = '1';
        toast.style.transform = 'translateY(0)';
    }, 10);
    
    // Auto remove
    setTimeout(() => {
      toast.style.opacity = '0';
      toast.style.transform = 'translateY(20px)';
      setTimeout(() => toast.remove(), 300);
    }, 4000);
  }
}
