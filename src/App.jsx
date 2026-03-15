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

const RANGOS_DEFAULT = { c100:"08:00", c80:"09:00", c60:"10:00" };

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
  {id:"a11",n:"Precios en Anaquel",  dias:[1,2,3,4,5], e:"🏷️",c:"#55efc4",cat:"Ad-hoc",  r:null,activa:true},
];

const MESES = ["Enero","Febrero","Marzo","Abril","Mayo","Junio","Julio","Agosto","Septiembre","Octubre","Noviembre","Diciembre"];
const DIAS_N = ["Domingo","Lunes","Martes","Miércoles","Jueves","Viernes","Sábado"];
const FMT = {
  Mayorista:      {c:"#6c5ce7",bg:"#f0edff"},
  Supermayorista: {c:"#0984e3",bg:"#e8f4fd"},
  Market:         {c:"#00b5b4",bg:"#e0fafa"},
};
const PUNTAJES = [
  {pct:100,icon:"🥇",label:"ORO",    c:"#f6a623",bg:"#fff8ec",key:"c100"},
  {pct:80, icon:"🥈",label:"PLATA",  c:"#74b9ff",bg:"#e8f4fd",key:"c80"},
  {pct:60, icon:"🥉",label:"BRONCE", c:"#a29bfe",bg:"#f0edff",key:"c60"},
  {pct:0,  icon:"🔴",label:"FUERA",  c:"#d63031",bg:"#ffeae6",key:null},
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
  if(m<=toMin(R.c100)) return 100;
  if(m<=toMin(R.c80))  return 80;
  if(m<=toMin(R.c60))  return 60;
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
  if(s>=100) return {label:"ORO",   icon:"🥇",c:"#f6a623",bg:"#fff8ec"};
  if(s>=80)  return {label:"PLATA", icon:"🥈",c:"#74b9ff",bg:"#e8f4fd"};
  if(s>=60)  return {label:"BRONCE",icon:"🥉",c:"#a29bfe",bg:"#f0edff"};
  if(s>=1)   return {label:"RIESGO",icon:"⚠️",c:"#e17055",bg:"#fff1ee"};
  return            {label:"FUERA", icon:"🔴",c:"#d63031",bg:"#ffeae6"};
}
function sc(v){if(!v&&v!==0)return"#b2bec3";if(v>=95)return"#f6a623";if(v>=85)return"#00b894";if(v>=75)return"#74b9ff";if(v>=60)return"#e17055";return"#d63031";}
function sb(v){if(!v&&v!==0)return"#f4f6f8";if(v>=95)return"#fff8ec";if(v>=85)return"#e8faf5";if(v>=75)return"#e8f4fd";if(v>=60)return"#fff1ee";return"#ffeae6";}

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

