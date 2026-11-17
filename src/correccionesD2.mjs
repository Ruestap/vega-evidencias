/** Propuesta D2 de correcciones: genera solicitud+auditoria, sin persistir ni editar evidencia bruta. */
export const CAMPOS_CORREGIBLES = Object.freeze(['fechaEjecucion','horaEjecucion','tiendaId','actividadId']);
export function prepararCorreccion({original, cambios, usuario, motivo, fechaOperacion}){
  if(usuario?.rol!=='admin') return {ok:false,error:'Solo Administrador puede aprobar y ejecutar correcciones'};
  if(!original?.id) return {ok:false,error:'Registro original no identificado'};
  if(String(motivo||'').trim().length<12)return {ok:false,error:'Motivo obligatorio (mínimo 12 caracteres)'};
  if(!fechaOperacion || Number.isNaN(Date.parse(fechaOperacion)))return {ok:false,error:'Fecha de operación inválida'};
  const campos=Object.keys(cambios||{});
  if(!campos.length||campos.some(c=>!CAMPOS_CORREGIBLES.includes(c)))return {ok:false,error:'Campo no autorizado'};
  const anteriores=Object.fromEntries(campos.map(k=>[k,original[k]??null]));
  return {ok:true,correccion:{registroId:original.id,originalId:original.id,actorId:usuario.id,
    motivo:motivo.trim(),realizadaEn:fechaOperacion,antes:anteriores,despues:{...cambios},
    estado:'solicitada',requiereRecalculo:true,versionOriginal:original.version||0}};
}
