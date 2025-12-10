'use client';
import { useMemo } from 'react';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription
} from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { useCollection, useFirebase, useMemoFirebase, WithId } from '@/firebase';
import { collection, query, orderBy } from 'firebase/firestore';
import type { Vehicle, Checklist } from '@/lib/types';
import { Skeleton } from '@/components/ui/skeleton';
import { useAuth } from '@/context/auth-context';
import { CHECKLIST_ITEMS, CHECKLIST_ITEMS_LEVE } from '@/lib/types';
import { Badge } from '@/components/ui/badge';

const allHeavyItems = Object.values(CHECKLIST_ITEMS).flat();
const allLightItems = Object.values(CHECKLIST_ITEMS_LEVE).flat();
const allItemsMap = new Map([...allHeavyItems, ...allLightItems].map(item => [item.id, item.label]));

const issueStatuses = ['issue', 'Avariado', 'Desgastado', 'Incompleto', 'nao'];

type RequestedPart = {
  id: string;
  itemName: string;
  status: string;
  checklistId: string;
  checklistDate: Date;
  vehicleId: string;
  vehiclePlate: string;
  vehicleModel: string;
  driverName: string;
};

export default function RequestedPartsPage() {
  const { firestore } = useFirebase();
  const { user } = useAuth();

  const checklistsQuery = useMemoFirebase(
    () =>
      firestore && user?.role === 'admin'
        ? query(collection(firestore, 'checklists'), orderBy('date', 'desc'))
        : null,
    [firestore, user]
  );
  const { data: checklists, isLoading: isLoadingChecklists } =
    useCollection<Checklist>(checklistsQuery);

  const vehiclesQuery = useMemoFirebase(
    () => (firestore && user ? collection(firestore, 'vehicles') : null),
    [firestore, user]
  );
  const { data: vehicles, isLoading: isLoadingVehicles } =
    useCollection<Vehicle>(vehiclesQuery);

  const isLoading = isLoadingChecklists || isLoadingVehicles;
  
  const requestedParts: RequestedPart[] = useMemo(() => {
    if (!checklists || !vehicles) return [];

    const parts: RequestedPart[] = [];
    const vehiclesMap = new Map(vehicles.map(v => [v.id, v]));

    for (const checklist of checklists) {
      const vehicle = vehiclesMap.get(checklist.vehicleId);
      if (!vehicle) continue;

      for (const [itemId, status] of Object.entries(checklist.items)) {
        if (issueStatuses.includes(String(status))) {
          parts.push({
            id: `${checklist.id}-${itemId}`,
            itemName: allItemsMap.get(itemId) || 'Item desconhecido',
            status: String(status),
            checklistId: checklist.id,
            checklistDate: checklist.date.toDate(),
            vehicleId: vehicle.id,
            vehiclePlate: vehicle.plate,
            vehicleModel: vehicle.model,
            driverName: checklist.driverName,
          });
        }
      }
    }
    return parts;
  }, [checklists, vehicles]);
  
  if (user?.role !== 'admin') {
     return (
        <div className="max-w-4xl mx-auto text-center py-10">
          <h1 className="text-2xl font-bold">Acesso Negado</h1>
          <p className="text-muted-foreground">Você não tem permissão para visualizar esta página.</p>
        </div>
      );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">
          Peças e Itens Solicitados
        </h1>
        <p className="text-muted-foreground">
          Lista de todos os itens reportados com avaria ou problema nos checklists.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Solicitações de Manutenção</CardTitle>
          <CardDescription>
            Itens que requerem atenção com base nos últimos checklists.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Item</TableHead>
                <TableHead>Veículo</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Data da Solicitação</TableHead>
                <TableHead>Motorista</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                Array.from({ length: 10 }).map((_, i) => (
                  <TableRow key={i}>
                    <TableCell><Skeleton className="h-5 w-32" /></TableCell>
                    <TableCell><Skeleton className="h-5 w-24" /></TableCell>
                    <TableCell><Skeleton className="h-6 w-20" /></TableCell>
                    <TableCell><Skeleton className="h-5 w-28" /></TableCell>
                    <TableCell><Skeleton className="h-5 w-28" /></TableCell>
                  </TableRow>
                ))
              ) : requestedParts.length > 0 ? (
                requestedParts.map((part) => (
                  <TableRow key={part.id}>
                    <TableCell className="font-medium">{part.itemName}</TableCell>
                    <TableCell>{part.vehiclePlate} - {part.vehicleModel}</TableCell>
                    <TableCell>
                      <Badge variant="destructive">{part.status}</Badge>
                    </TableCell>
                    <TableCell>{part.checklistDate.toLocaleDateString('pt-BR')}</TableCell>
                    <TableCell>{part.driverName}</TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={5} className="h-24 text-center">
                    Nenhum item com problema encontrado nos checklists.
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
