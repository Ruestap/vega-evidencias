/** EstrategiaTrade D2 - motor puro de obligaciones. Sin acceso directo a Firebase.
 * Entradas explicitas; no deduce obligaciones de una fotografia fuera del modo ad-hoc.
 * Todas las fechas ISO YYYY-MM-DD en horario comercial local.
 */
export const TIPOS = Object.freeze(['Always On','Promocional','Campaña','BTL','Ad-hoc']);
export const MODALIDADES = Object.freeze(['recurrente','fecha_unica','ventana','por_tienda','bajo_solicitud']);
const iso = s => /^\d{4}-\d{2}-\d{2}$/.test(String(s||''));
const validDate = s => iso(s) && !Number.isNaN(Date.parse(s+'T00:00:00Z'));
const inRange = (date, start, end) => (!start || date>=start)&&(!end||date<=end);
const dow = date => new Date(date+'T12:00:00Z').getUTCDay();
const uniq = a => [...new Set((a||[]).map(String))];
const has = (list,id) => uniq(list).includes(String(id));

export function validarProgramacion(p){
  const errores=[];
  if(!p?.actividadId) errores.push('Falta actividadId');
  if(!TIPOS.includes(p?.tipo)) errores.push('Tipo de actividad no reconocido');
  if(!MODALIDADES.includes(p?.modalidad)) errores.push('Modalidad no reconocida');
  if(!['programada','manual','primera_evidencia'].includes(p?.activacion)) errores.push('Activacion no reconocida');
  if(p?.fechaInicio&&!validDate(p.fechaInicio)) errores.push('Fecha de inicio invalida');
  if(p?.fechaFin&&!validDate(p.fechaFin)) errores.push('Fecha de fin invalida');
  if(p?.fechaInicio&&p?.fechaFin&&p.fechaFin<p.fechaInicio) errores.push('Fin anterior al inicio');
  if(p?.modalidad==='fecha_unica'&&!validDate(p.fechaInicio)) errores.push('Fecha unica requerida');
  if(p?.modalidad==='por_tienda'&&!Array.isArray(p?.asignaciones)) errores.push('Cronograma por tienda requerido');
  if(p?.activacion==='primera_evidencia'&&!p?.alcance?.tiendaIds?.length&&!p?.alcance?.formatoIds?.length&&!p?.alcance?.todos) errores.push('Falta alcance de activacion');
  return errores;
}

/** La seleccion comercial se resuelve en IDs. Geografia y zona son independientes. */
export function resolverAlcance(tiendas, alcance={}){
  return (tiendas||[]).filter(t=>{
    if(!alcance.todos && !Object.keys(alcance).some(k=>k.endsWith('Ids')&&alcance[k]?.length)) return false;
    if(alcance.formatoIds?.length&&!has(alcance.formatoIds,t.formatoId||t.f)) return false;
    if(alcance.canalIds?.length&&!has(alcance.canalIds,t.canalId)) return false;
    if(alcance.regionIds?.length&&!has(alcance.regionIds,t.regionId)) return false;
    if(alcance.provinciaIds?.length&&!has(alcance.provinciaIds,t.provinciaId)) return false;
    if(alcance.zonaIds?.length&&!has(alcance.zonaIds,t.zonaId)) return false;
    if(alcance.clusterIds?.length&&!has(alcance.clusterIds,t.clusterId)) return false;
    if(alcance.tiendaIds?.length&&!has(alcance.tiendaIds,t.id)) return false;
    if(has(alcance.excluirTiendaIds,t.id)) return false;
    return true;
  }).map(t=>String(t.id));
}

/** Estado actual no elimina historia. Fechas explicitas tienen precedencia. */
export function tiendaElegible(t,fecha){
  if(!t || !validDate(fecha)) return false;
  const desde=t.fechaInicioEvidencias||t.evidenciasDesde||t.fechaApertura||null;
  const hasta=t.fechaFinEvidencias||t.fechaCierre||t.inactivaDesde||null;
  return inRange(fecha,desde,hasta);
}
export function actividadVigente(a,fecha){
  return !!a&&validDate(fecha)&&inRange(fecha,a.vigenteDesde||a.fechaInicio||null,a.vigenteHasta||a.fechaFin||null);
}
function fechaProgramada(p,a,fecha){
  const modo=p.modalidad||'fecha_unica';
  if(!inRange(fecha,a?.fechaInicio||p.fechaInicio,a?.fechaFin||(p.modalidad==='por_tienda'?a?.fechaInicio:p.fechaFin)))return false;
  if(modo==='fecha_unica')return fecha===(a?.fechaInicio||p.fechaInicio);
  if(modo==='recurrente')return (p.dias||[]).includes(dow(fecha));
  if(modo==='ventana')return true; // Una obligacion por ventana, no por cada dia; ver crearObligaciones
  return modo==='por_tienda'||modo==='bajo_solicitud';
}

