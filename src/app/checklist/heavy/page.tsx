import { ChecklistFormHeavy } from '@/components/checklist-form-heavy';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

export default function ChecklistHeavyPage() {
  return (
    <div className="max-w-4xl mx-auto">
      <Card>
        <CardHeader>
          <CardTitle className="text-2xl">Novo Checklist de Veículo Pesado</CardTitle>
          <CardDescription>
            Preencha todos os campos para registrar a vistoria do veículo.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ChecklistFormHeavy />
        </CardContent>
      </Card>
    </div>
  );
}
