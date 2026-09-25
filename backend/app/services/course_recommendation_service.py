"""
app/services/course_recommendation_service.py — Curated learning resource catalog.

Architecture:
  CourseRecommendationService
    ↓
  _get_resources_for_competency(competency_id, missing_concepts, current_level, price_type)
    ↓
  Curated catalog (MVP) — swappable with live search provider later

Each resource object:
  id, title, provider, skill, resource_type, difficulty,
  estimated_duration, price_type ("free" | "paid"), url, reason

IMPORTANT: No fabricated prices, ratings, or enrollment data.
All resources labeled as curated recommendations.
"""
import logging
from typing import Optional

logger = logging.getLogger(__name__)

# ── Curated resource catalog (MVP) ──────────────────────────────────────────────
# These are real, publicly available resources. No fabricated prices or ratings.
CURATED_CATALOG: list[dict] = [
    # ── Data Structures & Algorithms ──
    {
        "id": "dsa-mit-ocw",
        "title": "Introduction to Algorithms (MIT OpenCourseWare)",
        "provider": "MIT OCW",
        "skill": "algorithms",
        "competency_ids": ["algorithms", "data_structures", "problem_solving"],
        "resource_type": "course",
        "difficulty": "intermediate",
        "estimated_duration": "40h",
        "price_type": "free",
        "url": "https://ocw.mit.edu/courses/6-006-introduction-to-algorithms-spring-2020/",
        "reason": "Comprehensive coverage of algorithms and data structures by MIT faculty.",
    },
    {
        "id": "dsa-neetcode",
        "title": "NeetCode 150 — LeetCode Patterns",
        "provider": "NeetCode",
        "skill": "algorithms",
        "competency_ids": ["algorithms", "data_structures", "debugging"],
        "resource_type": "practice",
        "difficulty": "intermediate",
        "estimated_duration": "20h",
        "price_type": "free",
        "url": "https://neetcode.io/practice",
        "reason": "Structured problem-solving patterns used in technical interviews.",
    },
    # ── System Design ──
    {
        "id": "system-design-primer",
        "title": "System Design Primer",
        "provider": "GitHub (donnemartin)",
        "skill": "system_design",
        "competency_ids": ["system_design", "scalability", "architecture"],
        "resource_type": "guide",
        "difficulty": "intermediate",
        "estimated_duration": "15h",
        "price_type": "free",
        "url": "https://github.com/donnemartin/system-design-primer",
        "reason": "Most comprehensive free system design reference used by engineers at FAANG.",
    },
    {
        "id": "system-design-alex-xu",
        "title": "System Design Interview (Alex Xu)",
        "provider": "ByteByteGo",
        "skill": "system_design",
        "competency_ids": ["system_design", "scalability", "architecture"],
        "resource_type": "book",
        "difficulty": "intermediate",
        "estimated_duration": "10h",
        "price_type": "paid",
        "url": "https://www.amazon.com/System-Design-Interview-insiders-Second/dp/B08CMF2CQF",
        "reason": "Industry standard book for system design interview preparation.",
    },
    # ── Debugging & Troubleshooting ──
    {
        "id": "debugging-chrome-devtools",
        "title": "Chrome DevTools — JavaScript Debugging",
        "provider": "Google",
        "skill": "debugging",
        "competency_ids": ["debugging", "javascript", "web_development"],
        "resource_type": "tutorial",
        "difficulty": "beginner",
        "estimated_duration": "3h",
        "price_type": "free",
        "url": "https://developer.chrome.com/docs/devtools/javascript/",
        "reason": "Official guide to debugging JavaScript in the browser.",
    },
    {
        "id": "debugging-patterns",
        "title": "The Art of Debugging (No Starch Press)",
        "provider": "No Starch Press",
        "skill": "debugging",
        "competency_ids": ["debugging", "problem_solving"],
        "resource_type": "book",
        "difficulty": "intermediate",
        "estimated_duration": "8h",
        "price_type": "paid",
        "url": "https://nostarch.com/debugging",
        "reason": "Systematic debugging methodology covering isolation, reproduction, and root cause analysis.",
    },
    # ── Python / Backend ──
    {
        "id": "python-fluent",
        "title": "Fluent Python (O'Reilly)",
        "provider": "O'Reilly",
        "skill": "python",
        "competency_ids": ["python", "backend_development", "software_engineering"],
        "resource_type": "book",
        "difficulty": "intermediate",
        "estimated_duration": "25h",
        "price_type": "paid",
        "url": "https://www.oreilly.com/library/view/fluent-python-2nd/9781492056348/",
        "reason": "Deep coverage of Python internals: GIL, decorators, memory management.",
    },
    {
        "id": "python-docs",
        "title": "Python Official Documentation",
        "provider": "Python.org",
        "skill": "python",
        "competency_ids": ["python", "backend_development"],
        "resource_type": "documentation",
        "difficulty": "beginner",
        "estimated_duration": "10h",
        "price_type": "free",
        "url": "https://docs.python.org/3/",
        "reason": "Official reference for Python language features, stdlib, and best practices.",
    },
    # ── Databases ──
    {
        "id": "db-cmu-intro",
        "title": "Database Systems (CMU 15-445)",
        "provider": "Carnegie Mellon University",
        "skill": "databases",
        "competency_ids": ["databases", "sql", "indexing", "transactions"],
        "resource_type": "course",
        "difficulty": "advanced",
        "estimated_duration": "50h",
        "price_type": "free",
        "url": "https://15445.courses.cs.cmu.edu/",
        "reason": "World-class database course covering indexing, transactions, and query optimization.",
    },
    {
        "id": "db-use-the-index",
        "title": "Use The Index, Luke!",
        "provider": "Markus Winand",
        "skill": "databases",
        "competency_ids": ["databases", "sql", "indexing"],
        "resource_type": "guide",
        "difficulty": "intermediate",
        "estimated_duration": "6h",
        "price_type": "free",
        "url": "https://use-the-index-luke.com/",
        "reason": "Practical guide to database indexing — B-trees, composite indexes, explain analyze.",
    },
    # ── Concurrency ──
    {
        "id": "concurrency-python-asyncio",
        "title": "Python asyncio — Official Docs",
        "provider": "Python.org",
        "skill": "concurrency",
        "competency_ids": ["concurrency", "python", "backend_development"],
        "resource_type": "documentation",
        "difficulty": "intermediate",
        "estimated_duration": "4h",
        "price_type": "free",
        "url": "https://docs.python.org/3/library/asyncio.html",
        "reason": "Official async/await and event loop documentation for Python concurrency.",
    },
    {
        "id": "concurrency-java-in-practice",
        "title": "Java Concurrency in Practice",
        "provider": "Addison-Wesley",
        "skill": "concurrency",
        "competency_ids": ["concurrency", "java", "multithreading"],
        "resource_type": "book",
        "difficulty": "advanced",
        "estimated_duration": "20h",
        "price_type": "paid",
        "url": "https://www.amazon.com/Java-Concurrency-Practice-Brian-Goetz/dp/0321349601",
        "reason": "Definitive guide to concurrency patterns: locks, race conditions, thread safety.",
    },
    # ── API Design ──
    {
        "id": "api-design-google",
        "title": "Google API Design Guide",
        "provider": "Google",
        "skill": "api_design",
        "competency_ids": ["api_design", "rest", "software_engineering"],
        "resource_type": "guide",
        "difficulty": "intermediate",
        "estimated_duration": "3h",
        "price_type": "free",
        "url": "https://cloud.google.com/apis/design",
        "reason": "Production-grade REST API design principles used at Google scale.",
    },
    {
        "id": "api-design-rest-in-practice",
        "title": "REST API Design Rulebook (O'Reilly)",
        "provider": "O'Reilly",
        "skill": "api_design",
        "competency_ids": ["api_design", "rest", "web_development"],
        "resource_type": "book",
        "difficulty": "beginner",
        "estimated_duration": "8h",
        "price_type": "paid",
        "url": "https://www.oreilly.com/library/view/rest-api-design/9781449317904/",
        "reason": "Practical REST API design patterns and conventions.",
    },
    # ── Software Engineering / General ──
    {
        "id": "clean-code-martin",
        "title": "Clean Code (Robert C. Martin)",
        "provider": "Prentice Hall",
        "skill": "software_engineering",
        "competency_ids": ["software_engineering", "code_quality", "refactoring"],
        "resource_type": "book",
        "difficulty": "intermediate",
        "estimated_duration": "12h",
        "price_type": "paid",
        "url": "https://www.amazon.com/Clean-Code-Handbook-Software-Craftsmanship/dp/0132350882",
        "reason": "Foundational software engineering principles: naming, functions, testing.",
    },
    {
        "id": "refactoring-fowler",
        "title": "Refactoring: Improving the Design of Existing Code",
        "provider": "Addison-Wesley",
        "skill": "software_engineering",
        "competency_ids": ["refactoring", "code_quality", "software_engineering"],
        "resource_type": "book",
        "difficulty": "intermediate",
        "estimated_duration": "15h",
        "price_type": "paid",
        "url": "https://www.amazon.com/Refactoring-Improving-Existing-Addison-Wesley-Signature/dp/0134757599",
        "reason": "Systematic catalog of refactoring techniques with before/after examples.",
    },
    {
        "id": "cs50-harvard",
        "title": "CS50x — Introduction to Computer Science (Harvard)",
        "provider": "Harvard / edX",
        "skill": "computer_science",
        "competency_ids": ["algorithms", "data_structures", "software_engineering", "debugging"],
        "resource_type": "course",
        "difficulty": "beginner",
        "estimated_duration": "100h",
        "price_type": "free",
        "url": "https://cs50.harvard.edu/x/",
        "reason": "Best free computer science fundamentals course — covers C, Python, web, SQL.",
    },
]


