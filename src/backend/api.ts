/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * EPM · Clasificación Inteligente de PQR - Capa de Servicio API
 * Funciones puras en TypeScript sin dependencias de React/UI.
 * Diseñada para ser portable directamente a un servidor Node.js/Express.
 */

import {
  AreaResponsable,
  EntradaRadicacion,
  EstadoPQR,
  EstadisticasCola,
  FiltrosCola,
  PQR,
  Prioridad,
  ResultadoCalculoPrioridad,
  ResultadoClasificacionTipologia,
  ResultadoEnrutamiento,
  Tipologia,
} from '../types';
import {
  calcularPrioridad,
  clasificarTipologia,
  enrutar,
  generarNumeroRadicado,
} from './reglas/motor';
import {
  actualizarPQR,
  contarPQRContratoUltimos6Meses,
  guardarPQR,
  obtenerPQRPorId as repoObtenerPorId,
  obtenerSiguienteConsecutivo,
  obtenerTodasPQR,
  reiniciarDatosDemo as repoReiniciarDemo,
} from './repositorio';

/**
 * Radica una nueva PQR en el sistema:
 * 1. Calcula reincidencias previas del contrato
 * 2. Clasifica la tipología por reglas
 * 3. Calcula la prioridad (impacto × urgencia + reincidencia + término)
 * 4. Enruta según prioridad y tipología (área, SLA y fecha límite)
 * 5. Genera radicado oficial PQR-AAAAMMDD-####
 * 6. Persiste en el repositorio
 */
export const DEFAULT_N8N_WEBHOOK_URL = 'https://juan-2.app.n8n.cloud/webhook/epm-pqr';
export const TEST_N8N_WEBHOOK_URL = 'https://juan-2.app.n8n.cloud/webhook-test/epm-pqr';

/**
 * Obtiene la URL de webhook n8n configurada (por defecto la de producción en n8n cloud)
 */
export function obtenerWebhookN8NUrl(): string {
  if (typeof window !== 'undefined' && window.localStorage) {
    const guardada = localStorage.getItem('epm_n8n_webhook_url');
    if (guardada) {
      // Migrar automáticamente si tenía guardada la instancia anterior
      if (guardada.includes('zkilez.app.n8n.cloud')) {
        const migrada = guardada.replace('zkilez.app.n8n.cloud', 'juan-2.app.n8n.cloud');
        localStorage.setItem('epm_n8n_webhook_url', migrada);
        return migrada;
      }
      return guardada;
    }
  }
  return DEFAULT_N8N_WEBHOOK_URL;
}

/**
 * Guarda una nueva URL de webhook n8n
 */
export function guardarWebhookN8NUrl(url: string): void {
  if (typeof window !== 'undefined' && window.localStorage) {
    localStorage.setItem('epm_n8n_webhook_url', url.trim());
  }
}

/**
 * Realiza un ping de diagnóstico al Webhook de n8n para verificar si está activo y listo
 */
export async function verificarEstadoWebhookN8N(
  url = obtenerWebhookN8NUrl()
): Promise<{ ok: boolean; status: number; mensaje: string; hint?: string }> {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 6000);

    const res = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ ping: true, check: 'epm_test' }),
      signal: controller.signal,
    });
    clearTimeout(timeoutId);

    if (res.ok) {
      return {
        ok: true,
        status: res.status,
        mensaje: '¡Conexión exitosa! El webhook en n8n está ACTIVO y recibiendo peticiones correctamente.',
      };
    }

    let detalle = `Código ${res.status} (${res.statusText})`;
    let hint = '';
    try {
      const json = await res.json();
      if (json.message) detalle = json.message;
      if (json.hint) hint = json.hint;
    } catch {}

    if (res.status === 404) {
      if (url.includes('webhook-test')) {
        hint = hint || 'Para el modo de prueba, debes hacer clic primero en el botón "Listen for test event" (o "Execute workflow") dentro de n8n antes de enviar la petición.';
      } else {
        hint = hint || 'El workflow en n8n está INACTIVO o no guardado. Ve a tu editor de n8n, activa el interruptor "Active" en la esquina superior derecha y presiona Ctrl + S para guardar.';
      }
    }

    return {
      ok: false,
      status: res.status,
      mensaje: detalle,
      hint,
    };
  } catch (error: any) {
    const esAbort = error.name === 'AbortError';
    return {
      ok: false,
      status: 0,
      mensaje: esAbort
        ? 'Tiempo de espera agotado al conectar con n8n cloud (>6s).'
        : `No se pudo conectar con n8n: ${error.message || 'Error de red o workflow inactivo'}.`,
      hint: 'Asegúrate de que n8n esté accesible y que el workflow esté activo (o en modo prueba con "Listen for test event").',
    };
  }
}

