# -*- coding: utf-8 -*-
"""
AM Talks 数据治理经验分享 HTML生成器 V2
"""

import os

AUTHOR = "刘荣新"
DATE = "2026年6月"
SERIES = "AM TALKS - 006"
TITLE = "数据治理规范体系"
VERSION = "V2.0"
TOTAL_SLIDES = 18

OUTPUT_DIR = r"D:\Users\11033406\【03】Workspace\【06】数据管理\设计方案\数据治理文档整理分析_20260617\AM_Talks_调研报告"
OUTPUT_FILE = os.path.join(OUTPUT_DIR, "am_talks_data_governance_v2.html")

CSS = """
:root {
    --primary-dark: #0a1628;
    --primary: #1a365d;
    --primary-light: #2c5282;
    --accent: #38b2ac;
    --accent-light: #4fd1c5;
    --text-white: #ffffff;
    --text-light: #e2e8f0;
    --text-muted: #a0aec0;
    --success: #48bb78;
    --warning: #ed8936;
    --danger: #fc8181;
}

* {
    margin: 0;
    padding: 0;
    box-sizing: border-box;
}

body {
    font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", "PingFang SC", "Microsoft YaHei", sans-serif;
    background: var(--primary-dark);
    color: var(--text-white);
    overflow: hidden;
    height: 100vh;
}

.slides-container {
    width: 100vw;
    height: 100vh;
    position: relative;
    overflow: hidden;
}

.slide {
    position: absolute;
    width: 100%;
    height: 100%;
    display: none;
    padding: 60px 80px;
    background: linear-gradient(135deg, var(--primary-dark) 0%, var(--primary) 100%);
    opacity: 0;
    transition: opacity 0.5s ease;
}

.slide.active {
    display: flex;
    flex-direction: column;
    opacity: 1;
}

.slide-header {
    margin-bottom: 40px;
}

.slide-number {
    font-size: 14px;
    color: var(--accent);
    margin-bottom: 10px;
    font-weight: 600;
}

.slide-title {
    font-size: 42px;
    font-weight: 700;
    color: var(--text-white);
    line-height: 1.3;
}

.slide-subtitle {
    font-size: 20px;
    color: var(--text-muted);
    margin-top: 10px;
}

.slide-content {
    flex: 1;
    display: flex;
    flex-direction: column;
    justify-content: center;
}

.slide-footer {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding-top: 30px;
    border-top: 1px solid rgba(255,255,255,0.1);
}

.cover-slide {
    justify-content: center;
    align-items: center;
    text-align: center;
    background: linear-gradient(135deg, var(--primary-dark) 0%, var(--primary) 50%, var(--primary-light) 100%);
}

.cover-slide .series-tag {
    font-size: 18px;
    color: var(--accent);
    margin-bottom: 20px;
    letter-spacing: 4px;
}

.cover-slide .main-title {
    font-size: 56px;
    font-weight: 800;
    color: var(--text-white);
    margin-bottom: 20px;
    line-height: 1.3;
}

.cover-slide .highlight {
    color: var(--accent-light);
}

.cover-slide .author {
    font-size: 24px;
    color: var(--text-light);
    margin-top: 40px;
}

.cover-slide .date {
    font-size: 16px;
    color: var(--text-muted);
    margin-top: 15px;
}

.toc-grid {
    display: grid;
    grid-template-columns: repeat(2, 1fr);
    gap: 30px;
    margin-top: 20px;
}

.toc-item {
    background: rgba(255,255,255,0.05);
    border-radius: 16px;
    padding: 30px;
    border-left: 4px solid var(--accent);
    transition: all 0.3s ease;
}

.toc-item:hover {
    background: rgba(255,255,255,0.1);
    transform: translateX(10px);
}

.toc-number {
    font-size: 48px;
    font-weight: 800;
    color: var(--accent);
    opacity: 0.5;
}

.toc-title {
    font-size: 24px;
    font-weight: 600;
    margin: 15px 0 10px;
}

.toc-desc {
    font-size: 16px;
    color: var(--text-muted);
}

.data-grid {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 25px;
}

.data-card {
    background: rgba(255,255,255,0.05);
    border-radius: 16px;
    padding: 25px;
    text-align: center;
    border: 1px solid rgba(255,255,255,0.1);
}

.data-card .value {
    font-size: 48px;
    font-weight: 800;
    color: var(--accent-light);
    margin-bottom: 10px;
}

.data-card .label {
    font-size: 16px;
    color: var(--text-muted);
}

.data-card .desc {
    font-size: 14px;
    color: var(--text-muted);
    margin-top: 8px;
    opacity: 0.8;
}

.problem-list {
    display: flex;
    flex-direction: column;
    gap: 20px;
}

.problem-item {
    display: flex;
    align-items: flex-start;
    gap: 20px;
    background: rgba(255,255,255,0.03);
    padding: 20px 25px;
    border-radius: 12px;
    border-left: 3px solid var(--danger);
}

.problem-icon {
    width: 40px;
    height: 40px;
    background: rgba(252, 129, 129, 0.2);
    border-radius: 10px;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 20px;
    flex-shrink: 0;
}

.problem-content h4 {
    font-size: 20px;
    font-weight: 600;
    margin-bottom: 8px;
}

.problem-content p {
    font-size: 16px;
    color: var(--text-muted);
}

.rule-table {
    width: 100%;
    border-collapse: collapse;
    margin-top: 20px;
}

.rule-table th,
.rule-table td {
    padding: 15px 20px;
    text-align: left;
    border-bottom: 1px solid rgba(255,255,255,0.1);
}

.rule-table th {
    background: rgba(255,255,255,0.05);
    color: var(--accent);
    font-weight: 600;
    font-size: 14px;
    text-transform: uppercase;
    letter-spacing: 1px;
}

.rule-table td {
    font-size: 15px;
}

.rule-table tr:hover td {
    background: rgba(255,255,255,0.03);
}

.rule-id {
    display: inline-block;
    background: var(--accent);
    color: var(--primary-dark);
    padding: 4px 12px;
    border-radius: 20px;
    font-weight: 700;
    font-size: 14px;
}

.rule-correct {
    color: var(--success);
}

.rule-wrong {
    color: var(--danger);
    text-decoration: line-through;
    opacity: 0.7;
}

.category-tree {
    display: flex;
    flex-direction: column;
    gap: 15px;
}

.category-group {
    background: rgba(255,255,255,0.03);
    border-radius: 12px;
    padding: 20px;
}

.category-group-title {
    font-size: 18px;
    font-weight: 600;
    color: var(--accent);
    margin-bottom: 15px;
    display: flex;
    align-items: center;
    gap: 10px;
}

.category-items {
    display: flex;
    flex-wrap: wrap;
    gap: 10px;
}

.category-tag {
    background: rgba(56, 178, 172, 0.2);
    border: 1px solid var(--accent);
    padding: 8px 16px;
    border-radius: 20px;
    font-size: 14px;
    display: flex;
    align-items: center;
    gap: 8px;
}

.category-tag .code {
    font-weight: 700;
    color: var(--accent-light);
}

.category-tag .count {
    background: var(--accent);
    color: var(--primary-dark);
    padding: 2px 8px;
    border-radius: 10px;
    font-size: 12px;
    font-weight: 600;
}

.architecture {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 20px;
}

.arch-layer {
    background: linear-gradient(90deg, var(--primary-light), var(--primary));
    padding: 25px 50px;
    border-radius: 12px;
    text-align: center;
    width: 80%;
    position: relative;
}

.arch-layer::after {
    content: '';
    position: absolute;
    bottom: -20px;
    left: 50%;
    transform: translateX(-50%);
    width: 0;
    height: 0;
    border-left: 15px solid transparent;
    border-right: 15px solid transparent;
    border-top: 15px solid var(--primary-light);
}

.arch-layer:last-child::after {
    display: none;
}

.arch-layer .layer-name {
    font-size: 20px;
    font-weight: 700;
    margin-bottom: 8px;
}

.arch-layer .layer-desc {
    font-size: 14px;
    color: var(--text-muted);
}

.arch-arrow {
    color: var(--accent);
    font-size: 24px;
}

.case-card {
    background: rgba(255,255,255,0.05);
    border-radius: 16px;
    padding: 30px;
    margin-bottom: 20px;
}

.case-header {
    display: flex;
    align-items: center;
    gap: 15px;
    margin-bottom: 20px;
}

.case-number {
    background: var(--accent);
    color: var(--primary-dark);
    width: 40px;
    height: 40px;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    font-weight: 700;
    font-size: 18px;
}

.case-title {
    font-size: 24px;
    font-weight: 600;
}

.case-problem {
    background: rgba(252, 129, 129, 0.1);
    border-left: 3px solid var(--danger);
    padding: 15px 20px;
    border-radius: 0 8px 8px 0;
    margin-bottom: 15px;
}

.case-solution {
    background: rgba(72, 187, 120, 0.1);
    border-left: 3px solid var(--success);
    padding: 15px 20px;
    border-radius: 0 8px 8px 0;
    margin-bottom: 15px;
}

.case-effect {
    display: flex;
    align-items: center;
    gap: 20px;
    padding: 15px 20px;
    background: rgba(56, 178, 172, 0.1);
    border-radius: 8px;
}

.effect-before, .effect-after {
    text-align: center;
}

.effect-arrow {
    font-size: 24px;
    color: var(--accent);
}

.exp-grid {
    display: grid;
    grid-template-columns: repeat(2, 1fr);
    gap: 25px;
}

.exp-card {
    background: rgba(255,255,255,0.05);
    border-radius: 16px;
    padding: 25px;
    display: flex;
    gap: 20px;
}

.exp-number {
    width: 50px;
    height: 50px;
    background: linear-gradient(135deg, var(--accent), var(--accent-light));
    border-radius: 12px;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 24px;
    font-weight: 800;
    flex-shrink: 0;
}

.exp-content h4 {
    font-size: 18px;
    font-weight: 600;
    margin-bottom: 8px;
}

.exp-content p {
    font-size: 14px;
    color: var(--text-muted);
}

.steps-container {
    display: flex;
    gap: 30px;
    justify-content: center;
}

.step-card {
    background: rgba(255,255,255,0.05);
    border-radius: 16px;
    padding: 30px;
    width: 300px;
    text-align: center;
    position: relative;
}

.step-card::after {
    content: '→';
    position: absolute;
    right: -25px;
    top: 50%;
    transform: translateY(-50%);
    font-size: 30px;
    color: var(--accent);
}

.step-card:last-child::after {
    display: none;
}

.step-number {
    width: 60px;
    height: 60px;
    background: var(--accent);
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 28px;
    font-weight: 800;
    margin: 0 auto 20px;
    color: var(--primary-dark);
}

.step-title {
    font-size: 22px;
    font-weight: 700;
    margin-bottom: 15px;
    color: var(--accent-light);
}

.step-items {
    text-align: left;
    font-size: 14px;
    color: var(--text-muted);
}

.step-items li {
    margin-bottom: 8px;
    padding-left: 15px;
    position: relative;
}

.step-items li::before {
    content: '•';
    position: absolute;
    left: 0;
    color: var(--accent);
}

.decision-tree {
    background: rgba(255,255,255,0.03);
    border-radius: 16px;
    padding: 25px;
    font-family: "Consolas", "Monaco", monospace;
    font-size: 14px;
    line-height: 1.8;
}

.tree-line {
    padding-left: 20px;
    position: relative;
}

.tree-line::before {
    content: '├─ ';
    position: absolute;
    left: 0;
    color: var(--accent);
}

.tree-keyword {
    color: var(--accent-light);
    font-weight: 600;
}

.tree-result {
    color: var(--success);
}

.end-slide {
    justify-content: center;
    align-items: center;
    text-align: center;
}

.end-slide .thanks {
    font-size: 64px;
    font-weight: 800;
    margin-bottom: 30px;
    background: linear-gradient(135deg, var(--accent), var(--accent-light));
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    background-clip: text;
}

.end-slide .qa {
    font-size: 32px;
    color: var(--text-light);
    margin-bottom: 40px;
}

.end-slide .contact {
    font-size: 18px;
    color: var(--text-muted);
}

.nav-controls {
    position: fixed;
    bottom: 30px;
    left: 50%;
    transform: translateX(-50%);
    display: flex;
    align-items: center;
    gap: 20px;
    background: rgba(0,0,0,0.5);
    padding: 15px 30px;
    border-radius: 50px;
    backdrop-filter: blur(10px);
    z-index: 100;
}

.nav-btn {
    width: 40px;
    height: 40px;
    background: rgba(255,255,255,0.1);
    border: none;
    border-radius: 50%;
    color: var(--text-white);
    font-size: 18px;
    cursor: pointer;
    transition: all 0.3s ease;
    display: flex;
    align-items: center;
    justify-content: center;
}

.nav-btn:hover {
    background: var(--accent);
    color: var(--primary-dark);
}

.nav-btn:disabled {
    opacity: 0.3;
    cursor: not-allowed;
}

.progress-bar {
    width: 200px;
    height: 4px;
    background: rgba(255,255,255,0.2);
    border-radius: 2px;
    overflow: hidden;
}

.progress-fill {
    height: 100%;
    background: var(--accent);
    transition: width 0.3s ease;
}

.slide-indicator {
    font-size: 14px;
    color: var(--text-muted);
    min-width: 60px;
    text-align: center;
}

.keyboard-hint {
    position: fixed;
    bottom: 100px;
    left: 50%;
    transform: translateX(-50%);
    font-size: 12px;
    color: var(--text-muted);
    opacity: 0.5;
}

.format-grid {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 20px;
}

.format-card {
    background: rgba(255,255,255,0.05);
    border-radius: 12px;
    padding: 20px;
    text-align: center;
}

.format-type {
    font-size: 16px;
    font-weight: 600;
    color: var(--accent);
    margin-bottom: 10px;
}

.format-example {
    font-size: 24px;
    font-weight: 700;
    font-family: "Consolas", monospace;
    margin-bottom: 8px;
}

.format-desc {
    font-size: 13px;
    color: var(--text-muted);
}

.sql-block {
    background: rgba(0,0,0,0.3);
    border-radius: 12px;
    padding: 20px;
    font-family: "Consolas", "Monaco", monospace;
    font-size: 14px;
    line-height: 1.6;
    overflow-x: auto;
}

.sql-keyword {
    color: #ff79c6;
}

.sql-function {
    color: #50fa7b;
}

.sql-string {
    color: #f1fa8c;
}

.sql-comment {
    color: #6272a4;
}

.compare-container {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 40px;
    margin: 30px 0;
}

.compare-box {
    text-align: center;
    padding: 30px 50px;
    background: rgba(255,255,255,0.05);
    border-radius: 16px;
}

.compare-box.before {
    border: 2px solid var(--danger);
}

.compare-box.after {
    border: 2px solid var(--success);
}

.compare-value {
    font-size: 64px;
    font-weight: 800;
}

.compare-box.before .compare-value {
    color: var(--danger);
}

.compare-box.after .compare-value {
    color: var(--success);
}

.compare-label {
    font-size: 18px;
    color: var(--text-muted);
    margin-top: 10px;
}

.compare-arrow {
    font-size: 48px;
    color: var(--accent);
}

.pain-point-list {
    display: flex;
    flex-direction: column;
    gap: 18px;
}

.pain-item {
    display: flex;
    align-items: center;
    gap: 20px;
    background: rgba(255,255,255,0.03);
    padding: 18px 25px;
    border-radius: 12px;
    border-left: 4px solid var(--danger);
    transition: all 0.3s ease;
}

.pain-item:hover {
    background: rgba(255,255,255,0.06);
    transform: translateX(5px);
}

.pain-number {
    width: 36px;
    height: 36px;
    background: rgba(252, 129, 129, 0.2);
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    font-weight: 700;
    color: var(--danger);
    flex-shrink: 0;
}

.pain-text {
    font-size: 18px;
    color: var(--text-light);
}

.comparison-grid {
    display: grid;
    grid-template-columns: 1fr 80px 1fr;
    gap: 20px;
    align-items: center;
    margin: 30px 0;
}

.cognition-box {
    background: rgba(255,255,255,0.05);
    border-radius: 16px;
    padding: 30px;
    text-align: center;
}

.cognition-box.traditional {
    border: 2px solid var(--danger);
}

.cognition-box.correct {
    border: 2px solid var(--success);
}

.cognition-label {
    font-size: 14px;
    color: var(--text-muted);
    margin-bottom: 10px;
    text-transform: uppercase;
    letter-spacing: 2px;
}

.cognition-title {
    font-size: 28px;
    font-weight: 700;
    margin-bottom: 15px;
}

.cognition-box.traditional .cognition-title {
    color: var(--danger);
}

.cognition-box.correct .cognition-title {
    color: var(--success);
}

.cognition-desc {
    font-size: 16px;
    color: var(--text-muted);
    line-height: 1.6;
}

.cognition-arrow {
    font-size: 40px;
    color: var(--accent);
}

.golden-quote {
    background: linear-gradient(135deg, rgba(56, 178, 172, 0.2), rgba(79, 209, 197, 0.1));
    border: 2px solid var(--accent);
    border-radius: 16px;
    padding: 30px 40px;
    text-align: center;
    margin-top: 30px;
}

.golden-quote .quote-text {
    font-size: 32px;
    font-weight: 700;
    color: var(--accent-light);
    margin-bottom: 10px;
}

.golden-quote .quote-desc {
    font-size: 16px;
    color: var(--text-muted);
}

@media (max-width: 1200px) {
    .slide {
        padding: 40px 50px;
    }
    
    .data-grid {
        grid-template-columns: repeat(2, 1fr);
    }
    
    .steps-container {
        flex-direction: column;
        align-items: center;
    }
    
    .step-card::after {
        display: none;
    }
}
"""

