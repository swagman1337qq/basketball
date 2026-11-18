import 'fake-indexeddb/auto';
import {parentPort} from 'node:worker_threads';
import Dexie from 'dexie';
globalThis.self=globalThis;
globalThis.postMessage=message=>parentPort.postMessage(message);
Dexie.dependencies.indexedDB=globalThis.indexedDB;Dexie.dependencies.IDBKeyRange=globalThis.IDBKeyRange;
const {db,getSave}=await import('../../src/db/saves');
let queue=Promise.resolve();
parentPort.on('message',message=>{queue=queue.then(async()=>{
 if(message.probe){parentPort.postMessage({id:message.id,probe:true,row:await getSave(message.saveId)});return;}
 await self.onmessage({data:message});
}).catch(error=>parentPort.postMessage({id:message.id,runnerError:String(error.stack)}));});
await import("file:///home/user/basketball/src/db/saveWorker.ts");
parentPort.postMessage({ready:true});