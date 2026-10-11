import routing from '../truck-routing.js';
import { CHUBU_IC_CATALOG } from './chubu-ic-catalog.mjs';

const MAX_AGE_MS = 120 * 24 * 60 * 60 * 1000;

// Never query an external IC service for a journey fully covered by this snapshot.
// This data only proposes grounded directional waypoints: the restricted HGV engine
// remains the sole authority to return any drivable, legal candidate.
export function lookupChubuIcs(origin,destination,radius,{catalog=CHUBU_IC_CATALOG,now=Date.now()}={}){
  const blank={items:[],provider:'local',attempts:0,firstFailure:'none',
    lastFailure:'none',catalogDate:typeof catalog?.source?.sourceDate==='string'?catalog.source.sourceDate:'unknown'};
  const bounds=catalog?.bounds;
  const validBounds=Array.isArray(bounds)&&bounds.length===4&&bounds.every(Number.isFinite);
  const inside=point=>validBounds&&routing.point(point)&&point.lat>=bounds[0]&&point.lng>=bounds[1]&&point.lat<=bounds[2]&&point.lng<=bounds[3];
  if(!inside(origin)||!inside(destination)){
    return {...blank,covered:false,provider:'none',status:'catalog-outside-coverage'};
  }
  const sourceTime=Date.parse(catalog?.source?.sourceDate+'T00:00:00Z');
  if(catalog?.schemaVersion!==1||!Array.isArray(catalog.candidates)||
     !Number.isFinite(sourceTime)||sourceTime>now+86400000||
     catalog.candidates.length>10000){
    return {...blank,covered:true,status:'catalog-invalid'};
  }
  if(now-sourceTime>MAX_AGE_MS){
    return {...blank,covered:true,status:'catalog-stale'};
  }
  if(!Number.isFinite(radius)||radius<0||radius>25000){
    return {...blank,covered:true,status:'catalog-invalid'};
  }
  const items=[];
  for(const item of catalog.candidates){
    if(!item||!Number.isSafeInteger(item.id)||
       !Number.isFinite(item.lat)||!Number.isFinite(item.lng)||
       (item.role!=='entry'&&item.role!=='exit'))continue;
    const location={lat:item.lat,lng:item.lng};
    if(!inside(location))continue;
    if(routing.distanceMeters(origin,location)>radius&&
       routing.distanceMeters(destination,location)>radius)continue;
    items.push({id:item.id,lat:item.lat,lng:item.lng,role:item.role,ref:'',name:''});
  }
  return {...blank,covered:true,items,status:items.length?'local-catalog':'catalog-empty'};
}
