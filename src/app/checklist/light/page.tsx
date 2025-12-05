import { ChecklistForm } from '@/components/checklist-form';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

export default function ChecklistLightPage() {
  return (
    <div className="max-w-4xl mx-auto">
      <Card>
        <CardHeader>
          <CardTitle className="text-2xl">Novo Checklist de Veículo Leve</CardTitle>
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
