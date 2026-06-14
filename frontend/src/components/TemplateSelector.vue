<template>
  <Teleport to="body">
    <div v-if="store.showTemplateSelector" class="fixed inset-0 bg-black/60 flex items-center justify-center z-50"
      @click.self="store.closeTemplateSelector()">
      <div class="bg-gray-900 rounded-lg p-6 w-[500px] max-h-[80vh] overflow-y-auto border border-gray-700">
        <div class="flex justify-between items-center mb-4">
          <h3 class="text-amber-400 font-bold text-lg">选择标注模板</h3>
          <button @click="store.closeTemplateSelector()" class="text-gray-400 hover:text-white text-xl">&times;</button>
        </div>

        <div class="grid grid-cols-2 gap-3 mb-4">
          <button v-for="t in store.templates" :key="t.id" @click="applyTemplate(t)"
            class="p-4 rounded-lg border-2 transition-all hover:scale-105 text-left"
            :style="{ borderColor: t.color, backgroundColor: t.color + '15' }">
            <div class="flex items-center gap-2 mb-1">
              <span class="w-3 h-3 rounded-full" :style="{ backgroundColor: t.color }"></span>
              <span class="font-bold text-white">{{ t.name }}</span>
            </div>
            <div class="text-xs text-gray-400">
              类型: {{ typeLabel(t.type) }}
            </div>
            <div v-if="t.label" class="text-xs text-gray-500 mt-1">
              标签: {{ t.label }}
            </div>
          </button>
        </div>

        <div class="border-t border-gray-700 pt-4">
          <div class="text-sm text-gray-400 mb-2">或创建自定义标注：</div>
          <div class="space-y-3">
            <div class="flex gap-2">
              <select v-model="customType" class="flex-1 bg-gray-800 rounded px-3 py-2 text-sm">
                <option value="region">区域</option>
                <option value="character">字符</option>
                <option value="note">注释</option>
              </select>
              <input v-model="customColor" type="color" class="w-12 h-10 rounded cursor-pointer" />
            </div>
            <input v-model="customLabel" placeholder="标签名称（如：章节）" class="w-full bg-gray-800 rounded px-3 py-2 text-sm" />
            <textarea v-model="customContent" placeholder="标注内容（可选）" rows="2"
              class="w-full bg-gray-800 rounded px-3 py-2 text-sm resize-none" />
            <button @click="addCustom" class="w-full bg-gray-700 py-2 rounded text-sm hover:bg-gray-600">
              添加自定义标注
            </button>
          </div>
        </div>
      </div>
    </div>
  </Teleport>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { useOcrStore } from '../store/ocr'
import type { AnnotationTemplate, Annotation } from '../types'

const store = useOcrStore()
const customType = ref<Annotation['type']>('region')
const customLabel = ref('')
const customContent = ref('')
const customColor = ref('#3b82f6')

function typeLabel(type: string) {
  const map: Record<string, string> = {
    region: '区域',
    character: '字符',
    note: '注释'
  }
  return map[type] || type
}

function applyTemplate(template: AnnotationTemplate) {
  store.applyTemplate(template)
}

function addCustom() {
  if (!customLabel.value.trim()) {
    alert('请输入标签名称')
    return
  }
  if (!store.pendingBbox || !store.currentDoc) return
  store.addAnnotation(
    customType.value,
    store.pendingBbox,
    customLabel.value.trim(),
    customContent.value.trim()
  )
  customLabel.value = ''
  customContent.value = ''
  store.closeTemplateSelector()
}
</script>
