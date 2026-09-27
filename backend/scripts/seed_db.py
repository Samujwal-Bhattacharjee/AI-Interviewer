"""
backend/scripts/seed_db.py — Seeds the database with initial data.

Run: python scripts/seed_db.py

Seeds:
  - All competencies
  - All roles (matching mock/roles.ts)
  - All questions (matching mock/questions.ts)
  - Default user
"""
import asyncio
import sys
import os

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from sqlalchemy import text
from app.database import AsyncSessionLocal, engine, Base
from app.models import *  # noqa: F401, F403 — register all models


# ── Seed data (mirrors mock/roles.ts and mock/questions.ts) ─────────────────

COMPETENCIES = [
    {"id": "comp-dsa", "name": "DSA", "category": "Computer Science",
     "description": "Data structures, algorithms, and complexity analysis",
     "subskills": ["Arrays", "Hash Maps", "Trees", "Graphs", "Sorting", "Complexity Analysis"]},
    {"id": "comp-python", "name": "Python", "category": "Programming",
     "description": "Python programming, idioms, standard library, and ecosystem",
     "subskills": ["Syntax", "OOP", "Functional", "Standard Library", "Error Handling"]},
    {"id": "comp-sql", "name": "SQL", "category": "Data",
     "description": "Relational database querying, schema design, and optimization",
     "subskills": ["SELECT", "JOINs", "Aggregation", "Indexing", "Transactions"]},
    {"id": "comp-debugging", "name": "Debugging", "category": "Engineering Practice",
     "description": "Systematic diagnosis and resolution of software defects",
     "subskills": ["Execution Tracing", "Edge Cases", "Error Isolation", "Log Analysis", "Concurrency Issues"]},
    {"id": "comp-system-design", "name": "System Design", "category": "Architecture",
     "description": "Designing scalable, maintainable software systems",
     "subskills": ["APIs", "Databases", "Caching", "Load Balancing", "Microservices"]},
    {"id": "comp-ux-research", "name": "UX Research", "category": "Design",
     "description": "User research methodologies and synthesis",
     "subskills": ["Interviews", "Usability Testing", "Surveys", "Affinity Mapping"]},
    {"id": "comp-visual-design", "name": "Visual Design", "category": "Design",
     "description": "Typography, color, composition, and visual hierarchy",
     "subskills": ["Typography", "Color Theory", "Grid Systems", "Iconography"]},
    {"id": "comp-interaction-design", "name": "Interaction Design", "category": "Design",
     "description": "Designing user flows, micro-interactions, and prototypes",
     "subskills": ["User Flows", "Micro-interactions", "Prototyping", "Motion Design"]},
    {"id": "comp-design-systems", "name": "Design Systems", "category": "Design",
     "description": "Building and maintaining scalable design systems",
     "subskills": ["Component Libraries", "Tokens", "Documentation", "Collaboration"]},
]

