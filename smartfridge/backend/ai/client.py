import json
import os
from dataclasses import dataclass
from typing import Any, Dict
import re
from datetime import date, timedelta

from openai import OpenAI


def _client() -> OpenAI:
    api_key = os.getenv("OPENAI_API_KEY")
    if not api_key:
        raise RuntimeError("OPENAI_API_KEY is not set in environment")
    base_url = os.getenv("OPENAI_BASE_URL")
    kwargs = {"api_key": api_key}
    if base_url:
        kwargs["base_url"] = base_url
    return OpenAI(**kwargs)


def _model() -> str:
    return os.getenv("OPENAI_MODEL", "gpt-4o-mini")


def call_json(input_text: str, schema: Dict[str, Any], temperature: float = 0.3) -> Dict[str, Any]:
    client = _client()
    max_tokens = int(os.getenv("OPENAI_MAX_OUTPUT_TOKENS", "1200"))

    try:
        response = client.responses.create(
            model=_model(),
            input=input_text,
            temperature=temperature,
            max_output_tokens=max_tokens,
            response_format={
                "type": "json_schema",
                "json_schema": {
                    "name": "result",
                    "schema": {"type": "object", **schema},
                },
            },
        )
        text = response.output_text
    except TypeError:
        # Older SDKs may not support response_format; fall back to instruction-only JSON
        schema_text = json.dumps({"type": "object", **schema}, ensure_ascii=False)
        fallback_prompt = input_text + "\n\n严格只输出一个 JSON 对象，必须完全符合下面的 JSON Schema，不要输出额外说明：\n" + schema_text
        response = client.responses.create(
            model=_model(),
            input=fallback_prompt,
            temperature=temperature,
        )
        text = response.output_text

    try:
        return json.loads(text)
    except Exception:
        # 有些模型会返回 ```json 包裹
        try:
            import re
            m = re.search(r"```json\s*(\{[\s\S]*?\})\s*```", text)
            if m:
                return json.loads(m.group(1))
        except Exception:
            pass
        return {"raw": text}


def _fmt_item_line(it: dict) -> str:
    name = it.get("name") or ""
    qty = it.get("quantity")
    unit = it.get("unit") or ""
    exp = it.get("expiry_date")
    if exp is not None:
        try:
            exp = exp.isoformat()  # datetime/date -> string
        except Exception:
            exp = str(exp)
        exp_str = f" 到期{exp}"
    else:
        exp_str = ""
    return f"- {name} {qty}{unit}{exp_str}"


def build_menu_prompt(inventory: list[dict], days: int, meals_per_day: int, language: str = "zh") -> str:
    names = ", ".join(sorted({i.get("name", "") for i in inventory if i.get("name")})) or "(无库存)"
    inv_text = "\n".join(_fmt_item_line(it) for it in inventory)
    return (
        f"你是一个家庭餐食规划助手。请基于给定库存，生成 {days} 天、每天 {meals_per_day} 餐的菜单。"
        f"要求输出结构化 JSON（严格遵守给定 schema），不要包含多余文本。"
        f"语言：{language}。\n\n"
        f"【当前库存（名称/数量/单位/到期）】\n" + inv_text +
        f"\n\n在保证尽量利用现有食材的前提下，给出每餐菜品、主要用料与估算用量；并给出需要补购的差额（按名称/数量/单位）。"
    )


MENU_SCHEMA: Dict[str, Any] = {
    "properties": {
        "days": {"type": "integer"},
        "meals_per_day": {"type": "integer"},
        "plan": {
            "type": "array",
            "items": {
                "type": "object",
                "properties": {
                    "day": {"type": "integer"},
                    "meals": {
                        "type": "array",
                        "items": {
                            "type": "object",
                            "properties": {
                                "name": {"type": "string"},
                                "ingredients": {
                                    "type": "array",
                                    "items": {
                                        "type": "object",
                                        "properties": {
                                            "name": {"type": "string"},
                                            "quantity": {"type": "number"},
                                            "unit": {"type": "string"},
                                        },
                                        "required": ["name"],
                                    },
                                },
                                "steps": {"type": "array", "items": {"type": "string"}},
                            },
                            "required": ["name"],
                        },
                    },
                },
                "required": ["day", "meals"],
            },
        },
        "shopping_diff": {
            "type": "array",
            "items": {
                "type": "object",
                "properties": {
                    "name": {"type": "string"},
                    "quantity": {"type": "number"},
                    "unit": {"type": "string"},
                },
                "required": ["name"],
            },
        },
    },
    "required": ["plan"],
}


