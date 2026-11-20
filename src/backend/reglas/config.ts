/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * EPM · Clasificación Inteligente de PQR - Configuración Editable del Motor de Reglas
 * Este archivo centraliza los parámetros, palabras clave, festivos y ponderaciones.
 */

import { ReglasConfiguracion } from '../../types';

export const CONFIG_REGLAS_DEFAULT: ReglasConfiguracion = {
  // Palabras clave asociadas a tipología de Facturación
  palabrasClaveFacturacion: [
    'factura',
    'facturacion',
    'cobro',
    'cobraron',
    'consumo',
    'lectura',
    'medidor',
    'tarifa',
    'pago',
    'valor',
    'refacturar',
    'refacturacion',
    'sobrecosto',
    'estrato',
    'liquidacion',
    'reclamacion cobro',
    'cobro excesivo',
    'desproporcionado',
    'cargo fijo',
    'doble cobro',
  ],

  // Palabras clave asociadas a tipología de Calidad / Falla del servicio
  palabrasClaveCalidad: [
    'sin servicio',
    'corte',
    'suspension',
    'baja presion',
    'voltaje',
    'intermitente',
    'fuga',
    'apagon',
    'sin luz',
    'sin agua',
    'sin gas',
    'se fue la luz',
    'no hay agua',
    'no hay gas',
    'olor a gas',
    'escape',
    'presion baja',
    'tuberia rota',
    'transformador',
    'chispas',
    'fluctuacion',
    'caida de tension',
    'dano en red',
    'cable caido',
    'desabastecimiento',
  ],

  // Umbral mínimo de puntaje para clasificar. Si ninguna categoría lo alcanza, es "Otro tipo"
  umbralMinimoPuntaje: 1.5,

  // Pesos para ponderación
  pesoPalabraClave: 2,
  pesoCategoriaUsuario: 1.0,

  // Término legal en Colombia (Ley 142 de 1994 / CPACA: 15 días hábiles para PQR de servicios públicos)
  terminoLegalDiasHabiles: 15,

  // Días festivos oficiales en Colombia para el año 2026 (Ley Emiliani)
  festivosColombia2026: [
    '2026-01-01', // Año Nuevo
    '2026-01-12', // Reyes Magos
    '2026-03-23', // Día de San José
    '2026-04-02', // Jueves Santo
    '2026-04-03', // Viernes Santo
    '2026-05-01', // Día del Trabajo
    '2026-05-18', // Ascensión del Señor
    '2026-06-08', // Corpus Christi
    '2026-06-15', // Sagrado Corazón
    '2026-06-29', // San Pedro y San Pablo
    '2026-07-20', // Día de la Independencia
    '2026-08-07', // Batalla de Boyacá
    '2026-08-17', // La Asunción
    '2026-10-12', // Día de la Raza
    '2026-11-02', // Todos los Santos
    '2026-11-16', // Independencia de Cartagena
    '2026-12-08', // Inmaculada Concepción
    '2026-12-25', // Navidad
  ],

  // SLAs internos por nivel de prioridad
  slaHoras: {
    alta: 4,      // 4 horas (Servicio Crítico)
    media: 48,    // 48 horas (Queja o Reclamo)
    baja: 120,    // 5 días hábiles (120 horas para solicitud informativa)
  },

  // Condición de reincidencia: más de 2 PQR en los últimos 6 meses
  umbralReincidencia: 2,

  // Condición de días consumidos: 10 o más días de los 15 hábiles
  umbralDiasConsumidosEscalamiento: 10,
};

// Almacén en memoria de configuración activa (con fallback editable)
let configuracionActiva: ReglasConfiguracion = { ...CONFIG_REGLAS_DEFAULT };

/**
 * Obtiene la configuración actual del motor de reglas
 */
export function obtenerConfiguracion(): ReglasConfiguracion {
  // En ambiente navegador, intentamos leer de localStorage si existe
  if (typeof window !== 'undefined' && window.localStorage) {
    try {
      const guardada = localStorage.getItem('epm_reglas_config');
      if (guardada) {
        return JSON.parse(guardada) as ReglasConfiguracion;
      }
    } catch {
      // Ignorar error de parsing y retornar memoria
    }
  }
  return configuracionActiva;
}

/**
 * Actualiza la configuración del motor de reglas en memoria y localStorage
 */
export function actualizarConfiguracion(nuevaConfig: Partial<ReglasConfiguracion>): ReglasConfiguracion {
  configuracionActiva = {
    ...configuracionActiva,
    ...nuevaConfig,
  };
  if (typeof window !== 'undefined' && window.localStorage) {
    try {
      localStorage.setItem('epm_reglas_config', JSON.stringify(configuracionActiva));
    } catch {
      // localStorage no disponible
    }
  }
  return configuracionActiva;
}

/**
 * Restablece la configuración del motor de reglas a sus valores de fábrica
 */
export function restablecerConfiguracion(): ReglasConfiguracion {
  configuracionActiva = { ...CONFIG_REGLAS_DEFAULT };
  if (typeof window !== 'undefined' && window.localStorage) {
    try {
      localStorage.removeItem('epm_reglas_config');
    } catch {
      // ignorar
    }
  }
  return configuracionActiva;
}
