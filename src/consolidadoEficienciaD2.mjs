/** EstrategiaTrade D2 / P2. Agregador puro, sin Firebase ni efectos secundarios.
 * No inventa obligaciones a partir de tiendas, fotos ni catalogos.
 * Fuente de verdad: obligaciones emitidas por motorObligacionesD2_v2.
 * Zona horaria: fechas YYYY-MM-DD y fechaHoraConsulta en hora local de Lima.
 */
import {generarObligaciones} from './motorObligacionesD2_v2.mjs';

const fechaValida = x => typeof x === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(x) && !Number.isNaN(Date.parse(x+'T12:00:00Z')) && new Date(x+'T12:00:00Z').toISOString().slice(0,10)===x;
const fechaSiguiente = d => {const t = new Date(d+'T12:00:00Z'); t.setUTCDate(t.getUTCDate()+1); return t.toISOString().slice(0,10);};
const identificador = x => x===null || x===undefined ? null : String(x);
const lista = x => Array.isArray(x) ? x : [];
const porcentaje = (numerador,denominador) => denominador ? Math.round(numerador/denominador*10000)/100 : null;

/** Semana comercial del mes: S1 1-7, S2 8-14, S3 15-21, S4 22-28, S5 29-fin. */
export function periodoD2({tipo,fecha,anio,mes,semana}={}) {
  if(tipo==='dia') {
    if(!fechaValida(fecha)) throw new Error('Fecha diaria invalida');
    return {tipo,inicio:fecha,fin:fecha,etiqueta:fecha};
  }
  const y=Number(anio), m=Number(mes);
  if(!Number.isInteger(y)||y<1900||y>2200||!Number.isInteger(m)||m<1||m>12) throw new Error('Mes o anio invalido');
  const prefijo=`${y}-${String(m).padStart(2,'0')}`;
  const ultimo = new Date(Date.UTC(y,m,0)).getUTCDate();
  if(tipo==='mes') return {tipo,inicio:`${prefijo}-01`,fin:`${prefijo}-${String(ultimo).padStart(2,'0')}`,etiqueta:prefijo};
  if(tipo!=='semana') throw new Error('Tipo de periodo invalido');
  const s=Number(semana);
  if(!Number.isInteger(s)||s<1||s>5) throw new Error('Semana invalida');
  const primero=(s-1)*7+1;
  if(primero>ultimo) throw new Error('Semana fuera del mes');
  return {tipo,inicio:`${prefijo}-${String(primero).padStart(2,'0')}`,fin:`${prefijo}-${String(Math.min(primero+6,ultimo)).padStart(2,'0')}`,etiqueta:`${prefijo} S${s}`};
}

/** Conteo independiente: actividades distintas, ejecuciones, recibidas y puntajes.
 * Recibida significa que existe un registro vinculado; no equivale a aprobada.
 * El estado en_revision posterior al vencimiento cuenta en denominador con cero puntos,
 * hasta que la evidencia sea aprobada. Antes del vencimiento no penaliza.
 */
export function indicadoresD2(obligaciones=[]) {
  const o=lista(obligaciones);
  const validas=o.filter(x=>x?.estado!=='excluida');
  const recibidas=validas.filter(x=>x.registroId!==null && x.registroId!==undefined).length;
  const evaluables=validas.filter(x=>Number(x.posibles)>0);
  const puntosPosibles=evaluables.reduce((n,x)=>n+Number(x.posibles),0);
  const puntosObtenidos=evaluables.reduce((n,x)=>n+Number(x.obtenidos||0),0);
  const conRegistroEvaluable=evaluables.filter(x=>x.registroId!==null && x.registroId!==undefined).length;
  const conformes=evaluables.filter(x=>x.estado==='cumplida').length;
  return {
    actividadesDistintas:new Set(validas.map(x=>identificador(x.actividadId))).size,
    ejecucionesProgramadas:validas.length,
    obligacionesEvaluables:evaluables.length,
    evidenciasRecibidas:recibidas,
    evidenciasRecibidasEvaluables:conRegistroEvaluable,
    cumplimientoEnvioPorcentaje:porcentaje(conRegistroEvaluable,evaluables.length),
    obligacionesAprobadas:conformes,
    puntosObtenidos,puntosPosibles,
    eficienciaPorcentaje:porcentaje(puntosObtenidos,puntosPosibles),
    pendientes:validas.filter(x=>x.estado==='pendiente').length,
    futuras:validas.filter(x=>x.estado==='programada').length,
    incumplidas:validas.filter(x=>x.estado==='incumplida').length,
    enRevision:validas.filter(x=>x.estado==='en_revision').length,
    excluidas:o.length-validas.length
  };
}

