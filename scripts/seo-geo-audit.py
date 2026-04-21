#!/usr/bin/env python3
"""
kibouFlow SEO / GEO 自动体检脚本
=================================
综合来源：
  - seo-advice-01.md（四层检测框架）
  - seo-advice-02.md（代码级审计发现）
  - 上线后第一周待办清单.md（冒烟 + 内容治理项）

用法：
  pip install requests pyyaml openai   # 首次安装
  python scripts/seo-geo-audit.py              # 默认检测 https://kibouflow.com
  python scripts/seo-geo-audit.py --base-url https://staging.kibouflow.com
  python scripts/seo-geo-audit.py --with-llm   # 启用 LLM 深度分析（需要 OPENAI_API_KEY）
  python scripts/seo-geo-audit.py --locale zh   # 只检测中文
  python scripts/seo-geo-audit.py --output report.json  # 输出 JSON 报告

环境变量：
  OPENAI_API_KEY   - 用于 LLM 深度分析（可选）
  OPENAI_MODEL     - 模型名称，默认 gpt-4o-mini
  SITE_BASE_URL    - 站点根 URL，默认 https://kibouflow.com
"""

import argparse
import json
import os
import re
import sys
import time
from dataclasses import dataclass, field, asdict
from pathlib import Path
from typing import Optional
from urllib.parse import urljoin

# ---------------------------------------------------------------------------
# 依赖检测
# ---------------------------------------------------------------------------
try:
    import requests
except ImportError:
    sys.exit("缺少 requests，请运行: pip install requests")

try:
    import yaml
except ImportError:
    sys.exit("缺少 pyyaml，请运行: pip install pyyaml")

# ---------------------------------------------------------------------------
# 常量
# ---------------------------------------------------------------------------
LOCALES = ["zh", "ja"]
CATEGORIES = ["problems", "paths", "boundaries", "cases"]
HIGH_VALUE_CONTENT_TYPES = ["cluster", "framework", "concept", "faq", "case"]

# 需要检查的入口文件
INFRA_PATHS = ["/robots.txt", "/sitemap.xml", "/llms.txt", "/llms-full.txt"]

# 静态页面
STATIC_PAGES = ["", "/trial", "/partner", "/faq", "/guides"]

# 评分权重
WEIGHTS = {
    "tech": 20,       # 技术可发现
    "structure": 30,  # 页面可理解
    "extractable": 30,# 内容可抽取
    "citable": 20,    # 内容可引用
}

# 中文 description 建议长度
DESC_MIN_LEN = 20
DESC_MAX_LEN = 80  # 中文字符

# 段落长度阈值（字符数）
LONG_PARAGRAPH_THRESHOLD = 500


# ---------------------------------------------------------------------------
# 数据结构
# ---------------------------------------------------------------------------
@dataclass
class Issue:
    level: str          # "error" | "warning" | "info"
    layer: str          # "tech" | "structure" | "extractable" | "citable"
    page: str           # URL 或文件路径
    code: str           # 问题代码
    message: str        # 描述
    suggestion: str = ""


@dataclass
class PageScore:
    url: str
    tech: float = 0
    structure: float = 0
    extractable: float = 0
    citable: float = 0

    @property
    def total(self) -> float:
        return self.tech + self.structure + self.extractable + self.citable


@dataclass
class AuditReport:
    timestamp: str = ""
    base_url: str = ""
    issues: list = field(default_factory=list)
    page_scores: list = field(default_factory=list)
    summary: dict = field(default_factory=dict)
    llm_analysis: list = field(default_factory=list)


# ---------------------------------------------------------------------------
# HTTP 工具
# ---------------------------------------------------------------------------
SESSION = requests.Session()
SESSION.headers.update({"User-Agent": "kibouFlow-SEO-Audit/1.0"})


def fetch(url: str, timeout: int = 15) -> Optional[requests.Response]:
    """安全 GET，失败返回 None"""
    try:
        resp = SESSION.get(url, timeout=timeout, allow_redirects=True)
        return resp
    except requests.RequestException as e:
        return None


def fetch_html(url: str) -> tuple[Optional[str], int, str]:
    """返回 (html, status_code, final_url)"""
    resp = fetch(url)
    if resp is None:
        return None, 0, url
    return resp.text, resp.status_code, resp.url


