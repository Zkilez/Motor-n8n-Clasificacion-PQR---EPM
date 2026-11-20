/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * EPM · Formulario por Pasos de Radicación de PQR
 */

import React, { useState } from 'react';
import {
  DatosUsuario,
  DetalleSolicitud,
  EntradaRadicacion,
  ServicioPublico,
  TipoSolicitud,
} from '../types';
import { Stepper } from './Stepper';
import {
  DEFAULT_N8N_WEBHOOK_URL,
  TEST_N8N_WEBHOOK_URL,
  guardarWebhookN8NUrl,
  obtenerWebhookN8NUrl,
  simularClasificacion,
  verificarEstadoWebhookN8N,
} from '../backend/api';
import { contarPQRContratoUltimos6Meses } from '../backend/repositorio';
import {
  AlertCircle,
  ArrowRight,
  ArrowLeft,
  CheckCircle,
  HelpCircle,
  Send,
  Zap,
  Droplets,
  Flame,
  FileSpreadsheet,
  AlertTriangle,
  HeartPulse,
  Building,
  UserCheck,
  Sparkles,
  Workflow,
  ExternalLink,
} from 'lucide-react';

interface FormularioRadicacionProps {
  alFinalizarRadicacion: (entrada: EntradaRadicacion) => Promise<void>;
  enviando: boolean;
}

const PRESETS_EJEMPLOS = [
  {
    nombre: '🏥 Hospital sin energía (Crítico - Alta)',
    datos: {
      usuario: {
        nombre: 'Dra. Patricia Salazar Restrepo',
        documento: '43920182',
        contrato: '100482910',
        correo: 'urgencias@hospitalmedellin.gov.co',
        telefono: '3109845120',
      },
      solicitud: {
        tipo: 'Queja' as TipoSolicitud,
        servicio: 'Energia' as ServicioPublico,
        descripcion: 'Corte intempestivo de energía eléctrica en el pabellón de neonatología y urgencias. Sin servicio desde hace 2 horas, transformador averiado con chispas.',
        condiciones: {
          servicioSuspendido: true,
          afectaVariosUsuarios: true,
          poblacionVulnerable: true,
          servicioEsencial: true,
        },
      },
    },
  },
  {
    nombre: '💧 Adulto mayor dependiente sin agua (Alta)',
    datos: {
      usuario: {
        nombre: 'Carlos Arturo Ramírez',
        documento: '71543290',
        contrato: '300892019',
        correo: 'carlos.ramirez@gmail.com',
        telefono: '3128904321',
      },
      solicitud: {
        tipo: 'Queja' as TipoSolicitud,
        servicio: 'Agua' as ServicioPublico,
        descripcion: 'Suspensión del suministro de agua potable en el domicilio. En la vivienda reside mi madre de 86 años que requiere hidratación y aseo constante por diálisis.',
        condiciones: {
          servicioSuspendido: true,
          afectaVariosUsuarios: false,
          poblacionVulnerable: true,
          servicioEsencial: false,
        },
      },
    },
  },
  {
    nombre: '💰 Reclamo cobro excesivo (Facturación - Media/Alta)',
    datos: {
      usuario: {
        nombre: 'Gloria Inés Henao Cadavid',
        documento: '43512890',
        contrato: '200591834', // Contrato reincidente con PQR previas
        correo: 'gloria.henao@gmail.com',
        telefono: '3158902341',
      },
      solicitud: {
        tipo: 'Reclamo' as TipoSolicitud,
        servicio: 'Agua' as ServicioPublico,
        descripcion: 'Inconformidad con el valor de la factura del mes. Me cobraron un consumo de 45 m3 cuando el promedio es 12 m3. Solicito revisión de medidor y refacturar.',
        condiciones: {
          servicioSuspendido: false,
          afectaVariosUsuarios: false,
          poblacionVulnerable: false,
          servicioEsencial: false,
        },
      },
    },
  },
  {
    nombre: '📋 Solicitud copia de factura (Baja)',
    datos: {
      usuario: {
        nombre: 'Juan Camilo Osorio',
        documento: '1017894562',
        contrato: '500129847',
        correo: 'juan.osorio@yahoo.es',
        telefono: '3001234567',
      },
      solicitud: {
        tipo: 'Peticion' as TipoSolicitud,
        servicio: 'Gas' as ServicioPublico,
        descripcion: 'Requiero copia en PDF de la última factura cancelada del servicio de gas para trámite bancario.',
        condiciones: {
          servicioSuspendido: false,
          afectaVariosUsuarios: false,
          poblacionVulnerable: false,
          servicioEsencial: false,
        },
      },
    },
  },
];