JS = """
let currentSlide = 0;
const slides = document.querySelectorAll('.slide');
const totalSlides = slides.length;

function showSlide(index) {
    slides.forEach((slide, i) => {
        slide.classList.remove('active');
        if (i === index) {
            slide.classList.add('active');
        }
    });
    
    updateNav();
}

function nextSlide() {
    if (currentSlide < totalSlides - 1) {
        currentSlide++;
        showSlide(currentSlide);
    }
}

function prevSlide() {
    if (currentSlide > 0) {
        currentSlide--;
        showSlide(currentSlide);
    }
}

function updateNav() {
    const prevBtn = document.getElementById('prevBtn');
    const nextBtn = document.getElementById('nextBtn');
    const progressFill = document.getElementById('progressFill');
    const slideIndicator = document.getElementById('slideIndicator');
    
    prevBtn.disabled = currentSlide === 0;
    nextBtn.disabled = currentSlide === totalSlides - 1;
    
    const progress = ((currentSlide + 1) / totalSlides) * 100;
    progressFill.style.width = progress + '%';
    
    slideIndicator.textContent = (currentSlide + 1) + ' / ' + totalSlides;
}

document.addEventListener('keydown', (e) => {
    if (e.key === 'ArrowRight' || e.key === ' ' || e.key === 'PageDown') {
        e.preventDefault();
        nextSlide();
    } else if (e.key === 'ArrowLeft' || e.key === 'PageUp') {
        e.preventDefault();
        prevSlide();
    } else if (e.key === 'Home') {
        e.preventDefault();
        currentSlide = 0;
        showSlide(currentSlide);
    } else if (e.key === 'End') {
        e.preventDefault();
        currentSlide = totalSlides - 1;
        showSlide(currentSlide);
    }
});

document.getElementById('nextBtn').addEventListener('click', nextSlide);
document.getElementById('prevBtn').addEventListener('click', prevSlide);

showSlide(0);
"""

