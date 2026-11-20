/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * EPM · Pantalla 2: Comprobante y Tarjeta Oficial de Resultado de Radicación
 */

import React, { useState } from 'react';
import { PQR } from '../types';
import {
  formatearFechaColombia,
  obtenerEstiloPrioridad,
  obtenerEstiloTipologia,
} from '../utils/formato';
import {
  CheckCircle2,
  Copy,
  Check,
  Calendar,
  Clock,
  Layers,
  Building,
  Info,
  ChevronDown,
  ChevronUp,
  ArrowRight,
  PlusCircle,
  Printer,
  ShieldCheck,
  Tag,
  Zap,
  AlertTriangle,
} from 'lucide-react';

interface TarjetaResultadoProps {
  pqr: PQR;
  alRadicarNueva: () => void;
  alIrABandeja: (idRadicado: string) => void;
}

export const TarjetaResultado: React.FC<TarjetaResultadoProps> = ({
  pqr,
  alRadicarNueva,
  alIrABandeja,
}) => {
  const [copiado, setCopiado] = useState(false);
  const [mostrarDetalleReglas, setMostrarDetalleReglas] = useState(true);

  const copiarRadicado = () => {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(pqr.id);
      setCopiado(true);
      setTimeout(() => setCopiado(false), 2500);
    }
  };

  const estiloPrioridad = obtenerEstiloPrioridad(pqr.calculoPrioridad.prioridad);
  const estiloTipologia = obtenerEstiloTipologia(pqr.clasificacion.tipologia);

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Banner de confirmación */}
      <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <div className="w-11 h-11 rounded-full bg-[#007A3D] text-white flex items-center justify-center shadow-sm">
            <CheckCircle2 className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-base font-bold text-slate-900 tracking-tight">
              ¡PQR Radicada y Clasificada con Éxito!
            </h2>
            <p className="text-xs text-slate-600">
              La solicitud fue procesada automáticamente por el motor de reglas de EPM.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <button
            type="button"
            onClick={() => window.print()}
            className="flex-1 sm:flex-initial inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl border border-slate-200 bg-white text-xs font-semibold text-slate-700 hover:bg-slate-50 transition-colors cursor-pointer"
          >
            <Printer className="w-3.5 h-3.5" />
            <span>Imprimir</span>
          </button>
          <button
            type="button"
            onClick={alRadicarNueva}
            className="flex-1 sm:flex-initial inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-900 text-white text-xs font-semibold transition-colors cursor-pointer"
          >
            <PlusCircle className="w-3.5 h-3.5" />
            <span>Radicar Otra</span>
          </button>
        </div>
      </div>

      {/* Alerta de Diagnóstico de n8n si se usó respaldo local */}
      {pqr.n8nStatus === 'respaldo_local' && pqr.n8nDetalle && (
        <div className="p-4 bg-amber-50 border border-amber-300 rounded-2xl flex items-start gap-3.5 text-xs text-amber-950 shadow-2xs animate-fade-in">
          <div className="w-8 h-8 rounded-xl bg-amber-200 text-amber-800 flex items-center justify-center shrink-0 mt-0.5">
            <AlertTriangle className="w-4 h-4" />
          </div>
          <div className="space-y-1.5 flex-1">
            <p className="font-bold text-amber-900 text-sm">
              Tu PQR quedó radicada en EPM, pero n8n no ejecutó el workflow
            </p>
            <p className="text-[11px] font-mono bg-white/90 p-2.5 rounded-xl border border-amber-200 text-amber-950 overflow-x-auto">
              {pqr.n8nDetalle}
            </p>
            <div className="text-[11px] text-amber-900 space-y-1 pt-1">
              <p>
                <strong>¿Por qué pasó esto?</strong> En n8n Cloud, la URL de producción (<code className="font-mono bg-white px-1 py-0.5 rounded">/webhook/epm-pqr</code>) solo responde cuando el workflow está en estado <strong>Active</strong>. Si está apagado, n8n responde 404 y no guarda la ejecución.
              </p>
              <p>
                <strong>Cómo solucionarlo en 2 pasos:</strong>
                <br />1. Ve a tu editor de n8n Cloud, haz clic en el interruptor <strong>"Active"</strong> (arriba a la derecha) y guarda con <kbd className="font-mono bg-white px-1.5 py-0.5 rounded border border-amber-300">Ctrl + S</kbd>.
                <br />2. Si quieres probarlo antes de activarlo, en el Paso 3 del formulario selecciona <em>"Modo Prueba (/webhook-test)"</em> y haz clic primero en <em>"Listen for test event"</em> dentro de n8n.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Tarjeta Comprobante Institucional EPM */}
      <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
        {/* Cabecera de la tarjeta con estilo de certificado */}
        <div className="bg-slate-900 text-white p-6 sm:p-7 relative overflow-hidden">
          {/* Patrón sutil decorativo */}
          <div className="absolute top-0 right-0 -mt-6 -mr-6 w-48 h-48 bg-[#007A3D]/20 rounded-full blur-2xl" />

          <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="text-[11px] font-bold uppercase tracking-widest text-emerald-400">
                  Comprobante Oficial de Radicación
                </span>
                <span className="text-xs text-slate-400">•</span>
                <span className="text-xs text-slate-300">
                  {formatearFechaColombia(pqr.fechaCreacion)}
                </span>
              </div>
              <div className="flex items-center gap-3">
                <span className="font-mono text-2xl sm:text-3xl font-extrabold text-white tracking-wider">
                  {pqr.id}
                </span>
                <button
                  type="button"
                  onClick={copiarRadicado}
                  className="p-2 rounded-lg bg-white/10 hover:bg-white/20 text-white transition-colors cursor-pointer"
                  title="Copiar número de radicado"
                >
                  {copiado ? (
                    <Check className="w-4 h-4 text-emerald-400" />
                  ) : (
                    <Copy className="w-4 h-4" />
                  )}
                </button>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              {/* Chip Prioridad */}
              <div
                className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs ${estiloPrioridad.badge}`}
              >
                <span className={`w-2 h-2 rounded-full ${estiloPrioridad.dot}`} />
                <span>Prioridad: {pqr.calculoPrioridad.prioridad}</span>
              </div>

              {/* Chip Tipología */}
              <div
                className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs font-semibold ${estiloTipologia.badge}`}
              >
                <Tag className="w-3.5 h-3.5" />
                <span>{pqr.clasificacion.tipologia}</span>
              </div>

              {/* Chip n8n Cloud Webhook */}
              {pqr.origenN8N && (
                <div
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-emerald-400/40 bg-emerald-950/40 text-emerald-300 text-xs font-mono"
                  title={`Ejecutado contra webhook: ${pqr.webhookN8NUrl || 'n8n'}`}
                >
                  <span
                    className={`w-2 h-2 rounded-full ${
                      pqr.n8nStatus === 'exitoso' ? 'bg-emerald-400 animate-pulse' : 'bg-amber-400'
                    }`}
                  />
                  <span>
                    n8n Cloud: {pqr.n8nStatus === 'exitoso' ? 'Conectado (200 OK)' : 'Respaldo activo'}
                  </span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Parámetros de Enrutamiento y Tiempos de Ley */}
        <div className="p-6 sm:p-7 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 border-b border-slate-100 bg-slate-50/50">
          {/* Ruta Asignada */}
          <div className="p-4 rounded-2xl bg-white border border-slate-200/80 shadow-2xs">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
              Ruta Asignada
            </span>
            <div className="flex items-center gap-2 mt-1">
              <Layers className="w-4 h-4 text-[#007A3D]" />
              <span className="text-sm font-bold text-slate-800">
                {pqr.enrutamiento.ruta}
              </span>
            </div>
            <p className="text-[11px] text-slate-500 mt-1">
              Enrutamiento automático según nivel de prioridad
            </p>
          </div>

          {/* Área Responsable */}
          <div className="p-4 rounded-2xl bg-white border border-slate-200/80 shadow-2xs">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
              Área Responsable
            </span>
            <div className="flex items-center gap-2 mt-1">
              <Building className="w-4 h-4 text-[#007A3D]" />
              <span className="text-sm font-bold text-slate-800">
                {pqr.enrutamiento.area}
              </span>
            </div>
            <p className="text-[11px] text-slate-500 mt-1">
              Bandeja asignada según la tipología
            </p>
          </div>

          {/* SLA Interno */}
          <div className="p-4 rounded-2xl bg-white border border-slate-200/80 shadow-2xs">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
              SLA Interno EPM
            </span>
            <div className="flex items-center gap-2 mt-1">
              <Clock className="w-4 h-4 text-amber-600" />
              <span className="text-sm font-bold text-slate-800">
                {pqr.enrutamiento.slaTexto}
              </span>
            </div>
            <p className="text-[11px] text-slate-500 mt-1">
              Compromiso de primera atención operativa
            </p>
          </div>

          {/* Fecha Límite Legal */}
          <div className="p-4 rounded-2xl bg-white border border-slate-200/80 shadow-2xs">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
              Término Legal (15 días hábiles)
            </span>
            <div className="flex items-center gap-2 mt-1">
              <Calendar className="w-4 h-4 text-blue-600" />
              <span className="text-sm font-bold text-slate-800">
                {formatearFechaColombia(pqr.enrutamiento.fechaLimiteLegal, false)}
              </span>
            </div>
            <p className="text-[11px] text-slate-500 mt-1">
              Excluye festivos Colombia 2026 y fines de semana
            </p>
          </div>
        </div>

        {/* Sección de Explicabilidad Algorítmica: ¿Por qué se clasificó así? */}
        <div className="p-6 sm:p-7 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-emerald-50 text-[#007A3D] flex items-center justify-center">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-900 tracking-tight">
                  ¿Por qué se clasificó así? (Transparencia y Explicabilidad)
                </h3>
                <p className="text-xs text-slate-500">
                  Trazabilidad 100% auditable generada por el motor de reglas determinístico.
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setMostrarDetalleReglas(!mostrarDetalleReglas)}
              className="text-xs font-semibold text-slate-500 hover:text-slate-900 inline-flex items-center gap-1 cursor-pointer"
            >
              <span>{mostrarDetalleReglas ? 'Ocultar detalles' : 'Ver detalles'}</span>
              {mostrarDetalleReglas ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            </button>
          </div>

          {mostrarDetalleReglas && (
            <div className="space-y-4 pt-2">
              {/* Reglas de Prioridad Disparadas */}
              <div className="rounded-2xl border border-slate-200 p-4 bg-slate-50/70">
                <span className="text-xs font-bold text-slate-700 uppercase tracking-wider block mb-2">
                  Reglas de prioridad y urgencia aplicadas ({pqr.calculoPrioridad.prioridad}):
                </span>
                <ul className="space-y-2">
                  {pqr.calculoPrioridad.motivo_regla.map((motivo, idx) => (
                    <li
                      key={idx}
                      className="text-xs text-slate-800 flex items-start gap-2 bg-white p-2.5 rounded-xl border border-slate-200/70 shadow-2xs"
                    >
                      <span className="w-1.5 h-1.5 rounded-full bg-[#007A3D] mt-1.5 shrink-0" />
                      <span>{motivo}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Palabras Clave Detectadas en el Texto */}
              <div className="rounded-2xl border border-slate-200 p-4 bg-slate-50/70">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                    Palabras clave detectadas en la descripción:
                  </span>
                  <span className="text-[11px] font-medium text-slate-500">
                    Puntaje acumulado: {pqr.clasificacion.puntaje.toFixed(1)} pts
                  </span>
                </div>

                {pqr.clasificacion.palabras_detectadas.length > 0 ? (
                  <div className="flex flex-wrap gap-2">
                    {pqr.clasificacion.palabras_detectadas.map((palabra, idx) => (
                      <span
                        key={idx}
                        className="inline-flex items-center gap-1 px-3 py-1 rounded-lg bg-emerald-50 border border-emerald-300 text-xs font-semibold text-[#007A3D]"
                      >
                        <Zap className="w-3 h-3 text-emerald-600" />
                        "{palabra}"
                      </span>
                    ))}
                  </div>
                ) : (
                  <p className="text-xs text-slate-500 italic">
                    No se detectaron términos específicos de Facturación o Falla técnica que superaran el umbral mínimo (1.5 pts). Clasificada como "Otro tipo".
                  </p>
                )}
              </div>

              {/* Auditoría de Condiciones */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
                <div className="p-2.5 rounded-xl border border-slate-200 bg-white">
                  <span className="text-[10px] text-slate-400 block font-medium">Servicio Suspendido</span>
                  <span className={`font-bold ${pqr.solicitud.condiciones.servicioSuspendido ? 'text-rose-600' : 'text-slate-700'}`}>
                    {pqr.solicitud.condiciones.servicioSuspendido ? 'Sí (Corte activo)' : 'No'}
                  </span>
                </div>

                <div className="p-2.5 rounded-xl border border-slate-200 bg-white">
                  <span className="text-[10px] text-slate-400 block font-medium">Afectación Colectiva</span>
                  <span className={`font-bold ${pqr.solicitud.condiciones.afectaVariosUsuarios ? 'text-rose-600' : 'text-slate-700'}`}>
                    {pqr.solicitud.condiciones.afectaVariosUsuarios ? 'Sí (Varios usuarios)' : 'No'}
                  </span>
                </div>

                <div className="p-2.5 rounded-xl border border-slate-200 bg-white">
                  <span className="text-[10px] text-slate-400 block font-medium">Población Vulnerable</span>
                  <span className={`font-bold ${pqr.solicitud.condiciones.poblacionVulnerable ? 'text-rose-600' : 'text-slate-700'}`}>
                    {pqr.solicitud.condiciones.poblacionVulnerable ? 'Sí (Protección especial)' : 'No'}
                  </span>
                </div>

                <div className="p-2.5 rounded-xl border border-slate-200 bg-white">
                  <span className="text-[10px] text-slate-400 block font-medium">Reincidencias Previas</span>
                  <span className={`font-bold ${pqr.reincidenciasPrevias > 2 ? 'text-rose-600' : 'text-slate-700'}`}>
                    {pqr.reincidenciasPrevias} en 6 meses
                  </span>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Pie con botón de acceso directo a la Bandeja del Asesor */}
        <div className="p-5 bg-slate-50 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="text-xs text-slate-500 text-center sm:text-left">
            <span>¿Deseas supervisar cómo el asesor ve esta PQR en su cola de trabajo?</span>
          </div>

          <button
            type="button"
            onClick={() => alIrABandeja(pqr.id)}
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-[#007A3D] hover:bg-[#005a2c] text-white text-xs font-bold transition-all shadow-sm shadow-[#007A3D]/20 cursor-pointer"
          >
            <span>Ver esta PQR en la Bandeja del Asesor</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};