# ---------------------------------------------------------------------------
# 第一层：技术可发现（Infrastructure）
# ---------------------------------------------------------------------------
def check_infrastructure(base_url: str, issues: list[Issue]):
    """检查 robots.txt / sitemap.xml / llms.txt / llms-full.txt"""
    print("\n[1/4] 检查技术可发现层...")

    for path in INFRA_PATHS:
        url = base_url + path
        resp = fetch(url)
        if resp is None:
            issues.append(Issue("error", "tech", url, "INFRA_UNREACHABLE",
                                f"{path} 无法访问（网络错误）",
                                "确认服务器运行正常、DNS 解析正确"))
            print(f"  [x] {path} - 无法访问")
            continue

        if resp.status_code != 200:
            issues.append(Issue("error", "tech", url, "INFRA_NOT_200",
                                f"{path} 返回 {resp.status_code}",
                                f"确认路由是否正确配置"))
            print(f"  [x] {path} - HTTP {resp.status_code}")
            continue

        body = resp.text

        # 检查是否包含真实域名
        if "kibouflow.com" not in body and "your-domain.com" in body:
            issues.append(Issue("error", "tech", url, "INFRA_PLACEHOLDER_DOMAIN",
                                f"{path} 中仍使用占位域名 your-domain.com",
                                "设置环境变量 NEXT_PUBLIC_SITE_URL=https://kibouflow.com"))

        # sitemap 特殊检查
        if path == "/sitemap.xml":
            loc_count = body.count("<loc>")
            if loc_count == 0:
                issues.append(Issue("error", "tech", url, "SITEMAP_EMPTY",
                                    "sitemap.xml 没有任何 <loc> 条目"))
            else:
                print(f"  [ok] {path} - {loc_count} 个 URL 条目")
                # 检查 hreflang
                if "hreflang" not in body and "xhtml:link" not in body:
                    issues.append(Issue("warning", "tech", url, "SITEMAP_NO_HREFLANG",
                                        "sitemap.xml 中没有 hreflang alternates",
                                        "多语言站点建议在 sitemap 中包含 hreflang"))
                # 检查 zh 和 ja 都有
                for locale in LOCALES:
                    if f"/{locale}/" not in body and f"/{locale}<" not in body:
                        issues.append(Issue("warning", "tech", url, f"SITEMAP_MISSING_{locale.upper()}",
                                            f"sitemap.xml 中似乎缺少 {locale} 语言的页面"))
            continue

        # robots.txt 特殊检查
        if path == "/robots.txt":
            if "Sitemap:" not in body:
                issues.append(Issue("warning", "tech", url, "ROBOTS_NO_SITEMAP",
                                    "robots.txt 中缺少 Sitemap 指令"))
            if "Disallow: /" in body and "User-agent: *" in body:
                # 粗略判断是否误禁止了所有
                lines = body.strip().split("\n")
                for i, line in enumerate(lines):
                    if "User-agent: *" in line:
                        next_lines = lines[i+1:i+3]
                        for nl in next_lines:
                            if nl.strip() == "Disallow: /":
                                issues.append(Issue("error", "tech", url, "ROBOTS_BLOCK_ALL",
                                                    "robots.txt 对所有爬虫禁止了整个站点"))
            print(f"  [ok] {path}")
            continue

        # llms.txt 检查
        if "llms" in path:
            if len(body) < 100:
                issues.append(Issue("warning", "tech", url, "LLMS_TOO_SHORT",
                                    f"{path} 内容过短（{len(body)} 字节），可能输出异常"))
            else:
                print(f"  [ok] {path} - {len(body)} 字节")
            continue

        print(f"  [ok] {path}")

    # 检查根域名重定向
    print("  检查根域名 / 重定向...")
    resp = fetch(base_url + "/")
    if resp:
        final = resp.url
        if not any(f"/{loc}" in final for loc in LOCALES):
            issues.append(Issue("warning", "tech", base_url + "/", "ROOT_NO_REDIRECT",
                                f"根域名 / 最终 URL 为 {final}，未重定向到 /zh 或 /ja",
                                "建议根域名 301 到默认语言版本"))
            print(f"  [!] 根域名最终到 {final}")
        else:
            print(f"  [ok] 根域名重定向到 {final}")


