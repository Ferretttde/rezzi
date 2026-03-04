import { useUIStore } from '@/store/uiStore'
import { useTags } from '@/hooks/useTags'
import { cn } from '@/lib/utils'
import type { Tag } from '@/types/app'

function groupByCategory(tags: Tag[]): { category: string | null; tags: Tag[] }[] {
  const map = new Map<string, Tag[]>()
  const uncategorized: Tag[] = []

  for (const tag of tags) {
    if (tag.category) {
      const existing = map.get(tag.category)
      if (existing) existing.push(tag)
      else map.set(tag.category, [tag])
    } else {
      uncategorized.push(tag)
    }
  }

  const groups: { category: string | null; tags: Tag[] }[] = []
  for (const [category, t] of map) {
    groups.push({ category, tags: t })
  }
  groups.sort((a, b) => (a.category ?? '').localeCompare(b.category ?? ''))
  if (uncategorized.length) groups.push({ category: null, tags: uncategorized })
  return groups
}

export function TagFilter() {
  const { data: tags } = useTags()
  const { selectedTagIds, toggleTag } = useUIStore()

  if (!tags?.length) return null

  const hasCategories = tags.some((t) => t.category)

  if (!hasCategories) {
    // Flat pill list (legacy layout when no categories exist)
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

  const groups = groupByCategory(tags)

  return (
    <div className="px-4 pb-2 max-h-48 overflow-y-auto space-y-2">
      {groups.map(({ category, tags: groupTags }) => (
        <div key={category ?? '__uncategorized__'}>
          {category && (
            <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wide mb-1">
              {category}
            </p>
          )}
          <div className="flex flex-wrap gap-1.5">
            {groupTags.map((tag) => {
              const isSelected = selectedTagIds.includes(tag.id)
              return (
                <button
                  key={tag.id}
                  onClick={() => toggleTag(tag.id)}
                  className={cn(
                    'flex items-center gap-1.5 whitespace-nowrap rounded-full px-3 py-1.5 text-xs font-medium transition-all',
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
        </div>
      ))}
    </div>
  )
}
