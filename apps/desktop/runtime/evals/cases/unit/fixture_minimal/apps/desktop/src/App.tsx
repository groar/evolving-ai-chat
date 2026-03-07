// Minimal fixture for evals/cases/unit patch_applies_cleanly (good.diff).
// Line 20–25 must match good.diff context exactly.
// (19 placeholder lines so hunk line numbers align)
# 1
# 2
# 3
# 4
# 5
# 6
# 7
# 8
# 9
# 10
# 11
# 12
# 13
# 14
# 15
# 16
# 17
# 18
# 19
import type { RuntimeIssue } from "./stores/runtimeStore";

const appName = "Evolving AI Chat — your personal assistant";
const diagnosticsFlagKey = "show_runtime_diagnostics";

export { offlineStateRetryIntervalMs, shouldAutoRetryOfflineState };