ROLES = [
    {
        "id": "role-001",
        "title": "Junior Software Engineer",
        "level": "junior",
        "description": "A generalist software engineer role focused on implementing features, fixing bugs, and growing across the full stack.",
        "technologies": ["Python", "JavaScript", "SQL", "Git", "REST APIs"],
        "responsibilities": [
            "Implement features from design specifications",
            "Debug and resolve production issues",
            "Write unit and integration tests",
            "Participate in code reviews",
            "Collaborate with senior engineers",
        ],
        "requirements": [
            {"competency_id": "comp-dsa", "target_level": 72, "importance": "critical"},
            {"competency_id": "comp-python", "target_level": 74, "importance": "high"},
            {"competency_id": "comp-sql", "target_level": 68, "importance": "high"},
            {"competency_id": "comp-debugging", "target_level": 74, "importance": "critical"},
            {"competency_id": "comp-system-design", "target_level": 55, "importance": "medium"},
        ],
    },
    {
        "id": "role-002",
        "title": "Data Engineer",
        "level": "intermediate",
        "description": "Builds and maintains data pipelines, warehouses, and infrastructure for analytics.",
        "technologies": ["Python", "SQL", "Spark", "Airflow", "dbt", "Kafka"],
        "responsibilities": [
            "Build and maintain ETL pipelines",
            "Design data warehouse schemas",
            "Optimize query performance",
            "Monitor data quality",
            "Collaborate with data scientists",
        ],
        "requirements": [
            {"competency_id": "comp-sql", "target_level": 85, "importance": "critical"},
            {"competency_id": "comp-python", "target_level": 80, "importance": "critical"},
            {"competency_id": "comp-dsa", "target_level": 65, "importance": "medium"},
            {"competency_id": "comp-debugging", "target_level": 70, "importance": "high"},
            {"competency_id": "comp-system-design", "target_level": 75, "importance": "high"},
        ],
    },
    {
        "id": "role-003",
        "title": "Product Designer",
        "level": "junior",
        "description": "Creates user-centered designs for digital products through research, ideation, and prototyping.",
        "technologies": ["Figma", "Prototyping", "User Research", "Design Systems"],
        "responsibilities": [
            "Conduct user research and usability testing",
            "Create wireframes, prototypes, and high-fidelity designs",
            "Maintain and extend design systems",
            "Collaborate with engineers and product managers",
        ],
        "requirements": [
            {"competency_id": "comp-ux-research", "target_level": 70, "importance": "critical"},
            {"competency_id": "comp-visual-design", "target_level": 75, "importance": "critical"},
            {"competency_id": "comp-interaction-design", "target_level": 72, "importance": "high"},
            {"competency_id": "comp-design-systems", "target_level": 65, "importance": "high"},
        ],
    },
    {
        "id": "role-004",
        "title": "Robotics Software Engineer",
        "level": "intermediate",
        "description": "Develops software for robotic systems including perception, planning, and control.",
        "technologies": ["C++", "Python", "ROS2", "SLAM", "Computer Vision"],
        "responsibilities": [
            "Implement perception and localization algorithms",
            "Develop motion planning systems",
            "Integrate hardware drivers and sensor interfaces",
            "Write real-time control loops",
        ],
        "requirements": [
            {"competency_id": "comp-dsa", "target_level": 82, "importance": "critical"},
            {"competency_id": "comp-python", "target_level": 78, "importance": "high"},
            {"competency_id": "comp-debugging", "target_level": 80, "importance": "critical"},
            {"competency_id": "comp-system-design", "target_level": 75, "importance": "high"},
        ],
    },
    {
        "id": "role-sw-engineer",
        "title": "Software Engineer",
        "level": "junior",
        "description": "Software engineering across algorithms, systems, debugging, and data layers.",
        "technologies": ["Python", "Java", "SQL", "REST APIs", "Git"],
        "responsibilities": ["Build core services", "Debug anomalies", "Test components"],
        "requirements": [
            {"competency_id": "comp-dsa", "target_level": 72, "importance": "critical"},
            {"competency_id": "comp-python", "target_level": 78, "importance": "high"},
            {"competency_id": "comp-debugging", "target_level": 70, "importance": "critical"},
            {"competency_id": "comp-sql", "target_level": 65, "importance": "high"},
            {"competency_id": "comp-system-design", "target_level": 68, "importance": "medium"},
        ],
    },
    {
        "id": "role-ml-engineer",
        "title": "ML Engineer",
        "level": "intermediate",
        "description": "Designs and deploys machine learning models and data pipelines.",
        "technologies": ["Python", "PyTorch", "Scikit-learn", "MLflow", "Docker"],
        "responsibilities": ["Train models", "Optimize inferences", "Monitor models in production"],
        "requirements": [
            {"competency_id": "comp-python", "target_level": 82, "importance": "critical"},
            {"competency_id": "comp-dsa", "target_level": 75, "importance": "critical"},
            {"competency_id": "comp-system-design", "target_level": 72, "importance": "high"},
            {"competency_id": "comp-debugging", "target_level": 68, "importance": "high"},
        ],
    },
    {
        "id": "role-financial-analyst",
        "title": "Financial Analyst",
        "level": "junior",
        "description": "Performs financial modeling, quantitative data analysis, and reporting.",
        "technologies": ["Excel", "Python", "SQL", "Bloomberg", "Tableau"],
        "responsibilities": ["Financial modeling", "SQL queries", "Market analytics"],
        "requirements": [
            {"competency_id": "comp-sql", "target_level": 70, "importance": "critical"},
            {"competency_id": "comp-python", "target_level": 60, "importance": "high"},
            {"competency_id": "comp-dsa", "target_level": 55, "importance": "medium"},
        ],
    },
    {
        "id": "role-ux-designer",
        "title": "UX Designer",
        "level": "junior",
        "description": "Designs user experiences, prototypes, and tests usability.",
        "technologies": ["Figma", "Miro", "UserZoom", "Maze", "HTML/CSS"],
        "responsibilities": ["User testing", "Wireframing", "Interaction design"],
        "requirements": [
            {"competency_id": "comp-debugging", "target_level": 62, "importance": "medium"},
            {"competency_id": "comp-system-design", "target_level": 60, "importance": "high"},
            {"competency_id": "comp-python", "target_level": 48, "importance": "low"},
        ],
    },
    {
        "id": "role-product-manager",
        "title": "Product Manager",
        "level": "intermediate",
        "description": "Guides product vision, roadmap, metrics, and technical requirements.",
        "technologies": ["JIRA", "SQL", "Figma", "Analytics", "Roadmapping"],
        "responsibilities": ["Roadmap prioritization", "Data analysis", "Cross-functional alignment"],
        "requirements": [
            {"competency_id": "comp-sql", "target_level": 68, "importance": "high"},
            {"competency_id": "comp-system-design", "target_level": 72, "importance": "critical"},
            {"competency_id": "comp-dsa", "target_level": 58, "importance": "medium"},
            {"competency_id": "comp-python", "target_level": 55, "importance": "low"},
        ],
    },
]

