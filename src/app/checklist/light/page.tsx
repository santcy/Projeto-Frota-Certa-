import { ChecklistForm } from '@/components/checklist-form';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';


export default function ChecklistLightPage() {
  return (
    <div className="mx-auto w-full max-w-4xl space-y-6">
       <Card>
        <CardHeader>
            <CardTitle className="text-2xl font-bold tracking-tight">Novo Checklist Frota Leve</CardTitle>
            <CardDescription className="text-muted-foreground">
            Preencha todos os campos para registrar a vistoria do veículo.
            </CardDescription>
        </CardHeader>
        <CardContent>
            <ChecklistForm />
        </CardContent>
       </Card>
    </div>
  );
}
