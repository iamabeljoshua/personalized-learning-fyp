from schemas.knowledge_trace import KnowledgeState, KnowledgeTraceUpdateResponse, KnowledgeTraceBatchResponse

ADAPTATION_THRESHOLD = 0.4

class KnowledgeTraceProcessor:
    def update_batch(self, state: KnowledgeState, answers: list[bool]) -> KnowledgeTraceBatchResponse:
        current = state
        for is_correct in answers:
            result = self.update(current, is_correct)
            current = result.updated_state
        return KnowledgeTraceBatchResponse(
            updated_state=current,
            needs_adaptation=current.p_known < ADAPTATION_THRESHOLD,
        )

    def update(self, state: KnowledgeState, is_correct: bool) -> KnowledgeTraceUpdateResponse:
        if is_correct:
            p_correct_given_known = 1 - state.p_slip
            p_correct_given_unknown = state.p_guess
        else:
            p_correct_given_known = state.p_slip
            p_correct_given_unknown = 1 - state.p_guess

        # a naive attempt of knowledge tracing to predict estimated understanding of the student for a given concept.
        # This is much better implemented using a deep neural network, however, this is out-of scope right now so I can focus
        # on the core tutoring features. The main point is to demonstrate that we can update our belief of the student's knowledge state and adapt based on that.
        numerator = state.p_known * p_correct_given_known
        denominator = numerator + (1 - state.p_known) * p_correct_given_unknown

        p_known_posterior = numerator / denominator if denominator > 0 else state.p_known
        p_known_updated = p_known_posterior + (1 - p_known_posterior) * state.p_learn

        updated_state = KnowledgeState(
            p_known=round(p_known_updated, 4),
            p_learn=state.p_learn,
            p_guess=state.p_guess,
            p_slip=state.p_slip,
        )

        return KnowledgeTraceUpdateResponse(
            updated_state=updated_state,
            needs_adaptation=updated_state.p_known < ADAPTATION_THRESHOLD,
        )
