/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * EPM · Centro de Automatización n8n
 * Guía completa, arquitectura, código de nodo, cURL de prueba y Workflow JSON importable.
 */

import React, { useState } from 'react';
import {
  Workflow,
  Copy,
  Check,
  Download,
  Terminal,
  Layers,
  ArrowRight,
  ShieldCheck,
  Zap,
  Mail,
  MessageSquare,
  Server,
  FileCode,
  CheckCircle2,
  ExternalLink,
  Code2,
  GitBranch,
} from 'lucide-react';

export const AutomatizacionN8N: React.FC = () => {
  const [tabActiva, setTabActiva] = useState<'guia' | 'workflow' | 'codigo' | 'curl'>('guia');
  const [copiadoWorkflow, setCopiadoWorkflow] = useState(false);
  const [copiadoCodigo, setCopiadoCodigo] = useState(false);
  const [copiadoCurl, setCopiadoCurl] = useState(false);

  // Código JavaScript exacto para el Code Node de n8n
  const codigoNodeN8N = `// ==============================================================
// NODO CODE (n8n): Motor de Reglas EPM · Clasificación de PQR
// Entrada: $input.item.json con datos de la solicitud
// Salida: Objeto PQR estructurado, clasificado y con enrutamiento
// ==============================================================

const data = $input.item.json;

// 1. Extraer campos recibidos
const usuario = data.usuario || {
  nombre: data.nombre || 'Ciudadano',
  documento: data.documento || 'No especificado',
  contrato: data.contrato || '000000',
  correo: data.correo || '',
  telefono: data.telefono || ''
};

const tipo = data.tipo || 'Reclamo';
const servicio = data.servicio || 'Energia';
const descripcion = data.descripcion || '';
const condiciones = data.condiciones || {
  servicioSuspendido: data.servicioSuspendido === true || data.servicioSuspendido === 'true',
  afectaVariosUsuarios: data.afectaVariosUsuarios === true || data.afectaVariosUsuarios === 'true',
  poblacionVulnerable: data.poblacionVulnerable === true || data.poblacionVulnerable === 'true',
  servicioEsencial: data.servicioEsencial === true || data.servicioEsencial === 'true',
  diasHabilesConsumidos: Number(data.diasHabilesConsumidos || 0)
};

const reincidenciasPrevias = Number(data.reincidenciasPrevias || 0);

// 2. Normalización de texto
function normalizarTexto(txt) {
  if (!txt) return '';
  return txt.toLowerCase()
    .normalize('NFD')
    .replace(/[\\u0300-\\u036f]/g, '')
    .replace(/[^\\w\\s]/gi, ' ')
    .replace(/\\s+/g, ' ')
    .trim();
}

const textoNorm = normalizarTexto(descripcion);

// 3. Diccionarios de palabras clave EPM
const keywordsFacturacion = [
  'factura', 'facturacion', 'cobro', 'cobraron', 'consumo', 'lectura',
  'medidor', 'tarifa', 'pago', 'valor', 'refacturar', 'sobrecosto',
  'estrato', 'doble cobro', 'cobro excesivo'
];

const keywordsCalidad = [
  'sin servicio', 'corte', 'suspension', 'baja presion', 'voltaje',
  'intermitente', 'fuga', 'apagon', 'sin luz', 'sin agua', 'sin gas',
  'se fue la luz', 'olor a gas', 'escape', 'tuberia rota', 'transformador'
];

// 4. Clasificación de Tipología
const detectadas = new Set();
let puntajeFacturacion = 0;
let puntajeCalidad = 0;

for (const kw of keywordsFacturacion) {
  if (textoNorm.includes(kw)) {
    detectadas.add(kw);
    puntajeFacturacion += 2.0;
  }
}

for (const kw of keywordsCalidad) {
  if (textoNorm.includes(kw)) {
    detectadas.add(kw);
    puntajeCalidad += 2.0;
  }
}

if (tipo === 'Reclamo' && puntajeFacturacion > 0) puntajeFacturacion += 1.0;
if (condiciones.servicioSuspendido && puntajeCalidad > 0) puntajeCalidad += 1.0;

let tipologia = 'Otro tipo';
let puntajeFinal = 0;

if (puntajeCalidad >= 1.5 && puntajeCalidad >= puntajeFacturacion) {
  tipologia = 'Calidad / falla del servicio';
  puntajeFinal = puntajeCalidad;
} else if (puntajeFacturacion >= 1.5 && puntajeFacturacion > puntajeCalidad) {
  tipologia = 'Facturación';
  puntajeFinal = puntajeFacturacion;
}

// 5. Cálculo de Prioridad (Matriz Impacto × Urgencia)
const motivos = [];
let prioridad = 'Baja';

const esCritica = condiciones.servicioSuspendido || condiciones.afectaVariosUsuarios ||
                  condiciones.poblacionVulnerable || condiciones.servicioEsencial;

if (condiciones.servicioSuspendido) motivos.push('Servicio suspendido actualmente: interrupción activa');
if (condiciones.afectaVariosUsuarios) motivos.push('Afectación colectiva en el sector');
if (condiciones.poblacionVulnerable) motivos.push('Población de protección especial (adulto mayor / dependiente médico)');
if (condiciones.servicioEsencial) motivos.push('Predio de servicio público esencial (hospital / colegio)');

if (esCritica) {
  prioridad = 'Alta';
} else if (tipo === 'Queja' || tipo === 'Reclamo') {
  prioridad = 'Media';
  motivos.push('Trámite de Queja o Reclamo ordinario');
} else {
  prioridad = 'Baja';
  motivos.push('Petición o trámite informativo ordinario');
}

// Escalamiento por reincidencia o término legal
if (reincidenciasPrevias > 2) {
  const anterior = prioridad;
  if (prioridad === 'Baja') prioridad = 'Media';
  else if (prioridad === 'Media') prioridad = 'Alta';
  motivos.push(\`Cliente reincidente (\${reincidenciasPrevias} PQR en 6 meses). Escala de \${anterior} a \${prioridad}\`);
}

// 6. Enrutamiento y SLAs
let ruta = 'Baja prioridad';
let slaHoras = 120;
let slaTexto = '5 días hábiles';

if (prioridad === 'Alta') {
  ruta = 'Servicio Crítico';
  slaHoras = 4;
  slaTexto = '4 horas';
} else if (prioridad === 'Media') {
  ruta = 'Queja o Reclamo';
  slaHoras = 48;
  slaTexto = '48 horas';
}

let area = 'Atención al cliente';
if (tipologia === 'Facturación') area = 'Área de facturación';
if (tipologia === 'Calidad / falla del servicio') area = 'Área operativa / Campo';

// 7. Cálculo de término legal de 15 días hábiles (Colombia 2026)
const festivos2026 = [
  '2026-01-01', '2026-01-12', '2026-03-23', '2026-04-02', '2026-04-03',
  '2026-05-01', '2026-05-18', '2026-06-08', '2026-06-15', '2026-06-29',
  '2026-07-20', '2026-08-07', '2026-08-17', '2026-10-12', '2026-11-02',
  '2026-11-16', '2026-12-08', '2026-12-25'
];

const ahora = new Date();
const fechaLimite = new Date(ahora.getTime());
let diasAgregados = 0;

while (diasAgregados < 15) {
  fechaLimite.setDate(fechaLimite.getDate() + 1);
  const diaSemana = fechaLimite.getDay();
  const isoFecha = fechaLimite.toISOString().split('T')[0];
  if (diaSemana !== 0 && diaSemana !== 6 && !festivos2026.includes(isoFecha)) {
    diasAgregados++;
  }
}
fechaLimite.setHours(17, 0, 0, 0);

// 8. Radicado oficial PQR-AAAAMMDD-####
const anio = ahora.getFullYear();
const mes = String(ahora.getMonth() + 1).padStart(2, '0');
const dia = String(ahora.getDate()).padStart(2, '0');
const aleatorio = String(Math.floor(Math.random() * 9000) + 1000);
const numeroRadicado = \`PQR-\${anio}\${mes}\${dia}-\${aleatorio}\`;

return {
  json: {
    radicado: numeroRadicado,
    fechaRadicacion: ahora.toISOString(),
    usuario,
    solicitud: { tipo, servicio, descripcion, condiciones },
    clasificacion: {
      tipologia,
      puntaje: puntajeFinal,
      palabras_detectadas: Array.from(detectadas)
    },
    prioridad,
    motivo_regla: motivos,
    enrutamiento: {
      ruta,
      area,
      slaHoras,
      slaTexto,
      fechaLimiteSLA: new Date(ahora.getTime() + slaHoras * 3600000).toISOString(),
      fechaLimiteLegal: fechaLimite.toISOString()
    }
  }
};`;

  // Workflow JSON completo para importar en n8n
  const workflowJsonN8N = {
    name: 'EPM · Clasificación y Enrutamiento Inteligente de PQR',
    nodes: [
      {
        parameters: {
          httpMethod: 'POST',
          path: 'epm-pqr',
          responseMode: 'responseNode',
          options: {},
        },
        id: 'webhook-epm-1',
        name: 'Webhook: Entrada de PQR',
        type: 'n8n-nodes-base.webhook',
        typeVersion: 2,
        position: [240, 300],
        webhookId: 'epm-pqr-webhook',
      },
      {
        parameters: {
          jsCode: codigoNodeN8N,
        },
        id: 'code-motor-reglas',
        name: 'Motor de Reglas EPM',
        type: 'n8n-nodes-base.code',
        typeVersion: 2,
        position: [480, 300],
      },
      {
        parameters: {
          dataType: 'string',
          value1: '={{ $json.prioridad }}',
          rules: {
            rules: [
              {
                value2: 'Alta',
                output: 0,
              },
              {
                value2: 'Media',
                output: 1,
              },
              {
                value2: 'Baja',
                output: 2,
              },
            ],
          },
        },
        id: 'switch-prioridad',
        name: 'Switch: Nivel de Prioridad',
        type: 'n8n-nodes-base.switch',
        typeVersion: 3,
        position: [720, 300],
      },
      {
        parameters: {
          options: {},
        },
        id: 'alerta-cuadrilla-critica',
        name: 'Slack / Alerta Cuadrilla Crítica (4h)',
        type: 'n8n-nodes-base.noOp',
        typeVersion: 1,
        position: [980, 160],
      },
      {
        parameters: {
          options: {},
        },
        id: 'cola-quejas-reclamos',
        name: 'Cola Operativa Quejas/Reclamos (48h)',
        type: 'n8n-nodes-base.noOp',
        typeVersion: 1,
        position: [980, 300],
      },
      {
        parameters: {
          options: {},
        },
        id: 'cola-baja-prioridad',
        name: 'Cola Solicitudes Informativas (5 días)',
        type: 'n8n-nodes-base.noOp',
        typeVersion: 1,
        position: [980, 440],
      },
      {
        parameters: {
          respondWith: 'json',
          responseBody: '={{ JSON.stringify($json) }}',
          options: {},
        },
        id: 'respond-webhook',
        name: 'Respuesta al Usuario (Radicado y SLA)',
        type: 'n8n-nodes-base.respondToWebhook',
        typeVersion: 1.1,
        position: [1240, 300],
      },
    ],
    connections: {
      'Webhook: Entrada de PQR': {
        main: [
          [
            {
              node: 'Motor de Reglas EPM',
              type: 'main',
              index: 0,
            },
          ],
        ],
      },
      'Motor de Reglas EPM': {
        main: [
          [
            {
              node: 'Switch: Nivel de Prioridad',
              type: 'main',
              index: 0,
            },
          ],
        ],
      },
      'Switch: Nivel de Prioridad': {
        main: [
          [
            {
              node: 'Slack / Alerta Cuadrilla Crítica (4h)',
              type: 'main',
              index: 0,
            },
          ],
          [
            {
              node: 'Cola Operativa Quejas/Reclamos (48h)',
              type: 'main',
              index: 0,
            },
          ],
          [
            {
              node: 'Cola Solicitudes Informativas (5 días)',
              type: 'main',
              index: 0,
            },
          ],
        ],
      },
      'Slack / Alerta Cuadrilla Crítica (4h)': {
        main: [
          [
            {
              node: 'Respuesta al Usuario (Radicado y SLA)',
              type: 'main',
              index: 0,
            },
          ],
        ],
      },
      'Cola Operativa Quejas/Reclamos (48h)': {
        main: [
          [
            {
              node: 'Respuesta al Usuario (Radicado y SLA)',
              type: 'main',
              index: 0,
            },
          ],
        ],
      },
      'Cola Solicitudes Informativas (5 días)': {
        main: [
          [
            {
              node: 'Respuesta al Usuario (Radicado y SLA)',
              type: 'main',
              index: 0,
            },
          ],
        ],
      },
    },
  };

  const workflowJsonString = JSON.stringify(workflowJsonN8N, null, 2);

  // Comando cURL de prueba
  const comandoCurlEjemplo = `curl -X POST "https://juan-2.app.n8n.cloud/webhook/epm-pqr" \\
  -H "Content-Type: application/json" \\
  -d '{
    "usuario": {
      "nombre": "Gloria Inés Henao Cadavid",
      "documento": "43512890",
      "contrato": "200591834",
      "correo": "gloria.henao@gmail.com",
      "telefono": "3158902341"
    },
    "tipo": "Reclamo",
    "servicio": "Energia",
    "descripcion": "Llegó la factura con un cobro excesivo en el consumo del mes y la lectura del medidor fue errada. Solicito refacturar.",
    "condiciones": {
      "servicioSuspendido": false,
      "afectaVariosUsuarios": false,
      "poblacionVulnerable": false,
      "servicioEsencial": false
    },
    "reincidenciasPrevias": 3
  }'`;

  const copiarAlPortapapeles = (texto: string, setEstado: (v: boolean) => void) => {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(texto);
      setEstado(true);
      setTimeout(() => setEstado(false), 2500);
    }
  };

  const descargarWorkflowJSON = () => {
    const blob = new Blob([workflowJsonString], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'epm-pqr-workflow.json';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-8 max-w-6xl mx-auto">
      {/* Banner Principal de Automatización */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-[#005a2c] text-white rounded-3xl p-6 sm:p-8 shadow-md relative overflow-hidden">
        <div className="relative z-10 space-y-3">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 text-emerald-300 text-xs font-semibold backdrop-blur-sm border border-white/10">
            <Workflow className="w-3.5 h-3.5 text-emerald-400" />
            <span>Integración & Orquestación con n8n</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
            ¿Cómo automatizar este proceso de PQR con n8n?
          </h2>
          <p className="text-slate-300 text-xs sm:text-sm max-w-3xl leading-relaxed">
            n8n te permite conectar la recepción de PQR (desde formularios web, WhatsApp, correos o APIs) con el motor de reglas determinístico de EPM, alertar cuadrillas de servicio crítico en minutos y despachar notificaciones automáticas con número de radicado legal.
          </p>
        </div>
      </div>

      {/* Tabs de navegación técnica */}
      <div className="flex border-b border-slate-200 gap-2 overflow-x-auto pb-1 text-xs">
        <button
          type="button"
          onClick={() => setTabActiva('guia')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold transition-all cursor-pointer whitespace-nowrap ${
            tabActiva === 'guia'
              ? 'bg-[#007A3D] text-white shadow-xs'
              : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
          }`}
        >
          <Layers className="w-4 h-4" />
          <span>1. Arquitectura & Lo que necesitas</span>
        </button>

        <button
          type="button"
          onClick={() => setTabActiva('workflow')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold transition-all cursor-pointer whitespace-nowrap ${
            tabActiva === 'workflow'
              ? 'bg-[#007A3D] text-white shadow-xs'
              : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
          }`}
        >
          <Workflow className="w-4 h-4" />
          <span>2. Workflow JSON (Importar en 1 clic)</span>
        </button>

        <button
          type="button"
          onClick={() => setTabActiva('codigo')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold transition-all cursor-pointer whitespace-nowrap ${
            tabActiva === 'codigo'
              ? 'bg-[#007A3D] text-white shadow-xs'
              : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
          }`}
        >
          <Code2 className="w-4 h-4" />
          <span>3. Código JS para el Code Node</span>
        </button>

        <button
          type="button"
          onClick={() => setTabActiva('curl')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold transition-all cursor-pointer whitespace-nowrap ${
            tabActiva === 'curl'
              ? 'bg-[#007A3D] text-white shadow-xs'
              : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
          }`}
        >
          <Terminal className="w-4 h-4" />
          <span>4. Pruebas cURL & Payload</span>
        </button>
      </div>

      {/* ===================== TAB 1: GUÍA DE ARQUITECTURA Y REQUISITOS ===================== */}
      {tabActiva === 'guia' && (
        <div className="space-y-6">
          {/* Checklist de Requisitos Previos */}
          <div className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-7 shadow-xs space-y-4">
            <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <CheckCircle2 className="w-5 h-5 text-[#007A3D]" />
              <span>Lista de Chequeo: Lo que necesitas tener listo</span>
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-2">
                <span className="font-bold text-slate-800 flex items-center gap-1.5">
                  <Server className="w-4 h-4 text-blue-600" />
                  1. Instancia activa de n8n
                </span>
                <p className="text-slate-600 leading-relaxed">
                  Puedes usar <strong>n8n Cloud</strong> (registro gratuito de prueba en <code className="bg-slate-200 px-1 py-0.5 rounded">n8n.io</code>) o una instancia <strong>Self-Hosted</strong> local con Docker:
                </p>
                <div className="p-2.5 bg-slate-900 text-slate-200 rounded-xl font-mono text-[11px] overflow-x-auto">
                  docker run -it --rm --name n8n -p 5678:5678 n8nio/n8n
                </div>
              </div>

              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-2">
                <span className="font-bold text-slate-800 flex items-center gap-1.5">
                  <GitBranch className="w-4 h-4 text-emerald-600" />
                  2. Método de Ejecución del Motor
                </span>
                <p className="text-slate-600 leading-relaxed">
                  Tienes dos opciones para ejecutar la lógica de EPM:
                </p>
                <ul className="list-disc list-inside space-y-1 text-slate-600">
                  <li><strong>Opción 100% nativa (Recomendada)</strong>: Usar el nodo <strong>Code</strong> de n8n con el script JavaScript que incluimos en la pestaña 3. No requiere servidor adicional.</li>
                  <li><strong>Opción API / Microservicio</strong>: Usar el nodo <strong>HTTP Request</strong> apuntando a un endpoint Node/Express.</li>
                </ul>
              </div>

              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-2">
                <span className="font-bold text-slate-800 flex items-center gap-1.5">
                  <MessageSquare className="w-4 h-4 text-amber-600" />
                  3. Canal de Entrada (Triggers)
                </span>
                <p className="text-slate-600 leading-relaxed">
                  Un nodo <strong>Webhook</strong> que recibe la PQR en formato JSON. Puede conectarse directamente a este frontend, a un formulario Typeform/Google Forms o a un chatbot de WhatsApp (Twilio/Meta Cloud API).
                </p>
              </div>

              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-2">
                <span className="font-bold text-slate-800 flex items-center gap-1.5">
                  <Mail className="w-4 h-4 text-rose-600" />
                  4. Canales de Notificación y Despacho
                </span>
                <p className="text-slate-600 leading-relaxed">
                  Credenciales opcionales para las acciones automáticas:
                </p>
                <ul className="list-disc list-inside space-y-1 text-slate-600">
                  <li><strong>Gmail / SMTP</strong>: Para enviar el comprobante de radicación al ciudadano.</li>
                  <li><strong>Slack / Microsoft Teams / WhatsApp</strong>: Para alarmas inmediatas de prioridad Alta.</li>
                  <li><strong>PostgreSQL / Airtable / ERP</strong>: Para persistir la cola del área.</li>
                </ul>
              </div>
            </div>
          </div>

          {/* Diagrama del Pipeline en n8n */}
          <div className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-7 shadow-xs space-y-4">
            <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <Layers className="w-5 h-5 text-[#007A3D]" />
              <span>Flujo de Trabajo Paso a Paso dentro de n8n</span>
            </h3>

            <div className="space-y-3">
              {/* Paso 1 */}
              <div className="flex items-start gap-4 p-4 rounded-2xl bg-slate-50 border border-slate-200">
                <div className="w-8 h-8 rounded-xl bg-blue-600 text-white flex items-center justify-center font-bold text-xs shrink-0">
                  1
                </div>
                <div className="text-xs space-y-1">
                  <h4 className="font-bold text-slate-800">
                    Webhook Trigger (POST /epm-pqr)
                  </h4>
                  <p className="text-slate-600">
                    Recibe la solicitud en formato JSON desde el portal web o formulario móvil. Responde inmediatamente con el código de confirmación o de forma síncrona tras procesar el enrutamiento.
                  </p>
                </div>
              </div>

              {/* Paso 2 */}
              <div className="flex items-start gap-4 p-4 rounded-2xl bg-emerald-50 border border-emerald-200">
                <div className="w-8 h-8 rounded-xl bg-[#007A3D] text-white flex items-center justify-center font-bold text-xs shrink-0">
                  2
                </div>
                <div className="text-xs space-y-1">
                  <h4 className="font-bold text-emerald-950">
                    Code Node · Motor de Reglas Explicable EPM
                  </h4>
                  <p className="text-emerald-900">
                    Normaliza el texto, busca keywords de facturación y calidad, evalúa la matriz de impacto/urgencia, aplica el término de 15 días hábiles colombianos (excluyendo festivos 2026) y genera el radicado <code className="font-mono bg-white px-1.5 py-0.5 rounded border border-emerald-300">PQR-AAAAMMDD-####</code>.
                  </p>
                </div>
              </div>

              {/* Paso 3 */}
              <div className="flex items-start gap-4 p-4 rounded-2xl bg-slate-50 border border-slate-200">
                <div className="w-8 h-8 rounded-xl bg-amber-600 text-white flex items-center justify-center font-bold text-xs shrink-0">
                  3
                </div>
                <div className="text-xs space-y-1">
                  <h4 className="font-bold text-slate-800">
                    Switch Node · Enrutador por Nivel de Prioridad
                  </h4>
                  <p className="text-slate-600">
                    Bifurca el flujo en 3 salidas:
                  </p>
                  <ul className="list-disc list-inside text-slate-600 space-y-0.5 mt-1">
                    <li><strong className="text-rose-600">Alta (Servicio Crítico - SLA 4h)</strong>: Envía alerta push inmediata a cuadrilla operativa en campo.</li>
                    <li><strong className="text-amber-600">Media (Quejas y Reclamos - SLA 48h)</strong>: Carga en la cola del asesor de facturación o técnica.</li>
                    <li><strong className="text-emerald-600">Baja (Informativa - SLA 5 días)</strong>: Carga en bandeja de orientación al usuario.</li>
                  </ul>
                </div>
              </div>

              {/* Paso 4 */}
              <div className="flex items-start gap-4 p-4 rounded-2xl bg-slate-50 border border-slate-200">
                <div className="w-8 h-8 rounded-xl bg-purple-600 text-white flex items-center justify-center font-bold text-xs shrink-0">
                  4
                </div>
                <div className="text-xs space-y-1">
                  <h4 className="font-bold text-slate-800">
                    Notificación al Ciudadano & Registro en Base de Datos
                  </h4>
                  <p className="text-slate-600">
                    Envía correo electrónico al solicitante con el número de radicado, fecha legal de vencimiento y el bloque explicativo <em>"¿Por qué se clasificó así?"</em>.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ===================== TAB 2: WORKFLOW JSON PARA IMPORTAR ===================== */}
      {tabActiva === 'workflow' && (
        <div className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-7 shadow-xs space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h3 className="text-base font-bold text-slate-900 tracking-tight">
                Flujo Completo Listo para Importar en n8n
              </h3>
              <p className="text-xs text-slate-500">
                Copia este JSON o descárgalo y pégalo directamente en tu canvas de n8n con <strong>Ctrl + V</strong> (o <em>Import from File</em>).
              </p>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={descargarWorkflowJSON}
                className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl border border-slate-300 text-xs font-bold text-slate-700 hover:bg-slate-50 transition-colors cursor-pointer"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Descargar JSON</span>
              </button>

              <button
                type="button"
                onClick={() => copiarAlPortapapeles(workflowJsonString, setCopiadoWorkflow)}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#007A3D] hover:bg-[#005a2c] text-white text-xs font-bold transition-all shadow-xs cursor-pointer"
              >
                {copiadoWorkflow ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-emerald-200" />
                    <span>¡Copiado!</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5" />
                    <span>Copiar Workflow JSON</span>
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Guía visual paso a paso para n8n */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 p-4 bg-emerald-50/80 border border-emerald-200 rounded-2xl text-xs">
            <div className="flex items-start gap-2.5 p-3 bg-white rounded-xl border border-emerald-100 shadow-2xs">
              <span className="w-6 h-6 rounded-full bg-[#007A3D] text-white flex items-center justify-center font-bold text-xs shrink-0">1</span>
              <div>
                <p className="font-bold text-slate-900">Haz clic en "Copiar Workflow JSON"</p>
                <p className="text-slate-600 text-[11px] mt-0.5">O usa el botón "Descargar JSON" si prefieres el archivo .json.</p>
              </div>
            </div>

            <div className="flex items-start gap-2.5 p-3 bg-white rounded-xl border border-emerald-100 shadow-2xs">
              <span className="w-6 h-6 rounded-full bg-[#007A3D] text-white flex items-center justify-center font-bold text-xs shrink-0">2</span>
              <div>
                <p className="font-bold text-slate-900">Ve a n8n y presiona Ctrl + V</p>
                <p className="text-slate-600 text-[11px] mt-0.5">En un workflow nuevo, haz clic en el canvas gris y pega (<kbd className="font-mono bg-slate-100 px-1 rounded">Cmd + V</kbd> en Mac).</p>
              </div>
            </div>

            <div className="flex items-start gap-2.5 p-3 bg-white rounded-xl border border-emerald-100 shadow-2xs">
              <span className="w-6 h-6 rounded-full bg-[#007A3D] text-white flex items-center justify-center font-bold text-xs shrink-0">3</span>
              <div>
                <p className="font-bold text-slate-900">¡Listo! Prueba el Webhook</p>
                <p className="text-slate-600 text-[11px] mt-0.5">Los nodos se crearán y conectarán solos. Haz clic en "Listen for test event" y envía una PQR.</p>
              </div>
            </div>
          </div>

          {/* Visor de código JSON */}
          <pre className="p-4 bg-slate-950 text-slate-200 rounded-2xl font-mono text-[11px] overflow-x-auto max-h-[460px] leading-relaxed">
            {workflowJsonString}
          </pre>
        </div>
      )}

      {/* ===================== TAB 3: CÓDIGO JS PARA EL NODO CODE ===================== */}
      {tabActiva === 'codigo' && (
        <div className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-7 shadow-xs space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h3 className="text-base font-bold text-slate-900 tracking-tight">
                Código para el nodo "Code" (JavaScript) de n8n
              </h3>
              <p className="text-xs text-slate-500">
                Lógica determinística con los 18 festivos de Colombia 2026, cálculo de 15 días hábiles legales y matriz de prioridad.
              </p>
            </div>

            <button
              type="button"
              onClick={() => copiarAlPortapapeles(codigoNodeN8N, setCopiadoCodigo)}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#007A3D] hover:bg-[#005a2c] text-white text-xs font-bold transition-all shadow-xs cursor-pointer"
            >
              {copiadoCodigo ? (
                <>
                  <Check className="w-3.5 h-3.5 text-emerald-200" />
                  <span>¡Código Copiado!</span>
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5" />
                  <span>Copiar Código JavaScript</span>
                </>
              )}
            </button>
          </div>

          <pre className="p-4 bg-slate-950 text-slate-200 rounded-2xl font-mono text-[11px] overflow-x-auto max-h-[500px] leading-relaxed">
            {codigoNodeN8N}
          </pre>
        </div>
      )}

      {/* ===================== TAB 4: PRUEBAS CURL & PAYLOAD ===================== */}
      {tabActiva === 'curl' && (
        <div className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-7 shadow-xs space-y-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h3 className="text-base font-bold text-slate-900 tracking-tight">
                Disparar el Webhook de n8n desde Terminal o Postman
              </h3>
              <p className="text-xs text-slate-500">
                Usa este comando <code className="font-mono text-[#007A3D]">curl</code> para probar la recepción y clasificación en tu flujo de n8n.
              </p>
            </div>

            <button
              type="button"
              onClick={() => copiarAlPortapapeles(comandoCurlEjemplo, setCopiadoCurl)}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#007A3D] hover:bg-[#005a2c] text-white text-xs font-bold transition-all shadow-xs cursor-pointer"
            >
              {copiadoCurl ? (
                <>
                  <Check className="w-3.5 h-3.5 text-emerald-200" />
                  <span>¡Comando Copiado!</span>
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5" />
                  <span>Copiar cURL</span>
                </>
              )}
            </button>
          </div>

          <pre className="p-4 bg-slate-950 text-emerald-400 rounded-2xl font-mono text-[11px] overflow-x-auto leading-relaxed">
            {comandoCurlEjemplo}
          </pre>

          <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-2 text-xs">
            <h4 className="font-bold text-slate-800 uppercase tracking-wider text-[11px]">
              Estructura del Payload JSON Explicada:
            </h4>
            <ul className="space-y-1.5 text-slate-600">
              <li><code className="font-mono font-bold text-slate-800">usuario</code>: Objeto con nombre, documento, contrato (para evaluar reincidencias), correo y teléfono.</li>
              <li><code className="font-mono font-bold text-slate-800">tipo</code>: 'Peticion' | 'Queja' | 'Reclamo' (afecta el cálculo de urgencia e impacto).</li>
              <li><code className="font-mono font-bold text-slate-800">servicio</code>: 'Energia' | 'Agua' | 'Gas'.</li>
              <li><code className="font-mono font-bold text-slate-800">descripcion</code>: Texto libre donde el motor busca las palabras clave de Facturación o Calidad.</li>
              <li><code className="font-mono font-bold text-slate-800">condiciones</code>: Booleans para servicioSuspendido, afectaVariosUsuarios, poblacionVulnerable y servicioEsencial.</li>
            </ul>
          </div>
        </div>
      )}
    </div>
  );
};
