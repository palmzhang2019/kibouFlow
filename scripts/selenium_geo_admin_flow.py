#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
GEO 治理后台 — 单条 Selenium 主流程（与 docs/geo-admin-hermes-manual-test.md 推荐顺序对齐）。

依赖（建议在项目 .venv 中安装）:
  pip install -r scripts/requirements-selenium.txt

环境变量:
  启动时会自动加载仓库根目录的 .env，若存在 .env.local 则在其后加载（后者覆盖同名键）。
  GEO_ADMIN_BASE_URL   默认 http://localhost:3000
  GEO_ADMIN_LOCALE     默认 zh
  GEO_ADMIN_PASSWORD   登录密码；未设置时回退读取 ADMIN_GEO_PASSWORD（与 Next 后台共用）
  GEO_ADMIN_HEADLESS   设为 1 时无头 Chrome
  GEO_ADMIN_SKIP_RUN   设为 1 时跳过「运行体检」步骤（仅验证导航与页面）

用法:
  在根目录 .env 中配置 ADMIN_GEO_PASSWORD（或 GEO_ADMIN_PASSWORD）后:
  python scripts/selenium_geo_admin_flow.py
"""

from __future__ import annotations

import os
import sys
from pathlib import Path

from dotenv import load_dotenv
from selenium import webdriver
from selenium.webdriver.chrome.options import Options
from selenium.webdriver.common.by import By
from selenium.webdriver.support import expected_conditions as EC
from selenium.webdriver.support.ui import WebDriverWait


def env(name: str, default: str | None = None) -> str | None:
    v = os.environ.get(name, "").strip()
    return v if v else default


def load_repo_env() -> None:
    """加载根目录 .env / .env.local（不覆盖已在环境中显式设置的变量）。"""
    root = Path(__file__).resolve().parent.parent
    load_dotenv(root / ".env")
    load_dotenv(root / ".env.local", override=True)


def admin_nav_link(driver, text: str):
    """后台顶栏链接。页面最外层还有站点 Header（同为 <header>），必须限定在「GEO 治理后台」那一块。"""
    return driver.find_element(
        By.XPATH,
        f"//header[.//h1[contains(.,'GEO 治理后台')]]//a[contains(., '{text}')]",
    )


def admin_logout_button(driver):
    return driver.find_element(
        By.XPATH,
        "//header[.//h1[contains(.,'GEO 治理后台')]]//button[contains(., '退出登录')]",
    )


def build_driver() -> webdriver.Chrome:
    opts = Options()
    if env("GEO_ADMIN_HEADLESS") == "1":
        opts.add_argument("--headless=new")
    opts.add_argument("--no-sandbox")
    opts.add_argument("--disable-dev-shm-usage")
    opts.add_argument("--window-size=1280,900")
    return webdriver.Chrome(options=opts)


def main() -> int:
    load_repo_env()
    base = env("GEO_ADMIN_BASE_URL", "http://localhost:3000").rstrip("/")
    locale = env("GEO_ADMIN_LOCALE", "zh")
    password = env("GEO_ADMIN_PASSWORD") or env("ADMIN_GEO_PASSWORD")
    skip_run = env("GEO_ADMIN_SKIP_RUN") == "1"

    if not password:
        print(
            "错误: 请在根目录 .env 中设置 GEO_ADMIN_PASSWORD 或 ADMIN_GEO_PASSWORD，或导出到环境变量",
            file=sys.stderr,
        )
        return 2

    login_url = f"{base}/{locale}/admin/login"
    wait_sec = 15
    audit_wait_sec = 120

    driver = build_driver()
    wait = WebDriverWait(driver, wait_sec)

    try:
        # TC-NAV-01: 未登录访问受保护页应重定向到登录页
        protected_url = f"{base}/{locale}/admin/geo-audit"
        driver.get(protected_url)
        wait.until(EC.url_contains(f"/{locale}/admin/login"))
        assert "login" in driver.current_url.lower(), "未登录访问受保护页未跳转到 login"

        # TC-AUTH-01: 登录成功进入总览
        driver.get(login_url)
        wait.until(EC.presence_of_element_located((By.CSS_SELECTOR, 'input[type="password"]')))
        driver.find_element(By.CSS_SELECTOR, 'input[type="password"]').send_keys(password)
        driver.find_element(By.XPATH, "//button[contains(., '登录')]").click()
        wait.until(EC.url_contains(f"/{locale}/admin/geo-audit"))
        assert "login" not in driver.current_url.lower(), "登录后仍停留在 login"

        # TC-DASH: 总览（客户端顶栏可能略晚于 h2，显式等待后台导航）
        wait.until(EC.presence_of_element_located((By.XPATH, "//h2[contains(., '总览台')]")))
        wait.until(EC.element_to_be_clickable((By.XPATH, "//header[.//h1[contains(.,'GEO 治理后台')]]//a[contains(., '运行体检')]")))

        # 运行体检（可选；SKIP 时只打开运行页再回总览，不触发长耗时脚本）
        if skip_run:
            admin_nav_link(driver, "运行体检").click()
            wait.until(EC.presence_of_element_located((By.XPATH, "//h2[contains(., '运行 GEO 体检')]")))
            admin_nav_link(driver, "总览").click()
            wait.until(EC.presence_of_element_located((By.XPATH, "//h2[contains(., '总览台')]")))
        else:
            admin_nav_link(driver, "运行体检").click()
            wait.until(EC.presence_of_element_located((By.XPATH, "//h2[contains(., '运行 GEO 体检')]")))
            run_btn = driver.find_element(By.XPATH, "//button[contains(., '运行 GEO 体检')]")
            run_btn.click()
            # 运行中按钮文案为「运行中…」，结束后恢复为「运行 GEO 体检」且可点
            WebDriverWait(driver, audit_wait_sec).until(
                EC.element_to_be_clickable((By.XPATH, "//button[contains(., '运行 GEO 体检')]"))
            )
            # 确认状态区出现成功或失败
            body = driver.find_element(By.TAG_NAME, "body").text
            if "运行成功" not in body and "运行失败" not in body:
                raise AssertionError("未检测到运行成功/失败文案")

            # 若有「查看本次记录」则进入详情
            try:
                link = WebDriverWait(driver, 5).until(
                    EC.element_to_be_clickable((By.XPATH, "//button[contains(., '查看本次记录')]"))
                )
                link.click()
                wait.until(EC.presence_of_element_located((By.XPATH, "//h2[contains(., '报告详情')]")))
                assert "分数摘要" in driver.page_source
                assert "结构化问题" in driver.page_source
            except Exception:
                # 未入库时无按钮，改走历史列表
                pass

        # TC-HIST: 历史列表
        admin_nav_link(driver, "历史").click()
        wait.until(EC.presence_of_element_located((By.XPATH, "//h2[contains(., '历史记录')]")))
        # 点击第一条时间链接（若存在）
        links = driver.find_elements(By.XPATH, "//tbody//a[contains(@href,'geo-audit/history/')]")
        if links:
            links[0].click()
            wait.until(EC.presence_of_element_located((By.XPATH, "//h2[contains(., '报告详情')]")))
            assert "分数摘要" in driver.page_source

        # TC-ISS: 问题中心
        admin_nav_link(driver, "问题").click()
        wait.until(EC.url_contains("geo-audit/issues"))
        wait.until(EC.presence_of_element_located((By.XPATH, "//h2[contains(., '问题中心')]")))
        issue_links = driver.find_elements(By.XPATH, "//tbody//a[contains(@href,'/geo-audit/issues/')]")
        if issue_links:
            issue_links[0].click()
            wait.until(EC.presence_of_element_located((By.XPATH, "//h2[contains(., '问题详情')]")))

        # TC-HUB: 决策 / 验证 / 标准
        driver.get(f"{base}/{locale}/admin/geo-audit/decisions")
        wait.until(EC.presence_of_element_located((By.XPATH, "//h2[contains(., '修复决策中心')]")))
        driver.get(f"{base}/{locale}/admin/geo-audit/validation")
        wait.until(EC.presence_of_element_located((By.XPATH, "//h2[contains(., '验证与复检中心')]")))
        driver.get(f"{base}/{locale}/admin/geo-audit/standards")
        wait.until(EC.presence_of_element_located((By.XPATH, "//h2[contains(., '规则 / 标准中心')]")))

        # 回到总览
        driver.get(f"{base}/{locale}/admin/geo-audit")
        wait.until(EC.presence_of_element_located((By.XPATH, "//h2[contains(., '总览台')]")))

        # TC-AUTH-02: 退出（避免点到站点其它区域的按钮）
        admin_logout_button(driver).click()
        wait.until(EC.url_contains(f"/{locale}/admin/login"))

        # TC-AUTH-02 加强版：退出后访问受保护页仍应重定向到登录页
        driver.get(protected_url)
        wait.until(EC.url_contains(f"/{locale}/admin/login"))
        assert "login" in driver.current_url.lower(), "退出后访问受保护页未跳转到 login"

        print("PASS: Selenium 主流程完成")
        return 0
    finally:
        driver.quit()


if __name__ == "__main__":
    raise SystemExit(main())
