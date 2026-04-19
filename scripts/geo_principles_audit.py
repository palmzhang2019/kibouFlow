#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
GEO 五原理自动化体检：扫描 kibouFlow 仓库中的可观测信号，输出中文 Markdown 报告。

用法（在仓库根目录）:
  python scripts/geo_principles_audit.py
  python scripts/geo_principles_audit.py --json   # 额外打印机器可读摘要

可选：设置环境变量 GEO_AUDIT_USE_LLM=1 且提供 OPENAI_API_KEY 时，脚本会在报告末尾追加「LLM 归纳与建议（附录）」
（模型默认 GEO_AUDIT_OPENAI_MODEL=chatgpt-5.4-mini，请以 OpenAI 文档为准）。
仍可将输出粘贴到同目录 geo_audit_paste_to_llm_zh.txt 用外部工作流扩写。
"""

from __future__ import annotations

import argparse
import json
import os
import re
import sys
import urllib.error
import urllib.request
from dataclasses import dataclass, field, asdict
from datetime import datetime, timezone
from pathlib import Path
from typing import Iterable

SCRIPT_VERSION = "2.1.0"


def repo_root() -> Path:
    here = Path(__file__).resolve().parent
    return here.parent


def read_text(p: Path) -> str:
    try:
        return p.read_text(encoding="utf-8")
    except OSError:
        return ""


def iter_mdx(content_dir: Path) -> Iterable[Path]:
    if not content_dir.is_dir():
        return
    for p in content_dir.rglob("*.mdx"):
        yield p


def parse_frontmatter_keys(body: str) -> tuple[dict[str, str], str]:
    """极简 frontmatter：只取顶层 `key:` 行，值取到行尾（不解析多行 YAML）。"""
    if not body.startswith("---"):
        return {}, body
    m = re.match(r"^---\s*\n(.*?)\n---\s*\n", body, re.DOTALL)
    if not m:
        return {}, body
    fm_raw, rest = m.group(1), body[m.end() :]
    kv: dict[str, str] = {}
    for line in fm_raw.splitlines():
        mm = re.match(r"^([A-Za-z0-9_]+):\s*(.*)$", line.rstrip())
        if mm:
            kv[mm.group(1)] = mm.group(2).strip()
    return kv, rest


def count_mdx_signals(content_dir: Path) -> dict:
    total = 0
    with_not_suitable = 0
    with_suitable = 0
    with_tldr_key = 0
    with_conclusion_heading = 0
    for p in iter_mdx(content_dir):
        total += 1
        raw = read_text(p)
        fm, main = parse_frontmatter_keys(raw)
        if "notSuitableFor" in fm or "not_suitable_for" in fm:
            with_not_suitable += 1
        if "suitableFor" in fm or "suitable_for" in fm:
            with_suitable += 1
        if "tldr" in fm:
            with_tldr_key += 1
        if re.search(r"^##\s*先说结论", main, re.MULTILINE) or re.search(
            r"^##\s*結論", main, re.MULTILINE
        ):
            with_conclusion_heading += 1
    return {
        "mdx_total": total,
        "mdx_with_notSuitableFor_line": with_not_suitable,
        "mdx_with_suitableFor_line": with_suitable,
        "mdx_with_tldr_frontmatter": with_tldr_key,
        "mdx_with_conclusion_h2": with_conclusion_heading,
    }


def grep_src(src: Path, pattern: str) -> bool:
    if not src.is_dir():
        return False
    rx = re.compile(pattern)
    for p in src.rglob("*.ts"):
        if rx.search(read_text(p)):
            return True
    for p in src.rglob("*.tsx"):
        if rx.search(read_text(p)):
            return True
    return False


@dataclass
class AuditFacts:
    robots_path: str = ""
    robots_has_gptbot: bool = False
    robots_has_claude: bool = False
    robots_has_perplexity: bool = False
    robots_has_google_extended: bool = False
    llms_txt_route_exists: bool = False
    sitemap_path: str = ""
    sitemap_static_fake_lastmod: bool = False
    article_jsonld_path: str = ""
    article_author_is_organization: bool = False
    article_author_is_person: bool = False
    has_faqpage_component: bool = False
    has_howto_component: bool = False
    has_breadcrumb_component: bool = False
    has_defined_term: bool = False
    src_mentions_wikidata: bool = False
    src_article_about_key: bool = False
    org_same_as_lines: int = 0
    content_signals: dict = field(default_factory=dict)
    doc_geo_principles_exists: bool = False

    def to_dict(self) -> dict:
        d = asdict(self)
        return d


def collect_facts(root: Path) -> AuditFacts:
    f = AuditFacts()
    robots = root / "src" / "app" / "robots.ts"
    if robots.is_file():
        f.robots_path = str(robots.relative_to(root))
        t = read_text(robots)
        f.robots_has_gptbot = "GPTBot" in t
        f.robots_has_claude = "ClaudeBot" in t or "Claude-Web" in t
        f.robots_has_perplexity = "PerplexityBot" in t
        f.robots_has_google_extended = "Google-Extended" in t

    llms = root / "src" / "app" / "llms.txt" / "route.ts"
    f.llms_txt_route_exists = llms.is_file()

    sm = root / "src" / "app" / "sitemap.ts"
    if sm.is_file():
        f.sitemap_path = str(sm.relative_to(root))
        st = read_text(sm)
        # 静态页使用运行时 new Date() → 每次构建/请求都“像刚更新”
        f.sitemap_static_fake_lastmod = bool(
            re.search(r"lastModified:\s*new\s+Date\s*\(\s*\)", st)
        )

    aj = root / "src" / "components" / "seo" / "ArticleJsonLd.tsx"
    if aj.is_file():
        f.article_jsonld_path = str(aj.relative_to(root))
        at = read_text(aj)
        m = re.search(r"author:\s*(\{[^{}]*\})", at)
        author_obj = m.group(1) if m else ""
        f.article_author_is_organization = '"@type": "Organization"' in author_obj
        f.article_author_is_person = '"@type": "Person"' in author_obj

    f.has_faqpage_component = (root / "src" / "components" / "seo" / "FAQPageJsonLd.tsx").is_file()
    f.has_howto_component = (root / "src" / "components" / "seo" / "HowToJsonLd.tsx").is_file()
    f.has_breadcrumb_component = (root / "src" / "components" / "seo" / "BreadcrumbJsonLd.tsx").is_file()

    src = root / "src"
    f.has_defined_term = grep_src(src, r"DefinedTerm")
    f.src_mentions_wikidata = grep_src(src, r"wikidata|Wikidata")
    f.src_article_about_key = grep_src(src, r'"about"\s*:')

    org = root / "src" / "components" / "seo" / "OrganizationJsonLd.tsx"
    if org.is_file():
        ot = read_text(org)
        f.org_same_as_lines = len(re.findall(r"sameAs", ot))

    zh = count_mdx_signals(root / "content" / "zh")
    ja = count_mdx_signals(root / "content" / "ja")
    f.content_signals = {
        "mdx_total_zh": zh["mdx_total"],
        "mdx_total_ja": ja["mdx_total"],
        "mdx_total_all": zh["mdx_total"] + ja["mdx_total"],
        "notSuitableFor_any_locale": zh["mdx_with_notSuitableFor_line"]
        + ja["mdx_with_notSuitableFor_line"],
        "suitableFor_any_locale": zh["mdx_with_suitableFor_line"] + ja["mdx_with_suitableFor_line"],
        "tldr_frontmatter_any": zh["mdx_with_tldr_frontmatter"] + ja["mdx_with_tldr_frontmatter"],
        "conclusion_h2_any": zh["mdx_with_conclusion_h2"] + ja["mdx_with_conclusion_h2"],
    }

    f.doc_geo_principles_exists = (root / "docs" / "geo-principles.md").is_file()

    return f


def heuristic_scores(f: AuditFacts) -> dict[str, float]:
    """粗粒度 0–10 分，仅作快速对照，非搜索引擎真实打分。"""

    # 原理1 可召回
    p1 = 5.0
    if f.robots_path:
        p1 += 1.0
    n_bots = sum(
        [
            f.robots_has_gptbot,
            f.robots_has_claude,
            f.robots_has_perplexity,
            f.robots_has_google_extended,
        ]
    )
    p1 += min(2.0, 0.5 * n_bots)
    if f.llms_txt_route_exists:
        p1 += 1.5
    if f.src_mentions_wikidata or f.src_article_about_key:
        p1 += 1.0
    else:
        p1 -= 0.5
    p1 = max(0, min(10, p1))

    # 原理2 可切块
    p2 = 5.0
    ch = f.content_signals.get("conclusion_h2_any", 0)
    tot = max(1, f.content_signals.get("mdx_total_all", 1))
    p2 += 2.0 * (ch / tot)
    if f.content_signals.get("tldr_frontmatter_any", 0) > 0:
        p2 += 1.5
    else:
        p2 += 0.3
    p2 = max(0, min(10, p2))

    # 原理3 可抽取
    p3 = 4.0
    if f.has_faqpage_component:
        p3 += 1.5
    if f.has_howto_component:
        p3 += 1.5
    if f.has_breadcrumb_component:
        p3 += 0.8
    if f.has_defined_term:
        p3 += 1.2
    if f.src_article_about_key:
        p3 += 0.8
    p3 = max(0, min(10, p3))

    # 原理4 可信
    p4 = 5.0
    if f.article_author_is_person:
        p4 += 1.5
    elif f.article_author_is_organization:
        p4 -= 1.0
    if f.sitemap_static_fake_lastmod:
        p4 -= 1.8
    ns = f.content_signals.get("notSuitableFor_any_locale", 0)
    p4 += min(1.5, 0.15 * ns)
    p4 = max(0, min(10, p4))

    # 原理5 可归因（结构假设：已有 /guides/category/slug）
    p5 = 6.5
    if f.has_breadcrumb_component:
        p5 += 0.5
    if f.has_faqpage_component:
        p5 += 0.3
    p5 = max(0, min(10, p5))

    return {
        "可召回 Retrievability": round(p1, 1),
        "可切块 Chunkability": round(p2, 1),
        "可抽取 Extractability": round(p3, 1),
        "可信 Citation-Worthiness": round(p4, 1),
        "可归因 Attributability": round(p5, 1),
    }


def build_issues(f: AuditFacts, scores: dict[str, float]) -> list[dict[str, object]]:
    """从观测事实生成结构化问题列表（供治理后台落库与展示）。"""
    issues: list[dict[str, object]] = []
    n_bots = sum(
        [
            f.robots_has_gptbot,
            f.robots_has_claude,
            f.robots_has_perplexity,
            f.robots_has_google_extended,
        ]
    )
    mdx_all = int(f.content_signals.get("mdx_total_all", 0) or 0)
    ch_any = int(f.content_signals.get("conclusion_h2_any", 0) or 0)
    tldr_any = int(f.content_signals.get("tldr_frontmatter_any", 0) or 0)
    ns = int(f.content_signals.get("notSuitableFor_any_locale", 0) or 0)

    def add(code: str, title: str, severity: str, layer: str, evidence: dict[str, object]) -> None:
        issues.append(
            {
                "code": code,
                "title": title,
                "severity": severity,
                "layer": layer,
                "evidence": evidence,
            }
        )

    if not f.robots_path:
        add(
            "SITE_ROBOTS_MISSING",
            "未找到 robots.ts：可发现性与爬虫策略可能缺失",
            "critical",
            "site",
            {"robots_path": f.robots_path or None},
        )
    if f.sitemap_static_fake_lastmod:
        add(
            "SITE_SITEMAP_FAKE_LASTMOD",
            "sitemap 静态 URL 使用运行时 lastModified（new Date()），更新时间可信度存疑",
            "high",
            "site",
            {"sitemap_path": f.sitemap_path or None},
        )
    if not f.llms_txt_route_exists:
        add(
            "SITE_LLMS_TXT_MISSING",
            "未检测到 llms.txt 路由：模型可读入口说明不足",
            "medium",
            "site",
            {},
        )
    if f.robots_path and n_bots < 4:
        add(
            "SITE_ROBOTS_AI_CRAWLERS_INCOMPLETE",
            f"robots.ts 中常见 AI 爬虫显式配置不足（已配置 {n_bots}/4 类）",
            "medium",
            "site",
            {"robots_path": f.robots_path, "configured_bots": n_bots},
        )
    if f.article_author_is_organization and not f.article_author_is_person:
        add(
            "TEMPLATE_ARTICLE_AUTHOR_ORGANIZATION_ONLY",
            "Article JSON-LD 作者仍为 Organization：Person 级归因可增强引用可信度",
            "high",
            "template",
            {"article_jsonld_path": f.article_jsonld_path or None},
        )
    if tldr_any == 0 and mdx_all > 0:
        add(
            "CONTENT_TLDR_COVERAGE_ZERO",
            "所有 MDX 均未检测到 tldr frontmatter：首段/可切块摘要不足",
            "medium",
            "page",
            {"mdx_total_all": mdx_all},
        )
    if mdx_all > 0 and ch_any / mdx_all < 0.15:
        add(
            "CONTENT_CONCLUSION_H2_LOW",
            "带「先说结论/結論」类 H2 的 MDX 占比偏低：结论段稳定性可能不足",
            "medium",
            "page",
            {"mdx_total_all": mdx_all, "conclusion_h2_any": ch_any},
        )
    if ns < 3 and mdx_all > 0:
        add(
            "CONTENT_NOT_SUITABLE_SPARSE",
            "notSuitableFor 信号覆盖篇数偏少：边界声明与可信度叙事可能不足",
            "medium",
            "page",
            {"notSuitableFor_any_locale": ns, "mdx_total_all": mdx_all},
        )
    if not f.has_defined_term:
        add(
            "TEMPLATE_DEFINED_TERM_MISSING",
            "未观测到 DefinedTerm 相关输出：术语/定义的结构化抽取通道偏弱",
            "low",
            "template",
            {},
        )
    if not f.src_article_about_key:
        add(
            "TEMPLATE_ARTICLE_ABOUT_MISSING",
            "源码中未稳定出现 Article.about：主题实体锚点可能不足",
            "medium",
            "template",
            {},
        )
    if f.org_same_as_lines < 2:
        add(
            "SITE_ORG_SAMEAS_SPARSE",
            "Organization sameAs 映射条数偏少：外部实体归因可能不足",
            "low",
            "site",
            {"org_same_as_lines": f.org_same_as_lines},
        )
    if not f.doc_geo_principles_exists:
        add(
            "DOC_GEO_PRINCIPLES_MISSING",
            "未找到 docs/geo-principles.md：站内 GEO 原则文档缺失",
            "low",
            "site",
            {},
        )
    # 分项分数偏低时补充一条汇总型问题（与启发式分数同源，便于总览台对比）
    low = [k for k, v in scores.items() if isinstance(v, (int, float)) and float(v) < 5.5]
    if low:
        add(
            "SCORE_PRINCIPLE_BELOW_THRESHOLD",
            f"以下原理启发式分数偏低（<5.5），建议优先复核：{', '.join(low)}",
            "medium",
            "site",
            {"principles": low, "scores": {k: scores[k] for k in low}},
        )

    return issues


def _append_machine_readable_observations(lines: list[str], f: AuditFacts) -> None:
    lines.append("## 观测事实（机器可读）\n")
    lines.append("### 原理1 可召回\n")
    lines.append("| 项 | 值 |")
    lines.append("|---|---|")
    lines.append(f"| robots.ts | `{f.robots_path or '未找到'}` |")
    lines.append(
        f"| AI 爬虫显式 allow（GPT/Claude/Perplexity/Google-Extended） | "
        f"{f.robots_has_gptbot}/{f.robots_has_claude}/{f.robots_has_perplexity}/{f.robots_has_google_extended} |"
    )
    lines.append(f"| llms.txt 路由 | `{f.llms_txt_route_exists}` |")
    lines.append(
        f"| sitemap 静态页 `lastModified: new Date()` | `{f.sitemap_static_fake_lastmod}`（true=存在文档所述「时效信号不诚实」风险）|"
    )
    lines.append(
        f"| 源码中出现 Wikidata / schema about | wikidata=`{f.src_mentions_wikidata}`, about=`{f.src_article_about_key}` |"
    )
    lines.append(f"| Organization sameAs 出现次数（组件内） | `{f.org_same_as_lines}` |")
    lines.append("")

    lines.append("### 原理2–5 相关结构 / Schema\n")
    lines.append(f"| FAQPage 组件 | `{f.has_faqpage_component}` |")
    lines.append(f"| HowTo 组件 | `{f.has_howto_component}` |")
    lines.append(f"| BreadcrumbList 组件 | `{f.has_breadcrumb_component}` |")
    lines.append(f"| DefinedTerm（源码） | `{f.has_defined_term}` |")
    lines.append(f"| ArticleJsonLd 路径 | `{f.article_jsonld_path or '未找到'}` |")
    lines.append(
        f"| Article author 粗检 | Organization≈`{f.article_author_is_organization}`, Person≈`{f.article_author_is_person}` |"
    )
    lines.append("")

    lines.append("### 内容仓库 MDX（zh+ja 合并统计）\n")
    for k, v in f.content_signals.items():
        lines.append(f"- **{k}**: `{v}`")
    lines.append(
        "> 说明：`conclusion_h2_any` 等为 **中文文件数 + 日文文件数**（同一 slug 的双语版本会计 2 次）。\n"
    )
    lines.append("")


def build_report(root: Path, f: AuditFacts, scores: dict[str, float]) -> str:
    lines: list[str] = []
    lines.append("# GEO 五原理 — 仓库自动体检报告\n")

    now = datetime.now(timezone.utc).astimezone().strftime("%Y-%m-%d %H:%M:%S %Z")
    avg = sum(scores.values()) / len(scores) if scores else 0.0
    lines.append("## 总览\n")
    lines.append(f"- **本次检查时间（脚本运行环境）**: {now}\n")
    lines.append(f"- **检查范围**: `{root.resolve()}`\n")
    lines.append(f"- **参考文档**: `docs/geo-principles.md` → **{f.doc_geo_principles_exists}**\n")
    lines.append(f"- **五维均分（启发式）**: **{avg:.1f}** / 10\n")
    if avg >= 6.5:
        conclusion = "整体结构信号偏完整，建议按 P0/P1 清单做增量优化并在真实检索环境抽检。"
    elif avg >= 5.0:
        conclusion = "存在若干高杠杆短板，建议优先处理「可信 / 可召回」相关项，再迭代内容与抽取。"
    else:
        conclusion = "多项信号偏弱，建议按「可召回 → 可信 → 可抽取」顺序分阶段整改。"
    lines.append(f"- **总体结论（规则归纳）**: {conclusion}\n")
    review: list[str] = []
    if f.sitemap_static_fake_lastmod:
        review.append("sitemap 的 lastmod 策略是否构成“伪新鲜”风险（需产品与法务对齐）")
    if not f.src_mentions_wikidata and not f.src_article_about_key:
        review.append("实体通道（sameAs / about）是否满足品牌与知识图谱策略")
    if not review:
        review.append("无单项强制复核；仍建议在真实检索与 LLM 引用场景做端到端抽检")
    lines.append(f"- **需要人工复核的项目**: {'；'.join(review)}。\n")

    s1 = scores.get("可召回 Retrievability", 0.0)
    lines.append("\n## 五大原理逐项结果\n")
    lines.append("### 1. 可召回（Retrievability）\n")
    lines.append(f"- **分数**: **{s1}** / 10（启发式，非搜索引擎真实分）\n")
    lines.append("- **当前符合点**:\n")
    if f.robots_path:
        lines.append(f"  - 已发现 `robots` 源文件：`{f.robots_path}`")
    if f.llms_txt_route_exists:
        lines.append("  - 已提供 `llms.txt` 路由入口")
    n_bots = sum(
        [f.robots_has_gptbot, f.robots_has_claude, f.robots_has_perplexity, f.robots_has_google_extended]
    )
    lines.append(f"  - robots 中对常见 AI 爬虫显式配置：{n_bots}/4\n")
    lines.append("- **主要短板**:\n")
    if not f.llms_txt_route_exists:
        lines.append("  - 缺少 `llms.txt`（或等价）全站模型可读入口")
    if n_bots < 4:
        lines.append("  - 常见 LLM/AI 爬虫 allow 覆盖不完整（以站点政策为准）")
    if not f.src_mentions_wikidata and not f.src_article_about_key:
        lines.append("  - 代码侧缺少 Wikidata / `about` 等实体锚点信号\n")
    lines.append("- **需要加强的地方**:\n")
    lines.append("  - 把「可发现 + 可解释边界 + 可引用实体」三件事拆成可验收清单（按页面类型覆盖）\n")
    lines.append("- **修改建议**:\n")
    if not f.llms_txt_route_exists:
        lines.append("  - 增加 `llms.txt`（或等价）与爬虫可发现的全站入口说明。")
    if n_bots < 4:
        lines.append("  - 核对 `robots.ts`：为常见 LLM/AI 搜索爬虫配置显式 allow（按站点政策）。")
    if not f.src_mentions_wikidata and not f.src_article_about_key:
        lines.append("  - 在 Organization / Article JSON-LD 中补充 `sameAs`（含 Wikidata QID）、`about`/`mentions`。\n")

    s2 = scores.get("可切块 Chunkability", 0.0)
    lines.append("### 2. 可切块（Chunkability）\n")
    lines.append(f"- **分数**: **{s2}** / 10（启发式）\n")
    lines.append("- **当前符合点**:\n")
    ch = int(f.content_signals.get("conclusion_h2_any", 0) or 0)
    tot = max(1, int(f.content_signals.get("mdx_total_all", 1) or 1))
    lines.append(f"  - 具备「结论型 H2」的 MDX 篇数（粗统计）：{ch}（合计口径见观测事实）")
    if f.content_signals.get("tldr_frontmatter_any", 0):
        lines.append("  - 部分文章已提供 `tldr` frontmatter\n")
    else:
        lines.append("  - 尚未观察到 `tldr` frontmatter 覆盖\n")
    lines.append("- **主要短板**:\n")
    if f.content_signals.get("tldr_frontmatter_any", 0) == 0:
        lines.append("  - 缺少统一的「首屏短摘要」机制，长文更容易被硬切\n")
    lines.append("- **需要加强的地方**:\n")
    lines.append("  - 统一「TL;DR + 结论 H2 + 短段落」模板，降低被模型硬切后语义漂移\n")
    lines.append("- **修改建议**:\n")
    if f.content_signals.get("tldr_frontmatter_any", 0) == 0:
        lines.append("  - 正文前增加 TL;DR：可用 frontmatter `tldr` + 布局组件在 H1 下渲染短摘要。")
    lines.append("  - 保持「结论型 H2」与短段落；FAQ 单条控制在少量句子，降低被硬切风险。\n")

    s3 = scores.get("可抽取 Extractability", 0.0)
    lines.append("### 3. 可抽取（Extractability）\n")
    lines.append(f"- **分数**: **{s3}** / 10（启发式）\n")
    lines.append("- **当前符合点**:\n")
    lines.append(
        f"  - FAQ/HowTo/Breadcrumb 组件存在性：{f.has_faqpage_component}/{f.has_howto_component}/{f.has_breadcrumb_component}"
    )
    if f.has_defined_term:
        lines.append("  - 观测到 DefinedTerm 相关信号\n")
    else:
        lines.append("  - 未观测到 DefinedTerm 相关信号\n")
    lines.append("- **主要短板**:\n")
    if not f.has_defined_term:
        lines.append("  - 缺少术语/定义的结构化抽取通道（DefinedTerm）")
    if not f.src_article_about_key:
        lines.append("  - Article 侧 `about` 锚点不足\n")
    lines.append("- **需要加强的地方**:\n")
    lines.append("  - 把「问题—步骤—结论」结构映射到可抽取 JSON-LD（FAQ/HowTo/Breadcrumb）\n")
    lines.append("- **修改建议**:\n")
    if not f.has_defined_term:
        lines.append("  - 若有术语表/定义块，输出 `DefinedTerm` JSON-LD。")
    if not f.src_article_about_key:
        lines.append("  - 为关键文章补充 `Article.about`（或 geo jsonld overrides）以锚定主题实体。\n")

    s4 = scores.get("可信 Citation-Worthiness", 0.0)
    lines.append("### 4. 可信（Citation-Worthiness / Trust）\n")
    lines.append(f"- **分数**: **{s4}** / 10（启发式）\n")
    lines.append("- **当前符合点**:\n")
    if f.article_author_is_person:
        lines.append("  - Article author 更偏向 Person（更利于引用可信度叙事）\n")
    else:
        lines.append("  - Article author 仍偏 Organization 或未能判定 Person\n")
    lines.append("- **主要短板**:\n")
    if f.sitemap_static_fake_lastmod:
        lines.append("  - sitemap 静态 URL 使用运行时 `new Date()` 可能产生“伪新鲜”信号")
    if f.article_author_is_organization and not f.article_author_is_person:
        lines.append("  - author 形态可能削弱「人写/可追责」叙事\n")
    lines.append("- **需要加强的地方**:\n")
    lines.append("  - 把边界声明（notSuitableFor）与可验证事实（作者/机构/时间）对齐展示\n")
    lines.append("- **修改建议**:\n")
    if f.sitemap_static_fake_lastmod:
        lines.append(
            "  - **优先**：修正 `sitemap.ts` 静态 URL 的 `lastModified`，避免使用运行时的 `new Date()` 冒充全站每日更新。"
        )
    if f.article_author_is_organization and not f.article_author_is_person:
        lines.append("  - 将 `Article` 的 `author` 升级为 `Person`（并配作者页 / `memberOf` → Organization）。")
    if f.content_signals.get("notSuitableFor_any_locale", 0) < 3:
        lines.append("  - 在内容与首屏模块中强化「边界/不适用场景」（与 notSuitableFor 一致）。\n")

    s5 = scores.get("可归因 Attributability", 0.0)
    lines.append("### 5. 可归因（Attributability）\n")
    lines.append(f"- **分数**: **{s5}** / 10（启发式）\n")
    lines.append("- **当前符合点**:\n")
    if f.has_breadcrumb_component:
        lines.append("  - 具备 BreadcrumbList 组件信号")
    if f.has_faqpage_component:
        lines.append("  - 具备 FAQPage 组件信号\n")
    lines.append("- **主要短板**:\n")
    lines.append("  - 需结合信息架构核对：是否存在「高价值答案聚合在单页」导致引用锚点不稳\n")
    lines.append("- **需要加强的地方**:\n")
    lines.append("  - 高价值内容尽量落到稳定 URL + 稳定标题层级，减少引用漂移\n")
    lines.append("- **修改建议**:\n")
    lines.append(
        "  - 保持「一页一主题」与语义化 slug；高价值 FAQ 可考虑从聚合页拆出独立 URL，便于引用锚定。\n"
    )

    lines.append("## 修改建议汇总（按优先级）\n")
    p0: list[str] = []
    p1: list[str] = []
    p2: list[str] = []
    if f.sitemap_static_fake_lastmod:
        p0.append("修正 `sitemap.ts` 静态 URL 的 `lastModified`（禁止用运行时 `new Date()` 冒充全站每日更新）。")
    if not f.robots_path:
        p0.append("补齐可发现的 robots 策略文件，并校对 AI 爬虫 policy。")
    if not f.llms_txt_route_exists:
        p1.append("增加 `llms.txt`（或等价）与全站模型可读入口说明。")
    if n_bots < 4:
        p1.append("核对 `robots.ts`：为常见 LLM/AI 搜索爬虫配置显式 allow（按站点政策）。")
    if f.article_author_is_organization and not f.article_author_is_person:
        p1.append("将 Article `author` 升级为 Person，并补齐作者页与组织关系。")
    if f.content_signals.get("tldr_frontmatter_any", 0) == 0:
        p2.append("为长文引入 `tldr` + 首屏短摘要渲染。")
    if not f.has_defined_term:
        p2.append("评估是否需要 DefinedTerm JSON-LD（术语/定义类内容）。")
    if not p0:
        p0.append("（无脚本判定的 P0 阻断项；仍以真实环境抽检为准）")
    if not p1:
        p1.append("（无脚本判定的 P1 项；可优先处理内容模板与抽取一致性）")
    if not p2:
        p2.append("（无脚本判定的 P2 项；可做体验与可读性增强）")
    lines.append("### P0（应尽快处理）\n")
    for item in p0:
        lines.append(f"- {item}")
    lines.append("\n### P1（建议本周内落地）\n")
    for item in p1:
        lines.append(f"- {item}")
    lines.append("\n### P2（可排期优化）\n")
    for item in p2:
        lines.append(f"- {item}")
    lines.append("")

    _append_machine_readable_observations(lines, f)

    lines.append("## 启发式评分（0–10，仅供参考）\n")
    for k, v in scores.items():
        lines.append(f"- **{k}**: **{v}** / 10")
    lines.append("")

    lines.append("## 重要说明：评分性质与实测边界\n")
    lines.append(
        "> **本报告中的分数与结论均为启发式规则扫描结果**，用于快速发现仓库内可改进点；"
        "**不能替代**真实搜索引擎、AI 概览或第三方引用环境中的实测验证。\n"
    )
    lines.append(
        "> 若需要严谨结论，请在真实检索与 LLM 引用场景中进行对照实验（含竞品与富媒体结果）。\n"
    )

    lines.append("## 脚本无法替代的部分（可选人工 / 外部 LLM）\n")
    lines.append(
        "竞品检索验证（Perplexity/Google AIO）、富媒体结果测试、以及面向业务的措辞润色，"
        "仍建议由人工或外部工作流完成；也可将本报告粘贴到 `scripts/geo_audit_paste_to_llm_zh.txt` 指定位置再扩写。\n"
    )

    return "\n".join(lines)


def try_openai_appendix(facts: AuditFacts, scores: dict[str, float]) -> tuple[str, bool, str | None]:
    """可选：调用 OpenAI Chat Completions 生成附录 Markdown。返回 (appendix_md, used_llm, llm_model)。"""
    flag = os.environ.get("GEO_AUDIT_USE_LLM", "").strip().lower()
    if flag not in ("1", "true", "yes", "on"):
        return "", False, None
    key = os.environ.get("OPENAI_API_KEY", "").strip()
    if not key:
        print("提示：GEO_AUDIT_USE_LLM 已开启但未设置 OPENAI_API_KEY，跳过 LLM。", file=sys.stderr)
        return "", False, None
    model = (os.environ.get("GEO_AUDIT_OPENAI_MODEL") or "chatgpt-5.4-mini").strip()
    facts_json = json.dumps(facts.to_dict(), ensure_ascii=False)
    scores_json = json.dumps(scores, ensure_ascii=False)
    prompt = (
        "你是 GEO / 技术 SEO 顾问。下面给出本仓库自动化扫描得到的 facts（JSON）与启发式 scores（JSON）。\n"
        "请用**中文 Markdown**输出一个小节，标题必须精确为：## LLM 归纳与建议（附录）\n"
        "要求：\n"
        "1) 不要逐条复述 facts；输出 3–8 条高杠杆、可执行建议；\n"
        "2) 明确声明：你的内容是**对规则扫描结果的归纳**，不能替代真实检索/引用环境实测；\n"
        "3) 不要编造仓库中不存在的文件路径；如信息不足请写“需人工确认”。\n\n"
        f"FACTS_JSON:\n{facts_json[:14000]}\n\nSCORES_JSON:\n{scores_json}\n"
    )
    url = "https://api.openai.com/v1/chat/completions"
    body = json.dumps(
        {
            "model": model,
            "messages": [
                {"role": "system", "content": "你只输出 Markdown 正文，不要输出 JSON 包裹。"},
                {"role": "user", "content": prompt},
            ],
            "temperature": 0.35,
        },
        ensure_ascii=False,
    ).encode("utf-8")
    req = urllib.request.Request(url, data=body, method="POST")
    req.add_header("Content-Type", "application/json")
    req.add_header("Authorization", f"Bearer {key}")
    try:
        with urllib.request.urlopen(req, timeout=90) as resp:
            raw = json.loads(resp.read().decode("utf-8"))
        choices = raw.get("choices") or []
        if not choices:
            return "", False, None
        msg = (choices[0].get("message") or {}).get("content")
        if not isinstance(msg, str) or not msg.strip():
            return "", False, None
        return "\n\n" + msg.strip() + "\n", True, model
    except (urllib.error.URLError, urllib.error.HTTPError, TimeoutError, json.JSONDecodeError, KeyError, IndexError) as e:
        print(f"警告：OpenAI 调用失败，已跳过 LLM 附录：{e}", file=sys.stderr)
        return "", False, None


def main() -> int:
    parser = argparse.ArgumentParser(description="GEO 五原理仓库体检")
    parser.add_argument("--json", action="store_true", help="在 Markdown 后打印 JSON 摘要")
    args = parser.parse_args()

    # Windows 终端默认编码常导致中文乱码；尽量改为 UTF-8。
    if sys.platform == "win32":
        try:
            sys.stdout.reconfigure(encoding="utf-8")
            sys.stderr.reconfigure(encoding="utf-8")
        except (AttributeError, OSError):
            pass

    root = repo_root()
    if not (root / "package.json").is_file():
        print("错误：请在仓库根目录运行（未找到 package.json）。", file=sys.stderr)
        return 2

    facts = collect_facts(root)
    scores = heuristic_scores(facts)
    report_core = build_report(root, facts, scores)
    appendix, used_llm, llm_model = try_openai_appendix(facts, scores)
    report = report_core + appendix
    print(report)

    if args.json:
        payload = {
            "scores": scores,
            "facts": facts.to_dict(),
            "issues": build_issues(facts, scores),
            "used_llm": used_llm,
            "llm_model": llm_model if used_llm else None,
            "script_version": SCRIPT_VERSION,
            "target_path": str(root.resolve()),
        }
        print("\n--- JSON ---\n")
        print(json.dumps(payload, ensure_ascii=False, indent=2))

    out = root / "scripts" / "geo_principles_audit_last_run.md"
    try:
        out.write_text(report, encoding="utf-8")
        print(f"\n[Wrote {out.relative_to(root)} — open this file if console encoding garbles Chinese.]\n", file=sys.stderr)
    except OSError as e:
        print(f"警告：无法写入报告文件: {e}", file=sys.stderr)

    return 0


if __name__ == "__main__":
    raise SystemExit(main())