/**
 * Radica una nueva PQR en el sistema ejecutando el webhook en n8n Cloud:
 * 1. Calcula reincidencias previas del contrato
 * 2. Realiza POST al webhook https://juan-2.app.n8n.cloud/webhook/epm-pqr
 * 3. Procesa la respuesta de n8n o utiliza el motor de reglas de respaldo
 * 4. Genera trazabilidad completa del webhook
 * 5. Persiste en el repositorio
 */
export async function radicarPQR(
  entrada: EntradaRadicacion,
  webhookUrl = obtenerWebhookN8NUrl()
): Promise<PQR> {
  const fechaActual = new Date();
  
  // 1. Validar historial de reincidencias del cliente en los últimos 6 meses
  const reincidenciasPrevias = contarPQRContratoUltimos6Meses(entrada.usuario.contrato);

  // 2. Pre-calcular con motor local para tener valores consistentes de respaldo
  const clasificacionLocal = clasificarTipologia(entrada.solicitud);
  const prioridadLocal = calcularPrioridad(entrada.solicitud, reincidenciasPrevias);
  const enrutamientoLocal = enrutar(
    clasificacionLocal.tipologia,
    prioridadLocal.prioridad,
    fechaActual
  );
  const consecutivo = obtenerSiguienteConsecutivo();
  const radicadoIdLocal = generarNumeroRadicado(consecutivo, fechaActual);

  // 3. Preparar payload para n8n
  const payloadN8N = {
    usuario: entrada.usuario,
    tipo: entrada.solicitud.tipo,
    servicio: entrada.solicitud.servicio,
    descripcion: entrada.solicitud.descripcion,
    condiciones: entrada.solicitud.condiciones,
    reincidenciasPrevias,
  };

  let respuestaN8N: any = null;
  let origenN8N = false;
  let n8nStatus: 'exitoso' | 'error' | 'respaldo_local' = 'respaldo_local';
  let n8nDetalle = '';

  // 4. Ejecución en n8n Cloud
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 9000); // 9 segundos de timeout

    const res = await fetch(webhookUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payloadN8N),
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (res.ok) {
      origenN8N = true;
      n8nStatus = 'exitoso';
      n8nDetalle = `Respuesta exitosa de n8n (${res.status} ${res.statusText})`;
      try {
        const json = await res.json();
        // Si n8n responde un array o un wrapper { json: ... }
        if (Array.isArray(json) && json.length > 0) {
          respuestaN8N = json[0]?.json || json[0];
        } else if (json && json.json) {
          respuestaN8N = json.json;
        } else {
          respuestaN8N = json;
        }
      } catch {
        // Respuesta no JSON pero 200 OK (ej. texto plano o mensaje simple)
      }
    } else {
      origenN8N = true;
      n8nStatus = 'respaldo_local';
      let errorMsg = `Código ${res.status} (${res.statusText})`;
      let hintMsg = '';
      try {
        const errJson = await res.json();
        if (errJson.message) errorMsg = errJson.message;
        if (errJson.hint) hintMsg = errJson.hint;
      } catch {
        // Ignorar fallo de parseo
      }
      n8nDetalle = `n8n respondió: ${errorMsg}${hintMsg ? ` — Sugerencia: ${hintMsg}` : ''}. Se activó respaldo del motor local.`;
    }
  } catch (error: any) {
    origenN8N = true;
    n8nStatus = 'respaldo_local';
    const esAbort = error.name === 'AbortError';
    n8nDetalle = esAbort
      ? 'Timeout al conectar con n8n cloud (>9s). Se activó respaldo del motor local.'
      : `No se pudo conectar con el webhook de n8n (${error.message || 'Workflow posiblemente inactivo o error de red'}). Se activó respaldo del motor local.`;
  }

  // 5. Construir objeto final usando respuesta de n8n si está estructurada, o valores locales
  const radicadoFinal = respuestaN8N?.radicado || radicadoIdLocal;
  const tipologiaFinal = respuestaN8N?.clasificacion?.tipologia || clasificacionLocal.tipologia;
  const puntajeFinal = typeof respuestaN8N?.clasificacion?.puntaje === 'number'
    ? respuestaN8N.clasificacion.puntaje
    : clasificacionLocal.puntaje;
  const palabrasDetectadasFinal = respuestaN8N?.clasificacion?.palabras_detectadas || clasificacionLocal.palabras_detectadas;

  const prioridadFinal = respuestaN8N?.prioridad || prioridadLocal.prioridad;
  const motivosFinal = Array.isArray(respuestaN8N?.motivo_regla) && respuestaN8N.motivo_regla.length > 0
    ? respuestaN8N.motivo_regla
    : prioridadLocal.motivo_regla;

  const rutaFinal = respuestaN8N?.enrutamiento?.ruta || enrutamientoLocal.ruta;
  const areaFinal = respuestaN8N?.enrutamiento?.area || enrutamientoLocal.area;
  const slaHorasFinal = respuestaN8N?.enrutamiento?.slaHoras || enrutamientoLocal.slaHoras;
  const slaTextoFinal = respuestaN8N?.enrutamiento?.slaTexto || enrutamientoLocal.slaTexto;
  const fechaLimiteLegalFinal = respuestaN8N?.enrutamiento?.fechaLimiteLegal || enrutamientoLocal.fechaLimiteLegal;
  const fechaLimiteSLAFinal = respuestaN8N?.enrutamiento?.fechaLimiteSLA || enrutamientoLocal.fechaLimiteSLA;

  const nuevaPQR: PQR = {
    id: radicadoFinal,
    consecutivo,
    fechaCreacion: respuestaN8N?.fechaRadicacion || fechaActual.toISOString(),
    usuario: entrada.usuario,
    solicitud: entrada.solicitud,
    clasificacion: {
      tipologia: tipologiaFinal,
      puntaje: puntajeFinal,
      palabras_detectadas: palabrasDetectadasFinal,
      coincidenciasDetalladas: clasificacionLocal.coincidenciasDetalladas,
    },
    calculoPrioridad: {
      ...prioridadLocal,
      prioridad: prioridadFinal,
      motivo_regla: motivosFinal,
    },
    enrutamiento: {
      ruta: rutaFinal,
      area: areaFinal,
      slaHoras: slaHorasFinal,
      slaTexto: slaTextoFinal,
      fechaLimiteLegal: fechaLimiteLegalFinal,
      fechaLimiteSLA: fechaLimiteSLAFinal,
    },
    estado: 'Radicada',
    reincidenciasPrevias,
    origenN8N: true,
    webhookN8NUrl: webhookUrl,
    n8nStatus,
    n8nDetalle,
    historial: [
      {
        fecha: fechaActual.toISOString(),
        estado: 'Radicada',
        nota: n8nStatus === 'exitoso'
          ? `Ejecutada y radicada exitosamente mediante webhook n8n Cloud (${webhookUrl}). Tipología: ${tipologiaFinal}, Prioridad: ${prioridadFinal}.`
          : `Solicitud enviada a webhook n8n (${webhookUrl}). ${n8nDetalle}`,
      },
    ],
  };

  // 6. Guardar en repositorio
  guardarPQR(nuevaPQR);
  return nuevaPQR;
}

