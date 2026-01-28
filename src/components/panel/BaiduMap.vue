<template>
  <div class="box">
    <div class="tit">实时位置</div>
    <div class="boxnav map-container" ref="map"></div>
  </div>
</template>

<script>
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import request from '../../logic/register.js'
import default_avatar from '../../assets/images/miao.png'

// 修复 Leaflet 默认图标路径问题
import markerIcon from 'leaflet/dist/images/marker-icon.png'
import markerIcon2x from 'leaflet/dist/images/marker-icon-2x.png'
import markerShadow from 'leaflet/dist/images/marker-shadow.png'

delete L.Icon.Default.prototype._getIconUrl
L.Icon.Default.mergeOptions({
  iconRetinaUrl: markerIcon2x,
  iconUrl: markerIcon,
  shadowUrl: markerShadow,
})

export default {
  name: 'BaiduMap',
  data() {
    return {
      map: null,
      markers: [],
      markersMap: new Map(), // 使用 Map 优化标记查找
      dataTimer: null,
      statsControl: null,
    }
  },
  mounted() {
    this.initMap()
    this.startDataFetch()
  },
  beforeUnmount() {
    if (this.dataTimer) {
      clearInterval(this.dataTimer)
      this.dataTimer = null
    }
    // 清理标记
    this.markers.forEach((marker) => {
      this.map.removeLayer(marker)
    })
    this.markers = []
    this.markersMap.clear()
    // 清理地图实例
    if (this.map) {
      this.map.remove()
      this.map = null
    }
  },
  methods: {
    initMap() {
      // 创建地图实例，中心点设置为矿桥东街社区
      this.map = L.map(this.$refs.map, {
        zoomControl: false,
        attributionControl: true,
        // 完全锁定地图视图
        minZoom: 13,
        maxZoom: 13,
        zoomSnap: 0,
        zoomDelta: 0,
        scrollWheelZoom: false, // 禁用滚轮缩放
        doubleClickZoom: false, // 禁用双击缩放
        touchZoom: false, // 禁用触摸缩放
        boxZoom: false, // 禁用框选缩放
        dragging: false, // 禁用拖拽，完全锁定
        keyboard: false, // 禁用键盘控制
      }).setView([39.94675, 116.09419], 13)

      // 使用高德地图的中文瓦片服务（暗色主题）
      this.addChineseMapLayer()

      // 自定义版权信息为中文
      this.map.attributionControl.setPrefix('由 Leaflet 提供技术支持')
    },

    // 添加中文地图图层
    addChineseMapLayer() {
      // 使用高德地图的暗色主题瓦片服务
      const amapDark = L.tileLayer(
        'https://webrd0{s}.is.autonavi.com/appmaptile?lang=zh_cn&size=1&scale=1&style=8&x={x}&y={y}&z={z}',
        {
          attribution: '© 高德地图',
          subdomains: '1234',
          maxZoom: 18,
          minZoom: 3,
        },
      )

      amapDark.addTo(this.map)
    },

    // 获取图片完整URL
    getImageUrl(avatar) {
      if (!avatar) return default_avatar
      return avatar
    },

    // 坐标转换：从百度坐标系(BD09)转换为WGS84坐标系
    bd09ToWgs84(lng, lat) {
      const X_PI = (3.141592653 * 3000.0) / 180.0

      let x = lng - 0.0065
      let y = lat - 0.006
      let z = Math.sqrt(x * x + y * y) - 0.00002 * Math.sin(y * X_PI)
      let theta = Math.atan2(y, x) - 0.000003 * Math.cos(x * X_PI)
      lng = z * Math.cos(theta)
      lat = z * Math.sin(theta)

      return [lat, lng]
    },

    // 更新标记点（优化版本，避免不必要的重绘）
    updateMarkers(data) {
      const newMarkersMap = new Map()

      // 处理新数据
      data.forEach((item) => {
        if (!item.Latitude_Longitude) return

        const userId = item.serial_number || item.username
        const [lat, lng] = item.Latitude_Longitude.split(',').map(Number)

        // 坐标转换
        let finalCoords = [lat, lng]
        if (lng > 73 && lng < 136 && lat > 3 && lat < 54) {
          finalCoords = this.bd09ToWgs84(lng, lat)
        }

        // 检查是否已存在该标记
        if (this.markersMap.has(userId)) {
          const existingMarker = this.markersMap.get(userId)
          // 更新位置（如果位置改变）
          const currentLatLng = existingMarker.getLatLng()
          if (currentLatLng.lat !== finalCoords[0] || currentLatLng.lng !== finalCoords[1]) {
            existingMarker.setLatLng(finalCoords)
          }
          newMarkersMap.set(userId, existingMarker)
        } else {
          // 创建新标记
          const customIcon = L.icon({
            iconUrl: this.getImageUrl(item.avatar),
            iconSize: [32, 32],
            iconAnchor: [16, 16],
            popupAnchor: [0, -16],
            className: 'custom-marker-icon',
          })

          const marker = L.marker(finalCoords, { icon: customIcon })
          marker.addTo(this.map)

          // 添加弹窗
          if (item.name || item.username) {
            const popupContent = `
              <div style="text-align: center; font-family: 'Microsoft YaHei', Arial, sans-serif;">
                <img src="${this.getImageUrl(item.avatar)}"
                     style="width: 40px; height: 40px; border-radius: 50%; margin-bottom: 8px; border: 2px solid #fff;" />
                <br />
                <strong style="color: #333; font-size: 14px;">${item.name || item.username || '用户'}</strong>
                ${item.last_seen ? `<br /><span style="color: #666; font-size: 12px;">最后在线: ${item.last_seen}</span>` : ''}
                ${item.location_name ? `<br /><span style="color: #666; font-size: 12px;">位置: ${item.location_name}</span>` : ''}
              </div>
            `
            marker.bindPopup(popupContent, {
              maxWidth: 200,
              className: 'chinese-popup',
            })
          }

          newMarkersMap.set(userId, marker)
        }
      })

      // 移除不再存在的标记
      this.markersMap.forEach((marker, userId) => {
        if (!newMarkersMap.has(userId)) {
          this.map.removeLayer(marker)
        }
      })

      // 更新标记映射
      this.markersMap = newMarkersMap
      this.markers = Array.from(newMarkersMap.values())

      // 更新统计信息
      this.showStatsControl(data.length)
    },

    // 显示统计信息控件
    showStatsControl(userCount) {
      // 移除之前的统计控件
      if (this.statsControl) {
        this.map.removeControl(this.statsControl)
      }

      // 创建自定义统计信息控件
      const StatsControl = L.Control.extend({
        options: {
          position: 'topleft',
        },
        onAdd: function () {
          const container = L.DomUtil.create('div', 'leaflet-bar leaflet-control stats-control')
          container.innerHTML = `
            <div style="background: rgba(44, 62, 80, 0.9); color: #ecf0f1; padding: 8px 12px;
                        border-radius: 4px; font-family: 'Microsoft YaHei', Arial, sans-serif; font-size: 12px;">
              <strong>在线用户: ${userCount} 人</strong>
            </div>
          `
          return container
        },
      })

      this.statsControl = new StatsControl()
      this.map.addControl(this.statsControl)
    },

    // 开始定时获取数据
    startDataFetch() {
      this.fetchData() // 立即获取一次数据
      this.dataTimer = setInterval(this.fetchData, 5000) // 每5秒更新一次
    },

    // 获取数据
    async fetchData() {
      try {
        const response = await request.get('/analysis/user_location')
        if (response.code === 200 && response.data) {
          this.updateMarkers(response.data)
        }
      } catch (error) {
        console.error('获取位置数据失败:', error)
      }
    },
  },
}
</script>

