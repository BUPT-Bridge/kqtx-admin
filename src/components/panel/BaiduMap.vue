<template>
  <div class="box">
    <div class="boxnav map-container" ref="map"></div>
  </div>
</template>

<script>
import request from '../../logic/register.js'
import default_avatar from '../../assets/images/miao.png'

export default {
  name: 'BaiduMap',
  data() {
    return {
      map: null,
      markers: [],
      timer: null,
      dataTimer: null,
      leafletLoaded: false,
    }
  },
  mounted() {
    this.loadLeaflet()
  },
  beforeUnmount() {
    if (this.timer) clearInterval(this.timer)
    if (this.dataTimer) clearInterval(this.dataTimer)
    // 清理地图实例
    if (this.map) {
      this.map.remove()
      this.map = null
    }
  },
  methods: {
    // 动态加载 Leaflet CSS 和 JS
    loadLeaflet() {
      // 加载 CSS
      const link = document.createElement('link')
      link.rel = 'stylesheet'
      link.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css'
      link.integrity = 'sha256-p4NxAoJBhIIN+hmNHrzRCf9tD/miZyoHS5obTRR9BMY='
      link.crossOrigin = ''
      document.head.appendChild(link)

      // 加载 JS
      const script = document.createElement('script')
      script.src = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js'
      script.integrity = 'sha256-20nQCchB9co0qIjJZRGuk2/Z9VM+kNiyxNV1lvTlZBo='
      script.crossOrigin = ''

      script.onload = () => {
        this.leafletLoaded = true
        this.initMap()
        this.startDataFetch()
      }

      script.onerror = () => {
        console.error('Failed to load Leaflet')
      }

      document.head.appendChild(script)
    },

    initMap() {
      if (!this.leafletLoaded || typeof L === 'undefined') {
        console.error('Leaflet is not loaded')
        return
      }

      // 创建地图实例，中心点设置为北京（天安门）
      this.map = L.map(this.$refs.map, {
        // 设置中文控件
        zoomControl: true,
        attributionControl: true,
      }).setView([39.9467, 116.0942], 13)

      // 自定义缩放控件文本
      this.map.zoomControl.setPosition('topright')

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

      // 备用方案：腾讯地图暗色主题
      const tencentDark = L.tileLayer(
        'https://rt{s}.map.gtimg.com/tile?z={z}&x={x}&y={y}&styleid=1000&scene=0&version=347',
        {
          attribution: '© 腾讯地图',
          subdomains: '0123',
          maxZoom: 18,
          minZoom: 3,
        },
      )

      // 优先使用高德地图，如果失败则使用腾讯地图
      amapDark.addTo(this.map)

      // 监听瓦片加载错误，切换到备用地图
      amapDark.on('tileerror', () => {
        console.warn('高德地图加载失败，切换到腾讯地图')
        this.map.removeLayer(amapDark)
        tencentDark.addTo(this.map)
      })
    },

    // 获取图片完整URL
    getImageUrl(avatar) {
      if (!avatar) return default_avatar
      return avatar
    },

    // 坐标转换：从百度坐标系(BD09)转换为WGS84坐标系
    bd09ToWgs84(lng, lat) {
      const X_PI = (3.14159265358979324 * 3000.0) / 180.0

      let x = lng - 0.0065
      let y = lat - 0.006
      let z = Math.sqrt(x * x + y * y) - 0.00002 * Math.sin(y * X_PI)
      let theta = Math.atan2(y, x) - 0.000003 * Math.cos(x * X_PI)
      lng = z * Math.cos(theta)
      lat = z * Math.sin(theta)

      return [lat, lng]
    },

    // 更新标记点
    updateMarkers(data) {
      // 清除旧的标记点
      this.markers.forEach((marker) => {
        this.map.removeLayer(marker)
      })
      this.markers = []

      // 添加新的标记点
      data.forEach((item) => {
        if (!item.Latitude_Longitude) return // 跳过没有经纬度的项

        const [lat, lng] = item.Latitude_Longitude.split(',').map(Number)

        // 如果坐标看起来像是百度坐标系，进行转换
        let finalCoords = [lat, lng]
        if (lng > 73 && lng < 136 && lat > 3 && lat < 54) {
          // 这个范围大致是中国的经纬度范围，可能是百度坐标系
          finalCoords = this.bd09ToWgs84(lng, lat)
        }

        // 创建自定义图标
        const customIcon = L.icon({
          iconUrl: this.getImageUrl(item.avatar),
          iconSize: [32, 32],
          iconAnchor: [16, 16],
          popupAnchor: [0, -16],
          className: 'custom-marker-icon',
        })

        const marker = L.marker(finalCoords, { icon: customIcon })
        marker.addTo(this.map)
        this.markers.push(marker)

        // 添加中文弹窗信息
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
      })

      // 如果有数据，显示统计信息
      if (data.length > 0) {
        this.showStatsControl(data.length)
      }
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
        onAdd: function (map) {
          const container = L.DomUtil.create('div', 'leaflet-bar leaflet-control stats-control')
          container.innerHTML = `
            <div style="background: rgba(44, 62, 80, 0.9); color: #ecf0f1; padding: 8px 12px;
                        border-radius: 4px; font-family: 'Microsoft YaHei', Arial, sans-serif; font-size: 12px;">
              <strong>用户: ${userCount} 人</strong>
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

/* Leaflet 控件样式调整以适应暗色主题 */
:deep(.leaflet-control-zoom a) {
  background-color: #2c3e50 !important;
  color: #ecf0f1 !important;
  border-color: #34495e !important;
  font-weight: bold;
}

:deep(.leaflet-control-zoom a:hover) {
  background-color: #34495e !important;
}

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
