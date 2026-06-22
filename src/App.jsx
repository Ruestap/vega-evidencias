// ET_FIX_RENDER_TIENDAS_SEED_ODT_CAPACITY_FINAL_20260614
/* ET_FIX_RENDER_UNDEF_DISENO_TIENDA_HELPERS_20260615 */
/* ET_FIX_CIERRE_ODT_TIENDAS_LOGIN_CAPACIDAD_20260614 */
/* ET_FIX_FINAL_ROLES_DASH_CORRECCION_MOTIVOS_20260614 */
/* ET_FIX_ODT_KANBAN_ENTREGADOS_7D_20260614 */
/* ET_FIX_ODT_ESTADO_CORRECCION_NOTIFY_20260614 */
/* ET_TIENDAS_1_5_EDIT_MODAL_COMPACT_20260614 */
/* ET_FIX_ODT_FIRESTORE_WHATSAPP_ALERT_20260614 */
/* ET_FIX_ODT_TIENDA_RESPONSIVE_WHATSAPP_20260614 */
/* ET_FIX_FINAL_ODT_TIENDA_RESPONSIVE_WHATSAPP_20260614 */
import { useState, useMemo, useCallback, useRef, useEffect } from "react";
/* ET_TIENDAS_1_5_VIEWER_APPROVED_20260614 */
/* ET_TIENDAS_1_5_FORMULARIO_LIMPIO_20260614 */
import React from "react";
import { db } from "./firebase";
/* ET_ODT_FINAL_FIX_20260608_2335: reporte lee localStorage en vivo, Outlook compose directo, ErrorBoundary SVG */
import {
  collection, doc, onSnapshot,
  setDoc, deleteDoc, addDoc, updateDoc, query, where, orderBy
} from "firebase/firestore";

/* ══ ERROR BOUNDARY — captura crashes de render y evita pantalla blanca ══ */
class AppErrorBoundary extends React.Component {
  constructor(props){ super(props); this.state={hasError:false,error:null}; }
  static getDerivedStateFromError(error){ return {hasError:true,error}; }
  componentDidCatch(error,info){ console.error("[VEGA ErrorBoundary]",error?.message||"render error"); }
  render(){
    if(this.state.hasError){
      return(
        <div style={{fontFamily:"system-ui,sans-serif",background:"#f0f4f8",minHeight:"100vh",display:"flex",alignItems:"center",justifyContent:"center",padding:20}}>
          <div style={{background:"#fff",borderRadius:16,padding:32,maxWidth:420,width:"100%",boxShadow:"0 4px 24px rgba(0,0,0,.1)",textAlign:"center"}}>
            <div style={{width:64,height:64,borderRadius:18,background:"#fff8ec",display:"grid",placeItems:"center",margin:"0 auto 16px"}}><svg width="34" height="34" viewBox="0 0 24 24" fill="none" stroke="#f6a623" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"/><path d="M12 9v4"/><path d="M12 17h.01"/></svg></div>
            <div style={{fontWeight:800,fontSize:16,color:"#1a2f4a",marginBottom:8}}>Error de aplicación</div>
            <div style={{fontSize:12,color:"#5a7a9a",marginBottom:20,lineHeight:1.6}}>
              Ocurrió un error inesperado. Por favor recarga la página.<br/>
              Si el error persiste, contacta al administrador.
            </div>
            <div style={{fontSize:10,color:"#b2bec3",background:"#f8fafc",borderRadius:8,padding:"8px 12px",fontFamily:"monospace",marginBottom:16,textAlign:"center",wordBreak:"break-all"}}>
              Código: RENDER_ERROR
            </div>
            <button onClick={()=>window.location.reload()}
              style={{padding:"12px 24px",borderRadius:10,border:"none",background:"linear-gradient(135deg,#00b5b4,#1a2f4a)",color:"#fff",fontWeight:700,fontSize:13,cursor:"pointer",display:"inline-flex",alignItems:"center",gap:8}}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 12a9 9 0 11-2.64-6.36"/><path d="M21 3v6h-6"/></svg>Recargar página
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

/* ══ DATOS ══════════════════════════════════════════════ */
// Fallback local — Firestore es la fuente de verdad (ver useEffect de sync config/app)
// ET_FIX_FINAL_NO_TIENDAS_INIT_SEED_20260614: Tiendas no se precargan desde semilla local; Firestore config/app.tiendas es la fuente de verdad.
const TIENDAS_INIT = [];




const RANGOS_DEFAULT = { c100:"09:00", c80:"10:15", c60:"10:30" };

const ACTIVIDADES_INIT = [
  {id:"a01",n:"Grid Promocional",    dias:[1,2,3,4,5],e:"📋",c:"#6c5ce7",cat:"Promocional",r:null,activa:true},
  {id:"a02",n:"Lunes de Menestras",  dias:[1],         e:"🫘",c:"#00b894",cat:"Always On",  r:null,activa:true},
  {id:"a03",n:"Martes de Punche",    dias:[2],         e:"🍳",c:"#f6a623",cat:"Always On",  r:null,activa:true},
  {id:"a04",n:"Miérc. de Tic Tac",  dias:[3],         e:"🛒",c:"#0984e3",cat:"Always On",  r:null,activa:true},
  {id:"a05",n:"Jueves Verse Bien",   dias:[4],         e:"💆",c:"#e84393",cat:"Always On",  r:null,activa:true},
  {id:"a06",n:"Frutas y Verduras",   dias:[5],         e:"🥦",c:"#00b5b4",cat:"Always On",  r:null,activa:true},
  {id:"a07",n:"Catálogos c/ Precios",dias:[1,2,3,4,5], e:"📒",c:"#e17055",cat:"Ad-hoc",    r:null,activa:true},
  {id:"a08",n:"Material POP",        dias:[1,2,3,4,5], e:"🎯",c:"#a29bfe",cat:"Ad-hoc",    r:null,activa:true},
  {id:"a09",n:"Isla / Góndola",      dias:[1,2,3,4,5], e:"🏗️",c:"#fd79a8",cat:"Ad-hoc",   r:null,activa:true},
  {id:"a10",n:"Activación Especial", dias:[1,2,3,4,5], e:"⭐",c:"#fdcb6e",cat:"Ad-hoc",   r:null,activa:true},
];


/* ══ CHECKLIST AUDITORÍA DE CAMPO ══════════════════════════════════════════
   Escala universal: 0=No ejecutado · 1.5=Por mejorar · 3=Correcto
   Score módulo = promedio de ítems respondidos (null si ninguno)
   Score final  = promedio de los 4 módulos con al menos 1 respuesta
   respuestas[itemId] = { valor: number, obs: string }
   respuestas[__obs_moduloId] = { obs: string }  ══ */
const CHECKLIST_MODULOS_INIT = [
  { id:"m01", label:"Evaluación Personal", escala:[0,1.5,3],
    escalaTxt:["No ejecutado","Por mejorar","Correcto"], orden:1, activo:true,
    items:[
      {id:"m01i01",texto:"Hospitalidad y cordialidad",activo:true,orden:1},
      {id:"m01i02",texto:"Uniforme completo",          activo:true,orden:2},
      {id:"m01i03",texto:"Presentación Personal",      activo:true,orden:3},
    ]},
  { id:"m02", label:"Pasos de la venta", escala:[0,1.5,3],
    escalaTxt:["No ejecutado","Por mejorar","Correcto"], orden:2, activo:true,
    items:[
      {id:"m02i01",texto:"Saludo inicial al cliente",       activo:true,orden:1},
      {id:"m02i02",texto:"Conocimiento Always On",          activo:true,orden:2},
      {id:"m02i03",texto:"Abordaje proactivo",              activo:true,orden:3},
      {id:"m02i04",texto:"Acompañamiento guiado",           activo:true,orden:4},
      {id:"m02i05",texto:"Impulso Venta Activa / Vende +",  activo:true,orden:5},
      {id:"m02i06",texto:"Cierre de venta",                 activo:true,orden:6},
    ]},
  { id:"m03", label:"Visibilidad del PDV", escala:[0,1.5,3],
    escalaTxt:["No ejecutado","Por mejorar","Correcto"], orden:3, activo:true,
    items:[
      {id:"m03i01",texto:"Letrero exterior actualizado",           activo:true,orden:1},
      {id:"m03i02",texto:"Material de campaña instalado",          activo:true,orden:2},
      {id:"m03i03",texto:"Reel TV / Audio activado",               activo:true,orden:3},
      {id:"m03i04",texto:"Planograma vigente Foco CAT",            activo:true,orden:4},
      {id:"m03i05",texto:"Cabeceras / Rompetráficos actualizados", activo:true,orden:5},
      {id:"m03i06",texto:"Productos ordenados y limpios",          activo:true,orden:6},
      {id:"m03i07",texto:"Precios visibles y correctos",           activo:true,orden:7},
      {id:"m03i08",texto:"Rotación adecuada (FIFO)",               activo:true,orden:8},
      {id:"m03i09",texto:"Góndola bien abastecida",                activo:true,orden:9},
      {id:"m03i10",texto:"Promociones visibles",                   activo:true,orden:10},
      {id:"m03i11",texto:"Pasillos y corredores despejados",       activo:true,orden:11},
      {id:"m03i12",texto:"Portaprecios instalado y actualizado",   activo:true,orden:12},
      {id:"m03i13",texto:"Exhibidor Vende+ actualizado",           activo:true,orden:13},
    ]},
  { id:"m04", label:"Criterios clave (sanidad · orden)", escala:[0,1.5,3],
    escalaTxt:["No ejecutado","Por mejorar","Correcto"], orden:4, activo:true,
    items:[
      {id:"m04i01",texto:"Frutas y verduras en buen estado",       activo:true,orden:1},
      {id:"m04i02",texto:"Vitrina de comestibles ordenada y limpia",activo:true,orden:2},
    ]},
];

// FIX_SCORE_VERSIONADO_20260530: cálculo escalable por configuración/snapshot de score.
// Retorna {ob, mx, pct} por sección — ob=pts obtenidos, mx=pts máximos posibles.
function getMaxScoreModulo(modulo){
  const escala=Array.isArray(modulo?.escala)&&modulo.escala.length?modulo.escala:[0,1.5,3];
  const maxNum=Math.max(...escala.map(v=>Number(v)||0));
  return Number(modulo?.maxScore ?? modulo?.scoreSnapshot?.maxScore ?? (maxNum || 3));
}
function calcScoreModulo(respuestas,modulo){
  if(!modulo||modulo.scoreEnabled===false) return null;
  const items=(modulo?.items||[]).filter(i=>i.activo);
  if(!items.length) return null;
  const maxModulo=getMaxScoreModulo(modulo);
  const mx=items.reduce((sum,i)=>sum+Number(i.maxScore ?? maxModulo),0);
  const ob=items.reduce((sum,i)=>{
    const v=respuestas?.[i.id]?.valor;
    return sum+(v!==null&&v!==undefined?Number(v)||0:0);
  },0);
  const respondidos=items.filter(i=>respuestas?.[i.id]?.valor!==null&&respuestas?.[i.id]?.valor!==undefined);
  if(!respondidos.length) return null;
  return {ob:Math.round(ob*100)/100, mx:Math.round(mx*100)/100, pct:mx?Math.round((ob/mx)*100):0};
}
// Score final Opción 2: suma total obtenida / 72 pts totales × 100
function calcScoreFinal(respuestas,modulos){
  if(!modulos||!modulos.length) return null;
  const activos=modulos.filter(m=>m.activo);
  let totalOb=0, totalMx=0, algunoRespondido=false;
  activos.forEach(m=>{
    const r=calcScoreModulo(respuestas,m);
    if(r!==null){algunoRespondido=true;totalOb+=r.ob;totalMx+=r.mx;}
  });
  if(!algunoRespondido) return null;
  if(totalMx===0) return null;
  return Math.round((totalOb/totalMx)*100*100)/100; // retorna % con 2 decimales
}
// Tier basado en % final (0-100)
function getTierAuditoria(pct){
  if(pct===null||pct===undefined) return{label:"S/D",c:"#b2bec3",bg:"#f4f6f8",icon:"⬜"};
  if(pct>=90) return{label:"Excelente",c:"#00b894",bg:"#e8faf5",icon:"🥇"};
  if(pct>=75) return{label:"Bueno",    c:"#0984e3",bg:"#e8f4fd",icon:"🥈"};
  if(pct>=60) return{label:"Regular",  c:"#f6a623",bg:"#fff8ec",icon:"⚠️"};
  if(pct>0)   return{label:"Crítico",  c:"#d63031",bg:"#ffeae6",icon:"🔴"};
  return             {label:"Sin nota", c:"#636e72",bg:"#f4f6f8",icon:"⬛"};
}


const VEGA_PALETTE={navy:"#1a2f4a",teal:"#00b5b4",violet:"#6C6EF5",orange:"#f6a623",blue:"#0984e3"};
const ZONAS_VEGA=[
  {id:"01",nombre:"LIMA NORTE"},
  {id:"02",nombre:"CALLAO"},
  {id:"03",nombre:"LIMA CERCADO"},
  {id:"04",nombre:"LIMA MODERNA"},
  {id:"05",nombre:"LIMA SUR"},
  {id:"06",nombre:"LIMA ESTE"},
];
const DISTRITO_ZONA={
  "CHORRILLOS":"05","LA MOLINA":"06","LINCE":"04","LOS OLIVOS":"01","RIMAC":"03","RÍMAC":"03","CARABAYLLO":"01",
  "SAN BORJA":"04","BELLAVISTA":"02","MIRAFLORES":"04","CALLAO":"02","S.J.L.":"06","SAN JUAN DE LURIGANCHO":"06",
  "PUEBLO LIBRE":"04","SAN MIGUEL":"04","SURCO":"05","SANTIAGO DE SURCO":"05","JESUS MARÍA":"04","JESÚS MARÍA":"04",
  "INDEPENDENCIA":"01","S.M.P.":"01","SAN MARTIN DE PORRES":"01","SAN MARTÍN DE PORRES":"01","EL AGUSTINO":"06",
  "BREÑA":"03","LIMA CERCADO":"03","CERCADO DE LIMA":"03","V.M.T.":"05","VILLA MARIA DEL TRIUNFO":"05","VILLA MARÍA DEL TRIUNFO":"05",
  "VENTANILLA":"02","ATE VITARTE":"06","ATE":"06","COMAS":"01","LA VICTORIA":"03","SANTA ANITA":"06","SURQUILLO":"05",
  "PUENTE PIEDRA":"01","V.E.S.":"05","VILLA EL SALVADOR":"05","SAN ISIDRO":"04"
};
const normalizeTxt=s=>String(s||"").normalize("NFD").replace(/[\u0300-\u036f]/g,"").trim().toUpperCase();
function getZonaIdTienda(t){
  const z=String(t?.zonaId||t?.ID_ZONA||"").padStart(2,"0");
  if(ZONAS_VEGA.some(x=>x.id===z)) return z;
  return DISTRITO_ZONA[normalizeTxt(t?.dist||t?.Distrito||"")]||"";
}
function getZonaNombre(zid){return ZONAS_VEGA.find(z=>z.id===String(zid).padStart(2,"0"))?.nombre||"Sin zona";}

// FIX_SECURITY_INPUT_HARDENING_20260606: normalizacion defensiva para campos editables y payloads Firestore.
const SAFE_LIMITS={text:120,longText:260,email:120,phone:12,dni:8,horario:40};
function stripControlChars(value){
  return String(value??"").replace(/[\u0000-\u001F\u007F]/g,"");
}
function sanitizeTextInput(value,max=SAFE_LIMITS.text){
  return stripControlChars(value).replace(/[<>`]/g,"").replace(/\s{2,}/g," ").slice(0,max);
}
function sanitizeEmailInput(value){
  return stripControlChars(value).toLowerCase().replace(/\s+/g,"").replace(/[^a-z0-9._%+@-]/g,"").slice(0,SAFE_LIMITS.email);
}
function sanitizeDigits(value,max=12){
  return String(value??"").replace(/\D/g,"").slice(0,max);
}
function sanitizeHorarioInput(value){
  return stripControlChars(value).toUpperCase().replace(/[^0-9APM:\- A]/g,"").replace(/\s{2,}/g," ").slice(0,SAFE_LIMITS.horario);
}
function normalizeNameInput(value){
  return sanitizeTextInput(value,SAFE_LIMITS.text).replace(/[^A-Za-zÁÉÍÓÚÜÑáéíóúüñ ,.'-]/g,"");
}
function toTitleCase(s){
  return sanitizeTextInput(s,SAFE_LIMITS.text).toLowerCase().replace(/(^|\s|,|-)([a-záéíóúüñ])/g,(m,p,c)=>p+c.toUpperCase()).trim();
}
function isValidCorpEmail(value){
  const email=sanitizeEmailInput(value);
  return !email || /^[a-z0-9._%+-]+@corporacionvega\.pe$/.test(email);
}
function cleanStoreEditDraft(draft){
  return {
    ...draft,
    n:sanitizeTextInput(draft?.n,80),
    idTienda:sanitizeDigits(draft?.idTienda,6),
    emailTienda:sanitizeEmailInput(draft?.emailTienda||draft?.email),
    email:sanitizeEmailInput(draft?.emailTienda||draft?.email),
    gerenteTienda:normalizeNameInput(draft?.gerenteTienda),
    dniGerente:sanitizeDigits(draft?.dniGerente,SAFE_LIMITS.dni),
    celular:sanitizeDigits(draft?.celular,SAFE_LIMITS.phone),
    jefeZonalNombre:normalizeNameInput(draft?.jefeZonalNombre),
    emailJefeZonal:sanitizeEmailInput(draft?.emailJefeZonal),
    dir:sanitizeTextInput(draft?.dir,SAFE_LIMITS.longText),
    dist:sanitizeTextInput(draft?.dist,80),
    zonaId:sanitizeTextInput(draft?.zonaId||draft?.idZona,20),
    lat: draft?.lat==="" || draft?.lat===undefined || draft?.lat===null ? "" : Number(String(draft.lat).replace(",",".")),
    lng: draft?.lng==="" || draft?.lng===undefined || draft?.lng===null ? "" : Number(String(draft.lng).replace(",",".")),
    maps:sanitizeTextInput(draft?.maps||draft?.googleMapsUrl,SAFE_LIMITS.longText),
    activa: draft?.activa===false ? false : true,
    horarioLunJue:sanitizeHorarioInput(draft?.horarioLunJue),
    horarioVieSab:sanitizeHorarioInput(draft?.horarioVieSab),
    horarioDom:sanitizeHorarioInput(draft?.horarioDom),
  };
}
function validateStoreEditDraft(draft){
  const d=cleanStoreEditDraft(draft);
  if(!d.n) return {ok:false,msg:"Ingresa el nombre de tienda."};
  if(d.emailTienda&&!isValidCorpEmail(d.emailTienda)) return {ok:false,msg:"El email de tienda debe ser corporativo: @corporacionvega.pe"};
  if(d.emailJefeZonal&&!isValidCorpEmail(d.emailJefeZonal)) return {ok:false,msg:"El email zonal debe ser corporativo: @corporacionvega.pe"};
  if(d.dniGerente&&d.dniGerente.length!==8) return {ok:false,msg:"El DNI del gerente debe tener 8 dígitos."};
  if(d.celular&&d.celular.length<9) return {ok:false,msg:"El celular del gerente debe tener al menos 9 dígitos."};
  if(d.lat!=="" && (!Number.isFinite(d.lat) || d.lat < -90 || d.lat > 90)) return {ok:false,msg:"Latitud inválida. Debe estar entre -90 y 90."};
  if(d.lng!=="" && (!Number.isFinite(d.lng) || d.lng < -180 || d.lng > 180)) return {ok:false,msg:"Longitud inválida. Debe estar entre -180 y 180."};
  if(d.maps && !/^https?:\/\//i.test(d.maps)) return {ok:false,msg:"El link de Google Maps debe iniciar con http o https."};
  return {ok:true,draft:d};
}
function getRouteMetaFromTiendas(lista){
  const zonas=[...new Set((lista||[]).map(getZonaIdTienda).filter(Boolean))];
  const distritos=[...new Set((lista||[]).map(t=>t.dist).filter(Boolean))].sort();
  const formatos=[...new Set((lista||[]).map(t=>t.f).filter(Boolean))].sort();
  return {zonas,distritos,formatos,totalTiendas:(lista||[]).length};
}
function defaultScoreConfig(modulo){
  const nowIso=new Date().toISOString();
  return {
    enabled:false,
    tipo:"numerico",
    escala:Array.isArray(modulo?.escala)&&modulo.escala.length?modulo.escala:[0,1.5,3],
    labels:Array.isArray(modulo?.escalaTxt)&&modulo.escalaTxt.length?modulo.escalaTxt:["No ejecutado","Por mejorar","Correcto"],
    version:Number(modulo?.scoreConfig?.version||1),
    vigenteDesde:modulo?.scoreConfig?.vigenteDesde||nowIso,
    vigenteHasta:null,
    createdAt:modulo?.scoreConfig?.createdAt||nowIso
  };
}
function normalizeScoreConfig(modulo){
  const cfg={...defaultScoreConfig(modulo),...(modulo?.scoreConfig||{})};
  if(cfg.tipo==="binario"){cfg.escala=[0,1];cfg.labels=cfg.labels?.length===2?cfg.labels:["No","Sí"];}
  if(cfg.tipo==="checklist"){cfg.escala=[0,1];cfg.labels=cfg.labels?.length===2?cfg.labels:["No realizado","Realizado"];}
  cfg.escala=(cfg.escala||[]).map(v=>Number(v)).filter(v=>!Number.isNaN(v));
  if(!cfg.escala.length) cfg.escala=[0,1.5,3];
  cfg.maxScore=Math.max(...cfg.escala.map(v=>Number(v)||0));
  return cfg;
}
function buildScoreSnapshotForModulo(modulo){
  const cfg=normalizeScoreConfig(modulo);
  return {
    moduloId:modulo?.id||"",
    moduloNombre:modulo?.nombre||modulo?.label||"",
    enabled:cfg.enabled===true,
    tipo:cfg.tipo,
    escala:cfg.escala,
    labels:cfg.labels,
    maxScore:cfg.maxScore,
    version:cfg.version,
    vigenteDesde:cfg.vigenteDesde,
    snapshotAt:new Date().toISOString()
  };
}
function scoreConfigToAuditModulo(m,mi=0){
  const snapshot=buildScoreSnapshotForModulo(m);
  return {
    id:m.id,label:m.nombre,
    escala:snapshot.escala,
    escalaTxt:snapshot.labels,
    maxScore:snapshot.maxScore,
    scoreEnabled:snapshot.enabled,
    scoreSnapshot:snapshot,
    items:(m.tareas||[]).filter(t=>t.activo!==false).map((t,ti)=>({
      id:t.id||`${m.id}_t${ti}`,texto:t.nombre||t.id||`Item ${ti+1}`,activo:true,orden:ti,maxScore:snapshot.maxScore
    })),
    activo:true,
    c:[VEGA_PALETTE.violet,VEGA_PALETTE.teal,VEGA_PALETTE.blue,VEGA_PALETTE.orange][mi%4]||VEGA_PALETTE.violet
  };
}
// FIX_RUTAS_ZONA_DISTRITO_20260530: rutas auditables por zona, distrito, formato y snapshot de cobertura.
// FIX_CALENDARIO_TRADE_20260531: calendarios por perfil, feriados corporativos y carga masiva directorio.
const CALENDARIO_PERFILES={
  administrativo:{id:"administrativo",nombre:"Administrativo",dias:[1,2,3,4,5,6],horarios:{1:["08:30","18:30"],2:["08:30","18:30"],3:["08:30","18:30"],4:["08:30","18:30"],5:["08:30","18:30"],6:["09:00","12:00"]},domingoRegular:false,requiereExcepcionDomingo:true},
  operativo_trade:{id:"operativo_trade",nombre:"Operativo Trade",dias:[1,2,3,4,5,6,0],horarios:{1:["08:30","18:30"],2:["08:30","18:30"],3:["08:30","18:30"],4:["08:30","18:30"],5:["08:30","18:30"],6:["09:00","12:00"],0:["tienda","tienda"]},domingoRegular:true,requiereExcepcionDomingo:false},
  tienda:{id:"tienda",nombre:"Tienda",dias:[1,2,3,4,5,6,0],usaHorarioTienda:true,domingoRegular:true}
};
const FERIADOS_OPERATIVOS_2026=[
  {fecha:"2026-01-01",nombre:"Año Nuevo",tipo:"feriado_nacional",laborable:false},
  {fecha:"2026-01-02",nombre:"Día no laborable sector público",tipo:"dia_no_laborable",laborable:true,requiereRevision:true},
  {fecha:"2026-04-02",nombre:"Jueves Santo",tipo:"feriado_variable",laborable:false},
  {fecha:"2026-04-03",nombre:"Viernes Santo",tipo:"feriado_variable",laborable:false},
  {fecha:"2026-05-01",nombre:"Día del Trabajo",tipo:"feriado_nacional",laborable:false},
  {fecha:"2026-06-07",nombre:"Día de la Bandera",tipo:"dia_comercial",laborable:true},
  {fecha:"2026-06-29",nombre:"San Pedro y San Pablo",tipo:"feriado_nacional",laborable:false},
  {fecha:"2026-07-23",nombre:"Día de la Fuerza Aérea del Perú",tipo:"feriado_nacional",laborable:false},
  {fecha:"2026-07-27",nombre:"Día no laborable previo a Fiestas Patrias",tipo:"dia_no_laborable",laborable:true,requiereRevision:true},
  {fecha:"2026-07-28",nombre:"Fiestas Patrias",tipo:"feriado_nacional",laborable:false},
  {fecha:"2026-07-29",nombre:"Fiestas Patrias",tipo:"feriado_nacional",laborable:false},
  {fecha:"2026-08-06",nombre:"Batalla de Junín",tipo:"feriado_nacional",laborable:false},
  {fecha:"2026-08-30",nombre:"Santa Rosa de Lima",tipo:"feriado_nacional",laborable:false},
  {fecha:"2026-10-08",nombre:"Combate de Angamos",tipo:"feriado_nacional",laborable:false},
  {fecha:"2026-11-01",nombre:"Todos los Santos",tipo:"feriado_nacional",laborable:false},
  {fecha:"2026-12-08",nombre:"Inmaculada Concepción",tipo:"feriado_nacional",laborable:false},
  {fecha:"2026-12-09",nombre:"Batalla de Ayacucho",tipo:"feriado_nacional",laborable:false},
  {fecha:"2026-12-25",nombre:"Navidad",tipo:"feriado_nacional",laborable:false}
];
const DIRECTORIO_TIENDAS_2026=[{"idTienda":"127","sucursal":"MARKET ALAMEDA LOS CEDROS","formato":"MARKET","direccion":"Av. Alameda Los Cedros 214","distrito":"Chorrillos","zonaId":"05","gerenteTienda":"Diana Arpita","dniGerente":"70128964","celular":"905463505","emailTienda":"tiendamkalamedaloscedros@corporacionvega.pe","jefeZonal":"118","emailJefeZonal":"","horarioLunJue":"7:30 AM A 10:00PM","horarioVieSab":"7:30 AM A 10:00PM","horarioDom":"7:30 AM A 10:00PM"},{"idTienda":"131","sucursal":"MARKET ALAMEDA LOS CÓNDORES","formato":"MARKET","direccion":"Alameda los Condores 628","distrito":"La Molina","zonaId":"06","gerenteTienda":"Omar Cabezas","dniGerente":"76247282","celular":"960137801","emailTienda":"Tiendamkalamedaloscondores@corporacionvega.pe","jefeZonal":"118","emailJefeZonal":"","horarioLunJue":"7:00 AM A 10:00PM","horarioVieSab":"7:00 AM A 10:00PM","horarioDom":"7:00 AM A 10:00PM"},{"idTienda":"106","sucursal":"ALAYZA CANEVARO II","formato":"MARKET","direccion":"Av. General Cesar Canevaro Nro. 213 Lima - Lima - Lince","distrito":"Lince","zonaId":"04","gerenteTienda":"Desiderio Alcala","dniGerente":"48001526","celular":"950106098","emailTienda":"tiendamkcanevaro@corporacionvega.pe","jefeZonal":"118","emailJefeZonal":"","horarioLunJue":"7:00 AM A 10:30PM","horarioVieSab":"7:00 AM A 10:30PM","horarioDom":"7:00 AM A 10:30PM"},{"idTienda":"119","sucursal":"VEGA MARKET LOS ALISOS","formato":"MARKET","direccion":"Av. Los Alisos Mz. R Lote 45 Urb. Los Jazmines de Naranjal","distrito":"Los Olivos","zonaId":"01","gerenteTienda":"Milagros Perez","dniGerente":"44577178","celular":"905435118","emailTienda":"tiendamkalisos@corporacionvega.pe","jefeZonal":"118","emailJefeZonal":"","horarioLunJue":"7:30 AM A 10:30PM","horarioVieSab":"7:30 AM A 10:30PM","horarioDom":"7:30 AM A 10:30PM"},{"idTienda":"126","sucursal":"VEGA MARKET AMANCAES 3","formato":"MARKET","direccion":"Av. Amancaes 124, Rímac","distrito":"Rimac","zonaId":"03","gerenteTienda":"","dniGerente":"","celular":"","emailTienda":"","jefeZonal":"","emailJefeZonal":"","horarioLunJue":"","horarioVieSab":"","horarioDom":""},{"idTienda":"64","sucursal":"AMARANTO","formato":"MARKET","direccion":"Jr. Amaranto 108 - 110, Urb. Santa Isabel","distrito":"Carabayllo","zonaId":"01","gerenteTienda":"SIN ASIGNACION","dniGerente":"77236208","celular":"946347670","emailTienda":"tiendamkamaranto@corporacionvega.pe","jefeZonal":"118","emailJefeZonal":"","horarioLunJue":"7:30 AM A 10:30PM","horarioVieSab":"7:30 AM A 10:30PM","horarioDom":"7:30 AM A 10:30PM"},{"idTienda":"57","sucursal":"AVIACIÓN","formato":"MARKET","direccion":"Av. Aviacion N° 3540","distrito":"San Borja","zonaId":"04","gerenteTienda":"Alvaro Quispe","dniGerente":"72965830","celular":"960814794","emailTienda":"tiendamkaviacion@corporacionvega.pe","jefeZonal":"JHONATAN AYLLON","emailJefeZonal":"ayllon.j@corporacionvega.pe","horarioLunJue":"7:30 AM A 10:00PM","horarioVieSab":"7:30 AM A 10:00PM","horarioDom":"7:30 AM A 10:00PM"},{"idTienda":"129","sucursal":"MARKET BELLAVISTA","formato":"MARKET","direccion":"Jiron. Grau 485","distrito":"Bellavista","zonaId":"02","gerenteTienda":"Marlene Bustos","dniGerente":"71269335","celular":"946401416","emailTienda":"tiendamkbellavista@corporacionvega.pe","jefeZonal":"118","emailJefeZonal":"","horarioLunJue":"7:30 AM A 09:30PM","horarioVieSab":"7:30 AM A 10:00PM","horarioDom":"7:30 AM A 09:30PM"},{"idTienda":"104","sucursal":"BENAVIDES","formato":"MARKET","direccion":"Av. Alfredo Benavides Nro. 1615 Urb. San Jorge Lima - Lima - Miraflores","distrito":"Miraflores","zonaId":"04","gerenteTienda":"Andrea Cajahuaringa","dniGerente":"77511782","celular":"960135900","emailTienda":"tiendamkbenavides@corporacionvega.pe","jefeZonal":"118","emailJefeZonal":"","horarioLunJue":"7:00 AM A 10:00PM","horarioVieSab":"7:00 AM A 10:00PM","horarioDom":"7:00 AM A 10:00PM"},{"idTienda":"62","sucursal":"BOCANEGRA","formato":"MARKET","direccion":"Av. Bocanegra Mz, A Lote N° 30, Urb. Albino Herrera, Primera Etapa","distrito":"Callao","zonaId":"02","gerenteTienda":"Cristhian Pino","dniGerente":"76354842","celular":"933109000","emailTienda":"tiendamkbocanegra@corporacionvega.pe","jefeZonal":"118","emailJefeZonal":"","horarioLunJue":"7:30 AM A 10:00PM","horarioVieSab":"7:30 AM A 10:00PM","horarioDom":"7:30 AM A 10:00PM"},{"idTienda":"49","sucursal":"CANEVARO","formato":"MARKET","direccion":"Av. Canevaro N°1405 (Ref. frente al Parque de bomberos)","distrito":"Lince","zonaId":"04","gerenteTienda":"Desiderio Alcala","dniGerente":"48001526","celular":"950106098","emailTienda":"tiendamkcanevaro@corporacionvega.pe","jefeZonal":"118","emailJefeZonal":"","horarioLunJue":"7:00 AM A 10:30PM","horarioVieSab":"7:00 AM A 10:30PM","horarioDom":"7:00 AM A 10:30PM"},{"idTienda":"68","sucursal":"CANTA CALLAO","formato":"MARKET","direccion":"Parcela 2-A, Ex Fundo Taboada – Valle de Boca Negra, Local Comercial Nº 110","distrito":"Callao","zonaId":"02","gerenteTienda":"Jennifer Mena","dniGerente":"48277500","celular":"933121837","emailTienda":"tiendamkcantacallao@corporacionvega.pe","jefeZonal":"118","emailJefeZonal":"","horarioLunJue":"7:30 AM A 10:30PM","horarioVieSab":"7:30 AM A 10:30PM","horarioDom":"7:30 AM A 10:30PM"},{"idTienda":"47","sucursal":"CHIMU","formato":"MARKET","direccion":"Av Gran Chimu 1641 Urb. Zarate","distrito":"S.J.L.","zonaId":"06","gerenteTienda":"Marina Peralta","dniGerente":"60573452","celular":"981219210","emailTienda":"tiendamkchimu@corporacionvega.pe","jefeZonal":"118","emailJefeZonal":"","horarioLunJue":"7:30 AM A 10:00PM","horarioVieSab":"7:30 AM A 10:00PM","horarioDom":"7:30 AM A 10:00PM"},{"idTienda":"113","sucursal":"VEGA MARKET CLEMENT","formato":"MARKET","direccion":"Av. José Leguía y Meléndez Nro. 1040","distrito":"Pueblo Libre","zonaId":"04","gerenteTienda":"Angelica Espino","dniGerente":"45242373","celular":"923673251","emailTienda":"tiendamkclement@corporacionvega.pe","jefeZonal":"118","emailJefeZonal":"","horarioLunJue":"7:30 AM A 10:00PM","horarioVieSab":"7:30 AM A 10:00PM","horarioDom":"7:30 AM A 10:00PM"},{"idTienda":"66","sucursal":"ESCARDO","formato":"MARKET","direccion":"Av. Rafael Escardo Salazar Nº 454 urbanización Maranga","distrito":"San Miguel","zonaId":"04","gerenteTienda":"Sandra Perez","dniGerente":"71352880","celular":"923864933","emailTienda":"tiendamkescardo@corporacionvega.pe","jefeZonal":"118","emailJefeZonal":"","horarioLunJue":"7:30 AM A 10:00PM","horarioVieSab":"7:30 AM A 10:00PM","horarioDom":"7:30 AM A 10:00PM"},{"idTienda":"136","sucursal":"MARKET GUARDIA CIVIL NORTE","formato":"MARKET","direccion":"Av. Guardia Civil Norte 625, Urb. Los Parrales de Surco","distrito":"Surco","zonaId":"05","gerenteTienda":"SIN ASIGNACION","dniGerente":"126","celular":"903132051","emailTienda":"tiendamkguardiacivil@corporacionvega.pe","jefeZonal":"118","emailJefeZonal":"","horarioLunJue":"","horarioVieSab":"7:30 AM A 10:00PM","horarioDom":"7:30 AM A 10:00PM"},{"idTienda":"102","sucursal":"OVALO HIGUERETA","formato":"MARKET","direccion":"Av. Santiago De Surco Nro. 3004 Int. 101 Urb. La Castellana Lima","distrito":"Surco","zonaId":"05","gerenteTienda":"Maryori Melchor","dniGerente":"75616859","celular":"972106044","emailTienda":"tiendamkhiguereta@corporacionvega.pe","jefeZonal":"118","emailJefeZonal":"","horarioLunJue":"7:30 AM A 10:00PM","horarioVieSab":"7:30 AM A 10:00PM","horarioDom":"7:30 AM A 10:00PM"},{"idTienda":"54","sucursal":"HUANDOY","formato":"MARKET","direccion":"Av Huandoy N° 5032","distrito":"Los Olivos","zonaId":"01","gerenteTienda":"Garmith Garcia","dniGerente":"70616834","celular":"936087278","emailTienda":"tiendamkhuandoy@corporacionvega.pe","jefeZonal":"118","emailJefeZonal":"","horarioLunJue":"7:30 AM A 10:00PM","horarioVieSab":"7:30 AM A 10:30PM","horarioDom":"7:30 AM A 10:00PM"},{"idTienda":"105","sucursal":"HUSARES JUNIN","formato":"MARKET","direccion":"Av. Husares De Junin Nro. 366 Int. 1 Fnd. Oyague","distrito":"Jesus María","zonaId":"04","gerenteTienda":"Dangelo Mendoza","dniGerente":"75784643","celular":"970175458","emailTienda":"tiendamkhusaresdejunin@corporacionega.pe","jefeZonal":"118","emailJefeZonal":"","horarioLunJue":"7:30 AM A 10:00PM","horarioVieSab":"7:30 AM A 10:00PM","horarioDom":"7:30 AM A 10:00PM"},{"idTienda":"81","sucursal":"IGNACIO MERINO","formato":"MARKET","direccion":"Av. Ignacio Merino 1999","distrito":"Lince","zonaId":"04","gerenteTienda":"Janice Perez","dniGerente":"72860206","celular":"919285149","emailTienda":"tiendamkmerino@corporacionvega.pe","jefeZonal":"118","emailJefeZonal":"","horarioLunJue":"7:30 AM A 10:00PM","horarioVieSab":"7:30 AM A 10:30PM","horarioDom":"7:30 AM A 10:00PM"},{"idTienda":"135","sucursal":"MARKET INDEPENDENCIA","formato":"MARKET","direccion":"Av. Gerardo Unger Nro. 3601 local LC02 Urb. Industrial Panamericana Norte","distrito":"Independencia","zonaId":"01","gerenteTienda":"Edilcia Erazo","dniGerente":"76406913","celular":"947153066","emailTienda":"tiendamkindependencia@corporacionvega.pe","jefeZonal":"118","emailJefeZonal":"","horarioLunJue":"7:30 AM A 10:00PM","horarioVieSab":"7:30 AM A 10:00PM","horarioDom":"7:30 AM A 10:00PM"},{"idTienda":"46","sucursal":"IZAGUIRRE","formato":"MARKET","direccion":"Av Carlos Izaguirre MZ \"A\", Lt 30","distrito":"S.M.P.","zonaId":"01","gerenteTienda":"Claudia condezo","dniGerente":"72208222","celular":"955262639","emailTienda":"tiendamkizaguirre@corporacionvega.pe","jefeZonal":"118","emailJefeZonal":"","horarioLunJue":"7:30 AM A 10:00PM","horarioVieSab":"7:30 AM A 10:00PM","horarioDom":"7:30 AM A 10:00PM"},{"idTienda":"109","sucursal":"LA CULTURA","formato":"MARKET","direccion":"Av. Aviación N° 2347","distrito":"San Borja","zonaId":"04","gerenteTienda":"Juliana Flores","dniGerente":"48529473","celular":"977836664","emailTienda":"tiendamklacultura@corporacionvega.pe","jefeZonal":"118","emailJefeZonal":"","horarioLunJue":"7:30 AM A 10:00PM","horarioVieSab":"7:30 AM A 10:30PM","horarioDom":"7:30 AM A 10:00PM"},{"idTienda":"132","sucursal":"MARKET LAS GUINDAS - EL AGUSTINO","formato":"MARKET","direccion":"Ca. Las Guindas 348 Urb, El Agustino (Ref media cuadra Condominios Alameda El Agustino)","distrito":"El Agustino","zonaId":"06","gerenteTienda":"Nayely Yllaconza Alfaro","dniGerente":"74638654","celular":"924081454","emailTienda":"tiendamklasguindas@corporacionvega.pe","jefeZonal":"118","emailJefeZonal":"","horarioLunJue":"7:30 AM A 10:00PM","horarioVieSab":"7:30 AM A 10:00PM","horarioDom":"7:30 AM A 10:00PM"},{"idTienda":"122","sucursal":"VEGA MARKET LORETO","formato":"MARKET","direccion":"Jiron Loreto 478","distrito":"Breña","zonaId":"03","gerenteTienda":"Estefany Vicuña","dniGerente":"38761055","celular":"977813294","emailTienda":"tiendamkloreto@corporacionvega.pe","jefeZonal":"118","emailJefeZonal":"","horarioLunJue":"7:30 AM A 10:30PM","horarioVieSab":"7:30 AM A 10:30PM","horarioDom":"7:30 AM A 10:30PM"},{"idTienda":"121","sucursal":"VEGA MARKET LOS OLIVOS","formato":"MARKET","direccion":"Av. Los Olivos 210","distrito":"S.M.P.","zonaId":"01","gerenteTienda":"Gladys Nima Velasquez","dniGerente":"9472570","celular":"919469433","emailTienda":"tiendamklosolivos@corporacionvega.pe","jefeZonal":"118","emailJefeZonal":"","horarioLunJue":"7:30 AM A 10:00PM","horarioVieSab":"7:30 AM A 10:30PM","horarioDom":"7:30 AM A 10:00PM"},{"idTienda":"36","sucursal":"MALVINAS","formato":"MARKET","direccion":"Av Argentina cdra 6 Int \"L\" . CC Via Mix","distrito":"Lima Cercado","zonaId":"03","gerenteTienda":"Karla Mark","dniGerente":"41628705","celular":"936760427","emailTienda":"tiendamkmalvinas@corporacionvega.pe","jefeZonal":"118","emailJefeZonal":"","horarioLunJue":"7:30 AM A 10:00PM","horarioVieSab":"7:30 AM A 10:00PM","horarioDom":"7:30 AM A 10:00PM"},{"idTienda":"108","sucursal":"MARANGA","formato":"MARKET","direccion":"Av. Los Precursores N° 362-366 - San Miguel","distrito":"San Miguel","zonaId":"04","gerenteTienda":"Melany Malpartida","dniGerente":"75116179","celular":"977835975","emailTienda":"tiendamkmaranga@corporacionvega.pe","jefeZonal":"JORGE ANGEL","emailJefeZonal":"angel.j@corporacionvega.pe","horarioLunJue":"7:30 AM A 10:00PM","horarioVieSab":"7:30 AM A 10:00PM","horarioDom":"7:30 AM A 10:00PM"},{"idTienda":"55","sucursal":"MARIATEGUI","formato":"MARKET","direccion":"Jose Carlos Mareategui N° 798","distrito":"V.M.T.","zonaId":"05","gerenteTienda":"Alison Begazo","dniGerente":"70924408","celular":"981400423","emailTienda":"tiendamkvillamariategui@corporacionvega.pe","jefeZonal":"MIRIAM CALDERON","emailJefeZonal":"calderon.m@corporacionvega.pe","horarioLunJue":"7:30 AM A 10:00PM","horarioVieSab":"7:30 AM A 10:00PM","horarioDom":"7:30 AM A 10:00PM"},{"idTienda":"130","sucursal":"MARKET MARIANO CORNEJO","formato":"MARKET","direccion":"Av Mariano Cornejo 1407","distrito":"Pueblo Libre","zonaId":"04","gerenteTienda":"Estefany Perez","dniGerente":"75472806","celular":"923026116","emailTienda":"tiendamkmarianocornejo@corporacionvega.pe","jefeZonal":"118","emailJefeZonal":"","horarioLunJue":"7:30 AM A 10:00PM","horarioVieSab":"7:30 AM A 10:00PM","horarioDom":"7:30 AM A 10:00PM"},{"idTienda":"125","sucursal":"MARKET MARIANO PASTOR","formato":"MARKET","direccion":"C. Mariano Pastor Sevilla 194 (Ref 1/2 cuadra Merc Bolivar)","distrito":"Pueblo Libre","zonaId":"04","gerenteTienda":"Edith Navarro","dniGerente":"44780016","celular":"905435166","emailTienda":"tiendamkmarianopastor@corporacionvega.pe","jefeZonal":"118","emailJefeZonal":"","horarioLunJue":"7:30 AM A 10:00PM","horarioVieSab":"7:30 AM A 10:00PM","horarioDom":"7:30 AM A 10:00PM"},{"idTienda":"65","sucursal":"MI PERU","formato":"MARKET","direccion":"Av. Ayacucho  Mz \"A9\" Lt -22 Gr \"A\" - Mi Perú","distrito":"Ventanilla","zonaId":"02","gerenteTienda":"SIN ASIGNACION","dniGerente":"126","celular":"924699772","emailTienda":"tiendamkmiperu@corporacionvega.pe","jefeZonal":"118","emailJefeZonal":"","horarioLunJue":"","horarioVieSab":"7:30 AM A 10:00PM","horarioDom":"7:30 AM A 10:00PM"},{"idTienda":"138","sucursal":"MARKET MICAELA - ATE VITARTE","formato":"MARKET","direccion":"Calle Comercial Mz U Lote 9 (Ref 1/2 cuadra de mercado modelo n°1 micaela bastidas)","distrito":"Ate Vitarte","zonaId":"06","gerenteTienda":"Daniela Jacobe Chavez","dniGerente":"70534738","celular":"970671821","emailTienda":"tiendamkmicaelabastidas@corporacionvega.pe","jefeZonal":"118","emailJefeZonal":"","horarioLunJue":"7:30 AM A 10:00PM","horarioVieSab":"7:30 AM A 10:00PM","horarioDom":"7:30 AM A 10:00PM"},{"idTienda":"58","sucursal":"MONTENEGRO","formato":"MARKET","direccion":"Jr. Mar de flores. Oeste 127 MZ Q1 - Lt 2B","distrito":"S.J.L.","zonaId":"06","gerenteTienda":"Andrea Chirinos","dniGerente":"73960825","celular":"998367335","emailTienda":"tiendamkmontenegro@corporacionvega.pe","jefeZonal":"118","emailJefeZonal":"","horarioLunJue":"7:30 AM A 10:00PM","horarioVieSab":"7:30 AM A 10:00PM","horarioDom":"7:30 AM A 10:00PM"},{"idTienda":"48","sucursal":"PALMERAS","formato":"MARKET","direccion":"Av Las Palmeras 5345","distrito":"Los Olivos","zonaId":"01","gerenteTienda":"Gissel Garcia","dniGerente":"48813628","celular":"955261940","emailTienda":"tiendamkpalmeras@corporacionvega.pe","jefeZonal":"LUIS CHIRRE","emailJefeZonal":"chirre.l@corporacionvega.pe","horarioLunJue":"7:30 AM A 10:00PM","horarioVieSab":"7:30 AM A 10:00PM","horarioDom":"7:30 AM A 10:00PM"},{"idTienda":"74","sucursal":"RIOBAMBA","formato":"MARKET","direccion":"Urb. Perú, Jr. Riobamba 501, San Martín de Porres","distrito":"S.M.P.","zonaId":"01","gerenteTienda":"Rosa Vela","dniGerente":"74325960","celular":"946228284","emailTienda":"tiendamkriobamba@corporacionvega.pe","jefeZonal":"ADRIAN BOHORQUEZ","emailJefeZonal":"bohorquez.a@corporacionvega.pe","horarioLunJue":"7:30 AM A 09:30PM","horarioVieSab":"7:30 AM A 10:00PM","horarioDom":"7:30 AM A 09:30PM"},{"idTienda":"110","sucursal":"ROOSEVELT","formato":"MARKET","direccion":"Jr. Franklin Roosevelt 812","distrito":"Surco","zonaId":"05","gerenteTienda":"","dniGerente":"","celular":"","emailTienda":"","jefeZonal":"","emailJefeZonal":"","horarioLunJue":"","horarioVieSab":"","horarioDom":""},{"idTienda":"115","sucursal":"MARKET ROSPIGLIOSI","formato":"MARKET","direccion":"Av. Ignacio Merino Nro. 1502 esq. con Manuel Segura","distrito":"Lince","zonaId":"04","gerenteTienda":"Wilson Ruiz","dniGerente":"74747773","celular":"902763401","emailTienda":"tiendamkrospigliosi@corporacionvega.pe","jefeZonal":"118","emailJefeZonal":"","horarioLunJue":"7:30 AM A 10:00PM","horarioVieSab":"7:30 AM A 10:00PM","horarioDom":"7:30 AM A 10:00PM"},{"idTienda":"128","sucursal":"MARKET SALAMANCA","formato":"MARKET","direccion":"Urb. Salamanca de Monterrico Av. Los Aymaras 349","distrito":"Ate Vitarte","zonaId":"06","gerenteTienda":"Flor del Rocio Karina Medina Meza","dniGerente":"70331727","celular":"908921583","emailTienda":"tiendamksalamanca@corporacionvega.pe","jefeZonal":"118","emailJefeZonal":"","horarioLunJue":"7:30 AM A 10:00PM","horarioVieSab":"7:30 AM A 10:00PM","horarioDom":"7:30 AM A 10:00PM"},{"idTienda":"114","sucursal":"","formato":"MARKET","direccion":"Av. Los Ángeles 602, Comas 15314","distrito":"Comas","zonaId":"01","gerenteTienda":"FRASSINETTI ROJAS, MARCO ANTONIO","dniGerente":"09145374","celular":"998131795","emailTienda":"tiendasmsurcobenavides@corporacionvega.pe","jefeZonal":"18","emailJefeZonal":"","horarioLunJue":"7:00 AM A 10:00PM","horarioVieSab":"7:00 AM A 10:00PM","horarioDom":"7:00 AM A 10:00PM"},{"idTienda":"134","sucursal":"MARKET SAN LUIS","formato":"MARKET","direccion":"Av. San Juan 771 San Luis","distrito":"La Victoria","zonaId":"03","gerenteTienda":"Daysi Espinoza","dniGerente":"60917070","celular":"923808560","emailTienda":"tiendamksanluis@corporacionvega.pe","jefeZonal":"118","emailJefeZonal":"","horarioLunJue":"7:30 AM A 10:00PM","horarioVieSab":"7:30 AM A 10:00PM","horarioDom":"7:30 AM A 10:00PM"},{"idTienda":"114","sucursal":"VEGA MARKET PLAZA SANTA CATALINA","formato":"MARKET","direccion":"Av. Carlos Villaran 500 - C.C. Santa","distrito":"La Victoria","zonaId":"03","gerenteTienda":"Fernando Mendoza","dniGerente":"77014295","celular":"977742429","emailTienda":"tiendamksantacatalina@corporacion.pe","jefeZonal":"118","emailJefeZonal":"","horarioLunJue":"7:30 AM A 10:00PM","horarioVieSab":"7:30 AM A 10:30PM","horarioDom":"7:30 AM A 10:00PM"},{"idTienda":"41","sucursal":"SANTO DOMINGO","formato":"MARKET","direccion":"Av Mariano Condorcanqui Mz T","distrito":"Carabayllo","zonaId":"01","gerenteTienda":"Ana Tarazona","dniGerente":"75115874","celular":"994062180","emailTienda":"tiendamksantodomingo@corporacionvega.pe","jefeZonal":"118","emailJefeZonal":"","horarioLunJue":"7:30 AM A 10:00PM","horarioVieSab":"7:30 AM A 10:00PM","horarioDom":"7:30 AM A 10:00PM"},{"idTienda":"63","sucursal":"UNIVERSAL","formato":"MARKET","direccion":"Jr. César Vallejo 356- 360 Urb. Universal","distrito":"Santa Anita","zonaId":"06","gerenteTienda":"William Mamani","dniGerente":"71152755","celular":"908864064","emailTienda":"tiendamkuniversal@corporacionega.pe","jefeZonal":"118","emailJefeZonal":"","horarioLunJue":"7:30 AM A 10:00PM","horarioVieSab":"7:30 AM A 10:00PM","horarioDom":"7:30 AM A 10:00PM"},{"idTienda":"116","sucursal":"MARKET VARA DE ORO","formato":"MARKET","direccion":"Calle Vara de Oro 288 - Urg Zarate Comu 3","distrito":"S.J.L.","zonaId":"06","gerenteTienda":"Jesus Aranda","dniGerente":"73856215","celular":"994195075","emailTienda":"tiendamkvaradeoro@corporacionvega.pe","jefeZonal":"118","emailJefeZonal":"","horarioLunJue":"7:30 AM A 10:00PM","horarioVieSab":"7:30 AM A 10:00PM","horarioDom":"7:30 AM A 10:00PM"},{"idTienda":"137","sucursal":"MARKET VILLARAN-SURQUILLO","formato":"MARKET","direccion":"Av. Manuel Villlaran 708 Urb. Los Sauces Surquillo","distrito":"Surquillo","zonaId":"05","gerenteTienda":"Sayuri Ramos","dniGerente":"76824616","celular":"908661641","emailTienda":"tiendamkmanuelvillaran@corporacionvega.pe","jefeZonal":"118","emailJefeZonal":"","horarioLunJue":"7:30 AM A 10:00PM","horarioVieSab":"7:30 AM A 10:00PM","horarioDom":"7:30 AM A 10:00PM"},{"idTienda":"20","sucursal":"COLLIQUE","formato":"MAYORISTA","direccion":"Av. Andrés Avelino Cáceres N°236, Mz K, Lt.1, 2da. Zona (Mcdo. 12 de Octubre)","distrito":"Comas","zonaId":"01","gerenteTienda":"JUDITH GARCIA MANSILLA","dniGerente":"46999189","celular":"981447496","emailTienda":"tiendamycollique@corporacionvega.pe","jefeZonal":"18","emailJefeZonal":"","horarioLunJue":"7:00 AM A 7:00 PM","horarioVieSab":"7:00 AM A 7:00 PM","horarioDom":"7:00 AM A 4:00 PM"},{"idTienda":"19","sucursal":"INFANTAS","formato":"MAYORISTA","direccion":"Av.  Av Gerardo Unger 6531(Ref Media  Cuadra Comisaria de Infantas)","distrito":"S.M.P.","zonaId":"01","gerenteTienda":"ESPINOZA URBIZAGASTEGUI, MARITZA","dniGerente":"48342783","celular":"924493221","emailTienda":"tiendamyinfantas@corporacionvega.pe","jefeZonal":"18","emailJefeZonal":"","horarioLunJue":"8:00 AM A 8:00 PM","horarioVieSab":"8:00 AM A 8:00 PM","horarioDom":"8:00 AM A 2:00 PM"},{"idTienda":"39","sucursal":"PRODUCTORES","formato":"MAYORISTA","direccion":"Av. La Cultura s/n Psje. B Puesto 13 Santa Anita - Mercado Productores","distrito":"Santa Anita","zonaId":"06","gerenteTienda":"","dniGerente":"","celular":"","emailTienda":"","jefeZonal":"","emailJefeZonal":"","horarioLunJue":"","horarioVieSab":"","horarioDom":""},{"idTienda":"2","sucursal":"AÑO NUEVO CASH","formato":"CASH AND CARRY","direccion":"Urb. Villa Collique Zonal 4 Jr. Jupiter Mz 6 Lote 68","distrito":"Comas","zonaId":"01","gerenteTienda":"TORREJON CAMPOS, GIOVANNA JACKELINE","dniGerente":"10741260","celular":"981446596","emailTienda":"tiendasmanonuevo@corporacionvega.pe","jefeZonal":"MARTHA SAYAGO 981464464","emailJefeZonal":"sayago.m@corporacionvega.pe","horarioLunJue":"7:00 AM A 7:00 PM","horarioVieSab":"7:00 AM A 7:00 PM","horarioDom":"7:00 AM A 7:00 PM"},{"idTienda":"82","sucursal":"BELAUNDE","formato":"MAYORISTA","direccion":"Av Belaunde Oeste 198","distrito":"Comas","zonaId":"01","gerenteTienda":"QUISPE ZAFRA, ROSA IRENE","dniGerente":"40583983","celular":"908931759","emailTienda":"tiendasmbelaunde@corporacionvega.pe","jefeZonal":"18","emailJefeZonal":"","horarioLunJue":"7:30 AM A 9:30PM","horarioVieSab":"7:30 AM A 9:30PM","horarioDom":"7:30 AM A 5:00PM"},{"idTienda":"24","sucursal":"CHORRILLOS","formato":"CASH AND CARRY","direccion":"Jr. Genaro Numa Llona N° 200 (Ref Alt 2 de Estacion de Bomberos )","distrito":"Chorrillos","zonaId":"05","gerenteTienda":"","dniGerente":"","celular":"","emailTienda":"","jefeZonal":"","emailJefeZonal":"","horarioLunJue":"","horarioVieSab":"","horarioDom":""},{"idTienda":"37","sucursal":"COLONIAL","formato":"CASH AND CARRY","direccion":"Av Colonial  679 - Int 103 - Cruce Carcamo (Cercado de Lima)","distrito":"Lima Cercado","zonaId":"03","gerenteTienda":"CORNEJO FIGUEROA, DAVID ALONSO","dniGerente":"46177458","celular":"981444354","emailTienda":"tiendasmcolonial@corporacionvega.pe","jefeZonal":"18","emailJefeZonal":"","horarioLunJue":"7:00 AM A 10:00 PM","horarioVieSab":"7:00 AM A 10:00 PM","horarioDom":"7:00 AM A 10:00 PM"},{"idTienda":"60","sucursal":"FILOMENO","formato":"CASH AND CARRY","direccion":"Urb. Ciudad  y Campo - Av Armando Filomeno 105","distrito":"Rimac","zonaId":"03","gerenteTienda":"CORTEZ TAIPE, WENDY LISBETH","dniGerente":"47558407","celular":"981445079","emailTienda":"tiendasmfilomeno@corporacionvega.pe","jefeZonal":"18","emailJefeZonal":"","horarioLunJue":"7:00 AM A 9.30PM","horarioVieSab":"7:00 AM A 9.30PM","horarioDom":"7:00 AM A 9.30PM"},{"idTienda":"5","sucursal":"HUAMANTANGA","formato":"CASH AND CARRY","direccion":"Av. Puente Piedra 200(Ref - Frente al Puesto Regular)","distrito":"Puente Piedra","zonaId":"01","gerenteTienda":"RODAS SALAS, ARQUIMEDES RICHARD","dniGerente":"44499334","celular":"981 448 481","emailTienda":"tiendasmhuamantanga@corporacionvega.pe","jefeZonal":"18","emailJefeZonal":"","horarioLunJue":"6:00 AM A 7:00 PM","horarioVieSab":"6:00 AM A 7:00 PM","horarioDom":"6:00 AM A 7:00 PM"},{"idTienda":"72","sucursal":"LIMA VES","formato":"CASH AND CARRY","direccion":"Av. Lima Lt \"A - 02\" (Ref Ex Electra) Villa El Salvador","distrito":"V.E.S.","zonaId":"05","gerenteTienda":"","dniGerente":"","celular":"","emailTienda":"","jefeZonal":"","emailJefeZonal":"","horarioLunJue":"","horarioVieSab":"","horarioDom":""},{"idTienda":"98","sucursal":"MINKA CASH","formato":"CASH AND CARRY","direccion":"Av. Argentina N°3093 - Pabellón 7 - Int 97","distrito":"Callao","zonaId":"02","gerenteTienda":"ABREGU GUILLEN, LUIS ALBERTO","dniGerente":"40452075","celular":"994190675","emailTienda":"tiendasmminka@corporacionvega.pe","jefeZonal":"18","emailJefeZonal":"","horarioLunJue":"7:00 AM A 10:00 PM","horarioVieSab":"7:00 AM A 10:00 PM","horarioDom":"7:00 AM A 10:00 PM"},{"idTienda":"32","sucursal":"NARANJAL","formato":"CASH AND CARRY","direccion":"Av. Pacasmayo Mz. A Lt -01 Ref. (Ovalo de Canta Callao / Av Sol de Naranjal)","distrito":"S.M.P.","zonaId":"01","gerenteTienda":"NOLE CHIROQUE, JUAN GABRIEL","dniGerente":"22","celular":"981166984","emailTienda":"tiendasmnaranjal@corporacionvega.pe","jefeZonal":"18","emailJefeZonal":"","horarioLunJue":"","horarioVieSab":"7:00 AM A 9:00 PM","horarioDom":"7:00 AM A 9:00 PM"},{"idTienda":"112","sucursal":"NÉSTOR GAMBETA CASH","formato":"CASH AND CARRY","direccion":"Via Leocio Prado  Mz G Lt.96 (Ref 2 Cuadras de PRECIO UNO)","distrito":"Puente Piedra","zonaId":"01","gerenteTienda":"","dniGerente":"","celular":"","emailTienda":"","jefeZonal":"","emailJefeZonal":"","horarioLunJue":"","horarioVieSab":"","horarioDom":""},{"idTienda":"31","sucursal":"SAN ANTONIO","formato":"CASH AND CARRY","direccion":"Fundación Punchauca Caudivilla Mz \"D\" Lt - 01 San Antonio Alt. km 22 de la Tupac Amaru","distrito":"Carabayllo","zonaId":"01","gerenteTienda":"ROSALES LOPEZ, JESSICA GRACIELA","dniGerente":"42083653","celular":"981480643","emailTienda":"tiendasmsanantonio@corporacionvega.pe","jefeZonal":"18","emailJefeZonal":"","horarioLunJue":"7:00 AM A 9:00 PM","horarioVieSab":"7:00 AM A 9:00 PM","horarioDom":"7:00 AM A 9:00 PM"},{"idTienda":"34","sucursal":"SAN DIEGO","formato":"CASH AND CARRY","direccion":"Mza. Ñ1 Lote 3 Urb. San Diego Vipol","distrito":"S.M.P.","zonaId":"01","gerenteTienda":"LOPEZ CAMPOS, MARIA FIORELA","dniGerente":"72166579","celular":"933596376","emailTienda":"tiendasmsandiego@corporacionvega.pe","jefeZonal":"18","emailJefeZonal":"","horarioLunJue":"8:00 AM A 10:00 PM","horarioVieSab":"8:00 AM A 10:00 PM","horarioDom":"7:00 AM A 9:00 PM"},{"idTienda":"78","sucursal":"SANTA CLARA","formato":"CASH AND CARRY","direccion":"Av. Estrella 286 Urb. Santa Clara  Distrito de Ate Vitarte","distrito":"Ate Vitarte","zonaId":"06","gerenteTienda":"ALAMA OTOYA, ANDY WALTER","dniGerente":"40043081","celular":"929421036","emailTienda":"tiendasmsantaclara@corporacionvega.pe","jefeZonal":"18","emailJefeZonal":"","horarioLunJue":"7:00 AM A 10:00 PM","horarioVieSab":"7:00 AM A 10:00 PM","horarioDom":"7:00 AM A 10:00 PM"},{"idTienda":"35","sucursal":"SURCO","formato":"CASH AND CARRY","direccion":"Urb Prolongacion  Benavides - Av Tomas Marsano Mz \"G-4\" Lt 23","distrito":"Surco","zonaId":"05","gerenteTienda":"FRASSINETTI ROJAS, MARCO ANTONIO","dniGerente":"09145374","celular":"998131795","emailTienda":"tiendasmsurcobenavides@corporacionvega.pe","jefeZonal":"18","emailJefeZonal":"","horarioLunJue":"7:00 AM A 10:00PM","horarioVieSab":"7:00 AM A 10:00PM","horarioDom":"7:00 AM A 10:00PM"},{"idTienda":"111","sucursal":"TRES REGIONES CASH","formato":"CASH AND CARRY","direccion":"Panamericana norte km. 33.5, Zapallal - Puente Piedra (mercado las tres regiones)","distrito":"Puente Piedra","zonaId":"01","gerenteTienda":"ALVARADO BOLAÑOS, MARIA FLOR","dniGerente":"47340490","celular":"981023282","emailTienda":"tiendasmtresregiones@corporacionvega.pe","jefeZonal":"18","emailJefeZonal":"","horarioLunJue":"7:00 AM A 7:00 PM","horarioVieSab":"7:00 AM A 7:00 PM","horarioDom":"7:00 AM A 7:00 PM"},{"idTienda":"172","sucursal":"","formato":"MAYORISTA","direccion":"Avenida Javier Prado Este 1372-1380","distrito":"San Isidro","zonaId":"04","gerenteTienda":"FRASSINETTI ROJAS, MARCO ANTONIO","dniGerente":"09145374","celular":"998131795","emailTienda":"tiendasmsurcobenavides@corporacionvega.pe","jefeZonal":"18","emailJefeZonal":"","horarioLunJue":"7:00 AM A 10:00PM","horarioVieSab":"7:00 AM A 10:00PM","horarioDom":"7:00 AM A 10:00PM"}];
function thirdSundayOfAugust(year){
  const d=new Date(year,7,1);let count=0;
  for(let day=1;day<=31;day++){d.setDate(day);if(d.getDay()===0){count++;if(count===3)return `${year}-08-${String(day).padStart(2,"0")}`;}}
  return `${year}-08-16`;
}
function getFeriadosOperativos(year){
  const base=year===2026?FERIADOS_OPERATIVOS_2026:FERIADOS_OPERATIVOS_2026.map(f=>({...f,fecha:f.fecha.replace(/^2026/,String(year))}));
  return [...base,{fecha:thirdSundayOfAugust(year),nombre:"Vega Evento / Aniversario Vega",tipo:"feriado_corporativo",laborable:false,afectaRutas:true,afectaAuditorias:true,permiteExcepcionAdmin:true}];
}
function getFeriadoOperativo(fechaStr){
  const year=Number(String(fechaStr||"").slice(0,4))||new Date().getFullYear();
  return getFeriadosOperativos(year).find(f=>f.fecha===fechaStr)||null;
}
function isOperativoTradeUser(u){
  const txt=normalizeTxt([u?.perfilCalendario,u?.equipo,u?.area,u?.cargo,u?.rol,u?.nombre].filter(Boolean).join(" "));
  return /OPERATIVO|TRADE|PROMOTOR|PROMOTORA|MERCADERISTA|DEGUSTADOR|DEGUSTADORA/.test(txt);
}
function getPerfilCalendarioUsuario(u){
  if(u?.perfilCalendario&&CALENDARIO_PERFILES[u.perfilCalendario]) return u.perfilCalendario;
  if(isOperativoTradeUser(u)) return "operativo_trade";
  return "administrativo";
}
function canAuditarEnFecha(usuario,fechaStr,tienda,{isAdmin=false,asignacionExcepcional=false}={}){
  const d=new Date((fechaStr||todayStr())+"T12:00:00");
  const dow=d.getDay();
  const feriado=getFeriadoOperativo(fechaStr);
  const perfil=getPerfilCalendarioUsuario(usuario);
  const cfg=CALENDARIO_PERFILES[perfil]||CALENDARIO_PERFILES.administrativo;
  if(isAdmin) return {ok:true,perfil,estado:(dow===0||feriado?.laborable===false)?"excepcional_admin":"regular",feriado};
  if(asignacionExcepcional) return {ok:true,perfil,estado:"excepcional_asignada",feriado};
  if(feriado&&feriado.laborable===false) return {ok:false,perfil,estado:"bloqueado_feriado",feriado};
  if(dow===0&&!cfg.domingoRegular) return {ok:false,perfil,estado:"bloqueado_domingo",feriado};
  if(!(cfg.dias||[]).includes(dow)) return {ok:false,perfil,estado:"fuera_calendario",feriado};
  if(perfil==="operativo_trade"&&dow===0){
    const horarioDom=tienda?.horarioDom||tienda?.horario?.domingo||"";
    return {ok:!!horarioDom,perfil,estado:horarioDom?"regular_tienda_domingo":"sin_horario_tienda",feriado};
  }
  return {ok:true,perfil,estado:"regular",feriado};
}
function mapFormatoDirectorio(formato){
  const f=normalizeTxt(formato);
  if(f.includes("MARKET")) return "Market";
  if(f.includes("CASH")||f.includes("SUPERMAYOR")) return "Supermayorista";
  return "Mayorista";
}
function compactStoreName(s){
  return String(s||"").replace(/^VEGA\s+/i,"").replace(/^MARKET\s+/i,"").replace(/^CASH\s+/i,"").replace(/^TRADICIONAL\s+/i,"").trim();
}
function buildContactosTiendaFromDirectorio(row){
  const contactos=[];
  const gerenteNombre=String(row?.gerenteTienda||"").trim();
  const gerenteValido=gerenteNombre&&normalizeTxt(gerenteNombre)!=="SIN ASIGNACION";
  if(gerenteValido){
    contactos.push({
      id:"gerente_tienda",
      tipo:"contacto_operativo",
      cargo:"Gerente/Jefe de tienda",
      nombre:gerenteNombre,
      dni:row.dniGerente||"",
      celular:row.celular||"",
      email:row.emailTienda||"",
      accesoApp:false,
      usuarioId:null,
      activo:true,
      fuente:"Directorio Tiendas 2026"
    });
  }
  const zonalNombre=String(row?.jefeZonal||"").trim();
  if(zonalNombre){
    contactos.push({
      id:"jefe_zonal",
      tipo:"contacto_operativo",
      cargo:"Jefe zonal",
      nombre:zonalNombre,
      email:row.emailJefeZonal||"",
      accesoApp:false,
      usuarioId:null,
      activo:true,
      fuente:"Directorio Tiendas 2026"
    });
  }
  return contactos;
}
function getContactoPrincipalTienda(tienda){
  const contactos=(tienda?.contactosTienda||[]).filter(c=>c&&c.activo!==false);
  return contactos.find(c=>c.id==="gerente_tienda")||contactos[0]||null;
}
function mergeDirectorioTiendas(tiendasActuales, directorio=DIRECTORIO_TIENDAS_2026){
  const normName=t=>normalizeTxt(String(t?.n||"").replace(/^VEGA /i,""));
  const current=[...(tiendasActuales||[])];
  directorio.forEach(row=>{
    const n=compactStoreName(row.sucursal);
    if(!n) return;
    let idx=current.findIndex(t=>String(t.idTienda||"")===String(row.idTienda));
    if(idx<0) idx=current.findIndex(t=>normName(t)===normalizeTxt(n)||normalizeTxt(n).includes(normName(t))||normName(t).includes(normalizeTxt(n)));
    const contactosTienda=buildContactosTiendaFromDirectorio(row);
    const contactoPrincipal=contactosTienda.find(c=>c.id==="gerente_tienda")||null;
    const patch={
      idTienda:row.idTienda,n:n,f:mapFormatoDirectorio(row.formato),dir:row.direccion,dist:row.distrito,zonaId:row.zonaId,
      email:row.emailTienda,emailTienda:row.emailTienda,
      contactoTienda:contactoPrincipal,contactosTienda,
      gerenteTienda:contactoPrincipal?.nombre||"",dniGerente:contactoPrincipal?.dni||"",celular:contactoPrincipal?.celular||"",
      jefeZonalNombre:contactosTienda.find(c=>c.id==="jefe_zonal")?.nombre||"",emailJefeZonal:row.emailJefeZonal,
      jefeTiendaEsUsuario:false,usuarioJefeTiendaId:null,requiereUsuarioTienda:false,rolSugeridoSiAccede:"viewer_tienda",
      horarioLunJue:row.horarioLunJue,horarioVieSab:row.horarioVieSab,horarioDom:row.horarioDom,
      horario:{lunJue:row.horarioLunJue,vieSab:row.horarioVieSab,domingo:row.horarioDom},
      tiendaAuditada:true,activa:true,actualizadoDirectorio:"2026"
    };
    if(idx>=0) current[idx]={...current[idx],...patch};
    else current.push({id:"td"+row.idTienda,...patch});
  });
  return current;
}

// FIX_AUTONORM_TIENDAS_20260602 — normaliza tiendas sin idTienda cuyo nombre sucio matchea el directorio
// Corre silenciosamente al cargar config. Solo toca n, idTienda y f — nunca borra registros.
function autoNormalizeTiendasSucias(tiendas, directorio=DIRECTORIO_TIENDAS_2026){
  const tokenes=s=>normalizeTxt(s).split(/\s+/).filter(w=>w.length>2);
  const score=(a,b)=>{const ta=tokenes(a),tb=tokenes(b);const matches=ta.filter(w=>tb.includes(w));return matches.length/Math.max(ta.length,tb.length,1);};
  let changed=false;
  const result=tiendas.map(t=>{
    if(t.idTienda||t.editadoManualmente) return t; // ya tiene ID o fue editado a mano
    // buscar mejor match en directorio
    let best=null,bestScore=0;
    directorio.forEach(row=>{
      if(!row.sucursal) return;
      const s=score(t.n||"",compactStoreName(row.sucursal));
      if(s>bestScore){bestScore=s;best=row;}
    });
    if(best&&bestScore>=0.5){ // ≥50% tokens coinciden → match confiable
      changed=true;
      const contactosTienda=buildContactosTiendaFromDirectorio(best);
      const contactoPrincipal=contactosTienda.find(c=>c.id==="gerente_tienda")||null;
      return{...t,
        n:compactStoreName(best.sucursal),
        idTienda:best.idTienda,
        f:mapFormatoDirectorio(best.formato),
        dir:best.direccion||t.dir||"",
        dist:best.distrito||t.dist||"",
        emailTienda:best.emailTienda||t.emailTienda||t.email||"",
        email:best.emailTienda||t.email||"",
        gerenteTienda:contactoPrincipal?.nombre||t.gerenteTienda||"",
        contactosTienda,contactoTienda:contactoPrincipal,
        jefeZonalNombre:contactosTienda.find(c=>c.id==="jefe_zonal")?.nombre||t.jefeZonalNombre||"",
        autoNormalizado:true,autoNormalizadoEn:new Date().toISOString(),
      };
    }
    return t;
  });
  return{result,changed};
}

const MESES = ["Enero","Febrero","Marzo","Abril","Mayo","Junio","Julio","Agosto","Septiembre","Octubre","Noviembre","Diciembre"];
const DIAS_N = ["Domingo","Lunes","Martes","Miércoles","Jueves","Viernes","Sábado"];
const DIAS_C = ["D","L","M","MI","J","V","S"];
const FMT = {
  Mayorista:      {c:"#6c5ce7",bg:"#f0edff"},
  Supermayorista: {c:"#0984e3",bg:"#e8f4fd"},
  Market:         {c:"#00b5b4",bg:"#e0fafa"},
};

const BRAND_FONT = "'Michroma','DM Sans',system-ui,sans-serif";

const EstrategiaTradeIcon = ({ size=44, radius=12 } = {}) => (
  <div style={{
    width:size,
    height:size,
    borderRadius:radius,
    background:"linear-gradient(135deg,#00b5b4,#1a2f4a)",
    display:"flex",
    alignItems:"center",
    justifyContent:"center",
    flexShrink:0,
    boxShadow:"0 10px 22px rgba(0,0,0,.18)"
  }}>
    <svg width={Math.round(size*.62)} height={Math.round(size*.62)} viewBox="0 0 64 64" fill="none" aria-hidden="true">
      <rect x="8" y="10" width="38" height="46" rx="5" fill="white"/>
      <rect x="18" y="6" width="18" height="10" rx="4" fill="#b2bec3"/>
      <rect x="12" y="22" width="22" height="3" rx="1.5" fill="#b2d8e8"/>
      <rect x="12" y="30" width="18" height="3" rx="1.5" fill="#b2d8e8"/>
      <rect x="12" y="38" width="14" height="3" rx="1.5" fill="#b2d8e8"/>
      <circle cx="44" cy="44" r="14" fill="#37474F"/>
      <circle cx="44" cy="44" r="10" fill="none" stroke="#78909C" strokeWidth="3"/>
      <line x1="50" y1="50" x2="56" y2="56" stroke="#37474F" strokeWidth="4" strokeLinecap="round"/>
      <circle cx="44" cy="44" r="6" fill="none" stroke="#90A4AE" strokeWidth="2"/>
    </svg>
  </div>
);


/* ── Sidebar nav SVG icons ── */
/* IcoPending — reemplaza ⏳ reloj de arena */
const IcoPending=({size=14,color="#0984e3"})=>(
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M5 3h14M5 21h14M6 3v4l4 4-4 4v4M18 3v4l-4 4 4 4v4"/>
  </svg>
);
/* IcoClipboard — reemplaza 📋 */
const IcoClipboard=({size=14,color="currentColor"})=>(
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <rect x="8" y="2" width="8" height="4" rx="1.5" ry="1.5"/>
    <path d="M16 4h2a2 2 0 012 2v14a2 2 0 01-2 2H6a2 2 0 01-2-2V6a2 2 0 012-2h2"/>
    <line x1="9" y1="11" x2="15" y2="11"/><line x1="9" y1="15" x2="13" y2="15"/>
  </svg>
);
/* IcoEvidenciasTab — basado en inspection_18476166.png: documento con lupa naranja */
const IcoEvidenciasTab=({active,size=18})=>{
  const c=active?"#fff":"#94A3B8";
  const acc=active?"rgba(255,255,255,.9)":"#6C6EF5";
  return(
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <rect x="2" y="2" width="13" height="17" rx="2" stroke={c} strokeWidth="1.5" fill={active?"rgba(255,255,255,.15)":"none"}/>
      <line x1="5" y1="7" x2="12" y2="7" stroke={c} strokeWidth="1.2" strokeLinecap="round"/>
      <line x1="5" y1="10" x2="10" y2="10" stroke={c} strokeWidth="1.2" strokeLinecap="round"/>
      <line x1="5" y1="13" x2="8" y2="13" stroke={c} strokeWidth="1.2" strokeLinecap="round"/>
      <circle cx="16.5" cy="15.5" r="4" stroke={acc} strokeWidth="1.8" fill="none"/>
      <line x1="19.5" y1="18.5" x2="22" y2="21" stroke={acc} strokeWidth="2" strokeLinecap="round"/>
    </svg>
  );
};
/* IcoAuditoriaTab — basado en monitor_10409824.png: pantalla monitor con lupa/ojo */
const IcoAuditoriaTab=({active,size=18})=>{
  const c=active?"#fff":"#94A3B8";
  return(
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <rect x="2" y="3" width="20" height="14" rx="2" stroke={c} strokeWidth="1.5" fill={active?"rgba(255,255,255,.1)":"none"}/>
      <line x1="8" y1="21" x2="16" y2="21" stroke={c} strokeWidth="1.5" strokeLinecap="round"/>
      <line x1="12" y1="17" x2="12" y2="21" stroke={c} strokeWidth="1.5" strokeLinecap="round"/>
      <circle cx="12" cy="10" r="3" stroke={c} strokeWidth="1.4" fill="none"/>
      <circle cx="12" cy="10" r="1.2" fill={c}/>
      <path d="M6.5 10c1.5-2.5 9-2.5 11 0" stroke={c} strokeWidth="1.2" strokeLinecap="round" fill="none"/>
    </svg>
  );
};

const IcoInicio = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M3.5 11.7c0-.7.3-1.4.85-1.86l6.5-5.4a1.7 1.7 0 012.3 0l6.5 5.4c.55.46.85 1.16.85 1.86V19a1.6 1.6 0 01-1.6 1.6H5.1A1.6 1.6 0 013.5 19v-7.3z"/>
    <path d="M9.6 20.6v-3.7a2.4 2.4 0 014.8 0v3.7"/>
  </svg>
);
const IcoTiendas = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M5.5 4h13l2.3 4.3a2.4 2.4 0 01-2.3 3.1 2.4 2.4 0 01-2.25-1.55 2.4 2.4 0 01-2.25 1.55 2.4 2.4 0 01-2.25-1.55 2.4 2.4 0 01-2.25 1.55 2.4 2.4 0 01-2.25-1.55 2.4 2.4 0 01-2.25 1.55A2.4 2.4 0 013.2 8.3z"/>
    <line x1="9" y1="4.5" x2="9" y2="7.5"/>
    <line x1="15" y1="4.5" x2="15" y2="7.5"/>
    <path d="M5 11.4v7.1a1.5 1.5 0 001.5 1.5h11a1.5 1.5 0 001.5-1.5v-7.1"/>
  </svg>
);
const IcoUsuarios = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <circle cx="9" cy="7" r="4"/>
    <path d="M3 21v-2a4 4 0 014-4h4a4 4 0 014 4v2"/>
    <path d="M16 3.13a4 4 0 010 7.75M21 21v-2a4 4 0 00-3-3.87"/>
  </svg>
);
const IcoConfig = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <circle cx="12" cy="12" r="3"/>
    <path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 010 2.83 2 2 0 01-2.83 0l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-4 0v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83-2.83l.06-.06A1.65 1.65 0 004.68 15a1.65 1.65 0 00-1.51-1H3a2 2 0 010-4h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 012.83-2.83l.06.06A1.65 1.65 0 009 4.68a1.65 1.65 0 001-1.51V3a2 2 0 014 0v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 2.83l-.06.06A1.65 1.65 0 0019.4 9a1.65 1.65 0 001.51 1H21a2 2 0 010 4h-.09a1.65 1.65 0 00-1.51 1z"/>
  </svg>
);
const IcoHamburger = () => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" aria-hidden="true">
    <line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="18" x2="21" y2="18"/>
  </svg>
);
const IcoClose = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" aria-hidden="true">
    <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
  </svg>
);

/* ══ ICONOS SVG DE FORMATO — globales (usados en Tiendas, Viewer, StatusCard) ══ */
const IcoMayorista=({size=20,color="currentColor"})=>(
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <rect x="2" y="17" width="20" height="2.5" rx="0.5"/>
    <circle cx="5.5" cy="21.5" r="1.2"/>
    <circle cx="18.5" cy="21.5" r="1.2"/>
    <line x1="3.5" y1="17" x2="3.5" y2="8"/>
    <line x1="3.5" y1="8" x2="6" y2="8"/>
    <rect x="5" y="12" width="5" height="5" rx="0.4"/>
    <path d="M6.5 12v1.5h2V12"/>
    <rect x="10" y="12" width="5" height="5" rx="0.4"/>
    <path d="M11.5 12v1.5h2V12"/>
    <rect x="15" y="12" width="5" height="5" rx="0.4"/>
    <path d="M16.5 12v1.5h2V12"/>
    <rect x="8.5" y="7" width="7" height="5" rx="0.4"/>
    <path d="M10.5 7v1.5h3V7"/>
  </svg>
);
const IcoSupermayorista=({size=20,color="currentColor"})=>(
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <line x1="1" y1="2" x2="4" y2="2"/>
    <line x1="4" y1="2" x2="5" y2="5"/>
    <path d="M5 5h14l-2 9H7L5 5z"/>
    <rect x="7" y="5" width="3" height="3" rx="0.5"/>
    <rect x="11" y="5" width="2.5" height="3" rx="0.5"/>
    <rect x="14.5" y="5" width="2.5" height="3" rx="0.5"/>
    <line x1="9" y1="9.5" x2="8.5" y2="13.5"/>
    <line x1="12" y1="9.5" x2="12" y2="13.5"/>
    <line x1="15" y1="9.5" x2="15.5" y2="13.5"/>
    <circle cx="9" cy="17" r="1.5"/>
    <circle cx="17" cy="17" r="1.5"/>
  </svg>
);
const IcoMarket=({size=20,color="currentColor"})=>(
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M3 10h18l-2 10H5L3 10z"/>
    <rect x="3" y="9" width="18" height="2" rx="0.4"/>
    <rect x="7" y="13" width="2.5" height="4" rx="0.4"/>
    <rect x="10.75" y="13" width="2.5" height="4" rx="0.4"/>
    <rect x="14.5" y="13" width="2.5" height="4" rx="0.4"/>
    <line x1="7" y1="9" x2="5.5" y2="5"/>
    <line x1="12" y1="9" x2="12" y2="4.5"/>
    <line x1="17" y1="9" x2="18.5" y2="5"/>
    <circle cx="12" cy="4" r="1"/>
  </svg>
);
const IcoTiendaLocal=({size=18,color="currentColor"})=>(
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <rect x="2" y="7" width="20" height="15" rx="1"/>
    <rect x="1" y="5" width="22" height="3" rx="0.5"/>
    <line x1="1" y1="7" x2="23" y2="7"/>
    <rect x="7" y="2" width="10" height="4" rx="1"/>
    <rect x="9.5" y="14" width="5" height="8" rx="0.5"/>
    <rect x="3" y="11" width="5" height="5" rx="0.5"/>
    <rect x="16" y="11" width="5" height="5" rx="0.5"/>
  </svg>
);
const FmtIcon=({fmt,size=18,color})=>{
  const Ico={Mayorista:IcoMayorista,Supermayorista:IcoSupermayorista,Market:IcoMarket}[fmt];
  return Ico?<Ico size={size} color={color||FMT[fmt]?.c||"currentColor"}/>:null;
};

const AdminAccessIcon = ({ size=54 } = {}) => (
  <div style={{
    width:size,
    height:size,
    borderRadius:Math.round(size*.25),
    background:"#EAF7FF",
    display:"flex",
    alignItems:"center",
    justifyContent:"center",
    flexShrink:0
  }}>
    <svg width={Math.round(size*.72)} height={Math.round(size*.72)} viewBox="0 0 64 64" fill="none" aria-hidden="true">
      <rect x="10" y="8" width="38" height="44" rx="6" fill="#DDF3FF"/>
      <rect x="15" y="13" width="28" height="34" rx="4" fill="#BFE4FF"/>
      <circle cx="25" cy="24" r="7" fill="#F2A1A7"/>
      <path d="M15 43c2-9 8-14 16-14s14 5 16 14" fill="#8E86D8" opacity=".95"/>
      <rect x="33" y="17" width="10" height="3" rx="1.5" fill="#5D5A93"/>
      <rect x="33" y="25" width="10" height="3" rx="1.5" fill="#5D5A93"/>
      <rect x="33" y="33" width="10" height="3" rx="1.5" fill="#5D5A93"/>
      <circle cx="47" cy="46" r="13" fill="#52BD72"/>
      <path d="M40.5 46.2l4 4.1 8.2-9" stroke="white" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  </div>
);
const PUNTAJES = [
  {pct:10,icon:"🥇",label:"ORO",    c:"#f6a623",bg:"#fff8ec",key:"c100"},
  {pct:8, icon:"🥈",label:"PLATA",  c:"#74b9ff",bg:"#e8f4fd",key:"c80"},
  {pct:6, icon:"🥉",label:"BRONCE", c:"#a29bfe",bg:"#f0edff",key:"c60"},
  {pct:0, icon:"🔴",label:"FUERA",  c:"#d63031",bg:"#ffeae6",key:null},
];

/* ══ UTILS ══════════════════════════════════════════════ */
const horaHHMM=(d=new Date())=>`${String(d.getHours()).padStart(2,"0")}:${String(d.getMinutes()).padStart(2,"0")}`;
// FIX: Usa fecha LOCAL del dispositivo, no UTC — evita desfase de zona horaria (ej. Peru UTC-5)
const todayStr = () => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}-${String(d.getDate()).padStart(2,"0")}`;
};
// Suma offsetDays a una fecha "YYYY-MM-DD" usando hora local — evita UTC rollover
const localDateAdd = (dateStr, offsetDays) => {
  const d = new Date(dateStr + "T12:00:00");
  d.setDate(d.getDate() + offsetDays);
  return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}-${String(d.getDate()).padStart(2,"0")}`;
};

const getDow   = s  => new Date(s+"T12:00:00").getDay();
const dStr     = (y,m,d) => `${y}-${String(m+1).padStart(2,"0")}-${String(d).padStart(2,"0")}`;
const rKey     = (f,tid,a) => `${f}|${tid}|${a}`;
const toMin    = h  => { if(!h)return 9999; const[hh,mm]=h.split(":").map(Number); return hh*60+mm; };

function calcP(hora, r) {
  if(!hora) return null;
  const R=r||RANGOS_DEFAULT, m=toMin(hora);
  if(m<=toMin(R.c100)) return 10;
  if(m<=toMin(R.c80))  return 8;
  if(m<=toMin(R.c60))  return 6;
  return 0;
}
function primerEnvio(evs) {
  if(!evs||!evs.length) return null;
  return evs.reduce((mn,e)=>(!mn||e.hora<mn)?e.hora:mn,null);
}
function puntajeReg(reg, r) {
  if(!reg||!reg.evidencias||!reg.evidencias.length) return null;
  if(reg.anulado) return null;
  return calcP(primerEnvio(reg.evidencias), r);
}
function getTier(s) {
  if(s===null||s===undefined) return {label:"S/D",icon:"⬜",c:"#b2bec3",bg:"#f4f6f8"};
  if(s>=95)  return {label:"ORO",   icon:"🥇",c:"#f6a623",bg:"#fff8ec"};
  if(s>=80)  return {label:"PLATA", icon:"🥈",c:"#74b9ff",bg:"#e8f4fd"};
  if(s>=60)  return {label:"BRONCE",icon:"🥉",c:"#a29bfe",bg:"#f0edff"};
  if(s>=40)  return {label:"REGULAR",icon:"⚠️",c:"#e17055",bg:"#fff1ee"};
  if(s>=1)   return {label:"CRÍTICO",icon:"🔴",c:"#d63031",bg:"#ffeae6"};
  return            {label:"FUERA",  icon:"⬛",c:"#636e72",bg:"#f4f6f8"};
}
// Para paso3: puntaje en pts (10/8/6/0)
function getTierPts(p) {
  if(p===null||p===undefined) return {label:"S/D",icon:"⬜",c:"#b2bec3",bg:"#f4f6f8"};
  if(p>=10)  return {label:"ORO",   icon:"🥇",c:"#f6a623",bg:"#fff8ec"};
  if(p>=8)   return {label:"PLATA", icon:"🥈",c:"#74b9ff",bg:"#e8f4fd"};
  if(p>=6)   return {label:"BRONCE",icon:"🥉",c:"#a29bfe",bg:"#f0edff"};
  if(p>0)    return {label:"RIESGO",icon:"⚠️",c:"#e17055",bg:"#fff1ee"};
  return            {label:"FUERA", icon:"🔴",c:"#d63031",bg:"#ffeae6"};
}
function sc(v){if(v===null||v===undefined)return"#b2bec3";if(v>=95)return"#f6a623";if(v>=80)return"#00b894";if(v>=60)return"#74b9ff";if(v>=40)return"#e17055";return"#d63031";}
function sb(v){if(v===null||v===undefined)return"#f4f6f8";if(v>=95)return"#fff8ec";if(v>=80)return"#e8faf5";if(v>=60)return"#e8f4fd";if(v>=40)return"#fff1ee";return"#ffeae6";}

function getWeeksOfMonth(year, month) {
  // Semana COMERCIAL retail Latam: Dom → Sáb.
  // `days` = días Lun–Sáb del mes (sábado incluido: tiendas abren sábado).
  // Dom excluido de `days` porque personal admin descansa.
  // `start`/`end` = rango calendario completo de la semana acotado al mes.
  const weeks = [];
  const lastDay = new Date(year, month + 1, 0).getDate();
  const dow = new Date(year, month, 1).getDay();
  let weekStart = 1 - dow;
  let weekNum = 1;
  while (weekStart <= lastDay) {
    const mStart = Math.max(1, weekStart);
    const mEnd   = Math.min(lastDay, weekStart + 6);
    const days   = [];
    for (let d = mStart; d <= mEnd; d++) {
      const wd = new Date(year, month, d).getDay();
      if (wd >= 1 && wd <= 6) days.push(d);
    }
    if (days.length > 0) {
      weeks.push({ num: weekNum, label: `S${weekNum}`, start: mStart, end: mEnd, days });
    }
    weekNum++;
    weekStart += 7;
  }
  return weeks;
}

/* ══ LOG TABLE — componente separado para evitar conflictos de hooks en IIFE ══ */
function LogTable({filtered, regs, db, deleteDoc, doc, setDoc, showToast, sc, sb, FMT, S, isAdmin, selDupsExterno, onClearSelDups}) {
  const [selLogs, setSelLogs] = useState(new Set());

  // Bug 6 fix: recibir selección de duplicados por prop React, no window global
  useEffect(()=>{
    if(selDupsExterno&&selDupsExterno.length>0){
      setSelLogs(new Set(selDupsExterno));
      onClearSelDups?.();
    }
  },[selDupsExterno]);

  const toggleSel = (uid) => setSelLogs(prev => {
    const ns = new Set(prev);
    ns.has(uid) ? ns.delete(uid) : ns.add(uid);
    return ns;
  });

  const toggleAll = () => {
    if(selLogs.size === filtered.slice(0,200).length) setSelLogs(new Set());
    else setSelLogs(new Set(filtered.slice(0,200).map(l=>l.uid)));
  };

  const eliminarSeleccionados = async () => {
    if(!selLogs.size) return;
    if(!window.confirm(`¿Eliminar ${selLogs.size} registro(s) seleccionado(s)? Esta acción es irreversible.`)) return;
    // Agrupar por docId para actualizar evidencias en lote
    const porDoc = {};
    selLogs.forEach(uid => {
      const [docId, evIdxStr] = uid.split("__");
      if(!porDoc[docId]) porDoc[docId] = [];
      porDoc[docId].push(parseInt(evIdxStr));
    });
    const promises = Object.entries(porDoc).map(async ([docId, evIdxs]) => {
      const reg = regs[docId];
      if(!reg) return;
      // Filtrar las evidencias que NO están seleccionadas
      const newEvs = reg.evidencias.filter((_, i) => !evIdxs.includes(i));
      if(newEvs.length === 0) {
        return setDoc(doc(db, "registros", docId), {...reg, evidencias: [], activo:false, deletedAt:new Date().toISOString(), deletedBy:"admin_ui", deleteReason:"seleccion_masiva"});
      } else {
        return setDoc(doc(db, "registros", docId), {...reg, evidencias: newEvs, updatedAt: new Date().toISOString()});
      }
    });
    try {
      await Promise.all(promises);
      showToast(`🗑️ ${selLogs.size} registro(s) eliminado(s)`);
      setSelLogs(new Set());
    } catch(e) {
      console.error("eliminarSeleccionados error:", e?.code||e?.message||"unknown");
      showToast("❌ Error al eliminar. Verifica tu conexión.");
    }
  };

  return (
    <div>
      {selLogs.size > 0 && (
        <div style={{display:"flex",alignItems:"center",gap:10,padding:"10px 14px",background:"#fff1f2",borderRadius:10,border:"1.5px solid #fecaca",marginBottom:12}}>
          <span style={{fontSize:12,fontWeight:700,color:"#dc2626",flex:1}}>{selLogs.size} registro(s) seleccionado(s)</span>
          <button onClick={()=>setSelLogs(new Set())} style={{padding:"5px 12px",borderRadius:8,border:"1px solid #c8d8e8",background:"#fff",color:"#5a7a9a",cursor:"pointer",fontSize:11,fontWeight:700}}>Cancelar</button>
          <button onClick={eliminarSeleccionados} style={{padding:"5px 14px",borderRadius:8,border:"none",background:"#dc2626",color:"#fff",cursor:"pointer",fontSize:11,fontWeight:700}}>🗑️ Eliminar seleccionados</button>
        </div>
      )}
      <div style={{overflowX:"auto"}}>
        <table style={{width:"100%",borderCollapse:"collapse",fontSize:11}}>
          <thead>
            <tr style={{background:"#f8fafc"}}>
              <th style={{padding:"7px 10px",borderBottom:"2px solid #e9eef5"}}>
                <input type="checkbox" checked={selLogs.size===filtered.slice(0,200).length&&filtered.length>0} onChange={toggleAll} style={{cursor:"pointer"}}/>
              </th>
              {["FECHA","TIENDA","FMT","ACTIVIDAD","AUDITOR","DNI","HORA EV.","PTS","REG."].map(h=>(
                <th key={h} style={{padding:"7px 10px",textAlign:"left",color:"#5a7a9a",fontWeight:700,fontSize:9,borderBottom:"2px solid #e9eef5",whiteSpace:"nowrap"}}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filtered.slice(0,200).map((l,i)=>{
              const fc=FMT[l.formato]||{c:"#8aaabb",bg:"#f0f4f8"};
              const ptsc=sc(l.pts/10*100);
              const isSel=selLogs.has(l.uid);
              return(
                <tr key={i} style={{borderBottom:"1px solid #f5f7fa",background:isSel?"#fff1f2":l.anulado?"#fff8ec":"transparent",opacity:l.anulado?.75:1,cursor:"pointer"}}
                  onClick={()=>isAdmin&&toggleSel(l.uid)}>
                  <td style={{padding:"7px 10px"}}>
                    {isAdmin&&<input type="checkbox" checked={isSel} onChange={()=>toggleSel(l.uid)} onClick={e=>e.stopPropagation()} style={{cursor:"pointer"}}/>}
                  </td>
                  <td style={{padding:"7px 10px",fontFamily:"monospace",fontSize:10,color:"#5a7a9a",whiteSpace:"nowrap"}}>{l.fecha}</td>
                  <td style={{padding:"7px 10px",fontWeight:700,color:"#1a2f4a",whiteSpace:"nowrap"}}>Vega {l.tienda}</td>
                  <td style={{padding:"7px 10px"}}><span style={{padding:"2px 7px",borderRadius:20,fontSize:9,fontWeight:700,color:fc.c,background:fc.bg}}>{l.formato.slice(0,3)}</span></td>
                  <td style={{padding:"7px 10px",whiteSpace:"nowrap",fontSize:10,color:"#5a7a9a"}}>{l.actividad}</td>
                  <td style={{padding:"7px 10px",fontWeight:700,color:"#0984e3"}}>{l.auditor}</td>
                  <td style={{padding:"7px 10px",fontFamily:"monospace",fontSize:10,color:"#8aaabb"}}>{l.dni}</td>
                  <td style={{padding:"7px 10px",fontFamily:"monospace",fontSize:11,fontWeight:700,color:ptsc}}>{l.hora}</td>
                  <td style={{padding:"7px 10px"}}><span style={{padding:"2px 8px",borderRadius:20,fontSize:10,fontWeight:800,color:ptsc,background:sb(l.pts/10*100)}}>{l.pts}pts</span></td>
                  <td style={{padding:"7px 10px",fontFamily:"monospace",fontSize:9,color:"#b2bec3"}}>{l.horaReg}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
        {filtered.length>200&&<div style={{fontSize:10,color:"#8aaabb",textAlign:"center",padding:10}}>Mostrando 200 de {filtered.length}</div>}
      </div>
    </div>
  );
}


// ET_TIENDAS_1_5_EDIT_MODAL_COMPACT_20260614: modal editar tienda compacto, acciones arriba visibles en zoom alto.
// FIX_TIENDA_EDIT_FOCUS_STABLE_FIELD_20260606: componente estable fuera del modal; evita remount y perdida de foco en cada tecla.
function TiendaEditField({S,label,children}){
  return <div style={{marginBottom:6}}><label style={{...S.lbl,marginBottom:4,fontSize:9}}>{label}</label>{children}</div>;
}

function TiendaEditModal({initial,usuarios,S,onClose,onSave}){
  const [draft,setDraft]=useState(()=>cleanStoreEditDraft(initial||{}));
  const [error,setError]=useState("");
  useEffect(()=>{setDraft(cleanStoreEditDraft(initial||{}));setError("");},[initial]);
  // Mantener el borrador crudo durante la escritura evita lag, salto de cursor y perdida de foco.
  // La limpieza fuerte se ejecuta al guardar, no por cada tecla.
  const patch=useCallback((obj)=>setDraft(p=>({...p,...obj})),[]);
  const inputStyle=(extra={})=>({...S.inp,padding:"6px 8px",fontSize:10.5,borderRadius:8,minHeight:30,...extra});
  const guardar=()=>{
    const v=validateStoreEditDraft(draft);
    if(!v.ok){setError(v.msg);return;}
    setError("");
    onSave(v.draft);
  };
  return(
    <div style={{position:"fixed",inset:0,background:"rgba(26,47,74,.72)",zIndex:95,display:"flex",alignItems:"flex-start",justifyContent:"center",padding:6,overflow:"hidden"}}
      onMouseDown={e=>{if(e.target===e.currentTarget)onClose();}}>
      <div style={{background:"#fff",borderRadius:14,width:"min(440px,96vw)",maxHeight:"calc(100dvh - 10px)",overflowY:"auto",padding:7,boxShadow:"0 20px 60px rgba(0,0,0,.25)"}}>
        <div style={{position:"sticky",top:0,zIndex:2,display:"flex",justifyContent:"space-between",alignItems:"center",gap:10,margin:"-9px -9px 8px",padding:"7px 9px",background:"#fff",borderBottom:"1px solid #e2e8f0",borderRadius:"16px 16px 0 0"}}>
          <div style={{minWidth:0}}>
            <div style={{fontSize:15,fontWeight:900,color:"#1a2f4a"}}>Editar tienda</div>
            <div style={{fontSize:10,color:"#8aaabb",marginTop:2}}>Los cambios se validan antes de guardarse.</div>
          </div>
          <div style={{display:"flex",gap:8,alignItems:"center",flexShrink:0}}>
            <button onClick={onClose} style={{padding:"7px 10px",borderRadius:10,border:"1px solid #e2e8f0",background:"#fff",color:"#5a7a9a",cursor:"pointer",fontWeight:800,fontSize:11}}>Cancelar</button>
            <button onClick={guardar} style={{padding:"7px 11px",borderRadius:10,border:"none",background:"linear-gradient(135deg,#00b5b4,#1a2f4a)",color:"#fff",cursor:"pointer",fontWeight:900,fontSize:11}}>Guardar</button>
            <button onClick={onClose} aria-label="Cerrar" style={{width:32,height:32,borderRadius:10,border:"1px solid #e2e8f0",background:"#f8fafc",cursor:"pointer",color:"#5a7a9a",fontSize:18,lineHeight:1}}>×</button>
          </div>
        </div>
        {error&&<div style={{padding:"9px 12px",borderRadius:10,background:"#fff1f2",border:"1px solid #fecaca",color:"#dc2626",fontSize:12,fontWeight:700,marginBottom:12}}>{error}</div>}
        <div style={{display:"grid",gridTemplateColumns:"minmax(0,1fr) 78px",gap:6,marginBottom:6}}>
          <div>
            <label style={S.lbl}>NOMBRE TIENDA</label>
            <input value={draft.n||""} onChange={e=>!draft._readOnly&&patch({n:e.target.value})}
              readOnly={!!draft._readOnly} placeholder="COLLIQUE"
              autoComplete="off" spellCheck={false}
              style={inputStyle({background:draft._readOnly?"#f0f4f8":"#f8fafc",color:draft._readOnly?"#8aaabb":"#1a2f4a"})}/>
          </div>
          <div>
            <label style={S.lbl}>ID TIENDA</label>
            <input value={draft.idTienda||""} readOnly style={inputStyle({background:"#f0f4f8",color:"#8aaabb"})}/>
          </div>
        </div>
        <TiendaEditField S={S} label="EMAIL TIENDA">
          <input type="email" value={draft.emailTienda||draft.email||""} onChange={e=>patch({emailTienda:e.target.value,email:e.target.value})}
            placeholder="tiendasmcollique@corporacionvega.pe" inputMode="email" autoComplete="off" style={inputStyle()}/>
        </TiendaEditField>
        <div style={{fontSize:10,fontWeight:800,color:"#00b5b4",letterSpacing:".06em",margin:"10px 0 6px"}}>GERENTE DE TIENDA</div>
        <TiendaEditField S={S} label="NOMBRE GERENTE">
          <input value={draft.gerenteTienda||""} onChange={e=>patch({gerenteTienda:e.target.value})}
            placeholder="APELLIDO APELLIDO, Nombre" autoComplete="off" style={inputStyle()}/>
        </TiendaEditField>
        <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(150px,1fr))",gap:6,marginBottom:6}}>
          <div>
            <label style={S.lbl}>DNI GERENTE</label>
            <input value={draft.dniGerente||""} onChange={e=>patch({dniGerente:sanitizeDigits(e.target.value,SAFE_LIMITS.dni)})}
              placeholder="12345678" inputMode="numeric" autoComplete="off" style={inputStyle()}/>
          </div>
          <div>
            <label style={S.lbl}>CELULAR GERENTE</label>
            <input value={draft.celular||""} onChange={e=>patch({celular:sanitizeDigits(e.target.value,SAFE_LIMITS.phone)})}
              placeholder="987654321" inputMode="tel" autoComplete="off" style={inputStyle()}/>
          </div>
        </div>
        <div style={{fontSize:10,fontWeight:800,color:"#f6a623",letterSpacing:".06em",margin:"10px 0 6px"}}>JEFE ZONAL</div>
        <TiendaEditField S={S} label="ZONAL ASIGNADO">
          <select value={draft._zonalUserId||"__manual__"} onChange={e=>{
            const uid=e.target.value;
            if(uid==="__manual__"){patch({_zonalUserId:"__manual__",jefeZonalNombre:"",emailJefeZonal:""});return;}
            const u=usuarios.find(x=>x.id===uid);
            if(u) patch({_zonalUserId:uid,jefeZonalNombre:u.nombre,emailJefeZonal:u.email||""});
          }} style={inputStyle({padding:"9px 12px"})}>
            <option value="__manual__">— Sin asignar —</option>
            {usuarios.filter(u=>["auditor","coordinador","visor","viewer_zonal"].includes(u.rol)&&u.activo!==false).map(u=>(
              <option key={u.id} value={u.id}>{u.nombre} · {u.rol}{u.zona?` · ${u.zona}`:""}</option>
            ))}
          </select>
        </TiendaEditField>
        <TiendaEditField S={S} label="EMAIL ZONAL">
          <input type="email" value={draft.emailJefeZonal||""} onChange={e=>patch({emailJefeZonal:e.target.value})}
            placeholder="apellido.n@corporacionvega.pe" inputMode="email" autoComplete="off" style={inputStyle()}/>
        </TiendaEditField>
        <div style={{fontSize:10,fontWeight:800,color:"#8aaabb",letterSpacing:".06em",margin:"10px 0 6px"}}>UBICACIÓN</div>
        <TiendaEditField S={S} label="DIRECCIÓN">
          <input value={draft.dir||""} onChange={e=>patch({dir:e.target.value})} placeholder="Av. Principal 123" autoComplete="off" style={inputStyle()}/>
        </TiendaEditField>
        <div style={{display:"grid",gridTemplateColumns:"minmax(0,1fr) 64px",gap:6,marginBottom:6}}>
          <div>
            <label style={S.lbl}>DISTRITO</label>
            <input value={draft.dist||""} onChange={e=>patch({dist:e.target.value})} placeholder="Comas" autoComplete="off" style={inputStyle()}/>
          </div>
          <div>
            <label style={S.lbl}>ZONA</label>
            <input value={draft.zonaId||""} onChange={e=>patch({zonaId:e.target.value})} placeholder="" autoComplete="off" style={inputStyle()}/>
          </div>
        </div>
        <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(140px,1fr))",gap:6,marginBottom:6}}>
          <div>
            <label style={S.lbl}>LATITUD</label>
            <input value={draft.lat??""} onChange={e=>patch({lat:e.target.value})} placeholder="" autoComplete="off" style={inputStyle()}/>
          </div>
          <div>
            <label style={S.lbl}>LONGITUD</label>
            <input value={draft.lng??""} onChange={e=>patch({lng:e.target.value})} placeholder="" autoComplete="off" style={inputStyle()}/>
          </div>
        </div>
        <TiendaEditField S={S} label="LINK GOOGLE MAPS">
          <input value={draft.maps||""} onChange={e=>patch({maps:e.target.value})} placeholder="" autoComplete="off" style={inputStyle()}/>
        </TiendaEditField>
        <div style={{fontSize:10,fontWeight:800,color:"#8aaabb",letterSpacing:".06em",margin:"10px 0 6px"}}>HORARIOS</div>
        <TiendaEditField S={S} label="LUNES A JUEVES">
          <input value={draft.horarioLunJue||""} onChange={e=>patch({horarioLunJue:e.target.value})} placeholder="7:00 AM A 9:00 PM" autoComplete="off" style={inputStyle()}/>
        </TiendaEditField>
        <TiendaEditField S={S} label="VIERNES A SÁBADO">
          <input value={draft.horarioVieSab||""} onChange={e=>patch({horarioVieSab:e.target.value})} placeholder="7:00 AM A 9:00 PM" autoComplete="off" style={inputStyle()}/>
        </TiendaEditField>
        <TiendaEditField S={S} label="DOMINGOS">
          <input value={draft.horarioDom||""} onChange={e=>patch({horarioDom:e.target.value})} placeholder="7:00 AM A 9:00 PM" autoComplete="off" style={inputStyle()}/>
        </TiendaEditField>

        <div style={{marginTop:8,padding:"7px 10px",borderRadius:8,background:"#f8fafc",border:"1px solid #e2e8f0"}}>
          <span style={{fontSize:10,color:"#8aaabb"}}>El nombre se guarda en MAYÚSCULAS. Gerente y jefe zonal se normalizan a Título. Emails, DNI, celular y horarios se limpian antes de guardar. FIX_TIENDA_EDIT_FOCUS_STABLE_FIELD_20260606</span>
        </div>
      </div>
    </div>
  );
}

/* ══ APP ══════════════════════════════════════════════ */
function ChecklistApp() {
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const now = useMemo(()=>new Date(),[]); // evita new Date() en cada render
  /* ── auth ── */
  const [role,    setRole]    = useState(null);
  const [uName,   setUName]   = useState("");
  const [uDni,    setUDni]    = useState("");
  const [pins,    setPins]    = useState({admin:"",auditor:"",viewer:""});
  const [pinMod,  setPinMod]  = useState(false);
  const [auditores, setAuditores] = useState([]); // [{dni,nombre,activo}] — legacy
  const [usuarios,  setUsuarios]  = useState([]); // [{id,nombre,rol,credencial,activo,ultimoAcceso}]
  /* ── app state ── */
  const [tab,     setTab]     = useState(0);
  const [modulo,  setModulo]  = useState(0); // 0=Evidencias, 1=Auditoria, 2=Config
  const [fecha,   setFecha]   = useState(todayStr());
  // Semana ISO actual — disponible en todo el componente
  const semanaActual=(()=>{const d=new Date();const j=new Date(Date.UTC(d.getFullYear(),d.getMonth(),d.getDate()));j.setUTCDate(j.getUTCDate()+4-(j.getUTCDay()||7));const y=j.getUTCFullYear();const w=Math.ceil((((j-new Date(Date.UTC(y,0,1)))/86400000)+1)/7);return`${y}-W${String(w).padStart(2,"0")}`;})();
  const [vYear,   setVYear]   = useState(now.getFullYear());
  const [vMonth,  setVMonth]  = useState(now.getMonth());
  const [selWeek, setSelWeek] = useState(null);
  const [tiendas, setTiendas] = useState([]);
  const [acts,    setActs]    = useState(ACTIVIDADES_INIT);
  const [regs,    setRegs]    = useState({});
  const [exceps,  setExceps]  = useState({});
  /* ── registro flow ── */
  const [paso,    setPaso]    = useState(1);
  const [actSel,  setActSel]  = useState(null);
  const [tSel,    setTSel]    = useState(new Set());
  const [rango,   setRango]   = useState(null);
  const [horaEx,  setHoraEx]  = useState(()=>horaHHMM());
  const [obsEx,   setObsEx]   = useState("");
  /* ── filtros ── */
  const [fmtFilt,      setFmtFilt]      = useState("Todas");
  const [busq,         setBusq]         = useState("");
  const [verRegistradas, setVerRegistradas] = useState(false);
  const [rangoExt,     setRangoExt]     = useState(null); // rango extendido temporal por actividad
  /* ── config ── */
  const [cfgTab,  setCfgTab]  = useState(1);
  const [cfgMod,  setCfgMod]  = useState(null); // null | "evidencias" | "auditoria"
  const [ddOpen,  setDdOpen]  = useState(false); // dropdown Panel de control
  const [ddUsrOpen, setDdUsrOpen] = useState(false); // FIX_RUTAACTIVA_PARAM_20260520_DEPLOY_OK dropdown Gestión de Usuarios — independiente de ddOpen
  const [tpTab,   setTpTab]   = useState("lista"); // pestaña Tiendas/Nueva/Coordenadas/Responsables/Historial en módulo Tiendas
  const [fmtTab,  setFmtTab]  = useState("Mayorista"); // subpestaña formato en módulo Tiendas
  const [tiendaFiltroTxt, setTiendaFiltroTxt] = useState("");
  const [tiendaFiltroEstado, setTiendaFiltroEstado] = useState("Todos");
  const [tiendaFiltroZona, setTiendaFiltroZona] = useState("Todas");
  const [tiendaHistorial, setTiendaHistorial] = useState([]);
  /* ── auditoría config ── */
  const [audCfgTab,  setAudCfgTab]  = useState("score");
  // FIX_DISENO_ODT_EVIDENCIAS_TRACKING_20260606
  const [odtSubTab,  setOdtSubTab]  = useState("reporte");
  const [odtDashLvl, setOdtDashLvl] = useState("direccion");
  const [odtForm,    setOdtForm]    = useState({titulo:"",area:"Trade Marketing",tipo:"",materiales:[],tonalidad:"",objetivo:"",mensaje:"",mecanica:"",productos:"",restricciones:"",referencias:"",medidas:"",disenadorId:"",prioridad:"Normal",fechaInicio:"",fechaEntrega:"",horaInicio:"",horaCorte:""});
  const [odtFormDraft, setOdtFormDraft] = useState({});
  const [odtNotifyModal, setOdtNotifyModal] = useState(null); // {disenador, odt}
  const [odtSolicitanteNotifyModal, setOdtSolicitanteNotifyModal] = useState(null); // {odt, modo, solicitante}
  const [odtCorrectionNotifyModal, setOdtCorrectionNotifyModal] = useState(null); // {odt, disenador}
  const [odtCorrectionNote, setOdtCorrectionNote] = useState(""); // motivo de correccion para el disenador
  const [odtMaterialesExtra, setOdtMaterialesExtra] = useState([]); // materiales custom en config
  const [odtTiposExtra,      setOdtTiposExtra]      = useState([]); // tipos custom en config
  const ODT_MATERIALES_BASE = ["Feed Instagram (1080×1080)","Historia Instagram (1080×1920)","Banner WhatsApp","Banner Web","Pieza física (afiche/vinil)","Diseño góndola/cabecera","Reel / Video","Otro"];
  // ODT 100% Firestore — no localStorage, no mocks, no datos por dispositivo
  const [odtFirestore, setOdtFirestore] = useState([]);
  const [odtDeletedIds, setOdtDeletedIds] = useState([]);
  const [odtCreated, setOdtCreated] = useState([]);
  const [odtReporteSearch, setOdtReporteSearch] = useState("");
  const [odtReporteEstado, setOdtReporteEstado] = useState("todos");
  const [odtReporteTipo, setOdtReporteTipo] = useState("todos");
  const [odtReporteResp, setOdtReporteResp] = useState("todos");
  const [odtViewModal, setOdtViewModal] = useState(null);
  const [odtAssignModal, setOdtAssignModal] = useState(null);
  const [odtEditModal, setOdtEditModal] = useState(null);
  const [odtEditForm, setOdtEditForm] = useState({}); // controlled edit form
  const [odtDashView, setOdtDashView] = useState("kanban");
  const [odtKanbanFiltro, setOdtKanbanFiltro] = useState({resp:"todos",tipo:"todos"}); // kanban filter
  const [odtHighlighted, setOdtHighlighted] = useState(null); // flash animation on changed card
  const [rutas,      setRutas]      = useState([]);
  const [modulosAud, setModulosAud] = useState([]);
  const [newRuta,    setNewRuta]    = useState({auditorId:"",moduloIds:[],tiendas:[],frecuencia:"semanal",zona:"",distrito:"",formato:"Todas",tipoRuta:"regular",perfilCalendario:"auto",motivoExcepcion:"",editId:null});
  const [rutasFiltro, setRutasFiltro] = useState("activas"); // "activas" | "todas"
  const [newModAud,  setNewModAud]  = useState({nombre:"",area:"",cargo:"",rol:"auditor",tareas:[],accesos:[],scoreConfig:null,editId:null});
  const [showNewRuta,setShowNewRuta]= useState(false);
  const [showNewMod, setShowNewMod] = useState(false);
  const [modAudOpen, setModAudOpen] = useState(null);
  const [scoreModuloSel,setScoreModuloSel] = useState("");
  const [scoreDraft,setScoreDraft] = useState({enabled:false,tipo:"numerico",escala:"0,1.5,3",labels:"No ejecutado,Por mejorar,Correcto"});
  // Módulos activos usados en la auditoría en curso (IDs y escala reales)
  const [auditModulosActivos, setAuditModulosActivos] = useState([]);
  /* ── módulo usuarios ── */
  const [usrTab,  setUsrTab]  = useState(null); // FIX_RUTA_MODULOS_MULTISELECT_20260520 null=dashboard | "usuarios" | "roles" | "areas" | "log" | "permisos" | "bloqueos"
  const [permisosModActivo, setPermisosModActivo] = useState("diseno");
  const [roles,   setRoles]   = useState([]);
  const [areas,   setAreas]   = useState([]);
  const [areaOpen,setAreaOpen]= useState(null);
  const [newRol,  setNewRol]  = useState({nombre:"",desc:"",color:"#6C6EF5",editId:null});
  const [newArea, setNewArea] = useState({nombre:"",editId:null});
  const [newCargo,setNewCargo]= useState({areaId:null,nombre:""});
  const [logFmt,  setLogFmt]  = useState("Todos");
  const [logAct,  setLogAct]  = useState("Todas");
  const [logAud,  setLogAud]  = useState("Todos");
  const [logPts,  setLogPts]  = useState("Todos");
  const [logTxt,  setLogTxt]  = useState("");
  const [logFecha,setLogFecha]= useState("Todos");
  const [logSoloDups,setLogSoloDups]= useState(false);
  const [selDupsExterno, setSelDupsExterno] = useState([]); // Bug 6 fix: reemplaza window._logTableSelDups
  const [rangosDia, setRangosDia] = useState({}); // {actId: {fecha: {c100,c80,c60}}}
  const [rangoFecha, setRangoFecha] = useState(()=>todayStr());
  // Cortes de supervisión independientes de los rangos de puntaje
  // Admin los configura; se usan en la tarjeta Estado de Registros
  const [cortesSupervision, setCortesSupervision] = useState({c1:"08:30", c2:"09:30"});
  const [showNT,  setShowNT]  = useState(false);
  const [showNA,  setShowNA]  = useState(false);
  const [showNUsuario, setShowNUsuario] = useState(false);
  const [showDetalleAccesos, setShowDetalleAccesos] = useState(false);
  // FIX_LOG_ACCESOS_HOOKS_20260530: filtros del Log de accesos al nivel superior para evitar React #310 al cambiar módulos.
  const [logAccesoFiltroUser,  setLogAccesoFiltroUser]  = useState("");
  const [logAccesoFiltroEstado,setLogAccesoFiltroEstado]= useState("todos");
  const [logAccesoFiltroDias,  setLogAccesoFiltroDias]  = useState(30);
  const NU_INIT={nombre:"",rol:"auditor",tipoDoc:"dni",dni:"",email:"",telefono:"",whatsapp:"",area:"",cargo:"",tiendaId:"",alcance:"",permisos:{},editId:null};
  const [newUsuario,   setNewUsuario]   = useState(NU_INIT);
  const [busqUsuario,  setBusqUsuario]  = useState("");
  const [newT,    setNewT]    = useState({n:"",f:"Market"});
  const [bulkImportLog,setBulkImportLog]=useState(null);
  const [newA,    setNewA]    = useState({n:"",e:"📌",c:"#6c5ce7",dias:[1,2,3,4,5],cat:"Ad-hoc"});
  const [toast,   setToast]   = useState("");
  const toastRef = useRef();
  const exportPDFRef = useRef(null); // ref para exponer exportPDF al header desde renderDashboard
  /* ── modales de registro ── */
  const [delModal,    setDelModal]    = useState(null);
  const [anularModal, setAnularModal] = useState(null);
  const [updModal,    setUpdModal]    = useState(null);
  const [ctxMenu,     setCtxMenu]     = useState(null);
  /* ── modal de exclusión con comentario ── */
  // excModal = { tId, aId, tiendaNombre, estaExcluida, comentarioActual } | null
  const [excModal,    setExcModal]    = useState(null);
  const [motivoAnu,   setMotivoAnu]   = useState("");
  const [detalleAnu,  setDetalleAnu]  = useState("");
  const [horaUpd,     setHoraUpd]     = useState("");
  const [motivoUpd,   setMotivoUpd]   = useState("");
  const longPressRef = useRef(null);
  /* ── dashboard filtros ── */
  const [dashFmt,   setDashFmt]   = useState("Todas");
  const [dashAct,   setDashAct]   = useState("Todas");
  const [dashHora,  setDashHora]  = useState("Todas");
  /* ── long press excepciones en paso 2 ── */
  const longExcRef = useRef(null);
  /* ── módulo auditoría de campo ── */
  const [checklistModulos,  setChecklistModulos]  = useState(CHECKLIST_MODULOS_INIT);
  const [auditorias,        setAuditorias]        = useState({});
  const [auditExclusiones,  setAuditExclusiones]  = useState({});
  const [auditEmailModal,   setAuditEmailModal]   = useState(null);
  const [tiendaEditModal,   setTiendaEditModal]   = useState(null);
  const [auditFiltroFmt,    setAuditFiltroFmt]    = useState("Todos");
  const [auditDetalle,      setAuditDetalle]      = useState(null);
  const [authLog,           setAuthLog]           = useState([]);
  const [waModal,           setWaModal]           = useState(null); // {msg} | null
  const [auditPaso,         setAuditPaso]         = useState(0);
  const [auditTiendaSel,    setAuditTiendaSel]    = useState(null);
  const [auditRespuestas,   setAuditRespuestas]   = useState({});
  const [auditModuloActivo, setAuditModuloActivo] = useState(0);
  const [auditObs,          setAuditObs]          = useState("");
  const [auditCompromisos,  setAuditCompromisos]  = useState("");
  const [auditGPS,          setAuditGPS]          = useState(null);
  const [auditGPSOut,       setAuditGPSOut]       = useState(null);
  const [auditCheckInTs,    setAuditCheckInTs]    = useState(null);
  /* ── tarjeta de estado ── */
  const [showStatusCard, setShowStatusCard] = useState(false);
  const [drawerOpen,    setDrawerOpen]    = useState(false);
  const [statusCardView, setStatusCardView] = useState("operativo"); // "operativo" | "gerencial"
  const [statusActFiltro, setStatusActFiltro] = useState("Todas"); // filtro actividad en Estado
  const [statusNowTime, setStatusNowTime] = useState(()=>horaHHMM());

  // Actualizar la hora de la tarjeta cada 30 segundos mientras esté abierta
  useEffect(()=>{
    if(!showStatusCard) return;
    const tick=()=>setStatusNowTime(horaHHMM());
    tick();
    const iv=setInterval(tick,30000);
    return()=>clearInterval(iv);
  },[showStatusCard]);

  // B15 fix: sincronizar fecha y hora cuando la app vuelve a primer plano
  // Cubre: pestaña inactiva, dispositivo en suspensión, cambio de día
  useEffect(()=>{
    const sync = () => {
      const hoy = todayStr();
      setFecha(prev => prev === hoy ? prev : hoy); // solo cambia si el día cambió
      setHoraEx(horaHHMM());
    };
    // visibilitychange: se dispara cuando la pestaña vuelve a ser visible
    document.addEventListener("visibilitychange", ()=>{ if(document.visibilityState==="visible") sync(); });
    // focus: respaldo para móviles que no disparan visibilitychange correctamente
    window.addEventListener("focus", sync);
    // También un interval cada 60s para detectar cambio de día mientras está activa
    const iv = setInterval(()=>{
      if(document.visibilityState==="visible") sync();
    }, 60000);
    return ()=>{
      document.removeEventListener("visibilitychange", sync);
      window.removeEventListener("focus", sync);
      clearInterval(iv);
    };
  },[]);
  const statusCardRef = useRef(null);

  /* ══ FIREBASE SYNC ══ */
  useEffect(()=>{
    const unsub = onSnapshot(collection(db,"registros"), snap=>{
      const data={};
      snap.forEach(d=>{ data[d.id]=d.data(); });
      setRegs(data);
    });
    return ()=>unsub();
  },[]);



  useEffect(()=>{
    // Usar onSnapshot para config — reactivo y siempre actualizado
    const unsub = onSnapshot(doc(db,"config","app"), snap=>{
      if(!snap.exists()) return;
      const d=snap.data();
      if(d.actividades) setActs(d.actividades);
      if(d.tiendas){
        // FIX_AUTONORM_TIENDAS_20260602 — corregir nombres sucios sin idTienda al cargar
        const{result:tiendasNorm,changed}=autoNormalizeTiendasSucias(d.tiendas);
        setTiendas(tiendasNorm);
        if(changed){
          // guardar silenciosamente la versión normalizada en Firestore
          setDoc(doc(db,"config","app"),{...d,tiendas:tiendasNorm,updatedAt:new Date().toISOString()});
        }
      }
      if(d.pins)        setPins(d.pins);
      if(d.rangosDia)   setRangosDia(d.rangosDia);
      if(d.cortesSupervision) setCortesSupervision(d.cortesSupervision);
      // Limpiar exceps: descartar true legacy y arrays vacíos
      // B16 fix: NO limpiar entradas de la semana en curso o futuras — solo legacy boolean y arrays vacíos
      const exc = d.excepciones || {};
      const hoyClean = todayStr();
      const cleaned = Object.fromEntries(
        Object.entries(exc).filter(([,v])=>{
          if(!Array.isArray(v)) return false; // descarta legacy boolean true
          // Mantener si tiene al menos una entrada presente o futura
          const tieneVigentes = v.some(e=>{
            const f = typeof e==="string"?e:e?.fecha;
            return f && f >= hoyClean;
          });
          // Mantener si tiene entradas (aunque sean pasadas) — el admin las gestiona
          return v.length > 0;
        })
      );
      setExceps(cleaned);
      // Si había legacy boolean, guardar versión limpia en Firebase (una sola vez)
      const hasLegacy = Object.values(exc).some(v=>!Array.isArray(v));
      if(hasLegacy){
        setDoc(doc(db,"config","app"),{...d, excepciones:cleaned, updatedAt:new Date().toISOString()});
      }
    });
    return ()=>unsub();
  },[]);

  // Bug 4 fix: refs siempre actualizados para evitar stale closure en saveConfig
  const roleRef    = useRef(role);
  useEffect(()=>{ roleRef.current=role; },[role]);
  const actsRef    = useRef(acts);
  const tiendasRef = useRef(tiendas);
  const pinsRef    = useRef(pins);
  const excepsRef  = useRef(exceps);
  const rangosDiaRef = useRef(rangosDia);
  const auditoresRef = useRef(auditores);
  const cortesSupervisionRef = useRef(cortesSupervision);
  useEffect(()=>{ actsRef.current=acts; },[acts]);
  useEffect(()=>{ tiendasRef.current=tiendas; },[tiendas]);
  useEffect(()=>{ pinsRef.current=pins; },[pins]);
  useEffect(()=>{ excepsRef.current=exceps; },[exceps]);
  useEffect(()=>{ rangosDiaRef.current=rangosDia; },[rangosDia]);
  useEffect(()=>{ auditoresRef.current=auditores; },[auditores]);
  useEffect(()=>{ cortesSupervisionRef.current=cortesSupervision; },[cortesSupervision]);

  // Sync colección usuarios desde Firestore
  useEffect(()=>{
    const unsub = onSnapshot(collection(db,"usuarios"), snap=>{
      const data=[];
      snap.forEach(d=>{ data.push({id:d.id,...d.data()}); });
      setUsuarios(data);
    });
    return ()=>unsub();
  },[]);

  // Sync rutas desde Firestore
  useEffect(()=>{
    const unsub=onSnapshot(collection(db,"rutas"),snap=>{
      const data=[];
      snap.forEach(d=>data.push({id:d.id,...d.data()}));
      data.sort((a,b)=>(b.creadaEn||"").localeCompare(a.creadaEn||""));
      setRutas(data);
    });
    return()=>unsub();
  },[]);

  // Sync diseno_odts desde Firestore — fuente de verdad para ODTs
  useEffect(()=>{
    const q=query(collection(db,"diseno_odts"),orderBy("creadoEn","desc"));
    const unsub=onSnapshot(q,snap=>{
      const data=[];
      snap.forEach(d=>data.push({id:d.id,...d.data()}));
      setOdtFirestore(data);
    },()=>{
      // Fallback silencioso si no hay permiso o índice — usa localStorage
    });
    return()=>unsub();
  },[]);

  // Sync modulos_auditoria desde Firestore — precarga los 4 módulos base si está vacío
  useEffect(()=>{
    const MODULOS_BASE=[
      {id:"m_eval_personal", nombre:"Evaluación Personal", orden:1, activo:true,
       tareas:["Hospitalidad y cordialidad","Uniforme completo","Presentación personal"],
       accesos:[{area:"Marketing",cargo:"Auditor Trademarketing",rol:"Auditor"},{area:"Gestión Humana",cargo:"Capacitador",rol:"Auditor"},{area:"Operaciones",cargo:"Jefe Zonal",rol:"Auditor"}]},
      {id:"m_pasos_venta",   nombre:"Pasos de la venta",   orden:2, activo:true,
       tareas:["Saludo inicial cliente","Conocimiento Always on","Abordaje proactivo","Acompañamiento guiado","Impulso venta activa / Vende+","Cierre de venta"],
       accesos:[{area:"Marketing",cargo:"Auditor Trademarketing",rol:"Auditor"},{area:"Gestión Humana",cargo:"Capacitador",rol:"Auditor"}]},
      {id:"m_visibilidad",   nombre:"Visibilidad del PDV",  orden:3, activo:true,
       tareas:["Letrero exterior actualizado","Material campaña instalada","Reel TV / Audio activado","Planograma vigente Foco CAT","Cabeceras / Rompetráficos actualizados","Productos ordenados y limpios","Precios visibles y correctos","Rotación adecuada (FIFO)","Góndola bien abastecida","Promociones visibles","Corredores libres de palets","Portaprecios instalado y actualizado","Exhibidor Vende+ actualizado"],
       accesos:[{area:"Marketing",cargo:"Auditor Trademarketing",rol:"Auditor"}]},
      {id:"m_criterios",     nombre:"Criterios clave (sanidad - orden)", orden:4, activo:true,
       tareas:["Frutas y verduras en buen estado","Vitrina de comestibles ordenada"],
       accesos:[{area:"Marketing",cargo:"Auditor Trademarketing",rol:"Auditor"},{area:"Gestión Humana",cargo:"Capacitador",rol:"Auditor"},{area:"Operaciones",cargo:"Jefe Zonal",rol:"Auditor"}]},
    ];
    const unsub=onSnapshot(collection(db,"modulos_auditoria"),snap=>{
      const data=[];
      snap.forEach(d=>data.push({id:d.id,...d.data()}));
      if(data.length===0){
        MODULOS_BASE.forEach(m=>setDoc(doc(db,"modulos_auditoria",m.id),m).catch(()=>{}));
      }
      data.sort((a,b)=>(a.orden||99)-(b.orden||99));
      setModulosAud(data);
    });
    return()=>unsub();
  },[]);

  // Sync roles desde Firestore
  useEffect(()=>{
    const unsub=onSnapshot(collection(db,"roles"),snap=>{
      if(snap.empty){
        const ROLES_INIT=[
          {id:"admin",      nombre:"Admin",       desc:"Acceso total a todos los módulos",                           color:"#f6a623",sistema:true,activo:true},
          {id:"coordinador",nombre:"Coordinador", desc:"Evidencias, Auditoría, Órdenes de Trabajo y reportes",      color:"#6C6EF5",sistema:true,activo:true},
          {id:"ejecutor",   nombre:"Ejecutor",    desc:"Acceso exclusivo al módulo Órdenes de Trabajo",             color:"#00b5b4",sistema:true,activo:true},
          {id:"auditor",    nombre:"Auditor",     desc:"Auditoría de Tiendas, Evidencias y sus reportes",           color:"#0984e3",sistema:true,activo:true},
          {id:"visor",      nombre:"Visor",       desc:"Dashboards y reportes filtrados por cargo y tienda asignada",color:"#8aaabb",sistema:true,activo:true},
        ];
        ROLES_INIT.forEach(r=>setDoc(doc(db,"roles",r.id),r));
        setRoles(ROLES_INIT);
      } else {
        const data=[];
        snap.forEach(d=>data.push({id:d.id,...d.data()}));
        const ord=["admin","coordinador","ejecutor","auditor","visor"];
        data.sort((a,b)=>{const ai=ord.indexOf(a.id),bi=ord.indexOf(b.id);if(ai>=0&&bi>=0)return ai-bi;if(ai>=0)return -1;if(bi>=0)return 1;return(a.nombre||"").localeCompare(b.nombre||"");});
        setRoles(data);
      }
    });
    return()=>unsub();
  },[]);

  // Sync areas desde Firestore
  useEffect(()=>{
    const unsub=onSnapshot(collection(db,"areas"),snap=>{
      if(snap.empty){
        const AREAS_INIT=[
          {id:"marketing",  nombre:"Marketing",  activa:true,cargos:[{id:"c1",nombre:"Coordinador Trade",activo:true},{id:"c2",nombre:"Diseñador",activo:true},{id:"c3",nombre:"Marketing Digital",activo:true},{id:"c4",nombre:"Ecommerce",activo:true},{id:"c5",nombre:"Gerente de Marketing",activo:true}]},
          {id:"operaciones",nombre:"Operaciones",activa:true,cargos:[{id:"c1",nombre:"Gerente de Operaciones",activo:true},{id:"c2",nombre:"Jefe Zonal",activo:true},{id:"c3",nombre:"Gerente de Tienda",activo:true},{id:"c4",nombre:"Jefe de Tienda",activo:true},{id:"c5",nombre:"Auditor Trade",activo:true}]},
          {id:"comercial",  nombre:"Comercial",  activa:true,cargos:[{id:"c1",nombre:"Líder Comercial",activo:true},{id:"c2",nombre:"Gerente Comercial",activo:true},{id:"c3",nombre:"Supply",activo:true}]},
        ];
        AREAS_INIT.forEach(a=>setDoc(doc(db,"areas",a.id),a));
        setAreas(AREAS_INIT);
      } else {
        const data=[];
        snap.forEach(d=>data.push({id:d.id,...d.data()}));
        data.sort((a,b)=>(a.nombre||"").localeCompare(b.nombre||""));
        setAreas(data);
      }
    });
    return()=>unsub();
  },[]);

  // Sync colección auditorias
  useEffect(()=>{
    const unsub=onSnapshot(collection(db,"auditorias"),snap=>{
      const data={};
      snap.forEach(d=>{data[d.id]={id:d.id,...d.data()};});
      setAuditorias(data);
    });
    return()=>unsub();
  },[]);

  // Sync exclusiones de auditoría desde Firestore
  useEffect(()=>{
    const unsub=onSnapshot(doc(db,"config","auditExclusiones"),snap=>{
      if(snap.exists()) setAuditExclusiones(snap.data()||{});
    });
    return()=>unsub();
  },[]);

  // Sync log de accesos auth_log
  useEffect(()=>{
    const unsub=onSnapshot(collection(db,"auth_log"),snap=>{
      const logs=[];
      snap.forEach(d=>logs.push({id:d.id,...d.data()}));
      logs.sort((a,b)=>(b.timestamp||"").localeCompare(a.timestamp||""));
      setAuthLog(logs.slice(0,50));
    });
    return()=>unsub();
  },[]);

  // Sync checklist_items desde Firestore (sobreescribe init local si existe)
  useEffect(()=>{
    const unsub=onSnapshot(doc(db,"config","checklist"),snap=>{
      if(!snap.exists()) return;
      const d=snap.data();
      if(d.modulos?.length) setChecklistModulos(d.modulos);
    });
    return()=>unsub();
  },[]);

  // Guardar o actualizar un usuario en Firestore
  // NOTA ARQUITECTURA: campo "credencial" eliminado — el DNI es LA credencial para todos los roles.
  // Si hay registros legacy con campo "credencial" en Firestore, no causan error (se ignoran).
  // Puedes borrarlos manualmente en Firebase Console una vez confirmado el despliegue.
  const saveUsuario = useCallback(async (u)=>{
    const ref = u.id ? doc(db,"usuarios",u.id) : doc(collection(db,"usuarios"));
    await setDoc(ref,{
      nombre:       u.nombre,
      rol:          u.rol,
      dni:          u.dni,          // DNI es la credencial universal
      activo:       u.activo!==false,
      ultimoAcceso: u.ultimoAcceso||null,
    });
  },[]);

  const deleteUsuario = useCallback(async (id)=>{
    // FIX_SEGURIDAD_SOFT_DELETE_20260531: no borrar usuarios físicamente; se conserva trazabilidad histórica.
// FIX_CONTACTOS_TIENDA_NO_USUARIOS_20260531: Directorio 2026 carga jefes/gerentes como contactos operativos, no como usuarios.
    await setDoc(doc(db,"usuarios",id),{activo:false,deletedAt:new Date().toISOString(),deletedBy:uDni||"sistema"},{merge:true});
  },[uDni]);

  const registrarAcceso = useCallback(async (id)=>{
    if(!id) return;
    await setDoc(doc(db,"usuarios",id),{ultimoAcceso:new Date().toISOString()},{merge:true});
  },[]);

  const saveConfig = useCallback(async (overrides={})=>{
    // Usa refs para evitar stale closure — siempre tiene el valor más reciente
    const excToSave = overrides.excepciones ?? excepsRef.current;
    const excClean = Object.fromEntries(
      Object.entries(excToSave).filter(([,v])=>Array.isArray(v)&&v.length>0)
    );
    const payload = {
      actividades: overrides.actividades ?? actsRef.current,
      tiendas:     overrides.tiendas     ?? tiendasRef.current,
      pins:        overrides.pins        ?? pinsRef.current,
      excepciones: excClean,
      rangosDia:   overrides.rangosDia   ?? rangosDiaRef.current,
      cortesSupervision: overrides.cortesSupervision ?? cortesSupervisionRef.current,
      updatedAt:   new Date().toISOString(),
    };
    try {
      await setDoc(doc(db,"config","app"), payload);
    } catch(e) {
      // SECURITY: no loguear payload (contiene pins) — solo el código de error
      console.error("saveConfig error:", e?.code||e?.message||"unknown");
      showToast("❌ Error al guardar configuración. Reintentando...");
      // Retry una vez
      try {
        await setDoc(doc(db,"config","app"), payload);
      } catch(e2) {
        console.error("saveConfig retry failed:", e2?.code||e2?.message||"unknown");
      }
    }
  },[]); // sin dependencias — siempre usa refs actualizados

  /* ── Toast helper — debe declararse ANTES de cualquier useCallback que lo use ── */
  const showToast = msg=>{
    setToast(msg);
    if(toastRef.current)clearTimeout(toastRef.current);
    toastRef.current=setTimeout(()=>setToast(""),2500);
  };

  /* ── GPS ── */
  const obtenerGPS = useCallback(()=>new Promise((res,rej)=>{
    if(!navigator.geolocation){rej("GPS no disponible");return;}
    navigator.geolocation.getCurrentPosition(
      p=>res({lat:p.coords.latitude,lng:p.coords.longitude,acc:Math.round(p.coords.accuracy)}),
      e=>rej(e.message),{timeout:10000,enableHighAccuracy:true}
    );
  }),[]);

  /* ── Check-in ── */
  const auditCheckIn = useCallback(async(tiendaId)=>{
    let gps=null;
    try{ gps=await obtenerGPS(); }catch{ gps={lat:null,lng:null,acc:null,sinGPS:true}; }
    const ts=new Date().toISOString();
    setAuditGPS({...gps,timestamp:ts});
    setAuditCheckInTs(ts);
    setAuditTiendaSel(tiendaId);
    setAuditRespuestas({});
    setAuditModuloActivo(0);
    setAuditObs(""); setAuditCompromisos(""); setAuditGPSOut(null);
    // Capturar los módulos activos al iniciar — mismo cálculo que el IIFE del prop
    const rutaActChk=rutas.find(r=>r.auditorId===uDni&&r.semana===semanaActual&&r.activo!==false);
    const modsFiltrarChk=rutaActChk?.moduloIds?.length?rutaActChk.moduloIds:null;
    const fromFSChk=modulosAud
      .filter(m=>m.activo!==false&&(!modsFiltrarChk||modsFiltrarChk.includes(m.id)))
      .map((m,mi)=>scoreConfigToAuditModulo(m,mi))
      .filter(m=>m.scoreEnabled!==false);
    setAuditModulosActivos(fromFSChk.length>0?fromFSChk:checklistModulos.filter(m=>m.activo));
    setAuditPaso(1);
    showToast(gps.sinGPS?"⚠️ Sin GPS — continuando":"✅ Check-in registrado");
  },[obtenerGPS,showToast]);

  /* ── Check-out: calcula scores y guarda en Firestore ── */
  const auditCheckOut = useCallback(async(estado="enviado")=>{
    const tienda=tiendas.find(t=>t.id===auditTiendaSel);
    // Usar módulos capturados al inicio de la auditoría (IDs reales usados)
    const mods=auditModulosActivos.length>0?auditModulosActivos:checklistModulos.filter(m=>m.activo);
    const scoresPorModulo=mods.map(m=>({
      moduloId:m.id, moduloLabel:m.label,
      score:calcScoreModulo(auditRespuestas,m), // {ob,mx,pct}
      obsModulo:auditRespuestas[`__obs_${m.id}`]?.obs||"",
      itemsResp:(m.items||[]).filter(i=>i.activo&&auditRespuestas[i.id]?.valor!==undefined).length,
      itemsTotal:(m.items||[]).filter(i=>i.activo).length,
    }));
    const scoreFinal=calcScoreFinal(auditRespuestas,mods);
    let gpsOut=auditGPSOut;
    if(!gpsOut){try{gpsOut=await obtenerGPS();}catch{gpsOut={lat:null,lng:null};}}
    const checkInTs=auditCheckInTs||new Date().toISOString();
    const checkOutTs=new Date().toISOString();
    const durMin=Math.round((new Date(checkOutTs)-new Date(checkInTs))/60000);
    // SECURITY: sanitizar componentes del docId para evitar path traversal en Firestore
    const safeDocPart=(s)=>String(s||"").replace(/[^a-zA-Z0-9\-_.]/g,"_").slice(0,60);
    const docId=`${safeDocPart(auditTiendaSel)}--${safeDocPart(fecha)}--${safeDocPart(uDni)}--${Date.now()}`;
    const rutaSnap=rutas.find(r=>r.auditorId===uDni&&r.semana===semanaActual&&r.activo!==false&&(r.tiendas||[]).includes(auditTiendaSel))||null;
    const usuarioActual=usuarios.find(u=>u.id===uDni||u.dni===uDni)||{id:uDni,nombre:uName,rol:role};
    const calEval=canAuditarEnFecha(usuarioActual,fecha,tienda,{isAdmin:role==="admin",asignacionExcepcional:rutaSnap?.tipoRuta==="excepcional"||rutaSnap?.tipoRuta==="fuera_ruta"});
    const payload={
      auditorId:uDni, auditorNombre:uName,
      tiendaId:auditTiendaSel, tiendaNombre:tienda?.n||auditTiendaSel, tiendaFormato:tienda?.f||"", tiendaZonaId:getZonaIdTienda(tienda), tiendaDistrito:tienda?.dist||"",
      fecha, checkIn:{timestamp:checkInTs,gps:auditGPS}, checkOut:{timestamp:checkOutTs,gps:gpsOut},
      duracionMin:durMin, respuestas:auditRespuestas, scoresPorModulo, scoreFinal, scoreSnapshots:mods.map(m=>m.scoreSnapshot).filter(Boolean),
      routeSnapshot:rutaSnap?{id:rutaSnap.id,semana:rutaSnap.semana,frecuencia:rutaSnap.frecuencia,tipoRuta:rutaSnap.tipoRuta||"regular",perfilCalendario:rutaSnap.perfilCalendario||getPerfilCalendarioUsuario(usuarioActual),routeMeta:rutaSnap.routeMeta||null,excepcion:rutaSnap.excepcion||null}:null,
      calendarioSnapshot:{perfil:calEval.perfil,estado:calEval.estado,feriado:calEval.feriado||null,validadoEn:new Date().toISOString()},
      observaciones:auditObs.slice(0,2000), compromisos:auditCompromisos.slice(0,2000),
      estado, creadoEn:checkInTs, updatedAt:checkOutTs,
    };
    try{
      await setDoc(doc(db,"auditorias",docId),payload);
      showToast(estado==="borrador"?"💾 Borrador guardado":`✅ Enviada · ${scoreFinal!==null?scoreFinal.toFixed(1)+"%":"S/D"} ${scoreFinal!==null?getTierAuditoria(scoreFinal).icon:""}`);
      setAuditPaso(0); setAuditTiendaSel(null); setAuditRespuestas({});
      setAuditGPS(null); setAuditGPSOut(null); setAuditCheckInTs(null); setAuditModulosActivos([]);
      // Generar mailto si es envío final
      if(estado==="enviado"){
        const tiendaObj=tiendas.find(t=>t.id===auditTiendaSel);
        const zonaEmail=tiendaObj?.zonaId?usuarios.find(u=>u.id===tiendaObj.zonaId)?.email:"";
        const tiendaEmail=tiendaObj?.email||"";
        const toEmails=[zonaEmail,tiendaEmail].filter(Boolean).join(",");
        const subj=`Auditoría Vega ${tiendaObj?.n||auditTiendaSel} · ${fecha} · ${scoreFinal!==null?scoreFinal.toFixed(1)+"%":"S/D"}`;
        // mods ya contiene los módulos correctos definidos arriba
        let bodyLines=[`Auditoría realizada por: ${uName||uDni}`,`Tienda: Vega ${tiendaObj?.n||auditTiendaSel} · ${fecha}`,``];
        scoresPorModulo.forEach(sm=>{
          const pct=sm.score?sm.score.pct:"S/D";
          const icon=sm.score?.pct>=90?"✓":sm.score?.pct>=75?"✓":"⚠";
          const ob=sm.score?.ob??"S/D"; const mx=sm.score?.mx??""; const pctFmt=sm.score?.pct!=null?`${sm.score.pct}%`:"S/D";
          bodyLines.push(`${sm.moduloLabel}: ${sm.score?`${ob}/${mx} pts (${pctFmt})`:"S/D"} ${icon}`);
          if(sm.obsModulo) bodyLines.push(`  Obs: ${sm.obsModulo}`);
        });
        bodyLines.push(``);
        bodyLines.push(`Score final: ${scoreFinal!==null?scoreFinal.toFixed(1)+"%":"S/D"}`);
        if(auditCompromisos){bodyLines.push(``);bodyLines.push(`Compromisos acordados:`);bodyLines.push(auditCompromisos);}
        const body=bodyLines.join("\n");
        setAuditEmailModal({to:toEmails,subject:subj,body});
      }
    }catch(e){ console.error("auditCheckOut:", e?.code||e?.message||"unknown"); showToast("❌ Error al enviar."); }
  },[auditTiendaSel,auditRespuestas,auditObs,auditCompromisos,auditGPS,auditGPSOut,
     auditCheckInTs,auditModulosActivos,checklistModulos,tiendas,fecha,uDni,uName,showToast,obtenerGPS]);

  // Solicitar exclusión N/A de auditoría (auditor) — queda pendiente hasta que admin apruebe
  const solicitarExclusionAudit = useCallback(async(tId, motivo, comentario)=>{
    const nueva={...auditExclusiones,[tId]:{motivo,comentario,solicitadoPor:uName||uDni,fecha:todayStr(),aprobada:false}};
    try{
      await setDoc(doc(db,"config","auditExclusiones"),nueva);
      showToast("Exclusión enviada al administrador");
    }catch(e){ showToast("❌ Error al enviar exclusión"); }
  },[auditExclusiones,uName,uDni,showToast]);

  // Aprobar / rechazar exclusión de auditoría (solo admin)
  const gestionarExclusionAudit = useCallback(async(tId, aprobar)=>{
    let nueva;
    if(aprobar){
      nueva={...auditExclusiones,[tId]:{...auditExclusiones[tId],aprobada:true,aprobadaPor:uName,fechaAprobacion:todayStr()}};
    } else {
      nueva=Object.fromEntries(Object.entries(auditExclusiones).filter(([k])=>k!==tId));
    }
    try{
      await setDoc(doc(db,"config","auditExclusiones"),nueva);
      showToast(aprobar?"✅ Exclusión aprobada":"🗑️ Exclusión rechazada");
    }catch(e){ showToast("❌ Error al gestionar exclusión"); }
  },[auditExclusiones,uName,showToast]);

  const dow = getDow(fecha);
  const esFS = dow===0; // Solo domingo bloquea — sábado habilitado (tiendas abren)
  const tiAct = useMemo(()=>tiendas.filter(ti=>ti.activa),[tiendas]);
  const actsDia = useMemo(()=>acts.filter(a=>a.activa&&(a.dias||[]).includes(dow)),[acts,dow]);
  const actInfo = useMemo(()=>acts.find(a=>a.id===actSel),[acts,actSel]);
  const getRangoActivo = useCallback((actId, fechaStr)=>{
    const override = rangosDia?.[actId]?.[fechaStr];
    if(override) return override;
    const act = acts.find(a=>a.id===actId);
    return act?.r || RANGOS_DEFAULT;
  },[rangosDia, acts]);
  const semanasDelMes = useMemo(()=>getWeeksOfMonth(vYear,vMonth),[vYear,vMonth]);
  const isAdmin       = role==="admin";
  const isCoord       = role==="coordinador";
  const isEjecutor    = role==="ejecutor";
  const isAuditor     = role==="admin"||role==="coordinador"||role==="auditor";
  const isViewer      = role==="visor";
  const canEdit       = role==="admin"||role==="coordinador";
  const canViewReports= ["admin","coordinador","auditor","visor"].includes(role);
  // cargo e indicadores del usuario logueado
  const loggedUser    = usuarios.find(u=>u.id===uDni||u.dni===uDni)||{};
  const uCargo        = loggedUser.cargo||"";
  const uArea         = loggedUser.area||"";
  // Solicitante: cualquier cargo distinto a Diseñador/Admin que puede crear y seguir ODTs pero no asignar
  const isSolicitante = ["coordinador","visor"].includes(role)||(role==="ejecutor"&&uCargo!=="Diseñador");
  /* ET_FIX_DISENO_VARS_SCOPE_20260615 — variables de rol para módulo Diseño/ODT */
  const isDisenoCargo    = String(uCargo).toLowerCase().trim()==="diseñador"||String(uCargo).toLowerCase().trim()==="disenador";
  const isDisenoAdmin    = role==="admin";
  const isDisenoCoordinator = role==="coordinador";
  const isDisenoExecutor = role==="ejecutor" && isDisenoCargo;
  const isDisenoViewer   = role==="visor";
  /* ET_FIX_TIENDA_HELPERS_SCOPE_20260615 — helpers de tienda accesibles en todo el render */
  const nomTienda=(t)=>String(t?.n||t?.nombre||t?.tienda||"").trim();
  const fmtTienda=(t)=>String(t?.f||t?.formato||"").trim();
  const distTienda=(t)=>String(t?.dist||t?.distrito||"").trim();

  // B1 fix: regsIndex declarado ANTES de getReg que lo referencia
  // Bug 10 fix: índice memoizado de regs para O(1) lookups — evita 6500 llamadas por render
  const regsIndex = useMemo(()=>{
    const idx = {};
    Object.entries(regs).forEach(([docId, data]) => {
      idx[docId] = data;
      // Índice inverso por fecha+tienda para queries rápidas
      if(data.fecha && data.tiendaId) {
        const dateKey = `date|${data.fecha}|${data.tiendaId}`;
        if(!idx[dateKey]) idx[dateKey] = [];
        idx[dateKey].push(docId);
      }
    });
    return idx;
  },[regs]);

  const getReg = useCallback((f,tid,a)=>{
    const k=rKey(f,tid,a);
    const docId=k.replace(/\|/g,"--");
    // Usa regsIndex para O(1) lookup — ya memoizado por useMemo([regs])
    return regsIndex?.[docId]||regsIndex?.[k]||regs[docId]||regs[k]||null;
  },[regs,regsIndex]);
  const isExc = useCallback((tId,aId,fechaCheck)=>{
    const v = exceps[tId+"|"+aId];
    if(!v) return false;
    // legacy true: ya no aplica
    if(v===true) return false;
    if(!Array.isArray(v)) return false;
    if(!fechaCheck) return false;
    // Soporta tanto formato legacy [{fecha}] como nuevo [{fecha, comentario}]
    // y también array de strings puro (migración)
    return v.some(entry=>(typeof entry==="string"?entry:entry?.fecha)===fechaCheck);
  },[exceps]);

  // Helper: obtener el comentario de una excepción específica tienda+actividad+fecha
  const getExcComment = useCallback((tId,aId,fechaCheck)=>{
    const v = exceps[tId+"|"+aId];
    if(!v||!Array.isArray(v)) return "";
    const entry = v.find(e=>(typeof e==="string"?e:e?.fecha)===fechaCheck);
    if(!entry||typeof entry==="string") return "";
    return entry.comentario||"";
  },[exceps]);

  // Auto-mostrar tarjeta de estado a las 08:30 y 09:30
  useEffect(()=>{
    const check=()=>{
      const now=new Date();
      const hhmm=now.getHours()*60+now.getMinutes();
      const t1=8*60+30; // 08:30
      const t2=9*60+30; // 09:30
      const key1=`statusShown_${todayStr()}_0830`;
      const key2=`statusShown_${todayStr()}_0930`;
      // B14 fix: solo mostrar a auditores/admin, no al viewer
      const currentRole = roleRef.current;
      if(hhmm===t1&&!sessionStorage.getItem(key1)&&(currentRole==="admin"||currentRole==="auditor")){
        sessionStorage.setItem(key1,"1");
        setShowStatusCard(true);
      }
      if(hhmm===t2&&!sessionStorage.getItem(key2)&&(currentRole==="admin"||currentRole==="auditor")){
        sessionStorage.setItem(key2,"1");
        setShowStatusCard(true);
      }
    };
    const interval=setInterval(check,30000); // revisa cada 30 seg
    return()=>clearInterval(interval);
  },[]);

  /* ── cálculos KPI ── */
  const kpisDia = useMemo(()=>{
    if(!actSel)return{total:0,IC:0,IP:0,SE:0,TR:0,SG:0,al100:0,conEnvio:0};
    const AR=getRangoActivo(actSel,fecha);
    const ts=tiAct.filter(ti=>!isExc(ti.id,actSel,fecha));
    const total=ts.length;
    // B13 fix: cachear getReg+puntajeReg una sola vez por tienda — evita 7 llamadas duplicadas
    const ptsMap=new Map(ts.map(ti=>[ti.id, puntajeReg(getReg(fecha,ti.id,actSel),AR)]));
    const withEnv=ts.filter(ti=>ptsMap.get(ti.id)!==null);
    const pts=[...ptsMap.values()];
    const IC=total>0?Math.round((withEnv.length/total)*100):0;
    const valid=pts.filter(p=>p!==null);
    const IP_pts=valid.length>0?(valid.reduce((a,b)=>a+b,0)/valid.length):0;
    const IP=Math.round((IP_pts/10)*100);
    const al100=pts.filter(p=>p===10).length;
    const SE=total>0?Math.round((al100/total)*100):0;
    const TR=total>0?Math.round((ts.filter(ti=>ptsMap.get(ti.id)===null).length/total)*100):0;
    const SG=Math.round((IC*IP)/100);
    const r100=withEnv.filter(ti=>ptsMap.get(ti.id)===10);
    const r80=withEnv.filter(ti=>ptsMap.get(ti.id)===8);
    const r60=withEnv.filter(ti=>ptsMap.get(ti.id)===6);
    const r0=ts.filter(ti=>ptsMap.get(ti.id)===null);
    return{total,IC,IP,SE,TR,SG,al100,conEnvio:withEnv.length,r100,r80,r60,r0};
  },[actSel,tiAct,isExc,getReg,getRangoActivo,rangosDia,fecha]); // B2 fix: quitar actInfo (derivado), agregar getRangoActivo+rangosDia

  // Bug 2+5 fix: actsConRegistroIds con fallback al docId para registros legacy sin .fecha
  const actsConRegistroIds = useMemo(()=>{
    const ids = new Set();
    const ymPrefix = `${vYear}-${String(vMonth+1).padStart(2,"0")}`;
    Object.entries(regs).forEach(([docId, r])=>{
      if(!r?.actividadId||!r?.evidencias?.length||r.anulado) return;
      const f = r.fecha||"";
      if(f.startsWith(ymPrefix) && f.length===10) {
        ids.add(r.actividadId);
        return;
      }
      // Bug 2 fix: fallback — extraer fecha del docId (formato fecha--tiendaId--actividadId)
      // docId = "YYYY-MM-DD--tXX--aXX"
      const partes = docId.split("--");
      if(partes.length>=3 && partes[0].startsWith(ymPrefix)) {
        ids.add(r.actividadId);
      }
    });
    return ids;
  },[regs,vYear,vMonth]);

  // calcEficiencia — motor base. Acepta filtro opcional de categoría.
  // Denominador dinámico: solo cuenta días donde la actividad tiene
  // al menos 1 registro en el período para CUALQUIER tienda (actsConRegistroIds).
  // FIX Ad-hoc: actividades no-AlwaysOn solo suman al denominador en días concretos
  // donde hay al menos 1 registro real (evita inflar denominador en semanas sin historial).
  const calcEficiencia = useCallback((tId, days, catFilter=null)=>{
    let obtenidos=0, maximos=0, registros=[];
    const hoy=todayStr();
    // Precalcular días con registro real por actividad Ad-hoc (para no inflar denominador)
    const adHocDiasConReg = {};
    days.forEach(ds=>{
      if(ds>hoy) return;
      acts.filter(a=>a.activa&&a.cat!=="Always On"&&actsConRegistroIds.has(a.id)).forEach(a=>{
        const tieneReg=tiAct.some(ti=>{
          const r=getReg(ds,ti.id,a.id);
          return r?.evidencias?.length>0&&!r?.anulado;
        });
        if(tieneReg){
          if(!adHocDiasConReg[a.id]) adHocDiasConReg[a.id]=new Set();
          adHocDiasConReg[a.id].add(ds);
        }
      });
    });
    days.forEach(ds=>{
      if(ds>hoy) return;
      const dw=getDow(ds);
      acts.filter(a=>
        a.activa &&
        (a.dias||[]).includes(dw) &&
        !isExc(tId,a.id,ds) &&
        actsConRegistroIds.has(a.id) && // solo actividades operativamente activas
        (catFilter===null || a.cat===catFilter) &&
        // Ad-hoc: solo contar este día si hay registro real de alguna tienda en ese día
        (a.cat==="Always On" || (adHocDiasConReg[a.id]&&adHocDiasConReg[a.id].has(ds)))
      ).forEach(a=>{
        const p=puntajeReg(getReg(ds,tId,a.id),getRangoActivo(a.id,ds));
        maximos+=10;
        if(p!==null){ obtenidos+=p; registros.push({fecha:ds,act:a.n,cat:a.cat,pts:p,max:10}); }
      });
    });
    if(maximos===0) return null;
    return {pct:Math.round((obtenidos/maximos)*100), obtenidos, maximos, registros};
  },[acts,tiAct,regs,regsIndex,actsConRegistroIds,isExc,getReg,getRangoActivo]);

  // calcEficienciaModular — devuelve score por módulo + score final ponderado
  // por cantidad de actividades registradas en cada módulo.
  // FIX Ad-hoc: misma guarda de días con registro real que calcEficiencia.
  const calcEficienciaModular = useCallback((tId, days)=>{
    const hoy=todayStr();
    const mods = {AO:{ob:0,mx:0,n:0}, AH:{ob:0,mx:0,n:0}, PR:{ob:0,mx:0,n:0}};
    const catKey = {"Always On":"AO","Ad-hoc":"AH","Promocional":"PR"};
    const adHocDiasConReg = {};
    days.forEach(ds=>{
      if(ds>hoy) return;
      acts.filter(a=>a.activa&&a.cat!=="Always On"&&actsConRegistroIds.has(a.id)).forEach(a=>{
        const tieneReg=tiAct.some(ti=>{const r=getReg(ds,ti.id,a.id);return r?.evidencias?.length>0&&!r?.anulado;});
        if(tieneReg){if(!adHocDiasConReg[a.id]) adHocDiasConReg[a.id]=new Set();adHocDiasConReg[a.id].add(ds);}
      });
    });
    days.forEach(ds=>{
      if(ds>hoy) return;
      const dw=getDow(ds);
      acts.filter(a=>
        a.activa && (a.dias||[]).includes(dw) &&
        !isExc(tId,a.id,ds) && actsConRegistroIds.has(a.id) &&
        (a.cat==="Always On"||(adHocDiasConReg[a.id]&&adHocDiasConReg[a.id].has(ds)))
      ).forEach(a=>{
        const mk=catKey[a.cat]||"AH";
        const p=puntajeReg(getReg(ds,tId,a.id),getRangoActivo(a.id,ds));
        mods[mk].mx+=10;
        mods[mk].n+=1;
        if(p!==null) mods[mk].ob+=p;
      });
    });
    const modResults={};
    let totalN=0, weightedSum=0;
    Object.entries(mods).forEach(([k,m])=>{
      if(m.mx===0){modResults[k]=null;return;}
      const pct=Math.round((m.ob/m.mx)*100);
      modResults[k]={pct,ob:m.ob,mx:m.mx,n:m.n};
      totalN+=m.n; weightedSum+=pct*m.n;
    });
    const finalPct=totalN>0?Math.round(weightedSum/totalN):null;
    return {modulos:modResults, pct:finalPct, totalN};
  },[acts,tiAct,regs,regsIndex,actsConRegistroIds,isExc,getReg,getRangoActivo]);

  const calcSemana = useCallback((tId,sem)=>{
    const days=sem.days.map(d=>dStr(vYear,vMonth,d));
    const ef=calcEficiencia(tId,days);
    return ef?ef.pct:null;
  },[calcEficiencia,vYear,vMonth]);

  const calcSemanaDetalle = useCallback((tId,sem)=>{
    const days=sem.days.map(d=>dStr(vYear,vMonth,d));
    return calcEficiencia(tId,days);
  },[calcEficiencia,vYear,vMonth]);

  const calcMes = useCallback((tId)=>{
    const allDays=semanasDelMes.flatMap(s=>s.days.map(d=>dStr(vYear,vMonth,d)));
    const ef=calcEficiencia(tId,allDays);
    return ef?ef.pct:null;
  },[semanasDelMes,calcEficiencia,vYear,vMonth]);

  const calcMesDetalle = useCallback((tId)=>{
    const allDays=semanasDelMes.flatMap(s=>s.days.map(d=>dStr(vYear,vMonth,d)));
    return calcEficiencia(tId,allDays);
  },[semanasDelMes,calcEficiencia,vYear,vMonth]);

  /* ── tiendas filtradas para lista ── */
  const tRegistradas = useMemo(()=>new Set(
    tiAct.filter(ti=>{
      const reg=getReg(fecha,ti.id,actSel||"");
      return reg?.evidencias?.length>0 && !reg?.anulado;
    }).map(ti=>ti.id)
  ),[tiAct,regs,fecha,actSel,getReg]);

  const tFilt = useMemo(()=>tiAct.filter(ti=>{
    if(fmtFilt!=="Todas"&&ti.f!==fmtFilt)return false;
    if(busq&&!ti.n.toLowerCase().includes(busq.toLowerCase()))return false;
    const excHoy = isExc(ti.id,actSel,fecha);
    if(excHoy && !verRegistradas) return false;
    if(excHoy) return true;
    if(tRegistradas.has(ti.id) && !verRegistradas) return false;
    return true;
  }).sort((a,b)=>a.n.localeCompare(b.n,"es")),[tiAct,fmtFilt,busq,tRegistradas,verRegistradas,isExc,actSel,fecha]);

  /* ── confirmar registros en bloque ── */
  const confirmarRegistro = async ()=>{
    if(!horaEx||tSel.size===0||!actSel)return;
    // Bug 8 fix: auditores solo pueden registrar en la fecha actual
    if(!isAdmin && fecha !== todayStr()) {
      showToast("⚠️ Solo puedes registrar en la fecha de hoy. Contacta al Admin para corregir registros.");
      return;
    }
    // REGLA UNIVERSAL: nadie puede insertar si la tienda ya tiene registro válido hoy
    // para esta actividad. Admin debe usar "Actualizar registro" desde el Reporte.
    const yaRegistradas = [...tSel].filter(tId=>{
      const reg = getReg(fecha,tId,actSel);
      return reg?.evidencias?.length>0 && !reg?.anulado;
    });
    if(yaRegistradas.length>0){
      const nombres = yaRegistradas.map(tId=>tiendas.find(x=>x.id===tId)?.n||tId).join(", ");
      showToast(`⚠️ Ya registradas: ${nombres}. Usa "Actualizar" desde el Reporte.`);
      // Quitar automáticamente las ya registradas de la selección
      setTSel(prev=>{const ns=new Set(prev);yaRegistradas.forEach(id=>ns.delete(id));return ns;});
      return;
    }
    const AR = getRangoActivo(actSel, fecha); // Bug 1: fuente única de verdad
    const pct=calcP(horaEx,AR);
    const tier=getTierPts(pct);
    // Bug 3 fix: advertir cuando la hora declarada difiere >2h del timestamp real
    const ahora=new Date();
    const ahoraMin=ahora.getHours()*60+ahora.getMinutes();
    const horaExMin=toMin(horaEx);
    const diffMin=ahoraMin-horaExMin;
    if(diffMin>120&&fecha===todayStr()&&!isAdmin){
      // Advertencia no bloqueante — el auditor puede confirmar si es legítimo
      const ok=window.confirm(`⚠️ La hora declarada (${horaEx}) es ${Math.floor(diffMin/60)}h ${diffMin%60}min anterior a la hora actual.\n\nEsto puede afectar el puntaje real. ¿Confirmas que esta fue la hora real de envío?`);
      if(!ok) return;
    }
    let n=0;
    const promises=[];
    tSel.forEach(tId=>{
      const k=rKey(fecha,tId,actSel);
      const now=new Date();
      // A6 fix: timestamp normalizado a ISO, hora de registro en formato 24h consistente
      const hreg=now.toISOString(); // timestamp real de registro siempre en ISO
      // SECURITY: sanitizar docId para evitar path traversal
      const docId=k.replace(/\|/g,"--").replace(/[^a-zA-Z0-9\-_.]/g,"_");
      const ev={
        id:Date.now()+n,
        hora:horaEx,              // hora declarada por el auditor (HH:MM)
        puntaje:pct,
        observacion:(obsEx||`Registro en bloque · ${tier.label}`).slice(0,500), // SECURITY: limitar longitud
        horaRegistro:horaHHMM(now), // legible
        timestamp:hreg,           // ISO para ordenamiento y auditoría
        auditor:uName,
        dni:uDni,
      };
      const prevEvs=(regs[docId]?.evidencias)||(regs[k]?.evidencias)||[];
      const newEvs=[...prevEvs,ev].sort((a,b)=>a.hora.localeCompare(b.hora));
      promises.push(setDoc(doc(db,"registros",docId),{
        evidencias:newEvs,
        fecha,
        tiendaId:tId,
        actividadId:actSel,
        updatedAt:now.toISOString(),
      }));
      n++;
    });
    // A4 fix: try/catch en operaciones Firebase críticas
    try {
      await Promise.all(promises);
      showToast(`✅ ${n} tienda${n!==1?"s":""} · ${horaEx} · ${pct} pts ${tier.icon} ${tier.label}`);
      setTSel(new Set());setRango(null);
      setHoraEx(horaHHMM());
      setObsEx("");setPaso(2);setVerRegistradas(false);
    } catch(e) {
      console.error("confirmarRegistro error:", e?.code||e?.message||"unknown");
      showToast("❌ Error al guardar. Verifica tu conexión e intenta nuevamente.");
    }
  };

  const eliminarRegistro = async (docId) => {
    try {
      await setDoc(doc(db,"registros",docId), {...(regs[docId]||{}), evidencias: [], activo:false, deletedAt:new Date().toISOString(), deletedBy:uDni||uName||"admin_ui", deleteReason:"eliminacion_manual"});
      showToast("🗑️ Registro eliminado con trazabilidad");
    } catch(e) {
      console.error("eliminarRegistro error:", e?.code||e?.message||"unknown");
      showToast("❌ Error al eliminar. Verifica tu conexión.");
    }
    setDelModal(null);
  };

  const anularRegistro = async () => {
    if(!anularModal||!motivoAnu) return;
    const {docId, docData} = anularModal;
    try {
      await setDoc(doc(db,"registros",docId), {
        ...docData,
        anulado: true,
        motivoAnulacion: motivoAnu.slice(0,300),
        detalleAnulacion: detalleAnu.slice(0,500),
        anuladoPor: uName,
        anuladoEn: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      });
      showToast("⚠️ Registro anulado correctamente");
      setAnularModal(null); setMotivoAnu(""); setDetalleAnu("");
    } catch(e) {
      console.error("anularRegistro error:", e?.code||e?.message||"unknown");
      showToast("❌ Error al anular. Verifica tu conexión.");
    }
  };

  const actualizarRegistro = async () => {
    if(!updModal||!horaUpd||!motivoUpd) return;
    const {docId, docData, actividadId} = updModal;
    // Bug 1 fix: usar getRangoActivo como fuente única de verdad
    const AR = getRangoActivo(actividadId, docData.fecha||fecha);
    const pct = calcP(horaUpd, AR);
    const tier = getTierPts(pct);
    const now2 = new Date();
    const ev = {
      id: Date.now(),
      hora: horaUpd,
      puntaje: pct,
      observacion: `Corrección: ${motivoUpd.slice(0,300)}`,
      horaRegistro: horaHHMM(now2),
      timestamp: now2.toISOString(), // A6 fix: ISO consistente
      auditor: uName,
      esCorreccion: true,
    };
    const prevEvs = docData.evidencias || [];
    const newEvs = [...prevEvs, ev].sort((a,b)=>a.hora.localeCompare(b.hora));
    try {
      await setDoc(doc(db,"registros",docId), {
        ...docData,
        evidencias: newEvs,
        updatedAt: now2.toISOString(),
      });
      showToast(`✏️ Registro actualizado · ${horaUpd} · ${pct} pts ${tier.icon}`);
      setUpdModal(null); setHoraUpd(""); setMotivoUpd("");
    } catch(e) {
      console.error("actualizarRegistro error:", e?.code||e?.message||"unknown");
      showToast("❌ Error al actualizar. Verifica tu conexión.");
    }
  };

  // toggleExcepcion: ahora acepta comentario y modo "aplicar a todo el período"
  // applyAll=true → aplica la exclusión a todas las fechas de la semana actual (L-V del período activo)
  const toggleExcepcion = async (tId, aId, comentario="", applyAll=false) => {
    const key = tId+"|"+aId;
    const newExceps = {...exceps};
    const cur = newExceps[key];
    // Normalizar: convertir strings legacy a objetos {fecha, comentario:""}
    const entries = Array.isArray(cur)
      ? cur.map(e=>typeof e==="string"?{fecha:e,comentario:""}:e)
      : (cur===true?[]:[]);

    const yaExcluida = entries.some(e=>e.fecha===fecha);
    if(yaExcluida){
      // Quitar esta fecha (y opcionalmente todas si applyAll)
      const updated = applyAll
        ? [] // quitar todas las entradas del período
        : entries.filter(e=>e.fecha!==fecha);
      if(updated.length===0) delete newExceps[key];
      else newExceps[key] = updated;
      showToast("✅ Excepción removida");
    } else {
      if(applyAll){
        // Aplicar a todas las fechas L-V de la semana activa del mes visualizado
        const semActiva = semanasDelMes.find(s=>s.days.some(d=>dStr(vYear,vMonth,d)===fecha))
          || semanasDelMes[0];
        const fechasAplicar = semActiva
          ? semActiva.days.map(d=>dStr(vYear,vMonth,d))
          : [fecha];
        const existingFechas = new Set(entries.map(e=>e.fecha));
        const nuevasEntradas = fechasAplicar
          .filter(f=>!existingFechas.has(f))
          .map(f=>({fecha:f,comentario}));
        // Actualizar comentario en las existentes si se pasa uno nuevo
        const actualizadas = entries.map(e=>
          fechasAplicar.includes(e.fecha)?{...e,comentario:comentario||e.comentario}:e
        );
        newExceps[key] = [...actualizadas, ...nuevasEntradas];
        showToast(`⚠️ ${fechasAplicar.length} fechas excluidas con comentario`);
      } else {
        // Agregar solo esta fecha
        newExceps[key] = [...entries, {fecha, comentario}];
        showToast("⚠️ Tienda excluida para "+fecha+(comentario?` · "${comentario.slice(0,20)}..."`:"")); 
      }
    }
    setExceps(newExceps);
    try {
      await saveConfig({excepciones: newExceps});
    } catch(e) {
      console.error("toggleExcepcion error:", e?.code||e?.message||"unknown");
      showToast("❌ Error al guardar excepción. Verifica tu conexión.");
    }
  };

  const navMes=(dir)=>{
    if(dir<0){if(vMonth===0){setVMonth(11);setVYear(y=>y-1);}else setVMonth(m=>m-1);}
    else{if(vMonth===11){setVMonth(0);setVYear(y=>y+1);}else setVMonth(m=>m+1);}
    setSelWeek(null);
  };

  /* ══ ESTILOS BASE ══ */
  const S={
    wrap:  {fontFamily:"'DM Sans',system-ui,sans-serif",background:"#f0f4f8",minHeight:"100vh",color:"#1a2f4a"},
    card:  {background:"#fff",borderRadius:14,border:"1px solid #e2e8f0",boxShadow:"0 2px 8px rgba(0,0,0,.05)"},
    hdr:   {background:"#1a2f4a",padding:"12px 16px 0",position:"sticky",top:0,zIndex:10},
    inp:   {width:"100%",padding:"11px 14px",borderRadius:10,border:"1px solid #c8d8e8",background:"#f8fafc",color:"#1a2f4a",fontSize:14,outline:"none",boxSizing:"border-box"},
    btn:   (c)=>({padding:"13px",borderRadius:12,border:"none",background:`linear-gradient(135deg,${c},#1a2f4a)`,color:"#fff",fontSize:14,fontWeight:700,cursor:"pointer",width:"100%"}),
    tabB:  (on)=>({padding:"9px 16px",border:"none",cursor:"pointer",fontSize:12,fontWeight:700,borderBottom:on?"3px solid #00b5b4":"3px solid transparent",color:on?"#00b5b4":"#8aaabb",background:"transparent",whiteSpace:"nowrap"}),
    lbl:   {fontSize:11,fontWeight:700,color:"#5a7a9a",letterSpacing:".05em",display:"block",marginBottom:6},
    pill:  (c,bg)=>({padding:"3px 10px",borderRadius:20,fontSize:11,fontWeight:700,color:c,background:bg}),
  };

  /* ══ LOGIN ══ */

  /* ══ VIEWER DASHBOARD — narrativa estratégica para gerencia ══ */
  // B6 fix: memoizar cálculos pesados del viewer para evitar recálculo en cada render
  const viewerData = useMemo(()=>{
    const hoy=todayStr();
    const esMesActual=vYear===new Date().getFullYear()&&vMonth===new Date().getMonth();
    const tendenciaViewer=semanasDelMes.map(s=>{
      let ob=0,mx=0;
      tiAct.forEach(ti=>{
        s.days.forEach(d=>{
          const ds=dStr(vYear,vMonth,d);
          if(ds>hoy) return; // no contar días futuros
          const dw=getDow(ds);
          acts.filter(a=>a.activa&&(a.dias||[]).includes(dw)&&actsConRegistroIds.has(a.id)&&!isExc(ti.id,a.id,ds)).forEach(a=>{
            mx+=10;
            const p=puntajeReg(getReg(ds,ti.id,a.id),getRangoActivo(a.id,ds));
            if(p!==null) ob+=p;
          });
        });
      });
      return mx>0?{pct:Math.round((ob/mx)*100),ob,mx}:null;
    });

    // Bug 1 fix: semana "actual" = hoy si es mes actual, última semana con datos si es mes histórico
    const iSemActual=esMesActual
      ? semanasDelMes.findIndex(s=>s.days.some(d=>dStr(vYear,vMonth,d)===hoy))
      : tendenciaViewer.reduce((last,v,i)=>v!==null?i:last,-1); // última semana con datos
    const iSemRef=iSemActual>=0?iSemActual:tendenciaViewer.length-1;
    const vSemActual=tendenciaViewer[iSemRef];
    const vSemAnt=iSemRef>0?tendenciaViewer[iSemRef-1]:null;
    const deltaSem=vSemActual&&vSemAnt?vSemActual.pct-vSemAnt.pct:null;

    // Eficiencia global del mes visualizado
    const efMes=(()=>{
      let ob=0,mx=0;
      tendenciaViewer.forEach(v=>{if(v){ob+=v.ob;mx+=v.mx;}});
      return mx>0?Math.round((ob/mx)*100):null;
    })();

    // Bug 5 fix: distribución de cortes SOLO del mes visualizado, con rangos reales por actividad
    // En lugar de contar evidencias brutas, calculamos por combinación tienda+actividad+día
    let nOroV=0,nC2V=0,nFueraV=0,nSinRegV=0,nTotalEsperadoV=0;
    // Determinar el rango de corte dominante para mostrar en el KPI
    const rangosUsados=new Set();
    tiAct.forEach(ti=>{
      semanasDelMes.forEach(s=>s.days.forEach(d=>{
        const ds=dStr(vYear,vMonth,d);
        if(ds>hoy) return;
        const dw=getDow(ds);
        acts.filter(a=>a.activa&&(a.dias||[]).includes(dw)&&actsConRegistroIds.has(a.id)&&!isExc(ti.id,a.id,ds)).forEach(a=>{
          nTotalEsperadoV++;
          const rango=getRangoActivo(a.id,ds);
          const c1=toMin(rango.c100||"08:30");
          const c2=toMin(rango.c80||"09:00");
          rangosUsados.add(rango.c100||"08:30"); // para mostrar en KPI
          const reg=getReg(ds,ti.id,a.id);
          if(!reg?.evidencias||reg.anulado){nSinRegV++;return;}
          const m=toMin(primerEnvio(reg.evidencias));
          if(m<=c1) nOroV++;
          else if(m<=c2) nC2V++;
          else nFueraV++;
        });
      }));
    });
    const totalContadoV=nOroV+nC2V+nFueraV+nSinRegV||1;
    // Rango dominante para mostrar en KPI (el más frecuente)
    const rangoMostrar=[...rangosUsados].sort()[0]||"08:30";

    // Actividades por eficiencia — mes visualizado
    const actEfectV=acts.filter(a=>a.activa&&actsConRegistroIds.has(a.id)).map(a=>{
      let ob=0,mx=0,nC1=0,nC2act=0;
      const rango=getRangoActivo(a.id,hoy);
      const c1=toMin(rango.c100||"08:30");
      tiAct.forEach(ti=>{
        semanasDelMes.forEach(s=>s.days.forEach(d=>{
          const ds=dStr(vYear,vMonth,d);
          if(ds>hoy||!(a.dias||[]).includes(getDow(ds))||isExc(ti.id,a.id,ds)) return;
          mx+=10;
          const p=puntajeReg(getReg(ds,ti.id,a.id),getRangoActivo(a.id,ds));
          if(p!==null){
            ob+=p;
            const reg=getReg(ds,ti.id,a.id);
            const m=toMin(primerEnvio(reg?.evidencias));
            if(m<=c1) nC1++; else nC2act++;
          }
        }));
      });
      return {a,pct:mx>0?Math.round((ob/mx)*100):null,ob,mx,nC1,nC2act,total:mx/10||1};
    }).filter(x=>x.pct!==null).sort((a,b)=>b.pct-a.pct);

    // Formato eficiencia
    const fmtEfV=["Mayorista","Supermayorista","Market"].map(fmt=>{
      let ob=0,mx=0;
      tiAct.filter(ti=>ti.f===fmt).forEach(ti=>{
        semanasDelMes.forEach(s=>s.days.forEach(d=>{
          const ds=dStr(vYear,vMonth,d);
          if(ds>hoy) return;
          const dw=getDow(ds);
          acts.filter(a=>a.activa&&(a.dias||[]).includes(dw)&&actsConRegistroIds.has(a.id)&&!isExc(ti.id,a.id,ds)).forEach(a=>{
            mx+=10;
            const p=puntajeReg(getReg(ds,ti.id,a.id),getRangoActivo(a.id,ds));
            if(p!==null) ob+=p;
          });
        }));
      });
      return {fmt,pct:mx>0?Math.round((ob/mx)*100):null};
    });

    // Issue 1 fix: tiendas en riesgo SOLO si tuvieron al menos 1 registro real en el mes
    // Esto evita el falso positivo de tiendas con 0% por nunca haber registrado (no evaluadas)
    const scoresMesV=tiAct.map(ti=>{
      const ef=calcMesDetalle(ti.id);
      // Requiere días evaluables Y al menos 1 registro real
      const tuvoDiasEvaluables=semanasDelMes.some(s=>s.days.some(d=>{
        const ds=dStr(vYear,vMonth,d);
        if(ds>hoy) return false;
        const dw=getDow(ds);
        return acts.some(a=>a.activa&&(a.dias||[]).includes(dw)&&actsConRegistroIds.has(a.id)&&!isExc(ti.id,a.id,ds));
      }));
      const tuvoRegistros=semanasDelMes.some(s=>s.days.some(d=>{
        const ds=dStr(vYear,vMonth,d);
        return acts.some(a=>a.activa&&(a.dias||[]).includes(getDow(ds))&&actsConRegistroIds.has(a.id)&&(()=>{
          const reg=getReg(ds,ti.id,a.id);
          return reg?.evidencias?.length>0&&!reg?.anulado;
        })());
      }));
      if(!tuvoDiasEvaluables||!tuvoRegistros) return {ti,pct:null,sinDatos:!tuvoDiasEvaluables};
      return {ti,pct:ef?.pct??null,sinDatos:false};
    });
    const enRiesgo=scoresMesV.filter(s=>s.pct!==null&&s.pct<60).sort((a,b)=>(a.pct??99)-(b.pct??99));
    const enAtención=scoresMesV.filter(s=>s.pct!==null&&s.pct>=60&&s.pct<80).sort((a,b)=>(a.pct??99)-(b.pct??99)).slice(0,3);
    // Tiendas sin datos para mostrar en la leyenda
    const sinDatosCount=scoresMesV.filter(s=>s.sinDatos).length;

    // FIX: usar localDateAdd+getDow evita UTC midnight parse bug (getDay() devolvía día erróneo)
    const DIAS_ES=["domingo","lunes","martes","miércoles","jueves","viernes","sábado"];
    const semAntStr = localDateAdd(hoy, -7);
    const diaSemAnt = DIAS_ES[getDow(semAntStr)];

    const actMejor=actEfectV[0];
    const actPeor=actEfectV[actEfectV.length-1];

    // Issue 2 fix: narrativa respeta la semana seleccionada
    const periodoLabel=selWeek!==null?semanasDelMes[selWeek]?.label:null;
    const semLabel=periodoLabel||semanasDelMes[iSemRef]?.label||"Período";
    const esAlerta=(deltaSem!==null&&deltaSem<-5)||enRiesgo.length>0;
    let narrativa="";
    if(selWeek!==null){
      // Vista de semana específica
      const vSel=tendenciaViewer[selWeek];
      narrativa=vSel
        ?`${semLabel} registró ${vSel.pct}% de eficiencia`
        :`${semLabel} sin datos registrados`;
      if(actMejor) narrativa+=`. ${actMejor.a.n} lideró con ${actMejor.pct}%`;
      if(actPeor&&actPeor.pct<80) narrativa+=`. ${actPeor.a.n} con ${actPeor.pct}% requiere revisión`;
    } else {
      // Vista de mes completo
      if(vSemActual){
        narrativa=esMesActual
          ?`${semLabel} registra ${vSemActual.pct}% de eficiencia`
          :`${MESES[vMonth]} cerró con ${efMes!==null?efMes+"%":"—"} de eficiencia global`;
      }
      if(deltaSem!==null&&esMesActual) narrativa+=` — ${Math.abs(deltaSem)}pts ${deltaSem>=0?"por encima":"por debajo"} de la semana anterior`;
      if(actMejor) narrativa+=`. ${actMejor.a.n} lidera con ${actMejor.pct}%`;
      if(actPeor&&actPeor.pct<80) narrativa+=`. ${actPeor.a.n} requiere atención (${actPeor.pct}%)`;
      if(enRiesgo.length>0) narrativa+=`. ${enRiesgo.length} tienda${enRiesgo.length>1?"s":""} con bajo rendimiento`;
    }
    narrativa+=".";
    return {hoy,esMesActual,tendenciaViewer,iSemRef,vSemActual,vSemAnt,deltaSem,efMes,
            nOroV,nC2V,nFueraV,nSinRegV,nTotalEsperadoV,totalContadoV,rangoMostrar,
            actEfectV,fmtEfV,scoresMesV,enRiesgo,enAtención,sinDatosCount,
            actMejor,actPeor,periodoLabel,semLabel,esAlerta,narrativa};
  },[semanasDelMes,tiAct,acts,actsConRegistroIds,regs,isExc,getReg,getRangoActivo,
     vYear,vMonth,selWeek]);

  if(!role) return <LoginScreen pins={pins} auditores={auditores} usuarios={usuarios}
    onAcceso={(id)=>registrarAcceso(id)}
    onLogin={(r,n,dni,cargo)=>{
      setRole(r);setUName(n);setUDni(dni||"");setVerRegistradas(false);setModulo(0);
      const esDisenador=String(cargo||"").toLowerCase().trim()==="diseñador"||String(cargo||"").toLowerCase().trim()==="disenador";
      // FIX: Ejecutor con cargo Diseñador no tiene permiso en Evidencias (tab 0) — antes
      // aterrizaba ahí igual y la app parecía "trabada" hasta hacer clic manual en Diseño.
      setTab(r==="visor"?1:(r==="ejecutor"&&esDisenador)?7:0);
    }}/>;

  /* ══ PASO 1 — seleccionar actividad ══ */
  const renderPaso1 = ()=>(
    <div style={{padding:"16px"}}>
      <p style={{margin:"0 0 14px",fontSize:12,color:"#8aaabb",fontWeight:700,letterSpacing:".06em"}}>
        {DIAS_N[dow].toUpperCase()} · {actsDia.length} ACTIVIDAD{actsDia.length!==1?"ES":""} PROGRAMADA{actsDia.length!==1?"S":""}
      </p>
      {actsDia.map(a=>(
        <button key={a.id} onClick={()=>{setActSel(a.id);setPaso(2);setVerRegistradas(false);setTSel(new Set());setRango(null);setRangoExt(null);}}
          style={{display:"flex",alignItems:"center",gap:12,padding:"14px 16px",borderRadius:14,border:`2px solid ${actSel===a.id?a.c:"#e2e8f0"}`,background:actSel===a.id?a.c+"15":"#fff",cursor:"pointer",width:"100%",textAlign:"left",marginBottom:10}}>
          <span style={{fontSize:26}}>{a.e}</span>
          <div style={{flex:1}}>
            <div style={{fontSize:15,fontWeight:700,color:actSel===a.id?a.c:"#1a2f4a"}}>{a.n}</div>
            <div style={{fontSize:11,color:"#8aaabb",marginTop:3}}>
              {a.cat} · ⏱️ {a.r?`${a.r.c100} · ${a.r.c80} · ${a.r.c60}`:`${RANGOS_DEFAULT.c100} · ${RANGOS_DEFAULT.c80} · ${RANGOS_DEFAULT.c60}`}
            </div>
          </div>
          <span style={{fontSize:20,color:actSel===a.id?a.c:"#c8d8e8"}}>›</span>
        </button>
      ))}
      {actsDia.length===0&&<div style={{...S.card,padding:"32px",textAlign:"center",color:"#8aaabb"}}>
        <div style={{fontSize:24,marginBottom:8}}>📭</div>
        <div style={{fontWeight:700,marginBottom:4}}>Sin actividades para hoy</div>
        <div style={{fontSize:11}}>El administrador puede crear actividades desde Config</div>
      </div>}
    </div>
  );

  /* ══ PASO 2 — seleccionar tiendas ══ */
  const renderPaso2 = ()=>{
    return(
    <div>
      {/* info actividad */}
      <div style={{padding:"12px 16px 8px",background:"#fff",borderBottom:"1px solid #f0f4f8"}}>
        <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:10}}>
          <span style={{fontSize:20}}>{actInfo?.e}</span>
          <span style={{fontSize:14,fontWeight:700,color:actInfo?.c}}>{actInfo?.n}</span>

        </div>

        {/* rango extendido — solo para Ad-hoc y Promocional */}
        {(actInfo?.cat==="Ad-hoc"||actInfo?.cat==="Promocional")&&(
          <div style={{background:"#fff8ec",border:"1px solid #FAC775",borderRadius:10,padding:"10px 12px",marginBottom:10}}>
            <div style={{fontSize:10,fontWeight:700,color:"#854F0B",marginBottom:8}}>⏱️ VENTANA DE REGISTRO — {actInfo?.cat?.toUpperCase()}</div>
            <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(100px,1fr))",gap:6,marginBottom:6}}>
              {[{k:"c100",icon:"🥇",label:"ORO hasta"},{k:"c80",icon:"🥈",label:"PLATA hasta"},{k:"c60",icon:"🥉",label:"BRONCE hasta"}].map(f=>(
                <div key={f.k}>
                  <div style={{fontSize:9,color:"#854F0B",fontWeight:700,marginBottom:3}}>{f.icon} {f.label}</div>
                  <input type="time" value={(rangoExt||actInfo?.r||RANGOS_DEFAULT)[f.k]}
                    onChange={e=>setRangoExt(r=>({...(r||actInfo?.r||RANGOS_DEFAULT),[f.k]:e.target.value}))}
                    style={{width:"100%",padding:"7px",borderRadius:7,border:"1.5px solid #FAC775",background:"#fff",color:"#1a2f4a",fontSize:12,outline:"none",textAlign:"center"}}/>
                </div>
              ))}
            </div>
            <div style={{display:"flex",gap:6,alignItems:"center"}}>
              <span style={{fontSize:10,color:"#854F0B",flex:1}}>Ajusta si el horario de entrega cambió hoy</span>
              {rangoExt&&<button onClick={()=>setRangoExt(null)} style={{fontSize:9,color:"#854F0B",background:"none",border:"none",cursor:"pointer",textDecoration:"underline"}}>Restablecer</button>}
            </div>
          </div>
        )}

        {/* filtro formato */}
        <div style={{display:"flex",gap:5,overflowX:"auto",marginBottom:8}}>
          {["Todas","Mayorista","Supermayorista","Market"].map(f=>{
            const fc=FMT[f]||{c:"#00b5b4",bg:"#e0fafa"};
            return(
              <button key={f} onClick={()=>setFmtFilt(f)}
                style={{padding:"6px 12px",borderRadius:8,border:`1.5px solid ${fmtFilt===f?fc.c:"#e2e8f0"}`,background:fmtFilt===f?fc.bg:"#fff",color:fmtFilt===f?fc.c:"#5a7a9a",cursor:"pointer",fontSize:12,fontWeight:700,whiteSpace:"nowrap"}}>
                {f}
              </button>
            );
          })}
        </div>
        {/* búsqueda */}
        <div style={{position:"relative"}}>
          <span style={{position:"absolute",left:12,top:"50%",transform:"translateY(-50%)",fontSize:14}}>🔍</span>
          <input placeholder="Buscar tienda..." value={busq} onChange={e=>setBusq(e.target.value)}
            style={{...S.inp,paddingLeft:36,fontSize:13}}/>
        </div>
      </div>

      {/* barra de estado — pendientes vs registradas */}
      {(()=>{
        const tTotal   = tiAct; // todas activas
        const tNA      = tiAct.filter(ti=>isExc(ti.id,actSel,fecha));
        const tEvalAct = tiAct.filter(ti=>!isExc(ti.id,actSel,fecha));
        const nTotal   = tTotal.length;
        const nNA      = tNA.length;
        const nEval    = tEvalAct.length;
        const nReg     = tEvalAct.filter(ti=>tRegistradas.has(ti.id)).length;
        const nPend    = nEval - nReg;
        return(
      <div style={{padding:"8px 16px",background:"#f8fafc",borderBottom:"1px solid #e2e8f0",display:"flex",alignItems:"center",justifyContent:"space-between",gap:8,flexWrap:"wrap"}}>
        <div style={{display:"flex",gap:8,alignItems:"center",flexWrap:"wrap"}}>
          <span style={{fontSize:11,color:"#5a7a9a",fontWeight:700}}>Total {nTotal}</span>
          <span style={{fontSize:10,color:"#c8d8e8"}}>·</span>
          <span style={{fontSize:11,color:"#1a2f4a",fontWeight:800}}>{nEval} disponible{nEval!==1?"s":""}</span>
          {nReg>0&&<span style={S.pill("#00b894","#e8faf5")}>✅ {nReg} registrada{nReg!==1?"s":""}</span>}
          {nPend>0&&<span style={S.pill("#0984e3","#e8f4fd")}><IcoPending size={12} color={"#0984e3"}/> {nPend} pendiente{nPend!==1?"s":""}</span>}
          {nNA>0&&<span style={S.pill("#854F0B","#FAEEDA")}>N/A {nNA}</span>}
          {!isAdmin&&nNA===0&&<span style={S.pill("#0984e3","#e8f4fd")}>🔒 Solo pendientes</span>}
        </div>
        <div style={{display:"flex",gap:6,alignItems:"center"}}>
          {isAdmin&&(
            <div style={{display:"flex",borderRadius:9,overflow:"hidden",border:"1.5px solid #e2e8f0",background:"#f8fafc"}}>
              <button onClick={()=>setVerRegistradas(false)}
                style={{padding:"6px 12px",border:"none",background:!verRegistradas?"#1a2f4a":"transparent",color:!verRegistradas?"#fff":"#5a7a9a",cursor:"pointer",fontSize:11,fontWeight:700,transition:"all .15s"}}>
                Pendientes
              </button>
              <button onClick={()=>setVerRegistradas(true)}
                style={{padding:"6px 12px",border:"none",background:verRegistradas?"#0984e3":"transparent",color:verRegistradas?"#fff":"#5a7a9a",cursor:"pointer",fontSize:11,fontWeight:700,transition:"all .15s"}}>
                👁 Todas
              </button>
            </div>
          )}
          <button onClick={()=>setTSel(tSel.size===tFilt.length?new Set():new Set(tFilt.filter(ti=>!isExc(ti.id,actSel,fecha)).map(ti=>ti.id)))}
            style={{padding:"6px 14px",borderRadius:8,border:"1.5px solid "+actInfo?.c+"55",background:actInfo?.c+"15",color:actInfo?.c,cursor:"pointer",fontSize:12,fontWeight:700}}>
            {tSel.size===tFilt.filter(ti=>!isExc(ti.id,actSel,fecha)).length&&tFilt.length>0?"✕ Quitar todas":"✓ Seleccionar todas"}
          </button>
        </div>
      </div>
        );
      })()}
      {/* lista */}
      <div style={{padding:"8px 16px 120px"}}>
        {isAdmin&&<div style={{fontSize:10,color:"#8aaabb",marginBottom:8,padding:"6px 10px",background:"#f8fafc",borderRadius:8}}>💡 Admin: usa el botón <strong>N/A</strong> para excluir una tienda de esta actividad hoy</div>}
        {tFilt.length===0&&!verRegistradas&&(
          <div style={{textAlign:"center",padding:"40px 20px"}}>
            <div style={{fontSize:40,marginBottom:12}}>✅</div>
            <div style={{fontWeight:800,fontSize:16,color:"#1a2f4a",marginBottom:6}}>Todas las tiendas registradas</div>
            <div style={{fontSize:12,color:"#8aaabb",marginBottom:20}}>No quedan pendientes para esta actividad hoy</div>
            {isAdmin&&(
              <button onClick={()=>setVerRegistradas(true)}
                style={{padding:"12px 24px",borderRadius:12,border:"none",background:"#0984e3",color:"#fff",fontWeight:700,fontSize:13,cursor:"pointer",marginRight:10}}>
                👁 Ver todas las tiendas
              </button>
            )}
            <button onClick={()=>setPaso(1)}
              style={{padding:"12px 24px",borderRadius:12,border:"1.5px solid #e2e8f0",background:"#fff",color:"#5a7a9a",fontWeight:700,fontSize:13,cursor:"pointer"}}>
              ← Cambiar actividad
            </button>
          </div>
        )}
        {tFilt.map(tienda=>{
          const sel=tSel.has(tienda.id);
          const reg=tRegistradas.has(tienda.id);
          const exc=isExc(tienda.id,actSel,fecha);
          const fc=FMT[tienda.f];
          return(
            <div key={tienda.id}
              onClick={()=>{ if(exc)return; setTSel(p=>{const ns=new Set(p);ns.has(tienda.id)?ns.delete(tienda.id):ns.add(tienda.id);return ns;}); }}
              style={{display:"flex",alignItems:"center",gap:12,padding:"13px 14px",borderRadius:12,border:`1.5px solid ${exc?"#FAC775":sel?actInfo?.c:"#e2e8f0"}`,background:exc?"#fff8ec":sel?actInfo?.c+"10":"#fff",cursor:exc?"default":"pointer",marginBottom:7,transition:"all .1s"}}>
              <div style={{width:24,height:24,borderRadius:7,border:`2px solid ${exc?"#FAC775":sel?actInfo?.c:"#c8d8e8"}`,background:exc?"#FAEEDA":sel?actInfo?.c:"#fff",display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}>
                {sel&&!exc&&<span style={{fontSize:14,color:"#fff",fontWeight:700}}>✓</span>}
                {exc&&<span style={{fontSize:12}}>⚠️</span>}
              </div>
              <div style={{flex:1}}>
                <div style={{fontSize:14,fontWeight:700,color:exc?"#854F0B":sel?actInfo?.c:"#1a2f4a",textDecoration:exc?"line-through":"none"}}>Vega {tienda.n}</div>
                <div style={{display:"flex",gap:5,marginTop:3,flexWrap:"wrap"}}>
                  <span style={S.pill(fc.c,fc.bg)}>{tienda.f}</span>
                  {exc&&<span style={S.pill("#854F0B","#FAEEDA")}>N/A este día</span>}
                  {!exc&&reg&&<span style={S.pill("#00b894","#e8faf5")}>✅ Registrada</span>}
                </div>
              </div>
              {sel&&!exc&&<span style={{fontSize:18,color:actInfo?.c,fontWeight:700}}>✓</span>}
              {isAuditor&&(
                <button
                  onClick={e=>{
                    e.stopPropagation();
                    if(exc){
                      // Si ya está excluida: quitar directo (sin modal)
                      toggleExcepcion(tienda.id,actSel,"",false);
                    } else {
                      // Abrir modal para ingresar comentario antes de excluir
                      setExcModal({
                        tId:tienda.id,
                        aId:actSel,
                        tiendaNombre:tienda.n,
                        estaExcluida:false,
                        comentarioActual:getExcComment(tienda.id,actSel,fecha),
                      });
                    }
                  }}
                  style={{padding:"6px 10px",borderRadius:9,border:`1.5px solid ${exc?"#00b894":"#FAC775"}`,background:exc?"#f0fdf4":"#fff8ec",color:exc?"#16a34a":"#854F0B",cursor:"pointer",fontSize:11,fontWeight:800,flexShrink:0,minWidth:44,textAlign:"center"}}>
                  {exc?"✓ OK":"N/A"}
                </button>
              )}
            </div>
          );
        })}
      </div>
      {/* FAB */}
      {tSel.size>0&&(
        <div style={{position:"sticky",bottom:0,background:"#fff",borderTop:"1px solid #e2e8f0",padding:"12px 16px",display:"flex",gap:10,alignItems:"center"}}>
          <div style={{flex:1}}>
            <div style={{fontSize:14,fontWeight:800,color:"#1a2f4a"}}>{tSel.size} tienda{tSel.size!==1?"s":""} seleccionada{tSel.size!==1?"s":""}</div>
            <div style={{fontSize:11,color:"#8aaabb"}}>Toca para asignar puntaje</div>
          </div>
          <button onClick={()=>setPaso(3)}
            style={{...S.btn(actInfo?.c||"#00b5b4"),width:"auto",padding:"12px 22px",fontSize:14}}>
            Siguiente →
          </button>
        </div>
      )}
    </div>
  );
  };

  /* ══ PASO 3 — hora de envío → puntaje automático ══ */
  const renderPaso3 = ()=>{
    const AR = getRangoActivo(actSel, fecha); // Bug 1: fuente única de verdad
    const pv = horaEx ? calcP(horaEx, AR) : null;
    const tier = getTierPts(pv);
    const esAdHoc = actInfo?.cat==="Ad-hoc"||actInfo?.cat==="Promocional";
    const franjas=[
      {icon:"🥇",label:"ORO — 10 pts",   desde:"00:00",hasta:AR.c100,c:"#f6a623",bg:"#fff8ec"},
      {icon:"🥈",label:"PLATA — 8 pts",  desde:AR.c100,hasta:AR.c80, c:"#74b9ff",bg:"#e8f4fd"},
      {icon:"🥉",label:"BRONCE — 6 pts", desde:AR.c80, hasta:AR.c60, c:"#a29bfe",bg:"#f0edff"},
      {icon:"🔴",label:"FUERA — 0 pts",  desde:AR.c60, hasta:"23:59",c:"#d63031",bg:"#ffeae6"},
    ];
    const franjaActiva = pv===10?0:pv===8?1:pv===6?2:pv===0?3:-1;

    return(
      <div style={{padding:"16px"}}>
        {/* aviso rango extendido */}
        {rangoExt&&(
          <div style={{background:"#fff8ec",border:"1px solid #FAC775",borderRadius:10,padding:"10px 14px",marginBottom:14,display:"flex",alignItems:"center",gap:8}}>
            <span style={{fontSize:16}}>⏱️</span>
            <div style={{flex:1}}>
              <div style={{fontSize:12,fontWeight:700,color:"#854F0B"}}>Rango extendido activo</div>
              <div style={{fontSize:10,color:"#854F0B"}}>ORO ≤{rangoExt.c100} · PLATA ≤{rangoExt.c80} · BRONCE ≤{rangoExt.c60}</div>
            </div>
            <button onClick={()=>setRangoExt(null)} style={{fontSize:10,color:"#854F0B",background:"none",border:"none",cursor:"pointer",textDecoration:"underline"}}>Quitar</button>
          </div>
        )}
        <div style={{...S.card,padding:"14px 16px",marginBottom:16}}>
          <div style={{fontSize:11,color:"#8aaabb",fontWeight:700,letterSpacing:".06em",marginBottom:8}}>
            {tSel.size} TIENDA{tSel.size!==1?"S":""} SELECCIONADA{tSel.size!==1?"S":""}
          </div>
          <div style={{display:"flex",gap:5,flexWrap:"wrap"}}>
            {[...tSel].slice(0,10).map(id=>{
              const tObj=tiendas.find(x=>x.id===id);
              if(!tObj)return null;
              const fc=FMT[tObj.f];
              return <span key={id} style={S.pill(fc.c,fc.bg)}>Vega {tObj.n}</span>;
            })}
            {tSel.size>10&&<span style={S.pill("#8aaabb","#f0f4f8")}>+{tSel.size-10} más</span>}
          </div>
        </div>

        {/* INPUT DE HORA — centro de la pantalla */}
        <div style={{...S.card,padding:"22px 20px",marginBottom:16,textAlign:"center",border:`2px solid ${pv!==null?tier.c+"66":"#e2e8f0"}`}}>
          <label style={{...S.lbl,textAlign:"center",justifyContent:"center",marginBottom:12,fontSize:12}}>
            ¿A QUÉ HORA ENVIARON SUS EVIDENCIAS?
          </label>
          {/* Picker manual HH:MM — evita bug AM/PM en Chrome/Edge Windows */}
          {(()=>{
            const [hh,mm]=horaEx?horaEx.split(":").map(Number):[new Date().getHours(),new Date().getMinutes()];
            const h12=hh===0?12:hh>12?hh-12:hh;
            const ampm=hh<12?"AM":"PM";
            const setTime=(newHH,newMM)=>setHoraEx(`${String(newHH).padStart(2,"0")}:${String(newMM).padStart(2,"0")}`);
            const selSt={padding:"10px 6px",borderRadius:10,border:`2px solid ${pv!==null?tier.c:"#c8d8e8"}`,background:pv!==null?tier.bg:"#f8fafc",color:"#1a2f4a",fontSize:24,fontWeight:700,textAlign:"center",outline:"none",cursor:"pointer",WebkitAppearance:"none",appearance:"none"};
            return(
              <div style={{display:"flex",alignItems:"center",justifyContent:"center",gap:6}}>
                <select value={h12} onChange={e=>{const v=parseInt(e.target.value);const newHH=ampm==="AM"?(v===12?0:v):(v===12?12:v+12);setTime(newHH,mm);}} style={{...selSt,width:72}}>
                  {[12,1,2,3,4,5,6,7,8,9,10,11].map(h=><option key={h} value={h}>{String(h).padStart(2,"0")}</option>)}
                </select>
                <span style={{fontSize:28,fontWeight:800,color:"#1a2f4a"}}>:</span>
                <select value={mm} onChange={e=>{setTime(hh,parseInt(e.target.value));}} style={{...selSt,width:72}}>
                  {Array.from({length:60},(_,i)=>i).map(m=><option key={m} value={m}>{String(m).padStart(2,"0")}</option>)}
                </select>
                <select value={ampm} onChange={e=>{const v=e.target.value;const newHH=v==="AM"?(hh===12?0:hh>12?hh-12:hh):(hh===0?12:hh<12?hh+12:hh);setTime(newHH,mm);}} style={{...selSt,width:72,fontSize:16}}>
                  <option value="AM">AM</option>
                  <option value="PM">PM</option>
                </select>
              </div>
            );
          })()}
          {/* resultado del puntaje — aparece automáticamente */}
          {pv!==null?(
            <div style={{marginTop:14,padding:"14px",borderRadius:12,background:tier.bg,border:"1.5px solid "+tier.c+"44"}}>
              <div style={{fontSize:36,marginBottom:4}}>{tier.icon}</div>
              <div style={{fontWeight:800,fontSize:32,color:tier.c,lineHeight:1}}>{pv} pts</div>
              <div style={{fontSize:14,fontWeight:700,color:tier.c,marginTop:4}}>{tier.label}</div>
              <div style={{fontSize:11,color:tier.c,opacity:.7,marginTop:2}}>
                Puntaje calculado automáticamente
              </div>
            </div>
          ):(
            <div style={{marginTop:12,fontSize:12,color:"#b2bec3"}}>
              Selecciona la hora para ver el puntaje
            </div>
          )}
        </div>

        {/* franjas de referencia — visuales, no botones */}
        <div style={{marginBottom:16}}>
          <p style={{...S.lbl,marginBottom:8}}>ESCALA DE PUNTAJE{actInfo?.r?" · RANGOS PERSONALIZADOS":""}</p>
          <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(160px,1fr))",gap:6}}>
            {franjas.map((f,i)=>(
              <div key={i} style={{
                padding:"10px 12px",borderRadius:10,
                border:`2px solid ${franjaActiva===i?f.c:f.c+"33"}`,
                background:franjaActiva===i?f.bg:"#fff",
                transition:"all .2s"
              }}>
                <div style={{display:"flex",alignItems:"center",gap:6}}>
                  <span style={{fontSize:16}}>{f.icon}</span>
                  <div>
                    <div style={{fontSize:11,fontWeight:800,color:franjaActiva===i?f.c:"#5a7a9a"}}>{f.label}</div>
                    <div style={{fontSize:10,color:franjaActiva===i?f.c:"#b2bec3",marginTop:1}}>
                      {i<3?`hasta ${f.hasta}`:`después de ${f.desde}`}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* observación */}
        <div style={{marginBottom:16}}>
          <label style={S.lbl}>OBSERVACIÓN <span style={{color:"#b2bec3",fontWeight:400}}>(opcional)</span></label>
          <input
            placeholder="Ej: fotos parciales, material incompleto..."
            value={obsEx}
            onChange={e=>setObsEx(e.target.value)}
            style={S.inp}
          />
        </div>

        {/* botón registrar */}
        {pv!==null&&(
          <div style={{...S.card,padding:"14px",marginBottom:12,background:tier.bg,border:"1.5px solid "+tier.c+"44"}}>
            <div style={{fontSize:11,color:tier.c,fontWeight:700,marginBottom:8}}><IcoClipboard size={13} color={tier.c}/> RESUMEN DEL REGISTRO</div>
            <div style={{display:"flex",justifyContent:"space-between",marginBottom:4}}>
              <span style={{fontSize:12,color:"#5a7a9a"}}>Actividad</span>
              <span style={{fontSize:12,fontWeight:700,color:"#1a2f4a"}}>{actInfo?.e} {actInfo?.n}</span>
            </div>
            <div style={{display:"flex",justifyContent:"space-between",marginBottom:4}}>
              <span style={{fontSize:12,color:"#5a7a9a"}}>Fecha</span>
              <span style={{fontSize:12,fontWeight:700,color:"#1a2f4a"}}>{fecha}</span>
            </div>
            <div style={{display:"flex",justifyContent:"space-between",marginBottom:4}}>
              <span style={{fontSize:12,color:"#5a7a9a"}}>Hora de evidencia</span>
              <span style={{fontSize:12,fontWeight:700,color:tier.c}}>{horaEx} → {tier.icon} {tier.label} · {pv} pts</span>
            </div>
            <div style={{display:"flex",justifyContent:"space-between",marginBottom:4}}>
              <span style={{fontSize:12,color:"#5a7a9a"}}>Tiendas</span>
              <span style={{fontSize:12,fontWeight:700,color:"#1a2f4a"}}>{tSel.size} seleccionada{tSel.size!==1?"s":""}</span>
            </div>
            <div style={{height:1,background:tier.c+"33",margin:"10px 0"}}/>
            <div style={{fontSize:10,color:tier.c,opacity:.8}}>⚠️ Verifica los datos antes de confirmar. Esta acción guardará el registro.</div>
          </div>
        )}
        <button
          onClick={confirmarRegistro}
          onTouchEnd={e=>{e.preventDefault();if(pv!==null)confirmarRegistro();}}
          disabled={pv===null}
          style={{
            ...S.btn(pv!==null?tier.c:"#e2e8f0"),
            opacity:pv!==null?1:.5,
            cursor:pv!==null?"pointer":"not-allowed",
            marginBottom:10,padding:"18px",fontSize:16,fontWeight:800,
            background:pv!==null?`linear-gradient(135deg,${tier.c},#1a2f4a)`:"#e2e8f0",
            color:pv!==null?"#fff":"#b2bec3",
            letterSpacing:".02em"
          }}
        >
          {pv!==null?`✅ Confirmar registro`:`Ingresa la hora para continuar`}
        </button>
        <button onClick={()=>setPaso(2)}
          style={{width:"100%",padding:"12px",borderRadius:12,border:"1px solid #c8d8e8",background:"#fff",color:"#5a7a9a",fontSize:13,fontWeight:700,cursor:"pointer"}}>
          ← Cambiar selección de tiendas
        </button>
      </div>
    );
  };

  /* ══ TAB REGISTRO (contenedor de pasos) ══ */
  const renderRegistro = ()=>(
    <div>
      {/* sub-nav pasos */}
      <div style={{background:"#fff",borderBottom:"1px solid #e2e8f0",padding:"10px 16px"}}>
        {/* indicador de pasos */}
        <div style={{display:"flex",gap:0}}>
          {[{n:"1. Actividad",i:1},{n:"2. Tiendas",i:2},{n:"3. Puntaje",i:3}].map((s,idx)=>(
            <div key={s.i} style={{display:"flex",alignItems:"center",flex:1}}>
              <div onClick={()=>{if(s.i<paso||(s.i===2&&actSel))setPaso(s.i);}}
                style={{display:"flex",alignItems:"center",gap:6,cursor:"pointer"}}>
                <div style={{width:22,height:22,borderRadius:"50%",background:paso>=s.i?"#1a2f4a":"#e2e8f0",display:"flex",alignItems:"center",justifyContent:"center",fontSize:11,fontWeight:700,color:paso>=s.i?"#fff":"#8aaabb",flexShrink:0}}>
                  {paso>s.i?"✓":s.i}
                </div>
                <span style={{fontSize:11,fontWeight:700,color:paso===s.i?"#1a2f4a":paso>s.i?"#00b5b4":"#8aaabb",whiteSpace:"nowrap"}}>{s.n}</span>
              </div>
              {idx<2&&<div style={{flex:1,height:1,background:"#e2e8f0",margin:"0 6px"}}/>}
            </div>
          ))}
        </div>
      </div>
      {/* contenido del paso */}
      {(()=>{
        const usuarioActual=usuarios.find(u=>u.id===uDni||u.dni===uDni)||{id:uDni,nombre:uName,rol:role};
        const rutaDomingo=rutas.find(r=>r.auditorId===uDni&&r.semana===semanaActual&&r.activo!==false&&(r.perfilCalendario==="operativo_trade"||r.tipoRuta==="excepcional"));
        const cal=canAuditarEnFecha(usuarioActual,fecha,null,{isAdmin:role==="admin",asignacionExcepcional:!!rutaDomingo});
        if(!cal.ok){return(
          <div style={{padding:"32px 16px",textAlign:"center"}}>
            <svg width="44" height="44" viewBox="0 0 24 24" fill="none" stroke="#6C6EF5" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" style={{marginBottom:12}}><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/><path d="M8 15h8"/></svg>
            <div style={{fontWeight:800,fontSize:16,color:"#1a2f4a",marginBottom:6}}>Día no habilitado para operación regular</div>
            <div style={{fontSize:13,color:"#8aaabb",lineHeight:1.5}}>El perfil {CALENDARIO_PERFILES[cal.perfil]?.nombre||cal.perfil} requiere asignación excepcional o ruta Operativo Trade para auditar en esta fecha.</div>
          </div>
        );}
        return paso===1?renderPaso1():paso===2?renderPaso2():renderPaso3();
      })()}
    </div>
  );

  /* ══ TAB REPORTE SEMANAL ══ */
  const renderReporte = ()=>{
    const actsActivas=acts.filter(a=>a.activa&&actsConRegistroIds.has(a.id)); // solo cols con historial en el mes
    const semsVis=selWeek!==null?[semanasDelMes[selWeek]]:semanasDelMes;
    // colsKey: para cada semana×día, la lista EXACTA de actividades a mostrar como columna.
    // Actividades Always-On: aparecen en todos sus días.
    // Actividades Ad-hoc: solo aparecen en días donde alguna tienda tiene registro real.
    const getColsForDay=(sem,d)=>{
      const ds=dStr(vYear,vMonth,d);
      const wd=new Date(vYear,vMonth,d).getDay();
      return actsActivas.filter(a=>
        a.activa&&(
          // Día asignado: Always On aparece siempre en sus días
          ((a.dias||[]).includes(wd)&&a.cat==="Always On")||
          // Cualquier actividad (Always On o no) aparece si tiene registro real ese día
          tiAct.some(ti=>{const r=getReg(ds,ti.id,a.id);return r?.evidencias?.length>0&&!r?.anulado;})
        )
      );
    };
    return(
      <div style={{padding:"16px"}}>
        {/* nav mes */}
        <div style={{display:"flex",gap:8,alignItems:"center",marginBottom:14,flexWrap:"wrap"}}>
          <button onClick={()=>navMes(-1)} style={{padding:"10px 18px",borderRadius:9,border:"1px solid #c8d8e8",background:"#fff",cursor:"pointer",fontWeight:700,fontSize:13,minHeight:40}}>←</button>
          <span style={{fontWeight:800,fontSize:15,color:"#1a2f4a",flex:1,textAlign:"center"}}>{MESES[vMonth].toUpperCase()} {vYear}</span>
          <button onClick={()=>navMes(1)} style={{padding:"10px 18px",borderRadius:9,border:"1px solid #c8d8e8",background:"#fff",cursor:"pointer",fontWeight:700,fontSize:13,minHeight:40}}>→</button>
          <div style={{width:"100%",display:"flex",gap:6}}>
            <button onClick={()=>setSelWeek(null)} style={{flex:1,padding:"7px",borderRadius:8,border:`1.5px solid ${selWeek===null?"#00b5b4":"#e2e8f0"}`,background:selWeek===null?"#e0fafa":"#fff",color:selWeek===null?"#00b5b4":"#5a7a9a",cursor:"pointer",fontSize:11,fontWeight:700}}>Mes</button>
            {semanasDelMes.map((s,i)=>(
              <button key={i} onClick={()=>setSelWeek(i)} style={{flex:1,padding:"7px 4px",borderRadius:8,border:`1.5px solid ${selWeek===i?"#6c5ce7":"#e2e8f0"}`,background:selWeek===i?"#f0edff":"#fff",color:selWeek===i?"#6c5ce7":"#5a7a9a",cursor:"pointer",fontSize:11,fontWeight:700,lineHeight:1.3}}>
                {s.label}
                <div style={{fontSize:8,fontWeight:400,color:selWeek===i?"#6c5ce7":"#8aaabb",marginTop:2,whiteSpace:"nowrap"}}>Del {String(s.start).padStart(2,"0")} al {String(s.end).padStart(2,"0")}</div>
              </button>
            ))}
          </div>
        </div>
        {/* tablas por formato */}
        {["Mayorista","Supermayorista","Market"].map(fmt=>{
          const tsFmt=tiAct.filter(ti=>ti.f===fmt);
          if(!tsFmt.length)return null;
          const fc=FMT[fmt];
          return(
            <div key={fmt} style={{...S.card,marginBottom:16,overflow:"visible"}}>
              <div style={{padding:"10px 14px",borderBottom:"1px solid #f0f4f8",display:"flex",alignItems:"center",gap:8}}>
                <div style={{width:4,height:18,borderRadius:2,background:fc.c}}/>
                <span style={{fontWeight:800,fontSize:13,color:fc.c}}>{fmt.toUpperCase()}</span>
                <span style={{fontSize:11,color:"#8aaabb"}}>{tsFmt.length} tiendas</span>
              </div>
              <div style={{overflowX:"auto",overflowY:"auto",maxHeight:"60vh"}}>
                <table style={{width:"100%",borderCollapse:"collapse",fontSize:12}}>
                  <thead>
                    <tr style={{background:"#f8fafc",position:"sticky",top:0,zIndex:4}}>
                      <th style={{padding:"8px 12px",textAlign:"left",color:"#5a7a9a",fontWeight:700,fontSize:10,borderBottom:"1px solid #e9eef5",minWidth:140,whiteSpace:"nowrap",position:"sticky",left:0,background:"#f8fafc",zIndex:3,boxShadow:"2px 0 4px rgba(0,0,0,.06)"}}>TIENDA</th>

                      {semsVis.flatMap(s=>{
                        const arr=s.days.flatMap(d=>{
                          const wd=new Date(vYear,vMonth,d).getDay();
                          const cols=getColsForDay(s,d);
                          return cols.map(a=>(
                            <th key={s.label+d+a.id} style={{padding:"4px 6px",textAlign:"center",color:a.c,fontWeight:700,fontSize:9,borderBottom:"1px solid #e9eef5",minWidth:44,whiteSpace:"nowrap",background:"#f8fafc",position:"sticky",top:0,lineHeight:1.3}}>
                              <span style={{color:"#8aaabb",fontWeight:700,fontSize:8,display:"block"}}>{s.label}</span>
                              <span style={{color:"#1a2f4a",fontWeight:800,fontSize:9,display:"block"}}>{DIAS_C[wd]}</span>
                              <span style={{fontSize:13,display:"block"}}>{a.e}</span>
                            </th>
                          ));
                        });
                        arr.push(<th key={"ef"+s.label} style={{padding:"8px 6px",textAlign:"center",color:"#1a2f4a",fontWeight:800,fontSize:9,borderBottom:"1px solid #e9eef5",background:"#e8edf2",minWidth:60,position:"sticky",top:0,borderLeft:"2px solid #c8d8e8",borderRight:"2px solid #c8d8e8"}}>{s.label}{" EF.%"}</th>);
                        return arr;
                      })}
                      {selWeek===null&&<th style={{padding:"8px 8px",textAlign:"center",color:"#fff",fontWeight:800,fontSize:10,borderBottom:"1px solid #e9eef5",background:fc.c,minWidth:55,position:"sticky",top:0}}>MES</th>}
                      <th style={{padding:"8px 8px",textAlign:"center",fontWeight:800,fontSize:9,borderBottom:"1px solid #e9eef5",background:"#f8fafc",minWidth:55,position:"sticky",top:0}}>EF</th>
                      <th style={{padding:"8px 8px",textAlign:"center",fontWeight:800,fontSize:9,borderBottom:"1px solid #e9eef5",background:"#f8fafc",minWidth:50,position:"sticky",top:0}}>C1/C2</th>
                    </tr>
                  </thead>
                  <tbody>
                    {tsFmt.map(tr=>{
                      const pMes=calcMes(tr.id);
                      // Tier reflects the visible period: selected week or full month
                      const pTier=selWeek!==null?calcSemana(tr.id,semanasDelMes[selWeek]):pMes;
                      const tier=getTier(pTier);
                      return(
                        <tr key={tr.id} style={{borderBottom:"1px solid #f5f7fa"}}>
                          <td style={{padding:"8px 12px",fontWeight:700,color:"#1a2f4a",whiteSpace:"nowrap",fontSize:11,position:"sticky",left:0,background:"#fff",zIndex:2,boxShadow:"2px 0 4px rgba(0,0,0,.04)"}}>Vega {tr.n}</td>

                          {semsVis.flatMap(sem=>{
                            const semArr=sem.days.flatMap(d=>{
                            const wd=new Date(vYear,vMonth,d).getDay();
                            const ds=dStr(vYear,vMonth,d);
                            return getColsForDay(sem,d).map(a=>{
                              const excepcion=isExc(tr.id,a.id,ds);
                              const rv=getReg(ds,tr.id,a.id);
                              const pts=puntajeReg(rv,getRangoActivo(a.id,ds));
                              const auditor=rv?.evidencias?.[0]?.auditor||null;
                              const anulado=rv?.anulado||false;
                              const hoyC=todayStr();
                              const enPasado=ds<=hoyC;
                              const maxP=actsConRegistroIds.has(a.id)&&enPasado&&!excepcion?10:0;
                              const docId=rKey(ds,tr.id,a.id).replace(/\|/g,"--");
                              const docIds=(regs[docId]||regs[rKey(ds,tr.id,a.id)])?[{docId,docData:regs[docId]||regs[rKey(ds,tr.id,a.id)],fecha:ds,actividadId:a.id}]:[];
                              const menuId=`ctx-${tr.id}-${ds}-${a.id}`;
                              return(
                                <td key={sem.label+d+a.id} style={{padding:"4px 5px",textAlign:"center",position:"relative",background:excepcion?"#fafafa":"transparent",borderLeft:"1px solid #f5f7fa"}}>
                                  {anulado?(
                                    <span style={{padding:"2px 5px",borderRadius:20,fontSize:8,fontWeight:700,color:"#854F0B",background:"#FAEEDA",border:"0.5px solid #FAC775"}}>⚠️ Anu.</span>
                                  ):excepcion?(
                                    <span title={getExcComment(tr.id,a.id,ds)||"Excepción"} style={{padding:"2px 5px",borderRadius:20,fontSize:8,fontWeight:700,color:"#854F0B",background:"#FAEEDA",border:"0.5px solid #FAC775",cursor:"help"}}>
                                      N/A{getExcComment(tr.id,a.id,ds)?" 💬":""}
                                      {isAdmin&&<span title="Editar" onClick={e=>{e.stopPropagation();setExcModal({tId:tr.id,aId:a.id,tiendaNombre:tr.n,estaExcluida:true,comentarioActual:getExcComment(tr.id,a.id,ds)});}} style={{marginLeft:2,cursor:"pointer",fontSize:7}}>✏️</span>}
                                    </span>
                                  ):pts!==null?(
                                    <div style={{display:"flex",flexDirection:"column",alignItems:"center",gap:1,cursor:"pointer"}}
                                      onMouseDown={()=>{clearTimeout(longPressRef.current);longPressRef.current=setTimeout(()=>setCtxMenu({menuId,t:tr,sem,a,docIds}),700);}}
                                      onMouseUp={()=>clearTimeout(longPressRef.current)}
                                      onMouseLeave={()=>clearTimeout(longPressRef.current)}
                                      onTouchStart={()=>{clearTimeout(longPressRef.current);longPressRef.current=setTimeout(()=>setCtxMenu({menuId,t:tr,sem,a,docIds}),700);}}
                                      onTouchEnd={()=>clearTimeout(longPressRef.current)}>
                                      <span style={{padding:"2px 6px",borderRadius:20,fontSize:9,fontWeight:700,color:sc(pts/10*100),background:sb(pts/10*100)}}>{pts}/10pts</span>
                                      <div style={{fontSize:8,color:"#8aaabb"}}>{Math.round(pts/10*100)}%</div>
                                      {auditor&&<div style={{fontSize:7,color:"#0984e3",whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis",maxWidth:55,borderBottom:"1.5px solid #f6a623"}}>{auditor.split(" ")[0]}</div>}
                                    </div>
                                  ):<span style={{color:"#d1d5db",fontSize:9}}>—</span>}
                                </td>
                              );
                            });
                            });
                            const ps=calcSemana(tr.id,sem);const detSem=calcSemanaDetalle(tr.id,sem);
                            semArr.push(<td key={"ef"+sem.label} style={{padding:"6px 6px",textAlign:"center",background:"#e8edf2",borderLeft:"2px solid #c8d8e8",borderRight:"2px solid #c8d8e8"}}>{ps!==null?<div style={{display:"flex",flexDirection:"column",alignItems:"center",gap:1}}><span style={{padding:"2px 6px",borderRadius:20,fontSize:10,fontWeight:800,color:sc(ps),background:sb(ps)}}>{ps}%</span><span style={{fontSize:8,color:"#8aaabb"}}>{detSem?.obtenidos}/{detSem?.maximos}pts</span></div>:<span style={{color:"#d1d5db"}}>—</span>}</td>);
                            return semArr;
                          })}
                          {selWeek===null&&(()=>{
  const detMes=calcMesDetalle(tr.id);
  // Calcular máximo teórico (si no hubiera N/A) para mostrar contexto
  const allDaysMes=semanasDelMes.flatMap(s=>s.days.map(d=>dStr(vYear,vMonth,d)));
  const hoyM=todayStr();
  let mxTeorico=0;
  allDaysMes.forEach(d=>{
    if(d>hoyM) return;
    const dw=getDow(d);
    // Only Always On activities count toward theoretical max (Ad-hoc only when they have real records)
    actsActivas.filter(a=>(a.dias||[]).includes(dw)&&(a.cat==="Always On"||(actsConRegistroIds.has(a.id)&&tiAct.some(ti2=>{const r=getReg(d,ti2.id,a.id);return r?.evidencias?.length>0&&!r?.anulado;})))).forEach(()=>{ mxTeorico+=10; });
  });
  const pctBase=mxTeorico>0&&detMes?Math.round((detMes.maximos/mxTeorico)*100):null;
  return <td style={{padding:"6px 8px",textAlign:"center",background:sb(pMes)}}>{pMes!==null?<div style={{display:"flex",flexDirection:"column",alignItems:"center",gap:1}}><span style={{fontWeight:800,fontSize:12,color:sc(pMes)}}>{pMes}%</span><span style={{fontSize:8,color:"#8aaabb"}}>{detMes?.obtenidos}/{detMes?.maximos}pts</span>{pctBase!==null&&pctBase<100&&<span style={{fontSize:7,color:"#854F0B",background:"#FAEEDA",borderRadius:4,padding:"0 3px"}}>{"⚠️ N/A parcial"}</span>}</div>:<span style={{color:"#b2bec3"}}>—</span>}</td>;
})()}
                          <td style={{padding:"6px 8px",textAlign:"center"}}><span style={{fontSize:13}}>{tier.icon}</span><div style={{fontSize:8,fontWeight:700,color:tier.c}}>{tier.label}</div></td>
                          {/* Columna C1/C2 — distribución de cortes para esta tienda */}
                          {(()=>{
                            const hoyC=todayStr();
                            let nC1=0,nC2=0,nTotal=0;
                            semanasDelMes.forEach(s=>s.days.forEach(d=>{
                              const ds=dStr(vYear,vMonth,d);
                              if(ds>hoyC) return;
                              const dw=getDow(ds);
                              actsActivas.filter(a=>(a.dias||[]).includes(dw)&&!isExc(tr.id,a.id,ds)&&actsConRegistroIds.has(a.id)).forEach(a=>{
                                nTotal++;
                                const reg=getReg(ds,tr.id,a.id);
                                if(!reg?.evidencias||reg.anulado) return;
                                const rango=getRangoActivo(a.id,ds);
                                const m=toMin(primerEnvio(reg.evidencias));
                                if(m<=toMin(rango.c100||"08:30")) nC1++;
                                else nC2++;
                              });
                            }));
                            const pC1=nTotal>0?Math.round((nC1/nTotal)*100):null;
                            const pC2=nTotal>0?Math.round((nC2/nTotal)*100):null;
                            if(pC1===null) return <td style={{padding:"6px 8px",textAlign:"center",color:"#b2bec3",fontSize:9}}>—</td>;
                            return(
                              <td style={{padding:"6px 8px",textAlign:"center"}}>
                                <div style={{fontSize:9,fontWeight:700,color:"#BA7517"}}>{pC1}% C1</div>
                                {pC2!==null&&pC2>0&&<div style={{fontSize:9,color:"#185FA5"}}>{pC2}% C2</div>}
                              </td>
                            );
                          })()}
                        </tr>
                      );                    })}
                  </tbody>
                  {/* FILA TOTAL DEL FORMATO */}
                  <tfoot>
                    <tr style={{background:"#f0f4f8",borderTop:"2px solid #e2e8f0"}}>
                      <td style={{padding:"8px 12px",fontWeight:800,fontSize:10,color:"#1a2f4a",position:"sticky",left:0,background:"#f0f4f8",zIndex:2,boxShadow:"2px 0 4px rgba(0,0,0,.06)"}}>TOTAL {fmt.toUpperCase()}</td>
                      {semsVis.flatMap(sem=>{
                        const tfArr=sem.days.flatMap(d=>{
                          const wd=new Date(vYear,vMonth,d).getDay();
                          const ds=dStr(vYear,vMonth,d);
                          const hoyT=todayStr();
                          return getColsForDay(sem,d).map(a=>{
                            let ob=0,mx=0;
                            tsFmt.forEach(tr=>{
                              if(ds>hoyT||isExc(tr.id,a.id,ds)) return;
                              mx+=10;
                              const p=puntajeReg(getReg(ds,tr.id,a.id),getRangoActivo(a.id,ds));
                              if(p!==null) ob+=p;
                            });
                            const ef=mx>0?Math.round((ob/mx)*100):null;
                            return <td key={sem.label+d+a.id} style={{padding:"5px 6px",textAlign:"center",borderLeft:"1px solid #e9eef5"}}>{mx>0?(ob>0?<span style={{fontSize:9,fontWeight:800,color:sc(ef)}}>{ob}/{mx} <span style={{fontSize:8,fontWeight:400,color:"#8aaabb"}}>{ef}%</span></span>:<span style={{fontSize:8,color:"#b2bec3"}}>{mx}{" / pend."}</span>):<span style={{color:"#d1d5db",fontSize:9}}>—</span>}</td>;
                          });
                        });
                        let _ob=0,_mx=0;tsFmt.forEach(tr=>{const ef=calcSemanaDetalle(tr.id,sem);if(ef){_ob+=ef.obtenidos;_mx+=ef.maximos;}});const _ef=_mx>0?Math.round((_ob/_mx)*100):null;
                        tfArr.push(<td key={"tot"+sem.label} style={{padding:"6px 6px",textAlign:"center",background:"#e8edf2",borderLeft:"2px solid #e2e8f0"}}>{_ef!==null?<span style={{fontSize:10,fontWeight:800,color:sc(_ef)}}>{_ef}% <span style={{fontSize:8,fontWeight:400}}>{_ob}/{_mx}pts</span></span>:<span style={{color:"#d1d5db"}}>—</span>}</td>);
                        return tfArr;
                      })}
                      {selWeek===null&&(()=>{
                        let ob=0,mx=0;
                        tsFmt.forEach(tr=>{ const ef=calcMesDetalle(tr.id); if(ef){ob+=ef.obtenidos;mx+=ef.maximos;} });
                        const ef=mx>0?Math.round((ob/mx)*100):null;
                        return <td style={{padding:"6px 8px",textAlign:"center",background:ef?sb(ef):"#f0f4f8"}}>{ef!==null?<span style={{fontWeight:800,fontSize:11,color:sc(ef)}}>{ef}{"% "}{ob}{"/"}{mx}</span>:<span style={{color:"#b2bec3"}}>—</span>}</td>;
                      })()}
                      {(()=>{
                        // Medalla resumen del formato en el período visible
                        const allDays=semsVis.flatMap(s=>s.days.map(d=>dStr(vYear,vMonth,d)));
                        let ob=0,mx=0;
                        tsFmt.forEach(tr=>{ const ef=calcEficiencia(tr.id,allDays); if(ef){ob+=ef.obtenidos;mx+=ef.maximos;} });
                        const ef=mx>0?Math.round((ob/mx)*100):null;
                        const tierFmt=getTier(ef);
                        return <td style={{padding:"6px 8px",textAlign:"center",background:tierFmt.bg}}>{ef!==null?<><span style={{fontSize:14}}>{tierFmt.icon}</span><div style={{fontSize:8,fontWeight:800,color:tierFmt.c}}>{tierFmt.label}</div></>:<span style={{color:"#d1d5db",fontSize:9}}>—</span>}</td>;
                      })()}
                    </tr>
                  </tfoot>
                </table>
              </div>
            </div>
          );
        })}
      {/* FILA GRAN TOTAL — suma todos los formatos */}
      {(()=>{
        const allDays=semsVis.flatMap(s=>s.days.map(d=>dStr(vYear,vMonth,d)));
        // Total global mes
        let totOb=0,totMx=0;
        tiAct.forEach(tr=>{ const ef=calcEficiencia(tr.id,allDays); if(ef){totOb+=ef.obtenidos;totMx+=ef.maximos;} });
        const totEf=totMx>0?Math.round((totOb/totMx)*100):null;
        const totTier=getTier(totEf);
        // Totales por semana
        const totSems=semsVis.map(sem=>{
          let ob=0,mx=0;
          tiAct.forEach(tr=>{ const ef=calcSemanaDetalle(tr.id,sem); if(ef){ob+=ef.obtenidos;mx+=ef.maximos;} });
          return {ob,mx,ef:mx>0?Math.round((ob/mx)*100):null};
        });
        return(
        <div style={{...S.card,marginBottom:16,overflow:"hidden",border:"2px solid #1a2f4a"}}>
          <div style={{overflowX:"auto"}}>
            <table style={{width:"100%",borderCollapse:"collapse",fontSize:12}}>
              <thead>
                <tr style={{background:"#0d1f35"}}>
                  <th style={{padding:"8px 14px",textAlign:"left",color:"rgba(255,255,255,.4)",fontWeight:700,fontSize:9,minWidth:140,position:"sticky",left:0,background:"#0d1f35",zIndex:3}}>TIENDA</th>
                  {semsVis.flatMap((s,si)=>{
                    const tgArr=s.days.flatMap(d=>{
                      const wd=new Date(vYear,vMonth,d).getDay();
                      const cols=getColsForDay(s,d);
                      if(cols.length===0) return [];
                      return cols.map(a=>(
                        <th key={s.label+d+a.id} style={{padding:"4px 6px",textAlign:"center",color:a.c,fontWeight:700,fontSize:9,minWidth:44,whiteSpace:"nowrap",lineHeight:1.3}}>
                          <span style={{color:"rgba(255,255,255,.3)",fontSize:8,display:"block"}}>{s.label}</span>
                          <span style={{color:"rgba(255,255,255,.6)",fontSize:9,display:"block"}}>{DIAS_C[wd]}</span>
                          <span style={{fontSize:12,display:"block"}}>{a.e}</span>
                        </th>
                      ));
                    });
                    tgArr.push(<th key={"gef"+si} style={{padding:"6px",textAlign:"center",color:"rgba(255,255,255,.5)",fontWeight:800,fontSize:9,minWidth:52,borderLeft:"2px solid rgba(255,255,255,.08)",borderRight:"2px solid rgba(255,255,255,.08)"}}>{s.label}{" EF.%"}</th>);
                    return tgArr;
                  })}
                  {selWeek===null&&<th style={{padding:"6px",textAlign:"center",color:"rgba(255,255,255,.5)",fontWeight:800,fontSize:9,minWidth:55}}>MES</th>}
                  <th style={{padding:"6px",textAlign:"center",color:"rgba(255,255,255,.5)",fontWeight:800,fontSize:9,minWidth:55}}>EF</th>
                </tr>
              </thead>
              <tbody>
                <tr style={{background:"#1a2f4a"}}>
                  <td style={{padding:"10px 14px",fontWeight:800,fontSize:11,color:"#fff",position:"sticky",left:0,background:"#1a2f4a",zIndex:2,whiteSpace:"nowrap",minWidth:140}}>
                    🏁 TOTAL GENERAL
                    <div style={{fontSize:9,color:"#8aaabb",fontWeight:400,marginTop:1}}>{tiAct.length} tiendas · {MESES[vMonth]} {vYear}</div>
                  </td>
                  {/* Interleave: misma estructura día×actividad que las tablas de formato */}
                  {semsVis.flatMap((s,si)=>{
                    const tgBArr=s.days.flatMap(d=>{
                      const hoyT=todayStr();
                      const ds=dStr(vYear,vMonth,d);
                      const cols=getColsForDay(s,d);
                      if(cols.length===0) return [];
                      return cols.map(a=>{
                        let ob=0,mx=0;
                        tiAct.forEach(tr=>{
                          if(ds>hoyT||isExc(tr.id,a.id,ds)) return;
                          mx+=10;
                          const p=puntajeReg(getReg(ds,tr.id,a.id),getRangoActivo(a.id,ds));
                          if(p!==null) ob+=p;
                        });
                        const ef=mx>0?Math.round((ob/mx)*100):null;
                        return (
                          <td key={s.label+d+a.id} style={{padding:"6px 6px",textAlign:"center",borderLeft:"1px solid rgba(255,255,255,.06)"}}>
                            {mx>0
                              ?<div style={{display:"flex",flexDirection:"column",alignItems:"center",gap:1}}><span style={{fontSize:9,fontWeight:700,color:ob>0?sc(ef):"#b2bec3"}}>{ob>0?`${ob}/${mx}`:`${mx}pts`}</span><span style={{fontSize:8,fontWeight:400,color:ob>0?sc(ef):"#b2bec3"}}>{ob>0?ef+"%":"pend."}</span></div>
                              :<span style={{color:"#5a7a9a",fontSize:9}}>—</span>}
                          </td>
                        );
                      });
                    });
                    tgBArr.push(<td key={"gs"+si} style={{padding:"6px 8px",textAlign:"center",background:"#0d1f35",borderLeft:"2px solid rgba(255,255,255,.1)"}}>{totSems[si]?.ef!==null?<div style={{display:"flex",flexDirection:"column",alignItems:"center",gap:1}}><span style={{fontSize:11,fontWeight:800,color:sc(totSems[si].ef)}}>{totSems[si].ef}%</span><span style={{fontSize:8,color:"#8aaabb"}}>{totSems[si].ob}/{totSems[si].mx}pts</span></div>:<span style={{color:"#5a7a9a"}}>—</span>}</td>);
                    return tgBArr;
                  })}
                  {/* total mes */}
                  {selWeek===null&&(
                    <td style={{padding:"8px 10px",textAlign:"center",background:totEf?sb(totEf):"#0d1f35"}}>
                      {totEf!==null
                        ?<div style={{display:"flex",flexDirection:"column",alignItems:"center",gap:1}}><span style={{fontWeight:800,fontSize:13,color:sc(totEf)}}>{totEf}%</span><span style={{fontSize:9,color:"#5a7a9a"}}>{totOb}/{totMx}pts</span></div>
                        :<span style={{color:"#b2bec3"}}>—</span>}
                    </td>
                  )}
                  {/* tier global */}
                  <td style={{padding:"6px 10px",textAlign:"center",background:totTier.bg}}>
                    {totEf!==null?<div style={{display:"flex",flexDirection:"column",alignItems:"center",gap:1}}><span style={{fontSize:16}}>{totTier.icon}</span><div style={{fontSize:9,fontWeight:800,color:totTier.c}}>{totTier.label}</div></div>:<span style={{color:"#d1d5db"}}>—</span>}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
        );
      })()}
      </div>
    );
  };

  /* ══ TAB DASHBOARD ══ */
  const renderDashboard = ()=>{
    // filtrar tiendas según dashFmt
    const tsBase = dashFmt==="Todas" ? tiAct : tiAct.filter(ti=>ti.f===dashFmt);
    // filtrar por actividad
    const actsBase = dashAct==="Todas" ? acts.filter(a=>a.activa) : acts.filter(a=>a.activa&&a.id===dashAct);
    // tiendas evaluables: excluir las que tienen N/A en TODAS las actividades del filtro
    const tsEval = tsBase.filter(ti=>actsBase.some(a=>semanasDelMes.some(s=>s.days.some(d=>!isExc(ti.id,a.id,dStr(vYear,vMonth,d))))));
    // calcular score con filtros aplicados
    // calcEficienciaFiltrada: acumula pts obtenidos / pts maximos del período completo
    // respeta filtros de actividad, formato y franja horaria
    const _hoyDash = todayStr(); // B8 fix: calcular una sola vez fuera del loop
    const calcEficienciaFiltrada = (tId)=>{
      let obtenidos=0, maximos=0;
      semanasDelMes.forEach(s=>{
        s.days.forEach(day=>{
          const ds=dStr(vYear,vMonth,day);
          if(ds>_hoyDash) return; // día futuro
          const dw=getDow(ds);
          actsBase.filter(a=>(a.dias||[]).includes(dw)&&!isExc(tId,a.id,ds)&&actsConRegistroIds.has(a.id)&&(a.cat==="Always On"||tiAct.some(ti2=>{const r2=getReg(ds,ti2.id,a.id);return r2?.evidencias?.length>0&&!r2?.anulado;}))).forEach(a=>{
            maximos+=10;
            const reg=getReg(ds,tId,a.id);
            const p=puntajeReg(reg,getRangoActivo(a.id,ds));
            if(p!==null){
              if(dashHora==="Todas"){obtenidos+=p;}
              else{
                const h=primerEnvio(reg?.evidencias); const m=toMin(h);
                if(dashHora==="oro"&&m<=toMin("08:00")) obtenidos+=p;
                else if(dashHora==="plata"&&m>toMin("08:00")&&m<=toMin("09:00")) obtenidos+=p;
                else if(dashHora==="bronce"&&m>toMin("09:00")&&m<=toMin("10:00")) obtenidos+=p;
                else if(dashHora==="fuera"&&m>toMin("10:00")) obtenidos+=p;
              }
            }
          });
        });
      });
      if(maximos===0) return null;
      return {pct:Math.round((obtenidos/maximos)*100), obtenidos, maximos};
    };

    // tendencia semanal: mismo cálculo pero por semana
    const calcEficienciaSem = (tId,sem)=>{
      let ob=0, mx=0;
      sem.days.forEach(day=>{
        const ds=dStr(vYear,vMonth,day);
        if(ds>_hoyDash) return; // B3 fix: no contar días futuros en denominador
        const dw=getDow(ds);
        actsBase.filter(a=>(a.dias||[]).includes(dw)&&!isExc(tId,a.id,ds)&&actsConRegistroIds.has(a.id)&&(a.cat==="Always On"||tiAct.some(ti2=>{const r2=getReg(ds,ti2.id,a.id);return r2?.evidencias?.length>0&&!r2?.anulado;}))).forEach(a=>{
          mx+=10;
          const reg=getReg(ds,tId,a.id);
          const p=puntajeReg(reg,getRangoActivo(a.id,ds));
          if(p!==null) ob+=p;
        });
      });
      if(mx===0) return null;
      return {pct:Math.round((ob/mx)*100),obtenidos:ob,maximos:mx};
    };

    const scoresMes=tsEval.map(ti=>{ const ef=calcEficienciaFiltrada(ti.id); return {t:ti,score:ef?.pct??null,obtenidos:ef?.obtenidos??0,maximos:ef?.maximos??0}; });
    const validos=scoresMes.filter(s=>s.score!==null);

    // SG: total obtenidos / total maximos — cached from scoresMes, no double-compute
    const totalOb=scoresMes.reduce((a,s)=>a+s.obtenidos,0);
    const totalMx=scoresMes.reduce((a,s)=>a+s.maximos,0);
    const SG=totalMx>0?Math.round((totalOb/totalMx)*100):0;

    const IC=tsEval.length>0?Math.round((validos.length/tsEval.length)*100):0;
    const SE=tsEval.length>0?Math.round((scoresMes.filter(s=>s.score!==null&&s.score>=95).length/tsEval.length)*100):0; // >=95% eficiencia
    const TR=tsEval.length>0?Math.round((scoresMes.filter(s=>s.score!==null&&s.score<60).length/tsEval.length)*100):0;
    // tendencia: pts obtenidos / pts máximos por semana — mismo filtro que scoresMes
    const tendencia=semanasDelMes.map(s=>{
      let ob=0,mx=0;
      tsEval.forEach(ti=>{
        const ef=calcEficienciaSem(ti.id,s);
        if(ef){ ob+=ef.obtenidos; mx+=ef.maximos; }
      });
      return mx>0?Math.round((ob/mx)*100):null;
    });

    // B4 fix: distribución horaria usando rangos reales por actividad (no hardcoded)
    let _nOro=0,_nPlata=0,_nBronce=0,_nFuera=0;
    tsBase.forEach(ti=>{
      semanasDelMes.forEach(s=>s.days.forEach(day=>{
        const ds=dStr(vYear,vMonth,day);
        if(ds>_hoyDash) return;
        const dw=getDow(ds);
        actsBase.filter(a=>a.activa&&(a.dias||[]).includes(dw)&&actsConRegistroIds.has(a.id)&&!isExc(ti.id,a.id,ds)).forEach(a=>{
          const reg=getReg(ds,ti.id,a.id);
          if(!reg?.evidencias||reg.anulado) return;
          const AR=getRangoActivo(a.id,ds);
          const h=primerEnvio(reg.evidencias);
          const m=toMin(h);
          if(m<=toMin(AR.c100)) _nOro++;
          else if(m<=toMin(AR.c80)) _nPlata++;
          else if(m<=toMin(AR.c60)) _nBronce++;
          else _nFuera++;
        });
      }));
    });
    const horasDist=[
      {l:"🥇 ORO",   c:"#f6a623", n:_nOro,    desc:"En tiempo óptimo (c100)"},
      {l:"🥈 PLATA", c:"#74b9ff", n:_nPlata,  desc:"Dentro del rango c80"},
      {l:"🥉 BRONCE",c:"#a29bfe", n:_nBronce, desc:"Dentro del rango c60"},
      {l:"🔴 FUERA", c:"#d63031", n:_nFuera,  desc:"Fuera de todos los rangos"},
    ];
    const totalEvs=(_nOro+_nPlata+_nBronce+_nFuera)||1;

    // ranking
    const sorted=[...scoresMes].sort((a,b)=>(b.score??-1)-(a.score??-1));
    const top5=sorted.filter(s=>s.score!==null).slice(0,5);
    const bot5=[...sorted].reverse().filter(s=>s.score!==null).slice(0,5);

    // efectividad por actividad — pts obtenidos / pts máximos (correcto, no promedio de promedios)
    const actEfect=acts.filter(a=>a.activa&&actsConRegistroIds.has(a.id)).map(a=>{
      let ob=0,mx=0;
      const hoy=todayStr();
      tsBase.forEach(ti=>{
        semanasDelMes.forEach(s=>{
          s.days.forEach(day=>{
            const ds=dStr(vYear,vMonth,day);
            if(ds>hoy) return;
            if(!(a.dias||[]).includes(getDow(ds))) return;
            if(isExc(ti.id,a.id,ds)) return;
            mx+=10;
            const p=puntajeReg(getReg(ds,ti.id,a.id),getRangoActivo(a.id,ds));
            if(p!==null) ob+=p;
          });
        });
      });
      const v=mx>0?Math.round((ob/mx)*100):null;
      return{a,v,ob,mx};
    });

    const exportPDF=()=>{
      // Bug 9 fix: guard para popup bloqueado por el navegador
      const w=window.open("","_blank");
      if(!w){
        showToast("❌ El navegador bloqueó el popup. Permite popups para esta página y reintenta.");
        return;
      }
      try {
      w.document.write(`<html><head><title>VEGA Evidencias - ${MESES[vMonth]} ${vYear}</title>
      <style>@import url('https://fonts.googleapis.com/css2?family=Michroma&display=swap');
      body{font-family:Arial,sans-serif;padding:24px;color:#1a2f4a;font-size:12px;}
      h1{font-family:'Michroma',Arial,sans-serif;font-weight:400;font-size:16px;line-height:1.6;border-bottom:2px solid #1a2f4a;padding-bottom:8px;margin-bottom:16px;}
      .grid{display:grid;grid-template-columns:1fr 1fr 1fr 1fr;gap:12px;margin-bottom:20px;}
      .kpi{background:#f8fafc;border-radius:8px;padding:12px;text-align:center;border:1px solid #e2e8f0;}
      .kpi-v{font-size:24px;font-weight:700;}
      .kpi-l{font-size:9px;color:#5a7a9a;margin-top:4px;}
      .section{margin-bottom:20px;}
      .section-title{font-size:10px;font-weight:700;color:#5a7a9a;letter-spacing:.06em;border-bottom:1px solid #e2e8f0;padding-bottom:4px;margin-bottom:10px;}
      table{width:100%;border-collapse:collapse;font-size:11px;}
      th{background:#f0f4f8;padding:6px 8px;text-align:left;font-size:9px;color:#5a7a9a;}
      td{padding:6px 8px;border-bottom:1px solid #f5f7fa;}
      .bar{height:8px;border-radius:4px;display:inline-block;}
      .footer{margin-top:24px;border-top:1px solid #e2e8f0;padding-top:8px;font-size:9px;color:#8aaabb;display:flex;justify-content:space-between;}
      .brand-pdf{font-family:'Michroma',Arial,sans-serif;font-weight:400;letter-spacing:.02em;}
      </style></head><body>
      <h1>EstrategiaTrade — ${MESES[vMonth].toUpperCase()} ${vYear}</h1>
      <div style="font-size:10px;color:#5a7a9a;margin-bottom:16px;">Generado: ${new Date().toLocaleDateString("es-PE")} · Por: ${uName} · Filtro: ${dashFmt==="Todas"?"Todas las tiendas":dashFmt}</div>
      <div class="grid">
        <div class="kpi"><div class="kpi-v" style="color:${sc(SG)}">${SG}%</div><div class="kpi-l">Score Global</div></div>
        <div class="kpi"><div class="kpi-v" style="color:#0984e3">${IC}%</div><div class="kpi-l">Cumplimiento</div></div>
        <div class="kpi"><div class="kpi-v" style="color:#f6a623">${SE}%</div><div class="kpi-l">Excelencia</div></div>
        <div class="kpi"><div class="kpi-v" style="color:${TR>20?"#d63031":"#b2bec3"}">${TR}%</div><div class="kpi-l">Tasa Riesgo</div></div>
      </div>
      <div class="section"><div class="section-title">EFECTIVIDAD POR ACTIVIDAD</div>
        <table><thead><tr><th>Actividad</th><th>Score</th><th>Barra</th></tr></thead><tbody>
        ${actEfect.filter(x=>x.v!==null).map(x=>`<tr><td>${x.a.e} ${x.a.n}</td><td style="color:${sc(x.v)};font-weight:700">${x.v}%</td><td><div class="bar" style="width:${x.v}px;background:${x.a.c}"></div></td></tr>`).join("")}
        </tbody></table></div>
      <div class="section"><div class="section-title">TOP 5 TIENDAS</div>
        <table><thead><tr><th>#</th><th>Tienda</th><th>Formato</th><th>Score Mes</th></tr></thead><tbody>
        ${top5.map((s,i)=>`<tr><td>${i+1}</td><td>Vega ${s.t.n}</td><td>${s.t.f}</td><td style="color:${sc(s.score)};font-weight:700">${s.score}%</td></tr>`).join("")}
        </tbody></table></div>
      <div class="section"><div class="section-title">BOTTOM 5 TIENDAS</div>
        <table><thead><tr><th>#</th><th>Tienda</th><th>Formato</th><th>Score Mes</th></tr></thead><tbody>
        ${bot5.map((s,i)=>`<tr><td>${i+1}</td><td>Vega ${s.t.n}</td><td>${s.t.f}</td><td style="color:${sc(s.score)};font-weight:700">${s.score}%</td></tr>`).join("")}
        </tbody></table></div>
      <div class="section"><div class="section-title">DISTRIBUCIÓN HORARIA</div>
        <table><thead><tr><th>Franja</th><th>Registros</th><th>%</th></tr></thead><tbody>
        ${horasDist.map(h=>`<tr><td>${h.l}</td><td>${h.n}</td><td style="color:${h.c};font-weight:700">${Math.round(h.n/totalEvs*100)}%</td></tr>`).join("")}
        </tbody></table></div>
      <div class="footer"><span class="brand-pdf">EstrategiaTrade · Control de Implementación</span><span>Confidencial · ${new Date().toLocaleDateString("es-PE")}</span></div>
      </body></html>`);
      w.document.close();
      w.print();
      } catch(e) {
        console.error("exportPDF error:", e);
        showToast("❌ Error al generar el PDF. Intenta nuevamente.");
        try { w.close(); } catch(_) {}
      }
    };

    // Exponer exportPDF al header via ref — evita "exportPDF is not defined" en scope externo
    exportPDFRef.current = exportPDF;

    return(
      <div style={{padding:"16px"}}>
        {/* nav mes */}
        <div style={{display:"flex",gap:8,alignItems:"center",marginBottom:8}}>
          <button onClick={()=>navMes(-1)} style={{padding:"8px 14px",borderRadius:9,border:"1px solid #c8d8e8",background:"#fff",cursor:"pointer",fontWeight:700,fontSize:13}}>←</button>
          <span style={{fontWeight:800,fontSize:15,color:"#1a2f4a",flex:1,textAlign:"center"}}>{MESES[vMonth].toUpperCase()} {vYear}</span>
          <button onClick={()=>navMes(1)} style={{padding:"8px 14px",borderRadius:9,border:"1px solid #c8d8e8",background:"#fff",cursor:"pointer",fontWeight:700,fontSize:13}}>→</button>
        </div>
        {/* selector semana — igual que en Reporte y visor */}
        <div style={{display:"flex",gap:6,marginBottom:14}}>
          <button onClick={()=>setSelWeek(null)} style={{flex:1,padding:"7px",borderRadius:8,border:`1.5px solid ${selWeek===null?"#00b5b4":"#e2e8f0"}`,background:selWeek===null?"#e0fafa":"#fff",color:selWeek===null?"#00b5b4":"#5a7a9a",cursor:"pointer",fontSize:11,fontWeight:700}}>Mes</button>
          {semanasDelMes.map((s,i)=>(
            <button key={i} onClick={()=>setSelWeek(i)} style={{flex:1,padding:"7px 4px",borderRadius:8,border:`1.5px solid ${selWeek===i?"#6c5ce7":"#e2e8f0"}`,background:selWeek===i?"#f0edff":"#fff",color:selWeek===i?"#6c5ce7":"#5a7a9a",cursor:"pointer",fontSize:11,fontWeight:700,lineHeight:1.3}}>
              {s.label}
              <div style={{fontSize:8,fontWeight:400,color:selWeek===i?"#6c5ce7":"#8aaabb",marginTop:2,whiteSpace:"nowrap"}}>Del {String(s.start).padStart(2,"0")} al {String(s.end).padStart(2,"0")}</div>
            </button>
          ))}
        </div>

        {/* filtros */}
        <div style={{...S.card,padding:"12px 14px",marginBottom:14}}>
          <div style={{fontSize:10,fontWeight:700,color:"#5a7a9a",marginBottom:8,letterSpacing:".05em"}}>FILTROS</div>
          <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(130px,1fr))",gap:8}}>
            <div>
              <div style={{fontSize:9,color:"#8aaabb",fontWeight:700,marginBottom:3}}>TIPO DE TIENDA</div>
              <select value={dashFmt} onChange={e=>setDashFmt(e.target.value)} style={{width:"100%",padding:"7px 10px",borderRadius:8,border:"1px solid #c8d8e8",background:"#f8fafc",color:"#1a2f4a",fontSize:12,outline:"none"}}>
                <option value="Todas">Todas</option>
                {["Mayorista","Supermayorista","Market"].map(f=><option key={f} value={f}>{f}</option>)}
              </select>
            </div>
            <div>
              <div style={{fontSize:9,color:"#8aaabb",fontWeight:700,marginBottom:3}}>ACTIVIDAD</div>
              <select value={dashAct} onChange={e=>setDashAct(e.target.value)} style={{width:"100%",padding:"7px 10px",borderRadius:8,border:"1px solid #c8d8e8",background:"#f8fafc",color:"#1a2f4a",fontSize:12,outline:"none"}}>
                <option value="Todas">Todas</option>
                {acts.filter(a=>a.activa).map(a=><option key={a.id} value={a.id}>{a.e} {a.n}</option>)}
              </select>
            </div>
            <div>
              <div style={{fontSize:9,color:"#8aaabb",fontWeight:700,marginBottom:3}}>FRANJA HORARIA</div>
              <select value={dashHora} onChange={e=>setDashHora(e.target.value)} style={{width:"100%",padding:"7px 10px",borderRadius:8,border:"1px solid #c8d8e8",background:"#f8fafc",color:"#1a2f4a",fontSize:12,outline:"none"}}>
                <option value="Todas">Todas</option>
                <option value="oro">🥇 ORO ≤08:00</option>
                <option value="plata">🥈 PLATA ≤09:00</option>
                <option value="bronce">🥉 BRONCE ≤10:00</option>
                <option value="fuera">🔴 FUERA &gt;10:00</option>
              </select>
            </div>

          </div>
        </div>

        {/* ── SENTENCIA EJECUTIVA — respeta selWeek (S1/S2/S3/S4/Mes completo) ── */}
        {(()=>{
          const esMesActualDash = vYear===new Date().getFullYear()&&vMonth===new Date().getMonth();

          // Período de referencia: semana seleccionada o semana actual/última con datos
          let iSemRef, periodoLabel, vSemRef, vSemAntRef, deltaRef;

          if(selWeek!==null){
            // Semana seleccionada explícitamente por el usuario
            iSemRef = selWeek;
            periodoLabel = semanasDelMes[selWeek]?.label || `S${selWeek+1}`;
            vSemRef = tendencia[selWeek];
            vSemAntRef = selWeek>0 ? tendencia[selWeek-1] : null;
          } else {
            // Mes completo: usar semana actual si es mes activo, o última con datos si es histórico
            const semActual = esMesActualDash
              ? semanasDelMes.findIndex(s=>s.days.some(d=>dStr(vYear,vMonth,d)===_hoyDash))
              : tendencia.reduce((last,v,i)=>v!==null?i:last,-1);
            iSemRef = semActual>=0 ? semActual : semanasDelMes.length-1;
            periodoLabel = selWeek===null ? `${MESES[vMonth]} ${vYear}` : semanasDelMes[iSemRef]?.label;
            vSemRef = tendencia[iSemRef];
            vSemAntRef = iSemRef>0 ? tendencia[iSemRef-1] : null;
          }
          deltaRef = vSemRef!==null&&vSemAntRef!==null ? vSemRef-vSemAntRef : null;

          // Eficiencia global del período visible
          const efPeriodo = selWeek!==null
            ? tendencia[selWeek]
            : (totalMx>0 ? Math.round((totalOb/totalMx)*100) : null);

          // Actividad con mayor y menor eficiencia
          const actEfectDash = acts.filter(a=>a.activa&&actsConRegistroIds.has(a.id)).map(a=>{
            let ob=0,mx=0;
            const semsVis = selWeek!==null ? [semanasDelMes[selWeek]] : semanasDelMes;
            tsEval.forEach(ti=>{
              semsVis.forEach(s=>s.days.forEach(d=>{
                const ds=dStr(vYear,vMonth,d);
                if(ds>_hoyDash||!(a.dias||[]).includes(getDow(ds))||isExc(ti.id,a.id,ds)) return;
                mx+=10;
                const p=puntajeReg(getReg(ds,ti.id,a.id),getRangoActivo(a.id,ds));
                if(p!==null) ob+=p;
              }));
            });
            return {a,pct:mx>0?Math.round((ob/mx)*100):null};
          }).filter(x=>x.pct!==null).sort((a,b)=>b.pct-a.pct);
          const actMejorDash = actEfectDash[0];
          const actPeorDash  = actEfectDash[actEfectDash.length-1];

          // Formato con mayor riesgo (más tiendas <60%)
          const riesgoPorFmt=["Mayorista","Supermayorista","Market"].map(fmt=>({
            fmt,
            nRiesgo:scoresMes.filter(s=>s.t.f===fmt&&s.score!==null&&s.score<60).length,
          })).sort((a,b)=>b.nRiesgo-a.nRiesgo);
          const fmtRiesgo=riesgoPorFmt[0];
          const nCriticas=scoresMes.filter(s=>s.score!==null&&s.score<60).length;

          // Tiendas sin ningún registro en el período visible
          const semsVis = selWeek!==null ? [semanasDelMes[selWeek]] : semanasDelMes;
          const nSinReg=tsEval.filter(ti=>!semsVis.some(s=>s.days.some(d=>{
            const ds=dStr(vYear,vMonth,d); const dw=getDow(ds);
            return actsBase.some(a=>(a.dias||[]).includes(dw)&&puntajeReg(getReg(ds,ti.id,a.id),getRangoActivo(a.id,ds))!==null);
          }))).length;

          // Construir narrativa según período
          let sentencia="";
          if(selWeek!==null){
            // Vista semana específica
            const etiqueta = semanasDelMes[selWeek]?.label || `S${selWeek+1}`;
            sentencia = vSemRef!==null
              ? `${etiqueta} registra ${vSemRef}% de eficiencia`
              : `${etiqueta} sin datos registrados aún`;
            if(deltaRef!==null) sentencia+=` — ${Math.abs(deltaRef)} pts ${deltaRef>=0?"por encima":"por debajo"} de la semana anterior`;
            if(actMejorDash) sentencia+=`. ${actMejorDash.a.n} lidera con ${actMejorDash.pct}%`;
            if(actPeorDash&&actPeorDash.pct<80&&actPeorDash!==actMejorDash) sentencia+=`. ${actPeorDash.a.n} requiere atención (${actPeorDash.pct}%)`;
            if(fmtRiesgo.nRiesgo>0) sentencia+=`. ${fmtRiesgo.fmt} concentra ${fmtRiesgo.nRiesgo} tienda${fmtRiesgo.nRiesgo>1?"s":""} en zona crítica`;
            if(nSinReg>0) sentencia+=`. ${nSinReg} tienda${nSinReg>1?"s":""} sin registro esta semana`;
          } else {
            // Vista mes completo
            if(efPeriodo!==null){
              sentencia = esMesActualDash
                ? `${semanasDelMes[iSemRef]?.label||"Semana actual"} registra ${vSemRef??efPeriodo}% de eficiencia`
                : `${MESES[vMonth]} cerró con ${efPeriodo}% de eficiencia global`;
            }
            if(deltaRef!==null&&esMesActualDash) sentencia+=` — ${Math.abs(deltaRef)} pts ${deltaRef>=0?"por encima":"por debajo"} de la semana anterior`;
            if(actMejorDash) sentencia+=`. ${actMejorDash.a.n} lidera con ${actMejorDash.pct}%`;
            if(actPeorDash&&actPeorDash.pct<80&&actPeorDash!==actMejorDash) sentencia+=`. ${actPeorDash.a.n} requiere atención (${actPeorDash.pct}%)`;
            if(fmtRiesgo.nRiesgo>0) sentencia+=`. ${fmtRiesgo.fmt} concentra ${fmtRiesgo.nRiesgo} tienda${fmtRiesgo.nRiesgo>1?"s":""} en zona crítica`;
            if(nSinReg>0) sentencia+=`. ${nSinReg} tienda${nSinReg>1?"s":""} sin ningún registro en el período`;
          }
          sentencia+=".";

          if(!sentencia||sentencia===".") return null;
          const esAlerta=(deltaRef!==null&&deltaRef<-5)||nCriticas>2||nSinReg>3;
          return(
          <div style={{marginBottom:12,padding:"10px 14px",background:esAlerta?"#fff8f8":"#f0f9ff",borderRadius:10,border:`1px solid ${esAlerta?"#fecaca":"#bfdbfe"}`,display:"flex",alignItems:"flex-start",gap:10}}>
            <span style={{fontSize:16,flexShrink:0,marginTop:1}}>{esAlerta?"⚠️":"📊"}</span>
            <div style={{flex:1}}>
              <div style={{fontSize:11,fontWeight:700,color:esAlerta?"#991b1b":"#1e40af",lineHeight:1.6}}>{sentencia}</div>
              {deltaRef!==null&&Math.abs(deltaRef)>=10&&(
                <div style={{fontSize:10,color:esAlerta?"#dc2626":"#2563eb",marginTop:2}}>
                  {deltaRef<0?"⬇ Caída significativa — revisar actividades con mayor pendiente":"⬆ Mejora significativa respecto a la semana anterior"}
                </div>
              )}
              {selWeek!==null&&(
                <div style={{fontSize:10,color:"#5a7a9a",marginTop:4,display:"flex",gap:8,flexWrap:"wrap"}}>
                  <span>📅 {semanasDelMes[selWeek]?.label} · días {semanasDelMes[selWeek]?.start}–{semanasDelMes[selWeek]?.end} de {MESES[vMonth]}</span>
                  {efPeriodo!==null&&<span style={{fontWeight:700,color:sc(efPeriodo)}}>{getTier(efPeriodo).icon} {getTier(efPeriodo).label}</span>}
                </div>
              )}
            </div>
          </div>
          );
        })()}

        {/* ══ NIVEL 1 — ESTRATÉGICO · CEO / DIRECCIÓN ══════════════════
            ¿Vamos bien o mal? — eficiencia global + cobertura + riesgo
        ══════════════════════════════════════════════════════════════ */}
        <div style={{borderRadius:12,overflow:"hidden",marginBottom:10,border:"1px solid #e2e8f0"}}>
          <div style={{background:"#1a2f4a",padding:"9px 14px",display:"flex",alignItems:"center",gap:8}}>
            <span style={{fontSize:14}}>💡</span>
            <div style={{flex:1}}>
              <div style={{fontWeight:800,fontSize:11,color:"#fff",letterSpacing:".06em"}}>ESTRATÉGICO · CEO / DIRECCIÓN</div>
              <div style={{fontSize:9,color:"rgba(255,255,255,.45)"}}>¿Vamos bien o mal? · {selWeek!==null?(semanasDelMes[selWeek]?.label||"Semana"):MESES[vMonth]} {vYear}</div>
            </div>
            {SG>0&&<div style={{textAlign:"right"}}><div style={{fontSize:20,fontWeight:800,color:sc(SG)}}>{SG}%</div><div style={{fontSize:8,color:"rgba(255,255,255,.4)"}}>{getTier(SG).icon} {getTier(SG).label}</div></div>}
          </div>
          <div style={{background:"#fff",padding:"12px 14px"}}>

        {/* KPIs */}
        {(()=>{
          const nEval=tsEval.length;
          // IC: tiendas con al menos 1 registro válido en el período (no anulado)
          const nCump=tsEval.filter(ti=>semanasDelMes.some(s=>s.days.some(d=>{
            const ds=dStr(vYear,vMonth,d); const dw=getDow(ds);
            return actsBase.some(a=>(a.dias||[]).includes(dw)&&!isExc(ti.id,a.id,ds)&&puntajeReg(getReg(ds,ti.id,a.id),getRangoActivo(a.id,ds))!==null);
          }))).length;
          // SE: tiendas con eficiencia ≥95% en el período
          const nExc=scoresMes.filter(s=>s.score!==null&&s.score>=95).length;
          // SE por formato para insight
          const excPorFmt=["Mayorista","Supermayorista","Market"].map(f=>{
            const n=scoresMes.filter(s=>s.t.f===f&&s.score!==null&&s.score>=95).length;
            const tot=scoresMes.filter(s=>s.t.f===f&&s.score!==null).length;
            return {f,n,tot};
          }).filter(x=>x.tot>0);
          // TR: tiendas con eficiencia <60%
          const nRie=scoresMes.filter(s=>s.score!==null&&s.score<60).length;
          const riePorFmt=["Mayorista","Supermayorista","Market"].map(f=>{
            const n=scoresMes.filter(s=>s.t.f===f&&s.score!==null&&s.score<60).length;
            return {f,n};
          }).filter(x=>x.n>0);
          // Insights claros para gerencia
          const sgI=`${totalOb} de ${totalMx} pts posibles · ${nEval} tiendas evaluadas · excluye N/A por día/semana/actividad`;
          const icI=`${nCump} de ${nEval} tiendas con al menos 1 registro válido. ${nEval-nCump>0?`${nEval-nCump} sin ningún registro aún.`:"Cobertura completa."}`;
          const seI=nExc===0?`Ninguna tienda alcanza ≥95% aún. Top: ${scoresMes.filter(s=>s.score!==null).sort((a,b)=>b.score-a.score).slice(0,3).map(s=>`Vega ${s.t.n} ${s.score}%`).join(", ")}`:
            `${nExc} tiendas ≥95%: ${excPorFmt.map(x=>`${x.f} ${x.n}/${x.tot}`).join(" · ")}`;
          const trI=nRie===0?`✅ Todas las tiendas evaluadas superan 60%`:
            `${nRie} tiendas <60%: ${riePorFmt.map(x=>`${x.f} (${x.n})`).join(", ")} — requieren atención`;
          return(
          <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(240px,1fr))",gap:10,marginBottom:14}}>
            {[
              {k:"SG",label:"Eficiencia Global",    sub:`${totalOb} pts obtenidos de ${totalMx} posibles · ${tsEval.length} tiendas`,  v:SG+"%", num:SG, c:sc(SG),   icon:"🎯", insight:sgI, tier:getTier(SG)},
              {k:"IC",label:"Cobertura Registros",  sub:`${nCump}/${nEval} tiendas`,  v:IC+"%", num:IC, c:"#0984e3",icon:"📬", insight:icI},
              {k:"SE",label:"Tiendas Excelencia",   sub:`${nExc}/${nEval} con ≥95%`,  v:SE+"%", num:SE, c:"#f6a623",icon:"🏆", insight:seI},
              {k:"TR",label:"Tiendas Bajo Mínimo",  sub:`${nRie}/${nEval} con <60%`,  v:TR+"%", num:TR, c:TR>20?"#d63031":"#00b894",icon:TR>20?"🚨":"✅", insight:trI},
            ].map(k=>(
              <div key={k.k} style={{...S.card,padding:"14px",cursor:"default",position:"relative"}}
                onMouseEnter={e=>e.currentTarget.querySelector(".kpi-tip").style.display="block"}
                onMouseLeave={e=>e.currentTarget.querySelector(".kpi-tip").style.display="none"}
                onTouchStart={e=>{const tipEl=e.currentTarget.querySelector(".kpi-tip");tipEl.style.display=tipEl.style.display==="block"?"none":"block";}}
              >
                <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start"}}>
                  <span style={{fontSize:20}}>{k.icon}</span>
                  <span style={{fontSize:8,color:"#b2bec3",fontWeight:700}}>{k.k}</span>
                </div>
                <div style={{fontWeight:800,fontSize:26,color:k.c,lineHeight:1,marginTop:6}}>{k.v}</div>
                {k.tier&&<div style={{marginTop:3}}><span style={{...S.pill(k.tier.c,k.tier.bg)}}>{k.tier.icon} {k.tier.label}</span></div>}
                <div style={{fontSize:10,color:"#5a7a9a",fontWeight:700,marginTop:3}}>{k.label}</div>
                <div style={{fontSize:9,color:"#b2bec3",marginTop:1,lineHeight:1.3}}>{k.sub}</div>
                <div style={{height:3,borderRadius:2,background:k.c+"33",marginTop:6,overflow:"hidden"}}>
                  <div style={{height:"100%",width:k.num+"%",background:k.c,borderRadius:2,transition:"width .6s"}}/>
                </div>
                <div className="kpi-tip" style={{display:"none",position:"absolute",bottom:"calc(100% + 8px)",left:0,right:0,background:"#1a2f4a",color:"#fff",fontSize:10,fontWeight:600,padding:"10px 12px",borderRadius:10,zIndex:20,lineHeight:1.6,boxShadow:"0 4px 16px rgba(0,0,0,.25)"}}>
                  {k.insight}
                  <div style={{position:"absolute",bottom:-5,left:20,width:10,height:10,background:"#1a2f4a",transform:"rotate(45deg)",borderRadius:1}}/>
                </div>
              </div>
            ))}
          </div>
          );
        })()}

          </div>
        </div>{/* fin ESTRATÉGICO */}

        {/* ══ NIVEL 2 — TÁCTICO · DIRECTORES / GERENTES ══════════════════
            ¿Por qué pasó? — tendencias, actividades, horarios, formatos
        ══════════════════════════════════════════════════════════════ */}
        <div style={{borderRadius:12,overflow:"visible",marginBottom:10,border:"1px solid #e2e8f0"}}>
          <div style={{background:"#1e5f8a",padding:"9px 14px",display:"flex",alignItems:"center",gap:8,borderRadius:"12px 12px 0 0"}}>
            <span style={{fontSize:14}}>🔍</span>
            <div>
              <div style={{fontWeight:800,fontSize:11,color:"#fff",letterSpacing:".06em"}}>TÁCTICO · DIRECTORES / GERENTES</div>
              <div style={{fontSize:9,color:"rgba(255,255,255,.45)"}}>¿Por qué pasó? · tendencias, actividades y distribución horaria</div>
            </div>
          </div>
          <div style={{background:"#fff",padding:"12px 14px",borderRadius:"0 0 12px 12px",overflow:"visible"}}>

        {/* tendencia */}
        <div style={{...S.card,padding:"16px",marginBottom:14}}>
          <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:6}}>
            <div style={{fontWeight:800,fontSize:13,color:"#1a2f4a"}}>📈 EFICIENCIA SEMANAL</div>
            <div style={{fontSize:9,color:"#8aaabb",fontWeight:600}}>Eficiencia = pts obtenidos ÷ pts posibles · excluye N/A y días futuros</div>
          </div>
          <div style={{fontSize:10,color:"#5a7a9a",marginBottom:14,padding:"6px 10px",background:"#f8fafc",borderRadius:8,lineHeight:1.5}}>
            Muestra qué % de los puntos posibles se obtuvieron cada semana. Una semana con 80% significa que de cada 10 pts posibles, se lograron 8.
          </div>
          <div style={{display:"flex",gap:10,alignItems:"flex-end"}}>
            {semanasDelMes.map((s,i)=>{
              const v=tendencia[i];
              let ob=0,mx=0;
              tsEval.forEach(ti=>{ const ef=calcEficienciaSem(ti.id,s); if(ef){ob+=ef.obtenidos;mx+=ef.maximos;} });
              const isFuture=s.days.every(d=>dStr(vYear,vMonth,d)>todayStr());
              const maxV=Math.max(...tendencia.filter(x=>x!==null),1);
              const barH=v!==null?Math.max(8,Math.round((v/maxV)*80)):0;
              const trend=i>0&&tendencia[i-1]!==null&&v!==null?(v>tendencia[i-1]?"↑":v<tendencia[i-1]?"↓":"→"):null;
              // Tooltip detalle por actividad para esta semana
              const actTip = actsBase.filter(a=>a.activa&&actsConRegistroIds.has(a.id)).map(a=>{
                let aOb=0,aMx=0;
                s.days.forEach(d=>{
                  const ds=dStr(vYear,vMonth,d);
                  if(ds>todayStr()||!(a.dias||[]).includes(getDow(ds))) return;
                  tsEval.forEach(ti=>{
                    if(isExc(ti.id,a.id,ds)) return;
                    aMx+=10;
                    const p=puntajeReg(getReg(ds,ti.id,a.id),getRangoActivo(a.id,ds));
                    if(p!==null) aOb+=p;
                  });
                });
                return aMx>0?`${a.e} ${a.n}: ${aOb}/${aMx}pts (${Math.round((aOb/aMx)*100)}%)`:null;
              }).filter(Boolean);
              return(
                <div key={i} style={{flex:1,display:"flex",flexDirection:"column",alignItems:"center",gap:2,position:"relative"}}
                  onMouseEnter={e=>{const t=e.currentTarget.querySelector(".sem-tip");if(t)t.style.display="block";}}
                  onMouseLeave={e=>{const t=e.currentTarget.querySelector(".sem-tip");if(t)t.style.display="none";}}
                  onTouchStart={e=>{const t=e.currentTarget.querySelector(".sem-tip");if(t)t.style.display=t.style.display==="block"?"none":"block";}}>
                  {/* Trend + % ARRIBA, fuera del contenedor de barra */}
                  {trend&&<div style={{fontSize:11,fontWeight:800,color:trend==="↑"?"#00b894":trend==="↓"?"#d63031":"#8aaabb"}}>{trend}</div>}
                  {!trend&&<div style={{fontSize:11}}> </div>}
                  <div style={{fontSize:13,fontWeight:800,color:isFuture?"#b2bec3":v!==null?sc(v):"#b2bec3"}}>{v!==null?v+"%":"—"}</div>
                  {/* Barra — crece hacia arriba, no tapa el texto */}
                  <div style={{width:"100%",height:80,background:"#f0f4f8",borderRadius:6,display:"flex",alignItems:"flex-end",overflow:"hidden"}}>
                    {v!==null&&!isFuture&&<div style={{width:"100%",height:barH+"px",background:sc(v),borderRadius:"4px 4px 0 0",transition:"height .4s"}}/>}
                    {isFuture&&<div style={{height:"100%",width:"100%",display:"flex",alignItems:"center",justifyContent:"center",fontSize:9,color:"#b2bec3",fontWeight:700,flexDirection:"column",gap:2}}><IcoPending size={10} color={"#b2bec3"}/><span>PEND.</span></div>}
                  </div>
                  <div style={{fontSize:10,color:"#1a2f4a",fontWeight:800}}>{s.label}</div>
                  {mx>0&&!isFuture&&<div style={{fontSize:9,color:"#8aaabb",textAlign:"center",lineHeight:1.3}}>{ob}/{mx} pts</div>}
                  {isFuture&&<div style={{fontSize:8,color:"#b2bec3"}}>sin datos</div>}
                  {/* Tooltip detalle actividades */}
                  {!isFuture&&v!==null&&actTip.length>0&&(
                  <div className="sem-tip" style={{display:"none",position:"absolute",bottom:"calc(100% + 8px)",left:"50%",transform:"translateX(-50%)",background:"#1a2f4a",color:"#fff",fontSize:10,padding:"10px 13px",borderRadius:10,zIndex:30,whiteSpace:"nowrap",boxShadow:"0 4px 20px rgba(0,0,0,.3)",lineHeight:1.7,minWidth:180}}>
                    <div style={{fontWeight:800,fontSize:11,marginBottom:4,color:sc(v)}}>{s.label} · {v}% eficiencia</div>
                    <div style={{borderBottom:"1px solid rgba(255,255,255,.15)",marginBottom:6,paddingBottom:4,fontSize:9,color:"rgba(255,255,255,.5)"}}>Desglose por actividad</div>
                    {actTip.map((t,ti)=><div key={ti} style={{fontSize:9,lineHeight:1.6}}>{t}</div>)}
                    <div style={{marginTop:6,paddingTop:4,borderTop:"1px solid rgba(255,255,255,.15)",fontSize:9,color:"rgba(255,255,255,.5)"}}>Total: {ob}/{mx}pts</div>
                    <div style={{position:"absolute",bottom:-5,left:"50%",transform:"translateX(-50%)",width:10,height:10,background:"#1a2f4a",rotate:"45deg",borderRadius:1}}/>
                  </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* efectividad por actividad — stacked bar gerencial */}
        {(()=>{
          // Para cada actividad, calcular distribución ORO/PLATA/BRONCE/FUERA
          const actEfectDetalle=actEfect.map(({a,v,ob,mx})=>{
            // Contar tiendas únicas que tuvieron al menos 1 registro por franja
            // y cuántas tiendas evaluables hay para esa actividad
            const hoy=todayStr();
            const tiendasEval=tsBase.filter(ti=>
              semanasDelMes.some(s=>s.days.some(d=>{
                const ds=dStr(vYear,vMonth,d);
                return ds<=hoy&&(a.dias||[]).includes(getDow(ds))&&!isExc(ti.id,a.id,ds);
              }))
            );
            const nEvalAct=tiendasEval.length;
            // Para cada tienda, tomar su MEJOR franja del mes (el mejor día que registró)
            let nOro=0,nPlata=0,nBronce=0,nFuera=0,nConReg=0;
            tiendasEval.forEach(ti=>{
              let bestP=null;
              semanasDelMes.forEach(s=>{
                s.days.forEach(day=>{
                  const ds=dStr(vYear,vMonth,day);
                  if(ds>hoy) return;
                  if(!(a.dias||[]).includes(getDow(ds))) return;
                  if(isExc(ti.id,a.id,ds)) return;
                  const reg=getReg(ds,ti.id,a.id);
                  const p=puntajeReg(reg,getRangoActivo(a.id,ds));
                  if(p===null) return;
                  if(bestP===null||p>bestP) bestP=p;
                });
              });
              if(bestP===null) return;
              nConReg++;
              if(bestP===10) nOro++;
              else if(bestP===8) nPlata++;
              else if(bestP===6) nBronce++;
              else nFuera++;
            });
            return {a,v,ob,mx,nOro,nPlata,nBronce,nFuera,nTotal:nConReg,nEvalAct};
          });
          return(
          <div style={{...S.card,padding:"16px",marginBottom:14}}>
            <div style={{fontWeight:800,fontSize:13,color:"#1a2f4a",marginBottom:4}}>📊 EFECTIVIDAD POR ACTIVIDAD</div>
            <div style={{fontSize:10,color:"#5a7a9a",marginBottom:8,lineHeight:1.4}}>
              Las píldoras muestran cuántas tiendas alcanzaron cada franja (mejor día del mes). El % = pts obtenidos ÷ pts posibles del período.
            </div>
            {/* leyenda */}
            <div style={{display:"flex",gap:12,marginBottom:14,flexWrap:"wrap"}}>
              {[
                {icon:"🥇",label:"ORO",    c:"#f6a623",desc:"Registros antes 08:00 · 10pts"},
                {icon:"🥈",label:"PLATA",  c:"#74b9ff",desc:"08:01-09:00 · 8pts"},
                {icon:"🥉",label:"BRONCE", c:"#a29bfe",desc:"09:01-10:00 · 6pts"},
                {icon:"🔴",label:"FUERA",  c:"#d63031",desc:"Después 10:00 · 0pts"},
              ].map(f=>(
                <div key={f.label} style={{display:"flex",alignItems:"center",gap:4}}>
                  <div style={{width:10,height:10,borderRadius:2,background:f.c,flexShrink:0}}/>
                  <span style={{fontSize:9,color:"#5a7a9a",fontWeight:600}}>{f.icon} {f.label}</span>
                  <span style={{fontSize:8,color:"#b2bec3"}}>{f.desc}</span>
                </div>
              ))}
            </div>
            {actEfectDetalle.length===0&&<div style={{fontSize:11,color:"#b2bec3",textAlign:"center",padding:"12px 0"}}>Sin registros este período</div>}
            {actEfectDetalle.map(({a,v,ob,mx,nOro,nPlata,nBronce,nFuera,nTotal,nEvalAct})=>(
              <div key={a.id} style={{marginBottom:14}}>
                <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:4}}>
                  <div style={{display:"flex",alignItems:"center",gap:6}}>
                    <span style={{fontSize:15}}>{a.e}</span>
                    <span style={{fontSize:11,color:"#1a2f4a",fontWeight:700}}>{a.n}</span>
                  </div>
                  <div style={{display:"flex",alignItems:"center",gap:8}}>
                    {nTotal>0&&<div style={{display:"flex",gap:3,alignItems:"center",flexWrap:"wrap",justifyContent:"flex-end"}}>
                      <span style={{fontSize:8,color:"#8aaabb",marginRight:2,whiteSpace:"nowrap"}}>{nTotal}/{nEvalAct} tiendas:</span>
                      {nOro>0&&<span title={`${nOro} tiendas llegaron en ORO · mejor registro antes 08:00 · 10pts`} style={{fontSize:9,fontWeight:700,color:"#f6a623",background:"#fff8ec",padding:"1px 6px",borderRadius:10,cursor:"default"}}>🥇 {nOro}</span>}
                      {nPlata>0&&<span title={`${nPlata} tiendas en PLATA · mejor registro 08:01-09:00 · 8pts`} style={{fontSize:9,fontWeight:700,color:"#74b9ff",background:"#e8f4fd",padding:"1px 6px",borderRadius:10,cursor:"default"}}>🥈 {nPlata}</span>}
                      {nBronce>0&&<span title={`${nBronce} tiendas en BRONCE · mejor registro 09:01-10:00 · 6pts`} style={{fontSize:9,fontWeight:700,color:"#a29bfe",background:"#f0edff",padding:"1px 6px",borderRadius:10,cursor:"default"}}>🥉 {nBronce}</span>}
                      {nFuera>0&&<span title={`${nFuera} tiendas FUERA · después 10:00 · 0pts`} style={{fontSize:9,fontWeight:700,color:"#d63031",background:"#ffeae6",padding:"1px 6px",borderRadius:10,cursor:"default"}}>🔴 {nFuera}</span>}
                    </div>}
                    <span style={{fontSize:12,fontWeight:800,color:v!==null?sc(v):"#b2bec3",minWidth:36,textAlign:"right"}}>{v!==null?v+"%":"—"}</span>
                  </div>
                </div>
                {nTotal>0?(
                  <div style={{height:10,borderRadius:5,overflow:"hidden",display:"flex"}}>
                    {nOro>0&&<div style={{width:(nOro/nTotal*100)+"%",background:"#f6a623",transition:"width .4s"}}/>}
                    {nPlata>0&&<div style={{width:(nPlata/nTotal*100)+"%",background:"#74b9ff",transition:"width .4s"}}/>}
                    {nBronce>0&&<div style={{width:(nBronce/nTotal*100)+"%",background:"#a29bfe",transition:"width .4s"}}/>}
                    {nFuera>0&&<div style={{width:(nFuera/nTotal*100)+"%",background:"#d63031",transition:"width .4s"}}/>}
                  </div>
                ):(
                  <div style={{height:10,borderRadius:5,background:"#f0f4f8"}}/>
                )}
                {mx>0&&<div style={{fontSize:8,color:"#b2bec3",marginTop:2}}>{ob}/{mx} pts obtenidos · {nEvalAct} tiendas evaluables · {nTotal} con registro</div>}
              </div>
            ))}
          </div>
          );
        })()}

        {/* ══ EFICIENCIA HORARIA — unidad: evidencia (tienda × actividad × día) ══
            Denominador: cada combinación habilitada (no N/A) cuenta como 1 evidencia esperada.
            Los registros sin evidencia enviada NO entran al numerador pero SÍ al denominador.
            Escalable a cualquier mes/año: usa vYear, vMonth y actsConRegistroIds reactivos.
        ══*/}
        {(()=>{
          const hoy=todayStr();

          // dayMap acumula por día los conteos y puntos obtenidos/máximos
          // Clave: "YYYY-MM-DD" → { oro, plata, bronce, fuera, expected, ptsObt, ptsMax }
          const dayMap={};
          let nOro=0, nPlata=0, nBronce=0, nFuera=0, nExpected=0, totalPtsObt=0;

          semanasDelMes.forEach(s=>{
            s.days.forEach(day=>{
              const ds=dStr(vYear,vMonth,day);
              if(ds>hoy) return;
              const dw=getDow(ds);
              if(!dayMap[ds]) dayMap[ds]={oro:0,plata:0,bronce:0,fuera:0,expected:0,ptsObt:0,ptsMax:0};

              tsBase.forEach(ti=>{
                actsBase
                  .filter(a=>
                    a.activa &&
                    (a.dias||[]).includes(dw) &&
                    !isExc(ti.id,a.id,ds) &&
                    actsConRegistroIds.has(a.id)
                  )
                  .forEach(a=>{
                    // Toda evidencia esperada suma al denominador y a los pts máximos
                    dayMap[ds].expected++;
                    dayMap[ds].ptsMax+=10;
                    nExpected++;

                    const reg=getReg(ds,ti.id,a.id);
                    const p=puntajeReg(reg,getRangoActivo(a.id,ds));
                    if(p===null) return; // no enviada: no suma al numerador

                    dayMap[ds].ptsObt+=p;
                    totalPtsObt+=p;

                    if(p===10){ dayMap[ds].oro++;    nOro++;    }
                    else if(p===8){ dayMap[ds].plata++; nPlata++; }
                    else if(p===6){ dayMap[ds].bronce++; nBronce++; }
                    else{           dayMap[ds].fuera++;  nFuera++;  }
                  });
              });
            });
          });

          const totalEnv=nOro+nPlata+nBronce+nFuera;
          const ptsMax=nExpected*10||1;
          // Promedio en escala 0-10: pts obtenidos / pts máximos posibles × 10
          const ptsPonderado=ptsMax>0?Math.round((totalPtsObt/ptsMax)*10):0;
          const eficGlobal=ptsMax>0?Math.round((totalPtsObt/ptsMax)*100):0;

          const franjas=[
            {l:"ORO",   icon:"🥇", c:"#f6a623", bg:"#fff8ec", n:nOro,    desc:"Antes de 08:00 · 10pts"},
            {l:"PLATA", icon:"🥈", c:"#74b9ff", bg:"#e8f4fd", n:nPlata,  desc:"08:01 – 09:00 · 8pts"},
            {l:"BRONCE",icon:"🥉", c:"#a29bfe", bg:"#f0edff", n:nBronce, desc:"09:01 – 10:00 · 6pts"},
            {l:"FUERA", icon:"🔴", c:"#d63031", bg:"#ffeae6", n:nFuera,  desc:"Después 10:00 · 0pts"},
          ];

          // Datos por semana: todos los niveles + eficiencia ponderada
          const semData=semanasDelMes.map(s=>{
            const isFut=s.days.every(d=>dStr(vYear,vMonth,d)>hoy);
            let sOro=0,sPlata=0,sBronce=0,sFuera=0,sExp=0,sPtsObt=0;
            s.days.forEach(day=>{
              const dm=dayMap[dStr(vYear,vMonth,day)];
              if(!dm) return;
              sOro+=dm.oro; sPlata+=dm.plata; sBronce+=dm.bronce; sFuera+=dm.fuera;
              sExp+=dm.expected; sPtsObt+=dm.ptsObt;
            });
            const sPtsMax=sExp*10||1;
            const efic=sExp>0?Math.round((sPtsObt/sPtsMax)*100):null;
            const semEnv=sOro+sPlata+sBronce+sFuera;
            return {s,isFut,nOro:sOro,nPlata:sPlata,nBronce:sBronce,nFuera:sFuera,nExp:sExp,semEnv,efic};
          });

          // Datos por formato: todos los niveles
          const fmtData=["Mayorista","Supermayorista","Market"].map(fmt=>{
            let fOro=0,fPlata=0,fBronce=0,fFuera=0,fExp=0,fPtsObt=0;
            semanasDelMes.forEach(s=>{
              s.days.forEach(day=>{
                const ds=dStr(vYear,vMonth,day);
                if(ds>hoy) return;
                const dw=getDow(ds);
                tsBase.filter(ti=>ti.f===fmt).forEach(ti=>{
                  actsBase
                    .filter(a=>a.activa&&(a.dias||[]).includes(dw)&&!isExc(ti.id,a.id,ds)&&actsConRegistroIds.has(a.id))
                    .forEach(a=>{
                      fExp++;
                      const reg=getReg(ds,ti.id,a.id);
                      const p=puntajeReg(reg,getRangoActivo(a.id,ds));
                      if(p===null) return;
                      fPtsObt+=p;
                      if(p===10) fOro++;
                      else if(p===8) fPlata++;
                      else if(p===6) fBronce++;
                      else fFuera++;
                    });
                });
              });
            });
            const fPtsMax=fExp*10||1;
            const fEfic=fExp>0?Math.round((fPtsObt/fPtsMax)*100):null;
            return {fmt,nOro:fOro,nPlata:fPlata,nBronce:fBronce,nFuera:fFuera,nEval:fExp,fEfic,fc:FMT[fmt]};
          }).filter(f=>f.nEval>0);

          // Color de celda del heatmap basado en eficiencia ponderada del día
          const hCell=(efic)=>{
            if(efic===null) return {bg:"#f0f4f8",color:"#c8d8e8",text:"—"};
            if(efic>=90)   return {bg:"#fff8ec",color:"#854F0B",text:efic+"%"};
            if(efic>=75)   return {bg:"#e8f4fd",color:"#185FA5",text:efic+"%"};
            if(efic>=60)   return {bg:"#f0edff",color:"#534AB7",text:efic+"%"};
            return             {bg:"#ffeae6",color:"#A32D2D",text:efic+"%"};
          };

          return(
          <div style={{...S.card,padding:"16px",marginBottom:14}}>

            {/* Encabezado con eficiencia global */}
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:4}}>
              <div>
                <div style={{fontWeight:800,fontSize:13,color:"#1a2f4a"}}>⏱️ EFICIENCIA HORARIA</div>
                <div style={{fontSize:9,color:"#8aaabb",marginTop:2}}>
                  {nExpected} actividades programadas en el mes · {totalEnv} enviaron evidencia · {nExpected-totalEnv} sin registro · tiendas N/A no cuentan
                </div>
              </div>
              <div style={{textAlign:"right"}}>
                <div style={{fontSize:20,fontWeight:800,color:sc(eficGlobal)}}>
                  {ptsPonderado}
                  <span style={{fontSize:10,color:"#8aaabb",fontWeight:400}}>/10 pts prom.</span>
                </div>
                <div style={{fontSize:9,color:"#8aaabb"}}>{eficGlobal}% · {totalPtsObt} de {ptsMax} pts posibles</div>
              </div>
            </div>

            {/* Barra apilada — 4 niveles + franja sin envío en gris */}
            <div style={{height:20,borderRadius:8,overflow:"hidden",display:"flex",marginBottom:8}}>
              {nExpected>0&&franjas.map(f=>f.n>0&&(
                <div key={f.l} style={{width:(f.n/nExpected*100)+"%",background:f.c,display:"flex",alignItems:"center",justifyContent:"center",transition:"width .4s"}}>
                  {f.n/nExpected>0.07&&<span style={{fontSize:9,color:"#fff",fontWeight:800}}>{Math.round(f.n/nExpected*100)}%</span>}
                </div>
              ))}
              {nExpected>0&&(nExpected-totalEnv)>0&&(
                <div style={{flex:1,background:"#e2e8f0",display:"flex",alignItems:"center",justifyContent:"center"}}>
                  {(nExpected-totalEnv)/nExpected>0.07&&<span style={{fontSize:9,color:"#8aaabb",fontWeight:800}}>
                    {Math.round((nExpected-totalEnv)/nExpected*100)}% s/e
                  </span>}
                </div>
              )}
            </div>
            {/* Cierre narrativo horario — convierte conteos en historia operativa */}
            {nExpected>0&&(()=>{
              const pctOro=Math.round(nOro/nExpected*100);
              const pctTardio=Math.round((nPlata+nBronce)/nExpected*100);
              const pctFuera=Math.round(nFuera/nExpected*100);
              const pctSinReg=Math.round((nExpected-totalEnv)/nExpected*100);
              // Identificar formato con más registros FUERA
              const fueraPorFmt=["Mayorista","Supermayorista","Market"].map(fmt=>{
                let fFuera=0;
                semanasDelMes.forEach(s=>s.days.forEach(day=>{
                  const ds=dStr(vYear,vMonth,day);
                  if(ds>hoy) return;
                  const dw=getDow(ds);
                  tsBase.filter(ti=>ti.f===fmt).forEach(ti=>{
                    actsBase.filter(a=>a.activa&&(a.dias||[]).includes(dw)&&!isExc(ti.id,a.id,ds)&&actsConRegistroIds.has(a.id)).forEach(a=>{
                      const p=puntajeReg(getReg(ds,ti.id,a.id),getRangoActivo(a.id,ds));
                      if(p===0) fFuera++;
                    });
                  });
                }));
                return {fmt,fFuera};
              }).filter(f=>f.fFuera>0).sort((a,b)=>b.fFuera-a.fFuera);
              let texto=`${pctOro}% de las evidencias llegaron en tiempo óptimo (ORO)`;
              if(pctTardio>0) texto+=`, el ${pctTardio}% llegó tarde pero registró`;
              if(pctFuera>0){
                texto+=`, y ${nFuera} registro${nFuera>1?"s":""} quedaron fuera de rango (0 pts)`;
                if(fueraPorFmt.length>0) texto+=` — concentrado en ${fueraPorFmt[0].fmt}`;
              }
              if(pctSinReg>0) texto+=`. El ${pctSinReg}% no registró evidencia`;
              texto+=".";
              const esAlerta=pctSinReg>15||pctFuera>5;
              return(
              <div style={{marginBottom:10,padding:"8px 12px",background:esAlerta?"#fff8f8":"#f0f9ff",borderRadius:8,border:`1px solid ${esAlerta?"#fecaca":"#bfdbfe"}`}}>
                <div style={{fontSize:10,color:esAlerta?"#991b1b":"#1e40af",fontWeight:600,lineHeight:1.6}}>{esAlerta?"⚠ ":""}{texto}</div>
              </div>
              );
            })()}

            {/* 4 tarjetas de franja horaria */}
            <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(130px,1fr))",gap:8,marginBottom:14}}>
              {franjas.map(f=>(
                <div key={f.l} style={{background:f.bg,borderRadius:10,padding:"10px 8px",textAlign:"center",border:"1.5px solid "+f.c+"33"}}>
                  <div style={{fontSize:18}}>{f.icon}</div>
                  <div style={{fontSize:20,fontWeight:800,color:f.c,lineHeight:1.1}}>{f.n}</div>
                  <div style={{fontSize:8,color:f.c,fontWeight:700}}>registros en rango {f.l}</div>
                  <div style={{fontSize:8,color:"#8aaabb",marginTop:2}}>
                    {nExpected>0?Math.round(f.n/nExpected*100):0}% de {nExpected} · {f.desc}
                  </div>
                </div>
              ))}
            </div>

            {/* HEATMAP: eficiencia diaria ponderada (pts obtenidos / pts posibles) */}
            <div style={{marginBottom:12}}>
              <div style={{fontSize:10,fontWeight:700,color:"#5a7a9a",marginBottom:6}}>
                RENDIMIENTO DIARIO · cada celda = % de pts obtenidos sobre el máximo posible ese día · pasa el cursor para ver el detalle
              </div>
              <div style={{overflowX:"auto"}}>
                <table style={{borderCollapse:"separate",borderSpacing:4,width:"100%"}}>
                  <thead>
                    <tr>
                      <th style={{width:28,fontSize:9,color:"#8aaabb",fontWeight:700,textAlign:"left",paddingBottom:4}}/>
                      {["Lun","Mar","Mié","Jue","Vie"].map(d=>(
                        <th key={d} style={{fontSize:9,color:"#8aaabb",fontWeight:700,textAlign:"center",paddingBottom:4}}>{d}</th>
                      ))}
                      <th style={{fontSize:9,color:"#8aaabb",fontWeight:700,textAlign:"center",paddingBottom:4,minWidth:44}}>Sem.</th>
                    </tr>
                  </thead>
                  <tbody>
                    {semanasDelMes.map((sw,si)=>{
                      const dowMap={};
                      sw.days.forEach(day=>{ dowMap[getDow(dStr(vYear,vMonth,day))]=day; });
                      const semRow=semData[si];
                      return(
                      <tr key={sw.label}>
                        <td style={{fontSize:10,fontWeight:700,color:"#8aaabb",verticalAlign:"middle",paddingRight:2}}>{sw.label}</td>
                        {[1,2,3,4,5].map(dow=>{
                          const day=dowMap[dow];
                          if(!day) return <td key={dow} style={{padding:0}}><div style={{background:"#f8fafc",borderRadius:6,padding:"8px 4px",textAlign:"center",fontSize:12,color:"#e0e0e0",minWidth:36}}>—</div></td>;
                          const ds=dStr(vYear,vMonth,day);
                          if(ds>hoy) return <td key={dow} style={{padding:0}}><div style={{background:"#f8fafc",borderRadius:6,padding:"8px 4px",textAlign:"center",fontSize:12,color:"#c8d8e8",minWidth:36}}>—</div></td>;
                          const dm=dayMap[ds];
                          const eficDia=dm&&dm.ptsMax>0?Math.round((dm.ptsObt/dm.ptsMax)*100):null;
                          const cs=hCell(eficDia);
                          // Issue 5 fix: construir desglose por actividad para este día específico
                          const actsTipDia=dm?acts.filter(a=>a.activa&&(a.dias||[]).includes(getDow(ds))&&actsConRegistroIds.has(a.id)).map(a=>{
                            const reg=getReg(ds,null,a.id); // buscar cualquier registro de cualquier tienda ese día
                            // Contar tiendas con registro y su distribución horaria
                            const tiConReg=tsBase.filter(ti=>{
                              const r=getReg(ds,ti.id,a.id);
                              return r?.evidencias?.length&&!r?.anulado&&!isExc(ti.id,a.id,ds);
                            });
                            const tiEval=tsBase.filter(ti=>!isExc(ti.id,a.id,ds));
                            if(!tiEval.length) return null;
                            let aPts=0;
                            tiConReg.forEach(ti=>{const p=puntajeReg(getReg(ds,ti.id,a.id),getRangoActivo(a.id,ds));if(p!==null)aPts+=p;});
                            const aMx=tiEval.length*10;
                            const aEf=aMx>0?Math.round((aPts/aMx)*100):0;
                            return `${a.e}${a.n}: ${tiConReg.length}/${tiEval.length} tiendas · ${aPts}/${aMx}pts (${aEf}%)`;
                          }).filter(Boolean):[];
                          const tip=dm
                            ?`${eficDia}% · ${dm.ptsObt}/${dm.ptsMax}pts\n${actsTipDia.join('\n')}\n──────\n🥇${dm.oro} ORO · 🥈${dm.plata} Plata · 🥉${dm.bronce} Bronce · 🔴${dm.fuera} Fuera`
                            :"Sin datos";
                          return(
                          <td key={dow} style={{padding:0}}>
                            <div title={tip} style={{background:cs.bg,color:cs.color,borderRadius:6,padding:"8px 4px",textAlign:"center",fontSize:12,fontWeight:700,minWidth:36,cursor:"default"}}>
                              {cs.text}
                            </div>
                          </td>
                          );
                        })}
                        <td style={{padding:0,paddingLeft:4}}>
                          {semRow&&!semRow.isFut&&semRow.nExp>0?(()=>{
                            const cs=hCell(semRow.efic);
                            return(
                            <div style={{background:cs.bg,color:cs.color,borderRadius:6,padding:"8px 4px",textAlign:"center",fontSize:12,fontWeight:700,minWidth:44,border:`0.5px solid ${cs.color}44`}}>
                              {semRow.efic!==null?semRow.efic+"%":"—"}
                            </div>
                            );
                          })():(
                            <div style={{background:"#f8fafc",borderRadius:6,padding:"8px 4px",textAlign:"center",fontSize:12,color:"#c8d8e8",minWidth:44}}>—</div>
                          )}
                        </td>
                      </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
              <div style={{display:"flex",gap:12,marginTop:6,flexWrap:"wrap",alignItems:"center"}}>
                {[{l:"≥90%",bg:"#fff8ec",c:"#854F0B"},{l:"75–89%",bg:"#e8f4fd",c:"#185FA5"},{l:"60–74%",bg:"#f0edff",c:"#534AB7"},{l:"<60%",bg:"#ffeae6",c:"#A32D2D"}].map(lg=>(
                  <span key={lg.l} style={{display:"flex",alignItems:"center",gap:3,fontSize:8}}>
                    <span style={{width:10,height:10,borderRadius:2,background:lg.bg,border:`0.5px solid ${lg.c}`,display:"inline-block"}}/>
                    <span style={{color:"#8aaabb"}}>{lg.l}</span>
                  </span>
                ))}
                <span style={{fontSize:8,color:"#b2bec3",marginLeft:"auto"}}>* % = pts obtenidos ÷ pts posibles ese día · denominador varía por N/A</span>
              </div>
            </div>

            {/* Eficiencia por semana con mini stacked bar de todos los niveles */}
            <div style={{marginBottom:12}}>
              <div style={{fontSize:10,fontWeight:700,color:"#5a7a9a",marginBottom:6}}>EFICIENCIA POR SEMANA · pts obtenidos ÷ pts posibles · barras muestran distribución de franjas</div>
              <div style={{display:"flex",gap:6}}>
                {semData.map(({s,isFut,nOro:sO,nPlata:sP,nBronce:sB,nFuera:sF,nExp:sExp,semEnv,efic})=>{
                  const cs=hCell(efic);
                  const total=semEnv||1;
                  return(
                  <div key={s.label} title={!isFut&&sExp>0?`${s.label} · ${efic}% eficiencia\n${sO+sP+sB+sF} de ${sExp} enviaron evidencia\nPts obtenidos: ${sO*10+sP*8+sB*6} de ${sExp*10} posibles\n─────────────────\n🥇 ${sO} ORO · antes 08:00 · 10pts c/u\n🥈 ${sP} Plata · 08-09h · 8pts c/u\n🥉 ${sB} Bronce · 09-10h · 6pts c/u\n🔴 ${sF} Fuera · después 10:00 · 0pts\n${sExp-(sO+sP+sB+sF)>0?`⬜ ${sExp-(sO+sP+sB+sF)} sin registro`:""}`:"Semana pendiente — sin datos aún"} style={{flex:1,background:isFut||!sExp?"#f8fafc":cs.bg,borderRadius:8,padding:"8px 6px",textAlign:"center",border:`1px solid ${isFut||!sExp?"#e2e8f0":cs.color+"66"}`,cursor:"default"}}>
                    <div style={{fontSize:9,color:"#8aaabb",fontWeight:700,marginBottom:3}}>{s.label}</div>
                    {!isFut&&sExp>0?(
                      <>
                        <div style={{fontSize:15,fontWeight:800,color:cs.color,lineHeight:1.1}}>{efic}%</div>
                        <div style={{height:5,borderRadius:3,overflow:"hidden",display:"flex",marginTop:4,marginBottom:3}}>
                          {sO>0&&<div style={{width:(sO/total*100)+"%",background:"#f6a623"}}/>}
                          {sP>0&&<div style={{width:(sP/total*100)+"%",background:"#74b9ff"}}/>}
                          {sB>0&&<div style={{width:(sB/total*100)+"%",background:"#a29bfe"}}/>}
                          {sF>0&&<div style={{width:(sF/total*100)+"%",background:"#d63031"}}/>}
                          {(sExp-semEnv)>0&&<div style={{flex:1,background:"#e2e8f0"}}/>}
                        </div>
                        <div style={{display:"flex",justifyContent:"center",gap:3,flexWrap:"wrap"}}>
                          {sO>0&&<span style={{fontSize:7,color:"#f6a623",fontWeight:700}}>🥇{sO}</span>}
                          {sP>0&&<span style={{fontSize:7,color:"#74b9ff",fontWeight:700}}>🥈{sP}</span>}
                          {sB>0&&<span style={{fontSize:7,color:"#a29bfe",fontWeight:700}}>🥉{sB}</span>}
                          {sF>0&&<span style={{fontSize:7,color:"#d63031",fontWeight:700}}>🔴{sF}</span>}
                        </div>
                      </>
                    ):(
                      <div style={{fontSize:10,color:"#b2bec3"}}>—</div>
                    )}
                  </div>
                  );
                })}
              </div>
            </div>

            {/* Eficiencia por formato con todos los niveles */}
            {fmtData.length>0&&(
            <div>
              <div style={{fontSize:10,fontWeight:700,color:"#5a7a9a",marginBottom:6}}>EFICIENCIA POR FORMATO DE TIENDA · sobre actividades habilitadas de ese formato</div>
              <div style={{display:"flex",gap:8}}>
                {fmtData.map(({fmt,nOro:fO,nPlata:fP,nBronce:fB,nFuera:fF,nEval,fEfic,fc})=>{
                  const fEnv=fO+fP+fB+fF||1;
                  return(
                  <div key={fmt} style={{flex:1,background:fc.bg,borderRadius:8,padding:"10px 10px",border:"1px solid "+fc.c}}>
                    <div style={{fontSize:9,fontWeight:800,color:fc.c,marginBottom:4}}>{fmt}</div>
                    <div style={{fontSize:16,fontWeight:800,color:sc(fEfic),lineHeight:1}}>{fEfic!==null?fEfic+"%":"—"}</div>
                    <div style={{fontSize:8,color:"#8aaabb",marginBottom:5}}>{nEval} actividades programadas en el período</div>
                    <div style={{height:6,borderRadius:3,overflow:"hidden",display:"flex",marginBottom:5}}>
                      {fO>0&&<div style={{width:(fO/fEnv*100)+"%",background:"#f6a623"}}/>}
                      {fP>0&&<div style={{width:(fP/fEnv*100)+"%",background:"#74b9ff"}}/>}
                      {fB>0&&<div style={{width:(fB/fEnv*100)+"%",background:"#a29bfe"}}/>}
                      {fF>0&&<div style={{width:(fF/fEnv*100)+"%",background:"#d63031"}}/>}
                      {(nEval-fEnv)>0&&<div style={{flex:1,background:"#e2e8f0"}}/>}
                    </div>
                    <div style={{display:"flex",gap:4,flexWrap:"wrap"}}>
                      {fO>0&&<span style={{fontSize:7,color:"#f6a623",fontWeight:700}}>🥇{fO}</span>}
                      {fP>0&&<span style={{fontSize:7,color:"#74b9ff",fontWeight:700}}>🥈{fP}</span>}
                      {fB>0&&<span style={{fontSize:7,color:"#a29bfe",fontWeight:700}}>🥉{fB}</span>}
                      {fF>0&&<span style={{fontSize:7,color:"#d63031",fontWeight:700}}>🔴{fF}</span>}
                    </div>
                  </div>
                  );
                })}
              </div>
            </div>
            )}

          </div>
          );
        })()}

          </div>
        </div>{/* fin TÁCTICO */}

        {/* ══ REGISTROS INGRESADOS POR HORARIO
            TOP 3 dinámico: cambia con filtros semana/actividad/formato
            Muestra hora del mejor registro en cada tarjeta del podio
        ══*/}
        {(()=>{
          const hoyF = todayStr();
          const semsVis2 = selWeek!==null ? [semanasDelMes[selWeek]] : semanasDelMes;
          const actsH2 = dashAct==="Todas"
            ? acts.filter(a=>a.activa&&actsConRegistroIds.has(a.id))
            : acts.filter(a=>a.activa&&a.id===dashAct&&actsConRegistroIds.has(a.id));
          const tsFH = dashFmt==="Todas" ? tiAct : tiAct.filter(ti=>ti.f===dashFmt);
          if(actsH2.length===0||tsFH.length===0) return null;

          const _dsRef = semsVis2.flatMap(s=>s.days.map(d=>dStr(vYear,vMonth,d))).find(d=>d<=hoyF)||hoyF;
          const AR0 = actsH2[0] ? getRangoActivo(actsH2[0].id, _dsRef) : {c100:"08:30",c80:"09:30",c60:"10:30"};

          let gTotal=0,gDisp=0,gOro=0,gPlata=0,gBronce=0,gFuera=0,gPend=0,gExc=0;
          let oroMin="99:99",oroMax="00:00",plataMin="99:99",plataMax="00:00";
          let bronceMin="99:99",bronceMax="00:00",fueraMin="99:99",fueraMax="00:00";

          // tiendaScore tracks per-tienda medal counts + best (earliest) registered hour
          const tiendaScore = new Map();

          const fmtRows = ["Mayorista","Supermayorista","Market"].map(fmt=>{
            const tsFmt = tsFH.filter(ti=>ti.f===fmt);
            if(tsFmt.length===0) return null;
            let fTotal=0,fDisp=0,fOro=0,fPlata=0,fBronce=0,fFuera=0,fPend=0,fExc=0;
            let fOroMin="99:99",fOroMax="00:00",fPlataMin="99:99",fPlataMax="00:00";
            semsVis2.forEach(s=>{
              s.days.forEach(day=>{
                const ds=dStr(vYear,vMonth,day);
                if(ds>hoyF) return;
                const dw=getDow(ds);
                actsH2.filter(a=>(a.dias||[]).includes(dw)).forEach(a=>{
                  tsFmt.forEach(ti=>{
                    fTotal++;
                    const sc0=tiendaScore.get(ti.id)||{oro:0,plata:0,bronce:0,fuera:0,pend:0,nombre:ti.n,fmt:ti.f,mejorHora:null};
                    if(isExc(ti.id,a.id,ds)){fExc++;tiendaScore.set(ti.id,sc0);return;}
                    fDisp++;
                    const reg=getReg(ds,ti.id,a.id);
                    if(!reg?.evidencias?.length||reg.anulado){fPend++;sc0.pend++;tiendaScore.set(ti.id,sc0);return;}
                    const AR=getRangoActivo(a.id,ds);
                    const h=primerEnvio(reg.evidencias);
                    const m=toMin(h);
                    if(m<=toMin(AR.c100)){
                      fOro++;sc0.oro++;
                      if(!sc0.mejorHora||h<sc0.mejorHora)sc0.mejorHora=h;
                      if(h<fOroMin)fOroMin=h;if(h>fOroMax)fOroMax=h;
                      if(h<oroMin)oroMin=h;if(h>oroMax)oroMax=h;
                    } else if(m<=toMin(AR.c80)){
                      fPlata++;sc0.plata++;
                      if(!sc0.mejorHora||h<sc0.mejorHora)sc0.mejorHora=h;
                      if(h<fPlataMin)fPlataMin=h;if(h>fPlataMax)fPlataMax=h;
                      if(h<plataMin)plataMin=h;if(h>plataMax)plataMax=h;
                    } else if(m<=toMin(AR.c60)){
                      fBronce++;sc0.bronce++;
                      if(!sc0.mejorHora||h<sc0.mejorHora)sc0.mejorHora=h;
                      if(h<bronceMin)bronceMin=h;if(h>bronceMax)bronceMax=h;
                    } else {
                      fFuera++;sc0.fuera++;
                      if(h<fueraMin)fueraMin=h;if(h>fueraMax)fueraMax=h;
                    }
                    tiendaScore.set(ti.id,sc0);
                  });
                });
              });
            });
            gTotal+=fTotal;gDisp+=fDisp;gOro+=fOro;gPlata+=fPlata;gBronce+=fBronce;gFuera+=fFuera;gPend+=fPend;gExc+=fExc;
            return {fmt,nd:fTotal,fDisp,fOro,fPlata,fBronce,fFuera,fPend,fExc,
              fOroMin,fOroMax,fPlataMin,fPlataMax,
              fc:FMT[fmt],icon:<FmtIcon fmt={fmt} size={18}/>};
          }).filter(Boolean).filter(r=>r.fDisp>0);

          if(gDisp===0) return null;

          // TOP 3: puntaje = oro*3 + plata*2 + bronce*1
          // desempate: más OROs → más PLATA → mejor hora (más temprana)
          const ranking = [...tiendaScore.entries()]
            .map(([id,s])=>({id,nombre:s.nombre,fmt:s.fmt,
              pts:s.oro*3+s.plata*2+s.bronce,
              oro:s.oro,plata:s.plata,bronce:s.bronce,fuera:s.fuera,
              mejorHora:s.mejorHora}))
            .filter(r=>r.pts>0)
            .sort((a,b)=>
              b.pts!==a.pts?b.pts-a.pts:
              b.oro!==a.oro?b.oro-a.oro:
              b.plata!==a.plata?b.plata-a.plata:
              (a.mejorHora&&b.mejorHora?(a.mejorHora<b.mejorHora?-1:1):0))
            .slice(0,3);

          const pctOro=Math.round(gOro/gDisp*100);
          const pctPlata=Math.round(gPlata/gDisp*100);
          const pctFuera=Math.round(gFuera/gDisp*100);
          const pctSinReg=Math.round(gPend/gDisp*100);
          const podiumIcons=["🥇","🥈","🥉"];
          const podiumBg=["#fff8ec","#f0f4f8","#fff1ee"];
          const podiumBorder=["#f6a623","#8aaabb","#e17055"];
          const periodoLabel=selWeek!==null?semanasDelMes[selWeek]?.label:`${MESES[vMonth]} ${vYear}`;
          const actLabel=dashAct==="Todas"?"Todas las actividades":acts.find(a=>a.id===dashAct)?.n||"";

          return(
          <div style={{...S.card,padding:0,marginBottom:14,overflow:"hidden"}}>
            <div style={{padding:"12px 16px",borderBottom:"1px solid #e2e8f0"}}>
              <div style={{fontWeight:800,fontSize:13,color:"#1a2f4a",marginBottom:10}}>📊 REGISTROS INGRESADOS POR HORARIO</div>
              {/* Nav MES */}
              <div style={{display:"flex",gap:8,alignItems:"center",marginBottom:10}}>
                <button onClick={()=>navMes(-1)} style={{padding:"6px 12px",borderRadius:8,border:"1px solid #c8d8e8",background:"#fff",cursor:"pointer",fontWeight:700,fontSize:13}}>←</button>
                <span style={{flex:1,textAlign:"center",fontWeight:800,fontSize:13,color:"#1a2f4a"}}>{MESES[vMonth].toUpperCase()} {vYear}</span>
                <button onClick={()=>navMes(1)} style={{padding:"6px 12px",borderRadius:8,border:"1px solid #c8d8e8",background:"#fff",cursor:"pointer",fontWeight:700,fontSize:13}}>→</button>
              </div>
              {/* Semanas */}
              <div style={{display:"flex",gap:5,marginBottom:10}}>
                <button onClick={()=>setSelWeek(null)} style={{flex:1,padding:"5px",borderRadius:7,border:`1.5px solid ${selWeek===null?"#00b5b4":"#e2e8f0"}`,background:selWeek===null?"#e0fafa":"#fff",color:selWeek===null?"#00b5b4":"#5a7a9a",cursor:"pointer",fontSize:10,fontWeight:700}}>Mes</button>
                {semanasDelMes.map((s,i)=>(
                  <button key={i} onClick={()=>setSelWeek(i)} style={{flex:1,padding:"5px 3px",borderRadius:7,border:`1.5px solid ${selWeek===i?"#6c5ce7":"#e2e8f0"}`,background:selWeek===i?"#f0edff":"#fff",color:selWeek===i?"#6c5ce7":"#5a7a9a",cursor:"pointer",fontSize:10,fontWeight:700,lineHeight:1.3}}>
                    {s.label}
                    <div style={{fontSize:7,fontWeight:400,color:selWeek===i?"#6c5ce7":"#8aaabb",marginTop:1,whiteSpace:"nowrap"}}>Del {String(s.start).padStart(2,"0")} al {String(s.end).padStart(2,"0")}</div>
                  </button>
                ))}
              </div>
              <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8}}>
                <div>
                  <div style={{fontSize:9,color:"#8aaabb",fontWeight:700,marginBottom:3}}>ACTIVIDAD</div>
                  <select value={dashAct} onChange={e=>setDashAct(e.target.value)} style={{width:"100%",padding:"7px 10px",borderRadius:8,border:"1px solid #c8d8e8",background:"#f8fafc",color:"#1a2f4a",fontSize:12,outline:"none"}}>
                    <option value="Todas">Todas las actividades</option>
                    {acts.filter(a=>a.activa).map(a=><option key={a.id} value={a.id}>{a.e} {a.n}</option>)}
                  </select>
                </div>
                <div>
                  <div style={{fontSize:9,color:"#8aaabb",fontWeight:700,marginBottom:3}}>FORMATO</div>
                  <select value={dashFmt} onChange={e=>setDashFmt(e.target.value)} style={{width:"100%",padding:"7px 10px",borderRadius:8,border:"1px solid #c8d8e8",background:"#f8fafc",color:"#1a2f4a",fontSize:12,outline:"none"}}>
                    <option value="Todas">Todos los formatos</option>
                    {["Mayorista","Supermayorista","Market"].map(f=><option key={f} value={f}>{f}</option>)}
                  </select>
                </div>
              </div>
            </div>

            <div style={{padding:"14px 16px"}}>
              {/* 4 KPIs */}
              <div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:10,marginBottom:12}}>
                {[
                  {pct:pctOro,   lbl:"Registros en ORO",  sub:`antes de ${AR0.c100}`,barC:"#00b894",c:"#f6a623"},
                  {pct:pctPlata, lbl:"Tardíos rescatados", sub:`${AR0.c100} a ${AR0.c80}`,barC:"#74b9ff",c:"#0984e3"},
                  {pct:pctFuera, lbl:"Fuera de rango",     sub:`${AR0.c60} a más`,   barC:"#d63031",c:"#d63031"},
                  {pct:pctSinReg,lbl:"Sin registrar",      sub:"dentro del rango",   barC:"#b2bec3",c:"#b2bec3"},
                ].map((k,i)=>(
                  <div key={i} style={{border:"1px solid #e2e8f0",borderRadius:12,padding:"14px 12px",background:"#fff"}}>
                    <div style={{fontSize:30,fontWeight:800,color:k.c,lineHeight:1}}>{k.pct}%</div>
                    <div style={{fontSize:11,color:"#5a7a9a",marginTop:4,fontWeight:600}}>{k.lbl}</div>
                    <div style={{fontSize:10,color:"#8aaabb",marginTop:2}}>{k.sub}</div>
                    <div style={{height:4,borderRadius:2,background:"#f0f4f8",marginTop:8}}>
                      <div style={{height:"100%",width:k.pct+"%",background:k.barC,borderRadius:2,transition:"width .4s"}}/>
                    </div>
                  </div>
                ))}
              </div>

              {/* Barra apilada */}
              <div style={{height:10,borderRadius:5,overflow:"hidden",display:"flex",marginBottom:14}}>
                {gOro>0&&<div style={{width:(gOro/gDisp*100)+"%",background:"#00b894"}}/>}
                {gPlata>0&&<div style={{width:(gPlata/gDisp*100)+"%",background:"#74b9ff"}}/>}
                {gBronce>0&&<div style={{width:(gBronce/gDisp*100)+"%",background:"#a29bfe"}}/>}
                {gFuera>0&&<div style={{width:(gFuera/gDisp*100)+"%",background:"#d63031"}}/>}
                {gPend>0&&<div style={{flex:1,background:"#e2e8f0"}}/>}
              </div>

              {/* 🏆 TOP 3 tiendas — dinámico por filtros */}
              {ranking.length>0&&(
              <div style={{marginBottom:14,padding:"12px 14px",background:"linear-gradient(135deg,#fffbf0,#fff8ec)",borderRadius:12,border:"1px solid #f6a62333"}}>
                <div style={{fontWeight:800,fontSize:11,color:"#854F0B",letterSpacing:".06em",marginBottom:4}}>🏆 TOP TIENDAS · MEJOR PROMEDIO ACUMULADO</div>
                <div style={{fontSize:9,color:"#b2bec3",marginBottom:10}}>{periodoLabel}{dashAct!=="Todas"?` · ${actLabel}`:""}</div>
                <div style={{display:"flex",gap:8,flexWrap:"wrap"}}>
                  {ranking.map((r,i)=>(
                    <div key={r.id} style={{flex:"1 1 140px",background:podiumBg[i],borderRadius:10,padding:"10px 12px",border:`1.5px solid ${podiumBorder[i]}`}}>
                      <div style={{fontSize:22,marginBottom:2}}>{podiumIcons[i]}</div>
                      <div style={{fontSize:12,fontWeight:800,color:"#1a2f4a",marginBottom:1}}>Vega {r.nombre}</div>
                      <div style={{fontSize:9,color:"#8aaabb",marginBottom:r.mejorHora?4:6}}>{r.fmt}</div>
                      {r.mejorHora&&(
                        <div style={{fontSize:12,fontWeight:800,color:podiumBorder[i],marginBottom:6,display:"flex",alignItems:"center",gap:4}}>
                          <span style={{fontSize:10}}>⏱</span>{r.mejorHora}
                          <span style={{fontSize:9,color:"#8aaabb",fontWeight:400,marginLeft:2}}>mejor reg.</span>
                        </div>
                      )}
                      <div style={{display:"flex",gap:3,flexWrap:"wrap"}}>
                        {r.oro>0&&<span style={{fontSize:9,fontWeight:700,color:"#854F0B",background:"#fff8ec",padding:"1px 6px",borderRadius:8,border:"1px solid #f6a62344"}}>🥇 {r.oro}</span>}
                        {r.plata>0&&<span style={{fontSize:9,fontWeight:700,color:"#185FA5",background:"#e8f4fd",padding:"1px 6px",borderRadius:8}}>🥈 {r.plata}</span>}
                        {r.bronce>0&&<span style={{fontSize:9,fontWeight:700,color:"#534AB7",background:"#f0edff",padding:"1px 6px",borderRadius:8}}>🥉 {r.bronce}</span>}
                        {r.fuera>0&&<span style={{fontSize:9,fontWeight:700,color:"#dc2626",background:"#fff1f2",padding:"1px 6px",borderRadius:8}}>🔴 {r.fuera}</span>}
                      </div>
                    </div>
                  ))}
                </div>
                <div style={{fontSize:8,color:"#b2bec3",marginTop:6}}>Puntaje: 🥇×3 + 🥈×2 + 🥉×1 · desempate por hora más temprana</div>
              </div>
              )}

              {/* CORTE 1 — ORO */}
              {gOro>0&&(
              <div style={{marginBottom:12}}>
                <div style={{fontSize:11,fontWeight:700,color:"#BA7517",letterSpacing:".06em",marginBottom:8,display:"flex",alignItems:"center",gap:6}}>
                  <span style={{width:8,height:8,borderRadius:"50%",background:"#BA7517",display:"inline-block"}}/>
                  CORTE 1 · hasta las {AR0.c100} · ORO
                </div>
                {fmtRows.filter(r=>r.fOro>0).map(({fmt,icon,fc,nd,fDisp,fOro,fPend,fExc,fOroMin,fOroMax})=>(
                  <div key={fmt+"oro"} style={{marginBottom:8,padding:"8px 12px",background:"#FFF8EC",borderRadius:10,border:"0.5px solid #FAC775"}}>
                    <div style={{display:"flex",alignItems:"center",gap:6,flexWrap:"wrap"}}>
                      <span style={{flexShrink:0,display:"flex",alignItems:"center"}}>{icon}</span>
                      <span style={{fontWeight:700,color:"#1a2f4a",fontSize:13}}>{fmt}</span>
                      <span style={{fontSize:11,color:"#8aaabb",fontWeight:700}}>{nd} total · {fDisp} disp.</span>
                      <span style={{padding:"2px 8px",borderRadius:20,fontSize:11,fontWeight:700,color:"#0F6E56",background:"#E1F5EE",whiteSpace:"nowrap"}}>✅ {String(fOro).padStart(2,"0")} reg.</span>
                      {fOroMin!=="99:99"&&<span style={{fontSize:11,color:"#8aaabb",fontWeight:500,whiteSpace:"nowrap"}}>({fOroMin}{fOroMax!==fOroMin?` a ${fOroMax}`:""})</span>}
                      {fPend>0&&<span style={{padding:"2px 8px",borderRadius:20,fontSize:11,fontWeight:700,color:"#0984e3",background:"#e8f4fd",whiteSpace:"nowrap"}}>⏰ {String(fPend).padStart(2,"0")} pend.</span>}
                      {fExc>0&&<span style={{padding:"2px 8px",borderRadius:20,fontSize:11,fontWeight:700,color:"#854F0B",background:"#FAEEDA",whiteSpace:"nowrap"}}>⛔ {fExc}</span>}
                    </div>
                  </div>
                ))}
              </div>
              )}

              {/* CORTE 2 — PLATA */}
              {gPlata>0&&(
              <div style={{marginBottom:12,borderTop:"1px dashed #e2e8f0",paddingTop:12}}>
                <div style={{fontSize:11,fontWeight:700,color:"#185FA5",letterSpacing:".06em",marginBottom:8,display:"flex",alignItems:"center",gap:6}}>
                  <span style={{width:8,height:8,borderRadius:"50%",background:"#185FA5",display:"inline-block"}}/>
                  CORTE 2 · {AR0.c100} a {AR0.c80} · PLATA
                  <span style={{padding:"2px 8px",borderRadius:20,fontSize:10,fontWeight:700,color:"#A32D2D",background:"#FCEBEB",border:"1px solid #F7C1C1",marginLeft:4}}>⚠️ Puntaje reducido</span>
                </div>
                {fmtRows.filter(r=>r.fPlata>0).map(({fmt,icon,nd,fDisp,fPlata,fPend,fExc,fPlataMin,fPlataMax})=>(
                  <div key={fmt+"plata"} style={{marginBottom:8,padding:"8px 12px",background:"#EDF4FF",borderRadius:10,border:"0.5px solid #B5D4F4"}}>
                    <div style={{display:"flex",alignItems:"center",gap:6,flexWrap:"wrap"}}>
                      <span style={{flexShrink:0,display:"flex",alignItems:"center"}}>{icon}</span>
                      <span style={{fontWeight:700,color:"#1a2f4a",fontSize:13}}>{fmt}</span>
                      <span style={{padding:"2px 8px",borderRadius:20,fontSize:11,fontWeight:700,color:"#185FA5",background:"#e8f4fd",whiteSpace:"nowrap"}}>✅ {String(fPlata).padStart(2,"0")} reg.</span>
                      {fPlataMin!=="99:99"&&<span style={{fontSize:11,color:"#8aaabb",fontWeight:500,whiteSpace:"nowrap"}}>({fPlataMin}{fPlataMax!==fPlataMin?` a ${fPlataMax}`:""})</span>}
                      {fPend>0&&<span style={{padding:"2px 8px",borderRadius:20,fontSize:11,fontWeight:700,color:"#A32D2D",background:"#FCEBEB",whiteSpace:"nowrap"}}>⏰ {String(fPend).padStart(2,"0")} pend.</span>}
                      {fExc>0&&<span style={{padding:"2px 8px",borderRadius:20,fontSize:11,fontWeight:700,color:"#854F0B",background:"#FAEEDA",whiteSpace:"nowrap"}}>⛔ {fExc}</span>}
                    </div>
                  </div>
                ))}
              </div>
              )}

              {/* BRONCE */}
              {gBronce>0&&(
              <div style={{marginBottom:12,borderTop:"1px dashed #e2e8f0",paddingTop:12}}>
                <div style={{fontSize:11,fontWeight:700,color:"#534AB7",letterSpacing:".06em",marginBottom:8,display:"flex",alignItems:"center",gap:6}}>
                  <span style={{width:8,height:8,borderRadius:"50%",background:"#534AB7",display:"inline-block"}}/>
                  CORTE 3 · {AR0.c80} a {AR0.c60} · BRONCE
                </div>
                {fmtRows.filter(r=>r.fBronce>0).map(({fmt,icon,fBronce})=>(
                  <div key={fmt+"bronce"} style={{marginBottom:8,padding:"8px 12px",background:"#f0edff",borderRadius:10,border:"0.5px solid #a29bfe"}}>
                    <div style={{display:"flex",alignItems:"center",gap:6}}>
                      <span style={{flexShrink:0,display:"flex",alignItems:"center"}}>{icon}</span>
                      <span style={{fontWeight:700,color:"#1a2f4a",fontSize:13}}>{fmt}</span>
                      <span style={{padding:"2px 8px",borderRadius:20,fontSize:11,fontWeight:700,color:"#534AB7",background:"#f0edff",border:"1px solid #a29bfe",whiteSpace:"nowrap"}}>🥉 {String(fBronce).padStart(2,"0")} reg.</span>
                    </div>
                  </div>
                ))}
              </div>
              )}

              {/* FUERA */}
              {gFuera>0&&(
              <div style={{marginBottom:8,borderTop:"1px dashed #e2e8f0",paddingTop:12}}>
                <div style={{fontSize:11,fontWeight:700,color:"#dc2626",letterSpacing:".06em",marginBottom:8,display:"flex",alignItems:"center",gap:6}}>
                  <span style={{width:8,height:8,borderRadius:"50%",background:"#dc2626",display:"inline-block"}}/>
                  FUERA DE RANGO · después de {AR0.c60} · 0 pts
                </div>
                {fmtRows.filter(r=>r.fFuera>0).map(({fmt,icon,fFuera})=>(
                  <div key={fmt+"fuera"} style={{marginBottom:8,padding:"8px 12px",background:"#FFF8F8",borderRadius:10,border:"0.5px solid #F7C1C1"}}>
                    <div style={{display:"flex",alignItems:"center",gap:6}}>
                      <span style={{flexShrink:0,display:"flex",alignItems:"center"}}>{icon}</span>
                      <span style={{fontWeight:700,color:"#1a2f4a",fontSize:13}}>{fmt}</span>
                      <span style={{padding:"2px 8px",borderRadius:20,fontSize:11,fontWeight:700,color:"#dc2626",background:"#fff1f2",whiteSpace:"nowrap"}}>🔴 {String(fFuera).padStart(2,"0")} fuera</span>
                    </div>
                  </div>
                ))}
              </div>
              )}

              <div style={{fontSize:9,color:"#b2bec3",marginTop:4,textAlign:"right"}}>
                {periodoLabel}{dashAct!=="Todas"?` · ${actLabel}`:""} · excluye N/A
              </div>
            </div>
          </div>
          );
        })()}

        {/* ══ NIVEL 3 — OPERATIVO · JEFES / SUPERVISORES ══════════════════
            ¿Cómo avanzamos? — rankings, tiendas críticas, acciones
        ══════════════════════════════════════════════════════════════ */}
        
        <div style={{borderRadius:12,overflow:"visible",marginBottom:10,border:"1px solid #e2e8f0"}}>
          <div style={{background:"#855F00",padding:"9px 14px",display:"flex",alignItems:"center",gap:8,borderRadius:"12px 12px 0 0"}}>
            <span style={{fontSize:14}}>⚙️</span>
            <div>
              <div style={{fontWeight:800,fontSize:11,color:"#fff",letterSpacing:".06em"}}>OPERATIVO · JEFES / SUPERVISORES</div>
              <div style={{fontSize:9,color:"rgba(255,255,255,.45)"}}>¿Cómo avanzamos? · ranking tiendas y acciones inmediatas</div>
            </div>
          </div>
          <div style={{background:"#fff",padding:"12px 14px",borderRadius:"0 0 12px 12px"}}>

        {/* por formato */}
        <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(200px,1fr))",gap:10,marginBottom:14}}>
          {["Mayorista","Supermayorista","Market"].map(fmt=>{
            const fc=FMT[fmt];
            const fts=tiAct.filter(ti=>ti.f===fmt);
            // solo las evaluables (sin excepción en todas las actividades)
            const ftsEval=fts.filter(ti=>actsBase.some(a=>semanasDelMes.some(s=>s.days.some(d=>!isExc(ti.id,a.id,dStr(vYear,vMonth,d))))));
            // eficiencia acumulada del formato: sum(obtenidos) / sum(maximos)
            let fmtOb=0, fmtMx=0;
            ftsEval.forEach(ti=>{ const ef=calcEficienciaFiltrada(ti.id); if(ef){fmtOb+=ef.obtenidos;fmtMx+=ef.maximos;} });
            const prom=fmtMx>0?Math.round((fmtOb/fmtMx)*100):null;
            const tier=getTier(prom);
            const excCount=fts.length-ftsEval.length;
            return(
              <div key={fmt} style={{...S.card,padding:"14px",borderLeft:`4px solid ${fc.c}`,position:"relative",cursor:"default"}}
                onMouseEnter={e=>e.currentTarget.querySelector(".fmt-tip").style.display="block"}
                onMouseLeave={e=>e.currentTarget.querySelector(".fmt-tip").style.display="none"}
                onTouchStart={e=>{const tipEl=e.currentTarget.querySelector(".fmt-tip");tipEl.style.display=tipEl.style.display==="block"?"none":"block";}}>
                <div style={{fontWeight:800,fontSize:12,color:fc.c}}>{fmt.toUpperCase()}</div>
                <div style={{fontSize:9,color:"#8aaabb",marginTop:2,lineHeight:1.7}}>
                  <span style={{color:"#5a7a9a",fontWeight:700}}>{fts.length} tiendas</span>
                  {ftsEval.length<fts.length&&<span style={{color:"#854F0B",fontWeight:700}}>{" · "}{fts.length-ftsEval.length} excluidas N/A</span>}
                  {ftsEval.length===fts.length&&<span style={{color:"#00b894",fontWeight:700}}> · todas activas</span>}
                </div>
                <div style={{fontWeight:800,fontSize:26,color:sc(prom),marginTop:8,lineHeight:1}}>{prom!==null?prom+"%":"—"}</div>
                <div style={{fontSize:9,color:"#b2bec3",marginTop:2}}>{fmtOb}/{fmtMx} pts · eficiencia período</div>
                <div style={{marginTop:6,display:"flex",alignItems:"center",gap:6}}>
                  <span style={{...S.pill(tier.c,tier.bg),fontSize:10}}>{tier.icon} {tier.label}</span>
                  {(()=>{
                    const nFmtExc=scoresMes.filter(s=>s.t.f===fmt&&s.score!==null&&s.score>=95).length;
                    const nFmtRie=scoresMes.filter(s=>s.t.f===fmt&&s.score!==null&&s.score<60).length;
                    return<span style={{fontSize:9,color:"#8aaabb",marginLeft:"auto"}}>{nFmtExc>0?`🥇 ${nFmtExc}`:""}{nFmtRie>0?` ⚠️ ${nFmtRie}`:""}</span>;
                  })()}
                </div>
                <div style={{height:4,background:"#f0f4f8",borderRadius:2,marginTop:8}}>
                  <div style={{width:(prom||0)+"%",height:"100%",background:fc.c,borderRadius:2}}/>
                </div>
                {/* Sparkline tendencia semanal S1→S2→S3 */}
                {(()=>{
                  const semPts=semanasDelMes.map(s=>{
                    let ob=0,mx=0;
                    ftsEval.forEach(ti=>{
                      s.days.forEach(d=>{
                        const ds=dStr(vYear,vMonth,d);
                        if(ds>todayStr()) return;
                        const dw=getDow(ds);
                        actsBase.filter(a=>a.activa&&(a.dias||[]).includes(dw)&&!isExc(ti.id,a.id,ds)&&actsConRegistroIds.has(a.id)).forEach(a=>{
                          mx+=10;
                          const p=puntajeReg(getReg(ds,ti.id,a.id),getRangoActivo(a.id,ds));
                          if(p!==null) ob+=p;
                        });
                      });
                    });
                    return mx>0?Math.round((ob/mx)*100):null;
                  }).filter(v=>v!==null);
                  if(semPts.length<2) return null;
                  const maxV=Math.max(...semPts,1);
                  const minV=Math.min(...semPts);
                  const range=maxV-minV||1;
                  const w=60,h=24,pts=semPts.length;
                  const coords=semPts.map((v,i)=>`${Math.round((i/(pts-1))*w)},${Math.round(h-((v-minV)/range)*(h-4)-2)}`).join(" ");
                  const lastDelta=semPts.length>=2?semPts[semPts.length-1]-semPts[semPts.length-2]:0;
                  const trendColor=lastDelta>0?"#0F6E56":lastDelta<0?"#A32D2D":"#888780";
                  return(
                  <div style={{marginTop:8,display:"flex",alignItems:"center",gap:8}}>
                    <svg width={w} height={h} style={{flexShrink:0}}>
                      <polyline points={coords} fill="none" stroke={trendColor} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                      {semPts.map((v,i)=>{
                        const cx=Math.round((i/(pts-1))*w);
                        const cy=Math.round(h-((v-minV)/range)*(h-4)-2);
                        return <circle key={i} cx={cx} cy={cy} r="2" fill={trendColor}/>;
                      })}
                    </svg>
                    <div style={{fontSize:9,color:trendColor,fontWeight:700}}>
                      {semPts.map((v,i)=>`S${i+1}: ${v}%`).join(" → ")}
                    </div>
                  </div>
                  );
                })()}
                <div className="fmt-tip" style={{display:"none",position:"absolute",top:"calc(100% + 8px)",left:0,right:0,background:"#1a2f4a",color:"#fff",fontSize:10,fontWeight:600,padding:"12px 14px",borderRadius:10,zIndex:50,lineHeight:1.7,boxShadow:"0 8px 28px rgba(0,0,0,.35)"}}>
                  <div style={{fontWeight:800,marginBottom:4,fontSize:12,color:sc(prom||0)}}>{fmt} · {prom!==null?prom+"%":"Sin datos"}</div>
                  {prom!==null&&<div style={{color:"rgba(255,255,255,.8)"}}>{fmtOb} pts obtenidos de {fmtMx} posibles</div>}
                  <div style={{color:"rgba(255,255,255,.7)"}}>{ftsEval.length} de {fts.length} tiendas evaluables{fts.length-ftsEval.length>0?` · ${fts.length-ftsEval.length} excluidas N/A`:""}</div>
                  {/* Desglose por actividad para este formato */}
                  {(()=>{
                    const actRows=actsBase.filter(a=>a.activa&&actsConRegistroIds.has(a.id)).map(a=>{
                      let aOb=0,aMx=0;
                      ftsEval.forEach(ti=>{
                        semanasDelMes.forEach(s=>s.days.forEach(d=>{
                          const ds=dStr(vYear,vMonth,d);
                          if(ds>todayStr()||!(a.dias||[]).includes(getDow(ds))||isExc(ti.id,a.id,ds)) return;
                          aMx+=10;
                          const p=puntajeReg(getReg(ds,ti.id,a.id),getRangoActivo(a.id,ds));
                          if(p!==null) aOb+=p;
                        }));
                      });
                      return aMx>0?{a,ob:aOb,mx:aMx,pct:Math.round((aOb/aMx)*100)}:null;
                    }).filter(Boolean);
                    if(!actRows.length) return null;
                    return(
                      <div style={{marginTop:8,paddingTop:6,borderTop:"1px solid rgba(255,255,255,.15)"}}>
                        <div style={{fontSize:9,color:"rgba(255,255,255,.5)",fontWeight:700,letterSpacing:".04em",marginBottom:4}}>DESGLOSE POR ACTIVIDAD</div>
                        {actRows.map(({a,ob,mx,pct})=>(
                          <div key={a.id} style={{display:"flex",alignItems:"center",gap:6,marginBottom:3}}>
                            <span style={{fontSize:10}}>{a.e}</span>
                            <span style={{fontSize:9,flex:1,color:"rgba(255,255,255,.75)"}}>{a.n}</span>
                            <span style={{fontSize:9,color:"rgba(255,255,255,.5)",whiteSpace:"nowrap"}}>{ob}/{mx}pts</span>
                            <span style={{fontSize:10,fontWeight:800,color:sc(pct),minWidth:30,textAlign:"right"}}>{pct}%</span>
                          </div>
                        ))}
                      </div>
                    );
                  })()}
                  <div style={{marginTop:6,paddingTop:4,borderTop:"1px solid rgba(255,255,255,.15)",fontSize:9,color:"rgba(255,255,255,.4)"}}>Los N/A por día ya están descontados del denominador</div>
                  <div style={{position:"absolute",top:-5,left:16,width:10,height:10,background:"#1a2f4a",transform:"rotate(45deg)",borderRadius:1}}/>
                </div>
              </div>
            );
          })}
        </div>

        {/* ranking top/bottom */}
        <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(200px,1fr))",gap:10,marginBottom:14}}>
          {[
            {title:"🏅 Top 5",sub:"Mayor eficiencia de implementación",list:top5,icon:(i)=>i===0?"🥇":i===1?"🥈":i===2?"🥉":i===3?"🏅":"⭐"},
            {title:"⚠️ Bottom 5",sub:"Menor eficiencia — requieren atención",list:bot5,icon:()=>"🔴"},
          ].map(panel=>(
          <div key={panel.title} style={{...S.card,padding:"14px"}}>
            <div style={{fontWeight:800,fontSize:12,color:"#1a2f4a"}}>{panel.title}</div>
            <div style={{fontSize:9,color:"#8aaabb",marginBottom:10}}>{panel.sub}</div>
            {panel.list.map((s,i)=>{
              const det={obtenidos:s.obtenidos,maximos:s.maximos,registros:[]};
              return(
              <div key={s.t.id} style={{position:"relative",marginBottom:8}}
                onMouseEnter={e=>e.currentTarget.querySelector(".rank-tip").style.display="block"}
                onMouseLeave={e=>e.currentTarget.querySelector(".rank-tip").style.display="none"}
                onTouchStart={e=>{const tipEl=e.currentTarget.querySelector(".rank-tip");tipEl.style.display=tipEl.style.display==="block"?"none":"block";}}>
                <div style={{display:"flex",alignItems:"center",gap:6,cursor:"default"}}>
                  <span style={{fontSize:12,width:16}}>{panel.icon(i)}</span>
                  <div style={{flex:1,overflow:"hidden"}}>
                    <div style={{fontSize:11,color:"#1a2f4a",overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap",fontWeight:600}}>Vega {s.t.n}</div>
                    <div style={{height:3,background:"#f0f4f8",borderRadius:2,marginTop:2,overflow:"hidden"}}>
                      <div style={{width:s.score+"%",height:"100%",background:sc(s.score),borderRadius:2}}/>
                    </div>
                  </div>
                  <div style={{textAlign:"right",minWidth:44}}>
                    <div style={{fontSize:12,fontWeight:800,color:sc(s.score)}}>{s.score}%</div>
                    <div style={{fontSize:8,color:"#8aaabb"}}>{det?`${det.obtenidos}/${det.maximos}pts`:""}</div>
                  </div>
                </div>
                {(()=>{
                  // franja breakdown for this tienda
                  const tevs=Object.values(regs).filter(r=>r.tiendaId===s.t.id&&!r.anulado).flatMap(r=>r.evidencias||[]);
                  const fOro=tevs.filter(e=>toMin(e.hora)<=toMin("08:00")).length;
                  const fPlata=tevs.filter(e=>toMin(e.hora)>toMin("08:00")&&toMin(e.hora)<=toMin("09:00")).length;
                  const fBronce=tevs.filter(e=>toMin(e.hora)>toMin("09:00")&&toMin(e.hora)<=toMin("10:00")).length;
                  const fFuera=tevs.filter(e=>toMin(e.hora)>toMin("10:00")).length;
                  const tTotal=tevs.length||1;
                  return(
                  <div className="rank-tip" style={{display:"none",position:"absolute",bottom:"calc(100% + 6px)",left:0,right:0,background:"#1a2f4a",color:"#fff",fontSize:10,padding:"10px 12px",borderRadius:10,zIndex:30,lineHeight:1.6,boxShadow:"0 4px 16px rgba(0,0,0,.3)"}}>
                    <div style={{fontWeight:800,marginBottom:4,fontSize:11}}>Vega {s.t.n} · {s.score}% eficiencia</div>
                    <div style={{marginBottom:6,color:"#8aaabb"}}>{det.obtenidos}/{det.maximos} pts · {s.t.f}</div>
                    <div style={{borderTop:"1px solid rgba(255,255,255,.15)",paddingTop:6,marginTop:2}}>
                      <div style={{fontSize:9,color:"#8aaabb",marginBottom:4,fontWeight:700}}>DISTRIBUCIÓN DE HORARIO</div>
                      <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(200px,1fr))",gap:4}}>
                        <div style={{display:"flex",alignItems:"center",gap:4}}><span>🥇</span><span>ORO: {fOro} ({Math.round(fOro/tTotal*100)}%)</span></div>
                        <div style={{display:"flex",alignItems:"center",gap:4}}><span>🥈</span><span>PLATA: {fPlata} ({Math.round(fPlata/tTotal*100)}%)</span></div>
                        <div style={{display:"flex",alignItems:"center",gap:4}}><span>🥉</span><span>BRONCE: {fBronce} ({Math.round(fBronce/tTotal*100)}%)</span></div>
                        <div style={{display:"flex",alignItems:"center",gap:4,color:fFuera>0?"#f17e7e":"inherit"}}><span>🔴</span><span>FUERA: {fFuera} ({Math.round(fFuera/tTotal*100)}%)</span></div>
                      </div>
                      {/* stacked bar */}
                      <div style={{height:6,borderRadius:3,overflow:"hidden",display:"flex",marginTop:8}}>
                        {fOro>0&&<div style={{width:(fOro/tTotal*100)+"%",background:"#f6a623"}}/>}
                        {fPlata>0&&<div style={{width:(fPlata/tTotal*100)+"%",background:"#74b9ff"}}/>}
                        {fBronce>0&&<div style={{width:(fBronce/tTotal*100)+"%",background:"#a29bfe"}}/>}
                        {fFuera>0&&<div style={{width:(fFuera/tTotal*100)+"%",background:"#d63031"}}/>}
                      </div>
                    </div>
                    <div style={{position:"absolute",bottom:-5,left:20,width:10,height:10,background:"#1a2f4a",transform:"rotate(45deg)",borderRadius:1}}/>
                  </div>
                  );
                })()}
              </div>
              );
            })}
          </div>
          ))}
        </div>

        {/* ranking completo */}
        <div style={{...S.card,overflow:"hidden"}}>
          <div style={{padding:"12px 16px",borderBottom:"1px solid #f0f4f8",fontWeight:800,fontSize:13,color:"#1a2f4a"}}>🏅 RANKING MENSUAL COMPLETO</div>
          <div style={{overflowX:"auto"}}>
            <table style={{width:"100%",borderCollapse:"collapse",fontSize:12}}>
              <thead>
                <tr style={{background:"#f8fafc"}}>
                  {["#","TIENDA","FMT",...semanasDelMes.map(s=>s.label),"MES","TIER"].map((h,i)=>(
                    <th key={i} style={{padding:"9px 10px",textAlign:i>2?"center":"left",color:"#5a7a9a",fontWeight:700,fontSize:9,letterSpacing:".05em",borderBottom:"1px solid #e9eef5",whiteSpace:"nowrap"}}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {sorted.map(({t:ti,score},i)=>{
                  const fc=FMT[ti.f];const tier=getTier(score);
                  return(
                    <tr key={ti.id} style={{borderBottom:"1px solid #f5f7fa"}}>
                      <td style={{padding:"8px 10px",fontWeight:800,color:i<3?"#f6a623":"#b2bec3",fontSize:i<3?13:11}}>{i===0?"🥇":i===1?"🥈":i===2?"🥉":i+1}</td>
                      <td style={{padding:"8px 10px",fontWeight:700,color:"#1a2f4a",whiteSpace:"nowrap",fontSize:11}}>Vega {ti.n}</td>
                      <td style={{padding:"8px 10px"}}><span style={S.pill(fc.c,fc.bg)}>{ti.f.slice(0,3)}</span></td>
                      {semanasDelMes.map(s=>{const v=calcSemana(ti.id,s);return<td key={s.label} style={{padding:"8px 10px",textAlign:"center"}}>{v!==null?<span style={{fontSize:11,fontWeight:700,color:sc(v)}}>{v}%</span>:<span style={{color:"#d1d5db"}}>—</span>}</td>;})}
                      <td style={{padding:"8px 10px",textAlign:"center",background:sb(score)}}>
                        {(()=>{
                          const det2=scoresMes.find(s=>s.t.id===ti.id);
                          return score!==null
                            ?<div style={{display:"flex",flexDirection:"column",alignItems:"center",gap:1}}>
                                <span style={{fontWeight:800,fontSize:12,color:sc(score)}}>{score}%</span>
                                {det2&&<span style={{fontSize:8,color:"#8aaabb"}}>{det2.obtenidos}/{det2.maximos}pts</span>}
                              </div>
                            :<span style={{color:"#b2bec3"}}>—</span>;
                        })()}
                      </td>
                      <td style={{padding:"8px 10px",textAlign:"center"}}><span style={{fontSize:12}}>{tier.icon}</span><div style={{fontSize:8,fontWeight:700,color:tier.c}}>{tier.label}</div></td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
          </div>
        </div>{/* fin OPERATIVO */}
      </div>
    );
  };

  /* ══ TAB CONFIG ══ */
  /* ══ renderUsuarios — módulo independiente del sidebar ══ */
  const renderUsuarios=()=>{
    /* Estado del dropdown — qué módulo está seleccionado */
    const USR_MODS=[
      {id:"usuarios", label:"Usuarios",
        ico:<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75"/></svg>},
      {id:"areas",    label:"Áreas",
        ico:<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z"/><polyline points="9,22 9,12 15,12 15,22"/></svg>},
      {id:"roles",    label:"Roles",
        ico:<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>},
      {id:"permisos", label:"Permisos",
        ico:<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0110 0v4"/><circle cx="12" cy="16" r="1.5"/></svg>},
      {id:"log",      label:"Log de accesos",
        ico:<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0110 0v4"/></svg>},
      {id:"bloqueos", label:"Bloqueos",
        ico:<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="4.93" y1="4.93" x2="19.07" y2="19.07"/></svg>},
    ];

    const ROL_CFG_U={admin:{label:"Admin",c:"#f6a623",bg:"#fff8ec"},coordinador:{label:"Coordinador",c:"#6C6EF5",bg:"#EEEFFE"},ejecutor:{label:"Ejecutor",c:"#00b5b4",bg:"#e0fafa"},auditor:{label:"Auditor",c:"#0984e3",bg:"#e6f1fb"},visor:{label:"Visor",c:"#8aaabb",bg:"#f0f4f8"}};
    const ALCANCE_LABELS={odt_asignadas:"ODT asignadas",area:"Área",zona:"Zona",tiendas_asignadas:"Tiendas asignadas",global:"Global",solo_lectura:"Solo lectura"};
    const PERMISOS_MODULOS={
      diseno:{label:"Diseño / ODT",acciones:[
        {id:"crear",label:"Crear ODT"},{id:"verTodo",label:"Ver todas las ODT"},{id:"verAsignadas",label:"Ver ODT asignadas/propias"},
        {id:"editarBrief",label:"Editar brief"},{id:"asignar",label:"Asignar/Reasignar"},{id:"enProceso",label:"Cambiar a En proceso"},
        {id:"enviarAprobacion",label:"Enviar a aprobación"},{id:"aprobar",label:"Aprobar/Observar"},{id:"entregar",label:"Marcar entregado"},
        {id:"cancelar",label:"Cancelar ODT"},{id:"notificar",label:"Notificar WA/Correo"}]},
      tiendas:{label:"Tiendas",acciones:[
        {id:"ver",label:"Ver tiendas"},{id:"crear",label:"Crear tienda"},{id:"editar",label:"Editar tienda"},
        {id:"inactivar",label:"Inactivar tienda"},{id:"coordenadas",label:"Gestionar coordenadas"},{id:"responsables",label:"Gestionar responsables"}]},
      auditoria:{label:"Auditoría",acciones:[
        {id:"registrar",label:"Registrar auditoría"},{id:"verReporte",label:"Ver reporte"},{id:"editar",label:"Editar registro"},
        {id:"exportarPdf",label:"Exportar PDF"}]},
      usuarios:{label:"Usuarios",acciones:[
        {id:"ver",label:"Ver usuarios"},{id:"crear",label:"Crear usuario"},{id:"editar",label:"Editar usuario"},
        {id:"resetBloqueo",label:"Reset bloqueo"},{id:"editarPermisos",label:"Editar permisos"}]},
    };
    const DOC_CFG={dni:{label:"DNI",ph:"12345678",hint:"8 dígitos",min:8,max:8,alpha:false},ruc:{label:"RUC",ph:"20123456789",hint:"11 dígitos",min:11,max:11,alpha:false},ce:{label:"Carnet Extranjería",ph:"CE12345678",hint:"8–12 alfanum.",min:8,max:12,alpha:true},cod:{label:"Código interno",ph:"VEGA2024RR",hint:"8–12 alfanum.",min:8,max:12,alpha:true}};
    const CARGOS_CON_TIENDA=["Gerente de Tienda","Jefe de Tienda"];
    const AREA_LEGACY_MAP={"Trade Marketing":"marketing","trade marketing":"marketing","Marketing":"marketing","Operaciones":"operaciones","Comercial":"comercial"};
    const docCfg=DOC_CFG[newUsuario.tipoDoc]||DOC_CFG.dni;
    const areaActiva=areas.filter(a=>a.activa!==false);
    const areaIdNorm=AREA_LEGACY_MAP[newUsuario.area]||newUsuario.area;
    const areaSelObj=areas.find(a=>a.id===areaIdNorm||a.nombre?.toLowerCase()===areaIdNorm?.toLowerCase());
    const cargosDisp=(areaSelObj?.cargos||[]).filter(c=>c.activo!==false);
    const needsTienda=CARGOS_CON_TIENDA.includes(newUsuario.cargo);
    const dniLen=(newUsuario.dni||"").length;
    const dniOk=dniLen>=docCfg.min&&dniLen<=docCfg.max;
    const activeMod=USR_MODS.find(m=>m.id===usrTab)||null;

    return(
    <div style={{padding:"16px"}}>
      {/* ── FIX_RUTA_MODULOS_MULTISELECT_20260520 — Dropdown ••• Gestión de Usuarios (reemplaza tabs horizontales) ── */}
      <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:16}}>
        {/* Dropdown ••• */}
        <div style={{position:"relative",display:"inline-block"}}>
          <button
            onClick={()=>setDdUsrOpen(o=>!o)}
            style={{display:"inline-flex",alignItems:"center",gap:7,padding:"8px 15px",
              borderRadius:50,border:ddUsrOpen||usrTab?"1.5px solid #6C6EF5":"1.5px solid #E2E8F0",
              background:"#fff",cursor:"pointer",fontSize:12,fontWeight:600,
              fontFamily:"inherit",color:ddUsrOpen||usrTab?"#6C6EF5":"#1a2f4a",transition:"all .15s"}}>
            {/* ••• icon */}
            <span style={{display:"flex",gap:3,alignItems:"center"}}>
              {[0,1,2].map(i=>(<span key={i} style={{width:4,height:4,borderRadius:"50%",background:"currentColor",display:"block"}}/>))}
            </span>
            <span>{usrTab?USR_MODS.find(m=>m.id===usrTab)?.label||"Gestión de Usuarios":"Gestión de Usuarios"}</span>
            <svg style={{transition:"transform .2s",transform:ddUsrOpen?"rotate(180deg)":"rotate(0deg)"}} width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><polyline points="6 9 12 15 18 9"/></svg>
          </button>
          {/* Menú dropdown */}
          {ddUsrOpen&&(
            <div style={{position:"absolute",top:"calc(100% + 5px)",left:0,minWidth:210,
              background:"#fff",borderRadius:11,border:"1.5px solid #E2E8F0",
              boxShadow:"0 8px 28px rgba(0,0,0,.12)",zIndex:300,overflow:"hidden"}}>
              <div style={{padding:"8px 13px 6px",fontSize:9,fontWeight:700,
                color:"#8aaabb",letterSpacing:".07em",textTransform:"uppercase",
                borderBottom:"1px solid #F1F5F9",display:"flex",alignItems:"center",gap:5}}>
                Seleccione módulo
                <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="#00b894" strokeWidth="2.5" strokeLinecap="round"><polyline points="20 6 9 17 4 12"/></svg>
              </div>
              {USR_MODS.map(m=>(
                <button key={m.id}
                  onClick={()=>{setUsrTab(m.id);setDdUsrOpen(false);setShowNUsuario(false);}}
                  style={{width:"100%",padding:"10px 14px",border:"none",
                    borderBottom:"1px solid #F8FAFC",
                    background:usrTab===m.id?"#F5F4FF":"#fff",
                    display:"flex",alignItems:"center",justifyContent:"space-between",
                    cursor:"pointer",fontSize:12,fontWeight:usrTab===m.id?700:500,
                    color:usrTab===m.id?"#6C6EF5":"#1a2f4a",fontFamily:"inherit",transition:"background .1s"}}>
                  {m.label}
                  {React.cloneElement(m.ico,{stroke:usrTab===m.id?"#6C6EF5":"#8aaabb",width:"14",height:"14"})}
                </button>
              ))}
            </div>
          )}
          {/* Click fuera cierra el dropdown — overlay transparente */}
          {ddUsrOpen&&(
            <div
              style={{position:"fixed",inset:0,zIndex:299}}
              onClick={()=>setDdUsrOpen(false)}
            />
          )}
        </div>
        {/* Botón acción contextual — aparece junto al dropdown según módulo */}
        {usrTab&&!["log","permisos","bloqueos"].includes(usrTab)&&(
          <button onClick={()=>setShowNUsuario(true)}
            style={{padding:"8px 14px",borderRadius:50,border:"none",
              background:"#1a2f4a",color:"#fff",cursor:"pointer",fontWeight:600,
              fontSize:11,display:"inline-flex",alignItems:"center",gap:5,fontFamily:"inherit"}}>
            <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.5" strokeLinecap="round" aria-hidden="true"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
            {usrTab==="usuarios"?"Nuevo usuario":usrTab==="roles"?"Nuevo rol":"Nueva área"}
          </button>
        )}
      </div>

      {/* ── CONTENIDO USUARIOS ── */}
      {usrTab==="usuarios"&&(()=>{
        const filtrados=(busqUsuario||"")?usuarios.filter(u=>u.nombre?.toLowerCase().includes(busqUsuario.toLowerCase())||u.dni?.toLowerCase().includes(busqUsuario.toLowerCase())||u.cargo?.toLowerCase().includes(busqUsuario.toLowerCase())||u.area?.toLowerCase().includes(busqUsuario.toLowerCase())):usuarios;
        return(
        <div>
          <div style={{fontSize:11,color:"#8aaabb",marginBottom:10}}>{usuarios.filter(u=>u.activo!==false).length} activos · {usuarios.length} totales</div>
          <div style={{position:"relative",marginBottom:12}}>
            <svg style={{position:"absolute",left:11,top:"50%",transform:"translateY(-50%)"}} width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#8aaabb" strokeWidth="2" strokeLinecap="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
            <input placeholder="Buscar por nombre, credencial, cargo o área..." value={busqUsuario||""} onChange={e=>setBusqUsuario(e.target.value)} style={{...S.inp,paddingLeft:34,fontSize:13}}/>
          </div>
          {showNUsuario&&(
            <div style={{...S.card,padding:"16px",marginBottom:14,border:"1.5px solid #00b5b4"}}>
              <div style={{fontWeight:700,fontSize:13,color:"#1a2f4a",marginBottom:14,display:"flex",alignItems:"center",gap:8}}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#00b5b4" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
                {newUsuario.editId?"Editar usuario":"Nuevo usuario"}
              </div>
              <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10,marginBottom:14}}>
                <div><label style={S.lbl}>NOMBRE COMPLETO *</label><input value={newUsuario.nombre} onChange={e=>setNewUsuario(p=>({...p,nombre:e.target.value}))} placeholder="Ej: Roberto Ruesta" style={S.inp}/></div>
                <div><label style={S.lbl}>EMAIL</label><input type="email" value={newUsuario.email||""} onChange={e=>setNewUsuario(p=>({...p,email:e.target.value}))} placeholder="nombre@empresa.pe" style={S.inp}/></div>
                <div style={{gridColumn:"1/-1"}}>
                  <label style={S.lbl}>CONTACTO (MÓVIL / WHATSAPP)</label>
                  <input type="tel" value={newUsuario.whatsapp||""} onChange={e=>setNewUsuario(p=>({...p,whatsapp:e.target.value.replace(/[^0-9]/g,"").slice(0,15),telefono:e.target.value.replace(/[^0-9]/g,"").slice(0,15)}))} placeholder="51987654321" style={S.inp}/>
                </div>
              </div>
              <div style={{borderTop:"1px solid #f0f4f8",paddingTop:14,marginBottom:14}}>
                <div style={{fontSize:12,fontWeight:700,color:"#5a7a9a",marginBottom:10,display:"flex",alignItems:"center",gap:6}}>
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0110 0v4"/></svg>
                  CREDENCIAL DE ACCESO
                </div>
                <div style={{display:"flex",gap:6,marginBottom:10}}>
                  {Object.entries(DOC_CFG).map(([k,v])=>{const on=newUsuario.tipoDoc===k;return(<button key={k} onClick={()=>setNewUsuario(p=>({...p,tipoDoc:k,dni:""}))} style={{flex:1,padding:"8px 4px",borderRadius:9,border:`1.5px solid ${on?"#1a2f4a":"#e2e8f0"}`,background:on?"#1a2f4a":"#f8fafc",color:on?"#fff":"#5a7a9a",cursor:"pointer",fontSize:10,fontWeight:600,textAlign:"center"}}>{v.label}</button>);})}
                </div>
                <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10}}>
                  <div>
                    <label style={S.lbl}>NÚMERO *</label>
                    <input value={newUsuario.dni||""} maxLength={docCfg.max} onChange={e=>{const v=docCfg.alpha?e.target.value.replace(/[^a-zA-Z0-9]/g,"").slice(0,docCfg.max).toUpperCase():e.target.value.replace(/[^0-9]/g,"").slice(0,docCfg.max);setNewUsuario(p=>({...p,dni:v}));}} placeholder={docCfg.ph} style={{...S.inp,fontFamily:"monospace",letterSpacing:2}}/>
                    <div style={{fontSize:9,color:"#8aaabb",marginTop:2}}>{docCfg.hint}</div>
                  </div>
                  <div style={{padding:"10px 12px",borderRadius:10,background:dniOk?"#e0fafa":dniLen>0?"#fff8ec":"#f8fafc",border:`1px solid ${dniOk?"#00b5b4":dniLen>0?"#f6a623":"#e2e8f0"}`,display:"flex",alignItems:"center",gap:8}}>
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={dniOk?"#00b5b4":dniLen>0?"#f6a623":"#b2bec3"} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0110 0v4"/></svg>
                    <div>
                      <div style={{fontSize:11,fontWeight:700,color:dniOk?"#085041":dniLen>0?"#854F0B":"#8aaabb"}}>{dniOk?"Credencial válida":dniLen>0?`Mín. ${docCfg.min} chars`:"Ingresa el número"}</div>
                      <div style={{fontSize:10,color:dniOk?"#085041":"#b2bec3"}}>{dniOk?`Código: ${newUsuario.dni}`:`${dniLen}/${docCfg.max}`}</div>
                    </div>
                  </div>
                </div>
              </div>
              <div style={{borderTop:"1px solid #f0f4f8",paddingTop:14,marginBottom:14}}>
                <div style={{fontSize:12,fontWeight:700,color:"#5a7a9a",marginBottom:10}}>ROL Y ACCESO</div>
                <div style={{marginBottom:10}}>
                  <label style={S.lbl}>ROL *</label>
                  <select value={newUsuario.rol||"auditor"} onChange={e=>setNewUsuario(p=>({...p,rol:e.target.value}))} style={{...S.inp,cursor:"pointer",borderColor:ROL_CFG_U[newUsuario.rol]?.c||"#e2e8f0",background:ROL_CFG_U[newUsuario.rol]?.bg||"#f8fafc",color:ROL_CFG_U[newUsuario.rol]?.c||"#1a2f4a",fontWeight:600}}>
                    {roles.filter(r=>r.activo!==false).map(r=><option key={r.id} value={r.id}>{r.nombre}</option>)}
                  </select>
                  <div style={{fontSize:10,color:ROL_CFG_U[newUsuario.rol]?.c||"#8aaabb",marginTop:3}}>{roles.find(r=>r.id===newUsuario.rol)?.desc||""}</div>
                </div>
                <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10,marginBottom:needsTienda?10:0}}>
                  <div>
                    <label style={S.lbl}>ÁREA *</label>
                    <select value={newUsuario.area||""} onChange={e=>setNewUsuario(p=>({...p,area:e.target.value,cargo:"",tiendaId:""}))} style={{...S.inp,cursor:"pointer"}}>
                      <option value="">Seleccionar área</option>
                      {areaActiva.map(a=><option key={a.id} value={a.id}>{a.nombre}</option>)}
                    </select>
                  </div>
                  <div>
                    <label style={S.lbl}>CARGO</label>
                    <select value={newUsuario.cargo||""} onChange={e=>setNewUsuario(p=>({...p,cargo:e.target.value,tiendaId:""}))} style={{...S.inp,cursor:"pointer"}} disabled={!newUsuario.area}>
                      <option value="">{newUsuario.area?"Seleccionar cargo":"Primero elige área"}</option>
                      {cargosDisp.map(c=><option key={c.id} value={c.nombre}>{c.nombre}</option>)}
                    </select>
                  </div>
                </div>
                {needsTienda&&(
                  <div>
                    <label style={S.lbl}>TIENDA ASIGNADA *</label>
                    <select value={newUsuario.tiendaId||""} onChange={e=>setNewUsuario(p=>({...p,tiendaId:e.target.value}))} style={{...S.inp,cursor:"pointer",borderColor:"#0984e355",background:"#e6f1fb"}}>
                      <option value="">Seleccionar tienda</option>
                      {tiendas.filter(t=>t.activa).map(t=><option key={t.id} value={t.id}>Vega {nomTienda(t)}</option>)}
                    </select>
                  </div>
                )}
                <div style={{marginTop:10}}>
                  <label style={S.lbl}>ALCANCE *</label>
                  <select value={newUsuario.alcance||""} onChange={e=>setNewUsuario(p=>({...p,alcance:e.target.value}))} style={{...S.inp,cursor:"pointer"}}>
                    <option value="">Seleccionar alcance</option>
                    <option value="odt_asignadas">ODT asignadas</option>
                    <option value="area">Área</option>
                    <option value="zona">Zona</option>
                    <option value="tiendas_asignadas">Tiendas asignadas</option>
                    <option value="global">Global</option>
                    <option value="solo_lectura">Solo lectura</option>
                  </select>
                  <div style={{fontSize:9,color:"#8aaabb",marginTop:3}}>Define cuánto del módulo puede ver/operar este usuario.</div>
                </div>
              </div>
              <div style={{borderTop:"1px solid #f0f4f8",paddingTop:14,marginBottom:14}}>
                <div style={{fontSize:12,fontWeight:700,color:"#5a7a9a",marginBottom:10}}>PERMISOS POR MÓDULO</div>
                <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10}}>
                  {Object.entries(PERMISOS_MODULOS).map(([modId,modDef])=>(
                    <div key={modId} style={{background:"#f8fafc",border:"1px solid #e2e8f0",borderRadius:10,padding:"9px 11px"}}>
                      <div style={{fontWeight:700,fontSize:11,color:"#1a2f4a",marginBottom:6}}>{modDef.label}</div>
                      {modDef.acciones.map(acc=>{
                        const checked=!!newUsuario.permisos?.[modId]?.[acc.id];
                        return(
                          <label key={acc.id} style={{display:"flex",alignItems:"center",gap:6,fontSize:11,color:"#5a7a9a",padding:"2px 0",cursor:"pointer"}}>
                            <input type="checkbox" checked={checked} onChange={e=>setNewUsuario(p=>({...p,permisos:{...p.permisos,[modId]:{...(p.permisos?.[modId]||{}),[acc.id]:e.target.checked}}}))}/>
                            {acc.label}
                          </label>
                        );
                      })}
                    </div>
                  ))}
                </div>
              </div>
              <div style={{display:"flex",gap:8}}>
                <button onClick={async()=>{
                  if(!newUsuario.nombre.trim()) return showToast("Ingresa el nombre completo");
                  if(!dniOk) return showToast(`Credencial: ${docCfg.min}–${docCfg.max} caracteres`);
                  if(!newUsuario.area) return showToast("Selecciona el área");
                  const data={nombre:newUsuario.nombre.trim(),rol:newUsuario.rol,tipoDoc:newUsuario.tipoDoc,dni:newUsuario.dni,email:newUsuario.email||"",whatsapp:newUsuario.whatsapp||"",telefono:newUsuario.whatsapp||"",area:newUsuario.area||"",cargo:newUsuario.cargo||"",tiendaId:newUsuario.tiendaId||"",alcance:newUsuario.alcance||"",permisos:newUsuario.permisos||{},activo:true};
                  if(newUsuario.editId){await setDoc(doc(db,"usuarios",newUsuario.editId),data,{merge:true});showToast("Usuario actualizado");}
                  else{const ref=doc(collection(db,"usuarios"));await setDoc(ref,{...data,ultimoAcceso:null});showToast("Usuario registrado");}
                  setShowNUsuario(false);setNewUsuario(NU_INIT);
                }} style={{flex:1,padding:"11px",borderRadius:50,border:"none",background:"#1a2f4a",color:"#fff",cursor:"pointer",fontWeight:700,fontSize:13}}>
                  {newUsuario.editId?"Guardar cambios":"Registrar usuario"}
                </button>
                <button onClick={()=>{setShowNUsuario(false);setNewUsuario(NU_INIT);}} style={{padding:"11px 18px",borderRadius:50,border:"1px solid #e2e8f0",background:"#fff",color:"#5a7a9a",cursor:"pointer",fontSize:13}}>Cancelar</button>
              </div>
            </div>
          )}
          {!filtrados.length?<div style={{textAlign:"center",padding:"32px",color:"#8aaabb",fontSize:13}}>{busqUsuario?"Sin resultados":"Sin usuarios registrados."}</div>:
          filtrados.map(u=>{
            const rc=ROL_CFG_U[u.rol]||{label:u.rol||"?",c:"#8aaabb",bg:"#f0f4f8"};
            const initials=(u.nombre||"?").split(" ").slice(0,2).map(w=>w[0]).join("").toUpperCase();
            const AREA_LEG={"Trade Marketing":"marketing","trade marketing":"marketing"};
            const areaIdR=AREA_LEG[u.area]||u.area;
            const areaNombre=areas.find(a=>a.id===areaIdR||a.nombre?.toLowerCase()===areaIdR?.toLowerCase())?.nombre||u.area||"";
            const tiendaNombre=u.tiendaId?tiendas.find(t=>t.id===u.tiendaId)?.n:"";
            return(
              <div key={u.id} style={{...S.card,padding:"12px 16px",marginBottom:8,display:"flex",alignItems:"center",gap:10,opacity:u.activo===false?0.5:1}}>
                <div style={{width:40,height:40,borderRadius:11,background:rc.bg,border:`1.5px solid ${rc.c}33`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:13,fontWeight:700,color:rc.c,flexShrink:0}}>{initials}</div>
                <div style={{flex:1,minWidth:0}}>
                  <div style={{fontWeight:700,fontSize:13,color:u.activo===false?"#94a3b8":"#1a2f4a",display:"flex",alignItems:"center",gap:5,flexWrap:"wrap",marginBottom:3}}>
                    {u.nombre}
                    <span style={{padding:"1px 7px",borderRadius:20,fontSize:10,fontWeight:600,background:rc.bg,color:rc.c,border:`1px solid ${rc.c}33`}}>{rc.label}</span>
                    {u.activo===false&&<span style={{fontSize:9,color:"#dc2626",background:"#fff1f2",padding:"1px 6px",borderRadius:10,fontWeight:700}}>PAUSADO</span>}
                    {u.bloqueadoHasta&&new Date(u.bloqueadoHasta)>new Date()&&<span style={{fontSize:9,color:"#854F0B",background:"#FAEEDA",padding:"1px 6px",borderRadius:10,fontWeight:700}}>BLOQUEADO</span>}
                  </div>
                  <div style={{fontSize:10,color:"#8aaabb",display:"flex",gap:5,flexWrap:"wrap",alignItems:"center"}}>
                    <span style={{fontFamily:"monospace"}}>{(u.tipoDoc||"DNI").toUpperCase()} ••••{(u.dni||"").slice(-4)}</span>
                    {areaNombre&&<span style={{background:"#f0edff",color:"#6c5ce7",padding:"1px 7px",borderRadius:10,fontWeight:600}}>{areaNombre}</span>}
                    {u.cargo&&<span style={{background:"#f0f4f8",color:"#5a7a9a",padding:"1px 7px",borderRadius:10}}>{u.cargo}</span>}
                    {u.alcance&&<span style={{background:"#fff7e6",color:"#d97706",padding:"1px 7px",borderRadius:10}}>{ALCANCE_LABELS[u.alcance]||u.alcance}</span>}
                    {tiendaNombre&&<span style={{background:"#e6f1fb",color:"#0C447C",padding:"1px 7px",borderRadius:10}}>Vega {tiendaNombre}</span>}
                  </div>
                </div>
                <button onClick={()=>{
                  const AREA_LEGACY={"Trade Marketing":"marketing","trade marketing":"marketing","Marketing":"marketing","Operaciones":"operaciones","Comercial":"comercial"};
                  const rawArea=u.area||"";
                  const areaId=areas.find(a=>a.id===rawArea)?.id||areas.find(a=>a.nombre?.toLowerCase()===rawArea.toLowerCase())?.id||AREA_LEGACY[rawArea]||rawArea;
                  setNewUsuario({nombre:u.nombre||"",rol:u.rol||"auditor",tipoDoc:u.tipoDoc||"dni",dni:u.dni||"",email:u.email||"",whatsapp:u.whatsapp||u.telefono||"",telefono:u.whatsapp||u.telefono||"",area:areaId,cargo:u.cargo||"",tiendaId:u.tiendaId||"",alcance:u.alcance||"",permisos:u.permisos||{},editId:u.id});
                  setShowNUsuario(true);
                }} style={{padding:"7px 9px",borderRadius:9,border:"1px solid #c8d8e8",background:"#f8fafc",color:"#5a7a9a",cursor:"pointer"}}>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
                </button>
                <button onClick={async()=>{await setDoc(doc(db,"usuarios",u.id),{activo:u.activo===false},{merge:true});showToast(u.activo===false?"Usuario activado":"Usuario pausado");}} style={{padding:"6px 11px",borderRadius:9,border:`1px solid ${u.activo===false?"#bbf7d0":"#fecaca"}`,background:u.activo===false?"#f0fdf4":"#fff1f2",color:u.activo===false?"#16a34a":"#dc2626",cursor:"pointer",fontSize:11,fontWeight:700}}>{u.activo===false?"Activar":"Pausar"}</button>
                {u.bloqueadoHasta&&new Date(u.bloqueadoHasta)>new Date()&&<button onClick={async()=>{await setDoc(doc(db,"usuarios",u.id),{bloqueadoHasta:null,intentosFallidos:0},{merge:true});showToast("Usuario desbloqueado");}} style={{padding:"6px 9px",borderRadius:9,border:"1px solid #FAC775",background:"#FAEEDA",color:"#633806",cursor:"pointer",fontSize:10,fontWeight:700,whiteSpace:"nowrap"}}>Desbloquear</button>}
                {u.whatsapp&&<button onClick={()=>{setWaModal({msg:`Hola ${u.nombre}, se detectó un acceso no autorizado. Por favor verifica.`,numero:u.whatsapp,nombre:u.nombre});}} style={{padding:"7px 9px",borderRadius:9,border:"1.5px solid #25D366",background:"#e8faf5",color:"#085041",cursor:"pointer"}}><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z"/></svg></button>}
                <button onClick={()=>{if(window.confirm(`¿Eliminar a ${u.nombre}?`))deleteUsuario(u.id);}} style={{padding:"7px 9px",borderRadius:9,border:"1.5px solid #fecaca",background:"#fff1f2",color:"#dc2626",cursor:"pointer"}}><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><polyline points="3,6 5,6 21,6"/><path d="M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a1 1 0 011-1h4a1 1 0 011 1v2"/></svg></button>
              </div>
            );
          })}
        </div>
        );
      })()}

      {/* ── CONTENIDO ROLES ── */}
      {usrTab==="roles"&&(()=>{
        return(
        <div>
          {showNUsuario&&(
            <div style={{...S.card,padding:"14px",marginBottom:12,border:"1.5px solid #6C6EF5"}}>
              <div style={{fontWeight:700,fontSize:13,color:"#1a2f4a",marginBottom:12}}>{newRol.editId?"Editar rol":"Nuevo rol"}</div>
              <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10,marginBottom:10}}>
                <div><label style={S.lbl}>NOMBRE DEL ROL *</label><input value={newRol.nombre} onChange={e=>setNewRol(p=>({...p,nombre:e.target.value}))} placeholder="Ej: Supervisor" style={S.inp}/></div>
                <div>
                  <label style={S.lbl}>COLOR</label>
                  <div style={{display:"flex",gap:6,marginTop:4}}>
                    {["#f6a623","#6C6EF5","#00b5b4","#0984e3","#e17055","#a29bfe","#fd79a8","#55efc4"].map(c=>(
                      <div key={c} onClick={()=>setNewRol(p=>({...p,color:c}))} style={{width:22,height:22,borderRadius:"50%",background:c,cursor:"pointer",border:`2.5px solid ${newRol.color===c?"#1a2f4a":"transparent"}`}}/>
                    ))}
                  </div>
                </div>
              </div>
              <div style={{marginBottom:10}}><label style={S.lbl}>DESCRIPCIÓN</label><input value={newRol.desc} onChange={e=>setNewRol(p=>({...p,desc:e.target.value}))} placeholder="Ej: Acceso a reportes de su área" style={S.inp}/></div>
              <div style={{display:"flex",gap:8}}>
                <button onClick={async()=>{
                  if(!newRol.nombre.trim()) return showToast("Ingresa el nombre del rol");
                  const id=newRol.editId||newRol.nombre.toLowerCase().replace(/\s+/g,"_");
                  await setDoc(doc(db,"roles",id),{nombre:newRol.nombre.trim(),desc:newRol.desc,color:newRol.color,sistema:false,activo:true},{merge:true});
                  showToast("Rol guardado");setShowNUsuario(false);setNewRol({nombre:"",desc:"",color:"#6C6EF5",editId:null});
                }} style={{flex:1,padding:"10px",borderRadius:50,border:"none",background:"#1a2f4a",color:"#fff",cursor:"pointer",fontWeight:700,fontSize:12}}>{newRol.editId?"Guardar cambios":"Crear rol"}</button>
                <button onClick={()=>{setShowNUsuario(false);setNewRol({nombre:"",desc:"",color:"#6C6EF5",editId:null});}} style={{padding:"10px 16px",borderRadius:50,border:"1px solid #e2e8f0",background:"#fff",color:"#5a7a9a",cursor:"pointer",fontSize:12}}>Cancelar</button>
              </div>
            </div>
          )}
          <div style={{fontSize:10,color:"#8aaabb",marginBottom:8,fontWeight:600,letterSpacing:".04em"}}>ROLES DEL SISTEMA — no eliminables</div>
          {roles.map(r=>{
            const usrCount=usuarios.filter(u=>u.rol===r.id).length;
            const clr=r.color||ROL_CFG_U[r.id]?.c||"#8aaabb";
            return(
              <div key={r.id} style={{...S.card,padding:"12px 14px",marginBottom:8,display:"flex",alignItems:"center",gap:10,opacity:r.activo===false?0.55:1}}>
                <div style={{width:8,height:40,borderRadius:3,background:clr,flexShrink:0}}/>
                <div style={{flex:1,minWidth:0}}>
                  <div style={{fontWeight:700,fontSize:13,color:"#1a2f4a",display:"flex",alignItems:"center",gap:6,marginBottom:2}}>
                    {r.nombre}
                    {r.sistema&&<span style={{fontSize:9,background:"#e8faf5",color:"#085041",padding:"1px 6px",borderRadius:10,fontWeight:700}}>Sistema</span>}
                    {r.activo===false&&<span style={{fontSize:9,background:"#fff1f2",color:"#dc2626",padding:"1px 6px",borderRadius:10,fontWeight:700}}>Inactivo</span>}
                  </div>
                  <div style={{fontSize:11,color:"#8aaabb"}}>{r.desc||""}</div>
                  <div style={{fontSize:10,color:"#b2bec3",marginTop:2}}>{usrCount} usuario{usrCount!==1?"s":""} asignado{usrCount!==1?"s":""}</div>
                </div>
                <button onClick={()=>{setNewRol({nombre:r.nombre,desc:r.desc||"",color:r.color||"#8aaabb",editId:r.id});setShowNUsuario(true);}} style={{padding:"6px 10px",borderRadius:9,border:"1px solid #c8d8e8",background:"#f8fafc",color:"#5a7a9a",cursor:"pointer",fontSize:11,fontWeight:600}}>Editar</button>
                <div onClick={async()=>{await setDoc(doc(db,"roles",r.id),{activo:r.activo===false},{merge:true});showToast(r.activo===false?"Rol activado":"Rol desactivado");}} style={{width:36,height:20,borderRadius:10,background:r.activo===false?"#e2e8f0":"#00b5b4",position:"relative",cursor:"pointer",flexShrink:0}}>
                  <div style={{width:16,height:16,borderRadius:"50%",background:"#fff",position:"absolute",top:2,left:r.activo===false?2:18,transition:"left .2s",boxShadow:"0 1px 3px rgba(0,0,0,.2)"}}/>
                </div>
              </div>
            );
          })}
        </div>
        );
      })()}

      {/* ── CONTENIDO ÁREAS ── */}
      {usrTab==="areas"&&(()=>{
        return(
        <div>
          {showNUsuario&&(
            <div style={{...S.card,padding:"14px",marginBottom:12,border:"1.5px solid #00b5b4"}}>
              <div style={{fontWeight:700,fontSize:13,color:"#1a2f4a",marginBottom:10}}>{newArea.editId?"Editar área":"Nueva área"}</div>
              <div style={{marginBottom:10}}><label style={S.lbl}>NOMBRE DEL ÁREA *</label><input value={newArea.nombre} onChange={e=>setNewArea(p=>({...p,nombre:e.target.value}))} placeholder="Ej: Logística" style={S.inp}/></div>
              <div style={{display:"flex",gap:8}}>
                <button onClick={async()=>{
                  if(!newArea.nombre.trim()) return showToast("Ingresa el nombre del área");
                  const id=newArea.editId||newArea.nombre.toLowerCase().replace(/\s+/g,"_").replace(/[áéíóú]/g,c=>({á:"a",é:"e",í:"i",ó:"o",ú:"u"}[c]||c));
                  await setDoc(doc(db,"areas",id),{nombre:newArea.nombre.trim(),activa:true,cargos:newArea.editId?(areas.find(a=>a.id===newArea.editId)?.cargos||[]):[]},{merge:true});
                  showToast("Área guardada");setShowNUsuario(false);setNewArea({nombre:"",editId:null});
                }} style={{flex:1,padding:"10px",borderRadius:50,border:"none",background:"#1a2f4a",color:"#fff",cursor:"pointer",fontWeight:700,fontSize:12}}>{newArea.editId?"Guardar cambios":"Crear área"}</button>
                <button onClick={()=>{setShowNUsuario(false);setNewArea({nombre:"",editId:null});}} style={{padding:"10px 16px",borderRadius:50,border:"1px solid #e2e8f0",background:"#fff",color:"#5a7a9a",cursor:"pointer",fontSize:12}}>Cancelar</button>
              </div>
            </div>
          )}
          {areas.map(a=>{
            const usrCount=usuarios.filter(u=>u.area===a.id||u.area===a.nombre).length;
            const isOpen=areaOpen===a.id;
            return(
              <div key={a.id} style={{...S.card,padding:0,marginBottom:8,overflow:"hidden",opacity:a.activa===false?0.55:1}}>
                <div style={{padding:"12px 14px",display:"flex",alignItems:"center",gap:10,cursor:"pointer"}} onClick={()=>setAreaOpen(isOpen?null:a.id)}>
                  <div style={{width:8,height:8,borderRadius:"50%",background:a.activa===false?"#b2bec3":"#00b5b4",flexShrink:0}}/>
                  <div style={{flex:1,minWidth:0}}>
                    <div style={{fontWeight:700,fontSize:13,color:"#1a2f4a",display:"flex",alignItems:"center",gap:6}}>
                      {a.nombre}
                      {a.activa===false&&<span style={{fontSize:9,background:"#fff1f2",color:"#dc2626",padding:"1px 6px",borderRadius:10,fontWeight:700}}>Inactiva</span>}
                    </div>
                    <div style={{fontSize:10,color:"#8aaabb"}}>{(a.cargos||[]).length} cargos · {usrCount} usuario{usrCount!==1?"s":""}</div>
                  </div>
                  <button onClick={e=>{e.stopPropagation();setNewArea({nombre:a.nombre,editId:a.id});setShowNUsuario(true);}} style={{padding:"5px 9px",borderRadius:8,border:"1px solid #c8d8e8",background:"#f8fafc",color:"#5a7a9a",cursor:"pointer",fontSize:11}}>Editar</button>
                  <div onClick={async e=>{e.stopPropagation();await setDoc(doc(db,"areas",a.id),{activa:a.activa===false},{merge:true});showToast(a.activa===false?"Área activada":"Área desactivada");}} style={{width:36,height:20,borderRadius:10,background:a.activa===false?"#e2e8f0":"#00b5b4",position:"relative",cursor:"pointer",flexShrink:0}}>
                    <div style={{width:16,height:16,borderRadius:"50%",background:"#fff",position:"absolute",top:2,left:a.activa===false?2:18,transition:"left .2s",boxShadow:"0 1px 3px rgba(0,0,0,.2)"}}/>
                  </div>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#94A3B8" strokeWidth="2" strokeLinecap="round" style={{transform:isOpen?"rotate(180deg)":"",transition:"transform .2s"}}><polyline points="6,9 12,15 18,9"/></svg>
                </div>
                {isOpen&&(
                  <div style={{borderTop:"1px solid #f0f4f8",background:"#f8fafc",padding:"10px 14px"}}>
                    <div style={{fontSize:10,fontWeight:700,color:"#8aaabb",marginBottom:8,display:"flex",alignItems:"center",justifyContent:"space-between",letterSpacing:".04em"}}>
                      CARGOS
                      <div style={{display:"flex",gap:6,alignItems:"center"}}>
                        {newCargo.areaId===a.id
                          ?<div style={{display:"flex",gap:6}}>
                            <input value={newCargo.nombre} onChange={e=>setNewCargo(p=>({...p,nombre:e.target.value}))} placeholder="Nombre del cargo" style={{...S.inp,padding:"5px 10px",fontSize:11,width:160}}/>
                            <button onClick={async()=>{
                              if(!newCargo.nombre.trim()) return;
                              const cargos=[...(a.cargos||[]),{id:"c"+Date.now(),nombre:newCargo.nombre.trim(),activo:true}];
                              await setDoc(doc(db,"areas",a.id),{cargos},{merge:true});
                              showToast("Cargo agregado");setNewCargo({areaId:null,nombre:""});
                            }} style={{padding:"5px 10px",borderRadius:8,border:"none",background:"#1a2f4a",color:"#fff",cursor:"pointer",fontSize:11,fontWeight:600,whiteSpace:"nowrap"}}>+ Agregar</button>
                            <button onClick={()=>setNewCargo({areaId:null,nombre:""})} style={{padding:"5px 8px",borderRadius:8,border:"1px solid #e2e8f0",background:"#fff",color:"#5a7a9a",cursor:"pointer",fontSize:11}}>✕</button>
                          </div>
                          :<button onClick={()=>setNewCargo({areaId:a.id,nombre:""})} style={{padding:"4px 8px",borderRadius:8,border:"1px solid #c8d8e8",background:"#fff",color:"#5a7a9a",cursor:"pointer",fontSize:10,display:"flex",alignItems:"center",gap:4}}>
                            <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
                            Agregar cargo
                          </button>
                        }
                      </div>
                    </div>
                    {(a.cargos||[]).length===0&&<div style={{fontSize:11,color:"#b2bec3",padding:"8px 0"}}>Sin cargos registrados</div>}
                    {(a.cargos||[]).map((c,ci)=>(
                      <div key={c.id||ci} style={{display:"flex",alignItems:"center",justifyContent:"space-between",padding:"7px 8px",borderRadius:8,background:ci%2===0?"#fff":"transparent",marginBottom:2,opacity:c.activo===false?0.5:1}}>
                        <span style={{fontSize:12,color:"#1a2f4a"}}>{c.nombre}</span>
                        <div style={{display:"flex",alignItems:"center",gap:6}}>
                          <span style={{fontSize:10,color:"#b2bec3"}}>{usuarios.filter(u=>u.cargo===c.nombre).length} usr</span>
                          <div onClick={async()=>{const cargos=(a.cargos||[]).map((x,xi)=>xi===ci?{...x,activo:x.activo===false}:x);await setDoc(doc(db,"areas",a.id),{cargos},{merge:true});}} style={{width:30,height:17,borderRadius:9,background:c.activo===false?"#e2e8f0":"#00b5b4",position:"relative",cursor:"pointer",flexShrink:0}}>
                            <div style={{width:13,height:13,borderRadius:"50%",background:"#fff",position:"absolute",top:2,left:c.activo===false?2:15,transition:"left .2s",boxShadow:"0 1px 2px rgba(0,0,0,.2)"}}/>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
        );
      })()}


      {/* ══ LOG DE ACCESOS — usrTab="log" ══ */}
      {usrTab==="log"&&isAdmin&&(()=>{
        // FIX_LOG_ACCESOS_HOOKS_20260530: sin hooks dentro de render condicional; evita React minified error #310.
        const logFiltroUser=logAccesoFiltroUser;
        const setLogFiltroUser=setLogAccesoFiltroUser;
        const logFiltroEstado=logAccesoFiltroEstado;
        const setLogFiltroEstado=setLogAccesoFiltroEstado;
        const logFiltroDias=logAccesoFiltroDias;
        const setLogFiltroDias=setLogAccesoFiltroDias;
        const hoy=new Date();
        const cutoff=new Date(hoy.getTime()-logFiltroDias*24*60*60*1000);
        const normTxt=v=>String(v||"").toLowerCase();
        const fechaLog=l=>l.timestamp?new Date(l.timestamp):null;
        const horaCorta=d=>d?d.toLocaleTimeString("es-PE",{hour:"2-digit",minute:"2-digit",hour12:false}):"--:--";
        const fechaCorta=d=>d?d.toLocaleDateString("es-PE",{day:"2-digit",month:"2-digit"}):"--/--";
        const logFiltrado=(authLog||[]).filter(l=>{
          const ok=l.exitoso===true;
          if(logFiltroEstado!=="todos"&&ok!==(logFiltroEstado==="ok")) return false;
          const needle=normTxt(logFiltroUser);
          if(needle&&!(normTxt(l.nombre).includes(needle)||normTxt(l.userId).includes(needle)||normTxt(l.rol).includes(needle))) return false;
          const dt=fechaLog(l);
          if(dt&&dt<cutoff) return false;
          return true;
        });
        const fallidos=logFiltrado.filter(l=>l.exitoso!==true);
        const ultimoFallido=fallidos[0];
        const ultimoFallidoDt=fechaLog(ultimoFallido||{});
        return(
          <div style={{background:"#fff",borderRadius:14,border:"1px solid #E2E8F0",overflow:"hidden",boxShadow:"0 2px 10px rgba(15,31,51,.03)"}}>
            {fallidos.length>0&&(
              <div style={{background:"#FFF3CD",borderBottom:"1px solid #FDE68A",padding:"9px 13px",fontSize:11,color:"#92400E",display:"flex",alignItems:"center",gap:8}}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#92400E" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/>
                </svg>
                <strong>{fallidos.length} intento{fallidos.length>1?"s":""} fallido{fallidos.length>1?"s":""}</strong>
                <span>detectado{fallidos.length>1?"s":""}{ultimoFallido?` — ${ultimoFallido.nombre||ultimoFallido.userId||"Usuario"} ${horaCorta(ultimoFallidoDt)}`:""}</span>
              </div>
            )}

            <div style={{display:"flex",gap:8,padding:"10px 12px",borderBottom:"1px solid #F0F4F8",flexWrap:"wrap"}}>
              <input value={logFiltroUser} onChange={e=>setLogFiltroUser(e.target.value)}
                placeholder="Buscar usuario..." style={{padding:"7px 10px",borderRadius:8,border:"1px solid #E2E8F0",fontSize:11,flex:1,minWidth:160,fontFamily:"inherit",outline:"none"}}/>
              <select value={logFiltroEstado} onChange={e=>setLogFiltroEstado(e.target.value)}
                style={{padding:"7px 10px",borderRadius:8,border:"1px solid #E2E8F0",fontSize:11,fontFamily:"inherit",background:"#fff",color:"#5a7a9a"}}>
                <option value="todos">Todos</option>
                <option value="ok">✓ OK</option>
                <option value="fallido">✗ Fallidos</option>
              </select>
              <select value={logFiltroDias} onChange={e=>setLogFiltroDias(Number(e.target.value))}
                style={{padding:"7px 10px",borderRadius:8,border:"1px solid #E2E8F0",fontSize:11,fontFamily:"inherit",background:"#fff",color:"#5a7a9a"}}>
                <option value={7}>Últimos 7 días</option>
                <option value={30}>Últimos 30 días</option>
                <option value={90}>Últimos 90 días</option>
              </select>
            </div>

            {logFiltrado.length===0&&(
              <div style={{padding:"32px",textAlign:"center",color:"#8aaabb",fontSize:12}}>Sin registros para los filtros seleccionados.</div>
            )}
            {logFiltrado.length>0&&(
              <>
                <div style={{overflowX:"auto"}}>
                  <table style={{width:"100%",borderCollapse:"collapse",fontSize:11}}>
                    <thead>
                      <tr style={{background:"#fff"}}>
                        {["FECHA/HORA","USUARIO","ROL","DISPOSITIVO","ESTADO"].map(h=>(
                          <th key={h} style={{padding:"8px 12px",textAlign:"left",color:"#8aaabb",fontWeight:800,fontSize:9,letterSpacing:".04em",borderBottom:"1px solid #F0F4F8",whiteSpace:"nowrap"}}>{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {logFiltrado.slice(0,50).map((l,i)=>{
                        const dt=fechaLog(l);
                        const ok=l.exitoso===true;
                        return(
                          <tr key={l.id||i} style={{borderBottom:"0.5px solid #F8FAFC",background:ok?"#fff":"#FFF8F8"}}>
                            <td style={{padding:"8px 12px",color:"#1a2f4a",whiteSpace:"nowrap",fontSize:11}}>{dt?`${fechaCorta(dt)} ${horaCorta(dt)}`:"-"}</td>
                            <td style={{padding:"8px 12px",fontWeight:700,color:"#1a2f4a"}}>{l.nombre||l.userId||"-"}</td>
                            <td style={{padding:"8px 12px"}}>
                              <span style={{padding:"2px 7px",borderRadius:20,fontSize:9,fontWeight:700,
                                color:l.rol==="admin"?"#C08A00":l.rol==="auditor"?"#0984e3":"#085041",
                                background:l.rol==="admin"?"#FFF8EC":l.rol==="auditor"?"#e6f1fb":"#E1F5EE"}}>
                                {l.rol||"-"}
                              </span>
                            </td>
                            <td style={{padding:"8px 12px",color:"#1a2f4a",fontSize:11}}>{l.dispositivo||"-"}</td>
                            <td style={{padding:"8px 12px"}}>
                              <span style={{fontSize:9,fontWeight:800,padding:"2px 7px",borderRadius:20,
                                color:ok?"#085041":"#791F1F",background:ok?"#E1F5EE":"#FCEBEB"}}>
                                {ok?"✓ OK":"✗ Fallido"}
                              </span>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
                <div style={{padding:"8px 12px",fontSize:10,color:"#8aaabb",borderTop:"0.5px solid #f0f4f8"}}>
                  {Math.min(logFiltrado.length,50)} de {logFiltrado.length} registros · Retención: 90 días
                </div>
              </>
            )}
          </div>
        );
      })()}

      {/* ══ PERMISOS — matriz por módulo y rol ══ */}
      {usrTab==="permisos"&&(()=>{
        const modActivo=permisosModActivo||"diseno";
        const modDef=PERMISOS_MODULOS[modActivo];
        const rolesCols=["admin","coordinador","ejecutor","auditor","visor"];
        return(
        <div>
          <div style={{display:"flex",gap:6,flexWrap:"wrap",marginBottom:12}}>
            {Object.entries(PERMISOS_MODULOS).map(([id,m])=>(
              <button key={id} onClick={()=>setPermisosModActivo(id)} style={{padding:"7px 13px",borderRadius:9,border:`1.5px solid ${modActivo===id?"#1a2f4a":"#e2e8f0"}`,background:modActivo===id?"#1a2f4a":"#fff",color:modActivo===id?"#fff":"#5a7a9a",cursor:"pointer",fontSize:11,fontWeight:700}}>{m.label}</button>
            ))}
          </div>
          <div style={{overflowX:"auto",borderRadius:12,border:"1px solid #e2e8f0"}}>
            <table style={{width:"100%",borderCollapse:"collapse",fontSize:11,minWidth:640,background:"#fff"}}>
              <thead>
                <tr>
                  <th style={{padding:"10px 12px",textAlign:"left",color:"#8aaabb",fontWeight:800,fontSize:9,letterSpacing:".04em",borderBottom:"1px solid #e2e8f0",background:"#f8fafc",textTransform:"uppercase"}}>Acción</th>
                  {rolesCols.map(r=>(<th key={r} style={{padding:"10px 12px",textAlign:"center",color:"#8aaabb",fontWeight:800,fontSize:9,letterSpacing:".04em",borderBottom:"1px solid #e2e8f0",background:"#f8fafc",textTransform:"uppercase"}}>{ROL_CFG_U[r]?.label||r}</th>))}
                </tr>
              </thead>
              <tbody>
                {modDef.acciones.map(acc=>{
                  const usuariosConPermiso=usuarios.filter(u=>u.activo!==false&&u.permisos?.[modActivo]?.[acc.id]);
                  return(
                    <tr key={acc.id}>
                      <td style={{padding:"9px 12px",fontWeight:700,color:"#1a2f4a",borderBottom:"1px solid #f0f4f8"}}>{acc.label}</td>
                      {rolesCols.map(r=>{
                        const cnt=usuariosConPermiso.filter(u=>u.rol===r).length;
                        const totalRol=usuarios.filter(u=>u.activo!==false&&u.rol===r).length;
                        const estado=totalRol===0?"none":cnt===0?"none":cnt===totalRol?"all":"part";
                        return(
                          <td key={r} style={{padding:"9px 12px",textAlign:"center",borderBottom:"1px solid #f0f4f8"}}>
                            {estado==="all"&&<span style={{color:"#00b894",fontWeight:900}}>✓</span>}
                            {estado==="part"&&<span style={{color:"#d97706",fontWeight:700,fontSize:10}}>parcial</span>}
                            {estado==="none"&&<span style={{color:"#cbd5e1"}}>—</span>}
                          </td>
                        );
                      })}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          <div style={{fontSize:10,color:"#8aaabb",marginTop:10}}>✓ = todos los usuarios activos de ese rol tienen el permiso · parcial = algunos · — = ninguno. Edita el permiso individual desde la ficha de cada usuario.</div>
        </div>
        );
      })()}

      {/* ══ BLOQUEOS — usuarios bloqueados o con intentos fallidos ══ */}
      {usrTab==="bloqueos"&&(()=>{
        const bloqueados=usuarios.filter(u=>u.bloqueadoHasta&&new Date(u.bloqueadoHasta)>new Date());
        const conIntentos=usuarios.filter(u=>(u.intentosFallidos||0)>0&&!(u.bloqueadoHasta&&new Date(u.bloqueadoHasta)>new Date()));
        return(
        <div>
          <div style={{...S.card,padding:"12px 14px",marginBottom:14,background:"#f8fafc"}}>
            <div style={{fontSize:11,color:"#5a7a9a",lineHeight:1.5}}>Evalúa intentos fallidos por usuario (guardado en su ficha de Firestore, no solo en el dispositivo). Permite resetear intentos o bloquear preventivamente.</div>
          </div>
          <div style={{fontSize:10,fontWeight:700,color:"#8aaabb",marginBottom:8,letterSpacing:".04em"}}>BLOQUEADOS ACTUALMENTE ({bloqueados.length})</div>
          {bloqueados.length===0&&<div style={{fontSize:12,color:"#b2bec3",padding:"10px 0",marginBottom:14}}>Sin usuarios bloqueados.</div>}
          {bloqueados.map(u=>(
            <div key={u.id} style={{...S.card,padding:"11px 13px",marginBottom:8,display:"flex",alignItems:"center",gap:10}}>
              <div style={{flex:1,minWidth:0}}>
                <div style={{fontWeight:700,fontSize:12,color:"#1a2f4a"}}>{u.nombre}</div>
                <div style={{fontSize:10,color:"#dc2626"}}>Bloqueado hasta {new Date(u.bloqueadoHasta).toLocaleString("es-PE",{day:"2-digit",month:"2-digit",hour:"2-digit",minute:"2-digit"})} · {u.intentosFallidos||0} intentos</div>
              </div>
              <button onClick={async()=>{await setDoc(doc(db,"usuarios",u.id),{bloqueadoHasta:null,intentosFallidos:0},{merge:true});showToast("Usuario desbloqueado");}} style={{padding:"6px 12px",borderRadius:9,border:"1px solid #FAC775",background:"#FAEEDA",color:"#633806",cursor:"pointer",fontSize:11,fontWeight:700,whiteSpace:"nowrap"}}>Desbloquear</button>
            </div>
          ))}
          <div style={{fontSize:10,fontWeight:700,color:"#8aaabb",marginBottom:8,marginTop:14,letterSpacing:".04em"}}>CON INTENTOS FALLIDOS, SIN BLOQUEO ({conIntentos.length})</div>
          {conIntentos.length===0&&<div style={{fontSize:12,color:"#b2bec3",padding:"10px 0"}}>Sin intentos fallidos pendientes.</div>}
          {conIntentos.map(u=>(
            <div key={u.id} style={{...S.card,padding:"11px 13px",marginBottom:8,display:"flex",alignItems:"center",gap:10}}>
              <div style={{flex:1,minWidth:0}}>
                <div style={{fontWeight:700,fontSize:12,color:"#1a2f4a"}}>{u.nombre}</div>
                <div style={{fontSize:10,color:"#d97706"}}>{u.intentosFallidos} intento{u.intentosFallidos!==1?"s":""} fallido{u.intentosFallidos!==1?"s":""}</div>
              </div>
              <button onClick={async()=>{await setDoc(doc(db,"usuarios",u.id),{intentosFallidos:0},{merge:true});showToast("Intentos reseteados");}} style={{padding:"6px 12px",borderRadius:9,border:"1px solid #c8d8e8",background:"#f8fafc",color:"#5a7a9a",cursor:"pointer",fontSize:11,fontWeight:700,whiteSpace:"nowrap"}}>Reset intentos</button>
              <button onClick={async()=>{const hasta=new Date(Date.now()+30*60*1000).toISOString();await setDoc(doc(db,"usuarios",u.id),{bloqueadoHasta:hasta},{merge:true});showToast("Usuario bloqueado 30 min");}} style={{padding:"6px 12px",borderRadius:9,border:"1px solid #fecaca",background:"#fff1f1",color:"#dc2626",cursor:"pointer",fontSize:11,fontWeight:700,whiteSpace:"nowrap"}}>Bloquear</button>
            </div>
          ))}
        </div>
        );
      })()}

      {/* ══ DASHBOARD INICIAL — visible cuando no hay tab seleccionado ══ */}
      {!usrTab&&(()=>{
        const hoyStr=new Date().toDateString();
        const accesosHoy=authLog.filter(l=>l.timestamp&&new Date(l.timestamp).toDateString()===hoyStr);
        const fallHoy=accesosHoy.filter(l=>!l.exitoso).length;
        const hayActividad=accesosHoy.length>0;
        // showDetalleAccesos viene del estado del componente principal
        // Últimas 5 sesiones del admin logueado hoy
        const misAccesos=accesosHoy.filter(l=>l.userId===uDni||l.nombre===uName).slice(0,5);

        if(!hayActividad) return(
          <div style={{background:"#fff",borderRadius:14,border:"1px solid #E2E8F0",padding:"48px 20px",textAlign:"center",marginTop:8}}>
            <svg width="52" height="52" viewBox="0 0 64 64" fill="none" style={{marginBottom:12}} aria-hidden="true">
              <rect x="6" y="34" width="52" height="22" rx="6" fill="#FDB347"/>
              <rect x="6" y="34" width="26" height="8" rx="3" fill="#E8973A"/>
              <rect x="10" y="18" width="44" height="18" rx="4" fill="#74b9e8"/>
              <path d="M10 28l22-12 22 12" fill="#5ba3d4"/>
              <rect x="24" y="18" width="16" height="14" rx="2" fill="#5ba3d4"/>
            </svg>
            <div style={{fontSize:13,color:"#b2bec3",fontWeight:500}}>Selecciona una sección del menú</div>
            <div style={{fontSize:11,color:"#c8d8e8",marginTop:4,marginBottom:16}}>Usuarios · Áreas · Roles · Permisos · Log de accesos · Bloqueos</div>
            <div style={{background:"#f8fafc",border:"1px solid #e2e8f0",borderRadius:12,padding:"11px 14px",fontSize:11,color:"#5a7a9a",textAlign:"left",maxWidth:420,margin:"0 auto"}}><b style={{color:"#1a2f4a"}}>Regla Usuarios 2.0:</b> Usuario = Rol + Cargo + Área + Alcance + Permisos por módulo. Auditor y Diseñador son cargos, no roles.</div>
          </div>
        );

        return(
          <div style={{background:"#fff",borderRadius:14,border:"1px solid #E2E8F0",padding:"16px",marginTop:8}}>
            {/* Título resumen */}
            <div style={{fontSize:10,fontWeight:700,color:"#8aaabb",letterSpacing:".06em",textTransform:"uppercase",marginBottom:12}}>Resumen del sistema</div>
            {/* 4 métricas */}
            <div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:8}}>
              {/* Usuarios activos */}
              <div style={{background:"#f8fafc",borderRadius:10,padding:"10px 12px",border:"1px solid #f0f4f8"}}>
                <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:4}}>
                  <div style={{fontSize:20,fontWeight:700,color:"#1a2f4a",lineHeight:1}}>{usuarios.filter(u=>u.activo!==false).length}</div>
                  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#1a2f4a" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                    <path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/><circle cx="9" cy="7" r="4"/>
                    <path d="M23 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75"/>
                  </svg>
                </div>
                <div style={{fontSize:10,color:"#8aaabb"}}>Usuarios activos</div>
                <div style={{fontSize:9,color:"#059669",marginTop:3}}>↑ +2 esta semana</div>
              </div>
              {/* Roles */}
              <div style={{background:"#f8fafc",borderRadius:10,padding:"10px 12px",border:"1px solid #f0f4f8"}}>
                <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:4}}>
                  <div style={{fontSize:20,fontWeight:700,color:"#6C6EF5",lineHeight:1}}>{[...new Set(usuarios.map(u=>u.rol).filter(Boolean))].length}</div>
                  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#6C6EF5" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
                  </svg>
                </div>
                <div style={{fontSize:10,color:"#8aaabb"}}>Roles</div>
                <div style={{fontSize:9,color:"#8aaabb",marginTop:3}}>— Sin cambios</div>
              </div>
              {/* Áreas activas */}
              <div style={{background:"#f8fafc",borderRadius:10,padding:"10px 12px",border:"1px solid #f0f4f8"}}>
                <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:4}}>
                  <div style={{fontSize:20,fontWeight:700,color:"#00b5b4",lineHeight:1}}>{[...new Set(usuarios.map(u=>u.area).filter(Boolean))].length}</div>
                  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#00b5b4" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                    <path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z"/>
                    <polyline points="9,22 9,12 15,12 15,22"/>
                  </svg>
                </div>
                <div style={{fontSize:10,color:"#8aaabb"}}>Áreas activas</div>
                <div style={{fontSize:9,color:"#059669",marginTop:3}}>↑ +1 este mes</div>
              </div>
              {/* Accesos hoy — tarjeta con botón Detalles */}
              <div style={{background:"#f8fafc",borderRadius:10,padding:"10px 12px",border:"1px solid #f0f4f8",position:"relative"}}>
                <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:4}}>
                  <div style={{fontSize:20,fontWeight:700,color:fallHoy>0?"#d97706":"#059669",lineHeight:1}}>{accesosHoy.length}</div>
                  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={fallHoy>0?"#d97706":"#059669"} strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                    <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0110 0v4"/>
                  </svg>
                </div>
                <div style={{fontSize:10,color:"#8aaabb"}}>Accesos hoy</div>
                {fallHoy>0&&(
                  <div style={{fontSize:9,color:"#d97706",marginTop:3}}>⚠ {fallHoy} fallido{fallHoy>1?"s":""}</div>
                )}
                <button
                  onClick={()=>setShowDetalleAccesos(s=>!s)}
                  style={{marginTop:6,fontSize:9,color:showDetalleAccesos?"#791F1F":"#6C6EF5",background:"none",
                    border:"1px solid "+(showDetalleAccesos?"#fca5a5":"#e2e8f0"),borderRadius:20,
                    padding:"2px 8px",cursor:"pointer",fontFamily:"inherit",display:"block"}}>
                  {showDetalleAccesos?"✕ Cerrar":"...Detalles"}
                </button>
              </div>
            </div>

            {/* Panel desplegable alineado a la derecha — últimas 5 sesiones del admin */}
            {showDetalleAccesos&&(
              <div style={{display:"flex",justifyContent:"flex-end",marginTop:8}}>
                <div style={{background:"#fff",borderRadius:12,border:"1px solid #E2E8F0",
                  boxShadow:"0 4px 16px rgba(0,0,0,.08)",padding:"12px 14px",width:280}}>
                  <div style={{display:"flex",alignItems:"center",gap:6,marginBottom:10}}>
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#5a7a9a" strokeWidth="1.8" strokeLinecap="round" aria-hidden="true">
                      <circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>
                    </svg>
                    <span style={{fontSize:11,fontWeight:700,color:"#1a2f4a"}}>Accesos hoy</span>
                    <span style={{fontSize:9,color:"#8aaabb",marginLeft:"auto"}}>{misAccesos.length} de hoy</span>
                  </div>
                  {misAccesos.length===0&&(
                    <div style={{fontSize:11,color:"#b2bec3",textAlign:"center",padding:"8px 0"}}>Sin sesiones registradas hoy</div>
                  )}
                  {misAccesos.map((l,i)=>(
                    <div key={i} style={{display:"flex",alignItems:"center",gap:8,padding:"6px 0",
                      borderTop:i>0?"0.5px solid #f5f7fa":"none"}}>
                      <div style={{width:28,height:28,borderRadius:"50%",background:"#EEEDFE",
                        display:"flex",alignItems:"center",justifyContent:"center",
                        fontSize:9,fontWeight:700,color:"#3C3489",flexShrink:0}}>
                        {(l.nombre||uName||"?").split(" ").map(w=>w[0]).slice(0,2).join("")}
                      </div>
                      <div style={{flex:1,minWidth:0}}>
                        <div style={{fontSize:11,fontWeight:500,color:"#1a2f4a",whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis"}}>{l.nombre||uName||"-"}</div>
                        <div style={{fontSize:9,color:"#8aaabb"}}>{l.timestamp?new Date(l.timestamp).toLocaleTimeString("es-PE",{hour:"2-digit",minute:"2-digit"}):"-"}</div>
                      </div>
                      <span style={{fontSize:8,padding:"2px 6px",borderRadius:20,fontWeight:700,
                        color:l.exitoso?"#085041":"#791F1F",background:l.exitoso?"#E1F5EE":"#FCEBEB",flexShrink:0}}>
                        {l.exitoso?"✓ OK":"✗ Fallido"}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        );
      })()}

    </div>
    );
  };

  const renderConfig = ({hideTabs=false}={})=>(
    <div style={{padding:"16px"}}>
      {!hideTabs&&(()=>{
        /* ── íconos para el selector de módulo ── */
        const IcoEvCfg=({active})=>(
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none">
            <rect x="2" y="2" width="13" height="17" rx="2" stroke={active?"#fff":"#94A3B8"} strokeWidth="1.5" fill={active?"rgba(255,255,255,.15)":"none"}/>
            <line x1="5" y1="7" x2="12" y2="7" stroke={active?"#fff":"#94A3B8"} strokeWidth="1.2" strokeLinecap="round"/>
            <line x1="5" y1="10" x2="10" y2="10" stroke={active?"#fff":"#94A3B8"} strokeWidth="1.2" strokeLinecap="round"/>
            <circle cx="16.5" cy="15.5" r="4" stroke={active?"rgba(255,255,255,.9)":"#6C6EF5"} strokeWidth="1.6" fill="none"/>
            <line x1="19.5" y1="18.5" x2="22" y2="21" stroke={active?"rgba(255,255,255,.9)":"#6C6EF5"} strokeWidth="2" strokeLinecap="round"/>
          </svg>
        );
        const IcoAudCfg=({active})=>(
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none">
            <rect x="2" y="3" width="20" height="14" rx="2" stroke={active?"#fff":"#94A3B8"} strokeWidth="1.5" fill={active?"rgba(255,255,255,.1)":"none"}/>
            <circle cx="12" cy="10" r="3" stroke={active?"#fff":"#94A3B8"} strokeWidth="1.4" fill="none"/>
            <circle cx="12" cy="10" r="1.2" fill={active?"#fff":"#94A3B8"}/>
            <path d="M6.5 10c1.5-2.5 9-2.5 11 0" stroke={active?"#fff":"#94A3B8"} strokeWidth="1.2" strokeLinecap="round" fill="none"/>
            <line x1="8" y1="21" x2="16" y2="21" stroke={active?"#fff":"#94A3B8"} strokeWidth="1.5" strokeLinecap="round"/>
            <line x1="12" y1="17" x2="12" y2="21" stroke={active?"#fff":"#94A3B8"} strokeWidth="1.5" strokeLinecap="round"/>
          </svg>
        );
        const IcoDiseñoCfg=({active})=>(
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={active?"#fff":"#94A3B8"} strokeWidth="2" strokeLinecap="round"><path d="M12 20h9"/><path d="M16.5 3.5a2.121 2.121 0 013 3L7 19l-4 1 1-4L16.5 3.5z"/></svg>
        );
        const MODS=[
          {id:"evidencias", label:"Evidencias", Ico:IcoEvCfg},
          {id:"auditoria",  label:"Auditoría",  Ico:IcoAudCfg},
          {id:"diseno",     label:"Diseño",     Ico:IcoDiseñoCfg},
        ];
        const TAB_PILL_A={padding:"9px 20px",borderRadius:50,border:"none",cursor:"pointer",background:"#6C6EF5",color:"#fff",fontWeight:700,fontSize:14,boxShadow:"0 2px 8px rgba(108,110,245,.3)",display:"flex",alignItems:"center",gap:8,transition:"all .15s"};
        const TAB_PILL_I={padding:"9px 20px",borderRadius:50,border:"1.5px solid #D1D5DB",cursor:"pointer",background:"#fff",color:"#6B7280",fontWeight:600,fontSize:14,display:"flex",alignItems:"center",gap:8,transition:"all .15s"};

        return(
          <div>
            {/* ── Botón "Panel de control" con dropdown ── */}
            <div style={{position:"relative",display:"inline-block",marginBottom:16}}>
              <button onClick={()=>setDdOpen(o=>!o)}
                style={{display:"flex",alignItems:"center",gap:8,padding:"8px 14px",
                  borderRadius:20,border:"1.5px solid #E2E8F0",background:"#fff",
                  cursor:"pointer",color:cfgMod?"#6C6EF5":"#5a7a9a",
                  fontWeight:600,fontSize:13,transition:"all .15s",
                  borderBottom:!cfgMod?"2px solid #6C6EF5":"1.5px solid #E2E8F0"}}>
                {/* ícono ··· */}
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                  <circle cx="5" cy="12" r="1.2" fill="currentColor" stroke="none"/>
                  <circle cx="12" cy="12" r="1.2" fill="currentColor" stroke="none"/>
                  <circle cx="19" cy="12" r="1.2" fill="currentColor" stroke="none"/>
                </svg>
                {cfgMod
                  ? (()=>{const m=MODS.find(x=>x.id===cfgMod);return m?<>{<m.Ico active={false}/>} {m.label}</>:"Panel de control";})()
                  : "Panel de control"}
              </button>
              {/* Dropdown */}
              {ddOpen&&(
                <div style={{position:"absolute",top:"calc(100% + 4px)",left:0,minWidth:200,
                  background:"#fff",borderRadius:12,border:"1.5px solid #E2E8F0",
                  boxShadow:"0 8px 24px rgba(0,0,0,.10)",zIndex:200,overflow:"hidden"}}>
                  <div style={{padding:"10px 14px 6px",fontSize:11,fontWeight:700,
                    color:"#8aaabb",letterSpacing:".06em",borderBottom:"1px solid #F1F5F9",
                    display:"flex",alignItems:"center",gap:6}}>
                    Seleccione Módulo
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#00b894" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="20,6 9,17 4,12"/>
                    </svg>
                  </div>
                  {MODS.map(m=>(
                    <button key={m.id}
                      onClick={()=>{setCfgMod(m.id);setDdOpen(false);
                        if(m.id==="evidencias")setCfgTab(1);}}
                      style={{width:"100%",padding:"12px 16px",border:"none",
                        borderBottom:"1px solid #F8FAFC",background:"#fff",
                        display:"flex",alignItems:"center",justifyContent:"space-between",
                        cursor:"pointer",color:cfgMod===m.id?"#6C6EF5":"#1a2f4a",
                        fontWeight:cfgMod===m.id?700:500,fontSize:13,
                        transition:"background .1s"}}>
                      {m.label}
                      <m.Ico active={cfgMod===m.id}/>
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Línea separadora */}
            {cfgMod&&<div style={{borderBottom:"1px solid #E2E8F0",marginBottom:0}}/>}

            {/* ── Pill activa del módulo seleccionado ── */}
            {cfgMod&&(
              <div style={{display:"flex",gap:8,marginBottom:0,paddingTop:12,flexWrap:"wrap"}}>
                {MODS.map(m=>{
                  const active=cfgMod===m.id;
                  if(!active) return null;
                  return(
                    <button key={m.id} onClick={()=>{setCfgMod(null);setDdOpen(false);}}
                      style={TAB_PILL_A}>
                      <m.Ico active={true}/>
                      {m.label}
                    </button>
                  );
                })}
              </div>
            )}

            {/* ── PASO 2a: Evidencias → subpestañas ── */}
            {cfgMod==="evidencias"&&(()=>{
              const EV_TABS=[
                {i:1, label:"Actividades"},
                {i:4, label:"Rangos Día"},
                {i:5, label:"Cortes"},
              ];
              if(!EV_TABS.find(t=>t.i===cfgTab)){ setTimeout(()=>setCfgTab(1),0); return null; } // FIX_RUTA_MODULOS_MULTISELECT_20260520 prevent setState-during-render #310
              return(
                <div style={{background:"#fff",borderRadius:"10px 10px 0 0",padding:"10px 12px 0",
                  borderTop:"1px solid #E2E8F0",marginTop:10,display:"flex",gap:4}}>
                  {EV_TABS.map(t=>(
                    <button key={t.i} onClick={()=>setCfgTab(t.i)}
                      style={{padding:"9px 18px",border:"none",borderRadius:"8px 8px 0 0",
                        borderBottom:`3px solid ${cfgTab===t.i?"#6C6EF5":"transparent"}`,
                        background:cfgTab===t.i?"#EEEFFE":"transparent",
                        color:cfgTab===t.i?"#6C6EF5":"#64748B",
                        fontWeight:cfgTab===t.i?700:500,fontSize:13,cursor:"pointer",whiteSpace:"nowrap"}}>
                      {t.label}
                    </button>
                  ))}
                </div>
              );
            })()}

            {/* ── PASO 2b: Auditoría → en construcción ── */}
            {cfgMod==="auditoria"&&(()=>{
              const audTabs=[{id:"score",label:"Score"},{id:"tareas",label:"Tareas"},{id:"rutas",label:"Rutas"}];
              const auditores=usuarios.filter(u=>(["auditor","coordinador","admin"].includes(u.rol)||isOperativoTradeUser(u))&&u.activo!==false);
              const rutasSemana=rutas.filter(r=>r.semana===semanaActual);
              return(
                <div style={{marginTop:10}}>
                  {/* Sub-tabs */}
                  <div style={{background:"#fff",borderRadius:"10px 10px 0 0",padding:"10px 12px 0",borderTop:"1px solid #E2E8F0",display:"flex",gap:4,marginBottom:0}}>
                    {audTabs.map(t=>(
                      <button key={t.id} onClick={()=>setAudCfgTab(t.id)}
                        style={{padding:"9px 18px",border:"none",borderRadius:"8px 8px 0 0",
                          borderBottom:`3px solid ${audCfgTab===t.id?"#6C6EF5":"transparent"}`,
                          background:audCfgTab===t.id?"#EEEFFE":"transparent",
                          color:audCfgTab===t.id?"#6C6EF5":"#64748B",
                          fontWeight:audCfgTab===t.id?700:500,fontSize:13,cursor:"pointer",whiteSpace:"nowrap"}}>
                        {t.label}
                      </button>
                    ))}
                  </div>

                  <div style={{background:"#fff",borderRadius:"0 0 12px 12px",border:"1px solid #E2E8F0",borderTop:"none",padding:"16px"}}>

                    {/* ══ TAB RUTAS ══ */}
                    {audCfgTab==="rutas"&&(()=>{
                      return(
                      <div>
                        <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:8}}>
                          <div>
                            <div style={{fontSize:13,fontWeight:700,color:"#1a2f4a"}}>Rutas semanales</div>
                            <div style={{fontSize:11,color:"#8aaabb"}}>Semana automática: {semanaActual} · {rutasSemana.filter(r=>rutasFiltro==="todas"||r.activo!==false).length} rutas {rutasFiltro==="activas"?"activas":"en total"}</div>
                          </div>
                          <button onClick={()=>{setShowNewRuta(true);setNewRuta({auditorId:"",moduloIds:[],tiendas:[],frecuencia:"semanal",zona:"",distrito:"",formato:"Todas",tipoRuta:"regular",perfilCalendario:"auto",motivoExcepcion:"",editId:null});}}
                            style={{padding:"8px 14px",borderRadius:50,border:"none",background:"#1a2f4a",color:"#fff",cursor:"pointer",fontWeight:600,fontSize:12,display:"flex",alignItems:"center",gap:6}}>
                            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.5" strokeLinecap="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
                            Nueva ruta
                          </button>
                        </div>
                        <div style={{display:"flex",gap:6,marginBottom:12}}>
                          {["activas","todas"].map(f=>(
                            <button key={f} onClick={()=>setRutasFiltro(f)}
                              style={{padding:"4px 12px",borderRadius:20,border:`1px solid ${rutasFiltro===f?"#1a2f4a":"#e2e8f0"}`,background:rutasFiltro===f?"#1a2f4a":"#fff",color:rutasFiltro===f?"#fff":"#5a7a9a",fontSize:11,cursor:"pointer",fontWeight:rutasFiltro===f?700:400}}>
                              {f==="activas"?"Activas":"Todas (históricas)"}
                            </button>
                          ))}
                        </div>

                        {showNewRuta&&(
                          <div style={{...S.card,padding:"16px",marginBottom:14,border:"1.5px solid #00b5b4"}}>
                            <div style={{fontWeight:700,fontSize:13,color:"#1a2f4a",marginBottom:12,display:"flex",alignItems:"center",gap:8}}>
                              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#00b5b4" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z"/><circle cx="12" cy="10" r="3"/></svg>
                              Nueva ruta — {semanaActual}
                            </div>
                            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10,marginBottom:12}}>
                              <div>
                                <label style={S.lbl}>AUDITOR *</label>
                                <select value={newRuta.auditorId} onChange={e=>setNewRuta(p=>({...p,auditorId:e.target.value}))} style={S.inp}>
                                  <option value="">Seleccionar auditor</option>
                                  {auditores.map(a=><option key={a.id} value={a.id}>{a.nombre} · {a.cargo||a.rol}</option>)}
                                </select>
                              </div>
                              <div>
                                <label style={S.lbl}>MÓDULOS A EVALUAR</label>
                                <div style={{border:"1.5px solid #e2e8f0",borderRadius:10,background:"#fff",overflow:"hidden"}}>
                                  {[{id:"",nombre:"Sin módulo específico"},...modulosAud.filter(m=>m.activo!==false)].map((m,i)=>{
                                    const isNone=m.id==="";
                                    const sel=isNone?(newRuta.moduloIds||[]).length===0:(newRuta.moduloIds||[]).includes(m.id);
                                    return(
                                      <label key={m.id||"none"} onClick={()=>{
                                        if(isNone){setNewRuta(p=>({...p,moduloIds:[]}));}
                                        else{setNewRuta(p=>{const ids=p.moduloIds||[];const next=ids.includes(m.id)?ids.filter(x=>x!==m.id):[...ids,m.id];return{...p,moduloIds:next};});}
                                      }} style={{display:"flex",alignItems:"center",gap:10,padding:"9px 12px",cursor:"pointer",borderTop:i>0?"1px solid #f0f4f8":"none",background:sel?"#e0fafa":"#fff",transition:"background .15s"}}>
                                        <svg width="15" height="15" viewBox="0 0 24 24" fill={sel?"#00b5b4":"none"} stroke={sel?"#00b5b4":"#c8d8e8"} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                          {sel?<polyline points="20,6 9,17 4,12"/>:<rect x="3" y="3" width="18" height="18" rx="3"/>}
                                        </svg>
                                        <span style={{fontSize:12,fontWeight:sel?700:400,color:sel?"#085041":"#1a2f4a"}}>{m.nombre}</span>
                                      </label>
                                    );
                                  })}
                                </div>
                              </div>
                            </div>
                            <div style={{marginBottom:10}}>
                                <label style={S.lbl}>FRECUENCIA</label>
                                <select value={newRuta.frecuencia||"semanal"} onChange={e=>setNewRuta(p=>({...p,frecuencia:e.target.value}))} style={S.inp}>
                                  <option value="semanal">Semanal (se repite cada semana)</option>
                                  <option value="diaria">Diaria (se repite cada día)</option>
                                  <option value="quincenal">Quincenal (cada 15 días)</option>
                                  <option value="mensual">Mensual (se repite cada mes)</option>
                                  <option value="unica">Única (solo esta semana)</option>
                                </select>
                              </div>
                            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10,marginBottom:10}}>
                              <div>
                                <label style={S.lbl}>TIPO DE RUTA</label>
                                <select value={newRuta.tipoRuta||"regular"} onChange={e=>setNewRuta(p=>({...p,tipoRuta:e.target.value}))} style={S.inp}>
                                  <option value="regular">Regular programada</option>
                                  <option value="fuera_ruta">Fuera de ruta aprobado</option>
                                  <option value="excepcional">Excepcional domingo / feriado</option>
                                </select>
                              </div>
                              <div>
                                <label style={S.lbl}>CALENDARIO APLICADO</label>
                                <select value={newRuta.perfilCalendario||"auto"} onChange={e=>setNewRuta(p=>({...p,perfilCalendario:e.target.value}))} style={S.inp}>
                                  <option value="auto">Automático por rol/equipo</option>
                                  <option value="administrativo">Administrativo</option>
                                  <option value="operativo_trade">Operativo Trade</option>
                                  <option value="tienda">Horario de tienda</option>
                                </select>
                              </div>
                            </div>
                            {(newRuta.tipoRuta==="fuera_ruta"||newRuta.tipoRuta==="excepcional")&&(
                              <div style={{marginBottom:10}}>
                                <label style={S.lbl}>MOTIVO OBLIGATORIO</label>
                                <input value={newRuta.motivoExcepcion||""} onChange={e=>setNewRuta(p=>({...p,motivoExcepcion:e.target.value}))} placeholder="Ej: cobertura especial, tienda crítica, campaña o reasignación" style={S.inp}/>
                              </div>
                            )}
                            <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(170px,1fr))",gap:8,marginBottom:12}}>
                              {[{k:"administrativo",t:"Administrativo",d:"L-V 08:30-18:30 · S 09:00-12:00"},{k:"operativo_trade",t:"Operativo Trade",d:"Domingo habilitado si hay ruta y tienda opera"},{k:"tienda",t:"Tienda",d:"Valida horario real por local"}].map(x=>(
                                <div key={x.k} style={{padding:10,borderRadius:12,border:"1px solid #e2e8f0",background:(newRuta.perfilCalendario===x.k?"#EEEFFE":"#f8fafc")}}>
                                  <div style={{display:"flex",alignItems:"center",gap:7,fontSize:11,fontWeight:800,color:newRuta.perfilCalendario===x.k?"#6C6EF5":"#1a2f4a"}}>
                                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
                                    {x.t}
                                  </div>
                                  <div style={{fontSize:10,color:"#8aaabb",marginTop:4,lineHeight:1.35}}>{x.d}</div>
                                </div>
                              ))}
                            </div>
                            <div style={{marginBottom:12}}>
                              <label style={S.lbl}>COBERTURA DE RUTA</label>
                              {(()=>{
                                const zonaSel=newRuta.zona||"";
                                const distDisponibles=[...new Set(tiendas.filter(t=>t.activa&&(!zonaSel||getZonaIdTienda(t)===zonaSel)).map(t=>t.dist).filter(Boolean))].sort();
                                const tiendasFiltradas=tiendas.filter(t=>{
                                  if(!t.activa) return false;
                                  if(newRuta.zona&&getZonaIdTienda(t)!==newRuta.zona) return false;
                                  if(newRuta.distrito&&t.dist!==newRuta.distrito) return false;
                                  if(newRuta.formato&&newRuta.formato!=="Todas"&&t.f!==newRuta.formato) return false;
                                  return true;
                                });
                                const idsFiltrados=tiendasFiltradas.map(t=>t.id);
                                const seleccionadas=(newRuta.tiendas||[]).length;
                                return(
                                  <div>
                                    <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:8,marginBottom:8}}>
                                      <select value={newRuta.zona||""} onChange={e=>setNewRuta(p=>({...p,zona:e.target.value,distrito:""}))} style={S.inp}>
                                        <option value="">Todas las zonas</option>
                                        {ZONAS_VEGA.map(z=><option key={z.id} value={z.id}>{z.nombre}</option>)}
                                      </select>
                                      <select value={newRuta.distrito||""} onChange={e=>setNewRuta(p=>({...p,distrito:e.target.value}))} style={S.inp}>
                                        <option value="">Todos los distritos</option>
                                        {distDisponibles.map(d=><option key={d} value={d}>{d}</option>)}
                                      </select>
                                      <select value={newRuta.formato||"Todas"} onChange={e=>setNewRuta(p=>({...p,formato:e.target.value}))} style={S.inp}>
                                        <option value="Todas">Todos los formatos</option>
                                        {[...new Set(tiendas.map(t=>t.f).filter(Boolean))].sort().map(f=><option key={f} value={f}>{f}</option>)}
                                      </select>
                                    </div>
                                    <div style={{display:"flex",gap:6,alignItems:"center",marginBottom:8,flexWrap:"wrap"}}>
                                      <button onClick={()=>setNewRuta(p=>({...p,tiendas:[...new Set([...(p.tiendas||[]),...idsFiltrados])]}))} style={{padding:"6px 10px",borderRadius:20,border:"1px solid #00b5b4",background:"#e0fafa",color:"#085041",fontSize:11,fontWeight:700,cursor:"pointer"}}>Seleccionar filtro ({idsFiltrados.length})</button>
                                      <button onClick={()=>setNewRuta(p=>({...p,tiendas:(p.tiendas||[]).filter(id=>!idsFiltrados.includes(id))}))} style={{padding:"6px 10px",borderRadius:20,border:"1px solid #e2e8f0",background:"#fff",color:"#5a7a9a",fontSize:11,fontWeight:600,cursor:"pointer"}}>Limpiar filtro</button>
                                      <span style={{fontSize:11,color:"#8aaabb"}}>{seleccionadas} tiendas seleccionadas</span>
                                    </div>
                                    <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:6,marginTop:4,maxHeight:260,overflow:"auto",paddingRight:4}}>
                                      {tiendasFiltradas.map(t=>{
                                        const sel=(newRuta.tiendas||[]).includes(t.id);
                                        const zid=getZonaIdTienda(t);
                                        return(
                                          <label key={t.id} onClick={()=>setNewRuta(p=>({...p,tiendas:sel?p.tiendas.filter(x=>x!==t.id):[...(p.tiendas||[]),t.id]}))}
                                            style={{display:"flex",alignItems:"center",gap:8,padding:"8px 10px",borderRadius:9,border:`1.5px solid ${sel?"#00b5b4":"#e2e8f0"}`,cursor:"pointer",fontSize:12,background:sel?"#e0fafa":"#fff",color:sel?"#085041":"#1a2f4a"}}>
                                            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke={sel?"#00b5b4":"#b2bec3"} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                              {sel?<polyline points="20,6 9,17 4,12"/>:<rect x="3" y="3" width="18" height="18" rx="3"/>}
                                            </svg>
                                            <span style={{flex:1}}>Vega {nomTienda(t)}</span>
                                            <span style={{fontSize:9,color:"#8aaabb"}}>{getZonaNombre(zid)} · {t.dist}</span>
                                          </label>
                                        );
                                      })}
                                    </div>
                                  </div>
                                );
                              })()}
                              {(newRuta.tiendas||[]).length===0&&<div style={{fontSize:10,color:"#ef4444",marginTop:4}}>Selecciona al menos una tienda</div>}
                            </div>
                            <div style={{display:"flex",gap:8}}>
                              <button onClick={async()=>{
                                if(!newRuta.auditorId) return showToast("Selecciona un auditor");
                                if(!(newRuta.tiendas||[]).length) return showToast("Selecciona al menos una tienda");
                                if((newRuta.tipoRuta==="fuera_ruta"||newRuta.tipoRuta==="excepcional")&&!String(newRuta.motivoExcepcion||"").trim()) return showToast("Ingresa el motivo de la excepción");
                                const tiendasAsignadas=tiendas.filter(t=>(newRuta.tiendas||[]).includes(t.id));
                                const auditorRuta=usuarios.find(u=>u.id===newRuta.auditorId);
                                const perfilAuto=getPerfilCalendarioUsuario(auditorRuta);
                                const perfilAplicado=newRuta.perfilCalendario==="auto"?perfilAuto:newRuta.perfilCalendario;
                                const data={auditorId:newRuta.auditorId,moduloIds:newRuta.moduloIds||[],moduloId:(newRuta.moduloIds||[])[0]||"",tiendas:newRuta.tiendas,routeMeta:getRouteMetaFromTiendas(tiendasAsignadas),semana:semanaActual,frecuencia:newRuta.frecuencia||"semanal",tipoRuta:newRuta.tipoRuta||"regular",perfilCalendario:perfilAplicado,perfilCalendarioOrigen:newRuta.perfilCalendario||"auto",calendarioSnapshot:CALENDARIO_PERFILES[perfilAplicado]||CALENDARIO_PERFILES.administrativo,excepcion:(newRuta.tipoRuta==="fuera_ruta"||newRuta.tipoRuta==="excepcional")?{tipo:newRuta.tipoRuta,motivo:String(newRuta.motivoExcepcion||"").trim(),aprobadoPor:uDni,aprobadoEn:new Date().toISOString()}:null,activo:true,creadaEn:new Date().toISOString(),creadaPor:uDni};
                                if(newRuta.editId){await setDoc(doc(db,"rutas",newRuta.editId),data,{merge:true});showToast("Ruta actualizada");}
                                else{await setDoc(doc(collection(db,"rutas")),data);showToast("Ruta creada");}
                                setShowNewRuta(false);setNewRuta({auditorId:"",moduloIds:[],tiendas:[],frecuencia:"semanal",zona:"",distrito:"",formato:"Todas",tipoRuta:"regular",perfilCalendario:"auto",motivoExcepcion:"",editId:null});
                              }} style={{flex:1,padding:"10px",borderRadius:50,border:"none",background:"#1a2f4a",color:"#fff",cursor:"pointer",fontWeight:700,fontSize:12}}>
                                {newRuta.editId?"Guardar cambios":"Crear ruta"}
                              </button>
                              <button onClick={()=>{setShowNewRuta(false);setNewRuta({auditorId:"",moduloIds:[],tiendas:[],frecuencia:"semanal",zona:"",distrito:"",formato:"Todas",tipoRuta:"regular",perfilCalendario:"auto",motivoExcepcion:"",editId:null});}} style={{padding:"10px 16px",borderRadius:50,border:"1px solid #e2e8f0",background:"#fff",color:"#5a7a9a",cursor:"pointer",fontSize:12}}>Cancelar</button>
                            </div>
                          </div>
                        )}

                        {rutasSemana.length===0&&!showNewRuta&&(
                          <div style={{textAlign:"center",padding:"32px",color:"#8aaabb",fontSize:13}}>
                            Sin rutas para esta semana. Crea la primera.
                          </div>
                        )}

                        {rutasSemana.filter(r=>rutasFiltro==="todas"||r.activo!==false).map(r=>{
                          const auditor=usuarios.find(u=>u.id===r.auditorId);
                          const modulo=modulosAud.find(m=>m.id===r.moduloId);
                          const tiendasRuta=(r.tiendas||[]).map(tid=>tiendas.find(t=>t.id===tid)).filter(Boolean);
                          const auditadasSemana=Object.values(auditorias||{}).filter(a=>a.auditorId===r.auditorId&&a.semana===semanaActual&&(r.tiendas||[]).includes(a.tiendaId));
                          const pct=tiendasRuta.length>0?Math.round(auditadasSemana.length/tiendasRuta.length*100):0;
                          const initials=(auditor?.nombre||"?").split(" ").slice(0,2).map(w=>w[0]).join("").toUpperCase();
                          return(
                            <div key={r.id} style={{...S.card,padding:"12px 16px",marginBottom:8,opacity:r.activo===false?0.55:1}}>
                              <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:8}}>
                                <div style={{width:38,height:38,borderRadius:10,background:"#e6f1fb",border:"1.5px solid #85B7EB44",display:"flex",alignItems:"center",justifyContent:"center",fontSize:12,fontWeight:700,color:"#0C447C",flexShrink:0}}>{initials}</div>
                                <div style={{flex:1,minWidth:0}}>
                                  <div style={{fontWeight:700,fontSize:13,color:"#1a2f4a",marginBottom:2}}>{auditor?.nombre||"Auditor"}</div>
                                  <div style={{fontSize:11,color:"#8aaabb"}}>
                                    {(r.moduloIds&&r.moduloIds.length>0)?r.moduloIds.map(id=>modulosAud.find(m=>m.id===id)?.nombre).filter(Boolean).join(" · "):(r.moduloId&&modulosAud.find(m=>m.id===r.moduloId)?.nombre)||"Sin módulo asignado"}
                                  </div>
                                </div>
                                <span style={{fontSize:10,fontWeight:500,padding:"2px 6px",borderRadius:20,background:"#f0f4f8",color:"#5a7a9a",border:"0.5px solid #e2e8f0"}}>
                                  {r.frecuencia==="diaria"?"Diaria":r.frecuencia==="quincenal"?"Quincenal":r.frecuencia==="mensual"?"Mensual":r.frecuencia==="unica"?"Única":"Semanal"}
                                </span>
                                <span style={{fontSize:10,fontWeight:700,padding:"2px 7px",borderRadius:20,background:r.tipoRuta==="regular"?"#e6f1fb":r.tipoRuta==="fuera_ruta"?"#FAEEDA":"#EEEFFE",color:r.tipoRuta==="regular"?"#0C447C":r.tipoRuta==="fuera_ruta"?"#854F0B":"#3C3489"}}>
                                  {r.tipoRuta==="fuera_ruta"?"Fuera de ruta":r.tipoRuta==="excepcional"?"Excepcional":"Regular"}
                                </span>
                                <span style={{fontSize:10,fontWeight:700,padding:"2px 7px",borderRadius:20,background:r.perfilCalendario==="operativo_trade"?"#e0fafa":r.perfilCalendario==="tienda"?"#e8f4fd":"#f0f4f8",color:r.perfilCalendario==="operativo_trade"?"#085041":r.perfilCalendario==="tienda"?"#0C447C":"#5a7a9a"}}>
                                  {r.perfilCalendario==="operativo_trade"?"Operativo Trade":r.perfilCalendario==="tienda"?"Horario tienda":"Administrativo"}
                                </span>
                                <span style={{fontSize:10,fontWeight:700,padding:"2px 8px",borderRadius:20,background:r.activo===false?"#fff1f2":"#e0fafa",color:r.activo===false?"#dc2626":"#085041"}}>
                                  {r.activo===false?"Inactiva":"Activa"}
                                </span>
                                <button onClick={()=>{
                                  setNewRuta({auditorId:r.auditorId,moduloIds:r.moduloIds||(r.moduloId?[r.moduloId]:[]),tiendas:r.tiendas||[],frecuencia:r.frecuencia||"semanal",zona:r.routeMeta?.zonas?.[0]||"",distrito:r.routeMeta?.distritos?.length===1?r.routeMeta.distritos[0]:"",formato:r.routeMeta?.formatos?.length===1?r.routeMeta.formatos[0]:"Todas",tipoRuta:r.tipoRuta||"regular",perfilCalendario:r.perfilCalendarioOrigen||r.perfilCalendario||"auto",motivoExcepcion:r.excepcion?.motivo||"",editId:r.id});
                                  setShowNewRuta(true);
                                }} style={{padding:"5px 8px",borderRadius:8,border:"1px solid #c8d8e8",background:"#f8fafc",color:"#5a7a9a",cursor:"pointer",fontSize:11}}>Editar</button>
                                <div title={r.activo===false?"Activar ruta":"Desactivar ruta"} onClick={async e=>{e.stopPropagation();await setDoc(doc(db,"rutas",r.id),{activo:r.activo===false},{ merge:true});showToast(r.activo===false?"Ruta activada":"Ruta desactivada");}} style={{width:34,height:19,borderRadius:10,background:r.activo===false?"#e2e8f0":"#00b5b4",position:"relative",cursor:"pointer",flexShrink:0,transition:"background .2s"}}><div style={{width:15,height:15,borderRadius:"50%",background:"#fff",position:"absolute",top:2,left:r.activo===false?2:17,transition:"left .2s",boxShadow:"0 1px 3px rgba(0,0,0,.2)"}}/></div>
                              </div>
                              <div style={{display:"flex",gap:5,flexWrap:"wrap",marginBottom:8}}>
                                {tiendasRuta.map(t=>{
                                  const auditada=auditadasSemana.some(a=>a.tiendaId===t.id);
                                  return(
                                    <span key={t.id} style={{fontSize:10,fontWeight:500,padding:"2px 8px",borderRadius:20,background:auditada?"#EAF3DE":"#e6f1fb",color:auditada?"#27500A":"#0C447C",border:`0.5px solid ${auditada?"#C0DD97":"#85B7EB"}`}}>
                                      Vega {nomTienda(t)} {auditada?"✓":""}
                                    </span>
                                  );
                                })}
                              </div>
                              <div style={{display:"flex",alignItems:"center",gap:10}}>
                                <div style={{flex:1,height:4,borderRadius:2,background:"#f0f4f8"}}>
                                  <div style={{width:`${pct}%`,height:"100%",borderRadius:2,background:pct===100?"#639922":"#00b5b4",transition:"width .3s"}}/>
                                </div>
                                <span style={{fontSize:11,fontWeight:700,color:pct===100?"#27500A":"#085041",minWidth:36}}>{pct}%</span>
                                <span style={{fontSize:11,color:"#8aaabb"}}>{auditadasSemana.length}/{tiendasRuta.length}</span>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                      );
                    })()}

                    {/* ══ TAB TAREAS ══ */}
                    {audCfgTab==="tareas"&&(()=>{
                      const areaActiva=areas.filter(a=>a.activa!==false);
                      return(
                      <div>
                        <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:12}}>
                          <div>
                            <div style={{fontSize:13,fontWeight:700,color:"#1a2f4a"}}>Módulos de evaluación</div>
                            <div style={{fontSize:11,color:"#8aaabb"}}>{modulosAud.filter(m=>m.activo!==false).length} módulos activos</div>
                          </div>
                          <button onClick={()=>{setShowNewMod(true);setNewModAud({nombre:"",area:"",cargo:"",rol:"auditor",tareas:[],accesos:[],scoreConfig:null,editId:null});}}
                            style={{padding:"8px 14px",borderRadius:50,border:"none",background:"#1a2f4a",color:"#fff",cursor:"pointer",fontWeight:600,fontSize:12,display:"flex",alignItems:"center",gap:6}}>
                            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.5" strokeLinecap="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
                            Nuevo módulo
                          </button>
                        </div>

                        {showNewMod&&(
                          <div style={{...S.card,padding:"16px",marginBottom:14,border:"1.5px solid #6C6EF5"}}>
                            <div style={{fontWeight:700,fontSize:13,color:"#1a2f4a",marginBottom:12}}>{newModAud.editId?"Editar módulo":"Nuevo módulo de evaluación"}</div>
                            <div style={{marginBottom:10}}>
                              <label style={S.lbl}>NOMBRE DEL MÓDULO *</label>
                              <input value={newModAud.nombre} onChange={e=>setNewModAud(p=>({...p,nombre:e.target.value}))} placeholder="Ej: Implementación POP" style={S.inp}/>
                            </div>

                            {/* ── Accesos múltiples ── */}
                            <div style={{borderTop:"1px solid #f0f4f8",paddingTop:12,marginBottom:12}}>
                              <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:8}}>
                                <label style={S.lbl}>ACCESOS (área · cargo · rol)</label>
                                <button onClick={()=>setNewModAud(p=>({...p,accesos:[...(p.accesos||[]),{area:"",cargo:"",rol:"auditor"}]}))}
                                  style={{display:"flex",alignItems:"center",gap:4,padding:"4px 10px",borderRadius:8,border:"1px solid #c8d8e8",background:"#f8fafc",color:"#5a7a9a",cursor:"pointer",fontSize:11}}>
                                  <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
                                  Agregar acceso
                                </button>
                              </div>
                              {(newModAud.accesos||[]).length===0&&(
                                <div style={{fontSize:11,color:"#8aaabb",padding:"6px 0"}}>Sin accesos definidos — agrega al menos uno</div>
                              )}
                              {(newModAud.accesos||[]).map((ac,ai)=>(
                                <div key={ai} style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr auto",gap:8,marginBottom:8,alignItems:"center"}}>
                                  <select value={ac.area} onChange={e=>{const v=e.target.value;setNewModAud(p=>({...p,accesos:p.accesos.map((x,xi)=>xi===ai?{...x,area:v,cargo:""}:x)}));}}
                                    style={{...S.inp,margin:0}}>
                                    <option value="">Área *</option>
                                    {areaActiva.map(a=><option key={a.id} value={a.id}>{a.nombre}</option>)}
                                  </select>
                                  <select value={ac.cargo} onChange={e=>setNewModAud(p=>({...p,accesos:p.accesos.map((x,xi)=>xi===ai?{...x,cargo:e.target.value}:x)}))}
                                    style={{...S.inp,margin:0}} disabled={!ac.area}>
                                    <option value="">Cargo</option>
                                    {(areas.find(a=>a.id===ac.area)?.cargos||[]).filter(c=>c.activo!==false).map(c=><option key={c.id} value={c.nombre}>{c.nombre}</option>)}
                                  </select>
                                  <select value={ac.rol} onChange={e=>setNewModAud(p=>({...p,accesos:p.accesos.map((x,xi)=>xi===ai?{...x,rol:e.target.value}:x)}))}
                                    style={{...S.inp,margin:0}}>
                                    <option value="auditor">Auditor</option>
                                    <option value="coordinador">Coordinador</option>
                                    <option value="admin">Admin</option>
                                  </select>
                                  <button onClick={()=>setNewModAud(p=>({...p,accesos:p.accesos.filter((_,xi)=>xi!==ai)}))}
                                    style={{padding:"6px 9px",borderRadius:8,border:"1.5px solid #fecaca",background:"#fff1f2",color:"#dc2626",cursor:"pointer"}}>
                                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><polyline points="3,6 5,6 21,6"/><path d="M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6"/></svg>
                                  </button>
                                </div>
                              ))}
                            </div>

                            <div style={{borderTop:"1px solid #f0f4f8",paddingTop:12,marginBottom:12}}>
                              <label style={{...S.lbl,marginBottom:8}}>TAREAS DEL MÓDULO</label>
                              {(newModAud.tareas||[]).map((t,i)=>(
                                <div key={i} style={{display:"flex",gap:6,marginBottom:6}}>
                                  <input value={t.nombre} onChange={e=>setNewModAud(p=>({...p,tareas:p.tareas.map((x,xi)=>xi===i?{...x,nombre:e.target.value}:x)}))}
                                    placeholder="Nombre de la tarea" style={{...S.inp,flex:1}}/>
                                  <button onClick={()=>setNewModAud(p=>({...p,tareas:p.tareas.filter((_,xi)=>xi!==i)}))}
                                    style={{padding:"6px 9px",borderRadius:8,border:"1.5px solid #fecaca",background:"#fff1f2",color:"#dc2626",cursor:"pointer"}}>
                                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><polyline points="3,6 5,6 21,6"/><path d="M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a1 1 0 011-1h4a1 1 0 011 1v2"/></svg>
                                  </button>
                                </div>
                              ))}
                              <button onClick={()=>setNewModAud(p=>({...p,tareas:[...(p.tareas||[]),{id:"t"+Date.now(),nombre:"",activo:true}]}))}
                                style={{display:"flex",alignItems:"center",gap:6,padding:"7px 12px",borderRadius:8,border:"1px solid #c8d8e8",background:"#f8fafc",color:"#5a7a9a",cursor:"pointer",fontSize:11,marginTop:4}}>
                                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
                                Agregar tarea
                              </button>
                            </div>
                            <div style={{display:"flex",gap:8}}>
                              <button onClick={async()=>{
                                if(!newModAud.nombre.trim()) return showToast("Ingresa el nombre del módulo");
                                if(!(newModAud.accesos||[]).length) return showToast("Agrega al menos un acceso");
                                const tareas=(newModAud.tareas||[]).filter(t=>t.nombre.trim()).map((t,i)=>({...t,orden:i}));
                                const accesos=(newModAud.accesos||[]).filter(a=>a.area);
                                const data={nombre:newModAud.nombre.trim(),accesos,tareas,scoreConfig:newModAud.scoreConfig||{enabled:false,tipo:"numerico",escala:[0,1.5,3],labels:["No ejecutado","Por mejorar","Correcto"],version:1,vigenteDesde:new Date().toISOString()},activo:true,orden:modulosAud.length+1};
                                if(newModAud.editId){await setDoc(doc(db,"modulos_auditoria",newModAud.editId),data,{merge:true});showToast("Módulo actualizado");}
                                else{await setDoc(doc(collection(db,"modulos_auditoria")),data);showToast("Módulo creado");}
                                setShowNewMod(false);setNewModAud({nombre:"",area:"",cargo:"",rol:"auditor",tareas:[],accesos:[],scoreConfig:null,editId:null});
                              }} style={{flex:1,padding:"10px",borderRadius:50,border:"none",background:"#1a2f4a",color:"#fff",cursor:"pointer",fontWeight:700,fontSize:12}}>
                                {newModAud.editId?"Guardar cambios":"Crear módulo"}
                              </button>
                              <button onClick={()=>{setShowNewMod(false);setNewModAud({nombre:"",area:"",cargo:"",rol:"auditor",tareas:[],accesos:[],scoreConfig:null,editId:null});}} style={{padding:"10px 16px",borderRadius:50,border:"1px solid #e2e8f0",background:"#fff",color:"#5a7a9a",cursor:"pointer",fontSize:12}}>Cancelar</button>
                            </div>
                          </div>
                        )}

                        {modulosAud.length===0&&!showNewMod&&(
                          <div style={{textAlign:"center",padding:"32px",color:"#8aaabb",fontSize:13}}>Sin módulos. Crea el primero.</div>
                        )}

                        {modulosAud.map((m,mIdx)=>{
                          const isOpen=modAudOpen===m.id;
                          const ROMANOS=["I","II","III","IV","V","VI","VII","VIII"];
                          const romano=ROMANOS[mIdx]||String(mIdx+1);
                          const MOD_COLORS=[
                            {bg:"#e6f1fb",txt:"#0C447C",accent:"#185FA5",pill:"#B5D4F4"},
                            {bg:"#e0fafa",txt:"#085041",accent:"#0F6E56",pill:"#9FE1CB"},
                            {bg:"#f0edff",txt:"#3C3489",accent:"#534AB7",pill:"#CECBF6"},
                            {bg:"#FAEEDA",txt:"#633806",accent:"#854F0B",pill:"#FAC775"},
                          ];
                          const mc=MOD_COLORS[mIdx%4];
                          const accesos=m.accesos||[];
                          const accesoAreas=[...new Set(accesos.map(a=>a.area||a.cargo||"").filter(Boolean))];
                          const accesoRoles=[...new Set(accesos.map(a=>a.rol||"").filter(Boolean))];
                          const tareasActivas=(m.tareas||[]).filter(t=>t.activo!==false).length;
                          const totalTareas=(m.tareas||[]).length;
                          return(
                            <div key={m.id} style={{border:"1px solid #E2E8F0",borderRadius:14,marginBottom:10,overflow:"hidden",opacity:m.activo===false?0.55:1,background:"#fff"}}>
                              <div style={{display:"flex",alignItems:"stretch",cursor:"pointer"}} onClick={()=>setModAudOpen(isOpen?null:m.id)}>
                                <div style={{width:48,background:mc.accent,display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}>
                                  <span style={{color:"#fff",fontWeight:800,fontSize:13,letterSpacing:".02em",writingMode:"vertical-rl",transform:"rotate(180deg)",padding:"10px 0"}}>{romano}</span>
                                </div>
                                <div style={{flex:1,padding:"12px 14px",minWidth:0}}>
                                  <div style={{display:"flex",alignItems:"flex-start",gap:8,marginBottom:6}}>
                                    <div style={{flex:1,minWidth:0}}>
                                      <div style={{fontWeight:700,fontSize:13,color:"#1a2f4a",marginBottom:4,display:"flex",alignItems:"center",gap:6,flexWrap:"wrap"}}>
                                        {"Módulo "+romano+" · "+m.nombre}
                                        {m.activo===false&&<span style={{fontSize:9,background:"#fff1f2",color:"#dc2626",padding:"1px 6px",borderRadius:10,fontWeight:700}}>Inactivo</span>}
                                      </div>
                                      <div style={{display:"flex",gap:5,flexWrap:"wrap",alignItems:"center"}}>
                                        <span style={{fontSize:10,color:"#8aaabb"}}>{totalTareas} tareas</span>
                                        {accesoAreas.map((a,i)=>(
                                          <span key={i} style={{fontSize:10,fontWeight:700,padding:"2px 8px",borderRadius:20,background:mc.bg,color:mc.txt,border:"0.5px solid "+mc.pill}}>{a}</span>
                                        ))}
                                        {accesoRoles.map((r,i)=>(
                                          <span key={"r"+i} style={{fontSize:10,fontWeight:600,padding:"2px 8px",borderRadius:20,background:"#f0f4f8",color:"#5a7a9a"}}>{r}</span>
                                        ))}
                                        {!accesoAreas.length&&m.area&&(
                                          <span style={{fontSize:10,fontWeight:700,padding:"2px 8px",borderRadius:20,background:mc.bg,color:mc.txt,border:"0.5px solid "+mc.pill}}>{m.area}</span>
                                        )}
                                        {!accesoAreas.length&&m.cargo&&(
                                          <span style={{fontSize:10,padding:"2px 8px",borderRadius:20,background:"#f0f4f8",color:"#5a7a9a"}}>{m.cargo}</span>
                                        )}
                                      </div>
                                    </div>
                                    <div style={{display:"flex",alignItems:"center",gap:8,flexShrink:0}} onClick={e=>e.stopPropagation()}>
                                      <button onClick={()=>{setNewModAud({nombre:m.nombre,area:m.area,cargo:m.cargo||"",rol:m.rol||"auditor",tareas:m.tareas||[],accesos:m.accesos||[],scoreConfig:m.scoreConfig||null,editId:m.id});setShowNewMod(true);}}
                                        style={{padding:"5px 10px",borderRadius:8,border:"1px solid #c8d8e8",background:"#f8fafc",color:"#5a7a9a",cursor:"pointer",fontSize:11,fontWeight:600}}>Editar</button>
                                      <div onClick={async()=>{await setDoc(doc(db,"modulos_auditoria",m.id),{activo:m.activo===false},{merge:true});showToast(m.activo===false?"Módulo activado":"Módulo desactivado");}}
                                        style={{width:38,height:22,borderRadius:11,background:m.activo===false?"#e2e8f0":"#00b5b4",position:"relative",cursor:"pointer",flexShrink:0,transition:"background .2s"}}>
                                        <div style={{width:18,height:18,borderRadius:"50%",background:"#fff",position:"absolute",top:2,left:m.activo===false?2:18,transition:"left .2s",boxShadow:"0 1px 3px rgba(0,0,0,.2)"}}/>
                                      </div>
                                    </div>
                                  </div>
                                </div>
                                <div style={{display:"flex",alignItems:"center",paddingRight:12}}>
                                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#94A3B8" strokeWidth="2" strokeLinecap="round" style={{transform:isOpen?"rotate(180deg)":"",transition:"transform .2s",flexShrink:0}}><polyline points="6,9 12,15 18,9"/></svg>
                                </div>
                              </div>
                              {isOpen&&(
                                <div style={{borderTop:"1px solid #f0f4f8",background:"#f8fafc"}}>
                                  <div style={{padding:"10px 14px 4px",display:"flex",alignItems:"center",justifyContent:"space-between"}}>
                                    <span style={{fontSize:10,fontWeight:700,color:"#8aaabb",letterSpacing:".05em"}}>TAREAS ({totalTareas})</span>
                                    <span style={{fontSize:10,color:mc.accent,fontWeight:600}}>{tareasActivas} activas</span>
                                  </div>
                                  {totalTareas===0&&<div style={{fontSize:11,color:"#b2bec3",padding:"8px 14px 12px"}}>Sin tareas. Edita el módulo para agregar.</div>}
                                  {(m.tareas||[]).map((t,ti)=>(
                                    <div key={t.id||ti} style={{display:"flex",alignItems:"center",gap:10,padding:"9px 14px",borderTop:ti>0?"0.5px solid #f0f4f8":"none",background:"#fff",opacity:t.activo===false?0.5:1}}>
                                      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#c8d8e8" strokeWidth="2" strokeLinecap="round"><line x1="8" y1="6" x2="21" y2="6"/><line x1="8" y1="12" x2="21" y2="12"/><line x1="8" y1="18" x2="21" y2="18"/><line x1="3" y1="6" x2="3.01" y2="6"/><line x1="3" y1="12" x2="3.01" y2="12"/><line x1="3" y1="18" x2="3.01" y2="18"/></svg>
                                      <span style={{flex:1,fontSize:12,color:t.activo===false?"#b2bec3":"#1a2f4a",textDecoration:t.activo===false?"line-through":"none"}}>{t.nombre}</span>
                                      <div onClick={async e=>{e.stopPropagation();const tareas=(m.tareas||[]).map((x,xi)=>xi===ti?{...x,activo:x.activo===false}:x);await setDoc(doc(db,"modulos_auditoria",m.id),{tareas},{merge:true});}}
                                        style={{width:32,height:18,borderRadius:9,background:t.activo===false?"#e2e8f0":"#00b5b4",position:"relative",cursor:"pointer",flexShrink:0,transition:"background .2s"}}>
                                        <div style={{width:14,height:14,borderRadius:"50%",background:"#fff",position:"absolute",top:2,left:t.activo===false?2:16,transition:"left .2s",boxShadow:"0 1px 2px rgba(0,0,0,.2)"}}/>
                                      </div>
                                    </div>
                                  ))}
                                  {totalTareas>0&&<div style={{height:6,background:"#f8fafc"}}/>}
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                      );
                    })()}

                    {/* ══ TAB SCORE — versionado ══ */}
                    {audCfgTab==="score"&&(()=>{
                      const mods=modulosAud.filter(m=>m.activo!==false);
                      const selected=mods.find(m=>m.id===scoreModuloSel)||null;
                      const selectedCfg=selected?normalizeScoreConfig(selected):null;
                      const history=(selected?.scoreConfigHistory||[]).slice().sort((a,b)=>(b.version||0)-(a.version||0));
                      const applyDraftFromModule=m=>{
                        const cfg=normalizeScoreConfig(m);
                        setScoreModuloSel(m.id);
                        setScoreDraft({enabled:cfg.enabled===true,tipo:cfg.tipo,escala:(cfg.escala||[]).join(","),labels:(cfg.labels||[]).join(",")});
                      };
                      return(
                      <div>
                        <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:12,gap:12,flexWrap:"wrap"}}>
                          <div>
                            <div style={{fontSize:13,fontWeight:700,color:"#1a2f4a"}}>Score por módulo</div>
                            <div style={{fontSize:11,color:"#8aaabb"}}>Primero define cómo se evalúa. Las tareas y rutas usan esta configuración vigente sin tocar históricos.</div>
                          </div>
                          <div style={{display:"flex",alignItems:"center",gap:8,padding:"8px 12px",borderRadius:12,background:"#f8fafc",border:"1px solid #e2e8f0"}}>
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#6C6EF5" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 19V5"/><path d="M4 19h16"/><rect x="7" y="11" width="3" height="5" rx="1"/><rect x="12" y="8" width="3" height="8" rx="1"/><rect x="17" y="4" width="3" height="12" rx="1"/></svg>
                            <span style={{fontSize:11,fontWeight:700,color:"#6C6EF5"}}>Versionado activo</span>
                          </div>
                        </div>

                        {mods.length===0&&<div style={{textAlign:"center",padding:"32px",color:"#8aaabb",fontSize:13}}>Crea primero un módulo en Tareas.</div>}
                        {mods.length>0&&(
                          <div style={{display:"grid",gridTemplateColumns:"minmax(260px,.9fr) 1.1fr",gap:14,alignItems:"start"}}>
                            <div>
                              {mods.map(m=>{
                                const cfg=normalizeScoreConfig(m);
                                const active=selected?.id===m.id;
                                return(
                                  <button key={m.id} onClick={()=>applyDraftFromModule(m)} style={{width:"100%",textAlign:"left",border:`1.5px solid ${active?"#6C6EF5":"#e2e8f0"}`,background:active?"#EEEFFE":"#fff",borderRadius:14,padding:12,marginBottom:8,cursor:"pointer"}}>
                                    <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:6}}>
                                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={cfg.enabled?"#00b5b4":"#8aaabb"} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 11l3 3L22 4"/><path d="M21 12v7a2 2 0 01-2 2H5a2 2 0 01-2-2V5a2 2 0 012-2h11"/></svg>
                                      <span style={{fontSize:12,fontWeight:800,color:"#1a2f4a",flex:1}}>{m.nombre}</span>
                                      <span style={{fontSize:9,fontWeight:800,padding:"2px 7px",borderRadius:20,background:cfg.enabled?"#e0fafa":"#f0f4f8",color:cfg.enabled?"#085041":"#8aaabb"}}>{cfg.enabled?"Evaluable":"No evaluable"}</span>
                                    </div>
                                    <div style={{fontSize:10,color:"#5a7a9a",lineHeight:1.5}}>Tipo: {cfg.tipo} · Escala: {(cfg.escala||[]).join(" / ")} · Configuración {cfg.version}</div>
                                  </button>
                                );
                              })}
                            </div>

                            {!selected&&(
                              <div style={{border:"1.5px dashed #c8d8e8",borderRadius:16,padding:32,background:"#f8fafc",textAlign:"center"}}>
                                <svg width="42" height="42" viewBox="0 0 24 24" fill="none" stroke="#6C6EF5" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" style={{marginBottom:10}}><path d="M4 19V5"/><path d="M4 19h16"/><rect x="7" y="11" width="3" height="5" rx="1"/><rect x="12" y="8" width="3" height="8" rx="1"/><rect x="17" y="4" width="3" height="12" rx="1"/></svg>
                                <div style={{fontSize:13,fontWeight:800,color:"#1a2f4a",marginBottom:4}}>Selecciona un módulo</div>
                                <div style={{fontSize:11,color:"#8aaabb",lineHeight:1.5}}>El score se configura por módulo y cada cambio crea una nueva configuración histórica.</div>
                              </div>
                            )}
                            {selected&&(
                              <div style={{border:"1.5px solid #e2e8f0",borderRadius:16,padding:14,background:"#fff"}}>
                                <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",gap:10,marginBottom:12}}>
                                  <div>
                                    <div style={{fontSize:13,fontWeight:800,color:"#1a2f4a"}}>{selected.nombre}</div>
                                    <div style={{fontSize:11,color:"#8aaabb"}}>Configuración vigente: {selectedCfg?.enabled?"activa":"inactiva"} · versión interna {selectedCfg?.version}</div>
                                  </div>
                                  <label style={{display:"flex",alignItems:"center",gap:8,cursor:"pointer",fontSize:11,fontWeight:700,color:"#1a2f4a"}}>
                                    <span>Score activo</span>
                                    <div onClick={()=>setScoreDraft(p=>({...p,enabled:!p.enabled}))} style={{width:38,height:22,borderRadius:11,background:scoreDraft.enabled?"#00b5b4":"#e2e8f0",position:"relative",transition:"background .2s"}}>
                                      <div style={{width:18,height:18,borderRadius:"50%",background:"#fff",position:"absolute",top:2,left:scoreDraft.enabled?18:2,transition:"left .2s",boxShadow:"0 1px 3px rgba(0,0,0,.2)"}}/>
                                    </div>
                                  </label>
                                </div>

                                <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10,marginBottom:10}}>
                                  <div>
                                    <label style={S.lbl}>TIPO DE EVALUACIÓN</label>
                                    <select value={scoreDraft.tipo} onChange={e=>{
                                      const tipo=e.target.value;
                                      setScoreDraft(p=>({ ...p, tipo, escala:tipo==="numerico"?p.escala:("0,1"), labels:tipo==="binario"?"No,Sí":tipo==="checklist"?"No realizado,Realizado":p.labels }));
                                    }} style={S.inp}>
                                      <option value="numerico">Numérico configurable</option>
                                      <option value="binario">Sí / No</option>
                                      <option value="checklist">Realizado / No realizado</option>
                                    </select>
                                  </div>
                                  <div>
                                    <label style={S.lbl}>ESCALA</label>
                                    <input value={scoreDraft.escala} disabled={scoreDraft.tipo!=="numerico"} onChange={e=>setScoreDraft(p=>({...p,escala:e.target.value}))} placeholder="0,1.5,3" style={{...S.inp,opacity:scoreDraft.tipo!=="numerico"?0.65:1}}/>
                                  </div>
                                </div>
                                <div style={{marginBottom:12}}>
                                  <label style={S.lbl}>ETIQUETAS</label>
                                  <input value={scoreDraft.labels} onChange={e=>setScoreDraft(p=>({...p,labels:e.target.value}))} placeholder="No ejecutado,Por mejorar,Correcto" style={S.inp}/>
                                </div>

                                <div style={{padding:10,borderRadius:12,background:"#f8fafc",border:"1px solid #e2e8f0",marginBottom:12}}>
                                  <div style={{fontSize:10,fontWeight:800,color:"#6C6EF5",marginBottom:6}}>Vista previa</div>
                                  <div style={{display:"flex",gap:6}}>
                                    {(scoreDraft.tipo==="numerico"?scoreDraft.escala.split(","):scoreDraft.tipo==="binario"?["0","1"]:["0","1"]).map((v,i)=>(
                                      <div key={i} style={{flex:1,padding:"8px 6px",borderRadius:10,background:["#1a2f4a","#f6a623","#00b5b4"][i%3],color:"#fff",textAlign:"center"}}>
                                        <div style={{fontSize:15,fontWeight:900}}>{v.trim()}</div>
                                        <div style={{fontSize:9,opacity:.85}}>{(scoreDraft.labels.split(",")[i]||"").trim()}</div>
                                      </div>
                                    ))}
                                  </div>
                                </div>

                                <button onClick={async()=>{
                                  const escala=(scoreDraft.tipo==="numerico"?scoreDraft.escala.split(",").map(x=>Number(x.trim())).filter(x=>!Number.isNaN(x)):[0,1]);
                                  if(scoreDraft.enabled&&(!escala.length||Math.max(...escala)<=0)) return showToast("Configura una escala válida");
                                  const labels=scoreDraft.labels.split(",").map(x=>x.trim()).filter(Boolean);
                                  const prev=normalizeScoreConfig(selected);
                                  const next={enabled:scoreDraft.enabled===true,tipo:scoreDraft.tipo,escala,labels:labels.length?labels:prev.labels,version:(Number(prev.version)||0)+1,vigenteDesde:new Date().toISOString(),vigenteHasta:null,updatedBy:uDni,updatedAt:new Date().toISOString()};
                                  const hist=[...(selected.scoreConfigHistory||[]),{...next}];
                                  await setDoc(doc(db,"modulos_auditoria",selected.id),{scoreConfig:next,scoreConfigHistory:hist},{merge:true});
                                  showToast("Score actualizado con nueva configuración");
                                }} style={{width:"100%",padding:"10px",borderRadius:50,border:"none",background:"#1a2f4a",color:"#fff",cursor:"pointer",fontWeight:800,fontSize:12}}>
                                  Guardar nueva configuración
                                </button>

                                <div style={{marginTop:14,borderTop:"1px solid #f0f4f8",paddingTop:10}}>
                                  <div style={{fontSize:10,fontWeight:800,color:"#8aaabb",letterSpacing:".05em",marginBottom:6}}>HISTORIAL DE CONFIGURACIONES</div>
                                  {history.length===0&&<div style={{fontSize:11,color:"#b2bec3"}}>Aún no hay cambios registrados.</div>}
                                  {history.slice(0,4).map((h,i)=>(
                                    <div key={i} style={{display:"flex",alignItems:"center",gap:8,padding:"6px 0",borderTop:i>0?"1px solid #f8fafc":"none"}}>
                                      <span style={{fontSize:10,fontWeight:800,color:"#6C6EF5",minWidth:95}}>Configuración {h.version}</span>
                                      <span style={{fontSize:10,color:"#5a7a9a",flex:1}}>{h.tipo} · {(h.escala||[]).join(" / ")}</span>
                                      <span style={{fontSize:9,color:"#8aaabb"}}>{h.enabled?"Activa":"Inactiva"}</span>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                      );
                    })()}

                  </div>
                </div>
              );
            })()}

            {/* ── PASO 2c: Diseño/ODT — Configuración ── FIX_DISENO_ODT_EVIDENCIAS_TRACKING_20260606 */}
            {cfgMod==="diseno"&&(()=>{
              const disenadores=usuarios.filter(u=>u.rol==="ejecutor"&&u.cargo==="Diseñador"&&u.activo!==false);
              const TIPOS_TRABAJO=[
                {id:"pop",   label:"Material POP",      hh:3,  color:"#e17055", svg:<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" width="15" height="15"><circle cx="12" cy="12" r="10"/><polygon points="10 8 16 12 10 16 10 8"/></svg>},
                {id:"cat",   label:"Catálogo",           hh:8,  color:"#f6a623", svg:<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" width="15" height="15"><path d="M4 19.5A2.5 2.5 0 016.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 014 19.5v-15A2.5 2.5 0 016.5 2z"/></svg>},
                {id:"dig",   label:"Digital / RRSS",    hh:2,  color:"#6C6EF5", svg:<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" width="15" height="15"><rect x="5" y="2" width="14" height="20" rx="2"/><line x1="12" y1="18" x2="12.01" y2="18"/></svg>},
                {id:"vol",   label:"Volante / Afiche",  hh:2.5,color:"#0984e3", svg:<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" width="15" height="15"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><path d="M14 2v6h6"/></svg>},
                {id:"prec",  label:"Marcador Precio",   hh:1.5,color:"#00b5b4", svg:<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" width="15" height="15"><rect x="3" y="4" width="18" height="12" rx="2"/><path d="M8 20h8M12 16v4"/></svg>},
                {id:"gond",  label:"Góndola / Exhibidor",hh:4, color:"#607d9d", svg:<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" width="15" height="15"><path d="M3 10h18"/><path d="M5 10l2-6h10l2 6"/><path d="M6 10v10M18 10v10M4 20h16"/></svg>},
                {id:"crea",  label:"Creativo (brief)",  hh:10, color:"#6C6EF5", svg:<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" width="15" height="15"><path d="M12 2l2.9 6.1 6.7.9-4.8 4.7 1.1 6.6L12 17.2 6.1 20.3l1.1-6.6L2.4 9l6.7-.9z"/></svg>},
              ];
              const S2={padding:"12px 16px",background:"#fff",borderRadius:14,border:"1px solid #E2E8F0",marginBottom:14};
              const secTitle={display:"flex",alignItems:"center",gap:8,fontSize:13,fontWeight:800,color:"#1a2f4a",marginBottom:12};
              return(
                <div style={{paddingTop:16}}>
                  <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:14}}>
                    {/* Columna izquierda: Equipo */}
                    <div style={S2}>
                      <div style={secTitle}>
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#6C6EF5" strokeWidth="2" strokeLinecap="round"><path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75"/></svg>
                        Equipo de diseño
                      </div>
                      <div style={{fontSize:10,color:"#8aaabb",marginBottom:12,display:"flex",alignItems:"center",gap:6}}>
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
                        Usuarios con rol <b style={{color:"#6C6EF5",marginLeft:3}}>Ejecutor</b> y cargo <b style={{color:"#6C6EF5",marginLeft:3}}>Diseñador</b>
                      </div>
                      {disenadores.length===0&&(
                        <div style={{textAlign:"center",padding:"20px 0",color:"#b2bec3",fontSize:12}}>
                          Sin diseñadores asignados.<br/>Crea usuarios con rol Ejecutor y cargo Diseñador.
                        </div>
                      )}
                      {disenadores.map(u=>(
                        <div key={u.id} style={{display:"flex",alignItems:"center",justifyContent:"space-between",gap:8,border:"1px solid #E2E8F0",background:"#f8fafc",borderRadius:12,padding:10,marginBottom:9}}>
                          <div style={{display:"flex",alignItems:"center",gap:10}}>
                            <div style={{width:34,height:34,borderRadius:"50%",background:"linear-gradient(135deg,#6C6EF5,#0984e3)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:12,fontWeight:800,color:"white",flexShrink:0}}>
                              {(u.nombre||"?").slice(0,2).toUpperCase()}
                            </div>
                            <div>
                              <div style={{fontSize:12,fontWeight:700,color:"#1a2f4a"}}>{u.nombre||u.id}</div>
                              <div style={{fontSize:10,color:"#8aaabb",marginTop:1}}>DNI ···{String(u.id||"").slice(-3)} · {u.email||""}</div>
                            </div>
                          </div>
                          <div style={{display:"flex",alignItems:"center",gap:8}}>
                            <select style={{padding:"4px 8px",border:"1px solid #E2E8F0",borderRadius:7,fontSize:11,color:"#1a2f4a",background:"white"}}>
                              <option>Team Diseño</option><option>Freelance</option>
                            </select>
                            <span style={{padding:"3px 10px",background:"rgba(108,110,245,.12)",color:"#6C6EF5",borderRadius:20,fontSize:11,fontWeight:800}}>40h/sem</span>
                          </div>
                        </div>
                      ))}
                      {/* Freelance excepcional — sin crear usuario */}
                      <div style={{borderTop:"1px solid #F1F5F9",paddingTop:10,marginTop:4}}>
                        <button onClick={()=>{const f=document.getElementById("odt-free");if(f)f.style.display=f.style.display==="none"?"block":"none";}}
                          style={{width:"100%",display:"flex",alignItems:"center",gap:8,padding:"10px 13px",border:"1.5px dashed #E2E8F0",borderRadius:12,color:"#8aaabb",fontSize:12,fontWeight:700,background:"white",cursor:"pointer"}}>
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="16"/><line x1="8" y1="12" x2="16" y2="12"/></svg>
                          Agregar freelance excepcional
                          <span style={{fontSize:9,fontWeight:400,marginLeft:4}}>— sin acceso permanente</span>
                        </button>
                        <div id="odt-free" style={{display:"none",marginTop:12,padding:12,border:"1.5px dashed rgba(246,166,35,.55)",background:"#fffaf0",borderRadius:12}}>
                          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8}}>
                            <div><label style={{fontSize:10,fontWeight:700,color:"#8aaabb",display:"block",marginBottom:4}}>NOMBRE</label>
                              <input style={{width:"100%",padding:"9px 11px",border:"1.5px solid #E2E8F0",borderRadius:8,fontSize:12,fontFamily:"inherit"}} placeholder="Nombre freelance"/></div>
                            <div><label style={{fontSize:10,fontWeight:700,color:"#8aaabb",display:"block",marginBottom:4}}>CONTACTO</label>
                              <input style={{width:"100%",padding:"9px 11px",border:"1.5px solid #E2E8F0",borderRadius:8,fontSize:12,fontFamily:"inherit"}} placeholder="email o celular"/></div>
                          </div>
                          <div style={{fontSize:10,color:"#b2a06a",marginTop:8}}>Este registro es solo referencial. No crea acceso a la app.</div>
                        </div>
                      </div>
                    </div>

                    {/* Columna derecha: Tipos HH + Reglas */}
                    <div>
                      <div style={{...S2,marginBottom:14}}>
                        <div style={secTitle}>
                          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#00b5b4" strokeWidth="2" strokeLinecap="round"><path d="M12 20h9"/><path d="M16.5 3.5a2.121 2.121 0 013 3L7 19l-4 1 1-4L16.5 3.5z"/></svg>
                          Tipos de trabajo y HH estimadas
                        </div>
                        {TIPOS_TRABAJO.map(t=>(
                          <div key={t.id} style={{display:"flex",alignItems:"center",justifyContent:"space-between",padding:"9px 0",borderBottom:"1px solid #F1F5F9"}}>
                            <div style={{display:"flex",alignItems:"center",gap:10,fontSize:12,fontWeight:600,color:"#1a2f4a"}}>
                              <span style={{color:t.color}}>{t.svg}</span>
                              {t.label}
                            </div>
                            <div style={{display:"flex",alignItems:"center",gap:6}}>
                              <input defaultValue={t.hh} type="number" min="0.5" step="0.5"
                                style={{width:60,padding:"5px 8px",border:"1.5px solid #E2E8F0",borderRadius:8,fontSize:12,textAlign:"center",fontFamily:"inherit"}}/>
                              <span style={{fontSize:11,color:"#8aaabb"}}>h est.</span>
                            </div>
                          </div>
                        ))}
                      </div>
                      <div style={S2}>
                        <div style={secTitle}>
                          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#f6a623" strokeWidth="2" strokeLinecap="round"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 010 2.83 2 2 0 01-2.83 0l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-4 0v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83-2.83l.06-.06A1.65 1.65 0 004.68 15a1.65 1.65 0 00-1.51-1H3a2 2 0 010-4h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 012.83-2.83l.06.06A1.65 1.65 0 009 4.68a1.65 1.65 0 001-1.51V3a2 2 0 014 0v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 2.83l-.06.06A1.65 1.65 0 0019.4 9a1.65 1.65 0 001.51 1H21a2 2 0 010 4h-.09a1.65 1.65 0 00-1.51 1z"/></svg>
                          Reglas del flujo
                        </div>
                        {[
                          {label:"Notificar al asignar ODT",sub:"Enviar notificación al diseñador al crear ODT"},
                          {label:"Requiere aprobación antes de entregado",sub:"El coordinador debe aprobar antes de marcar como entregado"},
                          {label:"Alertar retraso automático",sub:"Marcar como retrasado si pasa la hora de corte"},
                        ].map((r,i)=>(
                          <div key={i} style={{display:"flex",alignItems:"center",justifyContent:"space-between",padding:"12px 0",borderBottom:i<2?"1px solid #F1F5F9":"none",gap:12}}>
                            <div>
                              <div style={{fontSize:12,fontWeight:700,color:"#1a2f4a"}}>{r.label}</div>
                              <div style={{fontSize:11,color:"#8aaabb",marginTop:3}}>{r.sub}</div>
                            </div>
                            <div style={{width:38,height:22,background:"#00b5b4",borderRadius:11,position:"relative",flexShrink:0,cursor:"pointer"}}>
                              <div style={{position:"absolute",width:18,height:18,borderRadius:"50%",background:"white",right:2,top:2,boxShadow:"0 1px 3px rgba(0,0,0,.2)"}}/>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                  {/* Materiales configurables */}
                  <div style={{background:"#fff",borderRadius:14,border:"1px solid #E2E8F0",padding:16,marginTop:14,boxShadow:"0 2px 8px rgba(0,0,0,.05)"}}>
                    <div style={{display:"flex",alignItems:"center",gap:8,fontSize:13,fontWeight:800,color:"#1a2f4a",marginBottom:8}}>
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#0984e3" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 6h16M4 12h16M4 18h16"/></svg>
                      Materiales configurables para Nueva ODT
                    </div>
                    <div style={{fontSize:11,color:"#8aaabb",marginBottom:12}}>No reemplaza la lista aprobada: permite agregar nuevos materiales y activar/desactivar los precargados.</div>
                    <div style={{display:"grid",gap:8,marginBottom:12}}>
                      {[...ODT_MATERIALES_BASE,...odtMaterialesExtra].map((m,idx)=>{
                        const esPre=idx<ODT_MATERIALES_BASE.length;
                        return(
                          <div key={m} style={{display:"flex",alignItems:"center",justifyContent:"space-between",gap:8,border:"1px solid #e2e8f0",borderRadius:10,background:"#f8fafc",padding:"9px 12px"}}>
                            <span><b style={{fontSize:12}}>{m}</b><small style={{display:"block",fontSize:10,color:"#8aaabb"}}>{esPre?"Precargado":"Agregado"}</small></span>
                            <button onClick={e=>{const b=e.currentTarget;const on=b.dataset.on==="1";b.dataset.on=on?"0":"1";b.style.background=on?"#fff":"rgba(0,181,180,.12)";b.style.borderColor=on?"#c8d8e8":"rgba(0,181,180,.32)";b.style.color=on?"#8aaabb":"#00b5b4";b.textContent=on?"Inactivo":"Activo";}} data-on="1"
                              style={{padding:"6px 12px",borderRadius:20,border:"1px solid rgba(0,181,180,.32)",background:"rgba(0,181,180,.12)",color:"#00b5b4",fontSize:11,fontWeight:800,cursor:"pointer",whiteSpace:"nowrap"}}>Activo</button>
                          </div>
                        );
                      })}
                    </div>
                    <div style={{display:"grid",gridTemplateColumns:"1fr 130px auto",gap:8}}>
                      <input id="odt-cfg-mat-name" style={{padding:"10px 12px",borderRadius:10,border:"1px solid #c8d8e8",background:"#f8fafc",fontSize:13,color:"#1a2f4a",outline:"none"}} placeholder="Nuevo material"/>
                      <input id="odt-cfg-mat-cat" style={{padding:"10px 12px",borderRadius:10,border:"1px solid #c8d8e8",background:"#f8fafc",fontSize:13,color:"#1a2f4a",outline:"none"}} placeholder="Categoría"/>
                      <button onClick={()=>{const n=(document.getElementById("odt-cfg-mat-name")||{}).value?.trim();if(!n){showToast("Ingresa el nombre del material");return;}setOdtMaterialesExtra(p=>[...p,n]);if(document.getElementById("odt-cfg-mat-name"))document.getElementById("odt-cfg-mat-name").value="";showToast("Material agregado");}} style={{padding:"10px 16px",borderRadius:10,border:"none",background:"linear-gradient(135deg,#00b5b4,#1a2f4a)",color:"#fff",fontSize:13,fontWeight:700,cursor:"pointer"}}>Agregar</button>
                    </div>
                    <div style={{fontSize:10,color:"#8aaabb",marginTop:6,lineHeight:1.4}}>Los materiales se leerán desde Nueva ODT sin modificar los históricos ya creados.</div>
                  </div>
                  <div style={{display:"flex",justifyContent:"flex-end",gap:10,marginTop:14}}>
                    <button style={{padding:"10px 18px",borderRadius:10,border:"1.5px solid #E2E8F0",color:"#8aaabb",fontSize:13,fontWeight:700,background:"white",cursor:"pointer"}}>Descartar</button>
                    <button onClick={()=>showToast("Configuración de Diseño guardada")}
                      style={{padding:"10px 18px",borderRadius:10,border:"none",background:"linear-gradient(135deg,#00b5b4,#1a2f4a)",color:"white",fontSize:13,fontWeight:700,cursor:"pointer"}}>Guardar configuración</button>
                  </div>
                </div>
              );
            })()}

            {/* ── Estado vacío cuando no hay módulo seleccionado ── */}
            {!cfgMod&&(
              <div style={{background:"#fff",borderRadius:14,border:"1px solid #E2E8F0",
                padding:"48px 20px",textAlign:"center",marginTop:8}}>
                <svg width="56" height="56" viewBox="0 0 64 64" fill="none"
                  style={{marginBottom:12}} aria-hidden="true">
                  <rect x="6" y="34" width="52" height="22" rx="6" fill="#FDB347"/>
                  <rect x="6" y="34" width="26" height="8" rx="3" fill="#E8973A"/>
                  <rect x="16" y="34" width="6" height="4" rx="2" fill="#FDB347"/>
                  <path d="M6 42h52" stroke="#E8973A" strokeWidth="1.5"/>
                  <rect x="10" y="18" width="44" height="18" rx="4" fill="#74b9e8"/>
                  <path d="M10 28l22-12 22 12" fill="#5ba3d4"/>
                  <rect x="24" y="18" width="16" height="14" rx="2" fill="#5ba3d4"/>
                </svg>
                <div style={{fontSize:13,color:"#b2bec3",fontWeight:500}}>Selecciona una sección del menú</div>
                <div style={{fontSize:11,color:"#c8d8e8",marginTop:4}}>Usuarios · Áreas · Roles · Log de accesos</div>
              </div>
            )}
          </div>
        );
      })()}

      {cfgTab===0&&(()=>{
        /* ══ CONSTANTES ══ */
        // FIX_RUTA_MODULOS_MULTISELECT_20260520 — usrTab puede ser null (dashboard), usar "usuarios" como default en cfg
        const usrTabEfectivo = usrTab||"usuarios";
        const ROL_CFG_U={
          admin:      {label:"Admin",       c:"#f6a623",bg:"#fff8ec"},
          coordinador:{label:"Coordinador", c:"#6C6EF5",bg:"#EEEFFE"},
          ejecutor:   {label:"Ejecutor",    c:"#00b5b4",bg:"#e0fafa"},
          auditor:    {label:"Auditor",     c:"#0984e3",bg:"#e6f1fb"},
          visor:      {label:"Visor",       c:"#8aaabb",bg:"#f0f4f8"},
        };
        const DOC_CFG={
          dni:{label:"DNI",ph:"12345678",hint:"8 dígitos",min:8,max:8,alpha:false},
          ruc:{label:"RUC",ph:"20123456789",hint:"11 dígitos",min:11,max:11,alpha:false},
          ce: {label:"Carnet Extranjería",ph:"CE12345678",hint:"8–12 alfanum.",min:8,max:12,alpha:true},
          cod:{label:"Código interno",ph:"VEGA2024RR",hint:"8–12 alfanum.",min:8,max:12,alpha:true},
        };
        const CARGOS_CON_TIENDA=["Gerente de Tienda","Jefe de Tienda"];
        const docCfg=DOC_CFG[newUsuario.tipoDoc]||DOC_CFG.dni;
        const areaActiva=areas.filter(a=>a.activa!==false);
        const AREA_LEGACY_MAP={"Trade Marketing":"marketing","trade marketing":"marketing","Marketing":"marketing","Operaciones":"operaciones","Comercial":"comercial"};
        const areaIdNorm=AREA_LEGACY_MAP[newUsuario.area]||newUsuario.area;
        const areaSelObj=areas.find(a=>a.id===areaIdNorm||a.nombre?.toLowerCase()===areaIdNorm?.toLowerCase());
        const cargosDisp=(areaSelObj?.cargos||[]).filter(c=>c.activo!==false);
        const needsTienda=CARGOS_CON_TIENDA.includes(newUsuario.cargo);
        const dniLen=(newUsuario.dni||"").length;
        const dniOk=dniLen>=docCfg.min&&dniLen<=docCfg.max;

        /* ── TAB BAR ── */
        const TABS_USR=[
          {id:"usuarios",label:"Usuarios",ico:<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 00-3-3.87"/><path d="M16 3.13a4 4 0 010 7.75"/></svg>},
          {id:"roles",   label:"Roles",   ico:<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>},
          {id:"areas",   label:"Áreas",   ico:<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z"/><polyline points="9,22 9,12 15,12 15,22"/></svg>},
        ];

        const usrsCnt=usuarios.filter(u=>u.activo!==false).length;
        const btnLabels={usuarios:"Nuevo usuario",roles:"Nuevo rol",areas:"Nueva área"};

        return(
        <div>
          {/* Header */}
          <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:0}}>
            <div>
              <div style={{fontWeight:700,fontSize:14,color:"#1a2f4a"}}>
                {usrTabEfectivo==="usuarios"?"Usuarios":usrTabEfectivo==="roles"?"Gestión de Roles":usrTabEfectivo==="log"?"Log de accesos":"Gestión de Áreas"}
              </div>
              <div style={{fontSize:11,color:"#8aaabb",marginTop:2}}>
                {usrTabEfectivo==="usuarios"?`${usrsCnt} activos · ${usuarios.length} totales`:
                 usrTabEfectivo==="log"?`${authLog.length} registros recientes`:
                 usrTabEfectivo==="roles"?`${roles.length} roles configurados`:
                 `${areas.filter(a=>a.activa!==false).length} áreas activas`}
              </div>
            </div>
            <button onClick={()=>setShowNUsuario(true)}
              style={{padding:"9px 16px",borderRadius:50,border:"none",background:"#1a2f4a",color:"#fff",cursor:"pointer",fontWeight:600,fontSize:12,display:"flex",alignItems:"center",gap:6}}>
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.5" strokeLinecap="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
              {btnLabels[usrTabEfectivo]}
            </button>
          </div>

          {/* Tab bar */}
          <div style={{display:"flex",gap:0,borderBottom:"1px solid #e2e8f0",marginBottom:14,marginTop:12}}>
            {TABS_USR.map(t=>(
              <button key={t.id} onClick={()=>{setUsrTab(t.id);setShowNUsuario(false);}}
                style={{padding:"9px 16px",border:"none",background:"transparent",cursor:"pointer",
                  fontSize:13,fontWeight:usrTabEfectivo===t.id?700:500,
                  color:usrTabEfectivo===t.id?"#6C6EF5":"#64748B",
                  borderBottom:`2px solid ${usrTabEfectivo===t.id?"#6C6EF5":"transparent"}`,
                  display:"flex",alignItems:"center",gap:6,transition:"all .15s"}}>
                {React.cloneElement(t.ico,{stroke:usrTabEfectivo===t.id?"#6C6EF5":"#94A3B8"})}
                {t.label}
              </button>
            ))}
          </div>

          {/* ════ TAB USUARIOS ════ */}
          {usrTabEfectivo==="usuarios"&&(()=>{
            return(
            <div>
              <div style={{position:"relative",marginBottom:12}}>
                <svg style={{position:"absolute",left:11,top:"50%",transform:"translateY(-50%)"}} width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#8aaabb" strokeWidth="2" strokeLinecap="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
                <input placeholder="Buscar por nombre, credencial, cargo o área..." value={busqUsuario||""} onChange={e=>setBusqUsuario(e.target.value)} style={{...S.inp,paddingLeft:34,fontSize:13}}/>
              </div>

              {showNUsuario&&(
                <div style={{...S.card,padding:"16px",marginBottom:14,border:"1.5px solid #00b5b4"}}>
                  <div style={{fontWeight:700,fontSize:13,color:"#1a2f4a",marginBottom:14,display:"flex",alignItems:"center",gap:8}}>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#00b5b4" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
                    {newUsuario.editId?"Editar usuario":"Nuevo usuario"}
                  </div>
                  {/* Datos personales */}
                  <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10,marginBottom:14}}>
                    <div><label style={S.lbl}>NOMBRE COMPLETO *</label><input value={newUsuario.nombre} onChange={e=>setNewUsuario(p=>({...p,nombre:e.target.value}))} placeholder="Ej: Roberto Ruesta" style={S.inp}/></div>
                    <div><label style={S.lbl}>EMAIL</label><input type="email" value={newUsuario.email||""} onChange={e=>setNewUsuario(p=>({...p,email:e.target.value}))} placeholder="nombre@empresa.pe" style={S.inp}/></div>
                    <div style={{gridColumn:"1/-1"}}>
                      <label style={S.lbl}>CONTACTO (MÓVIL / WHATSAPP)</label>
                      <div style={{display:"flex",gap:6}}>
                        <input type="tel" value={newUsuario.whatsapp||""} onChange={e=>setNewUsuario(p=>({...p,whatsapp:e.target.value.replace(/[^0-9]/g,"").slice(0,15),telefono:e.target.value.replace(/[^0-9]/g,"").slice(0,15)}))}
                          placeholder="51987654321" style={{...S.inp,flex:1}}/>
                        <div style={{padding:"8px 12px",borderRadius:9,background:"#e8faf5",border:"1px solid #25D36644",color:"#085041",fontSize:11,display:"flex",alignItems:"center",gap:4,flexShrink:0}}>
                          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z"/></svg>
                          WA listo
                        </div>
                      </div>
                      <div style={{fontSize:9,color:"#8aaabb",marginTop:2}}>Se usará para WhatsApp y contacto directo</div>
                    </div>
                  </div>
                  {/* Credencial */}
                  <div style={{borderTop:"1px solid #f0f4f8",paddingTop:14,marginBottom:14}}>
                    <div style={{fontSize:12,fontWeight:700,color:"#5a7a9a",marginBottom:10,display:"flex",alignItems:"center",gap:6}}>
                      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0110 0v4"/></svg>
                      CREDENCIAL DE ACCESO
                    </div>
                    <div style={{display:"flex",gap:6,marginBottom:10}}>
                      {Object.entries(DOC_CFG).map(([k,v])=>{
                        const on=newUsuario.tipoDoc===k;
                        return(<button key={k} onClick={()=>setNewUsuario(p=>({...p,tipoDoc:k,dni:""}))}
                          style={{flex:1,padding:"8px 4px",borderRadius:9,border:`1.5px solid ${on?"#1a2f4a":"#e2e8f0"}`,background:on?"#1a2f4a":"#f8fafc",color:on?"#fff":"#5a7a9a",cursor:"pointer",fontSize:10,fontWeight:600,textAlign:"center"}}>
                          {v.label}
                        </button>);
                      })}
                    </div>
                    <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10}}>
                      <div>
                        <label style={S.lbl}>NÚMERO *</label>
                        <input value={newUsuario.dni||""} maxLength={docCfg.max}
                          onChange={e=>{const v=docCfg.alpha?e.target.value.replace(/[^a-zA-Z0-9]/g,"").slice(0,docCfg.max).toUpperCase():e.target.value.replace(/[^0-9]/g,"").slice(0,docCfg.max);setNewUsuario(p=>({...p,dni:v}));}}
                          placeholder={docCfg.ph} style={{...S.inp,fontFamily:"monospace",letterSpacing:2}}/>
                        <div style={{fontSize:9,color:"#8aaabb",marginTop:2}}>{docCfg.hint}</div>
                      </div>
                      <div style={{padding:"10px 12px",borderRadius:10,background:dniOk?"#e0fafa":dniLen>0?"#fff8ec":"#f8fafc",border:`1px solid ${dniOk?"#00b5b4":dniLen>0?"#f6a623":"#e2e8f0"}`,display:"flex",alignItems:"center",gap:8}}>
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={dniOk?"#00b5b4":dniLen>0?"#f6a623":"#b2bec3"} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0110 0v4"/>
                        </svg>
                        <div>
                          <div style={{fontSize:11,fontWeight:700,color:dniOk?"#085041":dniLen>0?"#854F0B":"#8aaabb"}}>{dniOk?"Credencial válida":dniLen>0?`Mín. ${docCfg.min} chars`:"Ingresa el número"}</div>
                          <div style={{fontSize:10,color:dniOk?"#085041":"#b2bec3"}}>{dniOk?`Código: ${newUsuario.dni}`:`${dniLen}/${docCfg.max}`}</div>
                        </div>
                      </div>
                    </div>
                  </div>
                  {/* Rol + Área + Cargo */}
                  <div style={{borderTop:"1px solid #f0f4f8",paddingTop:14,marginBottom:14}}>
                    <div style={{fontSize:12,fontWeight:700,color:"#5a7a9a",marginBottom:10,display:"flex",alignItems:"center",gap:6}}>
                      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
                      ROL Y ACCESO
                    </div>
                    {/* Dropdown rol */}
                    <div style={{marginBottom:10}}>
                      <label style={S.lbl}>ROL *</label>
                      <select value={newUsuario.rol||"auditor"} onChange={e=>setNewUsuario(p=>({...p,rol:e.target.value}))}
                        style={{...S.inp,cursor:"pointer",borderColor:ROL_CFG_U[newUsuario.rol]?.c||"#e2e8f0",background:ROL_CFG_U[newUsuario.rol]?.bg||"#f8fafc",color:ROL_CFG_U[newUsuario.rol]?.c||"#1a2f4a",fontWeight:600}}>
                        {roles.filter(r=>r.activo!==false).map(r=><option key={r.id} value={r.id}>{r.nombre}</option>)}
                      </select>
                      <div style={{fontSize:10,color:ROL_CFG_U[newUsuario.rol]?.c||"#8aaabb",marginTop:3,paddingLeft:4}}>
                        {roles.find(r=>r.id===newUsuario.rol)?.desc||""}
                      </div>
                    </div>
                    <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10,marginBottom:needsTienda?10:0}}>
                      <div>
                        <label style={S.lbl}>ÁREA *</label>
                        <select value={newUsuario.area||""} onChange={e=>setNewUsuario(p=>({...p,area:e.target.value,cargo:"",tiendaId:""}))} style={{...S.inp,cursor:"pointer"}}>
                          <option value="">Seleccionar área</option>
                          {areaActiva.map(a=><option key={a.id} value={a.id}>{a.nombre}</option>)}
                        </select>
                      </div>
                      <div>
                        <label style={S.lbl}>CARGO</label>
                        <select value={newUsuario.cargo||""} onChange={e=>setNewUsuario(p=>({...p,cargo:e.target.value,tiendaId:""}))} style={{...S.inp,cursor:"pointer"}} disabled={!newUsuario.area}>
                          <option value="">{newUsuario.area?"Seleccionar cargo":"Primero elige área"}</option>
                          {cargosDisp.map(c=><option key={c.id} value={c.nombre}>{c.nombre}</option>)}
                        </select>
                      </div>
                    </div>
                    {needsTienda&&(
                      <div>
                        <label style={S.lbl}>TIENDA ASIGNADA *</label>
                        <select value={newUsuario.tiendaId||""} onChange={e=>setNewUsuario(p=>({...p,tiendaId:e.target.value}))} style={{...S.inp,cursor:"pointer",borderColor:"#0984e355",background:"#e6f1fb"}}>
                          <option value="">Seleccionar tienda</option>
                          {tiendas.filter(t=>t.activa).map(t=><option key={t.id} value={t.id}>Vega {nomTienda(t)}</option>)}
                        </select>
                      </div>
                    )}
                  </div>
                  <div style={{display:"flex",gap:8}}>
                    <button onClick={async()=>{
                      if(!newUsuario.nombre.trim()) return showToast("Ingresa el nombre completo");
                      if(!dniOk) return showToast(`Credencial: ${docCfg.min}–${docCfg.max} caracteres`);
                      if(!newUsuario.area) return showToast("Selecciona el área");
                      const data={nombre:newUsuario.nombre.trim(),rol:newUsuario.rol,tipoDoc:newUsuario.tipoDoc,dni:newUsuario.dni,email:newUsuario.email||"",whatsapp:newUsuario.whatsapp||"",telefono:newUsuario.whatsapp||"",area:newUsuario.area||"",cargo:newUsuario.cargo||"",tiendaId:newUsuario.tiendaId||"",activo:true};
                      if(newUsuario.editId){await setDoc(doc(db,"usuarios",newUsuario.editId),data,{merge:true});showToast("Usuario actualizado");}
                      else{const ref=doc(collection(db,"usuarios"));await setDoc(ref,{...data,ultimoAcceso:null});showToast("Usuario registrado");}
                      setShowNUsuario(false);setNewUsuario(NU_INIT);
                    }} style={{flex:1,padding:"11px",borderRadius:50,border:"none",background:"#1a2f4a",color:"#fff",cursor:"pointer",fontWeight:700,fontSize:13}}>
                      {newUsuario.editId?"Guardar cambios":"Registrar usuario"}
                    </button>
                    <button onClick={()=>{setShowNUsuario(false);setNewUsuario(NU_INIT);}} style={{padding:"11px 18px",borderRadius:50,border:"1px solid #e2e8f0",background:"#fff",color:"#5a7a9a",cursor:"pointer",fontSize:13}}>Cancelar</button>
                  </div>
                </div>
              )}

              {/* Lista usuarios */}
              {(()=>{
                const filtrados=(busqUsuario||"")?usuarios.filter(u=>u.nombre?.toLowerCase().includes(busqUsuario.toLowerCase())||u.dni?.toLowerCase().includes(busqUsuario.toLowerCase())||u.cargo?.toLowerCase().includes(busqUsuario.toLowerCase())||u.area?.toLowerCase().includes(busqUsuario.toLowerCase())):usuarios;
                if(!filtrados.length) return(<div style={{textAlign:"center",padding:"32px",color:"#8aaabb",fontSize:13}}>{busqUsuario?"Sin resultados":"Sin usuarios registrados."}</div>);
                return filtrados.map(u=>{
                  const rc=ROL_CFG_U[u.rol]||{label:u.rol||"?",c:"#8aaabb",bg:"#f0f4f8"};
                  const initials=(u.nombre||"?").split(" ").slice(0,2).map(w=>w[0]).join("").toUpperCase();
                  const AREA_LEG={"Trade Marketing":"marketing","trade marketing":"marketing"};
                  const areaIdR=AREA_LEG[u.area]||u.area;
                  const areaNombre=areas.find(a=>a.id===areaIdR||a.nombre?.toLowerCase()===areaIdR?.toLowerCase())?.nombre||u.area||"";
                  const tiendaNombre=u.tiendaId?tiendas.find(t=>t.id===u.tiendaId)?.n:"";
                  return(
                    <div key={u.id} style={{...S.card,padding:"12px 16px",marginBottom:8,display:"flex",alignItems:"center",gap:10,opacity:u.activo===false?0.5:1}}>
                      <div style={{width:40,height:40,borderRadius:11,background:rc.bg,border:`1.5px solid ${rc.c}33`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:13,fontWeight:700,color:rc.c,flexShrink:0}}>{initials}</div>
                      <div style={{flex:1,minWidth:0}}>
                        <div style={{fontWeight:700,fontSize:13,color:u.activo===false?"#94a3b8":"#1a2f4a",display:"flex",alignItems:"center",gap:5,flexWrap:"wrap",marginBottom:3}}>
                          {u.nombre}
                          <span style={{padding:"1px 7px",borderRadius:20,fontSize:10,fontWeight:600,background:rc.bg,color:rc.c,border:`1px solid ${rc.c}33`}}>{rc.label}</span>
                          {u.activo===false&&<span style={{fontSize:9,color:"#dc2626",background:"#fff1f2",padding:"1px 6px",borderRadius:10,fontWeight:700}}>PAUSADO</span>}
                          {u.bloqueadoHasta&&new Date(u.bloqueadoHasta)>new Date()&&<span style={{fontSize:9,color:"#854F0B",background:"#FAEEDA",padding:"1px 6px",borderRadius:10,fontWeight:700}}>BLOQUEADO</span>}
                        </div>
                        <div style={{fontSize:10,color:"#8aaabb",display:"flex",gap:5,flexWrap:"wrap",alignItems:"center"}}>
                          <span style={{fontFamily:"monospace"}}>{(u.tipoDoc||"DNI").toUpperCase()} ••••{(u.dni||"").slice(-4)}</span>
                          {areaNombre&&<span style={{background:"#f0edff",color:"#6c5ce7",padding:"1px 7px",borderRadius:10,fontWeight:600}}>{areaNombre}</span>}
                          {u.cargo&&<span style={{background:"#f0f4f8",color:"#5a7a9a",padding:"1px 7px",borderRadius:10}}>{u.cargo}</span>}
                          {tiendaNombre&&<span style={{background:"#e6f1fb",color:"#0C447C",padding:"1px 7px",borderRadius:10}}>Vega {tiendaNombre}</span>}
                        </div>
                      </div>
                      <button onClick={()=>{
                        // Mapeo legacy: nombres viejos de Firebase → ids nuevos en Firestore
                        const AREA_LEGACY={"Trade Marketing":"marketing","trade marketing":"marketing","Marketing":"marketing","Operaciones":"operaciones","Comercial":"comercial"};
                        const rawArea=u.area||"";
                        const areaId=areas.find(a=>a.id===rawArea)?.id
                          ||areas.find(a=>a.nombre?.toLowerCase()===rawArea.toLowerCase())?.id
                          ||AREA_LEGACY[rawArea]
                          ||rawArea;
                        setNewUsuario({nombre:u.nombre||"",rol:u.rol||"auditor",tipoDoc:u.tipoDoc||"dni",dni:u.dni||"",email:u.email||"",whatsapp:u.whatsapp||u.telefono||"",telefono:u.whatsapp||u.telefono||"",area:areaId,cargo:u.cargo||"",tiendaId:u.tiendaId||"",editId:u.id});
                        setShowNUsuario(true);
                      }} style={{padding:"7px 9px",borderRadius:9,border:"1px solid #c8d8e8",background:"#f8fafc",color:"#5a7a9a",cursor:"pointer"}}>
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
                      </button>
                      <button onClick={async()=>{await setDoc(doc(db,"usuarios",u.id),{activo:u.activo===false},{merge:true});showToast(u.activo===false?"Usuario activado":"Usuario pausado");}} style={{padding:"6px 11px",borderRadius:9,border:`1px solid ${u.activo===false?"#bbf7d0":"#fecaca"}`,background:u.activo===false?"#f0fdf4":"#fff1f2",color:u.activo===false?"#16a34a":"#dc2626",cursor:"pointer",fontSize:11,fontWeight:700}}>{u.activo===false?"Activar":"Pausar"}</button>
                      {u.bloqueadoHasta&&new Date(u.bloqueadoHasta)>new Date()&&<button onClick={async()=>{await setDoc(doc(db,"usuarios",u.id),{bloqueadoHasta:null,intentosFallidos:0},{merge:true});showToast("Usuario desbloqueado");}} style={{padding:"6px 9px",borderRadius:9,border:"1px solid #FAC775",background:"#FAEEDA",color:"#633806",cursor:"pointer",fontSize:10,fontWeight:700,whiteSpace:"nowrap"}}>Desbloquear</button>}
                      {u.whatsapp&&<button onClick={()=>{const msg=`Hola ${u.nombre}, se detectó un acceso no autorizado. Por favor verifica con el administrador.`;setWaModal({msg,numero:u.whatsapp,nombre:u.nombre});}} style={{padding:"7px 9px",borderRadius:9,border:"1.5px solid #25D366",background:"#e8faf5",color:"#085041",cursor:"pointer"}}><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z"/></svg></button>}
                      <button onClick={()=>{if(window.confirm(`¿Eliminar a ${u.nombre}?`))deleteUsuario(u.id);}} style={{padding:"7px 9px",borderRadius:9,border:"1.5px solid #fecaca",background:"#fff1f2",color:"#dc2626",cursor:"pointer"}}><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><polyline points="3,6 5,6 21,6"/><path d="M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a1 1 0 011-1h4a1 1 0 011 1v2"/></svg></button>
                    </div>
                  );
                });
              })()}
            </div>
            );
          })()}

          {/* ════ TAB ROLES ════ */}
          {usrTabEfectivo==="roles"&&(()=>{
            return(
            <div>
              {showNUsuario&&(
                <div style={{...S.card,padding:"14px",marginBottom:12,border:"1.5px solid #6C6EF5"}}>
                  <div style={{fontWeight:700,fontSize:13,color:"#1a2f4a",marginBottom:12}}>{newRol.editId?"Editar rol":"Nuevo rol"}</div>
                  <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10,marginBottom:10}}>
                    <div><label style={S.lbl}>NOMBRE DEL ROL *</label><input value={newRol.nombre} onChange={e=>setNewRol(p=>({...p,nombre:e.target.value}))} placeholder="Ej: Supervisor" style={S.inp}/></div>
                    <div>
                      <label style={S.lbl}>COLOR</label>
                      <div style={{display:"flex",gap:6,marginTop:4}}>
                        {["#f6a623","#6C6EF5","#00b5b4","#0984e3","#e17055","#a29bfe","#fd79a8","#55efc4"].map(c=>(
                          <div key={c} onClick={()=>setNewRol(p=>({...p,color:c}))}
                            style={{width:22,height:22,borderRadius:"50%",background:c,cursor:"pointer",border:`2.5px solid ${newRol.color===c?"#1a2f4a":"transparent"}`}}/>
                        ))}
                      </div>
                    </div>
                  </div>
                  <div style={{marginBottom:10}}><label style={S.lbl}>DESCRIPCIÓN / ACCESOS</label><input value={newRol.desc} onChange={e=>setNewRol(p=>({...p,desc:e.target.value}))} placeholder="Ej: Acceso a reportes de su área" style={S.inp}/></div>
                  <div style={{display:"flex",gap:8}}>
                    <button onClick={async()=>{
                      if(!newRol.nombre.trim()) return showToast("Ingresa el nombre del rol");
                      const id=newRol.editId||newRol.nombre.toLowerCase().replace(/\s+/g,"_");
                      await setDoc(doc(db,"roles",id),{nombre:newRol.nombre.trim(),desc:newRol.desc,color:newRol.color,sistema:false,activo:true},{merge:true});
                      showToast("Rol guardado");setShowNUsuario(false);setNewRol({nombre:"",desc:"",color:"#6C6EF5",editId:null});
                    }} style={{flex:1,padding:"10px",borderRadius:50,border:"none",background:"#1a2f4a",color:"#fff",cursor:"pointer",fontWeight:700,fontSize:12}}>
                      {newRol.editId?"Guardar cambios":"Crear rol"}
                    </button>
                    <button onClick={()=>{setShowNUsuario(false);setNewRol({nombre:"",desc:"",color:"#6C6EF5",editId:null});}} style={{padding:"10px 16px",borderRadius:50,border:"1px solid #e2e8f0",background:"#fff",color:"#5a7a9a",cursor:"pointer",fontSize:12}}>Cancelar</button>
                  </div>
                </div>
              )}
              <div style={{fontSize:10,color:"#8aaabb",marginBottom:8,fontWeight:600,letterSpacing:".04em"}}>ROLES DEL SISTEMA — no eliminables</div>
              {roles.map(r=>{
                const usrCount=usuarios.filter(u=>u.rol===r.id).length;
                const clr=r.color||ROL_CFG_U[r.id]?.c||"#8aaabb";
                return(
                  <div key={r.id} style={{...S.card,padding:"12px 14px",marginBottom:8,display:"flex",alignItems:"center",gap:10,opacity:r.activo===false?0.55:1}}>
                    <div style={{width:8,height:40,borderRadius:3,background:clr,flexShrink:0}}/>
                    <div style={{flex:1,minWidth:0}}>
                      <div style={{fontWeight:700,fontSize:13,color:"#1a2f4a",display:"flex",alignItems:"center",gap:6,marginBottom:2}}>
                        {r.nombre}
                        {r.sistema&&<span style={{fontSize:9,background:"#e8faf5",color:"#085041",padding:"1px 6px",borderRadius:10,fontWeight:700}}>Sistema</span>}
                        {r.activo===false&&<span style={{fontSize:9,background:"#fff1f2",color:"#dc2626",padding:"1px 6px",borderRadius:10,fontWeight:700}}>Inactivo</span>}
                      </div>
                      <div style={{fontSize:11,color:"#8aaabb"}}>{r.desc||""}</div>
                      <div style={{fontSize:10,color:"#b2bec3",marginTop:2}}>{usrCount} usuario{usrCount!==1?"s":""} asignado{usrCount!==1?"s":""}</div>
                    </div>
                    <button onClick={()=>{setNewRol({nombre:r.nombre,desc:r.desc||"",color:r.color||"#8aaabb",editId:r.id});setShowNUsuario(true);}} style={{padding:"6px 10px",borderRadius:9,border:"1px solid #c8d8e8",background:"#f8fafc",color:"#5a7a9a",cursor:"pointer",fontSize:11,fontWeight:600}}>Editar</button>
                    <div onClick={async()=>{await setDoc(doc(db,"roles",r.id),{activo:r.activo===false},{merge:true});showToast(r.activo===false?"Rol activado":"Rol desactivado");}}
                      style={{width:36,height:20,borderRadius:10,background:r.activo===false?"#e2e8f0":"#00b5b4",position:"relative",cursor:"pointer",flexShrink:0,transition:"background .2s"}}>
                      <div style={{width:16,height:16,borderRadius:"50%",background:"#fff",position:"absolute",top:2,left:r.activo===false?2:18,transition:"left .2s",boxShadow:"0 1px 3px rgba(0,0,0,.2)"}}/>
                    </div>
                  </div>
                );
              })}
            </div>
            );
          })()}

          {/* ════ TAB ÁREAS ════ */}
          {usrTabEfectivo==="areas"&&(()=>{
            return(
            <div>
              {showNUsuario&&(
                <div style={{...S.card,padding:"14px",marginBottom:12,border:"1.5px solid #00b5b4"}}>
                  <div style={{fontWeight:700,fontSize:13,color:"#1a2f4a",marginBottom:10}}>{newArea.editId?"Editar área":"Nueva área"}</div>
                  <div style={{marginBottom:10}}><label style={S.lbl}>NOMBRE DEL ÁREA *</label><input value={newArea.nombre} onChange={e=>setNewArea(p=>({...p,nombre:e.target.value}))} placeholder="Ej: Logística" style={S.inp}/></div>
                  <div style={{display:"flex",gap:8}}>
                    <button onClick={async()=>{
                      if(!newArea.nombre.trim()) return showToast("Ingresa el nombre del área");
                      const id=newArea.editId||newArea.nombre.toLowerCase().replace(/\s+/g,"_").replace(/[áéíóú]/g,c=>({á:"a",é:"e",í:"i",ó:"o",ú:"u"}[c]||c));
                      await setDoc(doc(db,"areas",id),{nombre:newArea.nombre.trim(),activa:true,cargos:newArea.editId?(areas.find(a=>a.id===newArea.editId)?.cargos||[]):[]},{merge:true});
                      showToast("Área guardada");setShowNUsuario(false);setNewArea({nombre:"",editId:null});
                    }} style={{flex:1,padding:"10px",borderRadius:50,border:"none",background:"#1a2f4a",color:"#fff",cursor:"pointer",fontWeight:700,fontSize:12}}>
                      {newArea.editId?"Guardar cambios":"Crear área"}
                    </button>
                    <button onClick={()=>{setShowNUsuario(false);setNewArea({nombre:"",editId:null});}} style={{padding:"10px 16px",borderRadius:50,border:"1px solid #e2e8f0",background:"#fff",color:"#5a7a9a",cursor:"pointer",fontSize:12}}>Cancelar</button>
                  </div>
                </div>
              )}

              {areas.map(a=>{
                const usrCount=usuarios.filter(u=>u.area===a.id||u.area===a.nombre).length;
                const isOpen=areaOpen===a.id;
                return(
                  <div key={a.id} style={{...S.card,padding:0,marginBottom:8,overflow:"hidden",opacity:a.activa===false?0.55:1}}>
                    {/* Header área */}
                    <div style={{padding:"12px 14px",display:"flex",alignItems:"center",gap:10,cursor:"pointer"}} onClick={()=>setAreaOpen(isOpen?null:a.id)}>
                      <div style={{width:8,height:8,borderRadius:"50%",background:a.activa===false?"#b2bec3":"#00b5b4",flexShrink:0}}/>
                      <div style={{flex:1,minWidth:0}}>
                        <div style={{fontWeight:700,fontSize:13,color:"#1a2f4a",display:"flex",alignItems:"center",gap:6}}>
                          {a.nombre}
                          {a.activa===false&&<span style={{fontSize:9,background:"#fff1f2",color:"#dc2626",padding:"1px 6px",borderRadius:10,fontWeight:700}}>Inactiva</span>}
                        </div>
                        <div style={{fontSize:10,color:"#8aaabb"}}>{(a.cargos||[]).length} cargos · {usrCount} usuario{usrCount!==1?"s":""}</div>
                      </div>
                      <button onClick={e=>{e.stopPropagation();setNewArea({nombre:a.nombre,editId:a.id});setShowNUsuario(true);}} style={{padding:"5px 9px",borderRadius:8,border:"1px solid #c8d8e8",background:"#f8fafc",color:"#5a7a9a",cursor:"pointer",fontSize:11}}>Editar</button>
                      <div onClick={async e=>{e.stopPropagation();await setDoc(doc(db,"areas",a.id),{activa:a.activa===false},{merge:true});showToast(a.activa===false?"Área activada":"Área desactivada");}}
                        style={{width:36,height:20,borderRadius:10,background:a.activa===false?"#e2e8f0":"#00b5b4",position:"relative",cursor:"pointer",flexShrink:0,transition:"background .2s"}}>
                        <div style={{width:16,height:16,borderRadius:"50%",background:"#fff",position:"absolute",top:2,left:a.activa===false?2:18,transition:"left .2s",boxShadow:"0 1px 3px rgba(0,0,0,.2)"}}/>
                      </div>
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#94A3B8" strokeWidth="2" strokeLinecap="round" style={{transform:isOpen?"rotate(180deg)":"",transition:"transform .2s"}}><polyline points="6,9 12,15 18,9"/></svg>
                    </div>
                    {/* Cargos acordeón */}
                    {isOpen&&(
                      <div style={{borderTop:"1px solid #f0f4f8",background:"#f8fafc",padding:"10px 14px"}}>
                        <div style={{fontSize:10,fontWeight:700,color:"#8aaabb",marginBottom:8,display:"flex",alignItems:"center",justifyContent:"space-between",letterSpacing:".04em"}}>
                          CARGOS
                          <div style={{display:"flex",gap:6,alignItems:"center"}}>
                            {newCargo.areaId===a.id
                              ?<div style={{display:"flex",gap:6}}>
                                <input value={newCargo.nombre} onChange={e=>setNewCargo(p=>({...p,nombre:e.target.value}))} placeholder="Nombre del cargo" style={{...S.inp,padding:"5px 10px",fontSize:11,width:160}}/>
                                <button onClick={async()=>{
                                  if(!newCargo.nombre.trim()) return;
                                  const cargos=[...(a.cargos||[]),{id:"c"+(Date.now()),nombre:newCargo.nombre.trim(),activo:true}];
                                  await setDoc(doc(db,"areas",a.id),{cargos},{merge:true});
                                  showToast("Cargo agregado");setNewCargo({areaId:null,nombre:""});
                                }} style={{padding:"5px 10px",borderRadius:8,border:"none",background:"#1a2f4a",color:"#fff",cursor:"pointer",fontSize:11,fontWeight:600,whiteSpace:"nowrap"}}>+ Agregar</button>
                                <button onClick={()=>setNewCargo({areaId:null,nombre:""})} style={{padding:"5px 8px",borderRadius:8,border:"1px solid #e2e8f0",background:"#fff",color:"#5a7a9a",cursor:"pointer",fontSize:11}}>✕</button>
                              </div>
                              :<button onClick={()=>setNewCargo({areaId:a.id,nombre:""})} style={{padding:"4px 8px",borderRadius:8,border:"1px solid #c8d8e8",background:"#fff",color:"#5a7a9a",cursor:"pointer",fontSize:10,display:"flex",alignItems:"center",gap:4}}>
                                <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
                                Agregar cargo
                              </button>
                            }
                          </div>
                        </div>
                        {(a.cargos||[]).length===0&&<div style={{fontSize:11,color:"#b2bec3",padding:"8px 0"}}>Sin cargos registrados</div>}
                        {(a.cargos||[]).map((c,ci)=>(
                          <div key={c.id||ci} style={{display:"flex",alignItems:"center",justifyContent:"space-between",padding:"7px 8px",borderRadius:8,background:ci%2===0?"#fff":"transparent",marginBottom:2,opacity:c.activo===false?0.5:1}}>
                            <span style={{fontSize:12,color:"#1a2f4a"}}>{c.nombre}</span>
                            <div style={{display:"flex",alignItems:"center",gap:6}}>
                              <span style={{fontSize:10,color:"#b2bec3"}}>{usuarios.filter(u=>u.cargo===c.nombre).length} usr</span>
                              <div onClick={async()=>{
                                const cargos=(a.cargos||[]).map((x,xi)=>xi===ci?{...x,activo:x.activo===false}:x);
                                await setDoc(doc(db,"areas",a.id),{cargos},{merge:true});
                              }} style={{width:30,height:17,borderRadius:9,background:c.activo===false?"#e2e8f0":"#00b5b4",position:"relative",cursor:"pointer",flexShrink:0}}>
                                <div style={{width:13,height:13,borderRadius:"50%",background:"#fff",position:"absolute",top:2,left:c.activo===false?2:15,transition:"left .2s",boxShadow:"0 1px 2px rgba(0,0,0,.2)"}}/>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
            );
          })()}
        </div>
        );
      })()}

      {cfgTab===1&&(hideTabs||cfgMod==="evidencias")&&(
        <div>
          <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:12}}>
            <div style={{fontWeight:800,fontSize:14,color:"#1a2f4a"}}>Actividades</div>
            <button onClick={()=>setShowNA(!showNA)} style={{padding:"8px 14px",borderRadius:9,border:"none",background:"#6c5ce7",color:"#fff",cursor:"pointer",fontWeight:700,fontSize:12}}>＋ Nueva</button>
          </div>
          {showNA&&(
            <div style={{...S.card,padding:"14px",marginBottom:14}}>
              <div style={{display:"flex",gap:8,marginBottom:10}}>
                <input value={newA.e} onChange={e=>setNewA(p=>({...p,e:e.target.value}))} style={{width:50,padding:"10px",borderRadius:8,border:"1px solid #c8d8e8",fontSize:18,textAlign:"center",outline:"none"}}/>
                <input value={newA.n} onChange={e=>setNewA(p=>({...p,n:e.target.value}))} placeholder="Nombre" style={{...S.inp,flex:1}}/>
              </div>
              <div style={{display:"flex",gap:5,marginBottom:10,flexWrap:"wrap"}}>
                {[[1,"L"],[2,"M"],[3,"X"],[4,"J"],[5,"V"],[6,"S"],[0,"D"]].map(([d,lbl])=>(
                  <button key={d} onClick={()=>setNewA(p=>({...p,dias:(p.dias||[]).includes(d)?p.dias.filter(x=>x!==d):[...p.dias,d].sort((a,b)=>a===0?7:a) }))}
                    style={{flex:1,minWidth:32,padding:"8px",borderRadius:8,border:`1.5px solid ${(newA.dias||[]).includes(d)?(d===6||d===0)?"#e84393":"#6c5ce7":"#e2e8f0"}`,background:(newA.dias||[]).includes(d)?(d===6||d===0)?"#ffeaf5":"#f0edff":"#fff",color:(newA.dias||[]).includes(d)?(d===6||d===0)?"#e84393":"#6c5ce7":"#5a7a9a",cursor:"pointer",fontSize:11,fontWeight:700}}>
                    {lbl}{(d===6||d===0)?" ✨":""}
                  </button>
                ))}
              </div>
              <div style={{display:"flex",gap:8}}>
                <button onClick={()=>{if(!newA.n||!newA.dias.length)return;const na={...newA,id:"a"+Date.now(),cat:"Ad-hoc",r:null,activa:true};setActs(p=>{const np=[...p,na];saveConfig({actividades:np});return np;});setNewA({n:"",e:"📌",c:"#6c5ce7",dias:[1,2,3,4,5],cat:"Ad-hoc"});setShowNA(false);}}
                  style={{flex:1,padding:"10px",borderRadius:9,border:"none",background:"#6c5ce7",color:"#fff",cursor:"pointer",fontWeight:700,fontSize:12}}>Agregar</button>
                <button onClick={()=>setShowNA(false)} style={{padding:"10px 16px",borderRadius:9,border:"1px solid #e2e8f0",background:"#fff",color:"#5a7a9a",cursor:"pointer",fontSize:12}}>Cancelar</button>
              </div>
            </div>
          )}
          {acts.map(a=>{
            const RR=a.r||RANGOS_DEFAULT;
            return(
            <div key={a.id} style={{...S.card,padding:"12px 14px",marginBottom:8,opacity:a.activa?1:.55}}>
              <div style={{display:"flex",alignItems:"center",gap:10}}>
                <span style={{fontSize:18}}>{a.e}</span>
                <div style={{flex:1}}>
                  <div style={{fontWeight:700,fontSize:13,color:a.activa?a.c:"#94a3b8"}}>{a.n}</div>
                  <div style={{fontSize:10,color:"#8aaabb",marginTop:2}}>
                    {a.dias.map(d=>({0:"D",1:"L",2:"M",3:"X",4:"J",5:"V",6:"S"})[d]||"?").join("·")} · {a.cat}
                    {a.r&&<span style={{color:"#f6a623",marginLeft:4}}>⏱️ rangos custom</span>}
                  </div>
                </div>
                <button onClick={()=>setActs(p=>p.map(x=>x.id===a.id?{...x,_er:!x._er}:x))}
                  title="Rangos horarios"
                  style={{padding:"5px 10px",borderRadius:8,border:"1px solid #c8d8e8",background:a._er?"#f0f4f8":"#fff",color:"#5a7a9a",cursor:"pointer",fontSize:11,fontWeight:700}}>⏱️</button>
                <button onClick={()=>setActs(p=>p.map(x=>x.id===a.id?{...x,_edit:!x._edit}:x))}
                  title="Editar actividad"
                  style={{padding:"5px 10px",borderRadius:8,border:"1px solid #c8d8e8",background:a._edit?"#e8f4fd":"#fff",color:"#0984e3",cursor:"pointer",fontSize:11,fontWeight:700}}>✏️</button>
                <button onClick={()=>setActs(p=>{const np=p.map(x=>x.id===a.id?{...x,activa:!x.activa}:x);saveConfig({actividades:np});return np;})}
                  style={{padding:"5px 10px",borderRadius:8,border:`1.5px solid ${a.activa?"#fecaca":"#bbf7d0"}`,background:a.activa?"#fff1f2":"#f0fdf4",color:a.activa?"#dc2626":"#16a34a",cursor:"pointer",fontSize:12,fontWeight:800}}>
                  {a.activa?"⏸":"▶"}
                </button>
                <button onClick={()=>{ if(window.confirm(`¿Eliminar "${a.n}"? Se perderá del listado (los registros históricos se conservan en Firebase).`)){setActs(p=>{const np=p.filter(x=>x.id!==a.id);saveConfig({actividades:np});return np;});}}}
                  title="Eliminar actividad"
                  style={{padding:"5px 10px",borderRadius:8,border:"1.5px solid #fecaca",background:"#fff1f2",color:"#dc2626",cursor:"pointer",fontSize:11,fontWeight:700}}>🗑️</button>
              </div>
              {a._edit&&(
                <div style={{marginTop:10,padding:"12px",borderRadius:10,background:"#e8f4fd",border:"1px solid #74b9ff55"}}>
                  <div style={{fontSize:10,fontWeight:800,color:"#0984e3",marginBottom:8}}>✏️ EDITAR · {a.n.toUpperCase()}</div>
                  <div style={{display:"flex",gap:8,marginBottom:8}}>
                    <input value={a.e} onChange={e=>setActs(p=>p.map(x=>x.id===a.id?{...x,e:e.target.value}:x))} style={{width:44,padding:"8px",borderRadius:8,border:"1px solid #c8d8e8",fontSize:16,textAlign:"center",outline:"none"}}/>
                    <input value={a.n} onChange={e=>setActs(p=>p.map(x=>x.id===a.id?{...x,n:e.target.value}:x))} style={{...S.inp,flex:1,fontSize:13}}/>
                  </div>
                  <div style={{display:"flex",gap:5,marginBottom:8,flexWrap:"wrap"}}>
                    {[[1,"L"],[2,"M"],[3,"X"],[4,"J"],[5,"V"],[6,"S"],[0,"D"]].map(([d,lbl])=>(
                      <button key={d} onClick={()=>setActs(p=>p.map(x=>x.id===a.id?{...x,dias:(x.dias||[]).includes(d)?x.dias.filter(v=>v!==d):[...x.dias,d]}:x))}
                        style={{flex:1,minWidth:30,padding:"7px",borderRadius:8,border:`1.5px solid ${(a.dias||[]).includes(d)?(d===6||d===0)?"#e84393":"#0984e3":"#e2e8f0"}`,background:(a.dias||[]).includes(d)?(d===6||d===0)?"#ffeaf5":"#e8f4fd":"#fff",color:(a.dias||[]).includes(d)?(d===6||d===0)?"#e84393":"#0984e3":"#5a7a9a",cursor:"pointer",fontSize:11,fontWeight:700}}>
                        {lbl}{(d===6||d===0)?" ✨":""}
                      </button>
                    ))}
                  </div>
                  <div style={{display:"flex",gap:5,marginBottom:8}}>
                    {["Always On","Promocional","Ad-hoc"].map(cat=>(
                      <button key={cat} onClick={()=>setActs(p=>p.map(x=>x.id===a.id?{...x,cat}:x))}
                        style={{flex:1,padding:"6px",borderRadius:8,border:`1.5px solid ${a.cat===cat?"#0984e3":"#e2e8f0"}`,background:a.cat===cat?"#e8f4fd":"#fff",color:a.cat===cat?"#0984e3":"#5a7a9a",cursor:"pointer",fontSize:10,fontWeight:700}}>
                        {cat}
                      </button>
                    ))}
                  </div>
                  <button onClick={()=>{setActs(p=>{const np=p.map(x=>x.id===a.id?{...x,_edit:false}:x);saveConfig({actividades:np});return np;});}}
                    style={{width:"100%",padding:"9px",borderRadius:8,border:"none",background:"#0984e3",color:"#fff",cursor:"pointer",fontWeight:700,fontSize:12}}>
                    💾 Guardar cambios
                  </button>
                </div>
              )}
              {a._er&&(
                <div style={{marginTop:12,padding:"12px",borderRadius:10,background:a.c+"0a",border:"1px solid "+a.c+"33"}}>
                  <div style={{fontSize:10,fontWeight:800,color:a.c,marginBottom:10,letterSpacing:".05em"}}>⏱️ RANGOS HORARIOS · {a.n.toUpperCase()}</div>
                  <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(130px,1fr))",gap:8,marginBottom:10}}>
                    {[{k:"c100",icon:"🥇",label:"100% hasta"},{k:"c80",icon:"🥈",label:"80% hasta"},{k:"c60",icon:"🥉",label:"60% hasta"}].map(f=>(
                      <div key={f.k}>
                        <div style={{fontSize:9,color:"#8aaabb",fontWeight:700,marginBottom:4}}>{f.icon} {f.label}</div>
                        <input type="time" value={RR[f.k]}
                          onChange={e=>setActs(p=>p.map(x=>x.id===a.id?{...x,r:{...(x.r||RANGOS_DEFAULT),[f.k]:e.target.value}}:x))}
                          style={{width:"100%",padding:"8px",borderRadius:8,border:"1.5px solid "+a.c+"55",background:"#fff",color:"#1a2f4a",fontSize:13,outline:"none",textAlign:"center"}}/>
                      </div>
                    ))}
                  </div>
                  <div style={{display:"flex",gap:5,flexWrap:"wrap",marginBottom:8}}>
                    {[["10 pts","#f6a623",`≤${RR.c100}`],["8 pts","#74b9ff",`${RR.c100}–${RR.c80}`],["6 pts","#a29bfe",`${RR.c80}–${RR.c60}`],["0 pts","#d63031",`>${RR.c60}`]].map(([p,c,t])=>(
                      <span key={p} style={{padding:"2px 8px",borderRadius:20,fontSize:9,fontWeight:700,color:c,background:c+"18"}}>{t}→{p}</span>
                    ))}
                  </div>
                  <button onClick={()=>setActs(p=>p.map(x=>x.id===a.id?{...x,r:null}:x))}
                    style={{fontSize:9,color:"#8aaabb",background:"none",border:"none",cursor:"pointer",padding:0,textDecoration:"underline"}}>
                    Restablecer default
                  </button>
                </div>
              )}
            </div>
            );
          })}
        </div>
      )}

      {cfgTab===2&&(()=>{
        /* ET_TIENDAS_1_5_VIEWER_APPROVED_20260614: Tiendas 1.5 alineado a viewer aprobado */
        const FMT_ICO={Mayorista:IcoMayorista,Supermayorista:IcoSupermayorista,Market:IcoMarket};
        const FMT_LABELS={Mayorista:"Mayorista",Supermayorista:"Supermayorista",Market:"Market"};
        const zonasDisponibles=[...new Set((tiendas||[]).map(getZonaIdTienda).filter(Boolean))].sort((a,b)=>String(a).localeCompare(String(b),"es",{numeric:true}));
        const zonalesUsuarios=(usuarios||[]).filter(u=>u?.activo!==false && (
          String(u?.cargo||"").toLowerCase().includes("zonal") ||
          String(u?.rol||"").toLowerCase().includes("coordinador") ||
          String(u?.rol||"").toLowerCase().includes("admin")
        ));
        const fmtActual=fmtTab||"Mayorista";
        const fc=FMT[fmtActual]||FMT.Market;
        const PILL_ON ={padding:"10px 22px",borderRadius:50,border:"none",cursor:"pointer",background:"#6C6EF5",color:"#fff",fontWeight:800,fontSize:14,boxShadow:"0 2px 8px rgba(108,110,245,.25)",display:"flex",alignItems:"center",gap:8,transition:"all .15s",whiteSpace:"nowrap"};
        const PILL_OFF={padding:"10px 22px",borderRadius:50,border:"1.5px solid #D1D5DB",cursor:"pointer",background:"#fff",color:"#5a7a9a",fontWeight:700,fontSize:14,display:"flex",alignItems:"center",gap:8,transition:"all .15s",whiteSpace:"nowrap"};
        const filtroTxt=String(tiendaFiltroTxt||"").trim().toLowerCase();
        const tiendasFormato=(tiendas||[]).filter(t=>t.f===fmtActual);
        const tiendasFiltradas=tiendasFormato.filter(t=>{
          const estadoOk=tiendaFiltroEstado==="Todos" || (tiendaFiltroEstado==="Activa" ? t.activa!==false : t.activa===false);
          const zonaOk=tiendaFiltroZona==="Todas" || String(getZonaIdTienda(t)||"")===String(tiendaFiltroZona);
          const hay=(String(t.n||"")+" "+String(t.idTienda||"")+" "+String(t.dir||"")+" "+String(t.dist||"")+" "+String(t.emailTienda||t.email||"")+" "+String(t.gerenteTienda||"")).toLowerCase();
          return estadoOk && zonaOk && (!filtroTxt || hay.includes(filtroTxt));
        });
        const registrarHistorial=(accion,tienda)=>setTiendaHistorial(p=>[{id:"hist-"+Date.now(),fecha:new Date().toISOString(),accion,tienda:tienda?.n||tienda?.sucursal||"Tienda",usuario:uName||uDni||"Usuario"},...(p||[])].slice(0,30));
        const validarCoords=(lat,lng)=>Number.isFinite(Number(lat))&&Number(lat)>=-90&&Number(lat)<=90&&Number.isFinite(Number(lng))&&Number(lng)>=-180&&Number(lng)<=180;
        const resetNewT=()=>setNewT({n:"",f:"Market",idTienda:"",activa:true,zonaId:"",dir:"",dist:"",lat:"",lng:"",maps:"",emailTienda:"",gerenteTienda:"",dniGerente:"",celular:"",jefeZonalNombre:"",emailJefeZonal:"",usuarioZonalId:""});
        const activarInactivar=(ti)=>setTiendas(p=>{const np=p.map(x=>x.id===ti.id?{...x,activa:!x.activa,actualizadoEn:new Date().toISOString(),actualizadoPor:uName||uDni||"admin"}:x);saveConfig({tiendas:np});return np;});
        const eliminarTienda=(ti)=>{if(!window.confirm(`¿Eliminar permanentemente "Vega ${ti.n}"? Esta acción no se puede deshacer.`)) return;setTiendas(p=>{const np=p.filter(x=>x.id!==ti.id);saveConfig({tiendas:np});return np;});registrarHistorial("Eliminar",ti);showToast(`Tienda Vega ${ti.n} eliminada`);};
        const crearTienda=()=>{
          const idT=String(newT.idTienda||"").trim();
          const nombre=sanitizeTextInput(newT.n,80).trim();
          if(!idT) return showToast("Ingresa ID_TIENDA");
          if((tiendas||[]).some(t=>String(t.idTienda||"")===idT)) return showToast("Ya existe una tienda con ese ID_TIENDA");
          if(!nombre) return showToast("Ingresa nombre de tienda");
          if((newT.lat||newT.lng) && !validarCoords(newT.lat,newT.lng)) return showToast("Coordenadas inválidas");
          const zonal=zonalesUsuarios.find(u=>u.id===newT.usuarioZonalId);
          const nt={
            id:"t"+Date.now(),idTienda:idT,n:nombre.toUpperCase(),f:newT.f||fmtActual,activa:newT.activa!==false,
            zonaId:sanitizeTextInput(newT.zonaId,20),dir:sanitizeTextInput(newT.dir,SAFE_LIMITS.longText),dist:sanitizeTextInput(newT.dist,80),
            lat:newT.lat===""?"":Number(String(newT.lat).replace(",",".")),lng:newT.lng===""?"":Number(String(newT.lng).replace(",",".")),maps:sanitizeTextInput(newT.maps,SAFE_LIMITS.longText),
            emailTienda:sanitizeEmailInput(newT.emailTienda),email:sanitizeEmailInput(newT.emailTienda),
            gerenteTienda:toTitleCase(newT.gerenteTienda),dniGerente:sanitizeDigits(newT.dniGerente,8),celular:sanitizeDigits(newT.celular,12),
            usuarioZonalId:zonal?.id||null,jefeZonalNombre:zonal?.nombre||toTitleCase(newT.jefeZonalNombre),emailJefeZonal:zonal?.email||sanitizeEmailInput(newT.emailJefeZonal),
            contactosTienda:[],creadoEn:new Date().toISOString(),creadoPor:uName||uDni||"admin"
          };
          nt.contactosTienda=[
            nt.gerenteTienda?{id:"gerente_tienda",tipo:"contacto_operativo",cargo:"Jefe de tienda",nombre:nt.gerenteTienda,dni:nt.dniGerente,celular:nt.celular,email:nt.emailTienda,accesoApp:false,usuarioId:null,activo:true,fuente:"creacion_manual"}:null,
            nt.jefeZonalNombre?{id:"jefe_zonal",tipo:"contacto_operativo",cargo:"Jefe zonal",nombre:nt.jefeZonalNombre,email:nt.emailJefeZonal,accesoApp:false,usuarioId:nt.usuarioZonalId,activo:true,fuente:nt.usuarioZonalId?"usuarios":"manual"}:null
          ].filter(Boolean);
          setTiendas(p=>{const np=[...p,nt];saveConfig({tiendas:np});return np;});
          registrarHistorial("Crear tienda",nt);setFmtTab(nt.f);setTpTab("lista");resetNewT();showToast("Tienda creada correctamente");
        };
        const TiendaTabIcon=({children})=><span style={{display:"flex",alignItems:"center"}}>{children}</span>;
        return(
          <div>
            <div style={{background:"#F5F7FB",padding:"12px 0 0",marginBottom:0}}>
              <div style={{display:"flex",gap:8,marginBottom:10,flexWrap:"wrap"}}>
                <button onClick={()=>setTpTab("lista")} style={tpTab==="lista"?PILL_ON:PILL_OFF}><IcoTiendas/>Tiendas</button>
                <button onClick={()=>setTpTab("nueva")} style={tpTab==="nueva"?PILL_ON:PILL_OFF}><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={tpTab==="nueva"?"#fff":"#5a7a9a"} strokeWidth="2" strokeLinecap="round"><circle cx="12" cy="12" r="10"/><path d="M12 8v8M8 12h8"/></svg>Nueva</button>
                <button onClick={()=>setTpTab("coords")} style={tpTab==="coords"?PILL_ON:PILL_OFF}><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={tpTab==="coords"?"#fff":"#5a7a9a"} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 10c0 7-9 12-9 12S3 17 3 10a9 9 0 1118 0z"/><circle cx="12" cy="10" r="3"/></svg>Coordenadas</button>
                <button onClick={()=>setTpTab("responsables")} style={tpTab==="responsables"?PILL_ON:PILL_OFF}><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={tpTab==="responsables"?"#fff":"#5a7a9a"} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="7" r="4"/><path d="M5.5 21a6.5 6.5 0 0113 0"/></svg>Responsables</button>
                <button onClick={()=>setTpTab("historial")} style={tpTab==="historial"?PILL_ON:PILL_OFF}><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={tpTab==="historial"?"#fff":"#5a7a9a"} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/></svg>Historial</button>
              </div>
              {tpTab==="lista"&&(
                <div style={{display:"flex",gap:0,background:"#fff",borderRadius:"10px 10px 0 0",padding:"10px 12px 0",borderTop:"1px solid #E2E8F0"}}>
                  {["Mayorista","Supermayorista","Market"].map(fmt=>{const IcoFmt=FMT_ICO[fmt];const color=(FMT[fmt]||FMT.Market).c;const active=fmtActual===fmt;return <button key={fmt} onClick={()=>setFmtTab(fmt)} style={{padding:"9px 16px",border:"none",borderRadius:"8px 8px 0 0",borderBottom:`3px solid ${active?color:"transparent"}`,background:active?(FMT[fmt].bg+"80"):"transparent",color:active?color:"#64748B",fontWeight:active?800:600,fontSize:13,cursor:"pointer",display:"flex",alignItems:"center",gap:6,whiteSpace:"nowrap"}}><IcoFmt size={16} color={active?color:"#94A3B8"}/>{FMT_LABELS[fmt]}</button>})}
                </div>
              )}
            </div>
            {tpTab==="lista"&&(
              <div style={{background:"#fff",borderRadius:"0 0 14px 14px",padding:16,border:"1px solid #E2E8F0",borderTop:"none"}}>
                <div style={{display:"grid",gridTemplateColumns:"minmax(220px,1fr) 210px 210px auto",gap:10,alignItems:"center",marginBottom:14}}>
                  <div style={{position:"relative"}}><svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="#0984e3" strokeWidth="2" strokeLinecap="round" style={{position:"absolute",left:14,top:"50%",transform:"translateY(-50%)"}}><circle cx="11" cy="11" r="8"/><path d="M21 21l-4.3-4.3"/></svg><input value={tiendaFiltroTxt} onChange={e=>setTiendaFiltroTxt(e.target.value)} placeholder="Buscar tienda" style={{...S.inp,paddingLeft:42}}/></div>
                  <select value={tiendaFiltroEstado} onChange={e=>setTiendaFiltroEstado(e.target.value)} style={S.inp}><option>Todos</option><option>Activa</option><option>Inactiva</option></select>
                  <select value={tiendaFiltroZona} onChange={e=>setTiendaFiltroZona(e.target.value)} style={S.inp}><option>Todas</option>{zonasDisponibles.map(z=><option key={z} value={z}>Zona {z}</option>)}</select>
                  <button onClick={()=>{setTiendaFiltroTxt("");setTiendaFiltroEstado("Todos");setTiendaFiltroZona("Todas");}} style={{padding:"10px 18px",borderRadius:10,border:"1px solid #c8d8e8",background:"#fff",color:"#5a7a9a",fontWeight:800,cursor:"pointer"}}>Limpiar</button>
                </div>
                <div style={{display:"grid",gridTemplateColumns:"repeat(5,1fr)",gap:10,marginBottom:16}}>
                  {[{l:"Tiendas",v:tiendasFormato.length,c:"#6C6EF5"},{l:"Activas",v:tiendasFormato.filter(t=>t.activa!==false).length,c:"#00b894"},{l:"Inactivas",v:tiendasFormato.filter(t=>t.activa===false).length,c:"#dc2626"},{l:"Sin contacto",v:tiendasFormato.filter(t=>!getContactoPrincipalTienda(t)).length,c:"#f6a623"},{l:"Coords pendientes",v:tiendasFormato.filter(t=>!Number.isFinite(Number(t.lat))||!Number.isFinite(Number(t.lng))).length,c:"#0984e3"}].map(k=><div key={k.l} style={{...S.card,padding:14,textAlign:"center",borderTop:`3px solid ${k.c}`}}><div style={{fontSize:28,fontWeight:900,color:k.c,lineHeight:1}}>{k.v}</div><div style={{fontSize:9,fontWeight:900,color:"#8aaabb",textTransform:"uppercase",letterSpacing:".05em",marginTop:6}}>{k.l}</div></div>)}
                </div>
                {tiendasFiltradas.map(ti=>{const contacto=getContactoPrincipalTienda(ti);const gerente=contacto?.nombre||ti.gerenteTienda||"";const zonal=ti.contactosTienda?.find(c=>c.id==="jefe_zonal")?.nombre||ti.jefeZonalNombre||"";return <div key={ti.id} style={{...S.card,marginBottom:10,opacity:ti.activa===false?0.62:1}}><div style={{padding:"14px 16px",display:"flex",alignItems:"center",justifyContent:"space-between",gap:12}}><div style={{minWidth:0}}><div style={{display:"flex",gap:8,alignItems:"center",flexWrap:"wrap",fontSize:16,fontWeight:900,color:ti.activa===false?"#94a3b8":"#1a2f4a"}}>Vega {ti.n}<span style={{fontSize:10,fontWeight:800,color:"#8aaabb",background:"#f0f4f8",padding:"3px 7px",borderRadius:6}}>#{ti.idTienda||"s/id"}</span><span style={{fontSize:10,fontWeight:900,color:ti.activa===false?"#8aaabb":"#00b894",background:ti.activa===false?"#f0f4f8":"#e8faf5",padding:"3px 10px",borderRadius:20}}>{ti.activa===false?"Inactiva":"Activa"}</span></div><div style={{fontSize:11,color:"#8aaabb",display:"flex",gap:10,flexWrap:"wrap",marginTop:8}}>{(ti.emailTienda||ti.email)&&<span style={{display:"inline-flex",alignItems:"center",gap:4}}><svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#0984e3" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="5" width="18" height="14" rx="2"/><path d="M3 7l9 6 9-6"/></svg>{ti.emailTienda||ti.email}</span>}{gerente&&<span style={{display:"inline-flex",alignItems:"center",gap:4}}><svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#00b5b4" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="7" r="4"/><path d="M5.5 21a6.5 6.5 0 0113 0"/></svg>{gerente}</span>}{zonal&&<span style={{display:"inline-flex",alignItems:"center",gap:4}}><svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#6C6EF5" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2l7 4v6c0 5-3 8-7 10-4-2-7-5-7-10V6l7-4z"/><path d="M9 12l2 2 4-5"/></svg>Zonal: {zonal}</span>}<span>Contacto referencial, sin acceso</span></div></div><div style={{display:"flex",gap:8,flexShrink:0}}>{(isAdmin||isCoord)&&<button onClick={()=>setTiendaEditModal({...ti,_zonalUserId:ti.usuarioZonalId||"__manual__",_readOnly:isCoord&&!isAdmin})} style={{padding:"9px 14px",borderRadius:10,border:"1px solid #c8d8e8",background:"#f8fafc",color:"#5a7a9a",fontWeight:800,cursor:"pointer"}}>Editar</button>}{isAdmin&&<button onClick={()=>{activarInactivar(ti);registrarHistorial(ti.activa===false?"Activar":"Inactivar",ti);}} style={{padding:"9px 14px",borderRadius:10,border:`1px solid ${ti.activa===false?"#bbf7d0":"#fecaca"}`,background:ti.activa===false?"#f0fdf4":"#fff1f2",color:ti.activa===false?"#16a34a":"#dc2626",fontWeight:800,cursor:"pointer"}}>{ti.activa===false?"Activar":"Inactivar"}</button>}{isAdmin&&<button onClick={()=>eliminarTienda(ti)} style={{padding:"9px 14px",borderRadius:10,border:"1px solid #fecaca",background:"#fff1f2",color:"#dc2626",fontWeight:800,cursor:"pointer"}}>Eliminar</button>}</div></div></div>})}
                {tiendasFiltradas.length===0&&<div style={{textAlign:"center",padding:"26px",fontSize:12,color:"#8aaabb"}}>Sin tiendas para los filtros seleccionados</div>}
              </div>
            )}
            {tpTab==="nueva"&&(
              <div style={{background:"#fff",borderRadius:"0 14px 14px 14px",padding:20,border:"1px solid #E2E8F0",borderTop:"none"}}>
                <div style={{display:"grid",gridTemplateColumns:"150px 1fr 210px 180px",gap:10,marginBottom:10}}><div><label style={S.lbl}>ID_TIENDA *</label><input value={newT.idTienda||""} onChange={e=>setNewT(p=>({...p,idTienda:sanitizeDigits(e.target.value,6)}))} style={S.inp}/></div><div><label style={S.lbl}>Nombre *</label><input value={newT.n||""} onChange={e=>setNewT(p=>({...p,n:e.target.value}))} placeholder="" style={S.inp}/></div><div><label style={S.lbl}>Formato</label><select value={newT.f||"Market"} onChange={e=>setNewT(p=>({...p,f:e.target.value}))} style={S.inp}><option>Mayorista</option><option>Supermayorista</option><option>Market</option></select></div><div><label style={S.lbl}>Estado</label><select value={newT.activa===false?"Inactiva":"Activa"} onChange={e=>setNewT(p=>({...p,activa:e.target.value==="Activa"}))} style={S.inp}><option>Activa</option><option>Inactiva</option></select></div></div>
                <div style={{display:"grid",gridTemplateColumns:"1fr 180px 140px 140px",gap:10,marginBottom:10}}><div><label style={S.lbl}>Dirección</label><input value={newT.dir||""} onChange={e=>setNewT(p=>({...p,dir:e.target.value}))} placeholder="" style={S.inp}/></div><div><label style={S.lbl}>Distrito</label><input value={newT.dist||""} onChange={e=>setNewT(p=>({...p,dist:e.target.value}))} placeholder="" style={S.inp}/></div><div><label style={S.lbl}>Latitud</label><input value={newT.lat||""} onChange={e=>setNewT(p=>({...p,lat:e.target.value}))} placeholder="" style={S.inp}/></div><div><label style={S.lbl}>Longitud</label><input value={newT.lng||""} onChange={e=>setNewT(p=>({...p,lng:e.target.value}))} placeholder="" style={S.inp}/></div></div>
                <div style={{display:"grid",gridTemplateColumns:"1fr 170px",gap:10,marginBottom:10}}><div><label style={S.lbl}>Link Google Maps</label><input value={newT.maps||""} onChange={e=>setNewT(p=>({...p,maps:e.target.value}))} placeholder="" style={S.inp}/></div><div><label style={S.lbl}>Zona</label><input value={newT.zonaId||""} onChange={e=>setNewT(p=>({...p,zonaId:e.target.value}))} placeholder="" style={S.inp}/></div></div>
                <div style={{display:"grid",gridTemplateColumns:"1fr 140px 160px 1fr",gap:10,marginBottom:10}}><div><label style={S.lbl}>Jefe de tienda</label><input value={newT.gerenteTienda||""} onChange={e=>setNewT(p=>({...p,gerenteTienda:e.target.value}))} style={S.inp}/></div><div><label style={S.lbl}>DNI</label><input value={newT.dniGerente||""} onChange={e=>setNewT(p=>({...p,dniGerente:sanitizeDigits(e.target.value,8)}))} style={S.inp}/></div><div><label style={S.lbl}>Teléfono</label><input value={newT.celular||""} onChange={e=>setNewT(p=>({...p,celular:sanitizeDigits(e.target.value,12)}))} style={S.inp}/></div><div><label style={S.lbl}>Email tienda</label><input value={newT.emailTienda||""} onChange={e=>setNewT(p=>({...p,emailTienda:e.target.value}))} style={S.inp}/></div></div>
                <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10,marginBottom:14}}><div><label style={S.lbl}>Jefe zonal desde Usuarios</label><select value={newT.usuarioZonalId||""} onChange={e=>{const u=zonalesUsuarios.find(x=>x.id===e.target.value);setNewT(p=>({...p,usuarioZonalId:e.target.value,jefeZonalNombre:u?.nombre||"",emailJefeZonal:u?.email||""}))}} style={S.inp}><option value="">— Sin asignar —</option>{zonalesUsuarios.map(u=><option key={u.id} value={u.id}>{u.nombre} · {u.cargo||u.rol}</option>)}</select></div><div><label style={S.lbl}>Email zonal</label><input value={newT.emailJefeZonal||""} onChange={e=>setNewT(p=>({...p,emailJefeZonal:e.target.value}))} style={S.inp}/></div></div>
                <div style={{display:"flex",justifyContent:"flex-end",gap:10}}><button onClick={resetNewT} style={{padding:"11px 18px",borderRadius:12,border:"1px solid #e2e8f0",background:"#fff",color:"#5a7a9a",fontWeight:800,cursor:"pointer"}}>Limpiar</button><button onClick={crearTienda} style={{padding:"11px 22px",borderRadius:12,border:"none",background:"linear-gradient(135deg,#00b5b4,#1a2f4a)",color:"#fff",fontWeight:900,cursor:"pointer"}}>Guardar tienda</button></div>
              </div>
            )}
            {tpTab==="coords"&&(
              <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:16}}><div style={{...S.card,padding:20}}><div style={{fontSize:18,fontWeight:900,color:"#1a2f4a",display:"flex",gap:10,alignItems:"center",marginBottom:12}}><svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#00b5b4" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 10c0 7-9 12-9 12S3 17 3 10a9 9 0 1118 0z"/><circle cx="12" cy="10" r="3"/></svg>Coordenadas registradas</div><div style={{padding:14,border:"1px solid #e2e8f0",borderRadius:12,background:"#f8fafc",color:"#5a7a9a",fontSize:13,lineHeight:1.5,marginBottom:14}}>Las coordenadas se registran manualmente desde Google Maps. La app valida formato y rango.</div><div style={{height:280,border:"1px solid #e2e8f0",borderRadius:14,background:"linear-gradient(#e8f4fd 1px,transparent 1px),linear-gradient(90deg,#e8f4fd 1px,transparent 1px)",backgroundSize:"46px 46px",position:"relative",overflow:"hidden"}}>{tiendas.filter(t=>Number.isFinite(Number(t.lat))&&Number.isFinite(Number(t.lng))).slice(0,18).map((t,i)=><span key={t.id} style={{position:"absolute",left:`${14+(i*19)%72}%`,top:`${18+(i*31)%68}%`,background:"#fff",border:"1px solid #e2e8f0",borderRadius:999,padding:"6px 10px",fontSize:11,fontWeight:900,color:"#1a2f4a",boxShadow:"0 4px 12px rgba(26,47,74,.08)"}}>⌖ {t.n}</span>)}</div></div><div style={{...S.card,padding:20}}><div style={{fontSize:18,fontWeight:900,color:"#1a2f4a",marginBottom:12}}>Pendientes / validación</div>{tiendas.filter(t=>!Number.isFinite(Number(t.lat))||!Number.isFinite(Number(t.lng))).slice(0,12).map(t=><div key={t.id} style={{display:"flex",justifyContent:"space-between",alignItems:"center",borderBottom:"1px solid #f0f4f8",padding:"10px 0"}}><div><b style={{color:"#1a2f4a"}}>Vega {nomTienda(t)}</b><div style={{fontSize:11,color:"#8aaabb"}}>#{t.idTienda||"s/id"} · {t.dist||"sin distrito"}</div></div><button onClick={()=>setTiendaEditModal({...t,_zonalUserId:t.usuarioZonalId||"__manual__"})} style={{padding:"8px 12px",borderRadius:10,border:"1px solid #c8d8e8",background:"#fff",fontWeight:800,color:"#5a7a9a"}}>Editar coords</button></div>)}{tiendas.filter(t=>!Number.isFinite(Number(t.lat))||!Number.isFinite(Number(t.lng))).length===0&&<div style={{fontSize:12,color:"#00b894",fontWeight:800}}>Todas las tiendas tienen coordenadas válidas.</div>}</div></div>
            )}
            {tpTab==="responsables"&&(
              <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:16}}><div style={{...S.card,padding:20}}><div style={{fontSize:18,fontWeight:900,color:"#1a2f4a",marginBottom:12}}>Jefes zonales desde Usuarios</div>{zonalesUsuarios.map(u=><div key={u.id} style={{display:"flex",alignItems:"center",gap:10,padding:"10px 0",borderBottom:"1px solid #f0f4f8"}}><span style={{width:34,height:34,borderRadius:"50%",background:"#6C6EF5",color:"#fff",display:"grid",placeItems:"center",fontWeight:900}}>{String(u.nombre||"U").split(" ").map(x=>x[0]).slice(0,2).join("").toUpperCase()}</span><div><b>{u.nombre}</b><div style={{fontSize:11,color:"#8aaabb"}}>{u.cargo||u.rol} · {u.email||"sin correo"}</div></div></div>)}{zonalesUsuarios.length===0&&<div style={{fontSize:12,color:"#8aaabb"}}>Aún no hay usuarios con cargo Jefe Zonal o rol Coordinador.</div>}</div><div style={{...S.card,padding:20}}><div style={{fontSize:18,fontWeight:900,color:"#1a2f4a",marginBottom:12}}>Asignación por tienda</div>{tiendas.slice(0,14).map(t=><div key={t.id} style={{display:"flex",justifyContent:"space-between",gap:10,borderBottom:"1px solid #f0f4f8",padding:"9px 0"}}><div><b>Vega {nomTienda(t)}</b><div style={{fontSize:11,color:"#8aaabb"}}>{t.jefeZonalNombre||"sin zonal"} · {t.gerenteTienda||"sin jefe tienda"}</div></div><button onClick={()=>setTiendaEditModal({...t,_zonalUserId:t.usuarioZonalId||"__manual__"})} style={{padding:"7px 10px",borderRadius:10,border:"1px solid #c8d8e8",background:"#fff",fontWeight:800,color:"#5a7a9a"}}>Editar</button></div>)}</div></div>
            )}
            {tpTab==="historial"&&(
              <div style={{...S.card,padding:20}}><div style={{fontSize:18,fontWeight:900,color:"#1a2f4a",marginBottom:12}}>Historial de cambios</div>{(tiendaHistorial||[]).length===0&&<div style={{fontSize:12,color:"#8aaabb",padding:14,background:"#f8fafc",borderRadius:12}}>Aún no hay cambios registrados en esta sesión.</div>}{(tiendaHistorial||[]).map(h=><div key={h.id} style={{display:"grid",gridTemplateColumns:"180px 1fr 180px",gap:10,padding:"10px 0",borderBottom:"1px solid #f0f4f8",fontSize:12}}><span style={{color:"#8aaabb"}}>{new Date(h.fecha).toLocaleString()}</span><b style={{color:"#1a2f4a"}}>{h.accion} · {h.tienda}</b><span style={{color:"#5a7a9a"}}>{h.usuario}</span></div>)}</div>
            )}
          </div>
        );
      })()}





{cfgTab===3&&(()=>{
        // ── Historial de auditorías de campo ──
        const auditList=Object.values(auditorias).sort((a,b)=>(b.fecha||"").localeCompare(a.fecha||""));
        // ── KPIs Dashboard ──
        const hoy7=localDateAdd(todayStr(),-7);
        const auditSemana=auditList.filter(a=>a.fecha>=hoy7&&a.estado==="enviado");
        const auditEnviadas=auditList.filter(a=>a.estado==="enviado");
        const scoresProm=auditEnviadas.map(a=>a.scoreFinal).filter(s=>s!==null&&s!==undefined);
        const promScore=scoresProm.length?Math.round(scoresProm.reduce((a,b)=>a+b,0)/scoresProm.length*10)/10:null;
        const criticas=auditEnviadas.filter(a=>a.scoreFinal!==null&&a.scoreFinal<60).length;
        const tiendaAuditadas=new Set(auditSemana.map(a=>a.tiendaId)).size;
        // Score por sección global
        const seccionScores={};
        auditEnviadas.forEach(a=>{(a.scoresPorModulo||[]).forEach(sm=>{
          if(!sm.score?.pct) return;
          if(!seccionScores[sm.moduloLabel]){seccionScores[sm.moduloLabel]={sum:0,n:0};}
          seccionScores[sm.moduloLabel].sum+=(sm.score?.pct||0);
          seccionScores[sm.moduloLabel].n++;
        });});
        const seccionesKPI=Object.entries(seccionScores).map(([l,v])=>({label:l,pct:Math.round(v.sum/v.n)})).sort((a,b)=>a.pct-b.pct);
        const auditFiltrados=auditFiltroFmt==="Todos"?auditList:auditList.filter(a=>tiendas.find(t=>t.id===a.tiendaId)?.f===auditFiltroFmt);
        const tier=getTierAuditoria;
        return(
        <div>
          {/* KPIs Dashboard */}
          <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(140px,1fr))",gap:8,marginBottom:14}}>
            {[
              {label:"Tiendas auditadas",sub:"últimos 7 días",val:tiendaAuditadas,c:"#0984e3"},
              {label:"Score promedio",sub:"auditorías enviadas",val:promScore!==null?promScore.toFixed(1)+"%":"S/D",c:promScore>=75?"#00b894":promScore>=60?"#f6a623":"#d63031"},
              {label:"Tiendas críticas",sub:"score < 60%",val:criticas,c:criticas>0?"#d63031":"#00b894"},
              {label:"Total enviadas",sub:"todas las fechas",val:auditEnviadas.length,c:"#1a2f4a"},
            ].map((k,i)=>(
              <div key={i} style={{background:k.c+"12",border:`1px solid ${k.c}33`,borderRadius:10,padding:"12px 14px"}}>
                <div style={{fontSize:10,color:"#5a7a9a",marginBottom:4}}>{k.label}</div>
                <div style={{fontSize:22,fontWeight:800,color:k.c,lineHeight:1}}>{k.val}</div>
                <div style={{fontSize:9,color:"#8aaabb",marginTop:3}}>{k.sub}</div>
              </div>
            ))}
          </div>
          {seccionesKPI.length>0&&(
            <div style={{...S.card,padding:"12px 14px",marginBottom:14}}>
              <div style={{fontWeight:700,fontSize:12,color:"#1a2f4a",marginBottom:10}}>📊 Score promedio por sección</div>
              {seccionesKPI.map(s=>{const tr=getTierAuditoria(s.pct);return(
                <div key={s.label} style={{marginBottom:8}}>
                  <div style={{display:"flex",justifyContent:"space-between",marginBottom:3}}>
                    <span style={{fontSize:11,color:"#5a7a9a"}}>{s.label}</span>
                    <span style={{fontSize:11,fontWeight:700,color:tr.c}}>{s.pct}{"% "}{tr.icon}</span>
                  </div>
                  <div style={{height:5,background:"#e2e8f0",borderRadius:3,overflow:"hidden"}}>
                    <div style={{height:"100%",width:s.pct+"%",background:tr.c,borderRadius:3}}/>
                  </div>
                </div>
              );})}
            </div>
          )}
          {/* Sección historial auditorías */}
          <div style={{...S.card,padding:"14px",marginBottom:14}}>
            <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:10,flexWrap:"wrap",gap:8}}>
              <div>
                <div style={{fontWeight:800,fontSize:14,color:"#1a2f4a",marginBottom:2}}>🔍 Historial de auditorías</div>
                <div style={{fontSize:11,color:"#8aaabb"}}>{auditList.length} registros totales</div>
              </div>
              <div style={{display:"flex",gap:5,flexWrap:"wrap"}}>
                {["Todos","Mayorista","Supermayorista","Market"].map(f=>(
                  <button key={f} onClick={()=>setAuditFiltroFmt(f)}
                    style={{padding:"4px 10px",borderRadius:20,border:`1.5px solid ${auditFiltroFmt===f?"#00b5b4":"#e2e8f0"}`,
                      background:auditFiltroFmt===f?"#e0fafa":"#fff",color:auditFiltroFmt===f?"#00b5b4":"#5a7a9a",
                      cursor:"pointer",fontSize:10,fontWeight:700}}>
                    {f}
                  </button>
                ))}
              </div>
            </div>
            {auditFiltrados.length===0?(
              <div style={{textAlign:"center",padding:"20px 0",color:"#8aaabb",fontSize:12}}>Sin auditorías registradas aún</div>
            ):(
              <div style={{overflowX:"auto"}}>
                <table style={{width:"100%",borderCollapse:"collapse",fontSize:11}}>
                  <thead>
                    <tr style={{background:"#f8fafc"}}>
                      {["Fecha","Tienda","Formato","Auditor","Score","Estado",""].map(h=>(
                        <th key={h} style={{padding:"7px 10px",textAlign:"left",color:"#5a7a9a",fontWeight:700,fontSize:9,borderBottom:"2px solid #e9eef5",whiteSpace:"nowrap"}}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {auditFiltrados.slice(0,50).map((a,idx)=>{
                      const t=tiendas.find(ti=>ti.id===a.tiendaId);
                      const sc=a.scoreFinal;
                      const tr=tier(sc);
                      return(
                        <tr key={a.id||idx} style={{borderBottom:"1px solid #f5f7fa"}}>
                          <td style={{padding:"7px 10px",whiteSpace:"nowrap",color:"#5a7a9a"}}>{a.fecha}</td>
                          <td style={{padding:"7px 10px",fontWeight:700,color:"#1a2f4a",whiteSpace:"nowrap"}}>Vega {t?.n||a.tiendaNombre}</td>
                          <td style={{padding:"7px 10px",color:"#8aaabb",whiteSpace:"nowrap"}}>{t?.f||a.tiendaFormato||"—"}</td>
                          <td style={{padding:"7px 10px",whiteSpace:"nowrap"}}>{a.auditorNombre||a.auditorId}</td>
                          <td style={{padding:"7px 10px",whiteSpace:"nowrap"}}>
                            <span style={{padding:"2px 8px",borderRadius:20,fontSize:10,fontWeight:700,color:tr.c,background:tr.bg}}>
                              {sc!==null&&sc!==undefined?sc.toFixed(1)+"%":"S/D"} {tr.icon}
                            </span>
                          </td>
                          <td style={{padding:"7px 10px"}}>
                            <span style={{padding:"2px 7px",borderRadius:20,fontSize:9,fontWeight:700,
                              color:a.estado==="enviado"?"#085041":"#633806",
                              background:a.estado==="enviado"?"#E1F5EE":"#FAEEDA"}}>
                              {a.estado==="enviado"?"Enviada":"Borrador"}
                            </span>
                          </td>
                          <td style={{padding:"7px 10px"}}>
                            <div style={{display:"flex",gap:4}}>
                              <button onClick={()=>setAuditDetalle(auditDetalle?.id===a.id?null:a)}
                                style={{padding:"3px 10px",borderRadius:8,border:"1px solid #c8d8e8",background:"#f8fafc",color:"#5a7a9a",cursor:"pointer",fontSize:10,fontWeight:700}}>
                                {auditDetalle?.id===a.id?"▲":"▼ Ver"}
                              </button>
                              {isAdmin&&<button onClick={async()=>{
                                if(!window.confirm(`¿Eliminar auditoría de Vega ${tiendas.find(t=>t.id===a.tiendaId)?.n||a.tiendaNombre} del ${a.fecha}?`)) return;
                                try{await setDoc(doc(db,"auditorias",a.id), {...a, activo:false, estado:"anulada", deletedAt:new Date().toISOString(), deletedBy:uDni||uName||"admin_ui"});if(auditDetalle?.id===a.id)setAuditDetalle(null);showToast("🗑️ Auditoría anulada con trazabilidad");}
                                catch(e){showToast("❌ Error al eliminar");}
                              }} style={{padding:"3px 8px",borderRadius:8,border:"none",background:"#fff1f2",color:"#dc2626",cursor:"pointer",fontSize:10,fontWeight:700}}>🗑️</button>}
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
            {/* Panel detalle */}
            {auditDetalle&&(
              <div style={{marginTop:12,padding:"14px",background:"#f8fafc",borderRadius:10,border:"1px solid #e2e8f0"}}>
                <div style={{fontWeight:700,fontSize:13,color:"#1a2f4a",marginBottom:10}}>
                  Detalle — Vega {tiendas.find(t=>t.id===auditDetalle.tiendaId)?.n||auditDetalle.tiendaNombre} · {auditDetalle.fecha}
                </div>
                <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(140px,1fr))",gap:8,marginBottom:10}}>
                  {(auditDetalle.scoresPorModulo||[]).map((sm,i)=>{
                    // Compatibilidad: score puede ser número (formato antiguo) u objeto {ob,mx,pct}
                    const sc=sm.score;
                    const pct=sc===null||sc===undefined?null:typeof sc==="object"?sc.pct:Math.round((sc/3)*100);
                    const ob=typeof sc==="object"?sc.ob:sc;
                    const mx=typeof sc==="object"?sc.mx:3;
                    const tr2=getTierAuditoria(pct);
                    return(
                      <div key={i} style={{background:"#fff",borderRadius:8,padding:"10px 12px",border:"0.5px solid #e2e8f0"}}>
                        <div style={{fontSize:10,color:"#8aaabb",marginBottom:4}}>{sm.moduloLabel}</div>
                        <div style={{fontSize:15,fontWeight:700,color:tr2.c}}>{pct!==null?`${pct}%`:"S/D"}</div>
                        <div style={{fontSize:10,color:tr2.c}}>{ob!==null&&ob!==undefined?`${ob}/${mx} pts · ${tr2.label}`:""}</div>
                        {sm.obsModulo&&<div style={{fontSize:9,color:"#8aaabb",marginTop:4,lineHeight:1.4}}>📌 {sm.obsModulo}</div>}
                      </div>
                    );
                  })}
                </div>
                {auditDetalle.observaciones&&(
                  <div style={{marginBottom:8}}>
                    <div style={{fontSize:10,fontWeight:700,color:"#5a7a9a",marginBottom:3}}>OBSERVACIONES</div>
                    <div style={{fontSize:11,color:"#1a2f4a",lineHeight:1.5}}>{auditDetalle.observaciones}</div>
                  </div>
                )}
                {auditDetalle.compromisos&&(
                  <div>
                    <div style={{fontSize:10,fontWeight:700,color:"#5a7a9a",marginBottom:3}}>COMPROMISOS</div>
                    <div style={{fontSize:11,color:"#1a2f4a",lineHeight:1.5}}>{auditDetalle.compromisos}</div>
                  </div>
                )}
                {auditDetalle.duracionMin&&(
                  <div style={{marginTop:8,fontSize:10,color:"#8aaabb"}}>⏱ Duración: {auditDetalle.duracionMin} min · Auditor: {auditDetalle.auditorNombre}</div>
                )}
              </div>
            )}
          </div>

          {/* Log de accesos movido a sección Usuarios → tab "log" */}

          {/* Log de registros de evidencias — a continuación */}
          {(()=>{
        const allLogs=[];
        const duplicadosDocIds=new Set();
        Object.entries(regs).forEach(([key,reg])=>{
          if(!reg?.evidencias?.length||reg.anulado) return;
          if(reg.evidencias.length>1) duplicadosDocIds.add(key);
        });

        Object.entries(regs).forEach(([key,reg])=>{
          if(!reg?.evidencias?.length) return;
          const parts=key.replace(/--/g,"|").split("|");
          if(parts.length<3) return;
          const [f,tId,aId]=parts;
          const tienda=tiendas.find(ti=>ti.id===tId);
          const act=acts.find(a=>a.id===aId);
          if(!tienda||!act) return;
          const esDuplicado=duplicadosDocIds.has(key);
          reg.evidencias.forEach((ev,evIdx)=>{
            if(ev.auditor) allLogs.push({
              docId:key, evIdx,
              fecha:f,tienda:tienda.n,formato:tienda.f,
              actividad:act.n,auditor:ev.auditor,
              dni:ev.dni||"—",hora:ev.hora,
              pts:ev.puntaje,horaReg:ev.horaRegistro,
              ts:ev.timestamp,anulado:reg.anulado,
              esDuplicado,
              uid:`${key}__${evIdx}`
            });
          });
        });
        allLogs.sort((a,b)=>(b.ts||"").localeCompare(a.ts||""));

        const totalDuplicados=allLogs.filter(l=>l.esDuplicado&&!l.anulado).length;
        const fmtOpts=["Todos",...[...new Set(allLogs.map(l=>l.formato))]];
        const actOpts=["Todas",...[...new Set(allLogs.map(l=>l.actividad))]];
        const audOpts=["Todos",...[...new Set(allLogs.map(l=>l.auditor))]];
        // Mes: extraer YYYY-MM de cada fecha y mostrar como etiqueta legible
        const mesesUnicos=[...new Set(allLogs.map(l=>l.fecha.slice(0,7)))].sort().reverse();
        const mesNombre=m=>{const [y,mo]=m.split("-");return new Date(y,mo-1).toLocaleDateString("es-PE",{month:"long",year:"numeric"});};
        const mesOpts=["Todos",...mesesUnicos];

        const filtered=allLogs.filter(l=>{
          if(logSoloDups&&!l.esDuplicado) return false;
          if(logFmt!=="Todos"&&l.formato!==logFmt) return false;
          if(logAct!=="Todas"&&l.actividad!==logAct) return false;
          if(logAud!=="Todos"&&l.auditor!==logAud) return false;
          if(logPts!=="Todos"&&String(l.pts)!==logPts) return false;
          // Filtro por mes: comparar los primeros 7 chars de la fecha (YYYY-MM)
          if(logFecha!=="Todos"&&!l.fecha.startsWith(logFecha)) return false;
          if(logTxt&&!(l.tienda.toLowerCase().includes(logTxt.toLowerCase())||l.auditor.toLowerCase().includes(logTxt.toLowerCase())||l.fecha.includes(logTxt))) return false;
          return true;
        });

        const selSty={width:"100%",padding:"7px 10px",borderRadius:8,border:"1px solid #c8d8e8",background:"#f8fafc",color:"#1a2f4a",fontSize:11,outline:"none"};
        return(
        <div>
          <div style={{display:"flex",alignItems:"flex-start",justifyContent:"space-between",marginBottom:12,gap:10,flexWrap:"wrap"}}>
            <div>
              <div style={{fontWeight:800,fontSize:14,color:"#1a2f4a",marginBottom:2}}><IcoClipboard size={13} color={"#1a2f4a"}/> Log de Auditoría</div>
              <div style={{fontSize:11,color:"#8aaabb"}}>{allLogs.length} registros totales</div>
            </div>
            {/* Alerta de duplicados */}
            {totalDuplicados>0&&(
              <div style={{background:"#fff1f2",border:"1.5px solid #fecaca",borderRadius:10,padding:"8px 14px",display:"flex",alignItems:"center",gap:8,flexShrink:0}}>
                <span style={{fontSize:14}}>⚠️</span>
                <div>
                  <div style={{fontSize:12,fontWeight:700,color:"#dc2626"}}>{totalDuplicados} registros duplicados detectados</div>
                  <div style={{fontSize:10,color:"#5a7a9a"}}>Misma tienda+actividad+día con múltiples evidencias</div>
                </div>
                <button onClick={()=>setLogSoloDups(true)}
                  style={{padding:"4px 10px",borderRadius:7,border:"none",background:"#dc2626",color:"#fff",cursor:"pointer",fontSize:10,fontWeight:700,whiteSpace:"nowrap"}}>Ver duplicados</button>
              </div>
            )}
          </div>

          <div style={{...S.card,padding:"12px 14px",marginBottom:12}}>
            <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(130px,1fr))",gap:8,marginBottom:8}}>
              <div>
                <div style={{fontSize:9,color:"#8aaabb",fontWeight:700,marginBottom:3}}>MES</div>
                <select value={logFecha} onChange={e=>setLogFecha(e.target.value)} style={selSty}>
                  {mesOpts.map(o=><option key={o} value={o}>{o==="Todos"?"Todos":mesNombre(o)}</option>)}
                </select>
              </div>
              <div>
                <div style={{fontSize:9,color:"#8aaabb",fontWeight:700,marginBottom:3}}>ACTIVIDAD</div>
                <select value={logAct} onChange={e=>setLogAct(e.target.value)} style={selSty}>
                  {actOpts.map(o=><option key={o} value={o}>{o}</option>)}
                </select>
              </div>
              <div>
                <div style={{fontSize:9,color:"#8aaabb",fontWeight:700,marginBottom:3}}>FORMATO</div>
                <select value={logFmt} onChange={e=>setLogFmt(e.target.value)} style={selSty}>
                  {fmtOpts.map(o=><option key={o} value={o}>{o}</option>)}
                </select>
              </div>
              <div>
                <div style={{fontSize:9,color:"#8aaabb",fontWeight:700,marginBottom:3}}>AUDITOR</div>
                <select value={logAud} onChange={e=>setLogAud(e.target.value)} style={selSty}>
                  {audOpts.map(o=><option key={o} value={o}>{o}</option>)}
                </select>
              </div>
              <div>
                <div style={{fontSize:9,color:"#8aaabb",fontWeight:700,marginBottom:3}}>PUNTAJE</div>
                <select value={logPts} onChange={e=>setLogPts(e.target.value)} style={selSty}>
                  {["Todos","10","8","6","0"].map(o=><option key={o}>{o==="Todos"?"Todos":o==="10"?"10pts ORO":o==="8"?"8pts PLATA":o==="6"?"6pts BRONCE":"0pts FUERA"}</option>)}
                </select>
              </div>
              <div>
                <div style={{fontSize:9,color:"#8aaabb",fontWeight:700,marginBottom:3}}>BUSCAR</div>
                <input value={logTxt} onChange={e=>setLogTxt(e.target.value)} placeholder="Tienda o auditor..."
                  style={selSty}/>
              </div>
            </div>
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",flexWrap:"wrap",gap:8}}>
              <span style={{fontSize:10,color:"#8aaabb"}}>{filtered.length} de {allLogs.length} registros
                {logSoloDups&&<span style={{marginLeft:8,padding:"2px 8px",borderRadius:20,fontSize:10,fontWeight:700,color:"#dc2626",background:"#fff1f2",border:"1px solid #fecaca"}}>⚠️ Filtrando solo duplicados <button onClick={()=>setLogSoloDups(false)} style={{background:"none",border:"none",cursor:"pointer",color:"#dc2626",fontSize:11,padding:"0 0 0 4px"}}>✕</button></span>}
              </span>
              <div style={{display:"flex",gap:8,alignItems:"center"}}>
                {totalDuplicados>0&&(
                  <button onClick={()=>{
                    // Activar filtro para ver duplicados
                    setLogSoloDups(true);
                    // Preseleccionar los sobrantes (mantener solo el de hora más temprana)
                    const porDoc={};
                    allLogs.filter(l=>l.esDuplicado&&!l.anulado).forEach(l=>{
                      if(!porDoc[l.docId]) porDoc[l.docId]=[];
                      porDoc[l.docId].push(l);
                    });
                    const aEliminar=new Set();
                    Object.values(porDoc).forEach(grupo=>{
                      const sorted=[...grupo].sort((a,b)=>a.hora.localeCompare(b.hora));
                      sorted.slice(1).forEach(l=>aEliminar.add(l.uid));
                    });
                    setSelDupsExterno([...aEliminar]);
                    setLogSoloDups(true);
                  }} style={{padding:"5px 12px",borderRadius:8,border:"1.5px solid #fecaca",background:"#fff1f2",color:"#dc2626",cursor:"pointer",fontSize:10,fontWeight:700}}>
                    ⚠️ Ver y seleccionar duplicados a eliminar
                  </button>
                )}
                <button onClick={()=>{setLogFmt("Todos");setLogAct("Todas");setLogAud("Todos");setLogPts("Todos");setLogTxt("");setLogFecha("Todos");setLogSoloDups(false);}}
                  style={{fontSize:10,color:"#5a7a9a",background:"none",border:"none",cursor:"pointer",textDecoration:"underline"}}>Limpiar filtros</button>
              </div>
            </div>
          </div>
          {!filtered.length
            ?<div style={{textAlign:"center",padding:"24px",color:"#8aaabb",fontSize:12}}>Sin resultados</div>
            :<LogTable filtered={filtered} regs={regs} db={db} deleteDoc={deleteDoc} doc={doc} setDoc={setDoc} showToast={showToast} sc={sc} sb={sb} FMT={FMT} S={S} isAdmin={isAdmin} selDupsExterno={selDupsExterno} onClearSelDups={()=>setSelDupsExterno([])}/>
          }
        </div>
        );
      })()}
        </div>
        );
      })()}
{cfgTab===4&&(hideTabs||cfgMod==="evidencias")&&(
        <div>
          <div style={{marginBottom:14}}>
            <div style={{fontWeight:800,fontSize:14,color:"#1a2f4a"}}>📅 Rangos del Día</div>
            <div style={{fontSize:11,color:"#8aaabb",marginTop:2}}>Ajusta los horarios de puntaje para actividades Ad-hoc o Promocionales en una fecha específica. Los Always On usan su rango fijo.</div>
          </div>
          {/* Bug 7 fix: estado controlado en lugar de document.getElementById */}
          <div style={{...S.card,padding:"12px 14px",marginBottom:14,display:"flex",alignItems:"center",gap:10}}>
            <span style={{fontSize:12,fontWeight:700,color:"#5a7a9a"}}>📆 Fecha:</span>
            <input type="date" value={rangoFecha}
              onChange={e=>setRangoFecha(e.target.value)}
              style={{...S.inp,flex:1,fontSize:13}}/>
          </div>
          {acts.filter(a=>a.activa&&a.cat!=="Always On").map(a=>{
            const override = rangosDia?.[a.id]?.[rangoFecha];
            const base = a.r||RANGOS_DEFAULT;
            const RR = override||base;
            return(
              <div key={a.id} style={{...S.card,padding:"12px 14px",marginBottom:10}}>
                <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:10}}>
                  <span style={{fontSize:16}}>{a.e}</span>
                  <div style={{flex:1}}>
                    <div style={{fontWeight:700,fontSize:13,color:a.c}}>{a.n}</div>
                    <div style={{fontSize:10,color:"#8aaabb"}}>{a.cat}{override&&<span style={{color:"#f6a623",marginLeft:6}}>⚡ Rango del día activo</span>}</div>
                  </div>
                  {override&&(
                    <button onClick={()=>{
                      // FIX BUG3: saveConfig FUERA del updater — los updaters deben ser funciones puras
                      const cur = rangosDia;
                      const next={...cur};
                      if(next[a.id]) { delete next[a.id][rangoFecha]; if(!Object.keys(next[a.id]).length) delete next[a.id]; }
                      setRangosDia(next);
                      saveConfig({rangosDia:next});
                      showToast("🗑️ Rango del día eliminado");
                    }} style={{padding:"4px 10px",borderRadius:8,border:"1px solid #fecaca",background:"#fff1f2",color:"#dc2626",cursor:"pointer",fontSize:10,fontWeight:700}}>
                      Quitar override
                    </button>
                  )}
                </div>
                <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(130px,1fr))",gap:8,marginBottom:8}}>
                  {[{k:"c100",icon:"🥇",label:"ORO hasta"},{k:"c80",icon:"🥈",label:"PLATA hasta"},{k:"c60",icon:"🥉",label:"BRONCE hasta"}].map(f=>(
                    <div key={f.k}>
                      <div style={{fontSize:9,color:"#8aaabb",fontWeight:700,marginBottom:4}}>{f.icon} {f.label}</div>
                      <input type="time" value={RR[f.k]}
                        onChange={e=>{
                          // FIX BUG3: saveConfig FUERA del updater — los updaters deben ser funciones puras
                          const next={...rangosDia,[a.id]:{...(rangosDia[a.id]||{}),[rangoFecha]:{...(rangosDia[a.id]?.[rangoFecha]||base),[f.k]:e.target.value}}};
                          setRangosDia(next);
                          saveConfig({rangosDia:next});
                        }}
                        style={{width:"100%",padding:"8px",borderRadius:8,border:"1.5px solid "+a.c+"55",background:"#fff",color:"#1a2f4a",fontSize:13,outline:"none",textAlign:"center",boxSizing:"border-box"}}/>
                    </div>
                  ))}
                </div>
                <div style={{display:"flex",gap:5,flexWrap:"wrap"}}>
                  {[["🥇 10pts","#f6a623",`≤${RR.c100}`],["🥈 8pts","#74b9ff",`${RR.c100}–${RR.c80}`],["🥉 6pts","#a29bfe",`${RR.c80}–${RR.c60}`],["🔴 0pts","#d63031",`>${RR.c60}`]].map(([ic,c,t])=>(
                    <span key={t} style={{padding:"2px 8px",borderRadius:20,fontSize:9,fontWeight:700,color:c,background:c+"18"}}>{ic} {t}</span>
                  ))}
                </div>
              </div>
            );
          })}
          {acts.filter(a=>a.activa&&a.cat!=="Always On").length===0&&(
            <div style={{textAlign:"center",padding:"30px",color:"#8aaabb",fontSize:13}}>No hay actividades Ad-hoc activas</div>
          )}
        </div>
      )}

      {/* ── CORTES DE SUPERVISIÓN — cfgTab===5 ── */}
      {cfgTab===5&&(hideTabs||cfgMod==="evidencias")&&(
        <div>
          <div style={{marginBottom:14}}>
            <div style={{fontWeight:800,fontSize:14,color:"#1a2f4a"}}>⏱️ Cortes de Supervisión</div>
            <div style={{fontSize:11,color:"#8aaabb",marginTop:2,lineHeight:1.6}}>
              Define los dos bloques horarios que se muestran en la <strong>Tarjeta de Estado</strong> para supervisar el trabajo del auditor en campo.<br/>
              Son independientes de los rangos de puntaje — miden ventanas operativas, no scoring.
            </div>
          </div>
          <div style={{...S.card,padding:"18px 20px",marginBottom:12}}>
            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:16}}>
              {/* Corte 1 */}
              <div>
                <div style={{fontSize:10,fontWeight:800,color:"#BA7517",letterSpacing:".06em",marginBottom:8}}>
                  🟡 CORTE 1 · BLOQUE ORO
                </div>
                <div style={{fontSize:11,color:"#5a7a9a",marginBottom:10}}>
                  Desde <strong>00:00</strong> hasta:
                </div>
                <input type="time" value={cortesSupervision.c1}
                  onChange={e=>{
                    const next={...cortesSupervision, c1:e.target.value};
                    setCortesSupervision(next);
                    saveConfig({cortesSupervision:next});
                  }}
                  style={{width:"100%",padding:"12px",borderRadius:10,border:"2px solid #f6a623",background:"#fff8ec",color:"#1a2f4a",fontSize:22,outline:"none",textAlign:"center",fontWeight:700,boxSizing:"border-box"}}/>
                <div style={{marginTop:8,padding:"6px 10px",background:"#fff8ec",borderRadius:8,fontSize:10,color:"#854F0B"}}>
                  00:00 – {cortesSupervision.c1} → Bloque ORO
                </div>
              </div>
              {/* Corte 2 */}
              <div>
                <div style={{fontSize:10,fontWeight:800,color:"#185FA5",letterSpacing:".06em",marginBottom:8}}>
                  🔵 CORTE 2 · BLOQUE PLATA
                </div>
                <div style={{fontSize:11,color:"#5a7a9a",marginBottom:10}}>
                  Desde <strong>{(()=>{const[h,m]=cortesSupervision.c1.split(":").map(Number);const nx=h*60+m+1;return String(Math.floor(nx/60)).padStart(2,"0")+":"+String(nx%60).padStart(2,"0");})()}
</strong> hasta:
                </div>
                <input type="time" value={cortesSupervision.c2}
                  onChange={e=>{
                    const next={...cortesSupervision, c2:e.target.value};
                    setCortesSupervision(next);
                    saveConfig({cortesSupervision:next});
                  }}
                  style={{width:"100%",padding:"12px",borderRadius:10,border:"2px solid #74b9ff",background:"#e8f4fd",color:"#1a2f4a",fontSize:22,outline:"none",textAlign:"center",fontWeight:700,boxSizing:"border-box"}}/>
                <div style={{marginTop:8,padding:"6px 10px",background:"#e8f4fd",borderRadius:8,fontSize:10,color:"#185FA5"}}>
                  {(()=>{const[h,m]=cortesSupervision.c1.split(":").map(Number);const nx=h*60+m+1;return String(Math.floor(nx/60)).padStart(2,"0")+":"+String(nx%60).padStart(2,"0");})()}  – {cortesSupervision.c2} → Bloque PLATA
                </div>
              </div>
            </div>
            {/* Preview de la tarjeta */}
            <div style={{marginTop:20,padding:"12px 14px",background:"#f8fafc",borderRadius:10,border:"1px solid #e2e8f0"}}>
              <div style={{fontSize:10,fontWeight:700,color:"#5a7a9a",letterSpacing:".06em",marginBottom:8}}>VISTA PREVIA — TARJETA ESTADO</div>
              <div style={{display:"flex",gap:12,flexWrap:"wrap"}}>
                <div style={{display:"flex",alignItems:"center",gap:6,padding:"6px 12px",background:"#fff8ec",borderRadius:8,border:"1px solid #FAC775"}}>
                  <span style={{width:8,height:8,borderRadius:"50%",background:"#BA7517",display:"inline-block"}}/>
                  <span style={{fontSize:11,fontWeight:700,color:"#BA7517"}}>CORTE 1 · hasta las {cortesSupervision.c1} · ORO</span>
                </div>
                <div style={{display:"flex",alignItems:"center",gap:6,padding:"6px 12px",background:"#e8f4fd",borderRadius:8,border:"1px solid #74b9ff"}}>
                  <span style={{width:8,height:8,borderRadius:"50%",background:"#185FA5",display:"inline-block"}}/>
                  <span style={{fontSize:11,fontWeight:700,color:"#185FA5"}}>CORTE 2 · {(()=>{const[h,m]=cortesSupervision.c1.split(":").map(Number);const nx=h*60+m+1;return String(Math.floor(nx/60)).padStart(2,"0")+":"+String(nx%60).padStart(2,"0");})()}  a {cortesSupervision.c2} · PLATA</span>
                </div>
              </div>
            </div>
          </div>
          {/* Botón reset */}
          <button onClick={()=>{
            const def={c1:"08:30",c2:"09:30"};
            setCortesSupervision(def);
            saveConfig({cortesSupervision:def});
            showToast("✅ Cortes restablecidos a valores por defecto");
          }} style={{padding:"10px 18px",borderRadius:10,border:"1.5px solid #e2e8f0",background:"#fff",color:"#5a7a9a",cursor:"pointer",fontSize:12,fontWeight:700}}>
            ↺ Restablecer valores por defecto (08:30 / 09:30)
          </button>
        </div>
      )}

    </div>
  );


  const renderViewerDash = ()=>{
    const {hoy,esMesActual,tendenciaViewer,iSemRef,vSemActual,vSemAnt,deltaSem,efMes,
           nOroV,nC2V,nFueraV,nSinRegV,nTotalEsperadoV,totalContadoV,rangoMostrar,
           actEfectV,fmtEfV,scoresMesV,enRiesgo,enAtención,sinDatosCount,
           actMejor,actPeor,periodoLabel,semLabel,esAlerta,narrativa} = viewerData;

    const tierMes = getTier(efMes);
    const periodoTexto = selWeek!==null ? semanasDelMes[selWeek]?.label : MESES[vMonth];

    // --- Variables adicionales para la sección de ranking duplicada ---
    // actsBase y calcEficienciaFiltrada se definen aquí para que la sección
    // de ranking operativa pueda reutilizar la misma lógica que el dashboard.
    // actsBase: actividades activas (todas las actividades)
    const actsBase = acts.filter(a => a.activa);
    // calcEficienciaFiltrada: acumula puntos obtenidos y máximos para un ID de tienda
    const calcEficienciaFiltrada = (tId) => {
      let obtenidos = 0, maximos = 0;
      // Recorremos semanas y días del mes
      semanasDelMes.forEach(s => {
        s.days.forEach(day => {
          const ds = dStr(vYear, vMonth, day);
          // Ignorar días futuros
          if(ds > todayStr()) return;
          const dw = getDow(ds);
          // Filtrar actividades por día de la semana y sin excepción
          actsBase.filter(a=>(a.dias||[]).includes(dw)&&!isExc(tId,a.id,ds)&&actsConRegistroIds.has(a.id)&&(a.cat==="Always On"||tiAct.some(ti2=>{const r2=getReg(ds,ti2.id,a.id);return r2?.evidencias?.length>0&&!r2?.anulado;}))).forEach(a=>{
            maximos += 10;
            const reg = getReg(ds, tId, a.id);
            const p = puntajeReg(reg, getRangoActivo(a.id, ds));
            if(p !== null) {
              obtenidos += p;
            }
          });
        });
      });
      if(maximos === 0) return null;
      return { pct: Math.round((obtenidos / maximos) * 100), obtenidos, maximos };
    };
    // scoresMes: lista de puntuaciones para cada tienda activa
    const scoresMes = tiAct.map(ti => {
      const ef = calcEficienciaFiltrada(ti.id);
      return { t: ti, score: ef?.pct ?? null, obtenidos: ef?.obtenidos ?? 0, maximos: ef?.maximos ?? 0 };
    });

    // ranking completo para el visor: ordenar tiendas por score mensual
    // y obtener los 5 mejores y los 5 peores. Esta lógica replica la del dashboard
    // pero utilizando las variables locales definidas arriba.
    const sorted = [...scoresMes].sort((a, b) => (b.score ?? -1) - (a.score ?? -1));
    const top5 = sorted.filter(s => s.score !== null).slice(0, 5);
    const bot5 = [...sorted].reverse().filter(s => s.score !== null).slice(0, 5);

    return(
    <div style={{padding:"clamp(10px,3vw,18px)",maxWidth:860,margin:"0 auto",width:"100%",paddingBottom:24}}>

      {/* ── NAV MES + SEMANAS ── */}
      <div style={{display:"flex",gap:8,alignItems:"center",marginBottom:8}}>
        <button onClick={()=>navMes(-1)} style={{padding:"8px 14px",borderRadius:8,border:"1px solid #c8d8e8",background:"#fff",cursor:"pointer",fontWeight:700,fontSize:13,minHeight:38}}>←</button>
        <span style={{fontWeight:800,fontSize:15,color:"#1a2f4a",flex:1,textAlign:"center"}}>{MESES[vMonth].toUpperCase()} {vYear}</span>
        <button onClick={()=>navMes(1)} style={{padding:"8px 14px",borderRadius:8,border:"1px solid #c8d8e8",background:"#fff",cursor:"pointer",fontWeight:700,fontSize:13,minHeight:38}}>→</button>
      </div>
      <div style={{display:"flex",gap:5,marginBottom:16}}>
        <button onClick={()=>setSelWeek(null)} style={{flex:1,padding:"6px",borderRadius:7,border:`1.5px solid ${selWeek===null?"#00b5b4":"#e2e8f0"}`,background:selWeek===null?"#e0fafa":"#fff",color:selWeek===null?"#00b5b4":"#5a7a9a",cursor:"pointer",fontSize:11,fontWeight:700}}>Mes</button>
        {semanasDelMes.map((s,i)=>(
          <button key={i} onClick={()=>setSelWeek(i)} style={{flex:1,padding:"6px 4px",borderRadius:7,border:`1.5px solid ${selWeek===i?"#6c5ce7":"#e2e8f0"}`,background:selWeek===i?"#f0edff":"#fff",color:selWeek===i?"#6c5ce7":"#5a7a9a",cursor:"pointer",fontSize:11,fontWeight:700,lineHeight:1.3}}>
            {s.label}
            <div style={{fontSize:8,fontWeight:400,color:selWeek===i?"#6c5ce7":"#8aaabb",marginTop:2,whiteSpace:"nowrap"}}>Del {String(s.start).padStart(2,"0")} al {String(s.end).padStart(2,"0")}</div>
          </button>
        ))}
      </div>

      {/* ══════════════════════════════════════════════════════
          NIVEL 1 — ESTRATÉGICO  ·  CEO / Dirección
          Pregunta: ¿Vamos bien o mal?
      ══════════════════════════════════════════════════════ */}
      <div style={{borderRadius:14,overflow:"hidden",marginBottom:10,border:"1px solid #e2e8f0",boxShadow:"0 2px 8px rgba(0,0,0,.04)"}}>
        {/* Header del nivel */}
        <div style={{background:"#1a2f4a",padding:"10px 16px",display:"flex",alignItems:"center",gap:10}}>
          <div style={{width:28,height:28,borderRadius:8,background:"rgba(255,255,255,.15)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:14,flexShrink:0}}>💡</div>
          <div style={{flex:1}}>
            <div style={{fontWeight:800,fontSize:12,color:"#fff",letterSpacing:".06em"}}>ESTRATÉGICO · CEO / DIRECCIÓN</div>
            <div style={{fontSize:10,color:"rgba(255,255,255,.5)",marginTop:1}}>¿Vamos bien o mal? · {periodoTexto} {vYear}</div>
          </div>
          {efMes!==null&&(
            <div style={{textAlign:"right"}}>
              <div style={{fontSize:22,fontWeight:800,color:sc(efMes)}}>{efMes}%</div>
              <div style={{fontSize:9,color:"rgba(255,255,255,.5)"}}>{tierMes.icon} {tierMes.label}</div>
            </div>
          )}
        </div>
        {/* Contenido estratégico */}
        <div style={{background:"#fff",padding:"14px 16px"}}>
          {/* Narrativa ejecutiva */}
          <div style={{padding:"10px 14px",background:esAlerta?"#fff8f8":"#f0f9ff",borderRadius:10,border:`1px solid ${esAlerta?"#fecaca":"#bfdbfe"}`,marginBottom:12,display:"flex",gap:8,alignItems:"flex-start"}}>
            <span style={{fontSize:16,flexShrink:0}}>{esAlerta?"⚠️":"📊"}</span>
            <div>
              <div style={{fontSize:12,fontWeight:700,color:esAlerta?"#991b1b":"#1e40af",lineHeight:1.7}}>{narrativa}</div>
              {!esMesActual&&<div style={{fontSize:10,color:"#6b7280",marginTop:2}}>Período cerrado · {MESES[vMonth]} {vYear}</div>}
            </div>
          </div>
          {/* 3 KPIs clave: eficiencia, cobertura, riesgo */}
          <div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:8}}>
            {[
              {icon:"🎯",label:"Eficiencia global",  value:efMes!==null?efMes+"%":"—",   color:efMes!==null?sc(efMes):"#888", sub:tierMes.label, bg:efMes!==null?sb(efMes):"#f8fafc"},
              {icon:"📬",label:"Cobertura tiendas",  value:Math.round((scoresMesV.filter(s=>s.pct!==null).length/Math.max(1,tiAct.length))*100)+"%", color:"#0984e3", sub:`${scoresMesV.filter(s=>s.pct!==null).length} de ${tiAct.length}`, bg:"#e8f4fd"},
              {icon:"🚨",label:"Tiendas en riesgo",  value:enRiesgo.length>0?enRiesgo.length+" tiendas":"✓ Ninguna", color:enRiesgo.length>0?"#dc2626":"#00b894", sub:enRiesgo.length>0?"eficiencia <60%":"todas sobre el umbral", bg:enRiesgo.length>0?"#fff1f2":"#e8faf5"},
            ].map((k,i)=>(
              <div key={i} style={{background:k.bg,borderRadius:10,padding:"10px 12px"}}>
                <div style={{fontSize:14,marginBottom:4}}>{k.icon}</div>
                <div style={{fontSize:18,fontWeight:800,color:k.color,lineHeight:1}}>{k.value}</div>
                <div style={{fontSize:9,color:"#5a7a9a",marginTop:3,fontWeight:600}}>{k.label}</div>
                <div style={{fontSize:9,color:k.color,marginTop:1}}>{k.sub}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ══════════════════════════════════════════════════════
          NIVEL 2 — TÁCTICO  ·  Directores / Gerentes
          Pregunta: ¿Por qué pasó? ¿Dónde están las brechas?
      ══════════════════════════════════════════════════════ */}
      <div style={{borderRadius:14,overflow:"visible",marginBottom:10,border:"1px solid #e2e8f0",boxShadow:"0 2px 8px rgba(0,0,0,.04)"}}>
        <div style={{background:"#1e5f8a",padding:"10px 16px",display:"flex",alignItems:"center",gap:10,borderRadius:"14px 14px 0 0"}}>
          <div style={{width:28,height:28,borderRadius:8,background:"rgba(255,255,255,.15)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:14,flexShrink:0}}>🔍</div>
          <div>
            <div style={{fontWeight:800,fontSize:12,color:"#fff",letterSpacing:".06em"}}>TÁCTICO · DIRECTORES / GERENTES</div>
            <div style={{fontSize:10,color:"rgba(255,255,255,.5)",marginTop:1}}>¿Por qué pasó? · tendencias y brechas por formato y actividad</div>
          </div>
        </div>
        <div style={{background:"#fff",padding:"14px 16px",borderRadius:"0 0 14px 14px",overflow:"visible"}}>

          {/* ── TENDENCIA SEMANAL — label fijo arriba, barras abajo, nunca se tapan ── */}
          <div style={{marginBottom:16}}>
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"baseline",marginBottom:10}}>
              <div style={{fontSize:10,fontWeight:700,color:"#5a7a9a",letterSpacing:".04em"}}>TENDENCIA SEMANAL</div>
              <div style={{fontSize:9,color:"#b2bec3"}}>pts obtenidos ÷ pts posibles · hover para desglose</div>
            </div>
            {/* ROW 1: % + flechas — completamente separado del área de barras */}
            <div style={{display:"flex",gap:5,marginBottom:4}}>
              {tendenciaViewer.map((v,i)=>{
                const isFut=semanasDelMes[i].days.every(d=>dStr(vYear,vMonth,d)>hoy);
                const trend=i>0&&tendenciaViewer[i-1]&&v?(v.pct>tendenciaViewer[i-1].pct?"↑":v.pct<tendenciaViewer[i-1].pct?"↓":"→"):null;
                return(
                  <div key={i} style={{flex:1,textAlign:"center"}}>
                    <div style={{fontSize:11,fontWeight:800,color:trend==="↑"?"#00b894":trend==="↓"?"#d63031":"#8aaabb",lineHeight:1,marginBottom:2}}>{trend||" "}</div>
                    <div style={{fontSize:13,fontWeight:800,color:isFut?"#b2bec3":v?sc(v.pct):"#b2bec3",lineHeight:1}}>{v&&!isFut?v.pct+"%":"—"}</div>
                  </div>
                );
              })}
            </div>
            {/* ROW 2: barras — altura fija, crecen hacia arriba */}
            <div style={{display:"flex",gap:5}}>
              {tendenciaViewer.map((v,i)=>{
                const s=semanasDelMes[i];
                const isFut=s.days.every(d=>dStr(vYear,vMonth,d)>hoy);
                const maxV=Math.max(...tendenciaViewer.filter(x=>x).map(x=>x.pct),1);
                const barH=v?Math.max(8,Math.round((v.pct/maxV)*64)):0;
                const isRef=i===iSemRef;
                // Tooltip: desglose por actividad para esta semana
                const actTipV=actEfectV.map(({a,ob:aOb,mx:aMx,nC1,nC2act,total})=>{
                  // Calcular pts de esta actividad en esta semana específica
                  let sOb=0,sMx=0;
                  s.days.forEach(d=>{
                    const ds=dStr(vYear,vMonth,d);
                    if(ds>hoy||!(a.dias||[]).includes(getDow(ds))) return;
                    tiAct.forEach(ti=>{
                      if(isExc(ti.id,a.id,ds)) return;
                      sMx+=10;
                      const p=puntajeReg(getReg(ds,ti.id,a.id),getRangoActivo(a.id,ds));
                      if(p!==null) sOb+=p;
                    });
                  });
                  return sMx>0?{a,ob:sOb,mx:sMx,pct:Math.round((sOb/sMx)*100)}:null;
                }).filter(Boolean);
                return(
                  <div key={i} style={{flex:1,position:"relative"}}
                    onMouseEnter={e=>{const t=e.currentTarget.querySelector(".sem-tip-v");if(t)t.style.display="block";}}
                    onMouseLeave={e=>{const t=e.currentTarget.querySelector(".sem-tip-v");if(t)t.style.display="none";}}
                    onTouchStart={e=>{const t=e.currentTarget.querySelector(".sem-tip-v");if(t)t.style.display=t.style.display==="block"?"none":"block";}}>
                    <div style={{height:64,background:"#f0f4f8",borderRadius:6,display:"flex",alignItems:"flex-end",overflow:"hidden",border:isRef?"1.5px solid #0984e3":"none",cursor:(!isFut&&v)?'default':'default'}}>
                      {v&&!isFut&&<div style={{width:"100%",height:barH,background:isRef?"#0984e3":sc(v.pct),borderRadius:"4px 4px 0 0",transition:"height .4s"}}/>}
                      {isFut&&<div style={{width:"100%",height:"100%",display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",gap:1}}><IcoPending size={10} color={"#b2bec3"}/><span style={{fontSize:8,color:"#b2bec3",fontWeight:700}}>PEND.</span></div>}
                    </div>
                    <div style={{textAlign:"center",marginTop:4}}>
                      <div style={{fontSize:9,color:isRef?"#0984e3":"#8aaabb",fontWeight:isRef?700:400}}>{s.label}</div>
                      {v&&!isFut&&<div style={{fontSize:8,color:"#b2bec3"}}>{v.ob}/{v.mx}</div>}
                    </div>
                    {/* Tooltip desglose por actividad */}
                    {!isFut&&v&&actTipV.length>0&&(
                    <div className="sem-tip-v" style={{display:"none",position:"absolute",bottom:"calc(100% + 10px)",left:"50%",transform:"translateX(-50%)",background:"#1a2f4a",color:"#fff",fontSize:10,padding:"10px 13px",borderRadius:10,zIndex:50,whiteSpace:"nowrap",boxShadow:"0 6px 24px rgba(0,0,0,.35)",lineHeight:1.7,minWidth:190}}>
                      <div style={{fontWeight:800,fontSize:11,marginBottom:4,color:sc(v.pct)}}>{s.label} · {v.pct}% · {v.ob}/{v.mx}pts</div>
                      <div style={{borderBottom:"1px solid rgba(255,255,255,.15)",marginBottom:5,paddingBottom:3,fontSize:9,color:"rgba(255,255,255,.4)"}}>DESGLOSE POR ACTIVIDAD</div>
                      {actTipV.map(({a,ob:sOb,mx:sMx,pct:sPct})=>(
                        <div key={a.id} style={{display:"flex",alignItems:"center",gap:6,marginBottom:2}}>
                          <span>{a.e}</span>
                          <span style={{flex:1,fontSize:9,color:"rgba(255,255,255,.75)"}}>{a.n}</span>
                          <span style={{fontSize:9,color:"rgba(255,255,255,.5)"}}>{sOb}/{sMx}pts</span>
                          <span style={{fontWeight:800,color:sc(sPct),minWidth:28,textAlign:"right"}}>{sPct}%</span>
                        </div>
                      ))}
                      <div style={{position:"absolute",bottom:-5,left:"50%",transform:"translateX(-50%)",width:10,height:10,background:"#1a2f4a",rotate:"45deg",borderRadius:1}}/>
                    </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* ── POR FORMATO — igual al admin, con tooltip desglose ── */}
          <div style={{marginBottom:12}}>
            <div style={{fontSize:10,fontWeight:700,color:"#5a7a9a",letterSpacing:".04em",marginBottom:8}}>POR FORMATO</div>
            {fmtEfV.map(({fmt,pct})=>{
              const fc=FMT[fmt];
              const ftsV=tiAct.filter(ti=>ti.f===fmt);
              const ftsEvalV=ftsV.filter(ti=>actEfectV.some(({a})=>semanasDelMes.some(s=>s.days.some(d=>!isExc(ti.id,a.id,dStr(vYear,vMonth,d))))));
              // Desglose por actividad para el tooltip
              const actRowsV=actEfectV.filter(({a})=>a.activa).map(({a,ob,mx,pct:aPct})=>({a,ob,mx,pct:aPct}));
              return(
              <div key={fmt} style={{position:"relative",marginBottom:8}}
                onMouseEnter={e=>{const t=e.currentTarget.querySelector(".fmt-tip-v");if(t)t.style.display="block";}}
                onMouseLeave={e=>{const t=e.currentTarget.querySelector(".fmt-tip-v");if(t)t.style.display="none";}}
                onTouchStart={e=>{const t=e.currentTarget.querySelector(".fmt-tip-v");if(t)t.style.display=t.style.display==="block"?"none":"block";}}>
                <div style={{display:"flex",alignItems:"center",gap:8,cursor:"default"}}>
                  <span style={{flexShrink:0,display:"flex",alignItems:"center"}}><FmtIcon fmt={fmt} size={16}/></span>
                  <span style={{fontSize:11,fontWeight:700,color:"#1a2f4a",minWidth:80,flexShrink:0}}>{fmt}</span>
                  <div style={{flex:1,background:"#f0f4f8",borderRadius:20,height:7,overflow:"hidden"}}>
                    <div style={{height:"100%",width:(pct||0)+"%",background:sc(pct||0),borderRadius:20,transition:"width .4s"}}/>
                  </div>
                  <span style={{fontSize:12,fontWeight:800,color:pct?sc(pct):"#888",minWidth:34,textAlign:"right"}}>{pct!==null?pct+"%":"—"}</span>
                </div>
                {/* Tooltip formato */}
                <div className="fmt-tip-v" style={{display:"none",position:"absolute",top:"calc(100% + 6px)",left:0,right:0,background:"#1a2f4a",color:"#fff",fontSize:10,padding:"12px 14px",borderRadius:10,zIndex:50,boxShadow:"0 8px 28px rgba(0,0,0,.35)",lineHeight:1.7}}>
                  <div style={{fontWeight:800,fontSize:11,marginBottom:4,color:sc(pct||0)}}>{fmt} · {pct!==null?pct+"%":"sin datos"}</div>
                  <div style={{color:"rgba(255,255,255,.7)",marginBottom:6}}>{ftsV.length} tiendas · {ftsEvalV.length} con días evaluables</div>
                  {actRowsV.length>0&&(
                    <div style={{borderTop:"1px solid rgba(255,255,255,.15)",paddingTop:6}}>
                      <div style={{fontSize:9,color:"rgba(255,255,255,.4)",fontWeight:700,letterSpacing:".04em",marginBottom:4}}>DESGLOSE POR ACTIVIDAD (global)</div>
                      {actRowsV.map(({a,ob,mx,pct:aPct})=>(
                        <div key={a.id} style={{display:"flex",alignItems:"center",gap:6,marginBottom:2}}>
                          <span style={{fontSize:10}}>{a.e}</span>
                          <span style={{flex:1,fontSize:9,color:"rgba(255,255,255,.75)"}}>{a.n}</span>
                          <span style={{fontSize:9,color:"rgba(255,255,255,.5)"}}>{ob}/{mx}pts</span>
                          <span style={{fontWeight:800,color:sc(aPct),minWidth:28,textAlign:"right"}}>{aPct}%</span>
                        </div>
                      ))}
                    </div>
                  )}
                  <div style={{marginTop:6,paddingTop:4,borderTop:"1px solid rgba(255,255,255,.1)",fontSize:9,color:"rgba(255,255,255,.35)"}}>Denominador excluye N/A por día</div>
                  <div style={{position:"absolute",top:-5,left:20,width:10,height:10,background:"#1a2f4a",transform:"rotate(45deg)",borderRadius:1}}/>
                </div>
              </div>
              );
            })}
          </div>
          {/* Efectividad por actividad — con desglose pts obtenidos/posibles */}
          <div style={{borderTop:"1px solid #f0f4f8",paddingTop:12}}>
            <div style={{fontSize:10,fontWeight:700,color:"#5a7a9a",letterSpacing:".04em",marginBottom:2}}>EFECTIVIDAD POR ACTIVIDAD</div>
            <div style={{fontSize:9,color:"#b2bec3",marginBottom:8}}>pts obtenidos / pts posibles · barra: ORO / Tardíos / Sin registrar · pasa el mouse para ver el desglose</div>
            {(()=>{
              let totOb=0, totMx=0;
              const rows = actEfectV.map(({a,pct,nC1,nC2act,total,ob,mx})=>{
                totOb+=ob; totMx+=mx;
                const nSin=Math.max(0,total-nC1-nC2act);
                const rango=getRangoActivo(a.id,hoy);
                return(
                <div key={a.id} style={{position:"relative",marginBottom:6}}
                  onMouseEnter={e=>{const t=e.currentTarget.querySelector(".act-tip-v");if(t)t.style.display="block";}}
                  onMouseLeave={e=>{const t=e.currentTarget.querySelector(".act-tip-v");if(t)t.style.display="none";}}
                  onTouchStart={e=>{const t=e.currentTarget.querySelector(".act-tip-v");if(t)t.style.display=t.style.display==="block"?"none":"block";}}>
                  <div style={{display:"flex",alignItems:"center",gap:6,cursor:"default"}}>
                    <span style={{fontSize:11,flexShrink:0}}>{a.e}</span>
                    <span style={{fontSize:10,color:"#1a2f4a",flexShrink:0,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap",minWidth:90,maxWidth:110}}>{a.n}</span>
                    <div style={{flex:1,height:7,borderRadius:4,overflow:"hidden",display:"flex",minWidth:40}}>
                      {nC1>0&&<div style={{width:(nC1/total*100)+"%",background:"#BA7517"}}/>}
                      {nC2act>0&&<div style={{width:(nC2act/total*100)+"%",background:"#378ADD"}}/>}
                      {nSin>0&&<div style={{width:(nSin/total*100)+"%",background:"#F09595"}}/>}
                    </div>
                    <span style={{fontSize:9,color:"#8aaabb",flexShrink:0,whiteSpace:"nowrap"}}>{ob}/{mx}pts</span>
                    <span style={{fontSize:11,fontWeight:800,color:sc(pct),minWidth:30,textAlign:"right",flexShrink:0}}>{pct}%</span>
                  </div>
                  {/* Tooltip custom dark */}
                  <div className="act-tip-v" style={{display:"none",position:"absolute",bottom:"calc(100% + 6px)",left:0,right:0,background:"#1a2f4a",color:"#fff",fontSize:10,padding:"10px 13px",borderRadius:10,zIndex:40,boxShadow:"0 6px 24px rgba(0,0,0,.35)",lineHeight:1.7}}>
                    <div style={{fontWeight:800,fontSize:11,marginBottom:4,color:sc(pct)}}>{a.e} {a.n} · {pct}%</div>
                    <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:"2px 12px",marginBottom:6}}>
                      <div style={{color:"rgba(255,255,255,.7)"}}>Pts obtenidos</div><div style={{fontWeight:700}}>{ob} pts</div>
                      <div style={{color:"rgba(255,255,255,.7)"}}>Pts posibles</div><div style={{fontWeight:700}}>{mx} pts</div>
                      <div style={{color:"rgba(255,255,255,.7)"}}>ORO ≤{rango.c100||"09:00"}</div><div style={{fontWeight:700,color:"#f6a623"}}>{nC1} evidencias</div>
                      <div style={{color:"rgba(255,255,255,.7)"}}>Tardíos</div><div style={{fontWeight:700,color:"#74b9ff"}}>{nC2act} evidencias</div>
                      <div style={{color:"rgba(255,255,255,.7)"}}>Sin registrar</div><div style={{fontWeight:700,color:"#F09595"}}>{nSin} tiendas</div>
                    </div>
                    <div style={{height:4,borderRadius:2,overflow:"hidden",display:"flex",marginTop:4}}>
                      {nC1>0&&<div style={{width:(nC1/total*100)+"%",background:"#BA7517"}}/>}
                      {nC2act>0&&<div style={{width:(nC2act/total*100)+"%",background:"#378ADD"}}/>}
                      {nSin>0&&<div style={{width:(nSin/total*100)+"%",background:"#F09595"}}/>}
                    </div>
                    <div style={{position:"absolute",bottom:-5,left:16,width:10,height:10,background:"#1a2f4a",transform:"rotate(45deg)",borderRadius:1}}/>
                  </div>
                </div>
                );
              });
              return(
                <>
                  {rows}
                  {actEfectV.length===0&&<div style={{fontSize:11,color:"#b2bec3",padding:"6px 0"}}>Sin actividades con registros en este período.</div>}
                  {/* FILA TOTAL */}
                  {actEfectV.length>0&&(
                    <div style={{display:"flex",alignItems:"center",gap:6,marginTop:8,paddingTop:8,borderTop:"1px dashed #e2e8f0"}}>
                      <span style={{fontSize:10,flexShrink:0}}>📊</span>
                      <span style={{fontSize:10,color:"#1a2f4a",fontWeight:800,flexShrink:0,minWidth:90}}>TOTAL PERÍODO</span>
                      <div style={{flex:1,background:"#f0f4f8",borderRadius:4,height:7,overflow:"hidden"}}>
                        <div style={{height:"100%",width:(totMx>0?Math.round((totOb/totMx)*100):0)+"%",background:sc(totMx>0?Math.round((totOb/totMx)*100):0),borderRadius:4,transition:"width .4s"}}/>
                      </div>
                      <span style={{fontSize:9,color:"#5a7a9a",flexShrink:0,whiteSpace:"nowrap",fontWeight:700}}>{totOb}/{totMx}pts</span>
                      <span style={{fontSize:12,fontWeight:800,color:sc(totMx>0?Math.round((totOb/totMx)*100):0),minWidth:30,textAlign:"right",flexShrink:0}}>{totMx>0?Math.round((totOb/totMx)*100):"—"}%</span>
                    </div>
                  )}
                </>
              );
            })()}
          </div>
          {/* KPIs de distribución horaria */}
          <div style={{borderTop:"1px solid #f0f4f8",paddingTop:12,marginTop:4}}>
            <div style={{fontSize:10,fontWeight:700,color:"#5a7a9a",letterSpacing:".04em",marginBottom:8}}>DISTRIBUCIÓN DE HORARIO DE ENVÍO</div>
            <div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:6}}>
              {[
                {icon:"🥇",label:"ORO",    n:nOroV,   c:"#BA7517",bg:"#fff8ec",desc:`≤${rangoMostrar}`},
                {icon:"🥈",label:"Tardíos",n:nC2V,    c:"#185FA5",bg:"#e8f4fd",desc:"llegaron tarde"},
                {icon:"🔴",label:"Fuera",  n:nFueraV, c:"#dc2626",bg:"#fff1f2",desc:"sin puntaje"},
                {icon:"⬜",label:"Sin reg.",n:nSinRegV,c:"#6b7280",bg:"#f4f6f8",desc:"no registraron"},
              ].map((f,i)=>(
                <div key={i} style={{background:f.bg,borderRadius:8,padding:"8px 10px",textAlign:"center"}}>
                  <div style={{fontSize:13}}>{f.icon}</div>
                  <div style={{fontSize:16,fontWeight:800,color:f.c,lineHeight:1.1}}>{nTotalEsperadoV>0?Math.round(f.n/totalContadoV*100)+"%":"—"}</div>
                  <div style={{fontSize:8,color:f.c,fontWeight:700,marginTop:2}}>{f.label}</div>
                  <div style={{fontSize:8,color:"#8aaabb"}}>{f.desc}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* ══ REGISTROS POR FRANJA HORARIA — viewer, período visible ══ */}
      {(()=>{
        const semsVisV = selWeek!==null ? [semanasDelMes[selWeek]] : semanasDelMes;
        const hoyFV = hoy;
        const periodoFHV = selWeek!==null
          ? semanasDelMes[selWeek]?.label
          : `${MESES[vMonth]} ${vYear}`;

        // Para cada tienda, determinar su MEJOR franja en el período visible
        const mejorPorTiendaV = new Map();
        const totalDispV = new Set();
        const conRegV = new Set();

        tiAct.forEach(ti=>{
          semsVisV.forEach(s=>{
            s.days.forEach(day=>{
              const ds=dStr(vYear,vMonth,day);
              if(ds>hoyFV) return;
              const dw=getDow(ds);
              acts.filter(a=>a.activa&&(a.dias||[]).includes(dw)&&!isExc(ti.id,a.id,ds)&&actsConRegistroIds.has(a.id)).forEach(a=>{
                totalDispV.add(ti.id);
                const reg=getReg(ds,ti.id,a.id);
                if(!reg?.evidencias?.length||reg.anulado) return;
                conRegV.add(ti.id);
                const AR=getRangoActivo(a.id,ds);
                const m=toMin(primerEnvio(reg.evidencias));
                const fv=m<=toMin(AR.c100)?10:m<=toMin(AR.c80)?8:m<=toMin(AR.c60)?6:0;
                if(fv>(mejorPorTiendaV.get(ti.id)??-1)) mejorPorTiendaV.set(ti.id,fv);
              });
            });
          });
        });

        const ndV=totalDispV.size||1;
        const nrV=conRegV.size;
        const nOroV2=[...mejorPorTiendaV.values()].filter(v=>v===10).length;
        const nPlatV=[...mejorPorTiendaV.values()].filter(v=>v===8).length;
        const nBronV=[...mejorPorTiendaV.values()].filter(v=>v===6).length;
        const nFuerV=[...mejorPorTiendaV.values()].filter(v=>v===0).length;
        const nSinV=totalDispV.size-conRegV.size;

        if(totalDispV.size===0) return null;

        // Por formato
        const fmtFHV=["Mayorista","Supermayorista","Market"].map(fmt=>{
          const tsFmt=tiAct.filter(ti=>ti.f===fmt);
          const fD=new Set(),fR=new Set(),fM=new Map();
          tsFmt.forEach(ti=>{
            semsVisV.forEach(s=>{
              s.days.forEach(day=>{
                const ds=dStr(vYear,vMonth,day);
                if(ds>hoyFV) return;
                const dw=getDow(ds);
                acts.filter(a=>a.activa&&(a.dias||[]).includes(dw)&&!isExc(ti.id,a.id,ds)&&actsConRegistroIds.has(a.id)).forEach(a=>{
                  fD.add(ti.id);
                  const reg=getReg(ds,ti.id,a.id);
                  if(!reg?.evidencias?.length||reg.anulado) return;
                  fR.add(ti.id);
                  const AR=getRangoActivo(a.id,ds);
                  const m=toMin(primerEnvio(reg.evidencias));
                  const fv=m<=toMin(AR.c100)?10:m<=toMin(AR.c80)?8:m<=toMin(AR.c60)?6:0;
                  if(fv>(fM.get(ti.id)??-1)) fM.set(ti.id,fv);
                });
              });
            });
          });
          const nd=fD.size,nr=fR.size;
          const fo=[...fM.values()].filter(v=>v===10).length;
          const fp=[...fM.values()].filter(v=>v===8).length;
          const ff=[...fM.values()].filter(v=>v===0).length;
          const fNR=nd-nr;
          const fcfg=FMT[fmt];
          const fmtIcon=<FmtIcon fmt={fmt} size={16}/>;
          return{fmt,fmtIcon,fcfg,nd,nr,fo,fp,ff,fNR};
        }).filter(f=>f.nd>0);

        return(
        <div style={{borderRadius:14,overflow:"hidden",marginBottom:10,border:"1px solid #e2e8f0",boxShadow:"0 2px 8px rgba(0,0,0,.04)"}}>
          <div style={{background:"#0d4f6e",padding:"10px 16px",display:"flex",alignItems:"center",gap:10}}>
            <div style={{width:28,height:28,borderRadius:8,background:"rgba(255,255,255,.15)",display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}><IcoTiendaLocal size={16} color="rgba(255,255,255,.85)"/></div>
            <div style={{flex:1}}>
              <div style={{fontWeight:800,fontSize:12,color:"#fff",letterSpacing:".06em"}}>REGISTROS POR FRANJA · {periodoFHV.toUpperCase()}</div>
              <div style={{fontSize:10,color:"rgba(255,255,255,.5)",marginTop:1}}>Tiendas únicas · mejor franja registrada en el período</div>
            </div>
            <div style={{textAlign:"right"}}>
              <div style={{fontSize:20,fontWeight:800,color:sc(Math.round(nrV/ndV*100))}}>{nrV}<span style={{fontSize:11,color:"rgba(255,255,255,.5)",fontWeight:400}}>/{ndV}</span></div>
              <div style={{fontSize:9,color:"rgba(255,255,255,.4)"}}>tiendas registradas</div>
            </div>
          </div>
          <div style={{background:"#fff",padding:"14px 16px"}}>
            {/* KPI cards */}
            <div style={{display:"grid",gridTemplateColumns:"repeat(4,minmax(0,1fr))",gap:8,marginBottom:10}}>
              {[
                {icon:"🥇",c:"#f6a623",bg:"#fff8ec",n:nOroV2,lbl:"En ORO",      sub:"antes corte 1"},
                {icon:"🥈",c:"#185FA5",bg:"#e8f4fd",n:nPlatV, lbl:"Tardíos",    sub:"entre cortes"},
                {icon:"🔴",c:"#dc2626",bg:"#fff1f2",n:nFuerV, lbl:"Fuera rango",sub:"después corte 2"},
                {icon:"⬜",c:"#6b7280",bg:"#f4f6f8",n:nSinV,  lbl:"Sin registrar",sub:"no enviaron"},
              ].map((f,i)=>(
                <div key={i} style={{background:f.bg,borderRadius:10,padding:"10px",textAlign:"center",border:`1px solid ${f.c}22`}}>
                  <div style={{fontSize:16,marginBottom:2}}>{f.icon}</div>
                  <div style={{fontSize:20,fontWeight:800,color:f.c,lineHeight:1}}>{ndV>0?Math.round(f.n/ndV*100)+"%":"—"}</div>
                  <div style={{fontSize:9,fontWeight:700,color:f.c,marginTop:3}}>{f.lbl}</div>
                  <div style={{fontSize:8,color:f.c,opacity:.7}}>{f.sub}</div>
                  <div style={{fontSize:10,color:f.c,fontWeight:700,marginTop:3}}>{f.n} tiendas</div>
                </div>
              ))}
            </div>
            {/* Barra apilada */}
            <div style={{height:12,borderRadius:6,overflow:"hidden",display:"flex",marginBottom:10}}>
              {nOroV2>0&&<div style={{width:(nOroV2/ndV*100)+"%",background:"#f6a623"}}/>}
              {nPlatV>0&&<div style={{width:(nPlatV/ndV*100)+"%",background:"#185FA5"}}/>}
              {nBronV>0&&<div style={{width:(nBronV/ndV*100)+"%",background:"#a29bfe"}}/>}
              {nFuerV>0&&<div style={{width:(nFuerV/ndV*100)+"%",background:"#dc2626"}}/>}
              {nSinV>0&&<div style={{flex:1,background:"#e2e8f0"}}/>}
            </div>
            {/* Por formato */}
            {fmtFHV.map(({fmt,fmtIcon,fcfg,nd,nr,fo,fp,ff,fNR})=>(
              <div key={fmt} style={{display:"flex",alignItems:"center",gap:8,padding:"7px 10px",background:"#f8fafc",borderRadius:9,marginBottom:6,border:`1px solid ${fcfg.c}22`}}>
                <span style={{flexShrink:0,display:"flex",alignItems:"center"}}>{fmtIcon}</span>
                <div style={{minWidth:88,flexShrink:0}}>
                  <div style={{fontSize:11,fontWeight:700,color:fcfg.c}}>{fmt}</div>
                  <div style={{fontSize:9,color:"#8aaabb"}}>{nd} total · {nr} reg.</div>
                </div>
                <div style={{flex:1}}>
                  <div style={{height:7,borderRadius:4,overflow:"hidden",display:"flex"}}>
                    {fo>0&&<div style={{width:(fo/nd*100)+"%",background:"#f6a623"}}/>}
                    {fp>0&&<div style={{width:(fp/nd*100)+"%",background:"#185FA5"}}/>}
                    {ff>0&&<div style={{width:(ff/nd*100)+"%",background:"#dc2626"}}/>}
                    {fNR>0&&<div style={{flex:1,background:"#e2e8f0"}}/>}
                  </div>
                </div>
                <div style={{display:"flex",gap:3,flexShrink:0,flexWrap:"wrap",justifyContent:"flex-end"}}>
                  {fo>0&&<span style={{fontSize:9,fontWeight:700,color:"#854F0B",background:"#fff8ec",padding:"1px 6px",borderRadius:8}}>🥇 {fo}</span>}
                  {fp>0&&<span style={{fontSize:9,fontWeight:700,color:"#185FA5",background:"#e8f4fd",padding:"1px 6px",borderRadius:8}}>🥈 {fp}</span>}
                  {ff>0&&<span style={{fontSize:9,fontWeight:700,color:"#dc2626",background:"#fff1f2",padding:"1px 6px",borderRadius:8}}>🔴 {ff}</span>}
                  {fNR>0&&<span style={{fontSize:9,fontWeight:700,color:"#6b7280",background:"#f4f6f8",padding:"1px 6px",borderRadius:8}}>⬜ {fNR}</span>}
                </div>
              </div>
            ))}
            <div style={{fontSize:9,color:"#b2bec3",marginTop:6,textAlign:"right"}}>
              Cada tienda contada una vez · mejor franja del período · excluye N/A
            </div>
          </div>
        </div>
        );
      })()}

      {/* ══════════════════════════════════════════════════════
          NIVEL 3 — OPERATIVO  ·  Jefes / Supervisores
          Pregunta: ¿Cómo avanzamos? ¿Quién requiere acción inmediata?
      ══════════════════════════════════════════════════════ */}
      <div style={{borderRadius:14,overflow:"hidden",border:"1px solid #e2e8f0",boxShadow:"0 2px 8px rgba(0,0,0,.04)"}}>
        <div style={{background:"#855F00",padding:"10px 16px",display:"flex",alignItems:"center",gap:10}}>
          <div style={{width:28,height:28,borderRadius:8,background:"rgba(255,255,255,.15)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:14,flexShrink:0}}>⚙️</div>
          <div>
            <div style={{fontWeight:800,fontSize:12,color:"#fff",letterSpacing:".06em"}}>OPERATIVO · JEFES / SUPERVISORES</div>
            <div style={{fontSize:10,color:"rgba(255,255,255,.5)",marginTop:1}}>¿Cómo avanzamos hoy? · tiendas y acciones inmediatas</div>
          </div>
        </div>
        <div style={{background:"#fff",padding:"14px 16px"}}>
          {(enRiesgo.length===0&&enAtención.length===0)?(
            <div style={{textAlign:"center",padding:"20px 0",color:"#00b894"}}>
              <div style={{fontSize:28,marginBottom:6}}>✅</div>
              <div style={{fontWeight:700,fontSize:13}}>Sin alertas operativas</div>
              <div style={{fontSize:11,color:"#8aaabb",marginTop:3}}>Todas las tiendas evaluadas están sobre el umbral mínimo en este período</div>
            </div>
          ):(
            <>
              {enRiesgo.length>0&&(
                <div style={{marginBottom:10}}>
                  <div style={{fontSize:10,fontWeight:700,color:"#dc2626",letterSpacing:".06em",marginBottom:6}}>🚨 CRÍTICAS — ACCIÓN INMEDIATA ({enRiesgo.length})</div>
                  <div style={{display:"flex",gap:6,flexWrap:"wrap"}}>
                    {enRiesgo.map(({ti,pct})=>(
                      <div key={ti.id} style={{flex:"1 1 140px",padding:"8px 10px",background:"#FCEBEB",borderRadius:8,border:"1px solid #F7C1C1"}}>
                        <div style={{fontSize:11,fontWeight:800,color:"#791F1F",marginBottom:2}}>Vega {ti.n}</div>
                        <div style={{fontSize:16,fontWeight:800,color:"#dc2626"}}>{pct}%</div>
                        <div style={{fontSize:9,color:"#A32D2D"}}>{ti.f} · eficiencia crítica</div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              {enAtención.length>0&&(
                <div style={{borderTop:enRiesgo.length>0?"1px solid #f0f4f8":"none",paddingTop:enRiesgo.length>0?10:0}}>
                  <div style={{fontSize:10,fontWeight:700,color:"#854F0B",letterSpacing:".06em",marginBottom:6}}>⚠️ EN VIGILANCIA — MONITOREAR ({enAtención.length})</div>
                  <div style={{display:"flex",gap:6,flexWrap:"wrap"}}>
                    {enAtención.map(({ti,pct})=>(
                      <div key={ti.id} style={{flex:"1 1 140px",padding:"8px 10px",background:"#FAEEDA",borderRadius:8,border:"1px solid #FAC775"}}>
                        <div style={{fontSize:11,fontWeight:800,color:"#633806",marginBottom:2}}>Vega {ti.n}</div>
                        <div style={{fontSize:16,fontWeight:800,color:"#854F0B"}}>{pct}%</div>
                        <div style={{fontSize:9,color:"#854F0B"}}>{ti.f} · vigilancia</div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              {sinDatosCount>0&&(
                <div style={{marginTop:10,padding:"6px 10px",background:"#f4f6f8",borderRadius:8,fontSize:10,color:"#6b7280"}}>
                  ℹ️ {sinDatosCount} tienda{sinDatosCount>1?"s":""} excluidas del análisis por N/A en todos sus días evaluables.
                </div>
              )}
            </>
          )}
        </div>
      </div>


      {/* ══ REGISTROS INGRESADOS POR HORARIO — viewer (agregados) ══ */}
      {(() => {
        // Agregados de registros por horario para el visor.
        // Usamos los valores de viewerData (nOroV, nC2V, nFueraV, nSinRegV, totalContadoV, rangoMostrar)
        // para calcular porcentajes y mostrar KPI similares a la vista de administrador.
        const total = totalContadoV || 1;
        const pctOro   = Math.round((nOroV || 0) / total * 100);
        const pctPlata = Math.round((nC2V || 0) / total * 100);
        const pctFuera = Math.round((nFueraV || 0) / total * 100);
        const pctSin   = Math.round((nSinRegV || 0) / total * 100);
        // Calcular cortes aproximados: rangoMostrar es el c100 más frecuente; sumamos 30 y 60 min para c80 y c60.
        const [rh, rm] = (rangoMostrar || "08:30").split(":").map(Number);
        const addMins = (mins) => {
          const t = rh * 60 + rm + mins;
          const hh = String(Math.floor(t / 60)).padStart(2, "0");
          const mm = String(t % 60).padStart(2, "0");
          return `${hh}:${mm}`;
        };
        const c2 = addMins(30);
        const c3 = addMins(60);
        // Etiquetas de período y actividad para el pie del card
        const periodoText = selWeek !== null ? (semanasDelMes[selWeek]?.label || "") : `${MESES[vMonth]} ${vYear}`;
        const actLabel = dashAct === "Todas" ? "Todas las actividades" : (acts.find(a => a.id === dashAct)?.n || "");
        return (
        <div style={{...S.card, padding:0, marginBottom:14, overflow:"hidden"}}>
          <div style={{padding:"12px 16px", borderBottom:"1px solid #e2e8f0"}}>
            <div style={{fontWeight:800, fontSize:13, color:"#1a2f4a", marginBottom:10}}>📊 REGISTROS INGRESADOS POR HORARIO</div>
            {/* Navegación de meses */}
            <div style={{display:"flex", gap:8, alignItems:"center", marginBottom:10}}>
              <button onClick={() => navMes(-1)} style={{padding:"6px 12px", borderRadius:8, border:"1px solid #c8d8e8", background:"#fff", cursor:"pointer", fontWeight:700, fontSize:13}}>←</button>
              <span style={{flex:1, textAlign:"center", fontWeight:800, fontSize:13, color:"#1a2f4a"}}>{MESES[vMonth].toUpperCase()} {vYear}</span>
              <button onClick={() => navMes(1)} style={{padding:"6px 12px", borderRadius:8, border:"1px solid #c8d8e8", background:"#fff", cursor:"pointer", fontWeight:700, fontSize:13}}>→</button>
            </div>
            {/* Navegación por semanas */}
            <div style={{display:"flex", gap:5, marginBottom:10}}>
              <button onClick={() => setSelWeek(null)} style={{flex:1, padding:"5px", borderRadius:7, border:`1.5px solid ${selWeek === null ? "#00b5b4" : "#e2e8f0"}`, background: selWeek === null ? "#e0fafa" : "#fff", color: selWeek === null ? "#00b5b4" : "#5a7a9a", cursor:"pointer", fontSize:10, fontWeight:700}}>Mes</button>
              {semanasDelMes.map((s, i) => (
                <button key={i} onClick={() => setSelWeek(i)} style={{flex:1, padding:"5px 3px", borderRadius:7, border:`1.5px solid ${selWeek === i ? "#6c5ce7" : "#e2e8f0"}`, background: selWeek === i ? "#f0edff" : "#fff", color: selWeek === i ? "#6c5ce7" : "#5a7a9a", cursor:"pointer", fontSize:10, fontWeight:700, lineHeight:1.3}}>
                  {s.label}
                  <div style={{fontSize:7, fontWeight:400, color: selWeek===i?"#6c5ce7":"#8aaabb", marginTop:1, whiteSpace:"nowrap"}}>Del {String(s.start).padStart(2,"0")} al {String(s.end).padStart(2,"0")}</div>
                </button>
              ))}
            </div>
            <div style={{display:"grid", gridTemplateColumns:"1fr 1fr", gap:8}}>
              <div>
                <div style={{fontSize:9, color:"#8aaabb", fontWeight:700, marginBottom:3}}>ACTIVIDAD</div>
                <select value={dashAct} onChange={e => setDashAct(e.target.value)} style={{width:"100%", padding:"7px 10px", borderRadius:8, border:"1px solid #c8d8e8", background:"#f8fafc", color:"#1a2f4a", fontSize:12, outline:"none"}}>
                  <option value="Todas">Todas las actividades</option>
                  {acts.filter(a => a.activa).map(a => <option key={a.id} value={a.id}>{a.e} {a.n}</option>)}
                </select>
              </div>
              <div>
                <div style={{fontSize:9, color:"#8aaabb", fontWeight:700, marginBottom:3}}>FORMATO</div>
                <select value={dashFmt} onChange={e => setDashFmt(e.target.value)} style={{width:"100%", padding:"7px 10px", borderRadius:8, border:"1px solid #c8d8e8", background:"#f8fafc", color:"#1a2f4a", fontSize:12, outline:"none"}}>
                  <option value="Todas">Todos los formatos</option>
                  {[
                    "Mayorista",
                    "Supermayorista",
                    "Market"
                  ].map(f => <option key={f} value={f}>{f}</option>)}
                </select>
              </div>
            </div>
          </div>
          <div style={{padding:"14px 16px"}}>
            {/* Cuatro KPIs */}
            <div style={{display:"grid", gridTemplateColumns:"repeat(4,1fr)", gap:10, marginBottom:12}}>
              {[
                {pct:pctOro,   lbl:"Registros en ORO",  sub:`antes de ${rangoMostrar}`,   barC:"#00b894", c:"#f6a623"},
                {pct:pctPlata, lbl:"Tardíos rescatados", sub:`${rangoMostrar} a ${c2}`, barC:"#74b9ff", c:"#0984e3"},
                {pct:pctFuera, lbl:"Fuera de rango",     sub:`${c2} a ${c3}`,           barC:"#d63031", c:"#d63031"},
                {pct:pctSin,   lbl:"Sin registrar",      sub:"dentro del rango",       barC:"#b2bec3", c:"#b2bec3"},
              ].map((k, i) => (
                <div key={i} style={{border:"1px solid #e2e8f0", borderRadius:12, padding:"14px 12px", background:"#fff"}}>
                  <div style={{fontSize:30, fontWeight:800, color:k.c, lineHeight:1}}>{k.pct}%</div>
                  <div style={{fontSize:11, color:"#5a7a9a", marginTop:4, fontWeight:600}}>{k.lbl}</div>
                  <div style={{fontSize:10, color:"#8aaabb", marginTop:2}}>{k.sub}</div>
                  <div style={{height:4, borderRadius:2, background:"#f0f4f8", marginTop:8}}>
                    <div style={{height:"100%", width: k.pct + "%", background:k.barC, borderRadius:2, transition:"width .4s"}} />
                  </div>
                </div>
              ))}
            </div>
            {/* Barra apilada global */}
            <div style={{height:10, borderRadius:5, overflow:"hidden", display:"flex", marginBottom:14}}>
              {nOroV>0   && <div style={{width:(nOroV/total*100) + "%", background:"#00b894"}} />}
              {nC2V>0   && <div style={{width:(nC2V/total*100) + "%", background:"#74b9ff"}} />}
              {nFueraV>0 && <div style={{width:(nFueraV/total*100) + "%", background:"#d63031"}} />}
              {nSinRegV>0&& <div style={{flex:1, background:"#e2e8f0"}} />}
            </div>
            <div style={{fontSize:9, color:"#b2bec3", marginTop:4, textAlign:"right"}}>
              {periodoText}{dashAct !== "Todas" ? ` · ${actLabel}` : ""} · excluye N/A
            </div>
          </div>
        </div>
        );
      })()}

      {/* ══ NIVEL 3 — OPERATIVO · JEFES / SUPERVISORES ══════════════════
            ¿Cómo avanzamos? — ranking simplificado para visor
        ══════════════════════════════════════════════════════════════ */}
        <div style={{borderRadius:12,overflow:"visible",marginBottom:10,border:"1px solid #e2e8f0"}}>
          <div style={{background:"#855F00",padding:"9px 14px",display:"flex",alignItems:"center",gap:8,borderRadius:"12px 12px 0 0"}}>
            <span style={{fontSize:14}}>⚙️</span>
            <div>
              <div style={{fontWeight:800,fontSize:11,color:"#fff",letterSpacing:".06em"}}>OPERATIVO · JEFES / SUPERVISORES</div>
              <div style={{fontSize:9,color:"rgba(255,255,255,.45)"}}>¿Cómo avanzamos? · ranking tiendas y acciones inmediatas</div>
            </div>
          </div>
          <div style={{background:"#fff",padding:"12px 14px",borderRadius:"0 0 12px 12px"}}>
            {/* ranking top/bottom - visor */}
            <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(200px,1fr))",gap:10}}>
              {[
                {title:"🏅 Top 5",sub:"Mayor eficiencia de implementación",list:top5,icon:(i)=>i===0?"🥇":i===1?"🥈":i===2?"🥉":i===3?"🏅":"⭐"},
                {title:"⚠️ Bottom 5",sub:"Menor eficiencia — requieren atención",list:bot5,icon:()=>"🔴"},
              ].map(panel=>(
                <div key={panel.title} style={{border:"1px solid #e2e8f0",borderRadius:10,padding:"12px"}}>
                  <div style={{fontWeight:800,fontSize:11,color:"#1a2f4a"}}>{panel.title}</div>
                  <div style={{fontSize:9,color:"#8aaabb",marginBottom:10}}>{panel.sub}</div>
                  {panel.list.length>0 ? panel.list.map((s,i)=>{
                    const det={obtenidos:s.obtenidos,maximos:s.maximos};
                    return(
                      <div key={s.t.id} style={{position:"relative",marginBottom:8}}
                        onMouseEnter={e=>e.currentTarget.querySelector(".rank-tip").style.display="block"}
                        onMouseLeave={e=>e.currentTarget.querySelector(".rank-tip").style.display="none"}
                        onTouchStart={e=>{const tipEl=e.currentTarget.querySelector(".rank-tip");tipEl.style.display=tipEl.style.display==="block"?"none":"block";}}>
                        <div style={{display:"flex",alignItems:"center",gap:6,cursor:"default"}}>
                          <span style={{fontSize:12,width:16}}>{panel.icon(i)}</span>
                          <div style={{flex:1,overflow:"hidden"}}>
                            <div style={{fontSize:11,color:"#1a2f4a",overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap",fontWeight:600}}>Vega {s.t.n}</div>
                            <div style={{height:3,background:"#f0f4f8",borderRadius:2,marginTop:2,overflow:"hidden"}}>
                              <div style={{width:(s.score||0)+"%",height:"100%",background:sc(s.score),borderRadius:2}}/>
                            </div>
                          </div>
                          <div style={{textAlign:"right",minWidth:44}}>
                            <div style={{fontSize:12,fontWeight:800,color:sc(s.score)}}>{s.score!==null?s.score+"%":"—"}</div>
                            <div style={{fontSize:8,color:"#8aaabb"}}>{det.obtenidos}/{det.maximos}pts</div>
                          </div>
                        </div>
                        {(()=>{
                          const tevs=Object.values(regs).filter(r=>r.tiendaId===s.t.id && !r.anulado).flatMap(r=>r.evidencias||[]);
                          const fOro   = tevs.filter(e=>toMin(e.hora)<=toMin("08:00")).length;
                          const fPlata = tevs.filter(e=>toMin(e.hora)>toMin("08:00") && toMin(e.hora)<=toMin("09:00")).length;
                          const fBronce= tevs.filter(e=>toMin(e.hora)>toMin("09:00") && toMin(e.hora)<=toMin("10:00")).length;
                          const fFuera = tevs.filter(e=>toMin(e.hora)>toMin("10:00")).length;
                          const tTotal = tevs.length || 1;
                          return (
                            <div className="rank-tip" style={{display:"none",position:"absolute",bottom:"calc(100% + 6px)",left:0,right:0,background:"#1a2f4a",color:"#fff",fontSize:10,padding:"10px 12px",borderRadius:10,zIndex:30,lineHeight:1.6,boxShadow:"0 4px 16px rgba(0,0,0,.3)"}}>
                              <div style={{fontWeight:800,marginBottom:4,fontSize:11}}>Vega {s.t.n} · {s.score!==null?s.score+"%":"—"}</div>
                              <div style={{marginBottom:6,color:"#8aaabb"}}>{det.obtenidos}/{det.maximos} pts · {s.t.f}</div>
                              <div style={{borderTop:"1px solid rgba(255,255,255,.15)",paddingTop:6,marginTop:2}}>
                                <div style={{fontSize:9,color:"#8aaabb",marginBottom:4,fontWeight:700}}>DISTRIBUCIÓN DE HORARIO</div>
                                <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(200px,1fr))",gap:4}}>
                                  <div style={{display:"flex",alignItems:"center",gap:4}}><span>🥇</span><span>ORO: {fOro} ({Math.round(fOro/tTotal*100)}%)</span></div>
                                  <div style={{display:"flex",alignItems:"center",gap:4}}><span>🥈</span><span>PLATA: {fPlata} ({Math.round(fPlata/tTotal*100)}%)</span></div>
                                  <div style={{display:"flex",alignItems:"center",gap:4}}><span>🥉</span><span>BRONCE: {fBronce} ({Math.round(fBronce/tTotal*100)}%)</span></div>
                                  <div style={{display:"flex",alignItems:"center",gap:4,color:fFuera>0?'#f17e7e':'inherit'}}><span>🔴</span><span>FUERA: {fFuera} ({Math.round(fFuera/tTotal*100)}%)</span></div>
                                </div>
                                <div style={{height:6,borderRadius:3,overflow:"hidden",display:"flex",marginTop:8}}>
                                  {fOro>0 && <div style={{width:(fOro/tTotal*100)+'%',background:'#f6a623'}}/>}
                                  {fPlata>0&& <div style={{width:(fPlata/tTotal*100)+'%',background:'#74b9ff'}}/>}
                                  {fBronce>0&& <div style={{width:(fBronce/tTotal*100)+'%',background:'#a29bfe'}}/>}
                                  {fFuera>0&& <div style={{width:(fFuera/tTotal*100)+'%',background:'#d63031'}}/>}
                                </div>
                              </div>
                              <div style={{position:'absolute',bottom:-5,left:20,width:10,height:10,background:'#1a2f4a',transform:'rotate(45deg)',borderRadius:1}}/>
                            </div>
                          );
                        })()}
                      </div>
                    );
                  }): <div style={{fontSize:10,color:"#8aaabb"}}>Sin datos suficientes</div>}
                </div>
              ))}
            </div>
          </div>
        </div>

      </div>
    );
  };

  // ── Navegación visual escalable por módulos
  // modulo: 0=Inicio, 1=Tiendas, 2=Usuarios, 3=Configuración
  // tab dentro de Inicio: 0/1/2=Actividades, 4/5/6=Auditoría
  const HOME_MAIN_TABS = [
    {id:"actividades",label:"Evidencias",defaultTab:isViewer?1:0,roles:["admin","auditor","viewer"]},
    {id:"auditoria", label:"Auditoría",  defaultTab:4,roles:["admin","auditor"]},
    {id:"diseno",    label:"Diseño",     defaultTab:7,roles:["admin","coordinador","ejecutor"]},
  ].filter(m=>m.roles.includes(role||""));

  const SUB_EVIDENCIAS = isViewer
    ? [{i:1,label:"Reporte"},{i:2,label:"Dashboard"}]
    : [{i:0,label:"Registro"},{i:1,label:"Reporte"},{i:2,label:"Dashboard"}];

  const SUB_AUDITORIA = [
    {i:4,label:"Registro"},
    {i:5,label:"Reporte"},
    {i:6,label:"Dashboard"},
  ];

  const homeMainActive = tab>=7 ? "diseno" : tab>=4 ? "auditoria" : "actividades";
  const SUB_DISENO = [
    {i:7, label:"Nueva ODT"},
    {i:8, label:"Reporte"},
    {i:9, label:"Dashboard"},
  ];
  const homeSubTabs = homeMainActive==="auditoria" ? SUB_AUDITORIA : homeMainActive==="diseno" ? SUB_DISENO : SUB_EVIDENCIAS;

  // Sidebar menu items
  const SIDEBAR_ITEMS = [
    {id:"inicio",  label:"Inicio",        icon:<IcoInicio/>,  mod:0, tab:isViewer?1:0},
    ...(isAdmin?[{id:"tiendas",label:"Tiendas",icon:<IcoTiendas/>,mod:1,tab:3,cfgTab:2}]:[]),
    ...(isAdmin?[{id:"usuarios",label:"Usuarios",icon:<IcoUsuarios/>,mod:2,tab:3,cfgTab:0}]:[]),
    ...(isAdmin?[{id:"config",label:"Configuración",icon:<IcoConfig/>,mod:3,tab:3,cfgTab:1}]:[]),
  ];
  const sidebarActive = SIDEBAR_ITEMS.find(it=>it.mod===modulo)?.id||SIDEBAR_ITEMS[0]?.id;

  const excComentario = excModal?._comentario??excModal?.comentarioActual??"";
  const excApplyAll = excModal?._applyAll??false;
  const excSemActiva = excModal ? semanasDelMes.find(s=>s.days.some(d=>dStr(vYear,vMonth,d)===fecha)) : null;
  const excFechasPreview = excSemActiva ? excSemActiva.days.map(d=>dStr(vYear,vMonth,d)) : [fecha];

  return (
    <div className="et-app-root" style={{fontFamily:"'DM Sans',system-ui,sans-serif",display:"flex",height:"100vh",overflow:"hidden",background:"#F5F7FB"}}>
      <link href="https://fonts.googleapis.com/css2?family=DM+Sans:opsz,wght@9..40,400;9..40,600;9..40,700&family=Michroma&family=Syne:wght@700;800&display=swap" rel="stylesheet"/>
      <style>{`*{box-sizing:border-box;} .vr-table{overflow-x:auto;-webkit-overflow-scrolling:touch;} .vr-table table{min-width:480px;} @media(max-width:1024px) and (min-width:769px){.et-sidebar{width:72px!important;min-width:72px!important;} .et-sidebar-label{display:none!important;} .et-sidebar-logo-text{display:none!important;} .et-sidebar-nav-btn{justify-content:center!important;padding:14px 0!important;} .et-topbar-logo-spacer{display:none!important;} .et-topbar-desktop-spacer{display:block!important;} .et-main-content{padding-bottom:0!important;} .et-bottom-nav{display:none!important;}} @media(max-width:768px){.et-sidebar{display:none!important;} .et-main-content{padding-bottom:0!important;} .et-topbar{height:48px!important;padding:0 10px!important;} .et-bottom-nav{display:none!important;} .et-topbar-hamburger{display:flex!important;} .et-topbar-logo{display:flex!important;} .et-topbar-logo-spacer{display:block!important;} .et-topbar-desktop-spacer{display:none!important;} .et-topbar-estado{display:none!important;} .et-topbar-pdf{display:none!important;} .et-topbar-user-name{display:none!important;}} @media(pointer:coarse) and (max-width:768px){.et-sidebar{display:none!important;} .et-main-content{padding-bottom:0!important;} .et-topbar{height:48px!important;padding:0 10px!important;} .et-bottom-nav{display:none!important;} .et-topbar-hamburger{display:flex!important;} .et-topbar-logo{display:flex!important;} .et-topbar-logo-spacer{display:block!important;} .et-topbar-desktop-spacer{display:none!important;} .et-topbar-estado{display:none!important;} .et-topbar-pdf{display:none!important;} .et-topbar-user-name{display:none!important;}} button,select,input[type=date]{touch-action:manipulation;min-height:36px;} .vr-pill{white-space:nowrap;flex-shrink:0;} .et-nav-item:hover{background:#1E293B!important;} .et-bottom-nav{display:none;} .et-topbar-hamburger{display:none;} .et-topbar-logo{display:none;} .et-topbar-logo-spacer{display:none;} .et-app-root,.et-sidebar{height:100vh;height:100dvh;} .et-sidebar-label{} .et-sidebar-logo-text{} .et-sidebar-nav-btn{} @media(max-width:480px){.et-topbar-logo-sub{display:none!important;}}`}</style>

      {/* ══ SIDEBAR ══ */}
      <div className="et-sidebar" style={{width:240,minWidth:240,background:"#0F172A",display:"flex",flexDirection:"column",position:"sticky",top:0,zIndex:20,flexShrink:0,transition:"width .2s"}}>
        {/* Logo */}
        <div style={{padding:"20px 18px 10px",borderBottom:"1px solid rgba(255,255,255,.07)"}}>
          <div style={{display:"flex",alignItems:"flex-start",gap:10}}>
            <EstrategiaTradeIcon size={54} radius={14}/>
            <div className="et-sidebar-logo-text" style={{minWidth:0,paddingTop:2}}>
              <div style={{fontFamily:BRAND_FONT,fontWeight:700,fontSize:18,color:"#fff",lineHeight:1.12,letterSpacing:"-.03em",overflow:"visible",whiteSpace:"nowrap"}}>
                <span>Estrategia</span><span style={{color:"#e74c3c"}}>Trade</span>
              </div>
              <div style={{fontSize:11,color:"rgba(255,255,255,.62)",lineHeight:1.15,marginTop:2}}>Control de Implementaciones y Auditoria</div>
            </div>
          </div>
        </div>
        {/* Nav */}
        <nav style={{flex:1,padding:"12px 8px",overflowY:"auto"}}>
          {SIDEBAR_ITEMS.map(it=>(
            <button key={it.id} className="et-nav-item et-sidebar-nav-btn" onClick={()=>{setModulo(it.mod);setTab(it.tab);if(it.cfgTab!==undefined)setCfgTab(it.cfgTab);if(it.mod===3){setCfgMod(null);setDdOpen(false);}if(it.mod===2){setUsrTab(null);setDdOpen(false);}}}
              style={{width:"100%",display:"flex",alignItems:"center",gap:12,padding:"14px 18px",borderRadius:12,border:"none",cursor:"pointer",marginBottom:6,textAlign:"left",
                background:sidebarActive===it.id?"#2F6BFF":"transparent",
                color:sidebarActive===it.id?"#fff":"rgba(255,255,255,.6)",
                fontWeight:sidebarActive===it.id?700:500,fontSize:13,transition:"background .15s"}}>
              <span style={{flexShrink:0,display:"flex",alignItems:"center"}}>{it.icon}</span>
              <span className="et-sidebar-label">{it.label}</span>
            </button>
          ))}
        </nav>
        {/* Footer del sidebar */}
        <div className="et-sidebar-label" style={{padding:"12px 18px",borderTop:"1px solid rgba(255,255,255,.07)",fontSize:10,color:"rgba(255,255,255,.25)"}}>Versión 1.0.0</div>
      </div>

      {/* ══ MAIN AREA ══ */}
      <div style={{flex:1,display:"flex",flexDirection:"column",overflow:"hidden"}}>

        {/* ── TOPBAR ── */}
        <div className="et-topbar" style={{background:"#0F172A",padding:"0 20px",display:"flex",alignItems:"center",gap:12,height:56,flexShrink:0,borderBottom:"1px solid rgba(255,255,255,.06)"}}>
          {/* Hamburger — mobile only */}
          <button className="et-topbar-hamburger" onClick={()=>setDrawerOpen(true)}
            style={{display:"none",alignItems:"center",justifyContent:"center",background:"none",border:"none",color:"rgba(255,255,255,.8)",cursor:"pointer",padding:"4px",flexShrink:0}}>
            <IcoHamburger/>
          </button>
          <div className="et-topbar-logo" style={{alignItems:"center",gap:7,flexShrink:0,display:"none"}}>
            <EstrategiaTradeIcon size={28} radius={7}/>
            <div style={{minWidth:0}}>
              <div style={{fontFamily:BRAND_FONT,fontWeight:700,fontSize:12,color:"#fff",whiteSpace:"nowrap",lineHeight:1.1}}>
                <span>Estrategia</span><span style={{color:"#e74c3c"}}>Trade</span>
              </div>
              <div className="et-topbar-logo-sub" style={{fontSize:8,color:"rgba(255,255,255,.4)",whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis"}}>Control de Implementaciones y Auditoria</div>
            </div>
          </div>
          <div className="et-topbar-logo-spacer" style={{flex:1,display:"none"}} aria-hidden="true"/>
          <div className="et-topbar-desktop-spacer" style={{flex:1}} aria-hidden="true"/>
          <input type="date" value={fecha}
            onChange={e=>{const d=e.target.value;if(!isAdmin&&d!==todayStr())return;setFecha(d);setActSel(null);setPaso(1);setTSel(new Set());setRango(null);}}
            disabled={isViewer}
            style={{padding:"4px 8px",borderRadius:7,border:"1px solid rgba(255,255,255,.15)",background:"rgba(255,255,255,.08)",color:"#fff",fontSize:11,outline:"none"}}/>
          {isAuditor&&<button className="et-topbar-estado" onClick={()=>setShowStatusCard(true)} style={{padding:"4px 10px",borderRadius:7,border:"1px solid rgba(253,203,110,.4)",background:"rgba(253,203,110,.1)",color:"#fdcb6e",cursor:"pointer",fontSize:11,fontWeight:700,display:"flex",alignItems:"center",gap:5}}><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="4" width="20" height="14" rx="2"/><line x1="8" y1="21" x2="16" y2="21"/><line x1="12" y1="18" x2="12" y2="21"/><path d="M8.3 11.6a3.4 3.4 0 015.9-2.3"/><polyline points="14.5 7.4 14.5 9.3 12.6 9.3"/><path d="M15.7 9.4a3.4 3.4 0 01-5.9 2.3"/><polyline points="9.5 13.6 9.5 11.7 11.4 11.7"/></svg>Estado</button>}
          {isAdmin&&<button className="et-topbar-pdf" onClick={()=>exportPDFRef.current?.()} style={{padding:"4px 10px",borderRadius:7,border:"1px solid rgba(255,255,255,.15)",background:"rgba(255,255,255,.08)",color:"rgba(255,255,255,.7)",cursor:"pointer",fontSize:11,fontWeight:700}}><svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><path d="M14 2v6h6"/></svg> PDF</button>}
          <div style={{display:"flex",alignItems:"center",gap:8,padding:"4px 10px",borderRadius:20,background:"rgba(255,255,255,.08)"}}>
            <div style={{width:28,height:28,borderRadius:"50%",background:"#2F6BFF",display:"flex",alignItems:"center",justifyContent:"center",fontSize:11,fontWeight:800,color:"#fff"}}>{uName.split(" ").map(w=>w[0]).join("").slice(0,2).toUpperCase()}</div>
            <div className="et-topbar-user-name" style={{lineHeight:1.2}}>
              <div style={{fontSize:11,color:"#fff",fontWeight:600}}>{uName}</div>
              <div style={{fontSize:9,color:"rgba(255,255,255,.4)"}}>{isAdmin?"Administrador":isAuditor?"Auditor":"Visitante"}</div>
            </div>
            <button onClick={()=>{setRole(null);setUName("");}} title="Cerrar sesión" style={{background:"none",border:"none",color:"rgba(255,255,255,.4)",cursor:"pointer",fontSize:14,padding:2}}>↩</button>
          </div>
        </div>

        {/* ── INICIO: pestañas principales + subpestañas por módulo ── */}
        {modulo===0&&(()=>{
          const TAB_PILL_ACTIVE={padding:"10px 22px",borderRadius:50,border:"none",cursor:"pointer",background:"#6C6EF5",color:"#fff",fontWeight:700,fontSize:14,boxShadow:"0 2px 8px rgba(108,110,245,.3)",display:"flex",alignItems:"center",gap:8,transition:"all .15s"};
          const TAB_PILL_INACTIVE={padding:"10px 22px",borderRadius:50,border:"1.5px solid #D1D5DB",cursor:"pointer",background:"#fff",color:"#6B7280",fontWeight:600,fontSize:14,boxShadow:"none",display:"flex",alignItems:"center",gap:8,transition:"all .15s"};
          return(
          <div style={{background:"#F5F7FB",padding:"12px 20px 0",flexShrink:0}}>
            <div style={{display:"flex",gap:8,marginBottom:10}}>
              {HOME_MAIN_TABS.map(m=>{
                const active=homeMainActive===m.id;
                return(
                  <button key={m.id} onClick={()=>setTab(m.defaultTab)} style={active?TAB_PILL_ACTIVE:TAB_PILL_INACTIVE}>
                    {m.id==="actividades"?<IcoEvidenciasTab active={active}/>:m.id==="auditoria"?<IcoAuditoriaTab active={active}/>:
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={active?"#fff":"#6B7280"} strokeWidth="2" strokeLinecap="round"><path d="M12 20h9"/><path d="M16.5 3.5a2.121 2.121 0 013 3L7 19l-4 1 1-4L16.5 3.5z"/></svg>}
                    {m.label}
                  </button>
                );
              })}
            </div>
            <div style={{display:"flex",gap:6,background:"#fff",borderRadius:"10px 10px 0 0",padding:"10px 12px 0",borderTop:"1px solid #E2E8F0"}}>
              {homeSubTabs.map(tb=>(
                <button key={tb.i} onClick={()=>{setTab(tb.i); if(tb.i===5||tb.i===6)setCfgTab(3);}}
                  style={{padding:"9px 18px",border:"none",borderRadius:"8px 8px 0 0",
                    borderBottom:`3px solid ${tab===tb.i?"#5B6CF7":"transparent"}`,
                    background:tab===tb.i?"#EEEFFE":"transparent",
                    color:tab===tb.i?"#5B6CF7":"#64748B",
                    fontWeight:tab===tb.i?700:500,fontSize:13,cursor:"pointer",
                    display:"flex",alignItems:"center",gap:6,transition:"all .15s"}}>
                  {tb.i===0||tb.i===4||tb.i===7?<svg width="14" height="14" viewBox="0 0 14 14" fill="none"><rect x="1" y="1" width="12" height="12" rx="2" stroke="currentColor" strokeWidth="1.3" fill="none"/><line x1="3.5" y1="4.5" x2="10.5" y2="4.5" stroke="currentColor" strokeWidth="1.1" strokeLinecap="round"/><line x1="3.5" y1="7" x2="10.5" y2="7" stroke="currentColor" strokeWidth="1.1" strokeLinecap="round"/><line x1="3.5" y1="9.5" x2="7" y2="9.5" stroke="currentColor" strokeWidth="1.1" strokeLinecap="round"/></svg>
                  :tb.i===1||tb.i===5||tb.i===8?<svg width="14" height="14" viewBox="0 0 14 14" fill="none"><rect x="1" y="7.5" width="2.5" height="5.5" rx="1" fill="currentColor"/><rect x="5.5" y="4.5" width="2.5" height="8.5" rx="1" fill="currentColor"/><rect x="10" y="1.5" width="2.5" height="11.5" rx="1" fill="currentColor"/></svg>
                  :<svg width="14" height="14" viewBox="0 0 14 14" fill="none"><polyline points="1,10 4.5,6.5 7,8.5 13,2.5" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" fill="none"/></svg>}
                  {tb.label}
                </button>
              ))}
            </div>
          </div>
          );
        })()}

        {/* ── CONTENIDO ── */}
        <div className="et-main-content" style={{flex:1,overflowY:"auto",background:"#F5F7FB"}}>
      {modulo===0&&tab===0&&isAuditor&&renderRegistro()}
      {modulo===0&&tab===1&&renderReporte()}
      {modulo===0&&tab===2&&(isViewer?renderViewerDash():renderDashboard())}
      {modulo===1&&isAdmin&&renderConfig({hideTabs:true})}
      {modulo===2&&isAdmin&&renderUsuarios()}
      {modulo===3&&isAdmin&&renderConfig()}
      {modulo===0&&tab===5&&isAuditor&&(()=>{ if(cfgTab!==3) setTimeout(()=>setCfgTab(3),0); return renderConfig({hideTabs:true}); })()}
      {modulo===0&&tab===6&&isAuditor&&(()=>{ if(cfgTab!==3) setTimeout(()=>setCfgTab(3),0); return renderConfig({hideTabs:true}); })()}
      {/* FIX_DISENO_ODT_EVIDENCIAS_TRACKING_20260606 — Módulo Diseño/ODT tabs 7-9 */}
      {modulo===0&&(tab===7||tab===8||tab===9)&&(["admin","coordinador","solicitante","ejecutor","visor"].includes(role))&&(()=>{
        const TIPOS_BASE=[
          {id:"pop",label:"Material POP",hh:3,ico:<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#e17055" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><polygon points="10 8 16 12 10 16 10 8"/></svg>},
          {id:"cat",label:"Catálogo",hh:8,ico:<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#f6a623" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 19.5A2.5 2.5 0 016.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 014 19.5v-15A2.5 2.5 0 016.5 2z"/></svg>},
          {id:"digital",label:"Digital / RRSS",hh:2,ico:<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#6C6EF5" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="7" y="2" width="10" height="20" rx="2"/><path d="M12 18h.01"/></svg>},
          {id:"volante",label:"Volante / Afiche",hh:2.5,ico:<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#0984e3" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><path d="M14 2v6h6"/></svg>},
          {id:"precio",label:"Marcador Precio",hh:1.5,ico:<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#00b5b4" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="12" rx="2"/><path d="M8 20h8M12 16v4"/></svg>},
          {id:"gondola",label:"Góndola / Exhibidor",hh:4,ico:<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#607d9d" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 10h18"/><path d="M5 10l2-6h10l2 6"/><path d="M6 10v10M18 10v10M4 20h16"/></svg>},
          {id:"brief",label:"Creativo (brief)",hh:10,ico:<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#6C6EF5" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2l2.9 6.1 6.7.9-4.8 4.7 1.1 6.6L12 17.2 6.1 20.3l1.1-6.6L2.4 9l6.7-.9L12 2z"/></svg>},
        ];
        const TIPOS_TRABAJO=[...TIPOS_BASE,...odtTiposExtra];
        const ODT_PRIORIDADES=[
          {id:"Normal",label:"Normal",col:"#5a7a9a",bg:"#f0f4f8",ord:1},
          {id:"Media",label:"Media",col:"#f6a623",bg:"#fff8ec",ord:2},
          {id:"Alta",label:"Alta",col:"#e17055",bg:"#fff1e8",ord:3},
          {id:"Urgente",label:"Urgente",col:"#dc2626",bg:"#ffeae6",ord:4},
        ];
        const odtPriorityMeta=(v)=>ODT_PRIORIDADES.find(p=>normOdt(p.id)===normOdt(v)||normOdt(p.label)===normOdt(v))||ODT_PRIORIDADES[0];
        const odtTypeMeta=(v)=>{
          const raw=normOdt(v);
          if(raw.includes("precio")||raw.includes("marcador"))return{label:v||"Marcador Precio",col:"#00b5b4",bg:"#e8faf5",ico:"display"};
          if(raw.includes("volante")||raw.includes("afiche"))return{label:v||"Volante / Afiche",col:"#0984e3",bg:"#e8f4fd",ico:"poster"};
          if(raw.includes("catalog"))return{label:v||"Catálogo",col:"#00b5b4",bg:"#e8faf5",ico:"book"};
          if(raw.includes("digital")||raw.includes("rrss")||raw.includes("feed")||raw.includes("post"))return{label:v||"Digital / RRSS",col:"#6C6EF5",bg:"#EEEFFE",ico:"phone"};
          if(raw.includes("gondola")||raw.includes("exhibidor"))return{label:v||"Góndola / Exhibidor",col:"#1a2f4a",bg:"#f0f4f8",ico:"stand"};
          if(raw.includes("pop")||raw.includes("material"))return{label:v||"Material POP",col:"#e17055",bg:"#fff1e8",ico:"play"};
          return{label:v||"ODT",col:"#5a7a9a",bg:"#f8fafc",ico:"clipboard"};
        };
        const OdtSvgIcon=({kind="file",color="#0984e3",size=14})=>{
          const base={width:size,height:size,viewBox:"0 0 24 24",fill:"none",stroke:color,strokeWidth:"2",strokeLinecap:"round",strokeLinejoin:"round"};
          if(kind==="play")return <svg {...base}><circle cx="12" cy="12" r="10"/><polygon points="10 8 16 12 10 16 10 8"/></svg>;
          if(kind==="barcode")return <svg {...base}><rect x="3" y="5" width="18" height="14" rx="2"/><path d="M7 9v6M10 9v6M13 9v6M17 9v6"/></svg>;
          if(kind==="poster")return <svg {...base}><rect x="5" y="3" width="14" height="18" rx="2"/><path d="M8 8h8M8 12h8M8 16h5"/></svg>;
          if(kind==="clipboard")return <svg {...base}><path d="M9 3h6l1 2h3v16H5V5h3l1-2z"/><path d="M9 9h6M9 13h6M9 17h4"/></svg>;
          if(kind==="display")return <svg {...base}><rect x="4" y="5" width="16" height="11" rx="2"/><path d="M8 20h8M12 16v4M8 9h8M8 12h5"/></svg>;
          if(kind==="tag")return <svg {...base}><path d="M20.6 13.4l-7.2 7.2a2 2 0 01-2.8 0L3 13V3h10l7.6 7.6a2 2 0 010 2.8z"/><circle cx="8" cy="8" r="1.5"/></svg>;
          if(kind==="book")return <svg {...base}><path d="M4 19.5A2.5 2.5 0 016.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 014 19.5v-15A2.5 2.5 0 016.5 2z"/></svg>;
          if(kind==="phone")return <svg {...base}><rect x="7" y="2" width="10" height="20" rx="2"/><path d="M12 18h.01"/></svg>;
          if(kind==="stand")return <svg {...base}><path d="M3 10h18"/><path d="M5 10l2-6h10l2 6"/><path d="M6 10v10M18 10v10M4 20h16"/></svg>;
          if(kind==="clock")return <svg {...base}><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>;
          if(kind==="check")return <svg {...base}><circle cx="12" cy="12" r="10"/><polyline points="8.5 12.5 11 15 16 9"/></svg>;
          if(kind==="alert")return <svg {...base}><path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>;
          if(kind==="eye")return <svg {...base}><path d="M1 12s4-7 11-7 11 7 11 7-4 7-11 7-11-7-11-7z"/><circle cx="12" cy="12" r="3"/></svg>;
          if(kind==="pen")return <svg {...base}><path d="M12 20h9"/><path d="M16.5 3.5a2.1 2.1 0 013 3L7 19l-4 1 1-4 12.5-12.5z"/></svg>;
          return <svg {...base}><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><path d="M14 2v6h6"/></svg>;
        };
        const MATERIALES_TODOS=[...ODT_MATERIALES_BASE,...odtMaterialesExtra];
        const disenadores=usuarios.filter(u=>u.rol==="ejecutor"&&u.cargo==="Diseñador"&&u.activo!==false);
        const usuarioIniciales=(uName||"").split(" ").filter(Boolean).map(w=>w[0]).join("").slice(0,2).toUpperCase();
        const designerByInitial=(ini)=>disenadores.find(d=>(d.nombre||"").split(" ").filter(Boolean).map(w=>w[0]).join("").slice(0,2).toUpperCase()===ini);
        const ODT_BASE=[]; // sin ODT de prueba/mock; Firestore es el único origen
        const odtsMap=new Map();
        // Firestore es el único origen: no mocks, no localStorage, no merge por dispositivo
        [...(odtFirestore||[])].forEach(o=>{ if(o&&o.id) odtsMap.set(String(o.id),o); });
        const odtsTodos=[...odtsMap.values()];
        const isOdtFinalizada=(o)=>["entregado","finalizado","terminado"].includes(String(o?.estado||"").toLowerCase());
        const toLocalDate=(v)=>{if(!v)return null;const m=String(v).match(/^(\d{4})-(\d{2})-(\d{2})/);if(m)return new Date(Number(m[1]),Number(m[2])-1,Number(m[3]));const d=new Date(v);return isNaN(d)?null:new Date(d.getFullYear(),d.getMonth(),d.getDate());};
        const parseHora=(v,fb="18:30")=>{const raw=String(v||fb).trim().toLowerCase().replace(/\s+/g,"");let m=raw.match(/^(\d{1,2}):(\d{2})$/);if(m)return[Number(m[1]),Number(m[2])];m=raw.match(/^(\d{1,2}):(\d{2})(a\.m\.|am|p\.m\.|pm)$/);if(m){let h=Number(m[1]);const mm=Number(m[2]);const ap=m[3];if(ap.startsWith("p")&&h<12)h+=12;if(ap.startsWith("a")&&h===12)h=0;return[h,mm];}return parseHora(fb,"18:30");};
        const makeDateTime=(fecha,hora="00:00")=>{const d=toLocalDate(fecha);if(!d)return null;const [h,m]=parseHora(hora,"00:00");d.setHours(h,m,0,0);return d;};
        const ODT_WEEK_SCHEDULE={1:["08:30","18:30"],2:["08:30","18:30"],3:["08:30","18:30"],4:["08:30","18:30"],5:["08:30","18:30"]};const ODT_SAT_SCHEDULE={6:["08:30","11:30"]};const ODT_WORK_SCHEDULE={...ODT_WEEK_SCHEDULE,...ODT_SAT_SCHEDULE};
        const daySchedule=(d)=>ODT_WORK_SCHEDULE[d?.getDay?.()]||null;
        const isWorkDayOdt=(d)=>!!daySchedule(d);
        const countWorkDaysInclusive=(a,b)=>{const da=toLocalDate(a),db=toLocalDate(b);if(!da||!db)return 1;let ini=da<=db?da:db,fin=da<=db?db:da,c=0;for(let d=new Date(ini);d<=fin;d.setDate(d.getDate()+1)){if(isWorkDayOdt(d))c++;}return Math.max(1,c);};
        const countWorkDaysBefore=(start,ref)=>{const ini=toLocalDate(start),r=toLocalDate(ref);if(!ini||!r)return 0;let end=new Date(r);end.setDate(end.getDate()-1);if(end<ini)return 0;let c=0;for(let d=new Date(ini);d<=end;d.setDate(d.getDate()+1)){if(isWorkDayOdt(d))c++;}return c;};
        const businessMinutesBetween=(start,end)=>{if(!start||!end||isNaN(start)||isNaN(end))return 0;let a=start<=end?new Date(start):new Date(end),b=start<=end?new Date(end):new Date(start),mins=0;for(let d=new Date(a.getFullYear(),a.getMonth(),a.getDate());d<=b;d.setDate(d.getDate()+1)){const sch=daySchedule(d);if(!sch)continue;const [sh,sm]=parseHora(sch[0]),[eh,em]=parseHora(sch[1]);const ds=new Date(d);ds.setHours(sh,sm,0,0);const de=new Date(d);de.setHours(eh,em,0,0);const x=new Date(Math.max(ds.getTime(),a.getTime()));const y=new Date(Math.min(de.getTime(),b.getTime()));if(y>x)mins+=(y-x)/60000;}return Math.round(mins);};
        const formatHm=(mins)=>{const n=Math.max(0,Math.round(Math.abs(mins)));const h=Math.floor(n/60),m=n%60;if(h&&m)return`${h}h ${m}m`;if(h)return`${h}h`;return`${m}m`;};
        const MINS_DIA_LAB=600;/* L-V 08:30-18:30 */
        const formatDiasTb=(mins)=>{
          const n=Math.max(0,Math.round(Math.abs(mins)));
          if(n<=0)return"<1d";
          const dias=Math.floor(n/MINS_DIA_LAB);
          const resto=n%MINS_DIA_LAB;
          const horas=Math.floor(resto/60);
          const minutos=resto%60;
          if(dias>0&&horas>0&&minutos>0)return`${dias}d ${horas}h ${minutos}m`;
          if(dias>0&&horas>0)return`${dias}d ${horas}h`;
          if(dias>0)return`${dias}d`;
          if(horas>0&&minutos>0)return`${horas}h ${minutos}m`;
          if(horas>0)return`${horas}h`;
          return`${minutos}m`;
        };
        const toDueDateTime=(o)=>makeDateTime(o?.fechaEntrega||o?.entrega,o?.horaCorte||"18:30");
        const toFinishDateTime=(o)=>{const raw=o?.entregadoEn||o?.finalizadoEn||o?.fechaCierre||o?.updatedAt;if(raw){const d=new Date(raw);if(!isNaN(d))return d;const dd=toLocalDate(raw);if(dd)return dd;}return isOdtFinalizada(o)?toDueDateTime(o):null;};
        const diffDays=(a,b)=>{const da=toLocalDate(a),db=toLocalDate(b);if(!da||!db)return 0;return Math.round((da-db)/86400000);};
        const calcOdtPlan=(o)=>{
          /* ET_FIX_SCHEDULE_PROGRESO_CARGA_20260615
             PROGRESO (lectura resumida): Pendiente|En proceso|En corrección|Con retraso|Finalizado
             DÍAS TB (detalle): (Hoy)|(+Xd)|(-Xd)|(a tiempo)|(retraso Xh Xm)|(adelanto +Xd)
             HH estimadas y TIEMPO TRANSCURRIDO: solo L-V 08:30-18:30 (sin sábado)
             Sábado 08:30-11:30 solo aplica para correccion en businessMinutesBetween
          */
          const estado=String(o?.estado||"pendiente").toLowerCase();
          const entregada=isOdtFinalizada(o);
          const esCorrección=estado==="correccion";
          const now=new Date();
          const hoy=toLocalDate(todayStr());
          const fi=toLocalDate(o?.fechaInicio)||hoy;
          const fe=toLocalDate(o?.fechaEntrega||o?.entrega);
          const inicioDT=makeDateTime(o?.fechaInicio||todayStr(),"08:30")||new Date(now.getFullYear(),now.getMonth(),now.getDate(),8,30,0,0);
          const due=toDueDateTime(o);
          const fin=toFinishDateTime(o);
          const ref=entregada?(fin||due||now):now;
          // TIEMPO TRANSCURRIDO: solo L-V (sin sábado) para HH estimadas
          const weekDaySchedule=(d)=>ODT_WEEK_SCHEDULE[d?.getDay?.()]||null;
          const countWeekDays=(a,b)=>{const da=toLocalDate(a),db=toLocalDate(b);if(!da||!db)return 1;let c=0;for(let d=new Date(da<=db?da:db);d<=(da<=db?db:da);d.setDate(d.getDate()+1))if(weekDaySchedule(d))c++;return Math.max(1,c);};
          const weekMinsBetween=(s,e)=>{if(!s||!e||isNaN(s)||isNaN(e))return 0;let a=s<=e?new Date(s):new Date(e),b=s<=e?new Date(e):new Date(s),mins=0;for(let d=new Date(a.getFullYear(),a.getMonth(),a.getDate());d<=b;d.setDate(d.getDate()+1)){const sch=weekDaySchedule(d);if(!sch)continue;const[sh,sm]=parseHora(sch[0]),[eh,em]=parseHora(sch[1]);const ds=new Date(d);ds.setHours(sh,sm,0,0);const de=new Date(d);de.setHours(eh,em,0,0);const x=new Date(Math.max(ds.getTime(),a.getTime()));const y=new Date(Math.min(de.getTime(),b.getTime()));if(y>x)mins+=(y-x)/60000;}return Math.round(mins);};
          const totalLab=fi&&fe?countWeekDays(fi,fe):1;
          const transLab=entregada?Math.min(totalLab,countWeekDays(fi,ref)):Math.min(totalLab,(()=>{const da=toLocalDate(o?.fechaInicio||todayStr()),r=hoy;if(!da||!r)return 0;let end=new Date(r);end.setDate(end.getDate()-1);if(end<da)return 0;let c=0;for(let d=new Date(da);d<=end;d.setDate(d.getDate()+1))if(weekDaySchedule(d))c++;return c;})());
          const tiempo=`${transLab}/${totalLab} lab`;
          // HH usadas: L-V para todos; incluir sábado solo si está en corrección
          const schedFn=esCorrección?((d)=>ODT_WORK_SCHEDULE[d?.getDay?.()]||null):weekDaySchedule;
          const usedMins=(()=>{if(!inicioDT||isNaN(inicioDT))return 0;let a=inicioDT<=ref?new Date(inicioDT):new Date(ref),b=inicioDT<=ref?new Date(ref):new Date(inicioDT),mins=0;for(let d=new Date(a.getFullYear(),a.getMonth(),a.getDate());d<=b;d.setDate(d.getDate()+1)){const sch=schedFn(d);if(!sch)continue;const[sh,sm]=parseHora(sch[0]),[eh,em]=parseHora(sch[1]);const ds=new Date(d);ds.setHours(sh,sm,0,0);const de=new Date(d);de.setHours(eh,em,0,0);const x=new Date(Math.max(ds.getTime(),a.getTime()));const y=new Date(Math.min(de.getTime(),b.getTime()));if(y>x)mins+=(y-x)/60000;}return Math.round(mins);})();
          // DÍAS TB (detalle): formato (Hoy), (+2d), (-1d), (a tiempo), (retraso 4h 34m), (adelanto +1d)
          let diasTb="(<1d)";
          let progreso="Pendiente";
          let detalle="";
          if(entregada){
            const cierre=fin||due;
            if(due&&cierre){
              // BUGFIX: deltaMin se calculaba en minutos de calendario (24/7), por eso un
              // retraso de varios días terminaba mostrándose como "117h 43m" en vez de
              // convertirse a días. Ahora se usa businessMinutesBetween (L-V 08:30-18:30,
              // Sáb 08:30-11:30, domingos/feriados excluidos) y se formatea a Xd Xh Xm
              // usando la jornada laboral real como base de un "día".
              const deltaMin=businessMinutesBetween(due,cierre);
              const adelantoDias=Math.round((due.getTime()-cierre.getTime())/86400000);
              if(deltaMin>0){diasTb=`(retraso ${formatDiasTb(deltaMin)})`;detalle=`Entregado con retraso ${formatDiasTb(deltaMin)}`;}
              else if(adelantoDias>=1){diasTb=`(adelanto +${adelantoDias}d)`;detalle=`Entregado con adelanto +${adelantoDias}d`;}
              else{diasTb="(a tiempo)";detalle="Entregado a tiempo";}
            }else{diasTb="(a tiempo)";detalle="Entregado";}
            progreso="Finalizado";
          }else{
            const diasRestantes=fe?diffDays(fe,hoy):null;
            const vencida=diasRestantes!==null&&diasRestantes<0;
            // DÍAS TB según días a vencer
            if(!fe) diasTb="(<1d)";
            else if(diasRestantes>0) diasTb=`(+${diasRestantes}d)`;
            else if(diasRestantes===0) diasTb="(Hoy)";
            else diasTb=`(-${Math.abs(diasRestantes)}d)`;
            detalle=diasTb;
            // PROGRESO: correccion/observado gana sobre vencida; resto activo vencido → Con retraso
            if(["entregado","finalizado","terminado"].includes(estado)) progreso="Finalizado";
            else if(estado==="cancelado") progreso="Cancelado";
            else if(estado==="correccion"||estado==="observado") progreso="En corrección";
            else if(vencida) progreso="Con retraso";
            else if(["diseño","en_diseno","aprobacion","aprobado"].includes(estado)) progreso="En proceso";
            else progreso="Pendiente";
          }
          const avance=entregada?100:(Number(o?.avance)||0);
          const estadoUi=entregada?"entregado":(estado==="observado"?"observado":estado); return {...o,detalle,alerta:detalle,tiempo,dias:diasTb,avance,estadoUi,progreso};
        };
        const odtsBaseFiltradas=odtsTodos.filter(o=>o.activo!==false).map(calcOdtPlan);
        const KANBAN_ENTREGADOS_DIAS=7;
        const getOdtDeliveredDate=(o)=>{
          const raw=o?.entregadoEn||o?.fechaCierre||o?.finalizadoEn||o?.updatedAt||o?.fechaEntrega||o?.entrega;
          if(!raw)return null;
          const d=new Date(raw);
          if(!isNaN(d))return d;
          return toLocalDate(raw);
        };
        const isOdtDeliveredVisibleInKanban=(o)=>{
          if(!isOdtFinalizada(o))return true;
          const d=getOdtDeliveredDate(o);
          if(!d)return true;
          const age=(Date.now()-d.getTime())/86400000;
          return age<=KANBAN_ENTREGADOS_DIAS;
        };
        const normOdt=(v)=>String(v??"").trim().toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g,"");
        const normDigits=(v)=>String(v??"").replace(/\D/g,"");
        const sameAny=(a,b)=>a.filter(Boolean).some(x=>b.filter(Boolean).includes(x));
        const isAssignedOdt=(o)=>{
          const myIds=[uDni,loggedUser?.dni,loggedUser?.id,loggedUser?.userId,loggedUser?.credencial].map(normOdt);
          const myDigits=[uDni,loggedUser?.dni,loggedUser?.documento,loggedUser?.credencial].map(normDigits);
          const myNames=[uName,loggedUser?.nombre].map(normOdt);
          const myEmails=[loggedUser?.email,loggedUser?.correo].map(normOdt);
          const odtIds=[o?.disenadorId,o?.disenadorDni,o?.responsableDni,o?.responsableId].map(normOdt);
          const odtDigits=[o?.disenadorDni,o?.responsableDni,o?.disenadorId,o?.responsableId].map(normDigits);
          const odtNames=[o?.dnombre,o?.disenadorNombre,o?.responsableNombre].map(normOdt);
          const odtEmails=[o?.demail,o?.disenadorEmail,o?.responsableEmail].map(normOdt);
          return sameAny(myIds,odtIds)||sameAny(myDigits,odtDigits)||sameAny(myEmails,odtEmails)||sameAny(myNames,odtNames);
        };
        const isRequesterOdt=(o)=>{
          const myIds=[uDni,loggedUser?.dni,loggedUser?.id,loggedUser?.userId,loggedUser?.credencial].map(normOdt);
          const myDigits=[uDni,loggedUser?.dni,loggedUser?.documento,loggedUser?.credencial].map(normDigits);
          const myNames=[uName,loggedUser?.nombre].map(normOdt);
          const myEmails=[loggedUser?.email,loggedUser?.correo].map(normOdt);
          const reqIds=[o?.creadoPor,o?.solicitanteId,o?.solicitanteDni].map(normOdt);
          const reqDigits=[o?.solicitanteDni,o?.solicitanteId].map(normDigits);
          const reqNames=[o?.solicitanteNombre,o?.creadoPorNombre,o?.creadoPor].map(normOdt);
          const reqEmails=[o?.solicitanteEmail,o?.creadoPorEmail].map(normOdt);
          return sameAny(myIds,reqIds)||sameAny(myDigits,reqDigits)||sameAny(myEmails,reqEmails)||sameAny(myNames,reqNames);
        };
        const canViewOdt=(o)=>isDisenoAdmin||isDisenoCoordinator||isRequesterOdt(o)||isAssignedOdt(o)||(isDisenoViewer&&(isRequesterOdt(o)||isAssignedOdt(o)));
        const canCreateOdt=isDisenoAdmin||isDisenoCoordinator||isSolicitante;
        const canEditOdt=(o)=>isDisenoAdmin||isDisenoCoordinator||(isSolicitante&&isRequesterOdt(o));
        const canAssignOdt=(o)=>isDisenoAdmin||isDisenoCoordinator;
        const canDeleteOdt=(o)=>isDisenoAdmin;
        const canApproveOdt=(o)=>isDisenoAdmin||isDisenoCoordinator||(isSolicitante&&isRequesterOdt(o));
        const canDeliverOdt=(o)=>isDisenoAdmin||(isDisenoExecutor&&isAssignedOdt(o)&&String(o?.estado||"").toLowerCase()==="aprobado");
        const canNotifyOdt=(o)=>isDisenoAdmin||isDisenoCoordinator||(isSolicitante&&isRequesterOdt(o));
        const canUpdateOdtState=(o)=>isDisenoAdmin||isDisenoCoordinator||(isDisenoExecutor&&isAssignedOdt(o))||(isSolicitante&&isRequesterOdt(o));
        const odtStateOptions=(o)=>{
          /* ET_FIX_STATE_OPTIONS_PROGRESO_20260615 */
          const estado=String(o?.estado||"pendiente").toLowerCase();
          let allowed=[];
          if(isDisenoAdmin||isDisenoCoordinator) allowed=["pendiente","diseño","aprobacion","correccion","aprobado","entregado","cancelado"];
          else if(isDisenoExecutor&&isAssignedOdt(o)){
            allowed=["diseño"];
            if(["diseño","en_diseno","correccion"].includes(estado)) allowed.push("aprobacion");
            if(estado==="aprobado") allowed.push("entregado");
          }else if(isSolicitante&&isRequesterOdt(o)) allowed=["correccion","aprobado","cancelado"];
          if(estado&&!allowed.includes(estado)) allowed=[estado,...allowed];
          return [...new Set(allowed)];
        };
        const canManageOdt=canCreateOdt;
        const odtsRol=odtsBaseFiltradas.filter(canViewOdt);
        // ET_CIERRE_DISENO_ADMIN_DASH_ROLES_20260614 — Dashboard por rol/cargo sin cambiar secciones aprobadas.
        // Admin ve Dirección + Gerencia + Operativo. Visor con cargo gerencia ve Dirección/Gerencia.
        // Ejecutor/Solicitante ve Operativo con sus ODT filtradas.
        const normRoleCargo=(v)=>normTxt(v||"");
        const isGerenciaViewer=isDisenoViewer && ["gerencia","gerente","gerencial","direccion","director"].some(x=>normRoleCargo(uCargo).includes(x));
        const odtDashLevelsAllowed=(isDisenoAdmin||isDisenoCoordinator)
          ? ["direccion","gerencia","operativo"]
          : isGerenciaViewer
            ? ["direccion","gerencia"]
            : ["operativo"];
        const odtDashLevelActive=odtDashLevelsAllowed.includes(odtDashLvl)?odtDashLvl:odtDashLevelsAllowed[0];
        const odtDashLevelItems=[
          {id:"direccion",t:"Dirección",d:"Visión ejecutiva",ico:<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M4 19V5M8 19v-8M12 19V7M16 19v-5M20 19V9"/></svg>},
          {id:"gerencia",t:"Gerencia",d:"Análisis y causas",ico:<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="3" width="18" height="18" rx="2"/><path d="M8 17V9M12 17V6M16 17v-4"/></svg>},
          {id:"operativo",t:"Operativo",d:"Seguimiento diario",ico:<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/></svg>}
        ].filter(x=>odtDashLevelsAllowed.includes(x.id));
        const pillE=(e)=>{ if(e==="diseño"||e==="en_diseno")return{bg:"rgba(108,110,245,.12)",col:"#6C6EF5",txt:"En proceso"}; if(e==="retrasado")return{bg:"#ffeae6",col:"#dc2626",txt:"Retrasado"}; if(e==="observado")return{bg:"rgba(246,166,35,.12)",col:"#f6a623",txt:"Observado"}; if(e==="entregado"||e==="finalizado"||e==="terminado")return{bg:"rgba(0,184,148,.12)",col:"#00b894",txt:"Entregado"}; if(e==="aprobado")return{bg:"rgba(0,181,180,.12)",col:"#00b5b4",txt:"Aprobado"}; if(e==="aprobacion")return{bg:"rgba(9,132,227,.1)",col:"#0984e3",txt:"En aprobación"}; if(e==="correccion")return{bg:"rgba(246,166,35,.12)",col:"#f6a623",txt:"En corrección"}; if(e==="cancelado")return{bg:"#f1f5f9",col:"#64748b",txt:"Cancelado"}; return{bg:"rgba(246,166,35,.12)",col:"#f6a623",txt:"Pendiente"}; };
        const odtGanttItems=odtsRol.slice(0,8).map((o,idx)=>{
          const ini=toLocalDate(o.fechaInicio)||toLocalDate(todayStr());
          const fin=toLocalDate(o.fechaEntrega||o.entrega)||ini;
          const start=Math.max(1,Math.min(30,ini?ini.getDate():1));
          const end=Math.max(start,Math.min(30,fin?fin.getDate():start+1));
          const st=String(o.estado||o.stat||"pendiente").toLowerCase();
          const col=st==="retrasado"||((o.fechaEntrega||o.entrega)&&todayStr()>(o.fechaEntrega||o.entrega)&&!isOdtFinalizada(o))?"#dc2626":isOdtFinalizada(o)?"#00b894":st==="aprobacion"?"#0984e3":st==="correccion"?"#f6a623":"#6C6EF5";
          return {id:o.id,titulo:o.titulo||`ODT ${idx+1}`,start,end,color:col,label:pillE(st).txt};
        });
        const estadoLabel=(e)=>pillE(e).txt;
        const odtStateMeta=(e)=>{const raw=String(e||"pendiente").toLowerCase();const p=pillE(raw);let ico="clock";if(raw==="diseño"||raw==="en_diseno")ico="pen";else if(raw==="aprobacion")ico="eye";else if(raw==="correccion"||raw==="observado")ico="pen";else if(raw==="aprobado")ico="check";else if(raw==="entregado"||raw==="finalizado"||raw==="terminado")ico="check";else if(raw==="retrasado")ico="alert";else if(raw==="cancelado")ico="alert";return{...p,ico};};
        const renderPriorityChip=(value,compact=false)=>{const pr=odtPriorityMeta(value);return <span style={{display:"inline-flex",alignItems:"center",gap:5,padding:compact?"2px 7px":"3px 9px",borderRadius:20,fontSize:compact?9:10,fontWeight:800,color:pr.col,background:pr.bg,border:`1px solid ${pr.col}22`,whiteSpace:"nowrap"}}><OdtSvgIcon kind={pr.id==="Urgente"?"alert":"clock"} color={pr.col} size={compact?9:10}/>{pr.label}</span>;};
        const renderTypeChip=(value,compact=false)=>{const tm=odtTypeMeta(value);return <span style={{display:"inline-flex",alignItems:"center",gap:7,padding:compact?"3px 8px":"7px 11px",borderRadius:compact?20:11,border:`1px solid ${tm.col}26`,background:tm.bg,fontSize:compact?9:11,fontWeight:800,color:tm.col,whiteSpace:"nowrap"}}><span style={{width:compact?16:20,height:compact?16:20,borderRadius:6,background:"#fff",border:`1px solid ${tm.col}33`,display:"inline-grid",placeItems:"center",flexShrink:0}}><OdtSvgIcon kind={tm.ico} color={tm.col} size={compact?10:13}/></span>{tm.label}</span>;};
        const renderStateChip=(estado,compact=false)=>{const st=odtStateMeta(estado);return <span style={{display:"inline-flex",alignItems:"center",gap:5,padding:compact?"2px 7px":"3px 9px",borderRadius:20,fontSize:compact?9:10,fontWeight:800,color:st.col,background:st.bg,whiteSpace:"nowrap"}}><OdtSvgIcon kind={st.ico} color={st.col} size={compact?9:10}/>{st.txt}</span>;};
        const norm=v=>String(v||"").toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g,"");
        const odtsReporte=odtsRol.filter(o=>{
          const q=norm(odtReporteSearch);
          const matchQ=!q||norm(`${o.titulo} ${o.area} ${o.dnombre} ${o.tipoTrabajo} ${o.id}`).includes(q);
          const matchE=odtReporteEstado==="todos"||o.estado===odtReporteEstado;
          const matchT=odtReporteTipo==="todos"||o.tipoTrabajo===odtReporteTipo||o.tipo===odtReporteTipo;
          const matchR=odtReporteResp==="todos"||o.dnombre===odtReporteResp;
          return matchQ&&matchE&&matchT&&matchR;
        });
        const reportStats=[{v:odtsRol.length,l:"Total",c:"#6C6EF5"},{v:odtsRol.filter(o=>isOdtFinalizada(o)).length,l:"Entregadas",c:"#00b894"},{v:odtsRol.filter(o=>["diseño","en_diseno","aprobacion","correccion","aprobado"].includes(o.estado)).length,l:"En proceso",c:"#0984e3"},{v:odtsRol.filter(o=>o.estado==="pendiente").length,l:"Pendientes",c:"#f6a623"},{v:odtsRol.filter(o=>o.alerta?.startsWith("Con retraso")||o.estado==="retrasado").length,l:"Con retraso",c:"#dc2626"}];
        const odtIsOverdue=(o)=>Boolean(o?.estado==="retrasado"||(o?.alerta&&String(o.alerta).toLowerCase().includes("retraso"))||(o?.fechaEntrega&&todayStr()>o.fechaEntrega&&!isOdtFinalizada(o)));
        const odtIsCorrection=(o)=>String(o?.estado||"").toLowerCase()==="correccion"||String(o?.estadoPlanner||"").toLowerCase().includes("correcci");
        const odtHasObservation=(o)=>String(o?.motivoCorreccion||o?.observacionesCorreccion||o?.comentarioCorreccion||o?.correccionMotivo||"").trim().length>0;
        const correccionMotivosCount=odtsRol.reduce((acc,o)=>{
          const m=String(o?.motivoCorreccion||o?.motivoPredeterminadoCorreccion||o?.observacionesCorreccion||"").trim();
          if(m){acc[m]=(acc[m]||0)+1;}
          return acc;
        },{});
        const gerenciaCausas=[
          {label:"Entregas fuera de corte", count:odtsRol.filter(odtIsOverdue).length, color:"#dc2626"},
          ...Object.entries(correccionMotivosCount).map(([label,count])=>({label,count,color:"#f6a623"})),
          {label:"Observaciones registradas", count:odtsRol.filter(odtHasObservation).length, color:"#0984e3"},
          {label:"Brief pendiente de completar", count:odtsRol.filter(o=>!(o.objetivo||o.mensaje||o.mecanica||o.productos||o.restricciones||o.referencias)).length, color:"#6C6EF5"}
        ].filter(x=>x.count>0);
        const gerenciaDesignerMetrics=disenadores.map(d=>{const dniNorm=String(d.dni||d.documento||d.usuario||d.id||"").trim().toLowerCase();const ini=(d.nombre||"?").split(" ").filter(Boolean).map(w=>w[0]).slice(0,2).join("").toUpperCase();const items=odtsRol.filter(o=>String(o.disenadorId||o.responsableId||"").trim().toLowerCase()===String(d.id||"").trim().toLowerCase()||String(o.disenadorDni||o.responsableDni||"").trim().toLowerCase()===dniNorm||o.did===ini);const entregadas=items.filter(o=>isOdtFinalizada(o)).length;const retrasos=items.filter(odtIsOverdue).length;return {...d,ini,items,entregadas,retrasos,pct:items.length?Math.round(entregadas/items.length*100):0};});
        const inp={width:"100%",padding:"11px 14px",borderRadius:10,border:"1.5px solid #c8d8e8",background:"#f8fafc",color:"#1a2f4a",fontSize:13,fontFamily:"inherit",outline:"none"};
        const lbl={fontSize:11,fontWeight:700,color:"#8aaabb",letterSpacing:".05em",textTransform:"uppercase",display:"block",marginBottom:5};
        const SH={background:"#fff",borderRadius:14,border:"1px solid #e2e8f0",boxShadow:"0 2px 8px rgba(0,0,0,.05)"};
        const subT=tab===7?"nueva":tab===8?"reporte":"dashboard";
        const adminOnly=isDisenoAdmin;
        const selectedDesigner=disenadores.find(u=>u.id===odtForm.disenadorId);
        // ET_FIX_ODT_CAPACIDAD_DISENADOR_20260614: no asignar mas de 3 ODT activas por diseñador.
        const ODT_MAX_ACTIVAS_POR_DISENADOR=3;
        const odtFinalStates=["entregado","finalizado","terminado","cancelado"];
        const designerKey=(d)=>({
          ids:[d?.id,d?.userId,d?.dni,d?.documento,d?.usuario,d?.credencial].map(normOdt).filter(Boolean),
          digits:[d?.dni,d?.documento,d?.usuario,d?.credencial,d?.id].map(normDigits).filter(Boolean),
          names:[d?.nombre].map(normOdt).filter(Boolean),
          emails:[d?.email,d?.correo].map(normOdt).filter(Boolean)
        });
        const odtBelongsToDesigner=(o,d)=>{
          const dk=designerKey(d);
          const oid=[o?.disenadorId,o?.responsableId,o?.disenadorDni,o?.responsableDni].map(normOdt).filter(Boolean);
          const odig=[o?.disenadorDni,o?.responsableDni,o?.disenadorId,o?.responsableId].map(normDigits).filter(Boolean);
          const onam=[o?.dnombre,o?.disenadorNombre,o?.responsableNombre].map(normOdt).filter(Boolean);
          const oem=[o?.demail,o?.disenadorEmail,o?.responsableEmail].map(normOdt).filter(Boolean);
          return sameAny(dk.ids,oid)||sameAny(dk.digits,odig)||sameAny(dk.names,onam)||sameAny(dk.emails,oem);
        };
        /* Límite 3 ODT: solo cuenta las que están En Aprobación (pendiente revisión del solicitante) */
        const odtActivaParaCarga=(o)=>String(o?.estado||"").toLowerCase()==="aprobacion"&&o?.activo!==false;
        const odtCargaDesigner=(d,excludeId="")=>odtsBaseFiltradas.filter(o=>String(o?.id)!==String(excludeId)&&odtActivaParaCarga(o)&&odtBelongsToDesigner(o,d)).length;
        const designerBloqueadoAsignacion=(d,excludeId="")=>odtCargaDesigner(d,excludeId)>=ODT_MAX_ACTIVAS_POR_DISENADOR;
        const APP_URL="https://vega-evidencias.vercel.app/";
        const ODT_CORRECTION_REASONS=[
          "Brief incompleto",
          "Corrección de medidas/formato",
          "Actualizar producto o precio",
          "Ajuste de copy / mensaje",
          "Cambio de tono visual",
          "Falta de referencia o insumo",
          "Error de fecha / mecánica",
          "Otro ajuste solicitado"
        ];
        /* ET_FIX_MAIL_URL_BRACKETS_FALLBACK_20260614 */
        /* ET_FIX_MAIL_LINK_20260613_1615 */
        const escapeHtml=(v)=>String(v??"").replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/"/g,"&quot;");
        const buildOdtMail=(o,modo="asignacion")=>{
          const entregada=isOdtFinalizada(o)||modo==="entrega";
          const revision=modo==="revision"||modo==="aprobacion";
          const plan=calcOdtPlan(o||{});
          if(modo==="correccion"){
            return `Hola, la ODT requiere corrección antes de aprobarse.

Título: ${o.titulo||"—"}
Solicitante: ${o.solicitanteNombre||uName||"—"}
Responsable: ${o.dnombre||"—"}
Estatus: En corrección

Motivo / cambios solicitados:
${o.motivoCorreccion||"No especificado"}

Link de acceso directo a EstrategiaTrade:
<${APP_URL}>

Saludos.`;
          }
          if(revision){
            return `Hola, la ODT fue enviada a aprobación.

Título: ${o.titulo||"—"}
Responsable: ${o.dnombre||"—"}
Estatus: En aprobación
Fecha entrega: ${o.fechaEntrega||o.entrega||"—"}
Hora de corte: ${o.horaCorte||"—"}

Link de acceso directo a EstrategiaTrade:
<${APP_URL}>

Saludos.`;
          }
          if(entregada){
            return `Hola, la ODT ya fue entregada y queda lista para revisión.

Título: ${o.titulo||"—"}
Responsable: ${o.dnombre||"—"}
Estatus: Entregado
Detalle: ${plan.alerta||"Entregado"}
Fecha de entrega: ${o.fechaCierre||todayStr()}
Hora de entrega: ${new Date(o.entregadoEn||o.finalizadoEn||Date.now()).toLocaleTimeString("es-PE",{hour:"2-digit",minute:"2-digit"})}
Prioridad: ${o.prioridad||"Normal"}

Link de acceso directo a EstrategiaTrade:
<${APP_URL}>

Saludos.`;
          }
          return `Tienes una nueva orden de trabajo asignada:

Título: ${o.titulo||"—"}
Tipo de trabajo: ${o.tipoTrabajo||o.tipo||"—"}
Área: ${o.area||"—"}
Fecha entrega: ${o.fechaEntrega||o.entrega||"—"}
Hora de corte: ${o.horaCorte||"—"}
Prioridad: ${o.prioridad||"Normal"}

Objetivo y público:
${o.objetivo||"No especificado"}

Mensaje principal:
${o.mensaje||"No especificado"}

Materiales: ${(o.materiales||[]).join(", ")||"No especificado"}
Medidas: ${o.medidas||"No especificado"}
Tonalidad: ${o.tonalidad||"No especificado"}
Mecánica / dinámica: ${o.mecanica||"No especificado"}
Productos: ${o.productos||"No especificado"}
Restricciones: ${o.restricciones||"No especificado"}
Referencias: ${o.referencias||"No especificado"}

Link de acceso directo a EstrategiaTrade:
<${APP_URL}>

Saludos.`;
        };
        // Correo y WhatsApp: siempre abren en pestaña nueva para no sacar al usuario del dashboard.
        const openExternalBlank=(url)=>{try{const a=document.createElement("a");a.href=url;a.target="_blank";a.rel="noopener noreferrer";a.style.display="none";document.body.appendChild(a);a.click();setTimeout(()=>a.remove(),300);return true;}catch(e){showToast("No se pudo abrir la pestaña. Revisa el bloqueador de ventanas emergentes.");return false;}};
        const odtMailSubject=(o,modo="asignacion")=>(modo==="revision"||modo==="aprobacion")?`ODT enviada a aprobación: ${o.titulo||""}`:((isOdtFinalizada(o)||modo==="entrega")?`ODT entregada para revisión: ${o.titulo||""}`:`Nueva ODT asignada: ${o.titulo||""}`);
        const copyOdtMailText=async(o,modo="asignacion")=>{try{await navigator.clipboard.writeText(buildOdtMail(o,modo));showToast("Texto copiado. Pégalo en tu correo si Outlook no abrió.");return true;}catch(e){showToast("No se pudo abrir correo. Copia el texto desde el detalle de la ODT.");return false;}};
        const openOutlookOdt=(o,modo="asignacion")=>{const to=o.demail||"";const subject=odtMailSubject(o,modo);const body=buildOdtMail(o,modo);const outlookUrl="https://outlook.office365.com/mail/0/deeplink/compose?to="+encodeURIComponent(to||"")+"&subject="+encodeURIComponent(subject||"")+"&body="+encodeURIComponent(body||"");try{const w=window.open(outlookUrl,"_blank","noopener,noreferrer");if(!w||w.closed||typeof w.closed==="undefined"){copyOdtMailText(o,modo);}else{try{w.opener=null;}catch(_){}}}catch(e){copyOdtMailText(o,modo);}};
        const getOdtPhone=(u)=>{
          const seen=new Set();
          const scan=(obj,depth=0)=>{
            if(!obj||depth>2||seen.has(obj))return "";
            if(typeof obj==="object")seen.add(obj);
            const entries=typeof obj==="object"?Object.entries(obj):[["",obj]];
            for(const [k,v] of entries){
              const key=String(k||"").toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g,"");
              if(/cel|fono|phone|whats|movil|mobile|tel/.test(key)&&v!=null){
                const n=String(v).replace(/\D/g,"");
                if((n.length===9&&n.startsWith("9"))||(n.length===11&&n.startsWith("51"))||(n.length===12&&n.startsWith("519")))return n;
              }
            }
            for(const [,v] of entries){if(v&&typeof v==="object"){const r=scan(v,depth+1);if(r)return r;}}
            return "";
          };
          return scan(u);
        };
        const findOdtDesigner=(o)=>disenadores.find(d=>String(d.id||"")===String(o?.disenadorId||o?.responsableId||"")||String(d.dni||d.documento||d.usuario||"").replace(/\D/g,"")===String(o?.disenadorDni||o?.responsableDni||"").replace(/\D/g,"")||normOdt(d.email||d.correo||"")===normOdt(o?.demail||o?.disenadorEmail||o?.responsableEmail||"")||normOdt(d.nombre||"")===normOdt(o?.dnombre||o?.disenadorNombre||o?.responsableNombre||""));
        const getOdtPhoneFor=(o)=>getOdtPhone(o)||getOdtPhone(findOdtDesigner(o));
        const normalizePeruPhone=(v)=>{const n=String(v||"").replace(/\D/g,"");if(!n)return "";if(n.startsWith("51")&&n.length>=11)return n;if(n.length===9&&n.startsWith("9"))return "51"+n;return n;};
        const openWhatsOdt=(o,modo="asignacion")=>{const tel=normalizePeruPhone(getOdtPhoneFor(o));const text=buildOdtMail(o,modo);const url=tel?`https://wa.me/${tel}?text=${encodeURIComponent(text)}`:`https://wa.me/?text=${encodeURIComponent(text)}`;openExternalBlank(url);};
        const getOdtRequesterContact=(o)=>{const id=String(o?.solicitanteId||o?.creadoPor||"").trim().toLowerCase();const u=(usuarios||[]).find(x=>[x.id,x.dni,x.credencial,x.usuario,x.userId].some(v=>String(v||"").trim().toLowerCase()===id));return {nombre:o?.solicitanteNombre||u?.nombre||"Solicitante",email:o?.solicitanteEmail||u?.email||u?.correo||"",celular:o?.solicitanteWhatsapp||o?.solicitanteCelular||u?.whatsapp||u?.celular||u?.telefono||""};};
        const getOdtDesignerContact=(o)=>({nombre:o?.dnombre||"Diseñador",email:o?.demail||"",celular:o?.dcel||""});
        const maybeNotifyDesignerAfterCorrection=(o,nuevoEstado,updated)=>{
          const estado=String(nuevoEstado||"").toLowerCase();
          if(estado!=="correccion")return;
          if(!(isDisenoAdmin||isDisenoCoordinator||(isSolicitante&&isRequesterOdt(o))))return;
          const disenador=getOdtDesignerContact(o);
          setOdtCorrectionNote("");
          setOdtCorrectionNotifyModal({odt:{...o,...(updated||{}),demail:disenador.email,dcel:disenador.celular},disenador});
        };
        const maybeNotifyRequesterAfterState=(o,nuevoEstado,updated)=>{const estado=String(nuevoEstado||"").toLowerCase();if(!(isDisenoExecutor&&isAssignedOdt(o)))return;if(estado!=="aprobacion"&&estado!=="entregado"&&estado!=="finalizado"&&estado!=="terminado")return;const solicitante=getOdtRequesterContact(o);setOdtSolicitanteNotifyModal({odt:{...o,...(updated||{}),demail:solicitante.email,dcel:solicitante.celular},modo:estado==="aprobacion"?"revision":"entrega",solicitante});};
        const persistOdtCreated=(items)=>{setOdtCreated(items||[]);};
        const saveOdtToFirestore=async(odt)=>{try{const {id,...data}=odt;await setDoc(doc(db,"diseno_odts",id),{...data,creadoEn:data.creadoEn||new Date().toISOString(),updatedAt:new Date().toISOString()});}catch(e){console.warn("[ODT Firestore]",e?.message);}};
        const updateOdtInFirestore=async(id,patch)=>{try{await setDoc(doc(db,"diseno_odts",id),{...patch,updatedAt:new Date().toISOString()},{merge:true});}catch(e){console.warn("[ODT update Firestore]",e?.message);}};
        const updateOdtEstado=async(o,nuevoEstado,extra={})=>{const cierreExtra=(nuevoEstado==="entregado"||nuevoEstado==="finalizado"||nuevoEstado==="terminado")?{entregadoEn:extra.entregadoEn||new Date().toISOString(),fechaCierre:extra.fechaCierre||todayStr(),estadoPlanner:"Entregado"}:{};const avanceByEstado={pendiente:0,diseño:45,en_diseno:45,aprobacion:85,correccion:55,aprobado:92,entregado:100,finalizado:100,terminado:100,retrasado:o?.avance||0,cancelado:o?.avance||0};const estadoFirestore=(nuevoEstado==="finalizado"||nuevoEstado==="terminado")?"entregado":nuevoEstado;const updated=calcOdtPlan({...o,estado:estadoFirestore,avance:avanceByEstado[nuevoEstado]??o.avance,...extra,...cierreExtra});await updateOdtInFirestore(o.id,{estado:estadoFirestore,avance:updated.avance,...extra,...cierreExtra});setOdtFirestore(prev=>(prev||[]).map(x=>String(x.id)===String(o.id)?{...x,...updated}:x));setOdtHighlighted(o.id);setTimeout(()=>setOdtHighlighted(null),1800);maybeNotifyRequesterAfterState(o,estadoFirestore,updated);maybeNotifyDesignerAfterCorrection(o,estadoFirestore,updated);showToast("Estado actualizado: "+pillE(estadoFirestore).txt);return updated;};
        const deleteOdtInFirestore=async(id)=>{try{await deleteDoc(doc(db,"diseno_odts",id));}catch(e){console.warn("[ODT delete Firestore]",e?.message);}};
        const resetOdtFormAndGoDash=()=>{setOdtForm({titulo:"",area:"Trade Marketing",tipo:"",materiales:[],tonalidad:"",objetivo:"",mensaje:"",mecanica:"",productos:"",restricciones:"",referencias:"",medidas:"",disenadorId:"",prioridad:"Normal",fechaInicio:"",fechaEntrega:"",horaInicio:"",horaCorte:""});setOdtFormDraft({});setTab(9);};
        const createOdtAndNotify=()=>{if(!canCreateOdt){showToast("No tienes permiso para crear ODT");return;}const d=selectedDesigner||null;if(d&&designerBloqueadoAsignacion(d)){showToast("Diseñador inhabilitado para asignación: tiene 3 ODT activas.");return;}const ini=d?(d.nombre||"").split(" ").filter(Boolean).map(w=>w[0]).slice(0,2).join("").toUpperCase():"—";const tipoObj=TIPOS_TRABAJO.find(t=>t.label===odtForm.tipo)||{};const nowId=`odt-${Date.now()}`;const nueva={id:nowId,tipo:(odtForm.tipo||"ODT").replace("Material ","").slice(0,8)||"ODT",tipoTrabajo:odtForm.tipo||"No especificado",titulo:odtFormDraft.titulo||odtForm.titulo||"Nueva ODT",area:odtForm.area||"Trade Marketing",subtipo:`${odtForm.tipo||"ODT"} · ${odtForm.area||"Área"}`,did:ini,disenadorId:d?.id||"",disenadorDni:d?.dni||d?.documento||d?.usuario||d?.id||"",responsableId:d?.id||"",responsableDni:d?.dni||d?.documento||d?.usuario||d?.id||"",dnombre:d?.nombre||"Sin asignar",demail:d?.email||"",dcel:d?.celular||"",fechaInicio:odtForm.fechaInicio||todayStr(),fechaEntrega:odtForm.fechaEntrega||"",entrega:odtForm.fechaEntrega||"—",horaCorte:odtForm.horaCorte||"",estado:"pendiente",estadoPlanner:"Pendiente",prioridad:odtForm.prioridad||"Normal",colorD:"#6C6EF5",hh:String(tipoObj.hh||"—"),tiempo:"0d/1d lab",dias:"<1d",avance:0,objetivo:odtFormDraft.objetivo||odtForm.objetivo||"",mensaje:odtFormDraft.mensaje||odtForm.mensaje||"",materiales:odtForm.materiales||[],medidas:odtForm.medidas||"",tonalidad:odtForm.tonalidad||"",mecanica:odtFormDraft.mecanica||odtForm.mecanica||"",productos:odtFormDraft.productos||odtForm.productos||"",restricciones:odtFormDraft.restricciones||odtForm.restricciones||"",referencias:odtFormDraft.referencias||odtForm.referencias||"",activo:true,creadoPor:uName||uDni,creadoRol:role,solicitanteId:uDni||"",solicitanteNombre:uName||"",solicitanteEmail:loggedUser?.email||"",historial:[{accion:"CREADA",de:null,a:"Pendiente",usuarioId:uDni||"",usuarioNombre:uName||"",fecha:new Date().toISOString(),comentario:d?"ODT creada con diseñador asignado":"ODT creada sin diseñador asignado"}],creadoEn:new Date().toISOString()};saveOdtToFirestore(nueva);setOdtFirestore(prev=>[nueva,...(prev||[]).filter(x=>String(x.id)!==String(nowId))]);setOdtReporteSearch("");setOdtReporteEstado("todos");setOdtReporteTipo("todos");setOdtReporteResp("todos");if(d){setOdtNotifyModal({disenador:d,odt:nueva});showToast("ODT creada correctamente en Firebase");}else{showToast("ODT creada sin asignar en Firebase");resetOdtFormAndGoDash();}};
        const deleteOdt=(o)=>{ if(!canDeleteOdt(o)){showToast("Acción disponible solo para administrador");return;} if(!window.confirm(`¿Eliminar definitivamente la ODT ${o.id} de Firebase?`))return; const id=String(o.id); deleteOdtInFirestore(id); setOdtFirestore(prev=>(prev||[]).filter(x=>String(x.id)!==id)); setOdtViewModal(null); setOdtEditModal(null); setOdtAssignModal(null); showToast("ODT eliminada definitivamente de Firebase"); };
        const tableCols="170px 360px 190px 220px 140px 120px 160px 120px 170px 120px 190px";
        const IcoEye=()=> <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#0984e3" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M1 12s4-7 11-7 11 7 11 7-4 7-11 7-11-7-11-7z"/><circle cx="12" cy="12" r="3"/></svg>;
        const IcoEdit=()=> <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#6C6EF5" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 20h9"/><path d="M16.5 3.5a2.121 2.121 0 013 3L7 19l-4 1 1-4L16.5 3.5z"/></svg>;
        const IcoTrash=()=> <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#dc2626" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 6h18"/><path d="M8 6V4h8v2"/><path d="M19 6l-1 14H6L5 6"/><path d="M10 11v6M14 11v6"/></svg>;
        const IcoAssign=()=> <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#6C6EF5" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M16 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/><circle cx="8.5" cy="7" r="4"/><path d="M20 8v6M17 11h6"/></svg>;
        return(
          <div className="odt-responsive-root" style={{padding:"clamp(10px,2vw,20px) clamp(10px,2.5vw,24px) 48px",background:"#f0f4f8",minHeight:"100%",overflowX:"hidden"}}>
            <style>{`
              @media (max-width: 900px){
                .odt-responsive-root .odt-stepper{gap:8px!important; overflow-x:auto!important; padding-bottom:4px!important;}
                .odt-responsive-root .odt-stepper > div{min-width:170px!important;}
                .odt-responsive-root .odt-form-grid{grid-template-columns:1fr!important;}
                .odt-responsive-root .odt-modal-grid{grid-template-columns:1fr!important;}
              }
              @media (max-width: 640px){
                .odt-responsive-root{padding-left:8px!important;padding-right:8px!important;}
                .odt-responsive-root .odt-stepper > div{min-width:145px!important;}
              }
            `}</style>
            {subT==="nueva"&&(
              <div style={{...SH,maxWidth:1040,padding:"clamp(14px,2.4vw,24px)",margin:"0 auto",overflow:"hidden"}}>
                <div style={{textAlign:"center",fontSize:20,fontWeight:800,color:"#1a2f4a",marginBottom:8}}>Nueva orden de trabajo</div>
                <div style={{textAlign:"center",fontSize:13,color:"#8aaabb",marginBottom:26}}>Solicitud de diseño · el equipo lo recibirá automáticamente</div>
                <div style={{border:"1.5px solid #e2e8f0",borderRadius:16,padding:22,marginBottom:16}}>
                  <div style={{display:"flex",alignItems:"center",gap:10,fontSize:15,fontWeight:800,color:"#6C6EF5",textTransform:"uppercase",letterSpacing:".03em",marginBottom:20}}><span style={{width:34,height:34,borderRadius:"50%",background:"#6C6EF5",color:"#fff",display:"grid",placeItems:"center"}}>1</span>Información general</div>
                  <label style={{...lbl,textAlign:"center"}}>Título *</label><input value={odtFormDraft.titulo||odtForm.titulo||""} onChange={e=>setOdtFormDraft(p=>({...p,titulo:e.target.value}))} placeholder="Ej: Catálogo Verano 2026" style={{...inp,fontSize:16,marginBottom:18}}/>
                  <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:16,marginBottom:16}}><div><label style={{...lbl,textAlign:"center"}}>Solicitante</label><input readOnly value={uName||""} style={{...inp,background:"#f0f4f8",color:"#8aaabb",fontSize:15}}/></div><div><label style={{...lbl,textAlign:"center"}}>Área *</label><select value={odtForm.area} onChange={e=>setOdtForm(p=>({...p,area:e.target.value}))} style={{...inp,fontSize:15}}><option>Trade Marketing</option><option>Comercial</option><option>Marketing</option><option>Operaciones</option></select></div></div>
                  <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:16,marginBottom:16}}><div><label style={{...lbl,textAlign:"center"}}>Fecha inicio *</label><input type="date" value={odtForm.fechaInicio} onChange={e=>setOdtForm(p=>({...p,fechaInicio:e.target.value}))} style={{...inp,fontSize:15}}/></div><div><label style={{...lbl,textAlign:"center"}}>Fecha entrega *</label><input type="date" value={odtForm.fechaEntrega} onChange={e=>setOdtForm(p=>({...p,fechaEntrega:e.target.value}))} style={{...inp,fontSize:15}}/></div></div>
                  <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:16}}><div><label style={{...lbl,textAlign:"center"}}>Hora de inicio</label><input type="time" value={odtForm.horaInicio} onChange={e=>setOdtForm(p=>({...p,horaInicio:e.target.value}))} style={{...inp,fontSize:15}}/></div><div><label style={{...lbl,textAlign:"center"}}>Hora de corte <span style={{color:"#e17055",fontWeight:500}}>(pasada esta hora → retraso)</span></label><input type="time" value={odtForm.horaCorte} onChange={e=>setOdtForm(p=>({...p,horaCorte:e.target.value}))} style={{...inp,fontSize:15}}/></div></div><div style={{marginTop:16}}><label style={{...lbl,textAlign:"center"}}>Prioridad</label><select value={odtForm.prioridad||"Normal"} onChange={e=>setOdtForm(p=>({...p,prioridad:e.target.value}))} style={{...inp,fontSize:15}}>{ODT_PRIORIDADES.map(p=><option key={p.id} value={p.id}>{p.label}</option>)}</select></div>
                </div>
                {(isAdmin||role==="coordinador")&&<div style={{border:"1.5px solid #e2e8f0",borderRadius:16,padding:22,marginBottom:16}}><div style={{display:"flex",alignItems:"center",gap:10,fontSize:15,fontWeight:800,color:"#6C6EF5",textTransform:"uppercase",letterSpacing:".03em",marginBottom:14}}><span style={{width:34,height:34,borderRadius:"50%",background:"#6C6EF5",color:"#fff",display:"grid",placeItems:"center"}}>2</span>Responsable</div><div style={{display:"grid",gap:9}}><button onClick={()=>setOdtForm(p=>({...p,disenadorId:""}))} style={{display:"flex",alignItems:"center",justifyContent:"space-between",gap:10,padding:"9px 10px",borderRadius:10,border:`1.5px solid ${!odtForm.disenadorId?"#6C6EF5":"#e2e8f0"}`,background:!odtForm.disenadorId?"rgba(108,110,245,.08)":"#fff",cursor:"pointer"}}><span style={{display:"flex",alignItems:"center",gap:10}}><span style={{width:32,height:32,borderRadius:"50%",background:"#dce6ee",display:"grid",placeItems:"center",color:"#6C6EF5",fontWeight:800}}>—</span><b>Sin asignar</b></span><span style={{fontSize:10,fontWeight:800,color:"#f6a623"}}>Pendiente</span></button>{disenadores.map(u=>{const sel=odtForm.disenadorId===u.id;const ini=(u.nombre||"?").split(" ").map(w=>w[0]).slice(0,2).join("").toUpperCase();const carga=odtCargaDesigner(u);const blocked=designerBloqueadoAsignacion(u);return <button key={u.id} disabled={blocked} onClick={()=>!blocked&&setOdtForm(p=>({...p,disenadorId:u.id}))} title={blocked?"Inhabilitado: 3 ODT activas":"Disponible"} style={{display:"flex",alignItems:"center",justifyContent:"space-between",gap:10,padding:"9px 10px",borderRadius:10,border:`1.5px solid ${sel?"#6C6EF5":"#e2e8f0"}`,background:blocked?"#f8fafc":sel?"rgba(108,110,245,.08)":"#fff",opacity:blocked?.62:1,cursor:blocked?"not-allowed":"pointer"}}><span style={{display:"flex",alignItems:"center",gap:10}}><span style={{width:32,height:32,borderRadius:"50%",background:blocked?"#b2bec3":"#6C6EF5",display:"grid",placeItems:"center",color:"#fff",fontWeight:800}}>{ini}</span><span><b>{u.nombre}</b><small style={{display:"block",fontSize:10,color:"#8aaabb"}}>Ejecutor · Diseñador · {carga}/{ODT_MAX_ACTIVAS_POR_DISENADOR} activas</small></span></span><span style={{fontSize:10,fontWeight:800,color:blocked?"#dc2626":"#00b894"}}>{blocked?"Inhabilitado":"Disponible"}</span></button>})}</div></div>}
                <div style={{border:"1.5px solid #e2e8f0",borderRadius:16,padding:22,marginBottom:16}}><div style={{display:"flex",alignItems:"center",gap:10,fontSize:15,fontWeight:800,color:"#6C6EF5",textTransform:"uppercase",letterSpacing:".03em",marginBottom:14}}><span style={{width:34,height:34,borderRadius:"50%",background:"#6C6EF5",color:"#fff",display:"grid",placeItems:"center"}}>3</span>Tipo de trabajo</div><div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:12,marginBottom:22}}>{TIPOS_TRABAJO.map(t=>{const sel=odtForm.tipo===t.label;return <button key={t.id||t.label} onClick={()=>setOdtForm(p=>({...p,tipo:t.label,hh:t.hh}))} style={{height:78,borderRadius:14,border:`1.5px solid ${sel?"#6C6EF5":"#c8d8e8"}`,background:sel?"rgba(108,110,245,.06)":"#fff",display:"flex",alignItems:"center",gap:14,padding:"0 22px",fontSize:16,fontWeight:800,color:"#1a2f4a",cursor:"pointer"}}><span style={{width:22,height:22,borderRadius:"50%",border:`3px solid ${sel?"#6C6EF5":"#c8d8e8"}`,display:"grid",placeItems:"center"}}>{sel&&<span style={{width:8,height:8,borderRadius:"50%",background:"#6C6EF5"}}/>}</span>{t.ico}{t.label}</button>})}</div><label style={{...lbl,textAlign:"center",fontSize:13}}>Objetivo y público</label><textarea value={odtFormDraft.objetivo||""} onChange={e=>setOdtFormDraft(p=>({...p,objetivo:e.target.value}))} placeholder="¿Qué debe comunicar? ¿A quién está dirigido?" style={{...inp,minHeight:90,resize:"vertical",fontSize:15,marginBottom:18}}/><label style={{...lbl,textAlign:"center",fontSize:13}}>Mensaje principal</label><textarea value={odtFormDraft.mensaje||""} onChange={e=>setOdtFormDraft(p=>({...p,mensaje:e.target.value}))} placeholder="Frase clave, claim o copy principal de la pieza" style={{...inp,minHeight:90,resize:"vertical",fontSize:15}}/></div>
                <div style={{border:"1.5px solid #e2e8f0",borderRadius:16,padding:22,marginBottom:16}}><div style={{display:"flex",alignItems:"center",gap:10,fontSize:15,fontWeight:800,color:"#6C6EF5",textTransform:"uppercase",letterSpacing:".03em",marginBottom:14}}><span style={{width:34,height:34,borderRadius:"50%",background:"#6C6EF5",color:"#fff",display:"grid",placeItems:"center"}}>4</span>Materiales y medidas</div><div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10,marginBottom:14}}>{MATERIALES_TODOS.map(m=>{const chk=(odtForm.materiales||[]).includes(m);return <label key={m} style={{display:"flex",alignItems:"center",gap:10,border:"1px solid #e2e8f0",borderRadius:12,padding:"10px 12px",background:chk?"rgba(0,181,180,.08)":"#f8fafc",cursor:"pointer"}}><input type="checkbox" checked={chk} onChange={e=>setOdtForm(p=>({...p,materiales:e.target.checked?[...(p.materiales||[]),m]:(p.materiales||[]).filter(x=>x!==m)}))}/><span style={{fontSize:12,fontWeight:700,color:"#1a2f4a"}}>{m}</span></label>})}</div><label style={lbl}>Medidas específicas</label><input value={odtForm.medidas} onChange={e=>setOdtForm(p=>({...p,medidas:e.target.value}))} placeholder="Ej: 1080×1920px / A3 vertical" style={inp}/></div>
                <div style={{border:"1.5px solid #e2e8f0",borderRadius:16,padding:22,marginBottom:16}}><div style={{display:"flex",alignItems:"center",gap:10,fontSize:15,fontWeight:800,color:"#6C6EF5",textTransform:"uppercase",letterSpacing:".03em",marginBottom:14}}><span style={{width:34,height:34,borderRadius:"50%",background:"#6C6EF5",color:"#fff",display:"grid",placeItems:"center"}}>5</span>Estilo y referencias</div><label style={lbl}>Tonalidad</label><div style={{display:"flex",gap:8,flexWrap:"wrap",marginBottom:14}}>{["Corporativo","Emocional","Promocional","Divertido","Impactante"].map(t=><button key={t} onClick={()=>setOdtForm(p=>({...p,tonalidad:t}))} style={{padding:"7px 13px",borderRadius:999,border:`1.5px solid ${odtForm.tonalidad===t?"#6C6EF5":"#e2e8f0"}`,background:odtForm.tonalidad===t?"#6C6EF5":"#fff",color:odtForm.tonalidad===t?"#fff":"#5a7a9a",fontWeight:700,cursor:"pointer"}}>{t}</button>)}</div><label style={lbl}>Mecánica / dinámica</label><textarea value={odtFormDraft.mecanica||""} onChange={e=>setOdtFormDraft(p=>({...p,mecanica:e.target.value}))} style={{...inp,minHeight:70,resize:"vertical",marginBottom:12}}/><div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12,marginBottom:12}}><div><label style={lbl}>Productos involucrados</label><input value={odtFormDraft.productos||""} onChange={e=>setOdtFormDraft(p=>({...p,productos:e.target.value}))} style={inp}/></div><div><label style={lbl}>Restricciones</label><input value={odtFormDraft.restricciones||""} onChange={e=>setOdtFormDraft(p=>({...p,restricciones:e.target.value}))} style={inp}/></div></div><label style={lbl}>Comentarios / referencias</label><textarea value={odtFormDraft.referencias||""} onChange={e=>setOdtFormDraft(p=>({...p,referencias:e.target.value}))} style={{...inp,minHeight:70,resize:"vertical"}}/></div>
                <div style={{display:"flex",justifyContent:"flex-end",gap:10}}><button style={{padding:"11px 20px",borderRadius:11,border:"1.5px solid #e2e8f0",color:"#8aaabb",fontSize:13,fontWeight:700,background:"#fff",cursor:"pointer"}}>Cancelar</button><button onClick={createOdtAndNotify} style={{padding:"11px 22px",borderRadius:11,border:"none",background:"linear-gradient(135deg,#6C6EF5,#1a2f4a)",color:"#fff",fontSize:13,fontWeight:700,cursor:"pointer",display:"flex",alignItems:"center",gap:8}}><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/></svg>Crear y notificar</button></div>
              </div>
            )}
            {subT==="reporte"&&(
              <><div style={{display:"flex",gap:10,alignItems:"center",marginBottom:14,flexWrap:"wrap"}}>
                <div style={{position:"relative",width:260}}>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#0984e3" strokeWidth="2" style={{position:"absolute",left:12,top:13}}><circle cx="11" cy="11" r="8"/><path d="M21 21l-4.35-4.35"/></svg>
                  <input value={odtReporteSearch} onChange={e=>setOdtReporteSearch(e.target.value)} placeholder="Buscar actividad..." style={{...inp,paddingLeft:38}}/>
                </div>
                <select value={odtReporteEstado} onChange={e=>setOdtReporteEstado(e.target.value)} style={{...inp,width:"auto",padding:"8px 11px"}}>
                  <option value="todos">Todos los estados</option>
                  <option value="pendiente">Pendiente</option>
                  <option value="diseño">En diseño</option>
                  <option value="aprobacion">En aprobación</option>
                  <option value="correccion">En corrección</option>
                  <option value="entregado">Entregado</option>
                  /* retrasado no es estado manual */
                </select>
                <select value={odtReporteTipo} onChange={e=>setOdtReporteTipo(e.target.value)} style={{...inp,width:"auto",padding:"8px 11px"}}>
                  <option value="todos">Todos los tipos</option>
                  {TIPOS_TRABAJO.map(t=><option key={t.label} value={t.label}>{t.label}</option>)}
                </select>
                <select value={odtReporteResp} onChange={e=>setOdtReporteResp(e.target.value)} style={{...inp,width:"auto",padding:"8px 11px"}}>
                  <option value="todos">Todos los responsables</option>
                  {[...new Set(odtsRol.map(o=>o.dnombre))].map(r=><option key={r} value={r}>{r}</option>)}
                </select>
                <button onClick={()=>{setOdtReporteSearch("");setOdtReporteEstado("todos");setOdtReporteTipo("todos");setOdtReporteResp("todos");}} style={{padding:"8px 16px",borderRadius:10,border:"1px solid #c8d8e8",background:"#fff",color:"#5a7a9a",fontWeight:700,cursor:"pointer"}}>Limpiar</button>
                <span style={{marginLeft:"auto",padding:"8px 18px",borderRadius:999,background:"#EEEFFE",color:"#6C6EF5",fontWeight:800,fontSize:12}}>{odtsReporte.length} actividades</span>
              </div>
              <div style={{display:"grid",gridTemplateColumns:"repeat(5,1fr)",gap:10,marginBottom:16}}>
                {reportStats.map(s=>{
                    const kpiIco={
                      "Total":<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={s.c} strokeWidth="1.8" strokeLinecap="round"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><path d="M14 2v6h6"/><line x1="8" y1="13" x2="16" y2="13"/><line x1="8" y1="17" x2="12" y2="17"/></svg>,
                      "Entregadas":<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={s.c} strokeWidth="1.8" strokeLinecap="round"><circle cx="12" cy="12" r="10"/><polyline points="9 12 11 14 15 10"/></svg>,
                      "En proceso":<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={s.c} strokeWidth="1.8" strokeLinecap="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>,
                      "Pendientes":<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={s.c} strokeWidth="1.8" strokeLinecap="round"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>,
                      "Con retraso":<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={s.c} strokeWidth="1.8" strokeLinecap="round"><path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>,
                    };
                    return <div key={s.l} style={{...SH,padding:"14px 12px",textAlign:"center",borderTop:`3px solid ${s.c}`}}>
                      <div style={{display:"flex",justifyContent:"center",marginBottom:6}}>{kpiIco[s.l]}</div>
                      <div style={{fontSize:28,fontWeight:800,color:s.c,lineHeight:1}}>{s.v}</div>
                      <div style={{fontSize:9,color:"#8aaabb",fontWeight:700,letterSpacing:".05em",marginTop:5,textTransform:"uppercase"}}>{s.l}</div>
                    </div>;
                  })}
              </div>
              <div style={{...SH,overflowX:"auto",maxWidth:"100%"}}>
                <table style={{width:"100%",borderCollapse:"collapse",fontSize:12,minWidth:1320}}>
                  <thead>
                    <tr style={{background:"#f8fafc"}}>
                      {["TIPO","ACTIVIDAD","ÁREA","RESPONSABLE","F. ENTREGA","H. CIERRE","ESTATUS","PROGRESO","HH","PRIORIDAD","TIEMPO TRANSCURRIDO","DÍAS TB","ACCIONES"].map(h=>(
                        <th key={h} style={{padding:"10px 12px",textAlign:"left",color:"#5a7a9a",fontWeight:700,fontSize:9,letterSpacing:".06em",borderBottom:"1px solid #e2e8f0",whiteSpace:"nowrap"}}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {odtsReporte.length===0&&<tr><td colSpan={13} style={{textAlign:"center",padding:32,color:"#b2bec3",fontWeight:700}}>No hay ODTs para los filtros seleccionados.</td></tr>}
                    {odtsReporte.map(o=>{
                      const p=pillE(o.estado);
                      const estado=String(o?.estadoUi||o?.estado||"pendiente").toLowerCase();
                      const isHL=odtHighlighted===o.id;
                      const vencida=o.fechaEntrega&&todayStr()>o.fechaEntrega&&!isOdtFinalizada(o);
                      return(
                        <tr key={o.id}
                          style={{borderBottom:"1px solid #f0f4f8",background:isHL?"rgba(108,110,245,.08)":"#fff",transition:"background .4s"}}
                          onMouseEnter={e=>{if(!isHL)e.currentTarget.style.background="#f8fcff";}}
                          onMouseLeave={e=>{if(!isHL)e.currentTarget.style.background="#fff";}}>
                          <td style={{padding:"12px 10px"}}>
                            {renderTypeChip(o.tipoTrabajo||o.tipo)}
                          </td>
                          <td style={{padding:"12px 10px",maxWidth:260}}>
                            <div style={{fontWeight:700,color:estado==="cancelado"?"#94a3b8":"#1a2f4a",textDecoration:estado==="cancelado"?"line-through":"none",overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{o.titulo}</div>
                            <div style={{fontSize:9,color:"#b2bec3",marginTop:3}}>{o.id} · {o.fechaInicio}</div>
                          </td>
                          <td style={{padding:"12px 10px"}}>
                            <span style={{fontSize:11,color:"#5a7a9a"}}>{o.area||"—"}</span>
                          </td>
                          <td style={{padding:"12px 10px"}}>
                            <div style={{display:"flex",alignItems:"center",gap:7}}>
                              <span style={{width:28,height:28,borderRadius:"50%",background:o.colorD||"#6C6EF5",display:"grid",placeItems:"center",fontSize:10,fontWeight:800,color:"#fff",flexShrink:0}}>{o.did||"—"}</span>
                              <span style={{fontSize:10,fontWeight:700,color:p.col,background:p.col+"18",padding:"3px 9px",borderRadius:20,maxWidth:120,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{o.dnombre||"Sin asignar"}</span>
                              {o.tsNotificado&&<span style={{fontSize:9,color:"#00b894",background:"#e8faf5",padding:"2px 7px",borderRadius:20,fontWeight:700,whiteSpace:"nowrap",flexShrink:0}}><svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><polyline points="20 6 9 17 4 12"/></svg> Notif.</span>}
                            </div>
                          </td>
                          <td style={{padding:"12px 10px",whiteSpace:"nowrap"}}>
                            <span style={{padding:"3px 9px",borderRadius:20,fontSize:10,fontWeight:700,color:"#5a7a9a",background:vencida?"#ffeae6":"#f0f4f8",borderLeft:vencida?"3px solid #dc2626":"none"}}>{o.fechaEntrega||"—"}</span>
                          </td>
                          <td style={{padding:"12px 10px",whiteSpace:"nowrap"}}>
                            <span style={{padding:"3px 9px",borderRadius:20,fontSize:10,fontWeight:700,color:"#5a7a9a",background:"#f0f4f8"}}>{o.horaCorte||"—"}</span>
                          </td>
                          <td style={{padding:"12px 10px"}}>
                            {canUpdateOdtState(o)&&!(estado==="cancelado"&&!isDisenoAdmin)
                              ?<select value={o.estado} onChange={async e=>{
                                  const nuevoEstado=e.target.value;
                                  if(nuevoEstado==="cancelado"){const motivo=window.prompt("Motivo de cancelación (obligatorio):");if(!motivo||!motivo.trim()){showToast("Debes ingresar un motivo para cancelar");return;}await updateOdtEstado(o,nuevoEstado,{actualizadoPor:uName||uDni,actualizadoRol:role,motivoCancelacion:motivo.trim(),canceladoEn:new Date().toISOString()});return;}
                                  await updateOdtEstado(o,nuevoEstado,{actualizadoPor:uName||uDni,actualizadoRol:role});
                                }}
                                style={{padding:"3px 9px",borderRadius:20,border:"none",background:p.col+"18",color:p.col,fontWeight:700,fontSize:10,cursor:"pointer",outline:"none",whiteSpace:"nowrap",fontFamily:"'DM Sans',system-ui,sans-serif",appearance:"none",WebkitAppearance:"none"}}>
                                {odtStateOptions(o).map(st=><option key={st} value={st}>{pillE(st).txt}</option>)}
                              </select>
                              :renderStateChip(o.estado,true)
                            }
                          </td>
                          <td style={{padding:"12px 10px"}}>
                            {(()=>{
                              const pg=o.progreso||"Pendiente";
                              const pgMeta={
                                "Finalizado":{bg:"rgba(0,184,148,.12)",col:"#00b894",ico:"check"},
                                "En proceso":{bg:"rgba(108,110,245,.12)",col:"#6C6EF5",ico:"pen"},
                                "En corrección":{bg:"rgba(246,166,35,.12)",col:"#f6a623",ico:"pen"},
                                "Con retraso":{bg:"#ffeae6",col:"#dc2626",ico:"alert"},
                                "Cancelado":{bg:"#f1f5f9",col:"#64748b",ico:"alert"},
                                "Pendiente":{bg:"rgba(246,166,35,.12)",col:"#f6a623",ico:"clock"},
                              }[pg]||{bg:"rgba(246,166,35,.12)",col:"#f6a623",ico:"clock"};
                              return <span style={{display:"inline-flex",alignItems:"center",gap:5,padding:"2px 7px",borderRadius:20,fontSize:9,fontWeight:800,color:pgMeta.col,background:pgMeta.bg,whiteSpace:"nowrap"}}><OdtSvgIcon kind={pgMeta.ico} color={pgMeta.col} size={9}/>{pg}</span>;
                            })()}
                          </td>
                          <td style={{padding:"12px 10px",textAlign:"center"}}>
                            <span style={{fontWeight:700,color:"#8aaabb"}}>{o.hh||"—"}</span>
                          </td>
                          <td style={{padding:"12px 10px",textAlign:"center"}}>{renderPriorityChip(o.prioridad||"Normal",true)}</td>
                          <td style={{padding:"12px 10px",minWidth:120}}>
                            <div style={{fontSize:10,fontWeight:700,color:"#1a2f4a",marginBottom:3}}>{o.tiempo}</div>
                            <div style={{height:5,background:"#edf2f7",borderRadius:3,overflow:"hidden"}}>
                              <div style={{height:"100%",width:`${o.avance||0}%`,background:o.progreso==="Con retraso"?"#dc2626":o.progreso==="Finalizado"?"#00b894":"#6C6EF5",transition:"width .3s"}}/>
                            </div>
                          </td>
                          <td style={{padding:"12px 10px",textAlign:"center"}}>
                            <span style={{fontSize:11,fontWeight:800,color:String(o.dias||"").toLowerCase().includes("retraso")?"#dc2626":String(o.dias||"").toLowerCase().includes("adelanto")||String(o.dias||"").toLowerCase().includes("a tiempo")?"#00b894":"#1a2f4a",whiteSpace:"nowrap"}}>{o.dias}</span>
                          </td>
                          <td style={{padding:"12px 10px"}}>
                            <div style={{display:"flex",alignItems:"center",gap:6}}>
                              <button title="Ver detalle" onClick={()=>setOdtViewModal(o)} style={{width:34,height:34,borderRadius:9,border:"1px solid #c8d8e8",background:"#f8fafc",display:"grid",placeItems:"center",cursor:"pointer"}}><IcoEye/></button>
                              {canEditOdt(o)&&<>
                                <button title="Editar" onClick={()=>{setOdtEditModal(o);setOdtEditForm({});}} style={{width:34,height:34,borderRadius:9,border:"1.5px solid #6C6EF5",background:"#fff",display:"grid",placeItems:"center",cursor:"pointer"}}><IcoEdit/></button>
                                {canAssignOdt(o)&&<button onClick={()=>setOdtAssignModal(o)} style={{height:34,padding:"0 11px",borderRadius:9,border:"1.5px solid #6C6EF5",background:"#fff",color:"#6C6EF5",fontWeight:700,fontSize:11,cursor:"pointer"}}>Asignar</button>}
                              </>}
                              {canDeleteOdt(o)&&<button title="Eliminar" onClick={()=>deleteOdt(o)} style={{width:34,height:34,borderRadius:9,border:"1px solid #fecaca",background:"#fff1f2",display:"grid",placeItems:"center",cursor:"pointer"}}><IcoTrash/></button>}
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div></>
            )}
            {subT==="dashboard"&&(<>
              {/* ── tabs Kanban / Panel ── */}
              <div style={{background:"#fff",border:"1px solid #e2e8f0",borderRadius:12,padding:"10px 14px",display:"flex",gap:20,marginBottom:14}}>
                <button onClick={()=>setOdtDashView("kanban")} style={{padding:"9px 0",border:"none",background:"transparent",borderBottom:`3px solid ${odtDashView==="kanban"?"#6C6EF5":"transparent"}`,color:odtDashView==="kanban"?"#6C6EF5":"#5a7a9a",fontWeight:800,cursor:"pointer",display:"flex",alignItems:"center",gap:7}}>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><rect x="3" y="3" width="7" height="9" rx="1"/><rect x="14" y="3" width="7" height="5" rx="1"/><rect x="14" y="12" width="7" height="9" rx="1"/><rect x="3" y="16" width="7" height="5" rx="1"/></svg>
                  Kanban
                </button>
                <button onClick={()=>setOdtDashView("panel")} style={{padding:"9px 0",border:"none",background:"transparent",borderBottom:`3px solid ${odtDashView==="panel"?"#6C6EF5":"transparent"}`,color:odtDashView==="panel"?"#6C6EF5":"#5a7a9a",fontWeight:800,cursor:"pointer",display:"flex",alignItems:"center",gap:7}}>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/></svg>
                  Panel
                </button>
              </div>

              {odtDashView==="kanban"&&<>
                {/* ── Kanban filter bar ── */}
                <div style={{display:"flex",gap:8,marginBottom:14,flexWrap:"wrap",alignItems:"center"}}>
                  {/* designer avatars */}
                  <div style={{display:"flex",gap:6,alignItems:"center"}}>
                    {disenadores.map(d=>{
                      const ini=(d.nombre||"?").split(" ").map(w=>w[0]).slice(0,2).join("").toUpperCase();
                      const colors=["#6C6EF5","#0984e3","#00b5b4"];
                      const ci=disenadores.indexOf(d)%colors.length;
                      const isActive=odtKanbanFiltro.resp===d.id;
                      return <button key={d.id} title={d.nombre} onClick={()=>setOdtKanbanFiltro(p=>({...p,resp:p.resp===d.id?"todos":d.id}))}
                        style={{width:34,height:34,borderRadius:"50%",background:isActive?colors[ci]:"#e2e8f0",color:isActive?"#fff":"#5a7a9a",border:isActive?`2px solid ${colors[ci]}`:"2px solid transparent",fontWeight:800,fontSize:11,cursor:"pointer",transition:"all .15s",flexShrink:0}}>
                        {ini}
                      </button>;
                    })}
                    {disenadores.length>0&&<span style={{fontSize:11,color:"#8aaabb"}}>{disenadores.length} diseñador{disenadores.length!==1?"es":""} activo{disenadores.length!==1?"s":""}</span>}
                  </div>
                  <div style={{marginLeft:"auto",display:"flex",gap:7,alignItems:"center"}}>
                    <select value={odtKanbanFiltro.tipo} onChange={e=>setOdtKanbanFiltro(p=>({...p,tipo:e.target.value}))}
                      style={{padding:"7px 11px",borderRadius:10,border:"1px solid #e2e8f0",background:"#fff",fontSize:11,color:"#1a2f4a",fontWeight:600,cursor:"pointer",outline:"none"}}>
                      <option value="todos">Todos los tipos</option>
                      {TIPOS_TRABAJO.map(t=><option key={t.label} value={t.label}>{t.label}</option>)}
                    </select>
                    {(odtKanbanFiltro.resp!=="todos"||odtKanbanFiltro.tipo!=="todos")&&
                      <button onClick={()=>setOdtKanbanFiltro({resp:"todos",tipo:"todos"})}
                        style={{padding:"7px 12px",borderRadius:10,border:"1px solid #fecaca",background:"#fff1f2",color:"#dc2626",fontSize:11,fontWeight:700,cursor:"pointer"}}>
                        Limpiar filtro
                      </button>}
                  </div>
                </div>
                {/* ── Kanban columns ── */}
                <div style={{display:"grid",gridTemplateColumns:"repeat(5,minmax(230px,1fr))",gap:14}}>
                  {[
                    {id:"pendiente",  label:"Pendiente",     c:"#f6a623", estados:["pendiente"]},
                    {id:"diseno",     label:"En diseño",     c:"#6C6EF5", estados:["diseño","en_diseno"]},
                    {id:"aprobacion", label:"En aprobación", c:"#0984e3", estados:["aprobacion","aprobado"]},
                    {id:"correccion", label:"En corrección", c:"#f6a623", estados:["correccion"]},
                    {id:"entregado",  label:"Entregado",    c:"#00b894", estados:["entregado"]},
                  ].map(col=>{
                    const colItems=odtsRol.filter(o=>{
                      const matchEstado=col.estados.some(e=>o.estado===e)||col.estados.some(e=>o.stat===e);
                      const matchResp=odtKanbanFiltro.resp==="todos"||o.disenadorId===odtKanbanFiltro.resp||o.did===odtKanbanFiltro.resp;
                      const matchTipo=odtKanbanFiltro.tipo==="todos"||o.tipoTrabajo===odtKanbanFiltro.tipo||o.tipo===odtKanbanFiltro.tipo;
                      const matchEntregadoReciente=col.id!=="entregado"||isOdtDeliveredVisibleInKanban(o);
                      return matchEstado&&matchResp&&matchTipo&&matchEntregadoReciente;
                    });
                    return(
                      <div key={col.id}>
                        <div style={{display:"flex",alignItems:"center",gap:7,marginBottom:10,padding:"0 4px"}}>
                          <span style={{width:8,height:8,borderRadius:"50%",background:col.c,flexShrink:0}}/>
                          <span style={{fontSize:10,fontWeight:800,color:"#5a7a9a",letterSpacing:".05em",textTransform:"uppercase"}}>{col.label}</span>
                          {col.id==="entregado"&&<span style={{fontSize:9,color:"#8aaabb",fontWeight:700,textTransform:"none",letterSpacing:0}}>últimos {KANBAN_ENTREGADOS_DIAS}d</span>}
                          <span style={{marginLeft:"auto",padding:"1px 8px",borderRadius:20,fontSize:9,fontWeight:700,background:col.c+"18",color:col.c}}>{colItems.length}</span>
                        </div>
                        <div style={{display:"flex",flexDirection:"column",gap:8}}>
                          {colItems.map(o=>{
                            const isHL=odtHighlighted===o.id;
                            const vencida=o.fechaEntrega&&todayStr()>o.fechaEntrega&&!isOdtFinalizada(o);
                            return(
                              <div key={o.id} style={{background:isHL?"rgba(108,110,245,.07)":"#fff",borderRadius:12,border:"1px solid #e2e8f0",borderLeft:`3px solid ${col.c}`,padding:12,boxShadow:"0 1px 4px rgba(0,0,0,.05)",transition:"background .4s"}}>
                                <div style={{fontWeight:700,color:"#1a2f4a",fontSize:12,marginBottom:5,lineHeight:1.3,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{o.titulo}</div>
                                <div style={{display:"flex",gap:5,marginBottom:9,flexWrap:"wrap"}}>
                                  {renderTypeChip(o.tipoTrabajo||o.tipo,true)}
                                  {renderPriorityChip(o.prioridad||"Normal",true)}
                                  {vencida&&<span style={{padding:"2px 7px",borderRadius:20,fontSize:9,fontWeight:700,background:"#ffeae6",color:"#dc2626",display:"flex",alignItems:"center",gap:3}}>
                                    <svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>
                                    VENCIDO
                                  </span>}
                                </div>
                                {o.avance>0&&<div style={{marginBottom:8}}><div style={{display:"flex",justifyContent:"space-between",fontSize:9,marginBottom:2}}><span style={{color:"#8aaabb"}}>Avance</span><span style={{fontWeight:700,color:col.c}}>{o.avance}%</span></div><div style={{height:4,background:"#f0f4f8",borderRadius:2}}><div style={{width:`${o.avance||0}%`,height:"100%",background:col.c,borderRadius:2,transition:"width .3s"}}/></div></div>}
                                <div style={{display:"flex",alignItems:"center",justifyContent:"space-between"}}>
                                  {(o.did||o.dnombre)?<div style={{display:"flex",alignItems:"center",gap:5}}>
                                    <span style={{width:22,height:22,borderRadius:"50%",background:o.colorD||"#6C6EF5",display:"grid",placeItems:"center",fontSize:9,fontWeight:800,color:"#fff"}}>{o.did||"?"}</span>
                                    <span style={{fontSize:10,color:"#5a7a9a",maxWidth:80,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{(o.dnombre||"").split(" ")[0]}</span>
                                  </div>:<span style={{fontSize:10,color:"#b2bec3"}}>Sin asignar</span>}
                                  <span style={{fontSize:10,color:vencida?"#dc2626":"#8aaabb",fontWeight:vencida?700:400}}>{o.fechaEntrega||o.entrega||"—"}</span>
                                </div>
                                {canAssignOdt(o)&&o.estado==="pendiente"&&!o.disenadorId&&<button onClick={()=>setOdtAssignModal(o)} style={{marginTop:8,width:"100%",padding:"5px 0",borderRadius:8,border:"1px solid #6C6EF5",background:"#EEEFFE",color:"#6C6EF5",fontSize:10,fontWeight:700,cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",gap:5}}>
                                  <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><circle cx="12" cy="8" r="4"/><path d="M4 20c0-4 3.6-7 8-7s8 3 8 7"/></svg>
                                  Asignar
                                </button>}
                                {isEjecutor&&isAssignedOdt(o)&&(()=>{
                                  const NEXT={pendiente:{label:"Iniciar trabajo",c:"#f6a623",nc:"diseño"},diseño:{label:"Listo para revisión →",c:"#6C6EF5",nc:"aprobacion"},en_diseno:{label:"Listo para revisión →",c:"#6C6EF5",nc:"aprobacion"},aprobado:{label:"Entregar ODT",c:"#00b894",nc:"entregado"}};
                                  const nx=NEXT[o.estado];
                                  if(o.estado==="aprobacion")return <button disabled style={{marginTop:8,width:"100%",padding:"7px 0",borderRadius:8,border:"1px solid #c8d8e8",background:"#f8fafc",color:"#8aaabb",fontSize:11,fontWeight:800,cursor:"not-allowed"}}>Esperando aprobación</button>;
                                  if(!nx)return null;
                                  return <button onClick={()=>updateOdtEstado(o,nx.nc,{actualizadoPor:uName||uDni,actualizadoRol:role})} style={{marginTop:8,width:"100%",padding:"7px 0",borderRadius:8,border:"none",background:nx.c,color:"#fff",fontSize:11,fontWeight:800,cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",gap:6}}>
                                    <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.5" strokeLinecap="round"><polyline points="9 18 15 12 9 6"/></svg>
                                    {nx.label}
                                  </button>;
                                })()}
                              </div>
                            );
                          })}
                          {colItems.length===0&&<div style={{padding:"20px 14px",borderRadius:10,border:"1.5px dashed #e2e8f0",textAlign:"center",fontSize:11,color:"#b2bec3"}}>Sin actividades</div>}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </>}

              {odtDashView==="panel"&&<>
                <div style={{display:"grid",gridTemplateColumns:`repeat(${odtDashLevelItems.length},1fr)`,gap:10,marginBottom:14}}>
                  {odtDashLevelItems.map(l=>{const on=odtDashLevelActive===l.id;return(
                    <button key={l.id} onClick={()=>setOdtDashLvl(l.id)} style={{...SH,padding:"14px 10px",minHeight:68,textAlign:"center",border:on?"2px solid #6C6EF5":"1px solid #e2e8f0",background:on?"#1a2f4a":"#fff",color:on?"#fff":"#5a7a9a",cursor:"pointer"}}>
                      <div style={{display:"flex",justifyContent:"center",marginBottom:5,color:on?"#fff":"#5a7a9a"}}>{l.ico}</div>
                      <div style={{fontSize:12,fontWeight:900,color:on?"#fff":"#1a2f4a"}}>{l.t}</div>
                      <div style={{fontSize:9,color:on?"rgba(255,255,255,.75)":"#8aaabb",marginTop:2}}>{l.d}</div>
                    </button>
                  )})}
                </div>
                <div style={{display:"grid",gridTemplateColumns:"repeat(5,1fr)",gap:10,marginBottom:14}}>
                  {reportStats.map(s=>{
                    const kpiIco2={
                      "Total":<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={s.c} strokeWidth="1.8" strokeLinecap="round"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><path d="M14 2v6h6"/><line x1="8" y1="13" x2="16" y2="13"/><line x1="8" y1="17" x2="12" y2="17"/></svg>,
                      "Entregadas":<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={s.c} strokeWidth="1.8" strokeLinecap="round"><circle cx="12" cy="12" r="10"/><polyline points="9 12 11 14 15 10"/></svg>,
                      "En proceso":<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={s.c} strokeWidth="1.8" strokeLinecap="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>,
                      "Pendientes":<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={s.c} strokeWidth="1.8" strokeLinecap="round"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>,
                      "Con retraso":<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={s.c} strokeWidth="1.8" strokeLinecap="round"><path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>,
                    };
                    return <div key={s.l} style={{...SH,padding:"16px 12px",textAlign:"center",borderTop:`3px solid ${s.c}`}}>
                      <div style={{display:"flex",justifyContent:"center",marginBottom:5}}>{kpiIco2[s.l]}</div>
                      <div style={{fontSize:26,fontWeight:800,color:s.c}}>{s.v}</div>
                      <div style={{fontSize:9,color:"#8aaabb",fontWeight:700,textTransform:"uppercase",marginTop:4}}>{s.l}</div>
                    </div>;
                  })}
                </div>
                <div style={{...SH,padding:18}}>
                  <div style={{fontWeight:800,color:"#1a2f4a",marginBottom:10}}>Avance global</div>
                  <div style={{height:12,borderRadius:8,overflow:"hidden",display:"flex",background:"#e2e8f0"}}>
                    {(()=>{const total=odtsRol.length||1;const pEnt=Math.round(odtsRol.filter(o=>isOdtFinalizada(o)).length/total*100);const pProc=Math.round(odtsRol.filter(o=>["diseño","en_diseno","aprobacion","aprobado"].includes(o.estado||o.stat)).length/total*100);const pPend=Math.round(odtsRol.filter(o=>o.estado==="pendiente"||o.stat==="pendiente").length/total*100);const pRet=Math.max(0,100-pEnt-pProc-pPend);return<><div style={{width:`${pEnt}%`,background:"#00b894",transition:"width .4s"}}/><div style={{width:`${pProc}%`,background:"#0984e3",transition:"width .4s"}}/><div style={{width:`${pPend}%`,background:"#f6a623",transition:"width .4s"}}/><div style={{width:`${pRet}%`,background:"#dc2626",transition:"width .4s"}}/></>;})()}
                  </div>
                  <div style={{display:"flex",gap:14,marginTop:8,flexWrap:"wrap"}}>
                    {[{c:"#00b894",l:"Entregado"},{c:"#0984e3",l:"En proceso"},{c:"#f6a623",l:"Pendiente"},{c:"#dc2626",l:"Con retraso"}].map(x=><span key={x.l} style={{display:"flex",alignItems:"center",gap:5,fontSize:10,color:"#5a7a9a"}}><span style={{width:8,height:8,borderRadius:"50%",background:x.c}}/>{x.l}</span>)}
                  </div>
                </div>
                {odtDashLevelActive==="gerencia"&&<div style={{...SH,padding:16,marginTop:12}}>
                  <div style={{fontWeight:900,fontSize:13,color:"#1a2f4a",textAlign:"center",marginBottom:12}}>JUNIO 2026</div>
                  <div style={{display:"flex",gap:7,flexWrap:"wrap",marginBottom:10}}>
                    <select style={{padding:"7px 10px",borderRadius:9,border:"1px solid #c8d8e8",background:"#fff",fontSize:10,color:"#1a2f4a"}}><option>Todos los responsables</option></select>
                    <select style={{padding:"7px 10px",borderRadius:9,border:"1px solid #c8d8e8",background:"#fff",fontSize:10,color:"#1a2f4a"}}><option>Todos los tipos</option></select>
                    <select style={{padding:"7px 10px",borderRadius:9,border:"1px solid #c8d8e8",background:"#fff",fontSize:10,color:"#1a2f4a"}}><option>Todos los estados</option></select>
                  </div>
                  <div style={{overflowX:"auto",border:"1px solid #e2e8f0",borderRadius:10}}>
                    <div style={{minWidth:900}}>
                      <div style={{display:"grid",gridTemplateColumns:"230px repeat(30,1fr)",background:"#f8fafc",borderBottom:"1px solid #e2e8f0",alignItems:"center"}}>
                        <div style={{padding:"8px 10px",fontSize:9,fontWeight:900,color:"#5a7a9a",textTransform:"uppercase"}}>Actividad</div>
                        {Array.from({length:30},(_,i)=><div key={i} style={{textAlign:"center",fontSize:9,fontWeight:800,color:"#8aaabb"}}>{i+1}</div>)}
                      </div>
                      {odtGanttItems.map(it=>(
                        <div key={it.id} style={{display:"grid",gridTemplateColumns:"230px repeat(30,1fr)",minHeight:40,borderBottom:"1px solid #f5f7fa",alignItems:"center"}}>
                          <div style={{padding:"8px 10px",fontSize:11,fontWeight:800,color:"#1a2f4a",overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{it.titulo}</div>
                          <div style={{gridColumn:`${it.start+1}/${Math.min(it.end+2,32)}`,height:18,borderRadius:18,background:it.color,color:"#fff",fontSize:9,fontWeight:900,display:"flex",alignItems:"center",paddingLeft:9,whiteSpace:"nowrap"}}>{it.label}</div>
                        </div>
                      ))}
                      {odtGanttItems.length===0&&<div style={{padding:18,textAlign:"center",fontSize:11,color:"#8aaabb"}}>Sin ODT visibles para graficar.</div>}
                    </div>
                  </div>
                </div>}
                <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12,marginTop:12}}>
                  <div style={{...SH,padding:16}}>
                    <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:12}}>
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#f6a623" strokeWidth="2"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
                      <span style={{fontWeight:800,fontSize:13,color:"#1a2f4a"}}>Vencen en 7 días</span>
                      <span style={{marginLeft:"auto",padding:"2px 8px",borderRadius:20,background:"#fff8ec",color:"#f6a623",fontWeight:800,fontSize:12}}>{odtsRol.filter(o=>o.fechaEntrega&&!isOdtFinalizada(o)&&new Date(o.fechaEntrega)>=new Date(todayStr())&&new Date(o.fechaEntrega)-new Date(todayStr())<=7*86400000).length}</span>
                    </div>
                    {odtsRol.filter(o=>o.fechaEntrega&&!isOdtFinalizada(o)&&new Date(o.fechaEntrega)>=new Date(todayStr())&&new Date(o.fechaEntrega)-new Date(todayStr())<=7*86400000).slice(0,5).map(o=>(
                      <div key={o.id} style={{display:"flex",alignItems:"center",gap:10,padding:"7px 0",borderBottom:"1px solid #f5f7fa"}}>
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#0984e3" strokeWidth="2"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><path d="M14 2v6h6"/></svg>
                        <span style={{flex:1,fontSize:11,color:"#1a2f4a",fontWeight:600,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{o.titulo}</span>
                        <span style={{padding:"2px 8px",borderRadius:20,background:"#fff8ec",color:"#f6a623",fontWeight:700,fontSize:9,whiteSpace:"nowrap"}}>{Math.ceil((new Date(o.fechaEntrega)-new Date(todayStr()))/86400000)===0?"Hoy":Math.ceil((new Date(o.fechaEntrega)-new Date(todayStr()))/86400000)+"d"}</span>
                      </div>
                    ))}
                    {odtsRol.filter(o=>o.fechaEntrega&&!isOdtFinalizada(o)&&new Date(o.fechaEntrega)>=new Date(todayStr())&&new Date(o.fechaEntrega)-new Date(todayStr())<=7*86400000).length===0&&<div style={{fontSize:11,color:"#b2bec3",textAlign:"center",padding:"16px 0"}}>Sin vencimientos próximos</div>}
                  </div>
                  <div style={{...SH,padding:16}}>
                    <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:12}}>
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#dc2626" strokeWidth="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
                      <span style={{fontWeight:800,fontSize:13,color:"#1a2f4a"}}>Con retraso</span>
                      <span style={{marginLeft:"auto",padding:"2px 8px",borderRadius:20,background:"#ffeae6",color:"#dc2626",fontWeight:800,fontSize:12}}>{odtsRol.filter(o=>o.estado==="retrasado"||(o.fechaEntrega&&todayStr()>o.fechaEntrega&&!isOdtFinalizada(o))).length}</span>
                    </div>
                    {odtsRol.filter(o=>o.estado==="retrasado"||(o.fechaEntrega&&todayStr()>o.fechaEntrega&&!isOdtFinalizada(o))).slice(0,5).map(o=>(
                      <div key={o.id} style={{display:"flex",alignItems:"center",gap:10,padding:"7px 0",borderBottom:"1px solid #f5f7fa"}}>
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#dc2626" strokeWidth="2"><path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"/></svg>
                        <span style={{flex:1,fontSize:11,color:"#1a2f4a",fontWeight:600,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{o.titulo}</span>
                        <span style={{padding:"2px 8px",borderRadius:20,background:"#ffeae6",color:"#dc2626",fontWeight:700,fontSize:9}}>RETRASO</span>
                      </div>
                    ))}
                    {odtsRol.filter(o=>o.estado==="retrasado"||(o.fechaEntrega&&todayStr()>o.fechaEntrega&&!isOdtFinalizada(o))).length===0&&<div style={{fontSize:11,color:"#b2bec3",textAlign:"center",padding:"16px 0"}}>Sin retrasos</div>}
                  </div>
                  <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(260px,1fr))",gap:12,gridColumn:"1/-1"}}>
                    <div style={{...SH,padding:16}}>
                      <div style={{fontWeight:800,fontSize:13,color:"#1a2f4a",marginBottom:12,display:"flex",alignItems:"center",gap:7}}>
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#dc2626" strokeWidth="2"><line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/></svg>
                        Causa raíz detectada
                      </div>
                      {gerenciaCausas.slice(0,5).map(c=>(
                        <div key={c.label} style={{display:"flex",alignItems:"center",gap:10,padding:"7px 0",borderBottom:"1px solid #f5f7fa"}}>
                          <span style={{width:8,height:8,borderRadius:"50%",background:c.color,flexShrink:0}}/>
                          <span style={{flex:1,fontSize:11,fontWeight:700,color:"#1a2f4a"}}>{c.label}</span>
                          <span style={{padding:"2px 8px",borderRadius:20,background:c.color+"18",color:c.color,fontWeight:800,fontSize:10}}>{c.count}</span>
                        </div>
                      ))}
                      {gerenciaCausas.length===0&&<div style={{fontSize:11,color:"#b2bec3",textAlign:"center",padding:"12px 0"}}>Sin patrones suficientes para análisis.</div>}
                    </div>
                    <div style={{...SH,padding:16}}>
                      <div style={{fontWeight:800,fontSize:13,color:"#1a2f4a",marginBottom:12,display:"flex",alignItems:"center",gap:7}}>
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#00b5b4" strokeWidth="2"><line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/></svg>
                        Rendimiento por diseñador
                      </div>
                      {gerenciaDesignerMetrics.map((d,idx)=>{
                        const colors=["#6C6EF5","#0984e3","#00b5b4"];
                        const c=colors[idx%colors.length];
                        return(
                          <div key={d.id||d.nombre} style={{display:"flex",alignItems:"center",gap:12,marginBottom:10}}>
                            <span style={{width:30,height:30,borderRadius:"50%",background:c,display:"grid",placeItems:"center",fontSize:10,fontWeight:800,color:"#fff",flexShrink:0}}>{d.ini}</span>
                            <span style={{width:120,fontSize:11,fontWeight:700,color:"#1a2f4a",overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{d.nombre}</span>
                            <div style={{flex:1,height:7,background:"#f0f4f8",borderRadius:4}}><div style={{width:`${d.pct}%`,height:"100%",background:c,borderRadius:4,transition:"width .4s"}}/></div>
                            <span style={{fontSize:10,fontWeight:800,color:d.retrasos?"#dc2626":c,width:58,textAlign:"right"}}>{d.pct}% · {d.retrasos}r</span>
                          </div>
                        );
                      })}
                      {gerenciaDesignerMetrics.length===0&&<div style={{fontSize:11,color:"#b2bec3",textAlign:"center",padding:"12px 0"}}>Sin diseñadores activos</div>}
                    </div>
                  </div>
                </div>
              </>}
            </>)}
            {/* ET_FIX_VIEW_MODAL_ACTIONS_HEADER_ROW_20260614 */}
            {odtViewModal&&(()=>{
              const detailItems=[
                ["Tipo de trabajo",odtViewModal.tipoTrabajo||odtViewModal.tipo],
                ["Responsable",odtViewModal.dnombre||"Sin asignar"],
                ["Fecha inicio",odtViewModal.fechaInicio],
                ["Fecha entrega",odtViewModal.fechaEntrega],
                ["Hora de corte",odtViewModal.horaCorte],
                ["HH estimadas",odtViewModal.hh?odtViewModal.hh+"h":null],
                ["Prioridad",odtViewModal.prioridad],
                ["Materiales",(odtViewModal.materiales||[]).join(", ")||null],
                ["Medidas",odtViewModal.medidas],
                ["Tonalidad",odtViewModal.tonalidad]
              ];
              const textItems=[
                ["Objetivo y público",odtViewModal.objetivo],
                ["Mensaje principal",odtViewModal.mensaje],
                ["Mecánica / dinámica",odtViewModal.mecanica],
                ["Productos",odtViewModal.productos],
                ["Restricciones",odtViewModal.restricciones],
                ["Comentarios / referencias",odtViewModal.referencias]
              ];
              const viewActionBtn=(label,icon,onClick,bg,border,color="#1a2f4a")=>(
                <button onClick={onClick} style={{display:"flex",alignItems:"center",justifyContent:"center",gap:7,padding:"6px 10px",borderRadius:10,border,background:bg,cursor:"pointer",fontWeight:900,color,fontSize:10.5,whiteSpace:"nowrap",minHeight:32}}>
                  {icon}{label}
                </button>
              );
              return <div style={{position:"fixed",inset:0,background:"rgba(26,47,74,.65)",zIndex:120,display:"flex",alignItems:"flex-start",justifyContent:"center",padding:"6px",overflowY:"auto"}} onClick={()=>setOdtViewModal(null)}>
                <div onClick={e=>e.stopPropagation()} style={{background:"#fff",borderRadius:16,width:"min(640px,calc(100vw - 12px))",marginTop:"clamp(6px,3vh,40px)",marginBottom:"clamp(6px,3vh,40px)",display:"flex",flexDirection:"column",boxShadow:"0 20px 60px rgba(0,0,0,.25)",overflow:"hidden"}}>
                  <div style={{borderBottom:"1px solid #e2e8f0",flexShrink:0,background:"#fff"}}>
                    <div style={{display:"flex",alignItems:"center",gap:8,padding:"6px 10px 5px 10px"}}>
                      <div style={{width:30,height:30,borderRadius:9,background:"linear-gradient(135deg,#6C6EF5,#0984e3)",display:"grid",placeItems:"center",flexShrink:0}}>
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2" strokeLinecap="round"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><path d="M14 2v6h6"/><line x1="8" y1="13" x2="16" y2="13"/><line x1="8" y1="17" x2="12" y2="17"/></svg>
                      </div>
                      <div style={{flex:1,minWidth:0}}>
                        <div style={{fontWeight:900,fontSize:12.5,color:"#1a2f4a",overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{odtViewModal.titulo}</div>
                        <div style={{fontSize:9.5,color:"#8aaabb",marginTop:1,display:"flex",gap:5,flexWrap:"wrap",alignItems:"center"}}>
                          <span>#{odtViewModal.id}</span><span style={{color:"#e2e8f0"}}>·</span><span>{odtViewModal.area||"—"}</span><span style={{color:"#e2e8f0"}}>·</span><span style={{color:odtViewModal.estado==="retrasado"?"#dc2626":isOdtFinalizada(odtViewModal)?"#00b894":"#6C6EF5",fontWeight:800}}>{pillE(odtViewModal.estado).txt||"Pendiente"}</span>
                        </div>
                      </div>
                      <button onClick={()=>setOdtViewModal(null)} style={{width:30,height:30,borderRadius:9,border:"1px solid #e2e8f0",background:"#f8fafc",display:"grid",placeItems:"center",cursor:"pointer",flexShrink:0}}><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#5a7a9a" strokeWidth="2.5" strokeLinecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg></button>
                    </div>
                    <div style={{display:"grid",gridTemplateColumns:canNotifyOdt(odtViewModal)?"1fr 1fr 1fr":"1fr",gap:7,padding:"0 10px 9px 10px"}}>
                      {canNotifyOdt(odtViewModal)&&viewActionBtn("WhatsApp",<svg key="wa" width="16" height="16" viewBox="0 0 24 24" fill="#25D366"><path d="M17.47 14.37c-.3-.15-1.76-.87-2.03-.97-.28-.1-.48-.15-.68.15s-.78.97-.95 1.17c-.18.2-.35.22-.65.07-1.76-.88-2.91-1.57-4.07-3.55-.31-.53.31-.49.89-1.63.1-.2.05-.37-.03-.52-.07-.15-.68-1.64-.94-2.25-.25-.59-.5-.51-.68-.52-.18-.01-.37-.01-.57-.01-.2 0-.52.07-.79.37-.28.3-1.06 1.04-1.06 2.53s1.09 2.94 1.24 3.14c.15.2 2.14 3.27 5.19 4.58 1.93.83 2.69.9 3.66.76.59-.09 1.76-.72 2.01-1.41.25-.7.25-1.29.17-1.41-.07-.13-.27-.2-.57-.35z"/><path d="M12.05 2C6.48 2 2 6.48 2 12.05c0 1.87.5 3.63 1.38 5.14L2 22l4.96-1.3A10.03 10.03 0 0012.05 22C17.62 22 22 17.52 22 11.95 22 6.42 17.62 2 12.05 2zm0 18.15c-1.71 0-3.32-.5-4.67-1.36l-.33-.2-3.44.9.93-3.36-.22-.35A8.09 8.09 0 013.85 12c0-4.52 3.68-8.2 8.2-8.2s8.2 3.68 8.2 8.2-3.68 8.15-8.2 8.15z"/></svg>,()=>{openWhatsOdt(odtViewModal);setOdtViewModal(null);},"#f0faf5","1.5px solid #d4f1e4")}
                      {canNotifyOdt(odtViewModal)&&viewActionBtn("Correo",<svg key="mail" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#0984e3" strokeWidth="2" strokeLinecap="round"><rect x="3" y="5" width="18" height="14" rx="2"/><path d="M3 7l9 6 9-6"/></svg>,()=>{openOutlookOdt(odtViewModal);setOdtViewModal(null);},"#f0f6ff","1.5px solid #c8d8e8")}
                      {(isSolicitante&&isRequesterOdt(odtViewModal)&&!canNotifyOdt(odtViewModal))&&viewActionBtn("Consultar",<svg key="mail2" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#0984e3" strokeWidth="2" strokeLinecap="round"><rect x="3" y="5" width="18" height="14" rx="2"/><path d="M3 7l9 6 9-6"/></svg>,()=>{const mktCoord=usuarios.find(u=>u.area==="marketing"&&(u.rol==="coordinador"||u.rol==="admin")&&u.activo!==false);const toEmail=mktCoord?.email||"marketing@corporacionvega.pe";const subj=`Seguimiento ODT: ${odtViewModal.titulo}`;const body=`Equipo de Marketing,\n\nSolicitamos información sobre el avance de la siguiente orden de trabajo:\n\n${buildOdtMail(odtViewModal)}\n\nQuedo pendiente de su respuesta.\n\nSaludos.`;const url="https://outlook.office365.com/mail/0/deeplink/compose?to="+encodeURIComponent(toEmail)+"&subject="+encodeURIComponent(subj)+"&body="+encodeURIComponent(body);openExternalBlank(url);},"#f0f6ff","1.5px solid #c8d8e8","#0984e3")}
                      {viewActionBtn("Cerrar",<svg key="x" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#5a7a9a" strokeWidth="2.5" strokeLinecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>,()=>setOdtViewModal(null),"#f8fafc","1px solid #e2e8f0","#5a7a9a")}
                    </div>
                  </div>
                  <div style={{padding:"5px 10px 8px 10px"}}>
                    <div style={{display:"flex",alignItems:"center",gap:7,marginBottom:8}}><svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#6C6EF5" strokeWidth="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg><span style={{fontSize:10,fontWeight:900,color:"#6C6EF5",letterSpacing:".05em",textTransform:"uppercase"}}>Detalle del brief</span></div>
                    <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(110px,1fr))",gap:5,marginBottom:6}}>{detailItems.map(([k,v])=>v?(<div key={k} style={{background:"#f8fafc",border:"1px solid #e2e8f0",borderRadius:8,padding:"4px 6px",minWidth:0}}><div style={{fontSize:7,fontWeight:900,color:"#8aaabb",textTransform:"uppercase",letterSpacing:".04em",marginBottom:3}}>{k}</div><div style={{fontSize:9.5,fontWeight:700,color:"#1a2f4a",lineHeight:1.2,overflowWrap:"break-word"}}>{v}</div></div>):null)}</div>
                    {textItems.map(([k,v])=>v?(<div key={k} style={{background:"#f8fafc",border:"1px solid #e2e8f0",borderRadius:8,padding:"5px 8px",marginBottom:4}}><div style={{fontSize:7,fontWeight:900,color:"#8aaabb",textTransform:"uppercase",letterSpacing:".04em",marginBottom:3}}>{k}</div><div style={{fontSize:9.5,color:"#1a2f4a",fontWeight:600,lineHeight:1.3,whiteSpace:"pre-wrap"}}>{v}</div></div>):null)}
                  </div>
                </div>
              </div>;
            })()}
            {/* ET_EDIT_ASSIGN_MODAL_RENDER_20260613_1735 */}

            {odtAssignModal&&canAssignOdt(odtAssignModal)&&(()=>{
              const current=odtAssignModal||{};
              const selectedId=odtAssignModal._newDesignerId||current.disenadorId||"";
              const sel=disenadores.find(d=>String(d.id)===String(selectedId));
              const saveAssign=async()=>{
                if(!sel){showToast("Selecciona un diseñador");return;}
                if(designerBloqueadoAsignacion(sel,current.id)){showToast("Diseñador inhabilitado para asignación: tiene 3 ODT activas.");return;}
                const ini=(sel.nombre||"").split(" ").filter(Boolean).map(w=>w[0]).slice(0,2).join("").toUpperCase();
                const patch={disenadorId:sel.id,dnombre:sel.nombre,demail:sel.email||"",dcel:sel.celular||"",did:ini,colorD:sel.color||current.colorD||"#6C6EF5",asignadoPor:uName||uDni,asignadoEn:new Date().toISOString()};
                await updateOdtInFirestore(current.id,patch);
                setOdtFirestore(prev=>(prev||[]).map(x=>String(x.id)===String(current.id)?calcOdtPlan({...x,...patch}):x));
                setOdtAssignModal(null);
                showToast("ODT reasignada correctamente");
              };
              return <div style={{position:"fixed",inset:0,background:"rgba(26,47,74,.65)",zIndex:124,display:"flex",alignItems:"center",justifyContent:"center",padding:14}}>
                <div style={{background:"#fff",borderRadius:18,width:"min(520px,100%)",boxShadow:"0 18px 60px rgba(0,0,0,.25)",overflow:"hidden"}}>
                  <div style={{padding:"16px 20px",background:"linear-gradient(135deg,#1a2f4a,#0f1f33)",display:"flex",alignItems:"center",justifyContent:"space-between",gap:12}}>
                    <div><div style={{fontSize:15,fontWeight:900,color:"#fff"}}>Asignar ODT</div><div style={{fontSize:11,color:"rgba(255,255,255,.65)",marginTop:3}}>{current.titulo}</div></div>
                    <button onClick={()=>setOdtAssignModal(null)} style={{width:30,height:30,borderRadius:9,border:"1px solid rgba(255,255,255,.15)",background:"rgba(255,255,255,.1)",color:"#fff",cursor:"pointer",fontWeight:900,flexShrink:0}}>×</button>
                  </div>
                  <div style={{padding:20}}>
                    <label style={{...lbl}}>Diseñador responsable</label>
                    <select value={selectedId} onChange={e=>setOdtAssignModal(p=>({...p,_newDesignerId:e.target.value}))} style={{...inp,background:"#fff",marginBottom:14}}>
                      <option value="">Seleccionar diseñador</option>
                      {disenadores.map(d=>{const carga=odtCargaDesigner(d,current.id);const blocked=designerBloqueadoAsignacion(d,current.id);return <option key={d.id} value={d.id} disabled={blocked}>{d.nombre}{blocked?` · Inhabilitado (${carga}/3 activas)`:carga?` · ${carga}/3 activas`:""}</option>;})}
                    </select>
                    {sel&&<div style={{padding:"10px 12px",borderRadius:12,background:"#f0f6ff",border:"1px solid #c8d8e8",fontSize:12,color:"#5a7a9a",marginBottom:16}}>Se asignará a <b style={{color:"#1a2f4a"}}>{sel.nombre}</b>{sel.email?` · ${sel.email}`:""}</div>}
                    <div style={{display:"flex",justifyContent:"flex-end",gap:10}}>
                      <button onClick={()=>setOdtAssignModal(null)} style={{padding:"11px 16px",borderRadius:12,border:"1px solid #e2e8f0",background:"#fff",color:"#5a7a9a",fontWeight:800,cursor:"pointer"}}>Cancelar</button>
                      <button onClick={saveAssign} style={{padding:"11px 18px",borderRadius:12,border:"none",background:"linear-gradient(135deg,#6C6EF5,#0984e3)",color:"#fff",fontWeight:900,cursor:"pointer"}}>Guardar asignación</button>
                    </div>
                  </div>
                </div>
              </div>;
            })()}
            {odtEditModal&&canEditOdt(odtEditModal)&&(()=>{
              const cur=odtEditModal||{};
              const val=(k)=>odtEditForm[k]!==undefined?odtEditForm[k]:(cur[k]??"");
              const setF=(k,v)=>setOdtEditForm(p=>({...p,[k]:v}));
              const saveEdit=async()=>{
                const patch={
                  titulo:String(val("titulo")||"").trim()||cur.titulo,
                  area:val("area")||"Trade Marketing",
                  tipoTrabajo:val("tipoTrabajo")||cur.tipoTrabajo||cur.tipo,
                  tipo:(val("tipoTrabajo")||cur.tipoTrabajo||cur.tipo||"ODT").replace("Material ","").slice(0,8)||"ODT",
                  fechaInicio:val("fechaInicio")||"",
                  fechaEntrega:val("fechaEntrega")||"",
                  entrega:val("fechaEntrega")||"—",
                  horaCorte:val("horaCorte")||"",
                  hh:String((TIPOS_TRABAJO.find(t=>t.label===(val("tipoTrabajo")||cur.tipoTrabajo||cur.tipo))||{}).hh||cur.hh||""),
                  medidas:val("medidas")||"",
                  tonalidad:val("tonalidad")||"",
                  prioridad:val("prioridad")||cur.prioridad||"Normal",
                  objetivo:val("objetivo")||"",
                  mensaje:val("mensaje")||"",
                  mecanica:val("mecanica")||"",
                  productos:val("productos")||"",
                  restricciones:val("restricciones")||"",
                  referencias:val("referencias")||"",
                  editadoPor:uName||uDni,
                  editadoEn:new Date().toISOString()
                };
                const tipoObj=TIPOS_TRABAJO.find(t=>t.label===patch.tipoTrabajo);
                if(tipoObj&&!patch.hh)patch.hh=String(tipoObj.hh||"");
                await updateOdtInFirestore(cur.id,patch);
                setOdtFirestore(prev=>(prev||[]).map(x=>String(x.id)===String(cur.id)?calcOdtPlan({...x,...patch}):x));
                setOdtEditModal(null);setOdtEditForm({});showToast("ODT actualizada correctamente");
              };
              const field=(label,k,type="text")=><div><label style={{...lbl}}>{label}</label>{type==="textarea"?<textarea value={val(k)} onChange={e=>setF(k,e.target.value)} rows={2} style={{...inp,resize:"vertical",minHeight:68}}/>:<input type={type} value={val(k)} onChange={e=>setF(k,e.target.value)} style={{...inp}}/>}</div>;
              return <div style={{position:"fixed",inset:0,background:"rgba(26,47,74,.65)",zIndex:124,display:"flex",alignItems:"center",justifyContent:"center",padding:"clamp(8px,2vw,22px)",overflow:"hidden"}}>
                <div style={{background:"#fff",borderRadius:18,width:"min(860px,calc(100vw - 44px))",maxHeight:"calc(100vh - 44px)",display:"flex",flexDirection:"column",boxShadow:"0 18px 60px rgba(0,0,0,.25)",overflow:"hidden"}}>
                  <div style={{padding:"10px 14px",background:"linear-gradient(135deg,#1a2f4a,#0f1f33)",display:"flex",alignItems:"center",justifyContent:"space-between",gap:10,flexShrink:0,flexWrap:"nowrap"}}>
                    <div style={{minWidth:0}}><div style={{fontSize:14,fontWeight:900,color:"#fff"}}>Editar ODT</div><div style={{fontSize:10,color:"rgba(255,255,255,.65)",marginTop:2,whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis",maxWidth:220}}>{cur.id}</div></div>
                    <div style={{display:"flex",alignItems:"center",gap:8,flexShrink:0}}>
                      <button onClick={()=>{setOdtEditModal(null);setOdtEditForm({});}} style={{padding:"8px 12px",borderRadius:10,border:"1px solid rgba(255,255,255,.18)",background:"rgba(255,255,255,.08)",color:"#fff",fontWeight:800,cursor:"pointer",fontSize:12}}>Cancelar</button>
                      <button onClick={saveEdit} style={{padding:"8px 14px",borderRadius:10,border:"none",background:"linear-gradient(135deg,#00b5b4,#0984e3)",color:"#fff",fontWeight:900,cursor:"pointer",fontSize:12,boxShadow:"0 8px 18px rgba(0,181,180,.22)"}}>Guardar cambios</button>
                      <button onClick={()=>{setOdtEditModal(null);setOdtEditForm({});}} style={{width:30,height:30,borderRadius:9,border:"1px solid rgba(255,255,255,.15)",background:"rgba(255,255,255,.1)",color:"#fff",cursor:"pointer",fontWeight:900,flexShrink:0}}>×</button>
                    </div>
                  </div>
                  <div style={{padding:"14px 16px",overflowY:"auto",minHeight:0,flex:1,paddingBottom:16}}>
                    <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(180px,1fr))",gap:10}}>
                      {field("Título", "titulo")}
                      <div><label style={{...lbl}}>Área</label><select value={val("area")||"Trade Marketing"} onChange={e=>setF("area",e.target.value)} style={{...inp}}><option>Trade Marketing</option><option>Comercial</option><option>Marketing</option><option>Operaciones</option></select></div>
                      <div><label style={{...lbl}}>Tipo de trabajo</label><select value={val("tipoTrabajo")||cur.tipoTrabajo||cur.tipo||""} onChange={e=>setOdtEditForm(p=>({...p,tipoTrabajo:e.target.value}))} style={{...inp}}><option value="">Seleccionar</option>{TIPOS_TRABAJO.map(t=><option key={t.label} value={t.label}>{t.label}</option>)}</select></div>
                      {field("Fecha inicio", "fechaInicio", "date")}
                      {field("Fecha entrega", "fechaEntrega", "date")}
                      {field("Hora de corte", "horaCorte", "time")}
                      {field("Medidas", "medidas")}
                      <div><label style={{...lbl}}>Tonalidad</label><select value={val("tonalidad")} onChange={e=>setF("tonalidad",e.target.value)} style={{...inp}}><option value="">No especificado</option><option>Promocional</option><option>Institucional</option><option>Informativo</option><option>Urgente</option><option>Premium</option></select></div><div><label style={{...lbl}}>Prioridad</label><select value={val("prioridad")||"Normal"} onChange={e=>setF("prioridad",e.target.value)} style={{...inp}}>{ODT_PRIORIDADES.map(p=><option key={p.id} value={p.id}>{p.label}</option>)}</select></div>
                    </div>
                    <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(210px,1fr))",gap:10,marginTop:10}}>
                      {field("Objetivo y público","objetivo","textarea")}
                      {field("Mensaje principal","mensaje","textarea")}
                      {field("Mecánica / dinámica","mecanica","textarea")}
                      {field("Productos","productos","textarea")}
                      {field("Restricciones","restricciones","textarea")}
                      {field("Referencias","referencias","textarea")}
                    </div>
                  </div>
                </div>
              </div>;
            })()}
            {odtCorrectionNotifyModal&&<div style={{position:"fixed",inset:0,background:"rgba(26,47,74,.65)",zIndex:125,display:"flex",alignItems:"center",justifyContent:"center",padding:12}}><div style={{background:"#fff",borderRadius:18,width:"min(560px,96vw)",boxShadow:"0 20px 60px rgba(0,0,0,.25)",overflow:"hidden"}}><div style={{padding:"16px 20px",background:"linear-gradient(135deg,#1a2f4a,#0f1f33)",display:"flex",alignItems:"center",justifyContent:"space-between",gap:12}}><div><div style={{fontWeight:800,fontSize:15,color:"#fff"}}>Notificar corrección al diseñador</div><div style={{fontSize:11,color:"rgba(255,255,255,.55)",marginTop:3}}>{odtCorrectionNotifyModal.disenador?.nombre||"Diseñador"} · {odtCorrectionNotifyModal.disenador?.email||"sin correo"}</div></div><button onClick={()=>setOdtCorrectionNotifyModal(null)} style={{width:34,height:34,borderRadius:9,border:"1px solid rgba(255,255,255,.15)",background:"rgba(255,255,255,.1)",display:"grid",placeItems:"center",cursor:"pointer"}}><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,.8)" strokeWidth="2.5" strokeLinecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg></button></div><div style={{padding:20}}><div style={{background:"#fff8ec",border:"1px solid #f6a62333",borderRadius:12,padding:14,marginBottom:14}}><div style={{fontSize:10,fontWeight:800,color:"#8aaabb",letterSpacing:".05em",textTransform:"uppercase",marginBottom:4}}>ODT en corrección</div><div style={{fontSize:15,fontWeight:800,color:"#1a2f4a"}}>{odtCorrectionNotifyModal.odt?.titulo}</div><div style={{fontSize:12,color:"#5a7a9a",marginTop:6}}>Indica al diseñador por qué no fue aprobada y qué cambios debe realizar.</div></div><label style={lbl}>Motivo predeterminado *</label><select value={ODT_CORRECTION_REASONS.includes(odtCorrectionNote)?odtCorrectionNote:""} onChange={e=>setOdtCorrectionNote(e.target.value)} style={{...inp,marginBottom:10}}><option value="">Seleccionar motivo...</option>{ODT_CORRECTION_REASONS.map(m=><option key={m} value={m}>{m}</option>)}</select><label style={lbl}>Detalle / cambios solicitados *</label><textarea value={odtCorrectionNote} onChange={e=>setOdtCorrectionNote(e.target.value)} placeholder="Agrega detalle específico del ajuste solicitado..." style={{...inp,minHeight:100,resize:"vertical",marginBottom:14}}/><div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10}}><button onClick={async()=>{const nota=(odtCorrectionNote||"").trim();if(!nota){showToast("Agrega el motivo de corrección antes de notificar");return;}const patched={...odtCorrectionNotifyModal.odt,motivoCorreccion:nota};await updateOdtInFirestore(patched.id,{motivoCorreccion:nota,correccionEn:new Date().toISOString(),correccionPor:uName||uDni});openWhatsOdt(patched,"correccion");setOdtCorrectionNotifyModal(null);}} style={{padding:"13px 14px",borderRadius:12,border:"1.5px solid #d4f1e4",background:"#f0faf5",fontWeight:800,color:"#1a2f4a",cursor:"pointer"}}>WhatsApp al diseñador</button><button onClick={async()=>{const nota=(odtCorrectionNote||"").trim();if(!nota){showToast("Agrega el motivo de corrección antes de notificar");return;}const patched={...odtCorrectionNotifyModal.odt,motivoCorreccion:nota};await updateOdtInFirestore(patched.id,{motivoCorreccion:nota,correccionEn:new Date().toISOString(),correccionPor:uName||uDni});openOutlookOdt(patched,"correccion");setOdtCorrectionNotifyModal(null);}} style={{padding:"13px 14px",borderRadius:12,border:"1.5px solid #c8d8e8",background:"#f0f6ff",fontWeight:800,color:"#1a2f4a",cursor:"pointer"}}>Correo al diseñador</button></div><button onClick={()=>setOdtCorrectionNotifyModal(null)} style={{marginTop:12,width:"100%",padding:"9px 10px",borderRadius:10,border:"1px solid #e2e8f0",background:"#fff",fontWeight:800,color:"#5a7a9a",cursor:"pointer"}}>Cerrar sin notificar</button></div></div></div>}
            {odtSolicitanteNotifyModal&&<div style={{position:"fixed",inset:0,background:"rgba(26,47,74,.65)",zIndex:124,display:"flex",alignItems:"center",justifyContent:"center",padding:12}}><div style={{background:"#fff",borderRadius:18,width:"min(520px,96vw)",boxShadow:"0 20px 60px rgba(0,0,0,.25)",overflow:"hidden"}}><div style={{padding:"16px 20px",background:"linear-gradient(135deg,#1a2f4a,#0f1f33)",display:"flex",alignItems:"center",justifyContent:"space-between",gap:12}}><div><div style={{fontWeight:800,fontSize:15,color:"#fff"}}>{odtSolicitanteNotifyModal.modo==="revision"?"Notificar envío a aprobación":"Notificar entrega de ODT"}</div><div style={{fontSize:11,color:"rgba(255,255,255,.55)",marginTop:3}}>{odtSolicitanteNotifyModal.solicitante?.nombre||"Solicitante"} · {odtSolicitanteNotifyModal.solicitante?.email||"sin correo"}</div></div><button onClick={()=>setOdtSolicitanteNotifyModal(null)} style={{width:34,height:34,borderRadius:9,border:"1px solid rgba(255,255,255,.15)",background:"rgba(255,255,255,.1)",display:"grid",placeItems:"center",cursor:"pointer"}}><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,.8)" strokeWidth="2.5" strokeLinecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg></button></div><div style={{padding:20}}><div style={{background:"#f8fafc",border:"1px solid #e2e8f0",borderRadius:12,padding:14,marginBottom:14}}><div style={{fontSize:10,fontWeight:800,color:"#8aaabb",letterSpacing:".05em",textTransform:"uppercase",marginBottom:4}}>ODT</div><div style={{fontSize:15,fontWeight:800,color:"#1a2f4a"}}>{odtSolicitanteNotifyModal.odt?.titulo}</div><div style={{fontSize:12,color:"#5a7a9a",marginTop:6}}>{odtSolicitanteNotifyModal.modo==="revision"?"El diseñador envió la ODT a aprobación.":"El diseñador marcó la ODT como entregada."}</div></div><div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10}}><button onClick={()=>openWhatsOdt(odtSolicitanteNotifyModal.odt,odtSolicitanteNotifyModal.modo)} style={{padding:"13px 14px",borderRadius:12,border:"1.5px solid #d4f1e4",background:"#f0faf5",fontWeight:800,color:"#1a2f4a",cursor:"pointer"}}>WhatsApp al solicitante</button><button onClick={()=>openOutlookOdt(odtSolicitanteNotifyModal.odt,odtSolicitanteNotifyModal.modo)} style={{padding:"13px 14px",borderRadius:12,border:"1.5px solid #c8d8e8",background:"#f0f6ff",fontWeight:800,color:"#1a2f4a",cursor:"pointer"}}>Correo al solicitante</button></div><button onClick={()=>setOdtSolicitanteNotifyModal(null)} style={{marginTop:12,width:"100%",padding:"9px 10px",borderRadius:10,border:"1px solid #e2e8f0",background:"#fff",fontWeight:800,color:"#5a7a9a",cursor:"pointer"}}>Cerrar</button></div></div></div>}
            {odtNotifyModal&&canNotifyOdt(odtNotifyModal.odt)&&<div style={{position:"fixed",inset:0,background:"rgba(26,47,74,.65)",zIndex:123,display:"flex",alignItems:"center",justifyContent:"center",padding:"12px"}}><div style={{background:"#fff",borderRadius:18,width:"min(760px,96vw)",maxHeight:"calc(100vh - 24px)",display:"flex",flexDirection:"column",boxShadow:"0 20px 60px rgba(0,0,0,.25)",overflow:"hidden"}}><div style={{display:"flex",alignItems:"center",gap:12,padding:"16px 20px",borderBottom:"1px solid rgba(255,255,255,.08)",flexShrink:0,background:"linear-gradient(135deg,#1a2f4a,#0f1f33)"}}><div style={{width:44,height:44,borderRadius:"50%",background:"linear-gradient(135deg,#6C6EF5,#0984e3)",display:"grid",placeItems:"center",fontSize:15,fontWeight:800,color:"#fff",flexShrink:0}}>{(odtNotifyModal.disenador?.nombre||"?").split(" ").map(w=>w[0]).slice(0,2).join("").toUpperCase()}</div><div style={{flex:1,minWidth:0}}><div style={{fontWeight:800,fontSize:14,color:"#fff"}}>ODT lista — Notificar a {odtNotifyModal.disenador?.nombre}</div><div style={{fontSize:11,color:"rgba(255,255,255,.5)",marginTop:2}}>{odtNotifyModal.disenador?.email||"Sin correo"} · {getOdtPhone(odtNotifyModal.disenador)||"Sin celular"}</div></div><button onClick={()=>{setOdtNotifyModal(null);setOdtForm({titulo:"",area:"Trade Marketing",tipo:"",materiales:[],tonalidad:"",objetivo:"",mensaje:"",mecanica:"",productos:"",restricciones:"",referencias:"",medidas:"",disenadorId:"",prioridad:"Normal",fechaInicio:"",fechaEntrega:"",horaInicio:"",horaCorte:""});setOdtFormDraft({});setTab(9);}} style={{width:34,height:34,borderRadius:9,border:"1px solid rgba(255,255,255,.15)",background:"rgba(255,255,255,.1)",display:"grid",placeItems:"center",cursor:"pointer",flexShrink:0}}><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,.7)" strokeWidth="2.5" strokeLinecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg></button></div><div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(280px,1fr))",flex:1,overflow:"hidden",minHeight:0}}><div style={{overflowY:"auto",padding:"16px 20px",borderRight:"1px solid #e2e8f0"}}><div style={{display:"flex",alignItems:"center",gap:7,marginBottom:12}}><svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#6C6EF5" strokeWidth="2"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><path d="M14 2v6h6"/></svg><span style={{fontSize:11,fontWeight:800,color:"#6C6EF5",letterSpacing:".05em",textTransform:"uppercase"}}>Brief de la ODT</span></div><div style={{background:"#EEEFFE",borderRadius:10,padding:"10px 14px",marginBottom:12}}><div style={{fontSize:9,fontWeight:800,color:"#8aaabb",textTransform:"uppercase",letterSpacing:".05em",marginBottom:3}}>Título</div><div style={{fontSize:14,fontWeight:800,color:"#1a2f4a"}}>{odtNotifyModal.odt?.titulo}</div></div><div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8,marginBottom:10}}>{[["Tipo",odtNotifyModal.odt?.tipoTrabajo||odtNotifyModal.odt?.tipo],["Área",odtNotifyModal.odt?.area],["F. Entrega",odtNotifyModal.odt?.fechaEntrega],["H. Corte",odtNotifyModal.odt?.horaCorte],["HH",odtNotifyModal.odt?.hh?odtNotifyModal.odt.hh+"h":null],["Materiales",(odtNotifyModal.odt?.materiales||[]).join(", ")||null],["Medidas",odtNotifyModal.odt?.medidas],["Tonalidad",odtNotifyModal.odt?.tonalidad]].map(([k,v])=>v?(<div key={k} style={{background:"#f8fafc",border:"1px solid #e2e8f0",borderRadius:8,padding:"8px 10px"}}><div style={{fontSize:9,fontWeight:800,color:"#8aaabb",textTransform:"uppercase",letterSpacing:".04em",marginBottom:3}}>{k}</div><div style={{fontSize:11,fontWeight:600,color:"#1a2f4a",overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{v}</div></div>):null)}</div>{[["Objetivo y público",odtNotifyModal.odt?.objetivo],["Mensaje principal",odtNotifyModal.odt?.mensaje],["Mecánica / dinámica",odtNotifyModal.odt?.mecanica],["Restricciones",odtNotifyModal.odt?.restricciones]].map(([k,v])=>v?(<div key={k} style={{background:"#f8fafc",border:"1px solid #e2e8f0",borderRadius:8,padding:"10px 12px",marginBottom:6}}><div style={{fontSize:9,fontWeight:800,color:"#8aaabb",textTransform:"uppercase",letterSpacing:".04em",marginBottom:4}}>{k}</div><div style={{fontSize:12,color:"#1a2f4a",lineHeight:1.6,whiteSpace:"pre-wrap"}}>{v}</div></div>):null)}</div><div style={{padding:"20px",display:"flex",flexDirection:"column",gap:12,background:"#f8fafc"}}><div style={{fontSize:13,fontWeight:800,color:"#1a2f4a",marginBottom:2}}>Notificar al diseñador</div><div style={{fontSize:11,color:"#8aaabb",lineHeight:1.6,marginBottom:4}}>Elige el canal. El diseñador recibirá el brief completo de la orden.</div><button onClick={()=>openWhatsOdt({...odtNotifyModal.odt,demail:odtNotifyModal.disenador?.email,dcel:getOdtPhone(odtNotifyModal.disenador)})} style={{display:"flex",alignItems:"center",gap:14,padding:"16px 18px",borderRadius:14,border:"1.5px solid #d4f1e4",background:"#fff",cursor:"pointer",textAlign:"left",width:"100%"}}><svg width="22" height="22" viewBox="0 0 24 24" fill="#25D366"><path d="M17.47 14.37c-.3-.15-1.76-.87-2.03-.97-.28-.1-.48-.15-.68.15s-.78.97-.95 1.17c-.18.2-.35.22-.65.07-1.76-.88-2.91-1.57-4.07-3.55-.31-.53.31-.49.89-1.63.1-.2.05-.37-.03-.52-.07-.15-.68-1.64-.94-2.25-.25-.59-.5-.51-.68-.52-.18-.01-.37-.01-.57-.01-.2 0-.52.07-.79.37-.28.3-1.06 1.04-1.06 2.53s1.09 2.94 1.24 3.14c.15.2 2.14 3.27 5.19 4.58 1.93.83 2.69.9 3.66.76.59-.09 1.76-.72 2.01-1.41.25-.7.25-1.29.17-1.41-.07-.13-.27-.2-.57-.35z"/><path d="M12.05 2C6.48 2 2 6.48 2 12.05c0 1.87.5 3.63 1.38 5.14L2 22l4.96-1.3A10.03 10.03 0 0012.05 22C17.62 22 22 17.52 22 11.95 22 6.42 17.62 2 12.05 2zm0 18.15c-1.71 0-3.32-.5-4.67-1.36l-.33-.2-3.44.9.93-3.36-.22-.35A8.09 8.09 0 013.85 12c0-4.52 3.68-8.2 8.2-8.2s8.2 3.68 8.2 8.2-3.68 8.15-8.2 8.15z"/></svg><div><div style={{fontWeight:800,fontSize:13,color:"#1a2f4a"}}>WhatsApp directo</div><div style={{fontSize:10,color:"#8aaabb",marginTop:2}}>{getOdtPhone(odtNotifyModal.disenador)||"Sin número registrado"}</div></div></button><button onClick={()=>openOutlookOdt({...odtNotifyModal.odt,demail:odtNotifyModal.disenador?.email,dcel:getOdtPhone(odtNotifyModal.disenador)})} style={{display:"flex",alignItems:"center",gap:14,padding:"16px 18px",borderRadius:14,border:"1.5px solid #c8d8e8",background:"#fff",cursor:"pointer",textAlign:"left",width:"100%"}}><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#0984e3" strokeWidth="2" strokeLinecap="round"><rect x="3" y="5" width="18" height="14" rx="2"/><path d="M3 7l9 6 9-6"/></svg><div><div style={{fontWeight:800,fontSize:13,color:"#1a2f4a"}}>Correo electrónico</div><div style={{fontSize:10,color:"#8aaabb",marginTop:2}}>{odtNotifyModal.disenador?.email||"Sin correo registrado"}</div></div></button><div style={{borderTop:"1px solid #e2e8f0",margin:"4px 0"}}/><button onClick={()=>{setOdtNotifyModal(null);setOdtForm({titulo:"",area:"Trade Marketing",tipo:"",materiales:[],tonalidad:"",objetivo:"",mensaje:"",mecanica:"",productos:"",restricciones:"",referencias:"",medidas:"",disenadorId:"",prioridad:"Normal",fechaInicio:"",fechaEntrega:"",horaInicio:"",horaCorte:""});setOdtFormDraft({});setTab(9);}} style={{padding:"14px 18px",borderRadius:14,border:"none",background:"linear-gradient(135deg,#6C6EF5,#1a2f4a)",color:"#fff",fontWeight:800,cursor:"pointer",fontSize:13,display:"flex",alignItems:"center",justifyContent:"center",gap:8}}><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><polyline points="20 6 9 17 4 12"/></svg>Listo — ir al Dashboard</button><div style={{fontSize:10,color:"#b2bec3",textAlign:"center",lineHeight:1.5}}>ODT guardada. Puedes notificar ahora o más tarde desde el Reporte.</div></div></div></div></div>}
          </div>
        );
      })()}
      {modulo===0&&tab===4&&isAuditor&&(
        <>
        {/* Dashboard personal auditor — visible cuando no está en una auditoría activa */}
        {auditPaso===0&&(()=>{
          const misAuditorias=Object.values(auditorias).filter(a=>a.auditorId===uDni&&a.estado==="enviado");
          const hoy7=localDateAdd(todayStr(),-7);
          const esSemana=a=>a.fecha>=hoy7;
          const misSemana=misAuditorias.filter(esSemana);
          const scores=misAuditorias.map(a=>a.scoreFinal).filter(s=>s!==null&&s!==undefined);
          const miProm=scores.length?Math.round(scores.reduce((a,b)=>a+b,0)/scores.length*10)/10:null;
          // Ranking vs otros auditores
          const porAuditor={};
          Object.values(auditorias).filter(a=>a.estado==="enviado"&&a.scoreFinal!==null).forEach(a=>{
            if(!porAuditor[a.auditorId]){porAuditor[a.auditorId]={n:0,sum:0,nombre:a.auditorNombre||a.auditorId};}
            porAuditor[a.auditorId].n++;
            porAuditor[a.auditorId].sum+=a.scoreFinal;
          });
          const ranking=Object.entries(porAuditor).map(([id,v])=>({id,nombre:v.nombre,prom:v.sum/v.n,n:v.n})).sort((a,b)=>b.prom-a.prom);
          const miPos=ranking.findIndex(r=>r.id===uDni)+1;
          return(
          <div style={{padding:"14px 16px",paddingBottom:8}}>
            <div style={{fontWeight:800,fontSize:18,color:"#1a2f4a",marginBottom:14}}>Panel de Avances</div>
            <div style={{display:"grid",gridTemplateColumns:"repeat(2,1fr)",gap:8,marginBottom:14}}>
              {[
                {label:"Visitas esta semana",val:misSemana.length,c:"#0984e3"},
                {label:"Mi score promedio",val:miProm!==null?miProm.toFixed(1)+"%":"S/D",c:miProm>=75?"#00b894":miProm>=60?"#f6a623":"#d63031"},
                {label:"Total visitas",val:misAuditorias.length,c:"#1a2f4a"},
                // Mi ranking eliminado — irrelevante con 1 auditor
              ].map((k,i)=>(
                <div key={i} style={{background:k.c+"12",border:`1px solid ${k.c}33`,borderRadius:10,padding:"12px 14px"}}>
                  <div style={{fontSize:10,color:"#5a7a9a",marginBottom:4}}>{k.label}</div>
                  <div style={{fontSize:22,fontWeight:800,color:k.c,lineHeight:1}}>{k.val}</div>
                </div>
              ))}
            </div>
            {misSemana.length>0&&(
              <div style={{background:"#fff",borderRadius:12,border:"1px solid #e2e8f0",padding:"12px 14px",marginBottom:14}}>
                <div style={{fontWeight:700,fontSize:12,color:"#1a2f4a",marginBottom:8}}>Mis últimas visitas</div>
                {misSemana.slice(0,5).map((a,i)=>{const tr=getTierAuditoria(a.scoreFinal);return(
                  <div key={i} style={{display:"flex",alignItems:"center",justifyContent:"space-between",padding:"6px 0",borderBottom:i<misSemana.length-1?"1px solid #f5f7fa":"none"}}>
                    <div>
                      <div style={{fontWeight:600,fontSize:12,color:"#1a2f4a"}}>Vega {tiendas.find(t=>t.id===a.tiendaId)?.n||a.tiendaNombre}</div>
                      <div style={{fontSize:10,color:"#8aaabb"}}>{a.fecha} · {a.duracionMin?a.duracionMin+" min":""}</div>
                    </div>
                    <span style={{padding:"2px 8px",borderRadius:20,fontSize:11,fontWeight:700,color:tr.c,background:tr.bg}}>{a.scoreFinal?.toFixed(1)}{"% "}{tr.icon}</span>
                  </div>
                );})}
              </div>
            )}

          </div>
          );
        })()}
        <PantallaAuditoria
          paso={auditPaso} tiendas={tiendas} tiendaSelId={auditTiendaSel}
          auditorias={auditorias}
          modulos={(()=>{
            // Usar modulosAud (Firestore) si disponibles y no vacíos; fallback a checklistModulos
            const rutaAct=rutas.find(r=>r.auditorId===uDni&&r.semana===semanaActual&&r.activo!==false);
            const modsFiltrar=rutaAct?.moduloIds?.length?rutaAct.moduloIds:null;
            const fromFirestore=modulosAud.filter(m=>m.activo!==false&&(!modsFiltrar||modsFiltrar.includes(m.id))).map(m=>({
              id:m.id,label:m.nombre,
              escala:m.escala||[0,1.5,3],
              escalaTxt:m.escalaTxt||["No ejecutado","Por mejorar","Correcto"],
              items:(m.tareas||[]).filter(t=>t.activo!==false).map((t,ti)=>({
                id:t.id||`${m.id}_t${ti}`,texto:t.nombre||t.id||`Item ${ti+1}`,activo:true,orden:ti
              })),
              activo:true,
              c:["#6C6EF5","#00b5b4","#534AB7","#854F0B"][modulosAud.indexOf(m)%4]||"#6C6EF5"
            }));
            return fromFirestore.length>0?fromFirestore:checklistModulos;
          })()} respuestas={auditRespuestas} moduloActivo={auditModuloActivo}
          obs={auditObs} compromisos={auditCompromisos} gpsCheckIn={auditGPS}
          onCheckIn={auditCheckIn}
          onValor={(itemId,val)=>setAuditRespuestas(prev=>({...prev,[itemId]:{...prev[itemId],valor:val}}))}
          onObsItem={(itemId,obs)=>setAuditRespuestas(prev=>({...prev,[itemId]:{...prev[itemId],obs}}))}
          onObsModulo={(mId,obs)=>setAuditRespuestas(prev=>({...prev,[`__obs_${mId}`]:{obs}}))}
          onSiguienteModulo={()=>{
            const total=auditModulosActivos.length>0
              ?auditModulosActivos.length
              :checklistModulos.filter(m=>m.activo).length;
            if(auditModuloActivo<total-1) setAuditModuloActivo(p=>p+1);
            else setAuditPaso(2);
          }}
          onAnteriorModulo={()=>setAuditModuloActivo(p=>Math.max(0,p-1))}
          onObs={setAuditObs} onCompromisos={setAuditCompromisos}
          onCheckOut={()=>auditCheckOut("enviado")}
          onBorrador={()=>auditCheckOut("borrador")}
          onCancelar={()=>{setAuditPaso(0);setAuditTiendaSel(null);setAuditRespuestas({});}}
          uName={uName} uDni={uDni} fecha={fecha}
          auditExclusiones={auditExclusiones}
          onSolicitarExclusion={solicitarExclusionAudit}
          isAdmin={isAdmin}
          onGestionarExclusion={gestionarExclusionAudit}
          rutaActiva={(()=>{
            return rutas.find(r=>r.auditorId===uDni&&r.semana===semanaActual&&r.activo!==false)||null;
          })()}
        />
        </>
      )}
      {/* TOAST */}
      {toast&&(
        <div style={{position:"fixed",bottom:24,left:"50%",transform:"translateX(-50%)",background:"#1a2f4a",color:"#fff",padding:"12px 22px",borderRadius:24,fontSize:13,fontWeight:700,zIndex:99,boxShadow:"0 8px 24px rgba(0,0,0,.3)",whiteSpace:"nowrap"}}>
          {toast}
        </div>
      )}
      {/* MODAL EMAIL AUDITORÍA */}
      {auditEmailModal&&(
        <div style={{position:"fixed",inset:0,background:"rgba(26,47,74,.75)",display:"flex",alignItems:"flex-end",justifyContent:"center",zIndex:90,padding:0}}
          onClick={()=>setAuditEmailModal(null)}>
          <div onClick={e=>e.stopPropagation()}
            style={{background:"#fff",borderRadius:"20px 20px 0 0",padding:24,width:"100%",maxWidth:560,boxShadow:"0 -8px 32px rgba(0,0,0,.2)",maxHeight:"90vh",overflowY:"auto"}}>
            <div style={{fontWeight:800,fontSize:16,color:"#1a2f4a",marginBottom:4}}><svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#00b894" strokeWidth="2.5"><polyline points="20 6 9 17 4 12"/></svg> Auditoría enviada</div>
            <div style={{fontSize:12,color:"#8aaabb",marginBottom:16}}>El reporte está listo para enviar por correo a los responsables de la tienda.</div>
            {auditEmailModal.to?(
              <div style={{marginBottom:10,padding:"8px 12px",background:"#e8f4fd",borderRadius:8}}>
                <div style={{fontSize:10,fontWeight:700,color:"#0984e3",marginBottom:2}}>DESTINATARIOS</div>
                <div style={{fontSize:12,color:"#1a2f4a"}}>{auditEmailModal.to}</div>
              </div>
            ):(
              <div style={{marginBottom:10,padding:"8px 12px",background:"#fff8ec",borderRadius:8,border:"1px solid #FAC775"}}>
                <div style={{fontSize:11,color:"#854F0B",display:"flex",alignItems:"center",gap:6}}><svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#f6a623" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M10.3 3.9L1.8 18a2 2 0 001.7 3h17a2 2 0 001.7-3L13.7 3.9a2 2 0 00-3.4 0z"/><path d="M12 9v4"/><path d="M12 17h.01"/></svg>La tienda no tiene email ni jefe zonal configurado. Puedes editar la tienda en Config / Tiendas.</div>
              </div>
            )}
            <div style={{marginBottom:10,padding:"8px 12px",background:"#f8fafc",borderRadius:8}}>
              <div style={{fontSize:10,fontWeight:700,color:"#5a7a9a",marginBottom:2}}>ASUNTO</div>
              <div style={{fontSize:12,color:"#1a2f4a"}}>{auditEmailModal.subject}</div>
            </div>
            <div style={{marginBottom:16,padding:"10px 12px",background:"#f8fafc",borderRadius:8,border:"1px solid #e2e8f0",maxHeight:200,overflowY:"auto"}}>
              <pre style={{fontSize:11,color:"#1a2f4a",whiteSpace:"pre-wrap",fontFamily:"system-ui,sans-serif",margin:0,lineHeight:1.6}}>{auditEmailModal.body}</pre>
            </div>
            {(()=>{
              const esMovil=/Android|iPhone|iPad|iPod|Mobile/i.test(navigator.userAgent||"");

              // ── abrirEmailWeb (lógica Traking.jsx) ──
              const abrirEmailWeb=(to,asunto,cuerpo)=>{
                const cuerpoLimpio=String(cuerpo)
                  .replace(/<br\s*[/]?>/gi,"\n")
                  .replace(/<a[^>]*>([^<]*)<[/]a>/gi,"$1")
                  .replace(/<[^>]+>/g,"")
                  .replace(/&lt;/g,"<").replace(/&gt;/g,">").replace(/&amp;/g,"&");
                // Un solo botón inteligente: siempre abre el cliente web configurado
                // Para Outlook 365 (corporativo) — sin mailto, sin Zoom
                const url="https://outlook.office.com/mail/0/deeplink/compose?to="
                  +encodeURIComponent(to||"")
                  +"&subject="+encodeURIComponent(asunto||"")
                  +"&body="+encodeURIComponent(cuerpoLimpio);
                const win=window.open(url,"_blank","noopener,noreferrer");
                if(!win){
                  const a=document.createElement("a");
                  a.href=url; a.target="_blank"; a.rel="noopener noreferrer";
                  document.body.appendChild(a); a.click();
                  setTimeout(()=>{try{document.body.removeChild(a);}catch{}},300);
                }
              };

              return(
                <div style={{display:"flex",gap:8,flexWrap:"wrap"}}>

                  {/* DESKTOP: Un solo botón "Enviar por correo" → Outlook 365 Web */}
                  {!esMovil&&(
                    <button
                      onClick={()=>{
                        abrirEmailWeb(auditEmailModal.to,auditEmailModal.subject,auditEmailModal.body);
                        setTimeout(()=>setAuditEmailModal(null),500);
                      }}
                      style={{flex:1,minWidth:140,padding:"12px 14px",borderRadius:12,border:"none",
                        background:"linear-gradient(135deg,#0078D4,#1a2f4a)",color:"#fff",
                        fontWeight:800,fontSize:13,cursor:"pointer",
                        display:"flex",alignItems:"center",justifyContent:"center",gap:8}}>
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="#fff" aria-hidden="true">
                        <path d="M20 4H4c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 4l-8 5-8-5V6l8 5 8-5v2z"/>
                      </svg>
                      Enviar por correo
                    </button>
                  )}

                  {/* MÓVIL: mailto nativo + WhatsApp */}
                  {esMovil&&(<>
                    <button
                      onClick={()=>{
                        const cuerpoLimpio=String(auditEmailModal.body)
                          .replace(/<[^>]+>/g,"").replace(/&amp;/g,"&");
                        const a=document.createElement("a");
                        a.href="mailto:"+encodeURIComponent(auditEmailModal.to||"")
                          +"?subject="+encodeURIComponent(auditEmailModal.subject||"")
                          +"&body="+encodeURIComponent(cuerpoLimpio);
                        document.body.appendChild(a); a.click();
                        setTimeout(()=>{try{document.body.removeChild(a);}catch{}},300);
                        setTimeout(()=>setAuditEmailModal(null),600);
                      }}
                      style={{flex:1,padding:"12px",borderRadius:12,border:"none",
                        background:"linear-gradient(135deg,#00b5b4,#1a2f4a)",
                        color:"#fff",fontWeight:800,fontSize:13,cursor:"pointer"}}><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><rect x="3" y="5" width="18" height="14" rx="2"/><path d="M3 7l9 6 9-6"/></svg>
                      Correo
                    </button>
                    <button
                      onClick={()=>{
                        const txt=encodeURIComponent("*"+auditEmailModal.subject+"*\n\n"+auditEmailModal.body.slice(0,900));
                        window.open("https://wa.me/?text="+txt,"_blank","noopener");
                        setTimeout(()=>setAuditEmailModal(null),500);
                      }}
                      style={{padding:"12px 10px",borderRadius:12,border:"1px solid #25D366",
                        background:"#e8fef0",color:"#128C7E",cursor:"pointer",fontSize:13,
                        fontWeight:700,display:"flex",alignItems:"center",gap:5}}>
                      <svg width="15" height="15" viewBox="0 0 24 24" fill="#25D366" aria-hidden="true"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>
                      WhatsApp
                    </button>
                  </>)}

                  {/* Siempre: Copiar + Cerrar */}
                  <button
                    onClick={async()=>{
                      const txt="Para: "+(auditEmailModal.to||"(sin destinatario)")+"\nAsunto: "+auditEmailModal.subject+"\n\n"+auditEmailModal.body;
                      try{await navigator.clipboard.writeText(txt);showToast("Copiado al portapapeles");}
                      catch{window.prompt("Copia:",txt);}
                    }}
                    style={{padding:"12px 14px",borderRadius:12,border:"1px solid #c8d8e8",
                      background:"#f8fafc",color:"#5a7a9a",cursor:"pointer",fontSize:12,fontWeight:700}}>
                    Copiar
                  </button>
                  <button onClick={()=>setAuditEmailModal(null)}
                    style={{padding:"12px 18px",borderRadius:12,border:"1px solid #e2e8f0",
                      background:"#fff",color:"#5a7a9a",cursor:"pointer",fontWeight:700,fontSize:13}}>
                    Cerrar
                  </button>
                </div>
              );
            })()}
          </div>
        </div>
      )}

      {/* MODAL EDITAR TIENDA */}
      {tiendaEditModal&&(
        <TiendaEditModal
          initial={tiendaEditModal}
          usuarios={usuarios}
          S={S}
          onClose={()=>setTiendaEditModal(null)}
          onSave={(draft)=>{
            // FIX_TIENDA_EDIT_LOCAL_DRAFT_20260606: el modal escribe localmente para evitar lag por render global.
            // FIX_SECURITY_INPUT_HARDENING_20260606: payload limpio y validado antes de Firestore.
            const clean=cleanStoreEditDraft(draft);
            const nombreFinal=(clean.n||"").trim().toUpperCase();
            const gerenteFinal=toTitleCase(clean.gerenteTienda);
            const zonalFinal=toTitleCase(clean.jefeZonalNombre);
            const contactosActualizados=(clean.contactosTienda||[]).map(c=>{
              if(c.id==="gerente_tienda") return {...c,nombre:gerenteFinal,dni:clean.dniGerente||c.dni,celular:clean.celular||c.celular,email:clean.emailTienda||c.email,accesoApp:false};
              if(c.id==="jefe_zonal") return {...c,nombre:zonalFinal,email:clean.emailJefeZonal||c.email,accesoApp:false};
              return c;
            });
            if(!contactosActualizados.find(c=>c.id==="gerente_tienda")&&gerenteFinal){
              contactosActualizados.push({id:"gerente_tienda",tipo:"contacto_operativo",cargo:"Gerente de Tienda",nombre:gerenteFinal,dni:clean.dniGerente||"",celular:clean.celular||"",email:clean.emailTienda||"",accesoApp:false,usuarioId:null,activo:true,fuente:"edicion_manual"});
            }
            if(!contactosActualizados.find(c=>c.id==="jefe_zonal")&&zonalFinal){
              contactosActualizados.push({id:"jefe_zonal",tipo:"contacto_operativo",cargo:"Jefe zonal",nombre:zonalFinal,email:clean.emailJefeZonal||"",accesoApp:false,usuarioId:null,activo:true,fuente:"edicion_manual"});
            }
            setTiendas(p=>{
              const np=p.map(x=>x.id!==clean.id?x:{
                ...x,
                n:nombreFinal,
                idTienda:clean.idTienda||x.idTienda,
                email:clean.emailTienda||clean.email||x.email,
                emailTienda:clean.emailTienda||x.emailTienda,
                gerenteTienda:gerenteFinal,
                dniGerente:clean.dniGerente||x.dniGerente||"",
                celular:clean.celular||x.celular||"",
                jefeZonalNombre:zonalFinal,
                emailJefeZonal:clean.emailJefeZonal||x.emailJefeZonal||"",
                usuarioZonalId:clean._zonalUserId&&clean._zonalUserId!=="__manual__"?clean._zonalUserId:(x.usuarioZonalId||null),
                dir:clean.dir||x.dir||"",
                dist:clean.dist||x.dist||"",
                zonaId:clean.zonaId||x.zonaId||x.idZona||"",
                lat:clean.lat===""?x.lat:clean.lat,
                lng:clean.lng===""?x.lng:clean.lng,
                maps:clean.maps||x.maps||x.googleMapsUrl||"",
                googleMapsUrl:clean.maps||x.googleMapsUrl||x.maps||"",
                activa:clean.activa,
                horarioLunJue:clean.horarioLunJue||x.horarioLunJue||"",
                horarioVieSab:clean.horarioVieSab||x.horarioVieSab||"",
                horarioDom:clean.horarioDom||x.horarioDom||"",
                horario:{lunJue:clean.horarioLunJue||x.horarioLunJue||"",vieSab:clean.horarioVieSab||x.horarioVieSab||"",domingo:clean.horarioDom||x.horarioDom||""},
                contactosTienda:contactosActualizados,
                contactoTienda:contactosActualizados.find(c=>c.id==="gerente_tienda")||x.contactoTienda,
                editadoManualmente:true,editadoEn:new Date().toISOString(),
              });
              saveConfig({tiendas:np});return np;
            });
            showToast("Tienda actualizada");
            setTiendaEditModal(null);
          }}
        />
      )}

      {/* MODAL WHATSAPP */}
      {waModal&&(
        <div style={{position:"fixed",inset:0,background:"rgba(26,47,74,.75)",display:"flex",alignItems:"flex-end",justifyContent:"center",zIndex:90}} onClick={()=>setWaModal(null)}>
          <div onClick={e=>e.stopPropagation()} style={{background:"#fff",borderRadius:"20px 20px 0 0",padding:24,width:"100%",maxWidth:520,boxShadow:"0 -8px 32px rgba(0,0,0,.2)"}}>
            <div style={{fontWeight:800,fontSize:15,color:"#1a2f4a",marginBottom:4}}>💬 Mensaje para {waModal.nombre}</div>
            <div style={{fontSize:11,color:"#8aaabb",marginBottom:12}}>Número: +{waModal.numero}</div>
            <textarea readOnly value={waModal.msg} rows={5}
              style={{width:"100%",padding:"10px 12px",borderRadius:9,border:"1px solid #e2e8f0",background:"#f8fafc",color:"#1a2f4a",fontSize:12,resize:"none",boxSizing:"border-box",marginBottom:14}}/>
            <div style={{display:"flex",gap:8}}>
              <button onClick={()=>{navigator.clipboard?.writeText(waModal.msg);showToast("Mensaje copiado");}}
                style={{flex:1,padding:"12px",borderRadius:12,border:"1px solid #e2e8f0",background:"#f8fafc",color:"#5a7a9a",cursor:"pointer",fontWeight:700,fontSize:13}}>
                Copiar mensaje
              </button>
              <a href={`https://wa.me/${waModal.numero}?text=${encodeURIComponent(waModal.msg)}`} target="_blank" rel="noreferrer"
                onClick={()=>setWaModal(null)}
                style={{flex:1,padding:"12px",borderRadius:12,border:"none",background:"#25D366",color:"#fff",cursor:"pointer",fontWeight:800,fontSize:13,textDecoration:"none",textAlign:"center",display:"flex",alignItems:"center",justifyContent:"center",gap:6}}>
                Abrir WhatsApp
              </a>
            </div>
          </div>
        </div>
      )}
      {pinMod&&<PinModal pins={pins} onSave={p=>{setPins(p);saveConfig({pins:p});setPinMod(false);}} onClose={()=>setPinMod(false)}/>}
      {showStatusCard&&(()=>{
        // Issue 4 fix: usar la fecha seleccionada por el auditor, no siempre "hoy"
        const hoy=fecha; // Muestra la fecha seleccionada en el header, no siempre hoy
        const fmts=[
          {fmt:"Mayorista",    icon:<FmtIcon fmt="Mayorista" size={16}/>},
          {fmt:"Supermayorista",icon:<FmtIcon fmt="Supermayorista" size={16}/>},
          {fmt:"Market",       icon:<FmtIcon fmt="Market" size={16}/>},
        ];
        const actsHoy=acts.filter(a=>a.activa&&(a.dias||[]).includes(getDow(hoy)));
        // actsRef debe declararse ANTES de cualquier uso
        const actsConRegHoy=actsHoy.filter(a=>tiAct.some(ti=>{
          const reg=getReg(hoy,ti.id,a.id);
          return reg?.evidencias?.length>0&&!reg?.anulado;
        }));
        const actsRefCard=actsConRegHoy;
        // Filtro de actividad — disponible para todos los roles
        // B17 fix: TDZ resuelto — actsParaStatus sin referencia circular
        const actsParaStatus = statusActFiltro==="Todas"
          ? actsRefCard
          : (actsRefCard.filter(a=>a.id===statusActFiltro).length>0
              ? actsRefCard.filter(a=>a.id===statusActFiltro)
              : actsRefCard);
        // Rangos de corte desde la actividad de referencia (respeta config del Admin)
        const actRefRango = actsParaStatus.length>0 ? getRangoActivo(actsParaStatus[0].id, hoy) : RANGOS_DEFAULT;
        // Cortes de supervisión: configurables por Admin (independientes del puntaje)
        const bloque1Hasta = cortesSupervision.c1 || "08:30";
        const bloque2Hasta = cortesSupervision.c2 || "09:30";
        const bloque2Desde = (()=>{
          const [h,m] = bloque1Hasta.split(":").map(Number);
          const next = h*60+m+1;
          return String(Math.floor(next/60)).padStart(2,"0")+":"+String(next%60).padStart(2,"0");
        })();
        // bloque2Hasta viene de cortesSupervision.c2 (definido arriba)
        const getBloque=(fmtNombre, desdeMin, hastaMin, esCorteFinal=false)=>{
          const ts=tiAct.filter(ti=>ti.f===fmtNombre);
          const excluidasList=ts.filter(ti=>actsParaStatus.length>0&&actsParaStatus.every(a=>isExc(ti.id,a.id,hoy)));
          const disponiblesList=ts.filter(ti=>!(actsParaStatus.length>0&&actsParaStatus.every(a=>isExc(ti.id,a.id,hoy))));
          const registradas=disponiblesList.filter(ti=>{
            return actsParaStatus.some(a=>{
              const reg=getReg(hoy,ti.id,a.id);
              if(!reg||!reg.evidencias||reg.anulado) return false;
              const hora=primerEnvio(reg.evidencias);
              if(!hora) return false;
              const m=toMin(hora);
              return esCorteFinal ? m>=desdeMin : (m>=desdeMin&&m<=hastaMin);
            });
          });
          let horaMin=null, horaMax=null;
          disponiblesList.forEach(ti=>{
            actsParaStatus.forEach(a=>{
              const reg=getReg(hoy,ti.id,a.id);
              if(!reg||!reg.evidencias||reg.anulado) return;
              const hora=primerEnvio(reg.evidencias);
              if(!hora) return;
              const m=toMin(hora);
              const enBloque = esCorteFinal ? m>=desdeMin : (m>=desdeMin&&m<=hastaMin);
              if(enBloque){
                if(!horaMin||m<toMin(horaMin)) horaMin=hora;
                if(!horaMax||m>toMin(horaMax)) horaMax=hora;
              }
            });
          });
          const sinRegistroHoy = esCorteFinal
            ? disponiblesList.filter(ti=>!actsParaStatus.some(a=>{
                const reg=getReg(hoy,ti.id,a.id);
                return reg?.evidencias?.length>0&&!reg?.anulado;
              }))
            : [];
          const pendientes = esCorteFinal ? sinRegistroHoy.length : disponiblesList.length-registradas.length;
          return {total:ts.length,disponibles:disponiblesList.length,registradas:registradas.length,pendientes,excluidas:excluidasList.length,horaMin,horaMax};
        };
        const b1Min=toMin("00:00"), b1Max=toMin(bloque1Hasta);
        const b2Min=toMin(bloque2Desde), b2Max=toMin(bloque2Hasta);
        const totalTiendas=tiAct.length;
        // N/A: tiendas excluidas para TODAS las actividades de referencia
        const totalNA=tiAct.filter(ti=>actsParaStatus.length>0&&actsParaStatus.every(a=>isExc(ti.id,a.id,hoy))).length;
        const totalDisp=totalTiendas-totalNA;
        // Registradas: tienen evidencia válida hoy en alguna actividad de referencia
        const totalReg=tiAct.filter(ti=>
          !actsParaStatus.every(a=>isExc(ti.id,a.id,hoy)) &&
          actsParaStatus.some(a=>{
            const reg=getReg(hoy,ti.id,a.id);
            return reg?.evidencias?.length>0&&!reg?.anulado;
          })
        ).length;
        const totalPend=totalDisp-totalReg;
        const nowTime=statusNowTime;
        // Corte 2 solo aparece si: hora actual > cierre Corte 1 Y hay actividades hoy
        const esBloque2=toMin(nowTime)>b1Max && actsHoy.length>0;
        return(
        <div style={{position:"fixed",inset:0,background:"rgba(26,47,74,.75)",display:"flex",alignItems:"flex-start",justifyContent:"center",zIndex:70,backdropFilter:"blur(4px)",padding:"clamp(6px,2vw,14px)",paddingTop:"clamp(56px,8vw,72px)",overflowY:"auto"}}
          onClick={()=>setShowStatusCard(false)}>
          <div ref={statusCardRef} onClick={e=>e.stopPropagation()}
            style={{fontFamily:"'DM Sans',system-ui,sans-serif",background:"#fff",borderRadius:20,padding:"clamp(14px,2.5vw,22px)",width:"100%",maxWidth:680,boxShadow:"0 24px 60px rgba(0,0,0,.3)",marginBottom:16}}>

            {/* Header con toggle de vista — solo Admin ve el toggle */}
            <div style={{display:"flex",alignItems:"flex-start",justifyContent:"space-between",marginBottom:8}}>
              <div style={{display:"flex",alignItems:"flex-start",gap:10}}>
                <span style={{display:"flex",alignItems:"center",marginTop:2,flexShrink:0}}>
                  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#6C6EF5" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                    <path d="M22 19a2 2 0 01-2 2H4a2 2 0 01-2-2V5a2 2 0 012-2h5l2 3h9a2 2 0 012 2z"/>
                    <line x1="12" y1="11" x2="12" y2="17"/><line x1="9" y1="14" x2="15" y2="14"/>
                  </svg>
                </span>
                <div>
                  <div style={{fontFamily:BRAND_FONT,fontWeight:800,fontSize:"clamp(11px,2vw,14px)",color:"#1a2f4a",letterSpacing:".02em",lineHeight:1.1}}>Estado de Registros</div>
                  <div style={{fontSize:"clamp(10px,1.8vw,12px)",color:"#8aaabb",marginTop:3,fontWeight:500}}>{hoy} · {nowTime} hrs</div>
                </div>
              </div>
              <div style={{display:"flex",gap:6,alignItems:"center",flexShrink:0}}>
                {isAdmin&&(
                  <>
                    <button onClick={()=>setStatusCardView("gerencial")}
                      style={{padding:"4px 12px",borderRadius:20,border:"none",background:statusCardView==="gerencial"?"#1a2f4a":"#f0f4f8",color:statusCardView==="gerencial"?"#fff":"#5a7a9a",fontSize:11,fontWeight:700,cursor:"pointer",whiteSpace:"nowrap"}}>
                      👁 Gerencial
                    </button>
                    <button onClick={()=>setStatusCardView("operativo")}
                      style={{padding:"4px 12px",borderRadius:20,border:"0.5px solid #e2e8f0",background:statusCardView==="operativo"?"#f0f4f8":"transparent",color:statusCardView==="operativo"?"#1a2f4a":"#8aaabb",fontSize:11,fontWeight:700,cursor:"pointer",whiteSpace:"nowrap"}}>
                      Operativo
                    </button>
                  </>
                )}
                <button onClick={()=>setShowStatusCard(false)}
                  style={{background:"#f0f4f8",border:"none",width:32,height:32,borderRadius:"50%",fontSize:14,color:"#5a7a9a",cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",fontWeight:700,flexShrink:0}}>✕</button>
              </div>
            </div>

            {/* Filtro de actividad — todos los roles */}
            {actsRefCard.length>1&&(
              <div style={{display:"flex",gap:6,flexWrap:"wrap",marginBottom:10,padding:"6px 0",borderBottom:"1px solid #f0f4f8"}}>
                <button onClick={()=>setStatusActFiltro("Todas")}
                  style={{padding:"3px 10px",borderRadius:12,border:`1px solid ${statusActFiltro==="Todas"?"#00b5b4":"#e2e8f0"}`,background:statusActFiltro==="Todas"?"#e0fafa":"#fff",color:statusActFiltro==="Todas"?"#0d7a79":"#5a7a9a",fontSize:10,fontWeight:700,cursor:"pointer"}}>
                  Todas
                </button>
                {actsRefCard.map(a=>(
                  <button key={a.id} onClick={()=>setStatusActFiltro(a.id)}
                    style={{padding:"3px 10px",borderRadius:12,border:`1px solid ${statusActFiltro===a.id?a.c:"#e2e8f0"}`,background:statusActFiltro===a.id?"#f0edff":"#fff",color:statusActFiltro===a.id?a.c:"#5a7a9a",fontSize:10,fontWeight:700,cursor:"pointer"}}>
                    {a.e} {a.n}
                  </button>
                ))}
              </div>
            )}

            {/* ── SIN REGISTROS AÚN ── */}
            {actsRefCard.length===0&&(
              <div style={{textAlign:"center",padding:"28px 16px",background:"#fff8e1",borderRadius:12,border:"1px solid #fde68a",margin:"8px 0"}}>
                <div style={{marginBottom:8,display:"flex",justifyContent:"center"}}><IcoPending size={40} color={"#b2bec3"}/></div>
                <div style={{fontWeight:700,fontSize:14,color:"#92400e",marginBottom:4}}>Sin registros para {hoy===todayStr()?"hoy":hoy}</div>
                <div style={{fontSize:12,color:"#a16207"}}>{hoy===todayStr()?"Las actividades aparecerán aquí cuando se realice el primer registro del día":"No hubo registros en esta fecha"}</div>
              </div>
            )}

            {/* ── VISTA GERENCIAL ── */}
            {actsRefCard.length>0&&statusCardView==="gerencial"&&isAdmin&&(()=>{
              // Actividad con registros hoy
              const actHoyLabel=actsParaStatus.length>0?actsParaStatus[0]:null;
              // KPI 1: cumplimiento hoy = registradas / disponibles
              const cumplHoy=totalDisp>0?Math.round((totalReg/totalDisp)*100):0;
              // KPI 2: registradas en Corte 1 (ORO) = registradas con hora <= bloque1Hasta
              const regC1=tiAct.filter(ti=>!actsParaStatus.every(a=>isExc(ti.id,a.id,hoy))&&actsParaStatus.some(a=>{
                const reg=getReg(hoy,ti.id,a.id);
                if(!reg?.evidencias?.length||reg?.anulado) return false;
                return toMin(primerEnvio(reg.evidencias))<=b1Max;
              })).length;
              const pctC1=totalDisp>0?Math.round((regC1/totalDisp)*100):0;
              // KPI 3: tardíos rescatados = registradas en Corte 2
              const regC2=totalReg-regC1;
              const pctC2=totalDisp>0?Math.round((regC2/totalDisp)*100):0;
              // KPI 4: sin registrar
              const pctSin=totalDisp>0?Math.round(((totalDisp-totalReg)/totalDisp)*100):0;
              // FIX: localDateAdd evita UTC midnight parse bug en new Date("YYYY-MM-DD")
              const semAntStr=localDateAdd(hoy, -7);
              const totalDispSA=tiAct.filter(ti=>!actsParaStatus.every(a=>isExc(ti.id,a.id,semAntStr))).length;
              const totalRegSA=tiAct.filter(ti=>
                !actsParaStatus.every(a=>isExc(ti.id,a.id,semAntStr))&&
                actsParaStatus.some(a=>{const r=getReg(semAntStr,ti.id,a.id);return r?.evidencias?.length>0&&!r?.anulado;})
              ).length;
              const cumplSA=totalDispSA>0?Math.round((totalRegSA/totalDispSA)*100):null;
              const deltaCumpl=cumplSA!==null?cumplHoy-cumplSA:null;
              // Cumplimiento y delta por formato
              const fmtStats=fmts.map(({fmt,icon})=>{
                const tsFmt=tiAct.filter(ti=>ti.f===fmt);
                const dispFmt=tsFmt.filter(ti=>!actsParaStatus.every(a=>isExc(ti.id,a.id,hoy))).length;
                const regFmt=tsFmt.filter(ti=>!actsParaStatus.every(a=>isExc(ti.id,a.id,hoy))&&actsParaStatus.some(a=>{
                  const r=getReg(hoy,ti.id,a.id);return r?.evidencias?.length>0&&!r?.anulado;
                })).length;
                const pctFmt=dispFmt>0?Math.round((regFmt/dispFmt)*100):null;
                // Delta vs semana anterior para este formato
                const dispFmtSA=tsFmt.filter(ti=>!actsParaStatus.every(a=>isExc(ti.id,a.id,semAntStr))).length;
                const regFmtSA=tsFmt.filter(ti=>!actsParaStatus.every(a=>isExc(ti.id,a.id,semAntStr))&&actsParaStatus.some(a=>{
                  const r=getReg(semAntStr,ti.id,a.id);return r?.evidencias?.length>0&&!r?.anulado;
                })).length;
                const pctFmtSA=dispFmtSA>0?Math.round((regFmtSA/dispFmtSA)*100):null;
                const delta=pctFmt!==null&&pctFmtSA!==null?pctFmt-pctFmtSA:null;
                const pendFmt=dispFmt-regFmt;
                return {fmt,icon,dispFmt,regFmt,pctFmt,delta,pendFmt};
              });
              // Formato con mayor riesgo
              const fmtRiesgo=[...fmtStats].sort((a,b)=>b.pendFmt-a.pendFmt)[0];
              // FIX: localDateAdd+getDow evita UTC midnight parse bug
              const DIAS_GER=["domingo","lunes","martes","miércoles","jueves","viernes","sábado"];
              const diaSemAntG=DIAS_GER[getDow(localDateAdd(hoy,-7))];
              return(
              <>
                {/* Actividad */}
                {actHoyLabel&&(
                  <div style={{display:"inline-flex",alignItems:"center",gap:6,background:"#e8f4fd",borderRadius:8,padding:"5px 12px",marginBottom:14}}>
                    <span style={{fontSize:14}}>{actHoyLabel.e}</span>
                    <span style={{fontSize:12,color:"#0C447C",fontWeight:700}}>{actHoyLabel.n}</span>
                  </div>
                )}
                {/* 4 KPIs */}
                <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(120px,1fr))",gap:8,marginBottom:16}}>
                  {[
                    {label:"Cumplimiento hoy",value:cumplHoy+"%",color:"#0F6E56",sub:deltaCumpl===null?"sin comparativa":deltaCumpl===0?`→ igual que el ${diaSemAntG} pasado`:deltaCumpl>0?`▲ ${deltaCumpl}pts vs ${diaSemAntG} pasado`:`▼ ${Math.abs(deltaCumpl)}pts vs ${diaSemAntG} pasado`},
                    {label:"Registros en ORO",value:pctC1+"%",color:"#BA7517",sub:`antes de ${bloque1Hasta}`},
                    {label:"Tardíos rescatados",value:pctC2+"%",color:"#185FA5",sub:`${bloque2Desde} – ${bloque2Hasta}`},
                    {label:"Sin registrar",value:pctSin+"%",color:pctSin>15?"#A32D2D":"#888780",sub:pctSin>0?`${totalDisp-totalReg} tienda${totalDisp-totalReg>1?"s":""}`:pctSin>15?"▼ alto":"✓ dentro del rango"},
                  ].map((k,i)=>(
                    <div key={i} style={{background:"#f8fafc",borderRadius:10,padding:"10px 12px",border:"0.5px solid #e2e8f0"}}>
                      <div style={{fontSize:10,color:"#8aaabb",marginBottom:4,fontWeight:500}}>{k.label}</div>
                      <div style={{fontSize:20,fontWeight:800,color:k.color,lineHeight:1}}>{k.value}</div>
                      <div style={{fontSize:9,color:k.color,marginTop:3,fontWeight:500}}>{k.sub}</div>
                    </div>
                  ))}
                </div>
                {/* Barras por formato */}
                <div style={{fontSize:10,fontWeight:700,color:"#5a7a9a",letterSpacing:".05em",marginBottom:10}}>CUMPLIMIENTO POR FORMATO</div>
                {fmtStats.map(({fmt,icon,pctFmt,delta,pendFmt})=>(
                  <div key={fmt} style={{display:"flex",alignItems:"center",gap:8,padding:"8px 10px",background:"#f8fafc",borderRadius:10,border:"0.5px solid #e2e8f0",marginBottom:8,flexWrap:"wrap"}}>
                    <span style={{flexShrink:0,display:"flex",alignItems:"center"}}>{icon}</span>
                    <span style={{fontWeight:700,color:"#1a2f4a",fontSize:13,minWidth:100,flexShrink:0}}>{fmt}</span>
                    <div style={{flex:1,background:"#e9eef5",borderRadius:20,height:8,overflow:"hidden",minWidth:60}}>
                      <div style={{height:"100%",width:(pctFmt||0)+"%",background:"#BA7517",borderRadius:20,transition:"width .4s"}}/>
                    </div>
                    <span style={{fontSize:13,fontWeight:700,color:pctFmt>=80?"#0F6E56":pctFmt>=60?"#BA7517":"#A32D2D",minWidth:36,textAlign:"right",flexShrink:0}}>{pctFmt!==null?pctFmt+"%":"—"}</span>
                    {delta!==null&&(
                      <span style={{padding:"2px 8px",borderRadius:20,fontSize:11,fontWeight:700,
                        color:delta>0?"#0F6E56":delta<0?"#A32D2D":"#888780",
                        background:delta>0?"#E1F5EE":delta<0?"#FCEBEB":"#F1EFE8",
                        whiteSpace:"nowrap",flexShrink:0}}>
                        {delta>0?"▲":"▼"} {Math.abs(delta)}pts{delta<-3?" · riesgo":""}
                      </span>
                    )}
                  </div>
                ))}
                {/* Alerta de formato */}
                {fmtRiesgo&&fmtRiesgo.pendFmt>0&&(
                  <div style={{marginTop:10,padding:"10px 12px",background:"#FAEEDA",borderRadius:10,border:"0.5px solid #FAC775"}}>
                    <div style={{fontSize:11,fontWeight:700,color:"#633806",marginBottom:2}}>⚠️ Alerta de formato</div>
                    <div style={{fontSize:11,color:"#854F0B",lineHeight:1.5}}>
                      {fmtRiesgo.fmt} tiene {fmtRiesgo.pendFmt} tienda{fmtRiesgo.pendFmt>1?"s":""} sin registrar
                      {fmtRiesgo.pendFmt>0&&fmtStats.find(f=>f.fmt===fmtRiesgo.fmt)?.delta<-3?" — tendencia negativa respecto al mismo día de la semana pasada":""}.
                      {" "}Formato con mayor riesgo del día.
                    </div>
                  </div>
                )}
              </>
              );
            })()}

            {/* ── VISTA OPERATIVA ── */}
            {actsRefCard.length>0&&statusCardView==="operativo"&&<>
            {/* ── Actividades con registros hoy — detecta A/B automáticamente ── */}
            {(()=>{
              const actsConRegHoy=actsHoy.filter(a=>tiAct.some(ti=>{
                const reg=getReg(hoy,ti.id,a.id);
                return reg?.evidencias?.length>0&&!reg?.anulado;
              }));
              const esParalelo=actsConRegHoy.length>1; // Escenario B
              if(actsConRegHoy.length===0) return null;
              return(
                <div style={{display:"flex",gap:6,flexWrap:"wrap",marginBottom:12}}>
                  {actsConRegHoy.map(a=>{
                    const rango=getRangoActivo(a.id,hoy);
                    const esAdHoc=a.cat&&a.cat!=="Always On";
                    return(
                      <div key={a.id} style={{display:"inline-flex",alignItems:"center",gap:6,
                        background:esAdHoc?"#EAF3DE":"#E6F1FB",
                        borderRadius:8,padding:"4px 12px"}}>
                        <span style={{fontSize:13}}>{a.e}</span>
                        <span style={{fontSize:12,color:esAdHoc?"#27500A":"#0C447C",fontWeight:700}}>{a.n}</span>
                        <span style={{fontSize:9,fontWeight:600,padding:"1px 6px",borderRadius:4,
                          background:esAdHoc?"#C0DD97":"#B5D4F4",
                          color:esAdHoc?"#27500A":"#0C447C"}}>
                          {esAdHoc?"Ad-hoc":"Always On"} · hasta {rango.c100||"08:00"}
                        </span>
                      </div>
                    );
                  })}
                  {esParalelo&&<span style={{fontSize:9,color:"#854F0B",fontWeight:600,alignSelf:"center",padding:"2px 6px",background:"#FAEEDA",borderRadius:4}}>vista integrada</span>}
                </div>
              );
            })()}

            {/* Totales */}
            <div style={{display:"flex",gap:"clamp(4px,1.5vw,6px)",flexWrap:"wrap",marginBottom:14,padding:"clamp(8px,2vw,12px)",background:"#f8fafc",borderRadius:10,border:"1px solid #e2e8f0",alignItems:"center"}}>
              <span style={{fontSize:"clamp(10px,2.8vw,12px)",color:"#5a7a9a",fontWeight:600}}>Total {totalTiendas}</span>
              <span style={{fontSize:10,color:"#c8d8e8"}}>·</span>
              <span style={{fontSize:"clamp(10px,2.8vw,12px)",color:"#1a2f4a",fontWeight:700}}>{totalDisp} disponibles</span>
              <span style={{padding:"2px 8px",borderRadius:20,fontSize:"clamp(10px,2.8vw,12px)",fontWeight:700,color:"#00b894",background:"#e8faf5",whiteSpace:"nowrap"}}>✅ {totalReg} registradas</span>
              <span style={{padding:"2px 8px",borderRadius:20,fontSize:"clamp(10px,2.8vw,12px)",fontWeight:700,color:totalPend>0?"#0984e3":"#b2bec3",background:totalPend>0?"#e8f4fd":"#f4f6f8",whiteSpace:"nowrap"}}><IcoPending size={11} color={totalPend>0?"#0984e3":"#b2bec3"}/> {totalPend} pendientes</span>
              {totalNA>0&&<span style={{padding:"2px 8px",borderRadius:20,fontSize:"clamp(10px,2.8vw,12px)",fontWeight:700,color:"#854F0B",background:"#FAEEDA",whiteSpace:"nowrap"}}>⛔ {totalNA} excluidas</span>}
            </div>

            {/* Corte 1 — rango dinámico según actividad de referencia */}
            <div style={{marginBottom:14}}>
              <div style={{fontSize:"clamp(9px,2.5vw,11px)",fontWeight:700,color:"#BA7517",letterSpacing:".06em",marginBottom:10,display:"flex",alignItems:"center",gap:6}}>
                <span style={{width:8,height:8,borderRadius:"50%",background:"#BA7517",display:"inline-block",flexShrink:0}}/>
                CORTE 1 · hasta las {bloque1Hasta} · ORO
              </div>
              {fmts.map(({fmt,icon})=>{
                const b=getBloque(fmt,b1Min,b1Max);
                if(b.total===0) return null;
                // Para escenario B: usar actsParaStatus (respeta filtro de actividad seleccionado)
                const esParalelo=actsParaStatus.length>1;
                return(
                <div key={fmt+"b1"} style={{marginBottom:8,padding:"8px 12px",background:"#FFF8EC",borderRadius:10,border:"0.5px solid #FAC775"}}>
                  <div style={{display:"flex",alignItems:"center",gap:6,flexWrap:"wrap"}}>
                    <div style={{display:"flex",alignItems:"center",gap:4,flexShrink:0}}>
                      <span style={{display:"flex",alignItems:"center"}}>{icon}</span>
                      <span style={{fontWeight:700,color:"#1a2f4a",fontSize:"clamp(11px,2vw,13px)",whiteSpace:"nowrap"}}>{fmt}</span>
                      <span style={{fontSize:"clamp(9px,1.5vw,11px)",color:"#8aaabb",fontWeight:700}}>{b.total}</span>
                    </div>
                    <span style={{fontSize:"clamp(9px,1.5vw,11px)",color:"#5a7a9a",fontWeight:500,whiteSpace:"nowrap"}}>{b.disponibles} disp.</span>
                    {!esParalelo&&<>
                      <span style={{padding:"2px 8px",borderRadius:20,fontSize:"clamp(9px,1.6vw,11px)",fontWeight:700,color:"#0F6E56",background:"#E1F5EE",whiteSpace:"nowrap",flexShrink:0}}>✅ {String(b.registradas).padStart(2,"0")} reg.</span>
                      {b.horaMin&&<span style={{fontSize:"clamp(9px,1.5vw,11px)",color:"#8aaabb",fontWeight:500,whiteSpace:"nowrap",flexShrink:0}}>({b.horaMin}{b.horaMax&&b.horaMax!==b.horaMin?` a ${b.horaMax}`:""})</span>}
                      <span style={{padding:"2px 8px",borderRadius:20,fontSize:"clamp(9px,1.6vw,11px)",fontWeight:700,color:b.pendientes>0?"#0984e3":"#888780",background:b.pendientes>0?"#e8f4fd":"#F1EFE8",whiteSpace:"nowrap",flexShrink:0}}>⏰ {String(b.pendientes).padStart(2,"0")} pend.</span>
                      {b.excluidas>0&&<span style={{padding:"2px 8px",borderRadius:20,fontSize:"clamp(9px,1.6vw,11px)",fontWeight:700,color:"#854F0B",background:"#FAEEDA",whiteSpace:"nowrap",flexShrink:0}}>⛔ {b.excluidas}</span>}
                    </>}
                    {/* Escenario B — pills separados por actividad */}
                    {esParalelo&&actsParaStatus.map(a=>{
                      const tsFmt=tiAct.filter(ti=>ti.f===fmt&&!actsParaStatus.every(aa=>isExc(ti.id,aa.id,hoy)));
                      const regA=tsFmt.filter(ti=>{
                        const reg=getReg(hoy,ti.id,a.id);
                        if(!reg?.evidencias||reg.anulado) return false;
                        return toMin(primerEnvio(reg.evidencias))<=b1Max;
                      }).length;
                      const pendA=tsFmt.length-regA;
                      const esAdHoc=a.cat&&a.cat!=="Always On";
                      return(
                        <span key={a.id} style={{padding:"2px 8px",borderRadius:20,fontSize:"clamp(9px,1.6vw,11px)",fontWeight:700,
                          color:esAdHoc?"#27500A":"#0F6E56",
                          background:esAdHoc?"#EAF3DE":"#E1F5EE",
                          whiteSpace:"nowrap",flexShrink:0}}>
                          {a.e} {String(regA).padStart(2,"0")} reg.{pendA>0?` · ${String(pendA).padStart(2,"0")} pend.`:""}
                        </span>
                      );
                    })}
                  </div>
                </div>
                );
              })}
            </div>

            {/* Corte 2 — aparece automáticamente después del cierre del Corte 1 */}
            {esBloque2&&(
            <div style={{borderTop:"1px dashed #e2e8f0",paddingTop:12}}>
              <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:10,flexWrap:"wrap",gap:6}}>
                <div style={{fontSize:"clamp(9px,2.5vw,11px)",fontWeight:700,color:"#185FA5",letterSpacing:".06em",display:"flex",alignItems:"center",gap:6}}>
                  <span style={{width:8,height:8,borderRadius:"50%",background:"#185FA5",display:"inline-block",flexShrink:0}}/>
                  CORTE 2 · {bloque2Desde} a {bloque2Hasta} · PLATA
                </div>
                <span style={{padding:"3px 10px",borderRadius:20,fontSize:"clamp(9px,1.6vw,11px)",fontWeight:700,color:"#A32D2D",background:"#FCEBEB",border:"1px solid #F7C1C1",whiteSpace:"nowrap"}}>⚠️ Puntaje reducido</span>
              </div>
              {fmts.map(({fmt,icon})=>{
                const b=getBloque(fmt,b2Min,b2Max,true);
                if(b.disponibles===0) return null;
                const esParalelo=actsParaStatus.length>1;
                return(
                <div key={fmt+"b2"} style={{marginBottom:8,padding:"8px 12px",background:"#FFF8F8",borderRadius:10,border:"0.5px solid #F7C1C1"}}>
                  <div style={{display:"flex",alignItems:"center",gap:6,flexWrap:"wrap"}}>
                    <div style={{display:"flex",alignItems:"center",gap:4,flexShrink:0}}>
                      <span style={{display:"flex",alignItems:"center"}}>{icon}</span>
                      <span style={{fontWeight:700,color:"#1a2f4a",fontSize:"clamp(11px,2vw,13px)",whiteSpace:"nowrap"}}>{fmt}</span>
                    </div>
                    {!esParalelo&&<>
                      <span style={{padding:"2px 8px",borderRadius:20,fontSize:"clamp(9px,1.6vw,11px)",fontWeight:700,color:"#74b9ff",background:"#e8f4fd",whiteSpace:"nowrap",flexShrink:0}}>✅ {String(b.registradas).padStart(2,"0")} reg.</span>
                      {b.horaMin&&<span style={{fontSize:"clamp(9px,1.5vw,11px)",color:"#8aaabb",fontWeight:500,whiteSpace:"nowrap",flexShrink:0}}>({b.horaMin}{b.horaMax&&b.horaMax!==b.horaMin?` a ${b.horaMax}`:""})</span>}
                      <span style={{padding:"2px 8px",borderRadius:20,fontSize:"clamp(9px,1.6vw,11px)",fontWeight:700,color:b.pendientes>0?"#A32D2D":"#888780",background:b.pendientes>0?"#FCEBEB":"#F1EFE8",whiteSpace:"nowrap",flexShrink:0}}>⏰ {String(b.pendientes).padStart(2,"0")} pend.</span>
                      {b.excluidas>0&&<span style={{padding:"2px 8px",borderRadius:20,fontSize:"clamp(9px,1.6vw,11px)",fontWeight:700,color:"#854F0B",background:"#FAEEDA",whiteSpace:"nowrap",flexShrink:0}}>⛔ {b.excluidas}</span>}
                    </>}
                    {esParalelo&&actsParaStatus.map(a=>{
                      const rango=getRangoActivo(a.id,hoy);
                      const tsFmt=tiAct.filter(ti=>ti.f===fmt&&!actsParaStatus.every(aa=>isExc(ti.id,aa.id,hoy)));
                      const regA=tsFmt.filter(ti=>{
                        const reg=getReg(hoy,ti.id,a.id);
                        if(!reg?.evidencias||reg.anulado) return false;
                        return toMin(primerEnvio(reg.evidencias))>b1Max;
                      }).length;
                      const pendA=tsFmt.filter(ti=>!actsConRegHoy.some(aa=>{const r=getReg(hoy,ti.id,aa.id);return r?.evidencias?.length>0&&!r?.anulado;})).length;
                      const esAdHoc=a.cat&&a.cat!=="Always On";
                      const ptsMax=toMin(nowTime)<=toMin(rango.c80||"09:00")?"8pts":"6pts";
                      return(
                        <span key={a.id} style={{padding:"2px 8px",borderRadius:20,fontSize:"clamp(9px,1.6vw,11px)",fontWeight:700,
                          color:esAdHoc?"#3B6D11":"#185FA5",
                          background:esAdHoc?"#EAF3DE":"#E6F1FB",
                          whiteSpace:"nowrap",flexShrink:0}}>
                          {a.e} {String(regA).padStart(2,"0")} reg. · {String(pendA).padStart(2,"0")} pend. · {ptsMax} máx.
                        </span>
                      );
                    })}
                  </div>
                </div>
                );
              })}
            </div>
            )}

            {/* Footer */}
            </>}
            <div style={{marginTop:14,fontSize:"clamp(8px,2.2vw,10px)",color:"#b2bec3",textAlign:"center",borderTop:"1px solid #f0f4f8",paddingTop:10,fontWeight:400,letterSpacing:".02em",fontFamily:BRAND_FONT,lineHeight:1.5}}>
              EstrategiaTrade · {hoy}
            </div>
          </div>
        </div>
        );
      })()}

      {/* MENU CONTEXTUAL */}
      {ctxMenu&&(
        <div style={{position:"fixed",inset:0,zIndex:60,background:"rgba(26,47,74,.5)"}} onClick={()=>setCtxMenu(null)}>
          <div onClick={e=>e.stopPropagation()} style={{position:"absolute",top:"50%",left:"50%",transform:"translate(-50%,-50%)",background:"#fff",borderRadius:16,overflow:"hidden",minWidth:220,boxShadow:"0 8px 32px rgba(0,0,0,.15)"}}>
            <div style={{padding:"10px 14px",background:"#f8fafc",borderBottom:"1px solid #e2e8f0",fontSize:11,color:"#5a7a9a",fontWeight:700}}>
              Vega {ctxMenu.t.n} · {ctxMenu.sem.label} · {ctxMenu.a.e}
            </div>
            {isAdmin&&<div onClick={()=>{ const d=ctxMenu.docIds[0]; if(d){setUpdModal({docId:d.docId,docData:d.docData,actividadId:d.actividadId});setHoraUpd(primerEnvio(d.docData?.evidencias)||"");} setCtxMenu(null); }} style={{display:"flex",alignItems:"center",gap:10,padding:"12px 14px",cursor:"pointer",borderBottom:"1px solid #f0f4f8"}}>
              <div style={{width:28,height:28,borderRadius:8,background:"#e8f4fd",display:"flex",alignItems:"center",justifyContent:"center",fontSize:14}}>✏️</div>
              <div><div style={{fontSize:13,fontWeight:700,color:"#1a2f4a"}}>Actualizar registro</div><div style={{fontSize:10,color:"#8aaabb"}}>Corregir hora · queda en historial</div></div>
            </div>}
            {isAdmin&&<div onClick={()=>{ const d=ctxMenu.docIds[0]; if(d){setAnularModal({docId:d.docId,docData:d.docData});} setCtxMenu(null); }} style={{display:"flex",alignItems:"center",gap:10,padding:"12px 14px",cursor:"pointer",borderBottom:"1px solid #f0f4f8"}}>
              <div style={{width:28,height:28,borderRadius:8,background:"#FAEEDA",display:"flex",alignItems:"center",justifyContent:"center",fontSize:14}}>⚠️</div>
              <div><div style={{fontSize:13,fontWeight:700,color:"#1a2f4a"}}>Anular con motivo</div><div style={{fontSize:10,color:"#8aaabb"}}>Se mantiene en historial · no cuenta</div></div>
            </div>}
            {isAdmin&&<div onClick={()=>{ const d=ctxMenu.docIds[0]; if(d){setDelModal({docIds:[d.docId],label:`Vega ${ctxMenu.t.n} · ${ctxMenu.a.e} · ${ctxMenu.sem.label}`});} setCtxMenu(null); }} style={{display:"flex",alignItems:"center",gap:10,padding:"12px 14px",cursor:"pointer"}}>
              <div style={{width:28,height:28,borderRadius:8,background:"#fff1f2",display:"flex",alignItems:"center",justifyContent:"center",fontSize:14}}>🗑️</div>
              <div><div style={{fontSize:13,fontWeight:700,color:"#dc2626"}}>Eliminar registro</div><div style={{fontSize:10,color:"#8aaabb"}}>Solo marcha blanca · irreversible</div></div>
            </div>}
          </div>
        </div>
      )}

        </div>
      </div>

      {/* MODAL ANULAR */}
      {anularModal&&(
        <div style={{position:"fixed",inset:0,background:"rgba(26,47,74,.7)",display:"flex",alignItems:"center",justifyContent:"center",zIndex:60,backdropFilter:"blur(4px)"}}>
          <div style={{background:"#fff",borderRadius:16,padding:28,width:"90%",maxWidth:380}}>
            <div style={{fontSize:28,marginBottom:8}}>⚠️</div>
            <div style={{fontWeight:800,fontSize:15,color:"#1a2f4a",marginBottom:4}}>Anular registro</div>
            <div style={{fontSize:11,color:"#5a7a9a",marginBottom:16}}>El registro quedará visible con badge ⚠️ Anulado y no contará en el puntaje.</div>
            <label style={{fontSize:10,fontWeight:700,color:"#5a7a9a",display:"block",marginBottom:5}}>MOTIVO *</label>
            <select value={motivoAnu} onChange={e=>setMotivoAnu(e.target.value)} style={{width:"100%",padding:"10px 12px",borderRadius:9,border:`1.5px solid ${motivoAnu?"#00b5b4":"#c8d8e8"}`,background:"#f8fafc",color:"#1a2f4a",fontSize:13,outline:"none",marginBottom:12}}>
              <option value="">Seleccionar motivo...</option>
              <option>Actividad no aplica este período</option>
              <option>Error de registro del auditor</option>
              <option>Tienda sin categoría para esta actividad</option>
              <option>Fecha de registro incorrecta</option>
              <option>Otro (ver detalle)</option>
            </select>
            <label style={{fontSize:10,fontWeight:700,color:"#5a7a9a",display:"block",marginBottom:5}}>DETALLE (opcional)</label>
            <input value={detalleAnu} onChange={e=>setDetalleAnu(e.target.value)} placeholder="Descripción adicional..." style={{width:"100%",padding:"10px 12px",borderRadius:9,border:"1px solid #c8d8e8",background:"#f8fafc",color:"#1a2f4a",fontSize:13,outline:"none",marginBottom:16,boxSizing:"border-box"}}/>
            <div style={{display:"flex",gap:8}}>
              <button onClick={()=>{setAnularModal(null);setMotivoAnu("");setDetalleAnu("");}} style={{flex:1,padding:"12px",borderRadius:10,border:"1px solid #c8d8e8",background:"#fff",color:"#5a7a9a",cursor:"pointer",fontWeight:700,fontSize:13}}>Cancelar</button>
              <button onClick={anularRegistro} disabled={!motivoAnu} style={{flex:1,padding:"12px",borderRadius:10,border:"none",background:motivoAnu?"linear-gradient(135deg,#f6a623,#e17055)":"#e2e8f0",color:motivoAnu?"#fff":"#b2bec3",cursor:motivoAnu?"pointer":"not-allowed",fontWeight:700,fontSize:13}}>Confirmar anulación</button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL ACTUALIZAR */}
      {updModal&&(
        <div style={{position:"fixed",inset:0,background:"rgba(26,47,74,.7)",display:"flex",alignItems:"center",justifyContent:"center",zIndex:60,backdropFilter:"blur(4px)"}}>
          <div style={{background:"#fff",borderRadius:16,padding:28,width:"90%",maxWidth:380}}>
            <div style={{fontSize:28,marginBottom:8}}>✏️</div>
            <div style={{fontWeight:800,fontSize:15,color:"#1a2f4a",marginBottom:4}}>Actualizar registro</div>
            <div style={{fontSize:11,color:"#5a7a9a",marginBottom:16}}>Se agrega una corrección al historial con tu nombre y motivo.</div>
            <label style={{fontSize:10,fontWeight:700,color:"#5a7a9a",display:"block",marginBottom:5}}>NUEVA HORA DE ENVÍO *</label>
            <input type="time" value={horaUpd} onChange={e=>setHoraUpd(e.target.value)} style={{width:"100%",padding:"12px",borderRadius:9,border:`1.5px solid ${horaUpd?"#00b5b4":"#c8d8e8"}`,background:"#f8fafc",color:"#1a2f4a",fontSize:20,outline:"none",textAlign:"center",fontWeight:700,marginBottom:12,boxSizing:"border-box"}}/>
            <label style={{fontSize:10,fontWeight:700,color:"#5a7a9a",display:"block",marginBottom:5}}>MOTIVO DE CORRECCIÓN *</label>
            <input value={motivoUpd} onChange={e=>setMotivoUpd(e.target.value)} placeholder="Ej: hora registrada incorrectamente..." style={{width:"100%",padding:"10px 12px",borderRadius:9,border:`1.5px solid ${motivoUpd?"#00b5b4":"#c8d8e8"}`,background:"#f8fafc",color:"#1a2f4a",fontSize:13,outline:"none",marginBottom:16,boxSizing:"border-box"}}/>
            <div style={{display:"flex",gap:8}}>
              <button onClick={()=>{setUpdModal(null);setHoraUpd("");setMotivoUpd("");}} style={{flex:1,padding:"12px",borderRadius:10,border:"1px solid #c8d8e8",background:"#fff",color:"#5a7a9a",cursor:"pointer",fontWeight:700,fontSize:13}}>Cancelar</button>
              <button onClick={actualizarRegistro} disabled={!horaUpd||!motivoUpd} style={{flex:1,padding:"12px",borderRadius:10,border:"none",background:(horaUpd&&motivoUpd)?"linear-gradient(135deg,#00b5b4,#1a2f4a)":"#e2e8f0",color:(horaUpd&&motivoUpd)?"#fff":"#b2bec3",cursor:(horaUpd&&motivoUpd)?"pointer":"not-allowed",fontWeight:700,fontSize:13}}>Guardar corrección</button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL ELIMINAR */}
      {delModal&&(
        <div style={{position:"fixed",inset:0,background:"rgba(26,47,74,.7)",display:"flex",alignItems:"center",justifyContent:"center",zIndex:60,backdropFilter:"blur(4px)"}}>
          <div style={{background:"#fff",borderRadius:16,padding:28,width:"90%",maxWidth:360,textAlign:"center"}}>
            <div style={{fontSize:36,marginBottom:12}}>🗑️</div>
            <div style={{fontWeight:800,fontSize:15,color:"#1a2f4a",marginBottom:8}}>¿Eliminar registro?</div>
            <div style={{fontSize:12,color:"#5a7a9a",marginBottom:6}}>{delModal.label}</div>
            <div style={{fontSize:11,color:"#dc2626",background:"#fff1f2",borderRadius:8,padding:"8px 12px",marginBottom:20}}>Esta acción no se puede deshacer. Solo usar en marcha blanca.</div>
            <div style={{display:"flex",gap:8}}>
              <button onClick={()=>setDelModal(null)} style={{flex:1,padding:"12px",borderRadius:10,border:"1px solid #c8d8e8",background:"#fff",color:"#5a7a9a",cursor:"pointer",fontWeight:700,fontSize:13}}>Cancelar</button>
              <button onClick={()=>Promise.all(delModal.docIds.map(id=>eliminarRegistro(id))).then(()=>setDelModal(null))} style={{flex:1,padding:"12px",borderRadius:10,border:"none",background:"linear-gradient(135deg,#dc2626,#991b1b)",color:"#fff",cursor:"pointer",fontWeight:700,fontSize:13}}>Sí, eliminar</button>
            </div>
          </div>
        </div>
      )}

      {/* ══ MODAL EXCLUSIÓN CON COMENTARIO ══
          Se abre al pulsar N/A (nueva exclusión) o ✏️ (editar comentario de exclusión existente).
          Permite ingresar el comentario que aparecerá como tooltip en las celdas N/A del reporte.
          Checkbox "Aplicar a toda la semana" crea la exclusión en cada fecha L-V del período activo.
      */}
      {excModal&&(
        <div style={{position:"fixed",inset:0,background:"rgba(26,47,74,.72)",display:"flex",alignItems:"center",justifyContent:"center",zIndex:65,backdropFilter:"blur(6px)"}}>
          <div style={{background:"#fff",borderRadius:20,padding:28,width:"92%",maxWidth:400,boxShadow:"0 24px 60px rgba(0,0,0,.3)"}}>
            {/* Header */}
            <div style={{display:"flex",alignItems:"center",gap:12,marginBottom:18}}>
              <div style={{width:44,height:44,borderRadius:13,background:"#fff8ec",border:"1.5px solid #FAC775",display:"flex",alignItems:"center",justifyContent:"center",fontSize:22,flexShrink:0}}>
                {excModal.estaExcluida?"✏️":"⚠️"}
              </div>
              <div>
                <div style={{fontWeight:800,fontSize:14,color:"#1a2f4a"}}>
                  {excModal.estaExcluida?"Editar comentario de exclusión":"Excluir tienda — agregar comentario"}
                </div>
                <div style={{fontSize:11,color:"#8aaabb",marginTop:2}}>
                  Vega {excModal.tiendaNombre} · {fecha}
                </div>
              </div>
            </div>

            {/* Info contextual */}
            <div style={{background:"#f8fafc",borderRadius:10,padding:"10px 13px",marginBottom:14,fontSize:11,color:"#5a7a9a",lineHeight:1.6}}>
              {excModal.estaExcluida
                ?"El comentario aparecerá como tooltip (💬) al pasar el cursor sobre las celdas N/A en los reportes y dashboards."
                :"Al confirmar, la tienda quedará excluida del conteo de eficiencia para esta fecha y el comentario aparecerá en los reportes."
              }
            </div>

            {/* Campo comentario */}
            <label style={{fontSize:10,fontWeight:800,color:"#5a7a9a",letterSpacing:".05em",display:"block",marginBottom:6}}>
              COMENTARIO / MOTIVO DE EXCLUSIÓN
            </label>
            <textarea
              autoFocus
              value={excComentario}
              onChange={e=>setExcModal(m=>({...m,_comentario:e.target.value}))}
              placeholder="Ej: Tienda en remodelación, sin operación esta semana..."
              rows={3}
              style={{width:"100%",padding:"11px 13px",borderRadius:10,border:`1.5px solid ${excComentario?"#00b5b4":"#c8d8e8"}`,background:"#f8fafc",color:"#1a2f4a",fontSize:13,outline:"none",resize:"vertical",boxSizing:"border-box",fontFamily:"inherit",lineHeight:1.5}}
            />
            <div style={{fontSize:9,color:"#b2bec3",marginTop:3,marginBottom:14}}>{excComentario.length}/200 caracteres · opcional pero recomendado</div>

            {/* Checkbox aplicar a toda la semana — solo si es nueva exclusión */}
            {!excModal.estaExcluida&&excSemActiva&&(
              <div style={{marginBottom:18}}>
                <label style={{display:"flex",alignItems:"flex-start",gap:10,cursor:"pointer",padding:"11px 13px",background:excApplyAll?"#e0fafa":"#f8fafc",borderRadius:10,border:`1.5px solid ${excApplyAll?"#00b5b4":"#e2e8f0"}`,transition:"all .15s"}}>
                  <input
                    type="checkbox"
                    checked={excApplyAll}
                    onChange={e=>setExcModal(m=>({...m,_applyAll:e.target.checked}))}
                    style={{width:16,height:16,marginTop:1,cursor:"pointer",accentColor:"#00b5b4",flexShrink:0}}
                  />
                  <div>
                    <div style={{fontSize:12,fontWeight:700,color:excApplyAll?"#0d7a79":"#1a2f4a"}}>
                      Aplicar a todas las fechas de {excSemActiva.label}
                    </div>
                    <div style={{fontSize:10,color:"#8aaabb",marginTop:2,lineHeight:1.5}}>
                      Excluirá {excFechasPreview.length} días:&nbsp;
                      <span style={{fontFamily:"monospace",color:"#5a7a9a"}}>{excFechasPreview.join(" · ")}</span>
                    </div>
                  </div>
                </label>
              </div>
            )}

            {/* Botones */}
            <div style={{display:"flex",gap:8,marginTop:4}}>
              <button
                onClick={()=>setExcModal(null)}
                style={{flex:1,padding:"12px",borderRadius:10,border:"1px solid #c8d8e8",background:"#fff",color:"#5a7a9a",cursor:"pointer",fontWeight:700,fontSize:13}}>
                Cancelar
              </button>
              <button
                onClick={async()=>{
                  if(excModal.estaExcluida){
                    // Modo edición: actualizar el comentario de la exclusión existente
                    const key = excModal.tId+"|"+excModal.aId;
                    const cur = exceps[key];
                    const entries = Array.isArray(cur)
                      ? cur.map(e=>typeof e==="string"?{fecha:e,comentario:""}:e)
                      : [];
                    const updated = entries.map(e=>e.fecha===fecha?{...e,comentario:excComentario.trim()}:e);
                    const newExceps = {...exceps,[key]:updated};
                    setExceps(newExceps);
                    try{ await saveConfig({excepciones:newExceps}); showToast("💬 Comentario actualizado"); }
                    catch(e){ showToast("❌ Error al guardar comentario"); }
                  } else {
                    // Modo nuevo: llamar toggleExcepcion con comentario y applyAll
                    await toggleExcepcion(excModal.tId, excModal.aId, excComentario.trim(), excApplyAll);
                  }
                  setExcModal(null);
                }}
                style={{flex:2,padding:"12px",borderRadius:10,border:"none",background:"linear-gradient(135deg,#00b5b4,#1a2f4a)",color:"#fff",cursor:"pointer",fontWeight:800,fontSize:13}}>
                {excModal.estaExcluida?"Guardar comentario":excApplyAll?"⚠️ Excluir toda la semana":"⚠️ Confirmar exclusión"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ══ MOBILE DRAWER ══ */}
      {drawerOpen&&(
        <div style={{position:"fixed",inset:0,zIndex:100,display:"flex"}}>
          {/* Backdrop */}
          <div style={{position:"absolute",inset:0,background:"rgba(0,0,0,.55)",backdropFilter:"blur(2px)"}} onClick={()=>setDrawerOpen(false)}/>
          {/* Drawer panel */}
          <div style={{position:"relative",width:260,background:"#0F172A",display:"flex",flexDirection:"column",height:"100%",boxShadow:"4px 0 32px rgba(0,0,0,.4)",animation:"slideInLeft .2s ease"}}>
            <style>{`@keyframes slideInLeft{from{transform:translateX(-100%)}to{transform:translateX(0)}}`}</style>
            {/* Header */}
            <div style={{padding:"16px 16px 10px",borderBottom:"1px solid rgba(255,255,255,.07)",display:"flex",alignItems:"center",justifyContent:"space-between"}}>
              <div style={{display:"flex",alignItems:"center",gap:10}}>
                <EstrategiaTradeIcon size={40} radius={10}/>
                <div>
                  <div style={{fontFamily:BRAND_FONT,fontWeight:700,fontSize:15,color:"#fff",lineHeight:1.1}}>
                    <span>Estrategia</span><span style={{color:"#e74c3c"}}>Trade</span>
                  </div>
                  <div style={{fontSize:9,color:"rgba(255,255,255,.5)"}}>Control de Implementaciones</div>
                </div>
              </div>
              <button onClick={()=>setDrawerOpen(false)} style={{background:"none",border:"none",color:"rgba(255,255,255,.5)",cursor:"pointer",padding:4}}>
                <IcoClose/>
              </button>
            </div>
            {/* Nav */}
            <nav style={{flex:1,padding:"12px 8px",overflowY:"auto"}}>
              {SIDEBAR_ITEMS.map(it=>(
                <button key={it.id} className="et-nav-item" onClick={()=>{setModulo(it.mod);setTab(it.tab);if(it.cfgTab!==undefined)setCfgTab(it.cfgTab);if(it.mod===3){setCfgMod(null);setDdOpen(false);}if(it.mod===2){setUsrTab(null);setDdOpen(false);}setDrawerOpen(false);}}
                  style={{width:"100%",display:"flex",alignItems:"center",gap:12,padding:"14px 18px",borderRadius:12,border:"none",cursor:"pointer",marginBottom:6,textAlign:"left",
                    background:sidebarActive===it.id?"#2F6BFF":"transparent",
                    color:sidebarActive===it.id?"#fff":"rgba(255,255,255,.6)",
                    fontWeight:sidebarActive===it.id?700:500,fontSize:14,transition:"background .15s"}}>
                  <span style={{flexShrink:0,display:"flex",alignItems:"center"}}>{it.icon}</span>
                  {it.label}
                </button>
              ))}
              {isAuditor&&<button onClick={()=>{setShowStatusCard(true);setDrawerOpen(false);}}
                style={{width:"100%",display:"flex",alignItems:"center",gap:12,padding:"14px 18px",borderRadius:12,border:"none",cursor:"pointer",marginBottom:6,textAlign:"left",background:"transparent",color:"rgba(253,203,110,.85)",fontWeight:500,fontSize:14}}>
                <span style={{display:"flex",alignItems:"center"}}>
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="4" width="20" height="14" rx="2"/><line x1="8" y1="21" x2="16" y2="21"/><line x1="12" y1="18" x2="12" y2="21"/><path d="M8.3 11.6a3.4 3.4 0 015.9-2.3"/><polyline points="14.5 7.4 14.5 9.3 12.6 9.3"/><path d="M15.7 9.4a3.4 3.4 0 01-5.9 2.3"/><polyline points="9.5 13.6 9.5 11.7 11.4 11.7"/></svg>
                </span>
                Estado
              </button>}
            </nav>
            <div style={{padding:"12px 18px",borderTop:"1px solid rgba(255,255,255,.07)",fontSize:10,color:"rgba(255,255,255,.25)"}}>Versión 1.0.0</div>
          </div>
        </div>
      )}

    </div>
  );
}


/* ══ MÓDULO AUDITORÍA — componentes ══════════════════════════════════════ */
function ItemAudit({item,val,obsIt,escala,escalaTxt,onValor,onObsItem}){
  const [showObs,setShowObs]=useState(false);
  const colores=["#d63031","#f6a623","#00b894"];
  return(
    <div style={{marginBottom:10,borderRadius:10,overflow:"hidden",border:`1px solid ${val!==undefined?"#00b5b4":"#e2e8f0"}`}}>
      <div style={{padding:"10px 14px",background:"#f8fafc"}}>
        <div style={{fontSize:12,fontWeight:600,color:"#1a2f4a",marginBottom:8}}>{item.texto}</div>
        <div style={{display:"flex",gap:6}}>
          {escala.map((v,idx)=>(
            <button key={v} onClick={()=>onValor(item.id,v)}
              style={{flex:1,padding:"9px 4px",borderRadius:8,border:"none",fontWeight:700,fontSize:11,cursor:"pointer",lineHeight:1.3,
                      background:val===v?colores[idx]:"#e2e8f0",color:val===v?"#fff":"#5a7a9a",transition:"all .12s"}}>
              <span style={{display:"block",fontSize:13,fontWeight:800}}>{v}</span>
              <span style={{fontSize:9,fontWeight:400}}>{(escalaTxt||[])[idx]||""}</span>
            </button>
          ))}
        </div>
      </div>
      <div style={{padding:"6px 14px",background:"#fff",borderTop:`1px solid ${val!==undefined?"#00b5b4":"#e2e8f0"}22`}}>
        <button onClick={()=>setShowObs(v=>!v)}
          style={{background:"none",border:"none",cursor:"pointer",fontSize:11,padding:0,color:obsIt?"#0984e3":"#b2bec3",fontWeight:obsIt?700:400}}>
          {obsIt?`📝 ${obsIt.slice(0,40)}${obsIt.length>40?"…":""}`:"+  Agregar obs / tarea"}
        </button>
        {showObs&&<textarea value={obsIt} onChange={e=>onObsItem(item.id,e.target.value)} rows={2}
          placeholder="Situación o tarea pendiente..." style={{width:"100%",marginTop:6,padding:"8px 10px",borderRadius:8,
          border:"1px solid #e2e8f0",background:"#f8fafc",color:"#1a2f4a",fontSize:11,outline:"none",resize:"vertical",boxSizing:"border-box"}}/>}
      </div>
    </div>
  );
}

function ModuloAuditoria({modulo,respuestas,onValor,onObsItem,onObsModulo}){
  const items=(modulo?.items||[]).filter(i=>i.activo).sort((a,b)=>(a.orden??0)-(b.orden??0));
  const scoreModulo=calcScoreModulo(respuestas,modulo);
  const tier=getTierAuditoria(scoreModulo?.pct);
  const respondidos=items.filter(i=>respuestas[i.id]?.valor!==undefined).length;
  const obsModulo=respuestas[`__obs_${modulo.id}`]?.obs||"";
  return(
    <div style={{paddingBottom:16}}>
      <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",padding:"10px 16px",background:tier.bg,borderRadius:10,border:`1.5px solid ${tier.c}33`,marginBottom:12}}>
        <div>
          <div style={{fontWeight:800,fontSize:13,color:"#1a2f4a"}}>{modulo.label}</div>
          <div style={{fontSize:11,color:"#8aaabb"}}>{respondidos}/{items.length} ítems · {(modulo?.escala||[0,1.5,3]).join(" / ")}</div>
        </div>
        <div style={{textAlign:"center",minWidth:64}}>
          <div style={{fontSize:22,lineHeight:1}}>{tier.icon}</div>
          <div style={{fontWeight:900,fontSize:16,color:tier.c,lineHeight:1.1}}>{scoreModulo?`${scoreModulo.pct}%`:"—"}</div>
          <div style={{fontSize:9,color:tier.c,opacity:.8}}>{scoreModulo?`${scoreModulo.ob}/${scoreModulo.mx}pts`:""}</div>
          <div style={{fontSize:9,color:tier.c,fontWeight:700}}>{tier.label}</div>
        </div>
      </div>
      {items.map(item=>(
        <ItemAudit key={item.id} item={item} val={respuestas[item.id]?.valor} obsIt={respuestas[item.id]?.obs||""}
          escala={modulo.escala} escalaTxt={modulo.escalaTxt} onValor={onValor} onObsItem={onObsItem}/>
      ))}
      <div style={{marginTop:4,padding:"12px 14px",background:"#f0f4f8",borderRadius:10,border:"1px solid #e2e8f0"}}>
        <div style={{fontSize:11,fontWeight:700,color:"#1a2f4a",marginBottom:6}}>Tareas pendientes — {modulo.label}</div>
        <textarea value={obsModulo} onChange={e=>onObsModulo(modulo.id,e.target.value)} rows={2}
          placeholder={`¿Qué debe mejorar antes de la próxima visita?`}
          style={{width:"100%",padding:"8px 10px",borderRadius:8,border:"1px solid #d1dce8",background:"#fff",color:"#1a2f4a",fontSize:11,outline:"none",resize:"vertical",boxSizing:"border-box"}}/>
      </div>
    </div>
  );
}

function SeleccionTienda({tiendas,onCheckIn,auditExclusiones,onSolicitarExclusion,isAdmin,onGestionarExclusion,rutaActiva,uDni,auditorias}){
  const [busqA,setBusqA]=useState("");
  const [fmtA,setFmtA]=useState("Todas");
  const [naModal,setNaModal]=useState(null);
  const [naMotivo,setNaMotivo]=useState("");
  const [naComentario,setNaComentario]=useState("");
  const fmts=["Todas","Mayorista","Supermayorista","Market"];
  const fmtC={Mayorista:"#6c5ce7",Supermayorista:"#0984e3",Market:"#00b5b4"};
  const nomTienda=(t)=>String(t?.n||t?.nombre||t?.tienda||"").trim();
  const fmtTienda=(t)=>String(t?.f||t?.formato||"").trim();
  const distTienda=(t)=>String(t?.dist||t?.distrito||"").trim();

  // Tiendas de la ruta activa del auditor
  const tiendasEnRuta=new Set(rutaActiva?.tiendas||[]);

  // Tiendas ya auditadas en el ciclo actual (bloqueadas según frecuencia)
  const ahora=new Date();
  const tiendasBloqueadas=new Set((auditorias?Object.values(auditorias):[]).filter(a=>{
    // Admin ve bloqueadas las que YA auditó cualquier auditor; auditor solo las propias
    if(a.estado==="borrador") return false;
    if(!isAdmin&&a.auditorId!==uDni) return false;
    const fa=new Date(a.fecha||a.timestamp||"");
    if(isNaN(fa)) return false;
    const freq=rutaActiva?.frecuencia||"semanal";
    if(freq==="unica"||freq==="semanal"){
      // mismo ISO week
      const wA=(d=>{const j=new Date(Date.UTC(d.getFullYear(),d.getMonth(),d.getDate()));j.setUTCDate(j.getUTCDate()+4-(j.getUTCDay()||7));const y=j.getUTCFullYear();const w=Math.ceil((((j-new Date(Date.UTC(y,0,1)))/86400000)+1)/7);return`${y}-W${String(w).padStart(2,"0")}`;})(fa);
      const wN=(d=>{const j=new Date(Date.UTC(d.getFullYear(),d.getMonth(),d.getDate()));j.setUTCDate(j.getUTCDate()+4-(j.getUTCDay()||7));const y=j.getUTCFullYear();const w=Math.ceil((((j-new Date(Date.UTC(y,0,1)))/86400000)+1)/7);return`${y}-W${String(w).padStart(2,"0")}`;})(ahora);
      return wA===wN;
    }
    if(freq==="diaria") return fa.toDateString()===ahora.toDateString();
    if(freq==="mensual") return fa.getFullYear()===ahora.getFullYear()&&fa.getMonth()===ahora.getMonth();
    return false;
  }).map(a=>a.tiendaId));

  const tFiltA=tiendas.filter(t=>{
    if(!t.activa) return false;
    if(fmtA!=="Todas"&&fmtTienda(t)!==fmtA) return false;
    if(busqA&&!nomTienda(t).toLowerCase().includes(busqA.toLowerCase())&&!distTienda(t).toLowerCase().includes(busqA.toLowerCase())) return false;
    return true;
  }).sort((a,b)=>{
    // Primero las tiendas en ruta; luego bloqueadas al final
    const aR=tiendasEnRuta.has(a.id); const bR=tiendasEnRuta.has(b.id);
    const aB=tiendasBloqueadas.has(a.id); const bB=tiendasBloqueadas.has(b.id);
    if(aR&&!bR) return -1; if(!aR&&bR) return 1;
    if(!aB&&bB) return -1; if(aB&&!bB) return 1;
    return nomTienda(a).localeCompare(nomTienda(b),"es");
  });

  // FIX 5: Auditor sin ruta asignada — estado vacío informativo
  if(!rutaActiva&&!isAdmin){
    return(
      <div style={{padding:"48px 24px",textAlign:"center"}}>
        <svg width="56" height="56" viewBox="0 0 24 24" fill="none" stroke="#c8d8e8" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" style={{marginBottom:16}}><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z"/><circle cx="12" cy="10" r="3"/></svg>
        <div style={{fontWeight:700,fontSize:15,color:"#1a2f4a",marginBottom:8}}>Sin ruta asignada</div>
        <div style={{fontSize:12,color:"#8aaabb",maxWidth:260,margin:"0 auto",lineHeight:1.6}}>Tu coordinador o administrador aún no ha asignado una ruta para esta semana. Comunícate con ellos para que te asignen las tiendas que debes auditar.</div>
      </div>
    );
  }

  return(
    <div style={{paddingBottom:80}}>
      <div style={{padding:"10px 16px 4px",fontWeight:800,fontSize:18,color:"#1a2f4a"}}>Seleccione Tienda a Auditar</div>

      {/* Banner ruta activa */}
      {rutaActiva&&(
        <div style={{margin:"0 16px 10px",padding:"10px 14px",borderRadius:10,background:"#e0fafa",border:"1.5px solid #00b5b4",display:"flex",alignItems:"center",gap:10}}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#085041" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z"/><circle cx="12" cy="10" r="3"/></svg>
          <div style={{flex:1}}>
            <div style={{fontWeight:700,fontSize:12,color:"#085041"}}>Tienes una ruta asignada esta semana</div>
            <div style={{fontSize:11,color:"#0d7a79"}}>{tiendasEnRuta.size} tiendas · Las tiendas de tu ruta aparecen primero</div>
          </div>
        </div>
      )}

      {/* Filtro por formato */}
      <div style={{display:"flex",gap:5,padding:"8px 16px",overflowX:"auto"}}>
        {fmts.map(f=>{
          const on=fmtA===f;
          const c=f==="Todas"?"#1a2f4a":fmtC[f];
          return(
            <button key={f} onClick={()=>setFmtA(f)}
              style={{flexShrink:0,padding:"5px 12px",borderRadius:20,border:`1.5px solid ${on?c:"#e2e8f0"}`,
                background:on?c+"18":"#fff",color:on?c:"#8aaabb",
                fontSize:11,fontWeight:700,cursor:"pointer",whiteSpace:"nowrap"}}>
              {f}
            </button>
          );
        })}
      </div>

      {/* Buscador */}
      <div style={{padding:"4px 16px 10px"}}>
        <input value={busqA} onChange={e=>setBusqA(e.target.value)} placeholder="Buscar tienda o distrito..."
          style={{width:"100%",padding:"10px 14px",borderRadius:10,border:"1.5px solid #00b5b4",background:"#f8fafc",color:"#1a2f4a",outline:"none",fontSize:13,boxSizing:"border-box"}}/>
      </div>

      {/* Lista */}
      {tFiltA.map(t=>{
        const excl=auditExclusiones?.[t.id];
        const esExcluida=excl&&excl.aprobada;
        const esPendiente=excl&&!excl.aprobada;
        const enRuta=tiendasEnRuta.has(t.id);
        const esBloqueada=tiendasBloqueadas.has(t.id);
        const bloqLabel=esBloqueada?(rutaActiva?.frecuencia==="diaria"?"Auditada hoy":rutaActiva?.frecuencia==="mensual"?"Auditada este mes":"Auditada esta semana"):null;
        return(
          <div key={t.id} style={{margin:"0 16px 8px"}}>
            <div style={{padding:"11px 14px",background:esBloqueada?"#f0f4f8":esExcluida?"#fafafa":enRuta?"#f0fff8":"#fff",
              borderRadius:10,border:`1px solid ${esBloqueada?"#c8d8e8":esExcluida?"#e2e8f0":enRuta?"#00b5b4":"#e2e8f0"}`,
              display:"flex",alignItems:"center",gap:10,
              cursor:(esExcluida||esBloqueada)?"default":"pointer",opacity:(esExcluida||esBloqueada)?0.65:1}}
              onClick={()=>{ if(!esExcluida&&!esBloqueada) onCheckIn(t.id); }}>
              <div style={{flex:1}}>
                <div style={{fontWeight:700,fontSize:13,color:"#1a2f4a",display:"flex",alignItems:"center",gap:6}}>
                  Vega {nomTienda(t)}
                  {esBloqueada&&<span style={{fontSize:9,fontWeight:700,padding:"1px 6px",borderRadius:10,background:"#EAF3DE",color:"#27500A",border:"1px solid #C0DD97"}}>✓ {bloqLabel}</span>}
                  {!esBloqueada&&enRuta&&<span style={{fontSize:9,fontWeight:700,padding:"1px 6px",borderRadius:10,background:"#e0fafa",color:"#085041",border:"1px solid #00b5b444"}}>En ruta</span>}
                  {!esBloqueada&&!enRuta&&rutaActiva&&<span style={{fontSize:9,fontWeight:700,padding:"1px 6px",borderRadius:10,background:"#f0f4f8",color:"#8aaabb",border:"1px solid #dde3e9"}}>Fuera de ruta</span>}
                </div>
                <div style={{fontSize:11,color:"#8aaabb",marginTop:2}}>{fmtTienda(t)} · {distTienda(t)}</div>
                {(esExcluida||esPendiente)&&(
                  <div style={{fontSize:10,color:"#854F0B",marginTop:3}}>
                    {excl.motivo}{excl.comentario?` · ${excl.comentario}`:""}
                  </div>
                )}
              </div>
              {esBloqueada&&!esExcluida&&<span style={{padding:"2px 8px",borderRadius:20,fontSize:10,fontWeight:700,color:"#27500A",background:"#EAF3DE",border:"1px solid #C0DD97",flexShrink:0}}>✓ Realizada</span>}
              {esExcluida&&<span style={{padding:"2px 8px",borderRadius:20,fontSize:10,fontWeight:700,color:"#854F0B",background:"#FAEEDA",flexShrink:0}}>N/A</span>}
              {esPendiente&&<span style={{padding:"2px 8px",borderRadius:20,fontSize:10,fontWeight:700,color:"#BA7517",background:"#FAEEDA",border:"1px solid #FAC775",flexShrink:0}}>N/A pend.</span>}
              {/* Admin: botones gestión */}
              {isAdmin&&esPendiente&&(
                <div style={{display:"flex",gap:4,flexShrink:0}}>
                  <button onClick={e=>{e.stopPropagation();onGestionarExclusion(t.id,true);}}
                    style={{padding:"3px 8px",borderRadius:8,border:"none",background:"#e8faf5",color:"#00b894",fontSize:10,fontWeight:700,cursor:"pointer"}}>✓ Aprobar</button>
                  <button onClick={e=>{e.stopPropagation();onGestionarExclusion(t.id,false);}}
                    style={{padding:"3px 8px",borderRadius:8,border:"none",background:"#fff1f2",color:"#d63031",fontSize:10,fontWeight:700,cursor:"pointer"}}>✕</button>
                </div>
              )}
              {/* Botón N/A para auditor */}
              {!esExcluida&&!esPendiente&&(
                <button onClick={e=>{e.stopPropagation();setNaModal(t.id);setNaMotivo("");setNaComentario("");}}
                  style={{padding:"3px 9px",borderRadius:8,border:"1px solid #e2e8f0",background:"#f8fafc",color:"#8aaabb",fontSize:10,fontWeight:700,cursor:"pointer",flexShrink:0}}>
                  N/A
                </button>
              )}
              {!esExcluida&&!esPendiente&&<span style={{fontSize:16,flexShrink:0}}>📍</span>}
            </div>
          </div>
        );
      })}

      {/* Modal solicitud N/A */}
      {naModal&&(
        <div style={{position:"fixed",inset:0,background:"rgba(26,47,74,.7)",display:"flex",alignItems:"flex-end",justifyContent:"center",zIndex:80,padding:"0 0 0 0"}}
          onClick={()=>setNaModal(null)}>
          <div onClick={e=>e.stopPropagation()}
            style={{background:"#fff",borderRadius:"20px 20px 0 0",padding:24,width:"100%",maxWidth:520,boxShadow:"0 -8px 32px rgba(0,0,0,.15)"}}>
            <div style={{fontWeight:800,fontSize:15,color:"#1a2f4a",marginBottom:4}}>Reportar N/A — Vega {nomTienda(tiendas.find(t=>t.id===naModal))}</div>
            <div style={{fontSize:11,color:"#8aaabb",marginBottom:14}}>El admin recibirá la solicitud y la aprobará o rechazará. La tienda aparecerá como N/A pendiente mientras tanto.</div>
            <label style={{fontSize:10,fontWeight:700,color:"#5a7a9a",display:"block",marginBottom:5}}>MOTIVO *</label>
            <select value={naMotivo} onChange={e=>setNaMotivo(e.target.value)}
              style={{width:"100%",padding:"10px 12px",borderRadius:9,border:`1.5px solid ${naMotivo?"#00b5b4":"#c8d8e8"}`,background:"#f8fafc",color:"#1a2f4a",fontSize:13,outline:"none",marginBottom:10,boxSizing:"border-box"}}>
              <option value="">Seleccionar motivo...</option>
              <option>Tienda cerrada temporalmente</option>
              <option>En remodelación</option>
              <option>Sin acceso al local</option>
              <option>Tienda sin personal disponible</option>
              <option>Otro (ver comentario)</option>
            </select>
            <label style={{fontSize:10,fontWeight:700,color:"#5a7a9a",display:"block",marginBottom:5}}>COMENTARIO (opcional)</label>
            <textarea value={naComentario} onChange={e=>setNaComentario(e.target.value)} rows={2}
              placeholder="Detalle adicional..."
              style={{width:"100%",padding:"10px 12px",borderRadius:9,border:"1px solid #c8d8e8",background:"#f8fafc",color:"#1a2f4a",fontSize:13,outline:"none",marginBottom:14,resize:"none",boxSizing:"border-box"}}/>
            <div style={{display:"flex",gap:8}}>
              <button onClick={()=>setNaModal(null)}
                style={{flex:1,padding:12,borderRadius:10,border:"1px solid #e2e8f0",background:"#fff",color:"#5a7a9a",cursor:"pointer",fontWeight:700,fontSize:13}}>Cancelar</button>
              <button disabled={!naMotivo}
                onClick={()=>{onSolicitarExclusion(naModal,naMotivo,naComentario);setNaModal(null);}}
                style={{flex:1,padding:12,borderRadius:10,border:"none",background:naMotivo?"linear-gradient(135deg,#00b5b4,#1a2f4a)":"#e2e8f0",color:naMotivo?"#fff":"#b2bec3",cursor:naMotivo?"pointer":"not-allowed",fontWeight:700,fontSize:13}}>
                Reportar al admin
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function PantallaAuditoria({paso,tiendas,tiendaSelId,modulos,respuestas,moduloActivo,
  obs,compromisos,onCheckIn,onValor,onObsItem,onObsModulo,onSiguienteModulo,auditorias,
  onAnteriorModulo,onObs,onCompromisos,onCheckOut,onBorrador,onCancelar,uName,uDni,fecha,
  auditExclusiones,onSolicitarExclusion,isAdmin,onGestionarExclusion,rutaActiva}){
  const tienda=tiendas.find(t=>t.id===tiendaSelId);
  const modulosActivos=modulos.filter(m=>m.activo).sort((a,b)=>a.orden-b.orden);
  const scoreFinal=calcScoreFinal(respuestas,modulosActivos);
  const tierFinal=getTierAuditoria(scoreFinal);

  if(paso===0) return <SeleccionTienda tiendas={tiendas} onCheckIn={onCheckIn}
    auditExclusiones={auditExclusiones} onSolicitarExclusion={onSolicitarExclusion}
    isAdmin={isAdmin} onGestionarExclusion={onGestionarExclusion}
    rutaActiva={rutaActiva} uDni={uDni} auditorias={auditorias}/>;

  if(paso===1){
    const modulo=modulosActivos[moduloActivo]||modulosActivos[0]||null;
    if(!modulo) return <div style={{padding:32,textAlign:"center",color:"#8aaabb"}}>Sin módulos configurados. Contacta al administrador.</div>;
    const esUltimo=moduloActivo===modulosActivos.length-1;
    return(
      <div style={{paddingBottom:100}}>
        <div style={{padding:"12px 16px",background:"#1a2f4a",color:"#fff"}}>
          <div style={{fontWeight:800,fontSize:14}}>Vega {tienda?.n}</div>
          <div style={{fontSize:11,opacity:.7}}>{tienda?.f} · {uName}</div>
          <div style={{display:"flex",gap:4,marginTop:8}}>
            {modulosActivos.map((m,idx)=>{
              const s=calcScoreModulo(respuestas,m);const t=getTierAuditoria(s?.pct);
              return<div key={m.id} style={{flex:1,height:4,borderRadius:2,background:idx<moduloActivo?(t?.c||'#00b5b4'):idx===moduloActivo?"#00b5b4":"rgba(255,255,255,.2)"}}/>;
            })}
          </div>
          <div style={{fontSize:10,opacity:.6,marginTop:4}}>Módulo {moduloActivo+1}/{modulosActivos.length}: {modulo?.label}</div>
        </div>
        {moduloActivo>0&&(
          <div style={{display:"flex",gap:6,padding:"10px 16px",overflowX:"auto"}}>
            {modulosActivos.slice(0,moduloActivo).map(m=>{
              const s=calcScoreModulo(respuestas,m);const t=getTierAuditoria(s?.pct);
              return<div key={m.id} style={{flexShrink:0,padding:"4px 10px",borderRadius:20,background:t?.bg||'#f0f4f8',border:`1px solid ${(t?.c||'#e2e8f0')}44`}}>
                <span style={{fontSize:10,fontWeight:700,color:t?.c||'#8aaabb'}}>{m.label.split(" ")[0]}: {s?`${s.ob}/${s.mx} (${s.pct}%)`:'—'}</span>
              </div>;
            })}
          </div>
        )}
        <div style={{padding:"0 16px"}}>
          <ModuloAuditoria modulo={modulo} respuestas={respuestas} onValor={onValor} onObsItem={onObsItem} onObsModulo={onObsModulo}/>
        </div>
        <div style={{position:"sticky",bottom:0,background:"#fff",padding:"12px 16px",borderTop:"1px solid #e2e8f0",display:"flex",gap:10}}>
          <button onClick={onBorrador} style={{padding:"10px 14px",borderRadius:10,border:"1px solid #c8d8e8",background:"#fff",color:"#5a7a9a",cursor:"pointer",fontSize:12,fontWeight:700}}>💾 Borrador</button>
          {moduloActivo>0&&<button onClick={onAnteriorModulo} style={{padding:"10px 14px",borderRadius:10,border:"1px solid #c8d8e8",background:"#fff",color:"#1a2f4a",cursor:"pointer",fontSize:12,fontWeight:700}}>← Anterior</button>}
          {(()=>{
            const itemsModulo=(modulo?.items||[]).filter(i=>i.activo);
            const sinResponder=itemsModulo.filter(i=>respuestas[i.id]?.valor===undefined);
            const bloqueado=sinResponder.length>0;
            return(
              <div style={{flex:1,display:"flex",flexDirection:"column",gap:4}}>
                {bloqueado&&<div style={{fontSize:10,color:"#ef4444",fontWeight:600,textAlign:"center",padding:"2px 0"}}>
                  ⚠ {sinResponder.length} ítem{sinResponder.length>1?"s":""} sin responder
                </div>}
                <button onClick={()=>{if(bloqueado)return;esUltimo?onSiguienteModulo():onSiguienteModulo();}}
                  disabled={bloqueado}
                  style={{padding:"12px",borderRadius:10,border:"none",background:bloqueado?"#e2e8f0":"linear-gradient(135deg,#00b5b4,#1a2f4a)",color:bloqueado?"#94a3b8":"#fff",cursor:bloqueado?"not-allowed":"pointer",fontSize:13,fontWeight:800,transition:"all .2s"}}>
                  {esUltimo?"Continuar → Notas":`Siguiente: ${modulosActivos[moduloActivo+1]?.label?.split(" ")[0]||"→"}`}
                </button>
              </div>
            );
          })()}
        </div>
      </div>
    );
  }

  if(paso===2){
    return(
      <div style={{padding:"16px 16px 100px"}}>
        <div style={{fontWeight:800,fontSize:15,color:"#1a2f4a",marginBottom:4}}>Observaciones y compromisos</div>
        <div style={{fontSize:12,color:"#8aaabb",marginBottom:16}}>Vega {tienda?.n}</div>
        <div style={{marginBottom:16,background:"#f8fafc",borderRadius:10,border:"1px solid #e2e8f0",padding:"12px 14px"}}>
          <div style={{fontWeight:700,fontSize:12,color:"#1a2f4a",marginBottom:8}}>Resumen por módulo</div>
          {modulosActivos.map(m=>{
            const s=calcScoreModulo(respuestas,m);const t=getTierAuditoria(s?.pct);
            const obsM=respuestas[`__obs_${m.id}`]?.obs||"";
            return(
              <div key={m.id} style={{marginBottom:10}}>
                <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:4}}>
                  <span style={{fontSize:11,color:"#5a7a9a",flex:1}}>{m.label}</span>
                  <span style={{fontWeight:800,fontSize:12,color:t.c,background:t.bg,padding:"2px 10px",borderRadius:20}}>
                    {s?`${s.ob}/${s.mx} pts · ${s.pct}%`:"S/D"} {t.icon}
                  </span>
                </div>
                {s&&<div style={{height:5,background:"#e2e8f0",borderRadius:3,overflow:"hidden"}}>
                  <div style={{height:"100%",width:s.pct+"%",background:t.c,borderRadius:3,transition:"width .4s"}}/>
                </div>}
                {obsM&&<div style={{fontSize:10,color:"#8aaabb",marginTop:2,paddingLeft:4}}>📌 {obsM.slice(0,80)}{obsM.length>80?"…":""}</div>}
              </div>
            );
          })}
          <div style={{borderTop:"1px solid #e2e8f0",paddingTop:8,marginTop:6,display:"flex",justifyContent:"space-between",alignItems:"center"}}>
            <span style={{fontWeight:800,fontSize:12,color:"#1a2f4a"}}>Score final</span>
            <span style={{fontWeight:900,fontSize:18,color:tierFinal.c}}>{scoreFinal!==null?`${scoreFinal.toFixed(1)}%`:"S/D"} {tierFinal.icon} {scoreFinal!==null?tierFinal.label:""}</span>
          </div>
        </div>
        <label style={{fontSize:12,fontWeight:700,color:"#1a2f4a",display:"block",marginBottom:6}}>Observaciones generales</label>
        <textarea value={obs} onChange={e=>onObs(e.target.value)} rows={4} placeholder="Describe lo observado durante la visita..."
          style={{width:"100%",padding:"10px 14px",borderRadius:10,border:"1.5px solid #e2e8f0",background:"#f8fafc",color:"#1a2f4a",fontSize:12,outline:"none",resize:"vertical",boxSizing:"border-box",marginBottom:14}}/>
        <label style={{fontSize:12,fontWeight:700,color:"#1a2f4a",display:"block",marginBottom:6}}>Compromisos acordados</label>
        <textarea value={compromisos} onChange={e=>onCompromisos(e.target.value)} rows={3} placeholder="¿Qué acordaste con el equipo de la tienda?"
          style={{width:"100%",padding:"10px 14px",borderRadius:10,border:"1.5px solid #e2e8f0",background:"#f8fafc",color:"#1a2f4a",fontSize:12,outline:"none",resize:"vertical",boxSizing:"border-box",marginBottom:16}}/>
        <div style={{display:"flex",gap:10}}>
          <button onClick={onBorrador} style={{padding:"12px 14px",borderRadius:10,border:"1px solid #c8d8e8",background:"#fff",color:"#5a7a9a",cursor:"pointer",fontSize:12,fontWeight:700}}>💾 Borrador</button>
          <button onClick={onCheckOut} style={{flex:1,padding:"14px",borderRadius:10,border:"none",background:"linear-gradient(135deg,#00b5b4,#1a2f4a)",color:"#fff",cursor:"pointer",fontSize:14,fontWeight:800}}>Finalizar y enviar →</button>
        </div>
      </div>
    );
  }
  return null;
}

/* ══ EXPORT — envuelto en ErrorBoundary para capturar crashes de render ══ */
export default function App(props){
  return(
    <AppErrorBoundary>
      <ChecklistApp {...props}/>
    </AppErrorBoundary>
  );
}

/* ══ LOGIN ══════════════════════════════════════════════ */
function LoginScreen({pins,auditores,usuarios,onLogin,onAcceso}){
  const usuariosActivos=(usuarios||[]).filter(u=>u.activo!==false);
  const[cred,setCred]=useState("");
  const credInputRef=useRef(null);
  const[err,setErr]=useState("");
  const[showCred,setShowCred]=useState(false);
  const[bloqueo,setBloqueo]=useState(null);
  const[intentos,setIntentos]=useState(0);
  const MAX_INTENTOS=5, BLOQUEO_MIN=10;
  // ET_FIX_LOGIN_LOCAL_DEVICE_20260614: bloqueo local por dispositivo/navegador, sin et_legacy_removed global.
  const AUTH_DEVICE_KEY="et_auth_device_attempts_v2";
  const normCred=(v)=>String(v??"").trim().toUpperCase().replace(/[\s\-_.]/g,"");
  const getLocalAuthState=()=>{try{return JSON.parse(localStorage.getItem(AUTH_DEVICE_KEY)||"{}");}catch{return {};}};
  const setLocalAuthState=(v)=>{try{localStorage.setItem(AUTH_DEVICE_KEY,JSON.stringify(v||{}));}catch{}};
  const clearLocalAuthState=()=>{try{localStorage.removeItem(AUTH_DEVICE_KEY);Object.keys(localStorage).filter(k=>k.startsWith("et_et_legacy_removed_")||k.startsWith("et_auth_cred_attempts_")||k==="et_legacy_removed").forEach(k=>localStorage.removeItem(k));}catch{}};
  useEffect(()=>{
    const st=getLocalAuthState();
    if(st?.bloqueadoHasta){
      const hasta=Number(st.bloqueadoHasta);
      const rest=Math.ceil((hasta-Date.now())/1000);
      if(rest>0){setBloqueo({hasta,restante:rest});setIntentos(Number(st.intentos||0));setErr("Dispositivo bloqueado por intentos fallidos.");}
      else clearLocalAuthState();
    }
  },[]);
  const inpS={width:"100%",padding:"14px",borderRadius:12,background:"#f8fafc",color:"#1a2f4a",outline:"none",textAlign:"center",boxSizing:"border-box",border:"2px solid #e2e8f0",fontSize:20,fontWeight:700,fontFamily:"monospace",letterSpacing:4};

  useEffect(()=>{
    if(!bloqueo) return;
    const iv=setInterval(()=>{
      const rest=Math.ceil((bloqueo.hasta-Date.now())/1000);
      if(rest<=0){
          setBloqueo(null);setIntentos(0);setErr("");
          clearLocalAuthState();
        }
      else setBloqueo(b=>({...b,restante:rest}));
    },1000);
    return()=>clearInterval(iv);
  },[bloqueo]);

  const registrarFallo=(userId)=>{
    const n=intentos+1; setIntentos(n);
    // SECURITY: registrar intento fallido en Firestore para trazabilidad (sin exponer la credencial)
    try{import("./firebase").then(({db})=>{import("firebase/firestore").then(({doc,setDoc,collection})=>{
      const ref=doc(collection(db,"auth_log"));
      setDoc(ref,{userId:userId||"",nombre:"",rol:"",timestamp:new Date().toISOString(),dispositivo:window.innerWidth<768?"mobile":"desktop",exitoso:false,intento:n});
      // SECURITY: si el intento corresponde a un usuario identificado, el bloqueo se guarda
      // en su documento (server-side) y no solo en localStorage — así no se evade cambiando
      // de navegador/dispositivo o borrando caché.
      if(userId){
        const hasta=n>=MAX_INTENTOS?Date.now()+BLOQUEO_MIN*60*1000:null;
        setDoc(doc(db,"usuarios",userId),{intentosFallidos:n,...(hasta?{bloqueadoHasta:new Date(hasta).toISOString()}:{})},{merge:true});
      }
    });});}catch{}
    if(n>=MAX_INTENTOS){
      const hasta=Date.now()+BLOQUEO_MIN*60*1000;
      setBloqueo({hasta,restante:BLOQUEO_MIN*60});
      setErr(`Bloqueado por ${BLOQUEO_MIN} minutos tras ${MAX_INTENTOS} intentos fallidos.`);
      setLocalAuthState({intentos:n,bloqueadoHasta:hasta,ts:new Date().toISOString()});
    } else {
      setErr(`Credencial incorrecta · ${MAX_INTENTOS-n} intento${MAX_INTENTOS-n!==1?"s":""} restante${MAX_INTENTOS-n!==1?"s":""}`);
      setTimeout(()=>setErr(""),3000);
    }
  };

  const registrarExito=(id,nombre,rol,tiendaId,cargo)=>{
    setIntentos(0); setBloqueo(null); clearLocalAuthState();
    try{import("./firebase").then(({db})=>{import("firebase/firestore").then(({doc,setDoc,collection})=>{
      const ref=doc(collection(db,"auth_log"));
      // SECURITY: no loguear credencial ni DNI completo — solo rol y dispositivo
      setDoc(ref,{userId:id||"",nombre,rol,timestamp:new Date().toISOString(),dispositivo:window.innerWidth<768?"mobile":"desktop",exitoso:true});
      if(id) setDoc(doc(db,"usuarios",id),{ultimoAcceso:new Date().toISOString(),intentosFallidos:0,bloqueadoHasta:null},{merge:true});
    });});}catch(e){console.error("auth_log write failed:", e?.code||"unknown");}
    onLogin(rol,nombre,id||"",cargo||"");
  };

  const tryAcceso=()=>{
    if(bloqueo){setErr(`Bloqueado — espera ${Math.floor(bloqueo.restante/60)}:${String(bloqueo.restante%60).padStart(2,"0")}`);return;}
    /* ET_FIX_LOGIN_FAST_ENTER_20260620: leer valor del DOM para capturar el último carácter antes de que React procese el onChange pendiente */
    const rawVal=credInputRef.current?.value??cred;
    const clean=normCred(rawVal);
    if(clean.length<4){setErr("Mínimo 4 caracteres");return;}
    // SECURITY: normalizar DNI/RUC/CE/código interno sin espacios ni guiones.
    if(!Array.isArray(usuarios)){setErr("Cargando credenciales. Intenta nuevamente en unos segundos.");return;}

    // 1. Buscar usuario activo por dni, credencial, id, userId, codigo o codigoInterno.
    const found=usuariosActivos.find(u=>[u.dni,u.credencial,u.id,u.userId,u.codigo,u.codigoInterno,u.usuario,u.documento,u.ruc,u.ce].some(v=>normCred(v)===clean));
    if(found){
      // SECURITY: bloqueo server-side — si el usuario tiene bloqueadoHasta vigente en Firestore,
      // se respeta aunque el dispositivo/navegador sea distinto al que generó el bloqueo.
      if(found.bloqueadoHasta&&new Date(found.bloqueadoHasta)>new Date()){
        const restSec=Math.ceil((new Date(found.bloqueadoHasta)-Date.now())/1000);
        setBloqueo({hasta:new Date(found.bloqueadoHasta).getTime(),restante:restSec});
        setErr("Usuario bloqueado por intentos fallidos. Contacta al administrador.");
        return;
      }
      onAcceso?.(found.id);
      registrarExito(found.id,found.nombre,found.rol,found.tiendaId,found.cargo);
      return;
    }

    // 2. Pins legacy (admin / viewer) para retrocompatibilidad
    // SECURITY: comparación con tiempo constante para evitar timing attacks
    const safeEq=(a,b)=>{if(!a||!b||a.length!==b.length) return false; let d=0; for(let i=0;i<a.length;i++) d|=a.charCodeAt(i)^b.charCodeAt(i); return d===0;};
    if(pins.admin&&pins.admin.length>=4&&safeEq(clean.toLowerCase(),pins.admin.toLowerCase())){registrarExito("__admin_pin__","Administrador","admin");return;}
    if(pins.viewer&&pins.viewer.length>=4&&safeEq(clean.toLowerCase(),pins.viewer.toLowerCase())){registrarExito("__visor_pin__","Gerencia","visor");return;}
    if(pins.auditor&&pins.auditor.length>=4&&safeEq(clean.toLowerCase(),pins.auditor.toLowerCase())){registrarExito("__auditor_pin__","Auditor","auditor");return;}

    // 3. Auditores legacy
    const audsLegacy=(auditores||[]).filter(a=>a.activo!==false);
    const leg=audsLegacy.find(a=>[a.dni,a.credencial,a.id,a.userId,a.codigo,a.codigoInterno,a.usuario,a.documento].some(v=>normCred(v)===clean));
    if(leg){onAcceso?.(leg.id);registrarExito(leg.id,leg.nombre,"auditor");return;}

    registrarFallo();
  };

  return(
    <div style={{fontFamily:"'DM Sans',system-ui,sans-serif",background:"linear-gradient(135deg,#b8c8d8 0%,#8aaabb 40%,#5a7a9a 100%)",minHeight:"100vh",display:"flex",alignItems:"center",justifyContent:"center",padding:20}}>
      <link href="https://fonts.googleapis.com/css2?family=DM+Sans:opsz,wght@9..40,400;9..40,600;9..40,700&family=Michroma&family=Syne:wght@700;800&display=swap" rel="stylesheet"/>
      <div style={{width:"90%",maxWidth:360,background:"#fff",borderRadius:20,padding:"32px 28px 34px",boxShadow:"0 24px 60px rgba(0,0,0,.3)",textAlign:"center"}}>
        {/* Logo */}
        <div style={{width:65,height:65,borderRadius:16,background:"linear-gradient(135deg,#00b5b4,#1a2f4a)",display:"flex",alignItems:"center",justifyContent:"center",margin:"0 auto 16px",boxShadow:"0 10px 22px rgba(0,0,0,.14)"}}>
          <svg width="40" height="40" viewBox="0 0 64 64" fill="none">
            <rect x="8" y="10" width="38" height="46" rx="5" fill="white"/>
            <rect x="18" y="6" width="18" height="10" rx="4" fill="#b2bec3"/>
            <rect x="12" y="22" width="22" height="3" rx="1.5" fill="#b2d8e8"/>
            <rect x="12" y="30" width="18" height="3" rx="1.5" fill="#b2d8e8"/>
            <rect x="12" y="38" width="14" height="3" rx="1.5" fill="#b2d8e8"/>
            <circle cx="44" cy="44" r="14" fill="#37474F"/>
            <circle cx="44" cy="44" r="10" fill="none" stroke="#78909C" strokeWidth="3"/>
            <line x1="50" y1="50" x2="56" y2="56" stroke="#37474F" strokeWidth="4" strokeLinecap="round"/>
          </svg>
        </div>
        <div style={{fontFamily:"'Michroma',sans-serif",fontSize:22,fontWeight:700,marginBottom:4}}>
          <span style={{color:"#1a2f4a"}}>Estrategia</span><span style={{color:"#e74c3c"}}>Trade</span>
        </div>
        <div style={{fontSize:11,color:"#7f93ab",marginBottom:28}}>Control de Implementaciones y Auditoria</div>

        {/* Bloqueo */}
        {bloqueo&&(
          <div style={{padding:"20px 16px",background:"#fff1f2",borderRadius:14,border:"2px solid #fecaca",marginBottom:16}}>
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#dc2626" strokeWidth="2" strokeLinecap="round" style={{marginBottom:8}}><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0110 0v4"/></svg>
            <div style={{fontWeight:700,fontSize:14,color:"#dc2626",marginBottom:4}}>Acceso bloqueado</div>
            <div style={{fontSize:12,color:"#5a7a9a",marginBottom:10}}>Demasiados intentos fallidos</div>
            <div style={{fontSize:32,fontWeight:800,color:"#dc2626",fontFamily:"monospace",letterSpacing:4}}>
              {Math.floor(bloqueo.restante/60)}:{String(bloqueo.restante%60).padStart(2,"0")}
            </div>
            <div style={{fontSize:10,color:"#8aaabb",marginTop:4}}>min : seg</div>
          </div>
        )}

        {/* Formulario único */}
        {!bloqueo&&(
          <>
            <div style={{marginBottom:8,textAlign:"left"}}>
              <label style={{fontSize:11,fontWeight:600,color:"#5a7a9a",letterSpacing:".05em"}}>CREDENCIAL DE ACCESO</label>
            </div>
            <div style={{position:"relative",marginBottom:6}}>
              <input autoFocus
                type={showCred?"text":"password"}
                value={cred}
                ref={credInputRef} onChange={e=>setCred(e.target.value.replace(/[^a-zA-Z0-9]/g,"").slice(0,12))}
                onKeyDown={e=>e.key==="Enter"&&tryAcceso()}
                placeholder="DNI / RUC / CE / código"
                maxLength={12}
                autoComplete="new-password"
                style={{...inpS,border:`2px solid ${err?"#ef4444":"#e2e8f0"}`,paddingRight:44}}/>
              <button type="button" onClick={()=>setShowCred(v=>!v)}
                style={{position:"absolute",right:14,top:"50%",transform:"translateY(-50%)",background:"none",border:"none",cursor:"pointer",color:"#8aaabb",padding:4}}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                  {showCred
                    ?<><path d="M17.94 17.94A10.07 10.07 0 0112 20c-7 0-11-8-11-8a18.45 18.45 0 015.06-5.94M9.9 4.24A9.12 9.12 0 0112 4c7 0 11 8 11 8a18.5 18.5 0 01-2.16 3.19m-6.72-1.07a3 3 0 11-4.24-4.24"/><line x1="1" y1="1" x2="23" y2="23"/></>
                    :<><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></>}
                </svg>
              </button>
            </div>
            <div style={{fontSize:10,color:"#8aaabb",marginBottom:16,textAlign:"left"}}>
              DNI (8 díg.) · RUC (11 díg.) · CE / Código interno (8–12 alfanum.)
            </div>
            {err&&<div style={{color:"#ef4444",fontSize:12,marginBottom:12,padding:"8px 12px",background:"#fff1f2",borderRadius:9,border:"1px solid #fecaca"}}>{err}</div>}
            <button onClick={tryAcceso} disabled={cred.length<4}
              style={{width:"100%",padding:"14px",borderRadius:12,border:"none",
                background:cred.length>=4?"linear-gradient(135deg,#00b5b4,#1a2f4a)":"#e2e8f0",
                color:cred.length>=4?"#fff":"#94a3b8",
                cursor:cred.length>=4?"pointer":"not-allowed",
                fontSize:15,fontWeight:700,marginBottom:0,
                boxShadow:cred.length>=4?"0 4px 14px rgba(0,181,180,.3)":"none",
                transition:"all .2s"}}>
              Ingresar →
            </button>
          </>
        )}

        <div style={{marginTop:16,fontSize:10,color:"#b2bec3"}}>EstrategiaTrade · v2.0</div>
      </div>
    </div>
  );
}
function PinModal({pins,onSave,onClose}){
  const[p,setP]=useState({...pins});
  const[show,setShow]=useState(false);
  const[pinErr,setPinErr]=useState("");
  const validarYGuardar=()=>{
    // SECURITY: pins deben tener mínimo 6 caracteres y no contener espacios
    const campos=[{k:"admin",label:"Administrador"},{k:"auditor",label:"Auditor"},{k:"viewer",label:"Visitante"}];
    for(const f of campos){
      if(p[f.k]&&(p[f.k].length<6||/\s/.test(p[f.k]))){
        setPinErr(`Código ${f.label}: mínimo 6 caracteres, sin espacios.`);
        return;
      }
    }
    setPinErr("");
    onSave(p);
  };
  return(
    <div style={{position:"fixed",inset:0,background:"rgba(26,47,74,.7)",display:"flex",alignItems:"center",justifyContent:"center",zIndex:50,backdropFilter:"blur(4px)"}}>
      <div style={{background:"#fff",borderRadius:20,padding:30,width:"90%",maxWidth:400,boxShadow:"0 24px 60px rgba(0,0,0,.3)"}}>
        <div style={{textAlign:"center",marginBottom:22}}>
          <div style={{fontSize:32,marginBottom:8}}>🔑</div>
          <div style={{fontFamily:"'Syne',sans-serif",fontWeight:800,fontSize:17,color:"#1a2f4a"}}>Gestionar Códigos de Acceso</div>
        </div>
        {[{k:"admin",label:"🛡️ Código Administrador",c:"#f6a623"},{k:"auditor",label:"Código Auditor",c:"#00b5b4"},{k:"viewer",label:"👁️ Código Visitante",c:"#74b9ff"}].map(f=>(
          <div key={f.k} style={{marginBottom:14}}>
            <label style={{fontSize:10,fontWeight:800,color:f.c,letterSpacing:".06em",display:"block",marginBottom:5}}>{f.label}</label>
            <input type={show?"text":"password"} value={p[f.k]} onChange={e=>setP(x=>({...x,[f.k]:e.target.value.replace(/\s/g,"")}))}
              style={{width:"100%",padding:"12px 14px",borderRadius:10,border:"1.5px solid "+f.c+"44",background:"#f8fafc",color:"#1a2f4a",fontSize:14,outline:"none",letterSpacing:show?3:6,fontFamily:"monospace",boxSizing:"border-box"}}/>
          </div>
        ))}
        {pinErr&&<div style={{color:"#ef4444",fontSize:11,marginBottom:10,padding:"6px 10px",background:"#fff1f2",borderRadius:8,border:"1px solid #fecaca"}}>{pinErr}</div>}
        <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:18}}>
          <input type="checkbox" id="show-pins" checked={show} onChange={e=>setShow(e.target.checked)} style={{width:16,height:16,cursor:"pointer"}}/>
          <label htmlFor="show-pins" style={{fontSize:12,color:"#5a7a9a",cursor:"pointer"}}>Mostrar códigos</label>
        </div>
        <div style={{display:"flex",gap:10}}>
          <button onClick={onClose} style={{flex:1,padding:"12px",borderRadius:10,border:"1px solid #c8d8e8",background:"#fff",color:"#5a7a9a",cursor:"pointer",fontWeight:700,fontSize:13}}>Cancelar</button>
          <button onClick={validarYGuardar} style={{flex:1,padding:"12px",borderRadius:10,border:"none",background:"linear-gradient(135deg,#00b5b4,#1a2f4a)",color:"#fff",cursor:"pointer",fontWeight:800,fontSize:13}}>Guardar</button>
        </div>
      </div>
    </div>
  );
}
