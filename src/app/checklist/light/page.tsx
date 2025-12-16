import { ChecklistForm } from '@/components/checklist-form';

export default function ChecklistLightPage() {
  return (
    <div className="w-full space-y-6">
       <div>
        <h1 className="text-2xl font-bold tracking-tight">Novo Checklist Frota Leve</h1>
        <p className="text-muted-foreground">
          Preencha todos os campos para registrar a vistoria do veículo.
        </p>
      </div>
      <ChecklistForm />
    </div>
  );
}
