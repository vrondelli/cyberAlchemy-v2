"""EVF verification-tier enforcement candidate."""

from .kernel import evaluate

__all__ = ["evaluate"]
from .compatibility import evaluate_tde_compatibility
from .kernel import digest_value, evaluate

__all__ = ["digest_value", "evaluate", "evaluate_tde_compatibility"]