/**
 * Simula el proceso de clasificación sin persistir la PQR (útil para vistas previas)
 */
export function simularClasificacion(
  solicitud: EntradaRadicacion['solicitud'],
  reincidencias = 0
): {
  clasificacion: ResultadoClasificacionTipologia;
  calculoPrioridad: ResultadoCalculoPrioridad;
  enrutamiento: ResultadoEnrutamiento;
} {
  const fechaActual = new Date();
  const clasificacion = clasificarTipologia(solicitud);
  const prioridad = calcularPrioridad(solicitud, reincidencias);
  const enrutamiento = enrutar(clasificacion.tipologia, prioridad.prioridad, fechaActual);

  return {
    clasificacion,
    calculoPrioridad: prioridad,
    enrutamiento,
  };
}

/**
 * Obtiene la cola de solicitudes con filtros opcionales y ordenamiento por prioridad y antigüedad
 */
export function obtenerCola(
  area?: AreaResponsable | 'Todas',
  prioridad?: Prioridad | 'Todas',
  tipologia?: Tipologia | 'Todas',
  busqueda?: string,
  estado?: EstadoPQR | 'Todos'
): PQR[] {
  let pqrList = obtenerTodasPQR();

  // Filtro por Área
  if (area && area !== 'Todas') {
    pqrList = pqrList.filter((p) => p.enrutamiento.area === area);
  }

  // Filtro por Prioridad
  if (prioridad && prioridad !== 'Todas') {
    pqrList = pqrList.filter((p) => p.calculoPrioridad.prioridad === prioridad);
  }

  // Filtro por Tipología
  if (tipologia && tipologia !== 'Todas') {
    pqrList = pqrList.filter((p) => p.clasificacion.tipologia === tipologia);
  }

  // Filtro por Estado
  if (estado && estado !== 'Todos') {
    pqrList = pqrList.filter((p) => p.estado === estado);
  }

  // Búsqueda de texto (radicado, cliente, documento, contrato, descripción)
  if (busqueda && busqueda.trim()) {
    const q = busqueda.toLowerCase().trim();
    pqrList = pqrList.filter((p) =>
      p.id.toLowerCase().includes(q) ||
      p.usuario.nombre.toLowerCase().includes(q) ||
      p.usuario.documento.includes(q) ||
      p.usuario.contrato.includes(q) ||
      p.solicitud.descripcion.toLowerCase().includes(q)
    );
  }

  // Ordenamiento por defecto:
  // 1° Prioridad: Alta > Media > Baja
  // 2° Antigüedad: Más antiguas primero (mayor tiempo de espera)
  const pesoPrioridad: Record<Prioridad, number> = {
    Alta: 3,
    Media: 2,
    Baja: 1,
  };

  pqrList.sort((a, b) => {
    const pesoDiff = pesoPrioridad[b.calculoPrioridad.prioridad] - pesoPrioridad[a.calculoPrioridad.prioridad];
    if (pesoDiff !== 0) return pesoDiff;
    // Si tienen la misma prioridad, la más antigua tiene prelación
    return new Date(a.fechaCreacion).getTime() - new Date(b.fechaCreacion).getTime();
  });

  return pqrList;
}

