import { ChecklistForm } from '@/components/checklist-form';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

export default function ChecklistLightPage() {
  return (
    <div className="w-full">
      <Card>
        <CardHeader>
          <CardTitle className="text-2xl">Novo Checklist Frota Leve</CardTitle>
          <CardDescription>
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