# ---------------------------------------------------------------------------
# 第二层 + 第三层：页面级检查
# ---------------------------------------------------------------------------
def check_page(url: str, locale: str, issues: list[Issue], is_home: bool = False) -> Optional[PageScore]:
    """对单个页面做结构 + 可抽取检查，返回评分"""
    html, status, final_url = fetch_html(url)

    score = PageScore(url=url)

    if html is None or status == 0:
        issues.append(Issue("error", "tech", url, "PAGE_UNREACHABLE", "页面无法访问"))
        return score

    if status != 200:
        issues.append(Issue("error", "tech", url, "PAGE_NOT_200",
                            f"页面返回 HTTP {status}"))
        return score

    score.tech += 5  # 页面可访问 +5

    # ---- title ----
    title_match = re.search(r"<title[^>]*>(.+?)</title>", html, re.DOTALL)
    if title_match:
        title = title_match.group(1).strip()
        if title and title != "GEO" and len(title) > 3:
            score.tech += 3
        else:
            issues.append(Issue("warning", "structure", url, "TITLE_GENERIC",
                                f"页面 title 过于通用：'{title}'",
                                "每个页面应有独立的、描述性的 title"))
    else:
        issues.append(Issue("error", "structure", url, "TITLE_MISSING", "页面缺少 <title>"))

    # ---- meta description ----
    desc_match = re.search(r'<meta\s+name=["\']description["\']\s+content=["\'](.+?)["\']', html, re.IGNORECASE)
    if desc_match:
        desc = desc_match.group(1).strip()
        if len(desc) < DESC_MIN_LEN:
            issues.append(Issue("warning", "structure", url, "DESC_TOO_SHORT",
                                f"meta description 过短（{len(desc)} 字）",
                                f"建议 {DESC_MIN_LEN}-{DESC_MAX_LEN} 个中文字符"))
        elif len(desc) > DESC_MAX_LEN * 2:  # 粗略：中文字 ≈ 英文字的一半
            issues.append(Issue("warning", "structure", url, "DESC_TOO_LONG",
                                f"meta description 可能过长（{len(desc)} 字符）",
                                "Google 可能截断过长的 description"))
        score.structure += 5
    else:
        issues.append(Issue("warning", "structure", url, "DESC_MISSING",
                            "页面缺少 meta description"))

    # ---- canonical ----
    canonical_match = re.search(r'<link\s+rel=["\']canonical["\']\s+href=["\'](.+?)["\']', html, re.IGNORECASE)
    if canonical_match:
        score.tech += 3
    else:
        issues.append(Issue("warning", "tech", url, "CANONICAL_MISSING",
                            "页面缺少 canonical 标签"))

    # ---- hreflang ----
    hreflang_count = len(re.findall(r'hreflang=["\']', html, re.IGNORECASE))
    if hreflang_count >= 2:
        score.tech += 3
    else:
        issues.append(Issue("warning", "tech", url, "HREFLANG_MISSING",
                            f"页面 hreflang 标签不足（发现 {hreflang_count} 个，预期 ≥2）",
                            "多语言页面应包含指向所有语言版本的 hreflang"))

    # ---- OG tags ----
    og_title = re.search(r'property=["\']og:title["\']', html, re.IGNORECASE)
    og_desc = re.search(r'property=["\']og:description["\']', html, re.IGNORECASE)
    og_image = re.search(r'property=["\']og:image["\']', html, re.IGNORECASE)
    if og_title and og_desc:
        score.structure += 3
    else:
        issues.append(Issue("warning", "structure", url, "OG_INCOMPLETE",
                            "Open Graph 标签不完整（缺少 og:title 或 og:description）"))
    if not og_image:
        issues.append(Issue("info", "structure", url, "OG_IMAGE_MISSING",
                            "缺少 og:image，社交分享时无图片预览",
                            "建议为主要页面配置 OG 图片"))

    # ---- JSON-LD ----
    jsonld_matches = re.findall(r'<script\s+type=["\']application/ld\+json["\']', html, re.IGNORECASE)
    if jsonld_matches:
        score.structure += 5
        # 检查 JSON-LD 中有哪些类型
        jsonld_blocks = re.findall(
            r'<script\s+type=["\']application/ld\+json["\'][^>]*>(.*?)</script>',
            html, re.DOTALL | re.IGNORECASE
        )
        found_types = set()
        for block in jsonld_blocks:
            try:
                data = json.loads(block)
                if "@type" in data:
                    found_types.add(data["@type"])
            except json.JSONDecodeError:
                issues.append(Issue("warning", "structure", url, "JSONLD_INVALID",
                                    "JSON-LD 解析失败，可能存在语法错误"))
        if found_types:
            score.structure += min(len(found_types) * 2, 8)
    else:
        issues.append(Issue("warning", "structure", url, "JSONLD_MISSING",
                            "页面缺少 JSON-LD 结构化数据"))

    # ---- H1 检查 ----
    h1_matches = re.findall(r"<h1[^>]*>(.*?)</h1>", html, re.DOTALL | re.IGNORECASE)
    if len(h1_matches) == 0:
        issues.append(Issue("warning", "structure", url, "H1_MISSING",
                            "页面缺少 H1 标签",
                            "每个页面应有一个语义清晰的 H1"))
    elif len(h1_matches) > 1:
        issues.append(Issue("info", "structure", url, "H1_MULTIPLE",
                            f"页面有 {len(h1_matches)} 个 H1（通常建议只有 1 个）"))
    else:
        score.structure += 4

    # ---- H2 层级 ----
    h2_matches = re.findall(r"<h2[^>]*>(.*?)</h2>", html, re.DOTALL | re.IGNORECASE)
    if len(h2_matches) >= 2:
        score.structure += 3
        score.extractable += 5  # 有清晰的二级标题意味着可切片

    # ---- 面包屑 ----
    if "BreadcrumbList" in html:
        score.structure += 3
        score.citable += 3

    # ---- 首页特殊检查 ----
    if is_home:
        # 首页内链数量
        internal_links = re.findall(rf'href=["\']/{locale}/[^"\']*["\']', html)
        unique_links = set(internal_links)
        if len(unique_links) < 5:
            issues.append(Issue("warning", "citable", url, "HOME_FEW_INTERNAL_LINKS",
                                f"首页内链偏少（{len(unique_links)} 个唯一内链）",
                                "首页建议链接到更多内容页，帮助爬虫发现内容"))

    return score