/** Crea obligaciones deterministicas, no escribe datos. Una fila por asignacion/ventana. */
export function crearObligaciones({programacion,tiendas=[],fechaConsulta,evidencias=[],activacionesManuales=[]}){
  const p=programacion;
  const errores=validarProgramacion(p);
  if(errores.length) return {errores,obligaciones:[]};
  const ids=new Set(resolverAlcance(tiendas,p.alcance||{}));
  const mapa=new Map(tiendas.map(t=>[String(t.id),t]));
  const salida=[];
  const asignaciones=(p.asignaciones&&p.asignaciones.length)
    ?p.asignaciones
    :[...ids].map(tiendaId=>({tiendaId,fechaInicio:p.fechaInicio,fechaFin:p.fechaFin,fechaLimite:p.fechaLimite}));
  for(const a of asignaciones){
    const tid=String(a.tiendaId||'');
    const t=mapa.get(tid);
    if(!ids.has(tid)||!t||a.excluida===true||a.estado==='cancelada')continue;
    const inicio=a.fechaInicio||p.fechaInicio, fin=a.fechaFin||(p.modalidad==='por_tienda'?inicio:p.fechaFin)||inicio;
    if(!validDate(inicio)||!validDate(fin)||fin<inicio)continue;
    const fechaEjecutada=(p.modalidad==='recurrente' ? (a.fechaEjecucion||inicio) : inicio);
    const limite=a.fechaLimite||p.fechaLimite||fin;
    if(!tiendaElegible(t,fechaEjecutada)||!actividadVigente(p,fechaEjecutada))continue;
    if(!fechaProgramada(p,a,fechaEjecutada))continue;
    if(fechaConsulta && fechaEjecutada>fechaConsulta)continue;
    const evidencia=evidencias.find(e=>e.actividadId===p.actividadId&&String(e.tiendaId)===tid&&
      !e.anulado&&e.fecha>=inicio&&e.fecha<=limite&&e.valida!==false);
    const grupo=String(t.f||t.formatoId||'');
    const activada=p.activacion==='programada'||
      (p.activacion==='manual'&&activacionesManuales.some(e=>e.actividadId===p.actividadId&&e.fecha>=inicio&&e.fecha<=fin&&(e.formato===grupo||e.tiendaId===tid)))||
      (p.activacion==='primera_evidencia'&&evidencias.some(e=>e.actividadId===p.actividadId&&e.fecha>=inicio&&e.fecha<=fin&&!e.anulado&&e.valida!==false&&mapa.get(String(e.tiendaId))?.f===grupo&&ids.has(String(e.tiendaId))));
    if(!activada)continue;
    const vencida=Boolean(fechaConsulta&&fechaConsulta>limite);
    const puntos= evidencia?Number(evidencia.puntos??0):0;
    const max=Number(a.puntosMaximos??p.puntosMaximos??10);
    salida.push({id:`${p.id||p.actividadId}|${tid}|${inicio}`,actividadId:p.actividadId,tiendaId:tid,formato:grupo,
      fechaInicio:inicio,fechaFin:fin,fechaLimite:limite,estado:evidencia?'cumplida':vencida?'pendiente':'en_plazo',
      obtenidos:evidencia?Math.max(0,Math.min(max,puntos)):0,posibles:evidencia||vencida?max:0,
      registroId:evidencia?.id||null});
  }
  return {errores:[],obligaciones:salida};
}
export function resumenEficiencia(obligaciones){
  const elegibles=(obligaciones||[]).filter(o=>o.estado!=='en_plazo');
  const obtenidos=elegibles.reduce((s,o)=>s+o.obtenidos,0);
  const posibles=elegibles.reduce((s,o)=>s+o.posibles,0);
  const cumplidas=elegibles.filter(o=>o.estado==='cumplida').length;
  return {obtenidos,posibles,pct:posibles?Math.round(obtenidos/posibles*100):null,
    cobertura:elegibles.length?Math.round(cumplidas/elegibles.length*100):null,
    exigibles:elegibles.length,cumplidas};
}
