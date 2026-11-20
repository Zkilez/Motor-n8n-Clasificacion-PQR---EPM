/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * EPM · Header Institucional y Barra de Navegación
 */

import React from 'react';
import {
  FileText,
  Inbox,
  Sliders,
  RotateCcw,
  ShieldCheck,
  Building2,
  Sparkles,
  Workflow,
} from 'lucide-react';

export type VistaActiva = 'ciudadano' | 'asesor' | 'reglas' | 'n8n';

interface HeaderProps {
  vistaActiva: VistaActiva;
  setVistaActiva: (vista: VistaActiva) => void;
  totalEnCola: number;
  alReiniciarDemo: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  vistaActiva,
  setVistaActiva,
  totalEnCola,
  alReiniciarDemo,
}) => {
  return (
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-slate-200 shadow-xs">
      {/* Barra superior de identidad corporativa EPM */}
      <div className="bg-[#007A3D] text-white text-xs py-1.5 px-4 sm:px-8">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2 font-medium tracking-wide">
            <span className="inline-block w-2 h-2 rounded-full bg-emerald-300 animate-pulse" />
            <span>Empresas Públicas de Medellín E.S.P. · Innovación en Atención al Cliente</span>
          </div>
          <div className="hidden md:flex items-center gap-4 text-emerald-100 text-xs">
            <span>Canal Institucional de PQR</span>
            <span>•</span>
            <span>Ley 142 de 1994 (Término legal 15 días hábiles)</span>
          </div>
        </div>
      </div>

      {/* Contenido principal del Header */}
      <div className="max-w-7xl mx-auto px-4 sm:px-8 py-3.5">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          {/* Logo y título */}
          <div className="flex items-center gap-3.5">
            <div className="w-11 h-11 rounded-xl bg-[#007A3D] text-white flex items-center justify-center shadow-md shadow-[#007A3D]/20 ring-2 ring-emerald-600/30">
              {/* Isotipo estilizado EPM */}
              <div className="font-extrabold tracking-tighter text-lg leading-none">
                epm
              </div>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl font-bold text-slate-900 tracking-tight">
                  Clasificación Inteligente de PQR
                </h1>
                <span className="hidden sm:inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-full bg-emerald-50 text-[#007A3D] border border-emerald-200">
                  <ShieldCheck className="w-3 h-3 text-[#007A3D]" />
                  Modelo TO-BE
                </span>
              </div>
              <p className="text-xs text-slate-500 font-medium">
                Motor de reglas explicable · Cálculo de prioridad, SLA y enrutamiento automatizado
              </p>
            </div>
          </div>

          {/* Navegación y selector de rol */}
          <div className="flex items-center flex-wrap gap-2">
            <div className="inline-flex p-1 rounded-xl bg-slate-100 border border-slate-200 shadow-inner">
              <button
                type="button"
                onClick={() => setVistaActiva('ciudadano')}
                className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-semibold transition-all ${
                  vistaActiva === 'ciudadano'
                    ? 'bg-white text-[#007A3D] shadow-xs ring-1 ring-slate-200/80'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/50'
                }`}
                aria-pressed={vistaActiva === 'ciudadano'}
              >
                <FileText className="w-4 h-4 text-[#007A3D]" />
                <span>Vista Ciudadano</span>
              </button>

              <button
                type="button"
                onClick={() => setVistaActiva('asesor')}
                className={`relative flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-semibold transition-all ${
                  vistaActiva === 'asesor'
                    ? 'bg-white text-[#007A3D] shadow-xs ring-1 ring-slate-200/80'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/50'
                }`}
                aria-pressed={vistaActiva === 'asesor'}
              >
                <Inbox className="w-4 h-4 text-[#007A3D]" />
                <span>Bandeja Asesor</span>
                {totalEnCola > 0 && (
                  <span className="ml-0.5 px-1.5 py-0.2 rounded-full text-[10px] font-bold bg-[#007A3D] text-white">
                    {totalEnCola}
                  </span>
                )}
              </button>

              <button
                type="button"
                onClick={() => setVistaActiva('reglas')}
                className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-semibold transition-all ${
                  vistaActiva === 'reglas'
                    ? 'bg-white text-[#007A3D] shadow-xs ring-1 ring-slate-200/80'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/50'
                }`}
                aria-pressed={vistaActiva === 'reglas'}
                title="Configuración de reglas y simulador interactivo"
              >
                <Sliders className="w-4 h-4 text-[#007A3D]" />
                <span>Reglas & Simulador</span>
              </button>

              <button
                type="button"
                onClick={() => setVistaActiva('n8n')}
                className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-semibold transition-all ${
                  vistaActiva === 'n8n'
                    ? 'bg-white text-[#007A3D] shadow-xs ring-1 ring-slate-200/80'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/50'
                }`}
                aria-pressed={vistaActiva === 'n8n'}
                title="Centro de Automatización con n8n"
              >
                <Workflow className="w-4 h-4 text-[#007A3D]" />
                <span>Automatización n8n</span>
              </button>
            </div>

            {/* Botón de recarga de datos demo */}
            <button
              type="button"
              onClick={alReiniciarDemo}
              className="inline-flex items-center gap-1.5 px-2.5 py-2 rounded-xl text-xs font-medium text-slate-600 bg-white border border-slate-200 hover:bg-slate-50 hover:text-slate-900 shadow-2xs transition-colors"
              title="Restablece los 8 casos de prueba semilla"
            >
              <RotateCcw className="w-3.5 h-3.5 text-slate-500" />
              <span className="hidden lg:inline">Reiniciar Demo</span>
            </button>
          </div>
        </div>
      </div>
    </header>
  );
};