# ---------------------------------------------------------------------------
# 第三层：内容可抽取（基于本地 MDX 文件）
# ---------------------------------------------------------------------------
def _read_file(filepath: Path) -> str:
    """读取文件，容忍编码异常"""
    try:
        return filepath.read_text(encoding="utf-8")
    except UnicodeDecodeError:
        return filepath.read_text(encoding="utf-8", errors="replace")


def parse_frontmatter(filepath: Path) -> Optional[dict]:
    """解析 MDX 文件的 YAML frontmatter"""
    text = _read_file(filepath)
    match = re.match(r"^---\s*\n(.*?)\n---", text, re.DOTALL)
    if not match:
        return None
    try:
        return yaml.safe_load(match.group(1))
    except yaml.YAMLError:
        return None


def get_body_after_frontmatter(filepath: Path) -> str:
    """获取 frontmatter 之后的正文"""
    text = _read_file(filepath)
    match = re.match(r"^---\s*\n.*?\n---\s*\n", text, re.DOTALL)
    if match:
        return text[match.end():]
    return text


def check_content_files(content_dir: Path, locale: str, issues: list[Issue]):
    """检查本地 MDX 文件的内容可抽取性"""
    print(f"\n[3/4] 检查 {locale} 内容文件的可抽取性...")

    locale_dir = content_dir / locale
    if not locale_dir.exists():
        issues.append(Issue("error", "extractable", str(locale_dir), "CONTENT_DIR_MISSING",
                            f"内容目录 {locale_dir} 不存在"))
        return

    mdx_files = sorted(locale_dir.rglob("*.mdx"))
    if not mdx_files:
        issues.append(Issue("error", "extractable", str(locale_dir), "NO_CONTENT_FILES",
                            f"{locale} 目录下没有 .mdx 文件"))
        return

    zh_slugs = set()
    ja_slugs = set()

    for f in mdx_files:
        rel = f.relative_to(locale_dir)
        fm = parse_frontmatter(f)
        body = get_body_after_frontmatter(f)

        if fm is None:
            issues.append(Issue("error", "extractable", str(rel), "FRONTMATTER_INVALID",
                                f"{rel} frontmatter 解析失败"))
            continue

        slug = fm.get("slug", "")
        category = fm.get("category", "")
        content_type = fm.get("contentType", "")
        page_id = f"{locale}/{category}/{slug}"

        # 收集 slug 用于交叉语言检查
        if locale == "zh":
            zh_slugs.add(f"{category}/{slug}")
        else:
            ja_slugs.add(f"{category}/{slug}")

        # -- title --
        if not fm.get("title"):
            issues.append(Issue("error", "extractable", page_id, "FM_TITLE_MISSING",
                                "缺少 title"))

        # -- description --
        desc = fm.get("description", "")
        if not desc:
            issues.append(Issue("error", "extractable", page_id, "FM_DESC_MISSING",
                                "缺少 description"))
        elif len(desc) > DESC_MAX_LEN * 3:
            issues.append(Issue("warning", "extractable", page_id, "FM_DESC_TOO_LONG",
                                f"description 过长（{len(desc)} 字符）"))

        # -- tldr --
        tldr = fm.get("tldr", [])
        if not tldr or len(tldr) == 0:
            issues.append(Issue("warning", "extractable", page_id, "FM_TLDR_MISSING",
                                "缺少 tldr（核心要点摘要）",
                                "TL;DR 是 LLM 抽取答案的首选来源"))

        # -- suitableFor / notSuitableFor --
        if not fm.get("suitableFor"):
            issues.append(Issue("warning", "extractable", page_id, "FM_SUITABLE_MISSING",
                                "缺少 suitableFor（适合谁）"))
        if not fm.get("notSuitableFor"):
            issues.append(Issue("warning", "extractable", page_id, "FM_NOT_SUITABLE_MISSING",
                                "缺少 notSuitableFor（不适合谁）",
                                "边界说明对 GEO 引用质量很重要"))

        # -- contentType --
        if not content_type:
            issues.append(Issue("info", "extractable", page_id, "FM_CONTENT_TYPE_MISSING",
                                "未设置 contentType",
                                "设置 contentType 可以启用对应的 JSON-LD schema"))

        # -- relatedSlugs（内链） --
        related = fm.get("relatedSlugs", [])
        if not related or len(related) == 0:
            issues.append(Issue("info", "citable", page_id, "FM_RELATED_MISSING",
                                "缺少 relatedSlugs（相关文章内链）"))

        # -- 正文结构检查 --
        # 是否有「先说结论」
        if "先说结论" not in body and "結論" not in body and "まとめ" not in body:
            # 允许 case 类型的例外
            if content_type not in ["case"]:
                issues.append(Issue("warning", "extractable", page_id, "BODY_NO_CONCLUSION_SECTION",
                                    "正文缺少「先说结论」/「結論」章节",
                                    "LLM 抽取时，开头的结论块是最重要的可引用内容"))

        # 长段落检查
        paragraphs = re.split(r"\n\n+", body)
        long_count = 0
        for p in paragraphs:
            stripped = p.strip()
            # 跳过标题行、列表、代码块
            if stripped.startswith("#") or stripped.startswith("-") or stripped.startswith("```"):
                continue
            if len(stripped) > LONG_PARAGRAPH_THRESHOLD:
                long_count += 1
        if long_count >= 3:
            issues.append(Issue("warning", "extractable", page_id, "BODY_LONG_PARAGRAPHS",
                                f"正文有 {long_count} 个超长段落（>{LONG_PARAGRAPH_THRESHOLD} 字符）",
                                "长段落降低 LLM 的 chunk 切分质量，建议拆分"))

        # 正文中的交叉链接
        internal_links_in_body = re.findall(r'\[.+?\]\(/[^)]+\)', body)
        mdx_link_components = re.findall(r'<Link\s+href=', body)
        total_body_links = len(internal_links_in_body) + len(mdx_link_components)
        if total_body_links == 0:
            issues.append(Issue("info", "citable", page_id, "BODY_NO_CROSSLINKS",
                                "正文中没有指向其他文章的链接",
                                "正文中的上下文内链比侧边栏推荐的 SEO 价值更高"))

    return zh_slugs, ja_slugs


