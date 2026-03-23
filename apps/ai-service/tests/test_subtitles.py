"""Unit tests for ASS subtitle generation."""
import sys
import os
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..'))

from processors.video import VideoProcessor


class TestASSFormatting:
    def setup_method(self):
        self.processor = VideoProcessor.__new__(VideoProcessor)

    def test_format_ass_time_zero(self):
        assert self.processor._format_ass_time(0.0) == "0:00:00.00"

    def test_format_ass_time_seconds(self):
        assert self.processor._format_ass_time(5.5) == "0:00:05.50"

    def test_format_ass_time_minutes(self):
        assert self.processor._format_ass_time(65.25) == "0:01:05.25"

    def test_format_ass_time_hours(self):
        assert self.processor._format_ass_time(3661.0) == "1:01:01.00"

    def test_build_ass_has_header(self):
        groups = [{"start": 0.0, "end": 2.0, "text": "Hello world"}]
        ass = self.processor._build_ass(groups)
        assert "[Script Info]" in ass
        assert "[V4+ Styles]" in ass
        assert "[Events]" in ass

    def test_build_ass_has_dialogue_lines(self):
        groups = [
            {"start": 0.0, "end": 2.0, "text": "First subtitle"},
            {"start": 2.5, "end": 5.0, "text": "Second subtitle"},
        ]
        ass = self.processor._build_ass(groups)
        assert "Dialogue:" in ass
        assert "First subtitle" in ass
        assert "Second subtitle" in ass
        assert ass.count("Dialogue:") == 2

    def test_build_ass_timing_format(self):
        groups = [{"start": 1.5, "end": 3.75, "text": "Test"}]
        ass = self.processor._build_ass(groups)
        assert "0:00:01.50" in ass
        assert "0:00:03.75" in ass

    def test_build_ass_font_size_44(self):
        """Subtitle font size should be 44 (doubled from original 22)."""
        groups = [{"start": 0.0, "end": 1.0, "text": "Test"}]
        ass = self.processor._build_ass(groups)
        assert "Arial,44," in ass

    def test_build_ass_empty_groups(self):
        ass = self.processor._build_ass([])
        assert "[Script Info]" in ass
        assert "Dialogue:" not in ass

    def test_newlines_replaced(self):
        groups = [{"start": 0.0, "end": 1.0, "text": "Line one\nLine two"}]
        ass = self.processor._build_ass(groups)
        assert "\\N" in ass
        assert "\n" not in ass.split("Dialogue:")[1].split("\\N")[0]
