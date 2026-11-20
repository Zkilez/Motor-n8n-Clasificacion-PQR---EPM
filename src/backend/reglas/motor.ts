/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * EPM · Clasificación Inteligente de PQR - Motor de Reglas
 * Funciones puras en TypeScript sin dependencias de UI/React.
 */

import {
  AreaResponsable,
  CoincidenciaRegla,
  DetalleSolicitud,
  Prioridad,
  ResultadoCalculoPrioridad,
  ResultadoClasificacionTipologia,
  ResultadoEnrutamiento,
  RutaEnrutamiento,
  Tipologia,
} from '../../types';
import { obtenerConfiguracion } from './config';

/**
 * Normaliza un texto: minúsculas, elimina tildes/acentos y caracteres especiales
 */
export function normalizarTexto(texto: string): string {
  if (!texto) return '';
  return texto
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // Quita tildes
    .replace(/[^\w\s]/gi, ' ')       // Reemplaza signos por espacios
    .replace(/\s+/g, ' ')           // Compacta espacios
    .trim();
}

/**
 * Motor 1: Clasificación de Tipología
 * Analiza la descripción buscando palabras clave y combina con la categoría seleccionada por el usuario.
 */
export function clasificarTipologia(
  solicitud: DetalleSolicitud,
  config = obtenerConfiguracion()
): ResultadoClasificacionTipologia {
  const textoNormalizado = normalizarTexto(solicitud.descripcion);
  
  const coincidenciasFacturacion: CoincidenciaRegla[] = [];
  const coincidenciasCalidad: CoincidenciaRegla[] = [];
  const palabrasDetectadasSet = new Set<string>();

  // Evaluar palabras clave de facturación
  for (const rawKw of config.palabrasClaveFacturacion) {
    const kwNorm = normalizarTexto(rawKw);
    if (!kwNorm) continue;
    
    // Búsqueda de palabra o frase completa usando límites de palabra cuando aplica
    const regex = new RegExp(`(^|\\s)${kwNorm}(\\s|$)`, 'i');
    if (regex.test(textoNormalizado) || textoNormalizado.includes(kwNorm)) {
      if (!palabrasDetectadasSet.has(rawKw)) {
        palabrasDetectadasSet.add(rawKw);
        coincidenciasFacturacion.push({
          regla: 'Palabra clave de Facturación',
          palabra: rawKw,
          peso: config.pesoPalabraClave,
        });
      }
    }
  }

  // Evaluar palabras clave de calidad / falla
  for (const rawKw of config.palabrasClaveCalidad) {
    const kwNorm = normalizarTexto(rawKw);
    if (!kwNorm) continue;

    const regex = new RegExp(`(^|\\s)${kwNorm}(\\s|$)`, 'i');
    if (regex.test(textoNormalizado) || textoNormalizado.includes(kwNorm)) {
      if (!palabrasDetectadasSet.has(rawKw)) {
        palabrasDetectadasSet.add(rawKw);
        coincidenciasCalidad.push({
          regla: 'Palabra clave de Calidad / Falla del servicio',
          palabra: rawKw,
          peso: config.pesoPalabraClave,
        });
      }
    }
  }

  let puntajeFacturacion = coincidenciasFacturacion.reduce((acc, c) => acc + c.peso, 0);
  let puntajeCalidad = coincidenciasCalidad.reduce((acc, c) => acc + c.peso, 0);

  // Señal adicional: categoría seleccionada por el usuario
  if (solicitud.tipo === 'Reclamo' && puntajeFacturacion > 0) {
    puntajeFacturacion += config.pesoCategoriaUsuario;
  }
  if (solicitud.condiciones.servicioSuspendido && puntajeCalidad > 0) {
    puntajeCalidad += config.pesoCategoriaUsuario;
  }

  const umbral = config.umbralMinimoPuntaje;

  let tipologia: Tipologia = 'Otro tipo';
  let puntajeFinal = 0;
  let coincidenciasFinales: CoincidenciaRegla[] = [];

  if (puntajeCalidad >= umbral && puntajeCalidad >= puntajeFacturacion) {
    tipologia = 'Calidad / falla del servicio';
    puntajeFinal = puntajeCalidad;
    coincidenciasFinales = coincidenciasCalidad;
  } else if (puntajeFacturacion >= umbral && puntajeFacturacion > puntajeCalidad) {
    tipologia = 'Facturación';
    puntajeFinal = puntajeFacturacion;
    coincidenciasFinales = coincidenciasFacturacion;
  } else {
    tipologia = 'Otro tipo';
    puntajeFinal = Math.max(puntajeFacturacion, puntajeCalidad);
    coincidenciasFinales = [];
  }

  return {
    tipologia,
    puntaje: puntajeFinal,
    palabras_detectadas: Array.from(palabrasDetectadasSet),
    coincidenciasDetalladas: coincidenciasFinales,
  };
}

