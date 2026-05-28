#!/usr/bin/env python3
"""Build the official tourism behavior aggregate used by analytics-server.

The source workbook contains row-level tourist behavior. This script only emits
aggregate, de-identified metrics for the admin dashboard and recommendation
priors. It intentionally excludes tourist_id, user_nickname and
attraction_content.
"""

from __future__ import annotations

import argparse
import json
from collections import Counter, defaultdict
from datetime import date, datetime, timezone
from pathlib import Path
from statistics import mean
from typing import Any

from openpyxl import load_workbook


DEFAULT_SOURCE = Path("/Users/MR/Desktop/软件杯/示范景区公开资料包/景点景区旅游数据行为分析数据.xlsx")
DEFAULT_OUTPUT = Path("src/main/resources/official-behavior/official-behavior-v1.json")

COST_FIELDS = [
    ("ticket_cost", "门票"),
    ("food_cost", "餐饮"),
    ("shopping_cost", "购物"),
    ("transport_cost", "交通"),
    ("entertainment_cost", "娱乐"),
]

SOURCE_LABEL = "官方历史样本"
DISCLAIMER = "该数据来自官方示范景区历史行为样本，用作行业基线与推荐先验，不代表灵山实时客流。"


def age_band(age: float | None) -> str:
    if age is None:
        return "未知"
    if age <= 17:
        return "<=17"
    if age <= 24:
        return "18-24"
    if age <= 34:
        return "25-34"
    if age <= 44:
        return "35-44"
    if age <= 59:
        return "45-59"
    return "60+"


def group_size_band(size: float | None) -> str:
    if size is None:
        return "未知"
    if size <= 1:
        return "单人"
    if size == 2:
        return "双人"
    if size <= 4:
        return "3-4人"
    return "5人+"


def normalize_gender(gender: Any) -> str:
    text = str(gender or "").strip()
    if text in {"男", "male", "Male", "M"}:
        return "男"
    if text in {"女", "female", "Female", "F"}:
        return "女"
    return "未知"


def to_date(value: Any) -> date | None:
    if isinstance(value, datetime):
        return value.date()
    if isinstance(value, date):
        return value
    if isinstance(value, str) and value.strip():
        try:
            return datetime.fromisoformat(value.strip()).date()
        except ValueError:
            return None
    return None


def number(value: Any) -> float | None:
    if isinstance(value, bool) or value is None:
        return None
    if isinstance(value, (int, float)):
        return float(value)
    if isinstance(value, str):
        try:
            return float(value.strip())
        except ValueError:
            return None
    return None


def ratio(count: int, total: int) -> float:
    return round(count / total, 4) if total else 0.0


def round2(value: float) -> float:
    return round(value, 2)


def percentile(values: list[float], pct: float) -> float:
    if not values:
        return 0.0
    ordered = sorted(values)
    if len(ordered) == 1:
        return ordered[0]
    pos = (len(ordered) - 1) * pct
    lower = int(pos)
    upper = min(lower + 1, len(ordered) - 1)
    weight = pos - lower
    return ordered[lower] * (1 - weight) + ordered[upper] * weight


def clipped(value: float | None, low: float, high: float) -> float:
    if value is None:
        return 0.0
    return min(max(value, low), high)


def distribution(counter: Counter[str], total: int) -> list[dict[str, Any]]:
    return [
        {"label": label, "count": count, "ratio": ratio(count, total)}
        for label, count in counter.most_common()
    ]


def average(values: list[float]) -> float:
    return round2(mean(values)) if values else 0.0