/**
 * Obtiene las métricas operativas de la bandeja de entrada
 */
export function obtenerEstadisticas(): EstadisticasCola {
  const lista = obtenerTodasPQR();
  const total = lista.length;

  if (total === 0) {
    return {
      total: 0,
      alta: 0,
      media: 0,
      baja: 0,
      porcentajeOtroTipo: 0,
      enRiesgoSLA: 0,
      vencidasSLA: 0,
      promedioSlaRestanteHoras: 0,
    };
  }

  let alta = 0;
  let media = 0;
  let baja = 0;
  let otroTipo = 0;
  let vencidasSLA = 0;
  let enRiesgoSLA = 0;

  const ahora = Date.now();

  for (const p of lista) {
    if (p.calculoPrioridad.prioridad === 'Alta') alta++;
    else if (p.calculoPrioridad.prioridad === 'Media') media++;
    else if (p.calculoPrioridad.prioridad === 'Baja') baja++;

    if (p.clasificacion.tipologia === 'Otro tipo') {
      otroTipo++;
    }

    if (p.estado !== 'Resuelta') {
      const limiteSLA = new Date(p.enrutamiento.fechaLimiteSLA).getTime();
      const restanteMs = limiteSLA - ahora;
      const horasRestantes = restanteMs / (1000 * 3600);

      if (restanteMs <= 0) {
        vencidasSLA++;
      } else if (horasRestantes < (p.enrutamiento.slaHoras * 0.3)) {
        // Menos del 30% del tiempo de SLA disponible
        enRiesgoSLA++;
      }
    }
  }

  const porcentajeOtroTipo = total > 0 ? Math.round((otroTipo / total) * 100) : 0;

  return {
    total,
    alta,
    media,
    baja,
    porcentajeOtroTipo,
    enRiesgoSLA,
    vencidasSLA,
    promedioSlaRestanteHoras: 24,
  };
}