/**
 * Motor 2: Cálculo de Prioridad (Matriz Impacto × Urgencia)
 * Evalúa estado de corte, afectación masiva, vulnerabilidad, servicios esenciales y reincidencia/término legal.
 */
export function calcularPrioridad(
  solicitud: DetalleSolicitud,
  reincidenciasPrevias = 0,
  config = obtenerConfiguracion()
): ResultadoCalculoPrioridad {
  const motivos: string[] = [];
  const auditoria: { condicion: string; aplicada: boolean; efecto: string }[] = [];

  const { servicioSuspendido, afectaVariosUsuarios, poblacionVulnerable, servicioEsencial, diasHabilesConsumidos } =
    solicitud.condiciones;

  let prioridadBase: Prioridad = 'Baja';
  let urgencia: 'Alta' | 'Media' | 'Baja' = 'Baja';
  let impacto: 'Alto' | 'Medio' | 'Bajo' = 'Bajo';

  // 1. Evaluación de condiciones críticas directas (ALTA)
  const esCritica =
    servicioSuspendido || afectaVariosUsuarios || poblacionVulnerable || servicioEsencial;

  if (servicioSuspendido) {
    motivos.push('Servicio suspendido actualmente: interrupción activa requiere atención inmediata');
    auditoria.push({
      condicion: 'Servicio suspendido',
      aplicada: true,
      efecto: 'Asigna prioridad ALTA directa (Urgencia Alta)',
    });
  }

  if (afectaVariosUsuarios) {
    motivos.push('Afectación colectiva: impacta a múltiples usuarios del sector o comunidad');
    auditoria.push({
      condicion: 'Afecta a varios usuarios',
      aplicada: true,
      efecto: 'Asigna prioridad ALTA directa (Impacto Alto)',
    });
  }

  if (poblacionVulnerable) {
    motivos.push('Población de protección especial: adulto mayor, discapacidad o dependencia de equipo médico');
    auditoria.push({
      condicion: 'Población vulnerable en el predio',
      aplicada: true,
      efecto: 'Asigna prioridad ALTA directa por salvaguarda de derechos fundamentales',
    });
  }

  if (servicioEsencial) {
    motivos.push('Predio de servicio esencial: institución educativa, hospital, puesto de salud o bomberos');
    auditoria.push({
      condicion: 'Servicio esencial en predio',
      aplicada: true,
      efecto: 'Asigna prioridad ALTA directa por interés público y sanitario',
    });
  }

  if (esCritica) {
    prioridadBase = 'Alta';
    urgencia = 'Alta';
    impacto = 'Alto';
  } else if (solicitud.tipo === 'Queja' || solicitud.tipo === 'Reclamo') {
    prioridadBase = 'Media';
    urgencia = 'Media';
    impacto = 'Medio';
    motivos.push(`Tipo de trámite (${solicitud.tipo}): catalogado como afectación media sin riesgo vital ni interrupción activa`);
    auditoria.push({
      condicion: `Trámite ${solicitud.tipo}`,
      aplicada: true,
      efecto: 'Asigna prioridad base MEDIA',
    });
  } else {
    prioridadBase = 'Baja';
    urgencia = 'Baja';
    impacto = 'Bajo';
    motivos.push('Petición o consulta informativa: trámite ordinario sin riesgo operativo');
    auditoria.push({
      condicion: 'Petición / Consulta',
      aplicada: true,
      efecto: 'Asigna prioridad base BAJA',
    });
  }

  // 2. Reglas de escalamiento / ascenso de nivel (Sube un nivel si reincidente o término legal >= 10 días)
  const esReincidente = reincidenciasPrevias > config.umbralReincidencia;
  const terminoCritico = (diasHabilesConsumidos || 0) >= config.umbralDiasConsumidosEscalamiento;

  let prioridadCalculada: Prioridad = prioridadBase;
  let escaloReincidencia = false;
  let escaloTermino = false;

  const subirNivel = (p: Prioridad): Prioridad => {
    if (p === 'Baja') return 'Media';
    if (p === 'Media') return 'Alta';
    return 'Alta';
  };

  if (esReincidente) {
    escaloReincidencia = true;
    const prioridadAnterior = prioridadCalculada;
    prioridadCalculada = subirNivel(prioridadCalculada);
    motivos.push(`Cliente reincidente: registra ${reincidenciasPrevias} PQR en los últimos 6 meses (umbral > ${config.umbralReincidencia}). Escala prioridad de ${prioridadAnterior} a ${prioridadCalculada}`);
    auditoria.push({
      condicion: `Reincidencia (${reincidenciasPrevias} PQR en 6 meses)`,
      aplicada: true,
      efecto: `Sube 1 nivel de prioridad (${prioridadAnterior} -> ${prioridadCalculada})`,
    });
  }

  if (terminoCritico) {
    escaloTermino = true;
    const prioridadAnterior = prioridadCalculada;
    prioridadCalculada = subirNivel(prioridadCalculada);
    motivos.push(`Término legal crítico: ha consumido ${diasHabilesConsumidos} de 15 días hábiles legales (umbral >= ${config.umbralDiasConsumidosEscalamiento}). Escala a ${prioridadCalculada} para evitar silencio administrativo`);
    auditoria.push({
      condicion: `Término legal (${diasHabilesConsumidos}/15 días hábiles)`,
      aplicada: true,
      efecto: `Sube 1 nivel de prioridad (${prioridadAnterior} -> ${prioridadCalculada})`,
    });
  }

  return {
    prioridad: prioridadCalculada,
    motivo_regla: motivos,
    urgencia,
    impacto,
    escaladoReincidencia: escaloReincidencia,
    escaladoTerminoLegal: escaloTermino,
    detallesAuditoria: auditoria,
  };
}