def make_placeholder_slide(num, total=TOTAL_SLIDES):
    return f"""
    <div class="slide-header">
        <div class="slide-number">{num:02d} / {total}</div>
        <h2 class="slide-title">待补充内容</h2>
    </div>
    <div class="slide-content">
        <div class="data-grid">
            <div class="data-card">
                <div class="value">-</div>
                <div class="label">待补充</div>
            </div>
        </div>
    </div>
    """

SLIDES_V2 = [
    # Slide 1: 封面
    """
    <div class="cover-slide">
        <div class="series-tag">AM TALKS - 006</div>
        <h1 class="main-title">
            从 <span class="highlight">34%</span> 到 <span class="highlight">100%</span><br>
            352条指标的命名规范治理之路
        </h1>
        <p class="subtitle">AI协同方法论实践</p>
        <p class="author">刘荣新</p>
        <p class="date">2026年6月</p>
    </div>
    """,
    
    # Slide 2: 目录
    """
    <div class="slide-header">
        <div class="slide-number">02 / 18</div>
        <h2 class="slide-title">目录</h2>
    </div>
    <div class="slide-content">
        <div class="toc-grid">
            <div class="toc-item">
                <div class="toc-number">01</div>
                <div class="toc-title">问题背景</div>
                <div class="toc-desc">5个真实痛点</div>
            </div>
            <div class="toc-item">
                <div class="toc-number">02</div>
                <div class="toc-title">AI协同五式</div>
                <div class="toc-desc">盘/定/查/当/陪</div>
            </div>
            <div class="toc-item">
                <div class="toc-number">03</div>
                <div class="toc-title">核心心法</div>
                <div class="toc-desc">3条可迁移经验</div>
            </div>
            <div class="toc-item">
                <div class="toc-number">04</div>
                <div class="toc-title">迁移行动</div>
                <div class="toc-desc">今天就能做的3件事</div>
            </div>
        </div>
    </div>
    """,
    
    # Slide 3: 痛点开场
    """
    <div class="slide-header">
        <div class="slide-number">03 / 18</div>
        <h2 class="slide-title">我们面临的问题</h2>
        <p class="slide-subtitle">5个真实痛点，你中了几个？</p>
    </div>
    <div class="slide-content">
        <div class="pain-point-list">
            <div class="pain-item">
                <div class="pain-number">1</div>
                <div class="pain-text">测试同学问我"上周Bug率多少"，我翻了3天才找到</div>
            </div>
            <div class="pain-item">
                <div class="pain-number">2</div>
                <div class="pain-text">同一指标在不同人嘴里是不同含义</div>
            </div>
            <div class="pain-item">
                <div class="pain-number">3</div>
                <div class="pain-text">想用AI分析数据，结果AI也看不懂我们的指标</div>
            </div>
            <div class="pain-item">
                <div class="pain-number">4</div>
                <div class="pain-text">47人天/年人工维护，老板问值不值</div>
            </div>
            <div class="pain-item">
                <div class="pain-number">5</div>
                <div class="pain-text">每当我们要复盘，第一个动作就是：先盘数</div>
            </div>
        </div>
        <div class="data-grid" style="margin-top: 30px;">
            <div class="data-card">
                <div class="value">352</div>
                <div class="label">条指标</div>
                <div class="desc">命名混乱、口径不一</div>
            </div>
            <div class="data-card">
                <div class="value">34%</div>
                <div class="label">违规率</div>
                <div class="desc">命名不符合规范</div>
            </div>
            <div class="data-card">
                <div class="value">47</div>
                <div class="label">人天/年</div>
                <div class="desc">人工维护成本</div>
            </div>
            <div class="data-card">
                <div class="value">0</div>
                <div class="label">AI能力</div>
                <div class="desc">自动化程度极低</div>
            </div>
        </div>
    </div>
    """,
    
    # Slide 4: 认知重构
    """
    <div class="slide-header">
        <div class="slide-number">04 / 18</div>
        <h2 class="slide-title">重新认识AI</h2>
        <p class="slide-subtitle">AI不是工具，是协作者</p>
    </div>
    <div class="slide-content">
        <div class="comparison-grid">
            <div class="cognition-box traditional">
                <div class="cognition-label">传统认知</div>
                <div class="cognition-title">AI = 工具</div>
                <div class="cognition-desc">你下达指令<br>AI执行</div>
            </div>
            <div class="cognition-arrow">→</div>
            <div class="cognition-box correct">
                <div class="cognition-label">正确认知</div>
                <div class="cognition-title">AI = 协作者</div>
                <div class="cognition-desc">你引导方向，AI探索<br>你提反例，AI修正</div>
            </div>
        </div>
        <div class="golden-quote">
            <div class="quote-text">让AI先看，别让它先答</div>
            <div class="quote-desc">先让AI理解上下文，再让它参与分析</div>
        </div>
    </div>
    """,
    
    # Slide 5: 金句1 - AI盘家底
    """
    <div class="slide-header">
        <div class="slide-number">05 / 18</div>
        <h2 class="slide-title">AI盘家底</h2>
        <p class="slide-subtitle">让AI先看看你有什么</p>
    </div>
    <div class="slide-content">
        <div class="data-grid">
            <div class="data-card">
                <div class="value">460+</div>
                <div class="label">数据库表</div>
                <div class="desc">AI扫描</div>
            </div>
            <div class="data-card">
                <div class="value">352</div>
                <div class="label">条指标</div>
                <div class="desc">AI提取</div>
            </div>
            <div class="data-card">
                <div class="value">11</div>
                <div class="label">个二级分类</div>
                <div class="desc">AI识别</div>
            </div>
            <div class="data-card">
                <div class="value">34%</div>
                <div class="label">命名违规</div>
                <div class="desc">AI发现</div>
            </div>
        </div>
        <div class="golden-quote">
            <div class="quote-text">让AI先看看你有什么</div>
            <div class="quote-desc">AI扫描全量资产，快速建立全局认知</div>
        </div>
    </div>
    """,
    
    # Slide 6: 盘点三步法
    """
    <div class="slide-header">
        <div class="slide-number">06 / 18</div>
        <h2 class="slide-title">盘点三步法</h2>
        <p class="slide-subtitle">人机协作的标准化流程</p>
    </div>
    <div class="slide-content">
        <div class="steps-container">
            <div class="step-card">
                <div class="step-number">1</div>
                <div class="step-title">问AI</div>
                <ul class="step-items">
                    <li>从哪些维度盘点？</li>
                    <li>分类标准是什么？</li>
                    <li>优先级如何排序？</li>
                </ul>
            </div>
            <div class="step-card">
                <div class="step-number">2</div>
                <div class="step-title">让AI跑</div>
                <ul class="step-items">
                    <li>自动扫描数据库</li>
                    <li>生成字段字典</li>
                    <li>输出分类建议</li>
                </ul>
            </div>
            <div class="step-card">
                <div class="step-number">3</div>
                <div class="step-title">人机校对</div>
                <ul class="step-items">
                    <li>核对分类准确性</li>
                    <li>确认边界情况</li>
                    <li>对"为何这样分类"做最终判断</li>
                </ul>
            </div>
        </div>
    </div>
    """,
    
    # Slide 7: 金句2 - AI定规矩
    """
    <div class="slide-header">
        <div class="slide-number">07 / 18</div>
        <h2 class="slide-title">AI定规矩</h2>
        <p class="slide-subtitle">规则不是AI定的，是AI和你吵出来的</p>
    </div>
    <div class="slide-content">
        <div class="case-card">
            <div class="case-header">
                <div class="case-number">🔄</div>
                <div class="case-title">人机对话循环</div>
            </div>
            <div style="display: flex; justify-content: center; gap: 30px; margin: 20px 0;">
                <div style="background: rgba(56,178,172,0.2); padding: 15px 25px; border-radius: 10px; text-align: center;">
                    <div style="font-size: 20px; font-weight: 700; color: var(--accent-light);">AI起草</div>
                </div>
                <div style="color: var(--accent); font-size: 24px;">→</div>
                <div style="background: rgba(237,137,54,0.2); padding: 15px 25px; border-radius: 10px; text-align: center;">
                    <div style="font-size: 20px; font-weight: 700; color: var(--warning);">人类给反例</div>
                </div>
                <div style="color: var(--accent); font-size: 24px;">→</div>
                <div style="background: rgba(56,178,172,0.2); padding: 15px 25px; border-radius: 10px; text-align: center;">
                    <div style="font-size: 20px; font-weight: 700; color: var(--accent-light);">AI改稿</div>
                </div>
                <div style="color: var(--accent); font-size: 24px;">→</div>
                <div style="background: rgba(72,187,120,0.2); padding: 15px 25px; border-radius: 10px; text-align: center;">
                    <div style="font-size: 20px; font-weight: 700; color: var(--success);">人类确认</div>
                </div>
            </div>
        </div>
        <div class="data-grid" style="margin-top: 30px;">
            <div class="data-card">
                <div class="value">8</div>
                <div class="label">条命名规范</div>
                <div class="desc">最终产出</div>
            </div>
            <div class="data-card">
                <div class="value">20</div>
                <div class="label">轮人机对话</div>
                <div class="desc">迭代打磨</div>
            </div>
            <div class="data-card">
                <div class="value">100%</div>
                <div class="label">覆盖</div>
                <div class="desc">所有指标类型</div>
            </div>
        </div>
        <div class="golden-quote">
            <div class="quote-text">规则不是AI定的，是AI和你吵出来的</div>
            <div class="quote-desc">通过反例驱动规则迭代，确保边界情况被覆盖</div>
        </div>
    </div>
    """,
    
    # Slide 8: 规则迭代三阶段
    """
    <div class="slide-header">
        <div class="slide-number">08 / 18</div>
        <h2 class="slide-title">规则迭代三阶段</h2>
        <p class="slide-subtitle">从初稿到普适规则的演进路径</p>
    </div>
    <div class="slide-content">
        <table class="rule-table">
            <thead>
                <tr>
                    <th style="width: 120px;">阶段</th>
                    <th style="width: 200px;">AI角色</th>
                    <th style="width: 200px;">人类角色</th>
                    <th>产出</th>
                </tr>
            </thead>
            <tbody>
                <tr>
                    <td><span class="rule-id">阶段1</span></td>
                    <td style="color: var(--accent-light);">出初稿</td>
                    <td style="color: var(--warning);">提需求</td>
                    <td>基于典型案例生成规则框架</td>
                </tr>
                <tr>
                    <td><span class="rule-id">阶段2</span></td>
                    <td style="color: var(--accent-light);">改稿</td>
                    <td style="color: var(--warning);">给反例</td>
                    <td>针对边界case持续优化规则</td>
                </tr>
                <tr>
                    <td><span class="rule-id">阶段3</span></td>
                    <td style="color: var(--accent-light);">归纳普适规则</td>
                    <td style="color: var(--warning);">最终确认</td>
                    <td>从具体案例提炼通用原则</td>
                </tr>
            </tbody>
        </table>
        <div style="margin-top: 40px; display: flex; justify-content: center; gap: 50px;">
            <div style="text-align: center;">
                <div style="font-size: 48px; font-weight: 800; color: var(--accent-light);">1</div>
                <div style="color: var(--text-muted);">个试点场景</div>
            </div>
            <div style="color: var(--accent); font-size: 40px; align-self: center;">→</div>
            <div style="text-align: center;">
                <div style="font-size: 48px; font-weight: 800; color: var(--accent-light);">8</div>
                <div style="color: var(--text-muted);">条命名规范</div>
            </div>
            <div style="color: var(--accent); font-size: 40px; align-self: center;">→</div>
            <div style="text-align: center;">
                <div style="font-size: 48px; font-weight: 800; color: var(--success);">N</div>
                <div style="color: var(--text-muted);">可复用模板</div>
            </div>
        </div>
    </div>
    """,
    
    # Slide 9-17: 占位符
    ] + [make_placeholder_slide(i) for i in range(9, TOTAL_SLIDES)] + [
    # Slide 18: 结尾
    f"""
    <div class="end-slide">
        <div class="thanks">感谢聆听</div>
        <div class="qa">Q & A</div>
        <div class="contact">
            <p>{SERIES}</p>
            <p>{AUTHOR} | {DATE}</p>
        </div>
    </div>
    """,
]