def build(source: Path) -> dict[str, Any]:
    wb = load_workbook(source, read_only=True, data_only=True)
    ws = wb.active
    headers = [cell.value for cell in next(ws.iter_rows(min_row=1, max_row=1))]
    index = {name: pos for pos, name in enumerate(headers)}

    records: list[dict[str, Any]] = []
    total_cost_values: list[float] = []
    component_values: dict[str, list[float]] = {field: [] for field, _ in COST_FIELDS}
    negative_cost_rows = 0
    cost_mismatch_rows = 0

    for row in ws.iter_rows(min_row=2, values_only=True):
        visit_date = to_date(row[index["visit_date"]])
        attraction_type = str(row[index["attraction_type"]] or "未知").strip() or "未知"
        sat = number(row[index["satisfaction"]])
        stay_hours = number(row[index["stay_duration"]])
        total_cost = number(row[index["total_cost"]])
        age = number(row[index["age"]])
        group_size = number(row[index["group_size"]])
        gender = normalize_gender(row[index["gender"]])
        costs = {field: number(row[index[field]]) for field, _ in COST_FIELDS}

        if total_cost is not None:
            total_cost_values.append(total_cost)
        for field, value in costs.items():
            if value is not None:
                component_values[field].append(value)

        row_has_negative = any((value or 0) < 0 for value in [total_cost, *costs.values()])
        if row_has_negative:
            negative_cost_rows += 1
        component_sum = sum(value or 0.0 for value in costs.values())
        if total_cost is not None and abs(component_sum - total_cost) > 0.01:
            cost_mismatch_rows += 1

        records.append({
            "date": visit_date,
            "month": visit_date.strftime("%Y-%m") if visit_date else "未知",
            "weekday": visit_date.isoweekday() if visit_date else 0,
            "type": attraction_type,
            "ageBand": age_band(age),
            "gender": gender,
            "groupSizeBand": group_size_band(group_size),
            "satisfaction": sat,
            "stayHours": stay_hours,
            "totalCost": total_cost,
            "costs": costs,
        })

    sample_count = len(records)
    dates = [record["date"] for record in records if record["date"] is not None]
    raw_satisfaction = [record["satisfaction"] for record in records if record["satisfaction"] is not None]
    raw_sat_min = min(raw_satisfaction) if raw_satisfaction else 0.0
    raw_sat_max = max(raw_satisfaction) if raw_satisfaction else 5.0

    def sat_norm(value: float | None) -> float:
        if value is None:
            return 0.0
        if raw_sat_max <= 5:
            return round2(value * 20.0)
        if raw_sat_max <= 10:
            return round2(value * 10.0)
        return round2(value)

    total_low = percentile(total_cost_values, 0.01)
    total_high = percentile(total_cost_values, 0.99)
    component_clip = {
        field: (percentile(values, 0.01), percentile(values, 0.99))
        for field, values in component_values.items()
    }

    age_counter: Counter[str] = Counter()
    gender_counter: Counter[str] = Counter()
    group_counter: Counter[str] = Counter()
    type_rows: dict[str, list[dict[str, Any]]] = defaultdict(list)
    month_rows: dict[str, list[dict[str, Any]]] = defaultdict(list)
    weekday_counter: Counter[str] = Counter()
    sat_counter: Counter[str] = Counter()
    cost_totals = {field: 0.0 for field, _ in COST_FIELDS}

    for record in records:
        age_counter[record["ageBand"]] += 1
        gender_counter[record["gender"]] += 1
        group_counter[record["groupSizeBand"]] += 1
        type_rows[record["type"]].append(record)
        month_rows[record["month"]].append(record)
        weekday_counter[str(record["weekday"])] += 1
        if record["satisfaction"] is not None:
            sat_counter[str(int(record["satisfaction"]))] += 1
        for field, _ in COST_FIELDS:
            low, high = component_clip[field]
            cost_totals[field] += clipped(record["costs"][field], low, high)

    max_type_count = max((len(rows) for rows in type_rows.values()), default=1)
    type_stats = []
    for attraction_type, rows in type_rows.items():
        sat_values = [sat_norm(row["satisfaction"]) for row in rows if row["satisfaction"] is not None]
        stay_values = [row["stayHours"] for row in rows if row["stayHours"] is not None]
        spend_values = [clipped(row["totalCost"], total_low, total_high) for row in rows if row["totalCost"] is not None]
        count = len(rows)
        type_stats.append({
            "type": attraction_type,
            "visitCount": count,
            "visitRatio": ratio(count, sample_count),
            "heatIndex": round2(count / max_type_count * 100),
            "avgSatisfaction": average(sat_values),
            "avgStayHours": average(stay_values),
            "avgSpend": average(spend_values),
            "sampleSize": count,
        })
    type_stats.sort(key=lambda item: (-item["visitCount"], item["type"]))

    total_component_sum = sum(cost_totals.values()) or 1.0
    cost_mix = [
        {
            "category": field,
            "label": label,
            "total": round2(total),
            "avg": round2(total / sample_count) if sample_count else 0.0,
            "share": round(total / total_component_sum, 4),
        }
        for field, label in COST_FIELDS
        for total in [cost_totals[field]]
    ]

    month_stats = []
    for month, rows in sorted(month_rows.items()):
        month_stats.append({
            "month": month,
            "visitCount": len(rows),
            "avgSatisfaction": average([sat_norm(row["satisfaction"]) for row in rows if row["satisfaction"] is not None]),
            "avgSpend": average([clipped(row["totalCost"], total_low, total_high) for row in rows if row["totalCost"] is not None]),
        })

    low_satisfaction = [
        {
            "type": item["type"],
            "avgSatisfaction": item["avgSatisfaction"],
            "sampleSize": item["sampleSize"],
            "reason": "历史样本满意度低于整体均值，适合作为运营关注类型。",
        }
        for item in sorted(type_stats, key=lambda row: (row["avgSatisfaction"], -row["sampleSize"]))[:5]
    ]

    default_priors = [
        {
            "type": item["type"],
            "satPrior": item["avgSatisfaction"],
            "heatPrior": item["heatIndex"],
            "segmentPrior": round2((item["avgSatisfaction"] * 0.6) + (item["heatIndex"] * 0.4)),
            "avgStayHours": item["avgStayHours"],
            "avgSpend": item["avgSpend"],
            "sampleSize": item["sampleSize"],
        }
        for item in type_stats
    ]

    by_segment = []
    segment_rows: dict[tuple[str, str], list[dict[str, Any]]] = defaultdict(list)
    for record in records:
        segment_rows[(record["ageBand"], record["groupSizeBand"])].append(record)
    for (age, group), rows in sorted(segment_rows.items(), key=lambda item: -len(item[1]))[:12]:
        type_counts = Counter(row["type"] for row in rows)
        priors = []
        for attraction_type, count in type_counts.most_common(5):
            rows_for_type = [row for row in rows if row["type"] == attraction_type]
            priors.append({
                "type": attraction_type,
                "segmentPrior": round2(count / len(rows) * 100),
                "satPrior": average([sat_norm(row["satisfaction"]) for row in rows_for_type if row["satisfaction"] is not None]),
                "heatPrior": round2(count / max(1, len(rows)) * 100),
                "sampleSize": count,
            })
        by_segment.append({
            "segmentKey": f"{age}|{group}",
            "ageBand": age,
            "groupSizeBand": group,
            "sampleSize": len(rows),
            "priors": priors,
        })

    meta = {
        "sourceLabel": SOURCE_LABEL,
        "sourceType": "official_behavior_excel",
        "generatedAt": datetime.now(timezone.utc).replace(microsecond=0).isoformat(),
        "disclaimer": DISCLAIMER,
        "recordCount": sample_count,
        "dateRange": {
            "start": min(dates).isoformat() if dates else None,
            "end": max(dates).isoformat() if dates else None,
            "dayCount": len(set(dates)),
        },
    }

    return {
        "sourceMeta": meta,
        "summary": {
            **meta,
            "sampleCount": sample_count,
            "attractionTypeCount": len(type_rows),
            "avgSatisfaction": average([sat_norm(value) for value in raw_satisfaction]),
            "avgStayHours": average([record["stayHours"] for record in records if record["stayHours"] is not None]),
            "avgSpend": average([clipped(value, total_low, total_high) for value in total_cost_values]),
            "satisfactionScale": {"rawMin": raw_sat_min, "rawMax": raw_sat_max, "normalizedTo": "0-100"},
            "stayDurationUnit": "hour",
            "dataQuality": {
                "totalRows": sample_count,
                "negativeCostRows": negative_cost_rows,
                "costMismatchRows": cost_mismatch_rows,
                "costMismatchRatio": ratio(cost_mismatch_rows, sample_count),
                "totalCostClip": {"p1": round2(total_low), "p99": round2(total_high)},
            },
        },
        "demographics": {
            "sourceLabel": SOURCE_LABEL,
            "disclaimer": DISCLAIMER,
            "ageBands": distribution(age_counter, sample_count),
            "genderDistribution": distribution(gender_counter, sample_count),
            "groupSizeBands": distribution(group_counter, sample_count),
        },
        "attractionTypes": {
            "sourceLabel": SOURCE_LABEL,
            "disclaimer": DISCLAIMER,
            "items": type_stats,
        },
        "satisfaction": {
            "sourceLabel": SOURCE_LABEL,
            "disclaimer": DISCLAIMER,
            "overallSat": average([sat_norm(value) for value in raw_satisfaction]),
            "distribution": [
                {"score": int(score), "normalizedScore": sat_norm(float(score)), "count": count, "ratio": ratio(count, sample_count)}
                for score, count in sorted(sat_counter.items(), key=lambda item: int(item[0]))
            ],
            "satByType": sorted(
                [{"type": item["type"], "avgSatisfaction": item["avgSatisfaction"], "sampleSize": item["sampleSize"]} for item in type_stats],
                key=lambda item: (-item["avgSatisfaction"], -item["sampleSize"]),
            ),
            "lowSatWarnings": low_satisfaction,
        },
        "spending": {
            "sourceLabel": SOURCE_LABEL,
            "disclaimer": DISCLAIMER,
            "avgTotalCost": average([clipped(value, total_low, total_high) for value in total_cost_values]),
            "costMix": cost_mix,
            "avgCostByType": [
                {"type": item["type"], "avgSpend": item["avgSpend"], "sampleSize": item["sampleSize"]}
                for item in type_stats
            ],
            "dataQuality": {
                "costMismatchRows": cost_mismatch_rows,
                "costMismatchRatio": ratio(cost_mismatch_rows, sample_count),
                "note": "图表使用 P1-P99 裁剪值，避免极端消费影响展示。",
            },
        },
        "trends": {
            "sourceLabel": SOURCE_LABEL,
            "disclaimer": DISCLAIMER,
            "visitsByMonth": [{"month": row["month"], "visitCount": row["visitCount"]} for row in month_stats],
            "satisfactionByMonth": [{"month": row["month"], "avgSatisfaction": row["avgSatisfaction"]} for row in month_stats],
            "spendByMonth": [{"month": row["month"], "avgSpend": row["avgSpend"]} for row in month_stats],
            "weekdayDistribution": [
                {"weekday": int(day), "count": count, "ratio": ratio(count, sample_count)}
                for day, count in sorted(weekday_counter.items(), key=lambda item: int(item[0]))
                if int(day) > 0
            ],
        },
        "recommendationPriors": {
            "sourceLabel": SOURCE_LABEL,
            "disclaimer": DISCLAIMER,
            "defaultPriors": default_priors,
            "bySegment": by_segment,
        },
    }


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--source", type=Path, default=DEFAULT_SOURCE)
    parser.add_argument("--output", type=Path, default=DEFAULT_OUTPUT)
    args = parser.parse_args()
    data = build(args.source)
    args.output.parent.mkdir(parents=True, exist_ok=True)
    args.output.write_text(json.dumps(data, ensure_ascii=False, indent=2), encoding="utf-8")
    print(f"wrote {args.output} ({data['summary']['sampleCount']} rows)")


if __name__ == "__main__":
    main()
