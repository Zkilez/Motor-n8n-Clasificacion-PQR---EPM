/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * EPM · Pantalla 3: Bandeja de Entrada del Área Responsable (Asesor Interno)
 */

import React, { useState } from 'react';
import {
  AreaResponsable,
  EstadoPQR,
  EstadisticasCola,
  PQR,
  Prioridad,
  Tipologia,
} from '../types';
import {
  calcularEstadoSLA,
  formatearFechaColombia,
  formatearTiempoTranscurrido,
  obtenerEstiloEstado,
  obtenerEstiloPrioridad,
  obtenerEstiloTipologia,
} from '../utils/formato';
import {
  Search,
  Filter,
  AlertTriangle,
  Clock,
  Layers,
  Building,
  User,
  Eye,
  SlidersHorizontal,
  Flame,
  Zap,
  Droplets,
  RotateCcw,
  Sparkles,
  ArrowUpDown,
} from 'lucide-react';

interface BandejaAsesorProps {
  pqrs: PQR[];
  estadisticas: EstadisticasCola;
  alSeleccionarPQR: (pqr: PQR) => void;
  filtroArea: AreaResponsable | 'Todas';
  setFiltroArea: (area: AreaResponsable | 'Todas') => void;
  filtroPrioridad: Prioridad | 'Todas';
  setFiltroPrioridad: (prioridad: Prioridad | 'Todas') => void;
  filtroTipologia: Tipologia | 'Todas';
  setFiltroTipologia: (tipologia: Tipologia | 'Todas') => void;
  filtroEstado: EstadoPQR | 'Todos';
  setFiltroEstado: (estado: EstadoPQR | 'Todos') => void;
  busqueda: string;
  setBusqueda: (busqueda: string) => void;
  alLimpiarFiltros: () => void;
}