PARSE_ITEMS_SCHEMA: Dict[str, Any] = {
    "properties": {
        "items": {
            "type": "array",
            "items": {
                "type": "object",
                "properties": {
                    "name": {"type": "string"},
                    "quantity": {"type": "number"},
                    "unit": {"type": "string"},
                    "expiry_date": {"type": "string"},
                },
                "required": ["name"],
            },
        }
    },
    "required": ["items"],
}


def generate_menu(inventory: list[dict], days: int = 1, meals_per_day: int = 2, language: str = "zh") -> Dict[str, Any]:
    prompt = build_menu_prompt(inventory, days, meals_per_day, language)
    return call_json(prompt, MENU_SCHEMA)


def _cn_to_number(fragment: str) -> float | None:
    mapping = {"零":0, "一":1, "二":2, "两":2, "三":3, "四":4, "五":5, "六":6, "七":7, "八":8, "九":9}
    if fragment == "半":
        return 0.5
    if fragment in mapping:
        return float(mapping[fragment])
    if fragment.startswith("十"):
        tail = fragment[1:]
        return 10.0 + (mapping.get(tail, 0) if tail else 0)
    if "十" in fragment:
        head, tail = fragment.split("十", 1)
        if head in mapping:
            return float(mapping[head] * 10 + mapping.get(tail, 0))
    return None


def _fallback_parse_items(text: str) -> list[dict]:
    units = [
        "kg", "g", "千克", "克", "斤", "两",
        "ml", "毫升", "l", "L",
        "个", "块", "杯", "片", "袋", "盒", "瓶", "根", "颗", "pcs",
    ]
    sep = re.compile(r"[\n,，、;；]+")
    items = []
    for raw in [s.strip() for s in sep.split(text) if s.strip()]:
        qty = None
        unit = None
        expiry: str | None = None
        m = re.search(r"(\d+(?:\.\d+)?)\s*([^\d\s]*)?", raw)
        if m:
            try:
                qty = float(m.group(1))
            except Exception:
                qty = None
            u = (m.group(2) or "").strip()
            if any(u.startswith(x) for x in units):
                unit = u
        if qty is None:
            m2 = re.search(r"([一二两三四五六七八九十半])\s*([%s])" % "|".join(units), raw)
            if m2:
                qty = _cn_to_number(m2.group(1)) or 1
                unit = m2.group(2)
        if qty is None:
            m3 = re.match(r"^([一二两三四五六七八九十半])+", raw)
            if m3:
                qty = _cn_to_number(m3.group(0)[0]) or 1
        if qty is None:
            qty = 1.0
        # expiry detection: 明天/后天/\d+天内/两天后/一周内 等
        # 1) digits: 3天内 / 3天后 / 7天
        m_days = re.search(r"(\d+)(?:\s*)天(?:内|后)?", raw)
        if m_days:
            days = int(m_days.group(1))
            expiry = (date.today() + timedelta(days=days)).isoformat()
        else:
            # 2) cn numerals: 三天内/两天后/十天
            m_days_cn = re.search(r"([一二两三四五六七八九十半]+)\s*天(?:内|后)?", raw)
            if m_days_cn:
                cn = m_days_cn.group(1)
                n = _cn_to_number(cn)
                if n is not None:
                    expiry = (date.today() + timedelta(days=int(n))).isoformat()
            else:
                # 3) 明天/后天/今天
                if "明天" in raw:
                    expiry = (date.today() + timedelta(days=1)).isoformat()
                elif "后天" in raw:
                    expiry = (date.today() + timedelta(days=2)).isoformat()
                elif "今天" in raw:
                    expiry = date.today().isoformat()
                else:
                    # 4) 一周内/两周内
                    m_weeks = re.search(r"([一二两三四五六七八九十半]|\d+)\s*周(?:内|后)?", raw)
                    if m_weeks:
                        token = m_weeks.group(1)
                        n = int(token) if token.isdigit() else (_cn_to_number(token) or 1)
                        expiry = (date.today() + timedelta(days=int(n)*7)).isoformat()
        name = re.sub(r"(\d+(?:\.\d+)?)|(" + "|".join(units) + ")|\s", "", raw)
        name = re.sub(r"[，、,;；]*", "", name).strip()
        if not name:
            continue
        item = {"name": name, "quantity": qty, "unit": unit or "pcs"}
        if expiry:
            item["expiry_date"] = expiry
        items.append(item)
    return items


