<template>
  <div class="box">
    <div class="tit">AI推荐</div>
    <div class="boxnav">
      <div class="ai-recommend-list" :style="{ transform: `translateY(${scrollTop}px)` }">
        <!-- 原始列表 -->
        <div v-for="item in recommendations" :key="item.category" class="ai-item">
          <div class="ai-item-category">{{ item.category }}</div>
          <div class="ai-item-solution">{{ item.solution_summary }}</div>
        </div>
        <!-- 克隆列表用于无缝滚动 -->
        <div v-for="item in recommendations" :key="item.category + '_clone'" class="ai-item">
          <div class="ai-item-category">{{ item.category }}</div>
          <div class="ai-item-solution">{{ item.solution_summary }}</div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { ref, onMounted, onUnmounted, watch } from 'vue'
import request from '../../logic/register.js'

export default {
  name: 'RecommendHandle',
  setup() {
    const scrollTop = ref(0)
    const scrollHeight = ref(0)
    let animationFrame = null
    let dataTimer = null
    const recommendations = ref([])
    let lastTime = 0

    const calculateHeight = () => {
      const listElement = document.querySelector('.ai-recommend-list')
      if (listElement && recommendations.value.length > 0) {
        const items = listElement.querySelectorAll('.ai-item')
        // 只计算原始列表的高度（不包括克隆的）
        scrollHeight.value = Array.from(items)
          .slice(0, recommendations.value.length)
          .reduce((acc, item) => acc + item.offsetHeight + 10, 0) // 加上margin-bottom
      }
    }

    const scroll = (currentTime) => {
      if (!lastTime) lastTime = currentTime
      const deltaTime = currentTime - lastTime

      // 每16.67ms(60fps)滚动约0.83px，相当于每秒50px
      if (deltaTime >= 16.67) {
        scrollTop.value -= 0.83
        // 当滚动到原始列表的末尾时，重置到起点实现无缝循环
        if (Math.abs(scrollTop.value) >= scrollHeight.value) {
          scrollTop.value = 0
        }
        lastTime = currentTime
      }

      animationFrame = requestAnimationFrame(scroll)
    }

    const startScroll = () => {
      if (animationFrame) cancelAnimationFrame(animationFrame)
      lastTime = 0
      animationFrame = requestAnimationFrame(scroll)
    }

    const fetchData = async () => {
      try {
        const response = await request.get('/analysis/event')
        if (response.data && response.data.length > 0) {
          recommendations.value = response.data
          setTimeout(calculateHeight, 100)
        }
      } catch (error) {
        console.error('获取数据失败:', error)
      }
    }

    watch(
      recommendations,
      () => {
        calculateHeight()
        if (!animationFrame && recommendations.value.length > 0) startScroll()
      },
      { deep: true },
    )

    onMounted(async () => {
      await fetchData()
      dataTimer = setInterval(fetchData, 5000)
    })

    onUnmounted(() => {
      if (animationFrame) cancelAnimationFrame(animationFrame)
      if (dataTimer) clearInterval(dataTimer)
    })

    return {
      recommendations,
      scrollTop,
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
  padding: 0 15px;
  overflow: hidden;
  position: relative;
}

.ai-recommend-list {
  will-change: transform;
  transform: translateZ(0);
  backface-visibility: hidden;
}

.ai-item {
  background: rgba(255, 255, 255, 0.1);
  padding: 12px;
  border-radius: 6px;
  margin-bottom: 10px;
  flex-shrink: 0;
}

.ai-item-category {
  color: #00ff7f;
  font-size: 16px;
  margin-bottom: 8px;
}

.ai-item-solution {
  color: #fff;
  font-size: 14px;
  line-height: 1.4;
  opacity: 0.8;
}

.boxnav:hover .ai-recommend-list {
  animation-play-state: paused;
}
</style>
