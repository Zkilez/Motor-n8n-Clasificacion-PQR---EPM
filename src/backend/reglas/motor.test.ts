/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * EPM · Clasificación Inteligente de PQR - Pruebas Unitarias del Motor de Reglas
 */

import { describe, expect, it } from 'vitest';
import { DetalleSolicitud } from '../../types';
import {
  calcularFechaLimiteLegal,
  calcularPrioridad,
  clasificarTipologia,
  enrutar,
  esDiaHabilColombia,
  generarNumeroRadicado,
  normalizarTexto,
} from './motor';

describe('Motor de Reglas EPM - Normalización y Utilidades', () => {
  it('normaliza texto eliminando acentos, mayúsculas y caracteres especiales', () => {
    const original = '¡HOLA! Tengo problemas con la FACTURACIÓN y el cobro excesivo... ¿Por qué?';
    const normalizado = normalizarTexto(original);
    expect(normalizado).toBe('hola tengo problemas con la facturacion y el cobro excesivo por que');
  });

  it('genera radicado institucional con formato PQR-AAAAMMDD-####', () => {
    const fecha = new Date(2026, 9, 24); // 24 de Octubre de 2026
    const radicado = generarNumeroRadicado(42, fecha);
    expect(radicado).toBe('PQR-20261024-0042');
  });
});

describe('Motor 1: Clasificación de Tipología', () => {
  it('Caso 1: Clasifica correctamente como Facturación ante palabras clave de cobro y medidor', () => {
    const solicitud: DetalleSolicitud = {
      tipo: 'Reclamo',
      servicio: 'Energia',
      descripcion: 'Llegó la factura con un cobro exagerado en el consumo y la lectura del medidor está errada',
      condiciones: {
        servicioSuspendido: false,
        afectaVariosUsuarios: false,
        poblacionVulnerable: false,
        servicioEsencial: false,
      },
    };

    const resultado = clasificarTipologia(solicitud);
    expect(resultado.tipologia).toBe('Facturación');
    expect(resultado.puntaje).toBeGreaterThanOrEqual(1.5);
    expect(resultado.palabras_detectadas).toEqual(
      expect.arrayContaining(['factura', 'cobro', 'consumo', 'lectura', 'medidor'])
    );
  });

  it('Caso 2: Clasifica correctamente como Calidad / falla del servicio ante corte, apagón o sin servicio', () => {
    const solicitud: DetalleSolicitud = {
      tipo: 'Queja',
      servicio: 'Energia',
      descripcion: 'Estamos sin servicio desde ayer por la tarde, hubo un apagón y el voltaje está inestable',
      condiciones: {
        servicioSuspendido: true,
        afectaVariosUsuarios: true,
        poblacionVulnerable: false,
        servicioEsencial: false,
      },
    };

    const resultado = clasificarTipologia(solicitud);
    expect(resultado.tipologia).toBe('Calidad / falla del servicio');
    expect(resultado.puntaje).toBeGreaterThanOrEqual(1.5);
    expect(resultado.palabras_detectadas).toEqual(
      expect.arrayContaining(['sin servicio', 'apagon', 'voltaje'])
    );
  });

  it('Caso 3: Clasifica como "Otro tipo" cuando la solicitud no contiene palabras clave ni alcanza el umbral', () => {
    const solicitud: DetalleSolicitud = {
      tipo: 'Peticion',
      servicio: 'Agua',
      descripcion: 'Quisiera saber los horarios de atención de la sede física en Bello para radicar documentos',
      condiciones: {
        servicioSuspendido: false,
        afectaVariosUsuarios: false,
        poblacionVulnerable: false,
        servicioEsencial: false,
      },
    };

    const resultado = clasificarTipologia(solicitud);
    expect(resultado.tipologia).toBe('Otro tipo');
    expect(resultado.puntaje).toBeLessThan(1.5);
  });
});

