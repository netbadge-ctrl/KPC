import { PlanData } from './types';

export const INITIAL_CODE = `<!-- 等待输入中... -->
<div class="flex items-center justify-center h-screen text-gray-500">
  <p>尚未生成代码。</p>
</div>`;

export const MOCK_PLAN: PlanData = {
  thought_process: "正在分析用户的登录页需求。这属于标准的 B 端业务场景。需要一个强风格的认证布局。",
  component_list: ["KPC/Form", "KPC/Input", "KPC/Button", "KPC/Message", "KPC/Card"],
  layout_strategy: "居中卡片布局，配合模糊背景。输入框采用双列或单列垂直排列。",
  implementation_steps: [
    "1. 初始化 Vue 3 组件结构。",
    "2. 引入 KPC 组件 (Form, FormItem, Input, Button)。",
    "3. 创建用户名和密码的响应式状态 (Reactive State)。",
    "4. 实现表单验证规则。",
    "5. 添加模拟提交处理函数与 Message 反馈。"
  ]
};

// This simulates the result of the "Coder" agent. 
// We act as if we are writing a Vue file, but formatted as HTML for the iframe preview to work nicely in this React demo.
export const MOCK_GENERATED_CODE = `<!DOCTYPE html>
<html lang="zh-CN">
<head>
  <meta charset="UTF-8">
  <style>
    /* Simulating KPC Styles roughly for the preview */
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background: #f0f2f5; display: flex; align-items: center; justify-content: center; height: 100vh; margin: 0; }
    .k-card { background: white; border-radius: 4px; box-shadow: 0 2px 12px 0 rgba(0,0,0,.1); width: 400px; padding: 24px; }
    .k-card-header { font-size: 18px; font-weight: bold; margin-bottom: 24px; color: #333; text-align: center; }
    .k-form-item { margin-bottom: 20px; }
    .k-label { display: block; margin-bottom: 8px; font-size: 14px; color: #606266; }
    .k-input { width: 100%; box-sizing: border-box; height: 40px; padding: 0 15px; border: 1px solid #dcdfe6; border-radius: 4px; outline: none; transition: border-color .2s; color: #606266; }
    .k-input:focus { border-color: #2563eb; }
    .k-btn { display: inline-block; line-height: 1; white-space: nowrap; cursor: pointer; background: #fff; border: 1px solid #dcdfe6; color: #606266; text-align: center; box-sizing: border-box; outline: none; margin: 0; font-weight: 500; padding: 12px 20px; font-size: 14px; border-radius: 4px; width: 100%; }
    .k-btn-primary { color: #fff; background-color: #2563eb; border-color: #2563eb; }
    .k-btn-primary:hover { background-color: #1d4ed8; border-color: #1d4ed8; }
    .footer-links { margin-top: 16px; display: flex; justify-content: space-between; font-size: 12px; color: #909399; }
    .footer-links a { color: #2563eb; text-decoration: none; }
  </style>
</head>
<body>

<div class="k-card">
  <div class="k-card-header">
    KPC 管理系统
  </div>
  <form id="loginForm">
    <div class="k-form-item">
      <label class="k-label">用户名</label>
      <input type="text" class="k-input" placeholder="请输入用户名" value="admin">
    </div>
    <div class="k-form-item">
      <label class="k-label">密码</label>
      <input type="password" class="k-input" placeholder="请输入密码">
    </div>
    <div class="k-form-item">
      <button type="button" class="k-btn k-btn-primary" onclick="alert('登录成功！')">登 录</button>
    </div>
  </form>
  <div class="footer-links">
    <a href="#">忘记密码？</a>
    <a href="#">注册账号</a>
  </div>
</div>

</body>
</html>`;