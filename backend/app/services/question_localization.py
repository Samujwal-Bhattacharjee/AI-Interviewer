"""
backend/app/services/question_localization.py — Question Localization Layer.

Responsibilities:
1. Localizes canonical English interview questions into the candidate's chosen language:
   - Hindi (hi-IN)
   - Tamil (ta-IN)
   - Bengali (bn-IN)
   - Gujarati (gu-IN)
   - Telugu (te-IN)
   - Kannada (kn-IN)
2. Preserves industry-standard technical terminology in Latin script (e.g., Python, FastAPI,
   PostgreSQL, REST API, mutex, Docker, hash table, O(1), DFS, BFS, stack, queue, cache).
3. Provides an in-memory cache to ensure zero duplicate translations (question_id + target_lang).
4. Employs curated high-fidelity engineering translations for seeded questions.
5. Dynamically queries LLM (Groq / OpenAI-compatible) for ad-hoc or adaptive questions.
6. Returns structured localization output:
   {
       "originalText": "...",
       "localizedText": "...",
       "language": "hi-IN"
   }
"""
import hashlib
import json
import logging
from typing import Any, Optional

from app.services.llm_service import llm_service

logger = logging.getLogger(__name__)

# Supported language metadata
SUPPORTED_LOCALES = {
    "hi-IN": {"name": "Hindi", "native": "हिन्दी", "script": "Devanagari"},
    "ta-IN": {"name": "Tamil", "native": "தமிழ்", "script": "Tamil"},
    "bn-IN": {"name": "Bengali", "native": "বাংলা", "script": "Bengali"},
    "gu-IN": {"name": "Gujarati", "native": "ગુજરાતી", "script": "Gujarati"},
    "te-IN": {"name": "Telugu", "native": "తెలుగు", "script": "Telugu"},
    "kn-IN": {"name": "Kannada", "native": "ಕನ್ನಡ", "script": "Kannada"},
    "en-IN": {"name": "English", "native": "English", "script": "Latin"},
    "en-US": {"name": "English", "native": "English", "script": "Latin"},
}

