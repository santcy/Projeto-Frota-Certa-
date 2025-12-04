import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { vehicles, checklists } from '@/lib/data';
import { AlertTriangle, Fuel, Truck, Wrench } from 'lucide-react';
import type { VehicleStatus } from '@/lib/types';

function getStatusVariant(status: VehicleStatus) {
  switch (status) {
    case 'Operacional':
      return 'default';
    case 'Com Problemas':
      return 'destructive';
    case 'Manutenção':
      return 'secondary';
    default:
      return 'default';
  }
}

export default function Dashboard() {
  const vehiclesWithProblems = vehicles.filter(
    (v) => v.status === 'Com Problemas'
  ).length;
  const vehiclesInMaintenance = vehicles.filter(
    (v) => v.status === 'Manutenção'
  ).length;
  const lowFuelVehicles = vehicles.filter((v) => v.fuelLevel < 25).length;

  const recentAlerts = checklists
    .filter((c) => Object.values(c.items).includes('issue'))
    .slice(0, 5);

  return (
    <div className="flex flex-col gap-8">
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Total de Veículos
            </CardTitle>
            <Truck className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{vehicles.length}</div>
            <p className="text-xs text-muted-foreground">
              veículos na frota
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Com Problemas
            </CardTitle>
            <AlertTriangle className="h-4 w-4 text-destructive" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{vehiclesWithProblems}</div>
            <p className="text-xs text-muted-foreground">
              requerem atenção imediata
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Em Manutenção
            </CardTitle>
            <Wrench className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{vehiclesInMaintenance}</div>
            <p className="text-xs text-muted-foreground">
              veículos atualmente na oficina
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Combustível Baixo
            </CardTitle>
            <Fuel className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{lowFuelVehicles}</div>
            <p className="text-xs text-muted-foreground">
              veículos com menos de 25%
            </p>
          </CardContent>
        </Card>
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
              {recentAlerts.length > 0 ? (
                recentAlerts.map((alert) => {
                  const vehicle = vehicles.find(v => v.id === alert.vehicleId);
                  return (
                    <TableRow key={alert.id}>
                      <TableCell className="font-medium">{vehicle?.plate || 'N/A'}</TableCell>
                      <TableCell>{alert.driver}</TableCell>
                      <TableCell>{new Date(alert.date).toLocaleDateString('pt-BR')}</TableCell>
                      <TableCell className="text-destructive">{alert.notes}</TableCell>
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
