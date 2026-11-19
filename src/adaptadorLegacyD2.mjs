/** Adaptador read-only para diagnostico del maestro de tiendas y actividades.
 * No inventa fechas ni asignaciones ni escribe Firebase.
 * Una actividad legacy no equivale a una programacion D2 aprobada.
 */
const FECHA=/^\d{4}-\d{2}-\d{2}$/;
const limpia=s=>String(s??'').trim();
const fecha=s=>{ const x=limpia(s).slice(0,10);return FECHA.test(x)?x:null;};
const formatos={MARKET:'Market',MAYORISTA:'Mayorista',SUPERMAYORISTA:'Supermayorista','CASH AND CARRY':'Supermayorista','CASH & CARRY':'Supermayorista'};
export function normalizarFormato(v){const s=limpia(v);return formatos[s.toUpperCase()]||s||null;}
export function normalizarTiendaLegacy(t){
 const tId=limpia(t?.id), codigo=limpia(t?.idTienda??t?.Cod_Tienda);
 return {id:tId||null,codigoTienda:codigo||null,nombre:limpia(t?.n??t?.nombre??t?.Tienda),formatoId:normalizarFormato(t?.f??t?.formato??t?.FORMATO),zonaId:limpia(t?.zonaId??t?.ID_ZONA)||null,
   departamentoId:limpia(t?.departamentoId??t?.regionId)||null,provinciaId:limpia(t?.provinciaId)||null,distritoId:limpia(t?.distritoId)||null,
   fechaApertura:fecha(t?.fechaApertura),fechaInicioEvidencias:fecha(t?.fechaInicioEvidencias??t?.evidenciasDesde),fechaCierre:fecha(t?.fechaCierre??t?.fechaFinEvidencias??t?.inactivaDesde),
   activaHoy:t?.activa!==false};
}
export function normalizarActividadLegacy(a){
 return {id:limpia(a?.id)||null,nombre:limpia(a?.n??a?.nombre),tipo:limpia(a?.cat)||null,diasSemana:Array.isArray(a?.dias)?a.dias.filter(x=>Number.isInteger(x)&&x>=0&&x<=6):[],
   inicioEvaluacion:fecha(a?.inicioEvaluacion),finVigencia:fecha(a?.finVigencia),activaHoy:a?.activa!==false};
}
export function diagnosticarMaestros({tiendas=[],actividades=[]}={}){
 const avisos=[],codes=new Map(),ids=new Set();
 const tn=tiendas.map(normalizarTiendaLegacy);
 tn.forEach((t,i)=>{
  if(!t.id) avisos.push({tipo:'tienda_sin_id',indice:i});
  if(t.id&&ids.has(t.id)) avisos.push({tipo:'id_interno_duplicado',id:t.id});
  if(t.id)ids.add(t.id);
  if(!t.codigoTienda)avisos.push({tipo:'codigo_tienda_faltante',id:t.id});
  if(t.codigoTienda){const previo=codes.get(t.codigoTienda);if(previo&&previo!==t.id)avisos.push({tipo:'codigo_comercial_duplicado',codigo:t.codigoTienda,tiendas:[previo,t.id]});else codes.set(t.codigoTienda,t.id);}
  if(!t.fechaApertura)avisos.push({tipo:'apertura_sin_fecha_confirmada',id:t.id});
  if(!t.zonaId)avisos.push({tipo:'zona_sin_asignar',id:t.id});
  if(!t.fechaInicioEvidencias)avisos.push({tipo:'incorporacion_evidencias_sin_fecha',id:t.id});
  if(!t.activaHoy&&!t.fechaCierre)avisos.push({tipo:'inactiva_sin_fecha_cierre',id:t.id});
 });
 const an=actividades.map(normalizarActividadLegacy);
 an.forEach((a,i)=>{if(!a.id)avisos.push({tipo:'actividad_sin_id',indice:i});if(!a.inicioEvaluacion)avisos.push({tipo:'actividad_sin_inicio_historico',id:a.id});});
 return {tiendas:tn,actividades:an,avisos};
}
