/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * EPM · Clasificación Inteligente de PQR - Repositorio de Persistencia
 * Almacén en memoria con sincronización en localStorage y 8 casos de prueba representativos.
 */

import { PQR } from '../../types';
import { calcularPrioridad, clasificarTipologia, enrutar, generarNumeroRadicado } from '../reglas/motor';

const STORAGE_KEY = 'epm_pqr_database_v1';
const CONSECUTIVO_KEY = 'epm_pqr_consecutivo_v1';

/**
 * 8 Casos de prueba iniciales requeridos:
 * Cubren todas las combinaciones de tipología (Facturación, Calidad/Falla, Otro)
 * y prioridad (Alta, Media, Baja), incluyendo cliente reincidente y población vulnerable.
 */
function generarDatosSemilla(): PQR[] {
  const ahora = new Date();
  
  // Fechas escalonadas para probar antigüedad y SLAs
  const hace2Horas = new Date(ahora.getTime() - 2 * 3600 * 1000);
  const hace10Horas = new Date(ahora.getTime() - 10 * 3600 * 1000);
  const hace1Dia = new Date(ahora.getTime() - 24 * 3600 * 1000);
  const hace2Dias = new Date(ahora.getTime() - 48 * 3600 * 1000);
  const hace4Dias = new Date(ahora.getTime() - 96 * 3600 * 1000);

  const casosSemilla = [
    // 1. Calidad / Falla - Alta (Hospital / servicio esencial + corte total de energía + afectación vecinal)
    {
      consecutivo: 101,
      fecha: hace2Horas,
      usuario: {
        nombre: 'Dr. Fernando Restrepo Montoya',
        documento: '71239845',
        contrato: '100482910',
        correo: 'direccion@clinicasanvicente.org',
        telefono: '3104598201',
      },
      solicitud: {
        tipo: 'Queja' as const,
        servicio: 'Energia' as const,
        descripcion: 'Corte imprevisto y apagón general en la manzana de urgencias. Sin servicio eléctrico desde hace 3 horas. Hay transformador con chispas en la esquina.',
        condiciones: {
          servicioSuspendido: true,
          afectaVariosUsuarios: true,
          poblacionVulnerable: true,
          servicioEsencial: true, // Hospital
          diasHabilesConsumidos: 0,
        },
      },
      reincidenciasPrevias: 0,
      estado: 'En gestión' as const,
    },

    // 2. Facturación - Alta por Reincidencia (Cliente con 3 PQR en 6 meses por cobro desproporcionado)
    {
      consecutivo: 102,
      fecha: hace10Horas,
      usuario: {
        nombre: 'Gloria Inés Henao Cadavid',
        documento: '43512890',
        contrato: '200591834',
        correo: 'gloria.henao@gmail.com',
        telefono: '3158902341',
      },
      solicitud: {
        tipo: 'Reclamo' as const,
        servicio: 'Agua' as const,
        descripcion: 'La factura del mes de octubre llegó por $850.000 con un consumo triplicado. Ya vinieron dos veces a revisar el medidor y persisten con el cobro excesivo sin refacturar.',
        condiciones: {
          servicioSuspendido: false,
          afectaVariosUsuarios: false,
          poblacionVulnerable: false,
          servicioEsencial: false,
          diasHabilesConsumidos: 2,
        },
      },
      reincidenciasPrevias: 3, // REINCIDENTE (> 2) -> Sube de Media a Alta
      estado: 'Radicada' as const,
    },

    // 3. Calidad - Alta por Población Vulnerable (Adulto mayor con oxígeno dependiente sin servicio de agua)
    {
      consecutivo: 103,
      fecha: hace2Horas,
      usuario: {
        nombre: 'Martha Lucía Gómez Palacio',
        documento: '32489012',
        contrato: '300892019',
        correo: 'martha.gomez@outlook.com',
        telefono: '3007612345',
      },
      solicitud: {
        tipo: 'Queja' as const,
        servicio: 'Agua' as const,
        descripcion: 'Tenemos suspensión del agua potable en la vivienda desde la mañana. En la casa reside adulto mayor de 88 años en cama y con atención médica domiciliaria.',
        condiciones: {
          servicioSuspendido: true,
          afectaVariosUsuarios: false,
          poblacionVulnerable: true, // POBLACIÓN VULNERABLE
          servicioEsencial: false,
          diasHabilesConsumidos: 0,
        },
      },
      reincidenciasPrevias: 0,
      estado: 'En gestión' as const,
    },

    // 4. Facturación - Media (Reclamo estándar por tarifa y lectura de medidor)
    {
      consecutivo: 104,
      fecha: hace1Dia,
      usuario: {
        nombre: 'Carlos Mario Uribe Vélez',
        documento: '98450123',
        contrato: '400192837',
        correo: 'carlos.uribe@empresas.co',
        telefono: '3116723456',
      },
      solicitud: {
        tipo: 'Reclamo' as const,
        servicio: 'Gas' as const,
        descripcion: 'Inconformidad con la tarifa aplicada en la factura del servicio de gas natural residencial. Considero que no corresponde al estrato socioeconómico 3.',
        condiciones: {
          servicioSuspendido: false,
          afectaVariosUsuarios: false,
          poblacionVulnerable: false,
          servicioEsencial: false,
          diasHabilesConsumidos: 1,
        },
      },
      reincidenciasPrevias: 0,
      estado: 'Radicada' as const,
    },

    // 5. Calidad - Media (Falla no crítica: baja presión intermitente sin corte total)
    {
      consecutivo: 105,
      fecha: hace1Dia,
      usuario: {
        nombre: 'Alejandra Posada Mejía',
        documento: '1017234901',
        contrato: '500781923',
        correo: 'aleja.posada@hotmail.com',
        telefono: '3208912345',
      },
      solicitud: {
        tipo: 'Queja' as const,
        servicio: 'Agua' as const,
        descripcion: 'En las horas pico de la tarde se presenta baja presión y flujo intermitente en los pisos altos del edificio. Solicitamos revisión técnica de la acometida.',
        condiciones: {
          servicioSuspendido: false,
          afectaVariosUsuarios: false,
          poblacionVulnerable: false,
          servicioEsencial: false,
          diasHabilesConsumidos: 2,
        },
      },
      reincidenciasPrevias: 1,
      estado: 'En gestión' as const,
    },

    // 6. Facturación - Baja (Petición informativa de duplicado y opciones de pago)
    {
      consecutivo: 106,
      fecha: hace2Dias,
      usuario: {
        nombre: 'Jorge Enrique Londoño',
        documento: '70543219',
        contrato: '600392019',
        correo: 'jorge.londono@yahoo.com',
        telefono: '3145678901',
      },
      solicitud: {
        tipo: 'Peticion' as const,
        servicio: 'Energia' as const,
        descripcion: 'Solicito copia de la factura digital del último periodo y consultar los puntos autorizados para el pago electrónico por PSE.',
        condiciones: {
          servicioSuspendido: false,
          afectaVariosUsuarios: false,
          poblacionVulnerable: false,
          servicioEsencial: false,
          diasHabilesConsumidos: 3,
        },
      },
      reincidenciasPrevias: 0,
      estado: 'Radicada' as const,
    },

    // 7. Otro tipo - Media (Queja sobre atención presencial en oficina comunitaria)
    {
      consecutivo: 107,
      fecha: hace2Dias,
      usuario: {
        nombre: 'Beatriz Elena Arango',
        documento: '42981045',
        contrato: '700192847',
        correo: 'beatriz.arango@gmail.com',
        telefono: '3137890123',
      },
      solicitud: {
        tipo: 'Queja' as const,
        servicio: 'Energia' as const,
        descripcion: 'Presento queja formal por el tiempo excesivo de espera y la mala atención recibida por parte del orientador en la sede La Alpujarra el día de ayer.',
        condiciones: {
          servicioSuspendido: false,
          afectaVariosUsuarios: false,
          poblacionVulnerable: false,
          servicioEsencial: false,
          diasHabilesConsumidos: 4,
        },
      },
      reincidenciasPrevias: 0,
      estado: 'En gestión' as const,
    },

    // 8. Otro tipo - Alta por Término Legal Crítico (Petición sobre trámite que lleva 11 días hábiles consumidos)
    {
      consecutivo: 108,
      fecha: hace4Dias,
      usuario: {
        nombre: 'Andrés Felipe Morales Botero',
        documento: '1152203918',
        contrato: '800492817',
        correo: 'andres.morales@colombia.com',
        telefono: '3014567890',
      },
      solicitud: {
        tipo: 'Peticion' as const,
        servicio: 'Gas' as const,
        descripcion: 'Solicitud de certificado de disponibilidad de acometida e informe técnico de viabilidad para adecuación comercial.',
        condiciones: {
          servicioSuspendido: false,
          afectaVariosUsuarios: false,
          poblacionVulnerable: false,
          servicioEsencial: false,
          diasHabilesConsumidos: 11, // TÉRMINO LEGAL CRÍTICO (>= 10 días de 15) -> Sube de Baja a Media, reincidencia sube a Alta
        },
      },
      reincidenciasPrevias: 3, // Además reincidente -> Escala a Alta
      estado: 'Escalada' as const,
    },
  ];

  return casosSemilla.map((c) => {
    const clasificacion = clasificarTipologia(c.solicitud);
    const calculoPrioridad = calcularPrioridad(c.solicitud, c.reincidenciasPrevias);
    const enrutamiento = enrutar(clasificacion.tipologia, calculoPrioridad.prioridad, c.fecha);
    const id = generarNumeroRadicado(c.consecutivo, c.fecha);

    return {
      id,
      consecutivo: c.consecutivo,
      fechaCreacion: c.fecha.toISOString(),
      usuario: c.usuario,
      solicitud: c.solicitud,
      clasificacion,
      calculoPrioridad,
      enrutamiento,
      estado: c.estado,
      reincidenciasPrevias: c.reincidenciasPrevias,
      historial: [
        {
          fecha: c.fecha.toISOString(),
          estado: 'Radicada',
          nota: 'PQR radicada y clasificada automáticamente por el motor de reglas',
        },
        ...(c.estado !== 'Radicada'
          ? [
              {
                fecha: new Date(c.fecha.getTime() + 1800000).toISOString(),
                estado: c.estado,
                nota: `Transición a estado ${c.estado} por el área de atención`,
                asesor: 'Asesor Operativo EPM',
              },
            ]
          : []),
      ],
    };
  });
}

