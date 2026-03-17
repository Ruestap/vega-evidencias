import { useState, useMemo, useCallback, useRef, useEffect } from "react";
import { db } from "./firebase";
import {
  collection, doc, onSnapshot,
  setDoc, getDoc, deleteDoc
} from "firebase/firestore";

/* ══ DATOS ══════════════════════════════════════════════ */
const TIENDAS_INIT = [
  {id:"t01",n:"Collique",f:"Mayorista",activa:true},
  {id:"t02",n:"Infantas",f:"Mayorista",activa:true},
  {id:"t03",n:"Productores",f:"Mayorista",activa:true},
  {id:"t04",n:"Belaunde",f:"Mayorista",activa:true},
  {id:"t05",n:"Santa Clara",f:"Supermayorista",activa:true},
  {id:"t06",n:"San Antonio",f:"Supermayorista",activa:true},
  {id:"t07",n:"Chorrillos",f:"Supermayorista",activa:true},
  {id:"t08",n:"Año Nuevo",f:"Supermayorista",activa:true},
  {id:"t09",n:"Colonial",f:"Supermayorista",activa:true},
  {id:"t10",n:"Huamantanga",f:"Supermayorista",activa:true},
  {id:"t11",n:"Filomeno",f:"Supermayorista",activa:true},
  {id:"t12",n:"Naranjal",f:"Supermayorista",activa:true},
  {id:"t13",n:"San Diego",f:"Supermayorista",activa:true},
  {id:"t14",n:"Surco",f:"Supermayorista",activa:true},
  {id:"t15",n:"Lima VES",f:"Supermayorista",activa:true},
  {id:"t16",n:"Minka",f:"Supermayorista",activa:true},
  {id:"t17",n:"Nestor Gambetta",f:"Supermayorista",activa:true},
  {id:"t18",n:"Tres Regiones",f:"Supermayorista",activa:true},
  {id:"t19",n:"Bocanegra",f:"Market",activa:true},
  {id:"t20",n:"Canta Callao",f:"Market",activa:true},
  {id:"t21",n:"Mi Perú",f:"Market",activa:true},
  {id:"t22",n:"Santo Domingo",f:"Market",activa:true},
  {id:"t23",n:"Amaranto",f:"Market",activa:true},
  {id:"t24",n:"Malvinas",f:"Market",activa:true},
  {id:"t25",n:"Husares De Junin",f:"Market",activa:true},
  {id:"t26",n:"Santa Catalina",f:"Market",activa:true},
  {id:"t27",n:"Canevaro",f:"Market",activa:true},
  {id:"t28",n:"Alayza",f:"Market",activa:true},
  {id:"t29",n:"Huandoy",f:"Market",activa:true},
  {id:"t30",n:"Las Palmeras",f:"Market",activa:true},
  {id:"t31",n:"Benavides",f:"Market",activa:true},
  {id:"t32",n:"Clement",f:"Market",activa:true},
  {id:"t33",n:"Aviación",f:"Market",activa:true},
  {id:"t34",n:"La Cultura",f:"Market",activa:true},
  {id:"t35",n:"Chimu",f:"Market",activa:true},
  {id:"t36",n:"Montenegro",f:"Market",activa:true},
  {id:"t37",n:"Izaguirre",f:"Market",activa:true},
  {id:"t38",n:"Riobamba",f:"Market",activa:true},
  {id:"t39",n:"Escardó",f:"Market",activa:true},
  {id:"t40",n:"Maranga",f:"Market",activa:true},
  {id:"t41",n:"Universal",f:"Market",activa:true},
  {id:"t42",n:"Roosevelt",f:"Market",activa:true},
  {id:"t43",n:"Higuereta",f:"Market",activa:true},
  {id:"t44",n:"Mareategui",f:"Market",activa:true},
  {id:"t45",n:"Salamanca",f:"Market",activa:true},
  {id:"t46",n:"Olimpo",f:"Market",activa:true},
  {id:"t47",n:"Nueva Esperanza",f:"Market",activa:true},
  {id:"t48",n:"Alisos",f:"Market",activa:true},
  {id:"t49",n:"Merino",f:"Market",activa:true},
  {id:"t50",n:"Rospigliosi",f:"Market",activa:true},
  {id:"t51",n:"Loreto",f:"Market",activa:true},
  {id:"t52",n:"Vara de Oro",f:"Market",activa:true},
  {id:"t53",n:"Los Olivos",f:"Market",activa:true},
  {id:"t54",n:"Mariano Pastor",f:"Market",activa:true},
  {id:"t55",n:"Amancaes 3",f:"Market",activa:true},
  {id:"t56",n:"Alameda Los Cedros",f:"Market",activa:true},
  {id:"t57",n:"Bellavista",f:"Market",activa:true},
  {id:"t58",n:"Mall Comas",f:"Market",activa:true},
  {id:"t59",n:"A. Los Condores",f:"Market",activa:true},
  {id:"t60",n:"Mariano Cornejo",f:"Market",activa:true},
  {id:"t61",n:"Las Guindas",f:"Market",activa:true},
  {id:"t62",n:"San Luis",f:"Market",activa:true},
  {id:"t63",n:"Independencia",f:"Market",activa:true},
  {id:"t64",n:"Guardia Civil",f:"Market",activa:true},
  {id:"t65",n:"Villaran",f:"Market",activa:true},
];

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

const MESES = ["Enero","Febrero","Marzo","Abril","Mayo","Junio","Julio","Agosto","Septiembre","Octubre","Noviembre","Diciembre"];
const DIAS_N = ["Domingo","Lunes","Martes","Miércoles","Jueves","Viernes","Sábado"];
const FMT = {
  Mayorista:      {c:"#6c5ce7",bg:"#f0edff"},
  Supermayorista: {c:"#0984e3",bg:"#e8f4fd"},
  Market:         {c:"#00b5b4",bg:"#e0fafa"},
};
const PUNTAJES = [
  {pct:10,icon:"🥇",label:"ORO",    c:"#f6a623",bg:"#fff8ec",key:"c100"},
  {pct:8, icon:"🥈",label:"PLATA",  c:"#74b9ff",bg:"#e8f4fd",key:"c80"},
  {pct:6, icon:"🥉",label:"BRONCE", c:"#a29bfe",bg:"#f0edff",key:"c60"},
  {pct:0, icon:"🔴",label:"FUERA",  c:"#d63031",bg:"#ffeae6",key:null},
];

/* ══ UTILS ══════════════════════════════════════════════ */
const todayStr = () => new Date().toISOString().slice(0,10);
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
  const weeks=[], last=new Date(year,month+1,0).getDate();
  let wn=1,ws=1;
  while(ws<=last){
    const we=Math.min(ws+6,last), days=[];
    for(let i=ws;i<=we;i++){const d=new Date(year,month,i).getDay();if(d>=1&&d<=5)days.push(i);}
    if(days.length>0) weeks.push({num:wn,label:"S"+wn,start:ws,end:we,days});
    wn++;ws+=7;
  }
  return weeks;
}

/* ══ LOG TABLE — componente separado para evitar conflictos de hooks en IIFE ══ */
function LogTable({filtered, regs, db, deleteDoc, doc, setDoc, showToast, sc, sb, FMT, S, isAdmin}) {
  const [selLogs, setSelLogs] = useState(new Set());

  // Escuchar evento de selección automática de duplicados
  useEffect(()=>{
    const handler = ()=>{
      if(window._logTableSelDups) {
        setSelLogs(new Set(window._logTableSelDups));
        window._logTableSelDups = null;
      }
    };
    window.addEventListener("selectDups", handler);
    return ()=>window.removeEventListener("selectDups", handler);
  },[]);

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
        return deleteDoc(doc(db, "registros", docId));
      } else {
        return setDoc(doc(db, "registros", docId), {...reg, evidencias: newEvs, updatedAt: new Date().toISOString()});
      }
    });
    await Promise.all(promises);
    showToast(`🗑️ ${selLogs.size} registro(s) eliminado(s)`);
    setSelLogs(new Set());
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

