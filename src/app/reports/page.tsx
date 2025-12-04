'use client';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { useCollection, useFirebase, useMemoFirebase, WithId } from '@/firebase';
import { collection, query, orderBy } from 'firebase/firestore';
import type { Vehicle, Checklist } from '@/lib/types';
import { Skeleton } from '@/components/ui/skeleton';

export default function ReportsPage() {
  const { firestore } = useFirebase();

  const checklistsQuery = useMemoFirebase(
    () =>
      firestore
        ? query(collection(firestore, 'checklists'), orderBy('date', 'desc'))
        : null,
    [firestore]
  );
  const { data: checklists, isLoading: isLoadingChecklists } =
    useCollection<Checklist>(checklistsQuery);

  const vehiclesQuery = useMemoFirebase(
    () => (firestore ? collection(firestore, 'vehicles') : null),
    [firestore]
  );
  const { data: vehicles, isLoading: isLoadingVehicles } =
    useCollection<Vehicle>(vehiclesQuery);

  const isLoading = isLoadingChecklists || isLoadingVehicles;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">
          Relatórios de Checklist
        </h1>
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
              {isLoading
                ? Array.from({ length: 5 }).map((_, i) => (
                    <TableRow key={i}>
                      <TableCell>
                        <Skeleton className="h-5 w-32" />
                      </TableCell>
                      <TableCell>
                        <Skeleton className="h-5 w-24" />
                      </TableCell>
                      <TableCell>
                        <Skeleton className="h-5 w-28" />
                      </TableCell>
                      <TableCell>
                        <Skeleton className="h-5 w-16" />
                      </TableCell>
                      <TableCell>
                        <Skeleton className="h-5 w-20" />
                      </TableCell>
                      <TableCell className="text-right">
                        <Skeleton className="h-6 w-24 ml-auto" />
                      </TableCell>
                    </TableRow>
                  ))
                : checklists?.map((checklist) => {
                    const vehicle = vehicles?.find(
                      (v) => v.id === checklist.vehicleId
                    );
                    const hasIssues = Object.values(checklist.items).includes(
                      'issue'
                    );

                    return (
                      <TableRow key={checklist.id}>
                        <TableCell>
                          {checklist.date.toDate().toLocaleDateString('pt-BR', {
                            day: '2-digit',
                            month: '2-digit',
                            year: 'numeric',
                          })}
                        </TableCell>
                        <TableCell className="font-medium">
                          {vehicle?.plate || 'N/A'}
                        </TableCell>
                        <TableCell>{checklist.driverName}</TableCell>
                        <TableCell>
                          <Badge
                            variant={
                              checklist.type === 'Saída'
                                ? 'outline'
                                : 'secondary'
                            }
                          >
                            {checklist.type}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          {checklist.odometer.toLocaleString('pt-BR')} km
                        </TableCell>
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
