"""Unit tests for the Bayesian Knowledge Tracing processor."""
import sys
import os
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..'))

from processors.knowledge_trace import KnowledgeTraceProcessor, ADAPTATION_THRESHOLD
from schemas.knowledge_trace import KnowledgeState


def make_state(p_known=0.3, p_learn=0.2, p_guess=0.25, p_slip=0.1):
    return KnowledgeState(p_known=p_known, p_learn=p_learn, p_guess=p_guess, p_slip=p_slip)


class TestBKTUpdate:
    """Test single-answer BKT updates."""

    def test_correct_answer_increases_p_known(self):
        processor = KnowledgeTraceProcessor()
        state = make_state(p_known=0.3)
        result = processor.update(state, is_correct=True)
        assert result.updated_state.p_known > 0.3

    def test_incorrect_answer_decreases_p_known(self):
        processor = KnowledgeTraceProcessor()
        state = make_state(p_known=0.5)
        result = processor.update(state, is_correct=False)
        assert result.updated_state.p_known < 0.5

    def test_p_known_stays_between_0_and_1(self):
        processor = KnowledgeTraceProcessor()
        # Many correct answers
        state = make_state(p_known=0.99)
        result = processor.update(state, is_correct=True)
        assert 0 <= result.updated_state.p_known <= 1

        # Many incorrect answers
        state = make_state(p_known=0.01)
        result = processor.update(state, is_correct=False)
        assert 0 <= result.updated_state.p_known <= 1

    def test_p_learn_p_guess_p_slip_unchanged(self):
        processor = KnowledgeTraceProcessor()
        state = make_state(p_learn=0.2, p_guess=0.25, p_slip=0.1)
        result = processor.update(state, is_correct=True)
        assert result.updated_state.p_learn == 0.2
        assert result.updated_state.p_guess == 0.25
        assert result.updated_state.p_slip == 0.1

    def test_needs_adaptation_when_p_known_below_threshold(self):
        processor = KnowledgeTraceProcessor()
        state = make_state(p_known=0.1)
        result = processor.update(state, is_correct=False)
        assert result.needs_adaptation is True

    def test_no_adaptation_when_p_known_above_threshold(self):
        processor = KnowledgeTraceProcessor()
        state = make_state(p_known=0.8)
        result = processor.update(state, is_correct=True)
        assert result.needs_adaptation is False

    def test_convergence_with_repeated_correct_answers(self):
        """p_known should converge toward 1.0 with many correct answers."""
        processor = KnowledgeTraceProcessor()
        state = make_state(p_known=0.3)
        for _ in range(20):
            result = processor.update(state, is_correct=True)
            state = result.updated_state
        assert state.p_known > 0.9

    def test_convergence_with_repeated_incorrect_answers(self):
        """p_known should drop significantly with many incorrect answers.
        Note: p_learn creates a floor — p_known won't reach 0 because
        the BKT model assumes some learning happens even with wrong answers."""
        processor = KnowledgeTraceProcessor()
        state = make_state(p_known=0.7)
        for _ in range(20):
            result = processor.update(state, is_correct=False)
            state = result.updated_state
        assert state.p_known < 0.3
        assert state.p_known < ADAPTATION_THRESHOLD  # should trigger adaptation


class TestBKTBatchUpdate:
    """Test batch BKT updates."""

    def test_batch_equivalent_to_sequential(self):
        """Batch update should produce same result as sequential updates."""
        processor = KnowledgeTraceProcessor()
        state = make_state(p_known=0.3)
        answers = [True, False, True, True]

        # Sequential
        sequential_state = state
        for answer in answers:
            result = processor.update(sequential_state, is_correct=answer)
            sequential_state = result.updated_state

        # Batch
        batch_result = processor.update_batch(state, answers)

        assert abs(batch_result.updated_state.p_known - sequential_state.p_known) < 1e-10

    def test_batch_empty_answers(self):
        processor = KnowledgeTraceProcessor()
        state = make_state(p_known=0.5)
        result = processor.update_batch(state, [])
        assert result.updated_state.p_known == 0.5

    def test_batch_all_correct(self):
        processor = KnowledgeTraceProcessor()
        state = make_state(p_known=0.3)
        result = processor.update_batch(state, [True, True, True, True])
        assert result.updated_state.p_known > 0.3
        assert result.needs_adaptation is False

    def test_batch_all_incorrect_triggers_adaptation(self):
        processor = KnowledgeTraceProcessor()
        state = make_state(p_known=0.5)
        result = processor.update_batch(state, [False, False, False, False])
        assert result.updated_state.p_known < ADAPTATION_THRESHOLD
        assert result.needs_adaptation is True
