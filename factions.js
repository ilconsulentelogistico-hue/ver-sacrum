// Shared faction identity and unit-token colors.
(() => {
  'use strict';
  const STYLES=Object.freeze({
    '-1':Object.freeze({owner:-1,id:'hostile',name:'Ostili',color:'#8A3C35',hostile:true}),
    '0':Object.freeze({owner:0,id:'terra-italica',name:'Terra Italica',color:'#B4442B'}),
    '1':Object.freeze({owner:1,id:'clan-guado',name:'Clan del Guado',color:'#496F87'}),
    '2':Object.freeze({owner:2,id:'lega-colline',name:'Lega delle Colline',color:'#697B4E'}),
    '3':Object.freeze({owner:3,id:'genti-neutrali',name:'Genti Neutrali',color:'#77746E',neutral:true})
  });
  const FALLBACK=['#8A5D3B','#5F7189','#6D7A50','#765D80','#8A6E42','#557A70'];
  const styleFor=owner=>{
    const n=Number.isFinite(Number(owner))?Number(owner):0,key=String(n);
    if(STYLES[key])return STYLES[key];
    return{owner:n,id:'faction-'+key,name:'Fazione '+key,color:FALLBACK[Math.abs(n)%FALLBACK.length]};
  };
  window.TERRA_FACTIONS=STYLES;
  window.terraFactionStyle=styleFor;
})();