"""解析器注册表：wechat > github > video > generic。"""
from __future__ import annotations

from app.parsers.base import Parser
from app.parsers.generic import GenericParser
from app.parsers.github import GithubParser
from app.parsers.video import VideoParser
from app.parsers.wechat import WechatParser

_PARSER_CLASSES = (WechatParser, GithubParser, VideoParser, GenericParser)


def get_parser(url: str, source_type: str) -> Parser:
    """按优先级返回第一个匹配的解析器；generic 永远兜底。"""
    for parser_class in _PARSER_CLASSES:
        parser = parser_class()
        if parser.matches(url, source_type):
            return parser
    return GenericParser()
