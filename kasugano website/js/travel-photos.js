/*
 * 旅行照片数据。现在留空，不会显示任何示例照片或虚构足迹。
 * 每个地点对应一组照片；坐标顺序为纬度 lat、经度 lng（WGS84）。
 * 图片路径相对于 fragments.html。完整说明见 TRAVEL-PHOTOS.md。
 * 复制下方示例到数组中，并替换为自己的地点和照片；不要保留注释符号。
 * {
 *   id: 'my-first-trip',
 *   title: '地点名称',
 *   region: '国家 / 地区',
 *   lat: 35.6812,
 *   lng: 139.7671,
 *   photos: [
 *     { src: 'img/travel/my-photo.jpg', thumbnail: 'img/travel/my-photo-thumb.jpg',
 *       caption: '照片说明', date: '2026-10-28', alt: '照片中的风景' }
 *   ]
 * }
 */
window.travelPhotos = [];