export const FormularioRadicacion: React.FC<FormularioRadicacionProps> = ({
  alFinalizarRadicacion,
  enviando,
}) => {
  const [pasoActual, setPasoActual] = useState<number>(1);
  const [maxPasoAlcanzado, setMaxPasoAlcanzado] = useState<number>(1);

  // Paso 1: Datos del usuario
  const [usuario, setUsuario] = useState<DatosUsuario>({
    nombre: '',
    documento: '',
    contrato: '',
    correo: '',
    telefono: '',
  });

  // Paso 2: Solicitud
  const [solicitud, setSolicitud] = useState<DetalleSolicitud>({
    tipo: 'Reclamo',
    servicio: 'Energia',
    descripcion: '',
    condiciones: {
      servicioSuspendido: false,
      afectaVariosUsuarios: false,
      poblacionVulnerable: false,
      servicioEsencial: false,
    },
  });

  // Errores de validación
  const [errores, setErrores] = useState<Record<string, string>>({});

  // Configuración del Webhook n8n Cloud
  const [webhookUrl, setWebhookUrl] = useState<string>(obtenerWebhookN8NUrl());
  const [esModoTest, setEsModoTest] = useState<boolean>(
    obtenerWebhookN8NUrl().includes('webhook-test')
  );

  const [verificandoN8N, setVerificandoN8N] = useState<boolean>(false);
  const [resultadoVerificacion, setResultadoVerificacion] = useState<{
    ok: boolean;
    status: number;
    mensaje: string;
    hint?: string;
  } | null>(null);

  const cambiarModoWebhook = (modoTest: boolean) => {
    setEsModoTest(modoTest);
    const nuevaUrl = modoTest ? TEST_N8N_WEBHOOK_URL : DEFAULT_N8N_WEBHOOK_URL;
    setWebhookUrl(nuevaUrl);
    guardarWebhookN8NUrl(nuevaUrl);
    setResultadoVerificacion(null);
  };

  const ejecutarDiagnosticoN8N = async () => {
    setVerificandoN8N(true);
    setResultadoVerificacion(null);
    try {
      const res = await verificarEstadoWebhookN8N(webhookUrl);
      setResultadoVerificacion(res);
    } finally {
      setVerificandoN8N(false);
    }
  };

  // Cargar caso de ejemplo
  const cargarPreset = (ejemplo: (typeof PRESETS_EJEMPLOS)[0]) => {
    setUsuario({ ...ejemplo.datos.usuario });
    setSolicitud({ ...ejemplo.datos.solicitud });
    setErrores({});
  };

  // Validaciones del Paso 1
  const validarPaso1 = (): boolean => {
    const nuevosErrores: Record<string, string> = {};

    if (!usuario.nombre.trim()) {
      nuevosErrores.nombre = 'El nombre completo es obligatorio';
    } else if (usuario.nombre.trim().length < 4) {
      nuevosErrores.nombre = 'Ingrese nombre y apellido válidos';
    }

    if (!usuario.documento.trim()) {
      nuevosErrores.documento = 'El documento de identidad es obligatorio';
    } else if (!/^\d{6,12}$/.test(usuario.documento.replace(/\D/g, ''))) {
      nuevosErrores.documento = 'Ingrese un número de documento válido (6-12 dígitos)';
    }

    if (!usuario.contrato.trim()) {
      nuevosErrores.contrato = 'El número de contrato o cuenta es obligatorio';
    } else if (usuario.contrato.trim().length < 5) {
      nuevosErrores.contrato = 'El contrato de servicios debe tener al menos 5 dígitos';
    }

    if (!usuario.correo.trim()) {
      nuevosErrores.correo = 'El correo electrónico es obligatorio';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(usuario.correo.trim())) {
      nuevosErrores.correo = 'Ingrese un correo electrónico con formato válido';
    }

    if (!usuario.telefono.trim()) {
      nuevosErrores.telefono = 'El teléfono de contacto es obligatorio';
    } else if (!/^\d{7,10}$/.test(usuario.telefono.replace(/\D/g, ''))) {
      nuevosErrores.telefono = 'Ingrese un teléfono de contacto de 7 o 10 dígitos';
    }

    setErrores(nuevosErrores);
    return Object.keys(nuevosErrores).length === 0;
  };

  // Validaciones del Paso 2
  const validarPaso2 = (): boolean => {
    const nuevosErrores: Record<string, string> = {};

    if (!solicitud.descripcion.trim()) {
      nuevosErrores.descripcion = 'Por favor detalle los motivos y hechos de su solicitud';
    } else if (solicitud.descripcion.trim().length < 15) {
      nuevosErrores.descripcion = 'La descripción es muy breve. Detalle mejor su caso (mínimo 15 caracteres)';
    }

    setErrores(nuevosErrores);
    return Object.keys(nuevosErrores).length === 0;
  };

  // Navegar al siguiente paso
  const avanzarPaso = () => {
    if (pasoActual === 1) {
      if (validarPaso1()) {
        setPasoActual(2);
        setMaxPasoAlcanzado((prev) => Math.max(prev, 2));
      }
    } else if (pasoActual === 2) {
      if (validarPaso2()) {
        setPasoActual(3);
        setMaxPasoAlcanzado((prev) => Math.max(prev, 3));
      }
    }
  };

  // Regresar al paso anterior
  const retrocederPaso = () => {
    if (pasoActual > 1) {
      setPasoActual(pasoActual - 1);
    }
  };

  // Enviar formulario final
  const manejarEnvio = async (e: React.FormEvent) => {
    e.preventDefault();
    if (pasoActual !== 3) {
      avanzarPaso();
      return;
    }

    await alFinalizarRadicacion({
      usuario,
      solicitud,
    });
  };

  // Simulación en vivo para el paso 3 (transparencia previa)
  const reincidenciasDetectadas = usuario.contrato ? contarPQRContratoUltimos6Meses(usuario.contrato) : 0;
  const simulacion = pasoActual === 3 ? simularClasificacion(solicitud, reincidenciasDetectadas) : null;

  return (
    <div className="max-w-4xl mx-auto">
      {/* Banner de accesos rápidos con casos de prueba para el evaluador */}
      <div className="mb-6 p-4 bg-emerald-50/70 border border-emerald-200/80 rounded-2xl">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 mb-2">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-[#007A3D]" />
            <span className="text-xs font-bold text-slate-800 uppercase tracking-wider">
              Casos de prueba predeterminados
            </span>
          </div>
          <span className="text-[11px] text-emerald-800 font-medium">
            Haz clic en un caso para autocompletar el formulario
          </span>
        </div>
        <div className="flex flex-wrap gap-2">
          {PRESETS_EJEMPLOS.map((ejemplo, idx) => (
            <button
              key={idx}
              type="button"
              onClick={() => cargarPreset(ejemplo)}
              className="text-xs px-3 py-1.5 rounded-xl bg-white border border-emerald-300 text-slate-700 hover:bg-[#007A3D] hover:text-white hover:border-[#007A3D] transition-all font-medium shadow-2xs cursor-pointer"
            >
              {ejemplo.nombre}
            </button>
          ))}
        </div>
      </div>

      {/* Stepper visual */}
      <Stepper
        pasoActual={pasoActual}
        maxPasoAlcanzado={maxPasoAlcanzado}
        alSeleccionarPaso={(p: number) => setPasoActual(p)}
      />

      {/* Formulario */}
      <form onSubmit={manejarEnvio} noValidate>
        {/* ===================== PASO 1: DATOS DEL USUARIO ===================== */}
        {pasoActual === 1 && (
          <div className="bg-white rounded-2xl border border-slate-200 p-6 sm:p-8 shadow-xs space-y-6">
            <div>
              <h2 className="text-lg font-bold text-slate-900 tracking-tight">
                Paso 1 · Datos del usuario y cuenta de servicios
              </h2>
              <p className="text-xs text-slate-500 mt-1">
                La información registrada se asociará al radicado oficial de la PQR ante EPM.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              {/* Nombre */}
              <div className="sm:col-span-2">
                <label htmlFor="nombre" className="block text-xs font-bold text-slate-700 mb-1.5">
                  Nombre completo del titular o solicitante <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  id="nombre"
                  value={usuario.nombre}
                  onChange={(e) => setUsuario({ ...usuario, nombre: e.target.value })}
                  placeholder="Ej. Gloria Inés Henao Cadavid"
                  className={`w-full px-3.5 py-2.5 rounded-xl border text-sm transition-all focus:outline-none focus:ring-2 ${
                    errores.nombre
                      ? 'border-rose-400 focus:ring-rose-200 bg-rose-50/20'
                      : 'border-slate-300 focus:border-[#007A3D] focus:ring-emerald-100'
                  }`}
                />
                {errores.nombre && (
                  <p className="text-[11px] font-semibold text-rose-600 mt-1 flex items-center gap-1">
                    <AlertCircle className="w-3.5 h-3.5" />
                    {errores.nombre}
                  </p>
                )}
              </div>

              {/* Documento */}
              <div>
                <label htmlFor="documento" className="block text-xs font-bold text-slate-700 mb-1.5">
                  Documento de identidad <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  id="documento"
                  value={usuario.documento}
                  onChange={(e) => setUsuario({ ...usuario, documento: e.target.value })}
                  placeholder="Cédula de Ciudadanía o NIT"
                  className={`w-full px-3.5 py-2.5 rounded-xl border text-sm transition-all focus:outline-none focus:ring-2 ${
                    errores.documento
                      ? 'border-rose-400 focus:ring-rose-200 bg-rose-50/20'
                      : 'border-slate-300 focus:border-[#007A3D] focus:ring-emerald-100'
                  }`}
                />
                {errores.documento && (
                  <p className="text-[11px] font-semibold text-rose-600 mt-1 flex items-center gap-1">
                    <AlertCircle className="w-3.5 h-3.5" />
                    {errores.documento}
                  </p>
                )}
              </div>

              {/* Contrato / Cuenta */}
              <div>
                <label htmlFor="contrato" className="block text-xs font-bold text-slate-700 mb-1.5">
                  Número de contrato o cuenta de servicios <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  id="contrato"
                  value={usuario.contrato}
                  onChange={(e) => setUsuario({ ...usuario, contrato: e.target.value })}
                  placeholder="Ej. 100482910 (en la parte superior de su factura)"
                  className={`w-full px-3.5 py-2.5 rounded-xl border text-sm transition-all focus:outline-none focus:ring-2 font-mono ${
                    errores.contrato
                      ? 'border-rose-400 focus:ring-rose-200 bg-rose-50/20'
                      : 'border-slate-300 focus:border-[#007A3D] focus:ring-emerald-100'
                  }`}
                />
                {errores.contrato ? (
                  <p className="text-[11px] font-semibold text-rose-600 mt-1 flex items-center gap-1">
                    <AlertCircle className="w-3.5 h-3.5" />
                    {errores.contrato}
                  </p>
                ) : (
                  <p className="text-[10px] text-slate-400 mt-1">
                    Permite verificar historial y reincidencias de los últimos 6 meses.
                  </p>
                )}
              </div>

              {/* Correo */}
              <div>
                <label htmlFor="correo" className="block text-xs font-bold text-slate-700 mb-1.5">
                  Correo electrónico de notificación <span className="text-rose-500">*</span>
                </label>
                <input
                  type="email"
                  id="correo"
                  value={usuario.correo}
                  onChange={(e) => setUsuario({ ...usuario, correo: e.target.value })}
                  placeholder="ejemplo@correo.com"
                  className={`w-full px-3.5 py-2.5 rounded-xl border text-sm transition-all focus:outline-none focus:ring-2 ${
                    errores.correo
                      ? 'border-rose-400 focus:ring-rose-200 bg-rose-50/20'
                      : 'border-slate-300 focus:border-[#007A3D] focus:ring-emerald-100'
                  }`}
                />
                {errores.correo && (
                  <p className="text-[11px] font-semibold text-rose-600 mt-1 flex items-center gap-1">
                    <AlertCircle className="w-3.5 h-3.5" />
                    {errores.correo}
                  </p>
                )}
              </div>

              {/* Teléfono */}
              <div>
                <label htmlFor="telefono" className="block text-xs font-bold text-slate-700 mb-1.5">
                  Teléfono celular o fijo <span className="text-rose-500">*</span>
                </label>
                <input
                  type="tel"
                  id="telefono"
                  value={usuario.telefono}
                  onChange={(e) => setUsuario({ ...usuario, telefono: e.target.value })}
                  placeholder="Ej. 3101234567"
                  className={`w-full px-3.5 py-2.5 rounded-xl border text-sm transition-all focus:outline-none focus:ring-2 ${
                    errores.telefono
                      ? 'border-rose-400 focus:ring-rose-200 bg-rose-50/20'
                      : 'border-slate-300 focus:border-[#007A3D] focus:ring-emerald-100'
                  }`}
                />
                {errores.telefono && (
                  <p className="text-[11px] font-semibold text-rose-600 mt-1 flex items-center gap-1">
                    <AlertCircle className="w-3.5 h-3.5" />
                    {errores.telefono}
                  </p>
                )}
              </div>
            </div>

            {/* Botón avanzar */}
            <div className="pt-4 border-t border-slate-100 flex justify-end">
              <button
                type="button"
                onClick={avanzarPaso}
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#007A3D] hover:bg-[#005a2c] text-white text-xs font-bold transition-all shadow-sm shadow-[#007A3D]/20 cursor-pointer"
              >
                <span>Continuar a Detalle de la Solicitud</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* ===================== PASO 2: DETALLE DE LA SOLICITUD ===================== */}
        {pasoActual === 2 && (
          <div className="bg-white rounded-2xl border border-slate-200 p-6 sm:p-8 shadow-xs space-y-6">
            <div>
              <h2 className="text-lg font-bold text-slate-900 tracking-tight">
                Paso 2 · Detalle de la solicitud y preguntas clave
              </h2>
              <p className="text-xs text-slate-500 mt-1">
                El motor de reglas analizará la descripción y las condiciones para clasificar la tipología y prioridad.
              </p>
            </div>

            {/* Tipo de PQR y Servicio */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              {/* Tipo de PQR */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-2">
                  Tipo de solicitud <span className="text-rose-500">*</span>
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {(['Peticion', 'Queja', 'Reclamo'] as TipoSolicitud[]).map((t) => (
                    <button
                      key={t}
                      type="button"
                      onClick={() => setSolicitud({ ...solicitud, tipo: t })}
                      className={`py-2.5 px-3 rounded-xl border text-xs font-bold transition-all text-center cursor-pointer ${
                        solicitud.tipo === t
                          ? 'border-[#007A3D] bg-emerald-50 text-[#007A3D] ring-2 ring-emerald-200'
                          : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                      }`}
                    >
                      {t === 'Peticion' ? 'Petición' : t}
                    </button>
                  ))}
                </div>
                <p className="text-[11px] text-slate-400 mt-1.5">
                  {solicitud.tipo === 'Peticion' && 'Consulta general, duplicado o información ordinaria.'}
                  {solicitud.tipo === 'Queja' && 'Manifestación de inconformidad por el servicio o atención.'}
                  {solicitud.tipo === 'Reclamo' && 'Disconformidad directa con la facturación o cobro tarifario.'}
                </p>
              </div>

              {/* Servicio Público */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-2">
                  Servicio público afectado <span className="text-rose-500">*</span>
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { id: 'Energia' as ServicioPublico, label: 'Energía', icono: Zap },
                    { id: 'Agua' as ServicioPublico, label: 'Agua', icono: Droplets },
                    { id: 'Gas' as ServicioPublico, label: 'Gas', icono: Flame },
                  ].map((s) => {
                    const Icono = s.icono;
                    return (
                      <button
                        key={s.id}
                        type="button"
                        onClick={() => setSolicitud({ ...solicitud, servicio: s.id })}
                        className={`flex items-center justify-center gap-1.5 py-2.5 px-3 rounded-xl border text-xs font-bold transition-all cursor-pointer ${
                          solicitud.servicio === s.id
                            ? 'border-[#007A3D] bg-emerald-50 text-[#007A3D] ring-2 ring-emerald-200'
                            : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                        }`}
                      >
                        <Icono className="w-3.5 h-3.5" />
                        <span>{s.label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Descripción */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label htmlFor="descripcion" className="block text-xs font-bold text-slate-700">
                  Descripción clara de los hechos <span className="text-rose-500">*</span>
                </label>
                <span className="text-[11px] text-slate-400 font-mono">
                  {solicitud.descripcion.length} caracteres
                </span>
              </div>
              <textarea
                id="descripcion"
                rows={4}
                value={solicitud.descripcion}
                onChange={(e) => setSolicitud({ ...solicitud, descripcion: e.target.value })}
                placeholder="Describa claramente lo sucedido (ej. cobro excesivo en factura, corte de luz, baja presión, fuga, olor a gas, etc.)"
                className={`w-full px-3.5 py-2.5 rounded-xl border text-sm transition-all focus:outline-none focus:ring-2 resize-y ${
                  errores.descripcion
                    ? 'border-rose-400 focus:ring-rose-200 bg-rose-50/20'
                    : 'border-slate-300 focus:border-[#007A3D] focus:ring-emerald-100'
                }`}
              />
              {errores.descripcion && (
                <p className="text-[11px] font-semibold text-rose-600 mt-1 flex items-center gap-1">
                  <AlertCircle className="w-3.5 h-3.5" />
                  {errores.descripcion}
                </p>
              )}
            </div>

            {/* Preguntas de Sí / No interactivas para el cálculo de urgencia e impacto */}
            <div className="pt-2">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-600 mb-3 flex items-center gap-1.5">
                <AlertTriangle className="w-4 h-4 text-amber-600" />
                <span>Preguntas de impacto y condiciones del servicio (Matriz de Prioridad)</span>
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                {/* Pregunta 1: Servicio suspendido */}
                <div
                  className={`p-3.5 rounded-xl border transition-all ${
                    solicitud.condiciones.servicioSuspendido
                      ? 'border-rose-300 bg-rose-50/60 ring-1 ring-rose-200'
                      : 'border-slate-200 bg-slate-50/60 hover:bg-slate-50'
                  }`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-xs font-bold text-slate-800">
                        ¿Tiene el servicio suspendido actualmente?
                      </p>
                      <p className="text-[11px] text-slate-500 mt-0.5">
                        Interrupción activa o corte total del suministro en el predio.
                      </p>
                    </div>
                    <div className="inline-flex rounded-lg border border-slate-300 bg-white p-0.5">
                      <button
                        type="button"
                        onClick={() =>
                          setSolicitud({
                            ...solicitud,
                            condiciones: {
                              ...solicitud.condiciones,
                              servicioSuspendido: true,
                            },
                          })
                        }
                        className={`px-2.5 py-1 text-xs font-bold rounded-md transition-colors ${
                          solicitud.condiciones.servicioSuspendido
                            ? 'bg-rose-600 text-white'
                            : 'text-slate-600 hover:text-slate-900'
                        }`}
                      >
                        Sí
                      </button>
                      <button
                        type="button"
                        onClick={() =>
                          setSolicitud({
                            ...solicitud,
                            condiciones: {
                              ...solicitud.condiciones,
                              servicioSuspendido: false,
                            },
                          })
                        }
                        className={`px-2.5 py-1 text-xs font-bold rounded-md transition-colors ${
                          !solicitud.condiciones.servicioSuspendido
                            ? 'bg-slate-700 text-white'
                            : 'text-slate-600 hover:text-slate-900'
                        }`}
                      >
                        No
                      </button>
                    </div>
                  </div>
                </div>

                {/* Pregunta 2: Afecta a varios usuarios */}
                <div
                  className={`p-3.5 rounded-xl border transition-all ${
                    solicitud.condiciones.afectaVariosUsuarios
                      ? 'border-rose-300 bg-rose-50/60 ring-1 ring-rose-200'
                      : 'border-slate-200 bg-slate-50/60 hover:bg-slate-50'
                  }`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-xs font-bold text-slate-800">
                        ¿Afecta a varios usuarios o al sector?
                      </p>
                      <p className="text-[11px] text-slate-500 mt-0.5">
                        Daño colectivo en cuadra, barrio, edificio o vereda.
                      </p>
                    </div>
                    <div className="inline-flex rounded-lg border border-slate-300 bg-white p-0.5">
                      <button
                        type="button"
                        onClick={() =>
                          setSolicitud({
                            ...solicitud,
                            condiciones: {
                              ...solicitud.condiciones,
                              afectaVariosUsuarios: true,
                            },
                          })
                        }
                        className={`px-2.5 py-1 text-xs font-bold rounded-md transition-colors ${
                          solicitud.condiciones.afectaVariosUsuarios
                            ? 'bg-rose-600 text-white'
                            : 'text-slate-600 hover:text-slate-900'
                        }`}
                      >
                        Sí
                      </button>
                      <button
                        type="button"
                        onClick={() =>
                          setSolicitud({
                            ...solicitud,
                            condiciones: {
                              ...solicitud.condiciones,
                              afectaVariosUsuarios: false,
                            },
                          })
                        }
                        className={`px-2.5 py-1 text-xs font-bold rounded-md transition-colors ${
                          !solicitud.condiciones.afectaVariosUsuarios
                            ? 'bg-slate-700 text-white'
                            : 'text-slate-600 hover:text-slate-900'
                        }`}
                      >
                        No
                      </button>
                    </div>
                  </div>
                </div>

                {/* Pregunta 3: Población vulnerable */}
                <div
                  className={`p-3.5 rounded-xl border transition-all ${
                    solicitud.condiciones.poblacionVulnerable
                      ? 'border-rose-300 bg-rose-50/60 ring-1 ring-rose-200'
                      : 'border-slate-200 bg-slate-50/60 hover:bg-slate-50'
                  }`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <div className="flex items-center gap-1.5">
                        <HeartPulse className="w-3.5 h-3.5 text-rose-500" />
                        <p className="text-xs font-bold text-slate-800">
                          ¿Hay población vulnerable en el predio?
                        </p>
                      </div>
                      <p className="text-[11px] text-slate-500 mt-0.5">
                        Adulto mayor, persona con discapacidad o dependiente de equipo médico.
                      </p>
                    </div>
                    <div className="inline-flex rounded-lg border border-slate-300 bg-white p-0.5">
                      <button
                        type="button"
                        onClick={() =>
                          setSolicitud({
                            ...solicitud,
                            condiciones: {
                              ...solicitud.condiciones,
                              poblacionVulnerable: true,
                            },
                          })
                        }
                        className={`px-2.5 py-1 text-xs font-bold rounded-md transition-colors ${
                          solicitud.condiciones.poblacionVulnerable
                            ? 'bg-rose-600 text-white'
                            : 'text-slate-600 hover:text-slate-900'
                        }`}
                      >
                        Sí
                      </button>
                      <button
                        type="button"
                        onClick={() =>
                          setSolicitud({
                            ...solicitud,
                            condiciones: {
                              ...solicitud.condiciones,
                              poblacionVulnerable: false,
                            },
                          })
                        }
                        className={`px-2.5 py-1 text-xs font-bold rounded-md transition-colors ${
                          !solicitud.condiciones.poblacionVulnerable
                            ? 'bg-slate-700 text-white'
                            : 'text-slate-600 hover:text-slate-900'
                        }`}
                      >
                        No
                      </button>
                    </div>
                  </div>
                </div>

                {/* Pregunta 4: Servicio esencial */}
                <div
                  className={`p-3.5 rounded-xl border transition-all ${
                    solicitud.condiciones.servicioEsencial
                      ? 'border-rose-300 bg-rose-50/60 ring-1 ring-rose-200'
                      : 'border-slate-200 bg-slate-50/60 hover:bg-slate-50'
                  }`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <div className="flex items-center gap-1.5">
                        <Building className="w-3.5 h-3.5 text-[#007A3D]" />
                        <p className="text-xs font-bold text-slate-800">
                          ¿Predio con servicio público esencial?
                        </p>
                      </div>
                      <p className="text-[11px] text-slate-500 mt-0.5">
                        Hospital, clínica, puesto de salud, colegio o bomberos.
                      </p>
                    </div>
                    <div className="inline-flex rounded-lg border border-slate-300 bg-white p-0.5">
                      <button
                        type="button"
                        onClick={() =>
                          setSolicitud({
                            ...solicitud,
                            condiciones: {
                              ...solicitud.condiciones,
                              servicioEsencial: true,
                            },
                          })
                        }
                        className={`px-2.5 py-1 text-xs font-bold rounded-md transition-colors ${
                          solicitud.condiciones.servicioEsencial
                            ? 'bg-rose-600 text-white'
                            : 'text-slate-600 hover:text-slate-900'
                        }`}
                      >
                        Sí
                      </button>
                      <button
                        type="button"
                        onClick={() =>
                          setSolicitud({
                            ...solicitud,
                            condiciones: {
                              ...solicitud.condiciones,
                              servicioEsencial: false,
                            },
                          })
                        }
                        className={`px-2.5 py-1 text-xs font-bold rounded-md transition-colors ${
                          !solicitud.condiciones.servicioEsencial
                            ? 'bg-slate-700 text-white'
                            : 'text-slate-600 hover:text-slate-900'
                        }`}
                      >
                        No
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Botones de navegación */}
            <div className="pt-4 border-t border-slate-100 flex items-center justify-between">
              <button
                type="button"
                onClick={retrocederPaso}
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl border border-slate-300 hover:bg-slate-50 text-slate-700 text-xs font-bold transition-all cursor-pointer"
              >
                <ArrowLeft className="w-4 h-4" />
                <span>Volver a Datos de Usuario</span>
              </button>

              <button
                type="button"
                onClick={avanzarPaso}
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#007A3D] hover:bg-[#005a2c] text-white text-xs font-bold transition-all shadow-sm shadow-[#007A3D]/20 cursor-pointer"
              >
                <span>Continuar a Confirmación</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* ===================== PASO 3: CONFIRMACIÓN Y PREVIA ===================== */}
        {pasoActual === 3 && (
          <div className="bg-white rounded-2xl border border-slate-200 p-6 sm:p-8 shadow-xs space-y-6">
            <div>
              <h2 className="text-lg font-bold text-slate-900 tracking-tight">
                Paso 3 · Confirmación y vista previa de clasificación
              </h2>
              <p className="text-xs text-slate-500 mt-1">
                Revise la información antes de generar el radicado oficial. El motor de reglas ya pre-evaluó su caso:
              </p>
            </div>

            {/* Vista previa en tiempo real de la evaluación algorítmica */}
            {simulacion && (
              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-600 uppercase tracking-wider flex items-center gap-1.5">
                    <Sparkles className="w-4 h-4 text-[#007A3D]" />
                    Pre-evaluación del motor de reglas
                  </span>
                  <span className="text-[11px] font-medium text-emerald-800 bg-emerald-100/70 px-2 py-0.5 rounded-md">
                    100% Explicable y Auditable
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div className="p-3 bg-white rounded-lg border border-slate-200">
                    <span className="text-[10px] text-slate-400 block font-bold uppercase">
                      Tipología esperada
                    </span>
                    <span className="text-xs font-bold text-slate-800 block mt-0.5">
                      {simulacion.clasificacion.tipologia}
                    </span>
                    <span className="text-[10px] text-slate-500">
                      Puntaje: {simulacion.clasificacion.puntaje.toFixed(1)} pts
                    </span>
                  </div>

                  <div className="p-3 bg-white rounded-lg border border-slate-200">
                    <span className="text-[10px] text-slate-400 block font-bold uppercase">
                      Prioridad calculada
                    </span>
                    <span
                      className={`text-xs font-bold block mt-0.5 ${
                        simulacion.calculoPrioridad.prioridad === 'Alta'
                          ? 'text-rose-600'
                          : simulacion.calculoPrioridad.prioridad === 'Media'
                          ? 'text-amber-600'
                          : 'text-emerald-600'
                      }`}
                    >
                      {simulacion.calculoPrioridad.prioridad}
                    </span>
                    <span className="text-[10px] text-slate-500">
                      {simulacion.calculoPrioridad.motivo_regla[0] || 'Por tipo de trámite'}
                    </span>
                  </div>

                  <div className="p-3 bg-white rounded-lg border border-slate-200">
                    <span className="text-[10px] text-slate-400 block font-bold uppercase">
                      Área y SLA
                    </span>
                    <span className="text-xs font-bold text-slate-800 block mt-0.5">
                      {simulacion.enrutamiento.area}
                    </span>
                    <span className="text-[10px] text-slate-500">
                      SLA: {simulacion.enrutamiento.slaTexto}
                    </span>
                  </div>
                </div>

                {reincidenciasDetectadas > 0 && (
                  <div className="text-[11px] p-2 bg-amber-50 border border-amber-200 rounded-lg text-amber-900 flex items-center gap-2">
                    <UserCheck className="w-4 h-4 text-amber-600 shrink-0" />
                    <span>
                      Se detectaron <strong>{reincidenciasDetectadas} PQR previas</strong> para el contrato{' '}
                      <span className="font-mono">{usuario.contrato}</span> en los últimos 6 meses.
                    </span>
                  </div>
                )}
              </div>
            )}

            {/* Resumen de Datos del Usuario */}
            <div className="border border-slate-200 rounded-xl p-4">
              <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider mb-2">
                Datos del solicitante
              </h3>
              <dl className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-2 text-xs">
                <div>
                  <dt className="text-slate-400">Titular:</dt>
                  <dd className="font-semibold text-slate-800">{usuario.nombre}</dd>
                </div>
                <div>
                  <dt className="text-slate-400">Documento:</dt>
                  <dd className="font-semibold text-slate-800">{usuario.documento}</dd>
                </div>
                <div>
                  <dt className="text-slate-400">Contrato / Cuenta:</dt>
                  <dd className="font-semibold text-slate-800 font-mono">{usuario.contrato}</dd>
                </div>
                <div>
                  <dt className="text-slate-400">Correo y Teléfono:</dt>
                  <dd className="font-semibold text-slate-800">
                    {usuario.correo} · {usuario.telefono}
                  </dd>
                </div>
              </dl>
            </div>

            {/* Resumen de la Solicitud */}
            <div className="border border-slate-200 rounded-xl p-4">
              <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider mb-2">
                Detalle del caso
              </h3>
              <div className="text-xs space-y-2">
                <div className="flex gap-4">
                  <div>
                    <span className="text-slate-400 block">Tipo:</span>
                    <span className="font-semibold text-slate-800">{solicitud.tipo}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block">Servicio:</span>
                    <span className="font-semibold text-slate-800">{solicitud.servicio}</span>
                  </div>
                </div>
                <div>
                  <span className="text-slate-400 block mb-0.5">Descripción de hechos:</span>
                  <p className="p-2.5 bg-slate-50 rounded-lg text-slate-700 italic border border-slate-100">
                    "{solicitud.descripcion}"
                  </p>
                </div>
              </div>
            </div>

            {/* Banner de integración directa con n8n Cloud */}
            <div className="p-4 bg-emerald-50/80 border border-emerald-300 rounded-2xl space-y-3">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 rounded-lg bg-[#007A3D] text-white flex items-center justify-center shrink-0">
                    <Workflow className="w-3.5 h-3.5" />
                  </div>
                  <div>
                    <span className="text-xs font-bold text-slate-900 block">
                      Ejecución automatizada en n8n Cloud
                    </span>
                    <span className="text-[11px] text-emerald-800">
                      Al confirmar, la PQR se enviará directamente a tu flujo activo en n8n
                    </span>
                  </div>
                </div>

                {/* Selector de modo Producción / Modo Prueba */}
                <div className="inline-flex rounded-xl p-1 bg-white border border-emerald-200 text-[11px] font-semibold self-start sm:self-auto">
                  <button
                    type="button"
                    onClick={() => cambiarModoWebhook(false)}
                    className={`px-2.5 py-1 rounded-lg transition-colors cursor-pointer ${
                      !esModoTest
                        ? 'bg-[#007A3D] text-white shadow-2xs'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    Producción (/webhook)
                  </button>
                  <button
                    type="button"
                    onClick={() => cambiarModoWebhook(true)}
                    className={`px-2.5 py-1 rounded-lg transition-colors cursor-pointer ${
                      esModoTest
                        ? 'bg-[#007A3D] text-white shadow-2xs'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                    title="Úsalo si en n8n diste clic en 'Listen for test event'"
                  >
                    Modo Prueba (/webhook-test)
                  </button>
                </div>
              </div>

              <div className="flex items-center justify-between gap-2 text-[11px] font-mono bg-white p-2.5 rounded-xl border border-emerald-200 text-slate-700">
                <div className="flex items-center gap-2 overflow-hidden truncate">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse shrink-0" />
                  <span className="font-bold text-[#007A3D] shrink-0">POST:</span>
                  <span className="truncate select-all">{webhookUrl}</span>
                </div>
                <button
                  type="button"
                  onClick={ejecutarDiagnosticoN8N}
                  disabled={verificandoN8N}
                  className="px-2.5 py-1 rounded-lg bg-emerald-100 hover:bg-emerald-200 text-emerald-900 font-sans font-bold text-xs shrink-0 cursor-pointer disabled:opacity-50 transition-colors"
                >
                  {verificandoN8N ? 'Comprobando...' : '🔍 Probar Conexión'}
                </button>
              </div>

              {resultadoVerificacion && (
                <div
                  className={`p-3 rounded-xl border text-xs space-y-1 animate-fade-in ${
                    resultadoVerificacion.ok
                      ? 'bg-emerald-100/90 border-emerald-300 text-emerald-950'
                      : 'bg-amber-50 border-amber-300 text-amber-950'
                  }`}
                >
                  <div className="flex items-center gap-1.5 font-bold">
                    <span>{resultadoVerificacion.ok ? '✅' : '⚠️'}</span>
                    <span>{resultadoVerificacion.mensaje}</span>
                  </div>
                  {resultadoVerificacion.hint && (
                    <p className="text-[11px] font-medium opacity-90 pl-3 border-l-2 border-amber-400 mt-1">
                      {resultadoVerificacion.hint}
                    </p>
                  )}
                </div>
              )}
            </div>

            {/* Botones de navegación */}
            <div className="pt-4 border-t border-slate-100 flex items-center justify-between">
              <button
                type="button"
                onClick={retrocederPaso}
                disabled={enviando}
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl border border-slate-300 hover:bg-slate-50 text-slate-700 text-xs font-bold transition-all cursor-pointer disabled:opacity-50"
              >
                <ArrowLeft className="w-4 h-4" />
                <span>Modificar Detalle</span>
              </button>

              <button
                type="submit"
                disabled={enviando}
                className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-[#007A3D] hover:bg-[#005a2c] text-white text-sm font-bold transition-all shadow-md shadow-[#007A3D]/25 cursor-pointer disabled:opacity-50"
              >
                {enviando ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    <span>Ejecutando en n8n...</span>
                  </>
                ) : (
                  <>
                    <Send className="w-4 h-4" />
                    <span>Confirmar y Radicar PQR</span>
                  </>
                )}
              </button>
            </div>
          </div>
        )}
      </form>
    </div>
  );
};
