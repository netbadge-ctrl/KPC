

export const INITIAL_CODE = `<!-- KPC AI Forge 环境 -->
<!-- 预装依赖: Vue 3, Tailwind CSS, @king-design/vue -->
<div class="flex flex-col items-center justify-center h-screen text-gray-500 space-y-2">
  <p>环境已就绪。</p>
  <p class="text-xs opacity-75">可在对话框中输入指令开始构建。</p>
</div>`;

export const MOCK_PLAN = {
  thought_process: "这是一个模拟的思考过程。用户需要一个包含层级选择和操作按钮的卡片界面。根据 @king-design/vue 规范，将使用 k-card 作为容器，k-cascader 作为选择器，以及 k-button。",
  component_list: ["k-card", "k-button", "k-cascader"],
  layout_strategy: "使用 Tailwind Flexbox 居中布局，内部使用 space-y-4 控制垂直节奏。",
  implementation_steps: [
    "1. 创建基础 HTML 结构，引入 Vue 3 和 Tailwind。",
    "2. 定义 KingDesignVue 模拟库对象 (Mock Lib)。",
    "3. 在主 App 中使用 app.use(KingDesignVue) 注册组件。",
    "4. 实现业务逻辑与数据绑定。",
    "5. 完成渲染。"
  ]
};

export const MOCK_GENERATED_CODE = `<!DOCTYPE html>
<html lang="zh-CN">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>KPC 模拟页面</title>
    <script src="https://cdn.tailwindcss.com"></script>
    <script src="https://unpkg.com/vue@3/dist/vue.global.js"></script>
    <style>
        body { background-color: #f3f4f6; }
    </style>
</head>
<body class="flex items-center justify-center min-h-screen">
    <!-- [KPC:STEP:1] -->
    <div id="app" class="w-full max-w-lg p-4">
        <!-- [KPC:STEP:5] -->
        <k-card title="地区选择" type="border">
            <div class="space-y-6">
                <div class="space-y-2">
                    <label class="text-sm text-gray-600 font-medium">选择配送区域</label>
                    <k-cascader :data="areaData" v-model="selectedArea"></k-cascader>
                    <div class="text-xs text-gray-400">当前选择: {{ selectedArea || '未选择' }}</div>
                </div>

                <div class="flex gap-3 pt-4 border-t border-gray-100">
                    <k-button type="primary" @click="handleSubmit">确认提交</k-button>
                    <k-button type="secondary" @click="handleReset">重置</k-button>
                </div>
            </div>
        </k-card>
        
        <div class="mt-8 text-center space-y-2">
             <p class="text-xs text-gray-400">@king-design/vue 组件演示</p>
             <div class="flex gap-2 justify-center">
                <k-button type="success" size="small">成功</k-button>
                <k-button type="danger" size="small">危险</k-button>
             </div>
        </div>
    </div>

    <!-- [KPC:STEP:2] -->
    <script>
        // --- Mock Library: @king-design/vue ---
        // 真实项目中请使用: npm install @king-design/vue -S
        
        (function() {
            const { defineComponent } = Vue;

            const Button = defineComponent({
                name: 'KButton',
                props: ['type', 'color'],
                template: \`
                    <button 
                        :class="[
                            'px-4 py-2 rounded-lg font-medium transition-all duration-200 flex items-center justify-center focus:outline-none focus:ring-2 focus:ring-offset-1',
                            type === 'primary' ? 'bg-blue-600 text-white hover:bg-blue-700 focus:ring-blue-500' :
                            type === 'secondary' ? 'bg-gray-100 text-gray-700 hover:bg-gray-200 focus:ring-gray-400' :
                            type === 'success' ? 'bg-green-600 text-white hover:bg-green-700 focus:ring-green-500' :
                            type === 'danger' ? 'bg-red-600 text-white hover:bg-red-700 focus:ring-red-500' :
                            'bg-white border border-gray-300 text-gray-700 hover:bg-gray-50'
                        ]"
                    >
                        <slot></slot>
                    </button>
                \`
            });

            const Card = defineComponent({
                name: 'KCard',
                props: ['title', 'type'],
                template: \`
                    <div :class="['bg-white rounded-xl overflow-hidden', type === 'border' ? 'border border-gray-200 shadow-sm' : 'shadow-lg']">
                        <div v-if="title" class="px-6 py-4 border-b border-gray-100 bg-gray-50/50 flex justify-between items-center">
                            <h3 class="font-bold text-gray-800">{{ title }}</h3>
                        </div>
                        <div class="p-6">
                            <slot></slot>
                        </div>
                    </div>
                \`
            });

            const Cascader = defineComponent({
                name: 'KCascader',
                props: ['data'],
                emits: ['update:modelValue'],
                setup(props, { emit }) {
                    const handleChange = (e) => emit('update:modelValue', e.target.value);
                    return { handleChange };
                },
                template: \`
                    <div class="relative">
                        <select @change="handleChange" class="w-full appearance-none bg-white border border-gray-300 hover:border-blue-400 px-4 py-2.5 rounded-lg pr-8 focus:outline-none focus:ring-2 focus:ring-blue-100 transition-colors text-gray-700">
                            <option value="" disabled selected>请选择...</option>
                            <optgroup v-for="group in data" :label="group.label" :key="group.value" :disabled="group.disabled">
                                <option v-for="child in group.children" :key="child.value" :value="child.label">{{ child.label }}</option>
                            </optgroup>
                        </select>
                        <div class="absolute right-3 top-3 pointer-events-none text-gray-400">▼</div>
                    </div>
                \`
            });

            // Expose as global object to simulate NPM module
            window.KingDesignVue = {
                Button,
                Card,
                Cascader,
                install(app) {
                    app.component('k-button', Button);
                    app.component('k-card', Card);
                    app.component('k-cascader', Cascader);
                }
            };
        })();
    </script>

    <script>
        const { createApp, ref } = Vue;
        // [KPC:STEP:3] Simulate Import
        // import { Button, Card } from '@king-design/vue';
        const { Button, Card } = window.KingDesignVue;

        const app = createApp({
            setup() {
                const selectedArea = ref('');
                const areaData = ref([
                    {
                        value: 'beijing', label: '北京', disabled: true,
                        children: [ { value: 'haidian', label: '海淀区' }, { value: 'chaoyang', label: '朝阳区' } ]
                    },
                    {
                        value: 'hunan', label: '湖南',
                        children: [ { value: 'changsha', label: '长沙市' } ]
                    }
                ]);

                const handleSubmit = () => {
                    if(!selectedArea.value) {
                        alert('请先选择区域');
                        return;
                    }
                    alert('提交成功: ' + selectedArea.value);
                };

                const handleReset = () => {
                    selectedArea.value = '';
                };

                return {
                    areaData,
                    selectedArea,
                    handleSubmit,
                    handleReset
                };
            }
        });

        // Use the plugin
        app.use(window.KingDesignVue);
        app.mount('#app');
    </script>
</body>
</html>`;

export const MOCK_USERS = [
  {
    id: 'user-alice',
    name: '艾丽丝',
    role: 'UI/UX 设计专家',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Alice&backgroundColor=b6e3f4',
    themeColor: 'blue'
  },
  {
    id: 'user-bob',
    name: '鲍勃',
    role: '高级前端工程师',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Bob&backgroundColor=c0aede',
    themeColor: 'emerald'
  },
  {
    id: 'user-charlie',
    name: '查理',
    role: '资深产品经理',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Charlie&backgroundColor=ffdfbf',
    themeColor: 'purple'
  }
];