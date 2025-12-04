import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { checklists, vehicles } from '@/lib/data';

export default function ReportsPage() {
  const sortedChecklists = [...checklists].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Relatórios de Checklist</h1>
        <p className="text-muted-foreground">
          Visualize o histórico completo de checklists de toda a frota.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Todos os Registros</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Data</TableHead>
                <TableHead>Veículo</TableHead>
                <TableHead>Motorista</TableHead>
                <TableHead>Tipo</TableHead>
                <TableHead>Odômetro</TableHead>
                <TableHead className="text-right">Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {sortedChecklists.map((checklist) => {
                const vehicle = vehicles.find(v => v.id === checklist.vehicleId);
                const hasIssues = Object.values(checklist.items).includes('issue');

                return (
                  <TableRow key={checklist.id}>
                    <TableCell>
                      {new Date(checklist.date).toLocaleDateString('pt-BR')} às {checklist.time}
                    </TableCell>
                    <TableCell className="font-medium">{vehicle?.plate || 'N/A'}</TableCell>
                    <TableCell>{checklist.driver}</TableCell>
                    <TableCell>
                      <Badge variant={checklist.type === 'Saída' ? 'outline' : 'secondary'}>
                        {checklist.type}
                      </Badge>
                    </TableCell>
                    <TableCell>{checklist.odometer.toLocaleString('pt-BR')} km</TableCell>
                    <TableCell className="text-right">
                      <Badge variant={hasIssues ? 'destructive' : 'default'}>
                        {hasIssues ? 'Com Problemas' : 'OK'}
                      </Badge>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
