/** Integracion D2 - diagnostico SOLO LECTURA. Sin escrituras a Firebase.
 * NO convierte evidencias legacy en aprobadas ni reemplaza calculos oficiales.
 * Solo una programacion explicita genera obligaciones D2.
 */
import {diagnosticarMaestros} from './adaptadorLegacyD2.mjs';
import {generarObligaciones} from './motorObligacionesD2_v2.mjs';

export function analizarD2Shadow({tiendas=[],actividades=[],programaciones=[],fechaHoraConsulta}={}) {
  const diagnostico=diagnosticarMaestros({tiendas,actividades});
  const errores=[], obligaciones=[];
  if (!Array.isArray(programaciones)) return {diagnostico,errores:[{tipo:'programaciones_invalidas'}],obligaciones,conteos:{programaciones:0,obligaciones:0,errores:1},modo:'solo_lectura'};
  for(const p of programaciones) {
    if(p?.activo===false || p?.estado==='borrador' || p?.estado==='anulada') continue;
    const resultado=generarObligaciones({programacion:p,tiendas:diagnostico.tiendas,fechaHoraConsulta,evidencias:[],exclusiones:[]});
    if(resultado.errores.length) errores.push({programacionId:String(p?.id||''),errores:resultado.errores});
    else obligaciones.push(...resultado.obligaciones);
  }
  const estados={};
  obligaciones.forEach(o=>{estados[o.estado]=(estados[o.estado]||0)+1;});
  return {diagnostico,errores,obligaciones,conteos:{programaciones:programaciones.length,obligaciones:obligaciones.length,errores:errores.length,estados},modo:'solo_lectura',nota:'Las evidencias historicas no se homologan ni califican en este diagnostico.'};
}