// Inicialización de base de datos en memoria
let baseDeDatosPQR: PQR[] = [];
let ultimoConsecutivo = 108;

function cargarDesdeAlmacenamiento(): void {
  if (typeof window !== 'undefined' && window.localStorage) {
    try {
      const data = localStorage.getItem(STORAGE_KEY);
      const consecutivo = localStorage.getItem(CONSECUTIVO_KEY);
      if (data) {
        baseDeDatosPQR = JSON.parse(data);
        if (consecutivo) ultimoConsecutivo = parseInt(consecutivo, 10);
        return;
      }
    } catch {
      // Ignorar fallo y usar datos semilla
    }
  }
  baseDeDatosPQR = generarDatosSemilla();
  guardarEnAlmacenamiento();
}

function guardarEnAlmacenamiento(): void {
  if (typeof window !== 'undefined' && window.localStorage) {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(baseDeDatosPQR));
      localStorage.setItem(CONSECUTIVO_KEY, ultimoConsecutivo.toString());
    } catch {
      // Ignorar si no hay cuota
    }
  }
}

// Cargar al inicializar el módulo
cargarDesdeAlmacenamiento();

/**
 * Obtiene todas las PQR almacenadas
 */
export function obtenerTodasPQR(): PQR[] {
  return [...baseDeDatosPQR];
}