<style scoped>
.box {
  height: 100%;
  background: rgba(0, 24, 106, 0.6);
  display: flex;
  flex-direction: column;
}

.tit {
  color: #fff;
  font-size: 18px;
  padding: 10px 15px 10px 30px;
  letter-spacing: normal;
  position: relative;
}

.tit:before {
  position: absolute;
  content: '';
  width: 6px;
  height: 6px;
  background: rgba(22, 214, 255, 0.9);
  box-shadow: 0 0 5px rgba(22, 214, 255, 0.9);
  border-radius: 10px;
  left: 15px;
  top: 50%;
  transform: translateY(-50%);
}

.boxnav {
  flex: 1;
  padding: 0 15px 15px;
}

.anchorBL {
  display: none;
}

.map-container {
  width: 100%;
  height: 100%;
  font-family: 'Microsoft YaHei', 'SimSun', Arial, sans-serif;
}

/* 自定义标记图标样式 */
:deep(.custom-marker-icon) {
  border-radius: 50% !important;
  border: 2px solid rgba(255, 255, 255, 0.8) !important;
  overflow: hidden;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.3);
}

/* 中文弹窗样式 */
:deep(.chinese-popup .leaflet-popup-content-wrapper) {
  background: #fff;
  border-radius: 8px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
}

:deep(.chinese-popup .leaflet-popup-content) {
  margin: 12px 16px;
  font-family: 'Microsoft YaHei', Arial, sans-serif;
}

:deep(.chinese-popup .leaflet-popup-tip) {
  background: #fff;
}

/* Leaflet 控件样式调整以适应暗色主题（缩放已锁定，无需显示） */

:deep(.leaflet-control-attribution) {
  background-color: rgba(44, 62, 80, 0.9) !important;
  color: #ecf0f1 !important;
  font-family: 'Microsoft YaHei', Arial, sans-serif !important;
  font-size: 11px !important;
}

/* 统计控件样式 */
:deep(.stats-control) {
  border: none !important;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.3) !important;
}
</style>
