import React, { useState, useEffect } from 'react';
import {
  Plus, Pencil, Search, ArrowUp, ArrowDown, CheckCircle2,
  Clock, Phone, Mail, AlertCircle
} from 'lucide-react';
import { tasksApi, Task } from '../services/api';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Badge } from './ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from './ui/table';
import { Alert, AlertDescription } from './ui/alert';
import { Skeleton } from './ui/skeleton';

interface TaskListProps {
  onSelectTask: (task: Task) => void;
  onCreateNew: () => void;
}

const statusVariant = (s: string): any => {
  switch (s?.toLowerCase()) {
    case 'completed': return 'success';
    case 'in progress': return 'info';
    case 'todo': return 'warning';
    case 'cancelled': return 'destructive';
    default: return 'secondary';
  }
};

const priorityVariant = (p: string): any => {
  switch (p?.toLowerCase()) {
    case 'high': return 'destructive';
    case 'medium': return 'warning';
    case 'low': return 'success';
    default: return 'secondary';
  }
};

const TaskTypeIcon = ({ type }: { type: string }) => {
  switch (type?.toLowerCase()) {
    case 'call': return <Phone className="h-3.5 w-3.5" />;
    case 'email': return <Mail className="h-3.5 w-3.5" />;
    default: return <CheckCircle2 className="h-3.5 w-3.5" />;
  }
};

const TaskList: React.FC<TaskListProps> = ({ onSelectTask, onCreateNew }) => {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortField, setSortField] = useState<keyof Task | ''>('');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');

  useEffect(() => { loadTasks(); }, []);

  const loadTasks = async () => {
    try {
      setLoading(true);
      const data = await tasksApi.getAll();
      setTasks(data);
      setError(null);
    } catch (err) {
      setError('Failed to load tasks');
    } finally {
      setLoading(false);
    }
  };

  const handleSort = (field: keyof Task) => {
    if (sortField === field) setSortDirection(d => d === 'asc' ? 'desc' : 'asc');
    else { setSortField(field); setSortDirection('asc'); }
  };

  const filtered = tasks
    .filter(t => [t.title, t.description, t.task_type].some(v => v?.toLowerCase().includes(searchTerm.toLowerCase())))
    .sort((a, b) => {
      if (!sortField) return 0;
      const av = a[sortField], bv = b[sortField];
      if (av == null) return 1; if (bv == null) return -1;
      return sortDirection === 'asc' ? String(av).localeCompare(String(bv)) : String(bv).localeCompare(String(av));
    });

  if (loading) return (
    <div className="space-y-4">
      <div className="flex justify-between"><Skeleton className="h-8 w-24" /><Skeleton className="h-9 w-28" /></div>
      <Skeleton className="h-10 w-full max-w-sm" />
      <div className="rounded-md border">{Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-14 w-full rounded-none" />)}</div>
    </div>
  );

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Tasks</h1>
          <p className="text-sm text-muted-foreground mt-0.5">Manage and track your tasks and activities.</p>
        </div>
        <Button onClick={onCreateNew} size="sm">
          <Plus className="w-4 h-4 mr-2" />Add Task
        </Button>
      </div>

      <div className="relative max-w-sm">
        <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
        <Input placeholder="Search tasks..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="pl-9" />
      </div>

      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error} <Button variant="link" size="sm" className="p-0 h-auto" onClick={loadTasks}>Retry</Button></AlertDescription>
        </Alert>
      )}

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="cursor-pointer select-none" onClick={() => handleSort('title')}>
                <span className="flex items-center gap-1">Title {sortField === 'title' && (sortDirection === 'asc' ? <ArrowUp className="h-3 w-3" /> : <ArrowDown className="h-3 w-3" />)}</span>
              </TableHead>
              <TableHead>Type</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Priority</TableHead>
              <TableHead className="cursor-pointer select-none" onClick={() => handleSort('due_date')}>
                <span className="flex items-center gap-1">Due Date {sortField === 'due_date' && (sortDirection === 'asc' ? <ArrowUp className="h-3 w-3" /> : <ArrowDown className="h-3 w-3" />)}</span>
              </TableHead>
              <TableHead className="w-16" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.map((task) => (
              <TableRow key={task.id} className="cursor-pointer" onClick={() => onSelectTask(task)}>
                <TableCell className="font-medium">{task.title}</TableCell>
                <TableCell>
                  <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
                    <TaskTypeIcon type={task.task_type} />
                    {task.task_type}
                  </div>
                </TableCell>
                <TableCell><Badge variant={statusVariant(task.status)}>{task.status}</Badge></TableCell>
                <TableCell><Badge variant={priorityVariant(task.priority)}>{task.priority}</Badge></TableCell>
                <TableCell className="text-sm text-muted-foreground">
                  {task.due_date ? (
                    <div className="flex items-center gap-1"><Clock className="h-3.5 w-3.5" />{new Date(task.due_date).toLocaleDateString()}</div>
                  ) : '—'}
                </TableCell>
                <TableCell>
                  <Button variant="ghost" size="icon" onClick={(e) => { e.stopPropagation(); onSelectTask(task); }}>
                    <Pencil className="w-4 h-4" />
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
        {filtered.length === 0 && (
          <div className="text-center py-12">
            <CheckCircle2 className="mx-auto h-10 w-10 text-muted-foreground mb-3" />
            <h3 className="text-sm font-medium">No tasks found</h3>
            <p className="mt-1 text-sm text-muted-foreground">{searchTerm ? 'Try adjusting your search terms.' : 'Get started by creating a new task.'}</p>
            {!searchTerm && <Button onClick={onCreateNew} size="sm" className="mt-4"><Plus className="w-4 h-4 mr-2" />Add Task</Button>}
          </div>
        )}
      </div>
      <p className="text-sm text-muted-foreground">Showing {filtered.length} of {tasks.length} tasks</p>
    </div>
  );
};

export default TaskList;

interface TaskListProps {
  onSelectTask: (task: Task) => void;
  onCreateNew: () => void;
}
