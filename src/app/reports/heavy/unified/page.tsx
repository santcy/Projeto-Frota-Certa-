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
import { useCollection, useFirebase, useMemoFirebase, WithId } from '@/firebase';
import { collection, query, where } from 'firebase/firestore';
import type { Vehicle, Checklist } from '@/lib/types';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { Download } from 'lucide-react';
import { useAuth } from '@/context/auth-context';
import jsPDF from 'jspdf';
import 'jspdf-autotable';
import { CHECKLIST_ITEMS } from '@/lib/types';

interface jsPDFWithAutoTable extends jsPDF {
  autoTable: (options: any) => jsPDF;
}

const allChecklistItems = Object.values(CHECKLIST_ITEMS).flat();

type UnifiedReportData = {
  [vehicleId: string]: {
    vehicle: WithId<Vehicle>;
    checklistsWithIssues: {
      checklist: WithId<Checklist>;
      issues: { id: string; label: string }[];
    }[];
  };
};


export default function UnifiedReportHeavyPage() {
  const { firestore } = useFirebase();
  const { user } = useAuth();

  const checklistsQuery = useMemoFirebase(
    () =>
      firestore && user
        ? query(collection(firestore, 'checklists'), where('checklistType', '==', 'pesada'))
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

      const issues = Object.entries(checklist.items)
        .filter(([_, status]) => status === 'issue')
        .map(([itemId, _]) => {
          const itemDefinition = allChecklistItems.find(i => i.id === itemId);
          return {
            id: itemId,
            label: itemDefinition?.label || 'Item desconhecido',
          };
        });

      if (issues.length > 0) {
        if (!acc[vehicle.id]) {
          acc[vehicle.id] = {
            vehicle,
            checklistsWithIssues: [],
          };
        }
        acc[vehicle.id].checklistsWithIssues.push({
          checklist,
          issues,
        });
      }

      return acc;
    }, {} as UnifiedReportData);
  }, [checklists, vehicles]);
  
  const handleDownload = () => {
    const doc = new jsPDF() as jsPDFWithAutoTable;

    doc.setFontSize(18);
    doc.text('ROTA CERTA - Relatório Unificado de Problemas (Frota Pesada)', 14, 22);
    doc.setFontSize(11);
    doc.setTextColor(100);
    doc.text(`Relatório gerado em: ${new Date().toLocaleDateString('pt-BR')}`, 14, 30);
    
    let startY = 40;

    for (const vehicleId in reportData) {
        const data = reportData[vehicleId];
        const { vehicle, checklistsWithIssues } = data;

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

        startY = (doc as any).lastAutoTable.finalY;

        for (const { checklist, issues } of checklistsWithIssues) {
            const checklistInfo = [
              ['Data:', checklist.date.toDate().toLocaleDateString('pt-BR')],
              ['Motorista:', checklist.driverName],
              ['Odômetro:', `${checklist.odometer.toLocaleString('pt-BR')} km`],
            ];

            const issuesText = issues.map(issue => `- ${issue.label}`).join('\n');
            const tableBody = [
                ...checklistInfo,
                [{ content: 'Problemas Reportados:', styles: { fontStyle: 'bold' } }],
                [{ content: issuesText, colSpan: 2 }],
            ];
            
            if (startY > 260) {
                doc.addPage();
                startY = 20;
            }

            doc.autoTable({
                startY: startY,
                body: tableBody,
                theme: 'grid',
                columnStyles: { 0: { fontStyle: 'bold' } }
            });
            startY = (doc as any).lastAutoTable.finalY + 5;
        }
        startY += 10;
    }


    doc.save(`relatorio-unificado-pesado-${new Date().toISOString().split('T')[0]}.pdf`);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
            <h1 className="text-2xl font-bold tracking-tight">
            Relatório Unificado de Problemas (Frota Pesada)
            </h1>
            <p className="text-muted-foreground">
            Visualize um resumo de todos os problemas reportados para a frota pesada.
            </p>
        </div>
        {!isLoading && Object.keys(reportData).length > 0 && (
            <Button onClick={handleDownload} className='w-full sm:w-auto'>
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
                Nenhum problema reportado nos checklists da frota pesada.
            </CardContent>
        </Card>
      ) : (
        <div className="space-y-6">
          {Object.values(reportData).map(({ vehicle, checklistsWithIssues }) => {
            return (
              <Card key={vehicle.id}>
                <CardHeader>
                  <CardTitle>
                    {vehicle.plate} - {vehicle.model}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Data</TableHead>
                          <TableHead>Motorista</TableHead>
                          <TableHead>Problemas Reportados</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {checklistsWithIssues.map(({ checklist, issues }) => (
                          <TableRow key={checklist.id}>
                            <TableCell>{checklist.date.toDate().toLocaleDateString('pt-BR')}</TableCell>
                            <TableCell>{checklist.driverName}</TableCell>
                            <TableCell>
                              <ul className="list-disc pl-5 space-y-1">
                                  {issues.map(issue => (
                                      <li key={issue.id}>{issue.label}</li>
                                  ))}
                              </ul>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