QUESTIONS = [
    # ── DSA ──────────────────────────────────────────────────────────────────
    {
        "id": "q-001", "competency_id": "comp-dsa", "difficulty": "medium", "question_type": "conceptual",
        "question": "Why does a hash table have average O(1) lookup time? Walk me through what happens when you look up a key.",
        "expected_concepts": ["hashing", "bucket mapping", "collision handling", "average complexity", "worst-case complexity"],
        "follow_up_prompts": ["What happens in the worst case, and when does that occur?", "How does load factor affect performance?"],
    },
    {
        "id": "q-002", "competency_id": "comp-dsa", "difficulty": "hard", "question_type": "analytical",
        "question": "Explain the difference between depth-first and breadth-first search. When would you choose one over the other?",
        "expected_concepts": ["DFS traversal order", "BFS traversal order", "stack vs queue", "shortest path", "memory complexity", "graph properties"],
        "follow_up_prompts": ["How would the choice change if the graph has cycles?", "What if you needed to find the shortest path between two nodes?"],
    },
    {
        "id": "q-007", "competency_id": "comp-dsa", "difficulty": "foundational", "question_type": "conceptual",
        "question": "What is the difference between an array and a linked list? When would you choose each?",
        "expected_concepts": ["contiguous memory", "pointer-based", "access time", "insertion time", "cache locality", "use cases"],
        "follow_up_prompts": ["What are the cache implications of linked lists?", "How does a doubly linked list differ, and when is that useful?"],
    },
    {
        "id": "q-dsa-e1", "competency_id": "comp-dsa", "difficulty": "easy", "question_type": "conceptual",
        "question": "What is Big O notation and why do we use it? Give examples of O(1), O(n), and O(n²) operations.",
        "expected_concepts": ["asymptotic analysis", "time complexity", "O(1) constant", "O(n) linear", "O(n^2) quadratic", "worst case"],
        "follow_up_prompts": ["What's the difference between best, average, and worst case complexity?", "Why do we ignore constants in Big O?"],
    },
    {
        "id": "q-dsa-m2", "competency_id": "comp-dsa", "difficulty": "medium", "question_type": "applied",
        "question": "Explain binary search and describe when it can and cannot be used.",
        "expected_concepts": ["sorted array requirement", "O(log n)", "divide and conquer", "midpoint", "comparison", "search space"],
        "follow_up_prompts": ["How would you apply binary search to find a rotated sorted array's pivot?", "What's the iterative vs recursive tradeoff?"],
    },
    {
        "id": "q-dsa-m3", "competency_id": "comp-dsa", "difficulty": "medium", "question_type": "conceptual",
        "question": "What is a binary search tree? What invariant does it maintain and what are its time complexities?",
        "expected_concepts": ["left < root < right", "O(log n) average", "O(n) worst case", "balanced vs unbalanced", "inorder traversal", "search property"],
        "follow_up_prompts": ["How does a balanced BST like an AVL or Red-Black tree address the worst case?", "What's the difference between a BST and a heap?"],
    },
    {
        "id": "q-dsa-h2", "competency_id": "comp-dsa", "difficulty": "hard", "question_type": "analytical",
        "question": "Explain dynamic programming. When is it applicable and how do you approach solving a DP problem?",
        "expected_concepts": ["overlapping subproblems", "optimal substructure", "memoization", "tabulation", "state definition", "transition"],
        "follow_up_prompts": ["How do you determine the state space and transitions?", "Compare top-down memoization vs bottom-up tabulation."],
    },
    # ── Python ────────────────────────────────────────────────────────────────
    {
        "id": "q-004", "competency_id": "comp-python", "difficulty": "medium", "question_type": "conceptual",
        "question": "Explain Python's Global Interpreter Lock. What problems does it cause, and what are the common workarounds?",
        "expected_concepts": ["GIL definition", "thread safety", "CPU-bound limitation", "multiprocessing", "async IO", "C extensions"],
        "follow_up_prompts": ["When is the GIL actually not a problem?", "How does asyncio differ from multiprocessing as a workaround?"],
    },
    {
        "id": "q-009", "competency_id": "comp-python", "difficulty": "hard", "question_type": "analytical",
        "question": "Explain Python decorators. How do they work under the hood, and what are practical use cases?",
        "expected_concepts": ["higher-order functions", "closure", "functools.wraps", "function wrapping", "class decorators", "use cases"],
        "follow_up_prompts": ["How would you write a decorator that takes arguments?", "What is the difference between a decorator and a context manager?"],
    },
    {
        "id": "q-py-f1", "competency_id": "comp-python", "difficulty": "foundational", "question_type": "conceptual",
        "question": "What are Python lists and dictionaries? When would you use each and what are their time complexities?",
        "expected_concepts": ["dynamic array", "hash map", "O(1) dict lookup", "O(n) list search", "mutability", "ordered vs unordered"],
        "follow_up_prompts": ["What is a Python set and how does it compare to a dict?", "What happens when a list runs out of capacity?"],
    },
    {
        "id": "q-py-e1", "competency_id": "comp-python", "difficulty": "easy", "question_type": "applied",
        "question": "Explain list comprehensions in Python and when they're preferable over for loops.",
        "expected_concepts": ["syntax", "readability", "performance", "filter", "transform", "generator expressions"],
        "follow_up_prompts": ["What's a generator expression and how does it differ from a list comprehension?", "Are there cases where a regular loop is better?"],
    },
    {
        "id": "q-py-m2", "competency_id": "comp-python", "difficulty": "medium", "question_type": "conceptual",
        "question": "How does Python's memory management work? Explain reference counting and garbage collection.",
        "expected_concepts": ["reference counting", "gc module", "cyclic garbage collector", "memory leaks", "__del__", "weak references"],
        "follow_up_prompts": ["When can reference counting fail?", "What is a context manager and how does it help with memory/resource management?"],
    },
    {
        "id": "q-py-h2", "competency_id": "comp-python", "difficulty": "hard", "question_type": "applied",
        "question": "Describe Python's async/await model. How does the event loop work and when should you use asyncio vs threads?",
        "expected_concepts": ["event loop", "coroutines", "await", "IO-bound", "CPU-bound", "cooperative multitasking", "asyncio.gather"],
        "follow_up_prompts": ["What is the difference between tasks and coroutines?", "How would you call a blocking function from async code?"],
    },
    # ── Debugging ─────────────────────────────────────────────────────────────
    {
        "id": "q-003", "competency_id": "comp-debugging", "difficulty": "medium", "question_type": "applied",
        "question": "A function that should return a sorted list is returning incorrect results intermittently. Describe your debugging process.",
        "expected_concepts": ["reproduce the issue", "isolate the condition", "state inspection", "edge cases", "race conditions", "systematic narrowing"],
        "follow_up_prompts": ["What if it only fails in production but not locally?", "How would you approach it if you cannot reproduce it consistently?"],
    },
    {
        "id": "q-005", "competency_id": "comp-debugging", "difficulty": "hard", "question_type": "applied",
        "question": "You have a service that works correctly under low load but fails unpredictably under high concurrency. How do you approach diagnosing and resolving this?",
        "expected_concepts": ["race conditions", "shared state", "locking mechanisms", "load testing", "profiling", "deadlocks", "thread safety"],
        "follow_up_prompts": ["What tools would you use to reproduce and measure the problem?", "Walk me through how you would identify if it is a deadlock vs a race condition."],
    },
    {
        "id": "q-010", "competency_id": "comp-debugging", "difficulty": "foundational", "question_type": "conceptual",
        "question": "What is your general approach when you encounter a bug you cannot immediately understand?",
        "expected_concepts": ["reproduce", "isolate", "minimal example", "binary search", "logging", "rubber duck debugging"],
        "follow_up_prompts": ["How do you know when to ask for help?", "How do you document what you found?"],
    },
    {
        "id": "q-dbg-e1", "competency_id": "comp-debugging", "difficulty": "easy", "question_type": "applied",
        "question": "How do you use print statements and logging to debug a Python program? What are the tradeoffs?",
        "expected_concepts": ["print debugging", "logging levels", "DEBUG INFO WARNING ERROR", "structured logging", "log to file", "production safety"],
        "follow_up_prompts": ["What are the risks of leaving print statements in production code?", "How would you set up logging levels across a large application?"],
    },
    {
        "id": "q-dbg-m2", "competency_id": "comp-debugging", "difficulty": "medium", "question_type": "conceptual",
        "question": "What is a stack trace and how do you read one to find the root cause of an error?",
        "expected_concepts": ["call stack", "exception type", "line number", "root cause", "inner vs outer frames", "traceback"],
        "follow_up_prompts": ["How does a stack trace differ between synchronous and async code?", "What tools help visualize stack traces in production?"],
    },
    {
        "id": "q-dbg-h2", "competency_id": "comp-debugging", "difficulty": "hard", "question_type": "applied",
        "question": "Explain how you would debug a memory leak in a long-running Python service.",
        "expected_concepts": ["memory profiler", "heap snapshot", "reference cycles", "object retention", "tracemalloc", "gc.collect"],
        "follow_up_prompts": ["How would you identify which objects are leaking?", "When would you use tracemalloc vs a memory profiler?"],
    },
    # ── SQL ────────────────────────────────────────────────────────────────────
    {
        "id": "q-008", "competency_id": "comp-sql", "difficulty": "medium", "question_type": "applied",
        "question": "Write a query to find the second highest salary from an employees table. Explain why your approach handles edge cases.",
        "expected_concepts": ["subquery", "ORDER BY", "LIMIT/OFFSET", "NULL handling", "DISTINCT", "ties"],
        "follow_up_prompts": ["How would you modify this to find the Nth highest salary?", "What if multiple employees have the same salary?"],
    },
    {
        "id": "q-sql-f1", "competency_id": "comp-sql", "difficulty": "foundational", "question_type": "conceptual",
        "question": "What is a SQL JOIN? Explain INNER JOIN and LEFT JOIN with examples.",
        "expected_concepts": ["INNER JOIN matching rows", "LEFT JOIN all left rows", "NULL for no match", "ON clause", "Cartesian product", "foreign key"],
        "follow_up_prompts": ["What is the difference between LEFT JOIN and RIGHT JOIN?", "When would a FULL OUTER JOIN be appropriate?"],
    },
    {
        "id": "q-sql-e1", "competency_id": "comp-sql", "difficulty": "easy", "question_type": "conceptual",
        "question": "What is indexing in SQL and how does it improve query performance?",
        "expected_concepts": ["B-tree index", "lookup time", "query planner", "write overhead", "composite index", "covering index"],
        "follow_up_prompts": ["What are the tradeoffs of having too many indexes?", "How do you know if a query is using an index?"],
    },
    {
        "id": "q-sql-h1", "competency_id": "comp-sql", "difficulty": "hard", "question_type": "analytical",
        "question": "Explain SQL window functions. How do they differ from GROUP BY, and what problems do they solve?",
        "expected_concepts": ["OVER clause", "PARTITION BY", "ORDER BY", "ROW_NUMBER", "RANK", "running totals", "no row collapsing"],
        "follow_up_prompts": ["How would you calculate a running total using a window function?", "What is the difference between ROW_NUMBER, RANK, and DENSE_RANK?"],
    },
    {
        "id": "q-sql-m2", "competency_id": "comp-sql", "difficulty": "medium", "question_type": "applied",
        "question": "What is database normalization and why is it important? Explain 1NF, 2NF, and 3NF briefly.",
        "expected_concepts": ["1NF atomic values", "2NF full functional dependency", "3NF no transitive dependency", "redundancy", "anomalies", "denormalization tradeoff"],
        "follow_up_prompts": ["When is it acceptable to denormalize a schema?", "What are the performance implications of normalization?"],
    },
    # ── System Design ─────────────────────────────────────────────────────────
    {
        "id": "q-006", "competency_id": "comp-system-design", "difficulty": "medium", "question_type": "analytical",
        "question": "Design a URL shortening service. What are the key components and how do they interact?",
        "expected_concepts": ["hash function", "database schema", "redirection", "scalability", "collision handling", "analytics"],
        "follow_up_prompts": ["How would you handle 1 billion shortened URLs?", "What if you needed to support custom aliases?"],
    },
    {
        "id": "q-sd-f1", "competency_id": "comp-system-design", "difficulty": "foundational", "question_type": "conceptual",
        "question": "What is a REST API? Explain the key principles of RESTful design.",
        "expected_concepts": ["stateless", "resources", "HTTP verbs", "status codes", "uniform interface", "JSON"],
        "follow_up_prompts": ["What is the difference between REST and GraphQL?", "How do you version a REST API without breaking clients?"],
    },
    {
        "id": "q-sd-e1", "competency_id": "comp-system-design", "difficulty": "easy", "question_type": "conceptual",
        "question": "What is caching and where can it be used in a web application?",
        "expected_concepts": ["browser cache", "CDN", "application cache", "database query cache", "cache invalidation", "TTL"],
        "follow_up_prompts": ["What are common cache invalidation strategies?", "When does caching introduce consistency problems?"],
    },
    {
        "id": "q-sd-h1", "competency_id": "comp-system-design", "difficulty": "hard", "question_type": "analytical",
        "question": "Design a notification system that can send millions of emails, SMS, and push notifications. What are the key architectural challenges?",
        "expected_concepts": ["message queue", "fan-out", "rate limiting", "retries", "idempotency", "delivery guarantees", "horizontal scaling"],
        "follow_up_prompts": ["How would you handle failures in third-party notification providers?", "How do you ensure exactly-once delivery?"],
    },
    {
        "id": "q-sd-m2", "competency_id": "comp-system-design", "difficulty": "medium", "question_type": "analytical",
        "question": "What is the difference between horizontal and vertical scaling? When would you use each?",
        "expected_concepts": ["vertical scaling limits", "horizontal scaling stateless", "load balancer", "sharding", "database scaling", "CAP theorem"],
        "follow_up_prompts": ["What challenges arise when scaling databases horizontally?", "How do stateful services complicate horizontal scaling?"],
    },
    {
        "id": "q-sd-h2", "competency_id": "comp-system-design", "difficulty": "hard", "question_type": "analytical",
        "question": "Explain the CAP theorem. How does it constrain distributed system design?",
        "expected_concepts": ["consistency", "availability", "partition tolerance", "AP vs CP systems", "eventual consistency", "tradeoffs"],
        "follow_up_prompts": ["Can you give examples of AP and CP systems?", "How does the PACELC model extend CAP?"],
    },
]


