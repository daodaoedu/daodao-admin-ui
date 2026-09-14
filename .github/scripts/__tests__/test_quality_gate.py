import os
from pathlib import Path
import subprocess
import tempfile
import unittest

import yaml


ROOT = Path(__file__).resolve().parents[3]


class QualityGateTest(unittest.TestCase):
    def test_checks_run_and_failures_stop_the_job(self):
        job = yaml.safe_load((ROOT / ".github/workflows/ci.yml").read_text())["jobs"]["ci"]
        self.assertFalse(job.get("continue-on-error", False))
        steps = [
            step for step in job["steps"]
            if "run" in step and any(
                command in step["run"]
                for command in ("pnpm lint", "pnpm exec tsc", "pnpm run typecheck", "pnpm test")
            )
        ]
        self.assertTrue(any("pnpm test" in step["run"] for step in steps),
                        "CI must execute the existing test suite")
        with tempfile.TemporaryDirectory() as directory:
            temp = Path(directory)
            shim = temp / "pnpm"
            shim.write_text(
                '#!/bin/bash\n'
                'printf "%s\\n" "$*" >> "$CHECK_LOG"\n'
                'if [[ "$*" == "$FAIL_COMMAND" ]]; then exit 37; fi\n'
            )
            shim.chmod(0o755)
            commands = ["test", "run typecheck"]
            if any("pnpm lint" in step["run"] for step in steps):
                commands = ["lint", "exec tsc --noEmit", "test"]
            for failed in ["", *commands]:
                with self.subTest(failed=failed or "none"):
                    log = temp / "checks.log"
                    log.unlink(missing_ok=True)
                    result = None
                    for step in steps:
                        self.assertNotIn("if", step, "Quality checks must not be conditional")
                        self.assertFalse(step.get("continue-on-error", False))
                        result = subprocess.run(
                            ["bash", "--noprofile", "--norc", "-eo", "pipefail", "-c", step["run"]],
                            cwd=ROOT, capture_output=True, text=True,
                            env={**os.environ, "PATH": f"{temp}:{os.environ['PATH']}",
                                 "CHECK_LOG": str(log), "FAIL_COMMAND": failed},
                        )
                        if result.returncode:
                            break
                    self.assertIsNotNone(result)
                    self.assertEqual(result.returncode == 0, not bool(failed),
                                     result.stdout + result.stderr)
                    called = log.read_text().splitlines()
                    if failed:
                        self.assertIn(failed, called)
                    else:
                        self.assertCountEqual(called, commands)


if __name__ == "__main__":
    unittest.main()

class TestBenchmarkEnforcementAcceptance(unittest.TestCase):
    def test_required_check_blocks_failure(self):

        self.fail("intentional benchmark enforcement acceptance failure")
