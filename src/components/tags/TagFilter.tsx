import { useUIStore } from '@/store/uiStore'
import { useTags } from '@/hooks/useTags'
import { cn } from '@/lib/utils'

export function TagFilter() {
  const { data: tags } = useTags()
  const { selectedTagIds, toggleTag } = useUIStore()

  if (!tags?.length) return null

  return (
    <div className="flex gap-2 overflow-x-auto px-4 pb-2 scrollbar-hide">
      {tags.map((tag) => {
        const isSelected = selectedTagIds.includes(tag.id)
        return (
          <button
            key={tag.id}
            onClick={() => toggleTag(tag.id)}
            className={cn(
              'flex items-center gap-1.5 whitespace-nowrap rounded-full px-3 py-1.5 text-xs font-medium transition-all shrink-0',
              isSelected
                ? 'text-white shadow-sm'
                : 'bg-white border border-border text-foreground'
            )}
            style={isSelected ? { backgroundColor: tag.color } : undefined}
          >
            <span
              className="h-2 w-2 rounded-full shrink-0"
              style={{ backgroundColor: isSelected ? 'white' : tag.color }}
            />
            {tag.name}
          </button>
        )
      })}
    </div>
  )
}
