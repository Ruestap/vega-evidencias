/** EstrategiaTrade D2 / P1 - motor puro, SIN lectura/escritura Firebase.
 * Zona horaria de negocio: fechas y horas locales Lima (YYYY-MM-DD / HH:mm).
 * El integrador debe pasar fechaHoraConsulta local; no se infiere del servidor.
 * Obligaciones explicitas: fotografia sola JAMAS activa una tienda/formato.
 * API version 2; no sustituir automaticamente motorEvidenciasD2.mjs existente.
 */
export const TIPOS = Object.freeze(['Always On','Promocional','Campaña','BTL','Ad-hoc']);
export const FRECUENCIAS = Object.freeze(['unica','diaria','semanal','mensual','fechas','ventana']);
const dateOK = s => typeof s==='string' && /^\d{4}-\d{2}-\d{2}$/.test(s) && !Number.isNaN(Date.parse(s+'T12:00:00Z')) && new Date(s+'T12:00:00Z').toISOString().slice(0,10)===s;
const timeOK = s => typeof s==='string' && /^([01]\d|2[0-3]):[0-5]\d$/.test(s);
const dayNext = d => { const t=new Date(d+'T12:00:00Z');t.setUTCDate(t.getUTCDate()+1);return t.toISOString().slice(0,10); };
const dow = d => new Date(d+'T12:00:00Z').getUTCDay();
const value = (t,k) => ({zonaId:t.zonaId??t.ID_ZONA,formatoId:t.formatoId??t.f,departamentoId:t.departamentoId??t.regionId,provinciaId:t.provinciaId,distritoId:t.distritoId,canalId:t.canalId,tiendaId:t.id})[k];
const same = (a,b) => String(a)===String(b);
const included = (list,v) => !list?.length || list.some(x=>same(x,v));
const inRange=(d,a,b)=>d>=a&&d<=b;
const arr=x=>Array.isArray(x)?x:[];
export function validarDefinicion(p){
 const errores=[];
 if(!p?.id) errores.push('Falta id de programacion');
 if(!p?.actividadId) errores.push('Falta actividadId');
 if(!TIPOS.includes(p?.tipo)) errores.push('Clasificacion invalida');
 if(!FRECUENCIAS.includes(p?.frecuencia)) errores.push('Frecuencia invalida');
 if(!dateOK(p?.inicio)||!dateOK(p?.fin)||p.inicio>p.fin) errores.push('Vigencia invalida');
 if(!timeOK(p?.horaCorte??'23:59')) errores.push('Hora de corte invalida');
 if(p?.frecuencia==='semanal'&&(!arr(p.diasSemana).length||p.diasSemana.some(x=>!Number.isInteger(x)||x<0||x>6))) errores.push('Dias semanales invalidos');
 if(p?.frecuencia==='mensual'&&(!arr(p.diasMes).length||p.diasMes.some(x=>!Number.isInteger(x)||x<1||x>31))) errores.push('Dias mensuales invalidos');
 if(p?.frecuencia==='fechas'&&(!arr(p.fechas).length||p.fechas.some(x=>!dateOK(x)))) errores.push('Fechas especificas invalidas');
 if(!arr(p.entregables).length) errores.push('Falta entregable');
 if(arr(p.entregables).some(x=>!x?.id||!(Number(x.puntosMaximos)>=0))) errores.push('Entregables invalidos');
 if(!p?.alcance || (!p.alcance.todos&&!arr(p.alcance.tiendaIds).length&&!arr(p.alcance.formatoIds).length&&!arr(p.alcance.zonaIds).length&&!arr(p.alcance.departamentoIds).length&&!arr(p.alcance.provinciaIds).length&&!arr(p.alcance.distritoIds).length&&!arr(p.alcance.canalIds).length)) errores.push('Alcance no definido');
 return errores;
}
/** Filtros interseccion; zona comercial NO es departamento. */
export function seleccionarTiendas(tiendas,alcance={}){
 const filters=[['tiendaIds','tiendaId'],['formatoIds','formatoId'],['canalIds','canalId'],['departamentoIds','departamentoId'],['provinciaIds','provinciaId'],['distritoIds','distritoId'],['zonaIds','zonaId']];
 return arr(tiendas).filter(t=>t?.id!=null && !arr(alcance.excluirTiendaIds).some(x=>same(x,t.id))&&filters.every(([list,k])=>included(alcance[list],value(t,k))));
}
/** Inactividad actual no borra historia; fechas de cierre/apertura documentadas mandan. */
export function tiendaHabilitadaEn(t,d){
 const inicio=t?.fechaInicioEvidencias||t?.fechaApertura||'0001-01-01';
 const fin=t?.fechaFinEvidencias||t?.fechaCierre||'9999-12-31';
 return dateOK(d)&&d>=inicio&&d<=fin;
}
export function diasDeProgramacion(p,asignacion={}){
 const i=asignacion.inicio||p.inicio, f=asignacion.fin||p.fin;
 if(!dateOK(i)||!dateOK(f)||f<i) return [];
 if(p.frecuencia==='ventana') return [i]; // una obligacion con plazo hasta f
 const r=[];let d=i;let count=0;
 while(d<=f){
  if(++count>1500) throw new Error('Periodo excede limite operativo de 1500 dias');
  const elegido=p.frecuencia==='unica'?d===i:p.frecuencia==='diaria'?true:p.frecuencia==='semanal'?arr(p.diasSemana).includes(dow(d)):p.frecuencia==='mensual'?arr(p.diasMes).includes(Number(d.slice(-2))):p.frecuencia==='fechas'?arr(p.fechas).includes(d):false;
  if(elegido) r.push(d);
  d=dayNext(d);
 }
 return r;
}
const key=o=>`${o.programacionId}|${o.tiendaId}|${o.entregableId}|${o.fechaInicio}`;
function buscarEvidencia(o,evidencias){
 return arr(evidencias).filter(e=>e?.anulado!==true && e?.valida!==false && (e.obligacionId===o.id || (same(e.programacionId,o.programacionId)&&same(e.tiendaId,o.tiendaId)&&same(e.entregableId,o.entregableId)&&e.fecha===o.fechaInicio)))
 .sort((a,b)=>String(a.registradoEn||'').localeCompare(String(b.registradoEn||'')))[0];
}
export function generarObligaciones({programacion:p,tiendas,fechaHoraConsulta,evidencias=[],exclusiones=[]}){
 const errores=validarDefinicion(p);
 if(!/^\d{4}-\d{2}-\d{2}T([01]\d|2[0-3]):[0-5]\d$/.test(String(fechaHoraConsulta||''))||!dateOK(fechaHoraConsulta?.slice(0,10))) errores.push('fechaHoraConsulta debe ser YYYY-MM-DDTHH:mm local');
 if(errores.length)return {errores,obligaciones:[]};
 const seleccion=seleccionarTiendas(tiendas,p.alcance);
 const porId=new Map(seleccion.map(t=>[String(t.id),t]));
 const asignaciones=arr(p.asignaciones).length?p.asignaciones:seleccion.map(t=>({tiendaId:t.id}));
 const obligaciones=[];
 for(const a of asignaciones){
  const t=porId.get(String(a.tiendaId)); if(!t||a.cancelada===true)continue;
  const programados=diasDeProgramacion(p,a);
  for(const d of programados){
   if(!tiendaHabilitadaEn(t,d))continue;
   // Ventana: fecha limite final de la ventana; resto: fecha propia, salvo plazo explicito por asignacion.
   const limiteFecha=a.fechaLimite|| (p.frecuencia==='ventana'?(a.fin||p.fin):d);
   const hora=a.horaCorte||p.horaCorte||'23:59';
   if(!dateOK(limiteFecha)||!timeOK(hora))continue;
   for(const entregable of p.entregables){
    const o={id:'',programacionId:String(p.id),actividadId:String(p.actividadId),tipo:p.tipo,tiendaId:String(t.id),entregableId:String(entregable.id),fechaInicio:d,fechaLimite:limiteFecha,horaCorte:hora,puntosMaximos:Number(entregable.puntosMaximos),segmentoSnapshot:{formatoId:value(t,'formatoId')||null,zonaId:value(t,'zonaId')||null,departamentoId:value(t,'departamentoId')||null,provinciaId:value(t,'provinciaId')||null,distritoId:value(t,'distritoId')||null}};
    o.id=key(o);
    const ex=arr(exclusiones).find(x=>x.obligacionId===o.id && x.aprobada===true);
    if(ex){obligaciones.push({...o,estado:'excluida',obtenidos:0,posibles:0,motivoExclusion:ex.motivo||''});continue;}
    const e=buscarEvidencia(o,evidencias);
    const vence=`${limiteFecha}T${hora}`;
    const yaComienza=fechaHoraConsulta>=`${d}T00:00`;
    const vencida=fechaHoraConsulta>vence;
    // Estado 'en_revision' no implica conformidad: requiere verificacion posterior.
    const validada=Boolean(e&&e.aprobada===true);
    const puntuacion=validada?Math.min(o.puntosMaximos,Math.max(0,Number(e.puntos)||0)):0;
    const estado= !yaComienza?'programada': validada?'cumplida':e?'en_revision':vencida?'incumplida':'pendiente';
    const posibles=(validada||vencida)?o.puntosMaximos:0;
    obligaciones.push({...o,estado,registroId:e?.id||null,obtenidos:puntuacion,posibles});
   }
  }
 }
 const unique=new Map(obligaciones.map(o=>[o.id,o]));
 return {errores:[],obligaciones:[...unique.values()]};
}
export function resumen(obligaciones=[]){
 const evaluables=arr(obligaciones).filter(o=>!['excluida','programada','pendiente'].includes(o.estado));
 const posibles=evaluables.reduce((s,o)=>s+o.posibles,0);
 const obtenidos=evaluables.reduce((s,o)=>s+o.obtenidos,0);
 const exigibles=evaluables.filter(o=>o.posibles>0);
 const conformes=exigibles.filter(o=>o.estado==='cumplida');
 return {obtenidos,posibles,eficiencia:posibles?Math.round(100*obtenidos/posibles):null,cumplimiento:exigibles.length?Math.round(100*conformes.length/exigibles.length):null,exigibles:exigibles.length,cumplidas:conformes.length};
}
