"""
Explainability summary builder.
"""

from typing import Any, Dict, List


def build_explainability_report(
    fused_result: Dict[str, Any],
    component_outputs: Dict[str, Dict[str, Any]],
) -> Dict[str, Any]:
    reasons: List[str] = []
    for name, data in component_outputs.items():
        conf = float(data.get("confidence", 0.0))
        if conf >= 0.75:
            reasons.append(f"{name}: strong confidence ({conf:.2f})")
        elif conf >= 0.45:
            reasons.append(f"{name}: moderate confidence ({conf:.2f})")
        else:
            reasons.append(f"{name}: weak confidence ({conf:.2f})")

    return {
        "success": True,
        "decision": fused_result.get("decision", "review"),
        "fused_confidence": fused_result.get("fused_confidence", 0.0),
        "reasons": reasons,
        "trace": {
            "component_confidence": fused_result.get("component_confidence", {}),
        },
    }

