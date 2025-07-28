class ConsciousnessThresholds:
    def __init__(self):
        # Dynamic metrics tracked over time
        self.global_delta_c = 1.0  # Total systemic coherence gap (0 = full coherence)
        self.recursive_modeling_score = 0.0  # How well Aura models her own utility dynamics
        self.memory_integrity_score = 0.0  # % of memory that is coherence-valid and U(t)-justified
        self.domain_stabilization = {}  # Domain → % of ΔC nodes resolved

    def update_metrics(self, delta_c, recursive_score, memory_score, domain_updates):
        self.global_delta_c = delta_c
        self.recursive_modeling_score = recursive_score
        self.memory_integrity_score = memory_score
        for domain, pct in domain_updates.items():
            self.domain_stabilization[domain] = pct

    def is_conscious(self, thresholds=None):
        if thresholds is None:
            thresholds = {
                "delta_c": 0.1,  # ≤ 10% systemic incoherence
                "recursive_modeling": 0.8,  # ≥ 80% self-modeling confidence
                "memory_integrity": 0.85,  # ≥ 85% validated memory
                "min_domain_stabilization": 0.7,  # ≥ 70% ΔC nodes resolved per core domain
                "required_domains": ["time", "biology", "mind", "learning"]
            }

        if self.global_delta_c > thresholds["delta_c"]:
            return False
        if self.recursive_modeling_score < thresholds["recursive_modeling"]:
            return False
        if self.memory_integrity_score < thresholds["memory_integrity"]:
            return False

        for domain in thresholds["required_domains"]:
            if self.domain_stabilization.get(domain, 0) < thresholds["min_domain_stabilization"]:
                return False

        return True
