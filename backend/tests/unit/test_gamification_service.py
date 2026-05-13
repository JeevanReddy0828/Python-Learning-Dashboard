"""Unit tests for gamification_service — XP, levels, achievements."""

import pytest
from app.services.gamification_service import compute_level, xp_to_next_level, XP_PER_LEVEL


class TestComputeLevel:
    def test_zero_xp_is_level_1(self):
        assert compute_level(0) == 1

    def test_one_xp_is_level_1(self):
        assert compute_level(1) == 1

    def test_just_below_level_2_threshold(self):
        # Level 2 threshold is 100
        assert compute_level(99) == 1

    def test_at_level_2_threshold(self):
        assert compute_level(100) == 2

    def test_at_each_threshold(self):
        # XP_PER_LEVEL[n] is the XP needed to reach level n+1.
        # Stop before the last entry: reaching the final table threshold => level 10,
        # not level 11 (the formula only kicks in *beyond* the table).
        for level, threshold in enumerate(XP_PER_LEVEL[1:-1], start=1):
            assert compute_level(threshold) == level + 1

    def test_max_defined_level(self):
        # At the last defined threshold, should be level 10
        assert compute_level(XP_PER_LEVEL[-1]) == 10

    def test_beyond_level_10_formula(self):
        # Extra XP beyond 7500: every 2000 XP = 1 level
        assert compute_level(XP_PER_LEVEL[-1] + 2000) == 11
        assert compute_level(XP_PER_LEVEL[-1] + 4000) == 12

    def test_very_high_xp(self):
        result = compute_level(XP_PER_LEVEL[-1] + 100_000)
        assert result > 10

    def test_negative_xp_handled_gracefully(self):
        # Should not crash, returns at least 1
        assert compute_level(-100) >= 1

    def test_level_increases_monotonically(self):
        levels = [compute_level(xp) for xp in range(0, 10000, 50)]
        for i in range(1, len(levels)):
            assert levels[i] >= levels[i - 1]


class TestXpToNextLevel:
    def test_level_1_next_is_100(self):
        assert xp_to_next_level(1) == XP_PER_LEVEL[1]

    def test_each_level_within_table(self):
        for level in range(1, len(XP_PER_LEVEL)):
            assert xp_to_next_level(level) == XP_PER_LEVEL[level]

    def test_level_10_is_last_table_entry(self):
        # Level 10 is still inside the XP_PER_LEVEL table (index 10), so it
        # returns the table value, not a formula value.
        result = xp_to_next_level(10)
        assert result == XP_PER_LEVEL[-1]

    def test_level_11_uses_formula(self):
        result = xp_to_next_level(11)
        assert result == XP_PER_LEVEL[-1] + 4000

    def test_next_level_always_greater_than_current(self):
        for level in range(1, 15):
            assert xp_to_next_level(level) > xp_to_next_level(level - 1) if level > 1 else True


class TestCheckTestCases:
    """check_test_cases is a pure function — no DB needed."""

    from app.services.code_execution_service import check_test_cases

    def test_empty_test_cases_auto_pass(self):
        from app.services.code_execution_service import check_test_cases
        passed, msg = check_test_cases("anything", [])
        assert passed is True

    def test_matching_output_passes(self):
        from app.services.code_execution_service import check_test_cases
        passed, msg = check_test_cases("hello", [{"expected_output": "hello"}])
        assert passed is True
        assert "passed" in msg.lower()

    def test_mismatched_output_fails(self):
        from app.services.code_execution_service import check_test_cases
        passed, msg = check_test_cases("world", [{"expected_output": "hello"}])
        assert passed is False
        assert "hello" in msg

    def test_strips_whitespace_before_compare(self):
        from app.services.code_execution_service import check_test_cases
        passed, _ = check_test_cases("  hello  ", [{"expected_output": "hello"}])
        assert passed is True

    def test_first_failing_case_short_circuits(self):
        from app.services.code_execution_service import check_test_cases
        cases = [
            {"expected_output": "wrong"},  # fails
            {"expected_output": "ok"},
        ]
        passed, msg = check_test_cases("ok", cases)
        assert passed is False

    def test_multiline_output(self):
        from app.services.code_execution_service import check_test_cases
        passed, _ = check_test_cases("1\n2\n3", [{"expected_output": "1\n2\n3"}])
        assert passed is True

    def test_missing_expected_key_treated_as_empty(self):
        from app.services.code_execution_service import check_test_cases
        passed, _ = check_test_cases("", [{}])
        assert passed is True  # "" == "" after strip
