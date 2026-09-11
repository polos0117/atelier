/* Shared, read-only per-card records. No ES modules: works with existing pages. */
(function(root){
  'use strict';
  var indexPromise, cache = Object.create(null);
  function json(path){
    return fetch(path,{cache:'no-cache'}).then(function(r){
      if(!r.ok)throw new Error('Record unavailable: '+path);
      return r.json();
    });
  }
  function index(){
    if(!indexPromise)indexPromise=json('generation/index.json').catch(function(e){indexPromise=null;throw e;});
    return indexPromise;
  }
  function load(card){
    if(!cache[card])cache[card]=index().then(function(i){
      var id=i.cards&&i.cards[card];
      if(!id)return {settings:null,images:{}};
      if(!/^m-[a-f0-9]{16}$/.test(id))throw new Error('Invalid card record ID');
      var path='generation/'+id+'/';
      return Promise.all([json(path+'settings.json'),json(path+'images.json')]).then(function(parts){
        if(parts[0].card!==card)throw new Error('Card record mismatch');
        return {settings:parts[0],images:parts[1]};
      });
    }).catch(function(e){delete cache[card];throw e;});
    return cache[card];
  }
  root.PerMechRecords={load:load,index:index};
})(typeof window!=='undefined'?window:globalThis);
