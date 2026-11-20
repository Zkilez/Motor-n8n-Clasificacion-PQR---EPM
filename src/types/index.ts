/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * EPM · Clasificación Inteligente de PQR - Definiciones de Tipos
 */

export type TipoSolicitud = 'Peticion' | 'Queja' | 'Reclamo';

export type ServicioPublico = 'Energia' | 'Agua' | 'Gas';

export type Tipologia = 'Facturación' | 'Calidad / falla del servicio' | 'Otro tipo';

export type Prioridad = 'Alta' | 'Media' | 'Baja';

export type RutaEnrutamiento = 'Servicio Crítico' | 'Queja o Reclamo' | 'Baja prioridad';

export type AreaResponsable = 
  | 'Área de facturación' 
  | 'Área operativa / Campo' 
  | 'Atención al cliente';

export type EstadoPQR = 'Radicada' | 'En gestión' | 'Resuelta' | 'Escalada';

export interface DatosUsuario {
  nombre: string;
  documento: string;
  contrato: string; // Número de contrato o cuenta de servicios públicos
  correo: string;
  telefono: string;
}

export interface CondicionesSolicitud {
  servicioSuspendido: boolean;       // ¿Tiene el servicio suspendido actualmente?
  afectaVariosUsuarios: boolean;     // ¿Afecta a varios usuarios / sector vecinal?
  poblacionVulnerable: boolean;      // ¿Adulto mayor, persona con discapacidad, dependiente médico?
  servicioEsencial: boolean;         // ¿Hospital, centro médico, colegio, estación de bomberos?
  diasHabilesConsumidos?: number;    // Días hábiles transcurridos (para cálculo de término legal)
}

export interface DetalleSolicitud {
  tipo: TipoSolicitud;
  servicio: ServicioPublico;
  descripcion: string;
  condiciones: CondicionesSolicitud;
}

export interface CoincidenciaRegla {
  regla: string;
  palabra: string;
  peso: number;
}

export interface ResultadoClasificacionTipologia {
  tipologia: Tipologia;
  puntaje: number;
  palabras_detectadas: string[];
  coincidenciasDetalladas: CoincidenciaRegla[];
}

export interface ResultadoCalculoPrioridad {
  prioridad: Prioridad;
  motivo_regla: string[];
  urgencia: 'Alta' | 'Media' | 'Baja';
  impacto: 'Alto' | 'Medio' | 'Bajo';
  escaladoReincidencia: boolean;
  escaladoTerminoLegal: boolean;
  detallesAuditoria: {
    condicion: string;
    aplicada: boolean;
    efecto: string;
  }[];
}

export interface ResultadoEnrutamiento {
  ruta: RutaEnrutamiento;
  slaHoras: number;
  slaTexto: string;
  area: AreaResponsable;
  fechaLimiteLegal: string; // ISO string de los 15 días hábiles colombianos
  fechaLimiteSLA: string;   // ISO string según SLA interno
}

export interface EntradaRadicacion {
  usuario: DatosUsuario;
  solicitud: DetalleSolicitud;
}

export interface HistorialItem {
  fecha: string;
  estado: EstadoPQR;
  nota: string;
  asesor?: string;
}

export interface PQR {
  id: string; // Formato PQR-AAAAMMDD-####
  consecutivo: number;
  fechaCreacion: string; // ISO string
  usuario: DatosUsuario;
  solicitud: DetalleSolicitud;
  clasificacion: ResultadoClasificacionTipologia;
  calculoPrioridad: ResultadoCalculoPrioridad;
  enrutamiento: ResultadoEnrutamiento;
  estado: EstadoPQR;
  reincidenciasPrevias: number; // Número de PQR del mismo contrato en los últimos 6 meses
  historial: HistorialItem[];
  notaAsesor?: string;
  origenN8N?: boolean;
  webhookN8NUrl?: string;
  n8nStatus?: 'exitoso' | 'error' | 'respaldo_local';
  n8nDetalle?: string;
}

export interface FiltrosCola {
  area?: AreaResponsable | 'Todas';
  prioridad?: Prioridad | 'Todas';
  tipologia?: Tipologia | 'Todas';
  estado?: EstadoPQR | 'Todos';
  busqueda?: string;
}

export interface EstadisticasCola {
  total: number;
  alta: number;
  media: number;
  baja: number;
  porcentajeOtroTipo: number;
  enRiesgoSLA: number;
  vencidasSLA: number;
  promedioSlaRestanteHoras: number;
}

export interface ReglasConfiguracion {
  palabrasClaveFacturacion: string[];
  palabrasClaveCalidad: string[];
  umbralMinimoPuntaje: number;
  pesoPalabraClave: number;
  pesoCategoriaUsuario: number;
  terminoLegalDiasHabiles: number;
  festivosColombia2026: string[]; // Fechas 'YYYY-MM-DD'
  slaHoras: {
    alta: number;
    media: number;
    baja: number;
  };
  umbralReincidencia: number; // Por defecto > 2 PQR en 6 meses
  umbralDiasConsumidosEscalamiento: number; // 10 o más días de 15
}
