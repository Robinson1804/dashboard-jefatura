/**
 * pia-pim.js
 * Datos de PIA y PIM por actividad (MEF — Específica 1: Locación de Servicios Persona Natural)
 * Fuente: Consulta Amigable MEF · Corte: 28/02/2026
 * Solo disponible para metas que aparecen en la consulta amigable.
 */

const DATOS = [
  { kw: ['encuesta permanente', 'empleo'],                          pia: 17_488_332, pim: 17_488_332 },
  { kw: ['censos nacionales'],                                       pia:  6_000_000, pim:  7_786_752 },
  { kw: ['encuesta demografica', 'salud familiar'],                 pia:  8_396_668, pim:  8_396_668 },
  { kw: ['indicadores coyunturales'],                               pia:  3_868_272, pim:  3_895_058 },
  { kw: ['estudios demograficos', 'sociales'],                      pia:  4_541_333, pim:  4_656_202 },
  { kw: ['encuesta nacional de hogares'],                           pia:  3_998_567, pim:  4_635_973 },
  { kw: ['encuesta de empresas', 'establecimientos'],               pia:  2_400_000, pim:  3_022_757 },
  { kw: ['encuesta nacional agropecuaria'],                         pia:  7_617_540, pim:  7_734_450 },
  { kw: ['estadisticas departamentales'],                           pia:  5_567_820, pim:  6_031_420 },
  { kw: ['marcos muestrales', 'cartografia'],                       pia:    591_600, pim:    786_850 },
  { kw: ['investigaciones'],                                         pia:    611_000, pim:    567_000 },
  { kw: ['cuentas nacionales'],                                      pia:  3_734_900, pim:  3_709_988 },
  { kw: ['encuesta nacional de programas'],                         pia:  5_989_300, pim:  5_939_550 },
  { kw: ['proceso presupuestario'],                                  pia: 25_418_902, pim: 22_925_550 },
  { kw: ['planeamiento y presupuesto'],                             pia:  2_520_441, pim:  2_320_441 },
  { kw: ['conduccion y orientacion superior'],                      pia:    720_000, pim:    860_789 },
  { kw: ['gestion administrativa'],                                  pia: 12_786_660, pim: 12_811_180 },
  { kw: ['administracion general'],                                  pia: 12_786_660, pim: 12_811_180 },
  { kw: ['asesoramiento tecnico', 'juridico'],                      pia:    140_000, pim:    140_000 },
  { kw: ['recursos humanos'],                                        pia:    828_550, pim:    750_000 },
  { kw: ['conservacion y mantenimiento'],                           pia:          0, pim:          0 },
  { kw: ['implementacion del sistema de seguimiento'],              pia:          0, pim:          0 },
]

function norm(s) {
  return s
    .toLowerCase()
    .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

/**
 * Devuelve { pia, pim } si el proyecto tiene datos MEF, o null si no aplica.
 * @param {string} proyecto
 */
export function getPiaPim(proyecto) {
  const n = norm(proyecto)
  for (const item of DATOS) {
    if (item.kw.every(k => n.includes(norm(k)))) {
      return { pia: item.pia, pim: item.pim }
    }
  }
  return null
}