/* ══ APP ══════════════════════════════════════════════ */
export default function ChecklistApp() {
  const now = new Date();
  /* ── auth ── */
  const [role,    setRole]    = useState(null);
  const [uName,   setUName]   = useState("");
  const [pins,    setPins]    = useState({admin:"vega2026",auditor:"auditor88",viewer:"gerencia1"});
  const [pinMod,  setPinMod]  = useState(false);
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
  const [horaEx,  setHoraEx]  = useState("");
  const [obsEx,   setObsEx]   = useState("");
  /* ── filtros ── */
  const [fmtFilt,      setFmtFilt]      = useState("Todas");
  const [busq,         setBusq]         = useState("");
  const [verRegistradas, setVerRegistradas] = useState(false);
  const [rangoExt,     setRangoExt]     = useState(null); // rango extendido temporal por actividad
  /* ── config ── */
  const [cfgTab,  setCfgTab]  = useState(0);
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
    const loadCfg = async ()=>{
      const snap = await getDoc(doc(db,"config","app"));
      if(snap.exists()){
        const d=snap.data();
        if(d.actividades) setActs(d.actividades);
        if(d.tiendas)     setTiendas(d.tiendas);
        if(d.pins)        setPins(d.pins);
        if(d.excepciones) setExceps(d.excepciones);
      }
    };
    loadCfg();
  },[]);

  const saveConfig = useCallback(async (overrides={})=>{
    await setDoc(doc(db,"config","app"),{
      actividades: overrides.actividades ?? acts,
      tiendas:     overrides.tiendas     ?? tiendas,
      pins:        overrides.pins        ?? pins,
      excepciones: overrides.excepciones ?? exceps,
      updatedAt:   new Date().toISOString(),
    });
  },[acts,tiendas,pins,exceps]);

  const dow = getDow(fecha);
  const esFS = dow===0||dow===6;
  const tiAct = useMemo(()=>tiendas.filter(ti=>ti.activa),[tiendas]);
  const actsDia = useMemo(()=>acts.filter(a=>a.activa&&a.dias.includes(dow)),[acts,dow]);
  const actInfo = acts.find(a=>a.id===actSel);
  const semanasDelMes = useMemo(()=>getWeeksOfMonth(vYear,vMonth),[vYear,vMonth]);
  const isAdmin   = role==="admin";
  const isAuditor = role==="admin"||role==="auditor";

  const getReg = useCallback((f,tid,a)=>{
    const k=rKey(f,tid,a);
    const docId=k.replace(/\|/g,"--");
    return regs[docId]||regs[k]||null;
  },[regs]);
  const isExc  = useCallback((tId,aId)=>exceps[tId+"|"+aId]===true,[exceps]);

  const showToast = msg=>{
    setToast(msg);
    if(toastRef.current)clearTimeout(toastRef.current);
    toastRef.current=setTimeout(()=>setToast(""),2500);
  };

  /* ── cálculos KPI ── */
  const kpisDia = useMemo(()=>{
    if(!actSel)return{total:0,IC:0,IP:0,SE:0,TR:0,SG:0,al100:0,conEnvio:0};
    const AR=actInfo?.r||RANGOS_DEFAULT;
    const ts=tiAct.filter(ti=>!isExc(ti.id,actSel));
    const total=ts.length;
    const withEnv=ts.filter(ti=>puntajeReg(getReg(fecha,ti.id,actSel),AR)!==null);
    const pts=ts.map(ti=>puntajeReg(getReg(fecha,ti.id,actSel),AR));
    const IC=total>0?Math.round((withEnv.length/total)*100):0;
    const valid=pts.filter(p=>p!==null);
    const IP=valid.length>0?Math.round(valid.reduce((a,b)=>a+b,0)/valid.length):0;
    const al100=pts.filter(p=>p===100).length;
    const SE=total>0?Math.round((al100/total)*100):0;
    const TR=total>0?Math.round((ts.filter(ti=>puntajeReg(getReg(fecha,ti.id,actSel),AR)===null).length/total)*100):0;
    const SG=Math.round((IC*IP)/100);
    const r100=withEnv.filter(ti=>puntajeReg(getReg(fecha,ti.id,actSel),AR)===100);
    const r80=withEnv.filter(ti=>puntajeReg(getReg(fecha,ti.id,actSel),AR)===80);
    const r60=withEnv.filter(ti=>puntajeReg(getReg(fecha,ti.id,actSel),AR)===60);
    const r0=ts.filter(ti=>puntajeReg(getReg(fecha,ti.id,actSel),AR)===null);
    return{total,IC,IP,SE,TR,SG,al100,conEnvio:withEnv.length,r100,r80,r60,r0};
  },[actSel,actInfo,tiAct,isExc,getReg,fecha]);

  const calcSemana = useCallback((tId,sem)=>{
    const scores=[];
    sem.days.forEach(day=>{
      const ds=dStr(vYear,vMonth,day);
      const dw=getDow(ds);
      acts.filter(a=>a.activa&&a.dias.includes(dw)&&!isExc(tId,a.id)).forEach(a=>{
        const p=puntajeReg(getReg(ds,tId,a.id),a.r||RANGOS_DEFAULT);
        if(p!==null)scores.push(p);
      });
    });
    return scores.length>0?Math.round(scores.reduce((a,b)=>a+b,0)/scores.length):null;
  },[acts,regs,vYear,vMonth,isExc,getReg]);

  const calcMes = useCallback((tId)=>{
    const ws=semanasDelMes.map(s=>calcSemana(tId,s)).filter(v=>v!==null);
    return ws.length>0?Math.round(ws.reduce((a,b)=>a+b,0)/ws.length):null;
  },[semanasDelMes,calcSemana]);

  /* ── tiendas filtradas para lista ── */
  const tFilt = useMemo(()=>tiAct.filter(ti=>{
    if(fmtFilt!=="Todas"&&ti.f!==fmtFilt)return false;
    if(busq&&!ti.n.toLowerCase().includes(busq.toLowerCase()))return false;
    // ocultar ya registradas salvo admin con toggle activo
    if(!verRegistradas && tRegistradas.has(ti.id)) return false;
    return true;
  }),[tiAct,fmtFilt,busq,tRegistradas,verRegistradas]);

  const tRegistradas = useMemo(()=>new Set(
    tiAct.filter(ti=>regs[rKey(fecha,ti.id,actSel||"")]?.evidencias?.length>0).map(ti=>ti.id)
  ),[tiAct,regs,fecha,actSel]);

  /* ── confirmar registros en bloque ── */
  const confirmarRegistro = async ()=>{
    if(!horaEx||tSel.size===0||!actSel)return;
    const AR = rangoExt || actInfo?.r || RANGOS_DEFAULT;
    const pct=calcP(horaEx,AR);
    const tier=getTier(pct);
    let n=0;
    const promises=[];
    tSel.forEach(tId=>{
      const k=rKey(fecha,tId,actSel);
      const now=new Date();
      const hreg=now.toLocaleTimeString("es-PE",{hour:"2-digit",minute:"2-digit"});
      const ev={id:Date.now()+n,hora:horaEx,puntaje:pct,observacion:obsEx||`Registro en bloque · ${tier.label}`,horaRegistro:hreg,auditor:uName,timestamp:now.toISOString()};
      const prevEvs=(regs[k]?.evidencias)||[];
      const newEvs=[...prevEvs,ev].sort((a,b)=>a.hora.localeCompare(b.hora));
      // Save to Firestore — key as doc id (replace | with -)
      const docId=k.replace(/\|/g,"--");
      promises.push(setDoc(doc(db,"registros",docId),{evidencias:newEvs,fecha,tiendaId:tId,actividadId:actSel,updatedAt:now.toISOString()}));
      n++;
    });
    await Promise.all(promises);
    showToast(`✅ ${n} tienda${n!==1?"s":""} · ${horaEx} · ${pct}% ${tier.icon}`);
    setTSel(new Set());setRango(null);setHoraEx("07:00");setObsEx("");setPaso(1);setActSel(null);
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
    const tier = getTier(pct);
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
    showToast(`✏️ Registro actualizado · ${horaUpd} · ${pct}% ${tier.icon}`);
    setUpdModal(null); setHoraUpd(""); setMotivoUpd("");
  };

  const toggleExcepcion = async (tId, aId) => {
    const key = tId+"|"+aId;
    const newExceps = {...exceps};
    if(newExceps[key]) delete newExceps[key];
    else newExceps[key] = true;
    setExceps(newExceps);
    await saveConfig({excepciones: newExceps});
    showToast(newExceps[key] ? "⚠️ Tienda excluida de esta actividad" : "✅ Excepción removida");
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
  if(!role) return <LoginScreen pins={pins} onLogin={(r,n)=>{setRole(r);setUName(n);setTab(r==="viewer"?1:0);}}/>;

  /* ══ PASO 1 — seleccionar actividad ══ */
  const renderPaso1 = ()=>(
    <div style={{padding:"16px"}}>
      <p style={{margin:"0 0 14px",fontSize:12,color:"#8aaabb",fontWeight:700,letterSpacing:".06em"}}>
        {DIAS_N[dow].toUpperCase()} · {actsDia.length} ACTIVIDAD{actsDia.length!==1?"ES":""} PROGRAMADA{actsDia.length!==1?"S":""}
      </p>
      {actsDia.map(a=>(
        <button key={a.id} onClick={()=>{setActSel(a.id);setPaso(2);setTSel(new Set());setRango(null);setVerRegistradas(false);setRangoExt(null);}}
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
          <span style={{...S.pill("#8aaabb","#f0f4f8"),marginLeft:"auto"}}>{tSel.size} sel.</span>
          <span style={{...S.pill("#00b894","#e8faf5")}}>{tRegistradas.size} reg.</span>
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
      <div style={{padding:"8px 16px",background:"#f8fafc",borderBottom:"1px solid #e2e8f0",display:"flex",alignItems:"center",justifyContent:"space-between",gap:8,flexWrap:"wrap"}}>
        <div style={{display:"flex",gap:8,alignItems:"center"}}>
          <span style={{fontSize:12,color:"#8aaabb"}}>{tFilt.length} pendientes</span>
          {tRegistradas.size>0&&<span style={S.pill("#00b894","#e8faf5")}>✅ {tRegistradas.size} registradas</span>}
        </div>
        <div style={{display:"flex",gap:6,alignItems:"center"}}>
          {isAdmin&&tRegistradas.size>0&&(
            <button onClick={()=>setVerRegistradas(v=>!v)}
              style={{padding:"5px 12px",borderRadius:8,border:`1.5px solid ${verRegistradas?"#0984e3":"#e2e8f0"}`,background:verRegistradas?"#e8f4fd":"#fff",color:verRegistradas?"#0984e3":"#5a7a9a",cursor:"pointer",fontSize:11,fontWeight:700}}>
              {verRegistradas?"Ocultar registradas":"Ver todas"}
            </button>
          )}
          <button onClick={()=>setTSel(tSel.size===tFilt.length?new Set():new Set(tFilt.filter(ti=>!isExc(ti.id,actSel)).map(ti=>ti.id)))}
            style={{padding:"6px 14px",borderRadius:8,border:`1.5px solid ${actInfo?.c}55`,background:actInfo?.c+"15",color:actInfo?.c,cursor:"pointer",fontSize:12,fontWeight:700}}>
            {tSel.size===tFilt.filter(ti=>!isExc(ti.id,actSel)).length&&tFilt.length>0?"✕ Quitar todas":"✓ Seleccionar todas"}
          </button>
        </div>
      </div>
      {/* lista */}
      <div style={{padding:"8px 16px 120px"}}>
        {isAdmin&&<div style={{fontSize:10,color:"#8aaabb",marginBottom:8,padding:"6px 10px",background:"#f8fafc",borderRadius:8}}>💡 Admin: mantén presionado una tienda para marcarla como excepción (N/A)</div>}
        {tFilt.map(tienda=>{
          const sel=tSel.has(tienda.id);
          const reg=tRegistradas.has(tienda.id);
          const exc=isExc(tienda.id,actSel);
          const fc=FMT[tienda.f];
          return(
            <div key={tienda.id}
              onClick={()=>{ if(exc)return; setTSel(p=>{const ns=new Set(p);ns.has(tienda.id)?ns.delete(tienda.id):ns.add(tienda.id);return ns;}); }}
              onMouseDown={()=>{ if(!isAdmin)return; clearTimeout(longExcRef.current); longExcRef.current=setTimeout(()=>{ toggleExcepcion(tienda.id,actSel); },700); }}
              onMouseUp={()=>clearTimeout(longExcRef.current)}
              onMouseLeave={()=>clearTimeout(longExcRef.current)}
              onTouchStart={()=>{ if(!isAdmin)return; clearTimeout(longExcRef.current); longExcRef.current=setTimeout(()=>{ toggleExcepcion(tienda.id,actSel); },700); }}
              onTouchEnd={()=>clearTimeout(longExcRef.current)}
              style={{display:"flex",alignItems:"center",gap:12,padding:"13px 14px",borderRadius:12,border:`1.5px solid ${exc?"#e2e8f0":sel?actInfo?.c:"#e2e8f0"}`,background:exc?"#f8fafc":sel?actInfo?.c+"10":"#fff",cursor:exc?"default":"pointer",marginBottom:7,transition:"all .1s",opacity:exc?0.6:1}}>
              <div style={{width:24,height:24,borderRadius:7,border:`2px solid ${exc?"#c8d8e8":sel?actInfo?.c:"#c8d8e8"}`,background:exc?"#f0f4f8":sel?actInfo?.c:"#fff",display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}>
                {sel&&!exc&&<span style={{fontSize:14,color:"#fff",fontWeight:700}}>✓</span>}
              </div>
              <div style={{flex:1}}>
                <div style={{fontSize:14,fontWeight:700,color:exc?"#94a3b8":sel?actInfo?.c:"#1a2f4a",textDecoration:exc?"line-through":"none"}}>Vega {tienda.n}</div>
                <div style={{display:"flex",gap:5,marginTop:3,flexWrap:"wrap"}}>
                  <span style={S.pill(fc.c,fc.bg)}>{tienda.f}</span>
                  {exc&&<span style={S.pill("#854F0B","#FAEEDA")}>⚠️ N/A · No aplica</span>}
                  {!exc&&reg&&<span style={S.pill("#00b894","#e8faf5")}>✅ Registrada</span>}
                </div>
              </div>
              {sel&&!exc&&<span style={{fontSize:18,color:actInfo?.c,fontWeight:700}}>✓</span>}
              {exc&&isAdmin&&<button onClick={e=>{e.stopPropagation();toggleExcepcion(tienda.id,actSel);}} style={{padding:"3px 9px",borderRadius:20,border:"1px solid #fecaca",background:"#fff1f2",color:"#dc2626",cursor:"pointer",fontSize:10,fontWeight:700}}>✕</button>}
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
    const tier = getTier(pv);
    const esAdHoc = actInfo?.cat==="Ad-hoc"||actInfo?.cat==="Promocional";
    const franjas=[
      {icon:"🥇",label:"ORO — 100%",   desde:"00:00",hasta:AR.c100,c:"#f6a623",bg:"#fff8ec"},
      {icon:"🥈",label:"PLATA — 80%",  desde:AR.c100,hasta:AR.c80, c:"#74b9ff",bg:"#e8f4fd"},
      {icon:"🥉",label:"BRONCE — 60%", desde:AR.c80, hasta:AR.c60, c:"#a29bfe",bg:"#f0edff"},
      {icon:"🔴",label:"FUERA — 0%",   desde:AR.c60, hasta:"23:59",c:"#d63031",bg:"#ffeae6"},
    ];
    const franjaActiva = pv===100?0:pv===80?1:pv===60?2:pv===0?3:-1;

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
            autoFocus
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
            <div style={{marginTop:14,padding:"14px",borderRadius:12,background:tier.bg,border:`1.5px solid ${tier.c}44`}}>
              <div style={{fontSize:36,marginBottom:4}}>{tier.icon}</div>
              <div style={{fontWeight:800,fontSize:32,color:tier.c,lineHeight:1}}>{pv}%</div>
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
        <button
          onClick={confirmarRegistro}
          disabled={pv===null}
          style={{
            ...S.btn(pv!==null?tier.c:"#e2e8f0"),
            opacity:pv!==null?1:.5,
            cursor:pv!==null?"pointer":"not-allowed",
            marginBottom:10,padding:"16px",fontSize:15,
            background:pv!==null?`linear-gradient(135deg,${tier.c},#1a2f4a)`:"#e2e8f0",
            color:pv!==null?"#fff":"#b2bec3"
          }}
        >
          {pv!==null?`✅ Registrar ${tSel.size} tienda${tSel.size!==1?"s":""} · ${pv}%`:`Ingresa la hora para continuar`}
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
    const actsActivas=acts.filter(a=>a.activa);
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
            <div key={fmt} style={{...S.card,marginBottom:16,overflow:"hidden"}}>
              <div style={{padding:"10px 14px",borderBottom:"1px solid #f0f4f8",display:"flex",alignItems:"center",gap:8}}>
                <div style={{width:4,height:18,borderRadius:2,background:fc.c}}/>
                <span style={{fontWeight:800,fontSize:13,color:fc.c}}>{fmt.toUpperCase()}</span>
                <span style={{fontSize:11,color:"#8aaabb"}}>{tsFmt.length} tiendas</span>
              </div>
              <div style={{overflowX:"auto"}}>
                <table style={{width:"100%",borderCollapse:"collapse",fontSize:12}}>
                  <thead>
                    <tr style={{background:"#f8fafc"}}>
                      <th style={{padding:"8px 12px",textAlign:"left",color:"#5a7a9a",fontWeight:700,fontSize:10,borderBottom:"1px solid #e9eef5",minWidth:140,whiteSpace:"nowrap"}}>TIENDA</th>
                      <th style={{padding:"8px 8px",textAlign:"center",color:"#5a7a9a",fontWeight:700,fontSize:9,borderBottom:"1px solid #e9eef5",minWidth:70,whiteSpace:"nowrap"}}>H. REG.</th>
                      <th style={{padding:"8px 8px",textAlign:"center",color:"#5a7a9a",fontWeight:700,fontSize:9,borderBottom:"1px solid #e9eef5",minWidth:70,whiteSpace:"nowrap"}}>ÚLT.<br/>REGISTRO</th>
                      {semsVis.map(s=>actsActivas.map(a=>(
                        <th key={s.label+a.id} style={{padding:"8px 8px",textAlign:"center",color:a.c,fontWeight:700,fontSize:9,borderBottom:"1px solid #e9eef5",minWidth:50,whiteSpace:"nowrap"}}>{s.label}<br/>{a.e}</th>
                      )))}
                      {semsVis.map(s=>(
                        <th key={"p"+s.label} style={{padding:"8px 8px",textAlign:"center",color:"#1a2f4a",fontWeight:800,fontSize:9,borderBottom:"1px solid #e9eef5",background:"#f0f4f8",minWidth:55}}>
                          {s.label}<br/>PROM
                        </th>
                      ))}
                      {selWeek===null&&<th style={{padding:"8px 8px",textAlign:"center",color:"#fff",fontWeight:800,fontSize:10,borderBottom:"1px solid #e9eef5",background:fc.c,minWidth:55}}>MES</th>}
                      <th style={{padding:"8px 8px",textAlign:"center",fontWeight:800,fontSize:9,borderBottom:"1px solid #e9eef5",background:"#f8fafc",minWidth:55}}>TIER</th>
                    </tr>
                  </thead>
                  <tbody>
                    {tsFmt.map(tr=>{
                      const pMes=calcMes(tr.id);
                      const tier=getTier(pMes);
                      return(
                        <tr key={tr.id} style={{borderBottom:"1px solid #f5f7fa"}}>
                          <td style={{padding:"8px 12px",fontWeight:700,color:"#1a2f4a",whiteSpace:"nowrap",fontSize:11}}>Vega {tr.n}</td>
                          {(()=>{
                            const allEvs=semsVis.flatMap(s=>s.days.flatMap(d=>{const ds=dStr(vYear,vMonth,d);return(getReg(ds,tr.id,actsActivas[0]?.id||"")?.evidencias||[]);}));
                            const last=allEvs.length>0?allEvs[allEvs.length-1]:null;
                            return <td style={{padding:"8px 8px",textAlign:"center",fontSize:10,color:"#8aaabb",fontFamily:"monospace"}}>{last?.horaRegistro||"—"}</td>;
                          })()}
                          <td style={{padding:"8px 8px",textAlign:"center"}}>
                            {(()=>{
                              const allTs=Object.keys(regs).filter(k=>k.includes("|"+tr.id+"|")).flatMap(k=>regs[k]?.evidencias||[]).map(e=>e.timestamp).filter(Boolean).sort().reverse();
                              if(!allTs.length)return<span style={{color:"#d1d5db",fontSize:9}}>—</span>;
                              const d=new Date(allTs[0]);
                              return<span style={{fontSize:9,color:"#5a7a9a",fontFamily:"monospace",whiteSpace:"nowrap"}}>{d.toLocaleDateString("es-PE",{day:"2-digit",month:"2-digit"})}<br/>{d.toLocaleTimeString("es-PE",{hour:"2-digit",minute:"2-digit"})}</span>;
                            })()}
                          </td>
                          {semsVis.map(sem=>actsActivas.map(a=>{
                            const ds=sem.days.map(d=>dStr(vYear,vMonth,d));
                            const scores=ds.flatMap(d=>{const rv=getReg(d,tr.id,a.id);const p=puntajeReg(rv,a.r||RANGOS_DEFAULT);return p!==null?[p]:[];});
                            const v=scores.length>0?Math.round(scores.reduce((x,y)=>x+y,0)/scores.length):null;
                            const docIds=ds.flatMap(d=>{const k=rKey(d,tr.id,a.id);const docId=k.replace(/\|/g,"--");return(regs[docId]||regs[k])?[{docId,docData:regs[docId]||regs[k],fecha:d,actividadId:a.id}]:[];});
                            const anulado=ds.some(d=>{const k=rKey(d,tr.id,a.id);const docId=k.replace(/\|/g,"--");const rv=regs[docId]||regs[k];return rv?.anulado;});
                            const menuId=`ctx-${tr.id}-${sem.label}-${a.id}`;
                            return(
                              <td key={sem.label+a.id} style={{padding:"6px 8px",textAlign:"center",position:"relative"}}>
                                {anulado?(
                                  <span style={{padding:"2px 6px",borderRadius:20,fontSize:9,fontWeight:700,color:"#854F0B",background:"#FAEEDA",border:"0.5px solid #FAC775"}}>⚠️ Anulado</span>
                                ):v!==null?(
                                  <div style={{display:"flex",flexDirection:"column",alignItems:"center",gap:2}}
                                    onMouseDown={()=>{ clearTimeout(longPressRef.current); longPressRef.current=setTimeout(()=>setCtxMenu({menuId,t:tr,sem,a,docIds}),700); }}
                                    onMouseUp={()=>clearTimeout(longPressRef.current)}
                                    onMouseLeave={()=>clearTimeout(longPressRef.current)}
                                    onTouchStart={()=>{ clearTimeout(longPressRef.current); longPressRef.current=setTimeout(()=>setCtxMenu({menuId,t:tr,sem,a,docIds}),700); }}
                                    onTouchEnd={()=>clearTimeout(longPressRef.current)}
                                    style={{cursor:"pointer"}}>
                                    <span style={{padding:"2px 7px",borderRadius:20,fontSize:10,fontWeight:700,color:sc(v),background:sb(v)}}>{v}%</span>
                                    <div style={{height:2,width:"100%",borderRadius:1,background:"#e2e8f0",overflow:"hidden",marginTop:2}}>
                                      <div style={{height:"100%",width:`${v}%`,background:sc(v),borderRadius:1}}/>
                                    </div>
                                  </div>
                                ):<span style={{color:"#d1d5db",fontSize:9}}>—</span>}
                              </td>
                            );
                          }))}
                          {semsVis.map(sem=>{
                            const ps=calcSemana(tr.id,sem);
                            return <td key={"p"+sem.label} style={{padding:"6px 8px",textAlign:"center",background:"#f8fafc"}}>{ps!==null?<span style={{padding:"2px 8px",borderRadius:20,fontSize:11,fontWeight:800,color:sc(ps),background:sb(ps)}}>{ps}%</span>:<span style={{color:"#d1d5db"}}>—</span>}</td>;
                          })}
                          {selWeek===null&&<td style={{padding:"6px 8px",textAlign:"center",background:sb(pMes)}}>{pMes!==null?<span style={{fontWeight:800,fontSize:12,color:sc(pMes)}}>{pMes}%</span>:<span style={{color:"#b2bec3"}}>—</span>}</td>}
                          <td style={{padding:"6px 8px",textAlign:"center"}}><span style={{fontSize:13}}>{tier.icon}</span><div style={{fontSize:8,fontWeight:700,color:tier.c}}>{tier.label}</div></td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          );
        })}
      </div>
    );
  };

  /* ══ TAB DASHBOARD ══ */
  const renderDashboard = ()=>{
    // filtrar tiendas según dashFmt
    const tsBase = dashFmt==="Todas" ? tiAct : tiAct.filter(ti=>ti.f===dashFmt);
    // filtrar por actividad
    const actsBase = dashAct==="Todas" ? acts.filter(a=>a.activa) : acts.filter(a=>a.activa&&a.id===dashAct);
    // calcular score con filtros aplicados
    const calcScoreFiltrado = (tId)=>{
      const ws=semanasDelMes.map(s=>{
        const scores=[];
        s.days.forEach(day=>{
          const ds=dStr(vYear,vMonth,day);
          const dw=getDow(ds);
          actsBase.filter(a=>a.dias.includes(dw)&&!isExc(tId,a.id)).forEach(a=>{
            const reg=getReg(ds,tId,a.id);
            const p=puntajeReg(reg,a.r||RANGOS_DEFAULT);
            // filtro horario
            if(p!==null){
              const h=primerEnvio(reg?.evidencias);
              const m=toMin(h);
              if(dashHora==="Todas") scores.push(p);
              else if(dashHora==="oro"&&m<=toMin("08:00")) scores.push(p);
              else if(dashHora==="plata"&&m>toMin("08:00")&&m<=toMin("09:00")) scores.push(p);
              else if(dashHora==="bronce"&&m>toMin("09:00")&&m<=toMin("10:00")) scores.push(p);
              else if(dashHora==="fuera"&&m>toMin("10:00")) scores.push(p);
            }
          });
        });
        return scores.length>0?Math.round(scores.reduce((a,b)=>a+b,0)/scores.length):null;
      }).filter(v=>v!==null);
      return ws.length>0?Math.round(ws.reduce((a,b)=>a+b,0)/ws.length):null;
    };

    const scoresMes=tsBase.map(ti=>({t:ti,score:calcScoreFiltrado(ti.id)}));
    const validos=scoresMes.filter(s=>s.score!==null);
    const SG=validos.length>0?Math.round(validos.reduce((a,b)=>a+b.score,0)/validos.length):0;
    const IC=tsBase.length>0?Math.round((tsBase.filter(ti=>calcScoreFiltrado(ti.id)!==null).length/tsBase.length)*100):0;
    const SE=tsBase.length>0?Math.round((scoresMes.filter(s=>s.score!==null&&s.score>=95).length/tsBase.length)*100):0;
    const TR=tsBase.length>0?Math.round((scoresMes.filter(s=>s.score!==null&&s.score<60).length/tsBase.length)*100):0;
    const tendencia=semanasDelMes.map(s=>{const ss=tsBase.map(ti=>calcSemana(ti.id,s)).filter(v=>v!==null);return ss.length>0?Math.round(ss.reduce((a,b)=>a+b,0)/ss.length):null;});

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

    // efectividad por actividad
    const actEfect=acts.filter(a=>a.activa).map(a=>{
      const ps=tsBase.map(ti=>{
        const scores=semanasDelMes.flatMap(s=>s.days.map(d=>{
          const ds=dStr(vYear,vMonth,d);
          if(!a.dias.includes(getDow(ds)))return null;
          return puntajeReg(getReg(ds,ti.id,a.id),a.r||RANGOS_DEFAULT);
        })).filter(p=>p!==null);
        return scores.length>0?Math.round(scores.reduce((x,y)=>x+y,0)/scores.length):null;
      }).filter(v=>v!==null);
      return{a,v:ps.length>0?Math.round(ps.reduce((x,y)=>x+y,0)/ps.length):null};
    });

    const exportPDF=()=>{
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
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8}}>
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
            <div style={{display:"flex",alignItems:"flex-end"}}>
              <button onClick={exportPDF} style={{width:"100%",padding:"7px 10px",borderRadius:8,border:"none",background:"#1a2f4a",color:"#fff",fontSize:12,fontWeight:700,cursor:"pointer"}}>⬇️ PDF Comité</button>
            </div>
          </div>
        </div>

        {/* KPIs */}
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10,marginBottom:14}}>
          {[
            {k:"SG",label:"Score Global",v:SG+"%",c:sc(SG),icon:"🎯",tier:getTier(SG)},
            {k:"IC",label:"Cumplimiento",v:IC+"%",c:"#0984e3",icon:"📬"},
            {k:"SE",label:"Excelencia",v:SE+"%",c:"#f6a623",icon:"🏆"},
            {k:"TR",label:"Tasa Riesgo",v:TR+"%",c:TR>20?"#d63031":"#b2bec3",icon:"⚠️"},
          ].map(k=>(
            <div key={k.k} style={{...S.card,padding:"14px"}}>
              <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start"}}>
                <span style={{fontSize:20}}>{k.icon}</span>
                <span style={{fontSize:8,color:"#b2bec3",fontWeight:700}}>{k.k}</span>
              </div>
              <div style={{fontWeight:800,fontSize:26,color:k.c,lineHeight:1,marginTop:6}}>{k.v}</div>
              {k.tier&&<div style={{marginTop:4}}><span style={{...S.pill(k.tier.c,k.tier.bg)}}>{k.tier.icon} {k.tier.label}</span></div>}
              <div style={{fontSize:10,color:"#5a7a9a",fontWeight:700,marginTop:4}}>{k.label}</div>
            </div>
          ))}
        </div>

        {/* tendencia */}
        <div style={{...S.card,padding:"16px",marginBottom:14}}>
          <div style={{fontWeight:800,fontSize:13,color:"#1a2f4a",marginBottom:14}}>📈 TENDENCIA SEMANAL</div>
          <div style={{display:"flex",gap:8,alignItems:"flex-end",height:80}}>
            {semanasDelMes.map((s,i)=>{
              const v=tendencia[i];
              return(
                <div key={i} style={{flex:1,display:"flex",flexDirection:"column",alignItems:"center",gap:4}}>
                  <div style={{fontSize:11,fontWeight:800,color:sc(v)}}>{v!==null?v+"%":"—"}</div>
                  <div style={{width:"100%",height:60,background:"#f0f4f8",borderRadius:6,display:"flex",alignItems:"flex-end",overflow:"hidden"}}>
                    {v!==null&&<div style={{width:"100%",height:v+"%",background:sc(v),borderRadius:"4px 4px 0 0"}}/>}
                  </div>
                  <div style={{fontSize:9,color:"#8aaabb",fontWeight:700}}>{s.label}</div>
                </div>
              );
            })}
          </div>
        </div>

        {/* efectividad por actividad */}
        <div style={{...S.card,padding:"14px",marginBottom:14}}>
          <div style={{fontWeight:800,fontSize:13,color:"#1a2f4a",marginBottom:12}}>📊 EFECTIVIDAD POR ACTIVIDAD</div>
          {actEfect.map(({a,v})=>(
            <div key={a.id} style={{display:"flex",alignItems:"center",gap:8,marginBottom:8}}>
              <span style={{fontSize:16,width:20}}>{a.e}</span>
              <span style={{fontSize:11,color:"#5a7a9a",width:130,flexShrink:0,whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis"}}>{a.n}</span>
              <div style={{flex:1,height:8,background:"#f0f4f8",borderRadius:4,overflow:"hidden"}}>
                {v!==null&&<div style={{width:v+"%",height:"100%",background:a.c,borderRadius:4}}/>}
              </div>
              <span style={{fontSize:11,fontWeight:700,color:v!==null?sc(v):"#b2bec3",width:32,textAlign:"right"}}>{v!==null?v+"%":"—"}</span>
            </div>
          ))}
        </div>

        {/* distribución horaria */}
        <div style={{...S.card,padding:"14px",marginBottom:14}}>
          <div style={{fontWeight:800,fontSize:13,color:"#1a2f4a",marginBottom:12}}>⏱️ DISTRIBUCIÓN HORARIA</div>
          {horasDist.map(h=>(
            <div key={h.l} style={{display:"flex",alignItems:"center",gap:8,marginBottom:8}}>
              <span style={{fontSize:11,color:"#5a7a9a",width:120,flexShrink:0}}>{h.l}</span>
              <div style={{flex:1,height:8,background:"#f0f4f8",borderRadius:4,overflow:"hidden"}}>
                <div style={{width:Math.round(h.n/totalEvs*100)+"%",height:"100%",background:h.c,borderRadius:4}}/>
              </div>
              <span style={{fontSize:11,fontWeight:700,color:h.c,width:32,textAlign:"right"}}>{Math.round(h.n/totalEvs*100)}%</span>
            </div>
          ))}
        </div>

        {/* por formato */}
        <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(200px,1fr))",gap:10,marginBottom:14}}>
          {["Mayorista","Supermayorista","Market"].map(fmt=>{
            const fc=FMT[fmt];
            const fts=tiAct.filter(ti=>ti.f===fmt);
            const scores=fts.map(ti=>calcMes(ti.id)).filter(v=>v!==null);
            const prom=scores.length>0?Math.round(scores.reduce((a,b)=>a+b,0)/scores.length):null;
            const tier=getTier(prom);
            return(
              <div key={fmt} style={{...S.card,padding:"14px",borderLeft:`4px solid ${fc.c}`}}>
                <div style={{fontWeight:800,fontSize:12,color:fc.c}}>{fmt.toUpperCase()}</div>
                <div style={{fontSize:9,color:"#8aaabb",marginTop:2}}>{fts.length} tiendas</div>
                <div style={{fontWeight:800,fontSize:24,color:sc(prom),marginTop:8}}>{prom!==null?prom+"%":"—"}</div>
                <div style={{fontSize:10,color:tier.c,fontWeight:700,marginTop:2}}>{tier.icon} {tier.label}</div>
                <div style={{height:4,background:"#f0f4f8",borderRadius:2,marginTop:8}}>
                  <div style={{width:(prom||0)+"%",height:"100%",background:fc.c,borderRadius:2}}/>
                </div>
              </div>
            );
          })}
        </div>

        {/* ranking top/bottom */}
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10,marginBottom:14}}>
          <div style={{...S.card,padding:"14px"}}>
            <div style={{fontWeight:800,fontSize:12,color:"#1a2f4a",marginBottom:10}}>🏅 Top 5</div>
            {top5.map((s,i)=>(
              <div key={s.t.id} style={{display:"flex",alignItems:"center",gap:6,marginBottom:6}}>
                <span style={{fontSize:12,width:16}}>{i===0?"🥇":i===1?"🥈":i===2?"🥉":"·"}</span>
                <span style={{fontSize:11,flex:1,color:"#1a2f4a",overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{s.t.n}</span>
                <span style={{fontSize:11,fontWeight:700,color:sc(s.score)}}>{s.score}%</span>
              </div>
            ))}
          </div>
          <div style={{...S.card,padding:"14px"}}>
            <div style={{fontWeight:800,fontSize:12,color:"#1a2f4a",marginBottom:10}}>⚠️ Bottom 5</div>
            {bot5.map((s,i)=>(
              <div key={s.t.id} style={{display:"flex",alignItems:"center",gap:6,marginBottom:6}}>
                <span style={{fontSize:12,width:16}}>🔴</span>
                <span style={{fontSize:11,flex:1,color:"#1a2f4a",overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{s.t.n}</span>
                <span style={{fontSize:11,fontWeight:700,color:sc(s.score)}}>{s.score}%</span>
              </div>
            ))}
          </div>
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
                      <td style={{padding:"8px 10px",textAlign:"center",background:sb(score)}}>{score!==null?<span style={{fontWeight:800,fontSize:12,color:sc(score)}}>{score}%</span>:<span style={{color:"#b2bec3"}}>—</span>}</td>
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
        {["Actividades","Tiendas","Accesos"].map((l,i)=>(
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
                  style={{padding:"5px 10px",borderRadius:8,border:"1px solid #c8d8e8",background:a._er?"#f0f4f8":"#fff",color:"#5a7a9a",cursor:"pointer",fontSize:11,fontWeight:700,marginRight:4}}>⏱️</button>
                <button onClick={()=>setActs(p=>{const np=p.map(x=>x.id===a.id?{...x,activa:!x.activa}:x);saveConfig({actividades:np});return np;})}
                  style={{padding:"5px 12px",borderRadius:8,border:`1px solid ${a.activa?"#fecaca":"#bbf7d0"}`,background:a.activa?"#fff1f2":"#f0fdf4",color:a.activa?"#dc2626":"#16a34a",cursor:"pointer",fontSize:11,fontWeight:700}}>
                  {a.activa?"Pausar":"Activar"}
                </button>
              </div>
              {a._er&&(
                <div style={{marginTop:12,padding:"12px",borderRadius:10,background:a.c+"0a",border:`1px solid ${a.c}33`}}>
                  <div style={{fontSize:10,fontWeight:800,color:a.c,marginBottom:10,letterSpacing:".05em"}}>⏱️ RANGOS HORARIOS · {a.n.toUpperCase()}</div>
                  <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:8,marginBottom:10}}>
                    {[{k:"c100",icon:"🥇",label:"100% hasta"},{k:"c80",icon:"🥈",label:"80% hasta"},{k:"c60",icon:"🥉",label:"60% hasta"}].map(f=>(
                      <div key={f.k}>
                        <div style={{fontSize:9,color:"#8aaabb",fontWeight:700,marginBottom:4}}>{f.icon} {f.label}</div>
                        <input type="time" value={RR[f.k]}
                          onChange={e=>setActs(p=>p.map(x=>x.id===a.id?{...x,r:{...(x.r||RANGOS_DEFAULT),[f.k]:e.target.value}}:x))}
                          style={{width:"100%",padding:"8px",borderRadius:8,border:`1.5px solid ${a.c}55`,background:"#fff",color:"#1a2f4a",fontSize:13,outline:"none",textAlign:"center"}}/>
                      </div>
                    ))}
                  </div>
                  <div style={{display:"flex",gap:5,flexWrap:"wrap",marginBottom:8}}>
                    {[["100%","#f6a623",`≤${RR.c100}`],["80%","#74b9ff",`${RR.c100}–${RR.c80}`],["60%","#a29bfe",`${RR.c80}–${RR.c60}`],["0%","#d63031",`>${RR.c60}`]].map(([p,c,t])=>(
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
        <div style={{...S.card,padding:"20px"}}>
          <div style={{fontWeight:800,fontSize:14,color:"#1a2f4a",marginBottom:16}}>🔑 Códigos de Acceso</div>
          {[{k:"admin",label:"👑 Administrador",c:"#f6a623"},{k:"auditor",label:"📋 Auditor",c:"#00b5b4"},{k:"viewer",label:"👁️ Viewer",c:"#74b9ff"}].map(f=>(
            <div key={f.k} style={{marginBottom:14}}>
              <label style={{...S.lbl,color:f.c}}>{f.label}</label>
              <input type="text" value={pins[f.k]} onChange={e=>setPins(p=>({...p,[f.k]:e.target.value}))} style={{...S.inp,letterSpacing:3,fontFamily:"monospace"}}/>
            </div>
          ))}
          <button onClick={()=>showToast("✅ Códigos guardados")} style={S.btn("#00b5b4")}>Guardar cambios</button>
        </div>
      )}
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
          <button onClick={()=>{setRole(null);setUName("");}} style={{padding:"5px 10px",borderRadius:7,border:"1px solid rgba(255,255,255,.2)",background:"rgba(255,255,255,.08)",color:"rgba(255,255,255,.7)",cursor:"pointer",fontSize:10,fontWeight:700}}>↩</button>
        </div>
        <div style={{display:"flex",gap:0,overflowX:"auto"}}>
          {tabs.map(tb=><button key={tb.i} onClick={()=>setTab(tb.i)} style={S.tabB(tab===tb.i)}>{tb.label}</button>)}
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
function LoginScreen({pins,onLogin}){
  const[pin,setPin]=useState("");
  const[name,setName]=useState("");
  const[step,setStep]=useState("pin");
  const[err,setErr]=useState(false);
  const tryPin=()=>{
    if(pin===pins.admin){onLogin("admin","Administrador");return;}
    if(pin===pins.auditor){setStep("name");return;}
    if(pin===pins.viewer){onLogin("viewer","Gerencia");return;}
    setErr(true);setTimeout(()=>{setErr(false);setPin("");},1200);
  };
  const inpS={width:"100%",padding:"14px",borderRadius:12,background:"#f8fafc",color:"#1a2f4a",fontSize:20,outline:"none",textAlign:"center",letterSpacing:8,boxSizing:"border-box",marginBottom:12};
  return(
    <div style={{fontFamily:"'DM Sans',system-ui,sans-serif",background:"linear-gradient(135deg,#1a2f4a,#0d1f35)",minHeight:"100vh",display:"flex",alignItems:"center",justifyContent:"center",padding:20}}>
      <link href="https://fonts.googleapis.com/css2?family=DM+Sans:opsz,wght@9..40,400;9..40,600;9..40,700&family=Syne:wght@700;800&display=swap" rel="stylesheet"/>
      <div style={{width:"100%",maxWidth:380,background:"#fff",borderRadius:20,padding:36,boxShadow:"0 24px 60px rgba(0,0,0,.3)",textAlign:"center"}}>
        <div style={{width:64,height:64,borderRadius:18,background:"linear-gradient(135deg,#00b5b4,#1a2f4a)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:30,margin:"0 auto 20px"}}>🏪</div>
        <div style={{fontFamily:"'Syne',sans-serif",fontSize:20,fontWeight:800,color:"#1a2f4a",marginBottom:4}}>VEGA · EVIDENCIAS</div>
        <div style={{fontSize:10,color:"#8aaabb",letterSpacing:".08em",marginBottom:28}}>CONTROL DE IMPLEMENTACIÓN DIARIA</div>
        {step==="pin"?(
          <>
            <p style={{margin:"0 0 16px",fontSize:13,color:"#5a7a9a"}}>Ingresa tu código de acceso</p>
            <input autoFocus type="password" value={pin} onChange={e=>setPin(e.target.value)} onKeyDown={e=>e.key==="Enter"&&tryPin()} placeholder="••••••••"
              style={{...inpS,border:`2px solid ${err?"#ef4444":"#c8d8e8"}`}}/>
            <button onClick={tryPin} style={{width:"100%",padding:"14px",borderRadius:12,border:"none",background:pin?"linear-gradient(135deg,#00b5b4,#1a2f4a)":"#e2e8f0",color:pin?"white":"#94a3b8",cursor:pin?"pointer":"not-allowed",fontSize:14,fontWeight:700,marginBottom:20}}>
              {err?"❌ Código incorrecto":"Ingresar →"}
            </button>
            <div style={{background:"#f8fafc",borderRadius:12,padding:"14px",textAlign:"left",border:"1px solid #e2e8f0"}}>
              <div style={{fontSize:9,color:"#8aaabb",fontWeight:700,letterSpacing:".06em",marginBottom:10}}>DEMO — CREDENCIALES</div>
              {[["👑","Admin","vega2026","#f6a623"],["📋","Auditor","auditor88","#00b5b4"],["👁️","Viewer","gerencia1","#74b9ff"]].map(([ic,r,p,c])=>(
                <div key={r} style={{display:"flex",alignItems:"center",gap:8,marginBottom:5}}>
                  <span style={{fontSize:14}}>{ic}</span>
                  <span style={{fontSize:11,fontWeight:700,color:c,flex:1}}>{r}</span>
                  <code style={{fontSize:11,background:c+"18",color:c,padding:"2px 8px",borderRadius:6}}>{p}</code>
                </div>
              ))}
            </div>
          </>
        ):(
          <>
            <div style={{fontSize:28,marginBottom:12}}>📋</div>
            <p style={{margin:"0 0 6px",fontSize:13,color:"#00b5b4",fontWeight:700}}>✅ Acceso verificado</p>
            <p style={{margin:"0 0 20px",fontSize:12,color:"#5a7a9a"}}>¿Cómo aparecerás como auditor?</p>
            <input autoFocus value={name} onChange={e=>setName(e.target.value)} onKeyDown={e=>e.key==="Enter"&&name.trim()&&onLogin("auditor",name.trim())}
              placeholder="Tu nombre completo"
              style={{...inpS,border:"2px solid #00b5b4",letterSpacing:0,fontSize:14}}/>
            <button onClick={()=>name.trim()&&onLogin("auditor",name.trim())} disabled={!name.trim()}
              style={{width:"100%",padding:"14px",borderRadius:12,border:"none",background:name.trim()?"linear-gradient(135deg,#00b5b4,#1a2f4a)":"#e2e8f0",color:name.trim()?"white":"#94a3b8",cursor:name.trim()?"pointer":"not-allowed",fontSize:14,fontWeight:700}}>
              Entrar como Auditor →
            </button>
          </>
        )}
      </div>
    </div>
  );
}

function PinModal({pins,onSave,onClose}){
  const[p,setP]=useState({...pins});
  return(
    <div style={{position:"fixed",inset:0,background:"rgba(26,47,74,.6)",display:"flex",alignItems:"center",justifyContent:"center",zIndex:50,backdropFilter:"blur(4px)"}}>
      <div style={{background:"#fff",borderRadius:16,padding:26,width:"90%",maxWidth:380,border:"1px solid #e2e8f0"}}>
        <div style={{fontWeight:800,fontSize:15,color:"#1a2f4a",marginBottom:16}}>🔑 Cambiar Códigos</div>
        {[{k:"admin",label:"👑 Admin"},{k:"auditor",label:"📋 Auditor"},{k:"viewer",label:"👁️ Viewer"}].map(f=>(
          <div key={f.k} style={{marginBottom:12}}>
            <label style={{fontSize:11,fontWeight:700,color:"#5a7a9a",display:"block",marginBottom:4}}>{f.label}</label>
            <input type="text" value={p[f.k]} onChange={e=>setP(x=>({...x,[f.k]:e.target.value}))} style={{width:"100%",padding:"10px 12px",borderRadius:8,border:"1px solid #c8d8e8",background:"#f8fafc",color:"#1a2f4a",fontSize:13,outline:"none",letterSpacing:3,fontFamily:"monospace",boxSizing:"border-box"}}/>
          </div>
        ))}
        <div style={{display:"flex",gap:8,marginTop:4}}>
          <button onClick={onClose} style={{flex:1,padding:"10px",borderRadius:9,border:"1px solid #c8d8e8",background:"#fff",color:"#5a7a9a",cursor:"pointer",fontWeight:700,fontSize:12}}>Cancelar</button>
          <button onClick={()=>onSave(p)} style={{flex:1,padding:"10px",borderRadius:9,border:"none",background:"linear-gradient(135deg,#00b5b4,#1a2f4a)",color:"#fff",cursor:"pointer",fontWeight:700,fontSize:12}}>Guardar</button>
        </div>
      </div>
    </div>
  );
}
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

const RANGOS_DEFAULT = { c100:"08:00", c80:"09:00", c60:"10:00" };

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
  {id:"a11",n:"Precios en Anaquel",  dias:[1,2,3,4,5], e:"🏷️",c:"#55efc4",cat:"Ad-hoc",  r:null,activa:true},
];

const MESES = ["Enero","Febrero","Marzo","Abril","Mayo","Junio","Julio","Agosto","Septiembre","Octubre","Noviembre","Diciembre"];
const DIAS_N = ["Domingo","Lunes","Martes","Miércoles","Jueves","Viernes","Sábado"];
const FMT = {
  Mayorista:      {c:"#6c5ce7",bg:"#f0edff"},
  Supermayorista: {c:"#0984e3",bg:"#e8f4fd"},
  Market:         {c:"#00b5b4",bg:"#e0fafa"},
};
const PUNTAJES = [
  {pct:100,icon:"🥇",label:"ORO",    c:"#f6a623",bg:"#fff8ec",key:"c100"},
  {pct:80, icon:"🥈",label:"PLATA",  c:"#74b9ff",bg:"#e8f4fd",key:"c80"},
  {pct:60, icon:"🥉",label:"BRONCE", c:"#a29bfe",bg:"#f0edff",key:"c60"},
  {pct:0,  icon:"🔴",label:"FUERA",  c:"#d63031",bg:"#ffeae6",key:null},
];

/* ══ UTILS ══════════════════════════════════════════════ */
const todayStr = () => new Date().toISOString().slice(0,10);
const getDow   = s  => new Date(s+"T12:00:00").getDay();
const dStr     = (y,m,d) => `${y}-${String(m+1).padStart(2,"0")}-${String(d).padStart(2,"0")}`;
const rKey     = (f,t,a) => `${f}|${t}|${a}`;
const toMin    = h  => { if(!h)return 9999; const[hh,mm]=h.split(":").map(Number); return hh*60+mm; };

function calcP(hora, r) {
  if(!hora) return null;
  const R=r||RANGOS_DEFAULT, m=toMin(hora);
  if(m<=toMin(R.c100)) return 100;
  if(m<=toMin(R.c80))  return 80;
  if(m<=toMin(R.c60))  return 60;
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
  if(s>=100) return {label:"ORO",   icon:"🥇",c:"#f6a623",bg:"#fff8ec"};
  if(s>=80)  return {label:"PLATA", icon:"🥈",c:"#74b9ff",bg:"#e8f4fd"};
  if(s>=60)  return {label:"BRONCE",icon:"🥉",c:"#a29bfe",bg:"#f0edff"};
  if(s>=1)   return {label:"RIESGO",icon:"⚠️",c:"#e17055",bg:"#fff1ee"};
  return            {label:"FUERA", icon:"🔴",c:"#d63031",bg:"#ffeae6"};
}
function sc(v){if(!v&&v!==0)return"#b2bec3";if(v>=95)return"#f6a623";if(v>=85)return"#00b894";if(v>=75)return"#74b9ff";if(v>=60)return"#e17055";return"#d63031";}
function sb(v){if(!v&&v!==0)return"#f4f6f8";if(v>=95)return"#fff8ec";if(v>=85)return"#e8faf5";if(v>=75)return"#e8f4fd";if(v>=60)return"#fff1ee";return"#ffeae6";}

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

/* ══ APP ══════════════════════════════════════════════ */
export default function ChecklistApp() {
  const now = new Date();
  /* ── auth ── */
  const [role,    setRole]    = useState(null);
  const [uName,   setUName]   = useState("");
  const [pins,    setPins]    = useState({admin:"vega2026",auditor:"auditor88",viewer:"gerencia1"});
  const [pinMod,  setPinMod]  = useState(false);
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
  const [horaEx,  setHoraEx]  = useState("");
  const [obsEx,   setObsEx]   = useState("");
  /* ── filtros ── */
  const [fmtFilt,      setFmtFilt]      = useState("Todas");
  const [busq,         setBusq]         = useState("");
  const [verRegistradas, setVerRegistradas] = useState(false);
  const [rangoExt,     setRangoExt]     = useState(null); // rango extendido temporal por actividad
  /* ── config ── */
  const [cfgTab,  setCfgTab]  = useState(0);
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
    const loadCfg = async ()=>{
      const snap = await getDoc(doc(db,"config","app"));
      if(snap.exists()){
        const d=snap.data();
        if(d.actividades) setActs(d.actividades);
        if(d.tiendas)     setTiendas(d.tiendas);
        if(d.pins)        setPins(d.pins);
        if(d.excepciones) setExceps(d.excepciones);
      }
    };
    loadCfg();
  },[]);

  const saveConfig = useCallback(async (overrides={})=>{
    await setDoc(doc(db,"config","app"),{
      actividades: overrides.actividades ?? acts,
      tiendas:     overrides.tiendas     ?? tiendas,
      pins:        overrides.pins        ?? pins,
      excepciones: overrides.excepciones ?? exceps,
      updatedAt:   new Date().toISOString(),
    });
  },[acts,tiendas,pins,exceps]);

  const dow = getDow(fecha);
  const esFS = dow===0||dow===6;
  const tiAct = useMemo(()=>tiendas.filter(t=>t.activa),[tiendas]);
  const actsDia = useMemo(()=>acts.filter(a=>a.activa&&a.dias.includes(dow)),[acts,dow]);
  const actInfo = acts.find(a=>a.id===actSel);
  const semanasDelMes = useMemo(()=>getWeeksOfMonth(vYear,vMonth),[vYear,vMonth]);
  const isAdmin   = role==="admin";
  const isAuditor = role==="admin"||role==="auditor";

  const getReg = useCallback((f,t,a)=>{
    const k=rKey(f,t,a);
    const docId=k.replace(/\|/g,"--");
    return regs[docId]||regs[k]||null;
  },[regs]);
  const isExc  = useCallback((tId,aId)=>exceps[tId+"|"+aId]===true,[exceps]);

  const showToast = msg=>{
    setToast(msg);
    if(toastRef.current)clearTimeout(toastRef.current);
    toastRef.current=setTimeout(()=>setToast(""),2500);
  };

  /* ── cálculos KPI ── */
  const kpisDia = useMemo(()=>{
    if(!actSel)return{total:0,IC:0,IP:0,SE:0,TR:0,SG:0,al100:0,conEnvio:0};
    const AR=actInfo?.r||RANGOS_DEFAULT;
    const ts=tiAct.filter(t=>!isExc(t.id,actSel));
    const total=ts.length;
    const withEnv=ts.filter(t=>puntajeReg(getReg(fecha,t.id,actSel),AR)!==null);
    const pts=ts.map(t=>puntajeReg(getReg(fecha,t.id,actSel),AR));
    const IC=total>0?Math.round((withEnv.length/total)*100):0;
    const valid=pts.filter(p=>p!==null);
    const IP=valid.length>0?Math.round(valid.reduce((a,b)=>a+b,0)/valid.length):0;
    const al100=pts.filter(p=>p===100).length;
    const SE=total>0?Math.round((al100/total)*100):0;
    const TR=total>0?Math.round((ts.filter(t=>puntajeReg(getReg(fecha,t.id,actSel),AR)===null).length/total)*100):0;
    const SG=Math.round((IC*IP)/100);
    const r100=withEnv.filter(t=>puntajeReg(getReg(fecha,t.id,actSel),AR)===100);
    const r80=withEnv.filter(t=>puntajeReg(getReg(fecha,t.id,actSel),AR)===80);
    const r60=withEnv.filter(t=>puntajeReg(getReg(fecha,t.id,actSel),AR)===60);
    const r0=ts.filter(t=>puntajeReg(getReg(fecha,t.id,actSel),AR)===null);
    return{total,IC,IP,SE,TR,SG,al100,conEnvio:withEnv.length,r100,r80,r60,r0};
  },[actSel,actInfo,tiAct,isExc,getReg,fecha]);

  const calcSemana = useCallback((tId,sem)=>{
    const scores=[];
    sem.days.forEach(day=>{
      const ds=dStr(vYear,vMonth,day);
      const dw=getDow(ds);
      acts.filter(a=>a.activa&&a.dias.includes(dw)&&!isExc(tId,a.id)).forEach(a=>{
        const p=puntajeReg(getReg(ds,tId,a.id),a.r||RANGOS_DEFAULT);
        if(p!==null)scores.push(p);
      });
    });
    return scores.length>0?Math.round(scores.reduce((a,b)=>a+b,0)/scores.length):null;
  },[acts,regs,vYear,vMonth,isExc,getReg]);

  const calcMes = useCallback((tId)=>{
    const ws=semanasDelMes.map(s=>calcSemana(tId,s)).filter(v=>v!==null);
    return ws.length>0?Math.round(ws.reduce((a,b)=>a+b,0)/ws.length):null;
  },[semanasDelMes,calcSemana]);

  /* ── tiendas filtradas para lista ── */
  const tFilt = useMemo(()=>tiAct.filter(t=>{
    if(fmtFilt!=="Todas"&&t.f!==fmtFilt)return false;
    if(busq&&!t.n.toLowerCase().includes(busq.toLowerCase()))return false;
    // ocultar ya registradas salvo admin con toggle activo
    if(!verRegistradas && tRegistradas.has(t.id)) return false;
    return true;
  }),[tiAct,fmtFilt,busq,tRegistradas,verRegistradas]);

  const tRegistradas = useMemo(()=>new Set(
    tiAct.filter(t=>regs[rKey(fecha,t.id,actSel||"")]?.evidencias?.length>0).map(t=>t.id)
  ),[tiAct,regs,fecha,actSel]);

  /* ── confirmar registros en bloque ── */
  const confirmarRegistro = async ()=>{
    if(!horaEx||tSel.size===0||!actSel)return;
    const AR = rangoExt || actInfo?.r || RANGOS_DEFAULT;
    const pct=calcP(horaEx,AR);
    const tier=getTier(pct);
    let n=0;
    const promises=[];
    tSel.forEach(tId=>{
      const k=rKey(fecha,tId,actSel);
      const now=new Date();
      const hreg=now.toLocaleTimeString("es-PE",{hour:"2-digit",minute:"2-digit"});
      const ev={id:Date.now()+n,hora:horaEx,puntaje:pct,observacion:obsEx||`Registro en bloque · ${tier.label}`,horaRegistro:hreg,auditor:uName,timestamp:now.toISOString()};
      const prevEvs=(regs[k]?.evidencias)||[];
      const newEvs=[...prevEvs,ev].sort((a,b)=>a.hora.localeCompare(b.hora));
      // Save to Firestore — key as doc id (replace | with -)
      const docId=k.replace(/\|/g,"--");
      promises.push(setDoc(doc(db,"registros",docId),{evidencias:newEvs,fecha,tiendaId:tId,actividadId:actSel,updatedAt:now.toISOString()}));
      n++;
    });
    await Promise.all(promises);
    showToast(`✅ ${n} tienda${n!==1?"s":""} · ${horaEx} · ${pct}% ${tier.icon}`);
    setTSel(new Set());setRango(null);setHoraEx("07:00");setObsEx("");setPaso(1);setActSel(null);
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
    const tier = getTier(pct);
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
    showToast(`✏️ Registro actualizado · ${horaUpd} · ${pct}% ${tier.icon}`);
    setUpdModal(null); setHoraUpd(""); setMotivoUpd("");
  };

  const toggleExcepcion = async (tId, aId) => {
    const key = tId+"|"+aId;
    const newExceps = {...exceps};
    if(newExceps[key]) delete newExceps[key];
    else newExceps[key] = true;
    setExceps(newExceps);
    await saveConfig({excepciones: newExceps});
    showToast(newExceps[key] ? "⚠️ Tienda excluida de esta actividad" : "✅ Excepción removida");
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
  if(!role) return <LoginScreen pins={pins} onLogin={(r,n)=>{setRole(r);setUName(n);setTab(r==="viewer"?1:0);}}/>;

  /* ══ PASO 1 — seleccionar actividad ══ */
  const renderPaso1 = ()=>(
    <div style={{padding:"16px"}}>
      <p style={{margin:"0 0 14px",fontSize:12,color:"#8aaabb",fontWeight:700,letterSpacing:".06em"}}>
        {DIAS_N[dow].toUpperCase()} · {actsDia.length} ACTIVIDAD{actsDia.length!==1?"ES":""} PROGRAMADA{actsDia.length!==1?"S":""}
      </p>
      {actsDia.map(a=>(
        <button key={a.id} onClick={()=>{setActSel(a.id);setPaso(2);setTSel(new Set());setRango(null);setVerRegistradas(false);setRangoExt(null);}}
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
          <span style={{...S.pill("#8aaabb","#f0f4f8"),marginLeft:"auto"}}>{tSel.size} sel.</span>
          <span style={{...S.pill("#00b894","#e8faf5")}}>{tRegistradas.size} reg.</span>
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
      <div style={{padding:"8px 16px",background:"#f8fafc",borderBottom:"1px solid #e2e8f0",display:"flex",alignItems:"center",justifyContent:"space-between",gap:8,flexWrap:"wrap"}}>
        <div style={{display:"flex",gap:8,alignItems:"center"}}>
          <span style={{fontSize:12,color:"#8aaabb"}}>{tFilt.length} pendientes</span>
          {tRegistradas.size>0&&<span style={S.pill("#00b894","#e8faf5")}>✅ {tRegistradas.size} registradas</span>}
        </div>
        <div style={{display:"flex",gap:6,alignItems:"center"}}>
          {isAdmin&&tRegistradas.size>0&&(
            <button onClick={()=>setVerRegistradas(v=>!v)}
              style={{padding:"5px 12px",borderRadius:8,border:`1.5px solid ${verRegistradas?"#0984e3":"#e2e8f0"}`,background:verRegistradas?"#e8f4fd":"#fff",color:verRegistradas?"#0984e3":"#5a7a9a",cursor:"pointer",fontSize:11,fontWeight:700}}>
              {verRegistradas?"Ocultar registradas":"Ver todas"}
            </button>
          )}
          <button onClick={()=>setTSel(tSel.size===tFilt.length?new Set():new Set(tFilt.filter(ti=>!isExc(ti.id,actSel)).map(ti=>ti.id)))}
            style={{padding:"6px 14px",borderRadius:8,border:`1.5px solid ${actInfo?.c}55`,background:actInfo?.c+"15",color:actInfo?.c,cursor:"pointer",fontSize:12,fontWeight:700}}>
            {tSel.size===tFilt.filter(ti=>!isExc(ti.id,actSel)).length&&tFilt.length>0?"✕ Quitar todas":"✓ Seleccionar todas"}
          </button>
        </div>
      </div>
      {/* lista */}
      <div style={{padding:"8px 16px 120px"}}>
        {isAdmin&&<div style={{fontSize:10,color:"#8aaabb",marginBottom:8,padding:"6px 10px",background:"#f8fafc",borderRadius:8}}>💡 Admin: mantén presionado una tienda para marcarla como excepción (N/A)</div>}
        {tFilt.map(tienda=>{
          const sel=tSel.has(tienda.id);
          const reg=tRegistradas.has(tienda.id);
          const exc=isExc(tienda.id,actSel);
          const fc=FMT[tienda.f];
          return(
            <div key={tienda.id}
              onClick={()=>{ if(exc)return; setTSel(p=>{const ns=new Set(p);ns.has(tienda.id)?ns.delete(tienda.id):ns.add(tienda.id);return ns;}); }}
              onMouseDown={()=>{ if(!isAdmin)return; clearTimeout(longExcRef.current); longExcRef.current=setTimeout(()=>{ toggleExcepcion(tienda.id,actSel); },700); }}
              onMouseUp={()=>clearTimeout(longExcRef.current)}
              onMouseLeave={()=>clearTimeout(longExcRef.current)}
              onTouchStart={()=>{ if(!isAdmin)return; clearTimeout(longExcRef.current); longExcRef.current=setTimeout(()=>{ toggleExcepcion(tienda.id,actSel); },700); }}
              onTouchEnd={()=>clearTimeout(longExcRef.current)}
              style={{display:"flex",alignItems:"center",gap:12,padding:"13px 14px",borderRadius:12,border:`1.5px solid ${exc?"#e2e8f0":sel?actInfo?.c:"#e2e8f0"}`,background:exc?"#f8fafc":sel?actInfo?.c+"10":"#fff",cursor:exc?"default":"pointer",marginBottom:7,transition:"all .1s",opacity:exc?0.6:1}}>
              <div style={{width:24,height:24,borderRadius:7,border:`2px solid ${exc?"#c8d8e8":sel?actInfo?.c:"#c8d8e8"}`,background:exc?"#f0f4f8":sel?actInfo?.c:"#fff",display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}>
                {sel&&!exc&&<span style={{fontSize:14,color:"#fff",fontWeight:700}}>✓</span>}
              </div>
              <div style={{flex:1}}>
                <div style={{fontSize:14,fontWeight:700,color:exc?"#94a3b8":sel?actInfo?.c:"#1a2f4a",textDecoration:exc?"line-through":"none"}}>Vega {tienda.n}</div>
                <div style={{display:"flex",gap:5,marginTop:3,flexWrap:"wrap"}}>
                  <span style={S.pill(fc.c,fc.bg)}>{tienda.f}</span>
                  {exc&&<span style={S.pill("#854F0B","#FAEEDA")}>⚠️ N/A · No aplica</span>}
                  {!exc&&reg&&<span style={S.pill("#00b894","#e8faf5")}>✅ Registrada</span>}
                </div>
              </div>
              {sel&&!exc&&<span style={{fontSize:18,color:actInfo?.c,fontWeight:700}}>✓</span>}
              {exc&&isAdmin&&<button onClick={e=>{e.stopPropagation();toggleExcepcion(tienda.id,actSel);}} style={{padding:"3px 9px",borderRadius:20,border:"1px solid #fecaca",background:"#fff1f2",color:"#dc2626",cursor:"pointer",fontSize:10,fontWeight:700}}>✕</button>}
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
    const tier = getTier(pv);
    const esAdHoc = actInfo?.cat==="Ad-hoc"||actInfo?.cat==="Promocional";
    const franjas=[
      {icon:"🥇",label:"ORO — 100%",   desde:"00:00",hasta:AR.c100,c:"#f6a623",bg:"#fff8ec"},
      {icon:"🥈",label:"PLATA — 80%",  desde:AR.c100,hasta:AR.c80, c:"#74b9ff",bg:"#e8f4fd"},
      {icon:"🥉",label:"BRONCE — 60%", desde:AR.c80, hasta:AR.c60, c:"#a29bfe",bg:"#f0edff"},
      {icon:"🔴",label:"FUERA — 0%",   desde:AR.c60, hasta:"23:59",c:"#d63031",bg:"#ffeae6"},
    ];
    const franjaActiva = pv===100?0:pv===80?1:pv===60?2:pv===0?3:-1;

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
            autoFocus
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
            <div style={{marginTop:14,padding:"14px",borderRadius:12,background:tier.bg,border:`1.5px solid ${tier.c}44`}}>
              <div style={{fontSize:36,marginBottom:4}}>{tier.icon}</div>
              <div style={{fontWeight:800,fontSize:32,color:tier.c,lineHeight:1}}>{pv}%</div>
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
        <button
          onClick={confirmarRegistro}
          disabled={pv===null}
          style={{
            ...S.btn(pv!==null?tier.c:"#e2e8f0"),
            opacity:pv!==null?1:.5,
            cursor:pv!==null?"pointer":"not-allowed",
            marginBottom:10,padding:"16px",fontSize:15,
            background:pv!==null?`linear-gradient(135deg,${tier.c},#1a2f4a)`:"#e2e8f0",
            color:pv!==null?"#fff":"#b2bec3"
          }}
        >
          {pv!==null?`✅ Registrar ${tSel.size} tienda${tSel.size!==1?"s":""} · ${pv}%`:`Ingresa la hora para continuar`}
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
    const actsActivas=acts.filter(a=>a.activa);
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
          const tsFmt=tiAct.filter(t=>t.f===fmt);
          if(!tsFmt.length)return null;
          const fc=FMT[fmt];
          return(
            <div key={fmt} style={{...S.card,marginBottom:16,overflow:"hidden"}}>
              <div style={{padding:"10px 14px",borderBottom:"1px solid #f0f4f8",display:"flex",alignItems:"center",gap:8}}>
                <div style={{width:4,height:18,borderRadius:2,background:fc.c}}/>
                <span style={{fontWeight:800,fontSize:13,color:fc.c}}>{fmt.toUpperCase()}</span>
                <span style={{fontSize:11,color:"#8aaabb"}}>{tsFmt.length} tiendas</span>
              </div>
              <div style={{overflowX:"auto"}}>
                <table style={{width:"100%",borderCollapse:"collapse",fontSize:12}}>
                  <thead>
                    <tr style={{background:"#f8fafc"}}>
                      <th style={{padding:"8px 12px",textAlign:"left",color:"#5a7a9a",fontWeight:700,fontSize:10,borderBottom:"1px solid #e9eef5",minWidth:140,whiteSpace:"nowrap"}}>TIENDA</th>
                      <th style={{padding:"8px 8px",textAlign:"center",color:"#5a7a9a",fontWeight:700,fontSize:9,borderBottom:"1px solid #e9eef5",minWidth:70,whiteSpace:"nowrap"}}>H. REG.</th>
                      <th style={{padding:"8px 8px",textAlign:"center",color:"#5a7a9a",fontWeight:700,fontSize:9,borderBottom:"1px solid #e9eef5",minWidth:70,whiteSpace:"nowrap"}}>ÚLT.<br/>REGISTRO</th>
                      {semsVis.map(s=>actsActivas.map(a=>(
                        <th key={s.label+a.id} style={{padding:"8px 8px",textAlign:"center",color:a.c,fontWeight:700,fontSize:9,borderBottom:"1px solid #e9eef5",minWidth:50,whiteSpace:"nowrap"}}>{s.label}<br/>{a.e}</th>
                      )))}
                      {semsVis.map(s=>(
                        <th key={"p"+s.label} style={{padding:"8px 8px",textAlign:"center",color:"#1a2f4a",fontWeight:800,fontSize:9,borderBottom:"1px solid #e9eef5",background:"#f0f4f8",minWidth:55}}>
                          {s.label}<br/>PROM
                        </th>
                      ))}
                      {selWeek===null&&<th style={{padding:"8px 8px",textAlign:"center",color:"#fff",fontWeight:800,fontSize:10,borderBottom:"1px solid #e9eef5",background:fc.c,minWidth:55}}>MES</th>}
                      <th style={{padding:"8px 8px",textAlign:"center",fontWeight:800,fontSize:9,borderBottom:"1px solid #e9eef5",background:"#f8fafc",minWidth:55}}>TIER</th>
                    </tr>
                  </thead>
                  <tbody>
                    {tsFmt.map(tr=>{
                      const pMes=calcMes(tr.id);
                      const tier=getTier(pMes);
                      return(
                        <tr key={tr.id} style={{borderBottom:"1px solid #f5f7fa"}}>
                          <td style={{padding:"8px 12px",fontWeight:700,color:"#1a2f4a",whiteSpace:"nowrap",fontSize:11}}>Vega {tr.n}</td>
                          {(()=>{
                            const allEvs=semsVis.flatMap(s=>s.days.flatMap(d=>{const ds=dStr(vYear,vMonth,d);return(getReg(ds,tr.id,actsActivas[0]?.id||"")?.evidencias||[]);}));
                            const last=allEvs.length>0?allEvs[allEvs.length-1]:null;
                            return <td style={{padding:"8px 8px",textAlign:"center",fontSize:10,color:"#8aaabb",fontFamily:"monospace"}}>{last?.horaRegistro||"—"}</td>;
                          })()}
                          <td style={{padding:"8px 8px",textAlign:"center"}}>
                            {(()=>{
                              const allTs=Object.keys(regs).filter(k=>k.includes("|"+tr.id+"|")).flatMap(k=>regs[k]?.evidencias||[]).map(e=>e.timestamp).filter(Boolean).sort().reverse();
                              if(!allTs.length)return<span style={{color:"#d1d5db",fontSize:9}}>—</span>;
                              const d=new Date(allTs[0]);
                              return<span style={{fontSize:9,color:"#5a7a9a",fontFamily:"monospace",whiteSpace:"nowrap"}}>{d.toLocaleDateString("es-PE",{day:"2-digit",month:"2-digit"})}<br/>{d.toLocaleTimeString("es-PE",{hour:"2-digit",minute:"2-digit"})}</span>;
                            })()}
                          </td>
                          {semsVis.map(sem=>actsActivas.map(a=>{
                            const ds=sem.days.map(d=>dStr(vYear,vMonth,d));
                            const scores=ds.flatMap(d=>{const rv=getReg(d,tr.id,a.id);const p=puntajeReg(rv,a.r||RANGOS_DEFAULT);return p!==null?[p]:[];});
                            const v=scores.length>0?Math.round(scores.reduce((x,y)=>x+y,0)/scores.length):null;
                            const docIds=ds.flatMap(d=>{const k=rKey(d,tr.id,a.id);const docId=k.replace(/\|/g,"--");return(regs[docId]||regs[k])?[{docId,docData:regs[docId]||regs[k],fecha:d,actividadId:a.id}]:[];});
                            const anulado=ds.some(d=>{const k=rKey(d,tr.id,a.id);const docId=k.replace(/\|/g,"--");const rv=regs[docId]||regs[k];return rv?.anulado;});
                            const menuId=`ctx-${tr.id}-${sem.label}-${a.id}`;
                            return(
                              <td key={sem.label+a.id} style={{padding:"6px 8px",textAlign:"center",position:"relative"}}>
                                {anulado?(
                                  <span style={{padding:"2px 6px",borderRadius:20,fontSize:9,fontWeight:700,color:"#854F0B",background:"#FAEEDA",border:"0.5px solid #FAC775"}}>⚠️ Anulado</span>
                                ):v!==null?(
                                  <div style={{display:"flex",flexDirection:"column",alignItems:"center",gap:2}}
                                    onMouseDown={()=>{ clearTimeout(longPressRef.current); longPressRef.current=setTimeout(()=>setCtxMenu({menuId,t:tr,sem,a,docIds}),700); }}
                                    onMouseUp={()=>clearTimeout(longPressRef.current)}
                                    onMouseLeave={()=>clearTimeout(longPressRef.current)}
                                    onTouchStart={()=>{ clearTimeout(longPressRef.current); longPressRef.current=setTimeout(()=>setCtxMenu({menuId,t:tr,sem,a,docIds}),700); }}
                                    onTouchEnd={()=>clearTimeout(longPressRef.current)}
                                    style={{cursor:"pointer"}}>
                                    <span style={{padding:"2px 7px",borderRadius:20,fontSize:10,fontWeight:700,color:sc(v),background:sb(v)}}>{v}%</span>
                                    <div style={{height:2,width:"100%",borderRadius:1,background:"#e2e8f0",overflow:"hidden",marginTop:2}}>
                                      <div style={{height:"100%",width:`${v}%`,background:sc(v),borderRadius:1}}/>
                                    </div>
                                  </div>
                                ):<span style={{color:"#d1d5db",fontSize:9}}>—</span>}
                              </td>
                            );
                          }))}
                          {semsVis.map(sem=>{
                            const ps=calcSemana(tr.id,sem);
                            return <td key={"p"+sem.label} style={{padding:"6px 8px",textAlign:"center",background:"#f8fafc"}}>{ps!==null?<span style={{padding:"2px 8px",borderRadius:20,fontSize:11,fontWeight:800,color:sc(ps),background:sb(ps)}}>{ps}%</span>:<span style={{color:"#d1d5db"}}>—</span>}</td>;
                          })}
                          {selWeek===null&&<td style={{padding:"6px 8px",textAlign:"center",background:sb(pMes)}}>{pMes!==null?<span style={{fontWeight:800,fontSize:12,color:sc(pMes)}}>{pMes}%</span>:<span style={{color:"#b2bec3"}}>—</span>}</td>}
                          <td style={{padding:"6px 8px",textAlign:"center"}}><span style={{fontSize:13}}>{tier.icon}</span><div style={{fontSize:8,fontWeight:700,color:tier.c}}>{tier.label}</div></td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          );
        })}
      </div>
    );
  };

  /* ══ TAB DASHBOARD ══ */
  const renderDashboard = ()=>{
    // filtrar tiendas según dashFmt
    const tsBase = dashFmt==="Todas" ? tiAct : tiAct.filter(t=>t.f===dashFmt);
    // filtrar por actividad
    const actsBase = dashAct==="Todas" ? acts.filter(a=>a.activa) : acts.filter(a=>a.activa&&a.id===dashAct);
    // calcular score con filtros aplicados
    const calcScoreFiltrado = (tId)=>{
      const ws=semanasDelMes.map(s=>{
        const scores=[];
        s.days.forEach(day=>{
          const ds=dStr(vYear,vMonth,day);
          const dw=getDow(ds);
          actsBase.filter(a=>a.dias.includes(dw)&&!isExc(tId,a.id)).forEach(a=>{
            const reg=getReg(ds,tId,a.id);
            const p=puntajeReg(reg,a.r||RANGOS_DEFAULT);
            // filtro horario
            if(p!==null){
              const h=primerEnvio(reg?.evidencias);
              const m=toMin(h);
              if(dashHora==="Todas") scores.push(p);
              else if(dashHora==="oro"&&m<=toMin("08:00")) scores.push(p);
              else if(dashHora==="plata"&&m>toMin("08:00")&&m<=toMin("09:00")) scores.push(p);
              else if(dashHora==="bronce"&&m>toMin("09:00")&&m<=toMin("10:00")) scores.push(p);
              else if(dashHora==="fuera"&&m>toMin("10:00")) scores.push(p);
            }
          });
        });
        return scores.length>0?Math.round(scores.reduce((a,b)=>a+b,0)/scores.length):null;
      }).filter(v=>v!==null);
      return ws.length>0?Math.round(ws.reduce((a,b)=>a+b,0)/ws.length):null;
    };

    const scoresMes=tsBase.map(t=>({t,score:calcScoreFiltrado(t.id)}));
    const validos=scoresMes.filter(s=>s.score!==null);
    const SG=validos.length>0?Math.round(validos.reduce((a,b)=>a+b.score,0)/validos.length):0;
    const IC=tsBase.length>0?Math.round((tsBase.filter(t=>calcScoreFiltrado(t.id)!==null).length/tsBase.length)*100):0;
    const SE=tsBase.length>0?Math.round((scoresMes.filter(s=>s.score!==null&&s.score>=95).length/tsBase.length)*100):0;
    const TR=tsBase.length>0?Math.round((scoresMes.filter(s=>s.score!==null&&s.score<60).length/tsBase.length)*100):0;
    const tendencia=semanasDelMes.map(s=>{const ss=tsBase.map(t=>calcSemana(t.id,s)).filter(v=>v!==null);return ss.length>0?Math.round(ss.reduce((a,b)=>a+b,0)/ss.length):null;});

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

    // efectividad por actividad
    const actEfect=acts.filter(a=>a.activa).map(a=>{
      const ps=tsBase.map(t=>{
        const scores=semanasDelMes.flatMap(s=>s.days.map(d=>{
          const ds=dStr(vYear,vMonth,d);
          if(!a.dias.includes(getDow(ds)))return null;
          return puntajeReg(getReg(ds,t.id,a.id),a.r||RANGOS_DEFAULT);
        })).filter(p=>p!==null);
        return scores.length>0?Math.round(scores.reduce((x,y)=>x+y,0)/scores.length):null;
      }).filter(v=>v!==null);
      return{a,v:ps.length>0?Math.round(ps.reduce((x,y)=>x+y,0)/ps.length):null};
    });

    const exportPDF=()=>{
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
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8}}>
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
            <div style={{display:"flex",alignItems:"flex-end"}}>
              <button onClick={exportPDF} style={{width:"100%",padding:"7px 10px",borderRadius:8,border:"none",background:"#1a2f4a",color:"#fff",fontSize:12,fontWeight:700,cursor:"pointer"}}>⬇️ PDF Comité</button>
            </div>
          </div>
        </div>

        {/* KPIs */}
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10,marginBottom:14}}>
          {[
            {k:"SG",label:"Score Global",v:SG+"%",c:sc(SG),icon:"🎯",tier:getTier(SG)},
            {k:"IC",label:"Cumplimiento",v:IC+"%",c:"#0984e3",icon:"📬"},
            {k:"SE",label:"Excelencia",v:SE+"%",c:"#f6a623",icon:"🏆"},
            {k:"TR",label:"Tasa Riesgo",v:TR+"%",c:TR>20?"#d63031":"#b2bec3",icon:"⚠️"},
          ].map(k=>(
            <div key={k.k} style={{...S.card,padding:"14px"}}>
              <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start"}}>
                <span style={{fontSize:20}}>{k.icon}</span>
                <span style={{fontSize:8,color:"#b2bec3",fontWeight:700}}>{k.k}</span>
              </div>
              <div style={{fontWeight:800,fontSize:26,color:k.c,lineHeight:1,marginTop:6}}>{k.v}</div>
              {k.tier&&<div style={{marginTop:4}}><span style={{...S.pill(k.tier.c,k.tier.bg)}}>{k.tier.icon} {k.tier.label}</span></div>}
              <div style={{fontSize:10,color:"#5a7a9a",fontWeight:700,marginTop:4}}>{k.label}</div>
            </div>
          ))}
        </div>

        {/* tendencia */}
        <div style={{...S.card,padding:"16px",marginBottom:14}}>
          <div style={{fontWeight:800,fontSize:13,color:"#1a2f4a",marginBottom:14}}>📈 TENDENCIA SEMANAL</div>
          <div style={{display:"flex",gap:8,alignItems:"flex-end",height:80}}>
            {semanasDelMes.map((s,i)=>{
              const v=tendencia[i];
              return(
                <div key={i} style={{flex:1,display:"flex",flexDirection:"column",alignItems:"center",gap:4}}>
                  <div style={{fontSize:11,fontWeight:800,color:sc(v)}}>{v!==null?v+"%":"—"}</div>
                  <div style={{width:"100%",height:60,background:"#f0f4f8",borderRadius:6,display:"flex",alignItems:"flex-end",overflow:"hidden"}}>
                    {v!==null&&<div style={{width:"100%",height:v+"%",background:sc(v),borderRadius:"4px 4px 0 0"}}/>}
                  </div>
                  <div style={{fontSize:9,color:"#8aaabb",fontWeight:700}}>{s.label}</div>
                </div>
              );
            })}
          </div>
        </div>

        {/* efectividad por actividad */}
        <div style={{...S.card,padding:"14px",marginBottom:14}}>
          <div style={{fontWeight:800,fontSize:13,color:"#1a2f4a",marginBottom:12}}>📊 EFECTIVIDAD POR ACTIVIDAD</div>
          {actEfect.map(({a,v})=>(
            <div key={a.id} style={{display:"flex",alignItems:"center",gap:8,marginBottom:8}}>
              <span style={{fontSize:16,width:20}}>{a.e}</span>
              <span style={{fontSize:11,color:"#5a7a9a",width:130,flexShrink:0,whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis"}}>{a.n}</span>
              <div style={{flex:1,height:8,background:"#f0f4f8",borderRadius:4,overflow:"hidden"}}>
                {v!==null&&<div style={{width:v+"%",height:"100%",background:a.c,borderRadius:4}}/>}
              </div>
              <span style={{fontSize:11,fontWeight:700,color:v!==null?sc(v):"#b2bec3",width:32,textAlign:"right"}}>{v!==null?v+"%":"—"}</span>
            </div>
          ))}
        </div>

        {/* distribución horaria */}
        <div style={{...S.card,padding:"14px",marginBottom:14}}>
          <div style={{fontWeight:800,fontSize:13,color:"#1a2f4a",marginBottom:12}}>⏱️ DISTRIBUCIÓN HORARIA</div>
          {horasDist.map(h=>(
            <div key={h.l} style={{display:"flex",alignItems:"center",gap:8,marginBottom:8}}>
              <span style={{fontSize:11,color:"#5a7a9a",width:120,flexShrink:0}}>{h.l}</span>
              <div style={{flex:1,height:8,background:"#f0f4f8",borderRadius:4,overflow:"hidden"}}>
                <div style={{width:Math.round(h.n/totalEvs*100)+"%",height:"100%",background:h.c,borderRadius:4}}/>
              </div>
              <span style={{fontSize:11,fontWeight:700,color:h.c,width:32,textAlign:"right"}}>{Math.round(h.n/totalEvs*100)}%</span>
            </div>
          ))}
        </div>

        {/* por formato */}
        <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(200px,1fr))",gap:10,marginBottom:14}}>
          {["Mayorista","Supermayorista","Market"].map(fmt=>{
            const fc=FMT[fmt];
            const fts=tiAct.filter(t=>t.f===fmt);
            const scores=fts.map(t=>calcMes(t.id)).filter(v=>v!==null);
            const prom=scores.length>0?Math.round(scores.reduce((a,b)=>a+b,0)/scores.length):null;
            const tier=getTier(prom);
            return(
              <div key={fmt} style={{...S.card,padding:"14px",borderLeft:`4px solid ${fc.c}`}}>
                <div style={{fontWeight:800,fontSize:12,color:fc.c}}>{fmt.toUpperCase()}</div>
                <div style={{fontSize:9,color:"#8aaabb",marginTop:2}}>{fts.length} tiendas</div>
                <div style={{fontWeight:800,fontSize:24,color:sc(prom),marginTop:8}}>{prom!==null?prom+"%":"—"}</div>
                <div style={{fontSize:10,color:tier.c,fontWeight:700,marginTop:2}}>{tier.icon} {tier.label}</div>
                <div style={{height:4,background:"#f0f4f8",borderRadius:2,marginTop:8}}>
                  <div style={{width:(prom||0)+"%",height:"100%",background:fc.c,borderRadius:2}}/>
                </div>
              </div>
            );
          })}
        </div>

        {/* ranking top/bottom */}
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10,marginBottom:14}}>
          <div style={{...S.card,padding:"14px"}}>
            <div style={{fontWeight:800,fontSize:12,color:"#1a2f4a",marginBottom:10}}>🏅 Top 5</div>
            {top5.map((s,i)=>(
              <div key={s.t.id} style={{display:"flex",alignItems:"center",gap:6,marginBottom:6}}>
                <span style={{fontSize:12,width:16}}>{i===0?"🥇":i===1?"🥈":i===2?"🥉":"·"}</span>
                <span style={{fontSize:11,flex:1,color:"#1a2f4a",overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{s.t.n}</span>
                <span style={{fontSize:11,fontWeight:700,color:sc(s.score)}}>{s.score}%</span>
              </div>
            ))}
          </div>
          <div style={{...S.card,padding:"14px"}}>
            <div style={{fontWeight:800,fontSize:12,color:"#1a2f4a",marginBottom:10}}>⚠️ Bottom 5</div>
            {bot5.map((s,i)=>(
              <div key={s.t.id} style={{display:"flex",alignItems:"center",gap:6,marginBottom:6}}>
                <span style={{fontSize:12,width:16}}>🔴</span>
                <span style={{fontSize:11,flex:1,color:"#1a2f4a",overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{s.t.n}</span>
                <span style={{fontSize:11,fontWeight:700,color:sc(s.score)}}>{s.score}%</span>
              </div>
            ))}
          </div>
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
                {sorted.map(({t,score},i)=>{
                  const fc=FMT[t.f];const tier=getTier(score);
                  return(
                    <tr key={t.id} style={{borderBottom:"1px solid #f5f7fa"}}>
                      <td style={{padding:"8px 10px",fontWeight:800,color:i<3?"#f6a623":"#b2bec3",fontSize:i<3?13:11}}>{i===0?"🥇":i===1?"🥈":i===2?"🥉":i+1}</td>
                      <td style={{padding:"8px 10px",fontWeight:700,color:"#1a2f4a",whiteSpace:"nowrap",fontSize:11}}>Vega {t.n}</td>
                      <td style={{padding:"8px 10px"}}><span style={S.pill(fc.c,fc.bg)}>{t.f.slice(0,3)}</span></td>
                      {semanasDelMes.map(s=>{const v=calcSemana(t.id,s);return<td key={s.label} style={{padding:"8px 10px",textAlign:"center"}}>{v!==null?<span style={{fontSize:11,fontWeight:700,color:sc(v)}}>{v}%</span>:<span style={{color:"#d1d5db"}}>—</span>}</td>;})}
                      <td style={{padding:"8px 10px",textAlign:"center",background:sb(score)}}>{score!==null?<span style={{fontWeight:800,fontSize:12,color:sc(score)}}>{score}%</span>:<span style={{color:"#b2bec3"}}>—</span>}</td>
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
        {["Actividades","Tiendas","Accesos"].map((l,i)=>(
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
                  style={{padding:"5px 10px",borderRadius:8,border:"1px solid #c8d8e8",background:a._er?"#f0f4f8":"#fff",color:"#5a7a9a",cursor:"pointer",fontSize:11,fontWeight:700,marginRight:4}}>⏱️</button>
                <button onClick={()=>setActs(p=>{const np=p.map(x=>x.id===a.id?{...x,activa:!x.activa}:x);saveConfig({actividades:np});return np;})}
                  style={{padding:"5px 12px",borderRadius:8,border:`1px solid ${a.activa?"#fecaca":"#bbf7d0"}`,background:a.activa?"#fff1f2":"#f0fdf4",color:a.activa?"#dc2626":"#16a34a",cursor:"pointer",fontSize:11,fontWeight:700}}>
                  {a.activa?"Pausar":"Activar"}
                </button>
              </div>
              {a._er&&(
                <div style={{marginTop:12,padding:"12px",borderRadius:10,background:a.c+"0a",border:`1px solid ${a.c}33`}}>
                  <div style={{fontSize:10,fontWeight:800,color:a.c,marginBottom:10,letterSpacing:".05em"}}>⏱️ RANGOS HORARIOS · {a.n.toUpperCase()}</div>
                  <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:8,marginBottom:10}}>
                    {[{k:"c100",icon:"🥇",label:"100% hasta"},{k:"c80",icon:"🥈",label:"80% hasta"},{k:"c60",icon:"🥉",label:"60% hasta"}].map(f=>(
                      <div key={f.k}>
                        <div style={{fontSize:9,color:"#8aaabb",fontWeight:700,marginBottom:4}}>{f.icon} {f.label}</div>
                        <input type="time" value={RR[f.k]}
                          onChange={e=>setActs(p=>p.map(x=>x.id===a.id?{...x,r:{...(x.r||RANGOS_DEFAULT),[f.k]:e.target.value}}:x))}
                          style={{width:"100%",padding:"8px",borderRadius:8,border:`1.5px solid ${a.c}55`,background:"#fff",color:"#1a2f4a",fontSize:13,outline:"none",textAlign:"center"}}/>
                      </div>
                    ))}
                  </div>
                  <div style={{display:"flex",gap:5,flexWrap:"wrap",marginBottom:8}}>
                    {[["100%","#f6a623",`≤${RR.c100}`],["80%","#74b9ff",`${RR.c100}–${RR.c80}`],["60%","#a29bfe",`${RR.c80}–${RR.c60}`],["0%","#d63031",`>${RR.c60}`]].map(([p,c,t])=>(
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
              <div style={{fontSize:11,color:"#8aaabb"}}>{tiendas.filter(t=>t.activa).length} activas · {tiendas.filter(t=>!t.activa).length} inactivas</div>
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
            const ts=tiendas.filter(t=>t.f===fmt);
            return(
              <div key={fmt} style={{marginBottom:16}}>
                <div style={{display:"flex",alignItems:"center",gap:6,marginBottom:8}}>
                  <div style={{width:4,height:16,borderRadius:2,background:fc.c}}/>
                  <span style={{fontWeight:800,fontSize:12,color:fc.c}}>{fmt.toUpperCase()}</span>
                  <span style={{fontSize:11,color:"#8aaabb"}}>{ts.filter(t=>t.activa).length} activas</span>
                </div>
                {ts.map(t=>(
                  <div key={t.id} style={{...S.card,padding:"10px 14px",marginBottom:6,display:"flex",alignItems:"center",justifyContent:"space-between",opacity:t.activa?1:.5}}>
                    <span style={{fontWeight:600,fontSize:12,color:t.activa?"#1a2f4a":"#94a3b8"}}>Vega {t.n}</span>
                    <button onClick={()=>setTiendas(p=>{const np=p.map(x=>x.id===t.id?{...x,activa:!x.activa}:x);saveConfig({tiendas:np});return np;})}
                      style={{padding:"4px 12px",borderRadius:8,border:`1px solid ${t.activa?"#fecaca":"#bbf7d0"}`,background:t.activa?"#fff1f2":"#f0fdf4",color:t.activa?"#dc2626":"#16a34a",cursor:"pointer",fontSize:11,fontWeight:700}}>
                      {t.activa?"Cerrar":"Activar"}
                    </button>
                  </div>
                ))}
              </div>
            );
          })}
        </div>
      )}

      {cfgTab===2&&(
        <div style={{...S.card,padding:"20px"}}>
          <div style={{fontWeight:800,fontSize:14,color:"#1a2f4a",marginBottom:16}}>🔑 Códigos de Acceso</div>
          {[{k:"admin",label:"👑 Administrador",c:"#f6a623"},{k:"auditor",label:"📋 Auditor",c:"#00b5b4"},{k:"viewer",label:"👁️ Viewer",c:"#74b9ff"}].map(f=>(
            <div key={f.k} style={{marginBottom:14}}>
              <label style={{...S.lbl,color:f.c}}>{f.label}</label>
              <input type="text" value={pins[f.k]} onChange={e=>setPins(p=>({...p,[f.k]:e.target.value}))} style={{...S.inp,letterSpacing:3,fontFamily:"monospace"}}/>
            </div>
          ))}
          <button onClick={()=>showToast("✅ Códigos guardados")} style={S.btn("#00b5b4")}>Guardar cambios</button>
        </div>
      )}
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
          <button onClick={()=>{setRole(null);setUName("");}} style={{padding:"5px 10px",borderRadius:7,border:"1px solid rgba(255,255,255,.2)",background:"rgba(255,255,255,.08)",color:"rgba(255,255,255,.7)",cursor:"pointer",fontSize:10,fontWeight:700}}>↩</button>
        </div>
        <div style={{display:"flex",gap:0,overflowX:"auto"}}>
          {tabs.map(t=><button key={t.i} onClick={()=>setTab(t.i)} style={S.tabB(tab===t.i)}>{t.label}</button>)}
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
function LoginScreen({pins,onLogin}){
  const[pin,setPin]=useState("");
  const[name,setName]=useState("");
  const[step,setStep]=useState("pin");
  const[err,setErr]=useState(false);
  const tryPin=()=>{
    if(pin===pins.admin){onLogin("admin","Administrador");return;}
    if(pin===pins.auditor){setStep("name");return;}
    if(pin===pins.viewer){onLogin("viewer","Gerencia");return;}
    setErr(true);setTimeout(()=>{setErr(false);setPin("");},1200);
  };
  const inpS={width:"100%",padding:"14px",borderRadius:12,background:"#f8fafc",color:"#1a2f4a",fontSize:20,outline:"none",textAlign:"center",letterSpacing:8,boxSizing:"border-box",marginBottom:12};
  return(
    <div style={{fontFamily:"'DM Sans',system-ui,sans-serif",background:"linear-gradient(135deg,#1a2f4a,#0d1f35)",minHeight:"100vh",display:"flex",alignItems:"center",justifyContent:"center",padding:20}}>
      <link href="https://fonts.googleapis.com/css2?family=DM+Sans:opsz,wght@9..40,400;9..40,600;9..40,700&family=Syne:wght@700;800&display=swap" rel="stylesheet"/>
      <div style={{width:"100%",maxWidth:380,background:"#fff",borderRadius:20,padding:36,boxShadow:"0 24px 60px rgba(0,0,0,.3)",textAlign:"center"}}>
        <div style={{width:64,height:64,borderRadius:18,background:"linear-gradient(135deg,#00b5b4,#1a2f4a)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:30,margin:"0 auto 20px"}}>🏪</div>
        <div style={{fontFamily:"'Syne',sans-serif",fontSize:20,fontWeight:800,color:"#1a2f4a",marginBottom:4}}>VEGA · EVIDENCIAS</div>
        <div style={{fontSize:10,color:"#8aaabb",letterSpacing:".08em",marginBottom:28}}>CONTROL DE IMPLEMENTACIÓN DIARIA</div>
        {step==="pin"?(
          <>
            <p style={{margin:"0 0 16px",fontSize:13,color:"#5a7a9a"}}>Ingresa tu código de acceso</p>
            <input autoFocus type="password" value={pin} onChange={e=>setPin(e.target.value)} onKeyDown={e=>e.key==="Enter"&&tryPin()} placeholder="••••••••"
              style={{...inpS,border:`2px solid ${err?"#ef4444":"#c8d8e8"}`}}/>
            <button onClick={tryPin} style={{width:"100%",padding:"14px",borderRadius:12,border:"none",background:pin?"linear-gradient(135deg,#00b5b4,#1a2f4a)":"#e2e8f0",color:pin?"white":"#94a3b8",cursor:pin?"pointer":"not-allowed",fontSize:14,fontWeight:700,marginBottom:20}}>
              {err?"❌ Código incorrecto":"Ingresar →"}
            </button>
            <div style={{background:"#f8fafc",borderRadius:12,padding:"14px",textAlign:"left",border:"1px solid #e2e8f0"}}>
              <div style={{fontSize:9,color:"#8aaabb",fontWeight:700,letterSpacing:".06em",marginBottom:10}}>DEMO — CREDENCIALES</div>
              {[["👑","Admin","vega2026","#f6a623"],["📋","Auditor","auditor88","#00b5b4"],["👁️","Viewer","gerencia1","#74b9ff"]].map(([ic,r,p,c])=>(
                <div key={r} style={{display:"flex",alignItems:"center",gap:8,marginBottom:5}}>
                  <span style={{fontSize:14}}>{ic}</span>
                  <span style={{fontSize:11,fontWeight:700,color:c,flex:1}}>{r}</span>
                  <code style={{fontSize:11,background:c+"18",color:c,padding:"2px 8px",borderRadius:6}}>{p}</code>
                </div>
              ))}
            </div>
          </>
        ):(
          <>
            <div style={{fontSize:28,marginBottom:12}}>📋</div>
            <p style={{margin:"0 0 6px",fontSize:13,color:"#00b5b4",fontWeight:700}}>✅ Acceso verificado</p>
            <p style={{margin:"0 0 20px",fontSize:12,color:"#5a7a9a"}}>¿Cómo aparecerás como auditor?</p>
            <input autoFocus value={name} onChange={e=>setName(e.target.value)} onKeyDown={e=>e.key==="Enter"&&name.trim()&&onLogin("auditor",name.trim())}
              placeholder="Tu nombre completo"
              style={{...inpS,border:"2px solid #00b5b4",letterSpacing:0,fontSize:14}}/>
            <button onClick={()=>name.trim()&&onLogin("auditor",name.trim())} disabled={!name.trim()}
              style={{width:"100%",padding:"14px",borderRadius:12,border:"none",background:name.trim()?"linear-gradient(135deg,#00b5b4,#1a2f4a)":"#e2e8f0",color:name.trim()?"white":"#94a3b8",cursor:name.trim()?"pointer":"not-allowed",fontSize:14,fontWeight:700}}>
              Entrar como Auditor →
            </button>
          </>
        )}
      </div>
    </div>
  );
}

function PinModal({pins,onSave,onClose}){
  const[p,setP]=useState({...pins});
  return(
    <div style={{position:"fixed",inset:0,background:"rgba(26,47,74,.6)",display:"flex",alignItems:"center",justifyContent:"center",zIndex:50,backdropFilter:"blur(4px)"}}>
      <div style={{background:"#fff",borderRadius:16,padding:26,width:"90%",maxWidth:380,border:"1px solid #e2e8f0"}}>
        <div style={{fontWeight:800,fontSize:15,color:"#1a2f4a",marginBottom:16}}>🔑 Cambiar Códigos</div>
        {[{k:"admin",label:"👑 Admin"},{k:"auditor",label:"📋 Auditor"},{k:"viewer",label:"👁️ Viewer"}].map(f=>(
          <div key={f.k} style={{marginBottom:12}}>
            <label style={{fontSize:11,fontWeight:700,color:"#5a7a9a",display:"block",marginBottom:4}}>{f.label}</label>
            <input type="text" value={p[f.k]} onChange={e=>setP(x=>({...x,[f.k]:e.target.value}))} style={{width:"100%",padding:"10px 12px",borderRadius:8,border:"1px solid #c8d8e8",background:"#f8fafc",color:"#1a2f4a",fontSize:13,outline:"none",letterSpacing:3,fontFamily:"monospace",boxSizing:"border-box"}}/>
          </div>
        ))}
        <div style={{display:"flex",gap:8,marginTop:4}}>
          <button onClick={onClose} style={{flex:1,padding:"10px",borderRadius:9,border:"1px solid #c8d8e8",background:"#fff",color:"#5a7a9a",cursor:"pointer",fontWeight:700,fontSize:12}}>Cancelar</button>
          <button onClick={()=>onSave(p)} style={{flex:1,padding:"10px",borderRadius:9,border:"none",background:"linear-gradient(135deg,#00b5b4,#1a2f4a)",color:"#fff",cursor:"pointer",fontWeight:700,fontSize:12}}>Guardar</button>
        </div>
      </div>
    </div>
  );
}
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

const RANGOS_DEFAULT = { c100:"08:00", c80:"09:00", c60:"10:00" };

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
  {id:"a11",n:"Precios en Anaquel",  dias:[1,2,3,4,5], e:"🏷️",c:"#55efc4",cat:"Ad-hoc",  r:null,activa:true},
];

const MESES = ["Enero","Febrero","Marzo","Abril","Mayo","Junio","Julio","Agosto","Septiembre","Octubre","Noviembre","Diciembre"];
const DIAS_N = ["Domingo","Lunes","Martes","Miércoles","Jueves","Viernes","Sábado"];
const FMT = {
  Mayorista:      {c:"#6c5ce7",bg:"#f0edff"},
  Supermayorista: {c:"#0984e3",bg:"#e8f4fd"},
  Market:         {c:"#00b5b4",bg:"#e0fafa"},
};
const PUNTAJES = [
  {pct:100,icon:"🥇",label:"ORO",    c:"#f6a623",bg:"#fff8ec",key:"c100"},
  {pct:80, icon:"🥈",label:"PLATA",  c:"#74b9ff",bg:"#e8f4fd",key:"c80"},
  {pct:60, icon:"🥉",label:"BRONCE", c:"#a29bfe",bg:"#f0edff",key:"c60"},
  {pct:0,  icon:"🔴",label:"FUERA",  c:"#d63031",bg:"#ffeae6",key:null},
];

/* ══ UTILS ══════════════════════════════════════════════ */
const todayStr = () => new Date().toISOString().slice(0,10);
const getDow   = s  => new Date(s+"T12:00:00").getDay();
const dStr     = (y,m,d) => `${y}-${String(m+1).padStart(2,"0")}-${String(d).padStart(2,"0")}`;
const rKey     = (f,t,a) => `${f}|${t}|${a}`;
const toMin    = h  => { if(!h)return 9999; const[hh,mm]=h.split(":").map(Number); return hh*60+mm; };

function calcP(hora, r) {
  if(!hora) return null;
  const R=r||RANGOS_DEFAULT, m=toMin(hora);
  if(m<=toMin(R.c100)) return 100;
  if(m<=toMin(R.c80))  return 80;
  if(m<=toMin(R.c60))  return 60;
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
  if(s>=100) return {label:"ORO",   icon:"🥇",c:"#f6a623",bg:"#fff8ec"};
  if(s>=80)  return {label:"PLATA", icon:"🥈",c:"#74b9ff",bg:"#e8f4fd"};
  if(s>=60)  return {label:"BRONCE",icon:"🥉",c:"#a29bfe",bg:"#f0edff"};
  if(s>=1)   return {label:"RIESGO",icon:"⚠️",c:"#e17055",bg:"#fff1ee"};
  return            {label:"FUERA", icon:"🔴",c:"#d63031",bg:"#ffeae6"};
}
function sc(v){if(!v&&v!==0)return"#b2bec3";if(v>=95)return"#f6a623";if(v>=85)return"#00b894";if(v>=75)return"#74b9ff";if(v>=60)return"#e17055";return"#d63031";}
function sb(v){if(!v&&v!==0)return"#f4f6f8";if(v>=95)return"#fff8ec";if(v>=85)return"#e8faf5";if(v>=75)return"#e8f4fd";if(v>=60)return"#fff1ee";return"#ffeae6";}

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

/* ══ APP ══════════════════════════════════════════════ */
export default function ChecklistApp() {
  const now = new Date();
  /* ── auth ── */
  const [role,    setRole]    = useState(null);
  const [uName,   setUName]   = useState("");
  const [pins,    setPins]    = useState({admin:"vega2026",auditor:"auditor88",viewer:"gerencia1"});
  const [pinMod,  setPinMod]  = useState(false);
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
  const [horaEx,  setHoraEx]  = useState("");
  const [obsEx,   setObsEx]   = useState("");
  /* ── filtros ── */
  const [fmtFilt,      setFmtFilt]      = useState("Todas");
  const [busq,         setBusq]         = useState("");
  const [verRegistradas, setVerRegistradas] = useState(false);
  const [rangoExt,     setRangoExt]     = useState(null); // rango extendido temporal por actividad
  /* ── config ── */
  const [cfgTab,  setCfgTab]  = useState(0);
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
    const loadCfg = async ()=>{
      const snap = await getDoc(doc(db,"config","app"));
      if(snap.exists()){
        const d=snap.data();
        if(d.actividades) setActs(d.actividades);
        if(d.tiendas)     setTiendas(d.tiendas);
        if(d.pins)        setPins(d.pins);
        if(d.excepciones) setExceps(d.excepciones);
      }
    };
    loadCfg();
  },[]);

  const saveConfig = useCallback(async (overrides={})=>{
    await setDoc(doc(db,"config","app"),{
      actividades: overrides.actividades ?? acts,
      tiendas:     overrides.tiendas     ?? tiendas,
      pins:        overrides.pins        ?? pins,
      excepciones: overrides.excepciones ?? exceps,
      updatedAt:   new Date().toISOString(),
    });
  },[acts,tiendas,pins,exceps]);

  const dow = getDow(fecha);
  const esFS = dow===0||dow===6;
  const tiAct = useMemo(()=>tiendas.filter(t=>t.activa),[tiendas]);
  const actsDia = useMemo(()=>acts.filter(a=>a.activa&&a.dias.includes(dow)),[acts,dow]);
  const actInfo = acts.find(a=>a.id===actSel);
  const semanasDelMes = useMemo(()=>getWeeksOfMonth(vYear,vMonth),[vYear,vMonth]);
  const isAdmin   = role==="admin";
  const isAuditor = role==="admin"||role==="auditor";

  const getReg = useCallback((f,t,a)=>{
    const k=rKey(f,t,a);
    const docId=k.replace(/\|/g,"--");
    return regs[docId]||regs[k]||null;
  },[regs]);
  const isExc  = useCallback((tId,aId)=>exceps[tId+"|"+aId]===true,[exceps]);

  const showToast = msg=>{
    setToast(msg);
    if(toastRef.current)clearTimeout(toastRef.current);
    toastRef.current=setTimeout(()=>setToast(""),2500);
  };

  /* ── cálculos KPI ── */
  const kpisDia = useMemo(()=>{
    if(!actSel)return{total:0,IC:0,IP:0,SE:0,TR:0,SG:0,al100:0,conEnvio:0};
    const AR=actInfo?.r||RANGOS_DEFAULT;
    const ts=tiAct.filter(t=>!isExc(t.id,actSel));
    const total=ts.length;
    const withEnv=ts.filter(t=>puntajeReg(getReg(fecha,t.id,actSel),AR)!==null);
    const pts=ts.map(t=>puntajeReg(getReg(fecha,t.id,actSel),AR));
    const IC=total>0?Math.round((withEnv.length/total)*100):0;
    const valid=pts.filter(p=>p!==null);
    const IP=valid.length>0?Math.round(valid.reduce((a,b)=>a+b,0)/valid.length):0;
    const al100=pts.filter(p=>p===100).length;
    const SE=total>0?Math.round((al100/total)*100):0;
    const TR=total>0?Math.round((ts.filter(t=>puntajeReg(getReg(fecha,t.id,actSel),AR)===null).length/total)*100):0;
    const SG=Math.round((IC*IP)/100);
    const r100=withEnv.filter(t=>puntajeReg(getReg(fecha,t.id,actSel),AR)===100);
    const r80=withEnv.filter(t=>puntajeReg(getReg(fecha,t.id,actSel),AR)===80);
    const r60=withEnv.filter(t=>puntajeReg(getReg(fecha,t.id,actSel),AR)===60);
    const r0=ts.filter(t=>puntajeReg(getReg(fecha,t.id,actSel),AR)===null);
    return{total,IC,IP,SE,TR,SG,al100,conEnvio:withEnv.length,r100,r80,r60,r0};
  },[actSel,actInfo,tiAct,isExc,getReg,fecha]);

  const calcSemana = useCallback((tId,sem)=>{
    const scores=[];
    sem.days.forEach(day=>{
      const ds=dStr(vYear,vMonth,day);
      const dw=getDow(ds);
      acts.filter(a=>a.activa&&a.dias.includes(dw)&&!isExc(tId,a.id)).forEach(a=>{
        const p=puntajeReg(getReg(ds,tId,a.id),a.r||RANGOS_DEFAULT);
        if(p!==null)scores.push(p);
      });
    });
    return scores.length>0?Math.round(scores.reduce((a,b)=>a+b,0)/scores.length):null;
  },[acts,regs,vYear,vMonth,isExc,getReg]);

  const calcMes = useCallback((tId)=>{
    const ws=semanasDelMes.map(s=>calcSemana(tId,s)).filter(v=>v!==null);
    return ws.length>0?Math.round(ws.reduce((a,b)=>a+b,0)/ws.length):null;
  },[semanasDelMes,calcSemana]);

  /* ── tiendas filtradas para lista ── */
  const tFilt = useMemo(()=>tiAct.filter(t=>{
    if(fmtFilt!=="Todas"&&t.f!==fmtFilt)return false;
    if(busq&&!t.n.toLowerCase().includes(busq.toLowerCase()))return false;
    // ocultar ya registradas salvo admin con toggle activo
    if(!verRegistradas && tRegistradas.has(t.id)) return false;
    return true;
  }),[tiAct,fmtFilt,busq,tRegistradas,verRegistradas]);

  const tRegistradas = useMemo(()=>new Set(
    tiAct.filter(t=>regs[rKey(fecha,t.id,actSel||"")]?.evidencias?.length>0).map(t=>t.id)
  ),[tiAct,regs,fecha,actSel]);

  /* ── confirmar registros en bloque ── */
  const confirmarRegistro = async ()=>{
    if(!horaEx||tSel.size===0||!actSel)return;
    const AR = rangoExt || actInfo?.r || RANGOS_DEFAULT;
    const pct=calcP(horaEx,AR);
    const tier=getTier(pct);
    let n=0;
    const promises=[];
    tSel.forEach(tId=>{
      const k=rKey(fecha,tId,actSel);
      const now=new Date();
      const hreg=now.toLocaleTimeString("es-PE",{hour:"2-digit",minute:"2-digit"});
      const ev={id:Date.now()+n,hora:horaEx,puntaje:pct,observacion:obsEx||`Registro en bloque · ${tier.label}`,horaRegistro:hreg,auditor:uName,timestamp:now.toISOString()};
      const prevEvs=(regs[k]?.evidencias)||[];
      const newEvs=[...prevEvs,ev].sort((a,b)=>a.hora.localeCompare(b.hora));
      // Save to Firestore — key as doc id (replace | with -)
      const docId=k.replace(/\|/g,"--");
      promises.push(setDoc(doc(db,"registros",docId),{evidencias:newEvs,fecha,tiendaId:tId,actividadId:actSel,updatedAt:now.toISOString()}));
      n++;
    });
    await Promise.all(promises);
    showToast(`✅ ${n} tienda${n!==1?"s":""} · ${horaEx} · ${pct}% ${tier.icon}`);
    setTSel(new Set());setRango(null);setHoraEx("07:00");setObsEx("");setPaso(1);setActSel(null);
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
    const tier = getTier(pct);
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
    showToast(`✏️ Registro actualizado · ${horaUpd} · ${pct}% ${tier.icon}`);
    setUpdModal(null); setHoraUpd(""); setMotivoUpd("");
  };

  const toggleExcepcion = async (tId, aId) => {
    const key = tId+"|"+aId;
    const newExceps = {...exceps};
    if(newExceps[key]) delete newExceps[key];
    else newExceps[key] = true;
    setExceps(newExceps);
    await saveConfig({excepciones: newExceps});
    showToast(newExceps[key] ? "⚠️ Tienda excluida de esta actividad" : "✅ Excepción removida");
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
  if(!role) return <LoginScreen pins={pins} onLogin={(r,n)=>{setRole(r);setUName(n);setTab(r==="viewer"?1:0);}}/>;

  /* ══ PASO 1 — seleccionar actividad ══ */
  const renderPaso1 = ()=>(
    <div style={{padding:"16px"}}>
      <p style={{margin:"0 0 14px",fontSize:12,color:"#8aaabb",fontWeight:700,letterSpacing:".06em"}}>
        {DIAS_N[dow].toUpperCase()} · {actsDia.length} ACTIVIDAD{actsDia.length!==1?"ES":""} PROGRAMADA{actsDia.length!==1?"S":""}
      </p>
      {actsDia.map(a=>(
        <button key={a.id} onClick={()=>{setActSel(a.id);setPaso(2);setTSel(new Set());setRango(null);setVerRegistradas(false);setRangoExt(null);}}
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
          <span style={{...S.pill("#8aaabb","#f0f4f8"),marginLeft:"auto"}}>{tSel.size} sel.</span>
          <span style={{...S.pill("#00b894","#e8faf5")}}>{tRegistradas.size} reg.</span>
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
      <div style={{padding:"8px 16px",background:"#f8fafc",borderBottom:"1px solid #e2e8f0",display:"flex",alignItems:"center",justifyContent:"space-between",gap:8,flexWrap:"wrap"}}>
        <div style={{display:"flex",gap:8,alignItems:"center"}}>
          <span style={{fontSize:12,color:"#8aaabb"}}>{tFilt.length} pendientes</span>
          {tRegistradas.size>0&&<span style={S.pill("#00b894","#e8faf5")}>✅ {tRegistradas.size} registradas</span>}
        </div>
        <div style={{display:"flex",gap:6,alignItems:"center"}}>
          {isAdmin&&tRegistradas.size>0&&(
            <button onClick={()=>setVerRegistradas(v=>!v)}
              style={{padding:"5px 12px",borderRadius:8,border:`1.5px solid ${verRegistradas?"#0984e3":"#e2e8f0"}`,background:verRegistradas?"#e8f4fd":"#fff",color:verRegistradas?"#0984e3":"#5a7a9a",cursor:"pointer",fontSize:11,fontWeight:700}}>
              {verRegistradas?"Ocultar registradas":"Ver todas"}
            </button>
          )}
          <button onClick={()=>setTSel(tSel.size===tFilt.length?new Set():new Set(tFilt.filter(ti=>!isExc(ti.id,actSel)).map(ti=>ti.id)))}
            style={{padding:"6px 14px",borderRadius:8,border:`1.5px solid ${actInfo?.c}55`,background:actInfo?.c+"15",color:actInfo?.c,cursor:"pointer",fontSize:12,fontWeight:700}}>
            {tSel.size===tFilt.filter(ti=>!isExc(ti.id,actSel)).length&&tFilt.length>0?"✕ Quitar todas":"✓ Seleccionar todas"}
          </button>
        </div>
      </div>
      {/* lista */}
      <div style={{padding:"8px 16px 120px"}}>
        {isAdmin&&<div style={{fontSize:10,color:"#8aaabb",marginBottom:8,padding:"6px 10px",background:"#f8fafc",borderRadius:8}}>💡 Admin: mantén presionado una tienda para marcarla como excepción (N/A)</div>}
        {tFilt.map(tienda=>{
          const sel=tSel.has(tienda.id);
          const reg=tRegistradas.has(tienda.id);
          const exc=isExc(tienda.id,actSel);
          const fc=FMT[tienda.f];
          return(
            <div key={tienda.id}
              onClick={()=>{ if(exc)return; setTSel(p=>{const ns=new Set(p);ns.has(tienda.id)?ns.delete(tienda.id):ns.add(tienda.id);return ns;}); }}
              onMouseDown={()=>{ if(!isAdmin)return; clearTimeout(longExcRef.current); longExcRef.current=setTimeout(()=>{ toggleExcepcion(tienda.id,actSel); },700); }}
              onMouseUp={()=>clearTimeout(longExcRef.current)}
              onMouseLeave={()=>clearTimeout(longExcRef.current)}
              onTouchStart={()=>{ if(!isAdmin)return; clearTimeout(longExcRef.current); longExcRef.current=setTimeout(()=>{ toggleExcepcion(tienda.id,actSel); },700); }}
              onTouchEnd={()=>clearTimeout(longExcRef.current)}
              style={{display:"flex",alignItems:"center",gap:12,padding:"13px 14px",borderRadius:12,border:`1.5px solid ${exc?"#e2e8f0":sel?actInfo?.c:"#e2e8f0"}`,background:exc?"#f8fafc":sel?actInfo?.c+"10":"#fff",cursor:exc?"default":"pointer",marginBottom:7,transition:"all .1s",opacity:exc?0.6:1}}>
              <div style={{width:24,height:24,borderRadius:7,border:`2px solid ${exc?"#c8d8e8":sel?actInfo?.c:"#c8d8e8"}`,background:exc?"#f0f4f8":sel?actInfo?.c:"#fff",display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}>
                {sel&&!exc&&<span style={{fontSize:14,color:"#fff",fontWeight:700}}>✓</span>}
              </div>
              <div style={{flex:1}}>
                <div style={{fontSize:14,fontWeight:700,color:exc?"#94a3b8":sel?actInfo?.c:"#1a2f4a",textDecoration:exc?"line-through":"none"}}>Vega {tienda.n}</div>
                <div style={{display:"flex",gap:5,marginTop:3,flexWrap:"wrap"}}>
                  <span style={S.pill(fc.c,fc.bg)}>{tienda.f}</span>
                  {exc&&<span style={S.pill("#854F0B","#FAEEDA")}>⚠️ N/A · No aplica</span>}
                  {!exc&&reg&&<span style={S.pill("#00b894","#e8faf5")}>✅ Registrada</span>}
                </div>
              </div>
              {sel&&!exc&&<span style={{fontSize:18,color:actInfo?.c,fontWeight:700}}>✓</span>}
              {exc&&isAdmin&&<button onClick={e=>{e.stopPropagation();toggleExcepcion(tienda.id,actSel);}} style={{padding:"3px 9px",borderRadius:20,border:"1px solid #fecaca",background:"#fff1f2",color:"#dc2626",cursor:"pointer",fontSize:10,fontWeight:700}}>✕</button>}
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
    const tier = getTier(pv);
    const esAdHoc = actInfo?.cat==="Ad-hoc"||actInfo?.cat==="Promocional";
    const franjas=[
      {icon:"🥇",label:"ORO — 100%",   desde:"00:00",hasta:AR.c100,c:"#f6a623",bg:"#fff8ec"},
      {icon:"🥈",label:"PLATA — 80%",  desde:AR.c100,hasta:AR.c80, c:"#74b9ff",bg:"#e8f4fd"},
      {icon:"🥉",label:"BRONCE — 60%", desde:AR.c80, hasta:AR.c60, c:"#a29bfe",bg:"#f0edff"},
      {icon:"🔴",label:"FUERA — 0%",   desde:AR.c60, hasta:"23:59",c:"#d63031",bg:"#ffeae6"},
    ];
    const franjaActiva = pv===100?0:pv===80?1:pv===60?2:pv===0?3:-1;

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
            autoFocus
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
            <div style={{marginTop:14,padding:"14px",borderRadius:12,background:tier.bg,border:`1.5px solid ${tier.c}44`}}>
              <div style={{fontSize:36,marginBottom:4}}>{tier.icon}</div>
              <div style={{fontWeight:800,fontSize:32,color:tier.c,lineHeight:1}}>{pv}%</div>
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
        <button
          onClick={confirmarRegistro}
          disabled={pv===null}
          style={{
            ...S.btn(pv!==null?tier.c:"#e2e8f0"),
            opacity:pv!==null?1:.5,
            cursor:pv!==null?"pointer":"not-allowed",
            marginBottom:10,padding:"16px",fontSize:15,
            background:pv!==null?`linear-gradient(135deg,${tier.c},#1a2f4a)`:"#e2e8f0",
            color:pv!==null?"#fff":"#b2bec3"
          }}
        >
          {pv!==null?`✅ Registrar ${tSel.size} tienda${tSel.size!==1?"s":""} · ${pv}%`:`Ingresa la hora para continuar`}
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
    const actsActivas=acts.filter(a=>a.activa);
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
          const tsFmt=tiAct.filter(t=>t.f===fmt);
          if(!tsFmt.length)return null;
          const fc=FMT[fmt];
          return(
            <div key={fmt} style={{...S.card,marginBottom:16,overflow:"hidden"}}>
              <div style={{padding:"10px 14px",borderBottom:"1px solid #f0f4f8",display:"flex",alignItems:"center",gap:8}}>
                <div style={{width:4,height:18,borderRadius:2,background:fc.c}}/>
                <span style={{fontWeight:800,fontSize:13,color:fc.c}}>{fmt.toUpperCase()}</span>
                <span style={{fontSize:11,color:"#8aaabb"}}>{tsFmt.length} tiendas</span>
              </div>
              <div style={{overflowX:"auto"}}>
                <table style={{width:"100%",borderCollapse:"collapse",fontSize:12}}>
                  <thead>
                    <tr style={{background:"#f8fafc"}}>
                      <th style={{padding:"8px 12px",textAlign:"left",color:"#5a7a9a",fontWeight:700,fontSize:10,borderBottom:"1px solid #e9eef5",minWidth:140,whiteSpace:"nowrap"}}>TIENDA</th>
                      <th style={{padding:"8px 8px",textAlign:"center",color:"#5a7a9a",fontWeight:700,fontSize:9,borderBottom:"1px solid #e9eef5",minWidth:70,whiteSpace:"nowrap"}}>H. REG.</th>
                      <th style={{padding:"8px 8px",textAlign:"center",color:"#5a7a9a",fontWeight:700,fontSize:9,borderBottom:"1px solid #e9eef5",minWidth:70,whiteSpace:"nowrap"}}>ÚLT.<br/>REGISTRO</th>
                      {semsVis.map(s=>actsActivas.map(a=>(
                        <th key={s.label+a.id} style={{padding:"8px 8px",textAlign:"center",color:a.c,fontWeight:700,fontSize:9,borderBottom:"1px solid #e9eef5",minWidth:50,whiteSpace:"nowrap"}}>{s.label}<br/>{a.e}</th>
                      )))}
                      {semsVis.map(s=>(
                        <th key={"p"+s.label} style={{padding:"8px 8px",textAlign:"center",color:"#1a2f4a",fontWeight:800,fontSize:9,borderBottom:"1px solid #e9eef5",background:"#f0f4f8",minWidth:55}}>
                          {s.label}<br/>PROM
                        </th>
                      ))}
                      {selWeek===null&&<th style={{padding:"8px 8px",textAlign:"center",color:"#fff",fontWeight:800,fontSize:10,borderBottom:"1px solid #e9eef5",background:fc.c,minWidth:55}}>MES</th>}
                      <th style={{padding:"8px 8px",textAlign:"center",fontWeight:800,fontSize:9,borderBottom:"1px solid #e9eef5",background:"#f8fafc",minWidth:55}}>TIER</th>
                    </tr>
                  </thead>
                  <tbody>
                    {tsFmt.map(tr=>{
                      const pMes=calcMes(tr.id);
                      const tier=getTier(pMes);
                      return(
                        <tr key={tr.id} style={{borderBottom:"1px solid #f5f7fa"}}>
                          <td style={{padding:"8px 12px",fontWeight:700,color:"#1a2f4a",whiteSpace:"nowrap",fontSize:11}}>Vega {tr.n}</td>
                          {(()=>{
                            const allEvs=semsVis.flatMap(s=>s.days.flatMap(d=>{const ds=dStr(vYear,vMonth,d);return(getReg(ds,tr.id,actsActivas[0]?.id||"")?.evidencias||[]);}));
                            const last=allEvs.length>0?allEvs[allEvs.length-1]:null;
                            return <td style={{padding:"8px 8px",textAlign:"center",fontSize:10,color:"#8aaabb",fontFamily:"monospace"}}>{last?.horaRegistro||"—"}</td>;
                          })()}
                          <td style={{padding:"8px 8px",textAlign:"center"}}>
                            {(()=>{
                              const allTs=Object.keys(regs).filter(k=>k.includes("|"+tr.id+"|")).flatMap(k=>regs[k]?.evidencias||[]).map(e=>e.timestamp).filter(Boolean).sort().reverse();
                              if(!allTs.length)return<span style={{color:"#d1d5db",fontSize:9}}>—</span>;
                              const d=new Date(allTs[0]);
                              return<span style={{fontSize:9,color:"#5a7a9a",fontFamily:"monospace",whiteSpace:"nowrap"}}>{d.toLocaleDateString("es-PE",{day:"2-digit",month:"2-digit"})}<br/>{d.toLocaleTimeString("es-PE",{hour:"2-digit",minute:"2-digit"})}</span>;
                            })()}
                          </td>
                          {semsVis.map(sem=>actsActivas.map(a=>{
                            const ds=sem.days.map(d=>dStr(vYear,vMonth,d));
                            const scores=ds.flatMap(d=>{const rv=getReg(d,tr.id,a.id);const p=puntajeReg(rv,a.r||RANGOS_DEFAULT);return p!==null?[p]:[];});
                            const v=scores.length>0?Math.round(scores.reduce((x,y)=>x+y,0)/scores.length):null;
                            const docIds=ds.flatMap(d=>{const k=rKey(d,tr.id,a.id);const docId=k.replace(/\|/g,"--");return(regs[docId]||regs[k])?[{docId,docData:regs[docId]||regs[k],fecha:d,actividadId:a.id}]:[];});
                            const anulado=ds.some(d=>{const k=rKey(d,tr.id,a.id);const docId=k.replace(/\|/g,"--");const rv=regs[docId]||regs[k];return rv?.anulado;});
                            const menuId=`ctx-${tr.id}-${sem.label}-${a.id}`;
                            return(
                              <td key={sem.label+a.id} style={{padding:"6px 8px",textAlign:"center",position:"relative"}}>
                                {anulado?(
                                  <span style={{padding:"2px 6px",borderRadius:20,fontSize:9,fontWeight:700,color:"#854F0B",background:"#FAEEDA",border:"0.5px solid #FAC775"}}>⚠️ Anulado</span>
                                ):v!==null?(
                                  <div style={{display:"flex",flexDirection:"column",alignItems:"center",gap:2}}
                                    onMouseDown={()=>{ clearTimeout(longPressRef.current); longPressRef.current=setTimeout(()=>setCtxMenu({menuId,t:tr,sem,a,docIds}),700); }}
                                    onMouseUp={()=>clearTimeout(longPressRef.current)}
                                    onMouseLeave={()=>clearTimeout(longPressRef.current)}
                                    onTouchStart={()=>{ clearTimeout(longPressRef.current); longPressRef.current=setTimeout(()=>setCtxMenu({menuId,t:tr,sem,a,docIds}),700); }}
                                    onTouchEnd={()=>clearTimeout(longPressRef.current)}
                                    style={{cursor:"pointer"}}>
                                    <span style={{padding:"2px 7px",borderRadius:20,fontSize:10,fontWeight:700,color:sc(v),background:sb(v)}}>{v}%</span>
                                    <div style={{height:2,width:"100%",borderRadius:1,background:"#e2e8f0",overflow:"hidden",marginTop:2}}>
                                      <div style={{height:"100%",width:`${v}%`,background:sc(v),borderRadius:1}}/>
                                    </div>
                                  </div>
                                ):<span style={{color:"#d1d5db",fontSize:9}}>—</span>}
                              </td>
                            );
                          }))}
                          {semsVis.map(sem=>{
                            const ps=calcSemana(tr.id,sem);
                            return <td key={"p"+sem.label} style={{padding:"6px 8px",textAlign:"center",background:"#f8fafc"}}>{ps!==null?<span style={{padding:"2px 8px",borderRadius:20,fontSize:11,fontWeight:800,color:sc(ps),background:sb(ps)}}>{ps}%</span>:<span style={{color:"#d1d5db"}}>—</span>}</td>;
                          })}
                          {selWeek===null&&<td style={{padding:"6px 8px",textAlign:"center",background:sb(pMes)}}>{pMes!==null?<span style={{fontWeight:800,fontSize:12,color:sc(pMes)}}>{pMes}%</span>:<span style={{color:"#b2bec3"}}>—</span>}</td>}
                          <td style={{padding:"6px 8px",textAlign:"center"}}><span style={{fontSize:13}}>{tier.icon}</span><div style={{fontSize:8,fontWeight:700,color:tier.c}}>{tier.label}</div></td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          );
        })}
      </div>
    );
  };

  /* ══ TAB DASHBOARD ══ */
  const renderDashboard = ()=>{
    // filtrar tiendas según dashFmt
    const tsBase = dashFmt==="Todas" ? tiAct : tiAct.filter(t=>t.f===dashFmt);
    // filtrar por actividad
    const actsBase = dashAct==="Todas" ? acts.filter(a=>a.activa) : acts.filter(a=>a.activa&&a.id===dashAct);
    // calcular score con filtros aplicados
    const calcScoreFiltrado = (tId)=>{
      const ws=semanasDelMes.map(s=>{
        const scores=[];
        s.days.forEach(day=>{
          const ds=dStr(vYear,vMonth,day);
          const dw=getDow(ds);
          actsBase.filter(a=>a.dias.includes(dw)&&!isExc(tId,a.id)).forEach(a=>{
            const reg=getReg(ds,tId,a.id);
            const p=puntajeReg(reg,a.r||RANGOS_DEFAULT);
            // filtro horario
            if(p!==null){
              const h=primerEnvio(reg?.evidencias);
              const m=toMin(h);
              if(dashHora==="Todas") scores.push(p);
              else if(dashHora==="oro"&&m<=toMin("08:00")) scores.push(p);
              else if(dashHora==="plata"&&m>toMin("08:00")&&m<=toMin("09:00")) scores.push(p);
              else if(dashHora==="bronce"&&m>toMin("09:00")&&m<=toMin("10:00")) scores.push(p);
              else if(dashHora==="fuera"&&m>toMin("10:00")) scores.push(p);
            }
          });
        });
        return scores.length>0?Math.round(scores.reduce((a,b)=>a+b,0)/scores.length):null;
      }).filter(v=>v!==null);
      return ws.length>0?Math.round(ws.reduce((a,b)=>a+b,0)/ws.length):null;
    };

    const scoresMes=tsBase.map(t=>({t,score:calcScoreFiltrado(t.id)}));
    const validos=scoresMes.filter(s=>s.score!==null);
    const SG=validos.length>0?Math.round(validos.reduce((a,b)=>a+b.score,0)/validos.length):0;
    const IC=tsBase.length>0?Math.round((tsBase.filter(t=>calcScoreFiltrado(t.id)!==null).length/tsBase.length)*100):0;
    const SE=tsBase.length>0?Math.round((scoresMes.filter(s=>s.score!==null&&s.score>=95).length/tsBase.length)*100):0;
    const TR=tsBase.length>0?Math.round((scoresMes.filter(s=>s.score!==null&&s.score<60).length/tsBase.length)*100):0;
    const tendencia=semanasDelMes.map(s=>{const ss=tsBase.map(t=>calcSemana(t.id,s)).filter(v=>v!==null);return ss.length>0?Math.round(ss.reduce((a,b)=>a+b,0)/ss.length):null;});

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

    // efectividad por actividad
    const actEfect=acts.filter(a=>a.activa).map(a=>{
      const ps=tsBase.map(t=>{
        const scores=semanasDelMes.flatMap(s=>s.days.map(d=>{
          const ds=dStr(vYear,vMonth,d);
          if(!a.dias.includes(getDow(ds)))return null;
          return puntajeReg(getReg(ds,t.id,a.id),a.r||RANGOS_DEFAULT);
        })).filter(p=>p!==null);
        return scores.length>0?Math.round(scores.reduce((x,y)=>x+y,0)/scores.length):null;
      }).filter(v=>v!==null);
      return{a,v:ps.length>0?Math.round(ps.reduce((x,y)=>x+y,0)/ps.length):null};
    });

    const exportPDF=()=>{
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
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8}}>
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
            <div style={{display:"flex",alignItems:"flex-end"}}>
              <button onClick={exportPDF} style={{width:"100%",padding:"7px 10px",borderRadius:8,border:"none",background:"#1a2f4a",color:"#fff",fontSize:12,fontWeight:700,cursor:"pointer"}}>⬇️ PDF Comité</button>
            </div>
          </div>
        </div>

        {/* KPIs */}
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10,marginBottom:14}}>
          {[
            {k:"SG",label:"Score Global",v:SG+"%",c:sc(SG),icon:"🎯",tier:getTier(SG)},
            {k:"IC",label:"Cumplimiento",v:IC+"%",c:"#0984e3",icon:"📬"},
            {k:"SE",label:"Excelencia",v:SE+"%",c:"#f6a623",icon:"🏆"},
            {k:"TR",label:"Tasa Riesgo",v:TR+"%",c:TR>20?"#d63031":"#b2bec3",icon:"⚠️"},
          ].map(k=>(
            <div key={k.k} style={{...S.card,padding:"14px"}}>
              <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start"}}>
                <span style={{fontSize:20}}>{k.icon}</span>
                <span style={{fontSize:8,color:"#b2bec3",fontWeight:700}}>{k.k}</span>
              </div>
              <div style={{fontWeight:800,fontSize:26,color:k.c,lineHeight:1,marginTop:6}}>{k.v}</div>
              {k.tier&&<div style={{marginTop:4}}><span style={{...S.pill(k.tier.c,k.tier.bg)}}>{k.tier.icon} {k.tier.label}</span></div>}
              <div style={{fontSize:10,color:"#5a7a9a",fontWeight:700,marginTop:4}}>{k.label}</div>
            </div>
          ))}
        </div>

        {/* tendencia */}
        <div style={{...S.card,padding:"16px",marginBottom:14}}>
          <div style={{fontWeight:800,fontSize:13,color:"#1a2f4a",marginBottom:14}}>📈 TENDENCIA SEMANAL</div>
          <div style={{display:"flex",gap:8,alignItems:"flex-end",height:80}}>
            {semanasDelMes.map((s,i)=>{
              const v=tendencia[i];
              return(
                <div key={i} style={{flex:1,display:"flex",flexDirection:"column",alignItems:"center",gap:4}}>
                  <div style={{fontSize:11,fontWeight:800,color:sc(v)}}>{v!==null?v+"%":"—"}</div>
                  <div style={{width:"100%",height:60,background:"#f0f4f8",borderRadius:6,display:"flex",alignItems:"flex-end",overflow:"hidden"}}>
                    {v!==null&&<div style={{width:"100%",height:v+"%",background:sc(v),borderRadius:"4px 4px 0 0"}}/>}
                  </div>
                  <div style={{fontSize:9,color:"#8aaabb",fontWeight:700}}>{s.label}</div>
                </div>
              );
            })}
          </div>
        </div>

        {/* efectividad por actividad */}
        <div style={{...S.card,padding:"14px",marginBottom:14}}>
          <div style={{fontWeight:800,fontSize:13,color:"#1a2f4a",marginBottom:12}}>📊 EFECTIVIDAD POR ACTIVIDAD</div>
          {actEfect.map(({a,v})=>(
            <div key={a.id} style={{display:"flex",alignItems:"center",gap:8,marginBottom:8}}>
              <span style={{fontSize:16,width:20}}>{a.e}</span>
              <span style={{fontSize:11,color:"#5a7a9a",width:130,flexShrink:0,whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis"}}>{a.n}</span>
              <div style={{flex:1,height:8,background:"#f0f4f8",borderRadius:4,overflow:"hidden"}}>
                {v!==null&&<div style={{width:v+"%",height:"100%",background:a.c,borderRadius:4}}/>}
              </div>
              <span style={{fontSize:11,fontWeight:700,color:v!==null?sc(v):"#b2bec3",width:32,textAlign:"right"}}>{v!==null?v+"%":"—"}</span>
            </div>
          ))}
        </div>

        {/* distribución horaria */}
        <div style={{...S.card,padding:"14px",marginBottom:14}}>
          <div style={{fontWeight:800,fontSize:13,color:"#1a2f4a",marginBottom:12}}>⏱️ DISTRIBUCIÓN HORARIA</div>
          {horasDist.map(h=>(
            <div key={h.l} style={{display:"flex",alignItems:"center",gap:8,marginBottom:8}}>
              <span style={{fontSize:11,color:"#5a7a9a",width:120,flexShrink:0}}>{h.l}</span>
              <div style={{flex:1,height:8,background:"#f0f4f8",borderRadius:4,overflow:"hidden"}}>
                <div style={{width:Math.round(h.n/totalEvs*100)+"%",height:"100%",background:h.c,borderRadius:4}}/>
              </div>
              <span style={{fontSize:11,fontWeight:700,color:h.c,width:32,textAlign:"right"}}>{Math.round(h.n/totalEvs*100)}%</span>
            </div>
          ))}
        </div>

        {/* por formato */}
        <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(200px,1fr))",gap:10,marginBottom:14}}>
          {["Mayorista","Supermayorista","Market"].map(fmt=>{
            const fc=FMT[fmt];
            const fts=tiAct.filter(t=>t.f===fmt);
            const scores=fts.map(t=>calcMes(t.id)).filter(v=>v!==null);
            const prom=scores.length>0?Math.round(scores.reduce((a,b)=>a+b,0)/scores.length):null;
            const tier=getTier(prom);
            return(
              <div key={fmt} style={{...S.card,padding:"14px",borderLeft:`4px solid ${fc.c}`}}>
                <div style={{fontWeight:800,fontSize:12,color:fc.c}}>{fmt.toUpperCase()}</div>
                <div style={{fontSize:9,color:"#8aaabb",marginTop:2}}>{fts.length} tiendas</div>
                <div style={{fontWeight:800,fontSize:24,color:sc(prom),marginTop:8}}>{prom!==null?prom+"%":"—"}</div>
                <div style={{fontSize:10,color:tier.c,fontWeight:700,marginTop:2}}>{tier.icon} {tier.label}</div>
                <div style={{height:4,background:"#f0f4f8",borderRadius:2,marginTop:8}}>
                  <div style={{width:(prom||0)+"%",height:"100%",background:fc.c,borderRadius:2}}/>
                </div>
              </div>
            );
          })}
        </div>

        {/* ranking top/bottom */}
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10,marginBottom:14}}>
          <div style={{...S.card,padding:"14px"}}>
            <div style={{fontWeight:800,fontSize:12,color:"#1a2f4a",marginBottom:10}}>🏅 Top 5</div>
            {top5.map((s,i)=>(
              <div key={s.t.id} style={{display:"flex",alignItems:"center",gap:6,marginBottom:6}}>
                <span style={{fontSize:12,width:16}}>{i===0?"🥇":i===1?"🥈":i===2?"🥉":"·"}</span>
                <span style={{fontSize:11,flex:1,color:"#1a2f4a",overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{s.t.n}</span>
                <span style={{fontSize:11,fontWeight:700,color:sc(s.score)}}>{s.score}%</span>
              </div>
            ))}
          </div>
          <div style={{...S.card,padding:"14px"}}>
            <div style={{fontWeight:800,fontSize:12,color:"#1a2f4a",marginBottom:10}}>⚠️ Bottom 5</div>
            {bot5.map((s,i)=>(
              <div key={s.t.id} style={{display:"flex",alignItems:"center",gap:6,marginBottom:6}}>
                <span style={{fontSize:12,width:16}}>🔴</span>
                <span style={{fontSize:11,flex:1,color:"#1a2f4a",overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{s.t.n}</span>
                <span style={{fontSize:11,fontWeight:700,color:sc(s.score)}}>{s.score}%</span>
              </div>
            ))}
          </div>
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
                {sorted.map(({t,score},i)=>{
                  const fc=FMT[t.f];const tier=getTier(score);
                  return(
                    <tr key={t.id} style={{borderBottom:"1px solid #f5f7fa"}}>
                      <td style={{padding:"8px 10px",fontWeight:800,color:i<3?"#f6a623":"#b2bec3",fontSize:i<3?13:11}}>{i===0?"🥇":i===1?"🥈":i===2?"🥉":i+1}</td>
                      <td style={{padding:"8px 10px",fontWeight:700,color:"#1a2f4a",whiteSpace:"nowrap",fontSize:11}}>Vega {t.n}</td>
                      <td style={{padding:"8px 10px"}}><span style={S.pill(fc.c,fc.bg)}>{t.f.slice(0,3)}</span></td>
                      {semanasDelMes.map(s=>{const v=calcSemana(t.id,s);return<td key={s.label} style={{padding:"8px 10px",textAlign:"center"}}>{v!==null?<span style={{fontSize:11,fontWeight:700,color:sc(v)}}>{v}%</span>:<span style={{color:"#d1d5db"}}>—</span>}</td>;})}
                      <td style={{padding:"8px 10px",textAlign:"center",background:sb(score)}}>{score!==null?<span style={{fontWeight:800,fontSize:12,color:sc(score)}}>{score}%</span>:<span style={{color:"#b2bec3"}}>—</span>}</td>
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
        {["Actividades","Tiendas","Accesos"].map((l,i)=>(
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
                  style={{padding:"5px 10px",borderRadius:8,border:"1px solid #c8d8e8",background:a._er?"#f0f4f8":"#fff",color:"#5a7a9a",cursor:"pointer",fontSize:11,fontWeight:700,marginRight:4}}>⏱️</button>
                <button onClick={()=>setActs(p=>{const np=p.map(x=>x.id===a.id?{...x,activa:!x.activa}:x);saveConfig({actividades:np});return np;})}
                  style={{padding:"5px 12px",borderRadius:8,border:`1px solid ${a.activa?"#fecaca":"#bbf7d0"}`,background:a.activa?"#fff1f2":"#f0fdf4",color:a.activa?"#dc2626":"#16a34a",cursor:"pointer",fontSize:11,fontWeight:700}}>
                  {a.activa?"Pausar":"Activar"}
                </button>
              </div>
              {a._er&&(
                <div style={{marginTop:12,padding:"12px",borderRadius:10,background:a.c+"0a",border:`1px solid ${a.c}33`}}>
                  <div style={{fontSize:10,fontWeight:800,color:a.c,marginBottom:10,letterSpacing:".05em"}}>⏱️ RANGOS HORARIOS · {a.n.toUpperCase()}</div>
                  <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:8,marginBottom:10}}>
                    {[{k:"c100",icon:"🥇",label:"100% hasta"},{k:"c80",icon:"🥈",label:"80% hasta"},{k:"c60",icon:"🥉",label:"60% hasta"}].map(f=>(
                      <div key={f.k}>
                        <div style={{fontSize:9,color:"#8aaabb",fontWeight:700,marginBottom:4}}>{f.icon} {f.label}</div>
                        <input type="time" value={RR[f.k]}
                          onChange={e=>setActs(p=>p.map(x=>x.id===a.id?{...x,r:{...(x.r||RANGOS_DEFAULT),[f.k]:e.target.value}}:x))}
                          style={{width:"100%",padding:"8px",borderRadius:8,border:`1.5px solid ${a.c}55`,background:"#fff",color:"#1a2f4a",fontSize:13,outline:"none",textAlign:"center"}}/>
                      </div>
                    ))}
                  </div>
                  <div style={{display:"flex",gap:5,flexWrap:"wrap",marginBottom:8}}>
                    {[["100%","#f6a623",`≤${RR.c100}`],["80%","#74b9ff",`${RR.c100}–${RR.c80}`],["60%","#a29bfe",`${RR.c80}–${RR.c60}`],["0%","#d63031",`>${RR.c60}`]].map(([p,c,t])=>(
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
              <div style={{fontSize:11,color:"#8aaabb"}}>{tiendas.filter(t=>t.activa).length} activas · {tiendas.filter(t=>!t.activa).length} inactivas</div>
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
            const ts=tiendas.filter(t=>t.f===fmt);
            return(
              <div key={fmt} style={{marginBottom:16}}>
                <div style={{display:"flex",alignItems:"center",gap:6,marginBottom:8}}>
                  <div style={{width:4,height:16,borderRadius:2,background:fc.c}}/>
                  <span style={{fontWeight:800,fontSize:12,color:fc.c}}>{fmt.toUpperCase()}</span>
                  <span style={{fontSize:11,color:"#8aaabb"}}>{ts.filter(t=>t.activa).length} activas</span>
                </div>
                {ts.map(t=>(
                  <div key={t.id} style={{...S.card,padding:"10px 14px",marginBottom:6,display:"flex",alignItems:"center",justifyContent:"space-between",opacity:t.activa?1:.5}}>
                    <span style={{fontWeight:600,fontSize:12,color:t.activa?"#1a2f4a":"#94a3b8"}}>Vega {t.n}</span>
                    <button onClick={()=>setTiendas(p=>{const np=p.map(x=>x.id===t.id?{...x,activa:!x.activa}:x);saveConfig({tiendas:np});return np;})}
                      style={{padding:"4px 12px",borderRadius:8,border:`1px solid ${t.activa?"#fecaca":"#bbf7d0"}`,background:t.activa?"#fff1f2":"#f0fdf4",color:t.activa?"#dc2626":"#16a34a",cursor:"pointer",fontSize:11,fontWeight:700}}>
                      {t.activa?"Cerrar":"Activar"}
                    </button>
                  </div>
                ))}
              </div>
            );
          })}
        </div>
      )}

      {cfgTab===2&&(
        <div style={{...S.card,padding:"20px"}}>
          <div style={{fontWeight:800,fontSize:14,color:"#1a2f4a",marginBottom:16}}>🔑 Códigos de Acceso</div>
          {[{k:"admin",label:"👑 Administrador",c:"#f6a623"},{k:"auditor",label:"📋 Auditor",c:"#00b5b4"},{k:"viewer",label:"👁️ Viewer",c:"#74b9ff"}].map(f=>(
            <div key={f.k} style={{marginBottom:14}}>
              <label style={{...S.lbl,color:f.c}}>{f.label}</label>
              <input type="text" value={pins[f.k]} onChange={e=>setPins(p=>({...p,[f.k]:e.target.value}))} style={{...S.inp,letterSpacing:3,fontFamily:"monospace"}}/>
            </div>
          ))}
          <button onClick={()=>showToast("✅ Códigos guardados")} style={S.btn("#00b5b4")}>Guardar cambios</button>
        </div>
      )}
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
          <button onClick={()=>{setRole(null);setUName("");}} style={{padding:"5px 10px",borderRadius:7,border:"1px solid rgba(255,255,255,.2)",background:"rgba(255,255,255,.08)",color:"rgba(255,255,255,.7)",cursor:"pointer",fontSize:10,fontWeight:700}}>↩</button>
        </div>
        <div style={{display:"flex",gap:0,overflowX:"auto"}}>
          {tabs.map(t=><button key={t.i} onClick={()=>setTab(t.i)} style={S.tabB(tab===t.i)}>{t.label}</button>)}
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
function LoginScreen({pins,onLogin}){
  const[pin,setPin]=useState("");
  const[name,setName]=useState("");
  const[step,setStep]=useState("pin");
  const[err,setErr]=useState(false);
  const tryPin=()=>{
    if(pin===pins.admin){onLogin("admin","Administrador");return;}
    if(pin===pins.auditor){setStep("name");return;}
    if(pin===pins.viewer){onLogin("viewer","Gerencia");return;}
    setErr(true);setTimeout(()=>{setErr(false);setPin("");},1200);
  };
  const inpS={width:"100%",padding:"14px",borderRadius:12,background:"#f8fafc",color:"#1a2f4a",fontSize:20,outline:"none",textAlign:"center",letterSpacing:8,boxSizing:"border-box",marginBottom:12};
  return(
    <div style={{fontFamily:"'DM Sans',system-ui,sans-serif",background:"linear-gradient(135deg,#1a2f4a,#0d1f35)",minHeight:"100vh",display:"flex",alignItems:"center",justifyContent:"center",padding:20}}>
      <link href="https://fonts.googleapis.com/css2?family=DM+Sans:opsz,wght@9..40,400;9..40,600;9..40,700&family=Syne:wght@700;800&display=swap" rel="stylesheet"/>
      <div style={{width:"100%",maxWidth:380,background:"#fff",borderRadius:20,padding:36,boxShadow:"0 24px 60px rgba(0,0,0,.3)",textAlign:"center"}}>
        <div style={{width:64,height:64,borderRadius:18,background:"linear-gradient(135deg,#00b5b4,#1a2f4a)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:30,margin:"0 auto 20px"}}>🏪</div>
        <div style={{fontFamily:"'Syne',sans-serif",fontSize:20,fontWeight:800,color:"#1a2f4a",marginBottom:4}}>VEGA · EVIDENCIAS</div>
        <div style={{fontSize:10,color:"#8aaabb",letterSpacing:".08em",marginBottom:28}}>CONTROL DE IMPLEMENTACIÓN DIARIA</div>
        {step==="pin"?(
          <>
            <p style={{margin:"0 0 16px",fontSize:13,color:"#5a7a9a"}}>Ingresa tu código de acceso</p>
            <input autoFocus type="password" value={pin} onChange={e=>setPin(e.target.value)} onKeyDown={e=>e.key==="Enter"&&tryPin()} placeholder="••••••••"
              style={{...inpS,border:`2px solid ${err?"#ef4444":"#c8d8e8"}`}}/>
            <button onClick={tryPin} style={{width:"100%",padding:"14px",borderRadius:12,border:"none",background:pin?"linear-gradient(135deg,#00b5b4,#1a2f4a)":"#e2e8f0",color:pin?"white":"#94a3b8",cursor:pin?"pointer":"not-allowed",fontSize:14,fontWeight:700,marginBottom:20}}>
              {err?"❌ Código incorrecto":"Ingresar →"}
            </button>
            <div style={{background:"#f8fafc",borderRadius:12,padding:"14px",textAlign:"left",border:"1px solid #e2e8f0"}}>
              <div style={{fontSize:9,color:"#8aaabb",fontWeight:700,letterSpacing:".06em",marginBottom:10}}>DEMO — CREDENCIALES</div>
              {[["👑","Admin","vega2026","#f6a623"],["📋","Auditor","auditor88","#00b5b4"],["👁️","Viewer","gerencia1","#74b9ff"]].map(([ic,r,p,c])=>(
                <div key={r} style={{display:"flex",alignItems:"center",gap:8,marginBottom:5}}>
                  <span style={{fontSize:14}}>{ic}</span>
                  <span style={{fontSize:11,fontWeight:700,color:c,flex:1}}>{r}</span>
                  <code style={{fontSize:11,background:c+"18",color:c,padding:"2px 8px",borderRadius:6}}>{p}</code>
                </div>
              ))}
            </div>
          </>
        ):(
          <>
            <div style={{fontSize:28,marginBottom:12}}>📋</div>
            <p style={{margin:"0 0 6px",fontSize:13,color:"#00b5b4",fontWeight:700}}>✅ Acceso verificado</p>
            <p style={{margin:"0 0 20px",fontSize:12,color:"#5a7a9a"}}>¿Cómo aparecerás como auditor?</p>
            <input autoFocus value={name} onChange={e=>setName(e.target.value)} onKeyDown={e=>e.key==="Enter"&&name.trim()&&onLogin("auditor",name.trim())}
              placeholder="Tu nombre completo"
              style={{...inpS,border:"2px solid #00b5b4",letterSpacing:0,fontSize:14}}/>
            <button onClick={()=>name.trim()&&onLogin("auditor",name.trim())} disabled={!name.trim()}
              style={{width:"100%",padding:"14px",borderRadius:12,border:"none",background:name.trim()?"linear-gradient(135deg,#00b5b4,#1a2f4a)":"#e2e8f0",color:name.trim()?"white":"#94a3b8",cursor:name.trim()?"pointer":"not-allowed",fontSize:14,fontWeight:700}}>
              Entrar como Auditor →
            </button>
          </>
        )}
      </div>
    </div>
  );
}

function PinModal({pins,onSave,onClose}){
  const[p,setP]=useState({...pins});
  return(
    <div style={{position:"fixed",inset:0,background:"rgba(26,47,74,.6)",display:"flex",alignItems:"center",justifyContent:"center",zIndex:50,backdropFilter:"blur(4px)"}}>
      <div style={{background:"#fff",borderRadius:16,padding:26,width:"90%",maxWidth:380,border:"1px solid #e2e8f0"}}>
        <div style={{fontWeight:800,fontSize:15,color:"#1a2f4a",marginBottom:16}}>🔑 Cambiar Códigos</div>
        {[{k:"admin",label:"👑 Admin"},{k:"auditor",label:"📋 Auditor"},{k:"viewer",label:"👁️ Viewer"}].map(f=>(
          <div key={f.k} style={{marginBottom:12}}>
            <label style={{fontSize:11,fontWeight:700,color:"#5a7a9a",display:"block",marginBottom:4}}>{f.label}</label>
            <input type="text" value={p[f.k]} onChange={e=>setP(x=>({...x,[f.k]:e.target.value}))} style={{width:"100%",padding:"10px 12px",borderRadius:8,border:"1px solid #c8d8e8",background:"#f8fafc",color:"#1a2f4a",fontSize:13,outline:"none",letterSpacing:3,fontFamily:"monospace",boxSizing:"border-box"}}/>
          </div>
        ))}
        <div style={{display:"flex",gap:8,marginTop:4}}>
          <button onClick={onClose} style={{flex:1,padding:"10px",borderRadius:9,border:"1px solid #c8d8e8",background:"#fff",color:"#5a7a9a",cursor:"pointer",fontWeight:700,fontSize:12}}>Cancelar</button>
          <button onClick={()=>onSave(p)} style={{flex:1,padding:"10px",borderRadius:9,border:"none",background:"linear-gradient(135deg,#00b5b4,#1a2f4a)",color:"#fff",cursor:"pointer",fontWeight:700,fontSize:12}}>Guardar</button>
        </div>
      </div>
    </div>
  );
}
