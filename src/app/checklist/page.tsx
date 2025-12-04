import { ChecklistForm } from '@/components/checklist-form';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

export default function ChecklistPage() {
  return (
    <div className="max-w-4xl mx-auto">
      <Card>
        <CardHeader>
          <CardTitle className="text-2xl">Novo Checklist de Veículo</CardTitle>
          <CardDescription>
            Preencha todos os campos para registrar a saída ou retorno do veículo.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ChecklistForm />
        </CardContent>
      </Card>
    </div>
  );
}
