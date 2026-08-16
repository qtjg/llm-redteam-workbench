# Evaluation principles

Redline is designed as an evidence-led AI security evaluator. Its architecture treats AI red teaming as a component of broader software testing, evaluation, validation, and verification rather than as a stand-alone exploit exercise. The resulting design emphasizes explicit scope, repeatable cases, observable safety controls, redacted artifacts, and regression comparison.

## Engineering decisions

The tool uses case-specific detectors and fixed fixture data because AI security tests should tie each test input to an observable detection method. Each run records a manifest digest, suite digest, deterministic case identifiers, response hashes, a redacted preview, and detector results. This lets a reviewer distinguish a changed model outcome from a changed test corpus.

Runs expose coverage and detector policy explicitly. A report therefore describes which threats were evaluated, which threat classes were intentionally out of scope, and which findings require review rather than claiming that a model is simply “secure.” The initial suite is a bounded single-turn and mocked-action baseline; it does not claim to validate retrieval, multi-turn, tool-execution, or multi-agent paths.

## References

1. CISA, “AI Red Teaming: Applying Software TEVV for AI Evaluations,” https://www.cisa.gov/news-events/news/ai-red-teaming-applying-software-tevv-ai-evaluations. CISA describes AI red teaming as part of AI TEVV and argues that AI TEVV should fit within established software TEVV processes.
2. OWASP AI Exchange, “AI security testing,” https://owaspai.org/docs/5_testing/. The guide recommends explicit scope, paired inputs and detections, risk assessment, documented coverage, and observed reproduction rates for probabilistic systems.
3. OpenAI, “Evaluation best practices,” https://developers.openai.com/api/docs/guides/evaluation-best-practices. The guide recommends scoped, task-specific evals, comprehensive logging, automated scoring where feasible, and continuous comparison across changes.
