/* Build/test-only runtime. It never reads a browser's saved plans. */
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const root = path.resolve(__dirname, '..');

function application(stored = {}, blocked = false) {
  const values = new Map(Object.entries(stored)), nodes = new Map(), listeners = {}, handlers = {};
  const listen = (key,callback) => {
    (handlers[key] ||= []).push(callback);
    listeners[key] = (...args) => handlers[key].forEach(fn=>fn(...args));
  };
  const node = id => {
    if (!nodes.has(id)) nodes.set(id, {
      id, value: '', textContent: '', innerHTML: '', dataset: {},
      validity: {valid:true}, removeAttribute(){}, setAttribute(){}, focus(){}
    });
    return nodes.get(id);
  };
  const context = vm.createContext({
    console, Date, setTimeout:()=>1, clearTimeout(){},
    location:{hash:'#/playbook/before'}, navigator:{},
    localStorage:{getItem:k=>{if(blocked)throw Error('blocked');return values.get(k)||null;},
      setItem:(k,v)=>{if(blocked)throw Error('blocked');values.set(k,v);}},
    document:{getElementById:node,querySelectorAll:()=>[],
      body:{classList:{toggle(){}}},addEventListener:(k,v)=>listen('document-'+k,v)},
    window:{matchMedia:()=>({matches:true}),scrollTo(){},addEventListener:listen}
  });
  const html = fs.readFileSync(path.join(root,'index.html'),'utf8');
  vm.runInContext(html.match(/<script>([\s\S]*?)<\/script>/)[1],context);
  for (const file of ['assets/representative.js','assets/app.js'])
    vm.runInContext(fs.readFileSync(path.join(root,file),'utf8'),context);
  return {run:code=>vm.runInContext(code,context),node,values,listeners,context};
}
module.exports = {application};