def parse_items_from_text(text: str) -> Dict[str, Any]:
    prompt = (
        "将以下文本解析为入库条目数组。数量可为数字，单位如 g/ml/pcs。"\
        "尽量识别到期日（YYYY-MM-DD）。只输出 JSON（严格符合 schema）。\n\n" + text
    )
    try:
        res = call_json(prompt, PARSE_ITEMS_SCHEMA)
    except Exception:
        res = {}
    if not isinstance(res, dict) or "items" not in res:
        res = {"items": _fallback_parse_items(text)}
    return res


def build_shopping_prompt(inventory: list[dict], days: int = 3, language: str = "zh") -> str:
    inv_lines = "\n".join(_fmt_item_line(it) for it in inventory)
    return (
        f"请基于当前库存，给出未来 {days} 天需要补购的建议清单。"
        f"每条建议包含名称、建议数量、单位，以及一句理由。"
        f"注意避免与现有库存重复，优先补齐基础食材（米面油、蛋奶蔬果、常用调味）与能搭配当前库存的食材。"
        f"语言：{language}。只输出 JSON，遵循 schema。\n\n当前库存:\n{inv_lines}"
    )


SUGGEST_SHOPPING_SCHEMA: Dict[str, Any] = {
    "properties": {
        "suggestions": {
            "type": "array",
            "items": {
                "type": "object",
                "properties": {
                    "name": {"type": "string"},
                    "quantity": {"type": "number"},
                    "unit": {"type": "string"},
                    "reason": {"type": "string"},
                },
                "required": ["name"],
            },
        }
    },
    "required": ["suggestions"],
}


def suggest_shopping(inventory: list[dict], days: int = 3, language: str = "zh") -> Dict[str, Any]:
    prompt = build_shopping_prompt(inventory, days=days, language=language)
    return call_json(prompt, SUGGEST_SHOPPING_SCHEMA)


# Assistant decision: decide action + structured payload based on user message.
DECISION_SCHEMA: Dict[str, Any] = {
    "properties": {
        "action": {"type": "string", "enum": [
            "suggest_shopping",  # 基于库存给出补货建议（可含 items）
            "add_shopping",      # 解析文本，加入购物清单
            "import_inventory",  # 解析文本，直接入库
            "help"
        ]},
        "days": {"type": "integer"},
        "items": {
            "type": "array",
            "items": {
                "type": "object",
                "properties": {
                    "name": {"type": "string"},
                    "quantity": {"type": "number"},
                    "unit": {"type": "string"},
                    "expiry_date": {"type": "string"},
                },
                "required": ["name"],
            },
        },
        "reason": {"type": "string"},
    },
    "required": ["action"],
}


def build_assistant_prompt(message: str, inventory: list[dict], language: str = "zh") -> str:
    inv_lines = "\n".join(_fmt_item_line(it) for it in inventory)
    return (
        "你是家庭储藏与购物助手。你只能做三类动作，并必须以 JSON 结构化输出：\n"
        "1) suggest_shopping：基于库存给出未来几天的补货建议（可含 items）。\n"
        "2) add_shopping：把用户文本解析为购物清单条目（items）。\n"
        "3) import_inventory：把用户文本解析为直接入库条目（items）。\n"
        "始终在 action、items、days、reason 中输出。不要包含多余自然语言。\n\n"
        f"当前库存：\n{inv_lines}\n\n用户请求：\n{message}"
    )


def decide_action(message: str, inventory: list[dict], language: str = "zh") -> Dict[str, Any]:
    prompt = build_assistant_prompt(message, inventory, language)
    return call_json(prompt, DECISION_SCHEMA)