DEFAULT_USER = {
    "id": "user-001",
    "name": "Demo User",
    "target_role_id": "role-001",
}


from app.config import settings


def _format_db_error_banner(db_url: str) -> str:
    display_url = db_url
    if "@" in display_url and ":" in display_url.split("@")[0]:
        prefix, host_part = display_url.split("@", 1)
        parts = prefix.split(":")
        if len(parts) >= 3:
            display_url = f"{parts[0]}:{parts[1]}:***@{host_part}"

    return (
        "\n"
        + "=" * 60 + "\n"
        + "POSTGRESQL CONNECTION FAILED\n"
        + "=" * 60 + "\n"
        + f"Expected:\n  {display_url}\n\n"
        + "Make sure PostgreSQL is running and the database exists.\n\n"
        + "Options to start PostgreSQL:\n"
        + "  1. Windows local development:\n"
        + "     python scripts/start_db.py\n"
        + "  2. Windows PostgreSQL Service:\n"
        + "     net start postgresql-x64-16 (or start via Services app)\n"
        + "  3. Docker:\n"
        + "     docker run -d --name aiinterview-postgres -p 5432:5432 \\\n"
        + "       -e POSTGRES_PASSWORD=password -e POSTGRES_DB=aiinterviewer postgres:16\n"
        + "  4. Supabase / Cloud Postgres:\n"
        + "     Set DATABASE_URL in backend/.env\n"
        + "=" * 60 + "\n"
    )