/**
 * Calcula si una fecha determinada es día hábil en Colombia (excluye sábados, domingos y festivos oficiales 2026)
 */
export function esDiaHabilColombia(fecha: Date, festivos: string[]): boolean {
  const diaSemana = fecha.getDay(); // 0 = Domingo, 6 = Sábado
  if (diaSemana === 0 || diaSemana === 6) {
    return false;
  }
  const isoFecha = fecha.toISOString().split('T')[0];
  return !festivos.includes(isoFecha);
}

/**
 * Calcula la fecha límite legal sumando N días hábiles colombianos a partir de una fecha de radicación
 */
export function calcularFechaLimiteLegal(
  fechaInicio: Date,
  diasHabiles: number,
  festivos: string[]
): Date {
  const fecha = new Date(fechaInicio.getTime());
  let diasAgregados = 0;

  while (diasAgregados < diasHabiles) {
    fecha.setDate(fecha.getDate() + 1);
    if (esDiaHabilColombia(fecha, festivos)) {
      diasAgregados++;
    }
  }

  // Establecer hora final laboral legal (ej. 17:00:00)
  fecha.setHours(17, 0, 0, 0);
  return fecha;
}

/**
 * Motor 3: Enrutamiento
 * Asigna ruta, SLA interno y área responsable según la tipología y prioridad.
 */
export function enrutar(
  tipologia: Tipologia,
  prioridad: Prioridad,
  fechaRadicacion: Date = new Date(),
  config = obtenerConfiguracion()
): ResultadoEnrutamiento {
  let ruta: RutaEnrutamiento;
  let slaHoras: number;
  let slaTexto: string;

  switch (prioridad) {
    case 'Alta':
      ruta = 'Servicio Crítico';
      slaHoras = config.slaHoras.alta; // 4h
      slaTexto = `${slaHoras} horas`;
      break;
    case 'Media':
      ruta = 'Queja o Reclamo';
      slaHoras = config.slaHoras.media; // 48h
      slaTexto = `${slaHoras} horas`;
      break;
    case 'Baja':
    default:
      ruta = 'Baja prioridad';
      slaHoras = config.slaHoras.baja; // 120h (5 días hábiles)
      slaTexto = '5 días hábiles';
      break;
  }

  let area: AreaResponsable;
  switch (tipologia) {
    case 'Facturación':
      area = 'Área de facturación';
      break;
    case 'Calidad / falla del servicio':
      area = 'Área operativa / Campo';
      break;
    case 'Otro tipo':
    default:
      area = 'Atención al cliente';
      break;
  }

  // Cálculo de fecha límite SLA interno
  const fechaLimiteSLA = new Date(fechaRadicacion.getTime() + slaHoras * 3600 * 1000);

  // Cálculo de fecha límite legal (15 días hábiles colombianos 2026)
  const fechaLimiteLegal = calcularFechaLimiteLegal(
    fechaRadicacion,
    config.terminoLegalDiasHabiles,
    config.festivosColombia2026
  );

  return {
    ruta,
    slaHoras,
    slaTexto,
    area,
    fechaLimiteLegal: fechaLimiteLegal.toISOString(),
    fechaLimiteSLA: fechaLimiteSLA.toISOString(),
  };
}

/**
 * Generador de número de radicado con formato institucional:
 * PQR-AAAAMMDD-####
 */
export function generarNumeroRadicado(consecutivo: number, fecha: Date = new Date()): string {
  const anio = fecha.getFullYear();
  const mes = String(fecha.getMonth() + 1).padStart(2, '0');
  const dia = String(fecha.getDate()).padStart(2, '0');
  const numeroPadded = String(consecutivo).padStart(4, '0');
  return `PQR-${anio}${mes}${dia}-${numeroPadded}`;
}
