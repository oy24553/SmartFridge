from __future__ import annotations

import os
from datetime import date, timedelta
from typing import Tuple


def _contains(name: str, *keywords: str) -> bool:
    n = (name or "").lower()
    return any(k in n for k in keywords)


def _rule_days(name: str) -> Tuple[int, bool]:
    """Return (days, matched_by_rule)."""
    if not name:
        return 7, False
    n = name.lower()

    # Dairy
    if _contains(n, "牛奶", "milk"):
        return 7, True
    if _contains(n, "酸奶", "yogurt"):
        return 14, True
    if _contains(n, "奶酪", "芝士", "cheese"):
        return 14, True

    # Meat / seafood (fresh, refrigerated)
    if _contains(n, "鸡胸", "鸡腿", "chicken") or ("鸡" in n and not _contains(n, "蛋")):
        return 3, True
    if _contains(n, "牛肉", "beef", "steak"):
        return 3, True
    if _contains(n, "猪肉", "pork"):
        return 3, True
    if _contains(n, "鱼", "fish", "虾", "shrimp"):
        return 2, True
    if _contains(n, "豆腐", "tofu"):
        return 3, True

    # Eggs
    if _contains(n, "鸡蛋", "egg"):
        return 21, True

    # Bakery
    if _contains(n, "面包", "bread", "吐司", "bun"):
        return 3, True

    # Produce
    if _contains(n, "生菜", "菠菜", "leaf", "lettuce", "spinach"):
        return 3, True
    if _contains(n, "香蕉", "banana"):
        return 3, True
    if _contains(n, "苹果", "apple"):
        return 14, True
    if _contains(n, "橙", "橘", "柑", "橘子", "橙子", "orange", "citrus"):
        return 14, True
    if _contains(n, "番茄", "西红柿", "tomato"):
        return 5, True
    if _contains(n, "土豆", "马铃薯", "potato"):
        return 21, True
    if _contains(n, "洋葱", "onion"):
        return 21, True

    # Pantry staples (long)
    if _contains(n, "大米", "米", "rice"):
        return 180, True
    if _contains(n, "面粉", "flour", "pasta", "意面"):
        return 180, True
    if _contains(n, "油", "oil"):
        return 180, True
    if _contains(n, "罐头", "canned"):
        return 365, True

    return 7, False


def estimate_shelf_life_ai_days(name: str) -> int | None:
    """Ask the model to estimate shelf-life days; return None on failure."""
    try:
        from .client import call_json
    except Exception:
        return None

    schema = {
        "properties": {
            "days": {"type": "integer"},
            "reason": {"type": "string"},
        },
        "required": ["days"],
    }
    prompt = (
        "Estimate edible shelf-life days (integer) for the given ingredient under common home storage. "
        "If likely refrigerated, assume fridge; if pantry-stable (rice/oil/canned, etc.), return longer days. "
        "Output JSON only (include days and a short reason). Item: " + str(name)
    )
    try:
        data = call_json(prompt, schema)
        days = int(data.get("days"))
        max_days = int(os.getenv("SHELF_LIFE_AI_MAX_DAYS", "365"))
        if 1 <= days <= max_days:
            return days
    except Exception:
        return None
    return None


def estimate_days(name: str) -> int:
    days, matched = _rule_days(name)
    if matched:
        return days
    ai_days = estimate_shelf_life_ai_days(name)
    return ai_days or days  # fallback to rule default (7)


def estimate_expiry_date(name: str, today: date | None = None) -> str:
    base = today or date.today()
    return (base + timedelta(days=estimate_days(name))).isoformat()
