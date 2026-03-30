"""
Lightweight in-process monitoring for AI pipelines.
"""

from collections import defaultdict, deque
from dataclasses import dataclass
from time import perf_counter
from typing import Any, Deque, Dict


@dataclass
class TimerContext:
    monitor: "AIMonitor"
    stage: str
    start: float

    def stop(self, success: bool = True) -> None:
        elapsed_ms = (perf_counter() - self.start) * 1000.0
        self.monitor.record_stage(self.stage, elapsed_ms, success=success)


class AIMonitor:
    def __init__(self, maxlen: int = 500):
        self.maxlen = maxlen
        self.stage_latencies: Dict[str, Deque[float]] = defaultdict(lambda: deque(maxlen=maxlen))
        self.stage_failures: Dict[str, int] = defaultdict(int)
        self.stage_calls: Dict[str, int] = defaultdict(int)
        self.threshold_drift: Dict[str, Deque[float]] = defaultdict(lambda: deque(maxlen=maxlen))

    def start_timer(self, stage: str) -> TimerContext:
        return TimerContext(monitor=self, stage=stage, start=perf_counter())

    def record_stage(self, stage: str, latency_ms: float, success: bool = True) -> None:
        self.stage_calls[stage] += 1
        self.stage_latencies[stage].append(float(latency_ms))
        if not success:
            self.stage_failures[stage] += 1

    def record_drift(self, metric_name: str, value: float) -> None:
        self.threshold_drift[metric_name].append(float(value))

    def snapshot(self) -> Dict[str, Any]:
        stages = {}
        for stage, latencies in self.stage_latencies.items():
            values = list(latencies)
            count = len(values)
            avg = sum(values) / count if count else 0.0
            failure_rate = (
                self.stage_failures[stage] / self.stage_calls[stage]
                if self.stage_calls[stage] else 0.0
            )
            stages[stage] = {
                "calls": self.stage_calls[stage],
                "avg_latency_ms": round(avg, 2),
                "failure_rate": round(failure_rate, 4),
            }

        drift = {}
        for metric, vals in self.threshold_drift.items():
            arr = list(vals)
            drift[metric] = {
                "samples": len(arr),
                "latest": arr[-1] if arr else None,
                "avg": (sum(arr) / len(arr)) if arr else None,
            }

        return {"stages": stages, "drift": drift}

