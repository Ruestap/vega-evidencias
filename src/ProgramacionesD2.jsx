import React, {useMemo,useState} from 'react';
import {collection,doc,setDoc} from 'firebase/firestore';
import { db } from './firebase';
import {armarBorradorD2,escuelas,NOMBRES_DIAS,proyectarBorradorD2} from './modeloProgramacionesD2.mjs';

const hoy=()=>{const d=new Date();return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;};
const ST={campo:{width:'100%',boxSizing:'border-box',padding:'9px 10px',borderRadius:8,border:'1px solid #cbd5e1',fontSize:12,background:'#fff',color:'#1a2f4a'},tarjeta:{padding:16,background:'#fff',borderRadius:12,border:'1px solid #e2e8f0',marginBottom:12},rotulo:{display:'block',fontSize:11,fontWeight:700,color:'#5a7a9a',marginBottom:5}};
export default function ProgramacionesD2({actividades=[],tiendas=[],programaciones=[],usuarioId='',habilitado=false}){
 const [actividadId,setActividadId]=useState('');
 const [descripcion,setDescripcion]=useState('');
 const [inicio,setInicio]=useState(hoy());
 const [fin,setFin]=useState(hoy());
 const [frecuencia,setFrecuencia]=useState('semanal');
 const [dias,setDias]=useState([1,2,3,4,5]);
 const [fechas,setFechas]=useState('');
 const [hora,setHora]=useState('10:30');
 const [puntos,setPuntos]=useState('10');
 const [seleccion,setSeleccion]=useState([]);
 const [horas,setHoras]=useState({});
 const [formato,setFormato]=useState('Todas');
 const [zona,setZona]=useState('Todas');
 const [buscar,setBuscar]=useState('');
 const [guardando,setGuardando]=useState(false);
 const [mensaje,setMensaje]=useState('');
 const maestras=useMemo(()=>escuelas(tiendas),[tiendas]);
 const filtradas=useMemo(()=>maestras.filter(t=>(formato==='Todas'||t.formatoId===formato)&&(zona==='Todas'||String(t.zonaId)===zona)&&(`${t.nombre} ${t.codigoTienda||''}`).toUpperCase().includes(buscar.toUpperCase())),[maestras,formato,zona,buscar]);
 const act=actividades.find(a=>String(a.id)===actividadId);
 const borrador=useMemo(()=>armarBorradorD2({actividad:act,descripcion,inicio,fin,frecuencia,diasSemana:dias,fechas,horaCorte:hora,tiendasElegidas:seleccion,horasPorTienda:horas,puntos:Number(puntos)}),[act,descripcion,inicio,fin,frecuencia,dias,fechas,hora,seleccion,horas,puntos]);
 const previa=useMemo(()=>proyectarBorradorD2(borrador,tiendas),[borrador,tiendas]);
 const cambios=filtradas.map(t=>t.id);
 const todosVisibles=cambios.length>0&&cambios.every(id=>seleccion.includes(id));
 const toggle=id=>setSeleccion(prev=>prev.includes(id)?prev.filter(v=>v!==id):[...prev,id]);
 const guardar=async()=>{
   setMensaje('');
   if(!habilitado||previa.errores.length||guardando)return;
   if(!window.confirm('Se guardara un BORRADOR D2 en Firebase. No se activara ni cambiara ningun puntaje oficial. ¿Continuar?'))return;
   setGuardando(true);
   try{
     const ref=doc(collection(db,'programaciones_evidencias_d2'));
     await setDoc(ref,{...borrador,id:ref.id,estado:'borrador',activo:false,creadoPor:String(usuarioId||'admin'),creadoEn:new Date().toISOString()});
     setMensaje('Borrador guardado. Se visualizara en el listado; NO esta activo ni modifica los reportes.');
   }catch(e){console.error('[D2 Programaciones] Fallo guardado:',e?.code||'error');setMensaje('No se pudo guardar el borrador. Verifica los permisos de Firestore; no se cambio el calculo oficial.');}
   finally{setGuardando(false);}
 };
 return <div style={{padding:'14px 0',color:'#1a2f4a'}}>
  <div style={{...ST.tarjeta,borderLeft:'4px solid #6c5ce7'}}>
    <div style={{fontWeight:800,fontSize:16}}>Programaciones D2 · Definir obligaciones</div>
    <p style={{fontSize:12,lineHeight:1.6,color:'#5a7a9a',marginBottom:0}}>Seleccione una actividad, defina qué se implementa, a qué tiendas corresponde y cuándo debe cumplirse. Los cálculos siguientes son una simulación; los indicadores oficiales de Registro, Reporte y Dashboard no cambian.</p>
  </div>
  <div style={ST.tarjeta}>
    <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(210px,1fr))',gap:12}}>
      <label><span style={ST.rotulo}>ACTIVIDAD DEL CATÁLOGO *</span><select style={ST.campo} value={actividadId} onChange={e=>{setActividadId(e.target.value);const a=actividades.find(x=>String(x.id)===e.target.value);if(a?.dias?.length)setDias(a.dias);}}><option value=''>— Seleccione una actividad —</option>{actividades.filter(a=>a.activa!==false).map(a=><option key={a.id} value={a.id}>{a.n} · {a.cat}</option>)}</select></label>
      <label><span style={ST.rotulo}>OBJETO DE IMPLEMENTACIÓN / ENTREGABLE *</span><input style={ST.campo} value={descripcion} onChange={e=>setDescripcion(e.target.value.slice(0,180))} placeholder='Ej.: Grid de precios en góndolas' /></label>
      <label><span style={ST.rotulo}>FRECUENCIA *</span><select style={ST.campo} value={frecuencia} onChange={e=>setFrecuencia(e.target.value)}>{[['unica','Una sola vez'],['diaria','Todos los días'],['semanal','Días de la semana'],['mensual','Días del mes'],['fechas','Fechas específicas'],['ventana','Una implementación en ventana']].map(([v,l])=><option key={v} value={v}>{l}</option>)}</select></label>
      <label><span style={ST.rotulo}>INICIO *</span><input type='date' style={ST.campo} value={inicio} onChange={e=>setInicio(e.target.value)}/></label>
      <label><span style={ST.rotulo}>FIN *</span><input type='date' style={ST.campo} value={fin} onChange={e=>setFin(e.target.value)}/></label>
      <label><span style={ST.rotulo}>HORA DE CORTE GENERAL *</span><input type='time' style={ST.campo} value={hora} onChange={e=>setHora(e.target.value)}/></label>
      <label><span style={ST.rotulo}>PUNTOS POSIBLES POR OBLIGACIÓN *</span><input type='number' min='1' max='100' step='1' style={ST.campo} value={puntos} onChange={e=>setPuntos(e.target.value)}/></label>
    </div>
    {frecuencia==='semanal'&&<div style={{marginTop:14}}><span style={ST.rotulo}>DÍAS PROGRAMADOS (DOMINGO A SÁBADO)</span><div style={{display:'flex',gap:7,flexWrap:'wrap'}}>{NOMBRES_DIAS.map((d,i)=><button key={i} onClick={()=>setDias(p=>p.includes(i)?p.filter(x=>x!==i):[...p,i])} style={{padding:'8px 15px',borderRadius:8,border:'1px solid #c8d8e8',background:dias.includes(i)?'#eeeefe':'#fff',color:dias.includes(i)?'#6c5ce7':'#64748b',fontWeight:700,cursor:'pointer'}}>{d}</button>)}</div></div>}
    {frecuencia==='mensual'&&<div style={{marginTop:14}}><span style={ST.rotulo}>DÍAS DEL MES (SEPARADOS POR COMA)</span><input style={ST.campo} placeholder='Ej.: 5,15,25' onChange={e=>setFechas(e.target.value)} value={fechas}/></div>}
    {frecuencia==='fechas'&&<div style={{marginTop:14}}><span style={ST.rotulo}>FECHAS EXACTAS (AAAA-MM-DD, SEPARADAS POR COMA)</span><input style={ST.campo} placeholder='2026-11-23, 2026-11-27' onChange={e=>setFechas(e.target.value)} value={fechas}/></div>}
    {frecuencia==='ventana'&&<div style={{fontSize:11,color:'#5a7a9a',marginTop:9}}>Se exigirá una sola implementación por tienda dentro del periodo seleccionado, con límite al terminar la ventana.</div>}
  </div>
  <div style={ST.tarjeta}>
    <div style={{fontSize:14,fontWeight:800,marginBottom:9}}>Tiendas asignadas <span style={{color:'#6c5ce7'}}>({seleccion.length} seleccionadas)</span></div>
    <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(180px,1fr))',gap:8,marginBottom:10}}>
      <label><span style={ST.rotulo}>FORMATO</span><select style={ST.campo} value={formato} onChange={e=>setFormato(e.target.value)}><option>Todas</option>{[...new Set(maestras.map(t=>t.formatoId).filter(Boolean))].sort().map(f=><option key={f}>{f}</option>)}</select></label>
      <label><span style={ST.rotulo}>ZONA COMERCIAL</span><select style={ST.campo} value={zona} onChange={e=>setZona(e.target.value)}><option>Todas</option>{[...new Set(maestras.map(t=>String(t.zonaId||'')).filter(Boolean))].sort().map(z=><option key={z}>{z}</option>)}</select></label>
      <label><span style={ST.rotulo}>BUSCAR TIENDA O CÓDIGO</span><input style={ST.campo} value={buscar} onChange={e=>setBuscar(e.target.value)} placeholder='Minka, Naranjal…'/></label>
    </div>
    <button onClick={()=>setSeleccion(p=>todosVisibles?p.filter(id=>!cambios.includes(id)):[...new Set([...p,...cambios])])} style={{border:'1px solid #c8d8e8',borderRadius:8,padding:'8px 12px',background:'#fff',fontWeight:700,color:'#6c5ce7',cursor:'pointer',marginBottom:9}}>{todosVisibles?'Desmarcar tiendas filtradas':'Seleccionar tiendas filtradas'} ({cambios.length})</button>
    <div style={{maxHeight:260,overflowY:'auto',border:'1px solid #e2e8f0',borderRadius:9}}>{filtradas.map(t=><label key={t.id} style={{display:'grid',gridTemplateColumns:'20px minmax(0,1fr) 100px',alignItems:'center',gap:8,padding:'8px 10px',borderBottom:'1px solid #f1f5f9',fontSize:11,cursor:'pointer'}}><input type='checkbox' checked={seleccion.includes(t.id)} onChange={()=>toggle(t.id)}/><span><b>{t.nombre}</b> · {t.formatoId||'Sin formato'} · zona {t.zonaId||'s/d'} <span style={{color:'#94a3b8'}}>#{t.codigoTienda||t.id}</span></span><input type='time' aria-label={`Hora especial ${t.nombre}`} disabled={!seleccion.includes(t.id)} title='Horario específico de esta tienda (opcional)' style={{...ST.campo,padding:'5px 3px',fontSize:10}} value={horas[t.id]||hora} onClick={e=>e.stopPropagation()} onChange={e=>setHoras(p=>({...p,[t.id]:e.target.value}))}/></label>)}{!filtradas.length&&<div style={{padding:16,color:'#94a3b8',fontSize:12}}>No hay tiendas con estos filtros.</div>}</div>
    <div style={{fontSize:10,color:'#64748b',marginTop:7}}>El horario de la derecha permite una hora de corte diferente por tienda. La selección manual es explícita: no se agregan tiendas automáticamente.</div>
  </div>
  <div style={{...ST.tarjeta,borderLeft:'4px solid #00b5b4'}}>
    <div style={{fontWeight:800,fontSize:14,marginBottom:10}}>Vista previa de obligaciones (no altera puntajes)</div>
    {previa.errores.length?<div style={{fontSize:12,color:'#b45309',lineHeight:1.7}}>{previa.errores.map((e,i)=><div key={i}>• {e}</div>)}</div>:<>
      <div style={{display:'flex',gap:22,flexWrap:'wrap',marginBottom:12}}>{[['Obligaciones',previa.totales.obligaciones],['Tiendas',previa.totales.tiendas],['Días con ejecución',previa.totales.dias]].map(([k,v])=><div key={k}><div style={{fontSize:22,fontWeight:900,color:'#1a2f4a'}}>{v}</div><div style={{fontSize:11,color:'#64748b'}}>{k}</div></div>)}</div>
      <div style={{fontSize:11,fontWeight:700,marginBottom:5}}>Cortes semanales fijos: S1 (1–7), S2 (8–14), S3 (15–21), S4 (22–28), S5 (29–fin)</div>
      <div style={{display:'flex',gap:7,flexWrap:'wrap'}}>{previa.totales.porSemana.map(([k,n])=><span key={k} style={{padding:'6px 10px',background:'#f0edff',borderRadius:8,fontSize:11,color:'#6c5ce7',fontWeight:700}}>{k}: {n}</span>)}</div>
    </>}
  </div>
  <div style={{...ST.tarjeta}}><div style={{fontSize:13,fontWeight:800,marginBottom:10}}>Borradores almacenados ({programaciones.filter(p=>p.estado==='borrador').length})</div>{programaciones.filter(p=>p.estado==='borrador').slice(0,15).map(p=><div key={p.id} style={{fontSize:11,padding:'7px 0',borderBottom:'1px solid #f1f5f9'}}><b>{p.actividadNombre||p.actividadId}</b> · {p.inicio} a {p.fin} · {(p.alcance?.tiendaIds||[]).length} tiendas <span style={{color:'#a56d10'}}>· BORRADOR</span></div>)}{!programaciones.some(p=>p.estado==='borrador')&&<div style={{fontSize:11,color:'#64748b'}}>No hay borradores guardados en Firebase.</div>}</div>
  <div style={{display:'flex',gap:10,alignItems:'center',flexWrap:'wrap'}}><button onClick={guardar} disabled={!habilitado||guardando||previa.errores.length>0} style={{padding:'11px 18px',borderRadius:9,border:'none',background:!habilitado||previa.errores.length?'#cbd5e1':'#6c5ce7',color:'#fff',fontWeight:800,cursor:'pointer'}}>{guardando?'Guardando…':'Guardar como borrador D2'}</button><span style={{fontSize:11,color:'#b45309'}}>Solo administrador. Guarda en Firebase compartido; NO activa la programación ni afecta la eficiencia oficial.</span></div>
  {mensaje&&<div role='status' style={{padding:12,marginTop:10,background:'#f0fdf4',borderRadius:9,fontSize:12,color:'#166534'}}>{mensaje}</div>}
 </div>;
}
