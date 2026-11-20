/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * EPM · Clasificación Inteligente de PQR - Utilidades de Presentación y Formato
 */

import { AreaResponsable, EstadoPQR, Prioridad, Tipologia } from '../types';

/**
 * Formatea una fecha ISO a formato colombiano legible
 */
export function formatearFechaColombia(fechaIso: string, incluirHora = true): string {
  if (!fechaIso) return '-';
  const fecha = new Date(fechaIso);
  const opciones: Intl.DateTimeFormatOptions = {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    ...(incluirHora
      ? {
          hour: '2-digit',
          minute: '2-digit',
          hour12: true,
        }
      : {}),
  };
  return new Intl.DateTimeFormat('es-CO', opciones).format(fecha);
}

/**
 * Calcula el tiempo transcurrido desde una fecha (ej. "hace 2 horas")
 */
export function formatearTiempoTranscurrido(fechaIso: string): string {
  const fecha = new Date(fechaIso);
  const diffMs = Date.now() - fecha.getTime();
  const minutos = Math.floor(diffMs / (1000 * 60));
  const horas = Math.floor(minutos / 60);
  const dias = Math.floor(horas / 24);

  if (minutos < 1) return 'Hace un momento';
  if (minutos < 60) return `Hace ${minutos} min`;
  if (horas < 24) return `Hace ${horas} h ${minutos % 60}m`;
  return `Hace ${dias} d`;
}

/**
 * Calcula el tiempo restante de SLA y determina el estado de semáforo
 */
export function calcularEstadoSLA(fechaLimiteSLA: string, slaHorasTotal: number) {
  const limite = new Date(fechaLimiteSLA).getTime();
  const ahora = Date.now();
  const diffMs = limite - ahora;
  const horasRestantes = diffMs / (1000 * 3600);

  if (diffMs <= 0) {
    const horasVencidas = Math.abs(Math.floor(horasRestantes));
    return {
      vencido: true,
      texto: `Vencido hace ${horasVencidas}h`,
      porcentaje: 0,
      color: 'text-red-700 bg-red-100 border-red-300',
      badgeColor: 'bg-red-600',
      icono: 'vencido',
    };
  }

  const horas = Math.floor(horasRestantes);
  const minutos = Math.floor((horasRestantes - horas) * 60);
  const porcentajeRestante = Math.max(0, Math.min(100, (horasRestantes / slaHorasTotal) * 100));

  if (horasRestantes < (slaHorasTotal * 0.3) || horasRestantes <= 2) {
    return {
      vencido: false,
      texto: `${horas}h ${minutos}m restantes`,
      porcentaje: porcentajeRestante,
      color: 'text-amber-800 bg-amber-50 border-amber-300',
      badgeColor: 'bg-amber-500',
      icono: 'en-riesgo',
    };
  }

  return {
    vencido: false,
    texto: `${horas}h ${minutos}m restantes`,
    porcentaje: porcentajeRestante,
    color: 'text-emerald-800 bg-emerald-50 border-emerald-300',
    badgeColor: 'bg-emerald-600',
    icono: 'a-tiempo',
  };
}

/**
 * Configuración visual de badges por prioridad
 */
export function obtenerEstiloPrioridad(prioridad: Prioridad) {
  switch (prioridad) {
    case 'Alta':
      return {
        badge: 'bg-rose-50 text-rose-700 border-rose-200 font-semibold',
        dot: 'bg-rose-600',
        card: 'border-l-4 border-l-rose-500',
        label: 'Alta (Crítico)',
      };
    case 'Media':
      return {
        badge: 'bg-amber-50 text-amber-800 border-amber-200 font-semibold',
        dot: 'bg-amber-500',
        card: 'border-l-4 border-l-amber-500',
        label: 'Media',
      };
    case 'Baja':
    default:
      return {
        badge: 'bg-emerald-50 text-emerald-800 border-emerald-200 font-semibold',
        dot: 'bg-emerald-500',
        card: 'border-l-4 border-l-emerald-500',
        label: 'Baja',
      };
  }
}

/**
 * Configuración visual de badges por tipología
 */
export function obtenerEstiloTipologia(tipologia: Tipologia) {
  switch (tipologia) {
    case 'Facturación':
      return {
        badge: 'bg-blue-50 text-blue-700 border-blue-200',
        icono: 'Receipt',
        areaSugerida: 'Área de facturación',
      };
    case 'Calidad / falla del servicio':
      return {
        badge: 'bg-orange-50 text-orange-800 border-orange-200',
        icono: 'AlertTriangle',
        areaSugerida: 'Área operativa / Campo',
      };
    case 'Otro tipo':
    default:
      return {
        badge: 'bg-purple-50 text-purple-700 border-purple-200',
        icono: 'HelpCircle',
        areaSugerida: 'Atención al cliente',
      };
  }
}

/**
 * Configuración de estado PQR
 */
export function obtenerEstiloEstado(estado: EstadoPQR) {
  switch (estado) {
    case 'Radicada':
      return 'bg-blue-50 text-blue-700 border-blue-200';
    case 'En gestión':
      return 'bg-amber-50 text-amber-800 border-amber-200';
    case 'Resuelta':
      return 'bg-emerald-50 text-emerald-800 border-emerald-200';
    case 'Escalada':
      return 'bg-rose-50 text-rose-800 border-rose-200 animate-pulse';
  }
}