/**
 * Busca una PQR específica por radicado
 */
export function obtenerPQRPorId(id: string): PQR | undefined {
  return repoObtenerPorId(id);
}

/**
 * Actualiza el estado de una PQR con nota de auditoría del asesor
 */
export function actualizarEstadoPQR(
  id: string,
  nuevoEstado: EstadoPQR,
  nota = '',
  asesor = 'Asesor Interno EPM'
): PQR {
  const pqr = repoObtenerPorId(id);
  if (!pqr) {
    throw new Error(`PQR con radicado ${id} no encontrada`);
  }

  pqr.estado = nuevoEstado;
  pqr.historial.push({
    fecha: new Date().toISOString(),
    estado: nuevoEstado,
    nota: nota || `Estado actualizado a ${nuevoEstado}`,
    asesor,
  });

  return actualizarPQR(pqr);
}

/**
 * Reasigna o reclasifica manualmente una PQR (acción de asesor con trazabilidad AS-IS vs TO-BE)
 */
export function reclasificarPQRManual(
  id: string,
  nuevaTipologia: Tipologia,
  nuevaPrioridad: Prioridad,
  motivoReclasificacion: string,
  asesor = 'Asesor Interno EPM'
): PQR {
  const pqr = repoObtenerPorId(id);
  if (!pqr) {
    throw new Error(`PQR con radicado ${id} no encontrada`);
  }

  const tipologiaAnterior = pqr.clasificacion.tipologia;
  const prioridadAnterior = pqr.calculoPrioridad.prioridad;

  pqr.clasificacion.tipologia = nuevaTipologia;
  pqr.calculoPrioridad.prioridad = nuevaPrioridad;
  pqr.calculoPrioridad.motivo_regla.push(
    `Reclasificación manual por asesor (${asesor}): ${motivoReclasificacion}`
  );

  // Actualizar enrutamiento
  pqr.enrutamiento = enrutar(nuevaTipologia, nuevaPrioridad, new Date(pqr.fechaCreacion));

  pqr.historial.push({
    fecha: new Date().toISOString(),
    estado: pqr.estado,
    nota: `Reclasificación manual: [${tipologiaAnterior} / ${prioridadAnterior}] -> [${nuevaTipologia} / ${nuevaPrioridad}]. Motivo: ${motivoReclasificacion}`,
    asesor,
  });

  return actualizarPQR(pqr);
}

/**
 * Reinicia la base de datos a los 8 casos de prueba demo
 */
export function reiniciarDatosDemo(): PQR[] {
  return repoReiniciarDemo();
}

// Re-exportamos funciones puras del motor para consumidores de la API
export { calcularPrioridad, clasificarTipologia, enrutar };
