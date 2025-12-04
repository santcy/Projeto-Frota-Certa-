'use client';
import { useMemo } from 'react';
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
import { collection, query } from 'firebase/firestore';
import type { Vehicle, Checklist } from '@/lib/types';
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

type UnifiedReportData = {
  [vehicleId: string]: {
    vehicle: WithId<Vehicle>;
    issues: {
      [itemId: string]: {
        label: string;
        count: number;
      };
    };
  };
};

const allChecklistItems = Object.values(CHECKLIST_ITEMS).flat();

export default function UnifiedReportPage() {
  const { firestore } = useFirebase();
  const { user } = useAuth();

  const checklistsQuery = useMemoFirebase(
    () =>
      firestore && user
        ? query(collection(firestore, 'checklists'))
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

  const reportData: UnifiedReportData = useMemo(() => {
    if (!checklists || !vehicles) return {};

    return checklists.reduce((acc, checklist) => {
      const vehicle = vehicles.find(v => v.id === checklist.vehicleId);
      if (!vehicle) return acc;

      if (!acc[vehicle.id]) {
        acc[vehicle.id] = {
          vehicle,
          issues: {},
        };
      }

      for (const [itemId, status] of Object.entries(checklist.items)) {
        if (status === 'issue') {
          if (!acc[vehicle.id].issues[itemId]) {
            const itemDefinition = allChecklistItems.find(i => i.id === itemId);
            acc[vehicle.id].issues[itemId] = {
              label: itemDefinition?.label || 'Item desconhecido',
              count: 0,
            };
          }
          acc[vehicle.id].issues[itemId].count += 1;
        }
      }

      return acc;
    }, {} as UnifiedReportData);
  }, [checklists, vehicles]);
  
  const handleDownload = () => {
    const doc = new jsPDF() as jsPDFWithAutoTable;

    doc.setFontSize(18);
    doc.text('ROTA CERTA - Relatório Unificado de Problemas', 14, 22);
    doc.setFontSize(11);
    doc.setTextColor(100);
    doc.text(`Relatório gerado em: ${new Date().toLocaleDateString('pt-BR')}`, 14, 30);
    
    let startY = 40;

    for (const vehicleId in reportData) {
        const data = reportData[vehicleId];
        const { vehicle, issues } = data;
        const issueEntries = Object.entries(issues);

        if (issueEntries.length === 0) continue;

        if (startY > 250) { // Page break check
          doc.addPage();
          startY = 20;
        }

        doc.autoTable({
            startY: startY,
            head: [[`Veículo: ${vehicle.plate} - ${vehicle.model}`]],
            body: [],
            theme: 'striped',
            headStyles: { fillColor: [30, 58, 138] }, // Primary color
        });

        const tableBody = issueEntries.map(([_, issueData]) => [issueData.label, issueData.count]);
        
        doc.autoTable({
            startY: (doc as any).lastAutoTable.finalY,
            head: [['Item do Checklist', 'Nº de Ocorrências']],
            body: tableBody,
            theme: 'grid',
            headStyles: { fillColor: [79, 70, 229] }, // A slightly different color
        });

        startY = (doc as any).lastAutoTable.finalY + 15;
    }


    doc.save(`relatorio-unificado-${new Date().toISOString().split('T')[0]}.pdf`);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
            <h1 className="text-2xl font-bold tracking-tight">
            Relatório Unificado de Problemas
            </h1>
            <p className="text-muted-foreground">
            Visualize um resumo de todos os problemas reportados, agrupados por veículo.
            </p>
        </div>
        {user?.role === 'admin' && !isLoading && Object.keys(reportData).length > 0 && (
            <Button onClick={handleDownload}>
                <Download className="mr-2 h-4 w-4" />
                Baixar Relatório
            </Button>
        )}
      </div>

       {isLoading ? (
        <Card>
            <CardHeader>
                <Skeleton className="h-7 w-48" />
            </CardHeader>
            <CardContent>
                <div className="space-y-4">
                     <Skeleton className="h-10 w-full" />
                     <Skeleton className="h-8 w-full" />
                     <Skeleton className="h-8 w-full" />
                </div>
            </CardContent>
        </Card>
      ) : Object.keys(reportData).length === 0 ? (
        <Card>
            <CardContent className="py-10 text-center text-muted-foreground">
                Nenhum problema reportado nos checklists até o momento.
            </CardContent>
        </Card>
      ) : (
        <div className="space-y-6">
          {Object.values(reportData).map(({ vehicle, issues }) => {
            const issueEntries = Object.entries(issues);
            if (issueEntries.length === 0) return null;

            return (
              <Card key={vehicle.id}>
                <CardHeader>
                  <CardTitle>
                    {vehicle.plate} - {vehicle.model}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Item do Checklist</TableHead>
                        <TableHead className="text-right">Ocorrências</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {issueEntries.map(([itemId, issueData]) => (
                        <TableRow key={itemId}>
                          <TableCell className="font-medium">{issueData.label}</TableCell>
                          <TableCell className="text-right">
                            <Badge variant="destructive">{issueData.count}</Badge>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
