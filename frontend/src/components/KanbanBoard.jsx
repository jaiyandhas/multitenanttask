import { useMemo, useState, useEffect } from 'react'
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd'
import TaskCard from './TaskCard'

const columns = [
  { key: 'todo', title: 'Todo', header: 'bg-slate-200 text-slate-800' },
  { key: 'inprogress', title: 'In Progress', header: 'bg-blue-100 text-blue-900' },
  { key: 'done', title: 'Done', header: 'bg-green-100 text-green-900' }
]

function prioRank(p) {
  if (p === 'high') return 0
  if (p === 'medium') return 1
  return 2
}

export default function KanbanBoard({ tasks, onMove, onSelectTask }) {
  const [priorityFilter, setPriorityFilter] = useState('all')
  const [isMounted, setIsMounted] = useState(false)

  useEffect(() => {
    setIsMounted(true)
  }, [])

  const filtered = useMemo(() => {
    if (priorityFilter === 'all') return tasks
    return tasks.filter((t) => t.priority === priorityFilter)
  }, [tasks, priorityFilter])

  const byStatus = useMemo(() => {
    const map = { todo: [], inprogress: [], done: [] }
    for (const t of filtered) map[t.status]?.push(t)
    for (const key of Object.keys(map)) {
      map[key].sort((a, b) => prioRank(a.priority) - prioRank(b.priority))
    }
    return map
  }, [filtered])

  if (!isMounted) return null;

  return (
    <div>
      <div className="mb-3 flex flex-wrap items-center gap-2">
        <Pill active={priorityFilter === 'all'} onClick={() => setPriorityFilter('all')}>
          All
        </Pill>
        <Pill active={priorityFilter === 'high'} onClick={() => setPriorityFilter('high')}>
          High
        </Pill>
        <Pill active={priorityFilter === 'medium'} onClick={() => setPriorityFilter('medium')}>
          Medium
        </Pill>
        <Pill active={priorityFilter === 'low'} onClick={() => setPriorityFilter('low')}>
          Low
        </Pill>
      </div>

      <DragDropContext
        onDragEnd={(result) => {
          const { destination, source, draggableId } = result
          if (!destination) return
          if (destination.droppableId === source.droppableId && destination.index === source.index) return
          const movedTask = tasks.find((task) => String(task.id) === draggableId)
          onMove?.(movedTask?.id ?? draggableId, destination.droppableId)
        }}
      >
        <div className="grid gap-4 md:grid-cols-3">
          {columns.map((col) => (
            <div key={col.key} className="rounded-xl border border-slate-200 bg-slate-100/60 flex flex-col h-full">
              <div className={`rounded-t-xl px-4 py-3 text-sm font-semibold ${col.header}`}>
                {col.title}{' '}
                <span className="ml-2 text-xs font-medium text-slate-600">{byStatus[col.key].length}</span>
              </div>
              <Droppable droppableId={col.key}>
                {(provided) => (
                  <div ref={provided.innerRef} {...provided.droppableProps} className="space-y-3 p-3 flex-1 min-h-[200px]">
                    {byStatus[col.key].map((task, index) => (
                      <Draggable key={task.id} draggableId={String(task.id)} index={index}>
                        {(dragProvided) => (
                          <div
                            ref={dragProvided.innerRef}
                            {...dragProvided.draggableProps}
                            {...dragProvided.dragHandleProps}
                            style={dragProvided.draggableProps.style}
                          >
                            <TaskCard task={task} onClick={() => onSelectTask?.(task.id)} />
                          </div>
                        )}
                      </Draggable>
                    ))}
                    {provided.placeholder}
                  </div>
                )}
              </Droppable>
            </div>
          ))}
        </div>
      </DragDropContext>
    </div>
  )
}

function Pill({ active, onClick, children }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded-full px-3 py-1 text-sm font-medium transition ${
        active ? 'bg-slate-900 text-white' : 'border border-slate-300 bg-white text-slate-700 hover:border-slate-400'
      }`}
    >
      {children}
    </button>
  )
}

