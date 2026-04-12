import React, { useState, useEffect } from 'react';
import { Plus, Pencil, Search, ArrowUp, ArrowDown, Building2, DollarSign, Target, AlertCircle } from 'lucide-react';
import { opportunitiesApi, Opportunity } from '../services/api';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Badge } from './ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from './ui/table';
import { Alert, AlertDescription } from './ui/alert';
import { Skeleton } from './ui/skeleton';

interface OpportunityListProps {
  onSelectOpportunity: (opportunity: Opportunity) => void;
  onCreateNew: () => void;
}

const statusVariant = (status: string): any => {
  switch (status?.toLowerCase()) {
    case 'open': return 'info';
    case 'in progress': return 'warning';
    case 'closed won': return 'success';
    case 'closed lost': return 'destructive';
    default: return 'secondary';
  }
};

const priorityVariant = (priority: string): any => {
  switch (priority?.toLowerCase()) {
    case 'high': return 'destructive';
    case 'medium': return 'warning';
    case 'low': return 'success';
    default: return 'secondary';
  }
};

const OpportunityList: React.FC<OpportunityListProps> = ({ onSelectOpportunity, onCreateNew }) => {
  const [opportunities, setOpportunities] = useState<Opportunity[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortField, setSortField] = useState<keyof Opportunity | ''>('');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');

  useEffect(() => { loadOpportunities(); }, []);

  const loadOpportunities = async () => {
    try {
      setLoading(true);
      const data = await opportunitiesApi.getAll();
      setOpportunities(data);
      setError(null);
    } catch (err) {
      setError('Failed to load opportunities');
    } finally {
      setLoading(false);
    }
  };

  const handleSort = (field: keyof Opportunity) => {
    if (sortField === field) setSortDirection(d => d === 'asc' ? 'desc' : 'asc');
    else { setSortField(field); setSortDirection('asc'); }
  };

  const filtered = opportunities
    .filter(o =>
      [o.title, o.organisation, o.description].some(v =>
        v?.toLowerCase().includes(searchTerm.toLowerCase())
      )
    )
    .sort((a, b) => {
      if (!sortField) return 0;
      const av = a[sortField], bv = b[sortField];
      if (av == null) return 1; if (bv == null) return -1;
      if (typeof av === 'number' && typeof bv === 'number') return sortDirection === 'asc' ? av - bv : bv - av;
      return sortDirection === 'asc' ? String(av).localeCompare(String(bv)) : String(bv).localeCompare(String(av));
    });

  if (loading) return (
    <div className="space-y-4">
      <div className="flex justify-between"><Skeleton className="h-8 w-36" /><Skeleton className="h-9 w-36" /></div>
      <Skeleton className="h-10 w-full max-w-sm" />
      <div className="rounded-md border"><div className="space-y-px">{Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-14 w-full rounded-none" />)}</div></div>
    </div>
  );

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Opportunities</h1>
          <p className="text-sm text-muted-foreground mt-0.5">Track investment opportunities and their progress.</p>
        </div>
        <Button onClick={onCreateNew} size="sm">
          <Plus className="w-4 h-4 mr-2" />Add Opportunity
        </Button>
      </div>

      <div className="relative max-w-sm">
        <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
        <Input placeholder="Search opportunities..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="pl-9" />
      </div>

      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error} <Button variant="link" size="sm" className="p-0 h-auto" onClick={loadOpportunities}>Retry</Button></AlertDescription>
        </Alert>
      )}

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              {([['title', 'Title'], ['organisation', 'Organization'], ['estimated_value', 'Value']] as [keyof Opportunity, string][]).map(([field, label]) => (
                <TableHead key={field} className="cursor-pointer select-none" onClick={() => handleSort(field)}>
                  <span className="flex items-center gap-1">{label}{sortField === field && (sortDirection === 'asc' ? <ArrowUp className="h-3 w-3" /> : <ArrowDown className="h-3 w-3" />)}</span>
                </TableHead>
              ))}
              <TableHead>Status</TableHead>
              <TableHead>Priority</TableHead>
              <TableHead className="w-16" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.map((opp) => (
              <TableRow key={opp.id} className="cursor-pointer" onClick={() => onSelectOpportunity(opp)}>
                <TableCell className="font-medium">{opp.title}</TableCell>
                <TableCell>
                  <div className="flex items-center gap-1.5">
                    <Building2 className="w-3.5 h-3.5 text-muted-foreground" />{opp.organisation}
                  </div>
                </TableCell>
                <TableCell>
                  {opp.estimated_value ? (
                    <div className="flex items-center gap-1 text-sm">
                      <DollarSign className="w-3.5 h-3.5 text-muted-foreground" />
                      ₹{opp.estimated_value.toLocaleString()} Cr
                    </div>
                  ) : <span className="text-muted-foreground">—</span>}
                </TableCell>
                <TableCell><Badge variant={statusVariant(opp.status)}>{opp.status}</Badge></TableCell>
                <TableCell><Badge variant={priorityVariant(opp.priority)}>{opp.priority}</Badge></TableCell>
                <TableCell>
                  <Button variant="ghost" size="icon" onClick={(e) => { e.stopPropagation(); onSelectOpportunity(opp); }}>
                    <Pencil className="w-4 h-4" />
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
        {filtered.length === 0 && (
          <div className="text-center py-12">
            <Target className="mx-auto h-10 w-10 text-muted-foreground mb-3" />
            <h3 className="text-sm font-medium">No opportunities found</h3>
            <p className="mt-1 text-sm text-muted-foreground">{searchTerm ? 'Try adjusting your search terms.' : 'Get started by creating a new opportunity.'}</p>
            {!searchTerm && <Button onClick={onCreateNew} size="sm" className="mt-4"><Plus className="w-4 h-4 mr-2" />Add Opportunity</Button>}
          </div>
        )}
      </div>
      <p className="text-sm text-muted-foreground">Showing {filtered.length} of {opportunities.length} opportunities</p>
    </div>
  );
};

export default OpportunityList;
