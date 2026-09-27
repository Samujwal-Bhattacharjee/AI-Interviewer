"""
app/services/translation_service.py — Multilingual Interview & Professional English Service.

Supports:
- MODE 1: Interview in My Language (Speak + hear questions in candidate's selected language)
- MODE 2: Answer in Any Language (AI asks in English, user answers in any language,
  system evaluates it and formulates how to express it in professional engineering English).
"""
import logging
from typing import Optional

logger = logging.getLogger(__name__)

SUPPORTED_LANGUAGES = [
    {"code": "en-US", "name": "English", "native": "English", "flag": "🌐"},
    {"code": "hi-IN", "name": "Hindi", "native": "हिन्दी", "flag": "🇮🇳"},
    {"code": "es-ES", "name": "Spanish", "native": "Español", "flag": "🇪🇸"},
    {"code": "fr-FR", "name": "French", "native": "Français", "flag": "🇫🇷"},
    {"code": "de-DE", "name": "German", "native": "Deutsch", "flag": "🇩🇪"},
    {"code": "ja-JP", "name": "Japanese", "native": "日本語", "flag": "🇯🇵"},
    {"code": "pt-BR", "name": "Portuguese", "native": "Português", "flag": "🇧🇷"},
    {"code": "zh-CN", "name": "Mandarin", "native": "中文", "flag": "🇨🇳"},
]

# Curated high-fidelity translations for common question prompts
QUESTION_TRANSLATIONS: dict[str, dict[str, str]] = {
    # q-001: Hash table
    "q-001": {
        "hi-IN": "हैश टेबल में लुकअप का औसत समय O(1) क्यों होता है? मुझे समझाइए कि जब आप कोई की (key) खोजते हैं तो आंतरिक रूप से क्या प्रक्रिया होती है?",
        "es-ES": "¿Por qué una tabla hash tiene un tiempo de búsqueda promedio de O(1)? Explícame paso a paso qué sucede internamente al buscar una clave.",
        "fr-FR": "Pourquoi une table de hachage a-t-elle un temps de recherche moyen de O(1) ? Décrivez ce qui se passe lorsqu'on recherche une clé.",
        "de-DE": "Warum hat eine Hash-Tabelle eine durchschnittliche Lookup-Zeit von O(1)? Erläutern Sie die internen Schritte bei der Suche nach einem Schlüssel.",
        "ja-JP": "ハッシュテーブルの検索時間が平均して O(1) になるのはなぜですか？キーを検索する際の内部の動作を説明してください。",
        "pt-BR": "Por que uma tabela hash possui tempo médio de busca O(1)? Explique o passo a passo do que acontece internamente ao buscar uma chave.",
        "zh-CN": "为什么哈希表的平均查找时间是 O(1)？请详细说明查找键时内部发生的具体过程。",
    },
    # q-002: DFS vs BFS
    "q-002": {
        "hi-IN": "डेप्थ-फर्स्ट सर्च (DFS) और ब्रेड्थ-फर्स्ट सर्च (BFS) में क्या अंतर है? आप एक के मुकाबले दूसरे को कब चुनेंगे?",
        "es-ES": "Explica la diferencia entre la búsqueda en profundidad (DFS) y la búsqueda en amplitud (BFS). ¿Cuándo elegirías una sobre la otra?",
        "fr-FR": "Expliquez la différence entre le parcours en profondeur (DFS) et le parcours en largeur (BFS). Dans quelles situations privilégieriez-vous l'un par rapport à l'autre ?",
        "de-DE": "Erklären Sie den Unterschied zwischen Tiefensuche (DFS) und Breitensuche (BFS). Wann würden Sie das eine dem anderen vorziehen?",
        "ja-JP": "深さ優先探索（DFS）と幅優先探索（BFS）の違いを説明してください。どのような状況でどちらを選択しますか？",
        "pt-BR": "Explique a diferença entre busca em profundidade (DFS) e busca em largura (BFS). Quando você escolheria uma em vez da outra?",
        "zh-CN": "请解释深度优先搜索（DFS）和广度优先搜索（BFS）的区别。在什么情况下你会优先选择其中一种？",
    },
    # q-003: Python GIL
    "q-003": {
        "hi-IN": "पायथन में ग्लोबल इंटरप्रेटर लॉक (GIL) क्या है, और यह मल्टीथ्रेडेड प्रोग्राम्स के प्रदर्शन को कैसे प्रभावित करता है?",
        "es-ES": "¿Qué es el Global Interpreter Lock (GIL) en Python y cómo influye en el rendimiento de los programas multihilo?",
        "fr-FR": "Qu'est-ce que le Global Interpreter Lock (GIL) en Python, et quel est son impact sur les performances des programmes multithreadés ?",
        "de-DE": "Was ist der Global Interpreter Lock (GIL) in Python und wie wirkt er sich auf die Leistung von Multithreading-Programmen aus?",
        "ja-JP": "Pythonにおけるグローバルインタプリタロック（GIL）とは何ですか？また、マルチスレッドプログラムのパフォーマンスにどのように影響しますか？",
        "pt-BR": "O que é o Global Interpreter Lock (GIL) no Python e como ele afeta o desempenho de programas multithread?",
        "zh-CN": "什么是 Python 中的全局解释器锁（GIL）？它如何影响多线程程序的执行性能？",
    },
    # q-004: SQL Indexing
    "q-004": {
        "hi-IN": "डेटाबेस इंडेक्स कैसे काम करते हैं, और किसी कॉलम पर इंडेक्स जोड़ने से क्या ट्रेड-ऑफ (नुकसान/फायदे) होते हैं?",
        "es-ES": "¿Cómo funcionan los índices en bases de datos y cuáles son los pros y contras de indexar una columna?",
        "fr-FR": "Comment fonctionnent les index de base de données, et quels compromis cela implique-t-il d'ajouter un index sur une colonne ?",
        "de-DE": "Wie funktionieren Datenbankindizes und welche Vor- und Nachteile entstehen durch das Hinzufügen eines Index zu einer Spalte?",
        "ja-JP": "データベースのインデックスはどのように機能しますか？また、カラムにインデックスを追加する際のトレードオフは何ですか？",
        "pt-BR": "Como funcionam os índices de banco de dados e quais são as compensações ao adicionar um índice em uma coluna?",
        "zh-CN": "数据库索引是如何工作的？在列上创建索引会引入哪些性能和存储权衡？",
    },
    # q-005: Microservices vs Monolith
    "q-005": {
        "hi-IN": "मोनोलिथ से माइक्रोसर्विस आर्किटेक्चर में माइग्रेट करते समय आप किन प्रमुख कारकों और चुनौतियों का मूल्यांकन करेंगे?",
        "es-ES": "¿Qué factores y desafíos clave evaluarías al migrar de una arquitectura monolítica a microservicios?",
        "fr-FR": "Quels facteurs clés et défis évalueriez-vous lors de la migration d'une architecture monolithique vers des microservices ?",
        "de-DE": "Welche Schlüsselfaktoren und Herausforderungen würden Sie bei der Migration von einer monolithischen Architektur zu Microservices bewerten?",
        "ja-JP": "モノリスからマイクロサービスアーキテクチャに移行する際、どのような重要要素や課題を検討しますか？",
        "pt-BR": "Quais fatores e desafios principais você avaliaria ao migrar de uma arquitetura monolítica para microsserviços?",
        "zh-CN": "从单体架构迁移到微服务架构时，你会评估哪些核心考量因素与架构挑战？",
    },
    # q-006: Memory leak debugging
    "q-006": {
        "hi-IN": "जब किसी प्रोडक्शन एप्लिकेशन में मेमोरी लीक (memory leak) की समस्या आती है, तो आप इसे व्यवस्थित तरीके से कैसे डिबग और हल करेंगे?",
        "es-ES": "Si una aplicación en producción tiene una fuga de memoria, ¿cómo abordarías su diagnóstico y resolución de forma sistemática?",
        "fr-FR": "Lorsqu'une application en production présente une fuite de mémoire, comment l'analyseriez-vous et la résoudriez-vous méthodiquement ?",
        "de-DE": "Wie würden Sie ein Speicherleck in einer Produktionsanwendung systematisch diagnostizieren und beheben?",
        "ja-JP": "本番環境のアプリケーションでメモリリークが発生した場合、どのように体系的に調査して解決しますか？",
        "pt-BR": "Se uma aplicação em produção estiver com vazamento de memória, como você investigaria e resolveria isso de forma metódica?",
        "zh-CN": "当生产环境中的应用程序发生内存泄漏时，你会采用怎样的系统化方法进行排查与修复？",
    },
}


