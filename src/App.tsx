/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * EPM · Clasificación Inteligente de PQR - Aplicación Principal
 */

import React, { useEffect, useState } from 'react';
import {
  actualizarEstadoPQR,
  obtenerCola,
  obtenerEstadisticas,
  radicarPQR,
  reclasificarPQRManual,
  reiniciarDatosDemo,
} from './backend/api';
import {
  AreaResponsable,
  EntradaRadicacion,
  EstadoPQR,
  EstadisticasCola,
  PQR,
  Prioridad,
  Tipologia,
} from './types';
import { Header, VistaActiva } from './components/Header';
import { FormularioRadicacion } from './components/FormularioRadicacion';
import { TarjetaResultado } from './components/TarjetaResultado';
import { BandejaAsesor } from './components/BandejaAsesor';
import { DrawerDetallePQR } from './components/DrawerDetallePQR';
import { SimuladorReglas } from './components/SimuladorReglas';
import { AutomatizacionN8N } from './components/AutomatizacionN8N';
import {
  Building2,
  FileCheck2,
  ShieldCheck,
  Phone,
  Mail,
  MapPin,
  ExternalLink,
} from 'lucide-react';

export default function App() {
  const [vistaActiva, setVistaActiva] = useState<VistaActiva>('ciudadano');
  const [pqrs, setPqrs] = useState<PQR[]>([]);
  const [estadisticas, setEstadisticas] = useState<EstadisticasCola>({
    total: 0,
    alta: 0,
    media: 0,
    baja: 0,
    porcentajeOtroTipo: 0,
    enRiesgoSLA: 0,
    vencidasSLA: 0,
    promedioSlaRestanteHoras: 0,
  });

  // Pantalla 2: Última PQR radicada por el ciudadano
  const [pqrReciente, setPqrReciente] = useState<PQR | null>(null);

  // Pantalla 3: PQR abierta en el Drawer lateral
  const [pqrSeleccionadaDrawer, setPqrSeleccionadaDrawer] = useState<PQR | null>(null);

  // Filtros de la bandeja
  const [filtroArea, setFiltroArea] = useState<AreaResponsable | 'Todas'>('Todas');
  const [filtroPrioridad, setFiltroPrioridad] = useState<Prioridad | 'Todas'>('Todas');
  const [filtroTipologia, setFiltroTipologia] = useState<Tipologia | 'Todas'>('Todas');
  const [filtroEstado, setFiltroEstado] = useState<EstadoPQR | 'Todos'>('Todos');
  const [busqueda, setBusqueda] = useState('');

  // Estado de carga al radicar
  const [enviandoRadicacion, setEnviandoRadicacion] = useState(false);

  // Carga inicial y actualización de datos
  const refrescarDatos = () => {
    const lista = obtenerCola(
      filtroArea,
      filtroPrioridad,
      filtroTipologia,
      busqueda,
      filtroEstado
    );
    setPqrs(lista);
    setEstadisticas(obtenerEstadisticas());

    // Si hay un drawer abierto, actualizar su referencia
    if (pqrSeleccionadaDrawer) {
      const actualizada = lista.find((p) => p.id === pqrSeleccionadaDrawer.id);
      if (actualizada) {
        setPqrSeleccionadaDrawer(actualizada);
      }
    }
  };

  useEffect(() => {
    refrescarDatos();
  }, [filtroArea, filtroPrioridad, filtroTipologia, filtroEstado, busqueda]);

  // Manejar radicación de nueva PQR (Flujo Ciudadano)
  const manejarRadicacion = async (entrada: EntradaRadicacion) => {
    setEnviandoRadicacion(true);
    try {
      // Pequeño retardo simulado para dar sensación de procesamiento algorítmico
      await new Promise((resolve) => setTimeout(resolve, 600));
      const nuevaPQR = await radicarPQR(entrada);
      setPqrReciente(nuevaPQR);
      refrescarDatos();
    } finally {
      setEnviandoRadicacion(false);
    }
  };

  // Limpiar filtros en la bandeja
  const manejarLimpiarFiltros = () => {
    setFiltroArea('Todas');
    setFiltroPrioridad('Todas');
    setFiltroTipologia('Todas');
    setFiltroEstado('Todos');
    setBusqueda('');
  };

  // Navegar desde resultado a la bandeja del asesor con la PQR abierta
  const irABandejaConPQR = (idRadicado: string) => {
    setVistaActiva('asesor');
    setBusqueda(idRadicado);
    const encontrada = pqrs.find((p) => p.id === idRadicado);
    if (encontrada) {
      setPqrSeleccionadaDrawer(encontrada);
    }
  };

  // Actualizar estado desde el Drawer
  const manejarActualizarEstado = (id: string, nuevoEstado: EstadoPQR, nota: string) => {
    actualizarEstadoPQR(id, nuevoEstado, nota);
    refrescarDatos();
  };

  // Reclasificar manualmente desde el Drawer
  const manejarReclasificarManual = (
    id: string,
    nuevaTipologia: Tipologia,
    nuevaPrioridad: Prioridad,
    motivo: string
  ) => {
    reclasificarPQRManual(id, nuevaTipologia, nuevaPrioridad, motivo);
    refrescarDatos();
  };

  // Reiniciar a datos de prueba demo
  const manejarReiniciarDemo = () => {
    reiniciarDatosDemo();
    setPqrReciente(null);
    setPqrSeleccionadaDrawer(null);
    manejarLimpiarFiltros();
    refrescarDatos();
  };

  return (
    <div className="min-h-screen bg-slate-100/70 flex flex-col text-slate-800">
      {/* Header Institucional con Switcher de Rol */}
      <Header
        vistaActiva={vistaActiva}
        setVistaActiva={(v) => {
          setVistaActiva(v);
          if (v === 'ciudadano' && !pqrReciente) {
            setPqrReciente(null);
          }
        }}
        totalEnCola={estadisticas.total}
        alReiniciarDemo={manejarReiniciarDemo}
      />

      {/* Contenido Principal */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-8 py-8">
        {/* ==================== VISTA 1: CIUDADANO (Radicar / Resultado) ==================== */}
        {vistaActiva === 'ciudadano' && (
          <div>
            {pqrReciente ? (
              /* Pantalla 2: Resultado de la radicación con explicabilidad */
              <TarjetaResultado
                pqr={pqrReciente}
                alRadicarNueva={() => setPqrReciente(null)}
                alIrABandeja={irABandejaConPQR}
              />
            ) : (
              /* Pantalla 1: Formulario por pasos (Stepper de 3 pasos) */
              <div>
                <div className="max-w-4xl mx-auto mb-6 text-center sm:text-left">
                  <h2 className="text-2xl font-extrabold text-slate-900 tracking-tight">
                    Radicación de Peticiones, Quejas y Reclamos (PQR)
                  </h2>
                  <p className="text-xs text-slate-600 mt-1">
                    Complete el formulario para que el motor inteligente clasifique la tipología, calcule la prioridad y asigne el área responsable en tiempo real.
                  </p>
                </div>
                <FormularioRadicacion
                  alFinalizarRadicacion={manejarRadicacion}
                  enviando={enviandoRadicacion}
                />
              </div>
            )}
          </div>
        )}

        {/* ==================== VISTA 2: ASESOR INTERNO (Bandeja & Trazabilidad) ==================== */}
        {vistaActiva === 'asesor' && (
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div>
                <h2 className="text-2xl font-extrabold text-slate-900 tracking-tight">
                  Bandeja del Área Responsable (Cola Operativa)
                </h2>
                <p className="text-xs text-slate-600 mt-1">
                  Enrutamiento automatizado según tipología y orden de prioridad por riesgo de impacto y antigüedad.
                </p>
              </div>

              <div className="flex items-center gap-2">
                <span className="text-xs text-slate-500 font-medium">
                  {estadisticas.total} solicitudes activas
                </span>
              </div>
            </div>

            <BandejaAsesor
              pqrs={pqrs}
              estadisticas={estadisticas}
              alSeleccionarPQR={(p) => setPqrSeleccionadaDrawer(p)}
              filtroArea={filtroArea}
              setFiltroArea={setFiltroArea}
              filtroPrioridad={filtroPrioridad}
              setFiltroPrioridad={setFiltroPrioridad}
              filtroTipologia={filtroTipologia}
              setFiltroTipologia={setFiltroTipologia}
              filtroEstado={filtroEstado}
              setFiltroEstado={setFiltroEstado}
              busqueda={busqueda}
              setBusqueda={setBusqueda}
              alLimpiarFiltros={manejarLimpiarFiltros}
            />
          </div>
        )}

        {/* ==================== VISTA 3: CONFIGURACIÓN DE REGLAS & SIMULADOR ==================== */}
        {vistaActiva === 'reglas' && <SimuladorReglas />}

        {/* ==================== VISTA 4: AUTOMATIZACIÓN n8n ==================== */}
        {vistaActiva === 'n8n' && <AutomatizacionN8N />}
      </main>

      {/* Drawer lateral de auditoría y gestión de PQR */}
      <DrawerDetallePQR
        pqr={pqrSeleccionadaDrawer}
        alCerrar={() => setPqrSeleccionadaDrawer(null)}
        alActualizarEstado={manejarActualizarEstado}
        alReclasificarManual={manejarReclasificarManual}
      />

      {/* Pie de Página Institucional EPM */}
      <footer className="bg-slate-900 text-slate-400 text-xs py-8 px-4 sm:px-8 border-t border-slate-800 mt-12">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-[#007A3D] text-white flex items-center justify-center font-bold text-sm tracking-tighter">
              epm
            </div>
            <div>
              <p className="font-bold text-slate-200">
                Empresas Públicas de Medellín E.S.P. · Por ti, estamos ahí
              </p>
              <p className="text-[11px] text-slate-500">
                Línea de Atención al Cliente: (604) 44 44 115 · Vigilado Superservicios
              </p>
            </div>
          </div>

          <div className="text-center md:text-right text-[11px] text-slate-500 space-y-1">
            <p>
              Proceso TO-BE de Clasificación Inteligente de PQR mediante Motor de Reglas Explicable
            </p>
            <p className="font-mono text-slate-400">
              Cumplimiento Ley 142 de 1994 · Calendario Oficial Colombia 2026 (Ley Emiliani)
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
