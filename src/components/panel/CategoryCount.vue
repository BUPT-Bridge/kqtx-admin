<template>
  <div class="box">
    <div class="tit">分类</div>
    <div ref="chart" class="boxnav"></div>
  </div>
</template>

<script>
import * as echarts from 'echarts'
import { onMounted, ref, onUnmounted } from 'vue'

import request from '../../logic/register.js'

export default {
  name: 'CategoryCount',
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

        const categories = response.data.categories
        // 将数据转换为图表所需格式
        const chartData = Object.entries(categories).map(([name, value]) => ({
          name,
          value,
        }))

        // 获取所有类别名称用于图例
        const legendData = Object.keys(categories)

        // 更新图表
        updateChart(chartData, legendData)
      } catch (error) {
        console.error('获取数据失败:', error)
      } finally {
        loading.value = false
      }
    }

    const updateChart = (data) => {
      const option = {
        tooltip: {
          trigger: 'item',
          formatter: '{b}: {c}个 ({d}%)', // 修改提示框格式
        },
        series: [
          {
            name: '问题类型',
            type: 'pie',
            radius: ['40%', '70%'],
            avoidLabelOverlap: true,
            label: {
              show: true,
              position: 'outside',
              formatter: '{b}: {d}%',
              color: '#fff',
            },
            emphasis: {
              label: {
                show: true,
                fontSize: '16', // 增大强调时的字体大小
                fontWeight: 'bold',
              },
            },
            data: data,
          },
        ],
        color: ['#00ff7f', '#00ffff', '#ff69b4', '#7b68ee', '#ff7f50'],
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
      // 添加定时刷新
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
  height: 100%;
  padding: 0 15px 15px;
}
</style>
