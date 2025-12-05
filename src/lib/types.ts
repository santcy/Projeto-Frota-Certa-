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

export type LightVehicleChecklistItemStatus =
  | 'Em excelente estado'
  | 'Desgastado'
  | 'Incompleto'
  | 'Feito'
  | 'Pendente'
  | 'Avariado'
  | 'Manchado';

export interface Checklist {
  id: string;
  vehicleId: string;
  userId: string;
  driverName: string; // Denormalized for display
  type: 'Saída' | 'Retorno';
  date: Timestamp;
  odometer: number;
  items: Record<string, ChecklistItemStatus | LightVehicleChecklistItemStatus>;
  notes?: string;
  checklistType: 'pesada' | 'leve'; // To distinguish between checklist types

  // Heavy vehicle photos
  dashboardPhotoUrl?: string;
  dashboardPhotoUrl2?: string;
  
  // Light vehicle photos
  fuelLevelPhotoUrl?: string;
  kmPhotoUrl?: string;
  enginePhotoUrl?: string;
  trunkPhotoUrl?: string;

  // Common photos
  frontPhotoUrl?: string;
  backPhotoUrl?: string;
  leftSidePhotoUrl?: string;
  rightSidePhotoUrl?: string;
}


// Heavy Fleet Checklist (Original)
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

// New Light Fleet Checklist
export const CHECKLIST_ITEMS_SECTIONS_LEVE = {
  pneus: 'Pneus',
  interior: 'Interior do Veículo',
  exterior: 'Exterior do Veículo',
  capo: 'Verificação do Capô',
  porta_malas: 'Itens do Porta-malas',
};

const lightFleetStatuses: LightVehicleChecklistItemStatus[] = [
  'Em excelente estado',
  'Desgastado',
  'Incompleto',
  'Feito',
  'Pendente',
  'Avariado',
  'Manchado',
];

const tireStatuses: ('ok' | 'issue' | 'na')[] = ['ok', 'issue', 'na'];

export const CHECKLIST_ITEMS_LEVE: Record<
  keyof typeof CHECKLIST_ITEMS_SECTIONS_LEVE,
  { id: string; label: string; statuses: string[] }
> = {
  pneus: [
    { id: 'pneu_dianteiro_esquerdo', label: 'Pneu Dianteiro Esquerdo', statuses: tireStatuses },
    { id: 'pneu_dianteiro_direito', label: 'Pneu Dianteiro Direito', statuses: tireStatuses },
    { id: 'pneu_traseiro_esquerdo', label: 'Pneu Traseiro Esquerdo', statuses: tireStatuses },
    { id: 'pneu_traseiro_direito', label: 'Pneu Traseiro Direito', statuses: tireStatuses },
    { id: 'estepe_leve', label: 'Estepe', statuses: tireStatuses },
  ],
  interior: [
    { id: 'extintor_incendio', label: 'Extintor de Incêndio', statuses: lightFleetStatuses },
    { id: 'bancos_dianteiros', label: 'Bancos Dianteiros', statuses: lightFleetStatuses },
    { id: 'bancos_traseiros', label: 'Bancos Traseiros', statuses: lightFleetStatuses },
    { id: 'tapetes', label: 'Tapetes', statuses: lightFleetStatuses },
    { id: 'radio_cd_dvd', label: 'Rádio (CD/DVD)', statuses: lightFleetStatuses },
    { id: 'retirada_pertences', label: 'Retirada de Pertences Pessoais', statuses: lightFleetStatuses },
    { id: 'documentos_veiculo', label: 'Documentos do Veículo', statuses: lightFleetStatuses },
    { id: 'manual_proprietario', label: 'Manual do Proprietário', statuses: lightFleetStatuses },
    { id: 'manual_garantia', label: 'Manual de Garantia', statuses: lightFleetStatuses },
    { id: 'alarme', label: 'Alarme', statuses: lightFleetStatuses },
    { id: 'acendedor_cigarro', label: 'Acendedor de Cigarro', statuses: lightFleetStatuses },
    { id: 'teto_interno', label: 'Teto Interno', statuses: lightFleetStatuses },
    { id: 'retrovisor_interno_leve', label: 'Retrovisor Interno', statuses: lightFleetStatuses },
    { id: 'cinto_seguranca_leve', label: 'Cinto de Segurança', statuses: lightFleetStatuses },
    { id: 'antena', label: 'Antena (interna/externa)', statuses: lightFleetStatuses },
  ],
  exterior: [
    { id: 'calotas_dianteiras_esq', label: 'Calotas Dianteiras Esq.', statuses: lightFleetStatuses },
    { id: 'calotas_dianteiras_dir', label: 'Calotas Dianteiras Dir.', statuses: lightFleetStatuses },
    { id: 'calotas_traseiras_esq', label: 'Calotas Traseiras Esq.', statuses: lightFleetStatuses },
    { id: 'calotas_traseiras_dir', label: 'Calotas Traseiras Dir.', statuses: lightFleetStatuses },
    { id: 'palheta_traseira', label: 'Palheta Traseira', statuses: lightFleetStatuses },
    { id: 'parabrisa', label: 'Para-brisa', statuses: lightFleetStatuses },
    { id: 'farois_dianteiros_piscas', label: 'Faróis Dianteiros/Piscas', statuses: lightFleetStatuses },
    { id: 'lanternas_piscas_traseiros', label: 'Lanternas, Piscas Traseiros', statuses: lightFleetStatuses },
    { id: 'farois_neblina', label: 'Faróis de Neblina', statuses: lightFleetStatuses },
    { id: 'palhetas_dianteiras', label: 'Palhetas Dianteiras', statuses: lightFleetStatuses },
  ],
  capo: [
    { id: 'nivel_fluido_freio_leve', label: 'Nível de Fluido de Freio', statuses: lightFleetStatuses },
    { id: 'nivel_liquido_arrefecimento_leve', label: 'Nível de Líquido de Arrefecimento', statuses: lightFleetStatuses },
    { id: 'nivel_fluido_hidraulica', label: 'Nível de Fluido de Hidráulica', statuses: lightFleetStatuses },
    { id: 'bateria_controle_visual', label: 'Bateria (Controle Visual)', statuses: lightFleetStatuses },
  ],
  porta_malas: [
    { id: 'triangulo_leve', label: 'Triângulo', statuses: lightFleetStatuses },
    { id: 'chave_roda_leve', label: 'Chave de Roda', statuses: lightFleetStatuses },
    { id: 'macaco_leve', label: 'Macaco', statuses: lightFleetStatuses },
    { id: 'break_light', label: 'Break Light', statuses: lightFleetStatuses },
    { id: 'chaves_leve', label: 'Chaves', statuses: lightFleetStatuses },
  ],
};