# ---------------------------------------------------------------------------
# 第四层：交叉语言对齐检查
# ---------------------------------------------------------------------------
def check_locale_alignment(content_dir: Path, issues: list[Issue]):
    """检查 zh 和 ja 内容是否一一对应"""
    print("\n[3.5/4] 检查中日内容对齐...")

    zh_slugs = set()
    ja_slugs = set()

    for locale in LOCALES:
        locale_dir = content_dir / locale
        if not locale_dir.exists():
            continue
        for f in locale_dir.rglob("*.mdx"):
            fm = parse_frontmatter(f)
            if fm:
                cat = fm.get("category", "")
                slug = fm.get("slug", "")
                if locale == "zh":
                    zh_slugs.add(f"{cat}/{slug}")
                else:
                    ja_slugs.add(f"{cat}/{slug}")

    only_zh = zh_slugs - ja_slugs
    only_ja = ja_slugs - zh_slugs

    for slug in sorted(only_zh):
        issues.append(Issue("warning", "tech", f"zh/{slug}", "LOCALE_ZH_ONLY",
                            f"{slug} 只有中文版本，没有日文版本",
                            "hreflang 会指向 404。建议补全日文版本或在 generateMetadata 中跳过缺失语言"))

    for slug in sorted(only_ja):
        issues.append(Issue("warning", "tech", f"ja/{slug}", "LOCALE_JA_ONLY",
                            f"{slug} 只有日文版本，没有中文版本"))

    if not only_zh and not only_ja:
        print("  [ok] 中日内容完全对齐")
    else:
        print(f"  [!] 仅中文: {len(only_zh)} 篇，仅日文: {len(only_ja)} 篇")


# ---------------------------------------------------------------------------
# 线上页面批量检查
# ---------------------------------------------------------------------------
def check_online_pages(base_url: str, locales: list[str], issues: list[Issue], scores: list[PageScore]):
    """批量检查线上页面"""
    print("\n[2/4] 检查线上页面...")

    for locale in locales:
        # 首页
        url = f"{base_url}/{locale}"
        print(f"  检查 {url}")
        s = check_page(url, locale, issues, is_home=True)
        if s:
            scores.append(s)

        # 静态页面
        for page in STATIC_PAGES:
            if page == "":
                continue  # 已经检查了首页
            url = f"{base_url}/{locale}{page}"
            print(f"  检查 {url}")
            s = check_page(url, locale, issues)
            if s:
                scores.append(s)
            time.sleep(0.3)  # 礼貌性延迟


