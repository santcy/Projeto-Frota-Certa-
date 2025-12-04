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
import { Badge } from '@/components/ui/badge';
import { useCollection, useFirebase, useMemoFirebase, WithId } from '@/firebase';
import { collection, query, orderBy } from 'firebase/firestore';
import type { Vehicle, Checklist, ChecklistItemStatus } from '@/lib/types';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { Download } from 'lucide-react';
import { useAuth } from '@/context/auth-context';
import jsPDF from 'jspdf';
import 'jspdf-autotable';
import { CHECKLIST_ITEMS_SECTIONS, CHECKLIST_ITEMS } from '@/lib/types';

interface jsPDFWithAutoTable extends jsPDF {
  autoTable: (options: any) => jsPDF;
}


export default function ReportsPage() {
  const { firestore } = useFirebase();
  const { user } = useAuth();

  const checklistsQuery = useMemoFirebase(
    () =>
      firestore && user
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

  const handleDownloadChecklist = (checklist: WithId<Checklist>, vehicle: WithId<Vehicle>) => {
    const doc = new jsPDF() as jsPDFWithAutoTable;

    doc.setFontSize(18);
    doc.text('ROTA CERTA - Relatório de Checklist', 14, 22);
    doc.setFontSize(11);
    doc.setTextColor(100);
    
    const generalInfo = [
      ['Veículo:', `${vehicle.plate} - ${vehicle.model}`],
      ['Motorista:', checklist.driverName],
      ['Data:', checklist.date.toDate().toLocaleString('pt-BR')],
      ['Tipo:', checklist.type],
      ['Odômetro:', `${checklist.odometer.toLocaleString('pt-BR')} km`],
      ['Combustível:', `${checklist.fuelLevel}%`],
    ];

    doc.autoTable({
      startY: 30,
      head: [['INFORMAÇÕES GERAIS', '']],
      body: generalInfo,
      theme: 'striped',
      headStyles: { fillColor: [30, 58, 138] },
    });
    
    const checklistBody = [];

    for (const [sectionKey, sectionName] of Object.entries(CHECKLIST_ITEMS_SECTIONS)) {
      const sectionItems = CHECKLIST_ITEMS[sectionKey as keyof typeof CHECKLIST_ITEMS];
      const relevantItems = sectionItems.filter(item => checklist.items[item.id]);

      if (relevantItems.length > 0) {
        checklistBody.push([{ content: sectionName.toUpperCase(), colSpan: 2, styles: { fontStyle: 'bold', fillColor: [241, 245, 249] } }]);
        for (const item of relevantItems) {
          const status = checklist.items[item.id];
          checklistBody.push([item.label, status.toUpperCase()]);
        }
      }
    }

    doc.autoTable({
      startY: (doc as any).lastAutoTable.finalY + 10,
      head: [['Item', 'Status']],
      body: checklistBody,
      theme: 'grid',
      headStyles: { fillColor: [30, 58, 138] },
    });

    if (checklist.notes) {
      doc.autoTable({
        startY: (doc as any).lastAutoTable.finalY + 10,
        head: [['OBSERVAÇÕES']],
        body: [[checklist.notes]],
        theme: 'striped',
        headStyles: { fillColor: [30, 58, 138] },
      });
    }

    doc.save(`checklist-${vehicle.plate}-${checklist.id.substring(0, 5)}.pdf`);
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">
          Histórico de Checklist
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
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Ações</TableHead>
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
                      <TableCell>
                        <Skeleton className="h-6 w-24" />
                      </TableCell>
                      <TableCell className="text-right">
                        <Skeleton className="h-8 w-8 ml-auto" />
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
                        <TableCell>
                          <Badge variant={hasIssues ? 'destructive' : 'default'}>
                            {hasIssues ? 'Com Problemas' : 'OK'}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          {user?.role === 'admin' && vehicle && (
                              <Button 
                                variant="ghost" 
                                size="icon"
                                onClick={() => handleDownloadChecklist(checklist, vehicle)}
                              >
                                <Download className="h-4 w-4" />
                                <span className="sr-only">Baixar PDF</span>
                              </Button>
                          )}
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
