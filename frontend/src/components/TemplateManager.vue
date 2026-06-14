<template>
  <div class="space-y-3">
    <div class="flex justify-between items-center">
      <h3 class="text-amber-300 font-bold text-sm">标注模板管理</h3>
      <button @click="showAddForm = !showAddForm"
        class="text-xs bg-amber-600 hover:bg-amber-500 px-2 py-1 rounded">
        {{ showAddForm ? '取消' : '+ 新建模板' }}
      </button>
    </div>

    <div v-if="showAddForm" class="bg-gray-800 rounded p-3 space-y-2">
      <input v-model="newTemplate.name" placeholder="模板名称" class="w-full bg-gray-700 rounded px-2 py-1 text-xs" />
      <div class="flex gap-2">
        <select v-model="newTemplate.type" class="flex-1 bg-gray-700 rounded px-2 py-1 text-xs">
          <option value="region">区域</option>
          <option value="character">字符</option>
          <option value="note">注释</option>
        </select>
        <input v-model="newTemplate.color" type="color" class="w-8 h-8 rounded cursor-pointer" />
      </div>
      <input v-model="newTemplate.label" placeholder="标签文字" class="w-full bg-gray-700 rounded px-2 py-1 text-xs" />
      <textarea v-model="newTemplate.content" placeholder="预设内容（可选）" rows="2"
        class="w-full bg-gray-700 rounded px-2 py-1 text-xs resize-none" />
      <button @click="addTemplate" class="w-full bg-green-600 hover:bg-green-500 py-1 rounded text-xs">
        保存模板
      </button>
    </div>

    <div class="space-y-1 max-h-64 overflow-y-auto">
      <div v-for="t in store.templates" :key="t.id"
        class="bg-gray-800 rounded p-2 text-xs">
        <div class="flex items-center justify-between mb-1">
          <div class="flex items-center gap-2">
            <span class="w-3 h-3 rounded-full" :style="{ backgroundColor: t.color }"></span>
            <span class="font-medium text-white">{{ t.name }}</span>
            <span class="text-gray-500">[{{ typeLabel(t.type) }}]</span>
          </div>
          <div class="flex gap-1">
            <button @click="startEdit(t)" class="text-blue-400 hover:text-blue-300">编辑</button>
            <button @click="store.removeTemplate(t.id)" class="text-red-400 hover:text-red-300">删除</button>
          </div>
        </div>
        <div class="text-gray-400">标签: {{ t.label }}</div>
        <div v-if="t.content" class="text-gray-500">内容: {{ t.content }}</div>

        <div v-if="editingId === t.id" class="mt-2 pt-2 border-t border-gray-700 space-y-2">
          <input v-model="editForm.name" class="w-full bg-gray-700 rounded px-2 py-1 text-xs" />
          <div class="flex gap-2">
            <select v-model="editForm.type" class="flex-1 bg-gray-700 rounded px-2 py-1 text-xs">
              <option value="region">区域</option>
              <option value="character">字符</option>
              <option value="note">注释</option>
            </select>
            <input v-model="editForm.color" type="color" class="w-8 h-8 rounded cursor-pointer" />
          </div>
          <input v-model="editForm.label" class="w-full bg-gray-700 rounded px-2 py-1 text-xs" />
          <textarea v-model="editForm.content" rows="2" class="w-full bg-gray-700 rounded px-2 py-1 text-xs resize-none" />
          <div class="flex gap-1">
            <button @click="saveEdit(t.id)" class="flex-1 bg-green-600 hover:bg-green-500 py-1 rounded text-xs">保存</button>
            <button @click="cancelEdit" class="flex-1 bg-gray-600 hover:bg-gray-500 py-1 rounded text-xs">取消</button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive } from 'vue'
import { useOcrStore } from '../store/ocr'
import type { AnnotationTemplate, Annotation } from '../types'

const store = useOcrStore()
const showAddForm = ref(false)
const editingId = ref<string | null>(null)

const newTemplate = reactive({
  name: '',
  type: 'region' as Annotation['type'],
  label: '',
  content: '',
  color: '#3b82f6'
})

const editForm = reactive({
  name: '',
  type: 'region' as Annotation['type'],
  label: '',
  content: '',
  color: '#3b82f6'
})

function typeLabel(type: string) {
  const map: Record<string, string> = {
    region: '区域',
    character: '字符',
    note: '注释'
  }
  return map[type] || type
}

function addTemplate() {
  if (!newTemplate.name.trim() || !newTemplate.label.trim()) {
    alert('请填写模板名称和标签')
    return
  }
  store.addTemplate({
    name: newTemplate.name.trim(),
    type: newTemplate.type,
    label: newTemplate.label.trim(),
    content: newTemplate.content.trim(),
    color: newTemplate.color
  })
  newTemplate.name = ''
  newTemplate.type = 'region'
  newTemplate.label = ''
  newTemplate.content = ''
  newTemplate.color = '#3b82f6'
  showAddForm.value = false
}

function startEdit(template: AnnotationTemplate) {
  editingId.value = template.id
  editForm.name = template.name
  editForm.type = template.type
  editForm.label = template.label
  editForm.content = template.content
  editForm.color = template.color
}

function cancelEdit() {
  editingId.value = null
}

function saveEdit(id: string) {
  if (!editForm.name.trim() || !editForm.label.trim()) {
    alert('请填写模板名称和标签')
    return
  }
  store.updateTemplate(id, {
    name: editForm.name.trim(),
    type: editForm.type,
    label: editForm.label.trim(),
    content: editForm.content.trim(),
    color: editForm.color
  })
  editingId.value = null
}
</script>