def check_sample_articles(base_url: str, content_dir: Path, locales: list[str],
                          issues: list[Issue], scores: list[PageScore], max_per_locale: int = 5):
    """抽样检查文章页面"""
    print("\n  抽样检查文章页面...")

    for locale in locales:
        locale_dir = content_dir / locale
        if not locale_dir.exists():
            continue
        mdx_files = sorted(locale_dir.rglob("*.mdx"))

        # 优先选 cluster / framework / faq 类型
        priority_files = []
        other_files = []
        for f in mdx_files:
            fm = parse_frontmatter(f)
            if fm and fm.get("contentType") in HIGH_VALUE_CONTENT_TYPES:
                priority_files.append(f)
            else:
                other_files.append(f)

        selected = (priority_files + other_files)[:max_per_locale]

        for f in selected:
            fm = parse_frontmatter(f)
            if not fm:
                continue
            cat = fm.get("category", "")
            slug = fm.get("slug", "")
            url = f"{base_url}/{locale}/guides/{cat}/{slug}"
            print(f"  检查 {url}")
            s = check_page(url, locale, issues)
            if s:
                scores.append(s)
            time.sleep(0.3)


# ---------------------------------------------------------------------------
# LLM 深度分析（可选）
# ---------------------------------------------------------------------------
def llm_analyze(base_url: str, content_dir: Path, locales: list[str]) -> list[dict]:
    """使用 LLM 做深度 GEO 分析"""
    try:
        from openai import OpenAI
    except ImportError:
        print("  [跳过] 未安装 openai，跳过 LLM 分析。运行: pip install openai")
        return []

    api_key = os.environ.get("OPENAI_API_KEY")
    if not api_key:
        print("  [跳过] 未设置 OPENAI_API_KEY，跳过 LLM 分析。")
        return []

    model = os.environ.get("OPENAI_MODEL", "gpt-4o-mini")
    client = OpenAI(api_key=api_key)
    results = []

    print("\n[LLM] 启动深度 GEO 分析...")

    # 分析 1：从 LLM 角度评估页面可引用性
    for locale in locales:
        locale_dir = content_dir / locale
        if not locale_dir.exists():
            continue

        # 选 2 篇高价值文章做深度分析
        mdx_files = sorted(locale_dir.rglob("*.mdx"))
        samples = []
        for f in mdx_files:
            fm = parse_frontmatter(f)
            if fm and fm.get("contentType") in ["cluster", "faq"]:
                samples.append(f)
            if len(samples) >= 2:
                break

        for f in samples:
            fm = parse_frontmatter(f)
            body = get_body_after_frontmatter(f)
            title = fm.get("title", "")
            desc = fm.get("description", "")
            content_type = fm.get("contentType", "")

            # 截取前 2000 字符送分析
            content_preview = body[:2000]

            prompt = f"""你是一个 SEO/GEO 审计专家。请分析以下网页内容的「可引用性」。

页面标题：{title}
页面描述：{desc}
内容类型：{content_type}
语言：{locale}

正文（前 2000 字）：
{content_preview}

请从以下维度评价（每项 1-10 分）并给出具体建议：
1. 结论明确性：开头是否能快速回答用户问题？
2. 信息密度：内容是否有具体的、可被引用的判断和建议？
3. 切片友好度：段落结构是否适合被 LLM 切成独立信息块？
4. 边界清晰度：是否明确说明了适用范围和局限？
5. 引用友好度：如果 LLM 要引用这个页面的内容回答用户问题，它容易吗？

请用 JSON 格式回复，格式：
{{"title": "...", "scores": {{"conclusion": N, "density": N, "chunkability": N, "boundary": N, "citability": N}}, "suggestions": ["建议1", "建议2", ...]}}
"""
            try:
                print(f"  [LLM] 分析 {locale}/{fm.get('category')}/{fm.get('slug')}...")
                response = client.chat.completions.create(
                    model=model,
                    messages=[{"role": "user", "content": prompt}],
                    temperature=0.3,
                    response_format={"type": "json_object"},
                )
                result = json.loads(response.choices[0].message.content)
                result["file"] = str(f.relative_to(content_dir))
                results.append(result)
            except Exception as e:
                print(f"  [LLM 错误] {e}")

    # 分析 2：模拟真实问答检验
    test_questions = {
        "zh": [
            "在日本找工作应该先改简历还是先补日语？",
            "什么情况下不适合立刻投简历？",
            "日语学习和求职准备怎么并行？",
        ],
        "ja": [
            "日本で就職活動をする場合、履歴書の修正と日本語の勉強、どちらを先にすべきですか？",
            "すぐに応募しない方がいいのはどんな場合ですか？",
        ],
    }

    # 读取 llms.txt 内容作为上下文
    resp = fetch(f"{base_url}/llms.txt")
    llms_context = resp.text[:3000] if resp and resp.status_code == 200 else ""

    if llms_context:
        for locale in locales:
            questions = test_questions.get(locale, [])
            for q in questions[:2]:
                prompt = f"""你是一个搜索引擎。以下是一个网站的内容索引：

{llms_context}

用户问题：{q}

请判断：
1. 这个网站的内容能否回答这个问题？（yes/no）
2. 如果能，最相关的页面是哪个？
3. 你会如何引用这个页面的内容来回答？（写一段模拟引用）
4. 引用时有什么困难？

请用 JSON 格式回复：
{{"question": "...", "can_answer": true/false, "best_page": "...", "mock_citation": "...", "difficulties": "..."}}
"""
                try:
                    print(f"  [LLM] 模拟问答: {q[:30]}...")
                    response = client.chat.completions.create(
                        model=model,
                        messages=[{"role": "user", "content": prompt}],
                        temperature=0.3,
                        response_format={"type": "json_object"},
                    )
                    result = json.loads(response.choices[0].message.content)
                    result["type"] = "simulated_qa"
                    result["locale"] = locale
                    results.append(result)
                except Exception as e:
                    print(f"  [LLM 错误] {e}")

    return results


