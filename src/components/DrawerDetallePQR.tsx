/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * EPM · Drawer Lateral de Detalle y Trazabilidad de PQR para el Asesor Interno
 */

import React, { useState } from 'react';
import { EstadoPQR, PQR, Prioridad, Tipologia } from '../types';
import {
  calcularEstadoSLA,
  formatearFechaColombia,
  formatearTiempoTranscurrido,
  obtenerEstiloEstado,
  obtenerEstiloPrioridad,
  obtenerEstiloTipologia,
} from '../utils/formato';
import {
  X,
  ShieldCheck,
  Clock,
  Calendar,
  Layers,
  Building,
  User,
  Phone,
  Mail,
  FileText,
  AlertCircle,
  CheckCircle2,
  TrendingUp,
  Tag,
  Save,
  ChevronRight,
  Sparkles,
} from 'lucide-react';

interface DrawerDetallePQRProps {
  pqr: PQR | null;
  alCerrar: () => void;
  alActualizarEstado: (id: string, nuevoEstado: EstadoPQR, nota: string) => void;
  alReclasificarManual: (
    id: string,
    nuevaTipologia: Tipologia,
    nuevaPrioridad: Prioridad,
    motivo: string
  ) => void;
}

export const DrawerDetallePQR: React.FC<DrawerDetallePQRProps> = ({
  pqr,
  alCerrar,
  alActualizarEstado,
  alReclasificarManual,
}) => {
  if (!pqr) return null;

  // Estados locales para acciones del asesor
  const [nuevoEstado, setNuevoEstado] = useState<EstadoPQR>(pqr.estado);
  const [notaEstado, setNotaEstado] = useState('');
  
  // Reclasificación manual
  const [modoReclasificacion, setModoReclasificacion] = useState(false);
  const [reclasTipologia, setReclasTipologia] = useState<Tipologia>(pqr.clasificacion.tipologia);
  const [reclasPrioridad, setReclasPrioridad] = useState<Prioridad>(pqr.calculoPrioridad.prioridad);
  const [motivoReclas, setMotivoReclas] = useState('');

  const estiloPrioridad = obtenerEstiloPrioridad(pqr.calculoPrioridad.prioridad);
  const estiloTipologia = obtenerEstiloTipologia(pqr.clasificacion.tipologia);
  const estadoSLA = calcularEstadoSLA(pqr.enrutamiento.fechaLimiteSLA, pqr.enrutamiento.slaHoras);

  // Resaltado de palabras clave en la descripción
  const renderizarTextoConResaltado = (texto: string, palabrasClave: string[]) => {
    if (!palabrasClave || palabrasClave.length === 0) return <span>{texto}</span>;

    // Crear regex agrupada para resaltar coincidencias
    const pattern = new RegExp(`(${palabrasClave.join('|')})`, 'gi');
    const partes = texto.split(pattern);

    return (
      <span>
        {partes.map((parte, index) => {
          const coincide = palabrasClave.some(
            (p) => p.toLowerCase() === parte.toLowerCase()
          );
          if (coincide) {
            return (
              <mark
                key={index}
                className="bg-emerald-200 text-emerald-900 font-semibold px-1 py-0.5 rounded"
              >
                {parte}
              </mark>
            );
          }
          return <span key={index}>{parte}</span>;
        })}
      </span>
    );
  };

  const guardarCambioEstado = () => {
    if (nuevoEstado !== pqr.estado || notaEstado.trim()) {
      alActualizarEstado(pqr.id, nuevoEstado, notaEstado.trim());
      setNotaEstado('');
    }
  };

  const guardarReclasificacion = () => {
    if (!motivoReclas.trim()) {
      alert('Por favor especifique el motivo de la reclasificación manual para auditoría.');
      return;
    }
    alReclasificarManual(pqr.id, reclasTipologia, reclasPrioridad, motivoReclas.trim());
    setModoReclasificacion(false);
    setMotivoReclas('');
  };

  return (
    <div
      className="fixed inset-0 z-50 overflow-hidden bg-slate-900/40 backdrop-blur-xs flex justify-end transition-opacity"
      role="dialog"
      aria-modal="true"
      aria-labelledby="drawer-title"
    >
      <div className="w-full max-w-2xl bg-white h-full shadow-2xl flex flex-col overflow-hidden animate-in slide-in-from-right duration-200">
        {/* Cabecera del Drawer */}
        <div className="px-6 py-5 bg-slate-900 text-white flex items-center justify-between border-b border-slate-800">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-[11px] font-bold text-emerald-400 uppercase tracking-widest">
                Trazabilidad y Auditoría TO-BE
              </span>
              <span className="text-xs text-slate-400">•</span>
              <span className="text-xs text-slate-300">
                {formatearTiempoTranscurrido(pqr.fechaCreacion)}
              </span>
            </div>
            <h2 id="drawer-title" className="text-xl font-bold font-mono tracking-wider text-white">
              {pqr.id}
            </h2>
            {pqr.webhookN8NUrl && (
              <span className="text-[10px] font-mono text-emerald-300/80 block mt-0.5 truncate max-w-md">
                n8n Webhook: {pqr.webhookN8NUrl}
              </span>
            )}
          </div>

          <button
            type="button"
            onClick={alCerrar}
            className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
            aria-label="Cerrar detalle"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Contenido scrolleable */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Tarjeta de Estado y Semáforo de SLA */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {/* SLA en tiempo real */}
            <div className={`p-4 rounded-2xl border ${estadoSLA.color}`}>
              <div className="flex items-center justify-between mb-1">
                <span className="text-[11px] font-bold uppercase tracking-wider">
                  SLA Restante ({pqr.enrutamiento.slaHoras}h)
                </span>
                <span className={`w-2.5 h-2.5 rounded-full ${estadoSLA.badgeColor} animate-pulse`} />
              </div>
              <p className="text-base font-extrabold">{estadoSLA.texto}</p>
              <p className="text-[11px] opacity-80 mt-1">
                Límite: {formatearFechaColombia(pqr.enrutamiento.fechaLimiteSLA)}
              </p>
            </div>

            {/* Estado actual */}
            <div className="p-4 rounded-2xl border border-slate-200 bg-slate-50 flex flex-col justify-between">
              <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                Estado Actual en Cola
              </span>
              <div className="flex items-center justify-between mt-1">
                <span className={`px-2.5 py-1 rounded-lg text-xs font-bold border ${obtenerEstiloEstado(pqr.estado)}`}>
                  {pqr.estado}
                </span>
                <span className="text-xs text-slate-500 font-mono">
                  {pqr.enrutamiento.ruta}
                </span>
              </div>
            </div>
          </div>

          {/* Clasificación y Priorización Automática */}
          <div className="rounded-2xl border border-slate-200 p-5 bg-white shadow-2xs space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-[#007A3D]" />
                <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                  Resultado del Motor de Reglas
                </h3>
              </div>

              <button
                type="button"
                onClick={() => setModoReclasificacion(!modoReclasificacion)}
                className="text-xs font-semibold text-[#007A3D] hover:underline cursor-pointer"
              >
                {modoReclasificacion ? 'Cancelar reclasificación' : 'Reclasificar manualmente'}
              </button>
            </div>

            {/* Vista normal de clasificación */}
            {!modoReclasificacion ? (
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
                  <span className="text-[10px] text-slate-400 font-bold block uppercase">
                    Tipología
                  </span>
                  <span className="text-xs font-bold text-slate-800 block mt-0.5">
                    {pqr.clasificacion.tipologia}
                  </span>
                  <span className="text-[10px] text-slate-500">
                    Puntaje: {pqr.clasificacion.puntaje.toFixed(1)} pts
                  </span>
                </div>

                <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
                  <span className="text-[10px] text-slate-400 font-bold block uppercase">
                    Nivel de Prioridad
                  </span>
                  <span className={`text-xs font-bold block mt-0.5 ${pqr.calculoPrioridad.prioridad === 'Alta' ? 'text-rose-600' : pqr.calculoPrioridad.prioridad === 'Media' ? 'text-amber-600' : 'text-emerald-600'}`}>
                    {pqr.calculoPrioridad.prioridad}
                  </span>
                  <span className="text-[10px] text-slate-500">
                    {pqr.calculoPrioridad.escaladoReincidencia ? 'Escaló por reincidencia' : 'Determinada por reglas'}
                  </span>
                </div>

                <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
                  <span className="text-[10px] text-slate-400 font-bold block uppercase">
                    Área Responsable
                  </span>
                  <span className="text-xs font-bold text-slate-800 block mt-0.5">
                    {pqr.enrutamiento.area}
                  </span>
                  <span className="text-[10px] text-slate-500">
                    SLA: {pqr.enrutamiento.slaTexto}
                  </span>
                </div>
              </div>
            ) : (
              /* Panel de Reclasificación Manual del Asesor */
              <div className="p-4 rounded-xl bg-amber-50/70 border border-amber-300 space-y-3">
                <div className="flex items-center gap-2 text-xs font-bold text-amber-900">
                  <AlertCircle className="w-4 h-4 text-amber-600" />
                  <span>Reclasificación Manual por Asesor (Comparativa AS-IS vs TO-BE)</span>
                </div>

                <div className="grid grid-cols-2 gap-3 text-xs">
                  <div>
                    <label className="block text-slate-700 font-bold mb-1">Nueva Tipología:</label>
                    <select
                      value={reclasTipologia}
                      onChange={(e) => setReclasTipologia(e.target.value as Tipologia)}
                      className="w-full p-2 rounded-lg border border-slate-300 bg-white"
                    >
                      <option value="Facturación">Facturación</option>
                      <option value="Calidad / falla del servicio">Calidad / falla del servicio</option>
                      <option value="Otro tipo">Otro tipo</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-slate-700 font-bold mb-1">Nueva Prioridad:</label>
                    <select
                      value={reclasPrioridad}
                      onChange={(e) => setReclasPrioridad(e.target.value as Prioridad)}
                      className="w-full p-2 rounded-lg border border-slate-300 bg-white"
                    >
                      <option value="Alta">Alta</option>
                      <option value="Media">Media</option>
                      <option value="Baja">Baja</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-slate-700 font-bold mb-1 text-xs">
                    Motivo obligatorio de la reclasificación:
                  </label>
                  <input
                    type="text"
                    value={motivoReclas}
                    onChange={(e) => setMotivoReclas(e.target.value)}
                    placeholder="Ej. El usuario anexó pruebas técnicas de transformador quemado"
                    className="w-full px-3 py-1.5 rounded-lg border border-slate-300 bg-white text-xs"
                  />
                </div>

                <div className="flex justify-end gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setModoReclasificacion(false)}
                    className="px-3 py-1.5 rounded-lg border border-slate-300 text-xs text-slate-600 bg-white"
                  >
                    Cancelar
                  </button>
                  <button
                    type="button"
                    onClick={guardarReclasificacion}
                    className="px-3 py-1.5 rounded-lg bg-[#007A3D] text-white text-xs font-bold"
                  >
                    Guardar Reclasificación
                  </button>
                </div>
              </div>
            )}

            {/* Lista detallada de motivos de regla */}
            <div className="pt-2 border-t border-slate-100">
              <span className="text-xs font-bold text-slate-600 uppercase tracking-wider block mb-2">
                Motivos de regla registrados para trazabilidad:
              </span>
              <ul className="space-y-1.5">
                {pqr.calculoPrioridad.motivo_regla.map((motivo, idx) => (
                  <li
                    key={idx}
                    className="text-xs text-slate-700 flex items-start gap-2 bg-slate-50 p-2 rounded-lg border border-slate-200/60"
                  >
                    <ChevronRight className="w-3.5 h-3.5 text-[#007A3D] shrink-0 mt-0.5" />
                    <span>{motivo}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* Descripción con Palabras Clave Resaltadas */}
          <div className="rounded-2xl border border-slate-200 p-5 bg-white shadow-2xs space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                Hechos Descritos por el Usuario
              </h3>
              <span className="text-[11px] text-slate-500">
                Servicio: <strong>{pqr.solicitud.servicio}</strong> · Tipo: <strong>{pqr.solicitud.tipo}</strong>
              </span>
            </div>

            <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-800 leading-relaxed font-sans">
              {renderizarTextoConResaltado(
                pqr.solicitud.descripcion,
                pqr.clasificacion.palabras_detectadas
              )}
            </div>

            {/* Chips de palabras clave detectadas */}
            {pqr.clasificacion.palabras_detectadas.length > 0 && (
              <div className="flex items-center gap-2 flex-wrap pt-1">
                <span className="text-[11px] font-bold text-slate-500">Keywords encontradas:</span>
                {pqr.clasificacion.palabras_detectadas.map((palabra, idx) => (
                  <span
                    key={idx}
                    className="px-2 py-0.5 rounded-md bg-emerald-100/70 text-emerald-800 text-[11px] font-medium border border-emerald-300"
                  >
                    {palabra}
                  </span>
                ))}
              </div>
            )}
          </div>

          {/* Datos del Cliente y Contrato */}
          <div className="rounded-2xl border border-slate-200 p-5 bg-white shadow-2xs space-y-3">
            <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
              Datos del Cliente y Contrato de Servicios
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                <span className="text-slate-400 block font-medium">Titular / Reclamante:</span>
                <span className="font-bold text-slate-800 text-sm mt-0.5 block">
                  {pqr.usuario.nombre}
                </span>
                <span className="text-slate-500">C.C. {pqr.usuario.documento}</span>
              </div>

              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                <span className="text-slate-400 block font-medium">Cuenta / Contrato EPM:</span>
                <span className="font-mono font-bold text-slate-800 text-sm mt-0.5 block">
                  {pqr.usuario.contrato}
                </span>
                <div className="flex items-center gap-1.5 mt-1">
                  <span
                    className={`inline-block w-2 h-2 rounded-full ${
                      pqr.reincidenciasPrevias > 2 ? 'bg-rose-500' : 'bg-emerald-500'
                    }`}
                  />
                  <span className="text-[11px] font-semibold text-slate-600">
                    {pqr.reincidenciasPrevias} PQR registradas en 6 meses
                    {pqr.reincidenciasPrevias > 2 && ' (Reincidente)'}
                  </span>
                </div>
              </div>
            </div>

            <div className="flex flex-wrap gap-4 text-xs text-slate-600 pt-1">
              <div className="flex items-center gap-1.5">
                <Mail className="w-3.5 h-3.5 text-slate-400" />
                <span>{pqr.usuario.correo}</span>
              </div>
              <div className="flex items-center gap-1.5">
                <Phone className="w-3.5 h-3.5 text-slate-400" />
                <span>{pqr.usuario.telefono}</span>
              </div>
            </div>
          </div>

          {/* Historial y Bitácora de la PQR */}
          <div className="rounded-2xl border border-slate-200 p-5 bg-white shadow-2xs space-y-3">
            <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
              Bitácora de Estados y Auditoría
            </h3>

            <div className="space-y-3">
              {pqr.historial.map((item, idx) => (
                <div key={idx} className="flex gap-3 text-xs">
                  <div className="flex flex-col items-center">
                    <div className="w-2 h-2 rounded-full bg-[#007A3D]" />
                    {idx < pqr.historial.length - 1 && (
                      <div className="w-0.5 flex-1 bg-slate-200 my-1" />
                    )}
                  </div>
                  <div className="flex-1 pb-1">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-slate-800">
                        {item.estado}
                      </span>
                      <span className="text-[10px] text-slate-400">
                        {formatearFechaColombia(item.fecha)}
                      </span>
                    </div>
                    <p className="text-slate-600 mt-0.5">{item.nota}</p>
                    {item.asesor && (
                      <p className="text-[10px] text-slate-400 font-medium">
                        Por: {item.asesor}
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Gestión del Asesor: Actualización de Estado */}
          <div className="rounded-2xl border border-slate-200 p-5 bg-emerald-50/50 space-y-3">
            <h3 className="text-xs font-bold text-[#007A3D] uppercase tracking-wider flex items-center gap-1.5">
              <Save className="w-4 h-4" />
              <span>Acciones del Asesor en Cola</span>
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {(['En gestión', 'Resuelta', 'Escalada'] as EstadoPQR[]).map((est) => (
                <button
                  key={est}
                  type="button"
                  onClick={() => setNuevoEstado(est)}
                  className={`py-2 px-3 rounded-xl border text-xs font-bold transition-all cursor-pointer ${
                    nuevoEstado === est
                      ? 'border-[#007A3D] bg-white text-[#007A3D] shadow-xs ring-2 ring-emerald-200'
                      : 'border-slate-200 bg-white/70 text-slate-600 hover:bg-white'
                  }`}
                >
                  {est}
                </button>
              ))}
            </div>

            <div>
              <label htmlFor="nota-asesor" className="block text-xs font-bold text-slate-700 mb-1">
                Nota de gestión o resolución:
              </label>
              <textarea
                id="nota-asesor"
                rows={2}
                value={notaEstado}
                onChange={(e) => setNotaEstado(e.target.value)}
                placeholder="Describa la acción tomada o respuesta remitida al usuario..."
                className="w-full px-3 py-2 rounded-xl border border-slate-300 bg-white text-xs focus:ring-2 focus:ring-emerald-200 focus:outline-none"
              />
            </div>

            <div className="flex justify-end pt-1">
              <button
                type="button"
                onClick={guardarCambioEstado}
                className="px-4 py-2 rounded-xl bg-[#007A3D] hover:bg-[#005a2c] text-white text-xs font-bold shadow-xs transition-colors cursor-pointer"
              >
                Actualizar Estado y Guardar
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
