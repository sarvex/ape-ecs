!function(root,factory){"object"==typeof exports&&"object"==typeof module?module.exports=factory():"function"==typeof define&&define.amd?define("ApeECS",[],factory):"object"==typeof exports?exports.ApeECS=factory():root.ApeECS=factory()}(window,(function(){return function(modules){var installedModules={};function __webpack_require__(moduleId){if(installedModules[moduleId])return installedModules[moduleId].exports;var module=installedModules[moduleId]={i:moduleId,l:!1,exports:{}};return modules[moduleId].call(module.exports,module,module.exports,__webpack_require__),module.l=!0,module.exports}return __webpack_require__.m=modules,__webpack_require__.c=installedModules,__webpack_require__.d=function(exports,name,getter){__webpack_require__.o(exports,name)||Object.defineProperty(exports,name,{enumerable:!0,get:getter})},__webpack_require__.r=function(exports){"undefined"!=typeof Symbol&&Symbol.toStringTag&&Object.defineProperty(exports,Symbol.toStringTag,{value:"Module"}),Object.defineProperty(exports,"__esModule",{value:!0})},__webpack_require__.t=function(value,mode){if(1&mode&&(value=__webpack_require__(value)),8&mode)return value;if(4&mode&&"object"==typeof value&&value&&value.__esModule)return value;var ns=Object.create(null);if(__webpack_require__.r(ns),Object.defineProperty(ns,"default",{enumerable:!0,value:value}),2&mode&&"string"!=typeof value)for(var key in value)__webpack_require__.d(ns,key,function(key){return value[key]}.bind(null,key));return ns},__webpack_require__.n=function(module){var getter=module&&module.__esModule?function(){return module.default}:function(){return module};return __webpack_require__.d(getter,"a",getter),getter},__webpack_require__.o=function(object,property){return Object.prototype.hasOwnProperty.call(object,property)},__webpack_require__.p="",__webpack_require__(__webpack_require__.s=5)}([function(module,exports,__webpack_require__){__webpack_require__(2);const idGen=new(0,__webpack_require__(1).IdGenerator);module.exports=class{constructor(){this.types={},this.c={},this.id="",this.tags=new Set,this.updatedComponents=0,this.updatedValues=0,this.destroyed=!1,this.ready=!1}_setup(definition){if(this.destroyed=!1,definition.id?this.id=definition.id:this.id=idGen.genId(),this.world.entities.set(this.id,this),this.updatedComponents=this.world.currentTick,definition.tags)for(const tag of definition.tags)this.addTag(tag);if(definition.components)for(const compdef of definition.components)this.addComponent(compdef);if(definition.c){const defs=definition.c;for(const key of Object.keys(defs)){const comp={...defs[key],key:key};comp.type||(comp.type=key),this.addComponent(comp)}}this.ready=!0,this.world._entityUpdated(this)}has(type){return"string"!=typeof type&&(type=type.name),this.tags.has(type)||this.types.hasOwnProperty(type)}getOne(type){let component;return"string"!=typeof type&&(type=type.name),this.types[type]&&(component=[...this.types[type]][0]),component}getComponents(type){return"string"!=typeof type&&(type=type.name),this.types[type]||new Set}addTag(tag){if(!this.world.tags.has(tag))throw new Error(`addTag "${tag}" is not registered. Type-O?`);this.tags.add(tag),this.updatedComponents=this.world.currentTick,this.world.entitiesByComponent[tag].add(this.id),this.ready&&this.world._entityUpdated(this)}removeTag(tag){this.tags.delete(tag),this.updatedComponents=this.world.currentTick,this.world.entitiesByComponent[tag].delete(this.id),this.world._entityUpdated(this)}addComponent(properties){const type=properties.type,pool=this.world.componentPool.get(type);if(void 0===pool)throw new Error(`Component "${type}" has not been registered.`);const comp=pool.get(this,properties);return this.types[type]||(this.types[type]=new Set),this.types[type].add(comp),this.world._addEntityComponent(type,this),this.updatedComponents=this.world.currentTick,this.ready&&this.world._entityUpdated(this),comp}removeComponent(component){return"string"==typeof component&&(component=this.c[component]),void 0!==component&&(component.key&&delete this.c[component.key],this.types[component.type].delete(component),0===this.types[component.type].size&&delete this.types[component.type],this.world._deleteEntityComponent(component),this.world._entityUpdated(this),component.destroy(),!0)}getObject(componentIds=!0){const obj={id:this.id,tags:[...this.tags],components:[],c:{}};for(const type of Object.keys(this.types))for(const comp of this.types[type])comp.constructor.serialize&&(comp.key?obj.c[comp.key]=comp.getObject(componentIds):obj.components.push(comp.getObject(componentIds)));return obj}destroy(){if(this.world.refs[this.id])for(const ref of this.world.refs[this.id]){const[entityId,componentId,prop,sub]=ref.split("..."),entity=this.world.getEntity(entityId);if(!entity)continue;const component=entity.world.componentsById.get(componentId);if(!component)continue;const path=prop.split(".");let target=component,parent=target;for(const prop of path)parent=target,target=target[prop];"__set__"===sub?target.delete(this):"__obj__"===sub?delete parent[path[1]]:parent[prop]=null}for(const type of Object.keys(this.types))for(const component of this.types[type])this.removeComponent(component);this.tags.clear(),this.world.entities.delete(this.id),delete this.world.entityReverse[this.id],this.destroyed=!0,this.ready=!1,this.world.entityPool.destroy(this),this.world._clearIndexes(this)}}},function(module,exports,__webpack_require__){const uuid=__webpack_require__(11).v4;module.exports={IdGenerator:class{constructor(){this.gen_num=0,this.prefix="",this.genPrefix()}genPrefix(){return uuid()}genId(){return this.gen_num++,4294967295===this.gen_num&&(this.gen_num=0,this.genPrefix()),this.prefix+this.gen_num}},setIntersection:function(){let sets=Array.from(arguments),setSizes=sets.map(set=>set.size),smallestSetIndex=setSizes.indexOf(Math.min.apply(Math,setSizes)),smallestSet=sets[smallestSetIndex],result=new Set(smallestSet);return sets.splice(smallestSetIndex,1),smallestSet.forEach(value=>{for(let i=0;i<sets.length;i+=1)if(!sets[i].has(value)){result.delete(value);break}}),result},setUnion:function(){let result=new Set;return Array.from(arguments).forEach(set=>{set.forEach(value=>result.add(value))}),result}}},function(module,exports,__webpack_require__){const idGen=new(__webpack_require__(1).IdGenerator);class Component{constructor(){this._meta={key:"",updated:0,entityId:"",refs:new Set,ready:!1,values:{}}}preInit(initial){return initial}init(initial){}get type(){return this.constructor.name}get key(){return this._meta.key}set key(value){const old=this._meta.key;this._meta.key=value,old&&delete this.entity.c[old],value&&(this.entity.c[value]=this)}destroy(){this.preDestroy(),this._meta.values={};for(const ref of this._meta.refs){const[value,prop,sub]=ref.split("||");this.world._deleteRef(value,this._meta.entityId,this.id,prop,sub,this._meta.key,this.type)}this.world._sendChange({op:"destroy",component:this.id,entity:this._meta.entityId,type:this.type}),this.world.componentsById.delete(this.id),this.world.componentPool.get(this.type).release(this),this.postDestroy()}preDestroy(){}postDestroy(){}getObject(withIds=!0){const obj={type:this.constructor.name};withIds&&(obj.id=this.id,obj.entity=this.entity.id);let fields=this.constructor.serializeFields||this.constructor.fields;Array.isArray(this.constructor.skipSerializeFields)&&(fields=fields.filter((field,idx,arr)=>-1===this.constructor.skipSerializeFields.indexOf(field)));for(const field of fields)void 0!==this[field]&&null!==this[field]&&"function"==typeof this[field].getValue?obj[field]=this[field].getValue():this._meta.values.hasOwnProperty(field)?obj[field]=this._meta.values[field]:obj[field]=this[field];return this._meta.key&&(obj.key=this._meta.key),obj}_setup(entity,initial){this.entity=entity,this.id=initial.id||idGen.genId(),this._meta.updated=this.world.currentTick,this._meta.entityId=entity.id,initial.key&&(this.key=initial.key),this._meta.values={},this.world.componentsById.set(this.id,this);const fields=this.constructor.fields,primitives=this.constructor.primitives,factories=this.constructor.factories;initial=this.preInit(initial);const values=Object.assign({},primitives,initial);for(const field of fields){const value=values[field];if(factories.hasOwnProperty(field)){const res=factories[field](this,value,field);void 0!==res&&(this[field]=res)}else this[field]=value}this._meta.ready=!0,Object.freeze(),this.init(initial),this.world._sendChange({op:"add",component:this.id,entity:this._meta.entityId,type:this.type})}_reset(){this._meta.key="",this._meta.updated=0,this._meta.entityId=0,this._meta.ready=!1,this._meta.refs.clear(),this._meta.values={}}update(values){if(values&&(delete values.type,Object.assign(this,values),this.constructor.changeEvents)){const change={op:"change",props:[],component:this.id,entity:this._meta.entityId,type:this.type};for(const prop in values)change.props.push(prop);this.world._sendChange(change)}this._meta.updated=this.entity.updatedValues=this.world.currentTick}_addRef(value,prop,sub){this._meta.refs.add(`${value}||${prop}||${sub}`),this.world._addRef(value,this._meta.entityId,this.id,prop,sub,this._meta.key,this.type)}_deleteRef(value,prop,sub){this._meta.refs.delete(`${value}||${prop}||${sub}`),this.world._deleteRef(value,this._meta.entityId,this.id,prop,sub,this._meta.key,this.type)}}Component.properties={},Component.serialize=!0,Component.serializeFields=null,Component.skipSerializeFields=null,Component.subbed=!1,module.exports=Component},function(module,exports,__webpack_require__){__webpack_require__(0);const Util=__webpack_require__(1);module.exports=class{constructor(world,system,init){if(this.system=system,this.world=world,this.query={froms:[],filters:[]},this.hasStatic=!1,this.persisted=!1,this.results=new Set,this.executed=!1,this.added=new Set,this.removed=new Set,this.world.config.useApeDestroy&&!init&&this.not("ApeDestroy"),init){if(this.trackAdded=init.trackAdded||!1,this.trackRemoved=init.trackRemoved||!1,(this.trackAdded||this.trackRemoved)&&!this.system)throw new Error("Queries cannot track added or removed when initialized outside of a system");this.world.config.useApeDestroy&&!init.includeApeDestroy&&(init.not?init.not.push("ApeDestroy"):init.not=["ApeDestroy"]),init.from&&this.from(...init.from),init.reverse&&this.fromReverse(init.reverse.entity,init.reverse.type),init.all&&this.fromAll(...init.all),init.any&&this.fromAny(...init.any),init.not&&this.not(...init.not),init.only&&this.only(...init.only),init.persist&&this.persist()}}from(...entities){return entities=entities.map(e=>"string"!=typeof e?e.id:e),this.query.froms.push({from:"from",entities:entities}),this.hasStatic=!0,this}fromReverse(entity,componentName){return"string"==typeof entity&&(entity=this.world.getEntity(entity)),"function"==typeof componentName&&(componentName=componentName.name),this.query.froms.push({from:"reverse",entity:entity,type:componentName}),this}fromAll(...types){const stringTypes=types.map(t=>"string"!=typeof t?t.name:t);return this.query.froms.push({from:"all",types:stringTypes}),this}fromAny(...types){const stringTypes=types.map(t=>"string"!=typeof t?t.name:t);return this.query.froms.push({from:"any",types:stringTypes}),this}not(...types){const stringTypes=types.map(t=>"string"!=typeof t?t.name:t);return this.query.filters.push({filter:"not",types:stringTypes}),this}only(...types){const stringTypes=types.map(t=>"string"!=typeof t?t.name:t);return this.query.filters.push({filter:"only",types:stringTypes}),this}update(entity){let inFrom=!1;for(const source of this.query.froms)if("all"===source.from){let found=!0;for(const type of source.types)if(!entity.has(type)){found=!1;break}if(found){inFrom=!0;break}}else if("any"===source.from){let found=!1;for(const type of source.types)if(entity.has(type)){found=!0;break}if(found){inFrom=!0;break}}else if("reverse"===source.from&&this.world.entityReverse.hasOwnProperty(source.entity.id)&&this.world.entityReverse[source.entity.id].hasOwnProperty(source.type)){new Set(this.world.entityReverse[source.entity.id][source.type].keys());if(new Set(this.world.entityReverse[source.entity.id][source.type].keys()).has(entity.id)){inFrom=!0;break}}inFrom?(this.results.add(entity),this._filter(entity),this.trackAdded&&this.added.add(entity)):this._removeEntity(entity)}_removeEntity(entity){this.results.has(entity)&&this.trackRemoved&&this.removed.add(entity),this.results.delete(entity)}persist(trackAdded,trackRemoved){if(this.hasStatic)throw new Error("Cannot persist query with static list of entities.");if(0===this.query.froms.length)throw new Error("Cannot persist query without entity source (fromAll, fromAny, fromReverse).");return this.world.queries.push(this),null!==this.system&&this.system.queries.push(this),"boolean"==typeof trackAdded&&(this.trackAdded=trackAdded),"boolean"==typeof trackRemoved&&(this.trackRemoved=trackRemoved),this.persisted=!0,this}clearChanges(){this.added.clear(),this.removed.clear()}refresh(){let results=new Set;for(const source of this.query.froms)if("from"===source.from)results=Util.setUnion(results,source.entities);else if("all"===source.from)if(1===source.types.length){if(!this.world.entitiesByComponent.hasOwnProperty(source.types[0]))throw new Error(source.types[0]+" is not a registered Component/Tag");results=Util.setUnion(results,this.world.entitiesByComponent[source.types[0]])}else{const comps=[];for(const type of source.types){const entities=this.world.entitiesByComponent[type];if(void 0===entities)throw new Error(type+" is not a registered Component/Tag");comps.push(entities)}results=Util.setUnion(results,Util.setIntersection(...comps))}else if("any"===source.from){const comps=[];for(const type of source.types){const entities=this.world.entitiesByComponent[type];if(void 0===entities)throw new Error(type+" is not a registered Component/Tag");comps.push(entities)}results=Util.setUnion(results,...comps)}else"reverse"===source.from&&this.world.entityReverse[source.entity.id]&&this.world.entityReverse[source.entity.id].hasOwnProperty(source.type)&&(results=Util.setUnion(results,new Set([...this.world.entityReverse[source.entity.id][source.type].keys()])));this.results=new Set([...results].map(id=>this.world.getEntity(id)).filter(entity=>!!entity));for(const entity of this.results)this._filter(entity);return this.trackAdded&&(this.added=new Set(this.results)),this}_filter(entity){for(const filter of this.query.filters)if("not"===filter.filter){for(const type of filter.types)if(entity.has(type)){this.results.delete(entity);break}}else if("only"===filter.filter){let found=!1;for(const type of filter.types)if(entity.has(type)){found=!0;break}found||this.results.delete(entity)}}execute(filter){if(this.executed||this.refresh(),this.executed=!0,void 0===filter||!filter.hasOwnProperty("updatedComponents")&&!filter.hasOwnProperty("updatedValues"))return this.results;const output=[];for(const entity of this.results)filter.updatedComponents&&entity.updatedComponents<filter.updatedComponents||filter.updatedValues&&entity.updatedValues<filter.updatedValues||output.push(entity);return new Set(output)}}},function(module,exports,__webpack_require__){const Query=__webpack_require__(3);module.exports=class{constructor(world){if(this.world=world,this._stagedChanges=[],this.changes=[],this.queries=[],this.lastTick=this.world.currentTick,this.constructor.subscriptions)for(const sub of this.constructor.subscriptions)this.subscribe(sub);this.init()}init(){}update(tick){}createQuery(init){return new Query(this.world,this,init)}subscribe(type){this.world.subscriptions.has(type)||(this.world.componentTypes[type].subbed=!0,this.world.subscriptions.set(type,new Set)),this.world.subscriptions.get(type).add(this)}_preUpdate(){this.changes=this._stagedChanges,this._stagedChanges=[],this.world.updateIndexes()}_postUpdate(){for(const query of this.queries)query.clearChanges()}_recvChange(change){this._stagedChanges.push(change)}}},function(module,exports,__webpack_require__){const{EntityRef:EntityRef,EntitySet:EntitySet,EntityObject:EntityObject}=__webpack_require__(6);module.exports={World:__webpack_require__(7),System:__webpack_require__(4),Component:__webpack_require__(2),Entity:__webpack_require__(0),EntityRef:EntityRef,EntitySet:EntitySet,EntityObject:EntityObject}},function(module,exports){class EntitySet extends Set{constructor(component,object,field){super(),this.component=component,this.field=field,this.sub="__set__",object=object.map(value=>"string"==typeof value?value:value.id),this.dvalue=object;for(const item of object)this.add(item)}_reset(){this.clear();for(const item of this.dvalue)this.add(item)}add(value){value.id&&(value=value.id),this.component._addRef(value,this.field,"__set__"),super.add(value)}delete(value){value.id&&(value=value.id),this.component._deleteRef(value,this.field,"__set__");return super.delete(value)}has(value){return value.id&&(value=value.id),super.has(value)}[Symbol.iterator](){const that=this,siterator=super[Symbol.iterator]();return{next(){const result=siterator.next();return"string"==typeof result.value&&(result.value=that.component.entity.world.getEntity(result.value)),result}}}getValue(){return[...this].map(entity=>entity.id)}}module.exports={EntityRef(comp,dvalue,field){dvalue=dvalue||null,comp.hasOwnProperty(field)||Object.defineProperty(comp,field,{get:()=>comp.world.getEntity(comp._meta.values[field]),set(value){const old=comp._meta.values[field];value=value&&"string"!=typeof value?value.id:value,old&&old!==value&&comp._deleteRef(old,field,void 0),value&&value!==old&&comp._addRef(value,field,void 0),comp._meta.values[field]=value}}),comp[field]=dvalue},EntityObject(comp,object,field){comp._meta.values[field]=object||{};const values=comp._meta.values[field],keys=Object.keys(values);for(const key of keys)values[key]&&values[key].id&&(values[key]=values[key].id);return new Proxy(comp._meta.values[field],{get:(obj,prop)=>comp.world.getEntity(obj[prop]),set(obj,prop,value){const old=obj[prop];return value&&value.id&&(value=value.id),obj[prop]=value,old&&old!==value&&comp._deleteRef(old,`${field}.${prop}`,"__obj__"),value&&value!==old&&comp._addRef(value,`${field}.${prop}`,"__obj__"),!0},deleteProperty(obj,prop){if(!obj.hasOwnProperty(prop))return!1;const old=obj[prop];return delete obj[prop],comp._deleteRef(old,`${field}.${prop}`,"__obj__"),!0}})},EntitySet:(component,object=[],field)=>new EntitySet(component,object,field)}},function(module,exports,__webpack_require__){const Entity=__webpack_require__(0),Query=__webpack_require__(3),ComponentPool=__webpack_require__(8),EntityPool=__webpack_require__(9),setupApeDestroy=__webpack_require__(10),componentReserved=new Set(["constructor","init","type","key","destroy","preDestroy","postDestroy","getObject","_setup","_reset","update","clone","_meta","_addRef","_deleteRef","prototype"]);module.exports=class{constructor(config){this.config=Object.assign({trackChanges:!0,entityPool:10,cleanupPools:!0,useApeDestroy:!1},config),this.currentTick=0,this.entities=new Map,this.types={},this.tags=new Set,this.entitiesByComponent={},this.componentsById=new Map,this.entityReverse={},this.updatedEntities=new Set,this.componentTypes={},this.components=new Map,this.queries=[],this.subscriptions=new Map,this.systems=new Map,this.refs={},this.componentPool=new Map,this._statCallback=null,this._statTicks=0,this._nextStat=0,this.entityPool=new EntityPool(this,this.config.entityPool),this.config.useApeDestroy&&setupApeDestroy(this)}tick(){if(this.config.useApeDestroy&&this.runSystems("ApeCleanup"),this.currentTick++,this.updateIndexes(),this.entityPool.release(),this.config.cleanupPools){this.entityPool.cleanup();for(const[key,pool]of this.componentPool)pool.cleanup()}return this._statCallback&&(this._nextStat+=1,this._nextStat>=this._statTicks&&this._outputStats()),this.currentTick}getStats(){const stats={entity:{active:this.entities.size,pooled:this.entityPool.pool.length,target:this.entityPool.targetSize},components:{}};for(const[key,pool]of this.componentPool)stats.components[key]={active:pool.active,pooled:pool.pool.length,target:pool.targetSize};return stats}logStats(freq,callback){void 0===callback&&(callback=console.log),this._statCallback=callback,this._statTicks=freq,this._nextStat=0}_outputStats(){const stats=this.getStats();this._nextStat=0;let output=`${this.currentTick}, Entities: ${stats.entity.active} active, ${stats.entity.pooled}/${stats.entity.target} pooled`;for(const key of Object.keys(stats.components)){const cstat=stats.components[key];output+=`\n${this.currentTick}, ${key}: ${cstat.active} active, ${cstat.pooled}/${cstat.target} pooled`}this._statCallback(output)}_addRef(target,entity,component,prop,sub,key,type){this.refs[target]||(this.refs[target]=new Set);this.getEntity(target);this.entityReverse.hasOwnProperty(target)||(this.entityReverse[target]={}),this.entityReverse[target].hasOwnProperty(key)||(this.entityReverse[target][key]=new Map);const reverse=this.entityReverse[target][key];let count=reverse.get(entity);void 0===count&&(count=0),reverse.set(entity,count+1),this.refs[target].add([entity,component,prop,sub].join("...")),this._sendChange({op:"addRef",component:component,type:type,property:prop,target:target,entity:entity})}_deleteRef(target,entity,component,prop,sub,key,type){const ref=this.entityReverse[target][key];let count=ref.get(entity);count--,count<1?ref.delete(entity):ref.set(entity,count),0===ref.size&&delete ref[key],this.refs[target].delete([entity,component,prop,sub].join("...")),0===this.refs[target].size&&delete this.refs[target],this._sendChange({op:"deleteRef",component:component,type:type,target:target,entity:entity,property:prop})}registerTags(...tags){for(const tag of tags){if(this.entitiesByComponent.hasOwnProperty(tag))throw new Error(`Cannot register tag "${tag}", name is already taken.`);this.entitiesByComponent[tag]=new Set,this.tags.add(tag)}}registerComponent(klass,spinup=1){const name=klass.name;if(this.tags.has(name))throw new Error(`registerComponent: Tag already defined for "${name}"`);if(this.componentTypes.hasOwnProperty(name))throw new Error(`registerComponent: Component already defined for "${name}"`);klass.prototype.world=this,this.componentTypes[name]=klass,klass.fields=Object.keys(klass.properties),klass.primitives={},klass.factories={};for(const field of klass.fields){if(componentReserved.has(field))throw new Error(`Error registering ${klass.name}: Reserved property name "${field}"`);"function"==typeof klass.properties[field]?klass.factories[field]=klass.properties[field]:klass.primitives[field]=klass.properties[field]}this.entitiesByComponent[name]=new Set,this.componentPool.set(name,new ComponentPool(this,name,spinup))}createEntity(definition){return this.entityPool.get(definition)}getObject(){const obj=[];for(const kv of this.entities)obj.push(kv[1].getObject());return obj}createEntities(definition){for(const entityDef of definition)this.createEntity(entityDef)}copyTypes(world,types){for(const name of types)if(world.tags.has(name))this.registerTags(name);else{const klass=world.componentTypes[name];this.componentTypes[name]=klass,this.entitiesByComponent[name]=new Set,this.componentPool.set(name,new ComponentPool(this,name,1))}}removeEntity(id){let entity;id instanceof Entity?(entity=id,id=entity.id):entity=this.getEntity(id),entity.destroy()}getEntity(entityId){return this.entities.get(entityId)}getEntities(type){"string"!=typeof type&&(type=type.name);const results=[...this.entitiesByComponent[type]];return new Set(results.map(id=>this.getEntity(id)))}getComponent(id){return this.componentsById.get(id)}createQuery(init){return new Query(this,null,init)}_sendChange(operation){if(this.componentTypes[operation.type].subbed){const systems=this.subscriptions.get(operation.type);if(!systems)return;for(const system of systems)system._recvChange(operation)}}registerSystem(group,system){return"function"==typeof system&&(system=new system(this)),this.systems.has(group)||this.systems.set(group,new Set),this.systems.get(group).add(system),system}runSystems(group){const systems=this.systems.get(group);if(systems)for(const system of systems)system._preUpdate(),system.update(this.currentTick),system._postUpdate(),system.lastTick=this.currentTick,0!==system.changes.length&&(system.changes=[])}_entityUpdated(entity){this.config.trackChanges&&this.updatedEntities.add(entity)}_addEntityComponent(name,entity){this.entitiesByComponent[name].add(entity.id)}_deleteEntityComponent(component){this.entitiesByComponent[component.type].delete(component._meta.entityId)}_clearIndexes(entity){for(const query of this.queries)query._removeEntity(entity);this.updatedEntities.delete(entity)}updateIndexes(){for(const entity of this.updatedEntities)this._updateIndexesEntity(entity);this.updatedEntities.clear()}_updateIndexesEntity(entity){for(const query of this.queries)query.update(entity)}}},function(module,exports){module.exports=class{constructor(world,type,spinup){this.world=world,this.type=type,this.klass=this.world.componentTypes[this.type],this.pool=[],this.targetSize=spinup,this.active=0,this.spinUp(spinup)}get(entity,initial){let comp;return comp=0===this.pool.length?new this.klass(entity,initial):this.pool.pop(),comp._setup(entity,initial),this.active++,comp}release(comp){comp._reset(),this.pool.push(comp),this.active--}cleanup(){if(this.pool.length>2*this.targetSize){const diff=this.pool.length-this.targetSize,chunk=Math.max(Math.min(20,diff),Math.floor(diff/4));for(let i=0;i<chunk;i++)this.pool.pop()}}spinUp(count){for(let i=0;i<count;i++){const comp=new this.klass;this.pool.push(comp)}this.targetSize=Math.max(this.targetSize,this.pool.length)}}},function(module,exports,__webpack_require__){const Entity=__webpack_require__(0);module.exports=class{constructor(world,spinup){this.world=world,this.pool=[],this.destroyed=[],this.worldEntity=class extends Entity{},this.worldEntity.prototype.world=this.world,this.spinUp(spinup),this.targetSize=spinup}destroy(entity){this.destroyed.push(entity)}get(definition,onlyComponents=!1){let entity;return entity=0===this.pool.length?new this.worldEntity:this.pool.pop(),entity._setup(definition,onlyComponents),entity}release(){for(;this.destroyed.length>0;){const entity=this.destroyed.pop();this.pool.push(entity)}}cleanup(){if(this.pool.length>2*this.targetSize){const diff=this.pool.length-this.targetSize,chunk=Math.max(Math.min(20,diff),Math.floor(diff/4));for(let i=0;i<chunk;i++)this.pool.pop()}}spinUp(count){for(let i=0;i<count;i++){const entity=new this.worldEntity;this.pool.push(entity)}this.targetSize=Math.max(this.targetSize,this.pool.length)}}},function(module,exports,__webpack_require__){const System=__webpack_require__(4);class CleanupApeDestroySystem extends System{init(){this.destroyQuery=this.createQuery({includeApeDestroy:!0}).fromAll("ApeDestroy").persist()}update(){const entities=this.destroyQuery.execute();for(const entity of entities)entity.destroy()}}module.exports=function(world){world.registerTags("ApeDestroy"),world.registerSystem("ApeCleanup",CleanupApeDestroySystem)}},function(module,__webpack_exports__,__webpack_require__){"use strict";__webpack_require__.r(__webpack_exports__),__webpack_require__.d(__webpack_exports__,"v1",(function(){return esm_browser_v1})),__webpack_require__.d(__webpack_exports__,"v3",(function(){return esm_browser_v3})),__webpack_require__.d(__webpack_exports__,"v4",(function(){return esm_browser_v4})),__webpack_require__.d(__webpack_exports__,"v5",(function(){return esm_browser_v5})),__webpack_require__.d(__webpack_exports__,"NIL",(function(){return nil})),__webpack_require__.d(__webpack_exports__,"version",(function(){return esm_browser_version})),__webpack_require__.d(__webpack_exports__,"validate",(function(){return esm_browser_validate})),__webpack_require__.d(__webpack_exports__,"stringify",(function(){return esm_browser_stringify})),__webpack_require__.d(__webpack_exports__,"parse",(function(){return esm_browser_parse}));var getRandomValues="undefined"!=typeof crypto&&crypto.getRandomValues&&crypto.getRandomValues.bind(crypto)||"undefined"!=typeof msCrypto&&"function"==typeof msCrypto.getRandomValues&&msCrypto.getRandomValues.bind(msCrypto),rnds8=new Uint8Array(16);function rng(){if(!getRandomValues)throw new Error("crypto.getRandomValues() not supported. See https://github.com/uuidjs/uuid#getrandomvalues-not-supported");return getRandomValues(rnds8)}var regex=/^(?:[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}|00000000-0000-0000-0000-000000000000)$/i;for(var esm_browser_validate=function(uuid){return"string"==typeof uuid&&regex.test(uuid)},byteToHex=[],stringify_i=0;stringify_i<256;++stringify_i)byteToHex.push((stringify_i+256).toString(16).substr(1));var _nodeId,_clockseq,esm_browser_stringify=function(arr){var offset=arguments.length>1&&void 0!==arguments[1]?arguments[1]:0,uuid=(byteToHex[arr[offset+0]]+byteToHex[arr[offset+1]]+byteToHex[arr[offset+2]]+byteToHex[arr[offset+3]]+"-"+byteToHex[arr[offset+4]]+byteToHex[arr[offset+5]]+"-"+byteToHex[arr[offset+6]]+byteToHex[arr[offset+7]]+"-"+byteToHex[arr[offset+8]]+byteToHex[arr[offset+9]]+"-"+byteToHex[arr[offset+10]]+byteToHex[arr[offset+11]]+byteToHex[arr[offset+12]]+byteToHex[arr[offset+13]]+byteToHex[arr[offset+14]]+byteToHex[arr[offset+15]]).toLowerCase();if(!esm_browser_validate(uuid))throw TypeError("Stringified UUID is invalid");return uuid},_lastMSecs=0,_lastNSecs=0;var esm_browser_v1=function(options,buf,offset){var i=buf&&offset||0,b=buf||new Array(16),node=(options=options||{}).node||_nodeId,clockseq=void 0!==options.clockseq?options.clockseq:_clockseq;if(null==node||null==clockseq){var seedBytes=options.random||(options.rng||rng)();null==node&&(node=_nodeId=[1|seedBytes[0],seedBytes[1],seedBytes[2],seedBytes[3],seedBytes[4],seedBytes[5]]),null==clockseq&&(clockseq=_clockseq=16383&(seedBytes[6]<<8|seedBytes[7]))}var msecs=void 0!==options.msecs?options.msecs:Date.now(),nsecs=void 0!==options.nsecs?options.nsecs:_lastNSecs+1,dt=msecs-_lastMSecs+(nsecs-_lastNSecs)/1e4;if(dt<0&&void 0===options.clockseq&&(clockseq=clockseq+1&16383),(dt<0||msecs>_lastMSecs)&&void 0===options.nsecs&&(nsecs=0),nsecs>=1e4)throw new Error("uuid.v1(): Can't create more than 10M uuids/sec");_lastMSecs=msecs,_lastNSecs=nsecs,_clockseq=clockseq;var tl=(1e4*(268435455&(msecs+=122192928e5))+nsecs)%4294967296;b[i++]=tl>>>24&255,b[i++]=tl>>>16&255,b[i++]=tl>>>8&255,b[i++]=255&tl;var tmh=msecs/4294967296*1e4&268435455;b[i++]=tmh>>>8&255,b[i++]=255&tmh,b[i++]=tmh>>>24&15|16,b[i++]=tmh>>>16&255,b[i++]=clockseq>>>8|128,b[i++]=255&clockseq;for(var n=0;n<6;++n)b[i+n]=node[n];return buf||esm_browser_stringify(b)};var esm_browser_parse=function(uuid){if(!esm_browser_validate(uuid))throw TypeError("Invalid UUID");var v,arr=new Uint8Array(16);return arr[0]=(v=parseInt(uuid.slice(0,8),16))>>>24,arr[1]=v>>>16&255,arr[2]=v>>>8&255,arr[3]=255&v,arr[4]=(v=parseInt(uuid.slice(9,13),16))>>>8,arr[5]=255&v,arr[6]=(v=parseInt(uuid.slice(14,18),16))>>>8,arr[7]=255&v,arr[8]=(v=parseInt(uuid.slice(19,23),16))>>>8,arr[9]=255&v,arr[10]=(v=parseInt(uuid.slice(24,36),16))/1099511627776&255,arr[11]=v/4294967296&255,arr[12]=v>>>24&255,arr[13]=v>>>16&255,arr[14]=v>>>8&255,arr[15]=255&v,arr};var v35=function(name,version,hashfunc){function generateUUID(value,namespace,buf,offset){if("string"==typeof value&&(value=function(str){str=unescape(encodeURIComponent(str));for(var bytes=[],i=0;i<str.length;++i)bytes.push(str.charCodeAt(i));return bytes}(value)),"string"==typeof namespace&&(namespace=esm_browser_parse(namespace)),16!==namespace.length)throw TypeError("Namespace must be array-like (16 iterable integer values, 0-255)");var bytes=new Uint8Array(16+value.length);if(bytes.set(namespace),bytes.set(value,namespace.length),(bytes=hashfunc(bytes))[6]=15&bytes[6]|version,bytes[8]=63&bytes[8]|128,buf){offset=offset||0;for(var i=0;i<16;++i)buf[offset+i]=bytes[i];return buf}return esm_browser_stringify(bytes)}try{generateUUID.name=name}catch(err){}return generateUUID.DNS="6ba7b810-9dad-11d1-80b4-00c04fd430c8",generateUUID.URL="6ba7b811-9dad-11d1-80b4-00c04fd430c8",generateUUID};function getOutputLength(inputLength8){return 14+(inputLength8+64>>>9<<4)+1}function safeAdd(x,y){var lsw=(65535&x)+(65535&y);return(x>>16)+(y>>16)+(lsw>>16)<<16|65535&lsw}function md5cmn(q,a,b,x,s,t){return safeAdd((num=safeAdd(safeAdd(a,q),safeAdd(x,t)))<<(cnt=s)|num>>>32-cnt,b);var num,cnt}function md5ff(a,b,c,d,x,s,t){return md5cmn(b&c|~b&d,a,b,x,s,t)}function md5gg(a,b,c,d,x,s,t){return md5cmn(b&d|c&~d,a,b,x,s,t)}function md5hh(a,b,c,d,x,s,t){return md5cmn(b^c^d,a,b,x,s,t)}function md5ii(a,b,c,d,x,s,t){return md5cmn(c^(b|~d),a,b,x,s,t)}var esm_browser_v3=v35("v3",48,(function(bytes){if("string"==typeof bytes){var msg=unescape(encodeURIComponent(bytes));bytes=new Uint8Array(msg.length);for(var i=0;i<msg.length;++i)bytes[i]=msg.charCodeAt(i)}return function(input){for(var output=[],length32=32*input.length,i=0;i<length32;i+=8){var x=input[i>>5]>>>i%32&255,hex=parseInt("0123456789abcdef".charAt(x>>>4&15)+"0123456789abcdef".charAt(15&x),16);output.push(hex)}return output}(function(x,len){x[len>>5]|=128<<len%32,x[getOutputLength(len)-1]=len;for(var a=1732584193,b=-271733879,c=-1732584194,d=271733878,i=0;i<x.length;i+=16){var olda=a,oldb=b,oldc=c,oldd=d;a=md5ff(a,b,c,d,x[i],7,-680876936),d=md5ff(d,a,b,c,x[i+1],12,-389564586),c=md5ff(c,d,a,b,x[i+2],17,606105819),b=md5ff(b,c,d,a,x[i+3],22,-1044525330),a=md5ff(a,b,c,d,x[i+4],7,-176418897),d=md5ff(d,a,b,c,x[i+5],12,1200080426),c=md5ff(c,d,a,b,x[i+6],17,-1473231341),b=md5ff(b,c,d,a,x[i+7],22,-45705983),a=md5ff(a,b,c,d,x[i+8],7,1770035416),d=md5ff(d,a,b,c,x[i+9],12,-1958414417),c=md5ff(c,d,a,b,x[i+10],17,-42063),b=md5ff(b,c,d,a,x[i+11],22,-1990404162),a=md5ff(a,b,c,d,x[i+12],7,1804603682),d=md5ff(d,a,b,c,x[i+13],12,-40341101),c=md5ff(c,d,a,b,x[i+14],17,-1502002290),b=md5ff(b,c,d,a,x[i+15],22,1236535329),a=md5gg(a,b,c,d,x[i+1],5,-165796510),d=md5gg(d,a,b,c,x[i+6],9,-1069501632),c=md5gg(c,d,a,b,x[i+11],14,643717713),b=md5gg(b,c,d,a,x[i],20,-373897302),a=md5gg(a,b,c,d,x[i+5],5,-701558691),d=md5gg(d,a,b,c,x[i+10],9,38016083),c=md5gg(c,d,a,b,x[i+15],14,-660478335),b=md5gg(b,c,d,a,x[i+4],20,-405537848),a=md5gg(a,b,c,d,x[i+9],5,568446438),d=md5gg(d,a,b,c,x[i+14],9,-1019803690),c=md5gg(c,d,a,b,x[i+3],14,-187363961),b=md5gg(b,c,d,a,x[i+8],20,1163531501),a=md5gg(a,b,c,d,x[i+13],5,-1444681467),d=md5gg(d,a,b,c,x[i+2],9,-51403784),c=md5gg(c,d,a,b,x[i+7],14,1735328473),b=md5gg(b,c,d,a,x[i+12],20,-1926607734),a=md5hh(a,b,c,d,x[i+5],4,-378558),d=md5hh(d,a,b,c,x[i+8],11,-2022574463),c=md5hh(c,d,a,b,x[i+11],16,1839030562),b=md5hh(b,c,d,a,x[i+14],23,-35309556),a=md5hh(a,b,c,d,x[i+1],4,-1530992060),d=md5hh(d,a,b,c,x[i+4],11,1272893353),c=md5hh(c,d,a,b,x[i+7],16,-155497632),b=md5hh(b,c,d,a,x[i+10],23,-1094730640),a=md5hh(a,b,c,d,x[i+13],4,681279174),d=md5hh(d,a,b,c,x[i],11,-358537222),c=md5hh(c,d,a,b,x[i+3],16,-722521979),b=md5hh(b,c,d,a,x[i+6],23,76029189),a=md5hh(a,b,c,d,x[i+9],4,-640364487),d=md5hh(d,a,b,c,x[i+12],11,-421815835),c=md5hh(c,d,a,b,x[i+15],16,530742520),b=md5hh(b,c,d,a,x[i+2],23,-995338651),a=md5ii(a,b,c,d,x[i],6,-198630844),d=md5ii(d,a,b,c,x[i+7],10,1126891415),c=md5ii(c,d,a,b,x[i+14],15,-1416354905),b=md5ii(b,c,d,a,x[i+5],21,-57434055),a=md5ii(a,b,c,d,x[i+12],6,1700485571),d=md5ii(d,a,b,c,x[i+3],10,-1894986606),c=md5ii(c,d,a,b,x[i+10],15,-1051523),b=md5ii(b,c,d,a,x[i+1],21,-2054922799),a=md5ii(a,b,c,d,x[i+8],6,1873313359),d=md5ii(d,a,b,c,x[i+15],10,-30611744),c=md5ii(c,d,a,b,x[i+6],15,-1560198380),b=md5ii(b,c,d,a,x[i+13],21,1309151649),a=md5ii(a,b,c,d,x[i+4],6,-145523070),d=md5ii(d,a,b,c,x[i+11],10,-1120210379),c=md5ii(c,d,a,b,x[i+2],15,718787259),b=md5ii(b,c,d,a,x[i+9],21,-343485551),a=safeAdd(a,olda),b=safeAdd(b,oldb),c=safeAdd(c,oldc),d=safeAdd(d,oldd)}return[a,b,c,d]}(function(input){if(0===input.length)return[];for(var length8=8*input.length,output=new Uint32Array(getOutputLength(length8)),i=0;i<length8;i+=8)output[i>>5]|=(255&input[i/8])<<i%32;return output}(bytes),8*bytes.length))}));var esm_browser_v4=function(options,buf,offset){var rnds=(options=options||{}).random||(options.rng||rng)();if(rnds[6]=15&rnds[6]|64,rnds[8]=63&rnds[8]|128,buf){offset=offset||0;for(var i=0;i<16;++i)buf[offset+i]=rnds[i];return buf}return esm_browser_stringify(rnds)};function f(s,x,y,z){switch(s){case 0:return x&y^~x&z;case 1:return x^y^z;case 2:return x&y^x&z^y&z;case 3:return x^y^z}}function ROTL(x,n){return x<<n|x>>>32-n}var esm_browser_v5=v35("v5",80,(function(bytes){var K=[1518500249,1859775393,2400959708,3395469782],H=[1732584193,4023233417,2562383102,271733878,3285377520];if("string"==typeof bytes){var msg=unescape(encodeURIComponent(bytes));bytes=[];for(var i=0;i<msg.length;++i)bytes.push(msg.charCodeAt(i))}else Array.isArray(bytes)||(bytes=Array.prototype.slice.call(bytes));bytes.push(128);for(var l=bytes.length/4+2,N=Math.ceil(l/16),M=new Array(N),_i=0;_i<N;++_i){for(var arr=new Uint32Array(16),j=0;j<16;++j)arr[j]=bytes[64*_i+4*j]<<24|bytes[64*_i+4*j+1]<<16|bytes[64*_i+4*j+2]<<8|bytes[64*_i+4*j+3];M[_i]=arr}M[N-1][14]=8*(bytes.length-1)/Math.pow(2,32),M[N-1][14]=Math.floor(M[N-1][14]),M[N-1][15]=8*(bytes.length-1)&4294967295;for(var _i2=0;_i2<N;++_i2){for(var W=new Uint32Array(80),t=0;t<16;++t)W[t]=M[_i2][t];for(var _t=16;_t<80;++_t)W[_t]=ROTL(W[_t-3]^W[_t-8]^W[_t-14]^W[_t-16],1);for(var a=H[0],b=H[1],c=H[2],d=H[3],e=H[4],_t2=0;_t2<80;++_t2){var s=Math.floor(_t2/20),T=ROTL(a,5)+f(s,b,c,d)+e+K[s]+W[_t2]>>>0;e=d,d=c,c=ROTL(b,30)>>>0,b=a,a=T}H[0]=H[0]+a>>>0,H[1]=H[1]+b>>>0,H[2]=H[2]+c>>>0,H[3]=H[3]+d>>>0,H[4]=H[4]+e>>>0}return[H[0]>>24&255,H[0]>>16&255,H[0]>>8&255,255&H[0],H[1]>>24&255,H[1]>>16&255,H[1]>>8&255,255&H[1],H[2]>>24&255,H[2]>>16&255,H[2]>>8&255,255&H[2],H[3]>>24&255,H[3]>>16&255,H[3]>>8&255,255&H[3],H[4]>>24&255,H[4]>>16&255,H[4]>>8&255,255&H[4]]})),nil="00000000-0000-0000-0000-000000000000";var esm_browser_version=function(uuid){if(!esm_browser_validate(uuid))throw TypeError("Invalid UUID");return parseInt(uuid.substr(14,1),16)}}])}));