'use client';
import {
  Card,
  CardContent,
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
import { AlertTriangle, Fuel, Truck, Wrench } from 'lucide-react';
import {
  useCollection,
  useFirebase,
  useMemoFirebase,
  WithId,
} from '@/firebase';
import { useAuth } from '@/context/auth-context';
import { collection, query, where, orderBy, limit } from 'firebase/firestore';
import type { Vehicle, Checklist } from '@/lib/types';
import { Skeleton } from '@/components/ui/skeleton';

function DashboardCard({
  title,
  icon,
  value,
  description,
  isLoading,
}: {
  title: string;
  icon: React.ReactNode;
  value: number | string;
  description: string;
  isLoading: boolean;
}) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        {icon}
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <>
            <Skeleton className="h-8 w-16" />
            <Skeleton className="mt-1 h-4 w-full" />
          </>
        ) : (
          <>
            <div className="text-2xl font-bold">{value}</div>
            <p className="text-xs text-muted-foreground">{description}</p>
          </>
        )}
      </CardContent>
    </Card>
  );
}

export default function Dashboard() {
  const { firestore } = useFirebase();
  const { user } = useAuth();

  const vehiclesQuery = useMemoFirebase(
    () => (firestore && user ? collection(firestore, 'vehicles') : null),
    [firestore, user]
  );
  const { data: vehicles, isLoading: isLoadingVehicles } =
    useCollection<Vehicle>(vehiclesQuery);

  const checklistsQuery = useMemoFirebase(() => {
    if (!firestore || !user) return null;

    const baseQuery = collection(firestore, 'checklists');
    
    // Admins see all recent checklists, drivers see only their own
    if (user.role === 'admin') {
      return query(baseQuery, orderBy('date', 'desc'), limit(50));
    }
    
    return query(baseQuery, where('userId', '==', user.uid), orderBy('date', 'desc'), limit(5));
      
  }, [firestore, user]);

  const { data: recentChecklists, isLoading: isLoadingChecklists } =
    useCollection<Checklist>(checklistsQuery);

  const vehiclesWithProblems =
    vehicles?.filter((v) => v.status === 'Com Problemas').length ?? 0;
  const vehiclesInMaintenance =
    vehicles?.filter((v) => v.status === 'Manutenção').length ?? 0;
  const lowFuelVehicles =
    vehicles?.filter((v) => (v.fuelLevel ?? 100) < 25).length ?? 0;

  const hasIssues = (checklist: WithId<Checklist>) => {
    if (!checklist.items) return false;
    return Object.values(checklist.items).some(
      (status) => status === 'issue' || status === 'Avariado' || status === 'Incompleto' || status === 'Desgastado'
    );
  };
  
  const recentAlerts = recentChecklists?.filter(hasIssues).sort((a,b) => b.date.toMillis() - a.date.toMillis()).slice(0, 5);


  return (
    <div className="flex flex-col gap-8">
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <DashboardCard
          title="Total de Veículos"
          icon={<Truck className="h-4 w-4 text-muted-foreground" />}
          value={vehicles?.length ?? 0}
          description="veículos na frota"
          isLoading={isLoadingVehicles}
        />
        <DashboardCard
          title="Com Problemas"
          icon={<AlertTriangle className="h-4 w-4 text-destructive" />}
          value={vehiclesWithProblems}
          description="requerem atenção imediata"
          isLoading={isLoadingVehicles}
        />
        <DashboardCard
          title="Em Manutenção"
          icon={<Wrench className="h-4 w-4 text-muted-foreground" />}
          value={vehiclesInMaintenance}
          description="veículos atualmente na oficina"
          isLoading={isLoadingVehicles}
        />
        <DashboardCard
          title="Combustível Baixo"
          icon={<Fuel className="h-4 w-4 text-muted-foreground" />}
          value={lowFuelVehicles}
          description="veículos com menos de 25%"
          isLoading={isLoadingVehicles}
        />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Alertas Recentes</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Veículo</TableHead>
                <TableHead>Motorista</TableHead>
                <TableHead>Data</TableHead>
                <TableHead>Problema</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoadingChecklists ? (
                 Array.from({ length: 3 }).map((_, i) => (
                    <TableRow key={i}>
                      <TableCell><Skeleton className="h-5 w-24" /></TableCell>
                      <TableCell><Skeleton className="h-5 w-32" /></TableCell>
                      <TableCell><Skeleton className="h-5 w-20" /></TableCell>
                      <TableCell><Skeleton className="h-5 w-40" /></TableCell>
                    </TableRow>
                  ))
              ) : recentAlerts && recentAlerts.length > 0 ? (
                recentAlerts.map((alert) => {
                  const vehicle = vehicles?.find((v) => v.id === alert.vehicleId);
                  return (
                    <TableRow key={alert.id}>
                      <TableCell className="font-medium">
                        {vehicle?.plate || 'N/A'}
                      </TableCell>
                      <TableCell>{alert.driverName}</TableCell>
                      <TableCell>
                        {alert.date.toDate().toLocaleDateString('pt-BR')}
                      </TableCell>
                      <TableCell className="text-destructive">
                        {alert.notes || 'Problema reportado no checklist.'}
                      </TableCell>
                    </TableRow>
                  );
                })
              ) : (
                <TableRow>
                  <TableCell colSpan={4} className="text-center">
                    Nenhum alerta recente.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
