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
import { collection, query, where, orderBy, limit } from 'firebase/firestore';
import type { Vehicle, Checklist } from '@/lib/types';
import { CHECKLIST_ITEMS, CHECKLIST_ITEMS_LEVE } from '@/lib/types';
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

const allHeavyItems = Object.values(CHECKLIST_ITEMS).flat();
const allLightItems = Object.values(CHECKLIST_ITEMS_LEVE).flat();
const allItemsMap = new Map(
  [...allHeavyItems, ...allLightItems].map((item) => [item.id, item.label])
);

const issueStatuses: string[] = ['issue', 'Avariado', 'Incompleto', 'Desgastado'];

function getProblemDescription(checklist: WithId<Checklist>): string | string[] {
  if (!checklist.items) {
    return checklist.notes || 'Problema reportado no checklist.';
  }

  const problemItems = Object.entries(checklist.items)
    .filter(([_, status]) => issueStatuses.includes(String(status)))
    .map(([itemId, _]) => allItemsMap.get(itemId) || itemId);

  if (problemItems.length > 0) {
    return problemItems;
  }
  
  return checklist.notes || 'Problema reportado no checklist.';
}

export default function Dashboard() {
  const { firestore } = useFirebase();

  const vehiclesQuery = useMemoFirebase(
    () => (firestore ? collection(firestore, 'vehicles') : null),
    [firestore]
  );
  const { data: vehicles, isLoading: isLoadingVehicles } =
    useCollection<Vehicle>(vehiclesQuery);

  const checklistsQuery = useMemoFirebase(() => {
    if (!firestore) return null;
    return query(collection(firestore, 'checklists'), orderBy('date', 'desc'), limit(50));
  }, [firestore]);

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
      (status) => issueStatuses.includes(String(status))
    );
  };
  
  const recentAlerts = recentChecklists?.filter(hasIssues).sort((a,b) => b.date.toMillis() - a.date.toMillis()).slice(0, 5);


  return (
    <div className="mx-auto w-full max-w-7xl flex flex-col gap-6 md:gap-8">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
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
          <div className="overflow-x-auto">
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
                    const problemDescription = getProblemDescription(alert);
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
                          {Array.isArray(problemDescription) ? (
                            <ul className="list-disc list-inside">
                              {problemDescription.map((item, index) => (
                                <li key={index}>{item}</li>
                              ))}
                            </ul>
                          ) : (
                            problemDescription
                          )}
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
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
