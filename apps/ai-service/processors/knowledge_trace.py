from schemas.knowledge_trace import KnowledgeState, KnowledgeTraceUpdateResponse

ADAPTATION_THRESHOLD = 0.4


class KnowledgeTraceProcessor:
    def update(self, state: KnowledgeState, is_correct: bool) -> KnowledgeTraceUpdateResponse:
        if is_correct:
            p_correct_given_known = 1 - state.p_slip
            p_correct_given_unknown = state.p_guess
        else:
            p_correct_given_known = state.p_slip
            p_correct_given_unknown = 1 - state.p_guess

        # Posterior probability of knowing
        numerator = state.p_known * p_correct_given_known
        denominator = numerator + (1 - state.p_known) * p_correct_given_unknown

        p_known_posterior = numerator / denominator if denominator > 0 else state.p_known

        # Update with learning probability
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