/* ══ APP ══════════════════════════════════════════════ */
export default function ChecklistApp() {
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const now = useMemo(()=>new Date(),[]); // evita new Date() en cada render
  /* ── auth ── */
  const [role,    setRole]    = useState(null);
  const [uName,   setUName]   = useState("");
  const [uDni,    setUDni]    = useState("");
  const [pins,    setPins]    = useState({admin:"vega2026",auditor:"auditor88",viewer:"gerencia1"});
  const [pinMod,  setPinMod]  = useState(false);
  const [auditores, setAuditores] = useState([]); // [{dni,nombre,activo}]
  /* ── app state ── */
  const [tab,     setTab]     = useState(0);
  const [fecha,   setFecha]   = useState(todayStr());
  const [vYear,   setVYear]   = useState(now.getFullYear());
  const [vMonth,  setVMonth]  = useState(now.getMonth());
  const [selWeek, setSelWeek] = useState(null);
  const [tiendas, setTiendas] = useState(TIENDAS_INIT);
  const [acts,    setActs]    = useState(ACTIVIDADES_INIT);
  const [regs,    setRegs]    = useState({});
  const [exceps,  setExceps]  = useState({});
  /* ── registro flow ── */
  const [paso,    setPaso]    = useState(1);
  const [actSel,  setActSel]  = useState(null);
  const [tSel,    setTSel]    = useState(new Set());
  const [rango,   setRango]   = useState(null);
  const [horaEx,  setHoraEx]  = useState("07:00");
  const [obsEx,   setObsEx]   = useState("");
  /* ── filtros ── */
  const [fmtFilt,      setFmtFilt]      = useState("Todas");
  const [busq,         setBusq]         = useState("");
  const [verRegistradas, setVerRegistradas] = useState(false);
  const [rangoExt,     setRangoExt]     = useState(null); // rango extendido temporal por actividad
  /* ── config ── */
  const [cfgTab,  setCfgTab]  = useState(0);
  const [logFmt,  setLogFmt]  = useState("Todos");
  const [logAct,  setLogAct]  = useState("Todas");
  const [logAud,  setLogAud]  = useState("Todos");
  const [logPts,  setLogPts]  = useState("Todos");
  const [logTxt,  setLogTxt]  = useState("");
  const [logFecha,setLogFecha]= useState("Todos");
  const [logSoloDups,setLogSoloDups]= useState(false);
  const [showNAud, setShowNAud] = useState(false);
  const [newAud,   setNewAud]   = useState({dni:"",nombre:""});
  const [rangosDia, setRangosDia] = useState({}); // {actId: {fecha: {c100,c80,c60}}}
  const [showNT,  setShowNT]  = useState(false);
  const [showNA,  setShowNA]  = useState(false);
  const [newT,    setNewT]    = useState({n:"",f:"Market"});
  const [newA,    setNewA]    = useState({n:"",e:"📌",c:"#6c5ce7",dias:[1,2,3,4,5],cat:"Ad-hoc"});
  const [toast,   setToast]   = useState("");
  const toastRef = useRef();
  /* ── modales de registro ── */
  const [delModal,    setDelModal]    = useState(null);
  const [anularModal, setAnularModal] = useState(null);
  const [updModal,    setUpdModal]    = useState(null);
  const [ctxMenu,     setCtxMenu]     = useState(null);
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
  /* ── tarjeta de estado ── */
  const [showStatusCard, setShowStatusCard] = useState(false);
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
      if(d.tiendas)     setTiendas(d.tiendas);
      if(d.pins)        setPins(d.pins);
      if(d.auditores)   setAuditores(d.auditores);
      if(d.rangosDia)   setRangosDia(d.rangosDia);
      // Limpiar exceps: descartar true legacy y arrays vacíos
      const exc = d.excepciones || {};
      const cleaned = Object.fromEntries(
        Object.entries(exc).filter(([,v])=>Array.isArray(v)&&v.length>0)
      );
      setExceps(cleaned);
      // Si había legacy, guardar versión limpia en Firebase (una sola vez)
      const hasLegacy = Object.values(exc).some(v=>!Array.isArray(v)||v.length===0);
      if(hasLegacy){
        setDoc(doc(db,"config","app"),{...d, excepciones:cleaned, updatedAt:new Date().toISOString()});
      }
    });
    return ()=>unsub();
  },[]);

  const saveConfig = useCallback(async (overrides={})=>{
    // Filtrar excepciones legacy (true) antes de guardar
    const excToSave = overrides.excepciones ?? exceps;
    const excClean = Object.fromEntries(
      Object.entries(excToSave).filter(([,v])=>Array.isArray(v)&&v.length>0)
    );
    await setDoc(doc(db,"config","app"),{
      actividades: overrides.actividades ?? acts,
      tiendas:     overrides.tiendas     ?? tiendas,
      pins:        overrides.pins        ?? pins,
      auditores:   overrides.auditores   ?? auditores,
      excepciones: excClean,
      rangosDia:   overrides.rangosDia   ?? rangosDia,
      updatedAt:   new Date().toISOString(),
    });
  },[acts,tiendas,pins,exceps,rangosDia,auditores]);

  const dow = getDow(fecha);
  const esFS = dow===0||dow===6;
  const tiAct = useMemo(()=>tiendas.filter(ti=>ti.activa),[tiendas]);
  const actsDia = useMemo(()=>acts.filter(a=>a.activa&&a.dias.includes(dow)),[acts,dow]);
  const actInfo = useMemo(()=>acts.find(a=>a.id===actSel),[acts,actSel]);
  const getRangoActivo = useCallback((actId, fechaStr)=>{
    const override = rangosDia?.[actId]?.[fechaStr];
    if(override) return override;
    const act = acts.find(a=>a.id===actId);
    return act?.r || RANGOS_DEFAULT;
  },[rangosDia, acts]);
  const semanasDelMes = useMemo(()=>getWeeksOfMonth(vYear,vMonth),[vYear,vMonth]);
  const isAdmin   = role==="admin";
  const isAuditor = role==="admin"||role==="auditor";

  const getReg = useCallback((f,tid,a)=>{
    const k=rKey(f,tid,a);
    const docId=k.replace(/\|/g,"--");
    return regs[docId]||regs[k]||null;
  },[regs]);
  const isExc = useCallback((tId,aId,fechaCheck)=>{
    const v = exceps[tId+"|"+aId];
    if(!v) return false;
    // legacy true: ya no aplica — debe reregistrarse con fecha específica
    if(v===true) return false;
    // array de fechas: solo excluir si la fecha específica está en el array
    if(Array.isArray(v)){
      if(!fechaCheck) return false; // sin fecha = no excluir
      return v.includes(fechaCheck);
    }
    return false;
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
      if(hhmm===t1&&!sessionStorage.getItem(key1)){
        sessionStorage.setItem(key1,"1");
        setShowStatusCard(true);
      }
      if(hhmm===t2&&!sessionStorage.getItem(key2)){
        sessionStorage.setItem(key2,"1");
        setShowStatusCard(true);
      }
    };
    const interval=setInterval(check,30000); // revisa cada 30 seg
    return()=>clearInterval(interval);
  },[]);

  const showToast = msg=>{
    setToast(msg);
    if(toastRef.current)clearTimeout(toastRef.current);
    toastRef.current=setTimeout(()=>setToast(""),2500);
  };

  /* ── cálculos KPI ── */
  const kpisDia = useMemo(()=>{
    if(!actSel)return{total:0,IC:0,IP:0,SE:0,TR:0,SG:0,al100:0,conEnvio:0};
    const AR=getRangoActivo(actSel,fecha);
    const ts=tiAct.filter(ti=>!isExc(ti.id,actSel,fecha));
    const total=ts.length;
    const withEnv=ts.filter(ti=>puntajeReg(getReg(fecha,ti.id,actSel),AR)!==null);
    const pts=ts.map(ti=>puntajeReg(getReg(fecha,ti.id,actSel),AR));
    const IC=total>0?Math.round((withEnv.length/total)*100):0;
    const valid=pts.filter(p=>p!==null);
    const IP_pts=valid.length>0?(valid.reduce((a,b)=>a+b,0)/valid.length):0; // promedio puntos 0-10
    const IP=Math.round((IP_pts/10)*100); // normalizar a % para que SG sea coherente
    const al100=pts.filter(p=>p===10).length;
    const SE=total>0?Math.round((al100/total)*100):0;
    const TR=total>0?Math.round((ts.filter(ti=>puntajeReg(getReg(fecha,ti.id,actSel),AR)===null).length/total)*100):0;
    const SG=Math.round((IC*IP)/100); // IC% × IP% → Score Global %
    const r100=withEnv.filter(ti=>puntajeReg(getReg(fecha,ti.id,actSel),AR)===10);
    const r80=withEnv.filter(ti=>puntajeReg(getReg(fecha,ti.id,actSel),AR)===8);
    const r60=withEnv.filter(ti=>puntajeReg(getReg(fecha,ti.id,actSel),AR)===6);
    const r0=ts.filter(ti=>puntajeReg(getReg(fecha,ti.id,actSel),AR)===null);
    return{total,IC,IP,SE,TR,SG,al100,conEnvio:withEnv.length,r100,r80,r60,r0};
  },[actSel,actInfo,tiAct,isExc,getReg,fecha]);

  // calcEficiencia: retorna {pct, obtenidos, maximos, registros}
  // pct = (pts obtenidos / pts máximos posibles) * 100
  // actsConRegistroIds: actividades con al menos 1 registro en el MES EN VISTA
  // Filtra por mes — evita columnas fantasma y maximos inflados → RIESGO falso.
  const actsConRegistroIds = useMemo(()=>{
    const ids = new Set();
    const ymPrefix = `${vYear}-${String(vMonth+1).padStart(2,"0")}`;
    Object.entries(regs).forEach(([,r])=>{
      if(!r?.actividadId||!r?.evidencias?.length||r.anulado) return;
      const f = r.fecha||"";
      // Solo contar si la fecha del registro corresponde al mes en vista
      // y el registro tiene campo fecha explícito (evita registros de prueba sin fecha)
      if(f.startsWith(ymPrefix) && f.length===10) ids.add(r.actividadId);
    });
    return ids;
  },[regs,vYear,vMonth]);

  const calcEficiencia = useCallback((tId, days)=>{
    let obtenidos=0, maximos=0, registros=[];
    const hoy=todayStr(); // no contar días futuros en el denominador
    days.forEach(ds=>{
      if(ds>hoy) return; // día futuro: no suma al máximo
      const dw=getDow(ds);
      acts.filter(a=>
        a.activa &&
        a.dias.includes(dw) &&
        !isExc(tId,a.id,ds) &&
        actsConRegistroIds.has(a.id) // solo actividades con historial real
      ).forEach(a=>{
        const p=puntajeReg(getReg(ds,tId,a.id),getRangoActivo(a.id,ds));
        maximos+=10; // día pasado/hoy sin registro = 0pts de 10 posibles
        if(p!==null){
          obtenidos+=p;
          registros.push({fecha:ds,act:a.n,pts:p,max:10});
        }
      });
    });
    if(maximos===0) return null;
    return {pct:Math.round((obtenidos/maximos)*100), obtenidos, maximos, registros};
  },[acts,regs,actsConRegistroIds,isExc,getReg,getRangoActivo]);

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
    const AR = rangoExt || actInfo?.r || RANGOS_DEFAULT;
    const pct=calcP(horaEx,AR);
    const tier=getTierPts(pct);
    let n=0;
    const promises=[];
    tSel.forEach(tId=>{
      const k=rKey(fecha,tId,actSel);
      const now=new Date();
      const hreg=now.toLocaleTimeString("es-PE",{hour:"2-digit",minute:"2-digit"});
      const docId=k.replace(/\|/g,"--");
      const ev={id:Date.now()+n,hora:horaEx,puntaje:pct,observacion:obsEx||`Registro en bloque · ${tier.label}`,horaRegistro:hreg,auditor:uName,dni:uDni,timestamp:now.toISOString()};
      const prevEvs=(regs[docId]?.evidencias)||(regs[k]?.evidencias)||[];
      const newEvs=[...prevEvs,ev].sort((a,b)=>a.hora.localeCompare(b.hora));
      // Save to Firestore — key as doc id (replace | with -)
      promises.push(setDoc(doc(db,"registros",docId),{evidencias:newEvs,fecha,tiendaId:tId,actividadId:actSel,updatedAt:now.toISOString()}));
      n++;
    });
    await Promise.all(promises);
    showToast(`✅ ${n} tienda${n!==1?"s":""} · ${horaEx} · ${pct} pts ${tier.icon} ${tier.label}`);
    setTSel(new Set());setRango(null);setHoraEx("07:00");setObsEx("");setPaso(2);setVerRegistradas(false);
  };

  const eliminarRegistro = async (docId) => {
    await deleteDoc(doc(db,"registros",docId));
    showToast("🗑️ Registro eliminado");
    setDelModal(null);
  };

  const anularRegistro = async () => {
    if(!anularModal||!motivoAnu) return;
    const {docId, docData} = anularModal;
    await setDoc(doc(db,"registros",docId), {
      ...docData,
      anulado: true,
      motivoAnulacion: motivoAnu,
      detalleAnulacion: detalleAnu,
      anuladoPor: uName,
      anuladoEn: new Date().toISOString(),
    });
    showToast("⚠️ Registro anulado correctamente");
    setAnularModal(null); setMotivoAnu(""); setDetalleAnu("");
  };

  const actualizarRegistro = async () => {
    if(!updModal||!horaUpd||!motivoUpd) return;
    const {docId, docData, actividadId} = updModal;
    const AR = acts.find(a=>a.id===actividadId)?.r || RANGOS_DEFAULT;
    const pct = calcP(horaUpd, AR);
    const tier = getTierPts(pct);
    const now2 = new Date();
    const ev = {
      id: Date.now(),
      hora: horaUpd,
      puntaje: pct,
      observacion: `Corrección: ${motivoUpd}`,
      horaRegistro: now2.toLocaleTimeString("es-PE",{hour:"2-digit",minute:"2-digit"}),
      auditor: uName,
      timestamp: now2.toISOString(),
      esCorreccion: true,
    };
    const prevEvs = docData.evidencias || [];
    const newEvs = [...prevEvs, ev].sort((a,b)=>a.hora.localeCompare(b.hora));
    await setDoc(doc(db,"registros",docId), {...docData, evidencias: newEvs, updatedAt: now2.toISOString()});
    showToast(`✏️ Registro actualizado · ${horaUpd} · ${pct} pts ${tier.icon}`);
    setUpdModal(null); setHoraUpd(""); setMotivoUpd("");
  };

  const toggleExcepcion = async (tId, aId) => {
    const key = tId+"|"+aId;
    const newExceps = {...exceps};
    const cur = newExceps[key];
    // cur puede ser: undefined, true (legacy), o array de fechas
    const fechas = Array.isArray(cur) ? cur : (cur===true ? [] : []);
    if(fechas.includes(fecha)){
      // quitar esta fecha
      const updated = fechas.filter(f=>f!==fecha);
      if(updated.length===0) delete newExceps[key];
      else newExceps[key] = updated;
      showToast("✅ Excepción removida para esta fecha");
    } else {
      newExceps[key] = [...fechas, fecha];
      showToast("⚠️ Tienda excluida solo para "+fecha);
    }
    setExceps(newExceps);
    await saveConfig({excepciones: newExceps});
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
  if(!role) return <LoginScreen pins={pins} auditores={auditores} onLogin={(r,n,dni)=>{setRole(r);setUName(n);setUDni(dni||"");setVerRegistradas(false);setTab(r==="viewer"?1:0);}}/>;

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
            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:6,marginBottom:6}}>
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
          {nPend>0&&<span style={S.pill("#0984e3","#e8f4fd")}>⏳ {nPend} pendiente{nPend!==1?"s":""}</span>}
          {nNA>0&&<span style={S.pill("#854F0B","#FAEEDA")}>N/A {nNA}</span>}
          {!isAdmin&&nNA===0&&<span style={S.pill("#0984e3","#e8f4fd")}>🔒 Solo pendientes</span>}
        </div>
        <div style={{display:"flex",gap:6,alignItems:"center"}}>
          {isAdmin&&(
            <div style={{display:"flex",borderRadius:9,overflow:"hidden",border:"1.5px solid #e2e8f0",background:"#f8fafc"}}>
              <button onClick={()=>setVerRegistradas(false)}
                style={{padding:"6px 12px",border:"none",background:!verRegistradas?"#1a2f4a":"transparent",color:!verRegistradas?"#fff":"#5a7a9a",cursor:"pointer",fontSize:11,fontWeight:700,transition:"all .15s"}}>
                ⏳ Pendientes
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
                  onClick={e=>{e.stopPropagation();toggleExcepcion(tienda.id,actSel);}}
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
    const AR = rangoExt || actInfo?.r || RANGOS_DEFAULT;
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
          <input
            type="time"
            value={horaEx}
            onChange={e=>setHoraEx(e.target.value)}
            style={{
              width:"100%",padding:"16px",borderRadius:14,
              border:`3px solid ${pv!==null?tier.c:"#c8d8e8"}`,
              background: pv!==null?tier.bg:"#f8fafc",
              color:"#1a2f4a",fontSize:28,outline:"none",
              textAlign:"center",fontWeight:700,
              transition:"all .2s",boxSizing:"border-box"
            }}
          />
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
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:6}}>
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
            <div style={{fontSize:11,color:tier.c,fontWeight:700,marginBottom:8}}>📋 RESUMEN DEL REGISTRO</div>
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
      {esFS?(
        <div style={{padding:"32px 16px",textAlign:"center"}}>
          <div style={{fontSize:40,marginBottom:12}}>😴</div>
          <div style={{fontWeight:700,fontSize:16,color:"#1a2f4a",marginBottom:6}}>Fin de semana</div>
          <div style={{fontSize:13,color:"#8aaabb"}}>Sábado y domingo no tienen actividades programadas</div>
        </div>
      ):paso===1?renderPaso1():paso===2?renderPaso2():renderPaso3()}
    </div>
  );

  /* ══ TAB REPORTE SEMANAL ══ */
  const renderReporte = ()=>{
    const actsActivas=acts.filter(a=>a.activa&&actsConRegistroIds.has(a.id)); // solo cols con historial en el mes
    const semsVis=selWeek!==null?[semanasDelMes[selWeek]]:semanasDelMes;
    return(
      <div style={{padding:"16px"}}>
        {/* nav mes */}
        <div style={{display:"flex",gap:8,alignItems:"center",marginBottom:14,flexWrap:"wrap"}}>
          <button onClick={()=>navMes(-1)} style={{padding:"8px 14px",borderRadius:9,border:"1px solid #c8d8e8",background:"#fff",cursor:"pointer",fontWeight:700,fontSize:13}}>←</button>
          <span style={{fontWeight:800,fontSize:15,color:"#1a2f4a",flex:1,textAlign:"center"}}>{MESES[vMonth].toUpperCase()} {vYear}</span>
          <button onClick={()=>navMes(1)} style={{padding:"8px 14px",borderRadius:9,border:"1px solid #c8d8e8",background:"#fff",cursor:"pointer",fontWeight:700,fontSize:13}}>→</button>
          <div style={{width:"100%",display:"flex",gap:6}}>
            <button onClick={()=>setSelWeek(null)} style={{flex:1,padding:"7px",borderRadius:8,border:`1.5px solid ${selWeek===null?"#00b5b4":"#e2e8f0"}`,background:selWeek===null?"#e0fafa":"#fff",color:selWeek===null?"#00b5b4":"#5a7a9a",cursor:"pointer",fontSize:11,fontWeight:700}}>Mes</button>
            {semanasDelMes.map((s,i)=>(
              <button key={i} onClick={()=>setSelWeek(i)} style={{flex:1,padding:"7px",borderRadius:8,border:`1.5px solid ${selWeek===i?"#6c5ce7":"#e2e8f0"}`,background:selWeek===i?"#f0edff":"#fff",color:selWeek===i?"#6c5ce7":"#5a7a9a",cursor:"pointer",fontSize:11,fontWeight:700}}>{s.label}</button>
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

                      {semsVis.map(s=>actsActivas.map(a=>(
                        <th key={s.label+a.id} style={{padding:"8px 8px",textAlign:"center",color:a.c,fontWeight:700,fontSize:9,borderBottom:"1px solid #e9eef5",minWidth:50,whiteSpace:"nowrap",background:"#f8fafc",position:"sticky",top:0}}>{s.label}<br/>{a.e}</th>
                      )))}
                      {semsVis.map(s=>(
                        <th key={"p"+s.label} style={{padding:"8px 8px",textAlign:"center",color:"#1a2f4a",fontWeight:800,fontSize:9,borderBottom:"1px solid #e9eef5",background:"#f0f4f8",minWidth:55,position:"sticky",top:0}}>
                          {s.label}<br/>EF.%
                        </th>
                      ))}
                      {selWeek===null&&<th style={{padding:"8px 8px",textAlign:"center",color:"#fff",fontWeight:800,fontSize:10,borderBottom:"1px solid #e9eef5",background:fc.c,minWidth:55,position:"sticky",top:0}}>MES</th>}
                      <th style={{padding:"8px 8px",textAlign:"center",fontWeight:800,fontSize:9,borderBottom:"1px solid #e9eef5",background:"#f8fafc",minWidth:55,position:"sticky",top:0}}>EF</th>
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

                          {semsVis.map(sem=>actsActivas.map(a=>{
                            // N/A solo si TODOS los días donde aplica la actividad tienen excepción
                            const diasActSem=sem.days.filter(d=>acts.find(a2=>a2.id===a.id)?.dias.includes(getDow(dStr(vYear,vMonth,d))));
                            const excepcion=diasActSem.length>0&&diasActSem.every(d=>isExc(tr.id,a.id,dStr(vYear,vMonth,d)));
                            const ds=sem.days.map(d=>dStr(vYear,vMonth,d));
                            const scores=ds.flatMap(d=>{const rv=getReg(d,tr.id,a.id);const p=puntajeReg(rv,getRangoActivo(a.id,d));return p!==null?[p]:[];});
                            // eficiencia % = pts obtenidos / pts maximos posibles (solo si hay registros)
                            const hoyC=todayStr();
                            const diasConAct=ds.filter(d=>d<=hoyC&&acts.find(a2=>a2.id===a.id)?.dias.includes(getDow(d)));
                            // Solo contar si la actividad tiene historial real
                            const maxPosible=actsConRegistroIds.has(a.id)?diasConAct.length*10:0;
                            const v=(!excepcion&&scores.length>0&&maxPosible>0)?Math.round((scores.reduce((x,y)=>x+y,0)/maxPosible)*100):null;
                            const docIds=ds.flatMap(d=>{const k=rKey(d,tr.id,a.id);const docId=k.replace(/\|/g,"--");return(regs[docId]||regs[k])?[{docId,docData:regs[docId]||regs[k],fecha:d,actividadId:a.id}]:[];});
                            const auditorCell=ds.map(d=>{const rv=getReg(d,tr.id,a.id);return rv?.evidencias?.[0]?.auditor||null;}).filter(Boolean)[0]||null;
                            const anulado=ds.some(d=>{const k=rKey(d,tr.id,a.id);const docId=k.replace(/\|/g,"--");const rv=regs[docId]||regs[k];return rv?.anulado;});
                            const menuId=`ctx-${tr.id}-${sem.label}-${a.id}`;
                            return(
                              <td key={sem.label+a.id} style={{padding:"6px 8px",textAlign:"center",position:"relative",background:excepcion?"#fafafa":"transparent"}}>
                                {anulado?(
                                  <span style={{padding:"2px 6px",borderRadius:20,fontSize:9,fontWeight:700,color:"#854F0B",background:"#FAEEDA",border:"0.5px solid #FAC775"}}>⚠️ Anu.</span>
                                ):excepcion?(
                                  <span title="Excepción: tienda no aplica para esta actividad" style={{padding:"2px 6px",borderRadius:20,fontSize:9,fontWeight:700,color:"#854F0B",background:"#FAEEDA",border:"0.5px solid #FAC775",cursor:"default"}}>N/A</span>
                                ):v!==null?(
                                  <div style={{display:"flex",flexDirection:"column",alignItems:"center",gap:2}}
                                    onMouseDown={()=>{ clearTimeout(longPressRef.current); longPressRef.current=setTimeout(()=>setCtxMenu({menuId,t:tr,sem,a,docIds}),700); }}
                                    onMouseUp={()=>clearTimeout(longPressRef.current)}
                                    onMouseLeave={()=>clearTimeout(longPressRef.current)}
                                    onTouchStart={()=>{ clearTimeout(longPressRef.current); longPressRef.current=setTimeout(()=>setCtxMenu({menuId,t:tr,sem,a,docIds}),700); }}
                                    onTouchEnd={()=>clearTimeout(longPressRef.current)}
                                    style={{cursor:"pointer"}}>
                                    <span style={{padding:"2px 7px",borderRadius:20,fontSize:10,fontWeight:700,color:sc(v),background:sb(v)}}>{scores.reduce((a,b)=>a+b,0)}/{maxPosible}pts</span>
                                    <div style={{fontSize:8,color:"#8aaabb",marginTop:1}}>{v}%</div>
                                    {auditorCell&&<div style={{fontSize:7,color:"#0984e3",whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis",maxWidth:60}}>{auditorCell.split(" ")[0]}</div>}
                                    <div style={{height:2,width:"100%",borderRadius:1,background:"#e2e8f0",overflow:"hidden",marginTop:1}}>
                                      <div style={{height:"100%",width:`${v}%`,background:sc(v),borderRadius:1}}/>
                                    </div>
                                  </div>
                                ):<span style={{color:"#d1d5db",fontSize:9}}>—</span>}
                              </td>
                            );
                          }))}
                          {semsVis.map(sem=>{
                            const ps=calcSemana(tr.id,sem);
                            const detSem=calcSemanaDetalle(tr.id,sem);
return <td key={"p"+sem.label} style={{padding:"6px 8px",textAlign:"center",background:"#f8fafc"}}>
  {ps!==null
    ?<div style={{display:"flex",flexDirection:"column",alignItems:"center",gap:1}}>
        <span style={{padding:"2px 6px",borderRadius:20,fontSize:10,fontWeight:800,color:sc(ps),background:sb(ps)}}>{ps}%</span>
        <span style={{fontSize:8,color:"#8aaabb"}}>{detSem?.obtenidos}/{detSem?.maximos}pts</span>
      </div>
    :<span style={{color:"#d1d5db"}}>—</span>}
</td>;
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
    actsActivas.filter(a=>a.dias.includes(dw)).forEach(()=>{ mxTeorico+=10; });
  });
  const pctBase=mxTeorico>0&&detMes?Math.round((detMes.maximos/mxTeorico)*100):null;
  return <td style={{padding:"6px 8px",textAlign:"center",background:sb(pMes)}}>
    {pMes!==null
      ?<div style={{display:"flex",flexDirection:"column",alignItems:"center",gap:1}}>
          <span style={{fontWeight:800,fontSize:12,color:sc(pMes)}}>{pMes}%</span>
          <span style={{fontSize:8,color:"#8aaabb"}}>{detMes?.obtenidos}/{detMes?.maximos}pts</span>
          {pctBase!==null&&pctBase<100&&<span style={{fontSize:7,color:"#854F0B",background:"#FAEEDA",borderRadius:4,padding:"0 3px"}}>⚠️ N/A parcial</span>}
        </div>
      :<span style={{color:"#b2bec3"}}>—</span>}
  </td>;
})()}
                          <td style={{padding:"6px 8px",textAlign:"center"}}><span style={{fontSize:13}}>{tier.icon}</span><div style={{fontSize:8,fontWeight:700,color:tier.c}}>{tier.label}</div></td>
                        </tr>
                      );
                    })}
                  </tbody>
                  {/* FILA TOTAL DEL FORMATO */}
                  <tfoot>
                    <tr style={{background:"#f0f4f8",borderTop:"2px solid #e2e8f0"}}>
                      <td style={{padding:"8px 12px",fontWeight:800,fontSize:10,color:"#1a2f4a",position:"sticky",left:0,background:"#f0f4f8",zIndex:2,boxShadow:"2px 0 4px rgba(0,0,0,.06)"}}>TOTAL {fmt.toUpperCase()}</td>
                      {semsVis.map(sem=>actsActivas.map(a=>{
                        let ob=0,mx=0;
                        tsFmt.forEach(tr=>{
                          const ds=sem.days.map(d=>dStr(vYear,vMonth,d));
                          const diasA=ds.filter(d=>acts.find(a2=>a2.id===a.id)?.dias.includes(getDow(d)));
                          const hoyT=todayStr();
                          diasA.forEach(d=>{
                            if(d>hoyT) return; // día futuro
                            if(isExc(tr.id,a.id,d)) return;
                            mx+=10;
                            const rv=getReg(d,tr.id,a.id);
                            const p=puntajeReg(rv,getRangoActivo(a.id,d));
                            if(p!==null) ob+=p;
                          });
                        });
                        const ef=mx>0?Math.round((ob/mx)*100):null;
                        return <td key={sem.label+a.id} style={{padding:"6px 8px",textAlign:"center"}}>
                          {mx>0?(
                            ob>0
                              ?<span style={{fontSize:9,fontWeight:800,color:sc(ef)}}>{ob}/{mx}<br/><span style={{fontSize:8,fontWeight:400}}>{ef}%</span></span>
                              :<span style={{fontSize:8,color:"#b2bec3"}}>{mx}pts<br/>pend.</span>
                          ):<span style={{color:"#d1d5db",fontSize:9}}>—</span>}
                        </td>;
                      }))}
                      {semsVis.map(sem=>{
                        let ob=0,mx=0;
                        tsFmt.forEach(tr=>{ const ef=calcSemanaDetalle(tr.id,sem); if(ef){ob+=ef.obtenidos;mx+=ef.maximos;} });
                        const ef=mx>0?Math.round((ob/mx)*100):null;
                        return <td key={"tot"+sem.label} style={{padding:"6px 8px",textAlign:"center",background:"#e8edf2"}}>
                          {ef!==null?<span style={{fontSize:10,fontWeight:800,color:sc(ef)}}>{ef}%<br/><span style={{fontSize:8,fontWeight:400}}>{ob}/{mx}pts</span></span>:<span style={{color:"#d1d5db"}}>—</span>}
                        </td>;
                      })}
                      {selWeek===null&&(()=>{
                        let ob=0,mx=0;
                        tsFmt.forEach(tr=>{ const ef=calcMesDetalle(tr.id); if(ef){ob+=ef.obtenidos;mx+=ef.maximos;} });
                        const ef=mx>0?Math.round((ob/mx)*100):null;
                        return <td style={{padding:"6px 8px",textAlign:"center",background:ef?sb(ef):"#f0f4f8"}}>
                          {ef!==null?<span style={{fontWeight:800,fontSize:11,color:sc(ef)}}>{ef}%<br/><span style={{fontSize:8,fontWeight:400}}>{ob}/{mx}</span></span>:<span style={{color:"#b2bec3"}}>—</span>}
                        </td>;
                      })()}
                      {(()=>{
                        // Medalla resumen del formato en el período visible
                        const allDays=semsVis.flatMap(s=>s.days.map(d=>dStr(vYear,vMonth,d)));
                        let ob=0,mx=0;
                        tsFmt.forEach(tr=>{ const ef=calcEficiencia(tr.id,allDays); if(ef){ob+=ef.obtenidos;mx+=ef.maximos;} });
                        const ef=mx>0?Math.round((ob/mx)*100):null;
                        const tierFmt=getTier(ef);
                        return <td style={{padding:"6px 8px",textAlign:"center",background:tierFmt.bg}}>
                          {ef!==null?<><span style={{fontSize:14}}>{tierFmt.icon}</span><div style={{fontSize:8,fontWeight:800,color:tierFmt.c}}>{tierFmt.label}</div></>:<span style={{color:"#d1d5db",fontSize:9}}>—</span>}
                        </td>;
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
              <tbody>
                <tr style={{background:"#1a2f4a"}}>
                  <td style={{padding:"10px 14px",fontWeight:800,fontSize:11,color:"#fff",position:"sticky",left:0,background:"#1a2f4a",zIndex:2,whiteSpace:"nowrap",minWidth:140}}>
                    🏁 TOTAL GENERAL
                    <div style={{fontSize:9,color:"#8aaabb",fontWeight:400,marginTop:1}}>{tiAct.length} tiendas · {MESES[vMonth]} {vYear}</div>
                  </td>
                  {/* celdas vacías para alinear con columnas actividad×semana */}
                  {semsVis.flatMap(s=>actsActivas.map(a=>(
                    <td key={s.label+a.id} style={{padding:"6px 8px",textAlign:"center"}}>
                      {(()=>{
                        let ob=0,mx=0;
                        const ds=s.days.map(d=>dStr(vYear,vMonth,d));
                        const hoyT=todayStr();
                        tiAct.forEach(tr=>{
                          ds.filter(d=>d<=hoyT&&acts.find(a2=>a2.id===a.id)?.dias.includes(getDow(d))&&!isExc(tr.id,a.id,d)).forEach(d=>{
                            mx+=10;
                            const p=puntajeReg(getReg(d,tr.id,a.id),getRangoActivo(a.id,d));
                            if(p!==null) ob+=p;
                          });
                        });
                        const ef=mx>0?Math.round((ob/mx)*100):null;
                        return mx>0
                          ?<div style={{display:"flex",flexDirection:"column",alignItems:"center",gap:1}}><span style={{fontSize:9,fontWeight:700,color:ob>0?sc(ef):"#b2bec3"}}>{ob>0?`${ob}/${mx}`:`${mx}pts`}</span><span style={{fontSize:8,fontWeight:400,color:ob>0?sc(ef):"#b2bec3"}}>{ob>0?ef+"%":"pend."}</span></div>
                          :<span style={{color:"#5a7a9a",fontSize:9}}>—</span>;
                      })()}
                    </td>
                  )))}
                  {/* totales EF.% por semana */}
                  {totSems.map((ts,i)=>(
                    <td key={"gs"+i} style={{padding:"6px 10px",textAlign:"center",background:"#0d1f35"}}>
                      {ts.ef!==null
                        ?<div style={{display:"flex",flexDirection:"column",alignItems:"center",gap:1}}><span style={{fontSize:11,fontWeight:800,color:sc(ts.ef)}}>{ts.ef}%</span><span style={{fontSize:8,color:"#8aaabb"}}>{ts.ob}/{ts.mx}pts</span></div>
                        :<span style={{color:"#5a7a9a"}}>—</span>}
                    </td>
                  ))}
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
    const calcEficienciaFiltrada = (tId)=>{
      let obtenidos=0, maximos=0;
      semanasDelMes.forEach(s=>{
        s.days.forEach(day=>{
          const ds=dStr(vYear,vMonth,day);
          if(ds>todayStr()) return; // día futuro
          const dw=getDow(ds);
          actsBase.filter(a=>a.dias.includes(dw)&&!isExc(tId,a.id,ds)&&actsConRegistroIds.has(a.id)).forEach(a=>{
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
        const dw=getDow(ds);
        actsBase.filter(a=>a.dias.includes(dw)&&!isExc(tId,a.id,ds)&&actsConRegistroIds.has(a.id)).forEach(a=>{
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

    // distribución horaria
    const allEvs=Object.values(regs).filter(r=>!r.anulado).flatMap(r=>r.evidencias||[]);
    const horasDist=[
      {l:"🥇 ORO ≤08:00",   c:"#f6a623", n:allEvs.filter(e=>toMin(e.hora)<=toMin("08:00")).length},
      {l:"🥈 PLATA ≤09:00", c:"#74b9ff", n:allEvs.filter(e=>toMin(e.hora)>toMin("08:00")&&toMin(e.hora)<=toMin("09:00")).length},
      {l:"🥉 BRONCE ≤10:00",c:"#a29bfe", n:allEvs.filter(e=>toMin(e.hora)>toMin("09:00")&&toMin(e.hora)<=toMin("10:00")).length},
      {l:"🔴 FUERA >10:00",  c:"#d63031", n:allEvs.filter(e=>toMin(e.hora)>toMin("10:00")).length},
    ];
    const totalEvs=allEvs.length||1;

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
            if(!a.dias.includes(getDow(ds))) return;
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

    const exportPDF=window._vegaPDF=()=>{
      const w=window.open("","_blank");
      w.document.write(`<html><head><title>VEGA Evidencias - ${MESES[vMonth]} ${vYear}</title>
      <style>body{font-family:Arial,sans-serif;padding:24px;color:#1a2f4a;font-size:12px;}
      h1{font-size:18px;border-bottom:2px solid #1a2f4a;padding-bottom:8px;margin-bottom:16px;}
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
      </style></head><body>
      <h1>VEGA · EVIDENCIAS — ${MESES[vMonth].toUpperCase()} ${vYear}</h1>
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
      <div class="footer"><span>VEGA · EVIDENCIAS · Control de Implementación</span><span>Confidencial · ${new Date().toLocaleDateString("es-PE")}</span></div>
      </body></html>`);
      w.document.close();
      w.print();
    };

    return(
      <div style={{padding:"16px"}}>
        {/* nav mes */}
        <div style={{display:"flex",gap:8,alignItems:"center",marginBottom:12}}>
          <button onClick={()=>navMes(-1)} style={{padding:"8px 14px",borderRadius:9,border:"1px solid #c8d8e8",background:"#fff",cursor:"pointer",fontWeight:700,fontSize:13}}>←</button>
          <span style={{fontWeight:800,fontSize:15,color:"#1a2f4a",flex:1,textAlign:"center"}}>{MESES[vMonth].toUpperCase()} {vYear}</span>
          <button onClick={()=>navMes(1)} style={{padding:"8px 14px",borderRadius:9,border:"1px solid #c8d8e8",background:"#fff",cursor:"pointer",fontWeight:700,fontSize:13}}>→</button>
        </div>

        {/* filtros */}
        <div style={{...S.card,padding:"12px 14px",marginBottom:14}}>
          <div style={{fontSize:10,fontWeight:700,color:"#5a7a9a",marginBottom:8,letterSpacing:".05em"}}>FILTROS</div>
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:8}}>
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

        {/* KPIs */}
        {(()=>{
          const nEval=tsEval.length;
          // IC: tiendas con al menos 1 registro válido en el período (no anulado)
          const nCump=tsEval.filter(ti=>semanasDelMes.some(s=>s.days.some(d=>{
            const ds=dStr(vYear,vMonth,d); const dw=getDow(ds);
            return actsBase.some(a=>a.dias.includes(dw)&&!isExc(ti.id,a.id,ds)&&puntajeReg(getReg(ds,ti.id,a.id),getRangoActivo(a.id,ds))!==null);
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
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10,marginBottom:14}}>
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
              return(
                <div key={i} style={{flex:1,display:"flex",flexDirection:"column",alignItems:"center",gap:3}}>
                  {trend&&<div style={{fontSize:10,fontWeight:800,color:trend==="↑"?"#00b894":trend==="↓"?"#d63031":"#8aaabb"}}>{trend}</div>}
                  {!trend&&<div style={{fontSize:10}}> </div>}
                  <div style={{fontSize:13,fontWeight:800,color:isFuture?"#b2bec3":v!==null?sc(v):"#b2bec3"}}>{v!==null?v+"%":"—"}</div>
                  <div style={{width:"100%",height:80,background:"#f0f4f8",borderRadius:6,display:"flex",alignItems:"flex-end",overflow:"hidden",position:"relative"}}>
                    {v!==null&&!isFuture&&<div style={{width:"100%",height:barH+"px",background:sc(v),borderRadius:"4px 4px 0 0",transition:"height .4s"}}/>}
                    {isFuture&&<div style={{position:"absolute",inset:0,display:"flex",alignItems:"center",justifyContent:"center",fontSize:9,color:"#b2bec3",fontWeight:700,flexDirection:"column",gap:2}}><span>⏳</span><span>PENDIENTE</span></div>}
                  </div>
                  <div style={{fontSize:10,color:"#1a2f4a",fontWeight:800}}>{s.label}</div>
                  {mx>0&&!isFuture&&<div style={{fontSize:9,color:"#8aaabb",textAlign:"center",lineHeight:1.3}}>{ob}/{mx}<br/>pts</div>}
                  {isFuture&&<div style={{fontSize:8,color:"#b2bec3"}}>sin datos</div>}
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
                return ds<=hoy&&a.dias.includes(getDow(ds))&&!isExc(ti.id,a.id,ds);
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
                  if(!a.dias.includes(getDow(ds))) return;
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
                    a.dias.includes(dw) &&
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
                    .filter(a=>a.activa&&a.dias.includes(dw)&&!isExc(ti.id,a.id,ds)&&actsConRegistroIds.has(a.id))
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

            {/* 4 tarjetas de franja horaria */}
            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr 1fr",gap:8,marginBottom:14}}>
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
                          const tip=dm
                            ?`${dm.expected} actividades programadas · ${dm.oro+dm.plata+dm.bronce+dm.fuera} enviaron evidencia · ${dm.ptsObt}/${dm.ptsMax} pts → ${eficDia}%  |  🥇 ${dm.oro} antes de 08:00 (10pts)  🥈 ${dm.plata} entre 08-09h (8pts)  🥉 ${dm.bronce} entre 09-10h (6pts)  🔴 ${dm.fuera} después de 10:00 (0pts)`
                            :"Sin datos — semana pendiente o sin actividades";
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
                <div className="fmt-tip" style={{display:"none",position:"absolute",bottom:"calc(100% + 6px)",left:0,right:0,background:"#1a2f4a",color:"#fff",fontSize:10,fontWeight:600,padding:"10px 12px",borderRadius:10,zIndex:20,lineHeight:1.7,boxShadow:"0 4px 16px rgba(0,0,0,.25)"}}>
                  <div style={{fontWeight:800,marginBottom:4,fontSize:11}}>{fmt} · {prom!==null?prom+"%":"Sin datos"}</div>
                  {prom!==null&&<div>{fmtOb} pts obtenidos de {fmtMx} pts posibles</div>}
                  <div>{ftsEval.length} de {fts.length} tiendas con días evaluables</div>
                  {fts.length-ftsEval.length>0&&<div style={{color:"#FAC775"}}>⚠️ {fts.length-ftsEval.length} tienda{fts.length-ftsEval.length>1?"s":""} excluidas (N/A en toda actividad)</div>}
                  <div style={{marginTop:4,paddingTop:4,borderTop:"1px solid rgba(255,255,255,.15)",fontSize:9,opacity:.8}}>Los N/A por día individual ya están descontados del denominador</div>
                  <div style={{position:"absolute",bottom:-5,left:16,width:10,height:10,background:"#1a2f4a",transform:"rotate(45deg)",borderRadius:1}}/>
                </div>
              </div>
            );
          })}
        </div>

        {/* ranking top/bottom */}
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10,marginBottom:14}}>
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
                      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:4}}>
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
    );
  };

  /* ══ TAB CONFIG ══ */
  const renderConfig = ()=>(
    <div style={{padding:"16px"}}>
      <div style={{display:"flex",gap:8,marginBottom:16}}>
        {["Actividades","Tiendas","Auditores","Auditoría","Rangos Día"].map((l,i)=>(
          <button key={i} onClick={()=>setCfgTab(i)}
            style={{flex:1,padding:"10px",borderRadius:10,border:`1.5px solid ${cfgTab===i?"#00b5b4":"#e2e8f0"}`,background:cfgTab===i?"#1a2f4a":"#fff",color:cfgTab===i?"#fff":"#5a7a9a",cursor:"pointer",fontWeight:700,fontSize:12}}>
            {l}
          </button>
        ))}
      </div>

      {cfgTab===0&&(
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
              <div style={{display:"flex",gap:5,marginBottom:10}}>
                {[1,2,3,4,5].map(d=>(
                  <button key={d} onClick={()=>setNewA(p=>({...p,dias:p.dias.includes(d)?p.dias.filter(x=>x!==d):[...p.dias,d]}))}
                    style={{flex:1,padding:"8px",borderRadius:8,border:`1.5px solid ${newA.dias.includes(d)?"#6c5ce7":"#e2e8f0"}`,background:newA.dias.includes(d)?"#f0edff":"#fff",color:newA.dias.includes(d)?"#6c5ce7":"#5a7a9a",cursor:"pointer",fontSize:11,fontWeight:700}}>
                    {["L","M","X","J","V"][d-1]}
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
                    {a.dias.map(d=>["L","M","X","J","V"][d-1]).join("·")} · {a.cat}
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
                  <div style={{display:"flex",gap:5,marginBottom:8}}>
                    {[1,2,3,4,5].map(d=>(
                      <button key={d} onClick={()=>setActs(p=>p.map(x=>x.id===a.id?{...x,dias:x.dias.includes(d)?x.dias.filter(v=>v!==d):[...x.dias,d]}:x))}
                        style={{flex:1,padding:"7px",borderRadius:8,border:`1.5px solid ${a.dias.includes(d)?"#0984e3":"#e2e8f0"}`,background:a.dias.includes(d)?"#e8f4fd":"#fff",color:a.dias.includes(d)?"#0984e3":"#5a7a9a",cursor:"pointer",fontSize:11,fontWeight:700}}>
                        {["L","M","X","J","V"][d-1]}
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
                  <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:8,marginBottom:10}}>
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

      {cfgTab===1&&(
        <div>
          <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:12}}>
            <div>
              <div style={{fontWeight:800,fontSize:14,color:"#1a2f4a"}}>Tiendas</div>
              <div style={{fontSize:11,color:"#8aaabb"}}>{tiendas.filter(ti=>ti.activa).length} activas · {tiendas.filter(ti=>!ti.activa).length} inactivas</div>
            </div>
            <button onClick={()=>setShowNT(!showNT)} style={{padding:"8px 14px",borderRadius:9,border:"none",background:"#00b5b4",color:"#fff",cursor:"pointer",fontWeight:700,fontSize:12}}>＋ Nueva</button>
          </div>
          {showNT&&(
            <div style={{...S.card,padding:"14px",marginBottom:14}}>
              <div style={{marginBottom:8}}><label style={S.lbl}>NOMBRE (sin "Vega")</label><input value={newT.n} onChange={e=>setNewT(p=>({...p,n:e.target.value}))} placeholder="Ej: La Victoria" style={S.inp}/></div>
              <div style={{marginBottom:10}}>
                <label style={S.lbl}>FORMATO</label>
                <div style={{display:"flex",gap:6}}>
                  {["Mayorista","Supermayorista","Market"].map(f=>{const fc=FMT[f];return(
                    <button key={f} onClick={()=>setNewT(p=>({...p,f}))} style={{flex:1,padding:"9px",borderRadius:9,border:`1.5px solid ${newT.f===f?fc.c:"#e2e8f0"}`,background:newT.f===f?fc.bg:"#fff",color:newT.f===f?fc.c:"#5a7a9a",cursor:"pointer",fontSize:11,fontWeight:700}}>{f.slice(0,5)}</button>
                  );})}
                </div>
              </div>
              <div style={{display:"flex",gap:8}}>
                <button onClick={()=>{if(!newT.n.trim())return;const nt={id:"t"+Date.now(),n:newT.n.trim(),f:newT.f,activa:true};setTiendas(p=>{const np=[...p,nt];saveConfig({tiendas:np});return np;});setNewT({n:"",f:"Market"});setShowNT(false);}}
                  style={{flex:1,padding:"10px",borderRadius:9,border:"none",background:"#00b5b4",color:"#fff",cursor:"pointer",fontWeight:700,fontSize:12}}>Agregar</button>
                <button onClick={()=>setShowNT(false)} style={{padding:"10px 16px",borderRadius:9,border:"1px solid #e2e8f0",background:"#fff",color:"#5a7a9a",cursor:"pointer",fontSize:12}}>Cancelar</button>
              </div>
            </div>
          )}
          {["Mayorista","Supermayorista","Market"].map(fmt=>{
            const fc=FMT[fmt];
            const ts=tiendas.filter(ti=>ti.f===fmt);
            return(
              <div key={fmt} style={{marginBottom:16}}>
                <div style={{display:"flex",alignItems:"center",gap:6,marginBottom:8}}>
                  <div style={{width:4,height:16,borderRadius:2,background:fc.c}}/>
                  <span style={{fontWeight:800,fontSize:12,color:fc.c}}>{fmt.toUpperCase()}</span>
                  <span style={{fontSize:11,color:"#8aaabb"}}>{ts.filter(ti=>ti.activa).length} activas</span>
                </div>
                {ts.map(ti=>(
                  <div key={ti.id} style={{...S.card,padding:"10px 14px",marginBottom:6,display:"flex",alignItems:"center",justifyContent:"space-between",opacity:ti.activa?1:.5}}>
                    <span style={{fontWeight:600,fontSize:12,color:ti.activa?"#1a2f4a":"#94a3b8"}}>Vega {ti.n}</span>
                    <button onClick={()=>setTiendas(p=>{const np=p.map(x=>x.id===ti.id?{...x,activa:!x.activa}:x);saveConfig({tiendas:np});return np;})}
                      style={{padding:"4px 12px",borderRadius:8,border:`1px solid ${ti.activa?"#fecaca":"#bbf7d0"}`,background:ti.activa?"#fff1f2":"#f0fdf4",color:ti.activa?"#dc2626":"#16a34a",cursor:"pointer",fontSize:11,fontWeight:700}}>
                      {ti.activa?"Cerrar":"Activar"}
                    </button>
                  </div>
                ))}
              </div>
            );
          })}
        </div>
      )}



      {cfgTab===2&&(
        <div>
          <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:12}}>
            <div>
              <div style={{fontWeight:800,fontSize:14,color:"#1a2f4a"}}>Auditores</div>
              <div style={{fontSize:11,color:"#8aaabb"}}>{auditores.filter(a=>a.activo!==false).length} activos · {auditores.filter(a=>a.activo===false).length} inactivos</div>
            </div>
            <button onClick={()=>setShowNAud(v=>!v)} style={{padding:"8px 14px",borderRadius:9,border:"none",background:"#0984e3",color:"#fff",cursor:"pointer",fontWeight:700,fontSize:12}}>＋ Nuevo</button>
          </div>
          {showNAud&&(
            <div style={{...S.card,padding:"14px",marginBottom:14}}>
              <div style={{display:"flex",gap:8,marginBottom:8}}>
                <div style={{flex:1}}>
                  <label style={S.lbl}>DNI</label>
                  <input type="tel" value={newAud.dni} onChange={e=>setNewAud(p=>({...p,dni:e.target.value.replace(/[^0-9]/g,"").slice(0,8)}))}
                    placeholder="12345678" maxLength={8} style={{...S.inp,letterSpacing:3,fontFamily:"monospace"}}/>
                </div>
                <div style={{flex:2}}>
                  <label style={S.lbl}>NOMBRE COMPLETO</label>
                  <input value={newAud.nombre} onChange={e=>setNewAud(p=>({...p,nombre:e.target.value}))}
                    placeholder="Ej: Cindy Cuzco" style={S.inp}/>
                </div>
              </div>
              <div style={{display:"flex",gap:8}}>
                <button onClick={()=>{
                  if(!newAud.dni||newAud.dni.length<8||!newAud.nombre.trim())return;
                  if(auditores.find(a=>a.dni===newAud.dni)){showToast("⚠️ DNI ya registrado");return;}
                  const na={dni:newAud.dni,nombre:newAud.nombre.trim(),activo:true,creadoEn:new Date().toISOString()};
                  setAuditores(p=>{const np=[...p,na];saveConfig({auditores:np});return np;});
                  setNewAud({dni:"",nombre:""});setShowNAud(false);
                  showToast("✅ Auditor registrado");
                }} style={{flex:1,padding:"10px",borderRadius:9,border:"none",background:"#0984e3",color:"#fff",cursor:"pointer",fontWeight:700,fontSize:12}}>Registrar</button>
                <button onClick={()=>setShowNAud(false)} style={{padding:"10px 16px",borderRadius:9,border:"1px solid #e2e8f0",background:"#fff",color:"#5a7a9a",cursor:"pointer",fontSize:12}}>Cancelar</button>
              </div>
            </div>
          )}
          {auditores.length===0&&<div style={{textAlign:"center",padding:"30px",color:"#8aaabb",fontSize:13}}>Sin auditores registrados</div>}
          {auditores.map(a=>(
            <div key={a.dni} style={{...S.card,padding:"12px 14px",marginBottom:8,opacity:a.activo===false?.5:1,display:"flex",alignItems:"center",gap:10}}>
              <div style={{width:38,height:38,borderRadius:10,background:a.activo===false?"#f0f4f8":"#e8f4fd",display:"flex",alignItems:"center",justifyContent:"center",fontSize:16,flexShrink:0}}>🪪</div>
              <div style={{flex:1}}>
                <div style={{fontWeight:700,fontSize:13,color:a.activo===false?"#94a3b8":"#1a2f4a"}}>{a.nombre}</div>
                <div style={{fontSize:10,color:"#8aaabb",fontFamily:"monospace"}}>DNI: {a.dni}</div>
              </div>
              <button onClick={()=>setAuditores(p=>{const np=p.map(x=>x.dni===a.dni?{...x,activo:!x.activo}:x);saveConfig({auditores:np});return np;})}
                style={{padding:"5px 12px",borderRadius:8,border:`1px solid ${a.activo===false?"#bbf7d0":"#fecaca"}`,background:a.activo===false?"#f0fdf4":"#fff1f2",color:a.activo===false?"#16a34a":"#dc2626",cursor:"pointer",fontSize:11,fontWeight:700}}>
                {a.activo===false?"Activar":"Desactivar"}
              </button>
              <button onClick={()=>{if(window.confirm("¿Eliminar este auditor?"))setAuditores(p=>{const np=p.filter(x=>x.dni!==a.dni);saveConfig({auditores:np});return np;});}}
                style={{padding:"5px 10px",borderRadius:8,border:"1.5px solid #fecaca",background:"#fff1f2",color:"#dc2626",cursor:"pointer",fontSize:11}}>🗑️</button>
            </div>
          ))}
        </div>
      )}

{cfgTab===3&&(()=>{
        const allLogs=[];
        // Detectar duplicados: misma tienda+actividad+fecha con más de 1 evidencia en el array
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
              <div style={{fontWeight:800,fontSize:14,color:"#1a2f4a",marginBottom:2}}>📋 Log de Auditoría</div>
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
            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:8,marginBottom:8}}>
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
                    window._logTableSelDups=aEliminar;
                    window.dispatchEvent(new Event("selectDups"));
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
            :<LogTable filtered={filtered} regs={regs} db={db} deleteDoc={deleteDoc} doc={doc} setDoc={setDoc} showToast={showToast} sc={sc} sb={sb} FMT={FMT} S={S} isAdmin={isAdmin}/>
          }
        </div>
        );
      })()}
{cfgTab===4&&(
        <div>
          <div style={{marginBottom:14}}>
            <div style={{fontWeight:800,fontSize:14,color:"#1a2f4a"}}>📅 Rangos del Día</div>
            <div style={{fontSize:11,color:"#8aaabb",marginTop:2}}>Ajusta los horarios de puntaje para actividades Ad-hoc o Promocionales en una fecha específica. Los Always On usan su rango fijo.</div>
          </div>
          {/* Selector de fecha */}
          <div style={{...S.card,padding:"12px 14px",marginBottom:14,display:"flex",alignItems:"center",gap:10}}>
            <span style={{fontSize:12,fontWeight:700,color:"#5a7a9a"}}>📆 Fecha:</span>
            <input type="date" defaultValue={fecha}
              id="rango-fecha-input"
              style={{...S.inp,flex:1,fontSize:13}}/>
          </div>
          {acts.filter(a=>a.activa&&a.cat!=="Always On").map(a=>{
            const fechaInput = document.getElementById?.("rango-fecha-input")?.value||fecha;
            const override = rangosDia?.[a.id]?.[fechaInput];
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
                      const fi=document.getElementById("rango-fecha-input")?.value||fecha;
                      setRangosDia(prev=>{
                        const next={...prev};
                        if(next[a.id]) { delete next[a.id][fi]; if(!Object.keys(next[a.id]).length) delete next[a.id]; }
                        saveConfig({rangosDia:next});
                        return next;
                      });
                      showToast("🗑️ Rango del día eliminado");
                    }} style={{padding:"4px 10px",borderRadius:8,border:"1px solid #fecaca",background:"#fff1f2",color:"#dc2626",cursor:"pointer",fontSize:10,fontWeight:700}}>
                      Quitar override
                    </button>
                  )}
                </div>
                <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:8,marginBottom:8}}>
                  {[{k:"c100",icon:"🥇",label:"ORO hasta"},{k:"c80",icon:"🥈",label:"PLATA hasta"},{k:"c60",icon:"🥉",label:"BRONCE hasta"}].map(f=>(
                    <div key={f.k}>
                      <div style={{fontSize:9,color:"#8aaabb",fontWeight:700,marginBottom:4}}>{f.icon} {f.label}</div>
                      <input type="time" value={RR[f.k]}
                        onChange={e=>{
                          const fi=document.getElementById("rango-fecha-input")?.value||fecha;
                          setRangosDia(prev=>{
                            const next={...prev,[a.id]:{...(prev[a.id]||{}),[fi]:{...(prev[a.id]?.[fi]||base),[f.k]:e.target.value}}};
                            saveConfig({rangosDia:next});
                            return next;
                          });
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

      {/* ── LIMPIEZA MARCHA BLANCA — solo Admin ── */}
      <div style={{...S.card,padding:"14px 16px",marginTop:16,border:"1.5px solid #fecaca",background:"#fff1f2"}}>
        <div style={{fontWeight:700,fontSize:13,color:"#dc2626",marginBottom:4}}>🗑️ Limpieza de registros de prueba</div>
        <div style={{fontSize:11,color:"#5a7a9a",marginBottom:12}}>Elimina todos los registros de Firestore. Úsalo solo en marcha blanca para limpiar datos de prueba que afectan el % de eficiencia.</div>
        <button onClick={async()=>{
          if(!window.confirm("¿Eliminar TODOS los registros de Firestore? Esta acción es irreversible.")) return;
          const promises = Object.keys(regs).map(docId=>deleteDoc(doc(db,"registros",docId)));
          await Promise.all(promises);
          showToast("🗑️ Todos los registros eliminados");
        }}
          style={{padding:"10px 18px",borderRadius:10,border:"none",background:"#dc2626",color:"#fff",cursor:"pointer",fontWeight:700,fontSize:13}}>
          Eliminar todos los registros
        </button>
      </div>
    </div>
  );

  const tabs = isAdmin
    ? [{i:0,label:"📋 Registro"},{i:1,label:"📊 Reporte"},{i:2,label:"📈 Dashboard"},{i:3,label:"⚙️ Config"}]
    : isAuditor
    ? [{i:0,label:"📋 Registro"},{i:1,label:"📊 Reporte"},{i:2,label:"📈 Dashboard"}]
    : [{i:1,label:"📊 Reporte"},{i:2,label:"📈 Dashboard"}];

  return (
    <div style={S.wrap}>
      <link href="https://fonts.googleapis.com/css2?family=DM+Sans:opsz,wght@9..40,400;9..40,600;9..40,700&family=Syne:wght@700;800&display=swap" rel="stylesheet"/>
      {/* HEADER */}
      <div style={S.hdr}>
        <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:10,flexWrap:"wrap"}}>
          <div style={{width:34,height:34,borderRadius:10,background:"linear-gradient(135deg,#00b5b4,#0984e3)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:18}}>🏪</div>
          <div style={{flex:1}}>
            <div style={{fontFamily:"'Syne',sans-serif",fontWeight:800,fontSize:15,color:"#fff"}}>VEGA · EVIDENCIAS</div>
            <div style={{fontSize:9,color:"rgba(255,255,255,.4)",letterSpacing:".06em"}}>CONTROL DE IMPLEMENTACIÓN</div>
          </div>
          <input type="date" value={fecha} onChange={e=>{setFecha(e.target.value);setActSel(null);setPaso(1);setTSel(new Set());setRango(null);}} disabled={!isAuditor}
            style={{padding:"5px 9px",borderRadius:7,border:"1px solid rgba(255,255,255,.2)",background:"rgba(255,255,255,.1)",color:"#fff",fontSize:11,outline:"none"}}/>
          <div style={{display:"flex",alignItems:"center",gap:6,padding:"4px 10px",borderRadius:20,background:"rgba(255,255,255,.1)"}}>
            <span style={{fontSize:12}}>{isAdmin?"👑":isAuditor?"📋":"👁️"}</span>
            <span style={{fontSize:11,color:"#fff",fontWeight:700}}>{uName}</span>
          </div>
          {isAdmin&&<button onClick={()=>window._vegaPDF?.()} style={{padding:"5px 10px",borderRadius:7,border:"1px solid rgba(255,255,255,.2)",background:"rgba(255,255,255,.08)",color:"rgba(255,255,255,.7)",cursor:"pointer",fontSize:10,fontWeight:700}}>📄 PDF</button>}
          {isAdmin&&<button onClick={()=>setPinMod(true)} style={{padding:"5px 10px",borderRadius:7,border:"1px solid rgba(255,255,255,.2)",background:"rgba(255,255,255,.08)",color:"rgba(255,255,255,.7)",cursor:"pointer",fontSize:10,fontWeight:700}}>🔑</button>}
          <button onClick={()=>{setRole(null);setUName("");}} style={{padding:"5px 10px",borderRadius:7,border:"1px solid rgba(255,255,255,.2)",background:"rgba(255,255,255,.08)",color:"rgba(255,255,255,.7)",cursor:"pointer",fontSize:10,fontWeight:700}}>↩</button>
        </div>
        <div style={{display:"flex",gap:0,overflowX:"auto",alignItems:"center"}}>
          {tabs.map(tb=><button key={tb.i} onClick={()=>setTab(tb.i)} style={S.tabB(tab===tb.i)}>{tb.label}</button>)}
          {isAuditor&&<button onClick={()=>setShowStatusCard(true)} style={{marginLeft:"auto",padding:"6px 12px",border:"none",cursor:"pointer",fontSize:12,fontWeight:700,borderBottom:"3px solid transparent",color:"#00b5b4",background:"transparent",whiteSpace:"nowrap",flexShrink:0}}>📊 Estado</button>}
        </div>
      </div>
      {/* CONTENIDO */}
      {tab===0&&isAuditor&&renderRegistro()}
      {tab===1&&renderReporte()}
      {tab===2&&renderDashboard()}
      {tab===3&&isAdmin&&renderConfig()}
      {/* TOAST */}
      {toast&&(
        <div style={{position:"fixed",bottom:24,left:"50%",transform:"translateX(-50%)",background:"#1a2f4a",color:"#fff",padding:"12px 22px",borderRadius:24,fontSize:13,fontWeight:700,zIndex:99,boxShadow:"0 8px 24px rgba(0,0,0,.3)",whiteSpace:"nowrap"}}>
          {toast}
        </div>
      )}
      {pinMod&&<PinModal pins={pins} onSave={p=>{setPins(p);saveConfig({pins:p});setPinMod(false);}} onClose={()=>setPinMod(false)}/>}
      {showStatusCard&&(()=>{
        // Calcular datos para la tarjeta por formato y por bloque horario
        const hoy=todayStr();
        const bloque1Hasta="08:30"; // primer corte
        const bloque2Desde="08:31";
        const bloque2Hasta="09:30"; // segundo corte
        const fmts=[
          {fmt:"Mayorista",    icon:"🏭", desc:"Distribución"},
          {fmt:"Supermayorista",icon:"🏬", desc:"Gran superficie"},
          {fmt:"Market",       icon:"🛒", desc:"Punto de venta"},
        ];
        // Para la actividad activa del día (o todas si no hay selección)
        const actsHoy=acts.filter(a=>a.activa&&a.dias.includes(getDow(hoy)));
        const getBloque=(fmtNombre, desdeMin, hastaMin)=>{
          const ts=tiAct.filter(ti=>ti.f===fmtNombre);
          const excluidas=ts.filter(ti=>actsHoy.some(a=>isExc(ti.id,a.id,hoy)));
          const disponibles=ts.filter(ti=>!actsHoy.every(a=>isExc(ti.id,a.id,hoy)));
          // registradas en ese bloque horario
          const registradas=disponibles.filter(ti=>{
            return actsHoy.some(a=>{
              const reg=getReg(hoy,ti.id,a.id);
              if(!reg||!reg.evidencias||reg.anulado) return false;
              const hora=primerEnvio(reg.evidencias);
              if(!hora) return false;
              const m=toMin(hora);
              return m>=desdeMin&&m<=hastaMin;
            });
          });
          // hora min y max de registradas en este bloque
          let horaMin=null, horaMax=null;
          disponibles.forEach(ti=>{
            actsHoy.forEach(a=>{
              const reg=getReg(hoy,ti.id,a.id);
              if(!reg||!reg.evidencias||reg.anulado) return;
              const hora=primerEnvio(reg.evidencias);
              if(!hora) return;
              const m=toMin(hora);
              if(m>=desdeMin&&m<=hastaMin){
                if(!horaMin||m<toMin(horaMin)) horaMin=hora;
                if(!horaMax||m>toMin(horaMax)) horaMax=hora;
              }
            });
          });
          const pendientes=disponibles.length-registradas.length;
          return {total:ts.length,disponibles:disponibles.length,registradas:registradas.length,pendientes,horaMin,horaMax,excluidas:excluidas.length};
        };
        const b1Min=toMin("00:00"), b1Max=toMin(bloque1Hasta);
        const b2Min=toMin(bloque2Desde), b2Max=toMin(bloque2Hasta);
        // Totales generales
        const totalTiendas=tiAct.length;
        const totalNA=tiAct.filter(ti=>actsHoy.every(a=>isExc(ti.id,a.id,hoy))).length;
        const totalDisp=totalTiendas-totalNA;
        const totalReg=tiAct.filter(ti=>actsHoy.some(a=>{
          const reg=getReg(hoy,ti.id,a.id);
          return reg&&reg.evidencias?.length&&!reg.anulado;
        })).length;
        const totalPend=totalDisp-totalReg;
        const nowTime=new Date().toLocaleTimeString("es-PE",{hour:"2-digit",minute:"2-digit"});
        const esBloque2=toMin(nowTime)>b1Max;
        return(
        <div style={{position:"fixed",inset:0,background:"rgba(26,47,74,.75)",display:"flex",alignItems:"center",justifyContent:"center",zIndex:70,backdropFilter:"blur(4px)",padding:"16px"}}
          onClick={()=>setShowStatusCard(false)}>
          <div ref={statusCardRef} onClick={e=>e.stopPropagation()}
            style={{fontFamily:"'DM Sans',system-ui,sans-serif",background:"#fff",borderRadius:20,padding:"clamp(16px,3vw,28px)",width:"100%",maxWidth:600,boxShadow:"0 24px 60px rgba(0,0,0,.3)",maxHeight:"90vh",overflowY:"auto"}}>

            {/* Header */}
            <div style={{display:"flex",alignItems:"flex-start",justifyContent:"space-between",marginBottom:8}}>
              <div style={{display:"flex",alignItems:"flex-start",gap:10}}>
                <span style={{fontSize:"clamp(14px,2.5vw,18px)",lineHeight:1.1,marginTop:0}}>📁</span>
                <div>
                  <div style={{fontFamily:"'Syne',sans-serif",fontWeight:800,fontSize:"clamp(14px,2.5vw,18px)",color:"#1a2f4a",letterSpacing:".03em",lineHeight:1.1}}>ESTADO DE REGISTROS</div>
                  <div style={{fontSize:"clamp(10px,1.8vw,12px)",color:"#8aaabb",marginTop:3,fontWeight:500}}>{hoy} · {nowTime} hrs</div>
                </div>
              </div>
              <button onClick={()=>setShowStatusCard(false)}
                style={{background:"#f0f4f8",border:"none",width:32,height:32,borderRadius:"50%",fontSize:14,color:"#5a7a9a",cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",fontWeight:700,flexShrink:0,marginTop:1}}>✕</button>
            </div>

            {/* Actividad — SOLO si hay registro real de hoy con fecha exacta */}
            {(()=>{
              const actsConRegHoy = actsHoy.filter(a=>tiAct.some(ti=>{
                const reg=getReg(hoy,ti.id,a.id);
                return reg?.evidencias?.length>0 && !reg?.anulado && reg?.fecha===hoy;
              }));
              if(actsConRegHoy.length===0) return null;
              return(
                <div style={{display:"flex",gap:6,flexWrap:"wrap",marginBottom:12}}>
                  {actsConRegHoy.map(a=>(
                    <span key={a.id} style={{fontSize:"clamp(11px,1.8vw,13px)",color:"#0984e3",fontWeight:700,background:"#e8f4fd",borderRadius:8,padding:"5px 12px",display:"inline-flex",alignItems:"center",gap:4}}>
                      {a.e} {a.n}
                    </span>
                  ))}
                </div>
              );
            })()}

            {/* Totales */}
            <div style={{display:"flex",gap:"clamp(4px,1.5vw,6px)",flexWrap:"wrap",marginBottom:14,padding:"clamp(8px,2vw,12px)",background:"#f8fafc",borderRadius:10,border:"1px solid #e2e8f0",alignItems:"center"}}>
              <span style={{fontSize:"clamp(10px,2.8vw,12px)",color:"#5a7a9a",fontWeight:600}}>Total {totalTiendas}</span>
              <span style={{fontSize:10,color:"#c8d8e8"}}>·</span>
              <span style={{fontSize:"clamp(10px,2.8vw,12px)",color:"#1a2f4a",fontWeight:700}}>{totalDisp} disponibles</span>
              <span style={{padding:"2px 8px",borderRadius:20,fontSize:"clamp(10px,2.8vw,12px)",fontWeight:700,color:"#00b894",background:"#e8faf5",whiteSpace:"nowrap"}}>✅ {totalReg} registradas</span>
              {totalPend>0&&<span style={{padding:"2px 8px",borderRadius:20,fontSize:"clamp(10px,2.8vw,12px)",fontWeight:700,color:"#0984e3",background:"#e8f4fd",whiteSpace:"nowrap"}}>⏳ {totalPend} pendientes</span>}
              {totalNA>0&&<span style={{padding:"2px 8px",borderRadius:20,fontSize:"clamp(10px,2.8vw,12px)",fontWeight:700,color:"#854F0B",background:"#FAEEDA",whiteSpace:"nowrap"}}>N/A {totalNA}</span>}
            </div>

            {/* Corte 1 */}
            <div style={{marginBottom:14}}>
              <div style={{fontSize:"clamp(9px,2.5vw,11px)",fontWeight:700,color:"#BA7517",letterSpacing:".06em",marginBottom:10,display:"flex",alignItems:"center",gap:6}}>
                <span style={{width:8,height:8,borderRadius:"50%",background:"#BA7517",display:"inline-block",flexShrink:0}}/>
                CORTE 1 · hasta las 08:30
              </div>
              {fmts.map(({fmt,icon})=>{
                const b=getBloque(fmt,b1Min,b1Max);
                if(b.disponibles===0) return null;
                return(
                <div key={fmt+"b1"} style={{display:"flex",alignItems:"center",gap:8,marginBottom:12,flexWrap:"nowrap"}}>
                  <div style={{display:"flex",alignItems:"center",gap:4,flexShrink:0,minWidth:"clamp(80px,18vw,130px)"}}>
                    <span style={{fontSize:"clamp(13px,2vw,18px)"}}>{icon}</span>
                    <span style={{fontWeight:700,color:"#1a2f4a",fontSize:"clamp(11px,2vw,14px)",whiteSpace:"nowrap"}}>{fmt}</span>
                  </div>
                  <span style={{padding:"3px 10px",borderRadius:20,fontSize:"clamp(10px,1.8vw,13px)",fontWeight:700,color:"#00b894",background:"#e8faf5",whiteSpace:"nowrap",flexShrink:0}}>✅ {String(b.registradas).padStart(2,"0")} registradas</span>
                  {b.horaMin&&<span style={{fontSize:"clamp(9px,1.6vw,12px)",color:"#8aaabb",fontWeight:500,whiteSpace:"nowrap",flexShrink:0}}>({b.horaMin}{b.horaMax&&b.horaMax!==b.horaMin?` a ${b.horaMax}`:""})</span>}
                  {b.pendientes>0&&<span style={{padding:"3px 10px",borderRadius:20,fontSize:"clamp(10px,1.8vw,13px)",fontWeight:700,color:"#0984e3",background:"#e8f4fd",whiteSpace:"nowrap",flexShrink:0}}>⏰ {String(b.pendientes).padStart(2,"0")} pendientes por registrar</span>}
                </div>
                );
              })}
            </div>

            {/* Corte 2 — aparece automáticamente después de las 08:31 */}
            {esBloque2&&(
            <div style={{borderTop:"1px dashed #e2e8f0",paddingTop:12}}>
              <div style={{fontSize:"clamp(9px,2.5vw,11px)",fontWeight:700,color:"#185FA5",letterSpacing:".06em",marginBottom:10,display:"flex",alignItems:"center",gap:6}}>
                <span style={{width:8,height:8,borderRadius:"50%",background:"#185FA5",display:"inline-block",flexShrink:0}}/>
                CORTE 2 · 08:31 a 09:30
              </div>
              {fmts.map(({fmt,icon})=>{
                const b=getBloque(fmt,b2Min,b2Max);
                if(b.disponibles===0) return null;
                return(
                <div key={fmt+"b2"} style={{display:"flex",alignItems:"center",gap:8,marginBottom:12,flexWrap:"nowrap"}}>
                  <div style={{display:"flex",alignItems:"center",gap:4,flexShrink:0,minWidth:"clamp(80px,18vw,130px)"}}>
                    <span style={{fontSize:"clamp(13px,2vw,18px)"}}>{icon}</span>
                    <span style={{fontWeight:700,color:"#1a2f4a",fontSize:"clamp(11px,2vw,14px)",whiteSpace:"nowrap"}}>{fmt}</span>
                  </div>
                  <span style={{padding:"3px 10px",borderRadius:20,fontSize:"clamp(10px,1.8vw,13px)",fontWeight:700,color:"#74b9ff",background:"#e8f4fd",whiteSpace:"nowrap",flexShrink:0}}>✅ {String(b.registradas).padStart(2,"0")} registradas</span>
                  {b.horaMin&&<span style={{fontSize:"clamp(9px,1.6vw,12px)",color:"#8aaabb",fontWeight:500,whiteSpace:"nowrap",flexShrink:0}}>({b.horaMin}{b.horaMax&&b.horaMax!==b.horaMin?` a ${b.horaMax}`:""})</span>}
                  {b.pendientes>0&&<span style={{padding:"3px 10px",borderRadius:20,fontSize:"clamp(10px,1.8vw,13px)",fontWeight:700,color:"#854F0B",background:"#FAEEDA",whiteSpace:"nowrap",flexShrink:0}}>⏰ {String(b.pendientes).padStart(2,"0")} pendientes por registrar</span>}
                </div>
                );
              })}
            </div>
            )}

            {/* Footer */}
            <div style={{marginTop:14,fontSize:"clamp(8px,2.2vw,10px)",color:"#b2bec3",textAlign:"center",borderTop:"1px solid #f0f4f8",paddingTop:10,fontWeight:500,letterSpacing:".04em"}}>
              VEGA · EVIDENCIAS · {hoy}
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
            <div onClick={()=>{ const d=ctxMenu.docIds[0]; if(d){setUpdModal({docId:d.docId,docData:d.docData,actividadId:d.actividadId});setHoraUpd(primerEnvio(d.docData?.evidencias)||"");} setCtxMenu(null); }} style={{display:"flex",alignItems:"center",gap:10,padding:"12px 14px",cursor:"pointer",borderBottom:"1px solid #f0f4f8"}}>
              <div style={{width:28,height:28,borderRadius:8,background:"#e8f4fd",display:"flex",alignItems:"center",justifyContent:"center",fontSize:14}}>✏️</div>
              <div><div style={{fontSize:13,fontWeight:700,color:"#1a2f4a"}}>Actualizar registro</div><div style={{fontSize:10,color:"#8aaabb"}}>Corregir hora · queda en historial</div></div>
            </div>
            <div onClick={()=>{ const d=ctxMenu.docIds[0]; if(d){setAnularModal({docId:d.docId,docData:d.docData});} setCtxMenu(null); }} style={{display:"flex",alignItems:"center",gap:10,padding:"12px 14px",cursor:"pointer",borderBottom:"1px solid #f0f4f8"}}>
              <div style={{width:28,height:28,borderRadius:8,background:"#FAEEDA",display:"flex",alignItems:"center",justifyContent:"center",fontSize:14}}>⚠️</div>
              <div><div style={{fontSize:13,fontWeight:700,color:"#1a2f4a"}}>Anular con motivo</div><div style={{fontSize:10,color:"#8aaabb"}}>Se mantiene en historial · no cuenta</div></div>
            </div>
            {isAdmin&&<div onClick={()=>{ const d=ctxMenu.docIds[0]; if(d){setDelModal({docIds:[d.docId],label:`Vega ${ctxMenu.t.n} · ${ctxMenu.a.e} · ${ctxMenu.sem.label}`});} setCtxMenu(null); }} style={{display:"flex",alignItems:"center",gap:10,padding:"12px 14px",cursor:"pointer"}}>
              <div style={{width:28,height:28,borderRadius:8,background:"#fff1f2",display:"flex",alignItems:"center",justifyContent:"center",fontSize:14}}>🗑️</div>
              <div><div style={{fontSize:13,fontWeight:700,color:"#dc2626"}}>Eliminar registro</div><div style={{fontSize:10,color:"#8aaabb"}}>Solo marcha blanca · irreversible</div></div>
            </div>}
          </div>
        </div>
      )}

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


    </div>
  );
}

/* ══ LOGIN ══════════════════════════════════════════════ */
function LoginScreen({pins,auditores,onLogin}){
  const auds = (auditores||[]).filter(a=>a.activo!==false);
  const[pin,setPin]=useState("");
  const[dni,setDni]=useState("");
  // Siempre arranca en "inicio" — los 3 botones siempre visibles
  const[step,setStep]=useState("inicio");
  const[err,setErr]=useState("");
  const inpS={width:"100%",padding:"14px",borderRadius:12,background:"#f8fafc",color:"#1a2f4a",outline:"none",textAlign:"center",boxSizing:"border-box",marginBottom:12};

  const tryPin=()=>{
    if(pin===pins.admin){onLogin("admin","Administrador","");return;}
    setErr("Código incorrecto");setTimeout(()=>{setErr("");setPin("");},1500);
  };
  const tryDni=()=>{
    const clean=dni.trim();
    if(clean.length<8){setErr("DNI debe tener 8 dígitos");return;}
    // Si está registrado → entra con su nombre
    const found=auds.find(a=>a.dni===clean);
    if(found){onLogin("auditor",found.nombre,clean);return;}
    // Fallback: si no hay auditores aún (marcha blanca) → código auditor88 como DNI
    if(auds.length===0&&clean===pins.auditor){onLogin("auditor","Auditor",clean);return;}
    setErr(auds.length===0
      ?"Sin auditores registrados. Contacta al Admin."
      :"DNI no encontrado. Contacta al Admin.");
    setTimeout(()=>{setErr("");setDni("");},2500);
  };

  return(
    <div style={{fontFamily:"'DM Sans',system-ui,sans-serif",background:"linear-gradient(135deg,#1a2f4a,#0d1f35)",minHeight:"100vh",display:"flex",alignItems:"center",justifyContent:"center",padding:20}}>
      <link href="https://fonts.googleapis.com/css2?family=DM+Sans:opsz,wght@9..40,400;9..40,600;9..40,700&family=Syne:wght@700;800&display=swap" rel="stylesheet"/>
      <div style={{width:"100%",maxWidth:380,background:"#fff",borderRadius:20,padding:36,boxShadow:"0 24px 60px rgba(0,0,0,.3)",textAlign:"center"}}>
        <div style={{width:64,height:64,borderRadius:18,background:"linear-gradient(135deg,#00b5b4,#1a2f4a)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:30,margin:"0 auto 20px"}}>🏪</div>
        <div style={{fontFamily:"'Syne',sans-serif",fontSize:20,fontWeight:800,color:"#1a2f4a",marginBottom:4}}>VEGA · EVIDENCIAS</div>
        <div style={{fontSize:10,color:"#8aaabb",letterSpacing:".08em",marginBottom:28}}>CONTROL DE IMPLEMENTACIÓN DIARIA</div>

        {/* ── PANTALLA INICIO: 3 accesos directos ── */}
        {step==="inicio"&&(
          <>
            <p style={{margin:"0 0 16px",fontSize:13,color:"#5a7a9a"}}>Selecciona tu tipo de acceso</p>
            {/* Auditor → DNI */}
            <button onClick={()=>{setStep("dni_auditor");setErr("");}}
              style={{width:"100%",padding:"14px 16px",borderRadius:14,border:"2px solid #00b5b4",background:"#e0fafa",color:"#0d7a79",cursor:"pointer",marginBottom:8,display:"flex",alignItems:"center",gap:12,textAlign:"left"}}>
              <span style={{fontSize:24,flexShrink:0}}>🪪</span>
              <div>
                <div style={{fontSize:14,fontWeight:800,color:"#0d7a79"}}>Auditor</div>
                <div style={{fontSize:11,color:"#0d7a79",opacity:.8}}>Ingreso con mi DNI</div>
              </div>
            </button>
            {/* Admin → código */}
            <button onClick={()=>{setStep("pin_admin");setErr("");}}
              style={{width:"100%",padding:"14px 16px",borderRadius:14,border:"1.5px solid #f6a623",background:"#fff8ec",color:"#854F0B",cursor:"pointer",marginBottom:8,display:"flex",alignItems:"center",gap:12,textAlign:"left"}}>
              <span style={{fontSize:24,flexShrink:0}}>👑</span>
              <div>
                <div style={{fontSize:14,fontWeight:800,color:"#854F0B"}}>Administrador</div>
                <div style={{fontSize:11,color:"#854F0B",opacity:.8}}>Código de acceso</div>
              </div>
            </button>
            {/* Viewer → código directo */}
            <button onClick={()=>{
              const v=pins.viewer;
              if(v){onLogin("viewer","Gerencia","");}
            }}
              style={{width:"100%",padding:"14px 16px",borderRadius:14,border:"1.5px solid #74b9ff",background:"#e8f4fd",color:"#0652dd",cursor:"pointer",display:"flex",alignItems:"center",gap:12,textAlign:"left"}}>
              <span style={{fontSize:24,flexShrink:0}}>👁️</span>
              <div>
                <div style={{fontSize:14,fontWeight:800,color:"#0652dd"}}>Visor</div>
                <div style={{fontSize:11,color:"#0652dd",opacity:.8}}>Dashboard gerencial</div>
              </div>
            </button>
          </>
        )}

        {/* ── AUDITOR: DNI directo ── */}
        {(step==="dni_auditor"||step==="dni")&&(
          <>
            <div style={{fontSize:32,marginBottom:10}}>🪪</div>
            <p style={{margin:"0 0 4px",fontSize:14,fontWeight:700,color:"#1a2f4a"}}>Ingresa tu DNI</p>
            <p style={{margin:"0 0 20px",fontSize:12,color:"#8aaabb"}}>Tu identificador de auditor</p>
            <input autoFocus type="tel" value={dni}
              onChange={e=>setDni(e.target.value.replace(/[^0-9]/g,"").slice(0,8))}
              onKeyDown={e=>e.key==="Enter"&&tryDni()}
              placeholder="12345678" maxLength={8}
              style={{...inpS,border:`2px solid ${err?"#ef4444":"#00b5b4"}`,letterSpacing:6,fontSize:24,fontWeight:700}}/>
            {err&&<div style={{color:"#ef4444",fontSize:11,marginBottom:10,marginTop:-8,lineHeight:1.4}}>❌ {err}</div>}
            <button onClick={tryDni} disabled={dni.length<8}
              style={{width:"100%",padding:"14px",borderRadius:12,border:"none",background:dni.length===8?"linear-gradient(135deg,#00b5b4,#1a2f4a)":"#e2e8f0",color:dni.length===8?"white":"#94a3b8",cursor:dni.length===8?"pointer":"not-allowed",fontSize:14,fontWeight:700,marginBottom:10}}>
              Entrar →
            </button>
            <button onClick={()=>{setStep("inicio");setDni("");setErr("");}}
              style={{width:"100%",padding:"10px",borderRadius:12,border:"1px solid #e2e8f0",background:"#fff",color:"#8aaabb",cursor:"pointer",fontSize:13}}>
              ← Volver
            </button>
          </>
        )}

        {/* ── ADMIN / GERENCIA: código ── */}
        {step==="pin"||step==="pin_admin"?(
          <>
            <div style={{fontSize:32,marginBottom:10}}>🔑</div>
            <p style={{margin:"0 0 16px",fontSize:13,color:"#5a7a9a"}}>Código de acceso</p>
            <input autoFocus type="password" value={pin}
              onChange={e=>setPin(e.target.value)}
              onKeyDown={e=>e.key==="Enter"&&tryPin()}
              placeholder="••••••••"
              style={{...inpS,border:`2px solid ${err?"#ef4444":"#c8d8e8"}`,letterSpacing:8,fontSize:20}}/>
            {err&&<div style={{color:"#ef4444",fontSize:12,marginBottom:10,marginTop:-8}}>❌ {err}</div>}
            <button onClick={tryPin}
              style={{width:"100%",padding:"14px",borderRadius:12,border:"none",background:pin?"linear-gradient(135deg,#00b5b4,#1a2f4a)":"#e2e8f0",color:pin?"white":"#94a3b8",cursor:pin?"pointer":"not-allowed",fontSize:14,fontWeight:700,marginBottom:10}}>
              Ingresar →
            </button>
            <button onClick={()=>{setStep("inicio");setPin("");setErr("");}}
              style={{width:"100%",padding:"10px",borderRadius:12,border:"1px solid #e2e8f0",background:"#fff",color:"#8aaabb",cursor:"pointer",fontSize:13}}>
              ← Volver
            </button>
          </>
        ):null}

      </div>
    </div>
  );
}


function PinModal({pins,onSave,onClose}){
  const[p,setP]=useState({...pins});
  const[show,setShow]=useState(false);
  return(
    <div style={{position:"fixed",inset:0,background:"rgba(26,47,74,.7)",display:"flex",alignItems:"center",justifyContent:"center",zIndex:50,backdropFilter:"blur(4px)"}}>
      <div style={{background:"#fff",borderRadius:20,padding:30,width:"90%",maxWidth:400,boxShadow:"0 24px 60px rgba(0,0,0,.3)"}}>
        <div style={{textAlign:"center",marginBottom:22}}>
          <div style={{fontSize:32,marginBottom:8}}>🔑</div>
          <div style={{fontFamily:"'Syne',sans-serif",fontWeight:800,fontSize:17,color:"#1a2f4a"}}>Gestionar Códigos de Acceso</div>
        </div>
        {[{k:"admin",label:"🛡️ Código Administrador",c:"#f6a623"},{k:"auditor",label:"📋 Código Auditor",c:"#00b5b4"},{k:"viewer",label:"👁️ Código Visitante",c:"#74b9ff"}].map(f=>(
          <div key={f.k} style={{marginBottom:14}}>
            <label style={{fontSize:10,fontWeight:800,color:f.c,letterSpacing:".06em",display:"block",marginBottom:5}}>{f.label}</label>
            <input type={show?"text":"password"} value={p[f.k]} onChange={e=>setP(x=>({...x,[f.k]:e.target.value}))}
              style={{width:"100%",padding:"12px 14px",borderRadius:10,border:"1.5px solid "+f.c+"44",background:"#f8fafc",color:"#1a2f4a",fontSize:14,outline:"none",letterSpacing:show?3:6,fontFamily:"monospace",boxSizing:"border-box"}}/>
          </div>
        ))}
        <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:18}}>
          <input type="checkbox" id="show-pins" checked={show} onChange={e=>setShow(e.target.checked)} style={{width:16,height:16,cursor:"pointer"}}/>
          <label htmlFor="show-pins" style={{fontSize:12,color:"#5a7a9a",cursor:"pointer"}}>Mostrar códigos</label>
        </div>
        <div style={{display:"flex",gap:10}}>
          <button onClick={onClose} style={{flex:1,padding:"12px",borderRadius:10,border:"1px solid #c8d8e8",background:"#fff",color:"#5a7a9a",cursor:"pointer",fontWeight:700,fontSize:13}}>Cancelar</button>
          <button onClick={()=>onSave(p)} style={{flex:1,padding:"12px",borderRadius:10,border:"none",background:"linear-gradient(135deg,#00b5b4,#1a2f4a)",color:"#fff",cursor:"pointer",fontWeight:800,fontSize:13}}>Guardar</button>
        </div>
      </div>
    </div>
  );
}