# Curated high-fidelity engineering translations for question bank prompts
CURATED_LOCALIZATIONS: dict[str, dict[str, str]] = {
    # ── q-001: Hash Table O(1) ──
    "q-001": {
        "hi-IN": "Hash Table में average lookup time O(1) क्यों होता है? जब आप कोई key खोजते हैं तो आंतरिक रूप से क्या प्रक्रिया होती है, समझाइए।",
        "ta-IN": "Hash Table-ல் average lookup time O(1) ஆக இருப்பது ஏன்? ஒரு key-ஐ தேடும்போது உள்ளுக்குள் என்ன நடக்கிறது என்பதை விளக்குங்கள்.",
        "bn-IN": "Hash Table-এ average lookup time O(1) কেন হয়? যখন আপনি একটি key খুঁজছেন তখন অভ্যন্তরীণভাবে কী ঘটে তা ব্যাখ্যা করুন।",
        "gu-IN": "Hash Table માં average lookup time O(1) શા માટે હોય છે? જ્યારે તમે કોઈ key શોધો છો ત્યારે આંતરિક રીતે શું થાય છે તે સમજાવો.",
        "te-IN": "Hash Table లో average lookup time O(1) ఎందుకు ఉంటుంది? మీరు ఒక key ని వెతికినప్పుడు అంతర్గతంగా ఏమి జరుగుతుందో వివరించండి.",
        "kn-IN": "Hash Table ನಲ್ಲಿ average lookup time O(1) ಏಕೆ ಇರುತ್ತದೆ? ನೀವು key ಅನ್ನು ಹುಡುಕಿದಾಗ ಆಂತರಿಕವಾಗಿ ಏನು ನಡೆಯುತ್ತದೆ ಎಂದು ವಿವರಿಸಿ.",
    },
    # ── q-002: DFS vs BFS ──
    "q-002": {
        "hi-IN": "Depth-First Search (DFS) और Breadth-First Search (BFS) में क्या अंतर है? आप एक के मुकाबले दूसरे को कब चुनेंगे?",
        "ta-IN": "Depth-First Search (DFS) மற்றும் Breadth-First Search (BFS) இடையே உள்ள வித்தியாசம் என்ன? ஒன்றிற்குப் பதிலாக மற்றொன்றை எப்போது தேர்வு செய்வீர்கள்?",
        "bn-IN": "Depth-First Search (DFS) এবং Breadth-First Search (BFS)-এর মধ্যে পার্থক্য কী? আপনি একটির চেয়ে অন্যটি কখন বেছে নেবেন?",
        "gu-IN": "Depth-First Search (DFS) અને Breadth-First Search (BFS) વચ્ચે શું તફાવત છે? તમે એક કરતાં બીજાને ક્યારે પસંદ કરશો?",
        "te-IN": "Depth-First Search (DFS) మరియు Breadth-First Search (BFS) మధ్య తేడా ఏమిటి? ఒకదాని కంటే మరొకటి ఎప్పుడు ఎంచుకుంటారు?",
        "kn-IN": "Depth-First Search (DFS) ಮತ್ತು Breadth-First Search (BFS) ನಡುವಿನ ವ್ಯತ್ಯಾಸವೇನು? ಒಂದಕ್ಕಿಂತ ಇನ್ನೊಂದನ್ನು ನೀವು ಯಾವಾಗ ಆಯ್ಕೆ ಮಾಡುತ್ತೀರಿ?",
    },
    # ── q-003: Debugging Sorted List ──
    "q-003": {
        "hi-IN": "एक function जो sorted list लौटाना चाहिए, कभी-कभी गलत results दे रहा है। आपकी debugging process कैसी होगी?",
        "ta-IN": "Sorted list-ஐ தர வேண்டிய ஒரு function எப்போதாவது தவறான முடிவுகளைத் தருகிறது. உங்கள் debugging process எப்படி இருக்கும்?",
        "bn-IN": "একটি function যা sorted list রিটার্ন করা উচিত, মাঝে মাঝে ভুল ফলাফল দিচ্ছে। আপনার debugging প্রক্রিয়া কেমন হবে?",
        "gu-IN": "એક function જેણે sorted list પરત કરવી જોઈએ, તે ક્યારેક ખોટા પરિણામો આપી રહ્યું છે. તમારી debugging પ્રક્રિયા કેવી હશે?",
        "te-IN": "Sorted list ను ఇవ్వవలసిన ఒక function అప్పుడప్పుడు తప్పుడు ఫలితాలను ఇస్తోంది. మీ debugging విధానం ఎలా ఉంటుంది?",
        "kn-IN": "Sorted list ನೀಡಬೇಕಾದ function ಸಾಂದರ್ಭಿಕವಾಗಿ ತಪ್ಪಾದ ಫಲಿತಾಂಶ ನೀಡುತ್ತಿದೆ. ನಿಮ್ಮ debugging ವಿಧಾನ ಹೇಗಿರುತ್ತದೆ?",
    },
    # ── q-004: Python GIL ──
    "q-004": {
        "hi-IN": "Python के Global Interpreter Lock (GIL) को समझाइए। यह क्या समस्याएं पैदा करता है और इसके आम workarounds क्या हैं?",
        "ta-IN": "Python-ன் Global Interpreter Lock (GIL) பற்றி விளக்குங்கள். இது என்ன சிக்கல்களை உருவாக்குகிறது மற்றும் பொதுவான workarounds யாவை?",
        "bn-IN": "Python-এর Global Interpreter Lock (GIL) ব্যাখ্যা করুন। এটি কী সমস্যা তৈরি করে এবং এর সাধারণ workarounds কী?",
        "gu-IN": "Python ના Global Interpreter Lock (GIL) ને સમજાવો. આ શું સમસ્યાઓ ઊભી કરે છે અને તેના સામાન્ય workarounds શું છે?",
        "te-IN": "Python యొక్క Global Interpreter Lock (GIL) గురించి వివరించండి. ఇది ఏ సమస్యలను కలిగిస్తుంది మరియు సాధారణ workarounds ఏమిటి?",
        "kn-IN": "Python ನ Global Interpreter Lock (GIL) ಅನ್ನು ವಿವರಿಸಿ. ಇದು ಯಾವ ಸಮಸ್ಯೆಗಳನ್ನು ಉಂಟುಮಾಡುತ್ತದೆ ಮತ್ತು ಸಾಮಾನ್ಯ workarounds ಯಾವುವು?",
    },
    # ── q-005: High Concurrency Failure ──
    "q-005": {
        "hi-IN": "आपकी service कम लोड पर सही चलती है लेकिन high concurrency में unpredictably fail होती है। आप इसे diagnose और resolve कैसे करेंगे?",
        "ta-IN": "குறைந்த load-ல் சரியாக இயங்கும் ஒரு service, high concurrency-ல் எதிர்பாராதவிதமாக fail ஆகிறது. இதை diagnose செய்து resolve செய்வது எப்படி?",
        "bn-IN": "আপনার service কম লোডে ঠিকঠাক চলে কিন্তু high concurrency-তে unpredictably ব্যর্থ হয়। আপনি এটি কীভাবে diagnose এবং resolve করবেন?",
        "gu-IN": "ઓછા load પર યોગ્ય રીતે ચાલતી service, high concurrency માં અનપેક્ષિત રીતે fail થાય છે. તમે તેનું નિદાન અને ઉકેલ કેવી રીતે કરશો?",
        "te-IN": "తక్కువ load ఉన్నప్పుడు సరిగ్గా పనిచేసే service, high concurrency లో ఊహించని విధంగా fail అవుతోంది. దీన్ని మీరు ఎలా diagnose చేసి resolve చేస్తారు?",
        "kn-IN": "ಕಡಿಮೆ load ನಲ್ಲಿ ಸರಿಯಾಗಿ ಕಾರ್ಯನಿರ್ವಹಿಸುವ service, high concurrency ಯಲ್ಲಿ ಅನಿರೀಕ್ಷಿತವಾಗಿ fail ಆಗುತ್ತಿದೆ. ಇದನ್ನು ನೀವು ಹೇಗೆ diagnose ಮಾಡಿ resolve ಮಾಡುತ್ತೀರಿ?",
    },
    # ── q-006: SQL Indexing ──
    "q-006": {
        "hi-IN": "Database indexes कैसे काम करते हैं और query performance को कैसे बेहतर बनाते हैं? Index जोड़ने के tradeoffs क्या हैं?",
        "ta-IN": "Database indexes எவ்வாறு செயல்படுகின்றன மற்றும் query performance-ஐ எவ்வாறு மேம்படுத்துகின்றன? ஒரு index-ஐ சேர்ப்பதன் tradeoffs யாவை?",
        "bn-IN": "Database indexes কীভাবে কাজ করে এবং query performance কীভাবে উন্নত করে? একটি index যোগ করার tradeoffs কী কী?",
        "gu-IN": "Database indexes કેવી રીતે કાર્ય કરે છે અને query performance કેવી રીતે સુધારે છે? એક index ઉમેરવાના tradeoffs શું છે?",
        "te-IN": "Database indexes ఎలా పనిచేస్తాయి మరియు query performance ను ఎలా మెరుగుపరుస్తాయి? Index జోడించడంలో tradeoffs ఏమిటి?",
        "kn-IN": "Database indexes ಹೇಗೆ ಕಾರ್ಯನಿರ್ವಹಿಸುತ್ತವೆ ಮತ್ತು query performance ಅನ್ನು ಹೇಗೆ ಹೆಚ್ಚಿಸುತ್ತವೆ? Index ಸೇರಿಸುವ tradeoffs ಯಾವುವು?",
    },
    # ── q-007: Array vs Linked List ──
    "q-007": {
        "hi-IN": "Array और Linked List में क्या अंतर है? आप किन परिस्थितियों में किसका चयन करेंगे?",
        "ta-IN": "Array மற்றும் Linked List இடையே உள்ள வேறுபாடுகள் என்ன? எந்த சூழ்நிலைகளில் எதை தேர்வு செய்வீர்கள்?",
        "bn-IN": "Array এবং Linked List-এর মধ্যে পার্থক্য কী? কোন পরিস্থিতিতে আপনি কোনটি নির্বাচন করবেন?",
        "gu-IN": "Array અને Linked List વચ્ચે શું તફાવત છે? તમે કઈ પરિસ્થિતિમાં કોની પસંદગી કરશો?",
        "te-IN": "Array మరియు Linked List మధ్య వ్యత్యాసం ఏమిటి? ఏ సందర్భాలలో దేనిని ఎంచుకుంటారు?",
        "kn-IN": "Array ಮತ್ತು Linked List ನಡುವಿನ ವ್ಯತ್ಯಾಸವೇನು? ಯಾವ ಸಂದರ್ಭಗಳಲ್ಲಿ ಯಾವುದನ್ನು ಆಯ್ಕೆ ಮಾಡುತ್ತೀರಿ?",
    },
    # ── q-008: Microservices Migration ──
    "q-008": {
        "hi-IN": "Monolithic architecture से microservices में migrate करते समय आप किन मुख्य कारकों और चुनौतियों का मूल्यांकन करेंगे?",
        "ta-IN": "Monolithic architecture-லிருந்து microservices-க்கு மாறும் போது நீங்கள் எந்த முக்கிய காரணிகளையும் சவால்களையும் மதிப்பிடுவீர்கள்?",
        "bn-IN": "Monolithic architecture থেকে microservices-এ migrate করার সময় আপনি কোন মূল বিষয়গুলি এবং চ্যালেঞ্জগুলি মূল্যায়ন করবেন?",
        "gu-IN": "Monolithic architecture થી microservices માં migrate કરતી વખતે તમે કયા મુખ્ય પરિબળો અને પડકારોનું મૂલ્યાંકન કરશો?",
        "te-IN": "Monolithic architecture నుండి microservices కు మారేటప్పుడు మీరు ఏ ప్రధాన అంశాలను మరియు సవాళ్లను అంచనా వేస్తారు?",
        "kn-IN": "Monolithic architecture ನಿಂದ microservices ಗೆ migrate ಮಾಡುವಾಗ ನೀವು ಯಾವ ಮುಖ್ಯ ಅಂಶಗಳು ಮತ್ತು ಸವಾಲುಗಳನ್ನು ಮೌಲ್ಯಮಾಪನ ಮಾಡುತ್ತೀರಿ?",
    },
    # ── q-009: Python Decorators ──
    "q-009": {
        "hi-IN": "Python decorators को समझाइए। ये under the hood कैसे काम करते हैं और इनके practical use cases क्या हैं?",
        "ta-IN": "Python decorators பற்றி விளக்குங்கள். இவை under the hood எப்படி செயல்படுகின்றன மற்றும் அவற்றின் practical use cases யாவை?",
        "bn-IN": "Python decorators ব্যাখ্যা করুন। এগুলি under the hood কীভাবে কাজ করে এবং এদের practical use cases কী?",
        "gu-IN": "Python decorators સમજાવો. આ under the hood કેવી રીતે કામ કરે છે અને તેના practical use cases શું છે?",
        "te-IN": "Python decorators గురించి వివరించండి. ఇవి under the hood ఎలా పనిచేస్తాయి మరియు వాటి practical use cases ఏమిటి?",
        "kn-IN": "Python decorators ಅನ್ನು ವಿವರಿಸಿ. ಇವು under the hood ಹೇಗೆ ಕಾರ್ಯನಿರ್ವಹಿಸುತ್ತವೆ ಮತ್ತು ಇವುಗಳ practical use cases ಯಾವುವು?",
    },
    # ── q-010: Memory Leak Diagnostic ──
    "q-010": {
        "hi-IN": "यदि production application में memory leak हो, तो आप व्यवस्थित रूप से इसके diagnosis और resolution के लिए क्या कदम उठाएंगे?",
        "ta-IN": "Production application-ல் memory leak ஏற்பட்டால், அதை முறையாகக் கண்டறிந்து சரிசெய்ய என்ன நடவடிக்கைகளை எடுப்பீர்கள்?",
        "bn-IN": "যদি production অ্যাপ্লিকেশনে memory leak ঘটে, তবে আপনি পদ্ধতিগতভাবে এটি diagnose এবং resolve করতে কী পদক্ষেপ নেবেন?",
        "gu-IN": "જો production application માં memory leak હોય, તો તમે વ્યવસ્થિત રીતે તેના નિદાન અને ઉકેલ માટે કયા પગલાં લેશો?",
        "te-IN": "ఒక production application లో memory leak ఉంటే, మీరు క్రమపద్ధతిలో దాని diagnosis మరియు resolution కోసం ఎలాంటి చర్యలు తీసుకుంటారు?",
        "kn-IN": "Production application ನಲ್ಲಿ memory leak ಉಂಟಾದರೆ, ನೀವು ವ್ಯವಸ್ಥಿತವಾಗಿ ಅದರ diagnosis ಮತ್ತು resolution ಗಾಗಿ ಯಾವ ಕ್ರಮಗಳನ್ನು ಕೈಗೊಳ್ಳುತ್ತೀರಿ?",
    },
    # ── q-dsa-e1: Big O Notation ──
    "q-dsa-e1": {
        "hi-IN": "Big O notation क्या है और हम इसका उपयोग क्यों करते हैं? O(1), O(n), और O(n²) operations के उदाहरण दीजिए।",
        "ta-IN": "Big O notation என்றால் என்ன, அதை நாம் ஏன் பயன்படுத்துகிறோம்? O(1), O(n), மற்றும் O(n²) செயல்பாடுகளுக்கு எடுத்துக்காட்டுகள் தருக.",
        "bn-IN": "Big O notation কী এবং আমরা এটি কেন ব্যবহার করি? O(1), O(n) এবং O(n²) অপারেশনের উদাহরণ দিন।",
        "gu-IN": "Big O notation શું છે અને આપણે તેનો ઉપયોગ કેમ કરીએ છીએ? O(1), O(n), અને O(n²) operations ના ઉદાહરણો આપો.",
        "te-IN": "Big O notation అంటే ఏమిటి మరియు మనం దానిని ఎందుకు ఉపయోగిస్తాము? O(1), O(n), మరియు O(n²) operations కు ఉదాహరణలు ఇవ్వండి.",
        "kn-IN": "Big O notation ಎಂದರೇನು ಮತ್ತು ನಾವು ಅದನ್ನು ಏಕೆ ಬಳಸುತ್ತೇವೆ? O(1), O(n), ಮತ್ತು O(n²) ಕಾರ್ಯಾಚರಣೆಗಳ ಉದಾಹರಣೆಗಳನ್ನು ನೀಡಿ.",
    },
    # ── q-dsa-m2: Binary Search ──
    "q-dsa-m2": {
        "hi-IN": "Binary search algorithm को समझाइए और बताइए कि इसका उपयोग कब किया जा सकता है और कब नहीं।",
        "ta-IN": "Binary search algorithm-ஐ விளக்கி, அதை எப்போது பயன்படுத்தலாம் மற்றும் எப்போது பயன்படுத்த முடியாது என்பதை விவரிக்கவும்.",
        "bn-IN": "Binary search algorithm ব্যাখ্যা করুন এবং বর্ণনা করুন কখন এটি ব্যবহার করা যায় এবং কখন যায় না।",
        "gu-IN": "Binary search algorithm સમજાવો અને વર્ણવો કે તેનો ઉપયોગ ક્યારે કરી શકાય અને ક્યારે નહીં.",
        "te-IN": "Binary search algorithm ను వివరించండి మరియు దీనిని ఎప్పుడు ఉపయోగించవచ్చో మరియు ఎప్పుడు ఉపయోగించకూడదో చెప్పండి.",
        "kn-IN": "Binary search algorithm ಅನ್ನು ವಿವರಿಸಿ ಮತ್ತು ಇದನ್ನು ಯಾವಾಗ ಬಳಸಬಹುದು ಮತ್ತು ಯಾವಾಗ ಬಳಸಲಾಗುವುದಿಲ್ಲ ಎಂದು ತಿಳಿಸಿ.",
    },
    # ── q-dsa-m3: Binary Search Tree ──
    "q-dsa-m3": {
        "hi-IN": "Binary Search Tree (BST) क्या है? यह कौन सा invariant maintain करता है और इसकी time complexities क्या हैं?",
        "ta-IN": "Binary Search Tree (BST) என்றால் என்ன? இது எந்த invariant-ஐ பராமரிக்கிறது மற்றும் இதன் time complexities யாவை?",
        "bn-IN": "Binary Search Tree (BST) কী? এটি কোন invariant বজায় রাখে এবং এর time complexities কী কী?",
        "gu-IN": "Binary Search Tree (BST) શું છે? તે કયો invariant જાળવે છે અને તેની time complexities શું છે?",
        "te-IN": "Binary Search Tree (BST) అంటే ఏమిటి? ఇది ఏ invariant ని నిర్వహిస్తుంది మరియు దీని time complexities ఏమిటి?",
        "kn-IN": "Binary Search Tree (BST) ಎಂದರೇನು? ಇದು ಯಾವ invariant ಅನ್ನು ನಿರ್ವಹಿಸುತ್ತದೆ ಮತ್ತು ಇದರ time complexities ಯಾವುವು?",
    },
    # ── q-dsa-h2: Dynamic Programming ──
    "q-dsa-h2": {
        "hi-IN": "Dynamic Programming को समझाइए। यह कब लागू होती है और आप किसी DP समस्या को हल करने के लिए क्या approach अपनाते हैं?",
        "ta-IN": "Dynamic Programming பற்றி விளக்குங்கள். இது எப்போது பொருந்தும் மற்றும் ஒரு DP சிக்கலைத் தீர்க்க நீங்கள் என்ன approach மேற்கொள்வீர்கள்?",
        "bn-IN": "Dynamic Programming ব্যাখ্যা করুন। এটি কখন প্রযোজ্য এবং একটি DP সমস্যা সমাধানের জন্য আপনার approach কী?",
        "gu-IN": "Dynamic Programming સમજાવો. આ ક્યારે લાગુ પડે છે અને તમે DP સમસ્યાને ઉકેલવા માટે કઈ approach અપનાવશો?",
        "te-IN": "Dynamic Programming ను వివరించండి. ఇది ఎప్పుడు వర్తిస్తుంది మరియు ఒక DP సమస్యను పరిష్కరించడానికి మీ approach ఏమిటి?",
        "kn-IN": "Dynamic Programming ಅನ್ನು ವಿವರಿಸಿ. ಇದು ಯಾವಾಗ ಅನ್ವಯಿಸುತ್ತದೆ ಮತ್ತು DP ಸಮಸ್ಯೆಯನ್ನು ಪರಿಹರಿಸಲು ನಿಮ್ಮ approach ಏನು?",
    },
    # ── q-py-f1: Python Lists and Dictionaries ──
    "q-py-f1": {
        "hi-IN": "Python lists और dictionaries क्या हैं? आप कब किसका उपयोग करेंगे और इनकी time complexities क्या हैं?",
        "ta-IN": "Python lists மற்றும் dictionaries என்றால் என்ன? எப்போது எதைப் பயன்படுத்துவீர்கள் மற்றும் அவற்றின் time complexities யாவை?",
        "bn-IN": "Python lists এবং dictionaries কী? আপনি কখন কোনটি ব্যবহার করবেন এবং এদের time complexities কী?",
        "gu-IN": "Python lists અને dictionaries શું છે? તમે ક્યારે કોનો ઉપયોગ કરશો અને તેમની time complexities શું છે?",
        "te-IN": "Python lists మరియు dictionaries అంటే ఏమిటి? మీరు దేనిని ఎప్పుడు ఉపయోగిస్తారు మరియు వాటి time complexities ఏమిటి?",
        "kn-IN": "Python lists ಮತ್ತು dictionaries ಎಂದರೇನು? ನೀವು ಯಾವಾಗ ಯಾವುದನ್ನು ಬಳಸುತ್ತೀರಿ ಮತ್ತು ಇವುಗಳ time complexities ಯಾವುವು?",
    },
    # ── q-py-e1: List Comprehensions ──
    "q-py-e1": {
        "hi-IN": "Python में list comprehensions को समझाइए और बताइए कि ये for loops की तुलना में कब बेहतर होते हैं।",
        "ta-IN": "Python-ல் list comprehensions பற்றி விளக்குங்கள் மற்றும் for loops-ஐ விட இவை எப்போது சிறந்தவை என்பதை விவரிக்கவும்.",
        "bn-IN": "Python-এ list comprehensions ব্যাখ্যা করুন এবং বলুন যে for loops-এর চেয়ে এগুলি কখন শ্রেয়।",
        "gu-IN": "Python માં list comprehensions સમજાવો અને જણાવો કે for loops ની સરખામણીમાં આ ક્યારે વધુ યોગ્ય છે.",
        "te-IN": "Python లో list comprehensions గురించి వివరించండి మరియు for loops కంటే ఇవి ఎప్పుడు మంచివో చెప్పండి.",
        "kn-IN": "Python ನಲ್ಲಿ list comprehensions ಅನ್ನು ವಿವರಿಸಿ ಮತ್ತು for loops ಗಿಂತ ಇವು ಯಾವಾಗ ಉತ್ತಮ ಎಂದು ತಿಳಿಸಿ.",
    },
    # ── q-py-m2: Python Memory Management ──
    "q-py-m2": {
        "hi-IN": "Python का memory management कैसे काम करता है? Reference counting और garbage collection की प्रक्रिया समझाइए।",
        "ta-IN": "Python-ன் memory management எவ்வாறு செயல்படுகிறது? Reference counting மற்றும் garbage collection செயல்முறையை விளக்குங்கள்.",
        "bn-IN": "Python-এর memory management কীভাবে কাজ করে? Reference counting এবং garbage collection প্রক্রিয়া ব্যাখ্যা করুন।",
        "gu-IN": "Python નું memory management કેવી રીતે કાર્ય કરે છે? Reference counting અને garbage collection પ્રક્રિયા સમજાવો.",
        "te-IN": "Python యొక్క memory management ఎలా పనిచేస్తుంది? Reference counting మరియు garbage collection ప్రక్రియను వివరించండి.",
        "kn-IN": "Python ನ memory management ಹೇಗೆ ಕಾರ್ಯನಿರ್ವಹಿಸುತ್ತದೆ? Reference counting ಮತ್ತು garbage collection ಪ್ರಕ್ರಿಯೆಯನ್ನು ವಿವರಿಸಿ.",
    },
    # ── q-py-h2: Python Asyncio ──
    "q-py-h2": {
        "hi-IN": "Python के async/await model को समझाइए। Event loop कैसे काम करता है और threads के मुकाबले asyncio कब उपयोग करना चाहिए?",
        "ta-IN": "Python-ன் async/await model பற்றி விளக்குங்கள். Event loop எவ்வாறு செயல்படுகிறது மற்றும் threads-ஐ விட asyncio எப்போது பயன்படுத்த வேண்டும்?",
        "bn-IN": "Python-এর async/await model ব্যাখ্যা করুন। Event loop কীভাবে কাজ করে এবং threads-এর বদলে asyncio কখন ব্যবহার করা উচিত?",
        "gu-IN": "Python ના async/await model ને સમજાવો. Event loop કેવી રીતે કાર્ય કરે છે અને threads ની સરખામણીમાં asyncio ક્યારે વાપરવું જોઈએ?",
        "te-IN": "Python యొక్క async/await model గురించి వివరించండి. Event loop ఎలా పనిచేస్తుంది మరియు threads కంటే asyncio ఎప్పుడు ఉపయోగించాలి?",
        "kn-IN": "Python ನ async/await model ಅನ್ನು ವಿವರಿಸಿ. Event loop ಹೇಗೆ ಕಾರ್ಯನಿರ್ವಹಿಸುತ್ತದೆ ಮತ್ತು threads ಬದಲಿಗೆ asyncio ಯಾವಾಗ ಬಳಸಬೇಕು?",
    },
}


