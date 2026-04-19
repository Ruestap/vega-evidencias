import { useState, useMemo, useCallback, useRef, useEffect } from "react";
import React from "react";
import { db } from "./firebase";
import {
  collection, doc, onSnapshot,
  setDoc, deleteDoc
} from "firebase/firestore";

/* ══ ERROR BOUNDARY — captura crashes de render y evita pantalla blanca ══ */
class AppErrorBoundary extends React.Component {
  constructor(props){ super(props); this.state={hasError:false,error:null}; }
  static getDerivedStateFromError(error){ return {hasError:true,error}; }
  componentDidCatch(error,info){ console.error("[VEGA ErrorBoundary]",error,info); }
  render(){
    if(this.state.hasError){
      return(
        <div style={{fontFamily:"system-ui,sans-serif",background:"#f0f4f8",minHeight:"100vh",display:"flex",alignItems:"center",justifyContent:"center",padding:20}}>
          <div style={{background:"#fff",borderRadius:16,padding:32,maxWidth:420,width:"100%",boxShadow:"0 4px 24px rgba(0,0,0,.1)",textAlign:"center"}}>
            <div style={{fontSize:40,marginBottom:12}}>⚠️</div>
            <div style={{fontWeight:800,fontSize:16,color:"#1a2f4a",marginBottom:8}}>Error de aplicación</div>
            <div style={{fontSize:12,color:"#5a7a9a",marginBottom:20,lineHeight:1.6}}>
              Ocurrió un error inesperado. Por favor recarga la página.<br/>
              Si el error persiste, contacta al administrador.
            </div>
            <div style={{fontSize:10,color:"#b2bec3",background:"#f8fafc",borderRadius:8,padding:"8px 12px",fontFamily:"monospace",marginBottom:16,textAlign:"left",wordBreak:"break-all"}}>
              {String(this.state.error?.message||this.state.error||"Unknown error")}
            </div>
            <button onClick={()=>window.location.reload()}
              style={{padding:"12px 24px",borderRadius:10,border:"none",background:"linear-gradient(135deg,#00b5b4,#1a2f4a)",color:"#fff",fontWeight:700,fontSize:13,cursor:"pointer"}}>
              🔄 Recargar página
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
const TIENDAS_INIT = [
  {id:"t01",n:"Collique",f:"Mayorista",lat:-11.9130710881406,lng:-77.0315240586426,dir:"Av. Andrés Avelino Cáceres N°236, Mz K, Lt.1, 2da. Zona (Mcdo. 12 de Octubre)",dist:"Comas",maps:"https://goo.gl/maps/WMx9abr8jDP7hFmr6",activa:true},
  {id:"t02",n:"Infantas",f:"Mayorista",lat:-11.9452993788987,lng:-77.0666678245644,dir:"Av.  Av Gerardo Unger 6531(Ref Media  Cuadra Comisaria de Infantas)",dist:"S.M.P.",maps:"https://goo.gl/maps/CEEaDF5Vb8tA6gaz6",activa:true},
  {id:"t03",n:"Productores",f:"Mayorista",lat:-12.0406048829501,lng:-76.947559418012,dir:"Av. La Cultura s/n Psje. B Puesto 13 Santa Anita - Mercado Productores",dist:"Santa Anita",maps:"https://goo.gl/maps/EzcjFuixKH8UFF229",activa:true},
  {id:"t04",n:"Belaunde",f:"Mayorista",lat:-11.9394642199328,lng:-77.05063230274,dir:"Av Belaunde Oeste 198",dist:"Comas",maps:"https://goo.gl/maps/gXxPQDmHDeiTeCxU8",activa:true},
  {id:"t05",n:"Santa Clara",f:"Supermayorista",lat:-12.0179693921418,lng:-76.8835553504947,dir:"Av. Estrella 286 Urb. Santa Clara  Distrito de Ate Vitarte",dist:"Ate Vitarte",maps:"https://g.page/QhatuPlazaSantaClara?share",activa:true},
  {id:"t06",n:"San Antonio",f:"Supermayorista",lat:-11.862040061358,lng:-77.0096919246391,dir:"Fundación Punchauca Caudivilla Mz “D” Lt - 01 San Antonio Alt. km 22 de la Tupac Amaru",dist:"Carabayllo",maps:"https://goo.gl/maps/eUm25P5MX24Svq8p6",activa:true},
  {id:"t07",n:"Chorrillos",f:"Supermayorista",lat:-12.16797675312,lng:-77.0239126189426,dir:"Jr. Genaro Numa Llona N° 200 (Ref Alt 2 de Estacion de Bomberos )",dist:"Chorrillos",maps:"https://goo.gl/maps/QUB3Q4uRu3qfSyZM9",activa:true},
  {id:"t08",n:"Año Nuevo",f:"Supermayorista",lat:-11.9239747733092,lng:-77.0409121709185,dir:"Urb. Villa Collique Zonal 4 Jr. Jupiter Mz 6 Lote 68",dist:"Comas",maps:"https://maps.app.goo.gl/hotaB65hVzXaS78E6",activa:true},
  {id:"t09",n:"Colonial",f:"Supermayorista",lat:-12.0465295077811,lng:-77.0474716086143,dir:"Av Colonial  679 - Int 103 - Cruce Carcamo (Cercado de Lima)",dist:"Lima Cercado",maps:"https://maps.app.goo.gl/Y116zBpWoAV9AhEK6",activa:true},
  {id:"t10",n:"Huamantanga",f:"Supermayorista",lat:-11.8642606553917,lng:-77.0740240854907,dir:"Av. Puente Piedra 200(Ref - Frente al Puesto Regular)",dist:"Puente Piedra",maps:"https://goo.gl/maps/CeHBhbQTBW2nyqzU9",activa:true},
  {id:"t11",n:"Filomeno",f:"Supermayorista",lat:-12.0240887249942,lng:-77.0286662025572,dir:"Urb. Ciudad  y Campo - Av Armando Filomeno 105",dist:"Rimac",maps:"https://goo.gl/maps/BqP9A8KqRkjeXnCY8",activa:true},
  {id:"t12",n:"Naranjal",f:"Supermayorista",lat:-11.9676870957647,lng:-77.0948968735974,dir:"Av. Pacasmayo Mz. A Lt -01 Ref. (Ovalo de Canta Callao / Av Sol de Naranjal)",dist:"S.M.P.",maps:"https://goo.gl/maps/ErHSirU7eiiRkFH78",activa:true},
  {id:"t13",n:"San Diego",f:"Supermayorista",lat:-11.9457045229958,lng:-77.0875688429728,dir:"Mza. Ñ1 Lote 3 Urb. San Diego Vipol",dist:"S.M.P.",maps:"https://goo.gl/maps/RZDLeRfs1UNU9wFU8",activa:true},
  {id:"t14",n:"Surco",f:"Supermayorista",lat:-12.145287970169,lng:-76.9877465027067,dir:"Urb Prolongacion  Benavides - Av Tomas Marsano Mz \"G-4\" Lt 23",dist:"Surco",maps:"https://goo.gl/maps/EEMTkD2mhiFYQALG7",activa:true},
  {id:"t15",n:"Lima VES",f:"Supermayorista",lat:-12.2306606786337,lng:-76.9091952188438,dir:"Av. Lima Lt \"A - 02\" (Ref Ex Electra) Villa El Salvador",dist:"V.E.S.",maps:"https://goo.gl/maps/F4hWVzVsuy7z2Kup8",activa:true},
  {id:"t16",n:"Minka",f:"Supermayorista",lat:-12.0479673671,lng:-77.111423924141,dir:"Av. Argentina N°3093 - Pabellón 7 - Int 97",dist:"Callao",maps:"https://goo.gl/maps/V5hVoRQKTatTS2VLA",activa:true},
  {id:"t17",n:"Nestor Gambetta",f:"Supermayorista",lat:-11.8380137768696,lng:-77.1106039375981,dir:"Via Leocio Prado  Mz G Lt.96 (Ref 2 Cuadras de PRECIO UNO)",dist:"Puente Piedra",maps:"https://goo.gl/maps/UUSR9Y2VNy8odHYm8",activa:true},
  {id:"t18",n:"Tres Regiones",f:"Supermayorista",lat:-11.8473268750784,lng:-77.0909708230882,dir:"Panamericana norte km. 33.5, Zapallal - Puente Piedra (mercado las tres regiones)",dist:"Puente Piedra",maps:"https://goo.gl/maps/YAVyCgNzwEEJvNRN9",activa:true},
  {id:"t19",n:"Bocanegra",f:"Market",lat:-12.0066909878997,lng:-77.0993521687059,dir:"Av. Bocanegra Mz, A Lote N° 30, Urb. Albino Herrera, Primera Etapa",dist:"Callao",maps:"https://goo.gl/maps/z2iuTStL7i5uv7ig8",activa:true},
  {id:"t20",n:"Canta Callao",f:"Market",lat:-11.9979508014858,lng:-77.1139514644159,dir:"Parcela 2-A, Ex Fundo Taboada – Valle de Boca Negra, Local Comercial Nº 110",dist:"Callao",maps:"https://goo.gl/maps/VkpsQ26Jjmbvckoh6",activa:true},
  {id:"t21",n:"Mi Perú",f:"Market",lat:-11.8540475368831,lng:-77.1251839301726,dir:"Av. Ayacucho  Mz \"A9\" Lt -22 Gr \"A\" - Mi Perú",dist:"Ventanilla",maps:"https://goo.gl/maps/7u4tMquY7RYg4BsFA",activa:true},
  {id:"t22",n:"Santo Domingo",f:"Market",lat:-11.8870300194622,lng:-77.0355570041254,dir:"Av Mariano Condorcanqui Mz T",dist:"Carabayllo",maps:"https://goo.gl/maps/EjFhHNvZZS8yND9M7",activa:true},
  {id:"t23",n:"Amaranto",f:"Market",lat:-11.8997588873418,lng:-77.0369269423487,dir:"Jr. Amaranto 108 - 110, Urb. Santa Isabel",dist:"Carabayllo",maps:"https://goo.gl/maps/ytZxPSFqPEfiKd8bA",activa:true},
  {id:"t24",n:"Malvinas",f:"Market",lat:-12.0440597372605,lng:-77.0499197423462,dir:"Av Argentina cdra 6 Int \"L\" . CC Via Mix",dist:"Lima Cercado",maps:"https://goo.gl/maps/Xy2UwwzUedBynGqu6",activa:true},
  {id:"t25",n:"Husares De Junin",f:"Market",lat:-12.0770426523306,lng:-77.0514508478503,dir:"Av. Husares De Junin Nro. 366 Int. 1 Fnd. Oyague",dist:"Jesus María",maps:"https://goo.gl/maps/ccvd1ncnuqtXzKqV7",activa:true},
  {id:"t26",n:"Santa Catalina",f:"Market",lat:-12.089545803654,lng:-77.0197852198942,dir:"Av. Carlos Villaran 500 - C.C. Santa",dist:"La Victoria",maps:"https://goo.gl/maps/GaghBoXhkURDfcfR8",activa:true},
  {id:"t27",n:"Canevaro",f:"Market",lat:-12.0850888511931,lng:-77.0454268337727,dir:"Av. Canevaro N°1405 (Ref. frente al Parque de bomberos)",dist:"Lince",maps:"https://goo.gl/maps/hp2vVXvyzvgNFcCA6",activa:true},
  {id:"t28",n:"Alayza",f:"Market",lat:-12.0837799669684,lng:-77.0359517108937,dir:"Av. General Cesar Canevaro Nro. 213 Lima - Lima - Lince",dist:"Lince",maps:"https://goo.gl/maps/CYdkDWM6LYRW6bMq8",activa:true},
  {id:"t29",n:"Huandoy",f:"Market",lat:-11.9755420632121,lng:-77.0823099152715,dir:"Av Huandoy N° 5032",dist:"Los Olivos",maps:"https://goo.gl/maps/GkbaaSvJoAaRA6F67",activa:true},
  {id:"t30",n:"Las Palmeras",f:"Market",lat:-11.9732419484427,lng:-77.0722909907347,dir:"Av Las Palmeras 5345",dist:"Los Olivos",maps:"https://goo.gl/maps/j7P16D6Qcw9rGHx78",activa:true},
  {id:"t31",n:"Benavides",f:"Market",lat:-12.1262277453332,lng:-77.0147340280236,dir:"Av. Alfredo Benavides Nro. 1615 Urb. San Jorge Lima - Lima - Miraflores",dist:"Miraflores",maps:"https://goo.gl/maps/aL4v5TUUuwT8f3Rk9",activa:true},
  {id:"t32",n:"Clement",f:"Market",lat:-12.0752479997504,lng:-77.0633833684983,dir:"Av. José Leguía y Meléndez Nro. 1040",dist:"Pueblo Libre",maps:"https://goo.gl/maps/kW82Ut3NSVm5opW87",activa:true},
  {id:"t33",n:"Aviación",f:"Market",lat:-12.1074414800023,lng:-77.0005866261898,dir:"Av. Aviacion N° 3540",dist:"San Borja",maps:"https://g.page/vega-market-aviacion?share",activa:true},
  {id:"t34",n:"La Cultura",f:"Market",lat:-12.0846341748754,lng:-77.0047722978547,dir:"Av. Aviación N° 2347",dist:"San Borja",maps:"https://goo.gl/maps/6jseYX4BqrCXu3hY8",activa:true},
  {id:"t35",n:"Chimu",f:"Market",lat:-12.0981034965201,lng:-76.9623006042263,dir:"Av Gran Chimu 1641 Urb. Zarate",dist:"S.J.L.",maps:"https://goo.gl/maps/Fwj6B5aD9TYCMseP8",activa:true},
  {id:"t36",n:"Montenegro",f:"Market",lat:-11.9362598875811,lng:-76.9719465484801,dir:"Jr. Mar de flores. Oeste 127 MZ Q1 - Lt 2B",dist:"S.J.L.",maps:"https://goo.gl/maps/s2yVQLymmw8bReCg9",activa:true},
  {id:"t37",n:"Izaguirre",f:"Market",lat:-11.989557202557,lng:-77.0977567584093,dir:"Av Carlos Izaguirre MZ \"A\", Lt 30",dist:"S.M.P.",maps:"https://maps.app.goo.gl/HrSB3aakKn897whe8",activa:true},
  {id:"t38",n:"Riobamba",f:"Market",lat:-12.0331715698591,lng:-77.0589855334734,dir:"Urb. Perú, Jr. Riobamba 501, San Martín de Porres",dist:"S.M.P.",maps:"https://goo.gl/maps/PZhCDig7d99rRtme6",activa:true},
  {id:"t39",n:"Escardó",f:"Market",lat:-12.0779047089124,lng:-77.0927689647178,dir:"Av. Rafael Escardo Salazar Nº 454 urbanización Maranga",dist:"San Miguel",maps:"https://goo.gl/maps/Sur3ctj6KP9dCobF7",activa:true},
  {id:"t40",n:"Maranga",f:"Market",lat:-12.0697705428756,lng:-77.0919306022064,dir:"Av. Los Precursores N° 362-366 - San Miguel",dist:"San Miguel",maps:"https://goo.gl/maps/31WiaYd6BZrxyj5V9",activa:true},
  {id:"t41",n:"Universal",f:"Market",lat:-12.0436282626762,lng:-76.9794604832883,dir:"Jr. César Vallejo 356- 360 Urb. Universal",dist:"Santa Anita",maps:"https://goo.gl/maps/MLcUYojHz5R5VrTx8",activa:true},
  {id:"t42",n:"Roosevelt",f:"Market",lat:-12.1467620468921,lng:-77.0124804800025,dir:"Jr. Franklin Roosevelt 812",dist:"Surco",maps:"https://goo.gl/maps/wau8L8pp8KizFXCS8",activa:true},
  {id:"t43",n:"Higuereta",f:"Market",lat:-12.1294650401685,lng:-77.0009571492134,dir:"Av. Santiago De Surco Nro. 3004 Int. 101 Urb. La Castellana Lima",dist:"Surco",maps:"https://maps.app.goo.gl/4Ks7i6CXbmjsb27h6",activa:true},
  {id:"t44",n:"Mareategui",f:"Market",lat:-12.1545753990258,lng:-76.9525443717441,dir:"Jose Carlos Mareategui N° 798",dist:"V.M.T.",maps:"https://goo.gl/maps/baJNRwMns6FCkXJy7",activa:true},
  {id:"t45",n:"Salamanca",f:"Market",lat:-12.0745836007826,lng:-76.9881374448751,dir:"Urb. Salamanca de Monterrico Av. Los Aymaras 349",dist:"Ate Vitarte",maps:"https://goo.gl/maps/4wtQfhdqaPF7cQYGA",activa:true},
  {id:"t46",n:"Olimpo",f:"Market",lat:-12.0745301492371,lng:-76.9772683225455,dir:"Calle Efestos Mz W Lt 4 Urb Olimpo (Ref frente al Merc Olimpo)",dist:"Ate Vitarte",maps:"https://goo.gl/maps/Fqk1StEsUFMRodJh9",activa:true},
  {id:"t47",n:"Nueva Esperanza",f:"Market",lat:-12.1673239484862,lng:-76.9204274410753,dir:"Av. 26 de Noviembre N° 1993, Virgen de Lourdes - VMT",dist:"V.M.T.",maps:"https://goo.gl/maps/V15954Ve1mUcvwx5A",activa:true},
  {id:"t48",n:"Alisos",f:"Market",lat:-11.9832041997733,lng:-77.0789397745201,dir:"Av. Los Alisos Mz. R Lote 45 Urb. Los Jazmines de Naranjal",dist:"Los Olivos",maps:"https://goo.gl/maps/AymktEnhAKKF4xf48",activa:true},
  {id:"t49",n:"Ignacio Merino",f:"Market",lat:-12.0840366270314,lng:-77.0315598469307,dir:"Av. Ignacio Merino 1999",dist:"Lince",maps:"https://maps.app.goo.gl/TqfoSCZG4EV9niXp9",activa:true},
  {id:"t50",n:"Rospigliosi",f:"Market",lat:-12.0792756031438,lng:-77.0326054084494,dir:"Av. Ignacio Merino Nro. 1502 esq. con Manuel Segura",dist:"Lince",maps:"https://maps.app.goo.gl/TE6Y6Hc8oGPtGZQ86",activa:true},
  {id:"t51",n:"Loreto",f:"Market",lat:-12.0544998291611,lng:-77.0490928110227,dir:"Jiron Loreto 478",dist:"Breña",maps:"https://maps.app.goo.gl/zQMbQ2qmR1JH579Q9",activa:true},
  {id:"t52",n:"Vara de Oro",f:"Market",lat:-12.0251128545406,lng:-76.9967339475352,dir:"Calle Vara de Oro 288 - Urg Zarate Comu 3",dist:"S.J.L.",maps:"https://maps.app.goo.gl/wkrE4H54wD3VH8rm9",activa:true},
  {id:"t53",n:"Los Olivos",f:"Market",lat:-11.98831205195,lng:-77.0822101252409,dir:"Av. Los Olivos 210",dist:"S.M.P.",maps:"https://maps.app.goo.gl/qhuoGau6dtNbFLgb9",activa:true},
  {id:"t54",n:"Mariano Pastor",f:"Market",lat:-12.0729274536981,lng:-77.0651821734151,dir:"C. Mariano Pastor Sevilla 194 (Ref 1/2 cuadra Merc Bolivar)",dist:"Pueblo Libre",maps:"https://maps.app.goo.gl/6MGuZsMU3341X6Lr6",activa:true},
  {id:"t55",n:"Amancaes 3",f:"Market",lat:-12.0257230071489,lng:-77.0341626057537,dir:"Av. Amancaes 124, Rímac",dist:"Rimac",maps:"https://maps.app.goo.gl/oZcdG7b484FryNwo8",activa:true},
  {id:"t56",n:"Alameda Los Cedros",f:"Market",lat:-12.2036161155135,lng:-77.0146858000055,dir:"Av. Alameda Los Cedros 214",dist:"Chorrillos",maps:"https://maps.app.goo.gl/R6dSf5vUMvWEaakV8",activa:true},
  {id:"t57",n:"Bellavista",f:"Market",lat:-12.063814219369,lng:-77.1454623981609,dir:"Jiron. Grau 485",dist:"Bellavista",maps:"https://maps.app.goo.gl/7ujPpHG8RQXqxkENA",activa:true},
  {id:"t58",n:"Mall Comas",f:"Market",lat:-11.9338398194793,lng:-77.0658375835365,dir:"Av. Los Ángeles 602, Comas 15314",dist:"Comas",maps:"https://maps.app.goo.gl/cLXJ8XsWSzS3bqo57",activa:true},
  {id:"t59",n:"A. Los Condores",f:"Market",lat:-12.1011618376867,lng:-76.9441832656271,dir:"Alameda los Condores 628",dist:"La Molina",maps:"https://maps.app.goo.gl/dqKnNNLNN4Y7ufgb8",activa:true},
  {id:"t60",n:"Mariano Cornejo",f:"Market",lat:-12.0677220872957,lng:-77.0651192762642,dir:"Av Mariano Cornejo 1407",dist:"Pueblo Libre",maps:"https://maps.app.goo.gl/ed992SADFWwLWyBj8",activa:true},
  {id:"t61",n:"Las Guindas",f:"Market",lat:-12.0315735941664,lng:-76.9904041119922,dir:"Ca. Las Guindas 348 Urb, El Agustino (Ref media cuadra Condominios Alameda El Agustino)",dist:"Pueblo Libre",maps:"https://maps.app.goo.gl/ExAhcKw7mPDXv5VW6",activa:true},
  {id:"t62",n:"San Luis",f:"Market",lat:-12.0755237709728,lng:-77.0023173003529,dir:"Av. San Juan 771 San Luis",dist:"La Victoria",maps:"https://share.google/36264kwQUUQoIV7nh",activa:true},
  {id:"t63",n:"Independencia",f:"Market",lat:-11.9925688075581,lng:-77.0574865358829,dir:"Av. Gerardo Unger Nro. 3601 local LC02 Urb. Industrial Panamericana Norte",dist:"Independencia",maps:"https://share.google/nrqEZNgi6dLcVz7fh",activa:true},
  {id:"t64",n:"Guardia Civil",f:"Market",lat:-12.1680427416882,lng:-76.9921645565965,dir:"Av. Guardia Civil Norte 625, Urb. Los Parrales de Surco",dist:"Surco",maps:"https://maps.app.goo.gl/cJJCVJX3N5xgNqwb8",activa:true},
  {id:"t65",n:"Villaran",f:"Market",lat:-12.1216165022436,lng:-77.0048891334863,dir:"Av. Manuel Villlaran 708 Urb. Los Sauces Surquillo",dist:"Surquillo",maps:"https://maps.app.goo.gl/TjtyMkpDEMtNRuji6",activa:true},
  {id:"t66",n:"Micaela Bastidas",f:"Market",lat:-12.0461930116169,lng:-76.9300866037768,dir:"Calle Comercial Mz U Lote 9 (Ref 1/2 cuadra de mercado modelo n°1 micaela bastidas)",dist:"Ate Vitarte",maps:"https://maps.app.goo.gl/UTdCken84EsBDG4B8",activa:false},
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

// Retorna {ob, mx, pct} por sección — ob=pts obtenidos, mx=pts máximos posibles
function calcScoreModulo(respuestas,modulo){
  const items=modulo.items.filter(i=>i.activo);
  if(!items.length) return null;
  const mx=items.length*3;
  const ob=items.reduce((sum,i)=>{
    const v=respuestas?.[i.id]?.valor;
    return sum+(v!==null&&v!==undefined?v:0);
  },0);
  const respondidos=items.filter(i=>respuestas?.[i.id]?.valor!==null&&respuestas?.[i.id]?.valor!==undefined);
  if(!respondidos.length) return null;
  return {ob:Math.round(ob*100)/100, mx, pct:Math.round((ob/mx)*100)};
}
// Score final Opción 2: suma total obtenida / 72 pts totales × 100
function calcScoreFinal(respuestas,modulos){
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

const MESES = ["Enero","Febrero","Marzo","Abril","Mayo","Junio","Julio","Agosto","Septiembre","Octubre","Noviembre","Diciembre"];
const DIAS_N = ["Domingo","Lunes","Martes","Miércoles","Jueves","Viernes","Sábado"];
const DIAS_C = ["D","L","M","MI","J","V","S"];
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
        return deleteDoc(doc(db, "registros", docId));
      } else {
        return setDoc(doc(db, "registros", docId), {...reg, evidencias: newEvs, updatedAt: new Date().toISOString()});
      }
    });
    try {
      await Promise.all(promises);
      showToast(`🗑️ ${selLogs.size} registro(s) eliminado(s)`);
      setSelLogs(new Set());
    } catch(e) {
      console.error("eliminarSeleccionados error:", e);
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

/* ══ APP ══════════════════════════════════════════════ */
function ChecklistApp() {
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const now = useMemo(()=>new Date(),[]); // evita new Date() en cada render
  /* ── auth ── */
  const [role,    setRole]    = useState(null);
  const [uName,   setUName]   = useState("");
  const [uDni,    setUDni]    = useState("");
  const [pins,    setPins]    = useState({admin:"vega2026",auditor:"auditor88",viewer:"gerencia1"});
  const [pinMod,  setPinMod]  = useState(false);
  const [auditores, setAuditores] = useState([]); // [{dni,nombre,activo}] — legacy
  const [usuarios,  setUsuarios]  = useState([]); // [{id,nombre,rol,credencial,activo,ultimoAcceso}]
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
  const [horaEx,  setHoraEx]  = useState(()=>horaHHMM());
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
  const [selDupsExterno, setSelDupsExterno] = useState([]); // Bug 6 fix: reemplaza window._logTableSelDups
  const [rangosDia, setRangosDia] = useState({}); // {actId: {fecha: {c100,c80,c60}}}
  const [rangoFecha, setRangoFecha] = useState(()=>todayStr());
  // Cortes de supervisión independientes de los rangos de puntaje
  // Admin los configura; se usan en la tarjeta Estado de Registros
  const [cortesSupervision, setCortesSupervision] = useState({c1:"08:30", c2:"09:30"});
  const [showNT,  setShowNT]  = useState(false);
  const [showNA,  setShowNA]  = useState(false);
  const [showNUsuario, setShowNUsuario] = useState(false);
  const [newUsuario,   setNewUsuario]   = useState({nombre:"",rol:"auditor",email:"",telefono:"",whatsapp:"",zona:"",area:"",dni:"",editId:null});
  const [busqUsuario,  setBusqUsuario]  = useState("");
  const [newT,    setNewT]    = useState({n:"",f:"Market"});
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
      if(d.tiendas)     setTiendas(d.tiendas);
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
    await deleteDoc(doc(db,"usuarios",id));
  },[]);

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
    try {
      await setDoc(doc(db,"config","app"),{
        actividades: overrides.actividades ?? actsRef.current,
        tiendas:     overrides.tiendas     ?? tiendasRef.current,
        pins:        overrides.pins        ?? pinsRef.current,
        excepciones: excClean,
        rangosDia:   overrides.rangosDia   ?? rangosDiaRef.current,
        cortesSupervision: overrides.cortesSupervision ?? cortesSupervisionRef.current,
        updatedAt:   new Date().toISOString(),
      });
    } catch(e) {
      console.error("saveConfig error:", e);
      showToast("❌ Error al guardar configuración. Reintentando...");
      // Retry una vez
      try {
        await setDoc(doc(db,"config","app"),{
          actividades: overrides.actividades ?? actsRef.current,
          tiendas:     overrides.tiendas     ?? tiendasRef.current,
          pins:        overrides.pins        ?? pinsRef.current,
          excepciones: excClean,
          rangosDia:   overrides.rangosDia   ?? rangosDiaRef.current,
          cortesSupervision: overrides.cortesSupervision ?? cortesSupervisionRef.current,
          updatedAt:   new Date().toISOString(),
        });
      } catch(e2) {
        console.error("saveConfig retry failed:", e2);
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
    setAuditPaso(1);
    showToast(gps.sinGPS?"⚠️ Sin GPS — continuando":"✅ Check-in registrado");
  },[obtenerGPS,showToast]);

  /* ── Check-out: calcula scores y guarda en Firestore ── */
  const auditCheckOut = useCallback(async(estado="enviado")=>{
    const tienda=tiendas.find(t=>t.id===auditTiendaSel);
    const mods=checklistModulos.filter(m=>m.activo);
    const scoresPorModulo=mods.map(m=>({
      moduloId:m.id, moduloLabel:m.label,
      score:calcScoreModulo(auditRespuestas,m), // {ob,mx,pct}
      obsModulo:auditRespuestas[`__obs_${m.id}`]?.obs||"",
      itemsResp:m.items.filter(i=>i.activo&&auditRespuestas[i.id]?.valor!==undefined).length,
      itemsTotal:m.items.filter(i=>i.activo).length,
    }));
    const scoreFinal=calcScoreFinal(auditRespuestas,mods);
    let gpsOut=auditGPSOut;
    if(!gpsOut){try{gpsOut=await obtenerGPS();}catch{gpsOut={lat:null,lng:null};}}
    const checkInTs=auditCheckInTs||new Date().toISOString();
    const checkOutTs=new Date().toISOString();
    const durMin=Math.round((new Date(checkOutTs)-new Date(checkInTs))/60000);
    const docId=`${auditTiendaSel}--${fecha}--${uDni}--${Date.now()}`;
    const payload={
      auditorId:uDni, auditorNombre:uName,
      tiendaId:auditTiendaSel, tiendaNombre:tienda?.n||auditTiendaSel, tiendaFormato:tienda?.f||"",
      fecha, checkIn:{timestamp:checkInTs,gps:auditGPS}, checkOut:{timestamp:checkOutTs,gps:gpsOut},
      duracionMin:durMin, respuestas:auditRespuestas, scoresPorModulo, scoreFinal,
      observaciones:auditObs, compromisos:auditCompromisos,
      estado, creadoEn:checkInTs, updatedAt:checkOutTs,
    };
    try{
      await setDoc(doc(db,"auditorias",docId),payload);
      showToast(estado==="borrador"?"💾 Borrador guardado":`✅ Enviada · ${scoreFinal!==null?scoreFinal.toFixed(1)+"%":"S/D"} ${scoreFinal!==null?getTierAuditoria(scoreFinal).icon:""}`);
      setAuditPaso(0); setAuditTiendaSel(null); setAuditRespuestas({});
      setAuditGPS(null); setAuditGPSOut(null); setAuditCheckInTs(null);
      // Generar mailto si es envío final
      if(estado==="enviado"){
        const tiendaObj=tiendas.find(t=>t.id===auditTiendaSel);
        const zonaEmail=tiendaObj?.zonaId?usuarios.find(u=>u.id===tiendaObj.zonaId)?.email:"";
        const tiendaEmail=tiendaObj?.email||"";
        const toEmails=[zonaEmail,tiendaEmail].filter(Boolean).join(",");
        const subj=`Auditoría Vega ${tiendaObj?.n||auditTiendaSel} · ${fecha} · ${scoreFinal!==null?scoreFinal.toFixed(1)+"%":"S/D"}`;
        const mods2=checklistModulos.filter(m=>m.activo);
        let bodyLines=[`Auditoría realizada por: ${uName||uDni}`,`Tienda: Vega ${tiendaObj?.n||auditTiendaSel} · ${fecha}`,``];
        scoresPorModulo.forEach(sm=>{
          const pct=sm.score?sm.score.pct:"S/D";
          const icon=sm.score?.pct>=90?"✓":sm.score?.pct>=75?"✓":"⚠";
          bodyLines.push(`${sm.moduloLabel}: ${sm.score?`${sm.score.ob}/${sm.score.mx} pts (${pct}%)`:"S/D"} ${icon}`);
          if(sm.obsModulo) bodyLines.push(`  Obs: ${sm.obsModulo}`);
        });
        bodyLines.push(``);
        bodyLines.push(`Score final: ${scoreFinal!==null?scoreFinal.toFixed(1)+"%":"S/D"}`);
        if(auditCompromisos){bodyLines.push(``);bodyLines.push(`Compromisos acordados:`);bodyLines.push(auditCompromisos);}
        const body=bodyLines.join("\n");
        setAuditEmailModal({to:toEmails,subject:subj,body});
      }
    }catch(e){ console.error("auditCheckOut:",e); showToast("❌ Error al enviar."); }
  },[auditTiendaSel,auditRespuestas,auditObs,auditCompromisos,auditGPS,auditGPSOut,
     auditCheckInTs,checklistModulos,tiendas,fecha,uDni,uName,showToast,obtenerGPS]);

  // Solicitar exclusión N/A de auditoría (auditor) — queda pendiente hasta que admin apruebe
  const solicitarExclusionAudit = useCallback(async(tId, motivo, comentario)=>{
    const nueva={...auditExclusiones,[tId]:{motivo,comentario,solicitadoPor:uName||uDni,fecha:todayStr(),aprobada:false}};
    try{
      await setDoc(doc(db,"config","auditExclusiones"),nueva);
      showToast("📋 Exclusión enviada al administrador");
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
  const isViewer  = role==="viewer";

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
  const calcEficiencia = useCallback((tId, days, catFilter=null)=>{
    let obtenidos=0, maximos=0, registros=[];
    const hoy=todayStr();
    days.forEach(ds=>{
      if(ds>hoy) return;
      const dw=getDow(ds);
      acts.filter(a=>
        a.activa &&
        a.dias.includes(dw) &&
        !isExc(tId,a.id,ds) &&
        actsConRegistroIds.has(a.id) && // solo actividades operativamente activas
        (catFilter===null || a.cat===catFilter)
      ).forEach(a=>{
        const p=puntajeReg(getReg(ds,tId,a.id),getRangoActivo(a.id,ds));
        maximos+=10;
        if(p!==null){ obtenidos+=p; registros.push({fecha:ds,act:a.n,cat:a.cat,pts:p,max:10}); }
      });
    });
    if(maximos===0) return null;
    return {pct:Math.round((obtenidos/maximos)*100), obtenidos, maximos, registros};
  },[acts,regs,regsIndex,actsConRegistroIds,isExc,getReg,getRangoActivo]);

  // calcEficienciaModular — devuelve score por módulo + score final ponderado
  // por cantidad de actividades registradas en cada módulo.
  const calcEficienciaModular = useCallback((tId, days)=>{
    const hoy=todayStr();
    const mods = {AO:{ob:0,mx:0,n:0}, AH:{ob:0,mx:0,n:0}, PR:{ob:0,mx:0,n:0}};
    const catKey = {"Always On":"AO","Ad-hoc":"AH","Promocional":"PR"};
    days.forEach(ds=>{
      if(ds>hoy) return;
      const dw=getDow(ds);
      acts.filter(a=>
        a.activa && a.dias.includes(dw) &&
        !isExc(tId,a.id,ds) && actsConRegistroIds.has(a.id)
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
  },[acts,regs,regsIndex,actsConRegistroIds,isExc,getReg,getRangoActivo]);

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
      const docId=k.replace(/\|/g,"--");
      const ev={
        id:Date.now()+n,
        hora:horaEx,              // hora declarada por el auditor (HH:MM)
        puntaje:pct,
        observacion:obsEx||`Registro en bloque · ${tier.label}`,
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
      console.error("confirmarRegistro error:", e);
      showToast("❌ Error al guardar. Verifica tu conexión e intenta nuevamente.");
    }
  };

  const eliminarRegistro = async (docId) => {
    try {
      await deleteDoc(doc(db,"registros",docId));
      showToast("🗑️ Registro eliminado");
    } catch(e) {
      console.error("eliminarRegistro error:", e);
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
        motivoAnulacion: motivoAnu,
        detalleAnulacion: detalleAnu,
        anuladoPor: uName,
        anuladoEn: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      });
      showToast("⚠️ Registro anulado correctamente");
      setAnularModal(null); setMotivoAnu(""); setDetalleAnu("");
    } catch(e) {
      console.error("anularRegistro error:", e);
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
      observacion: `Corrección: ${motivoUpd}`,
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
      console.error("actualizarRegistro error:", e);
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
      console.error("toggleExcepcion error:", e);
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
          acts.filter(a=>a.activa&&a.dias.includes(dw)&&actsConRegistroIds.has(a.id)&&!isExc(ti.id,a.id,ds)).forEach(a=>{
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
        acts.filter(a=>a.activa&&a.dias.includes(dw)&&actsConRegistroIds.has(a.id)&&!isExc(ti.id,a.id,ds)).forEach(a=>{
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
          if(ds>hoy||!a.dias.includes(getDow(ds))||isExc(ti.id,a.id,ds)) return;
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
          acts.filter(a=>a.activa&&a.dias.includes(dw)&&actsConRegistroIds.has(a.id)&&!isExc(ti.id,a.id,ds)).forEach(a=>{
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
        return acts.some(a=>a.activa&&a.dias.includes(dw)&&actsConRegistroIds.has(a.id)&&!isExc(ti.id,a.id,ds));
      }));
      const tuvoRegistros=semanasDelMes.some(s=>s.days.some(d=>{
        const ds=dStr(vYear,vMonth,d);
        return acts.some(a=>a.activa&&a.dias.includes(getDow(ds))&&actsConRegistroIds.has(a.id)&&(()=>{
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
    onLogin={(r,n,dni)=>{setRole(r);setUName(n);setUDni(dni||"");setVerRegistradas(false);setTab(r==="viewer"?2:0);}}/>;

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
          <div style={{fontWeight:700,fontSize:16,color:"#1a2f4a",marginBottom:6}}>Domingo</div>
          <div style={{fontSize:13,color:"#8aaabb"}}>El domingo el personal administrativo descansa. Las tiendas abren el sábado.</div>
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

                      {semsVis.flatMap(s=>s.days.flatMap(d=>{
                        const wd=new Date(vYear,vMonth,d).getDay();
                        return actsActivas.filter(a=>a.activa&&a.dias.includes(wd)).map(a=>(
                          <th key={s.label+d+a.id} style={{padding:"4px 6px",textAlign:"center",color:a.c,fontWeight:700,fontSize:9,borderBottom:"1px solid #e9eef5",minWidth:44,whiteSpace:"nowrap",background:"#f8fafc",position:"sticky",top:0,lineHeight:1.3}}>
                            <span style={{color:"#8aaabb",fontWeight:700,fontSize:8,display:"block"}}>{s.label}</span>
                            <span style={{color:"#1a2f4a",fontWeight:800,fontSize:9,display:"block"}}>{DIAS_C[wd]}</span>
                            <span style={{fontSize:13,display:"block"}}>{a.e}</span>
                          </th>
                        ));
                      }))}
                      {semsVis.map(s=>(
                        <th key={"p"+s.label} style={{padding:"8px 8px",textAlign:"center",color:"#1a2f4a",fontWeight:800,fontSize:9,borderBottom:"1px solid #e9eef5",background:"#f0f4f8",minWidth:55,position:"sticky",top:0}}>
                          {s.label}<br/>EF.%
                        </th>
                      ))}
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

                          {semsVis.flatMap(sem=>sem.days.flatMap(d=>{
                            const wd=new Date(vYear,vMonth,d).getDay();
                            const ds=dStr(vYear,vMonth,d);
                            return actsActivas.filter(a=>a.activa&&a.dias.includes(wd)).map(a=>{
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
                          {/* Columna C1/C2 — distribución de cortes para esta tienda */}
                          {(()=>{
                            const hoyC=todayStr();
                            let nC1=0,nC2=0,nTotal=0;
                            semanasDelMes.forEach(s=>s.days.forEach(d=>{
                              const ds=dStr(vYear,vMonth,d);
                              if(ds>hoyC) return;
                              const dw=getDow(ds);
                              actsActivas.filter(a=>a.dias.includes(dw)&&!isExc(tr.id,a.id,ds)&&actsConRegistroIds.has(a.id)).forEach(a=>{
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
                      {semsVis.flatMap(sem=>sem.days.flatMap(d=>{
                        const wd=new Date(vYear,vMonth,d).getDay();
                        const ds=dStr(vYear,vMonth,d);
                        const hoyT=todayStr();
                        return actsActivas.filter(a=>a.activa&&a.dias.includes(wd)).map(a=>{
                          let ob=0,mx=0;
                          tsFmt.forEach(tr=>{
                            if(ds>hoyT||isExc(tr.id,a.id,ds)) return;
                            mx+=10;
                            const p=puntajeReg(getReg(ds,tr.id,a.id),getRangoActivo(a.id,ds));
                            if(p!==null) ob+=p;
                          });
                          const ef=mx>0?Math.round((ob/mx)*100):null;
                          return <td key={sem.label+d+a.id} style={{padding:"5px 6px",textAlign:"center",borderLeft:"1px solid #e9eef5"}}>
                            {mx>0?(ob>0
                              ?<span style={{fontSize:9,fontWeight:800,color:sc(ef)}}>{ob}/{mx}<br/><span style={{fontSize:8,fontWeight:400,color:"#8aaabb"}}>{ef}%</span></span>
                              :<span style={{fontSize:8,color:"#b2bec3"}}>{mx}<br/>pend.</span>
                            ):<span style={{color:"#d1d5db",fontSize:9}}>—</span>}
                          </td>;
                        });
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
    const _hoyDash = todayStr(); // B8 fix: calcular una sola vez fuera del loop
    const calcEficienciaFiltrada = (tId)=>{
      let obtenidos=0, maximos=0;
      semanasDelMes.forEach(s=>{
        s.days.forEach(day=>{
          const ds=dStr(vYear,vMonth,day);
          if(ds>_hoyDash) return; // día futuro
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
        if(ds>_hoyDash) return; // B3 fix: no contar días futuros en denominador
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

    // B4 fix: distribución horaria usando rangos reales por actividad (no hardcoded)
    let _nOro=0,_nPlata=0,_nBronce=0,_nFuera=0;
    tsBase.forEach(ti=>{
      semanasDelMes.forEach(s=>s.days.forEach(day=>{
        const ds=dStr(vYear,vMonth,day);
        if(ds>_hoyDash) return;
        const dw=getDow(ds);
        actsBase.filter(a=>a.activa&&a.dias.includes(dw)&&actsConRegistroIds.has(a.id)&&!isExc(ti.id,a.id,ds)).forEach(a=>{
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

    const exportPDF=()=>{
      // Bug 9 fix: guard para popup bloqueado por el navegador
      const w=window.open("","_blank");
      if(!w){
        showToast("❌ El navegador bloqueó el popup. Permite popups para esta página y reintenta.");
        return;
      }
      try {
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
                if(ds>_hoyDash||!a.dias.includes(getDow(ds))||isExc(ti.id,a.id,ds)) return;
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
            return actsBase.some(a=>a.dias.includes(dw)&&puntajeReg(getReg(ds,ti.id,a.id),getRangoActivo(a.id,ds))!==null);
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
                  if(ds>todayStr()||!a.dias.includes(getDow(ds))) return;
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
                    {isFuture&&<div style={{height:"100%",width:"100%",display:"flex",alignItems:"center",justifyContent:"center",fontSize:9,color:"#b2bec3",fontWeight:700,flexDirection:"column",gap:2}}><span>⏳</span><span>PENDIENTE</span></div>}
                  </div>
                  <div style={{fontSize:10,color:"#1a2f4a",fontWeight:800}}>{s.label}</div>
                  {mx>0&&!isFuture&&<div style={{fontSize:9,color:"#8aaabb",textAlign:"center",lineHeight:1.3}}>{ob}/{mx}<br/>pts</div>}
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
                    actsBase.filter(a=>a.activa&&a.dias.includes(dw)&&!isExc(ti.id,a.id,ds)&&actsConRegistroIds.has(a.id)).forEach(a=>{
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
                <div style={{fontSize:10,color:esAlerta?"#991b1b":"#1e40af",fontWeight:600,lineHeight:1.6}}>{esAlerta?"⚠️ ":"📋 "}{texto}</div>
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
                          const actsTipDia=dm?acts.filter(a=>a.activa&&a.dias.includes(getDow(ds))&&actsConRegistroIds.has(a.id)).map(a=>{
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
                actsH2.filter(a=>a.dias.includes(dw)).forEach(a=>{
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
              fc:FMT[fmt],icon:fmt==="Mayorista"?"🏭":fmt==="Supermayorista"?"🏬":"🛒"};
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
                      <span style={{fontSize:16,flexShrink:0}}>{icon}</span>
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
                      <span style={{fontSize:16,flexShrink:0}}>{icon}</span>
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
                      <span style={{fontSize:16,flexShrink:0}}>{icon}</span>
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
                      <span style={{fontSize:16,flexShrink:0}}>{icon}</span>
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
                        actsBase.filter(a=>a.activa&&a.dias.includes(dw)&&!isExc(ti.id,a.id,ds)&&actsConRegistroIds.has(a.id)).forEach(a=>{
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
                          if(ds>todayStr()||!a.dias.includes(getDow(ds))||isExc(ti.id,a.id,ds)) return;
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
  const renderConfig = ()=>(
    <div style={{padding:"16px"}}>
      <div style={{display:"flex",gap:8,marginBottom:16}}>
        {["Usuarios","Actividades","Tiendas","Auditoría","Rangos Día","Cortes Sup."].map((l,i)=>(
          <button key={i} onClick={()=>setCfgTab(i)}
            style={{flex:1,padding:"10px",borderRadius:10,border:`1.5px solid ${cfgTab===i?"#00b5b4":"#e2e8f0"}`,background:cfgTab===i?"#1a2f4a":"#fff",color:cfgTab===i?"#fff":"#5a7a9a",cursor:"pointer",fontWeight:700,fontSize:12}}>
            {l}
          </button>
        ))}
      </div>

      {cfgTab===0&&(
        <div>
          {/* Header */}
          <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:14}}>
            <div>
              <div style={{fontWeight:800,fontSize:14,color:"#1a2f4a"}}>Gestión de Usuarios</div>
              <div style={{fontSize:11,color:"#8aaabb",marginTop:2}}>
                {usuarios.filter(u=>u.activo!==false).length} activos · {usuarios.length} totales
              </div>
            </div>
            <button onClick={()=>{setShowNUsuario(true);setNewUsuario({nombre:"",rol:"auditor",email:"",telefono:"",whatsapp:"",zona:"",area:"",dni:"",editId:null});}}
              style={{padding:"9px 16px",borderRadius:10,border:"none",background:"#1a2f4a",color:"#fff",cursor:"pointer",fontWeight:700,fontSize:12,display:"flex",alignItems:"center",gap:6}}>
              ＋ Nuevo usuario
            </button>
          </div>

          {/* Buscador */}
          <div style={{position:"relative",marginBottom:14}}>
            <span style={{position:"absolute",left:12,top:"50%",transform:"translateY(-50%)",fontSize:13,color:"#8aaabb"}}>🔍</span>
            <input placeholder="Buscar usuario..." value={busqUsuario||""} onChange={e=>setBusqUsuario(e.target.value)}
              style={{...S.inp,paddingLeft:36,fontSize:13}}/>
          </div>

          {/* Form nuevo/editar usuario */}
          {showNUsuario&&(
            <div style={{...S.card,padding:"16px",marginBottom:16,border:"1.5px solid #00b5b4"}}>
              <div style={{fontWeight:800,fontSize:13,color:"#1a2f4a",marginBottom:12}}>
                {newUsuario.editId?"✏️ Editar usuario":"＋ Nuevo usuario"}
              </div>
              <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10,marginBottom:10}}>
                <div>
                  <label style={S.lbl}>NOMBRE COMPLETO *</label>
                  <input value={newUsuario.nombre} onChange={e=>setNewUsuario(p=>({...p,nombre:e.target.value}))}
                    placeholder="Ej: Roberto Ruesta" style={S.inp}/>
                </div>
                <div>
                  <label style={S.lbl}>DNI / CE / RUC / CREDENCIAL *</label>
                  <input type="text" value={newUsuario.dni||""} onChange={e=>setNewUsuario(p=>({...p,dni:e.target.value.replace(/[^a-zA-Z0-9]/g,"").slice(0,12).toUpperCase()}))}
                    placeholder="DNI/CE/RUC/código" maxLength={12} style={{...S.inp,letterSpacing:2,fontFamily:"monospace"}}/>
                  <div style={{fontSize:9,color:"#8aaabb",marginTop:2}}>DNI (8) · CE/pasaporte (hasta 12) · alfanumérico</div>
                </div>
                <div>
                  <label style={S.lbl}>EMAIL (opcional)</label>
                  <input type="email" value={newUsuario.email||""} onChange={e=>setNewUsuario(p=>({...p,email:e.target.value}))}
                    placeholder="nombre@empresa.pe" style={S.inp}/>
                </div>
                <div>
                  <label style={S.lbl}>TELÉFONO (opcional)</label>
                  <input type="tel" value={newUsuario.telefono||""} onChange={e=>setNewUsuario(p=>({...p,telefono:e.target.value}))}
                    placeholder="+51 999 999 999" style={S.inp}/>
                </div>
                <div>
                  <label style={S.lbl}>WHATSAPP (con código país)</label>
                  <input type="tel" value={newUsuario.whatsapp||""} onChange={e=>setNewUsuario(p=>({...p,whatsapp:e.target.value.replace(/[^0-9]/g,"").slice(0,15)}))}
                    placeholder="51987654321" style={S.inp}/>
                </div>
                <div>
                  <label style={S.lbl}>ZONA (jefe zonal)</label>
                  <input value={newUsuario.zona||""} onChange={e=>setNewUsuario(p=>({...p,zona:e.target.value}))}
                    placeholder="Ej: Zona Norte, Zona Sur..." style={S.inp}/>
                </div>
                <div>
                  <label style={S.lbl}>ÁREA / EQUIPO (opcional)</label>
                  <input value={newUsuario.area||""} onChange={e=>setNewUsuario(p=>({...p,area:e.target.value}))}
                    placeholder="Ej: Trade Marketing" style={S.inp}/>
                </div>
                <div>
                  <label style={S.lbl}>ROL *</label>
                  <div style={{display:"flex",gap:6}}>
                    {[{r:"admin",l:"Admin",c:"#f6a623"},{r:"auditor",l:"Auditor",c:"#00b5b4"},{r:"viewer",l:"Visor",c:"#74b9ff"}].map(({r,l,c})=>(
                      <button key={r} onClick={()=>setNewUsuario(p=>({...p,rol:r}))}
                        style={{flex:1,padding:"9px 4px",borderRadius:9,border:`1.5px solid ${newUsuario.rol===r?c:"#e2e8f0"}`,background:newUsuario.rol===r?c+"22":"#fff",color:newUsuario.rol===r?c:"#5a7a9a",cursor:"pointer",fontSize:11,fontWeight:700}}>
                        {l}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
              {/* Nota: el DNI es la credencial de acceso para todos los roles */}
              {newUsuario.rol!=="auditor"&&(
                <div style={{marginBottom:10,padding:"11px 14px",background:newUsuario.dni&&newUsuario.dni.length>=4?"#e0fafa":"#fff8ec",borderRadius:10,border:`1.5px solid ${newUsuario.dni&&newUsuario.dni.length>=4?"#00b5b4":"#f6a623"}`}}>
                  <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:4}}>
                    {/* Candado: cerrado+rojo si DNI vacío, abierto+verde si completo */}
                    {newUsuario.dni&&newUsuario.dni.length>=4
                      ? <span style={{display:"inline-flex",alignItems:"center",justifyContent:"center",width:22,height:22,borderRadius:"50%",background:"#e8faf5",border:"1.5px solid #00b894",fontSize:12,flexShrink:0}}>✓</span>
                      : <span style={{display:"inline-flex",alignItems:"center",justifyContent:"center",width:22,height:22,borderRadius:"50%",background:"#fff1f2",border:"1.5px solid #ef4444",fontSize:12,flexShrink:0}}>🔒</span>
                    }
                    <div style={{fontSize:11,fontWeight:700,color:newUsuario.dni&&newUsuario.dni.length>=4?"#0d7a79":"#854F0B"}}>
                      {newUsuario.dni&&newUsuario.dni.length>=4?"🔑 Credencial lista":"⚠️ Ingresa la credencial primero"}
                    </div>
                  </div>
                  <div style={{fontSize:11,color:newUsuario.dni&&newUsuario.dni.length>=4?"#0d7a79":"#854F0B",lineHeight:1.5}}>
                    {newUsuario.dni&&newUsuario.dni.length>=4
                      ? <>El código de acceso será <strong style={{fontFamily:"monospace",letterSpacing:2}}>{newUsuario.dni}</strong>. Al iniciar sesión debe ingresar este número.</>
                      : "La credencial (mín. 4 chars) será el código de acceso al sistema."
                    }
                  </div>
                </div>
              )}
              <div style={{display:"flex",gap:8,marginTop:4}}>
                <button onClick={async()=>{
                  if(!newUsuario.nombre.trim()) return showToast("⚠️ Ingresa el nombre");
                  if(!newUsuario.dni||newUsuario.dni.length<4) return showToast("⚠️ La credencial debe tener al menos 4 caracteres");
                  if(newUsuario.editId){
                    await setDoc(doc(db,"usuarios",newUsuario.editId),{
                      nombre:newUsuario.nombre.trim(),rol:newUsuario.rol,
                      dni:newUsuario.dni,email:newUsuario.email||"",telefono:newUsuario.telefono||"",
                      whatsapp:newUsuario.whatsapp||"",zona:newUsuario.zona||"",
                      area:newUsuario.area||"",activo:true,
                    },{merge:true});
                    showToast("✅ Usuario actualizado");
                  } else {
                    // Verificar DNI duplicado
                    if(usuarios.some(u=>u.dni===newUsuario.dni&&u.id!==newUsuario.editId)) return showToast("⚠️ DNI ya registrado");
                    const ref=doc(collection(db,"usuarios"));
                    await setDoc(ref,{
                      nombre:newUsuario.nombre.trim(),rol:newUsuario.rol,
                      dni:newUsuario.dni,email:newUsuario.email||"",telefono:newUsuario.telefono||"",
                      whatsapp:newUsuario.whatsapp||"",zona:newUsuario.zona||"",
                      area:newUsuario.area||"",activo:true,ultimoAcceso:null,
                    });
                    showToast("✅ Usuario registrado · el DNI es su código de acceso");
                  }
                  setShowNUsuario(false);
                  setNewUsuario({nombre:"",rol:"auditor",email:"",telefono:"",whatsapp:"",zona:"",area:"",dni:"",editId:null});
                }} style={{flex:1,padding:"11px",borderRadius:10,border:"none",background:"linear-gradient(135deg,#00b5b4,#1a2f4a)",color:"#fff",cursor:"pointer",fontWeight:700,fontSize:13}}>
                  {newUsuario.editId?"Guardar cambios":"Registrar usuario"}
                </button>
                <button onClick={()=>{setShowNUsuario(false);setNewUsuario({nombre:"",rol:"auditor",email:"",telefono:"",whatsapp:"",zona:"",area:"",dni:"",editId:null});}}
                  style={{padding:"11px 18px",borderRadius:10,border:"1px solid #e2e8f0",background:"#fff",color:"#5a7a9a",cursor:"pointer",fontSize:13}}>Cancelar</button>
              </div>
            </div>
          )}

          {/* Lista de usuarios */}
          {(()=>{
            const filtrados=(busqUsuario||"")
              ?usuarios.filter(u=>u.nombre?.toLowerCase().includes(busqUsuario.toLowerCase())||u.dni?.includes(busqUsuario)||u.email?.toLowerCase().includes(busqUsuario.toLowerCase()))
              :usuarios;
            if(!filtrados.length) return(
              <div style={{textAlign:"center",padding:"32px",color:"#8aaabb",fontSize:13}}>
                {busqUsuario?"Sin resultados para esa búsqueda":"Sin usuarios registrados. Crea el primero con ＋ Nuevo usuario."}
              </div>
            );
            const ROL_CFG={
              admin: {label:"Admin",c:"#f6a623",bg:"#fff8ec",icon:"👑"},
              auditor:{label:"Auditor",c:"#00b5b4",bg:"#e0fafa",icon:"🪪"},
              viewer: {label:"Visor",c:"#74b9ff",bg:"#e8f4fd",icon:"👁️"},
            };
            return filtrados.map(u=>{
              const rc=ROL_CFG[u.rol]||{label:u.rol,c:"#8aaabb",bg:"#f0f4f8",icon:"👤"};
              const initials=(u.nombre||"?").split(" ").slice(0,2).map(w=>w[0]).join("").toUpperCase();
              return(
              <div key={u.id} style={{...S.card,padding:"12px 16px",marginBottom:8,display:"flex",alignItems:"center",gap:12,opacity:u.activo===false?.5:1,transition:"opacity .2s"}}>
                {/* Avatar */}
                <div style={{width:42,height:42,borderRadius:12,background:rc.bg,border:`1.5px solid ${rc.c}33`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:14,fontWeight:800,color:rc.c,flexShrink:0,fontFamily:"'Syne',sans-serif"}}>
                  {initials}
                </div>
                {/* Info */}
                <div style={{flex:1,minWidth:0}}>
                  <div style={{fontWeight:700,fontSize:13,color:u.activo===false?"#94a3b8":"#1a2f4a",display:"flex",alignItems:"center",gap:6}}>
                    {u.nombre}
                    {u.activo===false&&<span style={{fontSize:9,color:"#dc2626",background:"#fff1f2",padding:"1px 6px",borderRadius:10,fontWeight:700}}>PAUSADO</span>}
                  </div>
                  <div style={{fontSize:10,color:"#8aaabb",marginTop:2,display:"flex",gap:8,flexWrap:"wrap",alignItems:"center"}}>
                    <span style={{fontFamily:"monospace"}}>DNI: ••••{(u.dni||"").slice(-3)}</span>
                    {u.email&&<span style={{color:"#0984e3"}}>{u.email}</span>}
                    {u.area&&<span style={{background:"#f0edff",color:"#6c5ce7",padding:"1px 7px",borderRadius:10,fontWeight:700}}>{u.area}</span>}
                    {u.telefono&&<span>{u.telefono}</span>}
                    {u.ultimoAcceso&&<span>· Último: {new Date(u.ultimoAcceso).toLocaleDateString("es-PE")}</span>}
                  </div>
                </div>
                {/* Rol selector */}
                <select value={u.rol} onChange={async e=>{
                  const newRol=e.target.value;
                  await setDoc(doc(db,"usuarios",u.id),{rol:newRol},{merge:true});
                  showToast(`✅ Rol actualizado a ${newRol}`);
                }} style={{padding:"6px 10px",borderRadius:9,border:`1.5px solid ${rc.c}55`,background:rc.bg,color:rc.c,fontSize:11,fontWeight:700,cursor:"pointer",outline:"none"}}>
                  <option value="admin">👑 Admin</option>
                  <option value="auditor">🪪 Auditor</option>
                  <option value="viewer">👁️ Visor</option>
                </select>
                {/* Edit */}
                <button onClick={()=>{
                  setNewUsuario({nombre:u.nombre,rol:u.rol,email:u.email||"",telefono:u.telefono||"",whatsapp:u.whatsapp||"",zona:u.zona||"",area:u.area||"",dni:u.dni||"",editId:u.id});
                  setShowNUsuario(true);
                }} style={{padding:"7px 10px",borderRadius:9,border:"1.5px solid #c8d8e8",background:"#f8fafc",color:"#5a7a9a",cursor:"pointer",fontSize:14}}>✏️</button>
                {/* Pausar/Activar */}
                <button onClick={async()=>{
                  await setDoc(doc(db,"usuarios",u.id),{activo:u.activo===false},{merge:true});
                  showToast(u.activo===false?"✅ Usuario activado":"⏸ Usuario pausado");
                }} style={{padding:"6px 12px",borderRadius:9,border:`1px solid ${u.activo===false?"#bbf7d0":"#fecaca"}`,background:u.activo===false?"#f0fdf4":"#fff1f2",color:u.activo===false?"#16a34a":"#dc2626",cursor:"pointer",fontSize:11,fontWeight:700}}>
                  {u.activo===false?"Activar":"Pausar"}
                </button>
                {/* Eliminar */}
                <button onClick={()=>{if(window.confirm(`¿Eliminar a ${u.nombre}? Esta acción no se puede deshacer.`)) deleteUsuario(u.id);}}
                  style={{padding:"7px 10px",borderRadius:9,border:"1.5px solid #fecaca",background:"#fff1f2",color:"#dc2626",cursor:"pointer",fontSize:14}}>🗑️</button>
              </div>
              );
            });
          })()}
        </div>
      )}

      {cfgTab===1&&(
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

      {cfgTab===2&&(
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
                {ts.map(ti=>{
                  const zonalU=usuarios.find(u=>u.id===ti.zonaId);
                  return(
                  <div key={ti.id} style={{...S.card,marginBottom:6,opacity:ti.activa?1:.55}}>
                    <div style={{padding:"9px 14px",display:"flex",alignItems:"center",justifyContent:"space-between",gap:8}}>
                      <div style={{flex:1,minWidth:0}}>
                        <div style={{fontWeight:700,fontSize:12,color:ti.activa?"#1a2f4a":"#94a3b8"}}>Vega {ti.n}</div>
                        <div style={{fontSize:10,color:"#8aaabb",display:"flex",gap:6,flexWrap:"wrap",marginTop:2}}>
                          {ti.email&&<span>✉ {ti.email}</span>}
                          {zonalU&&<span>👤 {zonalU.nombre}</span>}
                        </div>
                      </div>
                      <div style={{display:"flex",gap:5,flexShrink:0}}>
                        <button onClick={()=>setTiendaEditModal({...ti})}
                          style={{padding:"4px 10px",borderRadius:8,border:"1px solid #c8d8e8",background:"#f8fafc",color:"#5a7a9a",cursor:"pointer",fontSize:10,fontWeight:700}}>✏️ Editar</button>
                        <button onClick={()=>setTiendas(p=>{const np=p.map(x=>x.id===ti.id?{...x,activa:!x.activa}:x);saveConfig({tiendas:np});return np;})}
                          style={{padding:"4px 10px",borderRadius:8,border:`1px solid ${ti.activa?"#fecaca":"#bbf7d0"}`,background:ti.activa?"#fff1f2":"#f0fdf4",color:ti.activa?"#dc2626":"#16a34a",cursor:"pointer",fontSize:10,fontWeight:700}}>
                          {ti.activa?"Cerrar":"Activar"}
                        </button>
                      </div>
                    </div>
                  </div>
                  );
                })}
              </div>
            );
          })}
        </div>
      )}





{cfgTab===3&&(()=>{
        // ── Historial de auditorías de campo ──
        const auditList=Object.values(auditorias).sort((a,b)=>(b.fecha||"").localeCompare(a.fecha||""));
        const auditFiltrados=auditFiltroFmt==="Todos"?auditList:auditList.filter(a=>tiendas.find(t=>t.id===a.tiendaId)?.f===auditFiltroFmt);
        const tier=getTierAuditoria;
        return(
        <div>
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
                            <button onClick={()=>setAuditDetalle(auditDetalle?.id===a.id?null:a)}
                              style={{padding:"3px 10px",borderRadius:8,border:"1px solid #c8d8e8",background:"#f8fafc",color:"#5a7a9a",cursor:"pointer",fontSize:10,fontWeight:700}}>
                              {auditDetalle?.id===a.id?"▲ Cerrar":"▼ Ver"}
                            </button>
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
                    const sc2=sm.score;
                    const tr2=tier(sc2?.pct);
                    return(
                      <div key={i} style={{background:"#fff",borderRadius:8,padding:"10px 12px",border:"0.5px solid #e2e8f0"}}>
                        <div style={{fontSize:10,color:"#8aaabb",marginBottom:4}}>{sm.moduloLabel}</div>
                        <div style={{fontSize:15,fontWeight:700,color:tr2.c}}>{sc2?`${sc2.ob}/${sc2.mx}`:"—"}</div>
                        <div style={{fontSize:10,color:tr2.c}}>{sc2?`${sc2.pct}% · ${tr2.label}`:""}</div>
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
{cfgTab===4&&(
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
      {cfgTab===5&&(
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
                  Desde <strong>{(()=>{const[h,m]=cortesSupervision.c1.split(":").map(Number);const nx=h*60+m+1;return String(Math.floor(nx/60)).padStart(2,"0")+":"+String(nx%60).padStart(2,"0");})()}</strong> hasta:
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
          actsBase.filter(a => a.dias.includes(dw) && !isExc(tId, a.id, ds) && actsConRegistroIds.has(a.id)).forEach(a => {
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
                    if(ds>hoy||!a.dias.includes(getDow(ds))) return;
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
                      {isFut&&<div style={{width:"100%",height:"100%",display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",gap:1}}><span style={{fontSize:9,color:"#b2bec3"}}>⏳</span><span style={{fontSize:8,color:"#b2bec3",fontWeight:700}}>PEND.</span></div>}
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
                  <span style={{fontSize:13,flexShrink:0}}>{fmt==="Mayorista"?"🏭":fmt==="Supermayorista"?"🏬":"🛒"}</span>
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
              acts.filter(a=>a.activa&&a.dias.includes(dw)&&!isExc(ti.id,a.id,ds)&&actsConRegistroIds.has(a.id)).forEach(a=>{
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
                acts.filter(a=>a.activa&&a.dias.includes(dw)&&!isExc(ti.id,a.id,ds)&&actsConRegistroIds.has(a.id)).forEach(a=>{
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
          const fmtIcon=fmt==="Mayorista"?"🏭":fmt==="Supermayorista"?"🏬":"🛒";
          return{fmt,fmtIcon,fcfg,nd,nr,fo,fp,ff,fNR};
        }).filter(f=>f.nd>0);

        return(
        <div style={{borderRadius:14,overflow:"hidden",marginBottom:10,border:"1px solid #e2e8f0",boxShadow:"0 2px 8px rgba(0,0,0,.04)"}}>
          <div style={{background:"#0d4f6e",padding:"10px 16px",display:"flex",alignItems:"center",gap:10}}>
            <div style={{width:28,height:28,borderRadius:8,background:"rgba(255,255,255,.15)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:14,flexShrink:0}}>🏪</div>
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
                <span style={{fontSize:13,flexShrink:0}}>{fmtIcon}</span>
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

  const tabs = isAdmin
    ? [{i:0,label:"📋 Registro"},{i:1,label:"📊 Reporte"},{i:2,label:"📈 Dashboard"},{i:3,label:"⚙️ Config"},{i:4,label:"🔍 Auditoría"}]
    : isAuditor
    ? [{i:0,label:"📋 Registro"},{i:1,label:"📊 Reporte"},{i:2,label:"📈 Dashboard"},{i:4,label:"🔍 Auditoría"}]
    : [{i:1,label:"📊 Reporte"},{i:2,label:"📈 Panel"}];

  return (
    <div style={S.wrap}>
      <link href="https://fonts.googleapis.com/css2?family=DM+Sans:opsz,wght@9..40,400;9..40,600;9..40,700&family=Syne:wght@700;800&display=swap" rel="stylesheet"/>
      <style>{`*{box-sizing:border-box;} .vr-table{overflow-x:auto;-webkit-overflow-scrolling:touch;} .vr-table table{min-width:480px;} @media(max-width:480px){.vr-2col{grid-template-columns:1fr!important;}.vr-4kpi{grid-template-columns:repeat(2,1fr)!important;}} button,select,input[type=date]{touch-action:manipulation;min-height:36px;} .vr-pill{white-space:nowrap;flex-shrink:0;}`}</style>
      {/* HEADER */}
      <div style={S.hdr}>
        <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:10,flexWrap:"wrap"}}>
          <div style={{width:34,height:34,borderRadius:10,background:"linear-gradient(135deg,#00b5b4,#0984e3)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:18}}>🏪</div>
          <div style={{flex:1}}>
            <div style={{fontFamily:"'Syne',sans-serif",fontWeight:800,fontSize:15,color:"#fff"}}>VEGA · EVIDENCIAS</div>
            <div style={{fontSize:9,color:"rgba(255,255,255,.4)",letterSpacing:".06em"}}>CONTROL DE IMPLEMENTACIÓN</div>
          </div>
          <input type="date" value={fecha}
            onChange={e=>{
              const d=e.target.value;
              // Auditor: solo puede registrar hoy (no fechas pasadas ni futuras)
              if(!isAdmin&&d!==todayStr()) return;
              setFecha(d);setActSel(null);setPaso(1);setTSel(new Set());setRango(null);
            }}
            disabled={isViewer}
            title={isViewer?"El visor no puede cambiar la fecha":isAdmin?"Cambiar fecha (Admin)":"Cambiar fecha para consultar históricos"}
            style={{padding:"5px 9px",borderRadius:7,border:"1px solid rgba(255,255,255,.2)",background:"rgba(255,255,255,.1)",color:"#fff",fontSize:11,outline:"none",opacity:isViewer?0.5:1}}/>
          <div style={{display:"flex",alignItems:"center",gap:6,padding:"4px 10px",borderRadius:20,background:"rgba(255,255,255,.1)"}}>
            <span style={{fontSize:12}}>{isAdmin?"👑":isAuditor?"📋":"👁️"}</span>
            <span style={{fontSize:11,color:"#fff",fontWeight:700}}>{uName}</span>
          </div>
          {isAdmin&&<button onClick={()=>exportPDFRef.current?.()} style={{padding:"5px 10px",borderRadius:7,border:"1px solid rgba(255,255,255,.2)",background:"rgba(255,255,255,.08)",color:"rgba(255,255,255,.7)",cursor:"pointer",fontSize:10,fontWeight:700}}>📄 PDF</button>}

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
      {tab===2&&(isViewer?renderViewerDash():renderDashboard())}
      {tab===3&&isAdmin&&renderConfig()}
      {tab===4&&isAuditor&&(
        <PantallaAuditoria
          paso={auditPaso} tiendas={tiendas} tiendaSelId={auditTiendaSel}
          modulos={checklistModulos} respuestas={auditRespuestas} moduloActivo={auditModuloActivo}
          obs={auditObs} compromisos={auditCompromisos} gpsCheckIn={auditGPS}
          onCheckIn={auditCheckIn}
          onValor={(itemId,val)=>setAuditRespuestas(prev=>({...prev,[itemId]:{...prev[itemId],valor:val}}))}
          onObsItem={(itemId,obs)=>setAuditRespuestas(prev=>({...prev,[itemId]:{...prev[itemId],obs}}))}
          onObsModulo={(mId,obs)=>setAuditRespuestas(prev=>({...prev,[`__obs_${mId}`]:{obs}}))}
          onSiguienteModulo={()=>{
            const n=checklistModulos.filter(m=>m.activo).length;
            if(auditModuloActivo<n-1) setAuditModuloActivo(p=>p+1);
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
        />
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
            <div style={{fontWeight:800,fontSize:16,color:"#1a2f4a",marginBottom:4}}>✅ Auditoría enviada</div>
            <div style={{fontSize:12,color:"#8aaabb",marginBottom:16}}>El reporte está listo para enviar por correo a los responsables de la tienda.</div>
            {auditEmailModal.to?(
              <div style={{marginBottom:10,padding:"8px 12px",background:"#e8f4fd",borderRadius:8}}>
                <div style={{fontSize:10,fontWeight:700,color:"#0984e3",marginBottom:2}}>DESTINATARIOS</div>
                <div style={{fontSize:12,color:"#1a2f4a"}}>{auditEmailModal.to}</div>
              </div>
            ):(
              <div style={{marginBottom:10,padding:"8px 12px",background:"#fff8ec",borderRadius:8,border:"1px solid #FAC775"}}>
                <div style={{fontSize:11,color:"#854F0B"}}>⚠️ La tienda no tiene email ni jefe zonal configurado. Puedes editar la tienda en Config → Tiendas.</div>
              </div>
            )}
            <div style={{marginBottom:10,padding:"8px 12px",background:"#f8fafc",borderRadius:8}}>
              <div style={{fontSize:10,fontWeight:700,color:"#5a7a9a",marginBottom:2}}>ASUNTO</div>
              <div style={{fontSize:12,color:"#1a2f4a"}}>{auditEmailModal.subject}</div>
            </div>
            <div style={{marginBottom:16,padding:"10px 12px",background:"#f8fafc",borderRadius:8,border:"1px solid #e2e8f0",maxHeight:200,overflowY:"auto"}}>
              <pre style={{fontSize:11,color:"#1a2f4a",whiteSpace:"pre-wrap",fontFamily:"system-ui,sans-serif",margin:0,lineHeight:1.6}}>{auditEmailModal.body}</pre>
            </div>
            <div style={{display:"flex",gap:8}}>
              <a href={`mailto:${auditEmailModal.to||""}?subject=${encodeURIComponent(auditEmailModal.subject)}&body=${auditEmailModal.body.replace(/\n/g,"%0A").replace(/&/g,"%26")}`}
                style={{flex:1,padding:"13px",borderRadius:12,background:"linear-gradient(135deg,#00b5b4,#1a2f4a)",color:"#fff",textAlign:"center",fontWeight:800,fontSize:14,textDecoration:"none",display:"block"}}
                onClick={()=>setAuditEmailModal(null)}>
                ✉️ Abrir Outlook
              </a>
              <button onClick={()=>setAuditEmailModal(null)}
                style={{padding:"13px 20px",borderRadius:12,border:"1px solid #e2e8f0",background:"#fff",color:"#5a7a9a",cursor:"pointer",fontWeight:700,fontSize:13}}>
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL EDITAR TIENDA */}
      {tiendaEditModal&&(()=>{
        const zonales=usuarios.filter(u=>u.activo!==false);
        return(
        <div style={{position:"fixed",inset:0,background:"rgba(26,47,74,.75)",display:"flex",alignItems:"center",justifyContent:"center",zIndex:90,padding:16}}
          onClick={()=>setTiendaEditModal(null)}>
          <div onClick={e=>e.stopPropagation()}
            style={{background:"#fff",borderRadius:20,padding:24,width:"100%",maxWidth:420,boxShadow:"0 8px 40px rgba(0,0,0,.25)",maxHeight:"90vh",overflowY:"auto"}}>
            <div style={{fontWeight:800,fontSize:15,color:"#1a2f4a",marginBottom:16}}>✏️ Vega {tiendaEditModal.n}</div>
            <div style={{marginBottom:12}}>
              <label style={S.lbl}>EMAIL ENCARGADO</label>
              <input type="email" value={tiendaEditModal.email||""} onChange={e=>setTiendaEditModal(p=>({...p,email:e.target.value}))}
                placeholder="encargado@corporacionvega.pe" style={S.inp}/>
            </div>
            <div style={{marginBottom:12}}>
              <label style={S.lbl}>WHATSAPP TIENDA (con código país)</label>
              <input type="tel" value={tiendaEditModal.whatsapp||""} onChange={e=>setTiendaEditModal(p=>({...p,whatsapp:e.target.value.replace(/[^0-9]/g,"").slice(0,15)}))}
                placeholder="51987654321" style={S.inp}/>
            </div>
            <div style={{marginBottom:16}}>
              <label style={S.lbl}>JEFE ZONAL ASIGNADO</label>
              <select value={tiendaEditModal.zonaId||""} onChange={e=>setTiendaEditModal(p=>({...p,zonaId:e.target.value}))}
                style={{...S.inp,padding:"10px 12px"}}>
                <option value="">— Sin asignar —</option>
                {zonales.map(u=>(
                  <option key={u.id} value={u.id}>{u.nombre} ({u.rol}){u.zona?` · ${u.zona}`:""}</option>
                ))}
              </select>
            </div>
            <div style={{display:"flex",gap:8}}>
              <button onClick={()=>{
                setTiendas(p=>{
                  const np=p.map(x=>x.id===tiendaEditModal.id?{...x,email:tiendaEditModal.email||"",whatsapp:tiendaEditModal.whatsapp||"",zonaId:tiendaEditModal.zonaId||""}:x);
                  saveConfig({tiendas:np});return np;
                });
                showToast("✅ Tienda actualizada");
                setTiendaEditModal(null);
              }} style={{flex:1,padding:"12px",borderRadius:12,border:"none",background:"linear-gradient(135deg,#00b5b4,#1a2f4a)",color:"#fff",cursor:"pointer",fontWeight:800,fontSize:13}}>
                Guardar
              </button>
              <button onClick={()=>setTiendaEditModal(null)}
                style={{padding:"12px 18px",borderRadius:12,border:"1px solid #e2e8f0",background:"#fff",color:"#5a7a9a",cursor:"pointer",fontSize:13}}>
                Cancelar
              </button>
            </div>
          </div>
        </div>
        );
      })()}

      {pinMod&&<PinModal pins={pins} onSave={p=>{setPins(p);saveConfig({pins:p});setPinMod(false);}} onClose={()=>setPinMod(false)}/>}
      {showStatusCard&&(()=>{
        // Issue 4 fix: usar la fecha seleccionada por el auditor, no siempre "hoy"
        const hoy=fecha; // fecha = estado seleccionado en el header (puede ser distinto a todayStr())
        const fmts=[
          {fmt:"Mayorista",    icon:"🏭"},
          {fmt:"Supermayorista",icon:"🏬"},
          {fmt:"Market",       icon:"🛒"},
        ];
        const actsHoy=acts.filter(a=>a.activa&&a.dias.includes(getDow(hoy)));
        // actsRef debe declararse ANTES de cualquier uso
        const actsConRegHoy=actsHoy.filter(a=>tiAct.some(ti=>{
          const reg=getReg(hoy,ti.id,a.id);
          return reg?.evidencias?.length>0&&!reg?.anulado&&reg?.fecha===hoy;
        }));
        const actsRefCard=actsConRegHoy.length>0?actsConRegHoy:actsHoy;
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
                <span style={{fontSize:"clamp(14px,2.5vw,18px)",lineHeight:1.1,marginTop:0}}>📁</span>
                <div>
                  <div style={{fontFamily:"'Syne',sans-serif",fontWeight:800,fontSize:"clamp(14px,2.5vw,18px)",color:"#1a2f4a",letterSpacing:".03em",lineHeight:1.1}}>ESTADO DE REGISTROS</div>
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
                      📋 Operativo
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

            {/* ── VISTA GERENCIAL ── */}
            {statusCardView==="gerencial"&&isAdmin&&(()=>{
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
                    <span style={{fontSize:15,flexShrink:0}}>{icon}</span>
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
            {statusCardView==="operativo"&&<>
            {/* ── Actividades con registros hoy — detecta A/B automáticamente ── */}
            {(()=>{
              const actsConRegHoy=actsHoy.filter(a=>tiAct.some(ti=>{
                const reg=getReg(hoy,ti.id,a.id);
                return reg?.evidencias?.length>0&&!reg?.anulado&&reg?.fecha===hoy;
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
              <span style={{padding:"2px 8px",borderRadius:20,fontSize:"clamp(10px,2.8vw,12px)",fontWeight:700,color:totalPend>0?"#0984e3":"#b2bec3",background:totalPend>0?"#e8f4fd":"#f4f6f8",whiteSpace:"nowrap"}}>⏳ {totalPend} pendientes</span>
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
                // Para escenario B: calcular desglose por actividad
                const actsConRegHoy=actsHoy.filter(a=>tiAct.some(ti=>{
                  const reg=getReg(hoy,ti.id,a.id);
                  return reg?.evidencias?.length>0&&!reg?.anulado&&reg?.fecha===hoy;
                }));
                const esParalelo=actsConRegHoy.length>1;
                return(
                <div key={fmt+"b1"} style={{marginBottom:8,padding:"8px 12px",background:"#FFF8EC",borderRadius:10,border:"0.5px solid #FAC775"}}>
                  <div style={{display:"flex",alignItems:"center",gap:6,flexWrap:"wrap"}}>
                    <div style={{display:"flex",alignItems:"center",gap:4,flexShrink:0}}>
                      <span style={{fontSize:"clamp(13px,2vw,16px)"}}>{icon}</span>
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
                    {esParalelo&&actsConRegHoy.map(a=>{
                      const tsFmt=tiAct.filter(ti=>ti.f===fmt&&!actsConRegHoy.every(aa=>isExc(ti.id,aa.id,hoy)));
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
                const actsConRegHoy=actsHoy.filter(a=>tiAct.some(ti=>{
                  const reg=getReg(hoy,ti.id,a.id);
                  return reg?.evidencias?.length>0&&!reg?.anulado&&reg?.fecha===hoy;
                }));
                const esParalelo=actsConRegHoy.length>1;
                return(
                <div key={fmt+"b2"} style={{marginBottom:8,padding:"8px 12px",background:"#FFF8F8",borderRadius:10,border:"0.5px solid #F7C1C1"}}>
                  <div style={{display:"flex",alignItems:"center",gap:6,flexWrap:"wrap"}}>
                    <div style={{display:"flex",alignItems:"center",gap:4,flexShrink:0}}>
                      <span style={{fontSize:"clamp(13px,2vw,16px)"}}>{icon}</span>
                      <span style={{fontWeight:700,color:"#1a2f4a",fontSize:"clamp(11px,2vw,13px)",whiteSpace:"nowrap"}}>{fmt}</span>
                    </div>
                    {!esParalelo&&<>
                      <span style={{padding:"2px 8px",borderRadius:20,fontSize:"clamp(9px,1.6vw,11px)",fontWeight:700,color:"#74b9ff",background:"#e8f4fd",whiteSpace:"nowrap",flexShrink:0}}>✅ {String(b.registradas).padStart(2,"0")} reg.</span>
                      {b.horaMin&&<span style={{fontSize:"clamp(9px,1.5vw,11px)",color:"#8aaabb",fontWeight:500,whiteSpace:"nowrap",flexShrink:0}}>({b.horaMin}{b.horaMax&&b.horaMax!==b.horaMin?` a ${b.horaMax}`:""})</span>}
                      <span style={{padding:"2px 8px",borderRadius:20,fontSize:"clamp(9px,1.6vw,11px)",fontWeight:700,color:b.pendientes>0?"#A32D2D":"#888780",background:b.pendientes>0?"#FCEBEB":"#F1EFE8",whiteSpace:"nowrap",flexShrink:0}}>⏰ {String(b.pendientes).padStart(2,"0")} pend.</span>
                      {b.excluidas>0&&<span style={{padding:"2px 8px",borderRadius:20,fontSize:"clamp(9px,1.6vw,11px)",fontWeight:700,color:"#854F0B",background:"#FAEEDA",whiteSpace:"nowrap",flexShrink:0}}>⛔ {b.excluidas}</span>}
                    </>}
                    {esParalelo&&actsConRegHoy.map(a=>{
                      const rango=getRangoActivo(a.id,hoy);
                      const tsFmt=tiAct.filter(ti=>ti.f===fmt&&!actsConRegHoy.every(aa=>isExc(ti.id,aa.id,hoy)));
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
      {excModal&&(()=>{
        const [excComentario, setExcComentario] = [excModal._comentario||"", (v)=>setExcModal(m=>({...m,_comentario:v}))];
        const [excApplyAll,   setExcApplyAll]   = [excModal._applyAll||false, (v)=>setExcModal(m=>({...m,_applyAll:v}))];
        const comentario = excModal._comentario??excModal.comentarioActual??"";
        const applyAll   = excModal._applyAll??false;
        const semActiva  = semanasDelMes.find(s=>s.days.some(d=>dStr(vYear,vMonth,d)===fecha));
        const fechasPreview = semActiva
          ? semActiva.days.map(d=>dStr(vYear,vMonth,d))
          : [fecha];
        return(
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
              value={comentario}
              onChange={e=>setExcModal(m=>({...m,_comentario:e.target.value}))}
              placeholder="Ej: Tienda en remodelación, sin operación esta semana..."
              rows={3}
              style={{width:"100%",padding:"11px 13px",borderRadius:10,border:`1.5px solid ${comentario?"#00b5b4":"#c8d8e8"}`,background:"#f8fafc",color:"#1a2f4a",fontSize:13,outline:"none",resize:"vertical",boxSizing:"border-box",fontFamily:"inherit",lineHeight:1.5}}
            />
            <div style={{fontSize:9,color:"#b2bec3",marginTop:3,marginBottom:14}}>{comentario.length}/200 caracteres · opcional pero recomendado</div>

            {/* Checkbox aplicar a toda la semana — solo si es nueva exclusión */}
            {!excModal.estaExcluida&&semActiva&&(
              <div style={{marginBottom:18}}>
                <label style={{display:"flex",alignItems:"flex-start",gap:10,cursor:"pointer",padding:"11px 13px",background:applyAll?"#e0fafa":"#f8fafc",borderRadius:10,border:`1.5px solid ${applyAll?"#00b5b4":"#e2e8f0"}`,transition:"all .15s"}}>
                  <input
                    type="checkbox"
                    checked={applyAll}
                    onChange={e=>setExcModal(m=>({...m,_applyAll:e.target.checked}))}
                    style={{width:16,height:16,marginTop:1,cursor:"pointer",accentColor:"#00b5b4",flexShrink:0}}
                  />
                  <div>
                    <div style={{fontSize:12,fontWeight:700,color:applyAll?"#0d7a79":"#1a2f4a"}}>
                      Aplicar a todas las fechas de {semActiva.label}
                    </div>
                    <div style={{fontSize:10,color:"#8aaabb",marginTop:2,lineHeight:1.5}}>
                      Excluirá {fechasPreview.length} días:&nbsp;
                      <span style={{fontFamily:"monospace",color:"#5a7a9a"}}>{fechasPreview.join(" · ")}</span>
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
                    const updated = entries.map(e=>e.fecha===fecha?{...e,comentario:comentario.trim()}:e);
                    const newExceps = {...exceps,[key]:updated};
                    setExceps(newExceps);
                    try{ await saveConfig({excepciones:newExceps}); showToast("💬 Comentario actualizado"); }
                    catch(e){ showToast("❌ Error al guardar comentario"); }
                  } else {
                    // Modo nuevo: llamar toggleExcepcion con comentario y applyAll
                    await toggleExcepcion(excModal.tId, excModal.aId, comentario.trim(), applyAll);
                  }
                  setExcModal(null);
                }}
                style={{flex:2,padding:"12px",borderRadius:10,border:"none",background:"linear-gradient(135deg,#00b5b4,#1a2f4a)",color:"#fff",cursor:"pointer",fontWeight:800,fontSize:13}}>
                {excModal.estaExcluida?"Guardar comentario":applyAll?"⚠️ Excluir toda la semana":"⚠️ Confirmar exclusión"}
              </button>
            </div>
          </div>
        </div>
        );
      })()}


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
              <span style={{fontSize:9,fontWeight:400}}>{escalaTxt[idx]}</span>
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
  const items=modulo.items.filter(i=>i.activo).sort((a,b)=>a.orden-b.orden);
  const scoreModulo=calcScoreModulo(respuestas,modulo);
  const tier=getTierAuditoria(scoreModulo?.pct);
  const respondidos=items.filter(i=>respuestas[i.id]?.valor!==undefined).length;
  const obsModulo=respuestas[`__obs_${modulo.id}`]?.obs||"";
  return(
    <div style={{paddingBottom:16}}>
      <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",padding:"10px 16px",background:tier.bg,borderRadius:10,border:`1.5px solid ${tier.c}33`,marginBottom:12}}>
        <div>
          <div style={{fontWeight:800,fontSize:13,color:"#1a2f4a"}}>{modulo.label}</div>
          <div style={{fontSize:11,color:"#8aaabb"}}>{respondidos}/{items.length} ítems · {modulo.escala.join(" / ")}</div>
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

function SeleccionTienda({tiendas,onCheckIn,auditExclusiones,onSolicitarExclusion,isAdmin,onGestionarExclusion}){
  const [busqA,setBusqA]=useState("");
  const [fmtA,setFmtA]=useState("Todas");
  const [naModal,setNaModal]=useState(null); // tId o null
  const [naMotivo,setNaMotivo]=useState("");
  const [naComentario,setNaComentario]=useState("");
  const fmts=["Todas","Mayorista","Supermayorista","Market"];
  const fmtC={Mayorista:"#6c5ce7",Supermayorista:"#0984e3",Market:"#00b5b4"};
  const tFiltA=tiendas.filter(t=>{
    if(!t.activa) return false;
    if(fmtA!=="Todas"&&t.f!==fmtA) return false;
    if(busqA&&!t.n.toLowerCase().includes(busqA.toLowerCase())&&!t.dist?.toLowerCase().includes(busqA.toLowerCase())) return false;
    return true;
  }).sort((a,b)=>a.n.localeCompare(b.n,"es"));

  return(
    <div style={{paddingBottom:80}}>
      <div style={{padding:"14px 16px 4px",fontWeight:800,fontSize:15,color:"#1a2f4a"}}>Selecciona la tienda a auditar</div>

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
        return(
          <div key={t.id} style={{margin:"0 16px 8px"}}>
            <div style={{padding:"11px 14px",background:esExcluida?"#fafafa":esPendiente?"#fffdf6":"#fff",
              borderRadius:10,border:`1px solid ${esExcluida?"#e2e8f0":esPendiente?"#FAC775":"#e2e8f0"}`,
              display:"flex",alignItems:"center",gap:10,
              cursor:esExcluida?"default":"pointer",opacity:esExcluida?0.7:1}}
              onClick={()=>{ if(!esExcluida) onCheckIn(t.id); }}>
              <div style={{flex:1}}>
                <div style={{fontWeight:700,fontSize:13,color:"#1a2f4a"}}>Vega {t.n}</div>
                <div style={{fontSize:11,color:"#8aaabb",marginTop:2}}>{t.f} · {t.dist}</div>
                {(esExcluida||esPendiente)&&(
                  <div style={{fontSize:10,color:"#854F0B",marginTop:3}}>
                    {excl.motivo}{excl.comentario?` · ${excl.comentario}`:""}
                  </div>
                )}
              </div>
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
            <div style={{fontWeight:800,fontSize:15,color:"#1a2f4a",marginBottom:4}}>Reportar N/A — Vega {tiendas.find(t=>t.id===naModal)?.n}</div>
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
  obs,compromisos,onCheckIn,onValor,onObsItem,onObsModulo,onSiguienteModulo,
  onAnteriorModulo,onObs,onCompromisos,onCheckOut,onBorrador,onCancelar,uName,uDni,fecha,
  auditExclusiones,onSolicitarExclusion,isAdmin,onGestionarExclusion}){
  const tienda=tiendas.find(t=>t.id===tiendaSelId);
  const modulosActivos=modulos.filter(m=>m.activo).sort((a,b)=>a.orden-b.orden);
  const scoreFinal=calcScoreFinal(respuestas,modulosActivos);
  const tierFinal=getTierAuditoria(scoreFinal);

  if(paso===0) return <SeleccionTienda tiendas={tiendas} onCheckIn={onCheckIn}
    auditExclusiones={auditExclusiones} onSolicitarExclusion={onSolicitarExclusion}
    isAdmin={isAdmin} onGestionarExclusion={onGestionarExclusion}/>;

  if(paso===1){
    const modulo=modulosActivos[moduloActivo];
    const esUltimo=moduloActivo===modulosActivos.length-1;
    return(
      <div style={{paddingBottom:100}}>
        <div style={{padding:"12px 16px",background:"#1a2f4a",color:"#fff"}}>
          <div style={{fontWeight:800,fontSize:14}}>Vega {tienda?.n}</div>
          <div style={{fontSize:11,opacity:.7}}>{tienda?.f} · {uName}</div>
          <div style={{display:"flex",gap:4,marginTop:8}}>
            {modulosActivos.map((m,idx)=>{
              const s=calcScoreModulo(respuestas,m);const t=getTierAuditoria(s?.pct);
              return<div key={m.id} style={{flex:1,height:4,borderRadius:2,background:idx<moduloActivo?t.c:idx===moduloActivo?"#00b5b4":"rgba(255,255,255,.2)"}}/>;
            })}
          </div>
          <div style={{fontSize:10,opacity:.6,marginTop:4}}>Módulo {moduloActivo+1}/{modulosActivos.length}: {modulo?.label}</div>
        </div>
        {moduloActivo>0&&(
          <div style={{display:"flex",gap:6,padding:"10px 16px",overflowX:"auto"}}>
            {modulosActivos.slice(0,moduloActivo).map(m=>{
              const s=calcScoreModulo(respuestas,m);const t=getTierAuditoria(s?.pct);
              return<div key={m.id} style={{flexShrink:0,padding:"4px 10px",borderRadius:20,background:t.bg,border:`1px solid ${t.c}44`}}>
                <span style={{fontSize:10,fontWeight:700,color:t.c}}>{m.label.split(" ")[0]}: {s?`${s.ob}/${s.mx} (${s.pct}%)`:'—'}</span>
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
          <button onClick={esUltimo?()=>onSiguienteModulo():onSiguienteModulo}
            style={{flex:1,padding:"12px",borderRadius:10,border:"none",background:"linear-gradient(135deg,#00b5b4,#1a2f4a)",color:"#fff",cursor:"pointer",fontSize:13,fontWeight:800}}>
            {esUltimo?"Continuar → Notas":`Siguiente: ${modulosActivos[moduloActivo+1]?.label?.split(" ")[0]}`}
          </button>
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
  // ARQUITECTURA UNIFICADA: el DNI (8 chars alfanumérico) es LA credencial para todos los roles.
  // Admin/viewer ingresan su DNI registrado — no un PIN global separado.
  // pins.admin/viewer se mantienen como fallback de emergencia (acceso sin usuarios registrados).
  const usuariosActivos=(usuarios||[]).filter(u=>u.activo!==false);

  const[pin,setPin]=useState("");
  const[dni,setDni]=useState("");
  const[step,setStep]=useState("inicio");
  const[err,setErr]=useState("");
  const[showPin,setShowPin]=useState(false);
  const inpS={width:"100%",padding:"14px",borderRadius:12,background:"#f8fafc",color:"#1a2f4a",outline:"none",textAlign:"center",boxSizing:"border-box",marginBottom:12};

  // Auditor — busca por dni en la colección usuarios (rol=auditor)
  const tryDni=()=>{
    const clean=dni.trim();
    if(clean.length<4){setErr("Código debe tener al menos 4 caracteres");return;}
    // 1. Buscar en usuarios registrados con rol auditor
    const found=usuariosActivos.find(u=>u.rol==="auditor"&&u.dni===clean);
    if(found){onAcceso?.(found.id);onLogin("auditor",found.nombre,clean);return;}
    // 2. Fallback legacy: colección auditores antigua
    const audsLegacy=(auditores||[]).filter(a=>a.activo!==false);
    if(audsLegacy.length>0){
      const leg=audsLegacy.find(a=>a.dni===clean);
      if(leg){onAcceso?.(leg.id);onLogin("auditor",leg.nombre,clean);return;}
    }
    // 3. Fallback pins legacy si no hay ningún usuario auditor registrado
    const hayAuditores=usuariosActivos.some(u=>u.rol==="auditor");
    if(!hayAuditores&&clean===pins.auditor){onLogin("auditor","Auditor",clean);return;}
    setErr(hayAuditores||audsLegacy.length>0
      ?"Código no encontrado. Verifica con el Admin."
      :"Sin auditores registrados. Contacta al Admin.");
    setTimeout(()=>{setErr("");setDni("");},2500);
  };

  // Admin — busca por DNI en usuarios con rol admin. pins.admin SIEMPRE disponible como emergencia.
  const tryPin=()=>{
    const clean=pin.trim();
    if(!clean){setErr("Ingresa tu código de acceso");return;}
    // 1. Pin global de emergencia — SIEMPRE funciona independiente de usuarios registrados
    if(pins.admin&&clean.toLowerCase()===pins.admin.toLowerCase()){onLogin("admin","Administrador","");return;}
    // 2. Buscar en usuarios registrados con rol admin
    //    Soporta campo "dni" (nuevo) y "credencial" (legacy) para compatibilidad
    const uAdmin=usuariosActivos.find(u=>u.rol==="admin"&&(u.dni===clean||u.credencial===clean));
    if(uAdmin){onAcceso?.(uAdmin.id);onLogin("admin",uAdmin.nombre,clean);return;}
    setErr("Código incorrecto");setTimeout(()=>{setErr("");setPin("");},1500);
  };

  // Viewer — busca por DNI en usuarios con rol viewer. pins.viewer SIEMPRE disponible como emergencia.
  const tryViewer=()=>{
    const clean=pin.trim();
    if(!clean){setErr("Ingresa tu código de acceso");return;}
    // 1. Pin global de emergencia — SIEMPRE funciona
    if(pins.viewer&&clean.toLowerCase()===pins.viewer.toLowerCase()){onLogin("viewer","Gerencia","");return;}
    // 2. Buscar en usuarios registrados con rol viewer
    //    Soporta campo "dni" (nuevo) y "credencial" (legacy) para compatibilidad
    const uViewer=usuariosActivos.find(u=>u.rol==="viewer"&&(u.dni===clean||u.credencial===clean));
    if(uViewer){onAcceso?.(uViewer.id);onLogin("viewer",uViewer.nombre,clean);return;}
    setErr("Código incorrecto");setTimeout(()=>{setErr("");setPin("");},1500);
  };

  return(
    <div style={{fontFamily:"'DM Sans',system-ui,sans-serif",background:"linear-gradient(135deg,#1a2f4a,#0d1f35)",minHeight:"100vh",display:"flex",alignItems:"center",justifyContent:"center",padding:20}}>
      <link href="https://fonts.googleapis.com/css2?family=DM+Sans:opsz,wght@9..40,400;9..40,600;9..40,700&family=Syne:wght@700;800&display=swap" rel="stylesheet"/>
      <div style={{width:"100%",maxWidth:380,background:"#fff",borderRadius:20,padding:36,boxShadow:"0 24px 60px rgba(0,0,0,.3)",textAlign:"center"}}>
        <div style={{width:72,height:72,borderRadius:18,background:"linear-gradient(135deg,#00b5b4,#1a2f4a)",display:"flex",alignItems:"center",justifyContent:"center",margin:"0 auto 18px"}}>
          <svg width="44" height="44" viewBox="0 0 64 64" fill="none">
            {/* Clipboard */}
            <rect x="8" y="10" width="38" height="46" rx="5" fill="white"/>
            <rect x="18" y="6" width="18" height="10" rx="4" fill="#b2bec3"/>
            <rect x="12" y="22" width="22" height="3" rx="1.5" fill="#b2d8e8"/>
            <rect x="12" y="30" width="18" height="3" rx="1.5" fill="#b2d8e8"/>
            <rect x="12" y="38" width="14" height="3" rx="1.5" fill="#b2d8e8"/>
            {/* Magnifier */}
            <circle cx="44" cy="44" r="14" fill="#37474F"/>
            <circle cx="44" cy="44" r="10" fill="none" stroke="#78909C" strokeWidth="3"/>
            <line x1="50" y1="50" x2="56" y2="56" stroke="#37474F" strokeWidth="4" strokeLinecap="round"/>
            <circle cx="44" cy="44" r="6" fill="none" stroke="#90A4AE" strokeWidth="2"/>
          </svg>
        </div>
        <div style={{fontFamily:"'Syne',sans-serif",fontSize:20,fontWeight:800,color:"#1a2f4a",marginBottom:4}}>VEGA · EVIDENCIAS</div>
        <div style={{fontSize:10,color:"#8aaabb",letterSpacing:".08em",marginBottom:28}}>CONTROL DE IMPLEMENTACIÓN DIARIA</div>

        {step==="inicio"&&(
          <>
            <p style={{margin:"0 0 16px",fontSize:13,color:"#5a7a9a"}}>Selecciona tu tipo de acceso</p>
            <button onClick={()=>{setStep("dni_auditor");setErr("");}}
              style={{width:"100%",padding:"14px 16px",borderRadius:14,border:"2px solid #00b5b4",background:"#e0fafa",color:"#0d7a79",cursor:"pointer",marginBottom:8,display:"flex",alignItems:"center",gap:12,textAlign:"left"}}>
              <span style={{fontSize:24,flexShrink:0}}>🪪</span>
              <div>
                <div style={{fontSize:14,fontWeight:800,color:"#0d7a79"}}>Auditor</div>
                <div style={{fontSize:11,color:"#0d7a79",opacity:.8}}>Ingresa tu DNI / CE / RUC registrado</div>
              </div>
            </button>
            <button onClick={()=>{setStep("pin_admin");setErr("");setPin("");}}
              style={{width:"100%",padding:"14px 16px",borderRadius:14,border:"1.5px solid #f6a623",background:"#fff8ec",color:"#854F0B",cursor:"pointer",marginBottom:8,display:"flex",alignItems:"center",gap:12,textAlign:"left"}}>
              <div style={{width:48,height:48,borderRadius:12,background:"#e8f4fd",display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}>
                <svg width="32" height="32" viewBox="0 0 64 64" fill="none">
                  <rect x="8" y="14" width="40" height="28" rx="5" fill="#74b9ff"/>
                  <rect x="12" y="20" width="12" height="14" rx="6" fill="#e8f4fd"/>
                  <rect x="28" y="22" width="16" height="3" rx="1.5" fill="white"/>
                  <rect x="28" y="28" width="11" height="3" rx="1.5" fill="white"/>
                  <circle cx="46" cy="42" r="10" fill="#00b894"/>
                  <path d="M40 42l4 4 7-7" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </div>
              <div>
                <div style={{fontSize:14,fontWeight:800,color:"#854F0B"}}>Administrador</div>
                <div style={{fontSize:11,color:"#854F0B",opacity:.8}}>Ingresa tu DNI / código registrado</div>
              </div>
            </button>
            <button onClick={()=>{setStep("pin_viewer");setErr("");setPin("");}}
              style={{width:"100%",padding:"14px 16px",borderRadius:14,border:"1.5px solid #74b9ff",background:"#e8f4fd",color:"#0652dd",cursor:"pointer",display:"flex",alignItems:"center",gap:12,textAlign:"left"}}>
              <div style={{width:48,height:48,borderRadius:12,background:"#e8f4fd",display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}>
                <svg width="32" height="32" viewBox="0 0 64 64" fill="none">
                  <rect x="8" y="16" width="48" height="28" rx="4" fill="#74b9ff"/>
                  <rect x="12" y="20" width="40" height="20" rx="2" fill="#e8f4fd"/>
                  <rect x="24" y="44" width="16" height="4" rx="2" fill="#74b9ff"/>
                  <rect x="18" y="48" width="28" height="3" rx="1.5" fill="#74b9ff"/>
                  <circle cx="24" cy="30" r="5" fill="white" stroke="#555" strokeWidth="1.5"/>
                  <circle cx="40" cy="30" r="5" fill="white" stroke="#555" strokeWidth="1.5"/>
                  <circle cx="24" cy="30" r="2" fill="#555"/>
                  <circle cx="40" cy="30" r="2" fill="#555"/>
                  <path d="M29 30h6" stroke="#555" strokeWidth="1.5"/>
                </svg>
              </div>
              <div>
                <div style={{fontSize:14,fontWeight:800,color:"#0652dd"}}>Visor Gerencial</div>
                <div style={{fontSize:11,color:"#0652dd",opacity:.8}}>Ingresa tu DNI / código registrado</div>
              </div>
            </button>
          </>
        )}

        {/* Paso: Auditor — DNI / CE / RUC hasta 12 caracteres */}
        {(step==="dni_auditor"||step==="dni")&&(
          <>
            <div style={{fontSize:32,marginBottom:10}}>🪪</div>
            <p style={{margin:"0 0 4px",fontSize:14,fontWeight:700,color:"#1a2f4a"}}>Ingresa tu DNI / CE / RUC</p>
            <p style={{margin:"0 0 20px",fontSize:12,color:"#8aaabb"}}>DNI (8) · CE/pasaporte (hasta 12) · alfanumérico</p>
            <input autoFocus type="text" value={dni}
              onChange={e=>setDni(e.target.value.replace(/[^a-zA-Z0-9]/g,"").slice(0,12))}
              onKeyDown={e=>e.key==="Enter"&&tryDni()}
              placeholder="DNI / CE / RUC" maxLength={12}
              style={{...inpS,border:`2px solid ${err?"#ef4444":"#00b5b4"}`,letterSpacing:4,fontSize:20,fontWeight:700,fontFamily:"monospace"}}/>
            {err&&<div style={{color:"#ef4444",fontSize:11,marginBottom:10,marginTop:-8,lineHeight:1.4}}>❌ {err}</div>}
            <button onClick={tryDni} disabled={dni.length<4}
              style={{width:"100%",padding:"14px",borderRadius:12,border:"none",background:dni.length>=4?"linear-gradient(135deg,#00b5b4,#1a2f4a)":"#e2e8f0",color:dni.length>=4?"white":"#94a3b8",cursor:dni.length>=4?"pointer":"not-allowed",fontSize:14,fontWeight:700,marginBottom:10}}>
              Entrar →
            </button>
            <button onClick={()=>{setStep("inicio");setDni("");setErr("");}}
              style={{width:"100%",padding:"10px",borderRadius:12,border:"1px solid #e2e8f0",background:"#fff",color:"#8aaabb",cursor:"pointer",fontSize:13}}>
              ← Volver
            </button>
          </>
        )}

        {/* Paso: Admin y Viewer — DNI / CE / RUC / código hasta 12 chars alfanumérico */}
        {(step==="pin"||step==="pin_admin"||step==="pin_viewer")&&(
          <>
            <div style={{fontSize:32,marginBottom:10}}>{step==="pin_viewer"?"👁️":"👑"}</div>
            <p style={{margin:"0 0 4px",fontSize:14,fontWeight:700,color:"#1a2f4a"}}>
              {step==="pin_viewer"?"Acceso — Visor Gerencial":"Acceso — Administrador"}
            </p>
            <p style={{margin:"0 0 6px",fontSize:12,color:"#8aaabb"}}>DNI (8) · CE/pasaporte (hasta 12) · alfanumérico</p>
            <p style={{margin:"0 0 12px",fontSize:10,color:"#b2bec3"}}>Registrado en tu perfil de usuario</p>
            {/* Input con toggle candado: oculto por defecto, ojo para revelar */}
            <div style={{position:"relative",marginBottom:12}}>
              <input autoFocus
                type={showPin?"text":"password"}
                value={pin}
                onChange={e=>setPin(e.target.value.replace(/[^a-zA-Z0-9]/g,'').slice(0,12))}
                onKeyDown={e=>e.key==="Enter"&&(step==="pin_viewer"?tryViewer():tryPin())}
                placeholder="DNI / CE / código"
                maxLength={12}
                autoComplete="new-password"
                style={{...inpS,border:`2px solid ${err?"#ef4444":step==="pin_viewer"?"#74b9ff":"#f6a623"}`,letterSpacing:showPin?4:8,fontSize:showPin?20:24,fontWeight:700,marginBottom:0,paddingRight:48,fontFamily:"monospace"}}/>
              <button
                type="button"
                onClick={()=>setShowPin(v=>!v)}
                style={{position:"absolute",right:14,top:"50%",transform:"translateY(-50%)",background:"none",border:"none",cursor:"pointer",fontSize:20,padding:4,lineHeight:1,display:"flex",alignItems:"center",justifyContent:"center"}}>
                {showPin
                  ? <span title="Ocultar código" style={{display:"inline-flex",alignItems:"center",justifyContent:"center",width:24,height:24,borderRadius:"50%",background:"#e8faf5",border:"1.5px solid #00b894",fontSize:13}}>✓</span>
                  : <span title="Mostrar código" style={{display:"inline-flex",alignItems:"center",justifyContent:"center",width:24,height:24,borderRadius:"50%",background:"#fff1f2",border:"1.5px solid #ef4444",fontSize:13}}>🔒</span>
                }
              </button>
            </div>
            {err&&<div style={{color:"#ef4444",fontSize:12,marginBottom:10,lineHeight:1.4}}>❌ {err}</div>}
            {/* Indicador de progreso — hasta 12 puntos */}
            <div style={{display:"flex",justifyContent:"center",gap:3,marginBottom:14}}>
              {[...Array(12)].map((_,i)=>(
                <div key={i} style={{width:6,height:6,borderRadius:"50%",background:i<pin.length?(step==="pin_viewer"?"#74b9ff":"#f6a623"):"#e2e8f0",transition:"background .1s"}}/>
              ))}
            </div>
            <button onClick={step==="pin_viewer"?tryViewer:tryPin} disabled={pin.length<4}
              style={{width:"100%",padding:"14px",borderRadius:12,border:"none",background:pin.length>=4?"linear-gradient(135deg,#00b5b4,#1a2f4a)":"#e2e8f0",color:pin.length>=4?"white":"#94a3b8",cursor:pin.length>=4?"pointer":"not-allowed",fontSize:14,fontWeight:700,marginBottom:10}}>
              Ingresar →
            </button>
            <button onClick={()=>{setStep("inicio");setPin("");setErr("");setShowPin(false);}}
              style={{width:"100%",padding:"10px",borderRadius:12,border:"1px solid #e2e8f0",background:"#fff",color:"#8aaabb",cursor:"pointer",fontSize:13}}>
              ← Volver
            </button>
          </>
        )}

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
