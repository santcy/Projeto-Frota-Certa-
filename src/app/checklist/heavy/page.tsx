import { ChecklistFormHeavy } from '@/components/checklist-form-heavy';

export default function ChecklistHeavyPage() {
  return (
    <div className="w-full space-y-6">
       <div>
        <h1 className="text-2xl font-bold tracking-tight">Novo Checklist de Veículo Pesado</h1>
        <p className="text-muted-foreground">
            Preencha todos os campos para registrar a vistoria do veículo.
        </p>
      </div>
      <ChecklistFormHeavy />
    </div>
  );
}
