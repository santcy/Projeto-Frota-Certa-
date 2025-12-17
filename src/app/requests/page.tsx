'use client';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { MoreHorizontal } from 'lucide-react';
import {
  useCollection,
  useFirebase,
  useMemoFirebase,
  updateDocumentNonBlocking,
  WithId,
} from '@/firebase';
import { collection, query, orderBy, doc, serverTimestamp } from 'firebase/firestore';
import type { MaintenanceRequest, MaintenanceRequestStatus } from '@/lib/types';
import { Skeleton } from '@/components/ui/skeleton';
import { useAuth } from '@/context/auth-context';
import { format } from 'date-fns';

const statusVariants: Record<
  MaintenanceRequestStatus,
  'default' | 'secondary' | 'destructive' | 'outline'
> = {
  Pendente: 'destructive',
  Comprado: 'outline',
  Instalado: 'default',
  Cancelado: 'secondary',
};

function StatusBadge({ status }: { status: MaintenanceRequestStatus }) {
  return <Badge variant={statusVariants[status]}>{status}</Badge>;
}

function RequestsPageSkeleton() {
    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-2xl font-bold tracking-tight">
                Solicitações de Manutenção
                </h1>
                <p className="text-muted-foreground">
                Gerencie todos os itens reportados com avaria ou problema nos
                checklists.
                </p>
            </div>
            <Card>
                <CardHeader>
                    <CardTitle>Peças e Itens Solicitados</CardTitle>
                    <CardDescription>
                    Itens que requerem atenção com base nos últimos checklists.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="overflow-x-auto">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Item</TableHead>
                                    <TableHead>Qtd.</TableHead>
                                    <TableHead>Veículo</TableHead>
                                    <TableHead>Data</TableHead>
                                    <TableHead>Motorista</TableHead>
                                    <TableHead>Status</TableHead>
                                    <TableHead className="text-right">Ações</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {Array.from({ length: 10 }).map((_, i) => (
                                <TableRow key={i}>
                                    <TableCell>
                                    <Skeleton className="h-5 w-32" />
                                    </TableCell>
                                     <TableCell>
                                    <Skeleton className="h-5 w-12" />
                                    </TableCell>
                                    <TableCell>
                                    <Skeleton className="h-5 w-24" />
                                    </TableCell>
                                    <TableCell>
                                    <Skeleton className="h-5 w-28" />
                                    </TableCell>
                                    <TableCell>
                                    <Skeleton className="h-5 w-28" />
                                    </TableCell>
                                    <TableCell>
                                    <Skeleton className="h-6 w-20" />
                                    </TableCell>
                                    <TableCell className="text-right">
                                    <Skeleton className="h-8 w-8 ml-auto" />
                                    </TableCell>
                                </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}

export default function RequestedPartsPage() {
  const { firestore } = useFirebase();
  const { user, isUserLoading } = useAuth();

  const requestsQuery = useMemoFirebase(
    () => {
        if (!firestore || !user || user.role === 'driver') {
            return null; // Return null if not admin to avoid running the query
        }
        return query(
            collection(firestore, 'maintenanceRequests'),
            orderBy('createdAt', 'desc')
        );
    },
    [firestore, user]
  );
  
  const { data: requests, isLoading: isLoadingRequests } =
    useCollection<MaintenanceRequest>(requestsQuery);
    
  const isLoading = isLoadingRequests || isUserLoading;

  const handleStatusChange = (
    requestId: string,
    newStatus: MaintenanceRequestStatus
  ) => {
    if (!firestore) return;
    const requestRef = doc(firestore, 'maintenanceRequests', requestId);
    updateDocumentNonBlocking(requestRef, {
      requestStatus: newStatus,
      updatedAt: serverTimestamp(),
    });
  };

  if (isLoading) {
    return (
         <div className="mx-auto w-full max-w-7xl">
            <RequestsPageSkeleton />
        </div>
    );
  }
  
  if (user?.role === 'driver') {
      return (
        <div className="mx-auto w-full max-w-7xl">
            <Card>
                <CardHeader>
                    <CardTitle>Acesso Negado</CardTitle>
                    <CardDescription>Você não tem permissão para acessar esta página.</CardDescription>
                </CardHeader>
            </Card>
        </div>
    );
  }

  return (
    <div className="mx-auto w-full max-w-7xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">
          Solicitações de Manutenção
        </h1>
        <p className="text-muted-foreground">
          Gerencie todos os itens reportados com avaria ou problema nos
          checklists.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Peças e Itens Solicitados</CardTitle>
          <CardDescription>
            Itens que requerem atenção com base nos últimos checklists.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Item</TableHead>
                  <TableHead>Qtd.</TableHead>
                  <TableHead>Veículo</TableHead>
                  <TableHead>Data</TableHead>
                  <TableHead>Motorista</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {requests && requests.length > 0 ? (
                  requests.map((req) => (
                    <TableRow key={req.id}>
                      <TableCell className="font-medium">{req.itemName}</TableCell>
                      <TableCell>{req.quantity}</TableCell>
                      <TableCell>
                        {req.vehiclePlate} - {req.vehicleModel}
                      </TableCell>
                      <TableCell>
                        {format(req.createdAt.toDate(), 'dd/MM/yyyy')}
                      </TableCell>
                      <TableCell>{req.driverName}</TableCell>
                      <TableCell>
                        <StatusBadge status={req.requestStatus} />
                      </TableCell>
                      <TableCell className="text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" className="h-8 w-8 p-0">
                              <span className="sr-only">Abrir menu</span>
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            {(
                              ['Pendente', 'Comprado', 'Instalado', 'Cancelado'] as MaintenanceRequestStatus[]
                            ).map((status) => (
                              <DropdownMenuItem
                                key={status}
                                onClick={() => handleStatusChange(req.id, status)}
                                disabled={req.requestStatus === status}
                              >
                                Marcar como {status}
                              </DropdownMenuItem>
                            ))}
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={7} className="h-24 text-center">
                      Nenhum item com problema encontrado nos checklists.
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
