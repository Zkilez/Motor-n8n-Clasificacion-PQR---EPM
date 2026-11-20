/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * EPM · Calibrador y Simulador Interactivo del Motor de Reglas
 * Permite visualizar, afinar parámetros y simular clasificaciones en tiempo real.
 */

import React, { useState } from 'react';
import {
  actualizarConfiguracion,
  obtenerConfiguracion,
  restablecerConfiguracion,
} from '../backend/reglas/config';
import { simularClasificacion } from '../backend/api';
import { ReglasConfiguracion, ServicioPublico, TipoSolicitud } from '../types';
import {
  Sliders,
  Sparkles,
  Zap,
  Tag,
  ShieldCheck,
  Plus,
  Trash2,
  RotateCcw,
  CheckCircle2,
  Calendar,
  Clock,
  Layers,
  Building,
  HelpCircle,
  FileSpreadsheet,
} from 'lucide-react';

export const SimuladorReglas: React.FC = () => {
  const [config, setConfig] = useState<ReglasConfiguracion>(obtenerConfiguracion());
  const [nuevaPalabraFacturacion, setNuevaPalabraFacturacion] = useState('');
  const [nuevaPalabraCalidad, setNuevaPalabraCalidad] = useState('');
  const [guardadoExitoso, setGuardadoExitoso] = useState(false);

  // Estado del Simulador en Vivo
  const [simTexto, setSimTexto] = useState(
    'Me llegó la factura con cobro triplicado del consumo de agua y el medidor gira sin control.'
  );
  const [simTipo, setSimTipo] = useState<TipoSolicitud>('Reclamo');
  const [simServicio, setSimServicio] = useState<ServicioPublico>('Agua');
  const [simSuspendido, setSimSuspendido] = useState(false);
  const [simColectivo, setSimColectivo] = useState(false);
  const [simVulnerable, setSimVulnerable] = useState(false);
  const [simEsencial, setSimEsencial] = useState(false);
  const [simReincidencias, setSimReincidencias] = useState(0);

  // Ejecutar simulación en caliente
  const resultadoSimulacion = simularClasificacion(
    {
      tipo: simTipo,
      servicio: simServicio,
      descripcion: simTexto,
      condiciones: {
        servicioSuspendido: simSuspendido,
        afectaVariosUsuarios: simColectivo,
        poblacionVulnerable: simVulnerable,
        servicioEsencial: simEsencial,
      },
    },
    simReincidencias
  );

  const agregarPalabraFacturacion = () => {
    if (!nuevaPalabraFacturacion.trim()) return;
    const palabra = nuevaPalabraFacturacion.trim().toLowerCase();
    if (!config.palabrasClaveFacturacion.includes(palabra)) {
      const nueva = [...config.palabrasClaveFacturacion, palabra];
      const actualizada = actualizarConfiguracion({ palabrasClaveFacturacion: nueva });
      setConfig(actualizada);
      mostrarFeedback();
    }
    setNuevaPalabraFacturacion('');
  };

  const eliminarPalabraFacturacion = (palabra: string) => {
    const nueva = config.palabrasClaveFacturacion.filter((p) => p !== palabra);
    const actualizada = actualizarConfiguracion({ palabrasClaveFacturacion: nueva });
    setConfig(actualizada);
    mostrarFeedback();
  };

  const agregarPalabraCalidad = () => {
    if (!nuevaPalabraCalidad.trim()) return;
    const palabra = nuevaPalabraCalidad.trim().toLowerCase();
    if (!config.palabrasClaveCalidad.includes(palabra)) {
      const nueva = [...config.palabrasClaveCalidad, palabra];
      const actualizada = actualizarConfiguracion({ palabrasClaveCalidad: nueva });
      setConfig(actualizada);
      mostrarFeedback();
    }
    setNuevaPalabraCalidad('');
  };

  const eliminarPalabraCalidad = (palabra: string) => {
    const nueva = config.palabrasClaveCalidad.filter((p) => p !== palabra);
    const actualizada = actualizarConfiguracion({ palabrasClaveCalidad: nueva });
    setConfig(actualizada);
    mostrarFeedback();
  };

  const reiniciarValoresFabrica = () => {
    const restablecida = restablecerConfiguracion();
    setConfig(restablecida);
    mostrarFeedback();
  };

  const mostrarFeedback = () => {
    setGuardadoExitoso(true);
    setTimeout(() => setGuardadoExitoso(false), 2000);
  };

  return (
    <div className="space-y-8 max-w-6xl mx-auto">
      {/* Encabezado */}
      <div className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-7 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-[#007A3D] text-white flex items-center justify-center shadow-sm">
              <Sliders className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-900 tracking-tight">
                Motor de Reglas & Calibrador de Parámetros
              </h2>
              <p className="text-xs text-slate-500">
                Archivo editable <code className="font-mono text-[#007A3D]">/src/backend/reglas/config.ts</code> con trazabilidad y calibración en vivo.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {guardadoExitoso && (
              <span className="text-xs font-semibold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-lg border border-emerald-200 animate-fade-in flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5" />
                Reglas actualizadas
              </span>
            )}
            <button
              type="button"
              onClick={reiniciarValoresFabrica}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-300 text-xs font-semibold text-slate-700 hover:bg-slate-50 cursor-pointer"
            >
              <RotateCcw className="w-3.5 h-3.5 text-slate-500" />
              <span>Valores por defecto</span>
            </button>
          </div>
        </div>
      </div>

      {/* Probador / Simulador en Tiempo Real */}
      <div className="bg-white rounded-3xl border border-emerald-200 shadow-sm p-6 sm:p-7 space-y-5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-[#007A3D]" />
            <h3 className="text-base font-bold text-slate-900 tracking-tight">
              Simulador de Reglas en Vivo (Auditoría Inmediata)
            </h3>
          </div>
          <span className="text-xs font-semibold text-emerald-800 bg-emerald-50 px-2.5 py-1 rounded-lg border border-emerald-200">
            Procesamiento en tiempo real
          </span>
        </div>

        {/* Formulario rápido de simulación */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
          <div className="lg:col-span-7 space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Escribe un texto o reclamo para probar la clasificación:
              </label>
              <textarea
                rows={3}
                value={simTexto}
                onChange={(e) => setSimTexto(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs text-slate-800 focus:border-[#007A3D] focus:ring-2 focus:ring-emerald-100 focus:outline-none resize-none font-sans"
                placeholder="Escribe aquí un caso para clasificar..."
              />
            </div>

            {/* Parámetros de simulación */}
            <div className="grid grid-cols-3 gap-2 text-xs">
              <div>
                <label className="block text-[11px] font-bold text-slate-500 mb-1">Tipo:</label>
                <select
                  value={simTipo}
                  onChange={(e) => setSimTipo(e.target.value as TipoSolicitud)}
                  className="w-full p-2 rounded-lg border border-slate-300 bg-white text-xs"
                >
                  <option value="Reclamo">Reclamo</option>
                  <option value="Queja">Queja</option>
                  <option value="Peticion">Petición</option>
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-500 mb-1">Servicio:</label>
                <select
                  value={simServicio}
                  onChange={(e) => setSimServicio(e.target.value as ServicioPublico)}
                  className="w-full p-2 rounded-lg border border-slate-300 bg-white text-xs"
                >
                  <option value="Agua">Agua</option>
                  <option value="Energia">Energía</option>
                  <option value="Gas">Gas</option>
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-500 mb-1">PQR previas (6m):</label>
                <input
                  type="number"
                  min="0"
                  max="10"
                  value={simReincidencias}
                  onChange={(e) => setSimReincidencias(parseInt(e.target.value, 10) || 0)}
                  className="w-full p-2 rounded-lg border border-slate-300 bg-white text-xs font-mono"
                />
              </div>
            </div>

            {/* Switches de impacto */}
            <div className="grid grid-cols-2 gap-2 text-xs">
              <label className="flex items-center gap-2 p-2.5 rounded-lg border border-slate-200 bg-slate-50 cursor-pointer">
                <input
                  type="checkbox"
                  checked={simSuspendido}
                  onChange={(e) => setSimSuspendido(e.target.checked)}
                  className="rounded text-[#007A3D]"
                />
                <span className="font-medium text-slate-700">Servicio suspendido</span>
              </label>

              <label className="flex items-center gap-2 p-2.5 rounded-lg border border-slate-200 bg-slate-50 cursor-pointer">
                <input
                  type="checkbox"
                  checked={simColectivo}
                  onChange={(e) => setSimColectivo(e.target.checked)}
                  className="rounded text-[#007A3D]"
                />
                <span className="font-medium text-slate-700">Afecta a varios usuarios</span>
              </label>

              <label className="flex items-center gap-2 p-2.5 rounded-lg border border-slate-200 bg-slate-50 cursor-pointer">
                <input
                  type="checkbox"
                  checked={simVulnerable}
                  onChange={(e) => setSimVulnerable(e.target.checked)}
                  className="rounded text-[#007A3D]"
                />
                <span className="font-medium text-slate-700">Población vulnerable</span>
              </label>

              <label className="flex items-center gap-2 p-2.5 rounded-lg border border-slate-200 bg-slate-50 cursor-pointer">
                <input
                  type="checkbox"
                  checked={simEsencial}
                  onChange={(e) => setSimEsencial(e.target.checked)}
                  className="rounded text-[#007A3D]"
                />
                <span className="font-medium text-slate-700">Servicio esencial (Hospital)</span>
              </label>
            </div>
          </div>

          {/* Resultado de la simulación en tiempo real */}
          <div className="lg:col-span-5 bg-slate-50 rounded-2xl border border-slate-200 p-4 space-y-3">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
              Salida generada por el motor:
            </span>

            <div className="space-y-2">
              <div className="p-3 bg-white rounded-xl border border-slate-200">
                <span className="text-[10px] text-slate-400 font-bold block uppercase">
                  Tipología clasificada
                </span>
                <span className="text-sm font-bold text-slate-900 block mt-0.5">
                  {resultadoSimulacion.clasificacion.tipologia}
                </span>
                <span className="text-[11px] text-slate-500">
                  Puntaje: {resultadoSimulacion.clasificacion.puntaje.toFixed(1)} pts
                </span>
              </div>

              <div className="p-3 bg-white rounded-xl border border-slate-200">
                <span className="text-[10px] text-slate-400 font-bold block uppercase">
                  Prioridad calculada
                </span>
                <span
                  className={`text-sm font-bold block mt-0.5 ${
                    resultadoSimulacion.calculoPrioridad.prioridad === 'Alta'
                      ? 'text-rose-600'
                      : resultadoSimulacion.calculoPrioridad.prioridad === 'Media'
                      ? 'text-amber-600'
                      : 'text-emerald-600'
                  }`}
                >
                  {resultadoSimulacion.calculoPrioridad.prioridad}
                </span>
                <span className="text-[11px] text-slate-500 block">
                  Ruta: {resultadoSimulacion.enrutamiento.ruta}
                </span>
              </div>

              <div className="p-3 bg-white rounded-xl border border-slate-200">
                <span className="text-[10px] text-slate-400 font-bold block uppercase">
                  Área asignada y SLA
                </span>
                <span className="text-sm font-bold text-slate-900 block mt-0.5">
                  {resultadoSimulacion.enrutamiento.area}
                </span>
                <span className="text-[11px] text-slate-500">
                  SLA: {resultadoSimulacion.enrutamiento.slaTexto}
                </span>
              </div>
            </div>

            {/* Motivos disparados */}
            <div className="pt-1">
              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-1">
                Motivos disparados:
              </span>
              <ul className="text-[11px] text-slate-600 space-y-1">
                {resultadoSimulacion.calculoPrioridad.motivo_regla.map((m, i) => (
                  <li key={i} className="flex items-start gap-1.5">
                    <span className="w-1 h-1 rounded-full bg-[#007A3D] mt-1.5 shrink-0" />
                    <span>{m}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </div>

      {/* Editor de Palabras Clave */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Palabras Clave: Facturación */}
        <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Tag className="w-4 h-4 text-blue-600" />
              <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
                Palabras Clave: Facturación ({config.palabrasClaveFacturacion.length})
              </h3>
            </div>
            <span className="text-xs text-slate-400">Enruta a Facturación</span>
          </div>

          {/* Input para agregar nueva palabra */}
          <div className="flex gap-2">
            <input
              type="text"
              value={nuevaPalabraFacturacion}
              onChange={(e) => setNuevaPalabraFacturacion(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && agregarPalabraFacturacion()}
              placeholder="Nueva palabra o frase..."
              className="flex-1 px-3 py-1.5 text-xs rounded-xl border border-slate-300 focus:outline-none focus:border-blue-500"
            />
            <button
              type="button"
              onClick={agregarPalabraFacturacion}
              className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition-colors cursor-pointer inline-flex items-center gap-1"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Agregar</span>
            </button>
          </div>

          {/* Chips con opción de eliminar */}
          <div className="flex flex-wrap gap-1.5 max-h-56 overflow-y-auto p-1">
            {config.palabrasClaveFacturacion.map((palabra) => (
              <span
                key={palabra}
                className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-blue-50 border border-blue-200 text-blue-800 text-xs font-medium"
              >
                <span>{palabra}</span>
                <button
                  type="button"
                  onClick={() => eliminarPalabraFacturacion(palabra)}
                  className="hover:text-rose-600 cursor-pointer ml-0.5"
                  title="Eliminar palabra clave"
                >
                  <Trash2 className="w-3 h-3" />
                </button>
              </span>
            ))}
          </div>
        </div>

        {/* Palabras Clave: Calidad / Falla del Servicio */}
        <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Zap className="w-4 h-4 text-orange-600" />
              <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
                Palabras Clave: Calidad / Falla ({config.palabrasClaveCalidad.length})
              </h3>
            </div>
            <span className="text-xs text-slate-400">Enruta a Operativa / Campo</span>
          </div>

          {/* Input para agregar nueva palabra */}
          <div className="flex gap-2">
            <input
              type="text"
              value={nuevaPalabraCalidad}
              onChange={(e) => setNuevaPalabraCalidad(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && agregarPalabraCalidad()}
              placeholder="Nueva palabra o falla..."
              className="flex-1 px-3 py-1.5 text-xs rounded-xl border border-slate-300 focus:outline-none focus:border-orange-500"
            />
            <button
              type="button"
              onClick={agregarPalabraCalidad}
              className="px-3 py-1.5 bg-orange-600 hover:bg-orange-700 text-white rounded-xl text-xs font-bold transition-colors cursor-pointer inline-flex items-center gap-1"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Agregar</span>
            </button>
          </div>

          {/* Chips con opción de eliminar */}
          <div className="flex flex-wrap gap-1.5 max-h-56 overflow-y-auto p-1">
            {config.palabrasClaveCalidad.map((palabra) => (
              <span
                key={palabra}
                className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-orange-50 border border-orange-200 text-orange-800 text-xs font-medium"
              >
                <span>{palabra}</span>
                <button
                  type="button"
                  onClick={() => eliminarPalabraCalidad(palabra)}
                  className="hover:text-rose-600 cursor-pointer ml-0.5"
                  title="Eliminar palabra clave"
                >
                  <Trash2 className="w-3 h-3" />
                </button>
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* Parámetros Legales y Festivos Colombia 2026 */}
      <div className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-7 shadow-xs space-y-4">
        <div className="flex items-center gap-2">
          <Calendar className="w-4 h-4 text-[#007A3D]" />
          <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
            Marco Legal y Calendario de Festivos Oficiales Colombia 2026 (Ley Emiliani)
          </h3>
        </div>
        <p className="text-xs text-slate-500 leading-relaxed">
          De acuerdo con la <strong>Ley 142 de 1994</strong> y el <strong>CPACA</strong>, el término legal perentorio para responder PQR en Colombia es de <strong>15 días hábiles</strong>. El motor excluye sábados, domingos y los 18 festivos oficiales colombianos de 2026:
        </p>

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-2 text-xs">
          {config.festivosColombia2026.map((f) => (
            <div key={f} className="p-2 rounded-xl bg-slate-50 border border-slate-200 font-mono text-center">
              <span className="font-bold text-slate-700">{f}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