const extraerGrupo=(o,agruparPor)=>{
  if(agruparPor==='tienda') return o.tiendaId;
  if(agruparPor==='actividad') return o.actividadId;
  if(agruparPor==='tipo') return o.tipo;
  const k={formato:'formatoId',zona:'zonaId',departamento:'departamentoId',provincia:'provinciaId',distrito:'distritoId'}[agruparPor];
  if(!k) throw new Error('Agrupacion invalida');
  return o.segmentoSnapshot?.[k] ?? '(sin dato)';
};
export function agruparObligacionesD2(obligaciones=[],agruparPor='tienda') {
  const mapa=new Map();
  for(const o of lista(obligaciones)) {
    const id=identificador(extraerGrupo(o,agruparPor))??'(sin dato)';
    if(!mapa.has(id)) mapa.set(id,[]);
    mapa.get(id).push(o);
  }
  return [...mapa.entries()].map(([id,items])=>({id,...indicadoresD2(items)})).sort((a,b)=>a.id.localeCompare(b.id,'es'));
}

/** Genera solo las programaciones explicitamente existentes y proyecta el periodo.
 * Nota ventana: se imputa a su fechaInicio; un filtro por vencimiento requiere otra vista.
 * No incluir borradores/canceladas. El integrador entrega fotografias/evidencias ya vinculadas.
 */
export function consolidarEficienciaD2({programaciones=[],tiendas=[],evidencias=[],exclusiones=[],fechaHoraConsulta,periodo,filtros={},agruparPor='tienda'}={}) {
  if(!periodo?.inicio||!periodo?.fin||!fechaValida(periodo.inicio)||!fechaValida(periodo.fin)||periodo.fin<periodo.inicio) throw new Error('Periodo invalido');
  const obligaciones=[];
  const errores=[];
  for(const p of lista(programaciones)) {
    if(['borrador','cancelada','anulada'].includes(String(p.estado||'').toLowerCase()))continue;
    const r=generarObligaciones({programacion:p,tiendas,fechaHoraConsulta,evidencias,exclusiones});
    if(r.errores.length){errores.push({programacionId:p.id??null,errores:r.errores});continue;}
    obligaciones.push(...r.obligaciones);
  }
  const conocidas=new Map();
  for(const o of obligaciones) {
    if(o.fechaInicio<periodo.inicio||o.fechaInicio>periodo.fin)continue;
    if(filtros.tiendaId!=null && identificador(o.tiendaId)!==identificador(filtros.tiendaId))continue;
    if(filtros.actividadId!=null && identificador(o.actividadId)!==identificador(filtros.actividadId))continue;
    if(filtros.tipo!=null && o.tipo!==filtros.tipo)continue;
    const campos={formatoId:'formatoId',zonaId:'zonaId',departamentoId:'departamentoId',provinciaId:'provinciaId',distritoId:'distritoId'};
    if(Object.entries(campos).some(([f,c])=>filtros[f]!=null && identificador(o.segmentoSnapshot?.[c])!==identificador(filtros[f])))continue;
    // Evita doble conteo de programaciones erroneamente repetidas, sin borrar historicos.
    // Un ID de obligacion diferente representa otra implementacion programada.
    conocidas.set(o.id,o);
  }
  const resultado=[...conocidas.values()];
  return {periodo,indicadores:indicadoresD2(resultado),grupos:agruparObligacionesD2(resultado,agruparPor),obligaciones:resultado,errores};
}