async def seed(reset: bool = False) -> None:
    try:
        async with engine.begin() as conn:
            if reset:
                print("Resetting database schema (drop_all)...")
                await conn.run_sync(Base.metadata.drop_all)
            await conn.run_sync(Base.metadata.create_all)
            await conn.execute(
                text("ALTER TABLE assessment_sessions ADD COLUMN IF NOT EXISTS current_question_id VARCHAR(64);")
            )
    except Exception:
        sys.stderr.write(_format_db_error_banner(settings.database_url))
        sys.stderr.flush()
        sys.exit(1)

    async with AsyncSessionLocal() as session:
        from sqlalchemy import select
        from app.models.role import Competency, Role, RoleCompetency
        from app.models.question import Question
        from app.models.user import User

        print("Seeding competencies...")
        for comp_data in COMPETENCIES:
            result = await session.execute(select(Competency).where(Competency.id == comp_data["id"]))
            if not result.scalar_one_or_none():
                session.add(Competency(**comp_data))
        await session.flush()

        print("Seeding roles and requirements...")
        for role_entry in ROLES:
            requirements = role_entry.get("requirements", [])
            role_fields = {k: v for k, v in role_entry.items() if k != "requirements"}
            result = await session.execute(select(Role).where(Role.id == role_fields["id"]))
            if not result.scalar_one_or_none():
                session.add(Role(**role_fields))
                await session.flush()
                for req in requirements:
                    session.add(RoleCompetency(role_id=role_fields["id"], **req))
        await session.flush()

        print("Seeding questions...")
        for q_data in QUESTIONS:
            result = await session.execute(select(Question).where(Question.id == q_data["id"]))
            if not result.scalar_one_or_none():
                session.add(Question(**q_data))
        await session.flush()

        print("Seeding default user...")
        result = await session.execute(select(User).where(User.id == DEFAULT_USER["id"]))
        if not result.scalar_one_or_none():
            session.add(User(**DEFAULT_USER))
        await session.flush()

        await session.commit()

    print("Seed complete.")


if __name__ == "__main__":
    reset_requested = "--reset" in sys.argv
    asyncio.run(seed(reset=reset_requested))

