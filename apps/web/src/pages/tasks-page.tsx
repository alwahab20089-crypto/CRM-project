import type { Column } from '@/components/common/data-table';
import { ListPage } from '@/components/common/list-page';
import { StatusBadge } from '@/components/common/status-badge';
import { useTasks } from '@/hooks/use-crm-queries';
import { formatDateTime } from '@/lib/format';
import { humanize } from '@/lib/labels';
import type { Task, TaskStatus, WithAssignee } from '@/types';

type Row = WithAssignee<Task>;

const columns: Column<Row>[] = [
  { key: 'title', header: 'Task', cell: (t) => <span className="font-medium">{t.title}</span>, className: 'min-w-64' },
  { key: 'type', header: 'Type', cell: (t) => humanize(t.taskType) },
  { key: 'due', header: 'Due', cell: (t) => <span className="whitespace-nowrap">{formatDateTime(t.dueDate)}</span> },
  { key: 'priority', header: 'Priority', cell: (t) => <StatusBadge status={t.priority} /> },
  { key: 'agent', header: 'Assigned to', cell: (t) => t.assignee?.name ?? 'Unassigned' },
  { key: 'status', header: 'Status', cell: (t) => <StatusBadge status={t.status} /> },
];

const statuses: TaskStatus[] = ['OPEN', 'IN_PROGRESS', 'DONE', 'CANCELLED'];

export function TasksPage() {
  return (
    <ListPage
      title="Tasks"
      description="Everything your team needs to do next."
      actionLabel="Add task"
      query={useTasks()}
      columns={columns}
      searchText={(t: Row) => `${t.title} ${t.taskType}`}
      searchPlaceholder="Search tasks"
      filter={{ label: 'Statuses', options: statuses, getValue: (t) => t.status }}
    />
  );
}