describe('Motor 2: Cálculo de Prioridad (Matriz Impacto × Urgencia)', () => {
  it('Caso 4: Asigna prioridad ALTA directa ante condiciones críticas (vulnerable, suspendido o servicio esencial)', () => {
    const solicitudVulnerable: DetalleSolicitud = {
      tipo: 'Queja',
      servicio: 'Agua',
      descripcion: 'Corte de agua en vivienda donde habita persona adulta mayor con diálisis',
      condiciones: {
        servicioSuspendido: true,
        afectaVariosUsuarios: false,
        poblacionVulnerable: true, // Condición crítica
        servicioEsencial: false,
      },
    };

    const resultado = calcularPrioridad(solicitudVulnerable, 0);
    expect(resultado.prioridad).toBe('Alta');
    expect(resultado.urgencia).toBe('Alta');
    expect(resultado.impacto).toBe('Alto');
    expect(resultado.motivo_regla.some((m) => m.includes('Población de protección especial'))).toBe(true);
    expect(resultado.motivo_regla.some((m) => m.includes('Servicio suspendido actualmente'))).toBe(true);
  });

  it('Caso 5: Asigna prioridad Media para queja/reclamo ordinario y Baja para petición informativa', () => {
    const quejaOrdinaria: DetalleSolicitud = {
      tipo: 'Queja',
      servicio: 'Gas',
      descripcion: 'Inconformidad con la atención del asesor',
      condiciones: {
        servicioSuspendido: false,
        afectaVariosUsuarios: false,
        poblacionVulnerable: false,
        servicioEsencial: false,
      },
    };

    const peticionOrdinaria: DetalleSolicitud = {
      tipo: 'Peticion',
      servicio: 'Gas',
      descripcion: 'Consulta sobre requisitos para cambio de titular',
      condiciones: {
        servicioSuspendido: false,
        afectaVariosUsuarios: false,
        poblacionVulnerable: false,
        servicioEsencial: false,
      },
    };

    const resQueja = calcularPrioridad(quejaOrdinaria, 0);
    expect(resQueja.prioridad).toBe('Media');

    const resPeticion = calcularPrioridad(peticionOrdinaria, 0);
    expect(resPeticion.prioridad).toBe('Baja');
  });

  it('Caso 6: Escala 1 nivel de prioridad por cliente reincidente (> 2 PQR en 6 meses)', () => {
    const peticionReincidente: DetalleSolicitud = {
      tipo: 'Peticion',
      servicio: 'Energia',
      descripcion: 'Petición de estado de cuenta de medidor',
      condiciones: {
        servicioSuspendido: false,
        afectaVariosUsuarios: false,
        poblacionVulnerable: false,
        servicioEsencial: false,
      },
    };

    // Sin reincidencias -> Baja
    const resSinReincidencia = calcularPrioridad(peticionReincidente, 1);
    expect(resSinReincidencia.prioridad).toBe('Baja');

    // Con 3 reincidencias (>2) -> Escala de Baja a Media
    const resConReincidencia = calcularPrioridad(peticionReincidente, 3);
    expect(resConReincidencia.prioridad).toBe('Media');
    expect(resConReincidencia.escaladoReincidencia).toBe(true);
    expect(resConReincidencia.motivo_regla.some((m) => m.includes('Cliente reincidente'))).toBe(true);

    // Si la base era Media (por ejemplo un Reclamo) y tiene >2 reincidencias -> Escala de Media a Alta
    const reclamoReincidente: DetalleSolicitud = {
      ...peticionReincidente,
      tipo: 'Reclamo',
    };
    const resReclamoEscalado = calcularPrioridad(reclamoReincidente, 3);
    expect(resReclamoEscalado.prioridad).toBe('Alta');
  });

  it('Caso 7: Escala prioridad cuando ya consumió 10 o más días del término legal', () => {
    const solicitudEnRiesgo: DetalleSolicitud = {
      tipo: 'Peticion',
      servicio: 'Agua',
      descripcion: 'Solicitud que se encuentra en trámite interno',
      condiciones: {
        servicioSuspendido: false,
        afectaVariosUsuarios: false,
        poblacionVulnerable: false,
        servicioEsencial: false,
        diasHabilesConsumidos: 11, // >= 10 días de los 15 hábiles
      },
    };

    const res = calcularPrioridad(solicitudEnRiesgo, 0);
    expect(res.prioridad).toBe('Media'); // Sube de Baja a Media
    expect(res.escaladoTerminoLegal).toBe(true);
    expect(res.motivo_regla.some((m) => m.includes('Término legal crítico'))).toBe(true);
  });
});

describe('Motor 3: Enrutamiento y Días Hábiles Colombia 2026', () => {
  const festivos = [
    '2026-01-01',
    '2026-05-01',
    '2026-07-20',
    '2026-08-07',
    '2026-12-25',
  ];

  it('detecta correctamente días hábiles excluyendo sábados, domingos y festivos', () => {
    // 2026-05-01 es Viernes (Día del Trabajo) -> NO es hábil
    const festivoViernes = new Date('2026-05-01T10:00:00');
    expect(esDiaHabilColombia(festivoViernes, festivos)).toBe(false);

    // 2026-05-02 es Sábado -> NO es hábil
    const sabado = new Date('2026-05-02T10:00:00');
    expect(esDiaHabilColombia(sabado, festivos)).toBe(false);

    // 2026-05-04 es Lunes normal -> SÍ es hábil
    const lunes = new Date('2026-05-04T10:00:00');
    expect(esDiaHabilColombia(lunes, festivos)).toBe(true);
  });

  it('Caso 8: Enruta correctamente asignando ruta, área responsable y SLA según tipología y prioridad', () => {
    const fecha = new Date('2026-10-26T08:00:00'); // Lunes hábil

    // Facturación + Alta
    const ruta1 = enrutar('Facturación', 'Alta', fecha);
    expect(ruta1.ruta).toBe('Servicio Crítico');
    expect(ruta1.area).toBe('Área de facturación');
    expect(ruta1.slaHoras).toBe(4);

    // Calidad + Media
    const ruta2 = enrutar('Calidad / falla del servicio', 'Media', fecha);
    expect(ruta2.ruta).toBe('Queja o Reclamo');
    expect(ruta2.area).toBe('Área operativa / Campo');
    expect(ruta2.slaHoras).toBe(48);

    // Otro tipo + Baja
    const ruta3 = enrutar('Otro tipo', 'Baja', fecha);
    expect(ruta3.ruta).toBe('Baja prioridad');
    expect(ruta3.area).toBe('Atención al cliente');
    expect(ruta3.slaHoras).toBe(120);

    // Calcula 15 días hábiles legales
    const fechaLegal = new Date(ruta3.fechaLimiteLegal);
    expect(fechaLegal.getTime()).toBeGreaterThan(fecha.getTime());
  });
});