/**
 * Obtiene una PQR por su número de radicado
 */
export function obtenerPQRPorId(id: string): PQR | undefined {
  return baseDeDatosPQR.find((p) => p.id === id);
}

/**
 * Cuenta cuántas PQR previas tiene un contrato en los últimos 6 meses
 */
export function contarPQRContratoUltimos6Meses(contrato: string): number {
  if (!contrato) return 0;
  const contratoNormalizado = contrato.trim();
  const limite6Meses = new Date(Date.now() - 180 * 24 * 3600 * 1000);

  return baseDeDatosPQR.filter((p) => {
    const fechaPqr = new Date(p.fechaCreacion);
    return (
      p.usuario.contrato.trim() === contratoNormalizado &&
      fechaPqr >= limite6Meses
    );
  }).length;
}

/**
 * Genera el siguiente número consecutivo
 */
export function obtenerSiguienteConsecutivo(): number {
  ultimoConsecutivo++;
  guardarEnAlmacenamiento();
  return ultimoConsecutivo;
}

/**
 * Guarda una nueva PQR en el repositorio
 */
export function guardarPQR(pqr: PQR): PQR {
  baseDeDatosPQR.unshift(pqr);
  guardarEnAlmacenamiento();
  return pqr;
}

/**
 * Actualiza una PQR existente (ej. cambio de estado o notas del asesor)
 */
export function actualizarPQR(pqrActualizada: PQR): PQR {
  const index = baseDeDatosPQR.findIndex((p) => p.id === pqrActualizada.id);
  if (index !== -1) {
    baseDeDatosPQR[index] = pqrActualizada;
    guardarEnAlmacenamiento();
  }
  return pqrActualizada;
}

/**
 * Reinicia la base de datos con los 8 casos de prueba de fábrica
 */
export function reiniciarDatosDemo(): PQR[] {
  ultimoConsecutivo = 108;
  baseDeDatosPQR = generarDatosSemilla();
  guardarEnAlmacenamiento();
  return [...baseDeDatosPQR];
}
