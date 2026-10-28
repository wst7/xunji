"""chunk_text 边界与行为测试。"""
from __future__ import annotations

from app.ai.chunking import chunk_text, split_sentences

LONG_PARAGRAPH = "任务调度是操作系统的核心功能之一，调度器决定哪个进程获得 CPU 时间。" * 30
MULTI_PARAGRAPH = "\n\n".join(
    f"第{i}段：公平调度与优先级调度各有取舍，时间片轮转是常见的公平调度算法。" * 3
    for i in range(8)
)


def test_empty_and_whitespace_return_empty():
    assert chunk_text("") == []
    assert chunk_text("   \n\n\t\n  ") == []
    assert chunk_text(None) == []


def test_short_text_single_chunk_unchanged():
    text = "只有一句话的短文。"
    assert chunk_text(text) == [text]


def test_paragraphs_kept_intact_and_ordered():
    chunks = chunk_text(MULTI_PARAGRAPH, max_chars=300, overlap=50)
    assert len(chunks) > 1
    # 每个块都是原文的连续片段（段落优先，不拆句）
    for chunk in chunks:
        assert chunk in MULTI_PARAGRAPH
    # 顺序保留：第0段在第7段之前
    assert chunks[0].startswith("第0段")
    assert "第7段" in chunks[-1]


def test_overlap_between_adjacent_chunks():
    chunks = chunk_text(MULTI_PARAGRAPH, max_chars=300, overlap=60)
    shared = chunks[1][:30]
    assert shared and shared in chunks[0]


def test_no_chunk_exceeds_max_chars_on_long_paragraph():
    chunks = chunk_text(LONG_PARAGRAPH, max_chars=200, overlap=30)
    assert len(chunks) > 3
    assert all(len(chunk) <= 200 for chunk in chunks)
    # 句子不被拆散：每个块都以句末标点结束（重叠拼接除外）
    for chunk in chunks:
        assert chunk[-1] in "。！？.!?" or chunk is chunks[-1]
    # 覆盖完整：开头与结尾都在
    assert chunks[0].startswith("任务调度")
    assert chunks[-1].endswith("。")


def test_zero_max_chars_returns_empty():
    assert chunk_text("内容", max_chars=0) == []


def test_deterministic():
    first = chunk_text(MULTI_PARAGRAPH, max_chars=300, overlap=50)
    second = chunk_text(MULTI_PARAGRAPH, max_chars=300, overlap=50)
    assert first == second


def test_split_sentences_mixed_zh_en():
    text = "世界你好。这是第二句！第三句?Done. Next one;还有分号；尾"
    assert split_sentences(text) == [
        "世界你好。", "这是第二句！", "第三句?", "Done.", "Next one;", "还有分号；", "尾",
    ]


def test_split_sentences_does_not_break_decimals():
    assert split_sentences("圆周率是3.14159没错。继续。") == ["圆周率是3.14159没错。", "继续。"]
