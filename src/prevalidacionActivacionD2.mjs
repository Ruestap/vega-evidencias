/** EstrategiaTrade D2 P4: puerta de control SIN activar ni escribir en Firebase. */
import { proyectarBorradorD2 } from './modeloProgramacionesD2.mjs';
import { generarObligaciones } from './motorObligacionesD2_v2.mjs';
import { escuelas } from './modeloProgramacionesD2.mjs';

const arr = v => Array.isArray(v) ? v : [];
const texto = v => String(v ?? '').trim().toLocaleLowerCase('es');
const clave = (o, objeto) => [o.actividadId,texto(objeto),o.tiendaId,o.entregableId,o.fechaInicio].map(String).join('|');

/**
 * Revisa una propuesta frente a las programaciones existentes. El resultado NO es
 * una autorización real: la activación requerirá permisos, transacción y auditoría.
 * El cotejo se realiza sobre actividad + entregable + tienda + fecha.
 */
export function prevalidarActivacionD2({propuesta,tiendas=[],programaciones=[],fechaHoraConsulta}={}) {
  const errores=[], avisos=[];
  const muestra=proyectarBorradorD2(propuesta,tiendas);
  errores.push(...muestra.errores);
  if(!errores.length && !muestra.obligaciones.length) errores.push('No hay obligaciones para las tiendas y fechas seleccionadas. Comprueba apertura, cierre y calendario.');
  if(!fechaHoraConsulta || !/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/.test(fechaHoraConsulta)) {
    errores.push('Se requiere fechaHoraConsulta local con formato AAAA-MM-DDTHH:mm.');
  }
  // No se deben considerar borradores ni anuladas como programaciones activas.
  const activas=arr(programaciones).filter(p=>p?.activo===true && !['borrador','anulada','cancelada'].includes(texto(p.estado)) && String(p.id)!==String(propuesta?.id));
  const clavesPropuestas=new Set(muestra.obligaciones.map(o=>clave(o,propuesta?.objetoEvaluacion)));
  let colisiones=0;
  const tiendasNormalizadas=escuelas(tiendas);
  if(!errores.length) for(const p of activas){
    const res=generarObligaciones({programacion:p,tiendas:tiendasNormalizadas,fechaHoraConsulta,evidencias:[],exclusiones:[]});
    if(res.errores.length){avisos.push(`No se pudo comparar una programación activa (${String(p.id)}): definición inválida.`);continue;}
    for(const o of res.obligaciones){
      if(clavesPropuestas.has(clave(o,p.objetoEvaluacion)) && ++colisiones<=3) errores.push(`Posible duplicidad: actividad ${o.actividadId}, tienda ${o.tiendaId}, fecha ${o.fechaInicio}.`);
    }
  }
  if(colisiones>3) errores.push(`Hay ${colisiones} coincidencias con programaciones activas; se muestran solo tres ejemplos.`);
  if(!errores.length && propuesta?.inicio < fechaHoraConsulta.slice(0,10)) avisos.push('La vigencia comienza antes de la fecha de consulta: una activación posterior necesitaría reglas explícitas contra penalización retroactiva.');
  if(!errores.length) avisos.push('Prevalidación técnica superada. No equivale a aprobación ni activa el cálculo oficial.');
  return {
    listoParaRevision:errores.length===0,
    estado:errores.length?'bloqueada':'lista_para_revision',
    errores:[...new Set(errores)],avisos,
    totales:muestra.totales,
    conflictos:colisiones,
    // No devolver acciones ni instrucciones para escribir en Firestore.
  };
}
