(function(){const e=document.createElement("link").relList;if(e&&e.supports&&e.supports("modulepreload"))return;for(const l of document.querySelectorAll('link[rel="modulepreload"]'))o(l);new MutationObserver(l=>{for(const n of l)if(n.type==="childList")for(const i of n.addedNodes)i.tagName==="LINK"&&i.rel==="modulepreload"&&o(i)}).observe(document,{childList:!0,subtree:!0});function s(l){const n={};return l.integrity&&(n.integrity=l.integrity),l.referrerPolicy&&(n.referrerPolicy=l.referrerPolicy),l.crossOrigin==="use-credentials"?n.credentials="include":l.crossOrigin==="anonymous"?n.credentials="omit":n.credentials="same-origin",n}function o(l){if(l.ep)return;l.ep=!0;const n=s(l);fetch(l.href,n)}})();const m={EXT:"eic_ext",RAP:"eic_rap",SES:"eic_ses",LOGO:"eic_logo",SET:"eic_set",SEED:"eic_seeded"},ne=[{c:"EUR",s:"€"},{c:"USD",s:"$"},{c:"GBP",s:"£"},{c:"CDF",s:"FC"},{c:"XAF",s:"FCFA"},{c:"XOF",s:"CFA"},{c:"NGN",s:"₦"},{c:"ZAR",s:"R"},{c:"KES",s:"KSh"},{c:"GHS",s:"GH₵"},{c:"TZS",s:"TSh"},{c:"UGX",s:"USh"},{c:"RWF",s:"RF"},{c:"CHF",s:"CHF"},{c:"CAD",s:"CA$"}],G=[{id:"ext_nic",nom:"Nicosie Centre",couleur:"#8B5CF6",ville:"Nicosie",pays:"Chypre",adresse:"12 Avenue de la Paix, Nicosie",dateCreation:"2018-03-15",pasteur:{nom:"Pasteur Emmanuel Kabila",email:"e.kabila@eic.cy",tel:"+357 99 123 456"},coordinateur:"Frère David Mutombo",secretaire:"Sœur Rachel Lukusa",tresorier:"Frère Jean-Paul Ngoy",password:"nic123",devise:"EUR",symbole:"€"},{id:"ext_lim",nom:"Limassol Sud",couleur:"#059669",ville:"Limassol",pays:"Chypre",adresse:"45 Rue des Flamboyants, Limassol",dateCreation:"2019-07-20",pasteur:{nom:"Pasteur Pierre Kabasele",email:"p.kabasele@eic.cy",tel:"+357 99 654 321"},coordinateur:"Frère Samuel Banza",secretaire:"Sœur Esther Mwamba",tresorier:"Frère Isaac Tshimanga",password:"lim123",devise:"EUR",symbole:"€"},{id:"ext_lar",nom:"Larnaca Est",couleur:"#DC2626",ville:"Larnaca",pays:"Chypre",adresse:"8 Boulevard du Lac, Larnaca",dateCreation:"2020-01-10",pasteur:{nom:"Pasteur Daniel Nzamba",email:"d.nzamba@eic.cy",tel:"+357 99 789 012"},coordinateur:"Frère Caleb Mbombo",secretaire:"Sœur Miriam Kavula",tresorier:"Frère Thomas Luzolo",password:"lar123",devise:"EUR",symbole:"€"}],se=[{g:"Général",items:[{icon:"dashboard",lbl:"Tableau de Bord",path:"/admin/dashboard"},{icon:"building",lbl:"Extensions",path:"/admin/extensions"},{icon:"fileText",lbl:"Tous les Rapports",path:"/admin/rapports"},{icon:"chartBar",lbl:"Bilans Comparatifs",path:"/admin/bilans"},{icon:"users",lbl:"Nouveaux Convertis",path:"/admin/convertis"}]},{g:"Administration",items:[{icon:"settings",lbl:"Paramètres",path:"/admin/settings"}]}],oe=[{g:"Mon Extension",items:[{icon:"dashboard",lbl:"Tableau de Bord",path:"/ext/dashboard"},{icon:"plus",lbl:"Nouveau Rapport",path:"/ext/new"},{icon:"fileText",lbl:"Mes Rapports",path:"/ext/rapports"},{icon:"chartBar",lbl:"Bilans",path:"/ext/bilans"},{icon:"users",lbl:"Convertis",path:"/ext/convertis"}]}];function ae(){if(localStorage.getItem(m.SEED))return;localStorage.setItem(m.EXT,JSON.stringify(G));const t=[];G.forEach(e=>{[0,1,2,3,4].forEach(s=>{[5,12,19,26].forEach(o=>{const l=new Date(2025,s,o);if(l>new Date)return;const n=60+Math.floor(Math.random()*80),i=200+Math.floor(Math.random()*500),a=Math.floor(i*.3),c=Math.floor(i*.5),v=Math.floor(i*.1),p=i-a-c-v,k=Math.floor(Math.random()*4),f=Math.floor(i*.3);t.push({id:`r_${e.id}_${s}_${o}`,extensionId:e.id,date:l.toISOString().split("T")[0],heureDebut:"09:00",heureFin:"12:00",moderateur:e.coordinateur,predicateur:e.pasteur.nom,interprete:"",theme:"La Grâce de Dieu",textes:"Jean 3:16",effectif:{papas:Math.floor(n*.2),mamans:Math.floor(n*.25),freres:Math.floor(n*.2),soeurs:Math.floor(n*.25),enfants:Math.floor(n*.1),total:n},offrandes:{ordinaires:c,orateur:v,dimes:a,actionsGrace:p,total:i},ventilation:{dixPctDime:+Number(a*.1).toFixed(2),dixPctSocial:+Number(i*.1).toFixed(2),reste:+Number(i*.8).toFixed(2)},depenses:[{motif:"Transport",montant:Math.floor(f*.4)},{motif:"Collation",montant:Math.floor(f*.3)},{motif:"Fournitures",montant:Math.floor(f*.3)}],totalDepenses:f,soldeFinal:i-f,nouveaux:Array.from({length:k},(D,$)=>({nom:`Nouveau ${$+1} (${e.nom})`,tel:"+357 99 "+String(1e5+Math.floor(Math.random()*9e5))})),signatures:{secretaire:e.secretaire,tresorier:e.tresorier,pasteur:e.pasteur.nom},updatedAt:new Date().toISOString()})})})}),localStorage.setItem(m.RAP,JSON.stringify(t)),localStorage.setItem(m.SEED,"1")}const r={getExts(){try{return JSON.parse(localStorage.getItem(m.EXT)||"null")||G}catch{return G}},getExt(t){return this.getExts().find(e=>e.id===t)||null},saveExt(t){const e=this.getExts(),s=e.findIndex(o=>o.id===t.id);s>=0?e[s]=t:e.push(t),localStorage.setItem(m.EXT,JSON.stringify(e))},delExt(t){localStorage.setItem(m.EXT,JSON.stringify(this.getExts().filter(e=>e.id!==t))),localStorage.setItem(m.RAP,JSON.stringify(this.getRaps().filter(e=>e.extensionId!==t)))},getRaps(t=null){try{const e=JSON.parse(localStorage.getItem(m.RAP)||"null")||[];return t?e.filter(s=>s.extensionId===t):e}catch{return[]}},getRap(t){return this.getRaps().find(e=>e.id===t)||null},saveRap(t){const e=this.getRaps(),s=e.findIndex(o=>o.id===t.id);return t.updatedAt=new Date().toISOString(),s>=0?e[s]=t:e.push(t),localStorage.setItem(m.RAP,JSON.stringify(e)),t},delRap(t){localStorage.setItem(m.RAP,JSON.stringify(this.getRaps().filter(e=>e.id!==t)))},getSes(){try{return JSON.parse(localStorage.getItem(m.SES)||"null")}catch{return null}},setSes(t){localStorage.setItem(m.SES,JSON.stringify(t))},clearSes(){localStorage.removeItem(m.SES)},getLogo(){return localStorage.getItem(m.LOGO)||null},setLogo(t){t?localStorage.setItem(m.LOGO,t):localStorage.removeItem(m.LOGO)},getSet(){try{return JSON.parse(localStorage.getItem(m.SET)||"null")||{nom:"Emerge in Christ",adminPw:"admin123"}}catch{return{nom:"Emerge in Christ",adminPw:"admin123"}}},saveSet(t){localStorage.setItem(m.SET,JSON.stringify(t))},stats(t=null){const e=this.getRaps(t),s=e.length;return{cultes:s,presence:s?Math.round(e.reduce((o,l)=>{var n;return o+(((n=l.effectif)==null?void 0:n.total)||0)},0)/s):0,offrandes:e.reduce((o,l)=>{var n;return o+(((n=l.offrandes)==null?void 0:n.total)||0)},0),nouveaux:e.reduce((o,l)=>{var n;return o+(((n=l.nouveaux)==null?void 0:n.length)||0)},0)}},monthly(t=null,e=new Date().getFullYear()){const s=this.getRaps(t).filter(l=>new Date(l.date+"T00:00").getFullYear()===e),o=Array.from({length:12},(l,n)=>({i:n,lbl:new Date(e,n).toLocaleString("fr-FR",{month:"short"}),cultes:0,presence:0,offrandes:0,nouveaux:0}));return s.forEach(l=>{var i,a,c;const n=new Date(l.date+"T00:00").getMonth();o[n].cultes++,o[n].presence+=((i=l.effectif)==null?void 0:i.total)||0,o[n].offrandes+=((a=l.offrandes)==null?void 0:a.total)||0,o[n].nouveaux+=((c=l.nouveaux)==null?void 0:c.length)||0}),o},allNouveaux(t=null){const e=[];return this.getRaps(t).forEach(s=>(s.nouveaux||[]).forEach(o=>e.push({...o,date:s.date,extId:s.extensionId,rapId:s.id}))),e}},E={ses(){return r.getSes()},isAdmin(){const t=r.getSes();return(t==null?void 0:t.role)==="admin"},isExt(){const t=r.getSes();return(t==null?void 0:t.role)==="extension"},loginAdmin(t){const e=r.getSet();return t===e.adminPw?(r.setSes({role:"admin"}),!0):!1},loginExt(t,e){const s=r.getExt(t);return s&&s.password===e?(r.setSes({role:"extension",extId:s.id}),!0):!1},logout(){r.clearSes()}};function u(t,e=""){const s=typeof t=="number"?t:parseFloat(String(t??""))||0;return e+s.toLocaleString("fr-FR",{minimumFractionDigits:2,maximumFractionDigits:2})}function B(t){if(!t)return"—";try{return new Date(t+"T00:00").toLocaleDateString("fr-FR",{day:"2-digit",month:"long",year:"numeric"})}catch{return t}}function ie(){return"r_"+Date.now()+"_"+Math.random().toString(36).slice(2,7)}function Z(t){return new Date(2024,t).toLocaleString("fr-FR",{month:"long"})}const q={dashboard:'<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="7" height="9"/><rect x="14" y="3" width="7" height="5"/><rect x="14" y="12" width="7" height="9"/><rect x="3" y="16" width="7" height="5"/></svg>',building:'<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="4" y="2" width="16" height="20" rx="2" ry="2"/><path d="M9 22v-4h6v4"/><path d="M8 6h.01"/><path d="M16 6h.01"/><path d="M12 6h.01"/><path d="M12 10h.01"/><path d="M12 14h.01"/><path d="M16 10h.01"/><path d="M16 14h.01"/><path d="M8 10h.01"/><path d="M8 14h.01"/></svg>',fileText:'<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><polyline points="10 9 9 9 8 9"/></svg>',chartBar:'<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="12" y1="20" x2="12" y2="10"/><line x1="18" y1="20" x2="18" y2="4"/><line x1="6" y1="20" x2="6" y2="16"/></svg>',users:'<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>',settings:'<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg>',plus:'<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>',mapPin:'<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>',user:'<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>',mail:'<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></svg>',phone:'<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/></svg>',handshake:'<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/><path d="M8 11h8"/><path d="M8 15h8"/></svg>',clipboard:'<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"/><rect x="8" y="2" width="8" height="4" rx="1" ry="1"/></svg>',trash:'<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>',eye:'<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>',file:'<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>',save:'<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"/><polyline points="17 21 17 13 7 13 7 21"/><polyline points="7 3 7 8 15 8"/></svg>',download:'<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>',upload:'<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>',folder:'<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/></svg>',search:'<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>',clock:'<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>',wallet:'<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>',userCheck:'<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="8.5" cy="7" r="4"/><polyline points="17 11 19 13 23 9"/></svg>',pen:'<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 19l7-7 3 3-7 7-3-3z"/><path d="M18 13l-1.5-7.5L2 2l3.5 14.5L13 18l5-5z"/><path d="M2 2l7.586 7.586"/><circle cx="11" cy="11" r="2"/></svg>',cross:'<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 5.41L18.59 4 7 15.59V9H5v10h10v-2H8.41z"/></svg>',x:'<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>',shield:'<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>'};function d(t){return q[t]||q.fileText}const J={};function w(t,e){J[t]=e}function A(t,e={}){const s=Object.keys(e).length?"?"+new URLSearchParams(e).toString():"";window.location.hash=t+s}function U(){return window.location.hash.slice(1).split("?")[0]||"/"}function H(){const[,t]=window.location.hash.slice(1).split("?");return t?Object.fromEntries(new URLSearchParams(t)):{}}function K(){const t=()=>{const e=U(),s=J[e]||J["*"];s&&s(H())};window.addEventListener("hashchange",t),t()}function T(t,e="",s=""){document.getElementById("tb-title").textContent=t,document.getElementById("tb-sub").textContent=e||"",document.getElementById("tb-badge").textContent=s||""}function M(t){document.getElementById("page").innerHTML=t}function W(t){const e=document.getElementById("sidebar-nav");e.innerHTML=t.map(s=>`<div class="nav-group">${s.g}</div>${s.items.map(o=>`<button class="nav-item" data-path="${o.path}" onclick="navTo('${o.path}')"><span class="nav-icon">${d(o.icon)}</span>${o.lbl}</button>`).join("")}`).join("")}function x(t){document.querySelectorAll(".nav-item").forEach(e=>{e.classList.toggle("active",e.dataset.path===t)})}function O(t,e="success"){const s=document.getElementById("toast-wrap"),o=document.createElement("div");o.className=`toast t-${e}`,o.innerHTML=`<span>${e==="success"?"✓":"✕"}</span><span>${t}</span>`,s.appendChild(o),setTimeout(()=>{o.style.animation="toastOut .3s ease forwards",setTimeout(()=>o.remove(),300)},3200)}function Y(t,e=!1){document.getElementById("modal-root").innerHTML=`
    <div class="modal-backdrop" onclick="if(event.target===this)closeModal()">
       <div class="modal${e?" modal-lg":""}">${t}</div>
     </div>`}function le(){document.getElementById("modal-root").innerHTML=""}function Q(){const t=r.getLogo(),e=document.getElementById("sb-logo-wrap");t?e.innerHTML=`<div class="logo-img-wrap"><img src="${t}" alt="logo"/></div>`:e.innerHTML=`<div class="logo-placeholder">${d("cross")}</div>`;const s=document.getElementById("login-icon");s&&(t?s.innerHTML=`<img src="${t}" alt="logo"/>`:s.innerHTML=d("cross"));const o=r.getSet(),l=document.getElementById("sb-community");l&&(l.textContent=o.nom||"Emerge in Christ")}function re(){const t=document.getElementById("ext-select");t.innerHTML=r.getExts().map(e=>`<option value="${e.id}">${e.nom} — ${e.ville}</option>`).join("")}function X(){Q(),document.getElementById("login-screen").style.display="none",document.getElementById("app").style.display="flex";const t=E.ses();if(E.isAdmin())document.getElementById("sb-ext-name").textContent="Administrateur Général",document.getElementById("sb-ext-role").textContent="Accès réseau complet",W(se),he(),K(),A("/admin/dashboard");else{const e=t,s=r.getExt(e.extId);document.getElementById("sb-ext-name").textContent=(s==null?void 0:s.nom)||"—",document.getElementById("sb-ext-role").textContent=(s==null?void 0:s.ville)||"—",W(oe),fe(e.extId),K(),A("/ext/dashboard")}}function I(t,e,s,o){return`<div class="stat-card"><div class="stat-label">${e}</div><div class="stat-value">${s}</div><div class="stat-sub">${o}</div><div class="stat-icon">${d(t)}</div></div>`}function N(t,e,s,o,l){var i;const n=(i=document.getElementById(t))==null?void 0:i.getContext("2d");n&&(window._charts&&window._charts[t]&&window._charts[t].destroy(),window._charts||(window._charts={}),window._charts[t]=new window.Chart(n,{type:"bar",data:{labels:e,datasets:[{label:o,data:s,backgroundColor:l,borderRadius:5,borderSkipped:!1}]},options:{responsive:!0,maintainAspectRatio:!1,plugins:{legend:{display:!1}},scales:{x:{ticks:{color:"#5A5280",font:{family:"'DM Sans', sans-serif",size:10}},grid:{color:"rgba(90,82,128,.08)"}},y:{ticks:{color:"#5A5280",font:{family:"'DM Sans', sans-serif",size:10}},grid:{color:"rgba(90,82,128,.08)"}}}}}))}function de(t,e,s){var l;const o=(l=document.getElementById(t))==null?void 0:l.getContext("2d");o&&(window._charts&&window._charts[t]&&window._charts[t].destroy(),window._charts||(window._charts={}),window._charts[t]=new window.Chart(o,{type:"line",data:{labels:e,datasets:s.map(n=>({...n,tension:.4,fill:!1}))},options:{responsive:!0,maintainAspectRatio:!1,plugins:{legend:{labels:{color:"#A199C4",font:{family:"'DM Sans', sans-serif",size:11}}}},scales:{x:{ticks:{color:"#5A5280"}},y:{ticks:{color:"#5A5280"}}}}}))}function ce(t){var s,o,l,n,i,a;const e=r.stats(t.id);return`<div class="ext-card" style="--ext-color:${t.couleur||"#8B5CF6"}">
    <div class="flex justify-between items-center mb-8">
      <div><div class="ext-card-name">${t.nom}</div><div class="ext-card-ville">${d("mapPin")} ${t.ville}, ${t.pays}</div></div>
      <div class="ext-card-pastor">
        ${d("user")} ${((s=t.pasteur)==null?void 0:s.nom)||"—"}<br>${d("mail")} ${((o=t.pasteur)==null?void 0:o.email)||"—"}<br>${d("phone")} ${((l=t.pasteur)==null?void 0:l.tel)||"—"}
      </div>
      <div class="ext-card-team">
        ${d("handshake")} Coord: ${t.coordinateur||"—"}<br>${d("clipboard")} Secrét: ${t.secretaire||"—"}<br>${d("wallet")} Trésor: ${t.tresorier||"—"}
      </div>
    <div class="text-xs text-muted mb-8" style="line-height:1.8">
      ${d("user")} ${((n=t.pasteur)==null?void 0:n.nom)||"—"}<br>${d("mail")} ${((i=t.pasteur)==null?void 0:i.email)||"—"}<br>${d("phone")} ${((a=t.pasteur)==null?void 0:a.tel)||"—"}
    </div>
    <div class="text-xs text-muted mb-12" style="line-height:1.8">
      ${d("handshake")} Coord: ${t.coordinateur||"—"}<br>${d("clipboard")} Secrét: ${t.secretaire||"—"}<br>${d("wallet")} Trésor: ${t.tresorier||"—"}
    </div>
    <div class="ext-mini-stats mb-12">
      <div><div class="ext-stat-val">${e.cultes}</div><div class="ext-stat-lbl">Cultes</div></div>
      <div><div class="ext-stat-val">${e.presence}</div><div class="ext-stat-lbl">Moy.</div></div>
      <div><div class="ext-stat-val">${e.nouveaux}</div><div class="ext-stat-lbl">Conv.</div></div>
    </div>
    <div class="flex gap-8">
      <button class="btn btn-secondary btn-sm" onclick="openExtForm('${t.id}')">✏ Modifier</button>
      <button class="btn btn-danger btn-sm" onclick="confirmDelExt('${t.id}')">${d("trash")} Supprimer</button>
    </div>
  </div>`}function ue(t){var s,o,l;const e=r.getExt(t.extensionId);return`<tr>
    <td class="td-bold">${B(t.date)}</td>
    <td><span class="badge" style="background:${(e==null?void 0:e.couleur)||"#8B5CF6"}22;color:${(e==null?void 0:e.couleur)||"#8B5CF6"};border:1px solid ${(e==null?void 0:e.couleur)||"#8B5CF6"}44">${(e==null?void 0:e.nom)||"—"}</span></td>
    <td>${t.moderateur||"—"}</td>
    <td>${((s=t.effectif)==null?void 0:s.total)||0}</td>
    <td>${u((o=t.offrandes)==null?void 0:o.total,(e==null?void 0:e.symbole)||"€")}</td>
    <td>${((l=t.nouveaux)==null?void 0:l.length)||0}</td>
    <td>
      <div class="flex gap-8">
        <button class="btn btn-secondary btn-sm btn-icon" onclick="showRapModal('${t.id}')" title="Voir">${d("eye")}</button>
        <button class="btn btn-gold btn-sm btn-icon" onclick="doExportPDF('${t.id}')" title="PDF">${d("file")}</button>
        <button class="btn btn-success btn-sm btn-icon" onclick="doExportDOCX('${t.id}')" title="DOCX">${d("pen")}</button>
      </div>
    </td>
  </tr>`}function pe(t){var l,n,i,a,c,v,p,k,f,D,$,R,F,S,y,C;const e=r.getRap(t);if(!e)return;const s=r.getExt(e.extensionId),o=(s==null?void 0:s.symbole)||"€";Y(`
    <div class="modal-header"><h2>Rapport du ${B(e.date)}</h2><button class="modal-close" onclick="closeModal()">${d("x")}</button></div>
    <div class="modal-body">
      <div class="grid-2 mb-12">
        <div class="calc-box">
          <div class="form-section-title">Culte</div>
          <div class="calc-row"><span>Heure</span><span>${e.heureDebut||"—"} - ${e.heureFin||"—"}</span></div>
          <div class="calc-row"><span>Modérateur</span><span>${e.moderateur||"—"}</span></div>
          <div class="calc-row"><span>Prédicateur</span><span>${e.predicateur||"—"}</span></div>
          <div class="calc-row"><span>Thème</span><span>${e.theme||"—"}</span></div>
          <div class="calc-row"><span>Textes</span><span>${e.textes||"—"}</span></div>
        </div>
        <div class="calc-box">
          <div class="form-section-title">Effectif</div>
          <div class="calc-row"><span>Papas</span><span>${((l=e.effectif)==null?void 0:l.papas)||0}</span></div>
          <div class="calc-row"><span>Mamans</span><span>${((n=e.effectif)==null?void 0:n.mamans)||0}</span></div>
          <div class="calc-row"><span>Frères</span><span>${((i=e.effectif)==null?void 0:i.freres)||0}</span></div>
          <div class="calc-row"><span>Soeurs</span><span>${((a=e.effectif)==null?void 0:a.soeurs)||0}</span></div>
          <div class="calc-row"><span>Enfants</span><span>${((c=e.effectif)==null?void 0:c.enfants)||0}</span></div>
          <div class="calc-row total-row"><span>Total</span><span>${((v=e.effectif)==null?void 0:v.total)||0}</span></div>
        </div>
      </div>
      <div class="grid-2 mb-12">
        <div class="calc-box">
          <div class="form-section-title">Offrandes (${o})</div>
          <div class="calc-row"><span>Offrandes ordinaires</span><span>${u((p=e.offrandes)==null?void 0:p.ordinaires,o)}</span></div>
          <div class="calc-row"><span>Offrande orateur</span><span>${u((k=e.offrandes)==null?void 0:k.orateur,o)}</span></div>
          <div class="calc-row"><span>Dîmes</span><span>${u((f=e.offrandes)==null?void 0:f.dimes,o)}</span></div>
          <div class="calc-row"><span>Actions de grâce</span><span>${u((D=e.offrandes)==null?void 0:D.actionsGrace,o)}</span></div>
          <div class="calc-row total-row"><span>Total</span><span>${u(($=e.offrandes)==null?void 0:$.total,o)}</span></div>
        </div>
        <div class="calc-box">
          <div class="form-section-title">Ventilation (${o})</div>
          <div class="calc-row"><span>10% Dîmes</span><span>${u((R=e.ventilation)==null?void 0:R.dixPctDime,o)}</span></div>
          <div class="calc-row"><span>10% Social</span><span>${u((F=e.ventilation)==null?void 0:F.dixPctSocial,o)}</span></div>
          <div class="calc-row"><span>Reste</span><span>${u((S=e.ventilation)==null?void 0:S.reste,o)}</span></div>
          <div class="calc-row"><span>Dépenses</span><span>${u(e.totalDepenses,o)}</span></div>
          <div class="calc-row total-row"><span>Solde final</span><span>${u(e.soldeFinal,o)}</span></div>
        </div>
      </div>
      ${(y=e.depenses)!=null&&y.length?`
      <div class="form-section-title mb-8">Dépenses</div>
      <div class="table-wrap mb-12">
        <table><thead><tr><th>Motif</th><th>Montant</th></tr></thead>
        <tbody>${e.depenses.map(b=>`<tr><td>${b.motif}</td><td>${u(b.montant,o)}</td></tr>`).join("")}</tbody></table>
      </div>`:""}
      ${(C=e.nouveaux)!=null&&C.length?`
      <div class="form-section-title mb-8">Nouveaux convertis</div>
      <div class="table-wrap mb-12">
        <table><thead><tr><th>Nom</th><th>Téléphone</th></tr></thead>
        <tbody>${e.nouveaux.map(b=>`<tr><td>${b.nom}</td><td>${b.tel||"—"}</td></tr>`).join("")}</tbody></table>
      </div>`:""}
    </div>
    <div class="modal-footer">
      <button class="btn btn-gold" onclick="closeModal();doExportPDF('${e.id}')">${d("file")} Exporter PDF</button>
      <button class="btn btn-success" onclick="closeModal();doExportDOCX('${e.id}')">${d("pen")} Exporter DOCX</button>
    </div>
  `)}function ve(t){var c,v,p,k,f,D,$,R,F,S,y,C,b,L,V,z;const e=r.getRap(t);if(!e)return;const s=r.getExt(e.extensionId),o=(s==null?void 0:s.symbole)||"€",{jsPDF:l}=window.jspdf,n=new l,i=n.internal.pageSize.getWidth();n.setFontSize(18),n.text("RAPPORT DE CULTE",i/2,20,{align:"center"}),n.setFontSize(12),n.text((s==null?void 0:s.nom)||"Emerge in Christ",i/2,28,{align:"center"}),n.text(`Date: ${B(e.date)}`,i/2,34,{align:"center"});let a=50;n.setFontSize(11),n.setFont("helvetica","bold"),n.text("INFORMATIONS DU CULTE",15,a),a+=8,n.setFont("helvetica","normal"),n.text(`Heure: ${e.heureDebut||"—"} - ${e.heureFin||"—"}`,15,a),a+=6,n.text(`Modérateur: ${e.moderateur||"—"}`,15,a),a+=6,n.text(`Prédicateur: ${e.predicateur||"—"}`,15,a),a+=6,n.text(`Interprète: ${e.interprete||"—"}`,15,a),a+=6,n.text(`Thème: ${e.theme||"—"}`,15,a),a+=6,n.text(`Textes: ${e.textes||"—"}`,15,a),a+=12,n.setFont("helvetica","bold"),n.text("EFFECTIF",15,a),a+=8,n.setFont("helvetica","normal"),n.text(`Papas: ${((c=e.effectif)==null?void 0:c.papas)||0} | Mamans: ${((v=e.effectif)==null?void 0:v.mamans)||0} | Frères: ${((p=e.effectif)==null?void 0:p.freres)||0} | Soeurs: ${((k=e.effectif)==null?void 0:k.soeurs)||0} | Enfants: ${((f=e.effectif)==null?void 0:f.enfants)||0}`,15,a),a+=6,n.text(`Total présence: ${((D=e.effectif)==null?void 0:D.total)||0}`,15,a),a+=12,n.setFont("helvetica","bold"),n.text("OFFRANDES",15,a),a+=8,n.setFont("helvetica","normal"),n.text(`Offrandes ordinaires: ${u(($=e.offrandes)==null?void 0:$.ordinaires,o)}`,15,a),a+=6,n.text(`Offrande orateur: ${u((R=e.offrandes)==null?void 0:R.orateur,o)}`,15,a),a+=6,n.text(`Dîmes: ${u((F=e.offrandes)==null?void 0:F.dimes,o)}`,15,a),a+=6,n.text(`Actions de grâce: ${u((S=e.offrandes)==null?void 0:S.actionsGrace,o)}`,15,a),a+=6,n.setFont("helvetica","bold"),n.text(`TOTAL: ${u((y=e.offrandes)==null?void 0:y.total,o)}`,15,a),a+=12,n.setFont("helvetica","bold"),n.text("VENTILATION",15,a),a+=8,n.setFont("helvetica","normal"),n.text(`10% des dîmes: ${u((C=e.ventilation)==null?void 0:C.dixPctDime,o)}`,15,a),a+=6,n.text(`10% social: ${u((b=e.ventilation)==null?void 0:b.dixPctSocial,o)}`,15,a),a+=6,n.text(`Reste: ${u((L=e.ventilation)==null?void 0:L.reste,o)}`,15,a),a+=12,n.setFont("helvetica","bold"),n.text("DÉPENSES",15,a),a+=8,n.setFont("helvetica","normal"),(V=e.depenses)!=null&&V.length?(e.depenses.forEach(g=>{n.text(`- ${g.motif}: ${u(g.montant,o)}`,15,a),a+=6}),n.setFont("helvetica","bold"),n.text(`Total dépenses: ${u(e.totalDepenses,o)}`,15,a),n.setFont("helvetica","normal"),a+=6,n.text(`Solde final: ${u(e.soldeFinal,o)}`,15,a)):n.text("Aucune dépense",15,a),(z=e.nouveaux)!=null&&z.length&&(a+=12,n.setFont("helvetica","bold"),n.text("NOUVEAUX CONVERTIS",15,a),a+=8,n.setFont("helvetica","normal"),e.nouveaux.forEach(g=>{n.text(`- ${g.nom}${g.tel?` (${g.tel})`:""}`,15,a),a+=6})),a+=15,n.setFont("helvetica","bold"),n.text("SIGNATURES",15,a),a+=15,n.setFont("helvetica","normal"),n.text("Secrétaire: ___________________",15,a),n.text("Trésorier: ___________________",80,a),n.text("Pasteur: ___________________",145,a),n.save(`Rapport_${(s==null?void 0:s.nom)||"EIC"}_${e.date}.pdf`),O("PDF exporté avec succès","success")}async function me(t){var C,b;const e=r.getRap(t);if(!e)return;const s=r.getExt(e.extensionId),o=(s==null?void 0:s.symbole)||"€",{Document:l,Packer:n,Paragraph:i,TextRun:a,Table:c,TableRow:v,TableCell:p,WidthType:k,AlignmentType:f,BorderStyle:D}=window.docx,$=[new v({children:[new p({children:[new i({children:[new a({text:"Catégorie",bold:!0})]})]}),new p({children:[new i({children:[new a({text:"Détails",bold:!0})]})]})]}),new v({children:[new p({children:[new i("Heure")]}),new p({children:[new i(`${e.heureDebut||"—"} - ${e.heureFin||"—"}`)]})]}),new v({children:[new p({children:[new i("Modérateur")]}),new p({children:[new i(e.moderateur||"—")]})]}),new v({children:[new p({children:[new i("Prédicateur")]}),new p({children:[new i(e.predicateur||"—")]})]}),new v({children:[new p({children:[new i("Thème")]}),new p({children:[new i(e.theme||"—")]})]}),new v({children:[new p({children:[new i("Total présence")]}),new p({children:[new i(String(((C=e.effectif)==null?void 0:C.total)||0))]})]}),new v({children:[new p({children:[new i("Total offrandes")]}),new p({children:[new i(u((b=e.offrandes)==null?void 0:b.total,o))]})]})],R=new l({sections:[{properties:{},children:[new i({children:[new a({text:"RAPPORT DE CULTE",bold:!0,size:48})],alignment:f.CENTER}),new i({children:[new a((s==null?void 0:s.nom)||"Emerge in Christ")]}),new i({children:[new a(`Date: ${B(e.date)}`)],alignment:f.CENTER}),new i({children:[new a({text:""})]}),new c({rows:$})]}]}),F=await n.toBlob(R),S=URL.createObjectURL(F),y=document.createElement("a");y.href=S,y.download=`Rapport_${(s==null?void 0:s.nom)||"EIC"}_${e.date}.docx`,y.click(),URL.revokeObjectURL(S),O("DOCX exporté avec succès","success")}function he(){w("/admin/dashboard",be),w("/admin/extensions",ee),w("/admin/rapports",ge),w("/admin/bilans",we),w("/admin/convertis",xe),w("/admin/settings",$e),w("*",()=>A("/admin/dashboard")),window.addEventListener("hashchange",()=>x(U()))}function fe(t){w("/ext/dashboard",()=>ye(t)),w("/ext/new",()=>j(t)),w("/ext/rapports",te),w("/ext/bilans",()=>Se(t)),w("/ext/convertis",()=>Ce(t)),w("*",()=>A("/ext/dashboard")),window.addEventListener("hashchange",()=>x(U()))}function be(){x("/admin/dashboard");const t=r.getSet(),e=r.getExts(),s=r.stats(),o=r.monthly(null,new Date().getFullYear());T("Tableau de Bord Global","Vue d'ensemble du réseau","Admin");const l=Math.max(1,...e.map(i=>r.stats(i.id).cultes));M(`
    <div class="page-header">
      <div><h1>Vue Générale</h1><p>${t.nom||"Emerge in Christ"} · ${e.length} extension(s)</p></div>
      <button class="btn btn-secondary btn-sm" onclick="navTo('/admin/extensions')">${d("settings")} Gérer</button>
    </div>
    <div class="grid-4 mb-20">
      ${I("building","Extensions",String(e.length),"Sites actifs")}
      ${I("fileText","Cultes",String(s.cultes),"Total réseau")}
      ${I("users","Présence moy.",String(s.presence),"Par culte")}
      ${I("userCheck","Convertis",String(s.nouveaux),"Total réseau")}
    </div>
    <div class="grid-2 mb-20">
      <div class="card"><div class="form-section-title mb-12">Présence mensuelle ${new Date().getFullYear()}</div><div class="chart-wrap"><canvas id="chP"></canvas></div></div>
      <div class="card"><div class="form-section-title mb-12">Offrandes mensuelles ${new Date().getFullYear()}</div><div class="chart-wrap"><canvas id="chO"></canvas></div></div>
    </div>
    <div class="form-section-title mb-12">Performance par Extension</div>
    <div class="grid-3">
      ${e.map(i=>{const a=r.stats(i.id);return`<div class="ext-card" style="--ext-color:${i.couleur}">
            <div class="ext-card-name">${i.nom}</div>
            <div class="ext-card-ville">${d("mapPin")} ${i.ville}, ${i.pays}</div>
            <div class="ext-mini-stats mb-12">
              <div><div class="ext-stat-val">${a.cultes}</div><div class="ext-stat-lbl">Cultes</div></div>
              <div><div class="ext-stat-val">${a.presence}</div><div class="ext-stat-lbl">Moy.</div></div>
              <div><div class="ext-stat-val">${a.nouveaux}</div><div class="ext-stat-lbl">Conv.</div></div>
            </div>
            <div class="text-xs text-muted mb-4">Activité relative</div>
            <div class="progress-bar"><div class="progress-fill" style="width:${Math.round(a.cultes/l*100)}%;background:${i.couleur}"></div></div>
          </div>`}).join("")}
    </div>
  `);const n=o.map(i=>i.lbl);N("chP",n,o.map(i=>i.presence),"Présence","rgba(139,92,246,.7)"),N("chO",n,o.map(i=>i.offrandes),"Offrandes","rgba(245,158,11,.7)")}function ee(){x("/admin/extensions"),T("Extensions","Gestion du réseau","Admin");const t=r.getExts();M(`
    <div class="page-header">
      <div><h1>Extensions</h1><p>${t.length} extension(s)</p></div>
      <button class="btn btn-primary" onclick="openExtForm(null)">${d("plus")} Nouvelle Extension</button>
    </div>
    <div class="grid-auto">${t.map(ce).join("")}</div>
  `)}function ge(t={}){x("/admin/rapports"),T("Tous les Rapports","Réseau complet","Admin");const e=r.getExts(),s=t.ext||"",o=t.month!==void 0&&t.month!==""?parseInt(t.month):-1,l=t.year?parseInt(t.year):0;let n=r.getRaps(s||null);o>=0&&(n=n.filter(i=>new Date(i.date+"T00:00").getMonth()===o)),l&&(n=n.filter(i=>new Date(i.date+"T00:00").getFullYear()===l)),n.sort((i,a)=>a.date.localeCompare(i.date)),M(`
    <div class="page-header">
      <div><h1>Rapports de Culte</h1><p>${n.length} rapport(s)</p></div>
    </div>
    <div class="filter-bar">
      <select onchange="adminRapFilter(this,'ext')">
        <option value="">— Toutes les extensions —</option>
        ${e.map(i=>`<option value="${i.id}"${s===i.id?" selected":""}>${i.nom}</option>`).join("")}
      </select>
      <select onchange="adminRapFilter(this,'month')">
        <option value="">— Tous les mois —</option>
        ${Array.from({length:12},(i,a)=>`<option value="${a}"${o===a?" selected":""}>${Z(a)}</option>`).join("")}
      </select>
      <select onchange="adminRapFilter(this,'year')">
        <option value="">— Toutes années —</option>
        ${[2026,2025,2024,2023].map(i=>`<option value="${i}"${l===i?" selected":""}>${i}</option>`).join("")}
      </select>
    </div>
    <div class="table-wrap">
      <table>
        <thead><tr><th>Date</th><th>Extension</th><th>Modérateur</th><th>Présence</th><th>Offrandes</th><th>Convertis</th><th>Actions</th></tr></thead>
        <tbody>
          ${n.length===0?'<tr><td colspan="7" style="text-align:center;padding:32px;color:var(--text3)">Aucun rapport trouvé</td></tr>':""}
          ${n.map(ue).join("")}
        </tbody>
      </table>
    </div>`)}function we(){x("/admin/bilans"),T("Bilans Comparatifs","Analyse et synthèse","Admin");const t=r.getExts(),e=new Date().getFullYear(),s=r.monthly(null,e);M(`
    <div class="page-header">
      <div><h1>Bilans Comparatifs</h1><p>${t.length} extensions · ${e}</p></div>
    </div>
    <div class="grid-3 mb-20">
      ${t.map(l=>{const n=r.stats(l.id);return`<div class="card" style="border-left:3px solid ${l.couleur}">
            <div class="flex justify-between items-center mb-12">
              <div class="font-bold">${l.nom}</div>
              <span class="badge badge-purple">${l.symbole}</span>
            </div>
            <div class="calc-box">
              <div class="calc-row"><span>Cultes</span><span>${n.cultes}</span></div>
              <div class="calc-row"><span>Présence moy.</span><span>${n.presence}</span></div>
              <div class="calc-row"><span>Offrandes</span><span>${u(n.offrandes,l.symbole)}</span></div>
              <div class="calc-row total-row"><span>Convertis</span><span>${n.nouveaux}</span></div>
            </div>
          </div>`}).join("")}
    </div>
    <div class="card mb-20">
      <div class="form-section-title mb-12">Présence comparative par mois (${e})</div>
      <div class="chart-wrap" style="height:260px"><canvas id="chCmp"></canvas></div>
    </div>
    <div class="form-section-title mb-12">Tableau comparatif mensuel</div>
    <div class="table-wrap">
      <table>
        <thead><tr><th>Mois</th>${t.map(l=>`<th>${l.nom}</th>`).join("")}<th>Total</th></tr></thead>
        <tbody>
          ${s.map(l=>{const n=t.map(a=>r.monthly(a.id,e)[l.i].presence),i=n.reduce((a,c)=>a+c,0);return`<tr><td class="td-bold">${l.lbl} ${e}</td>${n.map(a=>`<td>${a||0}</td>`).join("")}<td class="td-bold">${i}</td></tr>`}).join("")}
        </tbody>
      </table>
    </div>
  `);const o=t.map(l=>({label:l.nom,data:r.monthly(l.id,e).map(n=>n.presence),borderColor:l.couleur,backgroundColor:l.couleur+"44"}));de("chCmp",s.map(l=>l.lbl),o)}function xe(){x("/admin/convertis"),T("Nouveaux Convertis","Suivi pastoral","Admin");const t=r.getExts(),e=r.allNouveaux();M(`
    <div class="page-header">
      <div><h1>Nouveaux Convertis</h1><p>${e.length} converti(s) enregistré(s)</p></div>
    </div>
    <div class="filter-bar mb-20">
      <select id="conv-ext-filter" onchange="this.dataset.v=this.value;pgAdminConvertis()">
        <option value="">— Toutes les extensions —</option>
        ${t.map(s=>`<option value="${s.id}">${s.nom}</option>`).join("")}
      </select>
    </div>
    <div class="table-wrap">
      <table>
        <thead><tr><th>Date</th><th>Extension</th><th>Nom</th><th>Téléphone</th><th>Actions</th></tr></thead>
        <tbody>
          ${e.length===0?'<tr><td colspan="5" style="text-align:center;padding:32px;color:var(--text3)">Aucun converti enregistré</td></tr>':""}
          ${e.map(s=>{const o=r.getExt(s.extId);return`<tr>
                <td class="td-bold">${B(s.date)}</td>
                <td><span class="badge" style="background:${(o==null?void 0:o.couleur)||"#8B5CF6"}22;color:${(o==null?void 0:o.couleur)||"#8B5CF6"};border:1px solid ${(o==null?void 0:o.couleur)||"#8B5CF6"}44">${(o==null?void 0:o.nom)||"—"}</span></td>
                <td>${s.nom}</td>
                <td>${s.tel||"—"}</td>
                <td><button class="btn btn-secondary btn-sm" onclick="showRapModal('${s.rapId}')">${d("eye")}</button></td>
              </tr>`}).join("")}
        </tbody>
      </table>
    </div>
  `)}function $e(){x("/admin/settings"),T("Paramètres","Configuration","Admin");const t=r.getSet();M(`
    <div class="page-header">
      <div><h1>Paramètres</h1><p>Configuration globale</p></div>
    </div>
    <div class="grid-2 mb-20">
      <div class="card">
        <div class="form-section-title mb-12">Identité du réseau</div>
        <div class="form-row">
          <label>Nom de l'organisation</label>
          <input id="set-nom" value="${t.nom||""}" />
        </div>
        <div class="form-row">
          <label>Mot de passe administrateur</label>
          <input id="set-admin-pw" type="password" value="${t.adminPw||""}" />
        </div>
        <button class="btn btn-primary mt-12" onclick="saveSettings()">${d("save")} Enregistrer</button>
      </div>
      <div class="card">
        <div class="form-section-title mb-12">Logo</div>
        <div class="form-row">
          <label>Charger un logo (PNG/JPG)</label>
          <input type="file" id="set-logo" accept="image/*" onchange="handleLogoUpload(this)" />
        </div>
        ${r.getLogo()?`<button class="btn btn-danger btn-sm mt-8" onclick="clearLogo()">${d("trash")} Supprimer le logo</button>`:""}
      </div>
    </div>
    <div class="card">
      <div class="form-section-title mb-12">Données</div>
      <div class="flex gap-12">
        <button class="btn btn-secondary" onclick="exportData()">${d("save")} Exporter les données</button>
        <button class="btn btn-secondary" onclick="document.getElementById('import-file').click()">${d("upload")} Importer les données</button>
        <input type="file" id="import-file" accept=".json" class="hidden" onchange="importData(this)" />
        <button class="btn btn-danger" onclick="resetData()">⚠ Réinitialiser tout</button>
      </div>
    </div>
  `)}function ye(t){x("/ext/dashboard");const e=r.getExt(t),s=r.stats(t),o=r.monthly(t,new Date().getFullYear());T("Tableau de Bord",(e==null?void 0:e.nom)||"Mon Extension",(e==null?void 0:e.ville)||""),M(`
    <div class="page-header">
      <div><h1>Bienvenue</h1><p>${(e==null?void 0:e.nom)||""}</p></div>
      <button class="btn btn-primary" onclick="navTo('/ext/new')">${d("plus")} Nouveau Rapport</button>
    </div>
    <div class="grid-4 mb-20">
      ${I("fileText","Cultes",String(s.cultes),"Total enregistrés")}
      ${I("users","Présence moy.",String(s.presence),"Par culte")}
      ${I("wallet","Offrandes",u(s.offrandes,(e==null?void 0:e.symbole)||"€"),"Total")}
      ${I("userCheck","Convertis",String(s.nouveaux),"Total")}
    </div>
    <div class="grid-2 mb-20">
      <div class="card"><div class="form-section-title mb-12">Présence mensuelle ${new Date().getFullYear()}</div><div class="chart-wrap"><canvas id="chP"></canvas></div></div>
      <div class="card"><div class="form-section-title mb-12">Offrandes mensuelles ${new Date().getFullYear()}</div><div class="chart-wrap"><canvas id="></div></divchO"></canvas>
    </div>
  `);const l=o.map(n=>n.lbl);N("chP",l,o.map(n=>n.presence),"Présence","rgba(139,92,246,.7)"),N("chO",l,o.map(n=>n.offrandes),"Offrandes","rgba(245,158,11,.7)")}let h=null,_=0;function j(t){x("/ext/new");const e=r.getExt(t);T("Nouveau Rapport",(e==null?void 0:e.nom)||"",""),H().rap&&h||(h={id:ie(),extensionId:t,date:new Date().toISOString().split("T")[0],heureDebut:"09:00",heureFin:"12:00",moderateur:(e==null?void 0:e.coordinateur)||"",predicateur:(e==null?void 0:e.pasteur.nom)||"",effectif:{papas:0,mamans:0,freres:0,soeurs:0,enfants:0,total:0},offrandes:{ordinaires:0,orateur:0,dimes:0,actionsGrace:0,total:0},ventilation:{dixPctDime:0,dixPctSocial:0,reste:0},depenses:[],nouveaux:[],signatures:{secretaire:(e==null?void 0:e.secretaire)||"",tresorier:(e==null?void 0:e.tresorier)||"",pasteur:(e==null?void 0:e.pasteur.nom)||""}},_=0);const l=(e==null?void 0:e.symbole)||"€",n=["Culte","Effectif","Offrandes","Dépenses","Convertis","Signature"],i=[{icon:"clock",label:"Culte"},{icon:"users",label:"Effectif"},{icon:"wallet",label:"Offrandes"},{icon:"download",label:"Dépenses"},{icon:"userCheck",label:"Convertis"},{icon:"pen",label:"Signature"}];M(`
    <div class="page-header">
      <div><h1>Nouveau Rapport</h1><p>${(e==null?void 0:e.nom)||""}</p></div>
    </div>
    <div class="stepper mb-20">
      ${n.map((a,c)=>`<div class="step-item">
              <div class="step-dot ${c===_?"s-active":""} ${c<_?"s-done":""}" onclick="goToStep(${c})">${c<_?"✓":c+1}</div>
              <span class="step-lbl ${c===_?"s-active":""}">${d(i[c].icon)} ${i[c].label}</span>
            </div>${c<n.length-1?'<div class="step-connector"></div>':""}`).join("")}
    </div>
    <div class="card">
      ${ke(h,l)}
    </div>
  `)}function Ee(t){_=t;const e=E.ses();(e==null?void 0:e.role)==="extension"&&j(e.extId)}function ke(t,e){var s,o,l,n,i,a,c,v,p,k,f,D,$,R,F,S,y,C,b,L;switch(_){case 0:return`
        <div class="form-section-title">Informations du culte</div>
        <div class="form-row cols-2">
          <div><label>Date *</label><input type="date" id="rf-date" value="${t.date}" /></div>
          <div><label>Thème</label><input type="text" id="rf-theme" value="${t.theme||""}" /></div>
        </div>
        <div class="form-row cols-2">
          <div><label>Heure de début</label><input type="time" id="rf-begin" value="${t.heureDebut||""}" /></div>
          <div><label>Heure de fin</label><input type="time" id="rf-end" value="${t.heureFin||""}" /></div>
        </div>
        <div class="form-row cols-2">
          <div><label>Modérateur</label><input type="text" id="rf-mod" value="${t.moderateur||""}" /></div>
          <div><label>Prédicateur</label><input type="text" id="rf-pred" value="${t.predicateur||""}" /></div>
        </div>
        <div class="form-row cols-2">
          <div><label>Interprète</label><input type="text" id="rf-int" value="${t.interprete||""}" /></div>
          <div><label>Textes bibliques</label><input type="text" id="rf-txt" value="${t.textes||""}" /></div>
        </div>
        <div class="flex justify-between mt-16">
          <button class="btn btn-secondary" onclick="navTo('/ext/dashboard')">Annuler</button>
          <button class="btn btn-primary" onclick="saveStep0()">Suivant →</button>
        </div>`;case 1:return`
        <div class="form-section-title">Effectif des présents</div>
        <div class="form-row cols-5">
          <div><label>Papas</label><input type="number" id="rf-papas" value="${((s=t.effectif)==null?void 0:s.papas)||0}" min="0" onchange="updateEffTotal()" /></div>
          <div><label>Mamans</label><input type="number" id="rf-mamans" value="${((o=t.effectif)==null?void 0:o.mamans)||0}" min="0" onchange="updateEffTotal()" /></div>
          <div><label>Frères</label><input type="number" id="rf-freres" value="${((l=t.effectif)==null?void 0:l.freres)||0}" min="0" onchange="updateEffTotal()" /></div>
          <div><label>Soeurs</label><input type="number" id="rf-soeurs" value="${((n=t.effectif)==null?void 0:n.soeurs)||0}" min="0" onchange="updateEffTotal()" /></div>
          <div><label>Enfants</label><input type="number" id="rf-enfants" value="${((i=t.effectif)==null?void 0:i.enfants)||0}" min="0" onchange="updateEffTotal()" /></div>
        </div>
        <div class="total-box mt-12">
          <span class="total-box-label">Total présence</span>
          <span class="total-box-value" id="rf-eff-total">${((a=t.effectif)==null?void 0:a.total)||0}</span>
        </div>
        <div class="flex justify-between mt-16">
          <button class="btn btn-secondary" onclick="goToStep(0)">← Précédent</button>
          <button class="btn btn-primary" onclick="saveStep1()">Suivant →</button>
        </div>`;case 2:const V=(((c=t.offrandes)==null?void 0:c.ordinaires)||0)+(((v=t.offrandes)==null?void 0:v.orateur)||0)+(((p=t.offrandes)==null?void 0:p.dimes)||0)+(((k=t.offrandes)==null?void 0:k.actionsGrace)||0);return`
        <div class="form-section-title">Offrandes (${e})</div>
        <div class="form-row cols-2">
          <div><label>Offrandes ordinaires</label><input type="number" id="rf-ord" value="${((f=t.offrandes)==null?void 0:f.ordinaires)||0}" min="0" onchange="updateOffTotals()" /></div>
          <div><label>Offrande orateur</label><input type="number" id="rf-ora" value="${((D=t.offrandes)==null?void 0:D.orateur)||0}" min="0" onchange="updateOffTotals()" /></div>
        </div>
        <div class="form-row cols-2">
          <div><label>Dîmes</label><input type="number" id="rf-dim" value="${(($=t.offrandes)==null?void 0:$.dimes)||0}" min="0" onchange="updateOffTotals()" /></div>
          <div><label>Actions de grâce</label><input type="number" id="rf-ag" value="${((R=t.offrandes)==null?void 0:R.actionsGrace)||0}" min="0" onchange="updateOffTotals()" /></div>
        </div>
        <div class="total-box mt-12">
          <span class="total-box-label">Total offrandes</span>
          <span class="total-box-value" id="rf-off-total">${u(V,e)}</span>
        </div>
        <div class="form-section-title mt-20">Ventilation</div>
        <div class="calc-box">
          <div class="calc-row"><span>10% des dîmes</span><span id="rf-vent-dim">${u(((F=t.ventilation)==null?void 0:F.dixPctDime)||0,e)}</span></div>
          <div class="calc-row"><span>10% social (totale)</span><span id="rf-vent-soc">${u(((S=t.ventilation)==null?void 0:S.dixPctSocial)||0,e)}</span></div>
          <div class="calc-row"><span>Reste</span><span id="rf-vent-reste">${u(((y=t.ventilation)==null?void 0:y.reste)||0,e)}</span></div>
        </div>
        <div class="flex justify-between mt-16">
          <button class="btn btn-secondary" onclick="goToStep(1)">← Précédent</button>
          <button class="btn btn-primary" onclick="saveStep2()">Suivant →</button>
        </div>`;case 3:const z=(t.depenses||[]).reduce((g,P)=>g+P.montant,0);return`
        <div class="form-section-title">Dépenses (${e})</div>
        <div id="dep-list">
          ${(t.depenses||[]).map((g,P)=>`<div class="dep-row"><input type="text" placeholder="Motif" value="${g.motif}" id="dep-mot-${P}"><input type="number" placeholder="Montant" value="${g.montant}" min="0" id="dep-mon-${P}" onchange="updateDepTotal(${P})"><button class="btn btn-danger btn-icon" onclick="removeDepRow(${P})">${d("x")}</button></div>`).join("")}
        </div>
        <button class="btn btn-secondary btn-sm mt-8" onclick="addDepRow()">${d("plus")} Ajouter une dépense</button>
        <div class="total-box mt-12">
          <span class="total-box-label">Total dépenses</span>
          <span class="total-box-value" id="rf-dep-total">${u(z,e)}</span>
        </div>
        <div class="flex justify-between mt-16">
          <button class="btn btn-secondary" onclick="goToStep(2)">← Précédent</button>
          <button class="btn btn-primary" onclick="saveStep3()">Suivant →</button>
        </div>`;case 4:return`
        <div class="form-section-title">Nouveaux convertis</div>
        <div id="conv-list">
          ${(t.nouveaux||[]).map((g,P)=>`<div class="conv-row"><input type="text" placeholder="Nom" value="${g.nom}" id="conv-nom-${P}"><input type="text" placeholder="Téléphone" value="${g.tel||""}" id="conv-tel-${P}"><button class="btn btn-danger btn-icon" onclick="removeConvRow(${P})">${d("x")}</button></div>`).join("")}
        </div>
        <button class="btn btn-secondary btn-sm mt-8" onclick="addConvRow()">${d("plus")} Ajouter un converti</button>
        <div class="flex justify-between mt-16">
          <button class="btn btn-secondary" onclick="goToStep(3)">← Précédent</button>
          <button class="btn btn-primary" onclick="saveStep4()">Suivant →</button>
        </div>`;case 5:return`
        <div class="form-section-title">Signatures</div>
        <div class="form-row">
          <label>Secrétaire</label>
          <input type="text" id="rf-sec" value="${((C=t.signatures)==null?void 0:C.secretaire)||""}" />
        </div>
        <div class="form-row">
          <label>Trésorier</label>
          <input type="text" id="rf-treso" value="${((b=t.signatures)==null?void 0:b.tresorier)||""}" />
        </div>
        <div class="form-row">
          <label>Pasteur</label>
          <input type="text" id="rf-past" value="${((L=t.signatures)==null?void 0:L.pasteur)||""}" />
        </div>
        <div class="flex justify-between mt-16">
          <button class="btn btn-secondary" onclick="goToStep(4)">← Précédent</button>
          <button class="btn btn-primary" onclick="saveStep5()">${d("save")} Enregistrer</button>
        </div>`;default:return""}}window.addDepRow=function(){if(!h)return;h.depenses=h.depenses||[],h.depenses.push({motif:"",montant:0});const t=E.ses();(t==null?void 0:t.role)==="extension"&&j(t.extId)};window.removeDepRow=function(t){if(!(h!=null&&h.depenses))return;h.depenses.splice(t,1);const e=E.ses();(e==null?void 0:e.role)==="extension"&&j(e.extId)};window.addConvRow=function(){if(!h)return;h.nouveaux=h.nouveaux||[],h.nouveaux.push({nom:"",tel:""});const t=E.ses();(t==null?void 0:t.role)==="extension"&&j(t.extId)};window.removeConvRow=function(t){if(!(h!=null&&h.nouveaux))return;h.nouveaux.splice(t,1);const e=E.ses();(e==null?void 0:e.role)==="extension"&&j(e.extId)};function te(t={}){x("/ext/rapports");const e=E.ses();if(!e||e.role!=="extension")return;const s=e.extId,o=r.getExt(s),l=t.month!==void 0&&t.month!==""?parseInt(t.month):-1,n=t.year?parseInt(t.year):0;let i=r.getRaps(s);l>=0&&(i=i.filter(a=>new Date(a.date+"T00:00").getMonth()===l)),n&&(i=i.filter(a=>new Date(a.date+"T00:00").getFullYear()===n)),i.sort((a,c)=>c.date.localeCompare(a.date)),T("Mes Rapports",(o==null?void 0:o.nom)||"",""),M(`
    <div class="page-header">
      <div><h1>Mes Rapports</h1><p>${i.length} rapport(s)</p></div>
      <button class="btn btn-primary" onclick="navTo('/ext/new')">${d("plus")} Nouveau</button>
    </div>
    <div class="filter-bar">
      <select onchange="extRapFilter(this,'month')">
        <option value="">— Tous les mois —</option>
        ${Array.from({length:12},(a,c)=>`<option value="${c}"${l===c?" selected":""}>${Z(c)}</option>`).join("")}
      </select>
      <select onchange="extRapFilter(this,'year')">
        <option value="">— Toutes années —</option>
        ${[2026,2025,2024,2023].map(a=>`<option value="${a}"${n===a?" selected":""}>${a}</option>`).join("")}
      </select>
    </div>
    <div class="table-wrap">
      <table>
        <thead><tr><th>Date</th><th>Présence</th><th>Offrandes</th><th>Convertis</th><th>Actions</th></tr></thead>
        <tbody>
          ${i.length===0?'<tr><td colspan="5" style="text-align:center;padding:32px;color:var(--text3)">Aucun rapport</td></tr>':""}
          ${i.map(a=>{var c,v,p;return`<tr>
            <td class="td-bold">${B(a.date)}</td>
            <td>${((c=a.effectif)==null?void 0:c.total)||0}</td>
            <td>${u((v=a.offrandes)==null?void 0:v.total,(o==null?void 0:o.symbole)||"€")}</td>
            <td>${((p=a.nouveaux)==null?void 0:p.length)||0}</td>
            <td>
              <div class="flex gap-8">
                <button class="btn btn-secondary btn-sm btn-icon" onclick="showRapModal('${a.id}')" title="Voir">${d("eye")}</button>
                <button class="btn btn-danger btn-sm btn-icon" onclick="doDeleteRap('${a.id}')" title="Supprimer">${d("trash")}</button>
              </div>
            </td>
          </tr>`}).join("")}
        </tbody>
      </table>
    </div>
  `)}window.extRapFilter=function(t,e){const s=H();t.value!==""?s[e]=t.value:delete s[e],A("/ext/rapports",s)};window.doDeleteRap=function(t){confirm("Supprimer ce rapport ?")&&(r.delRap(t),O("Rapport supprimé","success"),te())};function Se(t){x("/ext/bilans");const e=r.getExt(t),s=r.stats(t),o=new Date().getFullYear(),l=r.monthly(t,o);T("Bilans",(e==null?void 0:e.nom)||"",""),M(`
    <div class="page-header">
      <div><h1>Bilans</h1><p>${o}</p></div>
    </div>
    <div class="grid-3 mb-20">
      <div class="card" style="border-left:3px solid ${e==null?void 0:e.couleur}">
        <div class="calc-box">
          <div class="calc-row"><span>Cultes</span><span>${s.cultes}</span></div>
          <div class="calc-row"><span>Présence moy.</span><span>${s.presence}</span></div>
          <div class="calc-row"><span>Offrandes</span><span>${u(s.offrandes,(e==null?void 0:e.symbole)||"€")}</span></div>
          <div class="calc-row total-row"><span>Convertis</span><span>${s.nouveaux}</span></div>
        </div>
      </div>
    </div>
    <div class="card mb-20">
      <div class="form-section-title mb-12">Présence mensuelle (${o})</div>
      <div class="chart-wrap" style="height:200px"><canvas id="chM"></canvas></div>
    </div>
    <div class="form-section-title mb-12">Détails mensuels</div>
    <div class="table-wrap">
      <table>
        <thead><tr><th>Mois</th><th>Cultes</th><th>Présence</th><th>Offrandes</th><th>Convertis</th></tr></thead>
        <tbody>
          ${l.map(n=>`<tr>
            <td class="td-bold">${n.lbl} ${o}</td>
            <td>${n.cultes}</td>
            <td>${n.presence}</td>
            <td>${u(n.offrandes,(e==null?void 0:e.symbole)||"€")}</td>
            <td>${n.nouveaux}</td>
          </tr>`).join("")}
        </tbody>
      </table>
    </div>
  `),N("chM",l.map(n=>n.lbl),l.map(n=>n.presence),"Présence","rgba(139,92,246,.7)")}function Ce(t){x("/ext/convertis");const e=r.getExt(t),s=r.allNouveaux(t);T("Convertis",(e==null?void 0:e.nom)||"",""),M(`
    <div class="page-header">
      <div><h1>Nouveaux Convertis</h1><p>${s.length} converti(s)</p></div>
    </div>
    <div class="table-wrap">
      <table>
        <thead><tr><th>Date</th><th>Nom</th><th>Téléphone</th><th>Actions</th></tr></thead>
        <tbody>
          ${s.length===0?'<tr><td colspan="4" style="text-align:center;padding:32px;color:var(--text3)">Aucun converti</td></tr>':""}
          ${s.map(o=>`<tr>
            <td class="td-bold">${B(o.date)}</td>
            <td>${o.nom}</td>
            <td>${o.tel||"—"}</td>
            <td><button class="btn btn-secondary btn-sm" onclick="showRapModal('${o.rapId}')">${d("eye")}</button></td>
          </tr>`).join("")}
        </tbody>
      </table>
    </div>
  `)}window.confirmDelExt=function(t){const e=r.getExt(t);e&&Y(`<div class="modal-header"><h2>Supprimer l'extension</h2><button class="modal-close" onclick="closeModal()">${d("x")}</button></div>
    <div class="modal-body"><p style="color:var(--text2)">Supprimer <strong style="color:var(--text)">${e.nom}</strong> et tous ses rapports ? Action irréversible.</p></div>
    <div class="modal-footer">
      <button class="btn btn-secondary" onclick="closeModal()">Annuler</button>
      <button class="btn btn-danger" onclick="closeModal();Store.delExt('${t}');toast('Extension supprimée','success');pgAdminExts()">Confirmer</button>
    </div>`)};window.openExtForm=function(t){var o,l,n;const e=t?r.getExt(t):null;Y(`<div class="modal-header"><h2>${!!t?"Modifier":"Nouvelle"} Extension</h2><button class="modal-close" onclick="closeModal()">${d("x")}</button></div>
    <div class="modal-body">
      <div class="form-section-title mb-12">Identité</div>
      <div class="form-row cols-2">
        <div><label>Nom de l'extension *</label><input id="ef-nom" value="${(e==null?void 0:e.nom)||""}"/></div>
        <div><label>Date de création</label><input id="ef-date" type="date" value="${(e==null?void 0:e.dateCreation)||""}"/></div>
      </div>
      <div class="form-row cols-3">
        <div><label>Couleur</label><input id="ef-col" type="color" value="${(e==null?void 0:e.couleur)||"#8B5CF6"}"/></div>
        <div><label>Devise</label><select id="ef-dev" onchange="onDevChange()">
          ${ne.map(i=>`<option value="${i.c}" data-s="${i.s}" ${(e==null?void 0:e.devise)===i.c?"selected":""}>${i.c} — ${i.s}</option>`).join("")}
        </select></div>
        <div><label>Symbole</label><input id="ef-sym" value="${(e==null?void 0:e.symbole)||"€"}" placeholder="€"/></div>
      </div>
      <div class="form-section-title mb-12">Localisation</div>
      <div class="form-row"><label>Adresse complète</label><input id="ef-addr" value="${(e==null?void 0:e.adresse)||""}"/></div>
      <div class="form-row cols-2">
        <div><label>Ville</label><input id="ef-ville" value="${(e==null?void 0:e.ville)||""}"/></div>
        <div><label>Pays</label><input id="ef-pays" value="${(e==null?void 0:e.pays)||""}"/></div>
      </div>
      <div class="form-section-title mb-12">Équipe Pastorale</div>
      <div class="form-row cols-2">
        <div><label>Pasteur Principal</label><input id="ef-past" value="${((o=e==null?void 0:e.pasteur)==null?void 0:o.nom)||""}"/></div>
        <div><label>Email du Pasteur</label><input id="ef-email" type="email" value="${((l=e==null?void 0:e.pasteur)==null?void 0:l.email)||""}"/></div>
      </div>
      <div class="form-row cols-2">
        <div><label>Téléphone</label><input id="ef-tel" value="${((n=e==null?void 0:e.pasteur)==null?void 0:n.tel)||""}"/></div>
        <div><label>Coordinateur</label><input id="ef-coord" value="${(e==null?void 0:e.coordinateur)||""}"/></div>
      </div>
      <div class="form-row cols-2">
        <div><label>Secrétaire</label><input id="ef-sec" value="${(e==null?void 0:e.secretaire)||""}"/></div>
        <div><label>Trésorier</label><input id="ef-tres" value="${(e==null?void 0:e.tresorier)||""}"/></div>
      </div>
      <div class="form-section-title mb-12">Accès</div>
      <div class="form-row cols-2">
        <div><label>Mot de passe *</label><input id="ef-pw" value="${(e==null?void 0:e.password)||""}"/></div>
        <div></div>
      </div>
    </div>
    <div class="modal-footer">
      <button class="btn btn-secondary" onclick="closeModal()">Annuler</button>
      <button class="btn btn-primary" onclick="saveExtForm('${t||""}')">${d("save")} Enregistrer</button>
    </div>`,!0)};window.onDevChange=function(){const t=document.getElementById("ef-dev"),e=t.options[t.selectedIndex],s=document.getElementById("ef-sym");s&&e&&(s.value=e.dataset.s||"")};window.saveExtForm=function(t){var n;const e=i=>{var a,c;return((c=(a=document.getElementById(i))==null?void 0:a.value)==null?void 0:c.trim())||""},s=e("ef-nom");if(!s){O("Le nom est obligatoire","error");return}const o=e("ef-pw");if(!o){O("Mot de passe obligatoire","error");return}const l={id:t||"ext_"+Date.now(),nom:s,dateCreation:e("ef-date"),couleur:e("ef-col")||"#8B5CF6",devise:((n=document.getElementById("ef-dev"))==null?void 0:n.value)||"EUR",symbole:e("ef-sym")||"€",adresse:e("ef-addr"),ville:e("ef-ville"),pays:e("ef-pays"),pasteur:{nom:e("ef-past"),email:e("ef-email"),tel:e("ef-tel")},coordinateur:e("ef-coord"),secretaire:e("ef-sec"),tresorier:e("ef-tres"),password:o};r.saveExt(l),le(),O(`Extension "${s}" enregistrée`,"success"),ee()};window.adminRapFilter=function(t,e){const s=H();t.value!==""?s[e]=t.value:delete s[e],A("/admin/rapports",s)};window.showRapModal=pe;window.doExportPDF=ve;window.doExportDOCX=me;function Te(){if(ae(),window.switchTab=function(e){document.querySelectorAll(".login-tab").forEach((s,o)=>{s.classList.toggle("active",o===(e==="extension"?0:1))}),document.getElementById("panel-extension").classList.toggle("active",e==="extension"),document.getElementById("panel-admin").classList.toggle("active",e==="admin")},window.doLogin=function(e){const s=document.getElementById("login-error");if(s.style.display="none",e==="admin"){const o=document.getElementById("admin-pw").value;E.loginAdmin(o)?X():(s.textContent="Mot de passe incorrect.",s.style.display="block")}else{const o=document.getElementById("ext-select").value,l=document.getElementById("ext-pw").value;E.loginExt(o,l)?X():(s.textContent="Extension ou mot de passe incorrect.",s.style.display="block")}},window.doLogout=function(){E.logout(),location.reload()},window.toggleSidebar=function(){document.getElementById("sidebar").classList.toggle("open")},window.navTo=A,window.curPath=U,window.curParams=H,window.goToStep=Ee,E.ses()){X();return}re(),Q()}Te();
//# sourceMappingURL=index-BAlwJ-fz.js.map