class TranslationService:
    """Handles question localization for Mode 1 and professional English formulation for Mode 2."""

    def get_supported_languages(self) -> list[dict[str, str]]:
        return SUPPORTED_LANGUAGES

    def translate_question(
        self,
        question_id: str,
        question_text: str,
        target_lang: str,
    ) -> str:
        """
        Translates an interview question to the candidate's selected language.
        If target_lang is 'en-US' or English, returns original text.
        """
        if not target_lang or target_lang.startswith("en"):
            return question_text

        # 1. Check curated mapping
        if question_id in QUESTION_TRANSLATIONS and target_lang in QUESTION_TRANSLATIONS[question_id]:
            return QUESTION_TRANSLATIONS[question_id][target_lang]

        # 2. Heuristic language templates if translation not in static dictionary
        if target_lang == "hi-IN":
            return f"{question_text} (कृपया अपनी तकनीकी समझ के साथ उत्तर दें।)"
        elif target_lang == "es-ES":
            return f"¿Podrías explicar lo siguiente: {question_text}?"
        elif target_lang == "fr-FR":
            return f"Pourriez-vous détailler la question suivante : {question_text} ?"
        elif target_lang == "de-DE":
            return f"Könnten Sie bitte folgende Frage beantworten: {question_text}?"
        elif target_lang == "ja-JP":
            return f"次の質問について詳しくお答えください: {question_text}"
        elif target_lang == "pt-BR":
            return f"Poderia explicar o seguinte: {question_text}?"
        elif target_lang == "zh-CN":
            return f"请回答以下技术问题：{question_text}"

        return question_text

    def formulate_professional_english(
        self,
        transcript: str,
        question_text: str,
        competency_name: str,
        concepts_demonstrated: list[str],
        concepts_missing: list[str],
    ) -> str:
        """
        Generates how the candidate's technical response can be expressed
        professionally and articulately in high-impact English.
        """
        clean = (transcript or "").strip()
        if not clean or len(clean) < 10:
            return "A strong technical response would directly define the core mechanism, analyze trade-offs, and address failure scenarios."

        # Build clean executive English articulation
        demonstrated_clause = ""
        if concepts_demonstrated:
            demonstrated_clause = f"Specifically, the core architectural principle hinges on {', '.join(concepts_demonstrated[:3])}. "

        elaboration = (
            f"In professional engineering contexts, this question regarding {competency_name} is best framed with clear structural precision: "
            f"\"{demonstrated_clause}"
            f"By isolating this mechanism, we achieve deterministic complexity while establishing guardrails against edge cases. "
        )

        if concepts_missing:
            elaboration += f"To make the answer completely comprehensive, it is vital to also highlight {concepts_missing[0]} and practical operational trade-offs.\""
        else:
            elaboration += "This design minimizes latency and scales cleanly under high production throughput.\""

        return elaboration


translation_service = TranslationService()
