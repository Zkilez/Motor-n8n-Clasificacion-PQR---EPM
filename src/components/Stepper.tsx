/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * EPM · Indicador de Pasos del Formulario de Radicación
 */

import React from 'react';
import { User, FileText, CheckCircle2 } from 'lucide-react';

interface StepperProps {
  pasoActual: number; // 1, 2, 3
  alSeleccionarPaso?: (paso: number) => void;
  maxPasoAlcanzado: number;
}

export const Stepper: React.FC<StepperProps> = ({
  pasoActual,
  alSeleccionarPaso,
  maxPasoAlcanzado,
}) => {
  const pasos = [
    { numero: 1, titulo: 'Datos del usuario', subtitulo: 'Titular o reclamante', icono: User },
    { numero: 2, titulo: 'Detalle de la solicitud', subtitulo: 'Descripción y condiciones', icono: FileText },
    { numero: 3, titulo: 'Confirmación', subtitulo: 'Revisión y radicación', icono: CheckCircle2 },
  ];

  return (
    <div className="w-full bg-white rounded-2xl border border-slate-200/80 p-4 sm:p-5 shadow-xs mb-6">
      <nav aria-label="Progreso de radicación">
        <ol className="flex items-center justify-between relative">
          {/* Línea conectora de fondo */}
          <div className="absolute top-5 left-8 right-8 h-0.5 bg-slate-200 -z-0" />
          {/* Línea de progreso completado */}
          <div
            className="absolute top-5 left-8 h-0.5 bg-[#007A3D] transition-all duration-500 ease-out -z-0"
            style={{
              width: `${((pasoActual - 1) / (pasos.length - 1)) * 80}%`,
            }}
          />

          {pasos.map((paso) => {
            const Icono = paso.icono;
            const esActivo = paso.numero === pasoActual;
            const esCompletado = paso.numero < pasoActual;
            const esAccesible = paso.numero <= maxPasoAlcanzado;

            return (
              <li key={paso.numero} className="flex-1 text-center relative z-10">
                <button
                  type="button"
                  disabled={!esAccesible}
                  onClick={() => alSeleccionarPaso && esAccesible && alSeleccionarPaso(paso.numero)}
                  className={`group inline-flex flex-col items-center focus:outline-none transition-all ${
                    !esAccesible ? 'cursor-not-allowed opacity-60' : 'cursor-pointer'
                  }`}
                >
                  {/* Círculo del icono */}
                  <div
                    className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-xs transition-all shadow-xs ${
                      esActivo
                        ? 'bg-[#007A3D] text-white ring-4 ring-emerald-100 scale-105'
                        : esCompletado
                        ? 'bg-[#007A3D] text-white'
                        : 'bg-white text-slate-400 border-2 border-slate-300'
                    }`}
                  >
                    {esCompletado ? (
                      <CheckCircle2 className="w-5 h-5 text-white" />
                    ) : (
                      <Icono className="w-4 h-4" />
                    )}
                  </div>

                  {/* Etiquetas de texto */}
                  <div className="mt-2 text-center">
                    <span
                      className={`block text-xs font-bold transition-colors ${
                        esActivo
                          ? 'text-[#007A3D]'
                          : esCompletado
                          ? 'text-slate-800'
                          : 'text-slate-400'
                      }`}
                    >
                      Paso {paso.numero}: {paso.titulo}
                    </span>
                    <span className="hidden sm:block text-[11px] text-slate-500 mt-0.5">
                      {paso.subtitulo}
                    </span>
                  </div>
                </button>
              </li>
            );
          })}
        </ol>
      </nav>
    </div>
  );
};
