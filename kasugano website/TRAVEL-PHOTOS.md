# 添加旅行照片

## Cloudinary 原片批量导入（含 GPS）

Cloudinary 中已上传的旅行照片无需逐张填写坐标。双击网站目录外的「导入旅行照片.cmd」，填写照片所在文件夹和本地连接凭据，即可从原片信息自动读取 GPS 和拍摄日期。详细步骤见上一级目录的 `CLOUDINARY-IMPORT.md`。HEIC 原片会生成可在网页显示的 JPG 链接。

导入清单保存到 `js/travel-cloudinary-photos.js`，与下面手动填写的 `js/travel-photos.js` 合并显示。初始清单留空。凭据只在导入工具中输入，不放入网站。

地图入口为 `fragments.html`，导航名称为「かけらの世界」。这是 HTML + CSS + JavaScript 静态页面，可以直接随网站发布到 GitHub Pages，无需后台、数据库、构建命令或地图密钥。

## 1. 放入照片

把图片放进 `img/travel/`，可按旅程建立子文件夹。建议使用 JPG / WebP，完整图片宽度约 1600–2400 像素；另存一张约 200 像素的缩略图，以减少地图加载量。文件名建议使用英文、数字和连字符，注意大小写。

## 2. 填写地点

打开 `js/travel-photos.js`，把空数组替换为自己的记录，例如：

```js
window.travelPhotos = [
  {
    id: 'tokyo-station',
    title: '东京站',
    region: '日本 · 东京',
    lat: 35.6812,
    lng: 139.7671,
    photos: [
      {
        src: 'img/travel/tokyo/station.jpg',
        thumbnail: 'img/travel/tokyo/station-thumb.jpg',
        caption: '抵达东京的傍晚',
        date: '2026-10-28',
        alt: '傍晚的东京站红砖站房'
      }
    ]
  }
];
```

上方只是填写示例，网站目前没有加入任何照片或旅行记录。

- 每个地点一个对象；同一地点的多张照片写在同一个 `photos` 数组里。
- `lat` 是纬度，`lng` 是经度，均为数字，使用 WGS84 坐标。可在 OpenStreetMap 中找到拍摄位置后获取坐标，不要直接混用其他坐标系。
- `src` 必填，`thumbnail` 可省略；省略时直接用原图作为地图缩略图。
- `caption`、`date`、`alt` 可选。图片路径从 `fragments.html` 所在目录开始写，不要写电脑上的绝对路径。
- 缩小地图时，每片相邻区域只显示一张代表照片，不显示数量数字。逐渐放大后会出现更多缩略图，避免相互遮挡。地图不显示侧边地点列表。
- 点击代表一片区域的照片会放大；单个地点的缩略图可直接打开大图，使用按钮或键盘左右键切换，Esc 关闭。放到最大仍重叠的地点，点击代表照片后可翻看其中全部照片。
- 没有照片的地点和无效坐标会被忽略，不会产生空标记。

## 3. 发布

将数据文件和图片一起提交到你现有 GitHub Pages 仓库。首次更新需要同时提交所有修改过的页面以及新增的 CSS、JS 和整个 `vendor/` 目录。所有页面的页眉均已包含地图入口。

地图只显示日本。全国概览使用本地 Natural Earth 数据，包含 47 个都道府县。城市查找使用本地 GeoNames 地名库，共 2,210 个地点；支持足利、西宮、西宫、釧路、Kushiro、kusiro 等输入。鼠标滚轮围绕鼠标位置缩放；点击县界可放大。顶部快捷入口按现有照片分布选择，使用旧国名与地域名：蝦夷、武蔵、下野、山城、大和、摂津、讃岐、伊予。北海道的入口统一为「蝦夷」，自动适配北海道全览；其余入口分别定位东京及周边、足利、京都、奈良、大阪—神户、高松—观音寺、松山—今治一带。它们不是历史国界图层；「蝦夷」是地域名称。地球图标返回日本全图，相片图标查看全部足迹。

放大后，地图按需加载 OpenFreeMap 的在线矢量数据，使用专门调整过的旅行／交通样式：突出铁路、车站、主要公路、城市、公园和景点，去掉地形阴影、建筑轮廓、单行线箭头和密集的小街巷名称。它不显示实时路况，也不提供路线规划。

不使用 Google Maps、Google API 或地理院地形图，无需 API 密钥。详细旅行图层需要能连接 `tiles.openfreemap.org`；网络不可用时保留本地概览。全国概览与地名搜索可以在直接打开 HTML 或断网时使用，但在线交通细节无法在断网时加载。

上传时务必包含 `vendor/leaflet/`、`vendor/natural-earth/`、`vendor/geonames/`、`vendor/maplibre/`、`vendor/openfreemap/` 和新增的 `js/travel-*.js` 文件。保留地图右下角的署名。照片建议保存在网站的 `img/travel/` 中。网页本身仍需通过你的网站域名访问。

参考：[Leaflet 文档](https://leafletjs.com/reference.html)、[Natural Earth 数据许可](https://www.naturalearthdata.com/about/terms-of-use/)、[GeoNames 数据说明](https://download.geonames.org/export/dump/readme.txt)、[OpenFreeMap 文档](https://openfreemap.org/quick_start/)。