class QuestionLocalizationService:
    """
    Dedicated Question Localization Service for Mode 1 Native-Language Voice Interviews.
    Caches translations in-memory and ensures zero duplicate calls.
    """

    def __init__(self):
        # In-memory translation cache: key -> translated string
        self._cache: dict[str, str] = {}

    def _make_cache_key(self, question_id: str, question_text: str, target_lang: str) -> str:
        text_hash = hashlib.sha256(question_text.strip().encode("utf-8")).hexdigest()[:12]
        return f"{question_id}:{text_hash}:{target_lang}"

    async def localize_question(
        self,
        question_id: str,
        question_text: str,
        target_lang: Optional[str] = None,
        target_language: Optional[str] = None,
    ) -> dict[str, str]:
        """
        Localizes a question into target_language (or target_lang).
        Returns:
            {
                "originalText": original_text,
                "localizedText": localized_text,
                "language": target_lang
            }
        """
        clean_text = question_text.strip()
        raw_lang = target_language or target_lang or "hi-IN"

        # If English requested, return canonical English
        if not raw_lang or raw_lang.startswith("en"):
            return {
                "originalText": clean_text,
                "localizedText": clean_text,
                "language": raw_lang or "en-IN",
            }

        # Normalize target language code
        norm_lang = raw_lang.strip()

        if norm_lang not in SUPPORTED_LOCALES:
            # Fallback if unmapped
            for code, meta in SUPPORTED_LOCALES.items():
                if norm_lang.lower().startswith(code[:2]):
                    norm_lang = code
                    break

        cache_key = self._make_cache_key(question_id, clean_text, norm_lang)

        # 1. Check in-memory cache
        if cache_key in self._cache:
            return {
                "originalText": clean_text,
                "localizedText": self._cache[cache_key],
                "language": norm_lang,
            }

        # 2. Check curated static translations
        if question_id in CURATED_LOCALIZATIONS and norm_lang in CURATED_LOCALIZATIONS[question_id]:
            translated = CURATED_LOCALIZATIONS[question_id][norm_lang]
            self._cache[cache_key] = translated
            return {
                "originalText": clean_text,
                "localizedText": translated,
                "language": norm_lang,
            }

        # 3. Dynamic localization via LLM (Groq / OpenAI-compatible)
        if llm_service.is_available():
            lang_meta = SUPPORTED_LOCALES.get(norm_lang, {"name": "Hindi", "native": "हिन्दी"})
            system_prompt = (
                f"You are an expert technical interviewer translating software engineering interview questions "
                f"into professional spoken {lang_meta['name']} ({lang_meta['native']}).\n"
                f"Rules:\n"
                f"1. Translate naturally and accurately into {lang_meta['name']} using its native script.\n"
                f"2. Preserve all industry-standard technical terminology, keywords, and code identifiers in Latin script "
                f"(e.g., Python, FastAPI, PostgreSQL, REST API, mutex, Docker, hash table, O(1), DFS, BFS, stack, queue, cache, tree).\n"
                f"3. Do NOT answer the question.\n"
                f"4. Return ONLY a valid JSON object matching: {{\"translated_question\": \"<translated text in native script>\"}}\n"
            )
            user_content = f"Interview Question to translate:\n\"{clean_text}\""

            try:
                resp = await llm_service._call_chat_completion(
                    messages=[
                        {"role": "system", "content": system_prompt},
                        {"role": "user", "content": user_content},
                    ],
                    temperature=0.2,
                )
                if isinstance(resp, dict) and "translated_question" in resp and resp["translated_question"]:
                    translated = str(resp["translated_question"]).strip()
                    self._cache[cache_key] = translated
                    return {
                        "originalText": clean_text,
                        "localizedText": translated,
                        "language": norm_lang,
                    }
            except Exception as e:
                logger.warning(f"[QuestionLocalizationService] LLM translation call failed: {e}")

        # 4. Fallback behavior (Section 20 of requirements)
        # If localization failed and no static mapping exists, show explicit fallback
        fallback_text = f"TRANSLATION UNAVAILABLE: {clean_text}"
        return {
            "originalText": clean_text,
            "localizedText": fallback_text,
            "language": norm_lang,
        }


# Singleton instance
question_localization_service = QuestionLocalizationService()