# ---------------------------------------------------------------------------
# 报告生成
# ---------------------------------------------------------------------------
def generate_report(report: AuditReport):
    """在终端打印报告摘要"""
    issues = report.issues

    # 统计
    errors = [i for i in issues if i.level == "error"]
    warnings = [i for i in issues if i.level == "warning"]
    infos = [i for i in issues if i.level == "info"]

    by_layer = {}
    for i in issues:
        by_layer.setdefault(i.layer, []).append(i)

    print("\n" + "=" * 70)
    print("  kibouFlow SEO / GEO 体检报告")
    print("=" * 70)
    print(f"  检测时间: {report.timestamp}")
    print(f"  站点地址: {report.base_url}")
    print(f"  问题总数: {len(issues)}（错误 {len(errors)} / 警告 {len(warnings)} / 信息 {len(infos)}）")
    print()

    # 按层打印
    layer_names = {
        "tech": "技术可发现",
        "structure": "页面可理解",
        "extractable": "内容可抽取",
        "citable": "内容可引用",
    }

    for layer_key in ["tech", "structure", "extractable", "citable"]:
        layer_issues = by_layer.get(layer_key, [])
        name = layer_names[layer_key]
        layer_errors = [i for i in layer_issues if i.level == "error"]
        layer_warnings = [i for i in layer_issues if i.level == "warning"]

        status = "PASS" if not layer_errors else "FAIL"
        if not layer_errors and layer_warnings:
            status = "WARN"

        print(f"  [{status}] {name}（权重 {WEIGHTS[layer_key]} 分）")
        print(f"         错误: {len(layer_errors)}  警告: {len(layer_warnings)}  信息: {len([i for i in layer_issues if i.level == 'info'])}")

        # 只打印 error 和 warning 的前 5 个
        for issue in (layer_errors + layer_warnings)[:5]:
            icon = "x" if issue.level == "error" else "!"
            print(f"    [{icon}] [{issue.code}] {issue.message}")
            print(f"        页面: {issue.page}")
            if issue.suggestion:
                print(f"        建议: {issue.suggestion}")
        if len(layer_errors + layer_warnings) > 5:
            print(f"    ... 还有 {len(layer_errors + layer_warnings) - 5} 个问题")
        print()

    # LLM 分析结果
    if report.llm_analysis:
        print("  [LLM 深度分析]")
        for item in report.llm_analysis:
            if "scores" in item:
                print(f"    文件: {item.get('file', 'N/A')}")
                scores = item["scores"]
                print(f"    评分: 结论={scores.get('conclusion')}/10  密度={scores.get('density')}/10  "
                      f"切片={scores.get('chunkability')}/10  边界={scores.get('boundary')}/10  "
                      f"引用={scores.get('citability')}/10")
                for s in item.get("suggestions", [])[:3]:
                    print(f"      -> {s}")
                print()
            elif item.get("type") == "simulated_qa":
                answer = "能回答" if item.get("can_answer") else "不能回答"
                print(f"    问题: {item.get('question', '')[:50]}...")
                print(f"    结果: {answer}  最佳页面: {item.get('best_page', 'N/A')}")
                if item.get("difficulties"):
                    print(f"    困难: {item['difficulties']}")
                print()

    # 总结建议
    print("  " + "-" * 60)
    print("  优先处理建议：")
    priority_codes = ["INFRA_UNREACHABLE", "INFRA_NOT_200", "PAGE_UNREACHABLE",
                      "PAGE_NOT_200", "INFRA_PLACEHOLDER_DOMAIN", "ROOT_NO_REDIRECT",
                      "LOCALE_ZH_ONLY", "LOCALE_JA_ONLY", "ROBOTS_BLOCK_ALL",
                      "SITEMAP_EMPTY", "H1_MISSING", "TITLE_MISSING"]
    priority_issues = [i for i in issues if i.code in priority_codes]
    if priority_issues:
        for i, issue in enumerate(priority_issues[:10], 1):
            print(f"  {i}. [{issue.code}] {issue.message} ({issue.page})")
    else:
        print("  没有发现高优先级问题！")

    print("\n  完成。如需 JSON 报告，请使用 --output report.json")


