import { VehicleForm } from '@/components/vehicle-form';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

export default function NewVehiclePage() {
  return (
    <div className="mx-auto w-full max-w-4xl">
      <Card>
        <CardHeader>
          <CardTitle className="text-2xl">Cadastrar Novo Veículo</CardTitle>
          <CardDescription>
            Preencha os dados abaixo para adicionar um novo veículo à frota.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <VehicleForm />
        </CardContent>
      </Card>
    </div>
  );
}
