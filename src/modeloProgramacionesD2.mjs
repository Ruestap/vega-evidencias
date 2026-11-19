/** Formulario D2 - proyeccion de borradores de programaciones, sin escrituras. */
import { normalizarTiendaLegacy } from './adaptadorLegacyD2.mjs';
import { validarDefinicion, generarObligaciones } from './motorObligacionesD2_v2.mjs';
export const NOMBRES_DIAS = ['D','L','M','X','J','V','S'];
const fechaOk = s => /^\d{4}-\d{2}-\d{2}$/.test(String(s||''));
export const escuelas = tiendas => (Array.isArray(tiendas)?tiendas:[]).map(normalizarTiendaLegacy).filter(t=>t.id).sort((a,b)=>a.nombre.localeCompare(b.nombre,'es'));
export function armarBorradorD2({id='vista-previa',actividad,descripcion='',inicio,fin,frecuencia='semanal',diasSemana=[],fechas=[],horaCorte='10:30',tiendasElegidas=[],horasPorTienda={},puntos=10}){
  return {
    id, actividadId:String(actividad?.id||''), actividadNombre:actividad?.n||actividad?.nombre||'',
    tipo:actividad?.cat||'Ad-hoc', objetoEvaluacion:String(descripcion||'').trim(),
    inicio, fin, frecuencia,
    diasSemana:frecuencia==='semanal'?[...diasSemana].map(Number):[],
    diasMes:frecuencia==='mensual'?String(fechas||'').split(/[\s,;]+/).filter(Boolean).map(Number):[],
    fechas:frecuencia==='fechas'?String(fechas||'').split(/[\s,;]+/).filter(Boolean):[],
    horaCorte, alcance:{tiendaIds:[...tiendasElegidas].map(String)},
    asignaciones:[...tiendasElegidas].map(tid=>({tiendaId:String(tid),...(horasPorTienda[tid]?{horaCorte:horasPorTienda[tid]}:{})})),
    entregables:[{id:'implementacion',nombre:String(descripcion||'Implementacion').trim()||'Implementacion',puntosMaximos:Number(puntos)}],
    estado:'borrador',activo:false
  };
}
export function proyectarBorradorD2(p,tiendas){
 const errores=validarDefinicion(p);
 if(!String(p?.objetoEvaluacion||'').trim()) errores.push('Describe el objeto que se implementara o evaluara');
 if(!(Number(p?.entregables?.[0]?.puntosMaximos)>0)) errores.push('Los puntos maximos deben ser mayores que 0');
 if(!fechaOk(p?.inicio)||!fechaOk(p?.fin)||p.fin<p.inicio) errores.push('El periodo debe tener fechas validas');
 if(!errores.length){
   const a=new Date(`${p.inicio}T12:00:00Z`),b=new Date(`${p.fin}T12:00:00Z`);
   if((b-a)/86400000>365) errores.push('Por seguridad, una programacion no debe superar 366 dias');
 }
 if(errores.length) return {errores:[...new Set(errores)],obligaciones:[],totales:{obligaciones:0,tiendas:0,dias:0,porSemana:[],porTienda:[]}};
 const resultado=generarObligaciones({programacion:p,tiendas:escuelas(tiendas),fechaHoraConsulta:`${p.fin}T23:59`,evidencias:[],exclusiones:[]});
 const os=resultado.obligaciones||[];
 const semanal=new Map(),porTienda=new Map(),dias=new Set();
 os.forEach(o=>{
   dias.add(o.fechaInicio);
   // Corte de calendario fijo: S1=1-7, S2=8-14, etc., dentro del mes.
   const clave=`${o.fechaInicio.slice(0,7)} · S${Math.ceil(Number(o.fechaInicio.slice(-2))/7)}`;
   semanal.set(clave,(semanal.get(clave)||0)+1);
   porTienda.set(o.tiendaId,(porTienda.get(o.tiendaId)||0)+1);
 });
 return {errores:resultado.errores||[],obligaciones:os,totales:{obligaciones:os.length,tiendas:porTienda.size,dias:dias.size,porSemana:[...semanal].sort((a,b)=>a[0].localeCompare(b[0])),porTienda:[...porTienda]}};
}
