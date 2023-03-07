// --------------------------------------------
// 用户围栏。
// @author: YuanYou
// --------------------------------------------

import reqContext from "./request";

/** 获取当前用户的围栏数据 */
export function getMyPolygon(): Promise<IPolygon[]> {
  return reqContext.useLoading().get<IServerPolygon[]>('/api/getPolyList/list').then(list => {
    const polygons: IPolygon[] = [];
    (list || []).forEach(p => {
      if (typeof p.polygonPointsStr !== 'string') return;
      const lngLatStrArr = p.polygonPointsStr.split(';');
      const points: IMapPoint[] = [];
      lngLatStrArr.forEach(lngLatStr => {
        if (!lngLatStr) return;
        const { 0: longitude, 1: latitude } =  lngLatStr.split(',').map(n => +n);
        points.push({ longitude, latitude });
      });
      polygons.push({
        id: p.id,
        title: p.title,
        type: p.type,
        points
      });
    });
    return polygons;
  });
}

/** 判断一个点是否在多个点组成的围栏内 */
export function isInPolygon(point: IMapPoint, polygon: IMapPoint[]) {
  let cross = 0;
  let dLon1 = 0,
    dLon2 = 0,
    dLat1 = 0,
    dLat2 = 0,
    dLon = 0;
  if (polygon.length < 3) return false;
  for (let i = 0; i < polygon.length; i++) {
    dLon1 = polygon[i].longitude;
    dLat1 = polygon[i].latitude;
    if (i === polygon.length - 1) {
      dLon2 = polygon[0].longitude;
      dLat2 = polygon[0].latitude;
    } else {
      dLon2 = polygon[i + 1].longitude;
      dLat2 = polygon[i + 1].latitude;
    }
    //以下语句判断A点是否在边的两端点的水平平行线之间，在则可能有交点，开始判断交点是否在左射线上
    if ((point.latitude >= dLat1 && point.latitude < dLat2) || (point.latitude >= dLat2 && point.latitude < dLat1)) {
      if (Math.abs(dLat1 - dLat2) > 0) {
        //得到 A点向左射线与边的交点的x坐标：
        dLon = dLon1 - ((dLon1 - dLon2) * (dLat1 - point.latitude)) / (dLat1 - dLat2);
        if (dLon < point.longitude)
        cross++;
      }
    }
  }
  return cross % 2 !== 0;
}

interface IMapPoint {
  /** 纬度 */
  latitude: number;
  /** 经度 */
  longitude: number;
}

interface IPolygon {
  /** 围栏id */
  id: number;
  /** 围栏类型（1-禁止围栏 0-活动电子围栏） */
  type: number;
  /** 围栏有效开始日期 */
  // startDate: string;
  /** 围栏有效结束日期 */
  // endDate: string;
  /** 围栏标题 */
  title: string;
  /** 围栏经纬度数据 */
  points: IMapPoint[];
}

interface IServerPolygon {
  /** 围栏id */
  id: number;
  /** 围栏类型（1-禁止围栏 0-活动电子围栏） */
  type: number;
  /** 围栏有效开始日期 */
  startDate: string;
  /** 围栏有效结束日期 */
  endDate: string;
  /** 围栏标题 */
  title: string;
  /** 围栏经纬度数据: lng,lat;lng,lat; */
  polygonPointsStr: string;
}