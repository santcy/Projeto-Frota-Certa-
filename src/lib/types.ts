import type { Timestamp } from 'firebase/firestore';

export type VehicleStatus = 'Operacional' | 'Manutenção' | 'Com Problemas';

export interface Vehicle {
  id: string;
  plate: string;
  model: string;
  make: string;
  status: VehicleStatus;
  fuelLevel: number;
  odometer: number;
  image?: string;
  lastCheck?: Timestamp;
}

export type ChecklistItemStatus = 'ok' | 'issue' | 'na';

export interface ChecklistItem {
  id: string;
  label: string;
  status: ChecklistItemStatus;
}

export interface Checklist {
  id: string;
  vehicleId: string;
  userId: string;
  driverName: string; // Denormalized for display
  type: 'Saída' | 'Retorno';
  date: Timestamp;
  odometer: number;
  fuelLevel: number;
  items: Record<string, ChecklistItemStatus>;
  notes?: string;
  dashboardPhotoUrl: string;
  frontPhotoUrl: string;
  backPhotoUrl: string;
  leftSidePhotoUrl: string;
  rightSidePhotoUrl: string;
}

export const CHECKLIST_ITEMS_SECTIONS = {
  iluminacao: 'Iluminação',
  sinais: 'Sinais e Climatização',
  espelhos: 'Espelhos e Vidros',
  fluidos: 'Níveis de Fluídos',
  interior: 'Interior do Veículo',
  seguranca: 'Equipamentos de Segurança',
  diversos: 'Itens Diversos',
  limpeza: 'Limpeza',
};

export const CHECKLIST_ITEMS: Record<keyof typeof CHECKLIST_ITEMS_SECTIONS, { id: string, label: string }[]> = {
  iluminacao: [
    { id: 'farol_esquerdo', label: 'Farol Esquerdo' },
    { id: 'farol_direito', label: 'Farol Direito' },
    { id: 'pisca_esquerdo', label: 'Pisca Esquerdo' },
    { id: 'pisca_direito', label: 'Pisca Direito' },
    { id: 'lanterna_esquerda', label: 'Lanterna Esquerda' },
    { id: 'lanterna_direita', label: 'Lanterna Direita' },
    { id: 'luz_de_freio', label: 'Luz de Freio' },
    { id: 'luz_de_placa', label: 'Luz de Placa' },
  ],
  sinais: [
    { id: 'buzina', label: 'Buzina' },
    { id: 'ar_condicionado', label: 'Ar Condicionado' },
  ],
  espelhos: [
    { id: 'retrovisor_interno', label: 'Retrovisor Interno' },
    { id: 'retrovisor_esquerdo', label: 'Retrovisor Esquerdo' },
    { id: 'retrovisor_direito', label: 'Retrovisor Direito' },
    { id: 'limpador_parabrisa', label: 'Limpador Para-brisa' },
    { id: 'vidros_laterais', label: 'Vidros Laterais' },
    { id: 'parabrisa_dianteiro', label: 'Para-brisa Dianteiro' },
    { id: 'vidros_eletricos', label: 'Vidros Elétricos' },
  ],
  fluidos: [
    { id: 'nivel_oleo_motor', label: 'Nível de Óleo do Motor' },
    { id: 'nivel_oleo_hidraulico', label: 'Nível de Óleo Hidráulico' },
    { id: 'nivel_agua_parabrisa', label: 'Nível Água Parabrisa' },
    { id: 'nivel_fluido_freio', label: 'Nível Fluido de Freio' },
    { id: 'nivel_liquido_arrefecimento', label: 'Nível Líquido de Arrefecimento' },
  ],
  interior: [
    { id: 'radio', label: 'Rádio' },
    { id: 'estofamento_bancos', label: 'Estofamento dos Bancos' },
    { id: 'tapetes_internos', label: 'Tapetes Internos' },
    { id: 'forro_interno', label: 'Forro Interno' },
    { id: 'cintos_seguranca', label: 'Cintos de Segurança' },
  ],
  seguranca: [
    { id: 'macaco', label: 'Macaco' },
    { id: 'chave_de_roda', label: 'Chave de Roda' },
    { id: 'estepe', label: 'Estepe' },
    { id: 'triangulo', label: 'Triângulo' },
    { id: 'extintor', label: 'Extintor' },
  ],
  diversos: [
    { id: 'bateria', label: 'Bateria' },
    { id: 'indicadores_painel', label: 'Indicadores do Painel' },
    { id: 'documento_veicular', label: 'Documento Veicular' },
    { id: 'manual_do_carro', label: 'Manual do Carro' },
    { id: 'maquina_cartao', label: 'Máquina de Cartão' },
    { id: 'cartao_abastecimento', label: 'Cartão de Abastecimento' },
    { id: 'carrinho_carga', label: 'Carrinho de Carga' },
    { id: 'chave_ignicao', label: 'Chave de Ignição' },
  ],
  limpeza: [
    { id: 'limpeza_interior', label: 'Limpeza Interior' },
    { id: 'limpeza_exterior', label: 'Limpeza Exterior' },
  ]
};
