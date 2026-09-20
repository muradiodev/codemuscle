from collections import defaultdict

from app.saas.models import UsageRecord


def aggregate_usage(records: list[UsageRecord]) -> dict[str, int]:
    totals: dict[str, int] = defaultdict(int)
    for record in records:
        totals[record.feature] += record.quantity
    return dict(sorted(totals.items()))


def exceeds_limit(records: list[UsageRecord], feature: str, limit: int) -> bool:
    consumed = sum(record.quantity for record in records if record.feature == feature)
    return consumed > limit
