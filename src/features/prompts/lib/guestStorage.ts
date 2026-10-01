const GUEST_FAVORITES_KEY = 'pv_guest_favorites';
const GUEST_PINNED_KEY = 'pv_guest_pinned';

export const guestStorage = {
  getFavorites(): string[] {
    try {
      const val = localStorage.getItem(GUEST_FAVORITES_KEY);
      return val ? JSON.parse(val) : [];
    } catch {
      return [];
    }
  },

  isFavorite(id: string): boolean {
    return this.getFavorites().includes(id);
  },

  setFavorite(id: string, isFav: boolean): string[] {
    const list = new Set(this.getFavorites());
    if (isFav) {
      list.add(id);
    } else {
      list.delete(id);
    }
    const arr = Array.from(list);
    try {
      localStorage.setItem(GUEST_FAVORITES_KEY, JSON.stringify(arr));
    } catch {}
    return arr;
  },

  getPinned(): string[] {
    try {
      const val = localStorage.getItem(GUEST_PINNED_KEY);
      return val ? JSON.parse(val) : [];
    } catch {
      return [];
    }
  },

  isPinned(id: string): boolean {
    return this.getPinned().includes(id);
  },

  setPinned(id: string, isPinned: boolean): string[] {
    const list = new Set(this.getPinned());
    if (isPinned) {
      list.add(id);
    } else {
      list.delete(id);
    }
    const arr = Array.from(list);
    try {
      localStorage.setItem(GUEST_PINNED_KEY, JSON.stringify(arr));
    } catch {}
    return arr;
  },
};