export const BandejaAsesor: React.FC<BandejaAsesorProps> = ({
  pqrs,
  estadisticas,
  alSeleccionarPQR,
  filtroArea,
  setFiltroArea,
  filtroPrioridad,
  setFiltroPrioridad,
  filtroTipologia,
  setFiltroTipologia,
  filtroEstado,
  setFiltroEstado,
  busqueda,
  setBusqueda,
  alLimpiarFiltros,
}) => {
  const getIconoServicio = (servicio: string) => {
    switch (servicio) {
      case 'Energia':
        return <Zap className="w-3.5 h-3.5 text-amber-500" />;
      case 'Agua':
        return <Droplets className="w-3.5 h-3.5 text-blue-500" />;
      case 'Gas':
        return <Flame className="w-3.5 h-3.5 text-orange-500" />;
      default:
        return null;
    }
  };

  return (
    <div className="space-y-6">
      {/* Indicadores Clave de Desempeño (KPIs) en la parte superior */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        {/* KPI 1: Total en cola */}
        <div className="bg-white p-4 rounded-2xl border border-slate-200/90 shadow-2xs">
          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
            Total en Cola
          </span>
          <div className="flex items-baseline gap-2 mt-1">
            <span className="text-2xl font-extrabold text-slate-900 tracking-tight">
              {estadisticas.total}
            </span>
            <span className="text-[11px] text-slate-500">PQR</span>
          </div>
          <span className="text-[10px] text-emerald-700 font-semibold block mt-1">
            100% enrutadas
          </span>
        </div>

        {/* KPI 2: Prioridad Alta */}
        <div className="bg-white p-4 rounded-2xl border border-rose-200/90 bg-rose-50/20 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-rose-700 uppercase tracking-wider block">
              Prioridad Alta
            </span>
            <span className="w-2 h-2 rounded-full bg-rose-600 animate-pulse" />
          </div>
          <div className="flex items-baseline gap-2 mt-1">
            <span className="text-2xl font-extrabold text-rose-700 tracking-tight">
              {estadisticas.alta}
            </span>
            <span className="text-[11px] text-rose-600 font-medium">Críticas</span>
          </div>
          <span className="text-[10px] text-rose-600 font-medium block mt-1">
            SLA: 4 horas
          </span>
        </div>

        {/* KPI 3: Prioridad Media */}
        <div className="bg-white p-4 rounded-2xl border border-amber-200/90 bg-amber-50/20 shadow-2xs">
          <span className="text-[11px] font-bold text-amber-800 uppercase tracking-wider block">
            Prioridad Media
          </span>
          <div className="flex items-baseline gap-2 mt-1">
            <span className="text-2xl font-extrabold text-amber-800 tracking-tight">
              {estadisticas.media}
            </span>
            <span className="text-[11px] text-amber-700">Casos</span>
          </div>
          <span className="text-[10px] text-amber-700 font-medium block mt-1">
            SLA: 48 horas
          </span>
        </div>

        {/* KPI 4: Prioridad Baja */}
        <div className="bg-white p-4 rounded-2xl border border-slate-200/90 shadow-2xs">
          <span className="text-[11px] font-bold text-emerald-800 uppercase tracking-wider block">
            Prioridad Baja
          </span>
          <div className="flex items-baseline gap-2 mt-1">
            <span className="text-2xl font-extrabold text-slate-800 tracking-tight">
              {estadisticas.baja}
            </span>
            <span className="text-[11px] text-slate-500">Casos</span>
          </div>
          <span className="text-[10px] text-slate-500 font-medium block mt-1">
            SLA: 5 días hábiles
          </span>
        </div>

        {/* KPI 5: Indicador Clave de Calibración: % Otro tipo */}
        <div
          className={`p-4 rounded-2xl border shadow-2xs transition-all ${
            estadisticas.porcentajeOtroTipo > 25
              ? 'bg-amber-50 border-amber-300'
              : 'bg-white border-slate-200/90'
          }`}
          title="Porcentaje de PQR que no alcanzaron las reglas específicas y fueron a Atención al Cliente"
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-700 uppercase tracking-wider block">
              % "Otro tipo"
            </span>
            {estadisticas.porcentajeOtroTipo > 25 && (
              <AlertTriangle className="w-3.5 h-3.5 text-amber-600" />
            )}
          </div>
          <div className="flex items-baseline gap-2 mt-1">
            <span
              className={`text-2xl font-extrabold tracking-tight ${
                estadisticas.porcentajeOtroTipo > 25 ? 'text-amber-800' : 'text-slate-800'
              }`}
            >
              {estadisticas.porcentajeOtroTipo}%
            </span>
          </div>
          <span className="text-[10px] text-slate-500 block mt-1 leading-tight">
            {estadisticas.porcentajeOtroTipo > 25
              ? 'Requiere afinar reglas'
              : 'Rango óptimo (<25%)'}
          </span>
        </div>

        {/* KPI 6: SLA en Riesgo / Vencidas */}
        <div className="bg-white p-4 rounded-2xl border border-slate-200/90 shadow-2xs">
          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
            Alertas SLA
          </span>
          <div className="flex items-baseline gap-1.5 mt-1">
            <span className="text-2xl font-extrabold text-rose-600 tracking-tight">
              {estadisticas.vencidasSLA + estadisticas.enRiesgoSLA}
            </span>
            <span className="text-[11px] text-slate-500">en riesgo</span>
          </div>
          <span className="text-[10px] text-slate-500 font-medium block mt-1">
            {estadisticas.vencidasSLA} vencidas · {estadisticas.enRiesgoSLA} próximas
          </span>
        </div>
      </div>

      {/* Barra de Filtros y Búsqueda */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs space-y-3">
        <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
          {/* Campo de búsqueda */}
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={busqueda}
              onChange={(e) => setBusqueda(e.target.value)}
              placeholder="Buscar por radicado, nombre de usuario, documento, contrato o hecho..."
              className="w-full pl-9 pr-4 py-2 rounded-xl border border-slate-300 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:border-[#007A3D] focus:ring-2 focus:ring-emerald-100 transition-all"
            />
          </div>

          {/* Botón de limpiar filtros si hay alguno activo */}
          {(filtroArea !== 'Todas' ||
            filtroPrioridad !== 'Todas' ||
            filtroTipologia !== 'Todas' ||
            filtroEstado !== 'Todos' ||
            busqueda) && (
            <button
              type="button"
              onClick={alLimpiarFiltros}
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold text-rose-700 bg-rose-50 border border-rose-200 hover:bg-rose-100 transition-colors cursor-pointer shrink-0"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Limpiar filtros</span>
            </button>
          )}
        </div>

        {/* Dropdowns de filtro */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1 border-t border-slate-100 text-xs">
          {/* Filtro por Área */}
          <div>
            <label className="block text-[11px] font-bold text-slate-500 mb-1">
              Área Responsable:
            </label>
            <select
              value={filtroArea}
              onChange={(e) => setFiltroArea(e.target.value as any)}
              className="w-full px-2.5 py-1.5 rounded-lg border border-slate-300 bg-white text-slate-700 focus:outline-none focus:border-[#007A3D]"
            >
              <option value="Todas">Todas las áreas</option>
              <option value="Área de facturación">Área de facturación</option>
              <option value="Área operativa / Campo">Área operativa / Campo</option>
              <option value="Atención al cliente">Atención al cliente</option>
            </select>
          </div>

          {/* Filtro por Prioridad */}
          <div>
            <label className="block text-[11px] font-bold text-slate-500 mb-1">
              Prioridad:
            </label>
            <select
              value={filtroPrioridad}
              onChange={(e) => setFiltroPrioridad(e.target.value as any)}
              className="w-full px-2.5 py-1.5 rounded-lg border border-slate-300 bg-white text-slate-700 focus:outline-none focus:border-[#007A3D]"
            >
              <option value="Todas">Todas las prioridades</option>
              <option value="Alta">Alta (Crítico)</option>
              <option value="Media">Media</option>
              <option value="Baja">Baja</option>
            </select>
          </div>

          {/* Filtro por Tipología */}
          <div>
            <label className="block text-[11px] font-bold text-slate-500 mb-1">
              Tipología detectada:
            </label>
            <select
              value={filtroTipologia}
              onChange={(e) => setFiltroTipologia(e.target.value as any)}
              className="w-full px-2.5 py-1.5 rounded-lg border border-slate-300 bg-white text-slate-700 focus:outline-none focus:border-[#007A3D]"
            >
              <option value="Todas">Todas las tipologías</option>
              <option value="Facturación">Facturación</option>
              <option value="Calidad / falla del servicio">Calidad / falla del servicio</option>
              <option value="Otro tipo">Otro tipo</option>
            </select>
          </div>

          {/* Filtro por Estado */}
          <div>
            <label className="block text-[11px] font-bold text-slate-500 mb-1">
              Estado en cola:
            </label>
            <select
              value={filtroEstado}
              onChange={(e) => setFiltroEstado(e.target.value as any)}
              className="w-full px-2.5 py-1.5 rounded-lg border border-slate-300 bg-white text-slate-700 focus:outline-none focus:border-[#007A3D]"
            >
              <option value="Todos">Todos los estados</option>
              <option value="Radicada">Radicada</option>
              <option value="En gestión">En gestión</option>
              <option value="Resuelta">Resuelta</option>
              <option value="Escalada">Escalada</option>
            </select>
          </div>
        </div>
      </div>

      {/* Tabla de la Cola del Área Responsable */}
      <div className="bg-white rounded-3xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-slate-800 uppercase tracking-wider">
              Solicitudes en Cola ({pqrs.length})
            </span>
            <span className="text-[11px] text-slate-400 font-medium">
              • Orden automático: Prioridad (Alta primero) y luego antigüedad
            </span>
          </div>

          <span className="text-[11px] text-[#007A3D] font-medium hidden sm:inline">
            Haz clic en cualquier fila para abrir la auditoría completa
          </span>
        </div>

        {pqrs.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50/80 text-[11px] font-bold uppercase tracking-wider text-slate-500 border-b border-slate-200/80">
                  <th className="py-3 px-4">Radicado & Fecha</th>
                  <th className="py-3 px-4">Usuario / Contrato</th>
                  <th className="py-3 px-4">Servicio & Trámite</th>
                  <th className="py-3 px-4">Tipología</th>
                  <th className="py-3 px-4">Prioridad & Ruta</th>
                  <th className="py-3 px-4">Área Responsable</th>
                  <th className="py-3 px-4">SLA Restante</th>
                  <th className="py-3 px-4">Estado</th>
                  <th className="py-3 px-4 text-center">Acción</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs">
                {pqrs.map((pqr) => {
                  const estiloPrio = obtenerEstiloPrioridad(pqr.calculoPrioridad.prioridad);
                  const estiloTipo = obtenerEstiloTipologia(pqr.clasificacion.tipologia);
                  const estadoSLA = calcularEstadoSLA(
                    pqr.enrutamiento.fechaLimiteSLA,
                    pqr.enrutamiento.slaHoras
                  );

                  return (
                    <tr
                      key={pqr.id}
                      onClick={() => alSeleccionarPQR(pqr)}
                      className="hover:bg-slate-50/90 transition-colors cursor-pointer group"
                    >
                      {/* Radicado y Fecha */}
                      <td className="py-3.5 px-4 font-mono font-bold text-slate-900 whitespace-nowrap">
                        <div className="flex flex-col">
                          <span className="group-hover:text-[#007A3D] transition-colors">
                            {pqr.id}
                          </span>
                          <span className="text-[11px] font-sans font-normal text-slate-400">
                            {formatearTiempoTranscurrido(pqr.fechaCreacion)}
                          </span>
                        </div>
                      </td>

                      {/* Usuario y Contrato */}
                      <td className="py-3.5 px-4">
                        <div className="flex flex-col max-w-[160px]">
                          <span className="font-semibold text-slate-800 truncate" title={pqr.usuario.nombre}>
                            {pqr.usuario.nombre}
                          </span>
                          <span className="text-[11px] text-slate-500 font-mono">
                            Cta: {pqr.usuario.contrato}
                            {pqr.reincidenciasPrevias > 2 && (
                              <span className="ml-1 text-[10px] text-rose-600 font-sans font-bold">
                                (Reincidente)
                              </span>
                            )}
                          </span>
                        </div>
                      </td>

                      {/* Servicio y Tipo */}
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <div className="flex items-center gap-1.5 font-medium text-slate-700">
                          {getIconoServicio(pqr.solicitud.servicio)}
                          <span>{pqr.solicitud.servicio}</span>
                        </div>
                        <span className="text-[10px] text-slate-400 block">
                          {pqr.solicitud.tipo}
                        </span>
                      </td>

                      {/* Tipología */}
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <span className={`inline-flex items-center px-2 py-0.5 rounded-lg border text-[11px] font-medium ${estiloTipo.badge}`}>
                          {pqr.clasificacion.tipologia}
                        </span>
                      </td>

                      {/* Prioridad y Ruta */}
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <div className="flex flex-col gap-0.5">
                          <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-lg border text-[11px] w-fit ${estiloPrio.badge}`}>
                            <span className={`w-1.5 h-1.5 rounded-full ${estiloPrio.dot}`} />
                            {pqr.calculoPrioridad.prioridad}
                          </span>
                          <span className="text-[10px] text-slate-500">
                            {pqr.enrutamiento.ruta}
                          </span>
                        </div>
                      </td>

                      {/* Área Responsable */}
                      <td className="py-3.5 px-4 whitespace-nowrap text-slate-700 font-medium">
                        {pqr.enrutamiento.area}
                      </td>

                      {/* SLA Restante */}
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <div className="flex flex-col">
                          <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md border text-[11px] font-bold w-fit ${estadoSLA.color}`}>
                            <span className={`w-1.5 h-1.5 rounded-full ${estadoSLA.badgeColor}`} />
                            {estadoSLA.texto}
                          </span>
                          <span className="text-[10px] text-slate-400 mt-0.5 font-mono">
                            Total: {pqr.enrutamiento.slaTexto}
                          </span>
                        </div>
                      </td>

                      {/* Estado */}
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <span className={`px-2 py-0.5 rounded-lg text-[11px] font-bold border ${obtenerEstiloEstado(pqr.estado)}`}>
                          {pqr.estado}
                        </span>
                      </td>

                      {/* Acción */}
                      <td className="py-3.5 px-4 text-center whitespace-nowrap">
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            alSeleccionarPQR(pqr);
                          }}
                          className="p-1.5 rounded-lg bg-slate-100 hover:bg-[#007A3D] text-slate-600 hover:text-white transition-colors cursor-pointer"
                          title="Abrir auditoría y trazabilidad"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="py-12 px-4 text-center space-y-3">
            <div className="w-12 h-12 rounded-full bg-slate-100 text-slate-400 flex items-center justify-center mx-auto">
              <Filter className="w-6 h-6" />
            </div>
            <h3 className="text-sm font-bold text-slate-800">
              No se encontraron PQR con los filtros seleccionados
            </h3>
            <p className="text-xs text-slate-500 max-w-sm mx-auto">
              Intenta cambiar los términos de búsqueda o limpiar los filtros para visualizar toda la cola de solicitudes.
            </p>
            <button
              type="button"
              onClick={alLimpiarFiltros}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold bg-[#007A3D] text-white cursor-pointer"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Ver todas las PQR</span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
