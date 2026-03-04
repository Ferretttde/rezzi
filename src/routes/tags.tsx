import { createFileRoute } from '@tanstack/react-router'
import { useState } from 'react'
import { Trash2, Edit2, Plus, Check, X } from 'lucide-react'
import { PageHeader } from '@/components/layout/PageHeader'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { useTags, useCreateTag, useUpdateTag, useDeleteTag, useTagCategories } from '@/hooks/useTags'
import { toast } from '@/components/ui/use-toast'
import { cn } from '@/lib/utils'
import type { Tag } from '@/types/app'

const TAG_COLORS = [
  '#e8572a', '#4a7c59', '#3b82f6', '#8b5cf6',
  '#f59e0b', '#ec4899', '#06b6d4', '#84cc16',
  '#64748b', '#dc2626',
]

function CategoryInput({
  value,
  onChange,
  categories,
}: {
  value: string
  onChange: (v: string) => void
  categories: string[]
}) {
  const listId = 'tag-categories-list'
  return (
    <div>
      <p className="text-xs text-muted-foreground mb-1">Kategorie (optional)</p>
      <input
        list={listId}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder="z. B. Mahlzeit, Küche, Diät …"
        className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
      />
      <datalist id={listId}>
        {categories.map((c) => (
          <option key={c} value={c} />
        ))}
      </datalist>
    </div>
  )
}

function ColorPicker({
  value,
  onChange,
  size = 'md',
}: {
  value: string
  onChange: (c: string) => void
  size?: 'sm' | 'md'
}) {
  return (
    <div>
      <p className="text-xs text-muted-foreground mb-2">Farbe</p>
      <div className="flex gap-2 flex-wrap">
        {TAG_COLORS.map((color) => (
          <button
            key={color}
            onClick={() => onChange(color)}
            className={cn(
              'rounded-full transition-transform',
              size === 'sm' ? 'h-7 w-7' : 'h-8 w-8',
              value === color && 'scale-125 ring-2 ring-offset-2 ring-foreground/20'
            )}
            style={{ backgroundColor: color }}
            aria-label={color}
          />
        ))}
      </div>
    </div>
  )
}

