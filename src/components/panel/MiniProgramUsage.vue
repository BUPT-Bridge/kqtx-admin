<template>
  <div class="box">
    <div class="tit">小程序使用情况</div>
    <div ref="chart" class="boxnav"></div>
  </div>
</template>

<script>
import * as echarts from 'echarts'
import { onMounted, ref, onUnmounted } from 'vue'

import request from '../../logic/register.js'

export default {
  name: 'MiniProgramUsage',
  setup() {
    const chart = ref(null)
    let myChart = null
    const loading = ref(false)
    let timer = null

    // 获取数据
    const fetchData = async () => {
      try {
        loading.value = true
        const response = await request.get('/analysis/view-stats')

        const chartData = response.data.data.reverse()
        updateChart(chartData)
      } catch (error) {
        console.error('获取数据失败:', error)
      } finally {
        loading.value = false
      }
    }

    const updateChart = (data) => {
      const option = {
        color: ['#00ff7f', '#00ffff'],
        tooltip: {
          trigger: 'axis',
          axisPointer: {
            type: 'cross',
            label: {
              backgroundColor: '#6a7985',
            },
          },
        },
        legend: {
          data: ['日活用户', '注册用户'],
          textStyle: {
            color: '#fff',
          },
          top: 0,
        },
        grid: {
          left: '3%',
          right: '4%',
          bottom: '3%',
          top: '15%',
          containLabel: true,
        },
        xAxis: [
          {
            type: 'category',
            boundaryGap: false,
            data: data.map((item) => item.date),
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
            name: '日活用户',
            type: 'line',
            smooth: true,
            stack: '总量',
            areaStyle: {
              opacity: 0.3,
            },
            emphasis: {
              focus: 'series',
            },
            data: data.map((item) => item.view_count),
          },
          {
            name: '注册用户',
            type: 'line',
            smooth: true,
            stack: '总量',
            areaStyle: {
              opacity: 0.3,
            },
            emphasis: {
              focus: 'series',
            },
            data: data.map((item) => item.enrollment_count),
          },
        ],
      }
      myChart.setOption(option)
    }

    const initChart = () => {
      myChart = echarts.init(chart.value)
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
