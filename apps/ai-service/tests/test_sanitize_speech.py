"""Unit tests for the speech sanitization utility in the video processor."""
import sys
import os
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..'))

from processors.video import VideoProcessor


# Create a minimal instance just to access _sanitize_for_speech
class TestSanitizeForSpeech:
    def setup_method(self):
        self.sanitize = VideoProcessor.__new__(VideoProcessor)._sanitize_for_speech

    def test_f_equals_ma(self):
        assert "F equals m times a" in self.sanitize("F = ma")

    def test_e_equals_mc_squared(self):
        assert "E equals m c squared" in self.sanitize("E = mc²")

    def test_e_equals_mc_caret_2(self):
        assert "E equals m c squared" in self.sanitize("E = mc^2")

    def test_squared_symbol(self):
        result = self.sanitize("m/s²")
        assert "squared" in result

    def test_cubed_symbol(self):
        result = self.sanitize("m³")
        assert "cubed" in result

    def test_delta(self):
        result = self.sanitize("Δx")
        assert "delta" in result.lower()

    def test_pi(self):
        result = self.sanitize("2π")
        assert "pi" in result

    def test_greater_than_or_equal(self):
        result = self.sanitize("x ≥ 5")
        assert "greater than or equal to" in result

    def test_less_than_or_equal(self):
        result = self.sanitize("x ≤ 5")
        assert "less than or equal to" in result

    def test_not_equal(self):
        result = self.sanitize("x ≠ 0")
        assert "not equal to" in result

    def test_strips_markdown_bold(self):
        assert self.sanitize("**force**") == "force"

    def test_strips_markdown_headers(self):
        result = self.sanitize("## Introduction")
        assert "#" not in result

    def test_strips_inline_code(self):
        assert self.sanitize("`F = ma`") == "F equals m times a"

    def test_plain_text_unchanged(self):
        text = "The ball moves forward"
        assert self.sanitize(text) == text

    def test_generic_multiplication(self):
        result = self.sanitize("a = b * c")
        assert "equals" in result
        assert "times" in result

    def test_generic_division(self):
        result = self.sanitize("v = d / t")
        assert "equals" in result
        assert "divided by" in result
