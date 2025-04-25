import { create } from 'zustand';

interface SidebarState {
  isOpen: boolean;
}

interface SidebarActions {
  toggleSidebar: () => void;
  openSidebar: () => void;
  closeSidebar: () => void;
}

type SidebarStore = SidebarState & SidebarActions;

export const useSidebarStore = create<SidebarStore>((set) => ({
  isOpen: false,
  toggleSidebar: () => set((state) => ({ isOpen: !state.isOpen })),
  openSidebar: () => set({ isOpen: true }),
  closeSidebar: () => set({ isOpen: false }),
})); 