def generate_html():
    slides_html = ""
    for i, slide_content in enumerate(SLIDES_V2):
        slides_html += f'        <div class="slide">{slide_content}\n'
        slides_html += '            <div class="slide-footer">\n'
        slides_html += f'                <span>{SERIES} | {AUTHOR}</span>\n'
        slides_html += f'                <span>{TITLE} {VERSION}</span>\n'
        slides_html += '            </div>\n'
        slides_html += '        </div>\n'
    
    html = f"""<!DOCTYPE html>
<html lang="zh-CN">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>{SERIES} | {AUTHOR} | {TITLE} {VERSION}</title>
    <style>
{CSS}
    </style>
</head>
<body>
    <div class="slides-container">
{slides_html}
    </div>
    
    <div class="nav-controls">
        <button class="nav-btn" id="prevBtn" title="上一页 (←)">◀</button>
        <div class="progress-bar">
            <div class="progress-fill" id="progressFill"></div>
        </div>
        <span class="slide-indicator" id="slideIndicator">1 / {len(SLIDES_V2)}</span>
        <button class="nav-btn" id="nextBtn" title="下一页 (→)">▶</button>
    </div>
    
    <div class="keyboard-hint">使用 ← → 键或点击按钮翻页</div>
    
    <script>
{JS}
    </script>
</body>
</html>"""
    
    return html

def main():
    os.makedirs(OUTPUT_DIR, exist_ok=True)
    
    html_content = generate_html()
    
    try:
        with open(OUTPUT_FILE, 'w', encoding='utf-8') as f:
            f.write(html_content)
        print(f"✅ HTML文件已生成: {OUTPUT_FILE}")
        print(f"📄 共 {len(SLIDES_V2)} 张幻灯片")
        print(f"📦 文件大小: {len(html_content)} 字节")
    except IOError as e:
        print(f"❌ 文件写入失败: {e}")
        raise

if __name__ == "__main__":
    main()