function groupTagsByCategory(tags: Tag[]): { category: string | null; tags: Tag[] }[] {
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

function TagsPage() {
  const { data: tags, isLoading } = useTags()
  const categories = useTagCategories()
  const createTag = useCreateTag()
  const updateTag = useUpdateTag()
  const deleteTag = useDeleteTag()

  const [editingId, setEditingId] = useState<string | null>(null)
  const [editName, setEditName] = useState('')
  const [editColor, setEditColor] = useState('')
  const [editCategory, setEditCategory] = useState('')

  const [newName, setNewName] = useState('')
  const [newColor, setNewColor] = useState(TAG_COLORS[0] ?? '#e8572a')
  const [newCategory, setNewCategory] = useState('')
  const [showNewForm, setShowNewForm] = useState(false)

  const startEdit = (tag: Tag) => {
    setEditingId(tag.id)
    setEditName(tag.name)
    setEditColor(tag.color)
    setEditCategory(tag.category ?? '')
  }

  const cancelEdit = () => {
    setEditingId(null)
    setEditName('')
    setEditColor('')
    setEditCategory('')
  }

  const saveEdit = async () => {
    if (!editingId || !editName.trim()) return
    await updateTag.mutateAsync({
      id: editingId,
      name: editName.trim(),
      color: editColor,
      category: editCategory.trim() || undefined,
    })
    cancelEdit()
  }

  const handleDelete = async (id: string, name: string) => {
    if (!window.confirm(`Tag "${name}" löschen? Er wird von allen Rezepten entfernt.`)) return
    await deleteTag.mutateAsync(id)
    toast({ title: `Tag "${name}" gelöscht` })
  }

  const handleCreate = async () => {
    if (!newName.trim()) return
    await createTag.mutateAsync({
      name: newName.trim(),
      color: newColor,
      category: newCategory.trim() || undefined,
    })
    setNewName('')
    setNewColor(TAG_COLORS[0] ?? '#e8572a')
    setNewCategory('')
    setShowNewForm(false)
    toast({ title: 'Tag erstellt!' })
  }

  const groups = tags ? groupTagsByCategory(tags) : []

  return (
    <div className="min-h-dvh">
      <PageHeader
        title="Tags"
        subtitle={tags ? `${tags.length} Tags` : undefined}
        right={
          <Button size="sm" onClick={() => setShowNewForm(true)}>
            <Plus className="h-4 w-4" /> Neuer Tag
          </Button>
        }
      />

      <div className="px-4 space-y-2">
        {/* New tag form */}
        {showNewForm && (
          <div className="bg-white rounded-2xl border border-border p-4 space-y-3">
            <h3 className="font-semibold text-sm">Neuer Tag</h3>
            <Input
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              placeholder="Tag-Name"
              autoFocus
            />
            <CategoryInput value={newCategory} onChange={setNewCategory} categories={categories} />
            <ColorPicker value={newColor} onChange={setNewColor} />
            <div className="flex gap-2">
              <Button onClick={handleCreate} disabled={!newName.trim()} size="sm">
                Erstellen
              </Button>
              <Button variant="ghost" size="sm" onClick={() => setShowNewForm(false)}>
                Abbrechen
              </Button>
            </div>
          </div>
        )}

        {/* Tags list */}
        {isLoading ? (
          <p className="text-center text-muted-foreground py-8 text-sm">Tags werden geladen...</p>
        ) : !tags?.length ? (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <div className="text-5xl mb-4">🏷️</div>
            <h3 className="font-semibold text-lg">Noch keine Tags</h3>
            <p className="text-muted-foreground text-sm mt-1 max-w-xs">
              Erstelle Tags um deine Rezepte nach Küche, Diät, Anlass und mehr zu organisieren
            </p>
          </div>
        ) : (
          groups.map(({ category, tags: groupTags }) => (
            <div key={category ?? '__uncategorized__'}>
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide px-1 pt-2 pb-1">
                {category ?? 'Sonstiges'}
              </p>
              <div className="space-y-2">
                {groupTags.map((tag) => (
                  <div
                    key={tag.id}
                    className="bg-white rounded-2xl border border-border/50 p-4"
                  >
                    {editingId === tag.id ? (
                      <div className="space-y-3">
                        <Input
                          value={editName}
                          onChange={(e) => setEditName(e.target.value)}
                          autoFocus
                        />
                        <CategoryInput
                          value={editCategory}
                          onChange={setEditCategory}
                          categories={categories}
                        />
                        <ColorPicker value={editColor} onChange={setEditColor} size="sm" />
                        <div className="flex gap-2">
                          <button onClick={saveEdit} className="p-1.5 text-primary rounded-lg bg-primary/10">
                            <Check className="h-4 w-4" />
                          </button>
                          <button onClick={cancelEdit} className="p-1.5 text-muted-foreground rounded-lg bg-muted">
                            <X className="h-4 w-4" />
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div className="flex items-center gap-3">
                        <div
                          className="h-4 w-4 rounded-full shrink-0"
                          style={{ backgroundColor: tag.color }}
                        />
                        <span className="font-medium flex-1">{tag.name}</span>
                        <span className="text-sm text-muted-foreground">
                          {tag.recipe_count ?? 0} {(tag.recipe_count ?? 0) === 1 ? 'Rezept' : 'Rezepte'}
                        </span>
                        <button
                          onClick={() => startEdit(tag)}
                          className="p-1.5 text-muted-foreground hover:text-foreground rounded-lg"
                        >
                          <Edit2 className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => void handleDelete(tag.id, tag.name)}
                          className="p-1.5 text-muted-foreground hover:text-destructive rounded-lg"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  )
}

export const Route = createFileRoute('/tags')({
  component: TagsPage,
})
