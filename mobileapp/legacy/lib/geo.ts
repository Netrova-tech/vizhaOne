export interface Coordinates { latitude: number; longitude: number }

const CITY_COORDS: Record<string, Coordinates> = {
  chennai:{latitude:13.0827,longitude:80.2707}, coimbatore:{latitude:11.0168,longitude:76.9558}, madurai:{latitude:9.9252,longitude:78.1198},
  tirunelveli:{latitude:8.7139,longitude:77.7567}, tuticorin:{latitude:8.7642,longitude:78.1348}, thoothukudi:{latitude:8.7642,longitude:78.1348},
  trichy:{latitude:10.7905,longitude:78.7047}, tiruchirappalli:{latitude:10.7905,longitude:78.7047}, salem:{latitude:11.6643,longitude:78.1460},
  erode:{latitude:11.3410,longitude:77.7172}, vellore:{latitude:12.9165,longitude:79.1325}, thanjavur:{latitude:10.7870,longitude:79.1378},
  tiruppur:{latitude:11.1085,longitude:77.3411}, nagercoil:{latitude:8.1833,longitude:77.4119}, kanyakumari:{latitude:8.0883,longitude:77.5385},
  karur:{latitude:10.9601,longitude:78.0766}, cuddalore:{latitude:11.7447,longitude:79.7680}, kanchipuram:{latitude:12.8342,longitude:79.7036},
};

export function coordinatesFor(latitude?:number|null, longitude?:number|null, location?:string, place?:string):Coordinates|null {
  if(Number.isFinite(Number(latitude))&&Number.isFinite(Number(longitude))&&(Number(latitude)!==0||Number(longitude)!==0)) return {latitude:Number(latitude),longitude:Number(longitude)};
  const value=`${location||""} ${place||""}`.toLowerCase();
  const city=Object.keys(CITY_COORDS).find(name=>value.includes(name));
  return city?CITY_COORDS[city]:null;
}

export function distanceKm(a:Coordinates,b:Coordinates){
  const rad=(n:number)=>n*Math.PI/180, earth=6371;
  const dLat=rad(b.latitude-a.latitude),dLon=rad(b.longitude-a.longitude);
  const h=Math.sin(dLat/2)**2+Math.cos(rad(a.latitude))*Math.cos(rad(b.latitude))*Math.sin(dLon/2)**2;
  return earth*2*Math.atan2(Math.sqrt(h),Math.sqrt(1-h));
}

export function loadCurrentCoordinates():Coordinates|null{
  try{const value=JSON.parse(localStorage.getItem("vizha_current_location")||"null");return coordinatesFor(value?.latitude,value?.longitude)}catch{return null}
}
