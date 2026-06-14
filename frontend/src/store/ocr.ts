import { ref } from 'vue'
import { defineStore } from 'pinia'
import type { Document, OCRResult, Annotation, AnnotationTemplate } from '../types'

export const useOcrStore = defineStore('ocr', () => {
  const documents = ref<Document[]>([])
  const currentDoc = ref<Document | null>(null)
  const isLoading = ref(false)
  const searchQuery = ref('')
  const searchResults = ref<OCRResult[]>([])
  const templates = ref<AnnotationTemplate[]>([])
  const showTemplateSelector = ref(false)
  const pendingBbox = ref<[number, number, number, number] | null>(null)

  // Mock data
  const MOCK_DOC: Document = {
    id: '1',
    name: '论语·学而篇',
    imageUrl: '',
    results: [
      { id: 'r1', text: '子曰', bbox: [50, 30, 80, 40], confidence: 0.95 },
      { id: 'r2', text: '学而', bbox: [50, 80, 80, 40], confidence: 0.88 },
      { id: 'r3', text: '时习之', bbox: [50, 130, 120, 40], confidence: 0.91 },
      { id: 'r4', text: '不亦说乎', bbox: [50, 180, 160, 40], confidence: 0.87 },
      { id: 'r5', text: '有朋', bbox: [200, 30, 80, 40], confidence: 0.93 },
      { id: 'r6', text: '自远方来', bbox: [200, 80, 160, 40], confidence: 0.85 },
      { id: 'r7', text: '不亦乐乎', bbox: [200, 130, 160, 40], confidence: 0.92 },
    ],
    annotations: [],
    createdAt: '2025-01-15'
  }

  const VARIANT_DICT: Record<string, string> = {
    '説': '说', '學': '学', '習': '习', '遠': '远', '樂': '乐', '書': '书',
    '國': '国', '東': '东', '長': '长', '門': '门', '馬': '马', '鳥': '鸟',
    '風': '风', '雲': '云', '龍': '龙', '車': '车', '萬': '万', '見': '见',
  }

  const PRESET_TEMPLATES: AnnotationTemplate[] = [
    { id: 't1', name: '章节', type: 'region', label: '章节', content: '', color: '#ef4444' },
    { id: 't2', name: '人物', type: 'character', label: '人物', content: '', color: '#3b82f6' },
    { id: 't3', name: '注释', type: 'note', label: '注释', content: '', color: '#10b981' },
    { id: 't4', name: '异体字', type: 'character', label: '异体字', content: '', color: '#8b5cf6' },
    { id: 't5', name: '段落', type: 'region', label: '段落', content: '', color: '#f59e0b' },
    { id: 't6', name: '页眉', type: 'region', label: '页眉', content: '', color: '#ec4899' },
    { id: 't7', name: '页脚', type: 'region', label: '页脚', content: '', color: '#06b6d4' },
    { id: 't8', name: '校注', type: 'note', label: '校注', content: '', color: '#84cc16' },
  ]

  function loadMockDocument() {
    documents.value = [MOCK_DOC]
    currentDoc.value = MOCK_DOC
    if (templates.value.length === 0) {
      templates.value = [...PRESET_TEMPLATES]
    }
  }

  function initTemplates() {
    if (templates.value.length === 0) {
      templates.value = [...PRESET_TEMPLATES]
    }
  }

  function addTemplate(template: Omit<AnnotationTemplate, 'id'>) {
    templates.value.push({
      ...template,
      id: Date.now().toString()
    })
  }

  function updateTemplate(id: string, updates: Partial<Omit<AnnotationTemplate, 'id'>>) {
    const index = templates.value.findIndex(t => t.id === id)
    if (index !== -1) {
      templates.value[index] = { ...templates.value[index], ...updates }
    }
  }

  function removeTemplate(id: string) {
    templates.value = templates.value.filter(t => t.id !== id)
  }

  function openTemplateSelector(bbox: [number, number, number, number]) {
    pendingBbox.value = bbox
    showTemplateSelector.value = true
  }

  function closeTemplateSelector() {
    showTemplateSelector.value = false
    pendingBbox.value = null
  }

  function applyTemplate(template: AnnotationTemplate) {
    if (!pendingBbox.value || !currentDoc.value) return
    currentDoc.value.annotations.push({
      id: Date.now().toString(),
      type: template.type,
      bbox: pendingBbox.value,
      label: template.label,
      content: template.content
    })
    closeTemplateSelector()
  }

  async function uploadAndOCR(file: File) {
    isLoading.value = true
    try {
      const formData = new FormData()
      formData.append('file', file)
      const resp = await fetch('/api/ocr', { method: 'POST', body: formData })
      if (resp.ok) {
        const data = await resp.json()
        const doc: Document = {
          id: Date.now().toString(),
          name: file.name,
          imageUrl: URL.createObjectURL(file),
          results: data.results || [],
          annotations: [],
          createdAt: new Date().toISOString()
        }
        documents.value.push(doc)
        currentDoc.value = doc
        initTemplates()
      }
    } catch {
      // Use mock data as fallback
      loadMockDocument()
    } finally {
      isLoading.value = false
    }
  }

  function addAnnotation(type: Annotation['type'], bbox: [number, number, number, number], label: string, content: string) {
    if (!currentDoc.value) return
    currentDoc.value.annotations.push({
      id: Date.now().toString(),
      type, bbox, label, content
    })
  }

  function removeAnnotation(id: string) {
    if (!currentDoc.value) return
    currentDoc.value.annotations = currentDoc.value.annotations.filter(a => a.id !== id)
  }

  function convertVariant(text: string): string {
    return text.split('').map(c => VARIANT_DICT[c] || c).join('')
  }

  function searchInDocuments(query: string) {
    const q = query.toLowerCase()
    searchResults.value = documents.value.flatMap(d =>
      d.results.filter(r => r.text.includes(q) || (r.corrected || '').includes(q))
    )
  }

  function exportTEI(): string {
    if (!currentDoc.value) return ''
    let tei = '<?xml version="1.0" encoding="UTF-8"?>\n'
    tei += '<TEI xmlns="http://www.tei-c.org/ns/1.0">\n'
    tei += `  <teiHeader><fileDesc><titleStmt><title>${currentDoc.value.name}</title></titleStmt></fileDesc></teiHeader>\n`
    tei += '  <text><body>\n'
    for (const r of currentDoc.value.results) {
      tei += `    <seg type="line" xml:id="${r.id}" cert="${r.confidence}">${r.corrected || r.text}</seg>\n`
    }
    tei += '  </body></text>\n</TEI>'
    return tei
  }

  return {
    documents, currentDoc, isLoading, searchQuery, searchResults,
    templates, showTemplateSelector, pendingBbox,
    loadMockDocument, uploadAndOCR, addAnnotation, removeAnnotation,
    convertVariant, searchInDocuments, exportTEI,
    initTemplates, addTemplate, updateTemplate, removeTemplate,
    openTemplateSelector, closeTemplateSelector, applyTemplate
  }
})
