---
name: geo_backend_phase3_strict
overview: 将 GEO Backend Phase 3 重构为严格模板可执行方案，聚焦 RBAC、审批发布流、健康看板、交接导出与审计能力，并细化测试验收路径。
todos:
  - id: p3-rbac
    content: 落地 RBAC 模型与角色绑定 API，补齐鉴权判定
    status: completed
  - id: p3-workflow
    content: 实现草稿-提审-发布流程与 published-only 生效链路
    status: completed
  - id: p3-health
    content: 实现 GEO 健康看板指标计算与筛选能力
    status: completed
  - id: p3-export-audit
    content: 实现导出接口与审计日志检索/追溯能力
    status: completed
  - id: p3-tests
    content: 补齐 Phase 3 的 unit/integration/e2e 验收用例
    status: completed
isProject: false
---

# GEO Backend Phase 3 严格模板实施方案

## 背景与目标
- 目标阶段：Backend Phase 3（运营化、权限与交接能力）。
- 