# ---------------------------------------------------------------------------
# 主流程
# ---------------------------------------------------------------------------
def main():
    parser = argparse.ArgumentParser(description="kibouFlow SEO/GEO 体检脚本")
    parser.add_argument("--base-url", default=os.environ.get("SITE_BASE_URL", "https://kibouflow.com"),
                        help="站点根 URL")
    parser.add_argument("--content-dir", default=None,
                        help="本地 content 目录路径（默认自动检测）")
    parser.add_argument("--locale", choices=["zh", "ja"], default=None,
                        help="只检测指定语言")
    parser.add_argument("--with-llm", action="store_true",
                        help="启用 LLM 深度分析（需要 OPENAI_API_KEY）")
    parser.add_argument("--output", default=None,
                        help="输出 JSON 报告到文件")
    parser.add_argument("--skip-online", action="store_true",
                        help="跳过线上页面检查（仅检查本地文件）")
    parser.add_argument("--sample-size", type=int, default=5,
                        help="每种语言抽样检查的文章数量（默认 5）")
    args = parser.parse_args()

    base_url = args.base_url.rstrip("/")
    locales = [args.locale] if args.locale else LOCALES

    # 自动检测 content 目录
    if args.content_dir:
        content_dir = Path(args.content_dir)
    else:
        # 从脚本位置向上查找
        script_dir = Path(__file__).resolve().parent
        for candidate in [script_dir.parent / "content", script_dir / "content",
                          Path.cwd() / "content"]:
            if candidate.exists():
                content_dir = candidate
                break
        else:
            content_dir = None

    report = AuditReport(
        timestamp=time.strftime("%Y-%m-%d %H:%M:%S"),
        base_url=base_url,
    )
    issues = report.issues
    scores = report.page_scores

    print(f"kibouFlow SEO/GEO 体检")
    print(f"站点: {base_url}")
    print(f"语言: {', '.join(locales)}")
    print(f"内容目录: {content_dir or '未找到（跳过本地检查）'}")
    print(f"LLM 分析: {'启用' if args.with_llm else '关闭'}")

    # 第一层：基础设施
    if not args.skip_online:
        check_infrastructure(base_url, issues)

    # 第二层：线上页面
    if not args.skip_online:
        check_online_pages(base_url, locales, issues, scores)
        check_sample_articles(base_url, content_dir, locales, issues, scores,
                              max_per_locale=args.sample_size)

    # 第三层：本地内容文件
    if content_dir:
        for locale in locales:
            check_content_files(content_dir, locale, issues)
        check_locale_alignment(content_dir, issues)

    # 第四层（可选）：LLM 深度分析
    if args.with_llm:
        report.llm_analysis = llm_analyze(base_url, content_dir, locales)

    # 生成报告
    generate_report(report)

    # 输出 JSON
    if args.output:
        output_data = {
            "timestamp": report.timestamp,
            "base_url": report.base_url,
            "issues": [asdict(i) for i in report.issues],
            "llm_analysis": report.llm_analysis,
            "summary": {
                "total": len(issues),
                "errors": len([i for i in issues if i.level == "error"]),
                "warnings": len([i for i in issues if i.level == "warning"]),
                "infos": len([i for i in issues if i.level == "info"]),
            },
        }
        with open(args.output, "w", encoding="utf-8") as f:
            json.dump(output_data, f, ensure_ascii=False, indent=2)
        report_path = args.output
        print("\nJSON report saved to: " + report_path)

    # exit code
    error_count = len([i for i in issues if i.level == "error"])
    sys.exit(1 if error_count > 0 else 0)


if __name__ == "__main__":
    main()
