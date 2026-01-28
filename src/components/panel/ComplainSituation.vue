<template>
  <div class="box">
    <div class="tit">居民投诉情况</div>
    <div ref="chart" class="boxnav"></div>
  </div>
</template>

<script>
import * as echarts from 'echarts'
import { onMounted, ref, onUnmounted } from 'vue'
import request from '../../logic/register.js'

export default {
  name: 'ComplainSituation',
  setup() {
    const chart = ref(null)
    let myChart = null
    const loading = ref(false)
    let timer = null // 添加定时器变量

    // 获取数据
    const fetchData = async () => {
      try {
        loading.value = true

        const response = await request.get('/analysis/status')
        const status = response.data.status
        updateChart(status)
      } catch (error) {
        console.error('获取数据失败:', error)
      } finally {
        loading.value = false
      }
    }

    const updateChart = (data) => {
      const colors = ['#37A2FF', '#00ff7f', '#FF0087', '#FFBF00']
      const option = {
        color: colors,
        tooltip: {
          trigger: 'axis',
          axisPointer: {
            type: 'shadow',
          },
        },
        grid: {
          left: '0%',
          right: '4%',
          bottom: '3%',
          top: '3%',
          containLabel: true,
        },
        xAxis: [
          {
            type: 'category',
            data: ['未处理', '处理中', '已处理', '待回访'],
            axisTick: {
              alignWithLabel: true,
            },
            axisLine: {
              lineStyle: {
                color: '#fff',
              },
            },
          },
        ],
        yAxis: [
          {
            type: 'value',
            axisLine: {
              lineStyle: {
                color: '#fff',
              },
            },
            splitLine: {
              lineStyle: {
                color: 'rgba(255,255,255,0.1)',
              },
            },
          },
        ],
        series: [
          {
            name: '投诉数量',
            type: 'bar',
            barWidth: '60%',
            itemStyle: {
              borderRadius: [8, 8, 0, 0],
            },
            data: [
              { value: data.unhandled, itemStyle: { color: colors[0] } },
              { value: data.handling, itemStyle: { color: colors[1] } },
              { value: data.handled, itemStyle: { color: colors[2] } },
              { value: data.waiting_callback, itemStyle: { color: colors[3] } },
            ],
          },
        ],
      }
      myChart.setOption(option)
    }

    const initChart = () => {
      myChart = echarts.init(chart.value)
      // 初始化后立即获取数据
      fetchData()
    }

    onMounted(() => {
      initChart()
      // 添加自动刷新
      timer = setInterval(() => {
        fetchData()
      }, 5000) // 每5秒刷新一次

      window.addEventListener('resize', () => {
        myChart?.resize()
      })
    })

    onUnmounted(() => {
      // 清除定时器
      if (timer) {
        clearInterval(timer)
        timer = null
      }

      window.removeEventListener('resize', () => {
        myChart?.resize()
      })
      myChart?.dispose()
    })

    return {
      chart,
    }
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
</style>