class CourseRecommendationService:
    """
    Returns curated learning resources for a given competency gap.

    MVP: Uses a static curated catalog.
    Phase 2: Can be backed by a live course search API (e.g. Udemy, Coursera, Pluralsight).
    """

    def get_recommendations(
        self,
        competency_id: str,
        missing_concepts: Optional[list[str]] = None,
        current_level: int = 0,
        target_level: int = 70,
        max_per_type: int = 3,
    ) -> dict[str, list[dict]]:
        """
        Returns {"free": [...], "paid": [...]} resource lists for a competency.
        Ordered by relevance to the competency_id.
        """
        # Normalize competency_id for matching
        comp_lower = competency_id.lower().replace(" ", "_").replace("-", "_")

        # Find matching resources
        matched = [
            r for r in CURATED_CATALOG
            if comp_lower in [c.lower().replace(" ", "_") for c in r["competency_ids"]]
            or comp_lower in r["skill"].lower()
        ]

        # Fallback: broader match by keywords in title/skill
        if not matched:
            keywords = comp_lower.replace("_", " ").split()
            matched = [
                r for r in CURATED_CATALOG
                if any(kw in r["skill"] or kw in r["title"].lower() for kw in keywords)
            ]

        # Last fallback: general computer science resources
        if not matched:
            matched = [r for r in CURATED_CATALOG if "software_engineering" in r["competency_ids"]][:3]

        # Add reason context if missing_concepts provided
        if missing_concepts:
            concepts_str = ", ".join(missing_concepts[:3])
            for r in matched:
                r = dict(r)  # don't mutate catalog
                r["reason"] = f"{r['reason']} Addresses gaps in: {concepts_str}."

        free = [r for r in matched if r["price_type"] == "free"][:max_per_type]
        paid = [r for r in matched if r["price_type"] == "paid"][:max_per_type]

        return {"free": free, "paid": paid, "source": "curated"}

    def get_recommendations_for_gaps(
        self,
        gaps: list[dict],
        max_per_competency: int = 2,
    ) -> list[dict]:
        """
        Returns a flat list of recommendations for multiple competency gaps.
        Prioritizes critical/high priority gaps.
        """
        all_resources = []
        seen_ids: set[str] = set()

        for gap in gaps:
            if gap.get("gap", 0) >= 0:  # skip if no gap
                continue
            priority = gap.get("priority", "medium")
            competency_id = gap.get("competency_id", "")
            missing = gap.get("missing_concepts", [])

            recs = self.get_recommendations(
                competency_id=competency_id,
                missing_concepts=missing,
                current_level=gap.get("current_score", 0),
                target_level=gap.get("target_score", 70),
                max_per_type=max_per_competency,
            )

            for resource_list in [recs["free"], recs["paid"]]:
                for r in resource_list:
                    if r["id"] not in seen_ids:
                        seen_ids.add(r["id"])
                        all_resources.append({**r, "priority": priority, "for_competency": competency_id})

        return all_resources


# Global singleton
course_recommendation_service = CourseRecommendationService()
