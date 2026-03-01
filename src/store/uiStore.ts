import { create } from 'zustand'

interface UIState {
  // Recipe list filters
  searchQuery: string
  selectedTagIds: string[]

  // Actions
  setSearchQuery: (query: string) => void
  toggleTag: (tagId: string) => void
  clearFilters: () => void
}

export const useUIStore = create<UIState>((set) => ({
  searchQuery: '',
  selectedTagIds: [],

  setSearchQuery: (query) => set({ searchQuery: query }),
  toggleTag: (tagId) =>
    set((state) => ({
      selectedTagIds: state.selectedTagIds.includes(tagId)
        ? state.selectedTagIds.filter((id) => id !== tagId)
        : [...state.selectedTagIds, tagId],
    })),
  clearFilters: () => set({ searchQuery: '', selectedTagIds: [] }),
}))
